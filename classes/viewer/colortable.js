
/*jslint browser: true, node: true */
/*global */

"use strict";

var papaya = papaya || {};
papaya.viewer = papaya.viewer || {};



papaya.viewer.ColorTable = papaya.viewer.ColorTable || function (lutName, baseImage, gradation) {
    this.lut = papaya.viewer.ColorTable.findLUT(lutName);
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



papaya.viewer.ColorTable.TABLE_GRAYSCALE = {"name": "Grayscale", "data": [[0, 0, 0, 0], [1, 1, 1, 1]]};
papaya.viewer.ColorTable.TABLE_SPECTRUM = {"name": "Spectrum", "data": [[0, 0, 0, 0], [0.1, 0, 0, 1], [0.33, 0, 1, 1], [0.5, 0, 1, 0], [0.66, 1, 1, 0], [0.9, 1, 0, 0], [1, 1, 1, 1]]};
papaya.viewer.ColorTable.TABLE_RED2YELLOW = {"name": "Red-to-Yellow", "data": [[0, 1, 0, 0], [1, 1, 1, 0]]};
papaya.viewer.ColorTable.TABLE_BLUE2GREEN = {"name": "Blue-to-Green", "data": [[0, 0, 0, 1], [1, 0, 1, 0]]};
papaya.viewer.ColorTable.TABLE_HOTANDCOLD = {"name": "Hot-and-Cold", "data": [[0, 0, 0, 1], [0.15, 0, 1, 1], [0.3, 0, 1, 0], [0.45, 0, 0, 0], [0.5, 0, 0, 0], [0.55, 0, 0, 0], [0.7, 1, 1, 0], [0.85, 1, 0, 0], [1, 1, 1, 1]]};
papaya.viewer.ColorTable.TABLE_GOLD = {"name": "Gold", "data": [[0, 0, 0, 0], [0.13, 0.19, 0.03, 0], [0.25, 0.39, 0.12, 0], [0.38, 0.59, 0.26, 0], [0.50, 0.80, 0.46, 0.08], [0.63, 0.99, 0.71, 0.21], [0.75, 0.99, 0.88, 0.34], [0.88, 0.99, 0.99, 0.48], [1, 0.90, 0.95, 0.61]]};
papaya.viewer.ColorTable.TABLE_RED2WHITE = {"name": "Red Overlay", "data": [[0, 0.75, 0, 0], [0.5, 1, 0.5, 0], [0.95, 1, 1, 0], [1, 1, 1, 1]]};
papaya.viewer.ColorTable.TABLE_GREEN2WHITE = {"name": "Green Overlay", "data": [[0, 0, 0.75, 0], [0.5, 0.5, 1, 0], [0.95, 1, 1, 0], [1, 1, 1, 1]]};
papaya.viewer.ColorTable.TABLE_BLUE2WHITE = {"name": "Blue Overlay", "data": [[0, 0, 0, 1], [0.5, 0, 0.5, 1], [0.95, 0, 1, 1], [1, 1, 1, 1]]};

papaya.viewer.ColorTable.DEFAULT_COLOR_TABLE = papaya.viewer.ColorTable.TABLE_GRAYSCALE;
papaya.viewer.ColorTable.PARAMETRIC_COLOR_TABLES = [papaya.viewer.ColorTable.TABLE_RED2YELLOW, papaya.viewer.ColorTable.TABLE_BLUE2GREEN];
papaya.viewer.ColorTable.OVERLAY_COLOR_TABLES = [
    papaya.viewer.ColorTable.TABLE_RED2WHITE,
    papaya.viewer.ColorTable.TABLE_GREEN2WHITE,
    papaya.viewer.ColorTable.TABLE_BLUE2WHITE
];
papaya.viewer.ColorTable.TABLE_ALL = [
    papaya.viewer.ColorTable.TABLE_GRAYSCALE,
    papaya.viewer.ColorTable.TABLE_SPECTRUM,
    papaya.viewer.ColorTable.TABLE_RED2YELLOW,
    papaya.viewer.ColorTable.TABLE_BLUE2GREEN,
    papaya.viewer.ColorTable.TABLE_HOTANDCOLD,
    papaya.viewer.ColorTable.TABLE_GOLD,
    papaya.viewer.ColorTable.TABLE_RED2WHITE,
    papaya.viewer.ColorTable.TABLE_GREEN2WHITE,
    papaya.viewer.ColorTable.TABLE_BLUE2WHITE
];

papaya.viewer.ColorTable.LUT_MIN = 0;
papaya.viewer.ColorTable.LUT_MAX = 255;
papaya.viewer.ColorTable.ICON_SIZE = 18;



papaya.viewer.ColorTable.findLUT = function (name) {
    var ctr;

    for (ctr = 0; ctr < papaya.viewer.ColorTable.TABLE_ALL.length; ctr += 1) {
        if (papaya.viewer.ColorTable.TABLE_ALL[ctr].name === name) {
            return papaya.viewer.ColorTable.TABLE_ALL[ctr].data;
        }
    }

    return null;
};



papaya.viewer.ColorTable.addCustomLUT = function (lut) {
    if (papaya.viewer.ColorTable.findLUT(lut.name) === null) {
        papaya.viewer.ColorTable.TABLE_ALL.push(lut);
    }
};



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
