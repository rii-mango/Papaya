
/*jslint browser: true, node: true */
/*global papayaRoundFast */

"use strict";

/*** Imports ***/
var papaya = papaya || {};
papaya.viewer = papaya.viewer || {};


/*** Constructor ***/
papaya.viewer.ScreenVolume = papaya.viewer.ScreenVolume || function (vol, params, lutName, baseImage, parametric,
                                                                     currentCoord) {
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
    this.dtiColors = true;
    this.dtiVolumeMod = null;
    this.dtiAlphaFactor = 1.0;
    this.rgb = (this.volume.header.imageType.datatype === papaya.volume.ImageType.DATATYPE_RGB);
    this.hasCheckedImageRange = false;
    this.interpolation = true;
    this.error = null;
    this.hidden = false;
    this.rotationX = 0.5;
    this.rotationY = 0.5;
    this.rotationZ = 0.5;
    this.rotationAbout = "Rotate About Center";
    this.isHighResSlice = this.volume.header.imageDimensions.getNumVoxelsSlice() > (512 * 512);
    this.currentCoord = currentCoord;
    this.seriesLabels = this.volume.getSeriesLabels();

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

        if (screenParams.labels && !this.seriesLabels) {
            this.seriesLabels = screenParams.labels;
        }

        if (baseImage) {
            if ((screenParams.rotation !== undefined) && screenParams.rotation.length && (screenParams.rotation.length === 3)) {
                this.rotationX = (Math.min(Math.max(screenParams.rotation[0], -90), 90) + 90) / 180;
                this.rotationY = (Math.min(Math.max(screenParams.rotation[1], -90), 90) + 90) / 180;
                this.rotationZ = (Math.min(Math.max(screenParams.rotation[2], -90), 90) + 90) / 180;
            }

            if (screenParams.rotationPoint) {
                if (screenParams.rotationPoint.toLowerCase() === "origin") {
                    this.rotationAbout = "Rotate About Origin";
                } else if (screenParams.rotationPoint.toLowerCase() === "crosshairs") {
                    this.rotationAbout = "Rotate About Crosshairs";
                } else {
                    this.rotationAbout = "Rotate About Center";
                }
            }

            this.updateTransform();
        }
    } else {
        this.findDisplayRange(parametric, {});
    }

    this.negative = false;
    this.updateScreenRange();

    this.canvasIcon = document.createElement("canvas");
    this.canvasIcon.width = papaya.viewer.ColorTable.ICON_SIZE;
    this.canvasIcon.height = papaya.viewer.ColorTable.ICON_SIZE;
    this.contextIcon = this.canvasIcon.getContext("2d");
    this.imageDataIcon = this.contextIcon.createImageData(papaya.viewer.ColorTable.ICON_SIZE,
        papaya.viewer.ColorTable.ICON_SIZE);
    this.icon = null;

    this.canvasBar = document.createElement("canvas");
    this.canvasBar.width = papaya.viewer.ColorTable.COLOR_BAR_WIDTH;
    this.canvasBar.height = papaya.viewer.ColorTable.COLOR_BAR_HEIGHT;
    this.contextBar = this.canvasBar.getContext("2d");
    this.imageDataBar = this.contextBar.createImageData(papaya.viewer.ColorTable.COLOR_BAR_WIDTH,
        papaya.viewer.ColorTable.COLOR_BAR_HEIGHT);
    this.colorBar = null;

    this.updateIcon();
    this.updateColorBar();
};


/*** Static Methods ***/

papaya.viewer.ScreenVolume.makeSolidIcon = function (r, g, b) {
    var canvasIcon = document.createElement("canvas");
    canvasIcon.width = papaya.viewer.ColorTable.ICON_SIZE;
    canvasIcon.height = papaya.viewer.ColorTable.ICON_SIZE;
    var ctx = canvasIcon.getContext("2d");
    ctx.fillStyle = "rgb(" + parseInt(r * 255, 10) + "," + parseInt(g * 255, 10) + "," + parseInt(b * 255, 10) + ")";
    ctx.fillRect(0, 0, papaya.viewer.ColorTable.ICON_SIZE, papaya.viewer.ColorTable.ICON_SIZE);
    return canvasIcon.toDataURL();
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
    this.negative = (this.screenMax < this.screenMin);
};



papaya.viewer.ScreenVolume.prototype.isOverlay = function () {
    return !this.colorTable.isBaseImage;
};



