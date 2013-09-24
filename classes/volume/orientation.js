/**
 * @classDescription	Contains special methods that deal with the image orientation.
 */
var papaya = papaya || {};
papaya.volume = papaya.volume || {};

/**
 * Constructor.
 * @param {String} str	The data orientation of the image (e.g., XYZ+--).
 */
papaya.volume.Orientation = papaya.volume.Orientation ||
function(str) {
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
	xLoc = round((xLoc * this.orientMat[0][0]) + (yLoc * this.orientMat[0][1]) + (zLoc * this.orientMat[0][2]) + (this.orientMat[0][3]));
	yLoc = round((xLoc * this.orientMat[1][0]) + (yLoc * this.orientMat[1][1]) + (zLoc * this.orientMat[1][2]) + (this.orientMat[1][3]));
	zLoc = round((xLoc * this.orientMat[2][0]) + (yLoc * this.orientMat[2][1]) + (zLoc * this.orientMat[2][2]) + (this.orientMat[2][3]));

	return (xLoc * this.xIncrement) + (yLoc * this.yIncrement) + (zLoc * this.zIncrement);
}



papaya.volume.Orientation.prototype.convertCoordinate = function(coord, coordConverted) {
    coordConverted.x = round((coord.x * this.orientMat[0][0]) + (coord.y * this.orientMat[0][1]) + (coord.z * this.orientMat[0][2]) + (this.orientMat[0][3]));
    coordConverted.y = round((coord.x * this.orientMat[1][0]) + (coord.y * this.orientMat[1][1]) + (coord.z * this.orientMat[1][2]) + (this.orientMat[1][3]));
    coordConverted.z = round((coord.x * this.orientMat[2][0]) + (coord.y * this.orientMat[2][1]) + (coord.z * this.orientMat[2][2]) + (this.orientMat[2][3]));
    return coordConverted;
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

	this.orientMat = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];

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

papaya.volume.Orientation.prototype.isValid = function() {
	return papaya.volume.Orientation.prototype.isValidOrientationString(this.orientation);

}
/**
 * Tests wheter this object has a valid state.
 * @return {Boolean}	true if state is valid
 */
papaya.volume.Orientation.prototype.isValidOrientationString = function(orientationStr) {
	if (orientationStr == null || (orientationStr.length != 6)) {
		return false;
	}

	var temp = orientationStr.toUpperCase().indexOf("X");
	if (temp == -1 || temp > 2 || (orientationStr.toUpperCase().lastIndexOf("X") != temp)) {
		return false;
	}

	temp = orientationStr.toUpperCase().indexOf("Y");
	if (temp == -1 || temp > 2 || (orientationStr.toUpperCase().lastIndexOf("Y") != temp)) {
		return false;
	}

	temp = orientationStr.toUpperCase().indexOf("Z");
	if (temp == -1 || temp > 2 || (orientationStr.toUpperCase().lastIndexOf("Z") != temp)) {
		return false;
	}

	if ((orientationStr.charAt(3) != '+') && (orientationStr.charAt(3) != '-')) {
		return false;
	}

	if ((orientationStr.charAt(4) != '+') && (orientationStr.charAt(4) != '-')) {
		return false;
	}

	if ((orientationStr.charAt(5) != '+') && (orientationStr.charAt(5) != '-')) {
		return false;
	}

	return true;
}



papaya.volume.Orientation.prototype.getOrientationDescription = function() {
    var ornt = this.orientation;
    return ("Cols (" + ornt.charAt(0) + ornt.charAt(3) + "), Rows (" + ornt.charAt(1) + ornt.charAt(4) + "), Slices (" + ornt.charAt(2) + ornt.charAt(5) + ")");
}
