
/*jslint browser: true, node: true */
/*global numeric */

"use strict";

/*** Imports ***/
var papaya = papaya || {};
papaya.volume = papaya.volume || {};
papaya.volume.nifti = papaya.volume.nifti || {};


/*** Constructor ***/
papaya.volume.nifti.HeaderNIFTI = papaya.volume.nifti.HeaderNIFTI || function () {
    this.nifti = null;
    this.compressed = false;
    this.imageData = null;
};


/*** Static Pseudo-constants ***/

papaya.volume.nifti.HeaderNIFTI.ORIENTATION_DEFAULT = "XYZ-++";
papaya.volume.nifti.HeaderNIFTI.SPATIAL_UNITS_MASK = 0x07;
papaya.volume.nifti.HeaderNIFTI.TEMPORAL_UNITS_MASK = 0x38;


/*** Static Methods ***/

papaya.volume.nifti.HeaderNIFTI.isThisFormat = function (filename, data) {
    var buf, mag1, mag2, mag3;

    if (filename.indexOf(".nii") !== -1) {
        return true;
    }

    buf = new DataView(data[0]);
    mag1 = buf.getUint8(papaya.volume.nifti.MAGIC_NUMBER_LOCATION);
    mag2 = buf.getUint8(papaya.volume.nifti.MAGIC_NUMBER_LOCATION + 1);
    mag3 = buf.getUint8(papaya.volume.nifti.MAGIC_NUMBER_LOCATION + 2);

    return !!((mag1 === papaya.volume.nifti.MAGIC_NUMBER[0]) && (mag2 === papaya.volume.nifti.MAGIC_NUMBER[1]) &&
    (mag3 === papaya.volume.nifti.MAGIC_NUMBER[2]));
};


/*** Prototype Methods ***/

papaya.volume.nifti.HeaderNIFTI.prototype.readHeaderData = function (data, progressMeter, dialogHandler,
                                                                     onFinishedHeaderRead) {
    var imageDimensions;
    this.nifti = new papaya.volume.nifti.NIFTI();
    this.nifti.readFileData(data[0]);

    imageDimensions = this.getImageDimensions();
    this.imageData = data[0].slice(imageDimensions.dataOffsets[0], imageDimensions.dataOffsets[0] +
    imageDimensions.dataLengths[0]);
    onFinishedHeaderRead();
};



papaya.volume.nifti.HeaderNIFTI.prototype.readImageData = function (progressMeter, onFinishedImageRead) {
    onFinishedImageRead(this.imageData);
    this.imageData = null;
};



papaya.volume.nifti.HeaderNIFTI.prototype.getImageDimensions = function () {
    var id = new papaya.volume.ImageDimensions(this.nifti.dims[1], this.nifti.dims[2], this.nifti.dims[3],
        this.nifti.dims[4]);
    id.dataOffsets[0] = this.nifti.vox_offset;
    id.dataLengths[0] = (id.getNumVoxelsSeries() * (this.nifti.numBitsPerVoxel / 8));

    return id;
};



papaya.volume.nifti.HeaderNIFTI.prototype.getName = function () {
    return null;
};



papaya.volume.nifti.HeaderNIFTI.prototype.getVoxelDimensions = function () {
    /*jslint bitwise: true */
    var vd;

    vd = new papaya.volume.VoxelDimensions(this.nifti.pixDims[1], this.nifti.pixDims[2], this.nifti.pixDims[3],
        this.nifti.pixDims[4]);

    vd.spatialUnit = (this.nifti.xyzt_units & papaya.volume.nifti.HeaderNIFTI.SPATIAL_UNITS_MASK);
    vd.temporalUnit = (this.nifti.xyzt_units & papaya.volume.nifti.HeaderNIFTI.TEMPORAL_UNITS_MASK);

    return vd;
};



