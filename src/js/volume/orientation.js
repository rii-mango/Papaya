
/*jslint browser: true, node: true */
/*global papayaRoundFast */

"use strict";

/*** Imports ***/
var papaya = papaya || {};
papaya.volume = papaya.volume || {};


/*** Constructor ***/
papaya.volume.Orientation = papaya.volume.Orientation || function (str) {
    this.orientation = str;
    this.orientMat = null;
    this.xIncrement = -1;
    this.yIncrement = -1;
    this.zIncrement = -1;
};


/*** Static Pseudo-constants ***/

papaya.volume.Orientation.DEFAULT = "XYZ+--";


/*** Static Methods ***/

papaya.volume.Orientation.isValidOrientationString = function (orientationStr) {
    var temp, valid = true;

    if (orientationStr === null || (orientationStr.length !== 6)) {
        valid = false;
    }

    temp = orientationStr.toUpperCase().indexOf("X");
    if (temp === -1 || temp > 2 || (orientationStr.toUpperCase().lastIndexOf("X") !== temp)) {
        valid = false;
    }

    temp = orientationStr.toUpperCase().indexOf("Y");
    if (temp === -1 || temp > 2 || (orientationStr.toUpperCase().lastIndexOf("Y") !== temp)) {
        valid = false;
    }

    temp = orientationStr.toUpperCase().indexOf("Z");
    if (temp === -1 || temp > 2 || (orientationStr.toUpperCase().lastIndexOf("Z") !== temp)) {
        valid = false;
    }

    if ((orientationStr.charAt(3) !== '+') && (orientationStr.charAt(3) !== '-')) {
        valid = false;
    }

    if ((orientationStr.charAt(4) !== '+') && (orientationStr.charAt(4) !== '-')) {
        valid = false;
    }

    if ((orientationStr.charAt(5) !== '+') && (orientationStr.charAt(5) !== '-')) {
        valid = false;
    }

    return valid;
};


/*** Prototype Methods ***/

papaya.volume.Orientation.prototype.convertIndexToOffset2 = function (xLoc, yLoc, zLoc) {
    return (xLoc * this.xIncrement) + (yLoc * this.yIncrement) + (zLoc * this.zIncrement);
};



papaya.volume.Orientation.prototype.convertCoordinate = function (coord, coordConverted) {
    coordConverted.x = papayaRoundFast((coord.x * this.orientMat[0][0]) + (coord.y * this.orientMat[0][1]) +
        (coord.z * this.orientMat[0][2]) + (this.orientMat[0][3]));
    coordConverted.y = papayaRoundFast((coord.x * this.orientMat[1][0]) + (coord.y * this.orientMat[1][1]) +
        (coord.z * this.orientMat[1][2]) + (this.orientMat[1][3]));
    coordConverted.z = papayaRoundFast((coord.x * this.orientMat[2][0]) + (coord.y * this.orientMat[2][1]) +
        (coord.z * this.orientMat[2][2]) + (this.orientMat[2][3]));
    return coordConverted;
};



