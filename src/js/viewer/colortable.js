
/*jslint browser: true, node: true */
/*global */

"use strict";

/*** Imports ***/
var papaya = papaya || {};
papaya.viewer = papaya.viewer || {};


/*** Constructor ***/
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

    this.updateLUT(papaya.viewer.ColorTable.LUT_MIN, papaya.viewer.ColorTable.LUT_MAX);
    this.updateIcon();
    this.updateColorBar();
};


/*** Static Pseudo-constants ***/

papaya.viewer.ColorTable.TABLE_GRAYSCALE = {"name": "Grayscale", "data": [[0, 0, 0, 0], [1, 1, 1, 1]]};
papaya.viewer.ColorTable.TABLE_SPECTRUM = {"name": "Spectrum", "data": [[0, 0, 0, 0], [0.1, 0, 0, 1], [0.33, 0, 1, 1],
    [0.5, 0, 1, 0], [0.66, 1, 1, 0], [0.9, 1, 0, 0], [1, 1, 1, 1]]};
papaya.viewer.ColorTable.TABLE_RED2YELLOW = {"name": "Overlay (Positives)", "data": [[0, 1, 0, 0], [1, 1, 1, 0]]};
papaya.viewer.ColorTable.TABLE_BLUE2GREEN = {"name": "Overlay (Negatives)", "data": [[0, 0, 0, 1], [1, 0, 1, 0]]};
papaya.viewer.ColorTable.TABLE_HOTANDCOLD = {"name": "Hot-and-Cold", "data": [[0, 0, 0, 1], [0.15, 0, 1, 1],
    [0.3, 0, 1, 0], [0.45, 0, 0, 0], [0.5, 0, 0, 0], [0.55, 0, 0, 0], [0.7, 1, 1, 0], [0.85, 1, 0, 0], [1, 1, 1, 1]]};
papaya.viewer.ColorTable.TABLE_GOLD = {"name": "Gold", "data": [[0, 0, 0, 0], [0.13, 0.19, 0.03, 0],
    [0.25, 0.39, 0.12, 0], [0.38, 0.59, 0.26, 0], [0.50, 0.80, 0.46, 0.08], [0.63, 0.99, 0.71, 0.21],
    [0.75, 0.99, 0.88, 0.34], [0.88, 0.99, 0.99, 0.48], [1, 0.90, 0.95, 0.61]]};
papaya.viewer.ColorTable.TABLE_RED2WHITE = {"name": "Red Overlay", "data": [[0, 0.75, 0, 0], [0.5, 1, 0.5, 0],
    [0.95, 1, 1, 0], [1, 1, 1, 1]]};
papaya.viewer.ColorTable.TABLE_GREEN2WHITE = {"name": "Green Overlay", "data": [[0, 0, 0.75, 0], [0.5, 0.5, 1, 0],
    [0.95, 1, 1, 0], [1, 1, 1, 1]]};
papaya.viewer.ColorTable.TABLE_BLUE2WHITE = {"name": "Blue Overlay", "data": [[0, 0, 0, 1], [0.5, 0, 0.5, 1],
    [0.95, 0, 1, 1], [1, 1, 1, 1]]};

papaya.viewer.ColorTable.ARROW_ICON = "data:image/gif;base64,R0lGODlhCwARAPfGMf//////zP//mf//Zv//M///AP/M///MzP/Mmf/M" +
    "Zv/MM//MAP+Z//+ZzP+Zmf+ZZv+ZM/+ZAP9m//9mzP9mmf9mZv9mM/9mAP8z//8zzP8zmf8zZv8zM/8zAP8A//8AzP8Amf8AZv8AM/8AAMz//8z/" +
    "zMz/mcz/Zsz/M8z/AMzM/8zMzMzMmczMZszMM8zMAMyZ/8yZzMyZmcyZZsyZM8yZAMxm/8xmzMxmmcxmZsxmM8xmAMwz/8wzzMwzmcwzZswzM8wz" +
    "AMwA/8wAzMwAmcwAZswAM8wAAJn//5n/zJn/mZn/Zpn/M5n/AJnM/5nMzJnMmZnMZpnMM5nMAJmZ/5mZzJmZmZmZZpmZM5mZAJlm/5lmzJlmmZlm" +
    "ZplmM5lmAJkz/5kzzJkzmZkzZpkzM5kzAJkA/5kAzJkAmZkAZpkAM5kAAGb//2b/zGb/mWb/Zmb/M2b/AGbM/2bMzGbMmWbMZmbMM2bMAGaZ/2aZ" +
    "zGaZmWaZZmaZM2aZAGZm/2ZmzGZmmWZmZmZmM2ZmAGYz/2YzzGYzmWYzZmYzM2YzAGYA/2YAzGYAmWYAZmYAM2YAADP//zP/zDP/mTP/ZjP/MzP/" +
    "ADPM/zPMzDPMmTPMZjPMMzPMADOZ/zOZzDOZmTOZZjOZMzOZADNm/zNmzDNmmTNmZjNmMzNmADMz/zMzzDMzmTMzZjMzMzMzADMA/zMAzDMAmTMA" +
    "ZjMAMzMAAAD//wD/zAD/mQD/ZgD/MwD/AADM/wDMzADMmQDMZgDMMwDMAACZ/wCZzACZmQCZZgCZMwCZAABm/wBmzABmmQBmZgBmMwBmAAAz/wAz" +
    "zAAzmQAzZgAzMwAzAAAA/wAAzAAAmQAAZgAAM+4AAN0AALsAAKoAAIgAAHcAAFUAAEQAACIAABEAAADuAADdAAC7AACqAACIAAB3AABVAABEAAAi" +
    "AAARAAAA7gAA3QAAuwAAqgAAiAAAdwAAVQAARAAAIgAAEe7u7t3d3bu7u6qqqoiIiHd3d1VVVURERCIiIhEREQAAACH5BAEAAMYALAAAAAALABEA" +
    "AAg/AI0JFGhvoEGC+vodRKgv4UF7DSMqZBixoUKIFSv2w5jRIseOGztK/JgxpMiEJDWmHHkSZUuTIvvt60ezps2AADs=";
