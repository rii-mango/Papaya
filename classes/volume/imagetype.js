
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
    this.swapped = false;
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
