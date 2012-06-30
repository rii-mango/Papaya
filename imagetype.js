
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
 * @classDescription	The ImageType class stores information related to the datatype of this image.
 */
var papaya = papaya || {};
papaya.volume = papaya.volume || {};


/**
 * Constructor.
 * @param datatype {Numeric}	The datatype code.
 * @param numBytes {Numeric}	The number of bytes per voxel.
 * @param littleEndian {Boolean}	True if the data is in little endian byte order, false otherwise.
 */
papaya.volume.ImageType = papaya.volume.ImageType || function(datatype, numBytes, littleEndian) {
	// Public properties
	this.datatype = datatype;
	this.numBytes = numBytes;
	this.littleEndian = littleEndian;
}


// Public constants
papaya.volume.ImageType.DATATYPE_UNKNOWN = 0;
papaya.volume.ImageType.DATATYPE_INTEGER_SIGNED = 1;
papaya.volume.ImageType.DATATYPE_INTEGER_UNSIGNED = 2;
papaya.volume.ImageType.DATATYPE_FLOAT = 3;
papaya.volume.ImageType.MAX_NUM_BYTES_SUPPORTED = 4;


// Public methods

/**
 * Tests wheter this object has a valid state.
 * @return {Boolean}	true if state is valid
 */
papaya.volume.ImageType.prototype.isValid = function() {
	return ((this.datatype <= papaya.volume.ImageType.DATATYPE_FLOAT)
		&& (this.datatype > papaya.volume.ImageType.DATATYPE_UNKNOWN) && (this.numBytes > 0)
		&& (this.numBytes <= papaya.volume.ImageType.MAX_NUM_BYTES_SUPPORTED));
}
