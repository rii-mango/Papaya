
/*jslint browser: true, node: true */
/*global daikon */

"use strict";

/*** Imports ***/
var papaya = papaya || {};
papaya.volume = papaya.volume || {};
papaya.volume.dicom = papaya.volume.dicom || {};


/*** Constructor ***/
papaya.volume.dicom.HeaderCornerstone = papaya.volume.dicom.HeaderCornerstone || function () {
    this.series = {};
    this.seriesMap = [];
    this.error = null;
    this.onFinishedHeaderRead = null;
    this.dialogHandler = null;
    // console.log('HeaderCornerstone co roi mai fen');
};

/*** Static Pseudo-constants ***/

papaya.volume.dicom.HeaderCornerstone.ORIENTATION_DEFAULT = "XYZ+--";
papaya.volume.dicom.HeaderCornerstone.SUPPORTED_TRANSFER_SYNTAXES = [
    // uncompressed
    "1.2.840.10008.1.2",
    "1.2.840.10008.1.2.1",
    "1.2.840.10008.1.2.2",

    // deflated
    "1.2.840.10008.1.2.1.99",

    // jpeg baseline compressed
    "1.2.840.10008.1.2.4.50",  // 8-bit
    "1.2.840.10008.1.2.4.51",  // 8-bit

    // jpeg lossless compressed
    "1.2.840.10008.1.2.4.57",
    "1.2.840.10008.1.2.4.70",  // selection 1

    // jpeg-LS compressed
    "1.2.840.10008.1.2.4.80",  // lossless
    "1.2.840.10008.1.2.4.81",

    // jpeg 2000 compressed
    "1.2.840.10008.1.2.4.90",  // lossless
    "1.2.840.10008.1.2.4.91",

    // rle compressed
    "1.2.840.10008.1.2.5"
];
papaya.volume.dicom.HeaderCornerstone.SLICE_DIRECTION_UNKNOWN = -1;
papaya.volume.dicom.HeaderCornerstone.SLICE_DIRECTION_AXIAL = 2;
papaya.volume.dicom.HeaderCornerstone.SLICE_DIRECTION_CORONAL = 1;
papaya.volume.dicom.HeaderCornerstone.SLICE_DIRECTION_SAGITTAL = 0;
papaya.volume.dicom.HeaderCornerstone.SLICE_DIRECTION_OBLIQUE = 3;
papaya.volume.dicom.HeaderCornerstone.OBLIQUITY_THRESHOLD_COSINE_VALUE = 0.8;

papaya.volume.dicom.HeaderCornerstone.BYTE_TYPE_UNKNOWN = 0;
papaya.volume.dicom.HeaderCornerstone.BYTE_TYPE_BINARY = 1;
papaya.volume.dicom.HeaderCornerstone.BYTE_TYPE_INTEGER = 2;
papaya.volume.dicom.HeaderCornerstone.BYTE_TYPE_INTEGER_UNSIGNED = 3;
papaya.volume.dicom.HeaderCornerstone.BYTE_TYPE_FLOAT = 4;
papaya.volume.dicom.HeaderCornerstone.BYTE_TYPE_COMPLEX = 5;
papaya.volume.dicom.HeaderCornerstone.BYTE_TYPE_RGB = 6;

papaya.volume.dicom.HeaderCornerstone.prototype.initSeries = function (series, data) {
    series.images = data;
    series.imagesOriginalOrder = null;
    series.isMosaic = false;
    series.isElscint = false;
    series.isCompressed = false;
    series.numberOfFrames = 0;
    series.numberOfFramesInFile = 0;
    series.isMultiFrame = false;
    series.isMultiFrameVolume = false;
    series.isMultiFrameTimeseries = false;
    series.isImplicitTimeseries = false;
    // series.sliceSense = false;
    series.sliceDir = this.getAcquiredSliceDirection(series.images[0]);
    series.sliceSense = this.calculateSliceSense(series);
    series.error = null;
};

