
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
 * @classDescription	The Volume class represents a 3-D image volume dataset.  It contains namely a header and imageData objects.
 */
var papaya = papaya || {};
papaya.volume = papaya.volume || {};


/**
 * Constructor.
 */
papaya.volume.Volume = papaya.volume.Volume || function() {
	// Public properties
	this.file = null;
	this.fileName = null;
	this.compressed = false;
	this.headerType = papaya.volume.Volume.TYPE_UNKNOWN;
	this.header = new papaya.volume.Header();
	this.imageData = new papaya.volume.ImageData();
	this.rawData = null;
	this.onFinishedRead = null;
	this.errorMessage = null;
}


// Public constants
papaya.volume.Volume.TYPE_UNKNOWN = 0;
papaya.volume.Volume.TYPE_NIFTI = 1;


// Public methods

/**
 * Find the type of header file.
 * @param {String} filename
 * @return {Numberic}	the header type code
 */
papaya.volume.Volume.prototype.findFileType = function(filename) {
	if (filename.indexOf(".nii") != -1) {
		return papaya.volume.Volume.TYPE_NIFTI;
	} else {
		return papaya.volume.Volume.TYPE_UNKNOWN;
	}
}


/**
 * Determine if the file is compressed.
 * @param {String} filename
 * @return {Boolean}	true if the file is compressed, false otherwise
 */
papaya.volume.Volume.prototype.fileIsCompressed = function(filename) {
	return (filename.indexOf(".gz") != -1);
}


/**
 * Read image file.
 * @param {File} file	The file to read.
 * @param {Function} callback	The function to call after reading is complete.
 */
papaya.volume.Volume.prototype.readFile = function(file, callback) {
	this.file = file;
	this.fileName = new String(file.name);
	this.onFinishedRead = callback;

	this.headerType = this.findFileType(this.fileName);
	this.compressed = this.fileIsCompressed(this.fileName);

	fileLength = this.file.size;

	this.readData(this);
}


/**
 * Return a voxel value at a specified coordinate index.
 * @param {Numeric} ctrX	The X location.
 * @param {Numeric} ctrY	The Y location.
 * @param {Numeric} ctrZ	The Z location.
 * @return {Numeric}	The value at that coordinate index.
 */
papaya.volume.Volume.prototype.getVoxelAtIndex = function(ctrX, ctrY, ctrZ) {
	return this.imageData.data[this.header.orientation.convertIndexToOffset(ctrX, ctrY, ctrZ)];
}


/**
 * Test whether this object is in this.errorMessage state.
 * @param {Boolean}	True if this object is in this.errorMessage state.
 */
papaya.volume.Volume.prototype.hasError = function() {
	return (this.errorMessage != null);
}


/**
 * Returns the X dimension.
 * @return {Numeric}	the X dim
 */
papaya.volume.Volume.prototype.getXDim = function() {
	return this.header.imageDimensions.xDim;
}


/**
 * Returns the Y dimension.
 * @return {Numeric}	the Y dim
 */
papaya.volume.Volume.prototype.getYDim = function() {
	return this.header.imageDimensions.yDim;
}


/**
 * Returns the Z dimension.
 * @return {Numeric}	the Z dim
 */
papaya.volume.Volume.prototype.getZDim = function() {
	return this.header.imageDimensions.zDim;
}


/**
 * Returns the size of the voxel is X.
 * @return {Numeric}	the size of the voxel is X
 */
papaya.volume.Volume.prototype.getXSize = function() {
	return this.header.voxelDimensions.xSize;
}


/**
 * Returns the size of the voxel is Y.
 * @return {Numeric}	the size of the voxel is Y
 */
papaya.volume.Volume.prototype.getYSize = function() {
	return this.header.voxelDimensions.ySize;
}


/**
 * Returns the size of the voxel is Z.
 * @return {Numeric}	the size of the voxel is Z
 */
papaya.volume.Volume.prototype.getZSize = function() {
	return this.header.voxelDimensions.zSize;
}


/**
 * Read file data into volume.
 * @param {Volume} vol	the volume
 */
papaya.volume.Volume.prototype.readData = function(vol) {
	var reader = new FileReader();

	reader.onloadend = bind(vol, function(evt) {
		if (evt.target.readyState == FileReader.DONE) {
			vol.rawData = evt.target.result;
			setTimeout(function(){vol.decompress(vol)}, 0);
		}
	});
	
	var blob = makeSlice(vol.file, 0, vol.file.size);
	reader.readAsArrayBuffer(blob);
}


/**
 * Check if the data is compressed and decompress if so.
 * @param {Volume} vol	the volume
 */
papaya.volume.Volume.prototype.decompress = function(vol) {
	if (vol.compressed) {
		var gunzip = new papaya.utils.Gunzip();
		gunzip.gunzip(vol.rawData, function(data){vol.finishedDecompress(vol, data)});

		if (gunzip.hasError()) {
			vol.errorMessage = gunzip.getError();
			vol.finishedLoad();
		}
	} else {
		setTimeout(function(){vol.finishedReadData(vol)}, 0);
	}
}


/**
 * Callback to run after decompressing data.
 * @param {Volume} vol	the volume
 * @param {ArrayBuffer} data	the inflated buffer
 */
papaya.volume.Volume.prototype.finishedDecompress = function(vol, data) {
	vol.rawData = data;
	setTimeout(function(){vol.finishedReadData(vol)}, 0);
}


/**
 * Callback to run after reading data.
 * @param {Volume} vol	the volume
 */
papaya.volume.Volume.prototype.finishedReadData = function(vol) {
	vol.header.readData(vol.headerType, vol.rawData);
	if (vol.header.hasError()) {
		vol.errorMessage = vol.header.errorMessage;
		vol.onFinishedRead(vol);
		return;
	}

	vol.imageData.readData(vol.header, vol.rawData, bind(this, vol.finishedLoad));
}


/**
 * Callback to run after loading data is complete.
 */
papaya.volume.Volume.prototype.finishedLoad = function() {
	if (this.onFinishedRead) {
		this.rawData = null;
		this.onFinishedRead(this);
	}
}
