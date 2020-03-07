
/*jslint browser: true, node: true */
/*global */

"use strict";

/*** Imports ***/
var papaya = papaya || {};
papaya.volume = papaya.volume || {};


/*** Constructor ***/
papaya.volume.Transform = papaya.volume.Transform || function (mat, volume) {
    this.voxelValue = new papaya.volume.VoxelValue(volume.imageData, volume.header.imageType,
        volume.header.imageDimensions, volume.header.imageRange, volume.header.orientation);
    this.voxelDimensions = volume.header.voxelDimensions;
    this.imageDimensions = volume.header.imageDimensions;
    this.volume = volume;
    this.mat = papaya.volume.Transform.IDENTITY.clone();
    this.indexMat = papaya.volume.Transform.IDENTITY.clone();
    this.sizeMat = papaya.volume.Transform.IDENTITY.clone();
    this.sizeMatInverse = papaya.volume.Transform.IDENTITY.clone();
    this.mmMat = papaya.volume.Transform.IDENTITY.clone();
    this.worldMat = papaya.volume.Transform.IDENTITY.clone();
    this.worldMatNifti = null;
    this.originMat = papaya.volume.Transform.IDENTITY.clone();
    this.tempMat = papaya.volume.Transform.IDENTITY.clone();
    this.tempMat2 = papaya.volume.Transform.IDENTITY.clone();
    this.orientMat = papaya.volume.Transform.IDENTITY.clone();
    this.centerMat = papaya.volume.Transform.IDENTITY.clone();
    this.centerMatInverse = papaya.volume.Transform.IDENTITY.clone();
    this.rotMatX = papaya.volume.Transform.IDENTITY.clone();
    this.rotMatY = papaya.volume.Transform.IDENTITY.clone();
    this.rotMatZ = papaya.volume.Transform.IDENTITY.clone();
    this.rotMat = papaya.volume.Transform.IDENTITY.clone();

    // Modified 13/01/2020: add rotations and image matrices for EACH slices:
    this.rotMatAxial = papaya.volume.Transform.IDENTITY.clone();
    this.rotMatSagittal = papaya.volume.Transform.IDENTITY.clone();
    this.rotMatCoronal = papaya.volume.Transform.IDENTITY.clone();
    
    this.mmMatAxial = papaya.volume.Transform.IDENTITY.clone();
    this.mmMatSagittal = papaya.volume.Transform.IDENTITY.clone();
    this.mmMatCoronal = papaya.volume.Transform.IDENTITY.clone();

    this.indexMatAxial = papaya.volume.Transform.IDENTITY.clone();
    this.indexMatSagittal = papaya.volume.Transform.IDENTITY.clone();
    this.indexMatCoronal = papaya.volume.Transform.IDENTITY.clone();
    
    this.localizerAngleAxial = 0;
    this.localizerAngleSagittal = 0;
    this.localizerAngleCoronal = 0;

    this.centerCoord = {
        x: volume.header.imageDimensions.xDim / 2,
        y: volume.header.imageDimensions.yDim / 2,
        z: volume.header.imageDimensions.zDim / 2
    };

    this.updateTransforms(mat);
};


/*** Static Pseudo-constants ***/

papaya.volume.Transform.IDENTITY = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
papaya.volume.Transform.EPSILON = 0.00001;


/*** Static Methods ***/

papaya.volume.Transform.printTransform = function (mat) {
    console.log(mat[0][0] + " " + mat[0][1] + " " + mat[0][2] + " " + mat[0][3]);
    console.log(mat[1][0] + " " + mat[1][1] + " " + mat[1][2] + " " + mat[1][3]);
    console.log(mat[2][0] + " " + mat[2][1] + " " + mat[2][2] + " " + mat[2][3]);
    console.log(mat[3][0] + " " + mat[3][1] + " " + mat[3][2] + " " + mat[3][3]);
};



