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

import { NgModule } from '@angular/core';
import { CoreModule, HOOK_COMPONENTS } from '@c8y/ngx-components';
import { ModelViewerWidget } from './model-viewer-widget.component';
import { ModelViewerWidgetConfig } from './model-viewer-widget-config.component';
import { AngularResizedEventModule } from 'angular-resize-event';
import { ColorPickerComponent } from './color-picker/color-picker-component';
import { ColorSliderComponent } from './color-picker/color-slider/color-slider-component';
import { ColorPaletteComponent } from './color-picker/color-palette/color-palette-component';

@NgModule({
  imports: [
    CoreModule,
    AngularResizedEventModule
  ],
  declarations: [ModelViewerWidget, ModelViewerWidgetConfig, ColorPickerComponent, ColorSliderComponent, ColorPaletteComponent],
  entryComponents: [ModelViewerWidget, ModelViewerWidgetConfig],
  providers: [{
    provide: HOOK_COMPONENTS,
    multi: true,
    useValue: {
      id: 'com.softwareag.globalpresales.3dmodelviewerwidget',
      label: '3d model viewer',
      description: 'A runtime widget to view a 3d collada model (*.dae) in Cumulocity IoT. It has been developed by Global Presales team.',
      component: ModelViewerWidget,
      configComponent: ModelViewerWidgetConfig,
      previewImage: require("../assets/img-preview.png"),
      data: {
        ng1: {
            options: {
            noDeviceTarget: false,
            noNewWidgets: false,
            deviceTargetNotRequired: false,
            groupsSelectable: true
            }
        }
    }
    }
  }],
})
export class ModelViewerWidgetAppModule {}
