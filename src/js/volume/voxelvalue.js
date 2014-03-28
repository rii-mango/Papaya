/*jslint browser: true, node: true */
/*global roundFast */

"use strict";

var papaya = papaya || {};
papaya.volume = papaya.volume || {};



papaya.volume.VoxelValue = papaya.volume.VoxelValue || function (imageData, imageType, imageDimensions, imageRange, orientation) {
    this.imageData = imageData;
    this.imageType = imageType;
    this.imageRange = imageRange;
    this.orientation = orientation;
    this.swap16 = ((this.imageType.numBytes === 2) && this.imageType.swapped) && (this.imageType.datatype !== papaya.volume.ImageType.DATATYPE_FLOAT);
    this.swap32 = ((this.imageType.numBytes === 4) && this.imageType.swapped) && (this.imageType.datatype !== papaya.volume.ImageType.DATATYPE_FLOAT);
    this.xIncrement = orientation.xIncrement;
    this.yIncrement = orientation.yIncrement;
    this.zIncrement = orientation.zIncrement;
    this.xDim = imageDimensions.xDim;
    this.yDim = imageDimensions.yDim;
    this.zDim = imageDimensions.zDim;
    this.dataScaleSlope = imageRange.globalScale;
    this.dataScaleIntercept = imageRange.globalIntercept;
    this.interpFirstPass = [[0, 0], [0, 0]];
    this.interpSecondPass = [0, 0];
    this.volumeArraySize = this.xDim * this.yDim * this.zDim;
};



papaya.volume.VoxelValue.prototype.getVoxelAtIndex = function (ctrX, ctrY, ctrZ, timepoint, useNN) {
    if (useNN) {
        ctrX = roundFast(ctrX);
        ctrY = roundFast(ctrY);
        ctrZ = roundFast(ctrZ);

        return (this.getVoxelAtOffset(this.orientation.convertIndexToOffset2(ctrX, ctrY, ctrZ), timepoint) * this.dataScaleSlope) + this.dataScaleIntercept;
    }

    return this.getVoxelAtIndexLinear(ctrX, ctrY, ctrZ, timepoint);
};



papaya.volume.VoxelValue.prototype.getVoxelAtOffset = function (offset, timepoint) {
    return this.checkSwap(this.imageData.data[offset + (this.volumeArraySize * timepoint)]);
};



