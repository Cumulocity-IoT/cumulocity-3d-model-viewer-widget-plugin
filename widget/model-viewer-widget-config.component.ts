/*
* Copyright (c) 2020 Software AG, Darmstadt, Germany and/or its licensors
*
* SPDX-License-Identifier: Apache-2.0
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
 */

import { Component, Input, OnInit } from '@angular/core';
import { IResult, IFetchOptions } from '@c8y/client/lib/src/core';
import { IManagedObjectBinary } from '@c8y/client/lib/src/inventory';
import { FetchClient, InventoryBinaryService } from '@c8y/ngx-components/api';
import * as _ from 'lodash';
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader.js';

@Component({
  selector: 'model-viewer-widget-config',
  templateUrl: './model-viewer-widget-config.component.html',
  styleUrls: ['./model-viewer-widget-config.component.css']
})
export class ModelViewerWidgetConfig implements OnInit {
  @Input() config: any = {};

  backgroundColorPickerClosed : boolean = true;

  modelFile: File = null;
  modelFileUploadMessage: string;
  public measurementSeries = [];
  public variableTargets = [
    {
      id: 'none',
      name: 'None'
    },
    {
      id: 'device',
      name: 'Device'
    }
  ];

  widgetInfo = {
    binaryId: '',
    binaryName: '',
    modelType: '',
    advanced: {
      backgroundColor: '#6d82a3',
      showGrid: 'true'
    },
    variables: [
      {
        name: 'size',
        target: 'none',
        value: '1'
      }
    ],
    properties: [
      {
        name: 'Scale',
        expression: 'size'
      }
    ]
  }

  public modelProperties = [
    {
      type: 'Position',
      values: [
        {
          name: 'Position X',
          defaultValue: 0
        },
        {
          name: 'Position Y',
          defaultValue: 0
        },
        {
          name: 'Position Z',
          defaultValue: 0
        }
      ]
    },
    {
      type: 'Rotation',
      values: [
        {
          name: 'Rotation X',
          defaultValue: 0,
          min: -Math.PI,
          max: -Math.PI
        },
        {
          name: 'Rotation Y',
          defaultValue: 0,
          min: -Math.PI,
          max: -Math.PI
        },
        {
          name: 'Rotation Z',
          defaultValue: 0,
          min: -Math.PI,
          max: -Math.PI
        }
      ]
    },
    {
      type: 'Scale',
      values: [
        {
          name: 'Scale',
          defaultValue: 1,
          min: 0
        }
      ]
    },
    {
      type: 'Animation',
      values:[
        {
          name: 'Animation Speed',
          defaultValue: 1
        }
      ]
    },
    {
      type: 'Camera',
      values: [
        {
          name: 'Orbit Speed',
          defaultValue: 1
        }
      ]
    }
  ];
    
  constructor(private inventoryBinaryService: InventoryBinaryService, private fetchClient: FetchClient) {}

  async ngOnInit() {
    try {
      // Editing an existing widget
      if(_.has(this.config, 'customwidgetdata')) {
        this.widgetInfo = _.get(this.config, 'customwidgetdata');
        if(_.has(this.config, 'device.id') && this.config.device.id !== undefined && this.config.device.id !== null && this.config.device.id !== '') {
          this.loadMeasurementSeries();
        } else {
          console.log("3D Model Viewer Widget - Device is not selected. Select a device.");
        }
        if(_.has(this.widgetInfo, 'binaryId') && this.widgetInfo.binaryId !== undefined && this.widgetInfo.binaryId !== null && this.widgetInfo.binaryId !== '') {
          this.loadInfoFromModel();
        } else {
          console.log("3D Model Viewer Widget - Binary ID is blank. Upload model file.");
        }
      } else { // Adding a new widget
        _.set(this.config, 'customwidgetdata', this.widgetInfo);
      }
    } catch(e) {
      console.log("3D Model Viewer Widget - Exception: "+e);
    }
    
  }

