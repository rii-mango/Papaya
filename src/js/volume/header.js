
/*jslint browser: true, node: true */
/*global */

"use strict";

var papaya = papaya || {};
papaya.volume = papaya.volume || {};



papaya.volume.Header = papaya.volume.Header || function () {
    this.fileFormat = null;
    this.imageDimensions = null;
    this.voxelDimensions = null;
    this.imageDescription = null;
    this.imageType = null;
    this.orientation = null;
    this.imageRange = null;
    this.errorMessage = null;
    this.origin = null;
    this.orientationCertainty = papaya.volume.Header.ORIENTATION_CERTAINTY_UNKNOWN;
};



papaya.volume.Header.ERROR_UNRECOGNIZED_FORMAT = "This format is not recognized!";
papaya.volume.Header.INVALID_IMAGE_DIMENSIONS = "Image dimensions are not valid!";
papaya.volume.Header.INVALID_VOXEL_DIMENSIONS = "Voxel dimensions are not valid!";
papaya.volume.Header.INVALID_DATATYPE = "Datatype is not valid or not supported!";
papaya.volume.Header.INVALID_IMAGE_RANGE = "Image range is not valid!";
papaya.volume.Header.ORIENTATION_CERTAINTY_UNKNOWN = 0;
papaya.volume.Header.ORIENTATION_CERTAINTY_LOW = 1;
papaya.volume.Header.ORIENTATION_CERTAINTY_HIGH = 2;



papaya.volume.Header.prototype.readData = function (headerType, data, compressed) {
    if (headerType === papaya.volume.Volume.TYPE_NIFTI) {
        this.fileFormat = new papaya.volume.nifti.HeaderNIFTI();
        this.fileFormat.readData(data, compressed);

        if (this.fileFormat.hasError()) {
            this.errorMessage = this.fileFormat.errorMessage;
        }
    } else {
        this.errorMessage = papaya.volume.Header.ERROR_UNRECOGNIZED_FORMAT;
    }

    if (!this.hasError()) {
        this.imageType = this.fileFormat.getImageType();
        if (!this.imageType.isValid()) {
            this.errorMessage = papaya.volume.Header.INVALID_DATATYPE;
        }

        this.imageDimensions = this.fileFormat.getImageDimensions();
        if (!this.imageDimensions.isValid()) {
            this.errorMessage = papaya.volume.Header.INVALID_IMAGE_DIMENSIONS;
        }

        this.voxelDimensions = this.fileFormat.getVoxelDimensions(this.imageType.littleEndian);
        if (!this.voxelDimensions.isValid()) {
            this.errorMessage = papaya.volume.Header.INVALID_VOXEL_DIMENSIONS;
        }

        this.orientation = this.fileFormat.getOrientation();
        if (!this.orientation.isValid()) {
            this.orientation = new papaya.volume.Orientation(papaya.volume.Orientation.DEFAULT);
            this.orientationCertainty = papaya.volume.Header.ORIENTATION_CERTAINTY_UNKNOWN;
        } else {
            this.orientationCertainty = this.fileFormat.getOrientationCertainty();
        }

        this.orientation.createInfo(this.imageDimensions, this.voxelDimensions);

        this.origin = this.orientation.convertCoordinate(this.fileFormat.getOrigin(), new papaya.core.Coordinate(0, 0, 0));

        this.imageRange = this.fileFormat.getImageRange();
        if (!this.imageRange.isValid()) {
            this.errorMessage = papaya.volume.Header.INVALID_IMAGE_RANGE;
        }

        this.imageDescription = this.fileFormat.getImageDescription();
    }
};


papaya.volume.Header.prototype.hasError = function () {
    return (this.errorMessage !== null);
};



papaya.volume.Header.prototype.getBestTransform = function () {
    return this.fileFormat.getBestTransform();
};


papaya.volume.Header.prototype.getBestTransformOrigin = function () {
    return this.fileFormat.getBestTransformOrigin();
};
