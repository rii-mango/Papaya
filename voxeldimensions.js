
/**
 * @classDescription	A VoxelDimensions class stores voxel size information.
 */
var papaya = papaya || {};
papaya.volume = papaya.volume || {};


/**
 * Constructor.
 * @param colSize {Numeric}	The size of the column.
 * @param rowSize {Numeric} The size of the row.
 * @param sliceSize {Numeric}	The size of the slice.
 * @param timeSize {Numeric}	The duration that the image represents.
 */
papaya.volume.VoxelDimensions = papaya.volume.VoxelDimensions || function(colSize, rowSize, sliceSize, timeSize) {
	// Public properties
	this.colSize = Math.abs(colSize);
	this.rowSize = Math.abs(rowSize);
	this.sliceSize = Math.abs(sliceSize);
	this.xSize; this.ySize; this.zSize;
	this.timeSize = timeSize;	
}


/**
 * Tests wheter this object has a valid state.
 * @return {Boolean}	true if state is valid
 */
papaya.volume.VoxelDimensions.prototype.isValid = function() {
	return ((this.colSize > 0) && (this.rowSize > 0) && (this.sliceSize > 0) && (this.timeSize >= 0));
}