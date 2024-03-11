
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

papaya.viewer.Tools.prototype.GetToolOnMouseDown = function (button, viewer, me) {
    if (viewer.container.params.imageTools) {
        switch (button) {

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
                this.GetSurfaceDisplayOnCanvas(viewer, me);

                break;
            case 'panImages':
                viewer.isPanning = true;
                viewer.container.preferences.showCrosshairs = "No"
                viewer.previousMousePosition.x = papaya.utilities.PlatformUtils.getMousePositionX(me);
                viewer.previousMousePosition.y = papaya.utilities.PlatformUtils.getMousePositionY(me);
                this.setStartPanLocationToUpdate(viewer, viewer.convertScreenToImageCoordinateX(viewer.previousMousePosition.x, viewer.mainImage), viewer.convertScreenToImageCoordinateY(viewer.previousMousePosition.y, viewer.mainImage), viewer.mainImage.sliceDirection);
                this.GetSurfaceDisplayOnCanvas(viewer, me);

                break;
            case 'zoomImages':
                viewer.isZoomMode = true;
                viewer.container.preferences.showCrosshairs = "No";
                viewer.previousMousePosition.x = papaya.utilities.PlatformUtils.getMousePositionX(me);
                viewer.previousMousePosition.y = papaya.utilities.PlatformUtils.getMousePositionY(me);
                this.GetSurfaceDisplayOnCanvas(viewer, me);

                break;
            case 'windowLevelImages':
                viewer.isWindowControl = true;
                viewer.previousMousePosition.x = papaya.utilities.PlatformUtils.getMousePositionX(me);
                viewer.previousMousePosition.y = papaya.utilities.PlatformUtils.getMousePositionY(me);
                viewer.container.preferences.showCrosshairs = "No";
                this.GetSurfaceDisplayOnCanvas(viewer, me);

                break;
            case 'drawCrossHairImages':
                viewer.isCrosshairMode = true;
                viewer.previousMousePosition.x = papaya.utilities.PlatformUtils.getMousePositionX(me);
                viewer.previousMousePosition.y = papaya.utilities.PlatformUtils.getMousePositionY(me);
                viewer.container.preferences.showCrosshairs = "Yes";
                viewer.findClickedSlice(viewer, viewer.previousMousePosition.x, viewer.previousMousePosition.y);
                this.GetSurfaceDisplayOnCanvas(viewer, me);

                break;
            case 'magnifyImages':
                this.MagnifyToolEvent(viewer,me);
                break;
        }
    } else {
        viewer.isCrosshairMode = true;
        viewer.previousMousePosition.x = papaya.utilities.PlatformUtils.getMousePositionX(me);
        viewer.previousMousePosition.y = papaya.utilities.PlatformUtils.getMousePositionY(me);
        viewer.container.preferences.showCrosshairs = "Yes";
        viewer.findClickedSlice(viewer, viewer.previousMousePosition.x, viewer.previousMousePosition.y);
        this.GetSurfaceDisplayOnCanvas(viewer, me);
    }
};

