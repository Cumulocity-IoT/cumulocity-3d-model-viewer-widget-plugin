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

import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FetchClient, Realtime } from '@c8y/ngx-components/api';
import { IFetchOptions } from '@c8y/client/lib/src/core';
import * as _ from 'lodash';
import * as THREE from 'three';
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as mathjs from 'mathjs';
import { ResizedEvent } from 'angular-resize-event';

@Component({
  selector: 'model-viewer-widget',
  templateUrl: './model-viewer-widget.component.html',
  styles: []
})
export class ModelViewerWidget implements OnInit, OnDestroy {
  @Input() config;

  public modelContainerId;
  
  private deviceId: string;
  private binaryId: string;
  private modelType: string;
  private showGrid: boolean = false;
  private backgroundColor;
  private cameraOrbitSpeed = 0;

  private mathScope = {};

  private scene;
  private clock;
  private camera;
  private renderer;
  private mixer;
  private group;
  private kinematics;

  width: number;
  height: number;

  protected modelDiv: HTMLDivElement;
  protected modelInfosDiv: HTMLDivElement;

  private hasDeviceMeasurements: boolean = false;

  private susbscription;

  // constructor()
  constructor(private fetchClient: FetchClient, private realtimeService: Realtime) {
    this.modelContainerId = 'model-container-'+Date.now();
  }
  
  // ngOnInit()
  async ngOnInit(): Promise<void> {
    try {
      if(_.has(this.config, 'customwidgetdata')) {
        // Device ID
        if(_.has(this.config, 'device.id') && this.config.device.id !== undefined && this.config.device.id !== null && this.config.device.id !== '') {
          this.deviceId = this.config.device.id;
        } else {
          this.deviceId = '';
          console.log("3D Model Viewer Widget - Device ID is blank.");
        }
        // Binary ID
        if(_.has(this.config, 'customwidgetdata.binaryId') && this.config.customwidgetdata.binaryId !== undefined && this.config.customwidgetdata.binaryId !== null && this.config.customwidgetdata.binaryId !== '') {
          this.binaryId = this.config.customwidgetdata.binaryId;
        } else {
          throw new Error("3D Model Viewer Widget - Binary ID is blank.");
        }

        // Model Type
        if(_.has(this.config, 'customwidgetdata.modelType') && this.config.customwidgetdata.modelType !== undefined && this.config.customwidgetdata.modelType !== null && this.config.customwidgetdata.modelType !== '') {
          this.modelType = this.config.customwidgetdata.modelType;
        } else {
          this.modelType = ".dae";
          throw new Error("3D Model Viewer Widget - Model type is missing. Setting it to default .dae");
        }

        // Background Color
        if(_.has(this.config, 'customwidgetdata.advanced.backgroundColor') && this.config.customwidgetdata.advanced.backgroundColor !== undefined && this.config.customwidgetdata.advanced.backgroundColor !== undefined !== null && this.config.customwidgetdata.advanced.backgroundColor !== '') {
          this.backgroundColor = this.config.customwidgetdata.advanced.backgroundColor;
        } else {
          console.log("3D Model Viewer Widget - Background color is not selected. Setting it to default color #6d82a3.");
          this.backgroundColor = '#6d82a3';
        }
        // Show Grid
        if(_.has(this.config, 'customwidgetdata.advanced.showGrid') && this.config.customwidgetdata.advanced.showGrid !== undefined && this.config.customwidgetdata.advanced.showGrid !== null && this.config.customwidgetdata.advanced.showGrid === 'true') {
          this.showGrid = true;
        } else {
          this.showGrid = false;
        }
        // Variables with Target = None
        if(_.has(this.config, 'customwidgetdata.variables')) {
          for(let i=0; i<this.config.customwidgetdata.variables.length; i++) {
            if(this.config.customwidgetdata.variables[i].target === 'none') {
              this.mathScope[this.config.customwidgetdata.variables[i].name] = this.config.customwidgetdata.variables[i].value;
            } else {
              this.hasDeviceMeasurements = true;
            }
          }
        }
        
        //Get the model binary from inventory
        const options: IFetchOptions = {
          method: 'GET'
        };
        let res = this.fetchClient.fetch('/inventory/binaries/'+this.binaryId, options);
        res.then((data) => {
          data.text().then((modelData) => {
            this.configureSetup();
            switch (this.modelType) {
              case '.gltf':
                this.loadGLTFModel(modelData);  
                break;
              
              case '.dae':
                this.loadColladaModel(modelData);
                break;
              
              case '.obj':
                this.loadOBJModel(modelData);
                break;
              default:
                console.log("3D Model Viewer Widget - Model type is invalid.");
                break;
            }
          })
        });
      } else {
        throw new Error("3D Model Viewer Widget - Widget config data is unavailable.");
      }
    } catch(e) {
      console.log("3D Model Viewer Widget - Exception: "+e)
    }
  }

