
/*jslint browser: true, node: true */
/*global roundFast, Float32Array, createArray */

"use strict";

var papaya = papaya || {};
papaya.viewer = papaya.viewer || {};



papaya.viewer.ScreenSlice = papaya.viewer.ScreenSlice || function (vol, dir, width, height, widthSize, heightSize,
                                                                   screenVols) {
    this.screenVolumes = screenVols;
    this.sliceDirection = dir;
    this.currentSlice = -1;
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
    this.screenTransform = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    this.zoomTransform = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    this.finalTransform = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    this.imageData = [];
};



papaya.viewer.ScreenSlice.DIRECTION_UNKNOWN = 0;
papaya.viewer.ScreenSlice.DIRECTION_AXIAL = 1;
papaya.viewer.ScreenSlice.DIRECTION_CORONAL = 2;
papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL = 3;
papaya.viewer.ScreenSlice.SCREEN_PIXEL_MAX = 255;
papaya.viewer.ScreenSlice.SCREEN_PIXEL_MIN = 0;



papaya.viewer.ScreenSlice.prototype.updateSlice = function (slice, force, worldSpace) {
    var origin, voxelDims, ctr, ctrY, ctrX, value, thresholdAlpha, index, layerAlpha, timepoint;

    slice = Math.round(slice);

    if (force || (this.currentSlice !== slice)) {
        this.currentSlice = slice;
        origin = this.screenVolumes[0].volume.header.origin;  // base image origin
        voxelDims = this.screenVolumes[0].volume.header.voxelDimensions;

        this.contextMain.clearRect(0, 0, this.canvasMain.width, this.canvasMain.height);

        if (this.imageData.length < this.screenVolumes.length) {
            this.imageData = createArray(this.screenVolumes.length, this.xDim * this.yDim);
        }

        for (ctr = 0; ctr < this.screenVolumes.length; ctr += 1) {
            timepoint = this.screenVolumes[ctr].currentTimepoint;

            for (ctrY = 0; ctrY < this.yDim; ctrY += 1) {
                for (ctrX = 0; ctrX < this.xDim; ctrX += 1) {
                    value = 0;
                    thresholdAlpha = 255;
                    layerAlpha = this.screenVolumes[ctr].alpha;

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

                    index = ((ctrY * this.xDim) + ctrX) * 4;
                    this.imageData[ctr][index] = value;

                    if ((!this.screenVolumes[ctr].negative && (value <= this.screenVolumes[ctr].screenMin))
                            || (this.screenVolumes[ctr].negative && (value >= this.screenVolumes[ctr].screenMin)) || isNaN(value)) {
                        value = papaya.viewer.ScreenSlice.SCREEN_PIXEL_MIN;  // screen value
                        thresholdAlpha = this.screenVolumes[ctr].isOverlay() ? 0 : 255;
                    } else if ((!this.screenVolumes[ctr].negative && (value >= this.screenVolumes[ctr].screenMax))
                            || (this.screenVolumes[ctr].negative && (value <= this.screenVolumes[ctr].screenMax))) {
                        value = papaya.viewer.ScreenSlice.SCREEN_PIXEL_MAX;  // screen value
                    } else {
                        value = roundFast(((value - this.screenVolumes[ctr].screenMin) * this.screenVolumes[ctr].screenRatio) + 0.5);  // screen value
                    }

                    if ((thresholdAlpha > 0) || (ctr === 0)) {
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



papaya.viewer.ScreenSlice.prototype.repaint = function (slice, force, worldSpace) {
    var ctr, ctrY, ctrX, value, thresholdAlpha, index, layerAlpha;

    slice = Math.round(slice);

    this.currentSlice = slice;

    this.contextMain.clearRect(0, 0, this.canvasMain.width, this.canvasMain.height);

    if (this.imageData.length === this.screenVolumes.length) {
        for (ctr = 0; ctr < this.screenVolumes.length; ctr += 1) {
            for (ctrY = 0; ctrY < this.yDim; ctrY += 1) {
                for (ctrX = 0; ctrX < this.xDim; ctrX += 1) {
                    value = 0;
                    thresholdAlpha = 255;
                    layerAlpha = this.screenVolumes[ctr].alpha;

                    index = ((ctrY * this.xDim) + ctrX) * 4;
                    value = this.imageData[ctr][index];

                    if ((!this.screenVolumes[ctr].negative && (value <= this.screenVolumes[ctr].screenMin)) || (this.screenVolumes[ctr].negative && (value >= this.screenVolumes[ctr].screenMin)) || isNaN(value)) {
                        value = papaya.viewer.ScreenSlice.SCREEN_PIXEL_MIN;  // screen value
                        thresholdAlpha = this.screenVolumes[ctr].isOverlay() ? 0 : 255;
                    } else if ((!this.screenVolumes[ctr].negative && (value >= this.screenVolumes[ctr].screenMax)) || (this.screenVolumes[ctr].negative && (value <= this.screenVolumes[ctr].screenMax))) {
                        value = papaya.viewer.ScreenSlice.SCREEN_PIXEL_MAX;  // screen value
                    } else {
                        value = roundFast(((value - this.screenVolumes[ctr].screenMin) * this.screenVolumes[ctr].screenRatio) + 0.5);  // screen value
                    }

                    if ((thresholdAlpha > 0) || (ctr === 0)) {
                        this.imageDataDraw.data[index] = (this.imageDataDraw.data[index] * (1 - layerAlpha) + this.screenVolumes[ctr].colorTable.lookupRed(value) * layerAlpha);
                        this.imageDataDraw.data[index + 1] = (this.imageDataDraw.data[index + 1] * (1 - layerAlpha) + this.screenVolumes[ctr].colorTable.lookupGreen(value) * layerAlpha);
                        this.imageDataDraw.data[index + 2] = (this.imageDataDraw.data[index + 2] * (1 - layerAlpha) + this.screenVolumes[ctr].colorTable.lookupBlue(value) * layerAlpha);
                        this.imageDataDraw.data[index + 3] = thresholdAlpha;
                    }
                }
            }

            this.contextMain.putImageData(this.imageDataDraw, 0, 0);
        }
    } else {
        this.updateSlice(slice, force, worldSpace);
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



papaya.viewer.ScreenSlice.prototype.updateZoomTransform = function (zoomFactor, xZoomTrans, yZoomTrans, xPanTrans, yPanTrans, viewer) {
    var xTrans, yTrans, maxTranslateX, maxTranslateY;

    xZoomTrans = (xZoomTrans + 0.5) * (zoomFactor - 1) * -1;
    yZoomTrans = (yZoomTrans + 0.5) * (zoomFactor - 1) * -1;
    xPanTrans = xPanTrans * (zoomFactor - 1);
    yPanTrans = yPanTrans * (zoomFactor - 1);

    // limit pan translation such that it cannot pan out of bounds of image
    xTrans = xZoomTrans + xPanTrans;
    maxTranslateX = -1 * (zoomFactor - 1.0) * this.xDim;
    if (xTrans > 0) {
        xTrans = 0;
    } else if (xTrans < maxTranslateX) {
        xTrans = maxTranslateX;
    }

    yTrans = yZoomTrans + yPanTrans;
    maxTranslateY = -1 * (zoomFactor - 1.0) * this.yDim;
    if (yTrans > 0) {
        yTrans = 0;
    } else if (yTrans < maxTranslateY) {
        yTrans = maxTranslateY;
    }

    // update parent viewer with pan translation (may have been limited by step above)
    if (zoomFactor > 1) {
        if (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
            viewer.panAmountX = (Math.round((xTrans - xZoomTrans) / (zoomFactor - 1)));
            viewer.panAmountY = (Math.round((yTrans - yZoomTrans) / (zoomFactor - 1)));
        } else if (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
            viewer.panAmountX = (Math.round((xTrans - xZoomTrans) / (zoomFactor - 1)));
            viewer.panAmountZ = (Math.round((yTrans - yZoomTrans) / (zoomFactor - 1)));
        } else if (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
            viewer.panAmountY = (Math.round((xTrans - xZoomTrans) / (zoomFactor - 1)));
            viewer.panAmountZ = (Math.round((yTrans - yZoomTrans) / (zoomFactor - 1)));
        }
    }

    // update transform
    this.zoomTransform[0][0] = zoomFactor;
    this.zoomTransform[0][1] = 0;
    this.zoomTransform[0][2] = xTrans;
    this.zoomTransform[1][0] = 0;
    this.zoomTransform[1][1] = zoomFactor;
    this.zoomTransform[1][2] = yTrans;

    this.updateFinalTransform();
};


papaya.viewer.ScreenSlice.prototype.updateFinalTransform = function () {
    var ctrOut, ctrIn;
    for (ctrOut = 0; ctrOut < 3; ctrOut += 1) {
        for (ctrIn = 0; ctrIn < 3; ctrIn += 1) {
            this.finalTransform[ctrOut][ctrIn] = (this.screenTransform[ctrOut][0] * this.zoomTransform[0][ctrIn]) + (this.screenTransform[ctrOut][1] * this.zoomTransform[1][ctrIn]) + (this.screenTransform[ctrOut][2] * this.zoomTransform[2][ctrIn]);
        }
    }
};
