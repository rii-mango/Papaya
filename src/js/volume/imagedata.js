
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
    var numVoxels, dv, ctr, numVoxels2, rgbBySample;

    // create typed array
    if (header.imageType.datatype === papaya.volume.ImageType.DATATYPE_RGB) {
        /*jslint bitwise: true */

        numVoxels = buffer.byteLength / 3;
        numVoxels2 = 2 * numVoxels;
        rgbBySample = header.imageType.rgbBySample;
        dv = new DataView(buffer, 0);
        this.data = new Uint32Array(numVoxels);

        if (rgbBySample) {
            for (ctr = 0; ctr < numVoxels; ctr += 1) {
                this.data[ctr] |= ((dv.getUint8(ctr) << 16));
            }

            for (ctr = 0; ctr < numVoxels; ctr += 1) {
                this.data[ctr] |= ((dv.getUint8(ctr + numVoxels) << 8));
            }

            for (ctr = 0; ctr < numVoxels; ctr += 1) {
                this.data[ctr] |= ((dv.getUint8(ctr + numVoxels2)));
            }
        } else {
            for (ctr = 0; ctr < numVoxels; ctr += 1) {
                this.data[ctr] = ((dv.getUint8(ctr * 3) << 16) | (dv.getUint8(ctr * 3 + 1) << 8) | dv.getUint8(ctr * 3 + 2));
            }
        }
    } else if ((header.imageType.datatype === papaya.volume.ImageType.DATATYPE_INTEGER_SIGNED) &&
        (header.imageType.numBytes === 1)) {
        this.data = new Int8Array(buffer, 0, buffer.byteLength);
    } else if ((header.imageType.datatype === papaya.volume.ImageType.DATATYPE_INTEGER_UNSIGNED) &&
        (header.imageType.numBytes === 1)) {
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
    } else if ((header.imageType.datatype === papaya.volume.ImageType.DATATYPE_FLOAT) && (header.imageType.numBytes === 4)) {
        if (header.imageType.swapped) {
            numVoxels = buffer.byteLength / Float32Array.BYTES_PER_ELEMENT;
            dv = new DataView(buffer, 0);
            this.data = new Float32Array(numVoxels);

            for (ctr = 0; ctr < numVoxels; ctr += 1) {
                this.data[ctr] = dv.getFloat32(ctr * Float32Array.BYTES_PER_ELEMENT);
            }
        } else {
            this.data = new Float32Array(buffer, 0, buffer.byteLength / 4);
        }
    } else if ((header.imageType.datatype === papaya.volume.ImageType.DATATYPE_FLOAT) && (header.imageType.numBytes === 8)) {
        if (header.imageType.swapped) {
            numVoxels = buffer.byteLength / Float64Array.BYTES_PER_ELEMENT;
            dv = new DataView(buffer, 0);
            this.data = new Float64Array(numVoxels);

            for (ctr = 0; ctr < numVoxels; ctr += 1) {
                this.data[ctr] = dv.getFloat64(ctr * Float64Array.BYTES_PER_ELEMENT);
            }
        } else {
            this.data = new Float64Array(buffer, 0, buffer.byteLength / 8);
        }
    }

    onReadFinish();
};
