
/*jslint browser: true, node: true */
/*global */

"use strict";

var papaya = papaya || {};
papaya.viewer = papaya.viewer || {};



papaya.viewer.ColorTable = papaya.viewer.ColorTable || function (lutName, baseImage, gradation) {
    this.lut = papaya.viewer.ColorTable.MAP[lutName];
    this.maxLUT = 0;
    this.minLUT = 0;
    this.knotThresholds = [];
    this.knotRangeRatios = [];

    this.LUTarrayG = new Array(256);
    this.LUTarrayR = new Array(256);
    this.LUTarrayB = new Array(256);
    this.isBaseImage = baseImage;

    this.knotMin = this.lut[0];
    this.knotMax = this.lut[this.lut.length - 1];
    this.useGradation = gradation;

    this.canvas = document.createElement("canvas");
    this.canvas.width = papaya.viewer.ColorTable.ICON_SIZE;
    this.canvas.height = papaya.viewer.ColorTable.ICON_SIZE;
    this.context = this.canvas.getContext("2d");
    this.imageData = this.context.createImageData(papaya.viewer.ColorTable.ICON_SIZE, papaya.viewer.ColorTable.ICON_SIZE);
    this.icon = null;

    this.updateLUT(papaya.viewer.ColorTable.LUT_MAX, papaya.viewer.ColorTable.LUT_MIN);
    this.updateIcon();
};