papaya.volume.dicom.HeaderCornerstone.prototype.readHeaderData = function (data, progressMeter, dialogHandler,
    onFinishedHeaderRead) {
    // 22/05/2020
    // Assign callbacks, unused at the moment but preserving Papaya structure
    this.onFinishedHeaderRead = onFinishedHeaderRead;
    this.dialogHandler = dialogHandler;
    this.readNextHeaderData(data, papaya.utilities.ObjectUtils.bind(this, this.finishedHeaderRead));
};

papaya.volume.dicom.HeaderCornerstone.prototype.readNextHeaderData = function (data) {
    this.initSeries(this.series, data);
    console.log(this.series);
    this.onFinishedHeaderRead();
}

// functions called in header.js onFinishedHeaderRead
papaya.volume.dicom.HeaderCornerstone.prototype.getImageType = function () {
    var littleEndian, bytesPerElement, dataTypeCode, it;
    var image = this.series.images[0];
    dataTypeCode = this.getDataType(image);
    bytesPerElement = this.getBytesPerElement(image);
    littleEndian = true ; // cant get TransferSyntaxUID from Cornerstone metadata, doesn't matter anyway

    it = new papaya.volume.ImageType(dataTypeCode, bytesPerElement,
        littleEndian, false);

    // it.rgbBySample = (this.series.images[0].getPlanarConfig() === 1);
    return it;
};

papaya.volume.dicom.HeaderCornerstone.prototype.getImageDimensions = function () {
    // TODO: Support MOSAIC and MULTIFRAME
    var imageDimensions, numRows, numCols, bytesPerElement, size;
    numRows = this.series.images[0].rows;
    numCols = this.series.images[0].columns;
    bytesPerElement = this.getBytesPerElement(this.series.images[0]);

    imageDimensions = new papaya.volume.ImageDimensions(numCols,
        numRows, this.series.images.length, 1);

    size = parseInt((imageDimensions.getNumVoxelsSeries() * bytesPerElement) /
        this.series.images.length);

    for (ctr = 0; ctr < this.series.images.length; ctr += 1) {
        imageDimensions.dataOffsets[ctr] = 0; // TODO: check return undefined
        imageDimensions.dataLengths[ctr] = size;
    }
    return imageDimensions;
};

papaya.volume.dicom.HeaderCornerstone.prototype.getVoxelDimensions = function () {
    // TODO: Support MOSAIC and MULTIFRAME
    var voxelDimensions, sliceSpacing, sliceDis, pixelSpacing;
    var 
    pixelSpacing = (this.getPixelSpacing(this.series.images[0]) || [0, 0]);

    sliceSpacing = Math.max(this.getSliceGap(this.series.images[0]), this.getSliceThickness(this.series.images[0]));
    console.log('sliceSpacing: ', sliceSpacing);
    voxelDimensions = new papaya.volume.VoxelDimensions(pixelSpacing[1], pixelSpacing[0], sliceSpacing,
        this.getTR(this.series.images[0]) / 1000.0); 

    if (!voxelDimensions.isValid()) { // some DICOM images don't include voxel size?
        if (voxelDimensions.rowSize === 0) {
            voxelDimensions.rowSize = 1;
        }

        if (voxelDimensions.colSize === 0) {
            voxelDimensions.colSize = 1;
        }

        if (voxelDimensions.sliceSize === 0) {
            voxelDimensions.sliceSize = 1;
        }
    }

    voxelDimensions.spatialUnit = papaya.volume.VoxelDimensions.UNITS_MM;
    voxelDimensions.temporalUnit = papaya.volume.VoxelDimensions.UNITS_SEC;
    return voxelDimensions;
};

papaya.volume.dicom.HeaderCornerstone.prototype.getOrientation = function () {
    var orientation = this.getOrientationString(this.series.images[0]);

    if (orientation === null) {
        console.log('getOrientation NULL');
        orientation = papaya.volume.dicom.HeaderDICOM.ORIENTATION_DEFAULT;
    }

    // this fixes the cross-slice orientation sense (usually)
    orientation = orientation.substring(0, 5) + (this.series.sliceSense ? '+' : '-');
    
    orientation = new papaya.volume.Orientation(orientation);
    
    return orientation;
};

