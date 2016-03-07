
/*jslint browser: true, node: true */
/*global papayaRoundFast */

"use strict";

/*** Imports ***/
var papaya = papaya || {};
papaya.viewer = papaya.viewer || {};


/*** Constructor ***/
papaya.viewer.ScreenVolume = papaya.viewer.ScreenVolume || function (vol, params, lutName, baseImage, parametric) {
    /*jslint sub: true */
    this.volume = vol;
    this.lutName = lutName;
    this.colorTable = new papaya.viewer.ColorTable(this.lutName, baseImage);
    this.screenMin = this.volume.header.imageRange.displayMin;
    this.screenMax = this.volume.header.imageRange.displayMax;
    this.imageMin = this.volume.header.imageRange.imageMin;
    this.imageMax = this.volume.header.imageRange.imageMax;
    this.alpha = 1.0;
    this.currentTimepoint = 0;
    this.parametric = (parametric !== undefined) && parametric;
    this.negativeScreenVol = null;
    this.dti = false;
    this.dtiLines = false;
    this.dtiColors = false;
    this.dtiVolumeMod = null;
    this.dtiAlphaFactor = 1.0;
    this.rgb = (this.volume.header.imageType.datatype === papaya.volume.ImageType.DATATYPE_RGB);
    this.hasCheckedImageRange = false;
    this.interpolation = true;
    this.error = null;
    this.hidden = false;

    var screenParams = params[this.volume.fileName];
    if (screenParams) {
        if (screenParams.interpolation !== undefined) {
            this.interpolation = screenParams.interpolation;
        }

        if (screenParams.dti !== undefined) {
            this.dti = screenParams.dti;

            if (this.dti && (this.volume.numTimepoints !== 3)) {
                this.error = new Error("DTI vector series must have 3 series points!");
            }

            if (this.dti) {
                this.dtiLines = screenParams.dtiLines;
                this.dtiColors = screenParams.dtiColors;

                if (!this.dtiLines && !this.dtiColors) {
                    this.dtiColors = true;
                }

                this.initDTI();
            }
        }

        if ((screenParams.min !== undefined) && (screenParams.max !== undefined)) {
            if (parametric) {
                this.screenMin = -1 * Math.abs(screenParams.min);
                this.screenMax = -1 * Math.abs(screenParams.max);
            } else {
                this.screenMin = screenParams.min;
                this.screenMax = screenParams.max;
            }
        } else {
            this.findDisplayRange(parametric, screenParams);
        }

        if (parametric) {
            if (screenParams.negative_lut !== undefined) {
                this.lutName = screenParams.negative_lut;
                this.colorTable = new papaya.viewer.ColorTable(this.lutName, baseImage);
            }
        } else {
            if (screenParams.lut !== undefined) {
                if (typeof screenParams.lut === 'string' || screenParams.lut instanceof String) {
                    this.lutName = screenParams.lut;
                    this.colorTable = new papaya.viewer.ColorTable(this.lutName, baseImage);
                } else {
                    this.lutName = "Object";
                    this.colorTable = screenParams.lut;
                }
            }
        }

        if ((screenParams.alpha !== undefined) && !baseImage) {
            this.alpha = screenParams.alpha;
        }
    } else {
        this.findDisplayRange(parametric, {});
    }

    this.negative = (this.screenMax < this.screenMin);

    this.updateScreenRange();
};


/*** Prototype Methods ***/

papaya.viewer.ScreenVolume.prototype.setScreenRange = function (min, max) {
    this.screenMin = min;
    this.screenMax = max;
    this.updateScreenRange();
};



papaya.viewer.ScreenVolume.prototype.setScreenRangeNegatives = function (min, max) {
    this.negativeScreenVol.setScreenRange(min, max);
};



papaya.viewer.ScreenVolume.prototype.updateScreenRange = function () {
    this.screenRatio = (papaya.viewer.ScreenSlice.SCREEN_PIXEL_MAX / (this.screenMax - this.screenMin));
};



