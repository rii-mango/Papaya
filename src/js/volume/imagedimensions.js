
/*jslint browser: true, node: true */
/*global */

"use strict";

var papaya = papaya || {};
papaya.volume = papaya.volume || {};



papaya.volume.ImageDimensions = papaya.volume.ImageDimensions || function (cols, rows, slices, timepoints) {
    this.cols = cols;
    this.rows = rows;
    this.slices = slices;
    this.xDim = -1;
    this.yDim = -1;
    this.zDim = -1;
    this.timepoints = timepoints || 1;
    this.offset = 0;  // offset of image data from start of file
};



papaya.volume.ImageDimensions.prototype.getNumVoxelsSeries = function () {
    return this.cols * this.rows * this.slices * this.timepoints;
};


papaya.volume.ImageDimensions.prototype.getNumVoxelsSlice = function () {
    return this.rows * this.cols;
};



papaya.volume.ImageDimensions.prototype.isValid = function () {
    return ((this.cols > 0) && (this.rows > 0) && (this.slices > 0) && (this.timepoints > 0) && (this.offset >= 0));
};


var moduleType = typeof module;
if ((moduleType !== 'undefined') && module.exports) {
    module.exports.ImageDimensions = papaya.volume.ImageDimensions;
}
