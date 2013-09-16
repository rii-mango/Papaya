
var papaya = papaya || {};
papaya.volume = papaya.volume || {};


/**
 * Constructor.
 */
papaya.volume.Transform = papaya.volume.Transform || function (mat, volume) {
    this.voxelValue = new papaya.volume.VoxelValue(volume.imageData, volume.header.imageType, volume.header.imageDimensions, volume.header.imageRange, volume.header.orientation);
    this.voxelDimensions = volume.header.voxelDimensions;
    this.imageDimensions = volume.header.imageDimensions;
    this.volume = volume;
    this.mat = papaya.volume.Transform.IDENTITY.clone();
    this.matInv = papaya.volume.Transform.IDENTITY.clone();
    this.indexMat = papaya.volume.Transform.IDENTITY.clone();
    this.sizeMat = papaya.volume.Transform.IDENTITY.clone();
    this.sizeMatInverse = papaya.volume.Transform.IDENTITY.clone();
    this.mmMat = papaya.volume.Transform.IDENTITY.clone();
    this.worldMat = papaya.volume.Transform.IDENTITY.clone();
    this.originMat = papaya.volume.Transform.IDENTITY.clone();
    this.tempMat = papaya.volume.Transform.IDENTITY.clone();
    this.tempMat2 = papaya.volume.Transform.IDENTITY.clone();
    this.orientMat = papaya.volume.Transform.IDENTITY.clone();

    this.updateTransforms(mat);
}



papaya.volume.Transform.IDENTITY = [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];


papaya.volume.Transform.prototype.updateSizeMat = function() {
    this.sizeMat[0][0] = this.voxelDimensions.xSize;
    this.sizeMat[1][1] = this.voxelDimensions.ySize;
    this.sizeMat[2][2] = this.voxelDimensions.zSize;
    this.sizeMat[3][3] = 1;

    this.sizeMatInverse[0][0] = 1 / this.voxelDimensions.xSize;
    this.sizeMatInverse[1][1] = 1 / this.voxelDimensions.ySize;
    this.sizeMatInverse[2][2] = 1 / this.voxelDimensions.zSize;
    this.sizeMatInverse[3][3] = 1;
}




papaya.volume.Transform.prototype.updateOrientMat = function() {
    //this.orientMat = this.volume.header.orientation.orientMat;
}



papaya.volume.Transform.prototype.updateIndexTransform = function() {
    for (var ctrOut = 0; ctrOut < 4; ctrOut++) {
        for (var ctrIn = 0; ctrIn < 4; ctrIn++) {
            this.indexMat[ctrOut][ctrIn] = (this.orientMat[ctrOut][0] * this.mat[0][ctrIn]) + (this.orientMat[ctrOut][1] * this.mat[1][ctrIn]) + (this.orientMat[ctrOut][2] * this.mat[2][ctrIn]) + (this.orientMat[ctrOut][3] * this.mat[3][ctrIn]);
        }
    }
}



papaya.volume.Transform.prototype.updateMmTransform = function() {
    for (var ctrOut = 0; ctrOut < 4; ctrOut++) {
        for (var ctrIn = 0; ctrIn < 4; ctrIn++) {
            this.mmMat[ctrOut][ctrIn] = (this.indexMat[ctrOut][0] * this.sizeMatInverse[0][ctrIn]) + (this.indexMat[ctrOut][1] * this.sizeMatInverse[1][ctrIn])
                + (this.indexMat[ctrOut][2] * this.sizeMatInverse[2][ctrIn]) + (this.indexMat[ctrOut][3] * this.sizeMatInverse[3][ctrIn]);
        }
    }
}



papaya.volume.Transform.prototype.updateOriginMat = function() {
    this.originMat[0][0] = 1;
    this.originMat[1][1] = -1;
    this.originMat[2][2] = -1;
    this.originMat[3][3] = 1;
    this.originMat[0][3] = this.volume.header.origin.x;
    this.originMat[1][3] = this.volume.header.origin.y;
    this.originMat[2][3] = this.volume.header.origin.z;
}



