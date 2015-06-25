
/*jslint browser: true, node: true */
/*global daikon */

"use strict";

/*** Imports ***/
var papaya = papaya || {};
papaya.volume = papaya.volume || {};
papaya.volume.dicom = papaya.volume.dicom || {};


/*** Constructor ***/
papaya.volume.dicom.HeaderDICOM = papaya.volume.dicom.HeaderDICOM || function () {
    this.series = null;
    this.seriesMap = [];
    this.error = null;
    this.onFinishedHeaderRead = null;
    this.dialogHandler = null;
};


/*** Static Pseudo-constants ***/

papaya.volume.dicom.HeaderDICOM.ORIENTATION_DEFAULT = "XYZ+--";
papaya.volume.dicom.HeaderDICOM.SUPPORTED_TRANSFER_SYNTAXES = [
    // uncompressed
    "1.2.840.10008.1.2",
    "1.2.840.10008.1.2.1",
    "1.2.840.10008.1.2.2",

    // jpeg baseline compressed
    "1.2.840.10008.1.2.4.50",  // 8-bit

    // jpeg lossless compressed
    "1.2.840.10008.1.2.4.57",
    "1.2.840.10008.1.2.4.70",  // selection 1

    // jpeg 2000 compressed
    "1.2.840.10008.1.2.4.90",  // lossless
    "1.2.840.10008.1.2.4.91",

    // rle compressed
    "1.2.840.10008.1.2.5"
];


/*** Static Methods ***/

papaya.volume.dicom.HeaderDICOM.isThisFormat = function (filename, data) {
    var buf, offset, magicCookieLength, ctr, cookieCtr = 0, parser, tag;

    // check extension
    if (filename.indexOf(".dcm") !== -1) {
        return true;
    }

    // check for magic number
    buf = new DataView(data[0]);
    offset = daikon.Parser.MAGIC_COOKIE_OFFSET;
    magicCookieLength = daikon.Parser.MAGIC_COOKIE.length;

    for (ctr = 0; ctr < magicCookieLength; ctr += 1) {
        if (buf.getUint8(offset + ctr) === daikon.Parser.MAGIC_COOKIE[ctr]) {
            cookieCtr += 1;
        }
    }

    if (cookieCtr === 4) {
        return true;
    }

    // ok, last shot -- some DICOM don't contain magic number, check for valid tags...
    parser = new daikon.Parser();
    tag = parser.testForValidTag(buf);

    return ((tag !== null) && (tag.group <= 0x0008) && !parser.hasError());
};


/*** Prototype Methods ***/

papaya.volume.dicom.HeaderDICOM.prototype.setSeries = function (name, value) {
    var ctr;

    for (ctr = 0; ctr < Object.keys(this.seriesMap).length; ctr += 1) {
        if (Object.keys(this.seriesMap)[ctr].indexOf(value) !== -1) {
            this.series = this.seriesMap[Object.keys(this.seriesMap)[ctr]];
            break;
        }
    }
};



papaya.volume.dicom.HeaderDICOM.prototype.getDataScaleSlope = function (isElscint, image) {
    if (isElscint) {
        return (image.getDataScaleElscint() || 1);
    }

    return (image.getDataScaleSlope() || 1);
};



papaya.volume.dicom.HeaderDICOM.prototype.getDataScaleIntercept = function (isElscint, image) {
    if (isElscint) {
        return 0;
    }

    return (image.getDataScaleIntercept() || 0);
};



papaya.volume.dicom.HeaderDICOM.prototype.finishedHeaderRead = function () {
    var dialogData, allSeries, ctr;

    if (Object.keys(this.seriesMap).length > 1) {
        this.series = this.seriesMap[Object.keys(this.seriesMap)[0]];

        allSeries = [];
        for (ctr = 0; ctr < Object.keys(this.seriesMap).length; ctr += 1) {
            allSeries.push(this.seriesMap[Object.keys(this.seriesMap)[ctr]]);
        }

        dialogData = {
            "items": [
                {"label": "Select:", "field": "series", "options": allSeries}
            ]
        };

        this.dialogHandler.showDialog("Select DICOM Series", dialogData, this, papaya.utilities.ObjectUtils.bind(this, this.setSeries),
            papaya.utilities.ObjectUtils.bind(this, this.finishedSeriesSelection));
    } else {
        this.series = this.seriesMap[Object.keys(this.seriesMap)[0]];

        if (this.series.images.length > 0) {
            this.series.buildSeries();

            if (!this.isTransferSyntaxSupported()) {
                this.error = new Error("This transfer syntax is currently not supported!");
            }
        } else {
            this.error = new Error("No images found!");
        }

        this.onFinishedHeaderRead();
    }
};



