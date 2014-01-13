
/*jslint browser: true, node: true */
/*global Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, DataView, Float32Array */

"use strict";

var papaya = papaya || {};
papaya.volume = papaya.volume || {};



papaya.volume.ImageData = papaya.volume.ImageData || function () {
    this.data = null;
};



papaya.volume.ImageData.prototype.readData = function (header, rawData, onReadFinish) {
    var numVoxels, dv, ctr;

    if ((header.imageType.datatype === papaya.volume.ImageType.DATATYPE_INTEGER_SIGNED) && (header.imageType.numBytes === 1)) {
        this.data = new Int8Array(rawData, header.imageDimensions.offset, header.imageDimensions.getNumVoxelsSeries());
    } else if ((header.imageType.datatype === papaya.volume.ImageType.DATATYPE_INTEGER_UNSIGNED) && (header.imageType.numBytes === 1)) {
        this.data = new Uint8Array(rawData, header.imageDimensions.offset, header.imageDimensions.getNumVoxelsSeries());
    } else if ((header.imageType.datatype === papaya.volume.ImageType.DATATYPE_INTEGER_SIGNED) && (header.imageType.numBytes === 2)) {
        this.data = new Int16Array(rawData, header.imageDimensions.offset, header.imageDimensions.getNumVoxelsSeries());
    } else if ((header.imageType.datatype === papaya.volume.ImageType.DATATYPE_INTEGER_UNSIGNED) && (header.imageType.numBytes === 2)) {
        this.data = new Uint16Array(rawData, header.imageDimensions.offset, header.imageDimensions.getNumVoxelsSeries());
    } else if ((header.imageType.datatype === papaya.volume.ImageType.DATATYPE_INTEGER_SIGNED) && (header.imageType.numBytes === 4)) {
        this.data = new Int32Array(rawData, header.imageDimensions.offset, header.imageDimensions.getNumVoxelsSeries());
    } else if ((header.imageType.datatype === papaya.volume.ImageType.DATATYPE_INTEGER_UNSIGNED) && (header.imageType.numBytes === 4)) {
        this.data = new Uint32Array(rawData, header.imageDimensions.offset, header.imageDimensions.getNumVoxelsSeries());
    } else if ((header.imageType.datatype === papaya.volume.ImageType.DATATYPE_FLOAT) && (header.imageType.numBytes === 4)) {
        if (header.imageType.swapped) {
            numVoxels = header.imageDimensions.getNumVoxelsSeries();
            dv = new DataView(rawData, header.imageDimensions.offset);
            this.data = new Float32Array(numVoxels);

            for (ctr = 0; ctr < numVoxels; ctr += 1) {
                this.data[ctr] = dv.getFloat32(ctr * Float32Array.BYTES_PER_ELEMENT);
            }

        } else {
            this.data = new Float32Array(rawData, header.imageDimensions.offset, header.imageDimensions.getNumVoxelsSeries());
        }
    }

    onReadFinish();
};