papaya.volume.Transform.decompose = function (mat) {
    var xTrans, yTrans, zTrans, xRot, yRot, zRot, xScale, yScale, zScale, tempK1, tempK2, tempK3, tempK4, tempK5,
        tempK6, tempM1, tempM2, tempM3, tempM4, tempM5, tempM6, tempM7, tempM8, tempM9, tempN1, tempN2, tempN3, tempN4,
        tempN5, tempN6, xSkew, ySkew, zSkew, decomposedParams;

    decomposedParams = [];

    xTrans = papaya.volume.Transform.validateNum(mat[0][3]); // xTrans
    yTrans = papaya.volume.Transform.validateNum(mat[1][3]); // yTrans
    zTrans = papaya.volume.Transform.validateNum(mat[2][3]); // zTrans

    xRot = papaya.volume.Transform.validateNum(Math.atan(mat[2][1] / mat[2][2])); // xRot

    yRot = 0;

    if (xRot === 0) {
        yRot = papaya.volume.Transform.validateNum(Math.atan(-1 * Math.cos(xRot) * (mat[2][0] / mat[2][2])));
    } else {
        yRot = papaya.volume.Transform.validateNum(Math.atan(-1 * Math.sin(xRot) * (mat[2][0] / mat[2][1])));
    }

    if (yRot === 0) {
        yRot = papaya.volume.Transform.EPSILON;
    }

    zScale = papaya.volume.Transform.validateScale(mat[2][2] / (Math.cos(yRot) * Math.cos(xRot))); // zScale

    tempK1 = Math.cos(xRot);
    tempK2 = (Math.sin(xRot) * Math.sin(yRot)) + (Math.sin(xRot) * (Math.cos(yRot) / Math.tan(yRot)));
    tempK3 = (mat[1][0] * (Math.sin(xRot) / Math.tan(yRot))) + mat[1][1];
    tempK4 = -1 * Math.sin(xRot);
    tempK5 = (Math.cos(xRot) * Math.sin(yRot)) + (Math.cos(xRot) * (Math.cos(yRot) / Math.tan(yRot)));
    tempK6 = (mat[1][0] * (Math.cos(xRot) / Math.tan(yRot))) + mat[1][2];

    zRot = papaya.volume.Transform.validateNum(Math.atan((((tempK1 * tempK6) - (tempK3 * tempK4)) / ((tempK3 * tempK5) -
        (tempK2 * tempK6))))); // zRot

    yScale = papaya.volume.Transform.validateScale((tempK3 / ((Math.cos(zRot) * tempK1) +
        (Math.sin(zRot) * tempK2)))); // yScale
    xSkew = papaya.volume.Transform.validateNum((((yScale * Math.sin(zRot) * Math.cos(yRot)) - mat[1][0]) /
        (zScale * Math.sin(yRot)))); // xSkew

    tempM1 = Math.cos(yRot) * Math.cos(zRot);
    tempM2 = yScale * Math.cos(yRot) * Math.sin(zRot);
    tempM3 = -1 * zScale * Math.sin(yRot);
    tempM4 = (Math.sin(xRot) * Math.sin(yRot) * Math.cos(zRot)) - (Math.cos(xRot) * Math.sin(zRot));
    tempM5 = (Math.sin(xRot) * Math.sin(yRot) * Math.sin(zRot)) + (Math.cos(xRot) * Math.cos(zRot));
    tempM6 = zScale * Math.sin(xRot) * Math.cos(yRot);
    tempM7 = (Math.cos(xRot) * Math.sin(yRot) * Math.cos(zRot)) + (Math.sin(xRot) * Math.sin(zRot));
    tempM8 = (Math.cos(xRot) * Math.sin(yRot) * Math.sin(zRot)) - (Math.sin(xRot) * Math.cos(zRot));
    tempM9 = zScale * Math.cos(xRot) * Math.cos(yRot);
    tempN1 = (tempM2 * tempM4) - (tempM1 * tempM5);
    tempN2 = (tempM3 * tempM4) - (tempM1 * tempM6);
    tempN3 = (tempM4 * mat[0][0]) - (tempM1 * mat[0][1]);
    tempN4 = (tempM2 * tempM7) - (tempM1 * tempM8);
    tempN5 = (tempM3 * tempM7) - (tempM1 * tempM9);
    tempN6 = (tempM7 * mat[0][0]) - (tempM1 * mat[0][2]);

    ySkew = papaya.volume.Transform.validateNum((((tempN4 * tempN3) - (tempN6 * tempN1)) / ((tempN2 * tempN4) -
        (tempN1 * tempN5)))); // ySkew
    zSkew = papaya.volume.Transform.validateNum((((tempN3 * tempN5) - (tempN2 * tempN6)) / ((tempN1 * tempN5) -
        (tempN2 * tempN4)))); // zSkew
    xScale = papaya.volume.Transform.validateScale(((mat[0][0] - (zSkew * tempM2) - (ySkew * tempM3)) /
        tempM1)); // xScale

    if (yRot === papaya.volume.Transform.EPSILON) {
        yRot = 0;
    }

    xRot *= (180 / Math.PI);
    yRot *= (180 / Math.PI);
    zRot *= (180 / Math.PI);

    decomposedParams[0] = papaya.volume.Transform.validateZero(xTrans);
    decomposedParams[1] = papaya.volume.Transform.validateZero(yTrans);
    decomposedParams[2] = papaya.volume.Transform.validateZero(zTrans);

    decomposedParams[3] = papaya.volume.Transform.validateZero(xRot);
    decomposedParams[4] = papaya.volume.Transform.validateZero(yRot);
    decomposedParams[5] = papaya.volume.Transform.validateZero(zRot);

    decomposedParams[6] = xScale;
    decomposedParams[7] = yScale;
    decomposedParams[8] = zScale;

    decomposedParams[9] = papaya.volume.Transform.validateZero(xSkew);
    decomposedParams[10] = papaya.volume.Transform.validateZero(ySkew);
    decomposedParams[11] = papaya.volume.Transform.validateZero(zSkew);

    return decomposedParams;
};



papaya.volume.Transform.hasRotations = function (mat) {
    var decomp, epsilon, rotX, rotY, rotZ;

    if (mat !== null) {
        decomp = papaya.volume.Transform.decompose(mat);
        epsilon = 0.01;

        rotX = (Math.abs(1 - (Math.abs(decomp[3]) / 90.0)) % 1);
        rotY = (Math.abs(1 - (Math.abs(decomp[4]) / 90.0)) % 1);
        rotZ = (Math.abs(1 - (Math.abs(decomp[5]) / 90.0)) % 1);

        return ((rotX > epsilon) || (rotY > epsilon) || (rotZ > epsilon));
    }

    return false;
};



papaya.volume.Transform.validateNum = function (num) {
    if ((num === Number.POSITIVE_INFINITY) || (num === Number.NEGATIVE_INFINITY)) {
        return 0;
    }

    if (isNaN(num)) {
        return 0;
    }

    if (num === 0) {  // catch negative zeros
        return 0;
    }

    return num;
};



papaya.volume.Transform.validateScale = function (num) {
    if ((num === Number.POSITIVE_INFINITY) || (num === Number.NEGATIVE_INFINITY)) {
        return 1;
    }

    if (isNaN(num)) {
        return 1;
    }

    return num;
};



papaya.volume.Transform.validateZero = function (num) {
    if (Math.abs(num) < papaya.volume.Transform.EPSILON) {
        return 0;
    }

    return num;
};


/*** Prototype Methods ***/

papaya.volume.Transform.prototype.updateSizeMat = function () {
    this.sizeMat[0][0] = this.voxelDimensions.xSize;
    this.sizeMat[1][1] = this.voxelDimensions.ySize;
    this.sizeMat[2][2] = this.voxelDimensions.zSize;
    this.sizeMat[3][3] = 1;

    this.sizeMatInverse[0][0] = 1 / this.voxelDimensions.xSize;
    this.sizeMatInverse[1][1] = 1 / this.voxelDimensions.ySize;
    this.sizeMatInverse[2][2] = 1 / this.voxelDimensions.zSize;
    this.sizeMatInverse[3][3] = 1;
};