papaya.viewer.ScreenVolume.prototype.findImageRange = function () {
    var hasImageRange, min, max, xDim, yDim, zDim, ctrZ, ctrY, ctrX, value;

    hasImageRange = (this.volume.header.imageRange.imageMin !== this.volume.header.imageRange.imageMax);

    if (!hasImageRange && !this.hasCheckedImageRange) {
        this.hasCheckedImageRange = true;
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



papaya.viewer.ScreenVolume.prototype.isRotatingAbout = function (rotationAbout) {
    return (this.rotationAbout === rotationAbout);
};



papaya.viewer.ScreenVolume.prototype.changeColorTable = function (viewer, lutName) {
    this.colorTable = new papaya.viewer.ColorTable(lutName, !this.isOverlay());
    this.lutName = lutName;
    this.updateIcon();
    this.updateColorBar();
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



papaya.viewer.ScreenVolume.prototype.supportsDynamicColorTable = function () {
    return ((this.colorTable.updateMinLUT !== undefined) &&
        (this.colorTable.updateMaxLUT !== undefined) && (this.colorTable.updateLUT !== undefined));
};



papaya.viewer.ScreenVolume.prototype.resetDynamicRange = function () {
    this.colorTable.minLUT = 0;
    this.colorTable.maxLUT = papaya.viewer.ColorTable.LUT_MAX;
    this.updateLUT(this.colorTable.minLUT, this.colorTable.maxLUT);
    this.updateColorBar();
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
    this.updateIcon();
};



papaya.viewer.ScreenVolume.prototype.isDTILines = function () {
    return this.dtiLines && !this.dtiColors;
};



papaya.viewer.ScreenVolume.prototype.isDTIRGB = function () {
    return !this.dtiLines && this.dtiColors;
};



papaya.viewer.ScreenVolume.prototype.isDTILinesAndRGB = function () {
    return this.dtiLines && this.dtiColors;
};



papaya.viewer.ScreenVolume.prototype.getHiddenLabel = function () {
    if (this.hidden) {
        return "Show Overlay";
    } else {
        return "Hide Overlay";
    }
};



papaya.viewer.ScreenVolume.prototype.updateIcon = function () {
    var step, ctrY, ctrX, index, value;

    if (this.imageDataIcon) {
        step = papaya.viewer.ColorTable.LUT_MAX / papaya.viewer.ColorTable.ICON_SIZE;

        for (ctrY = 0; ctrY < papaya.viewer.ColorTable.ICON_SIZE; ctrY += 1) {
            for (ctrX = 0; ctrX < papaya.viewer.ColorTable.ICON_SIZE; ctrX += 1) {
                index = ((ctrY * papaya.viewer.ColorTable.ICON_SIZE) + ctrX) * 4;
                value = Math.round(ctrX * step);

                this.imageDataIcon.data[index] = this.colorTable.lookupRed(value);
                this.imageDataIcon.data[index + 1] = this.colorTable.lookupGreen(value);
                this.imageDataIcon.data[index + 2] = this.colorTable.lookupBlue(value);
                this.imageDataIcon.data[index + 3] = 255;
            }
        }

        this.contextIcon.putImageData(this.imageDataIcon, 0, 0);
        this.icon = this.canvasIcon.toDataURL();
    }
};



papaya.viewer.ScreenVolume.prototype.updateColorBar = function () {
    var step, ctrY, ctrX, index, value;

    if (this.imageDataBar) {
        step = papaya.viewer.ColorTable.LUT_MAX / papaya.viewer.ColorTable.COLOR_BAR_WIDTH;

        for (ctrY = 0; ctrY < papaya.viewer.ColorTable.COLOR_BAR_HEIGHT; ctrY += 1) {
            for (ctrX = 0; ctrX < papaya.viewer.ColorTable.COLOR_BAR_WIDTH; ctrX += 1) {
                index = ((ctrY * papaya.viewer.ColorTable.COLOR_BAR_WIDTH) + ctrX) * 4;
                value = Math.round(ctrX * step);

                this.imageDataBar.data[index] = this.colorTable.lookupRed(value);
                this.imageDataBar.data[index + 1] = this.colorTable.lookupGreen(value);
                this.imageDataBar.data[index + 2] = this.colorTable.lookupBlue(value);
                this.imageDataBar.data[index + 3] = 255;
            }
        }

        this.contextBar.putImageData(this.imageDataBar, 0, 0);
        this.colorBar = this.canvasBar.toDataURL();
    }
};



papaya.viewer.ScreenVolume.prototype.updateTransform = function () {
    var rotX = (this.rotationX - 0.5) * 180,
        rotY = (this.rotationY - 0.5) * 180,
        rotZ = (this.rotationZ - 0.5) * 180,
        centerX, centerY, centerZ;

    if (this.rotationAbout === "Rotate About Origin") {
        centerX = this.volume.header.origin.x * this.volume.header.voxelDimensions.xSize;
        centerY = this.volume.header.origin.y * this.volume.header.voxelDimensions.ySize;
        centerZ = this.volume.header.origin.z * this.volume.header.voxelDimensions.zSize;
    } else if (this.rotationAbout === "Rotate About Crosshairs") {
        centerX = this.currentCoord.x * this.volume.header.voxelDimensions.xSize;
        centerY = this.currentCoord.y * this.volume.header.voxelDimensions.ySize;
        centerZ = this.currentCoord.z * this.volume.header.voxelDimensions.zSize;
    } else {
        centerX = (this.volume.header.imageDimensions.xDim / 2) * this.volume.header.voxelDimensions.xSize;
        centerY = (this.volume.header.imageDimensions.yDim / 2) * this.volume.header.voxelDimensions.ySize;
        centerZ = (this.volume.header.imageDimensions.zDim / 2) * this.volume.header.voxelDimensions.zSize;
    }

    this.volume.transform.updateImageMat(centerX, centerY, centerZ, rotX, rotY, rotZ);
};



papaya.viewer.ScreenVolume.prototype.resetTransform = function () {
    this.rotationX = 0.5;
    this.rotationY = 0.5;
    this.rotationZ = 0.5;
};