papaya.volume.dicom.HeaderDICOM.prototype.isTransferSyntaxSupported = function () {
    var transferSyntax = this.series.images[0].getTransferSyntax();

    return (papaya.utilities.StringUtils.isStringBlank(transferSyntax) ||
        papaya.utilities.ArrayUtils.contains(papaya.volume.dicom.HeaderDICOM.SUPPORTED_TRANSFER_SYNTAXES,
            transferSyntax));
};



papaya.volume.dicom.HeaderDICOM.prototype.finishedSeriesSelection = function () {
    if (this.series.images.length > 0) {
        this.series.buildSeries();

        if (!this.isTransferSyntaxSupported()) {
            this.error = new Error("This transfer syntax is currently not supported!");
        }
    } else {
        this.error = new Error("No images found!");
    }

    this.seriesMap = null;

    this.onFinishedHeaderRead();
};



papaya.volume.dicom.HeaderDICOM.prototype.readHeaderData = function (data, progressMeter, dialogHandler,
                                                                     onFinishedHeaderRead) {
    this.onFinishedHeaderRead = onFinishedHeaderRead;
    this.dialogHandler = dialogHandler;
    this.readNextHeaderData(data, 0, progressMeter, papaya.utilities.ObjectUtils.bind(this, this.finishedHeaderRead));
};



papaya.volume.dicom.HeaderDICOM.prototype.readNextHeaderData = function (data, index, progressMeter,
                                                                         onFinishedHeaderRead) {
    var image, series;

    if (index >= data.length) {
        progressMeter.drawProgress(1, "Reading DICOM Headers");
        onFinishedHeaderRead();
    } else {
        image = daikon.Series.parseImage(new DataView(data[index]));

        if (image === null) {
            this.error = daikon.Series.parserError;
        } else if (image.hasPixelData()) {
            series = this.findSeries(image.getSeriesId());

            if (!series) {
                series = new daikon.Series();
                this.seriesMap[image.getSeriesId()] = series;
            }

            series.addImage(image);
        }

        if (this.error) {
            onFinishedHeaderRead();
        } else {
            progressMeter.drawProgress(index / data.length, "Reading DICOM Headers");
            setTimeout(function() {this.readNextHeaderData(data, index + 1, progressMeter,
                onFinishedHeaderRead);}.bind(this), 0);
        }
    }
};



papaya.volume.dicom.HeaderDICOM.prototype.getName = function () {
    var name = this.series.getName();

    if (name) {
        return name;
    } else {
        return null;
    }
};



papaya.volume.dicom.HeaderDICOM.prototype.findSeries = function (id) {
    if (Object.keys(this.seriesMap).length === 0) {
        return null;
    } else {
        return this.seriesMap[id];
    }
};



papaya.volume.dicom.HeaderDICOM.prototype.readImageData = function (progressMeter, onFinishedImageRead) {
    this.series.concatenateImageData(progressMeter, onFinishedImageRead);
};



papaya.volume.dicom.HeaderDICOM.prototype.getImageDimensions = function () {
    var imageDimensions, numberOfSlices, ctr, size;

    if (this.series.isMosaic) {
        numberOfSlices = this.series.images[0].getMosaicCols() * this.series.images[0].getMosaicRows();
        imageDimensions = new papaya.volume.ImageDimensions(parseInt(this.series.images[0].getCols() /
            this.series.images[0].getMosaicCols()),
            parseInt(this.series.images[0].getRows() / this.series.images[0].getMosaicRows()), numberOfSlices,
            this.series.images.length);
    } else if (this.series.isMultiFrameVolume) {
        imageDimensions = new papaya.volume.ImageDimensions(this.series.images[0].getCols(),
            this.series.images[0].getRows(), this.series.numberOfFrames, 1);
    } else if (this.series.isMultiFrameTimeseries) {
        imageDimensions = new papaya.volume.ImageDimensions(this.series.images[0].getCols(),
            this.series.images[0].getRows(), this.series.numberOfFramesInFile, this.series.numberOfFrames);
    } else if (this.series.isImplicitTimeseries) {
        imageDimensions = new papaya.volume.ImageDimensions(this.series.images[0].getCols(),
            this.series.images[0].getRows(), parseInt(this.series.images.length / this.series.numberOfFrames),
            this.series.numberOfFrames);
    } else {
        imageDimensions = new papaya.volume.ImageDimensions(this.series.images[0].getCols(),
            this.series.images[0].getRows(), this.series.images.length, 1);
    }

    size = parseInt((imageDimensions.getNumVoxelsSeries() * parseInt(this.series.images[0].getBitsAllocated() / 8)) /
        this.series.images.length);

    for (ctr = 0; ctr < this.series.images.length; ctr += 1) {
        imageDimensions.dataOffsets[ctr] = this.series.images[ctr].getPixelData().offsetValue;
        imageDimensions.dataLengths[ctr] = size;
    }

    return imageDimensions;
};



