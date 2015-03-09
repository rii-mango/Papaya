
/*jslint browser: true, node: true */
/*global */

"use strict";

/*** Imports ***/
var papaya = papaya || {};
papaya.volume = papaya.volume || {};


/*** Constructor ***/
papaya.volume.ImageDimensions = papaya.volume.ImageDimensions || function (cols, rows, slices, timepoints) {
    this.cols = cols;
    this.rows = rows;
    this.slices = slices;
    this.xDim = -1;
    this.yDim = -1;
    this.zDim = -1;
    this.timepoints = timepoints || 1;
    this.dataOffsets = [];  // offset of image data from start of file
    this.dataLengths = [];  // length of image data
};


/*** Prototype Methods ***/

papaya.volume.ImageDimensions.prototype.getNumVoxelsSeries = function () {
    return this.cols * this.rows * this.slices * this.timepoints;
};



papaya.volume.ImageDimensions.prototype.getNumVoxelsSlice = function () {
    return this.rows * this.cols;
};



papaya.volume.ImageDimensions.prototype.getNumVoxelsVolume = function () {
    return this.rows * this.cols * this.slices;
};



papaya.volume.ImageDimensions.prototype.isValid = function () {
    return ((this.cols > 0) && (this.rows > 0) && (this.slices > 0) && (this.timepoints > 0) &&
        (this.dataOffsets[0] >= 0) && (this.dataLengths[0] >= 0));
};


/*** Exports ***/
var moduleType = typeof module;
if ((moduleType !== 'undefined') && module.exports) {
    module.exports.ImageDimensions = papaya.volume.ImageDimensions;
}
