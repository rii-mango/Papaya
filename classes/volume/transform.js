
var papaya = papaya || {};
papaya.volume = papaya.volume || {};


/**
 * Constructor.
 */
papaya.volume.Transform = papaya.volume.Transform || function (mat, volume) {
    this.mat = mat;
    this.voxelValue = new papaya.volume.VoxelValue(volume.imageData, volume.header.imageType, volume.header.orientation);
    this.voxelDimensions = volume.header.voxelDimensions;
    this.imageDimensions = volume.header.imageDimensions;

    this.indexMat = papaya.volume.Transform.IDENTITY.clone();
    this.sizeMat = papaya.volume.Transform.IDENTITY.clone();
    this.sizeMatInverse = papaya.volume.Transform.IDENTITY.clone();
    this.mmMat = papaya.volume.Transform.IDENTITY.clone();
    this.worldMat = papaya.volume.Transform.IDENTITY.clone();
    this.originMat = papaya.volume.Transform.IDENTITY.clone();
    this.tempMat = papaya.volume.Transform.IDENTITY.clone();
    this.tempMat2 = papaya.volume.Transform.IDENTITY.clone();
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
    orientMat = this.orientation.orientMat;
}




papaya.volume.Transform.prototype.getVoxelAtIndex = function(ctrX, ctrY, ctrZ) {
    return this.voxelValue.getVoxelAtIndex(ctrX, ctrY, ctrZ);
}