papaya.volume.VoxelValue.prototype.getVoxelAtIndexLinear = function (xLoc, yLoc, zLoc, timepoint) {
    var value, fracX, fracY, fracZ, tempVal1, tempVal2, offset, xInt, yInt, zInt, interpolateX, interpolateY, interpolateZ, ctrX, ctrY;
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
                if (((ctrX === 1) && (xInt === (this.xDim - 1))) || ((ctrY === 1) && (yInt === (this.yDim - 1)))) {
                    offset = -1;
                } else {
                    offset = this.orientation.convertIndexToOffset2(xInt + ctrX, yInt + ctrY, zInt);
                }

                if (offset !== -1) {
                    tempVal1 = (((this.getVoxelAtOffset(offset, timepoint)) * this.dataScaleSlope) + this.dataScaleIntercept) * (1 - fracZ);

                    if (zInt === (this.zDim - 1)) {
                        tempVal2 = 0;
                    } else {
                        offset = this.orientation.convertIndexToOffset2(xInt + ctrX, yInt + ctrY, zInt + 1);
                        tempVal2 = (((this.getVoxelAtOffset(offset, timepoint)) * this.dataScaleSlope) + this.dataScaleIntercept) * fracZ;
                    }

                    this.interpFirstPass[ctrX][ctrY] = tempVal1 + tempVal2;
                } else {
                    this.interpFirstPass[ctrX][ctrY] = 0;
                }
            }
        }

        this.interpSecondPass[0] = (this.interpFirstPass[0][0] * (1 - fracY)) + (this.interpFirstPass[0][1] * fracY);
        this.interpSecondPass[1] = (this.interpFirstPass[1][0] * (1 - fracY)) + (this.interpFirstPass[1][1] * fracY);

        value = (this.interpSecondPass[0] * (1 - fracX)) + (this.interpSecondPass[1] * fracX);
    } else if (interpolateX && interpolateY && !interpolateZ) {
        for (ctrX = 0; ctrX < 2; ctrX += 1) {
            if ((ctrX === 1) && (xInt === (this.xDim - 1))) {
                offset = -1;
            } else {
                offset = this.orientation.convertIndexToOffset2(xInt + ctrX, yInt, zInt);
            }

            if (offset !== -1) {
                tempVal1 = (((this.getVoxelAtOffset(offset, timepoint)) * this.dataScaleSlope) + this.dataScaleIntercept) * (1 - fracY);

                if (yInt === (this.yDim - 1)) {
                    tempVal2 = 0;
                } else {
                    offset = this.orientation.convertIndexToOffset2(xInt + ctrX, yInt + 1, zInt);
                    tempVal2 = (((this.getVoxelAtOffset(offset, timepoint)) * this.dataScaleSlope) + this.dataScaleIntercept) * fracY;
                }

                this.interpSecondPass[ctrX] = tempVal1 + tempVal2;
            } else {
                this.interpSecondPass[ctrX] = 0;
            }
        }

        value = (this.interpSecondPass[0] * (1 - fracX)) + (this.interpSecondPass[1] * fracX);
    } else if (interpolateX && !interpolateY && interpolateZ) {
        for (ctrX = 0; ctrX < 2; ctrX += 1) {
            if ((ctrX === 1) && (xInt === (this.xDim - 1))) {
                offset = -1;
            } else {
                offset = this.orientation.convertIndexToOffset2(xInt + ctrX, yInt, zInt);
            }

            if (offset !== -1) {
                tempVal1 = (((this.getVoxelAtOffset(offset, timepoint)) * this.dataScaleSlope) + this.dataScaleIntercept) * (1 - fracZ);

                if (zInt === (this.zDim - 1)) {
                    tempVal2 = 0;
                } else {
                    offset = this.orientation.convertIndexToOffset2(xInt + ctrX, yInt, zInt + 1);
                    tempVal2 = (((this.getVoxelAtOffset(offset, timepoint)) * this.dataScaleSlope) + this.dataScaleIntercept) * fracZ;
                }

                this.interpSecondPass[ctrX] = tempVal1 + tempVal2;
            } else {
                this.interpSecondPass[ctrX] = 0;
            }
        }

        value = (this.interpSecondPass[0] * (1 - fracX)) + (this.interpSecondPass[1] * fracX);
    } else if (!interpolateX && interpolateY && interpolateZ) {
        for (ctrY = 0; ctrY < 2; ctrY += 1) {
            if ((ctrY === 1) && (yInt === (this.yDim - 1))) {
                offset = -1;
            } else {
                offset = this.orientation.convertIndexToOffset2(xInt, yInt + ctrY, zInt);
            }

            if (offset !== -1) {
                tempVal1 = (((this.getVoxelAtOffset(offset, timepoint)) * this.dataScaleSlope) + this.dataScaleIntercept) * (1 - fracZ);

                if (zInt === (this.zDim - 1)) {
                    tempVal2 = 0;
                } else {
                    offset = this.orientation.convertIndexToOffset2(xInt, yInt + ctrY, zInt + 1);
                    tempVal2 = (((this.getVoxelAtOffset(offset, timepoint)) * this.dataScaleSlope) + this.dataScaleIntercept) * fracZ;
                }

                this.interpSecondPass[ctrY] = tempVal1 + tempVal2;
            } else {
                this.interpSecondPass[ctrY] = 0;
            }
        }

        value = (this.interpSecondPass[0] * (1 - fracY)) + (this.interpSecondPass[1] * fracY);
    } else if (!interpolateX && !interpolateY && interpolateZ) {
        offset = this.orientation.convertIndexToOffset2(xInt, yInt, zInt);
        tempVal1 = (((this.getVoxelAtOffset(offset, timepoint)) * this.dataScaleSlope) + this.dataScaleIntercept) * (1 - fracZ);

        if (zInt === (this.zDim - 1)) {
            tempVal2 = 0;
        } else {
            offset = this.orientation.convertIndexToOffset2(xInt, yInt, zInt + 1);
            tempVal2 = (((this.getVoxelAtOffset(offset, timepoint)) * this.dataScaleSlope) + this.dataScaleIntercept) * fracZ;
        }

        value = tempVal1 + tempVal2;
    } else if (!interpolateX && interpolateY && !interpolateZ) {
        offset = this.orientation.convertIndexToOffset2(xInt, yInt, zInt);
        tempVal1 = (((this.getVoxelAtOffset(offset, timepoint)) * this.dataScaleSlope) + this.dataScaleIntercept) * (1 - fracY);

        if (yInt === (this.yDim - 1)) {
            tempVal2 = 0;
        } else {
            offset = this.orientation.convertIndexToOffset2(xInt, yInt + 1, zInt);
            tempVal2 = (((this.getVoxelAtOffset(offset, timepoint)) * this.dataScaleSlope) + this.dataScaleIntercept) * fracY;
        }

        value = tempVal1 + tempVal2;
    } else if (interpolateX && !interpolateY && !interpolateZ) {
        offset = this.orientation.convertIndexToOffset2(xInt, yInt, zInt);
        tempVal1 = (((this.getVoxelAtOffset(offset, timepoint)) * this.dataScaleSlope) + this.dataScaleIntercept) * (1 - fracX);

        if (xInt === (this.xDim - 1)) {
            tempVal2 = 0;
        } else {
            offset = this.orientation.convertIndexToOffset2(xInt + 1, yInt, zInt);
            tempVal2 = (((this.getVoxelAtOffset(offset, timepoint)) * this.dataScaleSlope) + this.dataScaleIntercept) * fracX;
        }

        value = tempVal1 + tempVal2;
    } else { // if(!interpolateX && !interpolateY && !interpolateZ)
        value = (this.getVoxelAtOffset(this.orientation.convertIndexToOffset2(xLoc, yLoc, zLoc), timepoint) * this.dataScaleSlope) + this.dataScaleIntercept;
    }

    return value;
};



papaya.volume.VoxelValue.prototype.checkSwap = function (val) {
    /*jslint bitwise: true */

    if (this.swap16) {
        return ((((val & 0xFF) << 8) | ((val >> 8) & 0xFF)) << 16) >> 16;  // since JavaScript uses 32-bit always when bit shifting
    }

    if (this.swap32) {
        return ((val & 0xFF) << 24) | ((val & 0xFF00) << 8) | ((val >> 8) & 0xFF00) | ((val >> 24) & 0xFF);
    }

    return val;
};
