
/*
 * Copyright (c) 2012, RII-UTHSCSA
 * All rights reserved.

 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the 
 * following conditions are met:
 *
 *	- Redistributions of source code must retain the above copyright notice, this list of conditions and the following 
 *		disclaimer.
 *
 *	- Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the 
 *		following disclaimer in the documentation and/or other materials provided with the distribution.
 *
 *	- Neither the name of the RII-UTHSCSA nor the names of its contributors may be used to endorse or promote products 
 *		derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, 
 * INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, 
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR 
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, 
 * WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE 
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */


/**
 * @classDescription	Contains special methods that deal with the image orientation.
 */
var papaya = papaya || {};
papaya.volume = papaya.volume || {};


/**
 * Constructor.
 * @param {String} str	The data orientation of the image (e.g., XYZ+--).
 */
papaya.volume.Orientation = papaya.volume.Orientation || function(str) {
	// Public properties
	this.orientation = str;
	this.orientMat;
	this.xIncrement, this.yIncrement, this.zIncrement;
}


// Public constants
papaya.volume.Orientation.DEFAULT = "XYZ+--";


// Public methods

/**
 * Converts a coordinate index to a voxel offset.
 * @param {Numeric} xLoc	the X location
 * @param {Numeric} yLoc	the Y location
 * @param {Numeric} zLoc	the Z location
 * @return {Numeric}	the corresponding offset into the voxel array
 */
papaya.volume.Orientation.prototype.convertIndexToOffset = function(xLoc, yLoc, zLoc) {
	xLoc = Math.round((xLoc * this.orientMat[0][0]) + (yLoc * this.orientMat[0][1]) + (zLoc * this.orientMat[0][2]) + (this.orientMat[0][3]));
	yLoc = Math.round((xLoc * this.orientMat[1][0]) + (yLoc * this.orientMat[1][1]) + (zLoc * this.orientMat[1][2]) + (this.orientMat[1][3]));
	zLoc = Math.round((xLoc * this.orientMat[2][0]) + (yLoc * this.orientMat[2][1]) + (zLoc * this.orientMat[2][2]) + (this.orientMat[2][3]));

	return (xLoc * this.xIncrement) + (yLoc * this.yIncrement) + (zLoc * this.zIncrement);
}


/**
 * Populate ImageDimensions and VoxelDimensions objects with XYZ data.
 * @param {ImageDimensions} imageDimensions	the ImageDimensions object
 * @param {VoxelDimensions} voxelDimensions	the VoxelDimensions object
 */
