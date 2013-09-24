
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
papaya.viewer.ScreenSlice = papaya.viewer.ScreenSlice || function(vol, dir, width, height, widthSize, heightSize, screenVols) {
	// Public properties
    this.screenVolumes = screenVols;
	this.sliceDirection = dir;
	this.currentSlice = 0;
	this.xDim = width;
	this.yDim = height;
	this.xSize = widthSize;
	this.ySize = heightSize;

	this.canvasMain = document.createElement("canvas");
	this.canvasMain.width = this.xDim;
	this.canvasMain.height = this.yDim;
    this.contextMain = this.canvasMain.getContext("2d");

    this.canvasDraw = document.createElement("canvas");
    this.canvasDraw.width = this.xDim;
    this.canvasDraw.height = this.yDim;
    this.contextDraw = this.canvasDraw.getContext("2d");
   	this.imageDataDraw = this.contextDraw.createImageData(this.xDim, this.yDim);

   	this.screenOffsetX = 0;
   	this.screenOffsetY = 0;
   	this.screenDim = 0;
	this.xformScaleX = 1;
	this.xformScaleY = 1;
	this.xformTransX = 0;
	this.xformTransY = 0;
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
papaya.viewer.ScreenSlice.prototype.updateSlice = function(slice, force) {
	slice = round(slice);

	if (force || (this.currentSlice != slice)) {
		this.currentSlice = slice;
        var origin = this.screenVolumes[0].volume.header.origin;  // base image origin
        var voxelDims = this.screenVolumes[0].volume.header.voxelDimensions;

        this.contextMain.clearRect(0, 0, this.canvasMain.width, this.canvasMain.height);

        for (var ctr = 0; ctr < this.screenVolumes.length; ctr++) {
            for (var ctrY = 0; ctrY < this.yDim; ctrY++) {
                for (var ctrX = 0; ctrX < this.xDim; ctrX++) {
                    var value = 0;
                    var alpha = 255;

                    if (ctr == 0) {
                        if (this.sliceDirection == papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
                            value = this.screenVolumes[ctr].volume.getVoxelAtIndex(ctrX, ctrY, slice, false);
                        } else if (this.sliceDirection == papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
                            value = this.screenVolumes[ctr].volume.getVoxelAtIndex(ctrX, slice, ctrY, false);
                        } else if (this.sliceDirection == papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
                            value = this.screenVolumes[ctr].volume.getVoxelAtIndex(slice, ctrX, ctrY, false);
                        }
                    } else {
                        if (this.sliceDirection == papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
                            value = this.screenVolumes[ctr].volume.getVoxelAtCoordinate((ctrX - origin.x) * voxelDims.xSize, (origin.y - ctrY) * voxelDims.ySize, (origin.z - slice) * voxelDims.zSize, false);
                        } else if (this.sliceDirection == papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
                            value = this.screenVolumes[ctr].volume.getVoxelAtCoordinate((ctrX - origin.x) * voxelDims.xSize, (origin.y - slice) * voxelDims.ySize, (origin.z - ctrY) * voxelDims.zSize, false);
                        } else if (this.sliceDirection == papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
                            value = this.screenVolumes[ctr].volume.getVoxelAtCoordinate((slice - origin.x) * voxelDims.xSize, (origin.y - ctrX) * voxelDims.ySize, (origin.z - ctrY) * voxelDims.zSize, false);
                        }
                    }

                    var orig = value;
                    if (value <= this.screenVolumes[ctr].screenMin) {
                        value = papaya.viewer.ScreenSlice.SCREEN_PIXEL_MIN;  // screen value
                        alpha = this.screenVolumes[ctr].isOverlay() ? 0 : 255;
                    } else if (value >= this.screenVolumes[ctr].screenMax) {
                        value = papaya.viewer.ScreenSlice.SCREEN_PIXEL_MAX;  // screen value
                    } else {
                        value = round(((value - this.screenVolumes[ctr].screenMin) * this.screenVolumes[ctr].screenRatio) + .5);  // screen value
                    }

                    var index = ((ctrY * this.xDim) + ctrX) * 4;
                    this.imageDataDraw.data[index+0] = this.screenVolumes[ctr].colorTable.lookupRed(value);
                    this.imageDataDraw.data[index+1] = this.screenVolumes[ctr].colorTable.lookupGreen(value);
                    this.imageDataDraw.data[index+2] = this.screenVolumes[ctr].colorTable.lookupBlue(value);
                    this.imageDataDraw.data[index+3] = alpha;
                }
            }

            this.contextDraw.putImageData(this.imageDataDraw, 0, 0);
            this.contextMain.globalAlpha = this.screenVolumes[ctr].alpha;
            this.contextMain.drawImage(this.canvasDraw, 0, 0);
        }
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