papaya.volume.nifti.HeaderNIFTI.prototype.getImageType = function () {
    var datatype = papaya.volume.ImageType.DATATYPE_UNKNOWN;

    if ((this.nifti.datatypeCode === papaya.volume.nifti.NIFTI_TYPE_UINT8) ||
        (this.nifti.datatypeCode === papaya.volume.nifti.NIFTI_TYPE_UINT16) ||
        (this.nifti.datatypeCode === papaya.volume.nifti.NIFTI_TYPE_UINT32) ||
        (this.nifti.datatypeCode === papaya.volume.nifti.NIFTI_TYPE_UINT64)) {
        datatype = papaya.volume.ImageType.DATATYPE_INTEGER_UNSIGNED;
    } else if ((this.nifti.datatypeCode === papaya.volume.nifti.NIFTI_TYPE_INT8) ||
        (this.nifti.datatypeCode === papaya.volume.nifti.NIFTI_TYPE_INT16) ||
        (this.nifti.datatypeCode === papaya.volume.nifti.NIFTI_TYPE_INT32) ||
        (this.nifti.datatypeCode === papaya.volume.nifti.NIFTI_TYPE_INT64)) {
        datatype = papaya.volume.ImageType.DATATYPE_INTEGER_SIGNED;
    } else if ((this.nifti.datatypeCode === papaya.volume.nifti.NIFTI_TYPE_FLOAT32) ||
        (this.nifti.datatypeCode === papaya.volume.nifti.NIFTI_TYPE_FLOAT64)) {
        datatype = papaya.volume.ImageType.DATATYPE_FLOAT;
    }

    return new papaya.volume.ImageType(datatype, this.nifti.numBitsPerVoxel / 8, this.nifti.littleEndian,
        this.compressed);
};



papaya.volume.nifti.HeaderNIFTI.prototype.getOrientation = function () {
    var orientation = null;

    if ((this.nifti.qform_code > 0) && !this.qFormHasRotations()) {
        orientation = this.getOrientationQform();
    }

    if ((this.nifti.sform_code > this.nifti.qform_code) && !this.sFormHasRotations()) {
        orientation = this.getOrientationSform();
    }

    if (orientation === null) {
        orientation = papaya.volume.nifti.HeaderNIFTI.ORIENTATION_DEFAULT;
    }

    return new papaya.volume.Orientation(orientation);
};




papaya.volume.nifti.HeaderNIFTI.prototype.getOrientationQform = function () {
    var orientation = papaya.volume.nifti.HeaderNIFTI.ORIENTATION_DEFAULT,
        qFormMatParams = this.nifti.convertNiftiQFormToNiftiSForm(this.nifti.quatern_b, this.nifti.quatern_c,
            this.nifti.quatern_d, this.nifti.qoffset_x, this.nifti.qoffset_y, this.nifti.qoffset_z,
            this.nifti.pixDims[1], this.nifti.pixDims[2], this.nifti.pixDims[3], this.nifti.pixDims[0]);

    if (this.nifti.qform_code > 0) {
        orientation = this.nifti.convertNiftiSFormToNEMA(qFormMatParams);

        if (!papaya.volume.Orientation.isValidOrientationString(orientation)) {
            orientation = papaya.volume.nifti.HeaderNIFTI.ORIENTATION_DEFAULT;
        }
    } else {
        orientation = papaya.volume.nifti.HeaderNIFTI.ORIENTATION_DEFAULT;
    }

    return orientation;
};



papaya.volume.nifti.HeaderNIFTI.prototype.getOrientationSform = function () {
    var orientation = this.nifti.convertNiftiSFormToNEMA(this.nifti.affine);

    if (!papaya.volume.Orientation.isValidOrientationString(orientation)) {
        orientation = papaya.volume.nifti.HeaderNIFTI.ORIENTATION_DEFAULT;
    }

    return orientation;
};



papaya.volume.nifti.HeaderNIFTI.prototype.getQformMatCopy = function () {
    return this.nifti.getQformMat().clone();
};



papaya.volume.nifti.HeaderNIFTI.prototype.getSformMatCopy = function () {
    return this.nifti.affine.clone();
};