papaya.volume.Transform.prototype.updateOrientMat = function () {
    this.orientMat = this.volume.header.orientation.orientMat;
};



papaya.volume.Transform.prototype.updateIndexTransform = function () {
    var ctrOut, ctrIn;
    for (ctrOut = 0; ctrOut < 4; ctrOut += 1) {
        for (ctrIn = 0; ctrIn < 4; ctrIn += 1) {
            this.indexMat[ctrOut][ctrIn] = (this.orientMat[ctrOut][0] * this.mat[0][ctrIn]) +
            (this.orientMat[ctrOut][1] * this.mat[1][ctrIn]) +
            (this.orientMat[ctrOut][2] * this.mat[2][ctrIn]) +
            (this.orientMat[ctrOut][3] * this.mat[3][ctrIn]);
        }
    }
};

papaya.volume.Transform.prototype.updateMmTransform = function () {
    var ctrOut, ctrIn;
    for (ctrOut = 0; ctrOut < 4; ctrOut += 1) {
        for (ctrIn = 0; ctrIn < 4; ctrIn += 1) {
            this.mmMat[ctrOut][ctrIn] = (this.indexMat[ctrOut][0] * this.sizeMatInverse[0][ctrIn]) +
            (this.indexMat[ctrOut][1] * this.sizeMatInverse[1][ctrIn]) +
            (this.indexMat[ctrOut][2] * this.sizeMatInverse[2][ctrIn]) +
            (this.indexMat[ctrOut][3] * this.sizeMatInverse[3][ctrIn]);
        }
    }
    this.mmMatAxial = papaya.utilities.MatrixUtils.multiplyMatrices(this.indexMatAxial, this.sizeMatInverse);
    this.mmMatSagittal = papaya.utilities.MatrixUtils.multiplyMatrices(this.indexMatSagittal, this.sizeMatInverse);
    this.mmMatCoronal = papaya.utilities.MatrixUtils.multiplyMatrices(this.indexMatCoronal, this.sizeMatInverse);
};

papaya.volume.Transform.prototype.updateOriginMat = function () {
    this.originMat[0][0] = 1;
    this.originMat[1][1] = -1;
    this.originMat[2][2] = -1;
    this.originMat[3][3] = 1;
    this.originMat[0][3] = this.volume.header.origin.x;
    this.originMat[1][3] = this.volume.header.origin.y;
    this.originMat[2][3] = this.volume.header.origin.z;
};



papaya.volume.Transform.prototype.updateImageMat = function (centerX, centerY, centerZ, rotX, rotY, rotZ) {
    var thetaX, thetaY, thetaZ, cosTheta, sinTheta, ctrOut, ctrIn;
    this.updateCenterMat(centerX, centerY, centerZ);
    var directions = {
        x: [],
        y: [],
        z: []
    };

    thetaX = (rotX * Math.PI) / 180.0;
    cosTheta = Math.cos(thetaX);
    sinTheta = Math.sin(thetaX);
    this.rotMatX[1][1] = cosTheta;
    this.rotMatX[1][2] = sinTheta;
    this.rotMatX[2][1] = -1 * sinTheta;
    this.rotMatX[2][2] = cosTheta;

    thetaY = (rotY * Math.PI) / 180.0;
    cosTheta = Math.cos(thetaY);
    sinTheta = Math.sin(thetaY);
    this.rotMatY[0][0] = cosTheta;
    this.rotMatY[0][2] = -1 * sinTheta;
    this.rotMatY[2][0] = sinTheta;
    this.rotMatY[2][2] = cosTheta;

    thetaZ = (rotZ * Math.PI) / 180.0;
    cosTheta = Math.cos(thetaZ);
    sinTheta = Math.sin(thetaZ);
    this.rotMatZ[0][0] = cosTheta;
    this.rotMatZ[0][1] = sinTheta;
    this.rotMatZ[1][0] = -1 * sinTheta;
    this.rotMatZ[1][1] = cosTheta;

    for (ctrOut = 0; ctrOut < 4; ctrOut += 1) {
        for (ctrIn = 0; ctrIn < 4; ctrIn += 1) {
            this.tempMat[ctrOut][ctrIn] =
                (this.rotMatX[ctrOut][0] * this.rotMatY[0][ctrIn]) +
                (this.rotMatX[ctrOut][1] * this.rotMatY[1][ctrIn]) +
                (this.rotMatX[ctrOut][2] * this.rotMatY[2][ctrIn]) +
                (this.rotMatX[ctrOut][3] * this.rotMatY[3][ctrIn]);
        }
    }
    // this.tempMat = papaya.utilities.ArrayUtils.multiplyMatrices(this.rotMatX, this.rotMatY);

    for (ctrOut = 0; ctrOut < 4; ctrOut += 1) {
        for (ctrIn = 0; ctrIn < 4; ctrIn += 1) {
            this.rotMat[ctrOut][ctrIn] =
                (this.tempMat[ctrOut][0] * this.rotMatZ[0][ctrIn]) +
                (this.tempMat[ctrOut][1] * this.rotMatZ[1][ctrIn]) +
                (this.tempMat[ctrOut][2] * this.rotMatZ[2][ctrIn]) +
                (this.tempMat[ctrOut][3] * this.rotMatZ[3][ctrIn]);
        }
    }
    this.updateRotationMat();
    papaya.volume.Transform.printTransform(this.rotMat);
    directions.x = [rotX, this.rotMat[0][0], this.rotMat[1][0], this.rotMat[2][0]];
    directions.y = [rotY, this.rotMat[0][1], this.rotMat[1][1], this.rotMat[2][1]];
    directions.z = [rotZ, this.rotMat[0][2], this.rotMat[1][2], this.rotMat[2][2]];
    // console.log('directions');
    // console.table(directions);
    for (ctrOut = 0; ctrOut < 4; ctrOut += 1) {
        for (ctrIn = 0; ctrIn < 4; ctrIn += 1) {
            this.tempMat[ctrOut][ctrIn] =
                (this.sizeMatInverse[ctrOut][0] * this.centerMatInverse[0][ctrIn]) +
                (this.sizeMatInverse[ctrOut][1] * this.centerMatInverse[1][ctrIn]) +
                (this.sizeMatInverse[ctrOut][2] * this.centerMatInverse[2][ctrIn]) +
                (this.sizeMatInverse[ctrOut][3] * this.centerMatInverse[3][ctrIn]);
        }
    }

    for (ctrOut = 0; ctrOut < 4; ctrOut += 1) {
        for (ctrIn = 0; ctrIn < 4; ctrIn += 1) {
            this.tempMat2[ctrOut][ctrIn] =
                (this.tempMat[ctrOut][0] * this.rotMat[0][ctrIn]) +
                (this.tempMat[ctrOut][1] * this.rotMat[1][ctrIn]) +
                (this.tempMat[ctrOut][2] * this.rotMat[2][ctrIn]) +
                (this.tempMat[ctrOut][3] * this.rotMat[3][ctrIn]);
        }
    }

    for (ctrOut = 0; ctrOut < 4; ctrOut += 1) {
        for (ctrIn = 0; ctrIn < 4; ctrIn += 1) {
            this.tempMat[ctrOut][ctrIn] =
                (this.tempMat2[ctrOut][0] * this.centerMat[0][ctrIn]) +
                (this.tempMat2[ctrOut][1] * this.centerMat[1][ctrIn]) +
                (this.tempMat2[ctrOut][2] * this.centerMat[2][ctrIn]) +
                (this.tempMat2[ctrOut][3] * this.centerMat[3][ctrIn]);
        }
    }

    for (ctrOut = 0; ctrOut < 4; ctrOut += 1) {
        for (ctrIn = 0; ctrIn < 4; ctrIn += 1) {
            this.tempMat2[ctrOut][ctrIn] =
                (this.tempMat[ctrOut][0] * this.sizeMat[0][ctrIn]) +
                (this.tempMat[ctrOut][1] * this.sizeMat[1][ctrIn]) +
                (this.tempMat[ctrOut][2] * this.sizeMat[2][ctrIn]) +
                (this.tempMat[ctrOut][3] * this.sizeMat[3][ctrIn]);
        }
    }
    this.volume.transform.updateTransforms(this.tempMat2);
};