papaya.viewer.ColorTable.ARROW_ICON_WIDTH = 11;

papaya.viewer.ColorTable.DEFAULT_COLOR_TABLE = papaya.viewer.ColorTable.TABLE_GRAYSCALE;
papaya.viewer.ColorTable.PARAMETRIC_COLOR_TABLES = [papaya.viewer.ColorTable.TABLE_RED2YELLOW,
    papaya.viewer.ColorTable.TABLE_BLUE2GREEN];
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
papaya.viewer.ColorTable.COLOR_BAR_WIDTH = 100;
papaya.viewer.ColorTable.COLOR_BAR_HEIGHT = 15;


/*** Static Methods ***/

papaya.viewer.ColorTable.findLUT = function (name) {
    var ctr;

    for (ctr = 0; ctr < papaya.viewer.ColorTable.TABLE_ALL.length; ctr += 1) {
        if (papaya.viewer.ColorTable.TABLE_ALL[ctr].name === name) {
            return papaya.viewer.ColorTable.TABLE_ALL[ctr].data;
        }
    }

    return papaya.viewer.ColorTable.TABLE_GRAYSCALE.data;
};



papaya.viewer.ColorTable.addCustomLUT = function (lut) {
    if (papaya.viewer.ColorTable.findLUT(lut.name) === papaya.viewer.ColorTable.TABLE_GRAYSCALE.data) {
        papaya.viewer.ColorTable.TABLE_ALL.push(lut);
    }
};


/*** Prototype Methods ***/

papaya.viewer.ColorTable.prototype.updateMinLUT = function (minLUTnew) {
    this.updateLUT(minLUTnew, this.maxLUT);
};



papaya.viewer.ColorTable.prototype.updateMaxLUT = function (maxLUTnew) {
    this.updateLUT(this.minLUT, maxLUTnew);
};



papaya.viewer.ColorTable.prototype.updateLUT = function (minLUTnew, maxLUTnew) {
    var range, ctr, ctrKnot, value;

    this.maxLUT = maxLUTnew;
    this.minLUT = minLUTnew;
    range = this.maxLUT - this.minLUT;

    for (ctr = 0; ctr < this.lut.length; ctr += 1) {
        this.knotThresholds[ctr] = (this.lut[ctr][0] * range) + this.minLUT;
    }

    for (ctr = 0; ctr < (this.lut.length - 1); ctr += 1) {
        this.knotRangeRatios[ctr] = papaya.viewer.ColorTable.LUT_MAX / (this.knotThresholds[ctr + 1] -
            this.knotThresholds[ctr]);
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
                        value = (((ctr - this.knotThresholds[ctrKnot]) * this.knotRangeRatios[ctrKnot]) + 0.5) /
                            papaya.viewer.ColorTable.LUT_MAX;

                        this.LUTarrayR[ctr] = (((1 - value) * this.lut[ctrKnot][1]) +
                            (value * this.lut[ctrKnot + 1][1])) * papaya.viewer.ColorTable.LUT_MAX;
                        this.LUTarrayG[ctr] = (((1 - value) * this.lut[ctrKnot][2]) +
                            (value * this.lut[ctrKnot + 1][2])) * papaya.viewer.ColorTable.LUT_MAX;
                        this.LUTarrayB[ctr] = (((1 - value) * this.lut[ctrKnot][3]) +
                            (value * this.lut[ctrKnot + 1][3])) * papaya.viewer.ColorTable.LUT_MAX;
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

            this.imageDataIcon.data[index] = this.lookupRed(value);
            this.imageDataIcon.data[index + 1] = this.lookupGreen(value);
            this.imageDataIcon.data[index + 2] = this.lookupBlue(value);
            this.imageDataIcon.data[index + 3] = 255;
        }
    }

    this.contextIcon.putImageData(this.imageDataIcon, 0, 0);
    this.icon = this.canvasIcon.toDataURL();
};



papaya.viewer.ColorTable.prototype.updateColorBar = function () {
    var step, ctrY, ctrX, index, value;

    step = papaya.viewer.ColorTable.LUT_MAX / papaya.viewer.ColorTable.COLOR_BAR_WIDTH;

    for (ctrY = 0; ctrY < papaya.viewer.ColorTable.COLOR_BAR_HEIGHT; ctrY += 1) {
        for (ctrX = 0; ctrX < papaya.viewer.ColorTable.COLOR_BAR_WIDTH; ctrX += 1) {
            index = ((ctrY * papaya.viewer.ColorTable.COLOR_BAR_WIDTH) + ctrX) * 4;
            value = Math.round(ctrX * step);

            this.imageDataBar.data[index] = this.lookupRed(value);
            this.imageDataBar.data[index + 1] = this.lookupGreen(value);
            this.imageDataBar.data[index + 2] = this.lookupBlue(value);
            this.imageDataBar.data[index + 3] = 255;
        }
    }

    this.contextBar.putImageData(this.imageDataBar, 0, 0);
    this.colorBar = this.canvasBar.toDataURL();
};
