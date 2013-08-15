/**
 * @classDescription    A VoxelDimensions class stores voxel size information.
 */
var papaya = papaya || {};
papaya.volume = papaya.volume || {};


/**
 *
 * @type {*|Function}
 */
papaya.volume.VoxelDimensions = papaya.volume.VoxelDimensions ||

    /**
     *
     * @param colSize
     * @param rowSize
     * @param sliceSize
     * @param timeSize
     */
        function (colSize, rowSize, sliceSize, timeSize) {
        // Public properties
        this.colSize = Math.abs(colSize);
        this.rowSize = Math.abs(rowSize);
        this.sliceSize = Math.abs(sliceSize);
        this.xSize;
        this.ySize;
        this.zSize;
        this.timeSize = timeSize;
    }


/**
 *
 * @returns {boolean}
 */
papaya.volume.VoxelDimensions.prototype.isValid = function () {
    return ((this.colSize > 0) && (this.rowSize > 0) && (this.sliceSize > 0) && (this.timeSize >= 0));
}