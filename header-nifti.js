
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
 * @classDescription	NIFTI header data type.  See http://nifti.nimh.nih.gov/nifti-1/ for more information.
 */
var papaya = papaya || {};
papaya.volume = papaya.volume || {};


/**
 * Constructor.
 */
papaya.volume.HeaderNIFTI = papaya.volume.HeaderNIFTI || function() {
	// Public properties
	this.nifti = null;
}


// Public constants
papaya.volume.HeaderNIFTI.ORIENTATION_DEFAULT = "XYZ+-++";


// Public methods

/**
 * Create NIFTI object and read header.
 * @param {String} data	The binary string containing header data.
 * @param {Boolean} compressed	True if the data is compressed, false otherwise.
 */
papaya.volume.HeaderNIFTI.prototype.readData = function(data, compressed) {
	this.nifti = new gov.nih.nifti.NIFTI();
	this.nifti.readData(data, compressed);
}


/**
 * Returns the image dimensions.
 * @return {Object}	image dimensions
 */
papaya.volume.HeaderNIFTI.prototype.getImageDimensions = function() {
	var id = new papaya.volume.ImageDimensions(this.nifti.dims[1], this.nifti.dims[2], this.nifti.dims[3], this.nifti.dims[4]);
	id.offset = gov.nih.nifti.MAGIC_COOKIE;
	return id;
}


/**
 * Returns the voxel dimensions.
 * @return {Object} voxel dimensions
 */
papaya.volume.HeaderNIFTI.prototype.getVoxelDimensions = function() {
	return new papaya.volume.VoxelDimensions(this.nifti.pixDims[1], this.nifti.pixDims[2], this.nifti.pixDims[3], this.nifti.pixDims[4]);
}


/**
 * Returns the image type.
 * @return {Object} image type
 */
papaya.volume.HeaderNIFTI.prototype.getImageType = function() {
	var datatype = papaya.volume.ImageType.DATATYPE_UNKNOWN;

	if ((this.nifti.datatypeCode == gov.nih.nifti.NIFTI_TYPE_UINT8) || (this.nifti.datatypeCode == gov.nih.nifti.NIFTI_TYPE_UINT16)
	|| (this.nifti.datatypeCode == gov.nih.nifti.NIFTI_TYPE_UINT32) || (this.nifti.datatypeCode == gov.nih.nifti.NIFTI_TYPE_UINT64)) {
		datatype = papaya.volume.ImageType.DATATYPE_INTEGER_UNSIGNED;
	} else if ((this.nifti.datatypeCode == gov.nih.nifti.NIFTI_TYPE_INT8) || (this.nifti.datatypeCode == gov.nih.nifti.NIFTI_TYPE_INT16)
	|| (this.nifti.datatypeCode == gov.nih.nifti.NIFTI_TYPE_INT32) || (this.nifti.datatypeCode == gov.nih.nifti.NIFTI_TYPE_INT64)) {
		datatype = papaya.volume.ImageType.DATATYPE_INTEGER_SIGNED;
	} else if ((this.nifti.datatypeCode == gov.nih.nifti.NIFTI_TYPE_FLOAT32) || (this.nifti.datatypeCode == gov.nih.nifti.NIFTI_TYPE_FLOAT64)) {
		datatype = papaya.volume.ImageType.DATATYPE_FLOAT;
	}

	return new papaya.volume.ImageType(datatype, this.nifti.numBitsPerVoxel / 8, this.nifti.littleEndian);
}


/**
 * Returns the orientation of this image (e.g., XYZ+--).
 * @return {String}	an orientation string
 */
papaya.volume.HeaderNIFTI.prototype.getOrientation = function() {
	var orientation = papaya.volume.HeaderNIFTI.ORIENTATION_DEFAULT;
	var qFormMatParams = this.nifti.convertNiftiQFormToNiftiSForm(this.nifti.quatern_b, this.nifti.quatern_c, this.nifti.quatern_d,
	this.nifti.qoffset_x, this.nifti.qoffset_y, this.nifti.qoffset_z, this.nifti.dims[1], this.nifti.dims[2], this.nifti.dims[3],
	this.nifti.dims[0]);

	if (this.nifti.qform_code > 0) {
		orientation = this.nifti.convertNiftiSFormToNEMA(qFormMatParams);
	}

	return new papaya.volume.Orientation(orientation);
}


/**
 * Returns the image range.
 * @return {ImageRange}	the image range object
 */
papaya.volume.HeaderNIFTI.prototype.getImageRange = function() {
	var ir = new papaya.volume.ImageRange(this.nifti.cal_min, this.nifti.cal_max);
	ir.setGlobalDataScale(this.nifti.scl_slope, this.nifti.scl_inter);
	return ir;
}


/**
 * Test whether this object is in error state.
 * @param {Boolean}	True if this object is in error state.
 */
papaya.volume.HeaderNIFTI.prototype.hasError = function() {
	return this.nifti.hasError();
}