papaya.volume.dicom.HeaderCornerstone.prototype.getOrientationCertainty = function () {
    var orientation = this.getOrientationString(this.series.images[0]);

    if (orientation === null) {
        return papaya.volume.Header.ORIENTATION_CERTAINTY_UNKNOWN; // orientation could be found
    } else {
        if (this.series.isMosaic || this.series.isMultiFrameVolume) {
            return papaya.volume.Header.ORIENTATION_CERTAINTY_LOW;
        } else {
            return papaya.volume.Header.ORIENTATION_CERTAINTY_HIGH;
        }
    }
};

papaya.volume.dicom.HeaderCornerstone.prototype.getOrigin = function () {
    var m = this.getBestTransform();

    if (m) {
        var invm = numeric.inv(m);
        return new papaya.core.Coordinate(invm[0][3], invm[1][3], invm[2][3]);
    } else {
        console.log('getOrigin NULL matrix');
        return new papaya.core.Coordinate(0, 0, 0);
    }
};

papaya.volume.dicom.HeaderCornerstone.prototype.getImageRange = function () {
    var imageRange, gMax, gMin, min, max, ctr, image, windowWidth, windowCenter, center, width, imageDimensions,
        ctrInner, numMosaicSlicesVolume, numMosaicSlicesTotal, mosaicSlopes = [], mosaicIntercepts = [], numSlices,
        seriesSlopes, seriesIntercepts, ratio, numSlicesTotal, slopes = [], intercepts = [];

    gMax = 0;
    gMin = 0;

    for (ctr = 0; ctr < this.series.images.length; ctr += 1) {
        image = this.series.images[ctr];
        /** even though Cornerstone image has 'maxPixelValue' and 'minPixelValue' attributes
         *  it is different from the values in DICOM Tags a little
         * therefore, I used value from DICOM tag instead of the attributes in Cornerstone image
         */
        max = (this.getImageMax(image) * (image.slope || 1)) +
            (image.intercept || 0);
        min = (this.getImageMin(image) * (image.slope || 1)) +
            (image.intercept || 0);

        if (ctr === 0) {
            gMax = max;
            gMin = min;
        } else {
            if (max > gMax) {
                gMax = max;
            }

            if (min < gMin) {
                gMin = min;
            }
        }
    }

    windowWidth = 0;
    windowCenter = 0;

    for (ctr = 0; ctr < this.series.images.length; ctr += 1) {
        image = this.series.images[ctr];
        width = image.windowWidth;
        center = image.windowCenter;

        if (ctr === 0) {
            windowWidth = width;
            windowCenter = center;
        } else {
            if (windowCenter < center) {
                windowWidth = width;
                windowCenter = center;
            }
        }
    }

    imageRange = new papaya.volume.ImageRange(gMin, gMax);
    imageRange.displayMin = (windowCenter - (windowWidth / 2));
    imageRange.displayMax = (windowCenter + (windowWidth / 2));

    imageDimensions = this.getImageDimensions();

    if (this.series.isMosaic) {
        numMosaicSlicesVolume = imageDimensions.slices;
        numMosaicSlicesTotal = numMosaicSlicesVolume * this.series.images.length;

        for (ctr = 0; ctr < numMosaicSlicesTotal; ctr += 1) {
            image = this.series.images[parseInt(ctr / numMosaicSlicesVolume)];
            mosaicSlopes[ctr] = image.slope;
            mosaicIntercepts[ctr] = image.intercept;
        }

        imageRange.dataScaleSlopes = mosaicSlopes;
        imageRange.dataScaleIntercepts = mosaicIntercepts;
    } else if (this.series.isMultiFrame) {
        numSlices = imageDimensions.slices * imageDimensions.timepoints;
        seriesSlopes = [];
        seriesIntercepts = [];
        ratio = parseInt(numSlices / this.series.images.length);

        for (ctr = 0; ctr < this.series.images.length; ctr += 1) {
            for (ctrInner = 0; ctrInner < ratio; ctrInner += 1) {
                image = this.series.images[ctr];
                seriesSlopes[(ctr * ratio) + ctrInner] = image.slope;
                seriesIntercepts[(ctr * ratio) + ctrInner] = image.intercept;
            }
        }

        imageRange.dataScaleSlopes = seriesSlopes;
        imageRange.dataScaleIntercepts = seriesIntercepts;
    } else if (this.series.isImplicitTimeseries) {
        numSlicesTotal = imageDimensions.slices * imageDimensions.timepoints;
        if (this.series.images.length !== numSlicesTotal) {
            imageRange.setGlobalDataScale(this.series.images[0].slope,
                this.series.images[0].intercept,
                this.series.numberOfFrames);
        } else {
            for (ctr = 0; ctr < this.series.images.length; ctr += 1) {
                image = this.series.images[ctr];
                slopes[ctr] = image.slope;
                intercepts[ctr] = image.intercept;
            }

            imageRange.dataScaleSlopes = slopes;
            imageRange.dataScaleIntercepts = intercepts;
        }
    } else {
        for (ctr = 0; ctr < this.series.images.length; ctr += 1) {
            image = this.series.images[ctr];
            slopes[ctr] = image.slope;
            intercepts[ctr] = image.intercept;
        }

        imageRange.dataScaleSlopes = slopes;
        imageRange.dataScaleIntercepts = intercepts;
    }

    imageRange.validateDataScale();

    return imageRange;
};