papaya.volume.nifti.HeaderNIFTI.prototype.getOrigin = function (forceQ, forceS) {
    var origin = new papaya.core.Coordinate(0, 0, 0),
        qFormMatParams,
        affineQform,
        affineQformInverse,
        affineSformInverse,
        orientation,
        someOffsets,
        xyz, sense,
        xIndex, yIndex, zIndex,
        xFlip, yFlip, zFlip;

    if ((this.nifti.qform_code > 0) && !forceS) {
        if (this.qFormHasRotations()) {
            affineQform = this.nifti.getQformMat();
            affineQformInverse = numeric.inv(affineQform);
            origin.setCoordinate(affineQformInverse[0][3], affineQformInverse[1][3], affineQformInverse[2][3]);
        } else {
            qFormMatParams = this.nifti.convertNiftiQFormToNiftiSForm(this.nifti.quatern_b, this.nifti.quatern_c,
                this.nifti.quatern_d, this.nifti.qoffset_x, this.nifti.qoffset_y, this.nifti.qoffset_z,
                this.nifti.pixDims[1], this.nifti.pixDims[2], this.nifti.pixDims[3], this.nifti.pixDims[0]);

            orientation = this.nifti.convertNiftiSFormToNEMA(qFormMatParams);

            if (!papaya.volume.Orientation.isValidOrientationString(orientation)) {
                orientation = papaya.volume.nifti.HeaderNIFTI.ORIENTATION_DEFAULT;
            }

            xyz = orientation.substring(0, 3).toUpperCase();
            sense = orientation.substring(3);
            xIndex = xyz.indexOf('X');
            yIndex = xyz.indexOf('Y');
            zIndex = xyz.indexOf('Z');
            xFlip = (sense.charAt(xIndex) === '+');
            yFlip = (sense.charAt(yIndex) === '+');
            zFlip = (sense.charAt(zIndex) === '+');

            someOffsets = new Array(3);
            someOffsets[0] = ((this.nifti.qoffset_x / this.nifti.pixDims[xIndex + 1])) * (xFlip ? -1 : 1);
            someOffsets[1] = ((this.nifti.qoffset_y / this.nifti.pixDims[yIndex + 1])) * (yFlip ? -1 : 1);
            someOffsets[2] = ((this.nifti.qoffset_z / this.nifti.pixDims[zIndex + 1])) * (zFlip ? -1 : 1);

            origin.setCoordinate(someOffsets[0], someOffsets[1], someOffsets[2], true);
        }
    } else if ((this.nifti.sform_code > 0) && !forceQ) {
        if (this.sFormHasRotations()) {
            affineSformInverse = numeric.inv(this.nifti.affine);
            origin.setCoordinate(affineSformInverse[0][3], affineSformInverse[1][3], affineSformInverse[2][3]);
        } else {
            orientation = this.nifti.convertNiftiSFormToNEMA(this.nifti.affine);

            if (!papaya.volume.Orientation.isValidOrientationString(orientation)) {
                orientation = papaya.volume.nifti.HeaderNIFTI.ORIENTATION_DEFAULT;
            }

            xyz = orientation.substring(0, 3).toUpperCase();
            sense = orientation.substring(3);
            xIndex = xyz.indexOf('X');
            yIndex = xyz.indexOf('Y');
            zIndex = xyz.indexOf('Z');
            xFlip = (sense.charAt(xIndex) === '+');
            yFlip = (sense.charAt(yIndex) === '+');
            zFlip = (sense.charAt(zIndex) === '+');

            someOffsets = new Array(3);
            someOffsets[0] = ((this.nifti.affine[0][3] / this.nifti.pixDims[xIndex + 1])) * (xFlip ? -1 : 1);
            someOffsets[1] = ((this.nifti.affine[1][3] / this.nifti.pixDims[yIndex + 1])) * (yFlip ? -1 : 1);
            someOffsets[2] = ((this.nifti.affine[2][3] / this.nifti.pixDims[zIndex + 1])) * (zFlip ? -1 : 1);

            origin.setCoordinate(someOffsets[0], someOffsets[1], someOffsets[2], true);
        }
    }

    if (origin.isAllZeros()) {
        origin.setCoordinate(this.nifti.dims[1] / 2.0, this.nifti.dims[2] / 2.0, this.nifti.dims[3] / 2.0);
    }

    return origin;
};



papaya.volume.nifti.HeaderNIFTI.prototype.qFormHasRotations = function () {
    return papaya.volume.Transform.hasRotations(this.getQformMatCopy());
};



papaya.volume.nifti.HeaderNIFTI.prototype.sFormHasRotations = function () {
    return papaya.volume.Transform.hasRotations(this.getSformMatCopy());
};



papaya.volume.nifti.HeaderNIFTI.prototype.getImageRange = function () {
    var ir = new papaya.volume.ImageRange(this.nifti.cal_min, this.nifti.cal_max),
        slope = this.nifti.scl_slope,
        imageDimensions = this.getImageDimensions();

    if (slope === 0) {
        slope = 1;
    }

    ir.setGlobalDataScale(slope, this.nifti.scl_inter, imageDimensions.slices * imageDimensions.timepoints);
    ir.validateDataScale();

    return ir;
};



