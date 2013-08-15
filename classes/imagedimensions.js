/**
 * @classDescription    An ImageDimensions class stored row, columns, slice, and XYZ information.
 */
var papaya = papaya || {};
papaya.volume = papaya.volume || {};


/**
 * Constructor.
 * @param {Numeric} cols    The number of columns in this image.
 * @param {Numeric} rows    The number of rows in this image.
 * @param {Numeric} slices    The number of slices in this image.
 * @param {Numeric} timepoints    The number of timepoints in this image.
 */
papaya.volume.ImageDimensions = papaya.volume.ImageDimensions || function (cols, rows, slices, timepoints) {
    // Public properties
    this.cols = cols;
    this.rows = rows;
    this.slices = slices;
    this.xDim;
    this.yDim;
    this.zDim;
    this.timepoints = timepoints;
    this.offset = 0;  // offset of image data from start of file
}


// Public methods

/**
 * Returns the number of voxels in a volume.
 * @return {Numeric}    number of voxels in a volume
 */
papaya.volume.ImageDimensions.prototype.getNumVoxelsVolume = function () {
    return this.cols * this.rows * this.slices;
}


/**
 * Returns the number of voxels in a slice.
 * @return {Numeric}    number of voxels in a slice
 */
papaya.volume.ImageDimensions.prototype.getNumVoxelsSlice = function () {
    return this.rows * this.cols;
}


/**
 * Tests wheter this object has a valid state.
 * @return {Boolean}    true if state is valid
 */
papaya.volume.ImageDimensions.prototype.isValid = function () {
    return ((this.cols > 0) && (this.rows > 0) && (this.slices > 0) && (this.timepoints > 0) && (this.offset >= 0));
}