papaya.volume.Transform.prototype.clampZero = function (num) {
    var epsilon = 0.0001;
    if (num>= -epsilon && num <= epsilon) return 0;
    else return num;
}

papaya.volume.Transform.prototype.getDeterminant = function (v1, v2, v3) {
    
    // var mat = [[v1[0], v2[0], v3[0]], [v1[1], v2[1], v3[1]], [v1[2], v2[2], v3[2]]];
    return (v1[0]*v2[1]*v3[2] + v2[0]*v3[1]*v1[2] + v3[0]*v1[1]*v2[2] - v3[0]*v2[1]*v1[2] - v2[0]*v1[1]*v3[2] - v1[0]*v3[1]*v2[2]);
}

papaya.volume.Transform.prototype.getAngleTo = function (v1, v2, v3) {
    var dotProduct = v1[0]*v2[0] + v1[1]*v2[1] + v1[2]*v2[2];
    var scalar1 = Math.sqrt(v1[0]*v1[0] + v1[1]*v1[1] + v1[2]*v1[2]);
    var scalar2 = Math.sqrt(v2[0]*v2[0] + v2[1]*v2[1] + v2[2]*v2[2]);
    var angle;
    var det = this.getDeterminant(v1, v2, v3);
    dotProduct = this.clampZero(dotProduct);
    det = this.clampZero(det);
    angle = (Math.acos(dotProduct / (scalar1 * scalar2))) * 180 / Math.PI;
    // console.log('dotProduct ', dotProduct, 'determinant', det);
    // https://math.stackexchange.com/questions/2440638/angle-in-range-0-to-360-degrees-between-two-vectors-in-n-dimensional-space
    if (det <= 0) return angle;
    else return 360 - angle;
}

papaya.volume.Transform.prototype.updateRollImageMat = function (angle, sliceLabel) {
    // console.log('%cupdateRollImageMat', "color: green", sliceLabel);
    // this.updateRotationMat();
    var directions = {
        x: [],
        y: [],
        z: []
    };
    var rotateDirection = this.getDirections(sliceLabel);
    // papaya.volume.Transform.printTransform(this.rotMat);

    // rotateOnAxis = papaya.volume.Transform.prototype.rotateOnAxis(rotateDirection, angle);
    // console.log('rotateOnAxis');
    // papaya.volume.Transform.printTransform(rotateOnAxis);

    // this.tempMat = papaya.utilities.ArrayUtils.multiplyMatrices(this.rotMat, rotateOnAxis);
    var tempRotMat = this.applyRotation(rotateDirection, angle, this.rotMat);
    this.updateRotationMat(sliceLabel, tempRotMat);
    this.rotMat = tempRotMat.clone();
    directions.x = [this.rotMat[0][0], this.rotMat[0][1], this.rotMat[0][2]];
    directions.y = [this.rotMat[1][0], this.rotMat[1][1], this.rotMat[1][2]];
    directions.z = [this.rotMat[2][0], this.rotMat[2][1], this.rotMat[2][2]];
    // console.log('directions');
    // console.table(directions);
    this.updateLocalizerAngle(sliceLabel, directions, angle);
    // console.table([this.localizerAngleAxial, this.localizerAngleCoronal, this.localizerAngleSagittal]);
    // console.table([this.localizerAngleAxial, this.localizerAngleSagittal, this.localizerAngleCoronal]);
    this.volume.transform.updateRollTransforms([this.getSliceImageMat(this.rotMatAxial), this.getSliceImageMat(this.rotMatSagittal), this.getSliceImageMat(this.rotMatCoronal)]);
}

