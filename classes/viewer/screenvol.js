
/*jslint browser: true, node: true */
/*global papayaMain, papayaParams */

"use strict";

var papaya = papaya || {};
papaya.viewer = papaya.viewer || {};



papaya.viewer.ScreenVolume = papaya.viewer.ScreenVolume || function (vol, lutName, baseImage, parametric) {
    /*jslint sub: true */
    this.volume = vol;
    this.lutName = lutName;
    this.colorTable = new papaya.viewer.ColorTable(lutName, baseImage, true);
    this.screenMin = this.volume.header.imageRange.displayMin;
    this.screenMax = this.volume.header.imageRange.displayMax;
    this.imageMin = this.volume.header.imageRange.imageMin;
    this.imageMax = this.volume.header.imageRange.imageMax;
    this.alpha = 1.0;
    this.imageRangeChecked = false;
    this.findImageRange();

    var screenParams = papayaParams[this.volume.fileName];
    if (screenParams && (screenParams.min !== undefined) && (screenParams.max !== undefined)) {
        if (parametric) {
            this.screenMin = -1 * Math.abs(screenParams.min);
            this.screenMax = -1 * Math.abs(screenParams.max);
        } else {
            this.screenMin = Math.abs(screenParams.min);
            this.screenMax = Math.abs(screenParams.max);
        }
    } else {
        this.findDisplayRange(parametric);
    }

    this.negative = (this.screenMax < this.screenMin);

    this.updateScreenRange();
};



papaya.viewer.ScreenVolume.prototype.setScreenRange = function (min, max) {
    this.screenMin = min;
    this.screenMax = max;
    this.updateScreenRange();
};



papaya.viewer.ScreenVolume.prototype.updateScreenRange = function () {
    this.screenRatio = (papaya.viewer.ScreenSlice.SCREEN_PIXEL_MAX / (this.screenMax - this.screenMin));
};



papaya.viewer.ScreenVolume.prototype.isOverlay = function () {
    return !this.colorTable.isBaseImage;
};



papaya.viewer.ScreenVolume.prototype.findImageRange = function (force) {
    var hasImageRange, min, max, xDim, yDim, zDim, ctrZ, ctrY, ctrX, value;

    hasImageRange = (this.imageMin !== this.imageMax);

    if ((!hasImageRange || force) && !this.imageRangeChecked) {
        min = Number.MAX_VALUE;
        max = Number.MIN_VALUE;

        xDim = this.volume.header.imageDimensions.xDim;
        yDim = this.volume.header.imageDimensions.yDim;
        zDim = this.volume.header.imageDimensions.zDim;

        for (ctrZ = 0; ctrZ < zDim; ctrZ += 1) {
            for (ctrY = 0; ctrY < yDim; ctrY += 1) {
                for (ctrX = 0; ctrX < xDim; ctrX += 1) {
                    value = this.volume.getVoxelAtIndex(ctrX, ctrY, ctrZ);

                    if (value > max) {
                        max = value;
                    }

                    if (value < min) {
                        min = value;
                    }
                }
            }
        }

        this.imageRangeChecked = true;
        this.imageMin = min;
        this.imageMax = max;
    }
};



papaya.viewer.ScreenVolume.prototype.findDisplayRange = function (parametric) {
    var min, max, temp;

    min = this.screenMin;
    max = this.screenMax;

    if (parametric) {
        if (Math.abs(min) > Math.abs(max)) {
            temp = max;
            max = min;
            min = temp;
        }
    }

    if (this.isOverlay()) {
        if ((min === max) || ((min < 0) && (max > 0))) {  // if not set or crosses zero
            this.findImageRange(true);

            if (parametric) {
                min = this.imageMin - (this.imageMin * 0.75);
                max = this.imageMin - (this.imageMin * 0.25);
            } else {
                min = this.imageMax - (this.imageMax * 0.75);
                max = this.imageMax - (this.imageMax * 0.25);
            }
        }

        if (!((min < 1) && (min > -1) && (max < 1) && (max > -1))) { // if not small numbers, round
            min = Math.round(min);
            max = Math.round(max);
        }
    } else {
        if (!((min < 1) && (min > -1) && (max < 1) && (max > -1))) {  // if not small numbers, round
            min = Math.round(min);
            max = Math.round(max);
        }

        if ((min === 0) && (max === 0)) { // if not found, for some reason, e.g., data not centered in image
            this.findImageRange(true);
            min = this.imageMin;
            max = this.imageMax;
        }

        if (!(max > min)) { // sanity check
            this.findImageRange(true);
            min = this.imageMin;
            max = this.imageMax;
        }

        if (min < this.imageMin) {
            this.findImageRange(true);
            min = this.imageMin;
        }

        if (max > this.imageMax) {
            this.findImageRange(true);
            max = this.imageMax;
        }
    }

    this.screenMin = min;
    this.screenMax = max;
};



papaya.viewer.ScreenVolume.prototype.isUsingColorTable = function (lutName) {
    return (this.lutName === lutName);
};



papaya.viewer.ScreenVolume.prototype.changeColorTable = function (lutName) {
    this.colorTable = new papaya.viewer.ColorTable(lutName, !this.isOverlay(), true);
    this.lutName = lutName;
    papayaMain.papayaViewer.drawViewer(true);
};



papaya.viewer.ScreenVolume.prototype.getRange = function () {
    var range = new Array(2);
    range[0] = this.screenMin;
    range[1] = this.screenMax;
    return range;
};
