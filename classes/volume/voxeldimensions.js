
var papaya = papaya || {};
papaya.volume = papaya.volume || {};



papaya.volume.VoxelDimensions = papaya.volume.VoxelDimensions || function (colSize, rowSize, sliceSize, timeSize) {
    this.colSize = Math.abs(colSize);
    this.rowSize = Math.abs(rowSize);
    this.sliceSize = Math.abs(sliceSize);
    this.xSize = 0;
    this.ySize = 0;
    this.zSize = 0;
    this.timeSize = timeSize;
};



papaya.volume.VoxelDimensions.prototype.isValid = function () {
    return ((this.colSize > 0) && (this.rowSize > 0) && (this.sliceSize > 0) && (this.timeSize >= 0));
};