papaya.viewer.ColorTable.TABLE_GRAYSCALE_NAME = "Grayscale";
papaya.viewer.ColorTable.TABLE_SPECTRUM_NAME = "Spectrum";
papaya.viewer.ColorTable.TABLE_HOTANDCOLD_NAME = "Hot-and-Cold";
papaya.viewer.ColorTable.TABLE_GOLD_NAME  = "Gold";
papaya.viewer.ColorTable.TABLE_RED2WHITE_NAME  = "Red-to-White";
papaya.viewer.ColorTable.TABLE_GREEN2WHITE_NAME  = "Green-to-White";
papaya.viewer.ColorTable.TABLE_BLUE2WHITE_NAME  = "Blue-to-White";
papaya.viewer.ColorTable.TABLE_ORANGE2WHITE_NAME  = "Orange-to-White";
papaya.viewer.ColorTable.TABLE_PURPLE2WHITE_NAME  = "Purple-to-White";
papaya.viewer.ColorTable.TABLE_RED2YELLOW_NAME = "Red-to-Yellow";
papaya.viewer.ColorTable.TABLE_BLUE2GREEN_NAME = "Blue-to-Green";
papaya.viewer.ColorTable.TABLE_GRAYSCALE = [[0, 0, 0, 0], [1, 1, 1, 1]];
papaya.viewer.ColorTable.TABLE_SPECTRUM = [[0, 0, 0, 0], [0.1, 0, 0, 1], [0.33, 0, 1, 1], [0.5, 0, 1, 0], [0.66, 1, 1, 0], [0.9, 1, 0, 0], [1, 1, 1, 1]];
papaya.viewer.ColorTable.TABLE_HOTANDCOLD = [[0, 0, 0, 1], [0.15, 0, 1, 1], [0.3, 0, 1, 0], [0.45, 0, 0, 0], [0.5, 0, 0, 0], [0.55, 0, 0, 0], [0.7, 1, 1, 0], [0.85, 1, 0, 0], [1, 1, 1, 1]];
papaya.viewer.ColorTable.TABLE_GOLD =  [[0, 0, 0, 0], [0.13, 0.19, 0.03, 0], [0.25, 0.39, 0.12, 0], [0.38, 0.59, 0.26, 0], [0.50, 0.80, 0.46, 0.08], [0.63, 0.99, 0.71, 0.21], [0.75, 0.99, 0.88, 0.34], [0.88, 0.99, 0.99, 0.48], [1, 0.90, 0.95, 0.61]];
papaya.viewer.ColorTable.TABLE_RED2WHITE = [[0, 1, 0, 0], [1, 1, 1, 1]];
papaya.viewer.ColorTable.TABLE_GREEN2WHITE = [[0, 0, 1, 0], [1, 1, 1, 1]];
papaya.viewer.ColorTable.TABLE_BLUE2WHITE = [[0, 0, 0, 1], [1, 1, 1, 1]];
papaya.viewer.ColorTable.TABLE_ORANGE2WHITE = [[0, 1, 0.5, 0], [1, 1, 1, 1]];
papaya.viewer.ColorTable.TABLE_PURPLE2WHITE = [[0, 0.5, 0, 1], [1, 1, 1, 1]];
papaya.viewer.ColorTable.TABLE_RED2YELLOW = [[0, 1, 0, 0], [1, 1, 1, 0]];
papaya.viewer.ColorTable.TABLE_BLUE2GREEN = [[0, 0, 0, 1], [1, 0, 1, 0]];
papaya.viewer.ColorTable.MAP = {};
papaya.viewer.ColorTable.MAP[papaya.viewer.ColorTable.TABLE_GRAYSCALE_NAME] = papaya.viewer.ColorTable.TABLE_GRAYSCALE;
papaya.viewer.ColorTable.MAP[papaya.viewer.ColorTable.TABLE_SPECTRUM_NAME] = papaya.viewer.ColorTable.TABLE_SPECTRUM;
papaya.viewer.ColorTable.MAP[papaya.viewer.ColorTable.TABLE_RED2YELLOW_NAME] = papaya.viewer.ColorTable.TABLE_RED2YELLOW;
papaya.viewer.ColorTable.MAP[papaya.viewer.ColorTable.TABLE_BLUE2GREEN_NAME] = papaya.viewer.ColorTable.TABLE_BLUE2GREEN;
papaya.viewer.ColorTable.MAP[papaya.viewer.ColorTable.TABLE_HOTANDCOLD_NAME] = papaya.viewer.ColorTable.TABLE_HOTANDCOLD;
papaya.viewer.ColorTable.MAP[papaya.viewer.ColorTable.TABLE_GOLD_NAME] = papaya.viewer.ColorTable.TABLE_GOLD;
papaya.viewer.ColorTable.MAP[papaya.viewer.ColorTable.TABLE_RED2WHITE_NAME] = papaya.viewer.ColorTable.TABLE_RED2WHITE;
papaya.viewer.ColorTable.MAP[papaya.viewer.ColorTable.TABLE_GREEN2WHITE_NAME] = papaya.viewer.ColorTable.TABLE_GREEN2WHITE;
papaya.viewer.ColorTable.MAP[papaya.viewer.ColorTable.TABLE_BLUE2WHITE_NAME] = papaya.viewer.ColorTable.TABLE_BLUE2WHITE;
papaya.viewer.ColorTable.MAP[papaya.viewer.ColorTable.TABLE_ORANGE2WHITE_NAME] = papaya.viewer.ColorTable.TABLE_ORANGE2WHITE;
papaya.viewer.ColorTable.MAP[papaya.viewer.ColorTable.TABLE_PURPLE2WHITE_NAME] = papaya.viewer.ColorTable.TABLE_PURPLE2WHITE;
papaya.viewer.ColorTable.LUT_MIN = 0;
papaya.viewer.ColorTable.LUT_MAX = 255;
papaya.viewer.ColorTable.ICON_SIZE = 18;



