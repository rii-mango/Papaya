
/**
 * @classDescription	NIFTI header data type.  See http://nifti.nimh.nih.gov/nifti-1/ for more information.
 */
var papaya = papaya || {};
papaya.volume = papaya.volume || {};
papaya.volume.nifti = papaya.volume.nifti || {};


/**
 * Constructor.
 */
papaya.volume.nifti.HeaderNIFTI = papaya.volume.nifti.HeaderNIFTI || function() {
	// Public properties
	this.nifti = null;
    this.compressed = false;
}


// Public constants
papaya.volume.nifti.HeaderNIFTI.ORIENTATION_DEFAULT = "XYZ-++";


// Public methods

/**
 * Create NIFTI object and read header.
 * @param {String} data	The binary string containing header data.
 * @param {Boolean} compressed	True if the data is compressed, false otherwise.
 */
papaya.volume.nifti.HeaderNIFTI.prototype.readData = function(data, compressed) {
	this.nifti = new papaya.volume.nifti.NIFTI();
    this.compressed = compressed;
	this.nifti.readData(data);
}


/**
 * Returns the image dimensions.
 * @return {Object}	image dimensions
 */
papaya.volume.nifti.HeaderNIFTI.prototype.getImageDimensions = function() {
	var id = new papaya.volume.ImageDimensions(this.nifti.dims[1], this.nifti.dims[2], this.nifti.dims[3], this.nifti.dims[4]);
	id.offset = this.nifti.vox_offset;
	return id;
}


/**
 * Returns the voxel dimensions.
 * @return {Object} voxel dimensions
 */
papaya.volume.nifti.HeaderNIFTI.prototype.getVoxelDimensions = function() {
	return new papaya.volume.VoxelDimensions(this.nifti.pixDims[1], this.nifti.pixDims[2], this.nifti.pixDims[3], this.nifti.pixDims[4]);
}


/**
 * Returns the image type.
 * @return {Object} image type
 */
papaya.volume.nifti.HeaderNIFTI.prototype.getImageType = function() {
	var datatype = papaya.volume.ImageType.DATATYPE_UNKNOWN;

	if ((this.nifti.datatypeCode == papaya.volume.nifti.NIFTI_TYPE_UINT8) || (this.nifti.datatypeCode == papaya.volume.nifti.NIFTI_TYPE_UINT16)
	        || (this.nifti.datatypeCode == papaya.volume.nifti.NIFTI_TYPE_UINT32) || (this.nifti.datatypeCode == papaya.volume.nifti.NIFTI_TYPE_UINT64)) {
		datatype = papaya.volume.ImageType.DATATYPE_INTEGER_UNSIGNED;
	} else if ((this.nifti.datatypeCode == papaya.volume.nifti.NIFTI_TYPE_INT8) || (this.nifti.datatypeCode == papaya.volume.nifti.NIFTI_TYPE_INT16)
	        || (this.nifti.datatypeCode == papaya.volume.nifti.NIFTI_TYPE_INT32) || (this.nifti.datatypeCode == papaya.volume.nifti.NIFTI_TYPE_INT64)) {
		datatype = papaya.volume.ImageType.DATATYPE_INTEGER_SIGNED;
	} else if ((this.nifti.datatypeCode == papaya.volume.nifti.NIFTI_TYPE_FLOAT32) || (this.nifti.datatypeCode == papaya.volume.nifti.NIFTI_TYPE_FLOAT64)) {
		datatype = papaya.volume.ImageType.DATATYPE_FLOAT;
	}

	return new papaya.volume.ImageType(datatype, this.nifti.numBitsPerVoxel / 8, this.nifti.littleEndian, this.compressed);
}


/**
 * Returns the orientation of this image (e.g., XYZ+--).
 * @return {String}	an orientation string
 */

papaya.volume.nifti.HeaderNIFTI.prototype.getOrientation = function() {
	var orientation = null;

	if (this.nifti.qform_code > 0) {
		orientation = this.getOrientationQform();
	}

	if (this.nifti.sform_code > this.nifti.qform_code) {
		orientation = this.getOrientationSform();
	}

	if (orientation == null) {
		orientation = papaya.volume.nifti.HeaderNIFTI.ORIENTATION_DEFAULT;
	}

	return new papaya.volume.Orientation(orientation);
}




papaya.volume.nifti.HeaderNIFTI.prototype.getOrientationQform = function() {
	var orientation = papaya.volume.nifti.HeaderNIFTI.ORIENTATION_DEFAULT;
	var qFormMatParams = this.nifti.convertNiftiQFormToNiftiSForm(this.nifti.quatern_b, this.nifti.quatern_c, this.nifti.quatern_d,
	    this.nifti.qoffset_x, this.nifti.qoffset_y, this.nifti.qoffset_z, this.nifti.pixDims[1], this.nifti.pixDims[2], this.nifti.pixDims[3],
	    this.nifti.pixDims[0]);

	if (this.nifti.qform_code > 0) {
		orientation = this.nifti.convertNiftiSFormToNEMA(qFormMatParams);

		if (!papaya.volume.Orientation.prototype.isValidOrientationString(orientation)) {
			orientation = papaya.volume.nifti.HeaderNIFTI.ORIENTATION_DEFAULT;
		}
	} else {
		orientation = papaya.volume.nifti.HeaderNIFTI.ORIENTATION_DEFAULT;
	}

	return orientation;
}