papaya.volume.Orientation.prototype.createInfo = function (imageDimensions, voxelDimensions) {
    var xMultiply, yMultiply, zMultiply, xSubtract, ySubtract, zSubtract, colOrientation, rowOrientation,
        sliceOrientation, numCols, numRows, numSlices, numVoxelsInSlice, colSize, rowSize, sliceSize;

    numCols = imageDimensions.cols;
    numRows = imageDimensions.rows;
    numSlices = imageDimensions.slices;
    numVoxelsInSlice = imageDimensions.getNumVoxelsSlice();

    colSize = voxelDimensions.colSize;
    rowSize = voxelDimensions.rowSize;
    sliceSize = voxelDimensions.sliceSize;

    colOrientation = (this.orientation.charAt(3) === '+');
    rowOrientation = (this.orientation.charAt(4) === '+');
    sliceOrientation = (this.orientation.charAt(5) === '+');

    if (this.orientation.toUpperCase().indexOf("XYZ") !== -1) {
        imageDimensions.xDim = numCols;
        imageDimensions.yDim = numRows;
        imageDimensions.zDim = numSlices;
        voxelDimensions.xSize = colSize;
        voxelDimensions.ySize = rowSize;
        voxelDimensions.zSize = sliceSize;

        this.xIncrement = 1;
        this.yIncrement = numCols;
        this.zIncrement = numVoxelsInSlice;

        if (colOrientation) {
            xMultiply = 1;
            xSubtract = 0;
        } else {
            xMultiply = -1;
            xSubtract = numCols - 1;
        }

        if (rowOrientation) {
            yMultiply = -1;
            ySubtract = numRows - 1;
        } else {
            yMultiply = 1;
            ySubtract = 0;
        }

        if (sliceOrientation) {
            zMultiply = -1;
            zSubtract = numSlices - 1;
        } else {
            zMultiply = 1;
            zSubtract = 0;
        }
    } else if (this.orientation.toUpperCase().indexOf("XZY") !== -1) {
        imageDimensions.xDim = numCols;
        imageDimensions.yDim = numSlices;
        imageDimensions.zDim = numRows;
        voxelDimensions.xSize = colSize;
        voxelDimensions.ySize = sliceSize;
        voxelDimensions.zSize = rowSize;

        this.xIncrement = 1;
        this.yIncrement = numVoxelsInSlice;
        this.zIncrement = numCols;

        if (colOrientation) {

            xMultiply = 1;
            xSubtract = 0;
        } else {
            xMultiply = -1;
            xSubtract = numCols - 1;
        }

        if (rowOrientation) {

            zMultiply = -1;
            zSubtract = numRows - 1;
        } else {
            zMultiply = 1;
            zSubtract = 0;
        }

        if (sliceOrientation) {
            yMultiply = -1;
            ySubtract = numSlices - 1;
        } else {
            yMultiply = 1;
            ySubtract = 0;
        }
    } else if (this.orientation.toUpperCase().indexOf("YXZ") !== -1) {
        imageDimensions.xDim = numRows;
        imageDimensions.yDim = numCols;
        imageDimensions.zDim = numSlices;
        voxelDimensions.xSize = rowSize;
        voxelDimensions.ySize = colSize;
        voxelDimensions.zSize = sliceSize;

        this.xIncrement = numCols;
        this.yIncrement = 1;
        this.zIncrement = numVoxelsInSlice;

        if (colOrientation) {
            yMultiply = -1;
            ySubtract = numCols - 1;
        } else {
            yMultiply = 1;
            ySubtract = 0;
        }

        if (rowOrientation) {
            xMultiply = 1;
            xSubtract = 0;
        } else {
            xMultiply = -1;
            xSubtract = numRows - 1;
        }

        if (sliceOrientation) {
            zMultiply = -1;
            zSubtract = numSlices - 1;
        } else {
            zMultiply = 1;
            zSubtract = 0;
        }
    } else if (this.orientation.toUpperCase().indexOf("YZX") !== -1) {
        imageDimensions.xDim = numSlices;
        imageDimensions.yDim = numCols;
        imageDimensions.zDim = numRows;
        voxelDimensions.xSize = sliceSize;
        voxelDimensions.ySize = colSize;
        voxelDimensions.zSize = rowSize;

        this.xIncrement = numVoxelsInSlice;
        this.yIncrement = 1;
        this.zIncrement = numCols;

        if (colOrientation) {
            yMultiply = -1;
            ySubtract = numCols - 1;
        } else {
            yMultiply = 1;
            ySubtract = 0;
        }

        if (rowOrientation) {
            zMultiply = -1;
            zSubtract = numRows - 1;
        } else {
            zMultiply = 1;
            zSubtract = 0;
        }

        if (sliceOrientation) {
            xMultiply = 1;
            xSubtract = 0;
        } else {
            xMultiply = -1;
            xSubtract = numSlices - 1;
        }
    } else if (this.orientation.toUpperCase().indexOf("ZXY") !== -1) {
        imageDimensions.xDim = numRows;
        imageDimensions.yDim = numSlices;
        imageDimensions.zDim = numCols;
        voxelDimensions.xSize = rowSize;
        voxelDimensions.ySize = sliceSize;
        voxelDimensions.zSize = colSize;

        this.xIncrement = numCols;
        this.yIncrement = numVoxelsInSlice;
        this.zIncrement = 1;

        if (colOrientation) {
            zMultiply = -1;
            zSubtract = numCols - 1;
        } else {
            zMultiply = 1;
            zSubtract = 0;
        }

        if (rowOrientation) {
            xMultiply = 1;
            xSubtract = 0;
        } else {
            xMultiply = -1;
            xSubtract = numRows - 1;
        }

        if (sliceOrientation) {
            yMultiply = -1;
            ySubtract = numSlices - 1;
        } else {
            yMultiply = 1;
            ySubtract = 0;
        }
    } else if (this.orientation.toUpperCase().indexOf("ZYX") !== -1) {
        imageDimensions.xDim = numSlices;
        imageDimensions.yDim = numRows;
        imageDimensions.zDim = numCols;
        voxelDimensions.xSize = sliceSize;
        voxelDimensions.ySize = rowSize;
        voxelDimensions.zSize = colSize;

        this.xIncrement = numVoxelsInSlice;
        this.yIncrement = numCols;
        this.zIncrement = 1;

        if (colOrientation) {
            zMultiply = -1;
            zSubtract = numCols - 1;
        } else {
            zMultiply = 1;
            zSubtract = 0;
        }

        if (rowOrientation) {
            yMultiply = -1;
            ySubtract = numRows - 1;
        } else {
            yMultiply = 1;
            ySubtract = 0;
        }

        if (sliceOrientation) {
            xMultiply = 1;
            xSubtract = 0;
        } else {
            xMultiply = -1;
            xSubtract = numSlices - 1;
        }
    }

    this.orientMat = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];

    this.orientMat[0][0] = xMultiply;
    this.orientMat[0][1] = 0;
    this.orientMat[0][2] = 0;
    this.orientMat[0][3] = xSubtract;

    this.orientMat[1][0] = 0;
    this.orientMat[1][1] = yMultiply;
    this.orientMat[1][2] = 0;
    this.orientMat[1][3] = ySubtract;

    this.orientMat[2][0] = 0;
    this.orientMat[2][1] = 0;
    this.orientMat[2][2] = zMultiply;
    this.orientMat[2][3] = zSubtract;

    this.orientMat[3][0] = 0;
    this.orientMat[3][1] = 0;
    this.orientMat[3][2] = 0;
    this.orientMat[3][3] = 1;
};



papaya.volume.Orientation.prototype.isValid = function () {
    return papaya.volume.Orientation.isValidOrientationString(this.orientation);
};



papaya.volume.Orientation.prototype.getOrientationDescription = function () {
    var ornt = this.orientation;
    return ("Cols (" + ornt.charAt(0) + ornt.charAt(3) + "), Rows (" + ornt.charAt(1) + ornt.charAt(4) + "), Slices (" +
        ornt.charAt(2) + ornt.charAt(5) + ")");
};
