
/*jslint browser: true, node: true */
/*global round */

"use strict";

var papaya = papaya || {};
papaya.viewer = papaya.viewer || {};



papaya.viewer.ScreenSlice = papaya.viewer.ScreenSlice || function (vol, dir, width, height, widthSize, heightSize,
                                                                   screenVols) {
    this.screenVolumes = screenVols;
    this.sliceDirection = dir;
    this.currentSlice = 0;
    this.xDim = width;
    this.yDim = height;
    this.xSize = widthSize;
    this.ySize = heightSize;
    this.canvasMain = document.createElement("canvas");
    this.canvasMain.width = this.xDim;
    this.canvasMain.height = this.yDim;
    this.contextMain = this.canvasMain.getContext("2d");
    this.imageDataDraw = this.contextMain.createImageData(this.xDim, this.yDim);
    this.screenOffsetX = 0;
    this.screenOffsetY = 0;
    this.screenDim = 0;
    this.xformScaleX = 1;
    this.xformScaleY = 1;
    this.xformTransX = 0;
    this.xformTransY = 0;
};



papaya.viewer.ScreenSlice.DIRECTION_UNKNOWN = 0;
papaya.viewer.ScreenSlice.DIRECTION_AXIAL = 1;
papaya.viewer.ScreenSlice.DIRECTION_CORONAL = 2;
papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL = 3;
papaya.viewer.ScreenSlice.SCREEN_PIXEL_MAX = 255;
papaya.viewer.ScreenSlice.SCREEN_PIXEL_MIN = 0;



papaya.viewer.ScreenSlice.prototype.updateSlice = function (slice, force, worldSpace) {
    var origin, voxelDims, ctr, ctrY, ctrX, value, thresholdAlpha, index, layerAlpha, timepoint;

    slice = round(slice);

    if (force || (this.currentSlice !== slice)) {
        this.currentSlice = slice;
        origin = this.screenVolumes[0].volume.header.origin;  // base image origin
        voxelDims = this.screenVolumes[0].volume.header.voxelDimensions;

        this.contextMain.clearRect(0, 0, this.canvasMain.width, this.canvasMain.height);

        for (ctr = 0; ctr < this.screenVolumes.length; ctr += 1) {
            timepoint = this.screenVolumes[ctr].currentTimepoint;

            for (ctrY = 0; ctrY < this.yDim; ctrY += 1) {
                for (ctrX = 0; ctrX < this.xDim; ctrX += 1) {
                    value = 0;
                    thresholdAlpha = 255;
                    layerAlpha = this.screenVolumes[ctr].alpha;

                    if (ctr === 0) {
                        if (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
                            value = this.screenVolumes[ctr].volume.getVoxelAtIndex(ctrX, ctrY, slice, timepoint, true);
                        } else if (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
                            value = this.screenVolumes[ctr].volume.getVoxelAtIndex(ctrX, slice, ctrY, timepoint, true);
                        } else if (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
                            value = this.screenVolumes[ctr].volume.getVoxelAtIndex(slice, ctrX, ctrY, timepoint, true);
                        }
                    } else {
                        if (worldSpace) {
                            if (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
                                value = this.screenVolumes[ctr].volume.getVoxelAtCoordinate((ctrX - origin.x) * voxelDims.xSize, (origin.y - ctrY) * voxelDims.ySize, (origin.z - slice) * voxelDims.zSize, timepoint, false);
                            } else if (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
                                value = this.screenVolumes[ctr].volume.getVoxelAtCoordinate((ctrX - origin.x) * voxelDims.xSize, (origin.y - slice) * voxelDims.ySize, (origin.z - ctrY) * voxelDims.zSize, timepoint, false);
                            } else if (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
                                value = this.screenVolumes[ctr].volume.getVoxelAtCoordinate((slice - origin.x) * voxelDims.xSize, (origin.y - ctrX) * voxelDims.ySize, (origin.z - ctrY) * voxelDims.zSize, timepoint, false);
                            }
                        } else {
                            if (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
                                value = this.screenVolumes[ctr].volume.getVoxelAtMM(ctrX * voxelDims.xSize, ctrY * voxelDims.ySize, slice * voxelDims.zSize, timepoint, false);
                            } else if (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
                                value = this.screenVolumes[ctr].volume.getVoxelAtMM(ctrX * voxelDims.xSize, slice * voxelDims.ySize, ctrY * voxelDims.zSize, timepoint, false);
                            } else if (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
                                value = this.screenVolumes[ctr].volume.getVoxelAtMM(slice * voxelDims.xSize, ctrX * voxelDims.ySize, ctrY * voxelDims.zSize, timepoint, false);
                            }
                        }
                    }

                    if ((!this.screenVolumes[ctr].negative && (value <= this.screenVolumes[ctr].screenMin))
                            || (this.screenVolumes[ctr].negative && (value >= this.screenVolumes[ctr].screenMin)) || isNaN(value)) {
                        value = papaya.viewer.ScreenSlice.SCREEN_PIXEL_MIN;  // screen value
                        thresholdAlpha = this.screenVolumes[ctr].isOverlay() ? 0 : 255;
                    } else if ((!this.screenVolumes[ctr].negative && (value >= this.screenVolumes[ctr].screenMax))
                            || (this.screenVolumes[ctr].negative && (value <= this.screenVolumes[ctr].screenMax))) {
                        value = papaya.viewer.ScreenSlice.SCREEN_PIXEL_MAX;  // screen value
                    } else {
                        value = round(((value - this.screenVolumes[ctr].screenMin) * this.screenVolumes[ctr].screenRatio) + 0.5);  // screen value
                    }

                    if ((thresholdAlpha > 0) || (ctr === 0)) {
                        index = ((ctrY * this.xDim) + ctrX) * 4;

                        this.imageDataDraw.data[index] = (this.imageDataDraw.data[index] * (1 - layerAlpha) + this.screenVolumes[ctr].colorTable.lookupRed(value) * layerAlpha);
                        this.imageDataDraw.data[index + 1] = (this.imageDataDraw.data[index + 1] * (1 - layerAlpha) + this.screenVolumes[ctr].colorTable.lookupGreen(value) * layerAlpha);
                        this.imageDataDraw.data[index + 2] = (this.imageDataDraw.data[index + 2] * (1 - layerAlpha) + this.screenVolumes[ctr].colorTable.lookupBlue(value) * layerAlpha);
                        this.imageDataDraw.data[index + 3] = thresholdAlpha;
                    }
                }
            }
        }

        this.contextMain.putImageData(this.imageDataDraw, 0, 0);
    }
};



papaya.viewer.ScreenSlice.prototype.getRealWidth = function () {
    return this.xDim * this.xSize;
};



papaya.viewer.ScreenSlice.prototype.getRealHeight = function () {
    return this.yDim * this.ySize;
};



papaya.viewer.ScreenSlice.prototype.getXYratio = function () {
    return this.xSize / this.ySize;
};



papaya.viewer.ScreenSlice.prototype.getYXratio = function () {
    return this.ySize / this.xSize;
};



papaya.viewer.ScreenSlice.prototype.getXSize = function () {
    return this.xSize;
};



papaya.viewer.ScreenSlice.prototype.getYSize = function () {
    return this.ySize;
};



papaya.viewer.ScreenSlice.prototype.getXDim = function () {
    return this.xDim;
};



papaya.viewer.ScreenSlice.prototype.getYDim = function () {
    return this.yDim;
};