papaya.viewer.Tools.prototype.setStartPanLocationToUpdate = function (viewer, xLoc, yLoc, sliceDirection) {
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

papaya.viewer.Tools.prototype.GetSurfaceDisplayOnCanvas = function (viewer, me) {


    if (viewer.selectedSlice && (viewer.selectedSlice !== viewer.surfaceView)) {
        viewer.grabbedHandle = viewer.selectedSlice.findProximalRulerHandle(viewer.convertScreenToImageCoordinateX(viewer.previousMousePosition.x - viewer.canvasRect.left, viewer.selectedSlice),
            viewer.convertScreenToImageCoordinateY(viewer.previousMousePosition.y - viewer.canvasRect.top, viewer.selectedSlice));

        if (viewer.grabbedHandle === null) {
            viewer.updatePosition(viewer, papaya.utilities.PlatformUtils.getMousePositionX(me), papaya.utilities.PlatformUtils.getMousePositionY(me), false);
            viewer.resetUpdateTimer(me);
        }
    } else if (viewer.selectedSlice && (viewer.selectedSlice === viewer.surfaceView)) {
        if (viewer.container.hasSurface()) {
            if (viewer.surfaceView.findProximalRulerHandle(viewer.previousMousePosition.x - viewer.canvasRect.left,
                viewer.previousMousePosition.y - viewer.canvasRect.top)) {

            } else {
                viewer.isPanning = viewer.isShiftKeyDown;
                viewer.surfaceView.setStartDynamic(viewer.previousMousePosition.x, viewer.previousMousePosition.y);
            }
        }

        viewer.container.display.drawEmptyDisplay();
    }
};

papaya.viewer.Tools.prototype.GetCurrentCursorPosition = function (me, viewer) {
    var position = {
        posX: 0,
        posY: 0
    };

    if (me.pageX || me.pageY) {
        position.posX = me.pageX;
        position.posY = me.pageY;
    }
    else if (me.clientX) {
        position.posX = me.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        position.posY = me.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    } else {
        position.posX = me.targetTouches[0].pageX;
        position.posX = me.targetTouches[0].pageY;
    }
    position.posX -= viewer.canvas.offsetLeft;
    position.posY -= viewer.canvas.offsetTop;
    return { position };
};

papaya.viewer.Tools.prototype.MagnifyToolEvent = function (viewer, me) {
    viewer.previousMousePosition.x = papaya.utilities.PlatformUtils.getMousePositionX(me);
    viewer.previousMousePosition.y = papaya.utilities.PlatformUtils.getMousePositionY(me);
    viewer.isMagnifyMode = true;
    viewer.container.preferences.showCrosshairs = "No";

    if (viewer.magnifyCanvas == null) {
        viewer.createMagnifyCanvas();
    }
    viewer.context.clearRect(0, 0, viewer.canvas.width, viewer.canvas.height);
    viewer.drawViewer(false, true);
    viewer.magnifyCanvasContext = viewer.magnifyCanvas.getContext("2d");
    viewer.magnifyCanvasContext.setTransform(1, 0, 0, 1, 0, 0);
    viewer.magnifyCanvasContext.clearRect(0, 0, 120, 120);
    viewer.magnifyCanvasContext.fillStyle = 'transparent';
    // Fill it with the pixels that the mouse is clicking on
    viewer.magnifyCanvasContext.fillRect(0, 0, 120, 120);
    var initialPosotionCopied = this.GetCurrentCursorPosition(me, viewer);
    initialPosotionCopied.position.posX = initialPosotionCopied.position.posX - 37;
    initialPosotionCopied.position.posY = initialPosotionCopied.position.posY - 37;
    initialPosotionCopied.position.posX = Math.min(initialPosotionCopied.position.posX, viewer.canvas.width);
    initialPosotionCopied.position.posY = Math.min(initialPosotionCopied.position.posY, viewer.canvas.height);
    // var Cord1 = that.convertScreenToImageCoordinate(copyFrom.x, copyFrom.y, that.mainImage);
    var scaledMagnify = {
        x: (viewer.canvas.width - initialPosotionCopied.position.posX) * 2,
        y: (viewer.canvas.height - initialPosotionCopied.position.posY) * 2
    };
    viewer.magnifyCanvasContext.drawImage(viewer.canvas, initialPosotionCopied.position.posX, initialPosotionCopied.position.posY, viewer.canvas.width - initialPosotionCopied.position.posX, viewer.canvas.height - initialPosotionCopied.position.posY, 0, 0, scaledMagnify.x, scaledMagnify.y);

    viewer.findClickedSlice(viewer, viewer.previousMousePosition.x, viewer.previousMousePosition.y);
    if (viewer.selectedSlice == null) {
        return;
    } else {
        viewer.magnifyCanvas.style.top = papaya.utilities.PlatformUtils.getMousePositionY(me) - (viewer.magnifyCanvas.height / 2) + "px";
        viewer.magnifyCanvas.style.left = papaya.utilities.PlatformUtils.getMousePositionX(me) - (viewer.magnifyCanvas.width / 2) + 'px';
        viewer.magnifyCanvas.style.zIndex = 100;
        viewer.magnifyCanvas.style.display = 'block';
        if (viewer.selectedSlice == viewer.axialSlice) {
            viewer.magnifyCanvas.style.border = "1px solid red";
        } else if (viewer.selectedSlice == viewer.coronalSlice) {
            viewer.magnifyCanvas.style.border = "1px solid green";
        } else if (viewer.selectedSlice == viewer.surfaceView) {
            viewer.magnifyCanvas.style.border = "1px solid yellow";
        } else {
            viewer.magnifyCanvas.style.border = "1px solid blue";
        }
    }
}