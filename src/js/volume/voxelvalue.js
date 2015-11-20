
/*jslint browser: true, node: true */
/*global papayaRoundFast */

"use strict";

/*** Imports ***/
var papaya = papaya || {};
papaya.volume = papaya.volume || {};


/*** Constructor ***/
papaya.volume.VoxelValue = papaya.volume.VoxelValue || function (imageData, imageType, imageDimensions, imageRange,
                                                                 orientation) {
    this.imageData = imageData;
    this.imageType = imageType;
    this.imageRange = imageRange;
    this.orientation = orientation;
    this.swap16 = ((this.imageType.numBytes === 2) && this.imageType.swapped) &&
        (this.imageType.datatype !== papaya.volume.ImageType.DATATYPE_FLOAT);
    this.swap32 = ((this.imageType.numBytes === 4) && this.imageType.swapped) &&
        (this.imageType.datatype !== papaya.volume.ImageType.DATATYPE_FLOAT);
    this.xIncrement = orientation.xIncrement;
    this.yIncrement = orientation.yIncrement;
    this.zIncrement = orientation.zIncrement;
    this.xDim = imageDimensions.xDim;
    this.yDim = imageDimensions.yDim;
    this.zDim = imageDimensions.zDim;
    this.sliceSize = imageDimensions.getNumVoxelsSlice();
    this.volSize = imageDimensions.getNumVoxelsVolume();
    this.dataScaleSlopes = imageRange.dataScaleSlopes;
    this.dataScaleIntercepts = imageRange.dataScaleIntercepts;
    this.globalDataScaleSlope = imageRange.globalDataScaleSlope;
    this.globalDataScaleIntercept = imageRange.globalDataScaleIntercept;
    this.usesGlobalDataScale = imageRange.usesGlobalDataScale;
    this.interpFirstPass = [[0, 0], [0, 0]];
    this.interpSecondPass = [0, 0];
    this.forceABS = false;
};


/*** Prototype Methods ***/

papaya.volume.VoxelValue.prototype.getVoxelAtIndexNative = function (ctrX, ctrY, ctrZ, timepoint, useNN) {
    if (useNN) {
        ctrX = papayaRoundFast(ctrX);
        ctrY = papayaRoundFast(ctrY);
        ctrZ = papayaRoundFast(ctrZ);

        return this.getVoxelAtOffset(this.orientation.convertIndexToOffsetNative(ctrX, ctrY, ctrZ), timepoint, ctrX, ctrY, ctrZ);
    }

    return this.getVoxelAtIndexLinear(ctrX, ctrY, ctrZ, timepoint);
};



papaya.volume.VoxelValue.prototype.getVoxelAtIndex = function (ctrX, ctrY, ctrZ, timepoint, useNN) {
    if (useNN) {
        ctrX = papayaRoundFast(ctrX);
        ctrY = papayaRoundFast(ctrY);
        ctrZ = papayaRoundFast(ctrZ);

        return this.getVoxelAtOffset(this.orientation.convertIndexToOffset(ctrX, ctrY, ctrZ), timepoint, ctrX, ctrY, ctrZ);
    }

    return this.getVoxelAtIndexLinear(ctrX, ctrY, ctrZ, timepoint);
};



papaya.volume.VoxelValue.prototype.getVoxelAtOffset = function (volOffset, timepoint, xLoc, yLoc, zLoc) {
    var dataScaleIndex,
        offset = volOffset + (this.volSize * timepoint), value;

    if ((xLoc < 0) || (xLoc >= this.xDim) || (yLoc < 0) || (yLoc >= this.yDim) || (zLoc < 0) || (zLoc >= this.zDim)) {
        return 0;
    }

    if (this.usesGlobalDataScale) {
        value = (this.checkSwap(this.imageData.data[offset]) * this.globalDataScaleSlope) +
            this.globalDataScaleIntercept;
    } else {
        dataScaleIndex = parseInt(offset / this.sliceSize);
        value = (this.checkSwap(this.imageData.data[offset]) * this.dataScaleSlopes[dataScaleIndex]) +
            this.dataScaleIntercepts[dataScaleIndex];
    }

    if (this.forceABS) {
        return Math.abs(value);
    } else {
        return value;
    }
};



