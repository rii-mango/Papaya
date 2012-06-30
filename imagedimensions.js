
/*
 * Copyright (c) 2012, RII-UTHSCSA
 * All rights reserved.

 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the 
 * following conditions are met:
 *
 *	- Redistributions of source code must retain the above copyright notice, this list of conditions and the following 
 *		disclaimer.
 *
 *	- Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the 
 *		following disclaimer in the documentation and/or other materials provided with the distribution.
 *
 *	- Neither the name of the RII-UTHSCSA nor the names of its contributors may be used to endorse or promote products 
 *		derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, 
 * INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, 
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR 
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, 
 * WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE 
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */


/**
 * @classDescription	An ImageDimensions class stored row, columns, slice, and XYZ information.
 */
var papaya = papaya || {};
papaya.volume = papaya.volume || {};


/**
 * Constructor.
 * @param {Numeric} cols	The number of columns in this image.
 * @param {Numeric} rows	The number of rows in this image.
 * @param {Numeric} slices	The number of slices in this image.
 * @param {Numeric} timepoints	The number of timepoints in this image.
 */
papaya.volume.ImageDimensions = papaya.volume.ImageDimensions || function(cols, rows, slices, timepoints) {
	// Public properties
	this.cols = cols;
	this.rows = rows;
	this.slices = slices;
	this.xDim; this.yDim; this.zDim;
	this.timepoints = timepoints;
	this.offset = 0;  // offset of image data from start of file
}


// Public methods

/**
 * Returns the number of voxels in a volume.
 * @return {Numeric}	number of voxels in a volume
 */
papaya.volume.ImageDimensions.prototype.getNumVoxelsVolume = function() {
	return this.cols * this.rows * this.slices;
}


/**
 * Returns the number of voxels in a slice.
 * @return {Numeric}	number of voxels in a slice
 */
papaya.volume.ImageDimensions.prototype.getNumVoxelsSlice = function() {
	return this.rows * this.cols;
}


/**
 * Tests wheter this object has a valid state.
 * @return {Boolean}	true if state is valid
 */
papaya.volume.ImageDimensions.prototype.isValid = function() {
	return ((this.cols > 0) && (this.rows > 0) && (this.slices > 0) && (this.timepoints > 0) && (this.offset >= 0));
}
