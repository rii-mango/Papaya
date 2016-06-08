
/*jslint browser: true, node: true */
/*global */

"use strict";

/*** Imports ***/
var papaya = papaya || {};
papaya.volume = papaya.volume || {};


/*** Constructor ***/
papaya.volume.ImageData = papaya.volume.ImageData || function (pad) {
    this.data = null;
    this.pad = pad;
};


/*** Prototype Methods ***/

papaya.volume.ImageData.prototype.readFileData = function (header, buffer, onReadFinish) {
    var numVoxels, dv, ctr, numVoxels2, rgbBySample;

    if (this.pad) {
        buffer = this.padIsometric(header, buffer);
    }

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



papaya.volume.ImageData.prototype.padIsometric = function (header, data) {
    var id = header.imageDimensions,
        vd = header.voxelDimensions,
        numBytes = header.imageType.numBytes,
        buf = new Uint8Array(data, 0, data.byteLength),
        cols = id.colsOrig,
        rows = id.rowsOrig,
        slices = id.slicesOrig,
        colExt = (cols * vd.colSize),
        rowExt = (rows * vd.rowSize),
        sliceExt = (slices * vd.sliceSize),
        largestDim = Math.max(Math.max(colExt, rowExt), sliceExt),
        colDiff = parseInt((largestDim - colExt) / vd.colSize / 2, 10),
        rowDiff = parseInt((largestDim - rowExt) / vd.rowSize / 2, 10),
        sliceDiff = parseInt((largestDim - sliceExt) / vd.sliceSize / 2, 10),
        colsNew = (cols+2*colDiff),
        rowsNew = (rows+2*rowDiff),
        slicesNew = (slices+2*sliceDiff),
        colsBytes = cols * numBytes,
        colDiffBytes = colDiff * numBytes,
        rowDiffBytes = rowDiff * colsNew * numBytes,
        sliceDiffBytes = sliceDiff * (colsNew * rowsNew) * numBytes,
        indexPadded = 0,
        index = 0;

    var dataPaddedBuffer = new ArrayBuffer(colsNew * rowsNew * slicesNew * numBytes);
    var dataPadded = new Uint8Array(dataPaddedBuffer, 0, dataPaddedBuffer.byteLength);

    indexPadded += sliceDiffBytes;
    for (var ctrS = 0; ctrS < slices; ctrS += 1) {
        indexPadded += rowDiffBytes;

        for (var ctrR = 0; ctrR < rows; ctrR += 1) {
            indexPadded += colDiffBytes;

            for (var ctrC = 0; ctrC < colsBytes; ctrC += 1, index++, indexPadded++) {
                dataPadded[indexPadded] = buf[index];
            }

            indexPadded += colDiffBytes;
        }

        indexPadded += rowDiffBytes;
    }

    return dataPaddedBuffer;
};