papaya.volume.dicom.HeaderCornerstone.prototype.getImageDescription = function () {
    var patientName, patientID, studyTime, studyDate, imageDes, notes = '';
    var firstImage = this.series.images[0];

    patientName  = this.getPatientName(firstImage);
    patientID = this.getPatientID(firstImage);
    studyTime = this.getStudyTime(firstImage);
    studyDate = this.getStudyDate(firstImage);
    imageDes = this.getStudyDescription(firstImage);

    if (patientName) {
        notes += (" " + patientName);
    }

    if (patientID) {
        notes += (" " + patientID);
    }

    if (studyTime) {
        notes += (" " + studyTime);
    }

    if (studyDate) {
        notes += (" " + studyDate);
    }

    if (imageDes) {
        notes += (" " + imageDes);
    }
    return new papaya.volume.ImageDescription(notes.trim());
};

papaya.volume.dicom.HeaderCornerstone.prototype.getName = function () {
    var name = this.getSeriesDescription(this.series.images[0]);

    if (name) {
        return name;
    } else {
        return null;
    }
};

papaya.volume.dicom.HeaderCornerstone.prototype.readImageData = function (progressMeter, onFinishedImageRead) {
    this.concatenateImageData(progressMeter, onFinishedImageRead);
};
///////////
// Supporting functions
papaya.volume.dicom.HeaderCornerstone.prototype.getDataType = function (image) {
    // return image data type for Cornerstone image
    // Possible data type: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays
    var pixelData = image.getPixelData();
    var dataType = pixelData.constructor.name; // Ex: Uint16Array
    if (dataType === 'undefined') throw Error('Header-Cornerstone: Can not get Image data type');

    if (dataType === 'Int8Array' || dataType === 'Int16Array' || dataType === 'Int32Array') 
        return papaya.volume.ImageType.DATATYPE_INTEGER_SIGNED;
    else if (dataType === 'Uint8Array' || dataType === 'Uint8ClampedArray' || dataType === 'Uint16Array' || dataType === 'Uint32Array')
        return papaya.volume.ImageType.DATATYPE_INTEGER_UNSIGNED;
    else if (dataType === 'Float32Array' || dataType === 'Float64Array')
        return papaya.volume.ImageType.DATATYPE_FLOAT;
    else 
        return papaya.volume.ImageType.DATATYPE_UNKNOWN;
};

papaya.volume.dicom.HeaderCornerstone.prototype.getBytesPerElement = function (image) {
    var pixelData = image.getPixelData();
    var bytesPerElement = pixelData.BYTES_PER_ELEMENT; // Ex: 2 for 16 bits int array
    if (bytesPerElement === 'undefined') throw Error('Header-Cornerstone: Can not get Image data type');
    return bytesPerElement;
};

