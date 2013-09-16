
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
        if (header.imageType.swapped) {
            var numVoxels = header.imageDimensions.getNumVoxelsVolume();
            var dv = new DataView(rawData, header.imageDimensions.offset);
            this.data = new Float32Array(numVoxels);

            for (var ctr = 0; ctr < numVoxels; ctr++) {
                this.data[ctr] = dv.getFloat32(ctr * Float32Array.BYTES_PER_ELEMENT);
            }

        } else {
            this.data = new Float32Array(rawData, header.imageDimensions.offset, header.imageDimensions.getNumVoxelsVolume());
        }
	}

	onReadFinish();
}