papaya.volume.Transform.prototype.updateWorldMat = function() {
    for (var ctrOut = 0; ctrOut < 4; ctrOut++) {
        for (var ctrIn = 0; ctrIn < 4; ctrIn++) {
            this.tempMat[ctrOut][ctrIn] = (this.indexMat[ctrOut][0] * this.originMat[0][ctrIn]) + (this.indexMat[ctrOut][1] * this.originMat[1][ctrIn])
                + (this.indexMat[ctrOut][2] * this.originMat[2][ctrIn]) + (this.indexMat[ctrOut][3] * this.originMat[3][ctrIn]);
        }
    }

    for (var ctrOut = 0; ctrOut < 4; ctrOut++) {
        for (var ctrIn = 0; ctrIn < 4; ctrIn++) {
            this.worldMat[ctrOut][ctrIn] = (this.tempMat[ctrOut][0] * this.sizeMatInverse[0][ctrIn]) + (this.tempMat[ctrOut][1] * this.sizeMatInverse[1][ctrIn])
                + (this.tempMat[ctrOut][2] * this.sizeMatInverse[2][ctrIn]) + (this.tempMat[ctrOut][3] * this.sizeMatInverse[3][ctrIn]);
        }
    }
}



papaya.volume.Transform.prototype.updateTransforms = function(mat) {
    this.mat = mat;
    this.matInv = numeric.inv(mat);

    this.updateSizeMat();
    this.updateOrientMat();
    this.updateOriginMat();
    this.updateIndexTransform();
    this.updateMmTransform();
    this.updateWorldMat();
}



papaya.volume.Transform.prototype.getVoxelAtIndex = function(ctrX, ctrY, ctrZ, useNN) {
    return this.voxelValue.getVoxelAtIndex(ctrX, ctrY, ctrZ, useNN);
}



papaya.volume.Transform.prototype.getVoxelAtCoordinate = function(xLoc, yLoc, zLoc, useNN) {
    var xTrans = ((xLoc * this.worldMat[0][0]) + (yLoc * this.worldMat[0][1]) + (zLoc * this.worldMat[0][2]) + (this.worldMat[0][3]));
    var yTrans = ((xLoc * this.worldMat[1][0]) + (yLoc * this.worldMat[1][1]) + (zLoc * this.worldMat[1][2]) + (this.worldMat[1][3]));
    var zTrans = ((xLoc * this.worldMat[2][0]) + (yLoc * this.worldMat[2][1]) + (zLoc * this.worldMat[2][2]) + (this.worldMat[2][3]));

    if ((xTrans < 0) || (xTrans >= this.imageDimensions.xDim) || (yTrans < 0) ||  (yTrans >= this.imageDimensions.yDim) || (zTrans < 0) || (zTrans >= this.imageDimensions.zDim)) {
        return 0;
    } else {
        return this.voxelValue.getVoxelAtIndex(xTrans, yTrans, zTrans, useNN);
    }
}



papaya.volume.Transform.prototype.printTransform = function(mat) {
    console.log(mat[0][0].toFixed(3) + " " + mat[0][1].toFixed(3) + " " + mat[0][2].toFixed(3) + " " + mat[0][3].toFixed(3));
    console.log(mat[1][0].toFixed(3) + " " + mat[1][1].toFixed(3) + " " + mat[1][2].toFixed(3) + " " + mat[1][3].toFixed(3));
    console.log(mat[2][0].toFixed(3) + " " + mat[2][1].toFixed(3) + " " + mat[2][2].toFixed(3) + " " + mat[2][3].toFixed(3));
    console.log(mat[3][0].toFixed(3) + " " + mat[3][1].toFixed(3) + " " + mat[3][2].toFixed(3) + " " + mat[3][3].toFixed(3));
    console.log("");
}
