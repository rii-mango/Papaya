
/*jslint browser: true, node: true */
/*global */

"use strict";

/*** Imports ***/
var papaya = papaya || {};
papaya.volume = papaya.volume || {};


/*** Constructor ***/
papaya.volume.ImageRange = papaya.volume.ImageRange || function (min, max) {
    this.displayMin = min;
    this.displayMax = max;
    this.imageMin = 0;
    this.imageMax = 0;
    this.dataScaleSlopes = [];
    this.dataScaleIntercepts = [];
    this.globalDataScaleSlope = 1;
    this.globalDataScaleIntercept = 0;
    this.usesGlobalDataScale = false;
};


/*** Static Pseudo-constants ***/

papaya.volume.ImageRange.DEFAULT_SCALE = 1.0;
papaya.volume.ImageRange.DEFAULT_INTERCEPT = 0.0;


/*** Prototype Methods ***/

papaya.volume.ImageRange.prototype.isValid = function () {
    return true;
};



papaya.volume.ImageRange.prototype.setGlobalDataScale = function (scale, intercept) {
    this.globalDataScaleSlope = scale;
    this.globalDataScaleIntercept = intercept;
    this.usesGlobalDataScale = true;
    this.dataScaleSlopes = [];
    this.dataScaleIntercepts = [];
};



papaya.volume.ImageRange.prototype.validateDataScale = function () {
    var ctr, previous, foundSliceWiseDataScale = false;

    if ((this.globalDataScaleSlope !== 1) && (this.globalDataScaleIntercept !== 0)) {
        this.dataScaleSlopes = [];
        this.dataScaleIntercepts = [];
    } else if ((this.dataScaleSlopes.length > 0) && (this.dataScaleIntercepts.length > 0)) {
        previous = this.dataScaleSlopes[0];

        for (ctr = 1; ctr < this.dataScaleSlopes.length; ctr += 1) {
            if (previous !== this.dataScaleSlopes[ctr]) {
                foundSliceWiseDataScale = true;
                break;
            }
        }

        previous = this.dataScaleIntercepts[0];

        for (ctr = 1; ctr < this.dataScaleIntercepts.length; ctr += 1) {
            if (previous !== this.dataScaleIntercepts[ctr]) {
                foundSliceWiseDataScale = true;
                break;
            }
        }

        if (foundSliceWiseDataScale) {
            this.usesGlobalDataScale = false;
        } else {
            this.setGlobalDataScale(this.dataScaleSlopes[0], this.dataScaleIntercepts[0]);
        }
    } else {
        this.setGlobalDataScale(1, 0);
    }
};