papaya.viewer.ScreenVolume.prototype.isOverlay = function () {
    return !this.colorTable.isBaseImage;
};



papaya.viewer.ScreenVolume.prototype.findImageRange = function () {
    var hasImageRange, min, max, xDim, yDim, zDim, ctrZ, ctrY, ctrX, value;

    hasImageRange = (this.volume.header.imageRange.imageMin !== this.volume.header.imageRange.imageMax);

    if (!hasImageRange && !this.hasCheckedImageRange) {
        this.hasCheckedImageRange = true;
        console.log("scanning image range of " + this.volume.fileName + "...");
        min = Number.MAX_VALUE;
        max = Number.MIN_VALUE;

        xDim = this.volume.header.imageDimensions.xDim;
        yDim = this.volume.header.imageDimensions.yDim;
        zDim = this.volume.header.imageDimensions.zDim;

        for (ctrZ = 0; ctrZ < zDim; ctrZ += 1) {
            for (ctrY = 0; ctrY < yDim; ctrY += 1) {
                for (ctrX = 0; ctrX < xDim; ctrX += 1) {
                    value = this.volume.getVoxelAtIndexNative(ctrX, ctrY, ctrZ, 0, true);

                    if (value > max) {
                        max = value;
                    }

                    if (value < min) {
                        min = value;
                    }
                }
            }
        }

        this.volume.header.imageRange.imageMin = this.imageMin = min;
        this.volume.header.imageRange.imageMax = this.imageMax = max;
    }
};