papaya.volume.dicom.HeaderCornerstone.prototype.getNumberOfSamplesPerPixel = function (image) {
    return this.getTag(image.metadata['00280002'], 0);
};

papaya.volume.dicom.HeaderCornerstone.prototype.getPixelSpacing = function (image) {
    return [image.rowPixelSpacing, image.columnPixelSpacing];
};

papaya.volume.dicom.HeaderCornerstone.prototype.getSliceThickness = function (image) {
    return this.getTag(image.metadata['00180050'], 0);
};

papaya.volume.dicom.HeaderCornerstone.prototype.getSliceGap = function (image) {
    return this.getTag(image.metadata['00180088'], 0);
};

papaya.volume.dicom.HeaderCornerstone.prototype.getTR = function (image) {
    return this.getTag(image.metadata['00180080'], 0);
};

papaya.volume.dicom.HeaderCornerstone.prototype.getImageDirections = function (image) {
    return this.getTag(image.metadata['00200037'], 'all');
};

papaya.volume.dicom.HeaderCornerstone.prototype.getImageLocation = function (image) {
    return this.getTag(image.metadata['00201041'], 0);
};

papaya.volume.dicom.HeaderCornerstone.prototype.getImagePosition = function (image) {
    return this.getTag(image.metadata['00200032'], 'all');
};

papaya.volume.dicom.HeaderCornerstone.prototype.getImageMax = function (image) {
    return this.getTag(image.metadata['00280107'], 0);
}

papaya.volume.dicom.HeaderCornerstone.prototype.getImageMin = function (image) {
    return this.getTag(image.metadata['00280106'], 0);
}

papaya.volume.dicom.HeaderCornerstone.prototype.getPatientName = function (image) {
    return this.getTag(image.metadata['00100010'], 0);
}

papaya.volume.dicom.HeaderCornerstone.prototype.getPatientID = function (image) {
    return this.getTag(image.metadata['00100020'], 0);
}

papaya.volume.dicom.HeaderCornerstone.prototype.getStudyTime = function (image) {
    return this.getTag(image.metadata['00080030'], 0);
}

papaya.volume.dicom.HeaderCornerstone.prototype.getStudyDate = function (image) {
    return this.getTag(image.metadata['00080020'], 0);
}

papaya.volume.dicom.HeaderCornerstone.prototype.getStudyDescription = function (image) {
    return this.getTag(image.metadata['00081030'], 0);
}

papaya.volume.dicom.HeaderCornerstone.prototype.getSeriesDescription = function (image) {
    return this.getTag(image.metadata['0008103E'], 0);
}

papaya.volume.dicom.HeaderCornerstone.prototype.getTag = function (tag, index) {
    // console.log('getTag', tag);
    if (tag && tag.Value) { // Must use tag.Value instead of tag.value
        if (index === 'all') return tag.Value;
        else return tag.Value[index];
    }

    return null;
};

papaya.volume.dicom.HeaderCornerstone.prototype.hasError = function () {
    return (this.error !== null);
};

/**
 * Returns an orientation string (e.g., XYZ+--).
 * @returns {string}
 * from Daikon.js
 */