papaya.volume.VoxelValue.prototype.getVoxelAtIndexLinear = function (xLoc, yLoc, zLoc, timepoint) {
    var value, fracX, fracY, fracZ, tempVal1, tempVal2, offset, xInt, yInt, zInt, interpolateX, interpolateY,
        interpolateZ, ctrX, ctrY;
    value = tempVal1 = tempVal2 = 0;

    xInt = Math.floor(xLoc);
    yInt = Math.floor(yLoc);
    zInt = Math.floor(zLoc);

    fracX = xLoc - xInt;
    fracY = yLoc - yInt;
    fracZ = zLoc - zInt;

    interpolateX = (fracX !== 0);
    interpolateY = (fracY !== 0);
    interpolateZ = (fracZ !== 0);

    if (interpolateX && interpolateY && interpolateZ) {
        for (ctrX = 0; ctrX < 2; ctrX +=  1) {
            for (ctrY = 0; ctrY < 2; ctrY += 1) {
                offset = this.orientation.convertIndexToOffsetNative(xInt + ctrX, yInt + ctrY, zInt);
                tempVal1 = this.getVoxelAtOffset(offset, timepoint, xInt + ctrX, yInt + ctrY, zInt) * (1 - fracZ);
                offset = this.orientation.convertIndexToOffsetNative(xInt + ctrX, yInt + ctrY, zInt + 1);
                tempVal2 = this.getVoxelAtOffset(offset, timepoint, xInt + ctrX, yInt + ctrY, zInt + 1) * fracZ;
                this.interpFirstPass[ctrX][ctrY] = tempVal1 + tempVal2;
            }
        }

        this.interpSecondPass[0] = (this.interpFirstPass[0][0] * (1 - fracY)) + (this.interpFirstPass[0][1] * fracY);
        this.interpSecondPass[1] = (this.interpFirstPass[1][0] * (1 - fracY)) + (this.interpFirstPass[1][1] * fracY);

        value = (this.interpSecondPass[0] * (1 - fracX)) + (this.interpSecondPass[1] * fracX);
    } else if (interpolateX && interpolateY && !interpolateZ) {
        for (ctrX = 0; ctrX < 2; ctrX += 1) {
            offset = this.orientation.convertIndexToOffsetNative(xInt + ctrX, yInt, zInt);
            tempVal1 = this.getVoxelAtOffset(offset, timepoint, xInt + ctrX, yInt, zInt) * (1 - fracY);
            offset = this.orientation.convertIndexToOffsetNative(xInt + ctrX, yInt + 1, zInt);
            tempVal2 = this.getVoxelAtOffset(offset, timepoint, xInt + ctrX, yInt + 1, zInt) * fracY;
            this.interpSecondPass[ctrX] = tempVal1 + tempVal2;
        }

        value = (this.interpSecondPass[0] * (1 - fracX)) + (this.interpSecondPass[1] * fracX);
    } else if (interpolateX && !interpolateY && interpolateZ) {
        for (ctrX = 0; ctrX < 2; ctrX += 1) {
            offset = this.orientation.convertIndexToOffsetNative(xInt + ctrX, yInt, zInt);
            tempVal1 = this.getVoxelAtOffset(offset, timepoint, xInt + ctrX, yInt, zInt) * (1 - fracZ);
            offset = this.orientation.convertIndexToOffsetNative(xInt + ctrX, yInt, zInt + 1);
            tempVal2 = this.getVoxelAtOffset(offset, timepoint, xInt + ctrX, yInt, zInt + 1) * fracZ;
            this.interpSecondPass[ctrX] = tempVal1 + tempVal2;
        }

        value = (this.interpSecondPass[0] * (1 - fracX)) + (this.interpSecondPass[1] * fracX);
    } else if (!interpolateX && interpolateY && interpolateZ) {
        for (ctrY = 0; ctrY < 2; ctrY += 1) {
            offset = this.orientation.convertIndexToOffsetNative(xInt, yInt + ctrY, zInt);
            tempVal1 = this.getVoxelAtOffset(offset, timepoint, xInt, yInt + ctrY, zInt) * (1 - fracZ);
            offset = this.orientation.convertIndexToOffsetNative(xInt, yInt + ctrY, zInt + 1);
            tempVal2 = this.getVoxelAtOffset(offset, timepoint, xInt, yInt + ctrY, zInt + 1) * fracZ;
            this.interpSecondPass[ctrY] = tempVal1 + tempVal2;
        }

        value = (this.interpSecondPass[0] * (1 - fracY)) + (this.interpSecondPass[1] * fracY);
    } else if (!interpolateX && !interpolateY && interpolateZ) {
        offset = this.orientation.convertIndexToOffsetNative(xInt, yInt, zInt);
        tempVal1 = this.getVoxelAtOffset(offset, timepoint, xInt, yInt, zInt)* (1 - fracZ);
        offset = this.orientation.convertIndexToOffsetNative(xInt, yInt, zInt + 1);
        tempVal2 = this.getVoxelAtOffset(offset, timepoint, xInt, yInt, zInt + 1) * fracZ;
        value = tempVal1 + tempVal2;
    } else if (!interpolateX && interpolateY && !interpolateZ) {
        offset = this.orientation.convertIndexToOffsetNative(xInt, yInt, zInt);
        tempVal1 = this.getVoxelAtOffset(offset, timepoint, xInt, yInt, zInt) * (1 - fracY);
        offset = this.orientation.convertIndexToOffsetNative(xInt, yInt + 1, zInt);
        tempVal2 = this.getVoxelAtOffset(offset, timepoint, xInt, yInt + 1, zInt) * fracY;
        value = tempVal1 + tempVal2;
    } else if (interpolateX && !interpolateY && !interpolateZ) {
        offset = this.orientation.convertIndexToOffsetNative(xInt, yInt, zInt);
        tempVal1 = this.getVoxelAtOffset(offset, timepoint, xInt, yInt, zInt) * (1 - fracX);
        offset = this.orientation.convertIndexToOffsetNative(xInt + 1, yInt, zInt);
        tempVal2 = this.getVoxelAtOffset(offset, timepoint, xInt + 1, yInt, zInt)* fracX;
        value = tempVal1 + tempVal2;
    } else { // if(!interpolateX && !interpolateY && !interpolateZ)
        value = this.getVoxelAtOffset(this.orientation.convertIndexToOffsetNative(xLoc, yLoc, zLoc), timepoint, xLoc, yLoc, zLoc);
    }

    return value;
};



papaya.volume.VoxelValue.prototype.checkSwap = function (val) {
    /*jslint bitwise: true */

    if (this.swap16) {
        return ((((val & 0xFF) << 8) | ((val >> 8) & 0xFF)) << 16) >> 16;  // since JS uses 32-bit  when bit shifting
    }

    if (this.swap32) {
        return ((val & 0xFF) << 24) | ((val & 0xFF00) << 8) | ((val >> 8) & 0xFF00) | ((val >> 24) & 0xFF);
    }

    return val;
};
