
/*jslint browser: true, node: true */
/*global */

"use strict";

/*** Imports ***/
var papaya = papaya || {};
papaya.volume = papaya.volume || {};


/*** Constructor ***/
papaya.volume.ImageData = papaya.volume.ImageData || function () {
    this.data = null;
};


/*** Prototype Methods ***/

papaya.volume.ImageData.prototype.readFileData = function (header, buffer, onReadFinish) {
    var numVoxels, dv, ctr;

    // create typed array
    if ((header.imageType.datatype === papaya.volume.ImageType.DATATYPE_INTEGER_SIGNED) &&
        (header.imageType.numBytes === 1)) {
        this.data = new Int8Array(buffer, 0, buffer.byteLength);
    } else if (((header.imageType.datatype === papaya.volume.ImageType.DATATYPE_INTEGER_UNSIGNED) &&
        (header.imageType.numBytes === 1)) || (header.imageType.datatype === papaya.volume.ImageType.DATATYPE_RGB)) {
        this.data = new Uint8Array(buffer, 0, buffer.byteLength);
    } else if ((header.imageType.datatype === papaya.volume.ImageType.DATATYPE_INTEGER_SIGNED) &&
        (header.imageType.numBytes === 2)) {
        this.data = new Int16Array(buffer, 0, buffer.byteLength / 2);
    } else if ((header.imageType.datatype === papaya.volume.ImageType.DATATYPE_INTEGER_UNSIGNED) &&
        (header.imageType.numBytes === 2)) {
        this.data = new Uint16Array(buffer, 0, buffer.byteLength / 2);
    } else if ((header.imageType.datatype === papaya.volume.ImageType.DATATYPE_INTEGER_SIGNED) &&
        (header.imageType.numBytes === 4)) {
        this.data = new Int32Array(buffer, 0, buffer.byteLength / 4);
    } else if ((header.imageType.datatype === papaya.volume.ImageType.DATATYPE_INTEGER_UNSIGNED) &&
        (header.imageType.numBytes === 4)) {
        this.data = new Uint32Array(buffer, 0, buffer.byteLength / 4);
    } else if ((header.imageType.datatype === papaya.volume.ImageType.DATATYPE_FLOAT) &&
        (header.imageType.numBytes === 4)) {
        if (header.imageType.swapped) {
            numVoxels = buffer.byteLength / 4;
            dv = new DataView(buffer, 0);
            this.data = new Float32Array(numVoxels);

            for (ctr = 0; ctr < numVoxels; ctr += 1) {
                this.data[ctr] = dv.getFloat32(ctr * Float32Array.BYTES_PER_ELEMENT);
            }
        } else {
            this.data = new Float32Array(buffer, 0, buffer.byteLength / 4);
        }
    }

    onReadFinish();
};