papaya.viewer.ColorTable.prototype.updateLUT = function (maxLUTnew, minLUTnew) {
    var range, ctr, ctrKnot, value;

    this.maxLUT = maxLUTnew;
    this.minLUT = minLUTnew;
    range = this.maxLUT - this.minLUT;

    for (ctr = 0; ctr < this.lut.length; ctr += 1) {
        this.knotThresholds[ctr] = (this.lut[ctr][0] * range) + this.minLUT;
    }

    for (ctr = 0; ctr < (this.lut.length - 1); ctr += 1) {
        this.knotRangeRatios[ctr] = papaya.viewer.ColorTable.LUT_MAX / (this.knotThresholds[ctr + 1] - this.knotThresholds[ctr]);
    }

    for (ctr = 0; ctr < 256; ctr += 1) {
        if (ctr <= this.minLUT) {
            this.LUTarrayR[ctr] = this.knotMin[1] * papaya.viewer.ColorTable.LUT_MAX;
            this.LUTarrayG[ctr] = this.knotMin[2] * papaya.viewer.ColorTable.LUT_MAX;
            this.LUTarrayB[ctr] = this.knotMin[3] * papaya.viewer.ColorTable.LUT_MAX;
        } else if (ctr > this.maxLUT) {
            this.LUTarrayR[ctr] = this.knotMax[1] * papaya.viewer.ColorTable.LUT_MAX;
            this.LUTarrayG[ctr] = this.knotMax[2] * papaya.viewer.ColorTable.LUT_MAX;
            this.LUTarrayB[ctr] = this.knotMax[3] * papaya.viewer.ColorTable.LUT_MAX;
        } else {
            for (ctrKnot = 0; ctrKnot < (this.lut.length - 1); ctrKnot += 1) {
                if ((ctr > this.knotThresholds[ctrKnot]) && (ctr <= this.knotThresholds[ctrKnot + 1])) {
                    if (this.useGradation) {
                        value = (((ctr - this.knotThresholds[ctrKnot]) * this.knotRangeRatios[ctrKnot]) + 0.5) / papaya.viewer.ColorTable.LUT_MAX;

                        this.LUTarrayR[ctr] = (((1 - value) * this.lut[ctrKnot][1]) + (value * this.lut[ctrKnot + 1][1])) * papaya.viewer.ColorTable.LUT_MAX;
                        this.LUTarrayG[ctr] = (((1 - value) * this.lut[ctrKnot][2]) + (value * this.lut[ctrKnot + 1][2])) * papaya.viewer.ColorTable.LUT_MAX;
                        this.LUTarrayB[ctr] = (((1 - value) * this.lut[ctrKnot][3]) + (value * this.lut[ctrKnot + 1][3])) * papaya.viewer.ColorTable.LUT_MAX;
                    } else {
                        this.LUTarrayR[ctr] = (this.lut[ctrKnot][1]) * papaya.viewer.ColorTable.LUT_MAX;
                        this.LUTarrayG[ctr] = (this.lut[ctrKnot][2]) * papaya.viewer.ColorTable.LUT_MAX;
                        this.LUTarrayB[ctr] = (this.lut[ctrKnot][3]) * papaya.viewer.ColorTable.LUT_MAX;
                    }
                }
            }
        }
    }
};



papaya.viewer.ColorTable.prototype.lookupRed = function (index) {
    /*jslint bitwise: true */

    if ((index >= 0) && (index < 256)) {
        return (this.LUTarrayR[index] & 0xff);
    }

    return 0;
};



papaya.viewer.ColorTable.prototype.lookupGreen = function (index) {
    /*jslint bitwise: true */

    if ((index >= 0) && (index < 256)) {
        return (this.LUTarrayG[index] & 0xff);
    }

    return 0;
};



papaya.viewer.ColorTable.prototype.lookupBlue = function (index) {
    /*jslint bitwise: true */

    if ((index >= 0) && (index < 256)) {
        return (this.LUTarrayB[index] & 0xff);
    }

    return 0;
};



papaya.viewer.ColorTable.prototype.updateIcon = function () {
    var step, ctrY, ctrX, index, value;

    step = papaya.viewer.ColorTable.LUT_MAX / papaya.viewer.ColorTable.ICON_SIZE;

    for (ctrY = 0; ctrY < papaya.viewer.ColorTable.ICON_SIZE; ctrY += 1) {
        for (ctrX = 0; ctrX < papaya.viewer.ColorTable.ICON_SIZE; ctrX += 1) {
            index = ((ctrY * papaya.viewer.ColorTable.ICON_SIZE) + ctrX) * 4;
            value = Math.round(ctrX * step);

            this.imageData.data[index] = this.lookupRed(value);
            this.imageData.data[index + 1] = this.lookupGreen(value);
            this.imageData.data[index + 2] = this.lookupBlue(value);
            this.imageData.data[index + 3] = 255;
        }
    }

    this.context.putImageData(this.imageData, 0, 0);
    this.icon = this.canvas.toDataURL();
};