papaya.volume.Transform.prototype.updatePosition = function (sliceLabel, volume) {
    // update position across viewport
    // update center
    // var centerX, centerY, centerZ;
    var sliceImageMatAxial, sliceImageMatSagittal, sliceImageMatCoronal;
    // centerX = volume.currentCoord.x * volume.volume.header.voxelDimensions.xSize;
    // centerY = volume.currentCoord.y * volume.volume.header.voxelDimensions.ySize;
    // centerZ = volume.currentCoord.z * volume.volume.header.voxelDimensions.zSize;
    // this.updateCenterMat(centerX, centerY, centerZ);
    // this.updateCenterCoord(centerCoord.x, centerCoord.y, centerCoord.z);

    // this.updateRotationMat(sliceLabel, this.rotMat);
    // this.updateCounterRoll(sliceLabel);

    sliceImageMatAxial = this.getSliceImageMat(this.rotMatAxial);
    sliceImageMatSagittal = this.getSliceImageMat(this.rotMatSagittal);
    sliceImageMatCoronal = this.getSliceImageMat(this.rotMatCoronal);
    // sliceImageMat = this.getSliceImageMat(this.rotMat, false);
    // sliceImageMatAxial = (sliceLabel === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) ? this.getSliceImageMat(this.rotMatAxial, false) : this.getSliceImageMat(this.getRotationMat(sliceLabel), false);
    // sliceImageMatSagittal = (sliceLabel === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) ? this.getSliceImageMat(this.rotMatSagittal, false) : this.getSliceImageMat(this.getRotationMat(sliceLabel), false);
    // sliceImageMatCoronal = (sliceLabel === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) ? this.getSliceImageMat(this.rotMatCoronal, false) : this.getSliceImageMat(this.getRotationMat(sliceLabel), false);

    this.volume.transform.updateRollTransforms([sliceImageMatAxial, sliceImageMatSagittal, sliceImageMatCoronal]);
}

papaya.volume.Transform.prototype.resetSliceRotation = function (sliceLabel) {
    switch (sliceLabel) {
        case papaya.viewer.ScreenSlice.DIRECTION_AXIAL:
            this.localizerAngleAxial = 0;
            break;
        case papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL:
            this.localizerAngleSagittal = 0;
            break;
        case papaya.viewer.ScreenSlice.DIRECTION_CORONAL:
            this.localizerAngleCoronal = 0;
            break;
        default:
            break;
    }
}

papaya.volume.Transform.prototype.getSliceRotatingAngle = function (sliceLabel) {
    switch (sliceLabel) {
        case papaya.viewer.ScreenSlice.DIRECTION_AXIAL:
            return this.localizerAngleAxial;
        case papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL:
            return this.localizerAngleSagittal;
        case papaya.viewer.ScreenSlice.DIRECTION_CORONAL:
            return this.localizerAngleCoronal;
        default:
            break;
    }
}

papaya.volume.Transform.prototype.applyRotation = function (direction, angle, mat) {
    var rotateOnAxis = papaya.utilities.MatrixUtils.rotateOnAxis(direction, angle);
    var tempMat = papaya.utilities.MatrixUtils.multiplyMatrices(mat, rotateOnAxis);
    return tempMat;
}

papaya.volume.Transform.prototype.updateLocalizerAngle = function (sliceLabel, directions, angle) {
    switch (sliceLabel) {
        case papaya.viewer.ScreenSlice.DIRECTION_AXIAL:
            // this.localizerAngleAxial = this.getAngleTo([1, 0, 0], directions.x, this.getDirections(sliceLabel));
            this.localizerAngleAxial += angle;
            break;
        case papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL:
            // this.localizerAngleSagittal = this.getAngleTo([0, 1, 0], directions.y, this.getDirections(sliceLabel));
            this.localizerAngleSagittal += angle;
            break;
        case papaya.viewer.ScreenSlice.DIRECTION_CORONAL:
            // this.localizerAngleCoronal = this.getAngleTo([0, 0, 1], directions.z, this.getDirections(sliceLabel));
            this.localizerAngleCoronal += angle;
            break;
        default:
            break;
    }
}
papaya.volume.Transform.prototype.updateRotationMat = function (sliceLabelExclude, tempRotMat) {
    switch (sliceLabelExclude) {
        case papaya.viewer.ScreenSlice.DIRECTION_AXIAL:
            this.rotMatSagittal = tempRotMat.clone();
            this.rotMatSagittal = this.applyRotation(this.getDirections(papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL), -this.localizerAngleSagittal, this.rotMatSagittal);
            this.rotMatCoronal = tempRotMat.clone();
            this.rotMatCoronal = this.applyRotation(this.getDirections(papaya.viewer.ScreenSlice.DIRECTION_CORONAL), -this.localizerAngleCoronal, this.rotMatCoronal);
            break;
        case papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL:
            this.rotMatAxial = tempRotMat.clone();
            this.rotMatAxial = this.applyRotation(this.getDirections(papaya.viewer.ScreenSlice.DIRECTION_AXIAL), -this.localizerAngleAxial, this.rotMatAxial);
            this.rotMatCoronal = tempRotMat.clone();
            this.rotMatCoronal = this.applyRotation(this.getDirections(papaya.viewer.ScreenSlice.DIRECTION_CORONAL), -this.localizerAngleCoronal, this.rotMatCoronal);
            break;
        case papaya.viewer.ScreenSlice.DIRECTION_CORONAL:
            this.rotMatAxial = tempRotMat.clone();
            this.rotMatAxial = this.applyRotation(this.getDirections(papaya.viewer.ScreenSlice.DIRECTION_AXIAL), -this.localizerAngleAxial, this.rotMatAxial);
            this.rotMatSagittal = tempRotMat.clone();
            this.rotMatSagittal = this.applyRotation(this.getDirections(papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL), -this.localizerAngleSagittal, this.rotMatSagittal);
            break;
        default:
            // this.rotMat = tempRotMat.clone();
            break;
    }
}
papaya.volume.Transform.prototype.updateCounterRoll = function (sliceLabelExclude) {
    console.log('updateCounterRoll', sliceLabelExclude);
    switch (sliceLabelExclude) {
        case papaya.viewer.ScreenSlice.DIRECTION_AXIAL:
            var tempRotMat = this.rotMatAxial.clone();
            tempRotMat = this.applyRotation(this.getDirections(papaya.viewer.ScreenSlice.DIRECTION_AXIAL), this.localizerAngleAxial, tempRotMat);
            this.rotMatSagittal = tempRotMat.clone();
            this.rotMatSagittal = this.applyRotation(this.getDirections(papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL), -this.localizerAngleSagittal, this.rotMatSagittal);
            this.rotMatCoronal = tempRotMat.clone();
            this.rotMatCoronal = this.applyRotation(this.getDirections(papaya.viewer.ScreenSlice.DIRECTION_CORONAL), -this.localizerAngleCoronal, this.rotMatCoronal);
            break;
        case papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL:
            this.rotMatAxial = this.rotMat.clone();
            this.rotMatAxial = this.applyRotation(this.getDirections(papaya.viewer.ScreenSlice.DIRECTION_AXIAL), this.localizerAngleAxial, this.rotMatAxial);
            this.rotMatCoronal = this.rotMat.clone();
            this.rotMatCoronal = this.applyRotation(this.getDirections(papaya.viewer.ScreenSlice.DIRECTION_CORONAL), this.localizerAngleCoronal, this.rotMatCoronal);
            break;
        case papaya.viewer.ScreenSlice.DIRECTION_CORONAL:
            this.rotMatAxial = this.rotMat.clone();
            this.rotMatAxial = this.applyRotation(this.getDirections(papaya.viewer.ScreenSlice.DIRECTION_AXIAL), this.localizerAngleAxial, this.rotMatAxial);
            this.rotMatSagittal = this.rotMat.clone();
            this.rotMatSagittal = this.applyRotation(this.getDirections(papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL), this.localizerAngleSagittal, this.rotMatSagittal);
            break;
        default:
            // this.rotMat = tempRotMat.clone();
            console.log('updateCounterRoll default');
            break;
    }
}