papaya.viewer.ScreenVolume.prototype.findDisplayRange = function (parametric, screenParams) {
    var hasImageRange, min, max, temp;

    hasImageRange = (this.volume.header.imageRange.imageMin !== this.volume.header.imageRange.imageMax);

    min = this.screenMin;
    max = this.screenMax;

    if (parametric) {
        if (Math.abs(min) > Math.abs(max)) {
            temp = max;
            max = min;
            min = temp;
        }
    }

    if (!parametric && ((screenParams.minPercent !== undefined) || (screenParams.maxPercent !== undefined))) {
        this.findImageRange();

        if (screenParams.minPercent !== undefined) {
            min = this.imageMax * screenParams.minPercent;
        } else {
            min = this.imageMin;
        }

        if (screenParams.maxPercent !== undefined) {
            max = this.imageMax * screenParams.maxPercent;
        } else {
            max = this.imageMax;
        }
    } else if (this.isOverlay()) {
        if ((min === max) || ((min < 0) && (max > 0)) || ((min > 0) && (max < 0)) || (parametric && ((min > 0) ||
            (max > 0))) || screenParams.symmetric) {  // if not set or crosses zero
            this.findImageRange();

            if (parametric) {
                if (screenParams.symmetric || (this.imageMin === 0)) {
                    min = -1 * (this.imageMax - (this.imageMax * 0.75));
                    max = -1 * (this.imageMax - (this.imageMax * 0.25));
                } else {
                    min = this.imageMin - (this.imageMin * 0.75);
                    max = this.imageMin - (this.imageMin * 0.25);
                }
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

        if ((min === 0) && (max === 0)) { // if not found, for some reason
            this.findImageRange();
            min = this.imageMin;
            max = this.imageMax;
        }

        if (max <= min) { // sanity check
            this.findImageRange();
            min = this.imageMin;
            max = this.imageMax;
        }

        if (hasImageRange && (min < this.imageMin)) {
            this.findImageRange();
            min = this.imageMin;
        }

        if (hasImageRange && (max > this.imageMax)) {
            this.findImageRange();
            max = this.imageMax;
        }
    }

    this.screenMin = min;
    this.screenMax = max;
};



papaya.viewer.ScreenVolume.prototype.isUsingColorTable = function (lutName) {
    return (this.lutName === lutName);
};



papaya.viewer.ScreenVolume.prototype.changeColorTable = function (viewer, lutName) {
    this.colorTable = new papaya.viewer.ColorTable(lutName, !this.isOverlay());
    this.lutName = lutName;
    viewer.drawViewer(true);
};



papaya.viewer.ScreenVolume.prototype.getRange = function () {
    var range = new Array(2);
    range[0] = ((this.colorTable.minLUT / (255.0 / (this.screenMax - this.screenMin))) + this.screenMin);
    range[1] = ((this.colorTable.maxLUT / (255.0 / (this.screenMax - this.screenMin))) + this.screenMin);
    return range;
};



papaya.viewer.ScreenVolume.prototype.getRangeNegative = function () {
    return this.negativeScreenVol.getRange();
};



papaya.viewer.ScreenVolume.prototype.getAlphaNegative = function () {
    return this.negativeScreenVol.alpha;
};



papaya.viewer.ScreenVolume.prototype.incrementTimepoint = function () {
    var numTimepoints = this.volume.numTimepoints;

    this.currentTimepoint += 1;
    if (this.currentTimepoint >= numTimepoints) {
        this.currentTimepoint = numTimepoints - 1;
    }
};



papaya.viewer.ScreenVolume.prototype.decrementTimepoint = function () {
    this.currentTimepoint -= 1;
    if (this.currentTimepoint < 0) {
        this.currentTimepoint = 0;
    }
};


papaya.viewer.ScreenVolume.prototype.setTimepoint = function (timepoint) {
    if (timepoint < 0) {
        this.currentTimepoint = 0;
    } else if (timepoint >= this.volume.numTimepoints) {
        this.currentTimepoint = (this.volume.numTimepoints - 1);
    } else {
        this.currentTimepoint = timepoint;
    }
};



papaya.viewer.ScreenVolume.prototype.updateMinLUT = function (minLUTnew) {
    this.colorTable.updateMinLUT(minLUTnew);
};



papaya.viewer.ScreenVolume.prototype.updateMaxLUT = function (maxLUTnew) {
    this.colorTable.updateMaxLUT(maxLUTnew);
};



papaya.viewer.ScreenVolume.prototype.updateLUT = function (minLUTnew, maxLUTnew) {
    this.colorTable.updateLUT(minLUTnew, maxLUTnew);
};



papaya.viewer.ScreenVolume.prototype.resetDynamicRange = function () {
    this.colorTable.minLUT = 0;
    this.colorTable.maxLUT = papaya.viewer.ColorTable.LUT_MAX;
    this.updateLUT(this.colorTable.minLUT, this.colorTable.maxLUT);
    this.colorTable.updateColorBar();
};



papaya.viewer.ScreenVolume.prototype.getCurrentTime = function () {
    return (this.currentTimepoint * (this.volume.header.voxelDimensions.timeSize *
        this.volume.header.voxelDimensions.getTemporalUnitMultiplier()));
};



papaya.viewer.ScreenVolume.prototype.setCurrentTime = function (seconds) {
    var secondsPerSeriesPoint = (this.volume.header.voxelDimensions.timeSize *
        this.volume.header.voxelDimensions.getTemporalUnitMultiplier());

    if (secondsPerSeriesPoint === 0) {
        this.setTimepoint(0);
    } else {
        this.setTimepoint(parseInt(Math.round(seconds / secondsPerSeriesPoint), 10));
    }
};



papaya.viewer.ScreenVolume.prototype.hasError = function () {
    return (this.error !== null);
};



papaya.viewer.ScreenVolume.prototype.initDTI = function () {
    this.volume.numTimepoints = 1;
    this.volume.header.imageDimensions.timepoints = 1;
    this.colorTable = new papaya.viewer.ColorTable(this.lutName, false, papaya.viewer.ColorTable.TABLE_DTI_SPECTRUM);
    this.volume.transform.voxelValue.forceABS = !this.dtiLines;
};



papaya.viewer.ScreenVolume.prototype.getHiddenLabel = function () {
    if (this.hidden) {
        return "Show Overlay";
    } else {
        return "Hide Overlay";
    }
};
