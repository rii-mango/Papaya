
/*jslint browser: true, node: true */
/*global */

// ITECH
// use this to store viewer helper functions

"use strict";

/*** Imports ***/
var papaya = papaya || {};
papaya.utilities = papaya.utilities || {};
papaya.utilities.ViewerUtils = papaya.utilities.ViewerUtils || {};
papaya.viewer = papaya.viewer || {};

// functions

papaya.utilities.ViewerUtils.convertImageToScreenCoordinate = function (slice, imageCoord) {
    // imageCoord is papaya.Core.Coordinate object
    // console.log('convertImageToScreenCoordinate', slice.sliceDirection, imageCoord);
    var screenX;
    var screenY;
    var imageX;
    var imageY;
    switch (slice.sliceDirection) {
        case papaya.viewer.ScreenSlice.DIRECTION_AXIAL:
            imageX = imageCoord.x;
            imageY = imageCoord.y;
            break;
        case papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL:
            imageX = imageCoord.y;
            imageY = imageCoord.z;
            break;
        case papaya.viewer.ScreenSlice.DIRECTION_CORONAL:
            imageX = imageCoord.x;
            imageY = imageCoord.z;
            break;
        default:
            return;
    }
    screenX = slice.finalTransform[0][2] + (imageX + 0.5) * slice.finalTransform[0][0];
    screenY = slice.finalTransform[1][2] + (imageY + 0.5) * slice.finalTransform[1][1];
    return [screenX, screenY];
}

papaya.utilities.ViewerUtils.convertScreenToImageCoordinate = function (slice, screenCoord, roundResult) {
    // screenCoord: array of 2 elements
    // screenCoord[0]: x, screenCoord[1]: y
    var xImage, yImage, zImage;
    switch (slice.sliceDirection) {
        case papaya.viewer.ScreenSlice.DIRECTION_AXIAL:
            xImage = (screenCoord[0] - slice.finalTransform[0][2]) / slice.finalTransform[0][0];
            yImage = (screenCoord[1] - slice.finalTransform[1][2]) / slice.finalTransform[1][1];
            zImage = slice.currentSlice;
            break;
        case papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL:
            yImage = (screenCoord[0] - slice.finalTransform[0][2]) / slice.finalTransform[0][0];
            zImage = (screenCoord[1] - slice.finalTransform[1][2]) / slice.finalTransform[1][1];
            xImage = slice.currentSlice;
            break;
        case papaya.viewer.ScreenSlice.DIRECTION_CORONAL:
            xImage = (screenCoord[0] - slice.finalTransform[0][2]) / slice.finalTransform[0][0];
            zImage = (screenCoord[1] - slice.finalTransform[1][2]) / slice.finalTransform[1][1];
            yImage = slice.currentSlice;
            break;
    }
    if (roundResult) return new papaya.core.Coordinate(Math.round(xImage), Math.round(yImage), Math.round(zImage));
    else return new papaya.core.Coordinate(xImage, yImage, zImage);
}

//TODO: move this to viewer-utils
papaya.utilities.ViewerUtils.getOtherViews = function (currentSlice, screenLayout) {
    var thisDirection = currentSlice.sliceDirection;
    return screenLayout.filter(function (slice) {
        return (slice.sliceDirection !== thisDirection && 
            slice.sliceDirection !== papaya.viewer.ScreenSlice.DIRECTION_CURVED && 
            slice.sliceDirection !== papaya.viewer.ScreenSlice.DIRECTION_TEMPORAL && 
            slice.sliceDirection !== papaya.viewer.ScreenSlice.DIRECTION_SURFACE)
    });
}