papaya.volume.nifti.HeaderNIFTI.prototype.getOrientationSform = function() {
	var orientation = this.nifti.convertNiftiSFormToNEMA(this.nifti.affine);

	if (!papaya.volume.Orientation.prototype.isValidOrientationString(orientation)) {
		orientation = papaya.volume.nifti.HeaderNIFTI.ORIENTATION_DEFAULT;
	}

	return orientation;
}



papaya.volume.nifti.HeaderNIFTI.prototype.getOrigin = function() {
    var origin = new papaya.core.Coordinate(0, 0, 0);

    if (this.nifti.qform_code > 0) {
        var qFormMatParams = this.nifti.convertNiftiQFormToNiftiSForm(this.nifti.quatern_b, this.nifti.quatern_c, this.nifti.quatern_d,
            this.nifti.qoffset_x, this.nifti.qoffset_y, this.nifti.qoffset_z, this.nifti.pixDims[1], this.nifti.pixDims[2], this.nifti.pixDims[3],
            this.nifti.pixDims[0]);

        var orientation = this.nifti.convertNiftiSFormToNEMA(qFormMatParams);

        if (!papaya.volume.Orientation.prototype.isValidOrientationString(orientation)) {
            orientation = papaya.volume.nifti.HeaderNIFTI.ORIENTATION_DEFAULT;
        }

        var xOffset = this.nifti.qoffset_x * ((orientation.charAt(orientation.indexOf("X") + 3) == '+') ? -1 : 1);
        var yOffset = this.nifti.qoffset_y * ((orientation.charAt(orientation.indexOf("Y") + 3) == '+') ? 1 : -1);
        var zOffset = this.nifti.qoffset_z * ((orientation.charAt(orientation.indexOf("Z") + 3) == '+') ? 1 : -1);

        var someOffsets = new Array(3);
        someOffsets[0] = xOffset < 0 ? (this.nifti.dims[1] + (xOffset / this.nifti.pixDims[1])) : (xOffset / Math.abs(this.nifti.pixDims[1]));
        someOffsets[1] = yOffset > 0 ? (this.nifti.dims[2] - (yOffset / this.nifti.pixDims[2])) : (yOffset / Math.abs(this.nifti.pixDims[2])) * -1;
        someOffsets[2] = zOffset > 0 ? (this.nifti.dims[3] - (zOffset / this.nifti.pixDims[3])) : (zOffset / Math.abs(this.nifti.pixDims[3])) * -1;

        origin.setCoordinate(someOffsets[0], someOffsets[1], someOffsets[2], true);
    } else if (this.nifti.sform_code > 0) {
        var orientation = this.nifti.convertNiftiSFormToNEMA(this.nifti.affine);

        if (!papaya.volume.Orientation.prototype.isValidOrientationString(orientation)) {
            orientation = papaya.volume.nifti.HeaderNIFTI.ORIENTATION_DEFAULT;
        }

        var xOffset = this.nifti.affine[0][3] * ((orientation.charAt(orientation.indexOf("X") + 3) == '+') ? -1 : 1);
        var yOffset = this.nifti.affine[1][3] * ((orientation.charAt(orientation.indexOf("Y") + 3) == '+') ? 1 : -1);
        var zOffset = this.nifti.affine[2][3] * ((orientation.charAt(orientation.indexOf("Z") + 3) == '+') ? 1 : -1);

        var someOffsets = new Array(3);
        someOffsets[0] = xOffset < 0 ? (this.nifti.dims[1] + (xOffset / this.nifti.pixDims[1])) : (xOffset / Math.abs(this.nifti.pixDims[1]));
        someOffsets[1] = yOffset > 0 ? (this.nifti.dims[2] - (yOffset / this.nifti.pixDims[2])) : (yOffset / Math.abs(this.nifti.pixDims[2])) * -1;
        someOffsets[2] = zOffset > 0 ? (this.nifti.dims[3] - (zOffset / this.nifti.pixDims[3])) : (zOffset / Math.abs(this.nifti.pixDims[3])) * -1;

        origin.setCoordinate(someOffsets[0], someOffsets[1], someOffsets[2], true);
    } else if ((this.nifti.qform_code == 0) && (this.nifti.sform_code == 0)) {
        origin.setCoordinate(this.nifti.dims[1] / 2.0, this.nifti.dims[2] / 2.0, this.nifti.dims[3] / 2.0);
    }

    return origin;
}



/**
 * Returns the image range.
 * @return {ImageRange}	the image range object
 */
papaya.volume.nifti.HeaderNIFTI.prototype.getImageRange = function() {
	var ir = new papaya.volume.ImageRange(this.nifti.cal_min, this.nifti.cal_max);
	
	var slope = this.nifti.scl_slope;
	if (slope == 0) {
		slope = 1;
	}
	
	ir.setGlobalDataScale(slope, this.nifti.scl_inter);
	return ir;
}


/**
 * Test whether this object is in error state.
 * @param {Boolean}	True if this object is in error state.
 */
papaya.volume.nifti.HeaderNIFTI.prototype.hasError = function() {
	return this.nifti.hasError();
}



papaya.volume.nifti.HeaderNIFTI.prototype.getImageDescription = function() {
    return new papaya.volume.ImageDescription(this.nifti.description);
}