
/*jslint browser: true, node: true */
/*global */

"use strict";

/*** Imports ***/
var papaya = papaya || {};
papaya.volume = papaya.volume || {};


/*** Constructor ***/
papaya.volume.ImageType = papaya.volume.ImageType || function (datatype, numBytes, littleEndian, compressed) {
    this.datatype = datatype;
    this.numBytes = numBytes;
    this.littleEndian = littleEndian;
    this.swapped = false;
    this.compressed = compressed;
};


/*** Static Pseudo-constants ***/

papaya.volume.ImageType.DATATYPE_UNKNOWN = 0;
papaya.volume.ImageType.DATATYPE_INTEGER_SIGNED = 1;
papaya.volume.ImageType.DATATYPE_INTEGER_UNSIGNED = 2;
papaya.volume.ImageType.DATATYPE_FLOAT = 3;
papaya.volume.ImageType.DATATYPE_RGB = 4;
papaya.volume.ImageType.MAX_NUM_BYTES_SUPPORTED = 4;


/*** Prototype Methods ***/

papaya.volume.ImageType.prototype.isValid = function () {
    return ((this.datatype <= papaya.volume.ImageType.DATATYPE_RGB) &&
    (this.datatype > papaya.volume.ImageType.DATATYPE_UNKNOWN) && (this.numBytes > 0) &&
    (this.numBytes <= papaya.volume.ImageType.MAX_NUM_BYTES_SUPPORTED));
};



papaya.volume.ImageType.prototype.getTypeDescription = function () {
    if (this.datatype === papaya.volume.ImageType.DATATYPE_INTEGER_SIGNED) {
        return "Signed Integer";
    }

    if (this.datatype === papaya.volume.ImageType.DATATYPE_INTEGER_UNSIGNED) {
        return "Unsigned Integer";
    }

    if (this.datatype === papaya.volume.ImageType.DATATYPE_FLOAT) {
        return "Float";
    }

    if (this.datatype === papaya.volume.ImageType.DATATYPE_RGB) {
        return "RGB";
    }

    return "Unknown";
};



papaya.volume.ImageType.prototype.getOrderDescription = function () {
    if (this.numBytes > 1) {
        if (this.littleEndian) {
            return "Little Endian";
        }

        return "Big Endian";
    }

    return null;
};