papaya.volume.dicom.HeaderCornerstone.prototype.getOrientationString = function (image) {
    var orientation = null,
        dirCos = this.getImageDirections(image),
        ctr,
        spacing,
        rowSpacing,
        swapZ,
        bigRow = 0, bigCol = 0,
        biggest = 0, orient = '';

    if (!dirCos || (dirCos.length !== 6)) {
        return null;
    }

    spacing = this.getPixelSpacing(image);

    if (!spacing) {
        return null;
    }

    rowSpacing = spacing[0];
    swapZ = true;

    for (ctr = 0; ctr < 3; ctr += 1) {
        if (Math.abs(dirCos[ctr]) > biggest) {
            biggest = Math.abs(dirCos[ctr]);
            bigRow = ctr;
        }
    }

    biggest = 0;
    for (; ctr < 6; ctr += 1) {
        if (Math.abs(dirCos[ctr]) > biggest) {
            biggest = Math.abs(dirCos[ctr]);
            bigCol = ctr;
        }
    }

    switch (bigRow) {
        case 0:
            orient += ('X');
            if (bigCol === 4) {
                orient += ("YZ");
            } else {
                orient += ("ZY");
            }
            break;
        case 1:
            orient += ('Y');
            if (bigCol === 3) {
                orient += ("XZ");
            } else {
                orient += ("ZX");
            }
            break;
        case 2:
            orient += ('Z');
            if (bigCol === 3) {
                orient += ("XY");
            } else {
                orient += ("YX");
            }
            break;
        default:
            break;
    }

    switch (bigRow) {
        case 0:
            if (dirCos[bigRow] > 0.0) {
                orient += ('-');
            } else {
                orient += ('+');
            }
            if (bigCol === 4) {
                if (dirCos[bigCol] > 0.0) {
                    orient += ('-');
                } else {
                    orient += ('+');
                }
            } else {
                if (dirCos[bigCol] > 0.0) {
                    orient += ('+');
                } else {
                    orient += ('-');
                }
            }
            break;
        case 1:
            if (dirCos[bigRow] > 0.0) {
                orient += ('-');
            } else {
                orient += ('+');
            }
            if (bigCol === 3) {
                if (dirCos[bigCol] > 0.0) {
                    orient += ('-');
                } else {
                    orient += ('+');
                }
            } else {
                if (dirCos[bigCol] > 0.0) {
                    orient += ('+');
                } else {
                    orient += ('-');
                }
            }
            break;
        case 2:
            if (dirCos[bigRow] > 0.0) {
                orient += ('+');
            } else {
                orient += ('-');
            }
            //Has to be X or Y so opposite senses
            if (dirCos[bigCol] > 0.0) {
                orient += ('-');
            } else {
                orient += ('+');
            }
            break;
        default:
            break;
    }

    if (rowSpacing === 0.0) {
        orient += ('+');
        orientation = orient;
    } else {
        if (swapZ) {
            switch (orient.charAt(2)) {
                case 'X':
                    if (rowSpacing > 0.0) {
                        orient += ('-');
                    } else {
                        orient += ('+');
                    }
                    break;
                case 'Y':
                case 'Z':
                    if (rowSpacing > 0.0) {
                        orient += ('+');
                    } else {
                        orient += ('-');
                    }
                    break;
                default:
                    break;
            }
        } else {
            switch (orient.charAt(2)) {
                case 'X':
                    if (rowSpacing > 0.0) {
                        orient += ('+');
                    } else {
                        orient += ('-');
                    }
                    break;
                case 'Y':
                case 'Z':
                    if (rowSpacing > 0.0) {
                        orient += ('-');
                    } else {
                        orient += ('+');
                    }
                    break;
                default:
                    break;
            }
        }

        orientation = orient;
    }

    return orientation;
};

/**
 * Returns the image position value by index.
 * @param {number} sliceDir - the index
 * @returns {number}
 */
papaya.volume.dicom.HeaderCornerstone.prototype.getImagePositionSliceDir = function (image, sliceDir) {
    var imagePos = this.getImagePosition(image);
    if (imagePos) {
        if (sliceDir >= 0) {
            return imagePos[sliceDir];
        }
    }

    return 0;
};

papaya.volume.dicom.HeaderCornerstone.prototype.calculateSliceSense = function (series) {
    // getOrientation function require correct sliceSense value, I pulled this segment from Daikon.buildSeries function
    // TODO: Support MOSAIC and MULTIFRAME
    /*
    * "The direction of the axes is defined fully by the patient's orientation. The x-axis is increasing to the left hand side of the patient. The
    * y-axis is increasing to the posterior side of the patient. The z-axis is increasing toward the head of the patient."
    */
    var sliceLocationFirst, sliceLocationLast, sliceLocDiff;
    var sliceSense;
    sliceLocationFirst = this.getImagePositionSliceDir(series.images[0], series.sliceDir);
    sliceLocationLast = this.getImagePositionSliceDir(series.images[series.images.length - 1], series.sliceDir);
    sliceLocDiff = sliceLocationLast - sliceLocationFirst;
    if ((series.sliceDir === papaya.volume.dicom.HeaderCornerstone.SLICE_DIRECTION_SAGITTAL) || (series.sliceDir === papaya.volume.dicom.HeaderCornerstone.SLICE_DIRECTION_CORONAL)) {
        if (sliceLocDiff > 0) {
            sliceSense = false;
        } else {
            sliceSense = true;
        }
    } else {
        if (sliceLocDiff > 0) {
            sliceSense = true;
        } else {
            sliceSense = false;
        }
    }
    return sliceSense;
}