papaya.volume.nifti.HeaderNIFTI.prototype.hasError = function () {
    return this.nifti.hasError();
};



papaya.volume.nifti.HeaderNIFTI.prototype.getImageDescription = function () {
    return new papaya.volume.ImageDescription(this.nifti.description);
};



papaya.volume.nifti.HeaderNIFTI.prototype.getOrientationCertainty = function () {
    var certainty, origin;

    certainty = papaya.volume.Header.ORIENTATION_CERTAINTY_UNKNOWN;

    if ((this.nifti.qform_code > 0) || (this.nifti.sform_code > 0)) {
        certainty = papaya.volume.Header.ORIENTATION_CERTAINTY_LOW;

        origin = this.getOrigin();
        if ((origin !== null) && !origin.isAllZeros()) {
            certainty = papaya.volume.Header.ORIENTATION_CERTAINTY_HIGH;
        }
    }

    return certainty;
};



papaya.volume.nifti.HeaderNIFTI.prototype.getBestTransform = function () {
    if ((this.nifti.qform_code > 0) && (this.nifti.qform_code > this.nifti.sform_code) && this.qFormHasRotations()) {
        return this.getQformMatCopy();
    }

    if ((this.nifti.sform_code > 0) && (this.nifti.sform_code >= this.nifti.qform_code) && this.sFormHasRotations()) {
        return this.getSformMatCopy();
    }

    return null;
};



papaya.volume.nifti.HeaderNIFTI.prototype.getBestTransformOrigin = function () {
    if ((this.nifti.qform_code > 0) && (this.nifti.qform_code > this.nifti.sform_code) && this.qFormHasRotations()) {
        return this.getOrigin(true, false);
    }

    if ((this.nifti.sform_code > 0) && (this.nifti.sform_code >= this.nifti.qform_code) && this.sFormHasRotations()) {
        return this.getOrigin(false, true);
    }

    return null;
};



