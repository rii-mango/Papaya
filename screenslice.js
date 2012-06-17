
/**
 * @classDescription	A representation of a displayed 2-D slice in one of three orthogonal directions.
 */
var papaya = papaya || {};
papaya.viewer = papaya.viewer || {};


/**
 * Constuctor.
 * @param {Volume} vol	the Volume object
 * @param {Numeric} dir	one of three orthogonal directions
 * @param {Numeric} width	number of pixels in X
 * @param {Numeric} height	number of pixels in Y
 * @param {Nuermic} widthSize	real world width of pixel
 * @param {Nuermic} heightSize	real world height of pixel
 */
papaya.viewer.ScreenSlice = papaya.viewer.ScreenSlice || function(vol, dir, width, height, widthSize, heightSize) {
	// Public properties
	this.volume = vol;
	this.sliceDirection = dir;
	this.currentSlice = 0;
	this.xDim = width;
	this.yDim = height;
	this.xSize = widthSize;
	this.ySize = heightSize;
	this.canvas = document.createElement("canvas");
	this.canvas.width = this.xDim;
	this.canvas.height = this.yDim;
	this.context = this.canvas.getContext("2d");
   	this.imageData = this.context.createImageData(this.xDim, this.yDim);
   	this.screenOffsetX = 0;
   	this.screenOffsetY = 0;
   	this.screenDim = 0;
	this.xformScaleX = 1;
	this.xformScaleY = 1;
	this.xformTransX = 0;
	this.xformTransY = 0;
	this.screenRatio = 1;
	this.screenMin = 0;
	this.screenMax = 0;
}


// Public constants
papaya.viewer.ScreenSlice.DIRECTION_UNKNOWN = 0;
papaya.viewer.ScreenSlice.DIRECTION_AXIAL = 1;
papaya.viewer.ScreenSlice.DIRECTION_CORONAL = 2;
papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL = 3;
papaya.viewer.ScreenSlice.SCREEN_PIXEL_MAX = 255;
papaya.viewer.ScreenSlice.SCREEN_PIXEL_MIN = 0;


// Public methods

/**
 * Update the screen slice.
 * @param {Numeric} slice	the new slice index
 */
papaya.viewer.ScreenSlice.prototype.updateSlice = function(slice) {
	slice = Math.round(slice);

	if (this.currentSlice != slice) {
		this.currentSlice = slice;
		
		var scale = this.volume.header.imageRange.globalScale;
		var intercept = this.volume.header.imageRange.globalIntercept;
		
		for (var ctrY = 0; ctrY < this.yDim; ctrY++) {
			for (var ctrX = 0; ctrX < this.xDim; ctrX++) {
				var value = 0;
				if (this.sliceDirection == papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
					value = this.volume.getVoxelAtIndex(ctrX, ctrY, slice);
				} else if (this.sliceDirection == papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
					value = this.volume.getVoxelAtIndex(ctrX, slice, ctrY);
				} else if (this.sliceDirection == papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
					value = this.volume.getVoxelAtIndex(slice, ctrX, ctrY);
				}

				value = (value * scale) + intercept;  // image value
				
				if (value <= this.screenMin) {
					value = papaya.viewer.ScreenSlice.SCREEN_PIXEL_MIN;  // screen value
				} else if (value >= this.screenMax) {
					value = papaya.viewer.ScreenSlice.SCREEN_PIXEL_MAX;  // screen value
				} else {
					value = Math.round(((value - this.screenMin) * this.screenRatio) + .5);  // screen value
				}

				var index = ((ctrY * this.xDim) + ctrX) * 4;
				this.imageData.data[index+0] = value;
				this.imageData.data[index+1] = value;
				this.imageData.data[index+2] = value;
				this.imageData.data[index+3] = 255;
			}
		}

		this.context.putImageData(this.imageData, 0, 0);
	}
}


/**
 * Returns the mm width of the slice.
 * @return {Numeric}	mm width of slice
 */
papaya.viewer.ScreenSlice.prototype.getRealWidth = function() {
	return this.xDim * this.xSize;
}


/**
 * Returns the mm height of the slice.
 * @return {Numeric}	mm height of slice
 */
papaya.viewer.ScreenSlice.prototype.getRealHeight = function() {
	return this.yDim * this.ySize;
}


/**
 * Returns the ratio of X voxel size to Y voxel size.
 * @return {Numeric}	X/Y ratio
 */
papaya.viewer.ScreenSlice.prototype.getXYratio = function() {
	return this.xSize / this.ySize;
}


/**
 * Returns the ratio of Y voxel size to X voxel size.
 * @return {Numeric}	Y/X ratio
 */
papaya.viewer.ScreenSlice.prototype.getYXratio = function() {
	return this.ySize / this.xSize;
}


/**
 * Returns the mm width of voxel.
 * @return {Numeric}	mm width of voxel
 */
papaya.viewer.ScreenSlice.prototype.getXSize = function() {
	return this.xSize;
}


/**
 * Returns the mm height of voxel.
 * @return {Numeric}	mm height of voxel
 */
papaya.viewer.ScreenSlice.prototype.getYSize = function() {
	return this.ySize;
}


/**
 * Returns number of voxels along X axis.
 * @return {Numeric}	number of voxels along X axis.
 */
papaya.viewer.ScreenSlice.prototype.getXDim = function() {
	return this.xDim;
}


/**
 * Returns number of voxels along Y axis.
 * @return {Numeric}	number of voxels along Y axis.
 */
papaya.viewer.ScreenSlice.prototype.getYDim = function() {
	return this.yDim;
}


papaya.viewer.ScreenSlice.prototype.setScreenRange = function(min, max, ratio) {
	this.screenMin = min;
	this.screenMax = max;
	this.screenRatio = ratio;
}
