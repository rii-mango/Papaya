
/*jslint browser: true, node: true */
/*global */

"use strict";

var papaya = papaya || {};
papaya.volume = papaya.volume || {};


papaya.volume.ImageRange = papaya.volume.ImageRange || function (min, max) {
    this.displayMin = min;
    this.displayMax = max;
    this.imageMin = 0;
    this.imageMax = 0;
    this.globalScale = papaya.volume.ImageRange.DEFAULT_SCALE;
    this.globalIntercept = papaya.volume.ImageRange.DEFAULT_INTERCEPT;
};



papaya.volume.ImageRange.DEFAULT_SCALE = 1.0;
papaya.volume.ImageRange.DEFAULT_INTERCEPT = 0.0;



papaya.volume.ImageRange.prototype.isValid = function () {
    return true;
};



papaya.volume.ImageRange.prototype.setGlobalDataScale = function (scale, intercept) {
    this.globalScale = scale;
    this.globalIntercept = intercept;
};
