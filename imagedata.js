
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
 * @classDescription	The ImageData class reads and stores image data.
 */
var papaya = papaya || {};
papaya.volume = papaya.volume || {};


/**
 * Constructor.
 */
papaya.volume.ImageData = papaya.volume.ImageData || function() {
	// Public properties
	this.data = null;
}


// Public methods

/**
 * Read data.
 * @param {papaya.volume.Header} header	The associated header of this image data.
 * @param {ArrayBuffer} rawData	The raw data as an array buffer.
 * @param {Function} onReadFinish	The callback function.
 */
papaya.volume.ImageData.prototype.readData = function(header, rawData, onReadFinish) {
	if ((header.imageType.datatype == papaya.volume.ImageType.DATATYPE_INTEGER_SIGNED) && (header.imageType.numBytes == 1)) {
		this.data = new Int8Array(rawData, header.imageDimensions.offset, header.imageDimensions.getNumVoxelsVolume());
	} else if ((header.imageType.datatype == papaya.volume.ImageType.DATATYPE_INTEGER_UNSIGNED) && (header.imageType.numBytes == 1)) {
		this.data = new Uint8Array(rawData, header.imageDimensions.offset, header.imageDimensions.getNumVoxelsVolume());
	} else if ((header.imageType.datatype == papaya.volume.ImageType.DATATYPE_INTEGER_SIGNED) && (header.imageType.numBytes == 2)) {
		this.data = new Int16Array(rawData, header.imageDimensions.offset, header.imageDimensions.getNumVoxelsVolume());
	} else if ((header.imageType.datatype == papaya.volume.ImageType.DATATYPE_INTEGER_UNSIGNED) && (header.imageType.numBytes == 2)) {
		this.data = new Uint16Array(rawData, header.imageDimensions.offset, header.imageDimensions.getNumVoxelsVolume());
	} else if ((header.imageType.datatype == papaya.volume.ImageType.DATATYPE_INTEGER_SIGNED) && (header.imageType.numBytes == 4)) {
		this.data = new Int32Array(rawData, header.imageDimensions.offset, header.imageDimensions.getNumVoxelsVolume());
	} else if ((header.imageType.datatype == papaya.volume.ImageType.DATATYPE_INTEGER_UNSIGNED) && (header.imageType.numBytes == 4)) {
		this.data = new Uint32Array(rawData, header.imageDimensions.offset, header.imageDimensions.getNumVoxelsVolume());
	} else if ((header.imageType.datatype == papaya.volume.ImageType.DATATYPE_FLOAT) && (header.imageType.numBytes == 4)) {
		this.data = new Float32Array(rawData, header.imageDimensions.offset, header.imageDimensions.getNumVoxelsVolume());
	}

	onReadFinish();
}