// originally from: http://public.kitware.com/pipermail/insight-users/2005-March/012246.html
papaya.volume.dicom.HeaderCornerstone.prototype.getAcquiredSliceDirection = function (image) {
    var dirCos, rowAxis, colAxis, label;

    dirCos = this.getImageDirections(image);

    if (!dirCos || (dirCos.length !== 6)) {
        return papaya.volume.dicom.HeaderCornerstone.SLICE_DIRECTION_UNKNOWN;
    }

    rowAxis = this.getMajorAxisFromPatientRelativeDirectionCosine(dirCos[0], dirCos[1], dirCos[2]);
    colAxis = this.getMajorAxisFromPatientRelativeDirectionCosine(dirCos[3], dirCos[4], dirCos[5]);

    if ((rowAxis !== null) && (colAxis !== null)) {
        if (((rowAxis === "R") || (rowAxis === "L")) && ((colAxis === "A") || (colAxis === "P"))) {
            label = papaya.volume.dicom.HeaderCornerstone.SLICE_DIRECTION_AXIAL;
        } else if (((colAxis === "R") || (colAxis === "L")) && ((rowAxis === "A") || (rowAxis === "P"))) {
            label = papaya.volume.dicom.HeaderCornerstone.SLICE_DIRECTION_AXIAL;
        } else if (((rowAxis === "R") || (rowAxis === "L")) && ((colAxis === "H") || (colAxis === "F"))) {
            label = papaya.volume.dicom.HeaderCornerstone.SLICE_DIRECTION_CORONAL;
        } else if (((colAxis === "R") || (colAxis === "L")) && ((rowAxis === "H") || (rowAxis === "F"))) {
            label = papaya.volume.dicom.HeaderCornerstone.SLICE_DIRECTION_CORONAL;
        } else if (((rowAxis === "A") || (rowAxis === "P")) && ((colAxis === "H") || (colAxis === "F"))) {
            label = papaya.volume.dicom.HeaderCornerstone.SLICE_DIRECTION_SAGITTAL;
        } else if (((colAxis === "A") || (colAxis === "P")) && ((rowAxis === "H") || (rowAxis === "F"))) {
            label = papaya.volume.dicom.HeaderCornerstone.SLICE_DIRECTION_SAGITTAL;
        }
    } else {
        label = papaya.volume.dicom.HeaderCornerstone.SLICE_DIRECTION_OBLIQUE;
    }

    return label;
};

// originally from: http://public.kitware.com/pipermail/insight-users/2005-March/012246.html
papaya.volume.dicom.HeaderCornerstone.prototype.getMajorAxisFromPatientRelativeDirectionCosine = function(x, y, z) {
    var axis, orientationX, orientationY, orientationZ, absX, absY, absZ;

    orientationX = (x < 0) ? "R" : "L";
    orientationY = (y < 0) ? "A" : "P";
    orientationZ = (z < 0) ? "F" : "H";

    absX = Math.abs(x);
    absY = Math.abs(y);
    absZ = Math.abs(z);

    // The tests here really don't need to check the other dimensions,
    // just the threshold, since the sum of the squares should be == 1.0
    // but just in case ...

    if ((absX > papaya.volume.dicom.HeaderCornerstone.OBLIQUITY_THRESHOLD_COSINE_VALUE) && (absX > absY) && (absX > absZ)) {
        axis = orientationX;
    } else if ((absY > papaya.volume.dicom.HeaderCornerstone.OBLIQUITY_THRESHOLD_COSINE_VALUE) && (absY > absX) && (absY > absZ)) {
        axis = orientationY;
    } else if ((absZ > papaya.volume.dicom.HeaderCornerstone.OBLIQUITY_THRESHOLD_COSINE_VALUE) && (absZ > absX) && (absZ > absY)) {
        axis = orientationZ;
    } else {
        axis = null;
    }

    return axis;
};