papaya.volume.Orientation.prototype.createInfo = function(imageDimensions, voxelDimensions) {
	var xMultiply, yMultiply, zMultiply, xSubtract, ySubtract, zSubtract;
	var colOrientation, rowOrientation, sliceOrientation;

	var numCols = imageDimensions.cols;
	var numRows = imageDimensions.rows;
	var numSlices = imageDimensions.slices;
	var numVoxelsInSlice = imageDimensions.getNumVoxelsSlice();

	var colSize = voxelDimensions.colSize;
	var rowSize = voxelDimensions.rowSize;
	var sliceSize = voxelDimensions.sliceSize;

	if (this.orientation.charAt(3) == '+') {
		colOrientation = true;
	} else {
		colOrientation = false;
	}

	if (this.orientation.charAt(4) == '+') {
		rowOrientation = true;
	} else {
		rowOrientation = false;
	}

	if (this.orientation.charAt(5) == '+') {
		sliceOrientation = true;
	} else {
		sliceOrientation = false;
	}

	if (this.orientation.toUpperCase().indexOf("XYZ") != -1) {
		imageDimensions.xDim = numCols;
		imageDimensions.yDim = numRows;
		imageDimensions.zDim = numSlices;
		voxelDimensions.xSize = colSize;
		voxelDimensions.ySize = rowSize;
		voxelDimensions.zSize = sliceSize;

		this.xIncrement = 1;
		this.yIncrement = numCols;
		this.zIncrement = numVoxelsInSlice;

		if (colOrientation) {
			xMultiply = 1;
			xSubtract = 0;
		} else {
			xMultiply = -1;
			xSubtract = numCols - 1;
		}

		if (rowOrientation) {
			yMultiply = -1;
			ySubtract = numRows - 1;
		} else {
			yMultiply = 1;
			ySubtract = 0;
		}

		if (sliceOrientation) {
			zMultiply = -1;
			zSubtract = numSlices - 1;
		} else {
			zMultiply = 1;
			zSubtract = 0;
		}
	} else if (this.orientation.toUpperCase().indexOf("XZY") != -1) {
		imageDimensions.xDim = numCols;
		imageDimensions.yDim = numSlices;
		imageDimensions.zDim = numRows;
		voxelDimensions.xSize = colSize;
		voxelDimensions.ySize = sliceSize;
		voxelDimensions.zSize = rowSize;

		this.xIncrement = 1;
		this.yIncrement = numVoxelsInSlice;
		this.zIncrement = numCols;

		if (colOrientation) {

			xMultiply = 1;
			xSubtract = 0;
		} else {
			xMultiply = -1;
			xSubtract = numCols - 1;
		}

		if (rowOrientation) {

			zMultiply = -1;
			zSubtract = numRows - 1;
		} else {
			zMultiply = 1;
			zSubtract = 0;
		}

		if (sliceOrientation) {
			yMultiply = -1;
			ySubtract = numSlices - 1;
		} else {
			yMultiply = 1;
			ySubtract = 0;
		}
	} else if (this.orientation.toUpperCase().indexOf("YXZ") != -1) {
		imageDimensions.xDim = numRows;
		imageDimensions.yDim = numCols;
		imageDimensions.zDim = numSlices;
		voxelDimensions.xSize = rowSize;
		voxelDimensions.ySize = colSize;
		voxelDimensions.zSize = sliceSize;

		this.xIncrement = numCols;
		this.yIncrement = 1;
		this.zIncrement = numVoxelsInSlice;

		if (colOrientation) {
			yMultiply = -1;
			ySubtract = numCols - 1;
		} else {
			yMultiply = 1;
			ySubtract = 0;
		}

		if (rowOrientation) {
			xMultiply = 1;
			xSubtract = 0;
		} else {
			xMultiply = -1;
			xSubtract = numRows - 1;
		}

		if (sliceOrientation) {
			zMultiply = -1;
			zSubtract = numSlices - 1;
		} else {
			zMultiply = 1;
			zSubtract = 0;
		}
	} else if (this.orientation.toUpperCase().indexOf("YZX") != -1) {
		imageDimensions.xDim = numSlices;
		imageDimensions.yDim = numCols;
		imageDimensions.zDim = numRows;
		voxelDimensions.xSize = sliceSize;
		voxelDimensions.ySize = colSize;
		voxelDimensions.zSize = rowSize;

		this.xIncrement = numVoxelsInSlice;
		this.yIncrement = 1;
		this.zIncrement = numCols;

		if (colOrientation) {
			yMultiply = -1;
			ySubtract = numCols - 1;
		} else {
			yMultiply = 1;
			ySubtract = 0;
		}

		if (rowOrientation) {
			zMultiply = -1;
			zSubtract = numRows - 1;
		} else {
			zMultiply = 1;
			zSubtract = 0;
		}

		if (sliceOrientation) {
			xMultiply = 1;
			xSubtract = 0;
		} else {
			xMultiply = -1;
			xSubtract = numSlices - 1;
		}
	} else if (this.orientation.toUpperCase().indexOf("ZXY") != -1) {
		imageDimensions.xDim = numRows;
		imageDimensions.yDim = numSlices;
		imageDimensions.zDim = numCols;
		voxelDimensions.xSize = rowSize;
		voxelDimensions.ySize = sliceSize;
		voxelDimensions.zSize = colSize;

		this.xIncrement = numCols;
		this.yIncrement = numVoxelsInSlice;
		this.zIncrement = 1;

		if (colOrientation) {
			zMultiply = -1;
			zSubtract = numCols - 1;
		} else {
			zMultiply = 1;
			zSubtract = 0;
		}

		if (rowOrientation) {
			xMultiply = 1;
			xSubtract = 0;
		} else {
			xMultiply = -1;
			xSubtract = numRows - 1;
		}

		if (sliceOrientation) {
			yMultiply = -1;
			ySubtract = numSlices - 1;
		} else {
			yMultiply = 1;
			ySubtract = 0;
		}
	} else if (this.orientation.toUpperCase().indexOf("ZYX") != -1) {
		imageDimensions.xDim = numSlices;
		imageDimensions.yDim = numRows;
		imageDimensions.zDim = numCols;
		voxelDimensions.xSize = sliceSize;
		voxelDimensions.ySize = rowSize;
		voxelDimensions.zSize = colSize;

		this.xIncrement = numVoxelsInSlice;
		this.yIncrement = numCols;
		this.zIncrement = 1;

		if (colOrientation) {
			zMultiply = -1;
			zSubtract = numCols - 1;
		} else {
			zMultiply = 1;
			zSubtract = 0;
		}

		if (rowOrientation) {
			yMultiply = -1;
			ySubtract = numRows - 1;
		} else {
			yMultiply = 1;
			ySubtract = 0;
		}

		if (sliceOrientation) {
			xMultiply = 1;
			xSubtract = 0;
		} else {
			xMultiply = -1;
			xSubtract = numSlices - 1;
		}
	}

	this.orientMat = [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];

	this.orientMat[0][0] = xMultiply;
	this.orientMat[0][1] = 0;
	this.orientMat[0][2] = 0;
	this.orientMat[0][3] = xSubtract;

	this.orientMat[1][0] = 0;
	this.orientMat[1][1] = yMultiply;
	this.orientMat[1][2] = 0;
	this.orientMat[1][3] = ySubtract;

	this.orientMat[2][0] = 0;
	this.orientMat[2][1] = 0;
	this.orientMat[2][2] = zMultiply;
	this.orientMat[2][3] = zSubtract;

	this.orientMat[3][0] = 0;
	this.orientMat[3][1] = 0;
	this.orientMat[3][2] = 0;
	this.orientMat[3][3] = 1;
}


/**
 * Tests wheter this object has a valid state.
 * @return {Boolean}	true if state is valid
 */
papaya.volume.Orientation.prototype.isValid = function() {
	if (this.orientation == null || (this.orientation.length != 6)) {
		return false;
	}

	var temp = this.orientation.toUpperCase().indexOf("X");
	if (temp == -1 || temp > 2 || (this.orientation.toUpperCase().lastIndexOf("X") != temp)) {
		return false;
	}

	temp = this.orientation.toUpperCase().indexOf("Y");
	if (temp == -1 || temp > 2 || (this.orientation.toUpperCase().lastIndexOf("Y") != temp)) {
		return false;
	}

	temp = this.orientation.toUpperCase().indexOf("Z");
	if (temp == -1 || temp > 2 || (this.orientation.toUpperCase().lastIndexOf("Z") != temp)) {
		return false;
	}

	if ((this.orientation.charAt(3) != '+') && (this.orientation.charAt(3) != '-')) {
		return false;
	}

	if ((this.orientation.charAt(4) != '+') && (this.orientation.charAt(4) != '-')) {
		return false;
	}

	if ((this.orientation.charAt(5) != '+') && (this.orientation.charAt(5) != '-')) {
		return false;
	}

	return true;
}