papaya.volume.dicom.HeaderDICOM.prototype.getVoxelDimensions = function () {
    var voxelDimensions, sliceSpacing, sliceDis, pixelSpacing;

    pixelSpacing = (this.series.images[0].getPixelSpacing() || [0, 0]);

    sliceSpacing = Math.max(this.series.images[0].getSliceGap(), this.series.images[0].getSliceThickness());

    if (this.series.isMosaic || this.series.isMultiFrame) {
        voxelDimensions = new papaya.volume.VoxelDimensions(pixelSpacing[1], pixelSpacing[0], sliceSpacing,
            this.series.images[0].getTR() / 1000.0);
    } else {
        if (this.series.images.length === 1) {
            voxelDimensions = new papaya.volume.VoxelDimensions(pixelSpacing[1], pixelSpacing[0], sliceSpacing,
                this.series.images[0].getTR() / 1000.0);
        } else {
            sliceDis = Math.abs(this.series.images[0].getSliceLocation() - this.series.images[1].getSliceLocation());

            if (sliceDis === 0) {
                sliceDis = this.series.images[0].getSliceThickness();
            }

            voxelDimensions = new papaya.volume.VoxelDimensions(pixelSpacing[1], pixelSpacing[0], sliceDis,
                this.series.images[0].getTR() / 1000.0);
        }
    }

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



papaya.volume.dicom.HeaderDICOM.prototype.getImageType = function () {
    var dataTypeDICOM, dataTypeCode;
    dataTypeDICOM = this.series.images[0].getDataType();

    if (dataTypeDICOM === daikon.Image.BYTE_TYPE_INTEGER) {
        dataTypeCode = papaya.volume.ImageType.DATATYPE_INTEGER_SIGNED;
    } else if (dataTypeDICOM === daikon.Image.BYTE_TYPE_INTEGER_UNSIGNED) {
        dataTypeCode = papaya.volume.ImageType.DATATYPE_INTEGER_UNSIGNED;
    } else if (dataTypeDICOM === daikon.Image.BYTE_TYPE_FLOAT) {
        dataTypeCode = papaya.volume.ImageType.DATATYPE_FLOAT;
    } else if (dataTypeDICOM === daikon.Image.BYTE_TYPE_RGB) {
        dataTypeCode = papaya.volume.ImageType.DATATYPE_RGB;
    } else {
        dataTypeCode = papaya.volume.ImageType.DATATYPE_UNKNOWN;
    }

    return new papaya.volume.ImageType(dataTypeCode, parseInt(this.series.images[0].getBitsAllocated() / 8),
        this.series.images[0].littleEndian, false);
};



papaya.volume.dicom.HeaderDICOM.prototype.getImageRange = function () {
    var imageRange, gMax, gMin, min, max, ctr, image, windowWidth, windowCenter, center, width, imageDimensions,
        ctrInner, numMosaicSlicesVolume, numMosaicSlicesTotal, mosaicSlopes = [], mosaicIntercepts = [], numSlices,
        seriesSlopes, seriesIntercepts, ratio, numSlicesTotal, slopes = [], intercepts = [];

    gMax = 0;
    gMin = 0;

    for (ctr = 0; ctr < this.series.images.length; ctr += 1) {
        image = this.series.images[ctr];
        max = (image.getImageMax() * this.getDataScaleSlope(this.series.isElscint, image)) +
            (image.getDataScaleIntercept() || 0);
        min = (image.getImageMin() * this.getDataScaleSlope(this.series.isElscint, image)) +
            (image.getDataScaleIntercept() || 0);

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

    if (this.series.isElscint) { // Elscint calculates data scales differently
        for (ctr = 0; ctr < this.series.images.length; ctr += 1) {
            image = this.series.images[ctr];
            width = image.getWindowWidth() * image.getDataScaleElscint();
            center = image.getWindowCenter() * image.getDataScaleElscint();

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
    } else {
        for (ctr = 0; ctr < this.series.images.length; ctr += 1) {
            image = this.series.images[ctr];
            width = image.getWindowWidth();
            center = image.getWindowCenter();

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
            mosaicSlopes[ctr] = this.getDataScaleSlope(this.series.isElscint, image);
            mosaicIntercepts[ctr] = this.getDataScaleIntercept(this.series.isElscint, image);
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
                seriesSlopes[(ctr * ratio) + ctrInner] = this.getDataScaleSlope(this.series.isElscint, image);
                seriesIntercepts[(ctr * ratio) + ctrInner] = this.getDataScaleIntercept(this.series.isElscint, image);
            }
        }

        imageRange.dataScaleSlopes = seriesSlopes;
        imageRange.dataScaleIntercepts = seriesIntercepts;
    } else if (this.series.isImplicitTimeseries) {
        numSlicesTotal = imageDimensions.slices * imageDimensions.timepoints;
        if (this.series.images.length !== numSlicesTotal) {
            imageRange.setGlobalDataScale(this.getDataScaleSlope(this.series.isElscint, this.series.images[0]),
                this.getDataScaleIntercept(this.series.isElscint, this.series.images[0]),
                this.series.numberOfFrames);
        } else {
            for (ctr = 0; ctr < this.series.images.length; ctr += 1) {
                image = this.series.images[ctr];
                slopes[ctr] = this.getDataScaleSlope(this.series.isElscint, image);
                intercepts[ctr] = this.getDataScaleIntercept(this.series.isElscint, image);
            }

            imageRange.dataScaleSlopes = slopes;
            imageRange.dataScaleIntercepts = intercepts;
        }
    } else {
        for (ctr = 0; ctr < this.series.images.length; ctr += 1) {
            image = this.series.images[ctr];
            slopes[ctr] = this.getDataScaleSlope(this.series.isElscint, image);
            intercepts[ctr] = this.getDataScaleIntercept(this.series.isElscint, image);
        }

        imageRange.dataScaleSlopes = slopes;
        imageRange.dataScaleIntercepts = intercepts;
    }

    imageRange.validateDataScale();

    return imageRange;
};



papaya.volume.dicom.HeaderDICOM.prototype.getOrientation = function () {
    var orientation = this.series.images[0].getOrientation();

    if (orientation === null) {
        orientation = papaya.volume.dicom.HeaderDICOM.ORIENTATION_DEFAULT;
    }

    // this fixes the cross-slice orientation sense (usually)
    orientation = orientation.substring(0, 5) + (this.series.sliceSense ? '+' : '-');

    return new papaya.volume.Orientation(orientation);
};



papaya.volume.dicom.HeaderDICOM.prototype.getOrientationCertainty = function () {
    var orientation = this.series.images[0].getOrientation();

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



papaya.volume.dicom.HeaderDICOM.prototype.getOrigin = function () {
    return new papaya.core.Coordinate(0, 0, 0);
};



papaya.volume.dicom.HeaderDICOM.prototype.hasError = function () {
    return (this.error !== null);
};



papaya.volume.dicom.HeaderDICOM.prototype.getImageDescription = function () {
    var patientName, patientID, studyTime, studyDate, imageDes, notes = '';

    patientName  = this.series.images[0].getPatientName();
    patientID = this.series.images[0].getPatientID();
    studyTime = this.series.images[0].getStudyTime();
    studyDate = this.series.images[0].getStudyDate();
    imageDes = this.series.images[0].getImageDescription();

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




papaya.volume.dicom.HeaderDICOM.prototype.getBestTransform = function () {
    return null;
};



papaya.volume.dicom.HeaderDICOM.prototype.getBestTransformOrigin = function () {
    return null;
};



papaya.volume.dicom.HeaderDICOM.prototype.toString = function () {
    return this.series.images[0].toString();
};