papaya.volume.Transform.prototype.getSliceImageMat = function (rotationMat, skip) {
    var tempMat, tempMat2;
    if (skip) {
        rotationMat = papaya.volume.Transform.IDENTITY.clone();
        tempMat = papaya.utilities.MatrixUtils.multiplyMatrices(this.sizeMatInverse, this.centerMatInverse);
        tempMat2 = papaya.utilities.MatrixUtils.multiplyMatrices(tempMat, rotationMat);
        tempMat = papaya.utilities.MatrixUtils.multiplyMatrices(tempMat2, this.centerMat);
        tempMat2 = papaya.utilities.MatrixUtils.multiplyMatrices(tempMat, this.sizeMat);
        // console.table(papaya.volume.Transform.decompose(tempMat2));
    } else {
        tempMat = papaya.utilities.MatrixUtils.multiplyMatrices(this.sizeMatInverse, this.centerMatInverse);
        tempMat2 = papaya.utilities.MatrixUtils.multiplyMatrices(tempMat, rotationMat);
        tempMat = papaya.utilities.MatrixUtils.multiplyMatrices(tempMat2, this.centerMat);
        tempMat2 = papaya.utilities.MatrixUtils.multiplyMatrices(tempMat, this.sizeMat);
    }
    return tempMat2;
}

