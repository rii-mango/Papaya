
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

// Constants
papaya.utilities.ViewerUtils.EPSILON = 0.0001;
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
    screenX = slice.finalTransform[0][2] + (imageX + 0.5) * (slice.finalTransform[0][0] * slice.scaleFactor);
    screenY = slice.finalTransform[1][2] + (imageY + 0.5) * (slice.finalTransform[1][1] * slice.scaleFactor);
    return [screenX, screenY];
}

papaya.utilities.ViewerUtils.convertScreenToImageCoordinate = function (slice, screenCoord, roundResult) {
    // screenCoord: array of 2 elements
    // screenCoord[0]: x, screenCoord[1]: y
    var xImage, yImage, zImage;
    switch (slice.sliceDirection) {
        case papaya.viewer.ScreenSlice.DIRECTION_AXIAL:
            xImage = (screenCoord[0] - slice.finalTransform[0][2]) / (slice.finalTransform[0][0] * slice.scaleFactor);
            yImage = (screenCoord[1] - slice.finalTransform[1][2]) / (slice.finalTransform[1][1] * slice.scaleFactor);
            zImage = slice.currentSlice;
            break;
        case papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL:
            yImage = (screenCoord[0] - slice.finalTransform[0][2]) / (slice.finalTransform[0][0] * slice.scaleFactor);
            zImage = (screenCoord[1] - slice.finalTransform[1][2]) / (slice.finalTransform[1][1] * slice.scaleFactor);
            xImage = slice.currentSlice;
            break;
        case papaya.viewer.ScreenSlice.DIRECTION_CORONAL:
            xImage = (screenCoord[0] - slice.finalTransform[0][2]) / (slice.finalTransform[0][0] * slice.scaleFactor);
            zImage = (screenCoord[1] - slice.finalTransform[1][2]) / (slice.finalTransform[1][1] * slice.scaleFactor);
            yImage = slice.currentSlice;
            break;
    }
    if (roundResult) return new papaya.core.Coordinate(Math.floor(xImage), Math.floor(yImage), Math.floor(zImage));
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
// Compute true zPos along Plane normals from Image Position Patient (0020,0032) and Image Orientation Patient (0020,0037)
papaya.utilities.ViewerUtils.getZPosAlongPlaneDirection = function (imagePos, imageOrient) {
    // console.log('getZPosAlongPlaneDirection', imagePos, imageOrient);
    // image positions, normally this is the top-left coordinate of the image
    var xPos = imagePos[0];
    var yPos = imagePos[1];
    var zPos = imagePos[2];
    // normal vectors along X, Y, Z of the image
    /*
    "C.7.6.2.1.1 Image Position And Image Orientation. The Image Position (0020,0032) specifies the x, y,
     and z coordinates of the upper left hand corner of the image; it is the center of the first voxel transmitted.
     Image Orientation (0020,0037) specifies the direction cosines of the first row and the first column with respect to the patient.
     These Attributes shall be provide as a pair. Row value for the x, y, and z axes respectively followed by the Column value for the x,
     y, and z axes respectively. The direction of the axes is defined fully by the patient's orientation. The x-axis is increasing to the
     left hand side of the patient. The y-axis is increasing to the posterior side of the patient.
     The z-axis is increasing toward the head of the patient. The patient based coordinate system is a right handed system,%
     i.e. the vector cross product of a unit vector along the positive x-axis and a unit vector along the positive y-axis is equal to a unit vector%
     along the positive z-axis."
     
     dst_nrm_dircos_x = dircos(2) * dircos(6) - dircos(3) * dircos(5);
     dst_nrm_dircos_y = dircos(3) * dircos(4) - dircos(1) * dircos(6);
     dst_nrm_dircos_z = dircos(1) * dircos(5) - dircos(2) * dircos(4);
     
     newx = dircos(1) * xpos + dircos(2)* ypos + dircos(3) * zpos;
     newy = dircos(4)* xpos + dircos(5)* ypos + dircos(6) * zpos;
     newz = dst_nrm_dircos_x * xpos + dst_nrm_dircos_y * ypos+ dst_nrm_dircos_z * zpos;
     */
    var dst_normal_IOP_x = imageOrient[2-1] * imageOrient[6-1] - imageOrient[3-1] * imageOrient[5-1];
    var dst_normal_IOP_y = imageOrient[3-1] * imageOrient[4-1] - imageOrient[1-1] * imageOrient[6-1];
    var dst_normal_IOP_z = imageOrient[1-1] * imageOrient[5-1] - imageOrient[2-1] * imageOrient[4-1];

    var newZ = dst_normal_IOP_x * xPos + dst_normal_IOP_y * yPos + dst_normal_IOP_z * zPos;
    return newZ;
}

papaya.utilities.ViewerUtils.get3DSpacing = function (volume) {
    return {
        x: volume.getXSize(),
        y: volume.getYSize(),
        z: volume.getZSize(),
    }
}

papaya.utilities.ViewerUtils.debounce = function (func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};