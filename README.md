#  Deprecation notice
This plugin is not further developed and it might break with upcoming Cumulocity releases. Use it at your own risk.
The repository is archived but feel free to fork & adapt it to your needs in a new repo.

# 3D Model Viewer Widget for Cumulocity [<img width="35" src="https://user-images.githubusercontent.com/32765455/211497905-561e9197-18b9-43d5-a023-071d3635f4eb.png"/>](https://github.com/Cumulocity-IoT/cumulocity-3d-model-viewer-widget-plugin/releases/download/1.0.2/sag-ps-pkg-c8y-3d-model-viewer-widget-1.0.2.zip)

This 3D Model Viewer widget is the Cumulocity module federation plugin created using c8ycli. This plugin can be used in Application Builder or Cockpit.
The 3D Model Viewer widget help you to view a 3D collada model (*.dae, *.obj, *.gltf) in Cumulocity IoT.


![Image](assets/img-preview.png)

### Please choose 3D Model Viewer release based on Cumulocity/Application builder version:

| APPLICATION BUILDER&nbsp;  |&nbsp;  CUMULOCITY &nbsp;  |&nbsp;  3D Model VIEWER WIDGET &nbsp; |
|---------------------|-------------|------------------------|
| 2.x.x  | >= 1016.x.x | 1.x.x                  | 


## Prerequisite
   Cumulocity c8ycli >=1016.x.x
   
### Features
* Supports measurements from a single device
* Allows background color customization.
* Allows to configure realtime device measurement for model movements.
* Allows to upload custom collada(.dae, .obj, .gltf) model file.


### Runtime Widget Deployment?

* This widget support runtime deployment. Download [Runtime Binary](https://github.com/Cumulocity-IoT/cumulocity-3d-model-viewer-widget-plugin/releases/download/1.0.2/sag-ps-pkg-c8y-3d-model-viewer-widget-1.0.2.zip) and install via Administrations --> Ecosystems --> Applications --> Packages.


## QuickStart
This guide will teach you how to add widget in your existing or new dashboard.

1. Open you application from App Switcher

2. Add new dashboard or navigate to existing dashboard

3. Click `Add Widget`

4. Search for `3D Model Viewer`

5. Select `Target Assets or Devices`

7. Click `Save`

Congratulations! 3D Model Viewer is configured.

### Configuration - to view the 3d collada model in the widget
1. Make sure you have successfully installed or deployed the widget.
2. Click on `Add widget`.
3. Choose `3d model viewer` widget.
4. `Title` is the title of widget. Provide a relevant name. You may choose to hide this. Go to `Appearance` tab and choose `Hidden` under `Widget header style`.
5. Select the `device`.
6. `Model file(*.dae, *.obj, *.gltf)` is to upload the model file (*.dae, *.obj, *.gltf) into inventory binary. Please wait for it to finish the upload.
7. `Variables` is to declare variables with a constant value or map them to the realtime device measurement series. Choose Target as None and provide the constant value or choose Target as Device and then select a measurment series.
8. `Properties` is to define values for the model properties. You can provide a value as an mathematical expression using the variables defined earlier.
9. `Background color (in hex)` allows you to set a custom background color using the color picker.
10. `Show grid` allows you to show or hide the grid.
11. Click `Save` to add the widget on the dashboard.
12. In case you see unexpected results on the widget, refer to browser console to see if there are error logs.


------------------------------

This widget is provided as-is and without warranty or support. They do not constitute part of the Cumulocity product suite. Users are free to use, fork and modify them, subject to the license agreement. While Cumulocity GmbH welcomes contributions, we cannot guarantee to include every contribution in the master project.
_____________________
For more information you can Ask a Question in the [Tech Community Forums](https://techcommunity.cumulocity.com.