papaya.volume.Transform.prototype.updateCenterCoord = function (x, y, z) {
    console.log('updateCenterCoord');
    this.centerCoord.x = x;
    this.centerCoord.y = y;
    this.centerCoord.z = z;
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////

papaya.volume.Transform.prototype.updateCenterMat = function (x, y, z) {
    this.centerMat[0][0] = 1;
    this.centerMat[1][1] = 1;
    this.centerMat[2][2] = 1;
    this.centerMat[3][3] = 1;
    this.centerMat[0][3] = -1 * x;
    this.centerMat[1][3] = -1 * y;
    this.centerMat[2][3] = -1 * z;

    this.centerMatInverse[0][0] = 1;
    this.centerMatInverse[1][1] = 1;
    this.centerMatInverse[2][2] = 1;
    this.centerMatInverse[3][3] = 1;
    this.centerMatInverse[0][3] = x;
    this.centerMatInverse[1][3] = y;
    this.centerMatInverse[2][3] = z;
};



papaya.volume.Transform.prototype.updateWorldMat = function () {
    var ctrOut, ctrIn, flipMat, originNiftiMat;

    if (this.worldMatNifti) {
        flipMat = [[ -1, 0, 0, this.imageDimensions.xDim - 1 ], [ 0, 1, 0, 0 ], [ 0, 0, 1, 0 ], [ 0, 0, 0, 1 ]];

        originNiftiMat = papaya.volume.Transform.IDENTITY.clone();
        originNiftiMat[0][0] = -1;
        originNiftiMat[1][1] = -1;
        originNiftiMat[2][2] = -1;
        originNiftiMat[3][3] = 1;
        originNiftiMat[0][3] = this.volume.header.origin.x;
        originNiftiMat[1][3] = this.volume.header.origin.y;
        originNiftiMat[2][3] = this.volume.header.origin.z;

        for (ctrOut = 0; ctrOut < 4; ctrOut += 1) {
            for (ctrIn = 0; ctrIn < 4; ctrIn += 1) {
                this.tempMat[ctrOut][ctrIn] = (this.sizeMat[ctrOut][0] * originNiftiMat[0][ctrIn]) +
                (this.sizeMat[ctrOut][1] * originNiftiMat[1][ctrIn]) +
                (this.sizeMat[ctrOut][2] * originNiftiMat[2][ctrIn]) +
                (this.sizeMat[ctrOut][3] * originNiftiMat[3][ctrIn]);
            }
        }

        for (ctrOut = 0; ctrOut < 4; ctrOut += 1) {
            for (ctrIn = 0; ctrIn < 4; ctrIn += 1) {
                this.tempMat2[ctrOut][ctrIn] = (this.tempMat[ctrOut][0] * flipMat[0][ctrIn]) +
                (this.tempMat[ctrOut][1] * flipMat[1][ctrIn]) +
                (this.tempMat[ctrOut][2] * flipMat[2][ctrIn]) +
                (this.tempMat[ctrOut][3] * flipMat[3][ctrIn]);
            }
        }

        for (ctrOut = 0; ctrOut < 4; ctrOut += 1) {
            for (ctrIn = 0; ctrIn < 4; ctrIn += 1) {
                this.tempMat[ctrOut][ctrIn] = (this.tempMat2[ctrOut][0] * this.mat[0][ctrIn]) +
                (this.tempMat2[ctrOut][1] * this.mat[1][ctrIn]) +
                (this.tempMat2[ctrOut][2] * this.mat[2][ctrIn]) +
                (this.tempMat2[ctrOut][3] * this.mat[3][ctrIn]);
            }
        }

        for (ctrOut = 0; ctrOut < 4; ctrOut += 1) {
            for (ctrIn = 0; ctrIn < 4; ctrIn += 1) {
                this.tempMat2[ctrOut][ctrIn] = (this.tempMat[ctrOut][0] * flipMat[0][ctrIn]) +
                (this.tempMat[ctrOut][1] * flipMat[1][ctrIn]) +
                (this.tempMat[ctrOut][2] * flipMat[2][ctrIn]) +
                (this.tempMat[ctrOut][3] * flipMat[3][ctrIn]);
            }
        }

        for (ctrOut = 0; ctrOut < 4; ctrOut += 1) {
            for (ctrIn = 0; ctrIn < 4; ctrIn += 1) {
                this.tempMat[ctrOut][ctrIn] = (this.tempMat2[ctrOut][0] * originNiftiMat[0][ctrIn]) +
                (this.tempMat2[ctrOut][1] * originNiftiMat[1][ctrIn]) +
                (this.tempMat2[ctrOut][2] * originNiftiMat[2][ctrIn]) +
                (this.tempMat2[ctrOut][3] * originNiftiMat[3][ctrIn]);
            }
        }

        for (ctrOut = 0; ctrOut < 4; ctrOut += 1) {
            for (ctrIn = 0; ctrIn < 4; ctrIn += 1) {
                this.tempMat2[ctrOut][ctrIn] = (this.tempMat[ctrOut][0] * this.sizeMatInverse[0][ctrIn]) +
                (this.tempMat[ctrOut][1] * this.sizeMatInverse[1][ctrIn]) +
                (this.tempMat[ctrOut][2] * this.sizeMatInverse[2][ctrIn]) +
                (this.tempMat[ctrOut][3] * this.sizeMatInverse[3][ctrIn]);
            }
        }

        for (ctrOut = 0; ctrOut < 4; ctrOut += 1) {
            for (ctrIn = 0; ctrIn < 4; ctrIn += 1) {
                this.worldMat[ctrOut][ctrIn] = (this.worldMatNifti[ctrOut][0] * this.tempMat2[0][ctrIn]) +
                (this.worldMatNifti[ctrOut][1] * this.tempMat2[1][ctrIn]) +
                (this.worldMatNifti[ctrOut][2] * this.tempMat2[2][ctrIn]) +
                (this.worldMatNifti[ctrOut][3] * this.tempMat2[3][ctrIn]);
            }
        }
    } else {
        for (ctrOut = 0; ctrOut < 4; ctrOut += 1) {
            for (ctrIn = 0; ctrIn < 4; ctrIn += 1) {
                this.tempMat[ctrOut][ctrIn] = (this.indexMat[ctrOut][0] * this.originMat[0][ctrIn]) +
                (this.indexMat[ctrOut][1] * this.originMat[1][ctrIn]) +
                (this.indexMat[ctrOut][2] * this.originMat[2][ctrIn]) +
                (this.indexMat[ctrOut][3] * this.originMat[3][ctrIn]);
            }
        }

        for (ctrOut = 0; ctrOut < 4; ctrOut += 1) {
            for (ctrIn = 0; ctrIn < 4; ctrIn += 1) {
                this.worldMat[ctrOut][ctrIn] = (this.tempMat[ctrOut][0] * this.sizeMatInverse[0][ctrIn]) +
                (this.tempMat[ctrOut][1] * this.sizeMatInverse[1][ctrIn]) +
                (this.tempMat[ctrOut][2] * this.sizeMatInverse[2][ctrIn]) +
                (this.tempMat[ctrOut][3] * this.sizeMatInverse[3][ctrIn]);
            }
        }
    }
};



papaya.volume.Transform.prototype.updateMat = function (mat) {
    var ctrIn, ctrOut;

    for (ctrOut = 0; ctrOut < 4; ctrOut += 1) {
        for (ctrIn = 0; ctrIn < 4; ctrIn += 1) {
            this.mat[ctrOut][ctrIn] = mat[ctrOut][ctrIn];
        }
    }
};



papaya.volume.Transform.prototype.updateTransforms = function (mat) {
    console.log('Papaya updateTransforms');
    this.updateMat(mat);
    this.updateSizeMat();
    this.updateOrientMat();
    this.updateOriginMat();
    this.updateIndexTransform();
    this.updateIndexSliceTransform([mat, mat, mat]);
    this.updateMmTransform();
    this.updateWorldMat();
};


papaya.volume.Transform.prototype.updateRollTransforms = function (imageMats) {
    // this.updateMat(mat);
    this.updateSizeMat();
    this.updateOrientMat();
    this.updateOriginMat();
    this.updateIndexSliceTransform(imageMats);
    this.updateMmTransform();
};



papaya.volume.Transform.prototype.getVoxelAtIndexNative = function (ctrX, ctrY, ctrZ, timepoint, useNN) {
    return this.voxelValue.getVoxelAtIndexNative(ctrX, ctrY, ctrZ, timepoint, useNN);
};



papaya.volume.Transform.prototype.getVoxelAtIndex = function (ctrX, ctrY, ctrZ, timepoint, useNN) {
    return this.voxelValue.getVoxelAtIndex(ctrX, ctrY, ctrZ, timepoint, useNN);
};



papaya.volume.Transform.prototype.getVoxelAtCoordinate = function (xLoc, yLoc, zLoc, timepoint, useNN) {
    var xTrans, yTrans, zTrans;
    xTrans = ((xLoc * this.worldMat[0][0]) + (yLoc * this.worldMat[0][1]) + (zLoc * this.worldMat[0][2]) +
        (this.worldMat[0][3]));
    yTrans = ((xLoc * this.worldMat[1][0]) + (yLoc * this.worldMat[1][1]) + (zLoc * this.worldMat[1][2]) +
        (this.worldMat[1][3]));
    zTrans = ((xLoc * this.worldMat[2][0]) + (yLoc * this.worldMat[2][1]) + (zLoc * this.worldMat[2][2]) +
        (this.worldMat[2][3]));

    return this.voxelValue.getVoxelAtIndexNative(xTrans, yTrans, zTrans, timepoint, useNN);
};



papaya.volume.Transform.prototype.getVoxelAtMM = function (xLoc, yLoc, zLoc, timepoint, useNN, sliceLabel) {
    var xTrans, yTrans, zTrans, mat;
    mat = this.getmmMatFromSlice(sliceLabel);
    // xTrans = ((xLoc * this.mmMat[0][0]) + (yLoc * this.mmMat[0][1]) + (zLoc * this.mmMat[0][2]) + (this.mmMat[0][3]));
    // yTrans = ((xLoc * this.mmMat[1][0]) + (yLoc * this.mmMat[1][1]) + (zLoc * this.mmMat[1][2]) + (this.mmMat[1][3]));
    // zTrans = ((xLoc * this.mmMat[2][0]) + (yLoc * this.mmMat[2][1]) + (zLoc * this.mmMat[2][2]) + (this.mmMat[2][3]));
    xTrans = ((xLoc * mat[0][0]) + (yLoc * mat[0][1]) + (zLoc * mat[0][2]) + (mat[0][3]));
    yTrans = ((xLoc * mat[1][0]) + (yLoc * mat[1][1]) + (zLoc * mat[1][2]) + (mat[1][3]));
    zTrans = ((xLoc * mat[2][0]) + (yLoc * mat[2][1]) + (zLoc * mat[2][2]) + (mat[2][3]));

    return this.voxelValue.getVoxelAtIndexNative(xTrans, yTrans, zTrans, timepoint, useNN);
};

// Modified 13/01/2020: add getVoxelAtMM method based on slice

papaya.volume.Transform.prototype.getmmMatFromSlice = function (sliceLabel) {
    switch (sliceLabel) {
        case papaya.viewer.ScreenSlice.DIRECTION_AXIAL:
            if (!this.mmMatAxial) this.mmMatAxial = this.getSliceImageMat(this.rotMatAxial);
            return this.mmMatAxial;
        case papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL:
            if (!this.mmMatSagittal) this.mmMatSagittal = this.getSliceImageMat(this.rotMatSagittal);
            return this.mmMatSagittal;
        case papaya.viewer.ScreenSlice.DIRECTION_CORONAL:
            if (!this.mmMatCoronal) this.mmMatCoronal = this.getSliceImageMat(this.rotMatCoronal);
            return this.mmMatCoronal;
        default:
            return;
    }
}

papaya.volume.Transform.prototype.updateIndexSliceTransform = function (imageMats) {
    this.indexMatAxial = papaya.utilities.MatrixUtils.multiplyMatrices(this.orientMat, imageMats[0]);
    this.indexMatSagittal = papaya.utilities.MatrixUtils.multiplyMatrices(this.orientMat, imageMats[1]);
    this.indexMatCoronal = papaya.utilities.MatrixUtils.multiplyMatrices(this.orientMat, imageMats[2]);
};

papaya.volume.Transform.prototype.getDirections = function (sliceLabel) {
    switch (sliceLabel) {
        case papaya.viewer.ScreenSlice.DIRECTION_AXIAL:
            return [0, 0, 1];
        case papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL:
            return [1, 0, 0];
        case papaya.viewer.ScreenSlice.DIRECTION_CORONAL:
            return [0, 1, 0];
        default:
            return [0, 0, 1];
    }
}

papaya.volume.Transform.prototype.getRotationMat = function (sliceLabel) {
    switch (sliceLabel) {
        case papaya.viewer.ScreenSlice.DIRECTION_AXIAL:
            return this.rotMatAxial;
        case papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL:
            return this.rotMatSagittal;
        case papaya.viewer.ScreenSlice.DIRECTION_CORONAL:
            return this.rotMatCoronal;
        default:
            return this.rotMat;
    }
}

papaya.volume.Transform.prototype.reset = function () {

    this.rotMat = papaya.volume.Transform.IDENTITY.clone();

    // Modified 13/01/2020: add rotations and image matrices for EACH slices:
    this.rotMatAxial = papaya.volume.Transform.IDENTITY.clone();
    this.rotMatSagittal = papaya.volume.Transform.IDENTITY.clone();
    this.rotMatCoronal = papaya.volume.Transform.IDENTITY.clone();
    
    this.mmMatAxial = papaya.volume.Transform.IDENTITY.clone();
    this.mmMatSagittal = papaya.volume.Transform.IDENTITY.clone();
    this.mmMatCoronal = papaya.volume.Transform.IDENTITY.clone();

    this.indexMatAxial = papaya.volume.Transform.IDENTITY.clone();
    this.indexMatSagittal = papaya.volume.Transform.IDENTITY.clone();
    this.indexMatCoronal = papaya.volume.Transform.IDENTITY.clone();
    
    this.localizerAngleAxial = 0;
    this.localizerAngleSagittal = 0;
    this.localizerAngleCoronal = 0;
}