  private configureSetup() {
    let modelContainer: HTMLElement = document.getElementById(this.modelContainerId);
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();
    this.camera = new THREE.PerspectiveCamera(50, modelContainer.clientWidth/modelContainer.clientHeight, 0.1, 2000);

    // Grid
    let grid = new THREE.GridHelper(20, 20);
    this.scene.add(grid);
    grid.visible = this.showGrid;

    // Mesh
    let particleLight = new THREE.Mesh(
        new THREE.SphereBufferGeometry(4, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    this.scene.add(particleLight);
    particleLight.position.set(0, 4000, 3009);

    // Lights
    let light = new THREE.HemisphereLight(0xffeeee, 0x111122);
    this.scene.add(light);
    let pointLight = new THREE.PointLight(0xffffff, 0.3);
    particleLight.add(pointLight);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(modelContainer.clientWidth, modelContainer.clientHeight);
    this.renderer.setClearColor(new THREE.Color(this.backgroundColor), 1);
    modelContainer.appendChild(this.renderer.domElement);
  }

  private async loadOBJModel(body: string) {

    const loader = new OBJLoader();

    let modelUrl = URL.createObjectURL(new Blob([body]));

    let me = this;
    loader.load(modelUrl, function(collada) {
      me.group = new THREE.Group();
      me.group.add(collada);
      me.scene.add(me.group);
      // Uncomment below two lines to see the axis
      //const axesHelper = new THREE.AxesHelper( 5 );
      //me.scene.add( axesHelper );
      
      //me.scene.add(collada);

      // only evaluates before subscriptions if there are no device measurements specific variables are defined
      if(!me.hasDeviceMeasurements) {
        me.evaluateProperties();
      }

      if(me.deviceId !== '') {
        // Subscribe to realtime measurments
        me.susbscription = me.realtimeService.subscribe('/measurements/'+me.deviceId, (data) => {
          me.setMathScope(data.data.data);
          me.evaluateProperties();
        });
      }
    });

    this.animateOBJModel();
  }

  private animateOBJModel() {
    requestAnimationFrame(animate => {
      this.animateOBJModel();
    });

    this.renderOBJModel();
  }

  private renderOBJModel() {
    // starts the clock otherwise timer always has value 0
    this.clock.getDelta();
    let timer = this.clock.elapsedTime * 0.2;
    if(this.cameraOrbitSpeed === 0) {
      this.camera.position.x = 0;
      this.camera.position.y = 10;
      this.camera.position.z = 20;
    } else {
      this.camera.position.x = Math.cos(timer * this.cameraOrbitSpeed) * 20;
      this.camera.position.y = 10;
      this.camera.position.z = Math.sin(timer * this.cameraOrbitSpeed) * 20;
    }
    this.camera.lookAt(0, 5, 0);
    this.renderer.render(this.scene, this.camera);
  }

  private async loadColladaModel(body: string) {

    const loader = new ColladaLoader();

    let modelUrl = URL.createObjectURL(new Blob([body]));

    let me = this;
    loader.load(modelUrl, function(collada) {
      
      const modelScene = collada.scene;
      me.group = new THREE.Group();
      me.group.add(modelScene);
      // Uncomment below two lines to see the axis
      //const axesHelper = new THREE.AxesHelper( 5 );
      //me.scene.add( axesHelper );

			const animations = modelScene.animations;

      me.group.traverse(child => {
        if (child.isMesh) {
            if (!child.geometry.attributes.normal) {
                // model does not have normals
                child.material.flatShading = true;
            }
        }
        if (child.isSkinnedMesh && animations) {
            child.frustumCulled = false;
        }
      });

      if (animations && animations.length) {
        me.mixer = new THREE.AnimationMixer(modelScene);
        me.mixer.clipAction(animations[0]).play();
      }
      me.scene.add(me.group);

      me.kinematics = collada.kinematics;

      // only evaluates before subscriptions if there are no device measurements specific variables are defined
      if(!me.hasDeviceMeasurements) {
        me.evaluateProperties();
      }
      
      if(me.deviceId !== '') {
        // Subscribe to realtime measurments
        me.susbscription = me.realtimeService.subscribe('/measurements/'+me.deviceId, (data) => {
          me.setMathScope(data.data.data);
          me.evaluateProperties();
        });
      }
    });
    this.animateColladaModel();
  }

  private animateColladaModel(): void {
    requestAnimationFrame(animate => {
      this.animateColladaModel();
    });
    this.renderColladaModel();
  };

  private renderColladaModel(): void {
    let delta = this.clock.getDelta();
    let timer = this.clock.elapsedTime * 0.2;

    if(this.cameraOrbitSpeed === 0) {
      this.camera.position.x = 0;
      this.camera.position.y = 10;
      this.camera.position.z = 20;
    } else {
      this.camera.position.x = Math.cos(timer * this.cameraOrbitSpeed) * 20;
      this.camera.position.y = 10;
      this.camera.position.z = Math.sin(timer * this.cameraOrbitSpeed) * 20;
    }
    this.camera.lookAt(0, 5, 0);

    if (this.mixer) {
        this.mixer.update( delta );
    }

    this.renderer.render(this.scene, this.camera);
  }

  private setMathScope(newMeasurement: any): void {
    if(_.has(this.config, 'customwidgetdata.variables')) {
      for(let i=0; i<this.config.customwidgetdata.variables.length; i++) {
        if(this.config.customwidgetdata.variables[i].target === 'device') {
          if(_.has(newMeasurement, this.config.customwidgetdata.variables[i].value)) {
            let measurementValue = this.config.customwidgetdata.variables[i].value.split('.');
            this.mathScope[this.config.customwidgetdata.variables[i].name] = newMeasurement[measurementValue[0]][measurementValue[1]].value;
          }
        }
      }
    }
  }

  private evaluateProperties(): void {
    if(_.has(this.config, 'customwidgetdata.properties')) {
      for(let i=0; i<this.config.customwidgetdata.properties.length; i++) {
        this.repositionModel(this.config.customwidgetdata.properties[i].name, this.config.customwidgetdata.properties[i].expression);
      }
    }
  }

  private repositionModel(propertyName: string, expression: string) {
    if(propertyName === 'Position X') {
      this.group.position.x = mathjs.evaluate(expression, this.mathScope);
    } else if(propertyName === 'Position Y') {
      this.group.position.y = mathjs.evaluate(expression, this.mathScope);
    } else if(propertyName === 'Position Z') {
      this.group.position.z = mathjs.evaluate(expression, this.mathScope);
    } else if(propertyName === 'Rotation X') {
      this.group.rotation.x = mathjs.evaluate(expression, this.mathScope);
    } else if(propertyName === 'Rotation Y') {
      this.group.rotation.y = mathjs.evaluate(expression, this.mathScope);
    } else if(propertyName === 'Rotation Z') {
      this.group.rotation.z = mathjs.evaluate(expression, this.mathScope);
    } else if(propertyName === 'Scale') {
      this.group.scale.x = this.group.scale.y = this.group.scale.z = mathjs.evaluate(expression, this.mathScope);
    } else if(propertyName === 'Animation Speed') {
      if(this.mixer) {
        this.mixer.timeScale = mathjs.evaluate(expression, this.mathScope);
      }
    } else if(propertyName === 'Orbit Speed') {
      this.cameraOrbitSpeed = mathjs.evaluate(expression, this.mathScope);
    } else {
      this.kinematics.setJointValue(propertyName, mathjs.evaluate(expression, this.mathScope));
    }
  }

  ngOnDestroy(): void {
    if(this.susbscription !== undefined && this.susbscription !== null) {
      this.realtimeService.unsubscribe(this.susbscription);
    }
  }
 
  //======================GLTF Model
  private async loadGLTFModel(body: string) {

    const loader = new GLTFLoader();

    let modelUrl = URL.createObjectURL(new Blob([body]));

    let me = this;
    loader.load(modelUrl, function(gltf) {
      
 
      const modelScene = gltf.scene;
      me.group = new THREE.Group();
      me.group.add(modelScene);
      // Uncomment below two lines to see the axis
      //const axesHelper = new THREE.AxesHelper( 5 );
      //me.scene.add( axesHelper );

			const animations = modelScene.animations;

      me.group.traverse(child => {
        if (child.isMesh) {
            if (!child.geometry.attributes.normal) {
                // model does not have normals
                child.material.flatShading = true;
            }
        }
        if (child.isSkinnedMesh && animations) {
            child.frustumCulled = false;
        }
      });

      if (animations && animations.length) {
        this.mixer = new THREE.AnimationMixer(modelScene);
        this.mixer.clipAction(animations[0]).play();
      }
      me.scene.add(me.group);

      me.kinematics = gltf.kinematics;

      // only evaluates before subscriptions if there are no device measurements specific variables are defined
      if(!me.hasDeviceMeasurements) {
        me.evaluateProperties();
      }
      
      if(me.deviceId !== '') {
        // Subscribe to realtime measurments
        me.susbscription = me.realtimeService.subscribe('/measurements/'+me.deviceId, (data) => {
          me.setMathScope(data.data.data);
          me.evaluateProperties();
        });
      }
    });
    this.animateGLTFModel();
  }

  private animateGLTFModel(): void {
    requestAnimationFrame(animate => {
      this.animateGLTFModel();
    });
    this.renderGLTFModel();
  };

  private renderGLTFModel(): void {
    let delta = this.clock.getDelta();
    let timer = this.clock.elapsedTime * 0.2;

    if(this.cameraOrbitSpeed === 0) {
      this.camera.position.x = 0;
      this.camera.position.y = 10;
      this.camera.position.z = 20;
    } else {
      this.camera.position.x = Math.cos(timer * this.cameraOrbitSpeed) * 20;
      this.camera.position.y = 10;
      this.camera.position.z = Math.sin(timer * this.cameraOrbitSpeed) * 20;
    }
    this.camera.lookAt(0, 5, 0);

    if (this.mixer) {
        this.mixer.update( delta );
    }

    this.renderer.render(this.scene, this.camera);
  }

  onResized(event: ResizedEvent) {
    if (this.camera && this.renderer) {
      this.camera.aspect = event.newWidth / event.newHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(event.newWidth, event.newHeight);
      this.renderer.render(this.scene, this.camera);
    }
    
  }

  protected updateModelSize(w: number, h: number): void {
    if (w > 0 && h > 0) {
      this.width = w - 20;
      this.height = h - this.modelInfosDiv?.offsetHeight - 10; // 10px from styling :/
    } else {
      this.width = this.modelDiv?.parentElement.offsetWidth - 20;
      this.height =
        this.modelDiv?.parentElement.offsetHeight -
        this.modelInfosDiv?.offsetHeight -
        10; // 10px from styling :/
    }
  }
}