papaya.volume.dicom.HeaderCornerstone.prototype.getBestTransform = function () {
    var cosines = this.getImageDirections(this.series.images[0]),
        m = null;

    if (cosines) {
        var vs = this.getVoxelDimensions();
        var coord = this.getImagePosition(this.series.images[0]);
        var cosx = [cosines[0], cosines[1], cosines[2]];
        var cosy = [cosines[3], cosines[4], cosines[5]];
        var cosz = [cosx[1] * cosy[2] - cosx[2] * cosy[1],
            cosx[2] * cosy[0] - cosx[0] * cosy[2],
            cosx[0] * cosy[1] - cosx[1] * cosy[0]];
        m = [ [cosx[0] * vs.colSize * -1, cosy[0] * vs.rowSize, cosz[0] * vs.sliceSize, -1 * coord[0]],
            [cosx[1] * vs.colSize, cosy[1] * vs.rowSize * -1, cosz[1] * vs.sliceSize, -1 * coord[1]],
            [cosx[2] * vs.colSize, cosy[2] * vs.rowSize, cosz[2] * vs.sliceSize, coord[2]],
            [0,       0,       0,       1] ];
    }

    return m;
};

// merge Images data into one array
papaya.volume.dicom.HeaderCornerstone.prototype.concatenateImageData = function (progressMeter, onFinishedImageRead) {
    var buffer, data, length;
    var firstImage = this.series.images[0];
    // if (this.isMosaic) {
    //     data = this.getMosaicData(this.images[0], this.images[0].getPixelDataBytes());
    // } else {
    //     data = this.images[0].getPixelDataBytes();
    // }
    data = firstImage.getPixelData();
    length = this.validatePixelDataLength(firstImage);
    console.log('papaya-concatenateImageData', length,data);
    buffer = new Uint8Array(new ArrayBuffer(length * this.series.images.length));
    buffer.set(new Uint8Array(data.buffer, 0, length), 0);

    setTimeout(papaya.utilities.ObjectUtils.bind(this, function() { this.concatenateNextImageData(buffer, length, progressMeter, 1, onFinishedImageRead)}), 0);
};



papaya.volume.dicom.HeaderCornerstone.prototype.concatenateNextImageData = function (buffer, frameSize, progressMeter, index,
                                                             onFinishedImageRead) {
    var data, length;

    if (index >= this.series.images.length) {
        if (progressMeter) {
            progressMeter.drawProgress(1, "Reading DICOM Images");
        }

        onFinishedImageRead(buffer.buffer);
    } else {
        if (progressMeter) {
            progressMeter.drawProgress(index / this.series.images.length, "Reading DICOM Images");
        }

        
        data = this.series.images[index].getPixelData();

        length = this.validatePixelDataLength(this.series.images[index]);
        buffer.set(new Uint8Array(data.buffer, 0, length), (frameSize * index));

        setTimeout(papaya.utilities.ObjectUtils.bind(this, function() {this.concatenateNextImageData(buffer, frameSize, progressMeter,
            index + 1, onFinishedImageRead);}), 0);
    }
};

papaya.volume.dicom.HeaderCornerstone.prototype.getBestTransformOrigin = function () {
    return this.getOrigin();
};

papaya.volume.dicom.HeaderCornerstone.prototype.getSeriesLabels = function () {
    // header-dicom returns null so...
    return null;
};

papaya.volume.dicom.HeaderCornerstone.prototype.validatePixelDataLength = function (image) {
    var length = image.getPixelData().buffer.byteLength,
        sliceLength = image.columns * image.rows;

    // pixel data length should be divisible by slice size, if not, try to figure out correct pixel data length
    if ((length % sliceLength) === 0) {
        return length;
    }

    return sliceLength * 1 * this.getNumberOfSamplesPerPixel(image) * this.getBytesPerElement(image);
};