
/**
 * @classDescription	The Header class stores volume metadata.
 */
var papaya = papaya || {};
papaya.volume = papaya.volume || {};


/**
 * Constructor.
 */
papaya.volume.Header = papaya.volume.Header || function() {
	// Public properties
	this.fileFormat = null;
	this.imageDimensions = null;
	this.voxelDimensions = null;
	this.imageType = null;
	this.orientation = null;
	this.imageRange = null;
	this.errorMessage = null;
}


// Public constants
papaya.volume.Header.ERROR_UNRECOGNIZED_FORMAT = "This format is not recognized!";
papaya.volume.Header.INVALID_IMAGE_DIMENSIONS = "Image dimensions are not valid!";
papaya.volume.Header.INVALID_VOXEL_DIMENSIONS = "Voxel dimensions are not valid!";
papaya.volume.Header.INVALID_DATATYPE = "Datatype is not valid or not supported!";
papaya.volume.Header.INVALID_IMAGE_RANGE = "Image range is not valid!";


// Public methods

/**
 * Detect image header type, read header and store metadata.
 * @param {Numeric} headerType	The type of header to read.
 * @param {String} data	The binary string data that contains the header.
 */
papaya.volume.Header.prototype.readData = function(headerType, data) {
	if (headerType == papaya.volume.Volume.TYPE_NIFTI) {
		this.fileFormat = new papaya.volume.HeaderNIFTI();
		this.fileFormat.readData(data);

		if (this.fileFormat.hasError()) {
			this.errorMessage = this.fileFormat.errorMessage;
		}
	} else {
		this.errorMessage = papaya.volume.Header.ERROR_UNRECOGNIZED_FORMAT;
	}

	if (!this.hasError()) {
		this.imageDimensions = this.fileFormat.getImageDimensions();
		if (!this.imageDimensions.isValid()) {
			this.errorMessage = papaya.volume.Header.INVALID_IMAGE_DIMENSIONS;
		}

		this.voxelDimensions = this.fileFormat.getVoxelDimensions();
		if (!this.voxelDimensions.isValid()) {
			this.errorMessage = papaya.volume.Header.INVALID_VOXEL_DIMENSIONS;
		}

		this.imageType = this.fileFormat.getImageType();
		if (!this.imageType.isValid()) {
			this.errorMessage = papaya.volume.Header.INVALID_DATATYPE;
		}

		this.orientation = this.fileFormat.getOrientation();
		if (!this.orientation.isValid()) {
			this.orientation = new papaya.volume.Orientation(papaya.volume.Orientation.DEFAULT);
		}
		this.orientation.createInfo(this.imageDimensions, this.voxelDimensions);
		
		this.imageRange = this.fileFormat.getImageRange();
		if (!this.imageRange.isValid()) {
			this.errorMessage = papaya.volume.Header.INVALID_IMAGE_RANGE;
		}
	}
}


/**
 * Display an alert with formatted header data for debugging purposes.
 */
papaya.volume.Header.prototype.showHeader = function() {
	var imageDims = "Image Dimensions: " + this.imageDimensions.cols + " " + this.imageDimensions.rows + " " + this.imageDimensions.slices;
	var voxelDims = "Voxel Dimensions: " + this.voxelDimensions.colSize + " " + this.voxelDimensions.rowSize + " " + this.voxelDimensions.sliceSize;
	var datatype = "Datatype: " + this.imageType.numBytes + "-Byte ";

	if (this.imageType.datatype == papaya.volume.ImageType.DATATYPE_INTEGER_SIGNED) {
		datatype += "Integer (Signed)";
	} else if (this.imageType.datatype == papaya.volume.ImageType.DATATYPE_INTEGER_UNSIGNED) {
		datatype += "Integer (Unsigned)";
	} else if (this.imageType.datatype == papaya.volume.ImageType.DATATYPE_FLOAT) {
		datatype += "Float";
	} else if (this.imageType.datatype == papaya.volume.ImageType.DATATYPE_UNKNOWN) {
		datatype += "Unknown";
	}

	var range = "Range: " + this.imageRange.displayMin + " " + this.imageRange.displayMax;

	alert(imageDims + "\n" + voxelDims + "\n" + datatype + "\n" + range);
}


/**
 * Test whether this object is in errorMessage state.
 * @param {Boolean}	True if this object is in errorMessage state.
 */
papaya.volume.Header.prototype.hasError = function() {
	return (this.errorMessage != null);
}