papaya.volume.nifti.HeaderNIFTI.prototype.toString = function () {
    var fmt = papaya.utilities.StringUtils.formatNumber,
        string = "";

    string += ("<span style='color:#B5CBD3'>Dim Info</span>" + "<span style='color:gray'> = </span>" + this.nifti.dim_info + "<br />");

    string += ("<span style='color:#B5CBD3'>Image Dimensions</span>" + " (1-8): " + this.nifti.dims[0] + ", " + this.nifti.dims[1] + ", " +
        this.nifti.dims[2] + ", " + this.nifti.dims[3] + ", " + this.nifti.dims[4] + ", " + this.nifti.dims[5] + ", " +
        this.nifti.dims[6] + ", " + this.nifti.dims[7] + "<br />");
    string += ("<span style='color:#B5CBD3'>Intent Parameters</span>" + " (1-3): " + this.nifti.intent_p1 + ", " + this.nifti.intent_p2 + ", " +
        this.nifti.intent_p3) + "<br />";
    string += ("<span style='color:#B5CBD3'>Intent Code</span>" + "<span style='color:gray'> = </span>" + this.nifti.intent_code + "<br />");
    string += ("<span style='color:#B5CBD3'>Datatype</span>" + "<span style='color:gray'> = </span>" + this.nifti.datatypeCode + "<br />");
    string += ("<span style='color:#B5CBD3'>Bits Per Voxel</span>" + "<span style='color:gray'> = </span>" + this.nifti.numBitsPerVoxel + "<br />");
    string += ("<span style='color:#B5CBD3'>Slice Start</span>" + "<span style='color:gray'> = </span>" + this.nifti.slice_start + "<br />");
    string += ("<span style='color:#B5CBD3'>Voxel Dimensions</span>" + " (1-8): " + fmt(this.nifti.pixDims[0]) + ", " + fmt(this.nifti.pixDims[1]) + ", " +
        fmt(this.nifti.pixDims[2]) + ", " + fmt(this.nifti.pixDims[3]) + ", " + fmt(this.nifti.pixDims[4]) + ", " +
        fmt(this.nifti.pixDims[5]) + ", " + fmt(this.nifti.pixDims[6]) + ", " + fmt(this.nifti.pixDims[7]) + "<br />");
    string += ("<span style='color:#B5CBD3'>Image Offset</span>" + "<span style='color:gray'> = </span>" + this.nifti.vox_offset + "<br />");
    string += ("<span style='color:#B5CBD3'>Data Scale</span>" + ":  <span style='color:#B5CBD3'>Slope</span> = " + this.nifti.scl_slope + "  <span style='color:#B5CBD3'>Intercept</span> = " + this.nifti.scl_inter+ "<br />");
    string += ("<span style='color:#B5CBD3'>Slice End</span>" + "<span style='color:gray'> = </span>" + this.nifti.slice_end + "<br />");
    string += ("<span style='color:#B5CBD3'>Slice Code</span>" + "<span style='color:gray'> = </span>" + this.nifti.slice_code + "<br />");
    string += ("<span style='color:#B5CBD3'>Units Code</span>" + "<span style='color:gray'> = </span>" + this.nifti.xyzt_units + "<br />");
    string += ("<span style='color:#B5CBD3'>Display Range</span>" + ":  <span style='color:#B5CBD3'>Max</span>" + "<span style='color:gray'> = </span>" + this.nifti.cal_max + "  <span style='color:#B5CBD3'>Min</span>" + "<span style='color:gray'> = </span>" + this.nifti.cal_min + "<br />");
    string += ("<span style='color:#B5CBD3'>Slice Duration</span>" + "<span style='color:gray'> = </span>" + this.nifti.slice_duration + "<br />");
    string += ("<span style='color:#B5CBD3'>Time Axis Shift</span>" + "<span style='color:gray'> = </span>" + this.nifti.toffset + "<br />");
    string += ("<span style='color:#B5CBD3'>Description</span>" + ": \"" + this.nifti.description + "\"<br />");
    string += ("<span style='color:#B5CBD3'>Auxiliary File</span>" + ": \"" + this.nifti.aux_file + "\"<br />");
    string += ("<span style='color:#B5CBD3'>Q-Form Code</span>" + "<span style='color:gray'> = </span>" + this.nifti.qform_code + "<br />");
    string += ("<span style='color:#B5CBD3'>S-Form Code</span>" + "<span style='color:gray'> = </span>" + this.nifti.sform_code + "<br />");
    string += ("<span style='color:#B5CBD3'>Quaternion Parameters</span>" + ":  <span style='color:#B5CBD3'>b</span>" + "<span style='color:gray'> = </span>" + fmt(this.nifti.quatern_b) +
    "  <span style='color:#B5CBD3'>c</span>" + "<span style='color:gray'> = </span>" +
    fmt(this.nifti.quatern_c) +
        "  <span style='color:#B5CBD3'>d</span>" + "<span style='color:gray'> = </span>" + fmt(this.nifti.quatern_d) + "<br />");
    string += ("<span style='color:#B5CBD3'>Quaternion Offsets</span>" + ":  <span style='color:#B5CBD3'>x</span>" + "<span style='color:gray'> = </span>" + this.nifti.qoffset_x + "  <span style='color:#B5CBD3'>y</span>" + "<span style='color:gray'> = </span>" +
    this.nifti.qoffset_y + "  <span style='color:#B5CBD3'>z</span>" + "<span style='color:gray'> = </span>" +
        this.nifti.qoffset_z + "<br />");
    string += ("<span style='color:#B5CBD3'>S-Form Parameters X</span>" + ": " + fmt(this.nifti.affine[0][0]) + ", " + fmt(this.nifti.affine[0][1]) + ", " +
        fmt(this.nifti.affine[0][2]) + ", " + fmt(this.nifti.affine[0][3]) + "<br />");
    string += ("<span style='color:#B5CBD3'>S-Form Parameters Y</span>" + ": " + fmt(this.nifti.affine[1][0]) + ", " + fmt(this.nifti.affine[1][1]) + ", " +
        fmt(this.nifti.affine[1][2]) + ", " + fmt(this.nifti.affine[1][3]) + "<br />");
    string += ("<span style='color:#B5CBD3'>S-Form Parameters Z</span>" + ": " + fmt(this.nifti.affine[2][0]) + ", " + fmt(this.nifti.affine[2][1]) + ", " +
        fmt(this.nifti.affine[2][2]) + ", " + fmt(this.nifti.affine[2][3]) + "<br />");
    string += ("<span style='color:#B5CBD3'>Intent Name</span>" + ": \"" + this.nifti.intent_name + "\"<br />");
    
    return string;
};