  public uploadModelFile(files: FileList) {
    if(files === undefined || files === null || files.length < 1) {
      console.log("3D Model Viewer Widget - No file selected.");
    } else {
      this.modelFileUploadMessage = 'Uploading...';
      this.modelFile = files.item(0);
      let modelBinaryResponse: Promise<IResult<IManagedObjectBinary>> = this.inventoryBinaryService.create(this.modelFile);
      modelBinaryResponse.then((data) => {
        if(data.res.status === 201) {
          this.widgetInfo.binaryId = data.data.id;
          this.widgetInfo.binaryName = this.modelFile.name;
          this.widgetInfo.modelType = this.widgetInfo.binaryName.substring(this.widgetInfo.binaryName.lastIndexOf(".")).toLowerCase();
          this.modelFileUploadMessage = 'Upload success!';
          this.updateConfig();
          this.loadInfoFromModel();
        } else {
          this.modelFileUploadMessage = 'Upload failed!';
          console.log("3D Model Viewer Widget - Model cannot be uploaded: "+data.res.status);
        }
      });
    }
  }

  public loadMeasurementSeries() {
    if(!_.has(this.config, 'device.id') || this.config.device.id === undefined || this.config.device.id === "") {
      console.log("3D Model Viewer Widget - Device is not selected.");
    } else {
      this.measurementSeries = [];
      const options: IFetchOptions = {
        method: 'GET'
      };
      let supportedSeriesResponse = this.fetchClient.fetch('/inventory/managedObjects/'+this.config.device.id+'/supportedSeries', options);
      let me = this;
      supportedSeriesResponse.then((data) => {
        data.json().then((res: any) => {
          res.c8y_SupportedSeries.forEach((ss) => {
            me.measurementSeries.push(ss);
          });
        });
      });
    }
  }

  private loadInfoFromModel() {
    if(this.widgetInfo.modelType === ".dae") {
      const options: IFetchOptions = {
        method: 'GET'
      };
      let res = this.fetchClient.fetch('/inventory/binaries/'+this.widgetInfo.binaryId, options);
      res.then((data) => {
        data.text().then((modelData) => {
          const loader = new ColladaLoader();
          let modelUrl = URL.createObjectURL(new Blob([modelData]));
          const me = this;
          loader.load(modelUrl, function(collada) {
            if(collada.kinematics && collada.kinematics.joints) {
              const keys = Object.keys(collada.kinematics.joints);
              let kinematics = {
                type: 'Kinematics',
                values: []
              }
              keys.forEach(k => {
                const joint = collada.kinematics.joints[k];
                if(!joint.static) {
                  kinematics.values.push({
                    name: k,
                    min: joint.limits.min,
                    max: joint.limits.max,
                    defaultValue: joint.zeroPosition
                  });
                }
              })
              me.modelProperties.push(kinematics);
            }
          });
        })
      });
    }
  }

  public addVariable(): void {
    this.widgetInfo.variables.push(
      {
        name: 'x',
        target: 'none',
        value: ''
      }
    );
    this.updateConfig();
  }

  public deleteVariable(index: number): void {
    this.widgetInfo.variables.splice(index, 1);
    this.updateConfig();
  }

  public addProperty(): void {
    this.widgetInfo.properties.push(
      {
        name: 'Scale',
        expression: 'size'
      }
    );
    this.updateConfig();
  }

  public removeProperty(index: number): void {
    this.widgetInfo.properties.splice(index, 1);
    this.updateConfig();
  }

  public updateConfig() {
    _.set(this.config, 'customwidgetdata', this.widgetInfo);
  }

  setSelectedColorForBackground(value: string) {
    value = value.substring(0,7);
    this.widgetInfo.advanced.backgroundColor = value;
    this.updateConfig();
  }

  closeBackgroundColorPicker() {
    this.backgroundColorPickerClosed = true;
  }

  openBackgroundColorPicker() {
    this.backgroundColorPickerClosed = false;
  }

}