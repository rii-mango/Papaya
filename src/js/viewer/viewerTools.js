
/*jslint browser: true, node: true */
/*global $, PAPAYA_VIEWER_CSS, PAPAYA_DEFAULT_TOOLBAR_ID, PAPAYA_DEFAULT_VIEWER_ID, PAPAYA_DEFAULT_DISPLAY_ID,
 PAPAYA_TOOLBAR_CSS, PAPAYA_DISPLAY_CSS, PAPAYA_DEFAULT_SLIDER_ID, PAPAYA_DEFAULT_CONTAINER_ID, PAPAYA_SLIDER_CSS,
 PAPAYA_UTILS_UNSUPPORTED_CSS, PAPAYA_UTILS_UNSUPPORTED_MESSAGE_CSS, PAPAYA_CONTAINER_CLASS_NAME,
 PAPAYA_CONTAINER_FULLSCREEN, PAPAYA_CONTAINER_CLASS_NAME, PAPAYA_UTILS_CHECKFORJS_CSS, PAPAYA_SPACING,
 papayaRoundFast, PAPAYA_PADDING, PAPAYA_CONTAINER_PADDING_TOP, PAPAYA_CONTAINER_COLLAPSABLE_EXEMPT,
 PAPAYA_CONTAINER_COLLAPSABLE, PAPAYA_MANGO_INSTALLED, PAPAYA_KIOSK_CONTROLS_CSS, PAPAYA_CONTROL_INCREMENT_BUTTON_CSS,
 PAPAYA_CONTROL_SLIDER_CSS, PAPAYA_CONTROL_GOTO_CENTER_BUTTON_CSS, PAPAYA_CONTROL_GOTO_ORIGIN_BUTTON_CSS,
 PAPAYA_CONTROL_SWAP_BUTTON_CSS, PAPAYA_CONTROL_DIRECTION_SLIDER, PAPAYA_CONTROL_MAIN_SLIDER,
 PAPAYA_CONTROL_MAIN_INCREMENT_BUTTON_CSS, PAPAYA_CONTROL_MAIN_INCREMENT_BUTTON_CSS,
 PAPAYA_CONTROL_MAIN_DECREMENT_BUTTON_CSS, PAPAYA_CONTROL_MAIN_SWAP_BUTTON_CSS, PAPAYA_CONTROL_BAR_LABELS_CSS,
 PAPAYA_CONTROL_MAIN_GOTO_CENTER_BUTTON_CSS, PAPAYA_CONTROL_MAIN_GOTO_ORIGIN_BUTTON_CSS
 */

"use strict";

/*** Imports ***/
var papaya = papaya || {};
/*** Imports ***/
"use strict";

var papaya = papaya || {};
papaya.viewer = papaya.viewer || {};

papaya.viewer.Tools = papaya.viewer.Tools || function () {
   

}

papaya.viewer.Tools.prototype.GetToolOnMouseDown = function(button,viewer,me){    

    switch(button){

         case 'stackImages':
            if (me.offsetY != undefined) {
                viewer.lastY = me.offsetY;
            } else {
                var rect = me.target.getBoundingClientRect();
                var x = me.targetTouches[0].pageX - rect.left;
                var y = me.targetTouches[0].pageY - rect.top;
                viewer.lastY = y;
            }
            viewer.isStackMode = true;
            viewer.container.preferences.showCrosshairs = "No"

            break;
        case 'panImages':            
            viewer.isPanning = true;
            viewer.container.preferences.showCrosshairs = "No"
            viewer.previousMousePosition.x = papaya.utilities.PlatformUtils.getMousePositionX(me);
            viewer.previousMousePosition.y = papaya.utilities.PlatformUtils.getMousePositionY(me);
            this.setStartPanLocationToUpdate(viewer,viewer.convertScreenToImageCoordinateX(viewer.previousMousePosition.x, viewer.mainImage), viewer.convertScreenToImageCoordinateY(viewer.previousMousePosition.y, viewer.mainImage), viewer.mainImage.sliceDirection);
            break;

        case 'zoomImages':
            viewer.isZoomMode = true;
            viewer.container.preferences.showCrosshairs = "No";
            viewer.previousMousePosition.x = papaya.utilities.PlatformUtils.getMousePositionX(me);
            viewer.previousMousePosition.y = papaya.utilities.PlatformUtils.getMousePositionY(me);           
            break;
        case 'windowLevelImages':
            viewer.isWindowControl = true;
            viewer.previousMousePosition.x = papaya.utilities.PlatformUtils.getMousePositionX(me);
            viewer.previousMousePosition.y = papaya.utilities.PlatformUtils.getMousePositionY(me);           
            viewer.container.preferences.showCrosshairs = "No";
            break;
       case  'drawCrossHairImages':
             viewer.isCrosshairMode = true;
            viewer.previousMousePosition.x = papaya.utilities.PlatformUtils.getMousePositionX(me);
            viewer.previousMousePosition.y = papaya.utilities.PlatformUtils.getMousePositionY(me);
            viewer.container.preferences.showCrosshairs = "Yes";
            viewer.findClickedSlice(viewer, viewer.previousMousePosition.x, viewer.previousMousePosition.y);


            if (viewer.selectedSlice && (viewer.selectedSlice !== viewer.surfaceView)) {
                viewer.grabbedHandle = viewer.selectedSlice.findProximalRulerHandle(viewer.convertScreenToImageCoordinateX(viewer.previousMousePosition.x - viewer.canvasRect.left, viewer.selectedSlice),
                    viewer.convertScreenToImageCoordinateY(viewer.previousMousePosition.y - viewer.canvasRect.top, viewer.selectedSlice));

                if (viewer.grabbedHandle === null) {
                    viewer.updatePosition(viewer, papaya.utilities.PlatformUtils.getMousePositionX(me), papaya.utilities.PlatformUtils.getMousePositionY(me), false);
                    viewer.resetUpdateTimer(me);
                }
            } else if (viewer.selectedSlice && (viewer.selectedSlice === viewer.surfaceView)) {
                if (viewer.surfaceView.findProximalRulerHandle(viewer.previousMousePosition.x - viewer.canvasRect.left,
                    viewer.previousMousePosition.y - viewer.canvasRect.top)) {

                } else {
                    viewer.isPanning = viewer.isShiftKeyDown;
                    viewer.surfaceView.setStartDynamic(viewer.previousMousePosition.x, viewer.previousMousePosition.y);
                }

                viewer.container.display.drawEmptyDisplay();
            }
           break;
    }

};

papaya.viewer.Tools.prototype.setStartPanLocationToUpdate = function (viewer,xLoc, yLoc, sliceDirection) {
    var temp;

    if (sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
        viewer.panLocX = xLoc;
        viewer.panLocY = yLoc;
        viewer.panLocZ = viewer.axialSlice.currentSlice;
    } else if (sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
        viewer.panLocX = xLoc;
        viewer.panLocY = viewer.coronalSlice.currentSlice;
        viewer.panLocZ = yLoc;
    } else if (sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
        viewer.panLocX = viewer.sagittalSlice.currentSlice;
        temp = xLoc;  // because of dumb IDE warning
        viewer.panLocY = temp;
        viewer.panLocZ = yLoc;

    }
};