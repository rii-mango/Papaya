
/**
 * @classDescription	An orthogonal viewer.
 */
var papaya = papaya || {};
papaya.viewer = papaya.viewer || {};


/**
 * Constructor.
 * @param {File} file	The file to read and display.
 */
papaya.viewer.Viewer = papaya.viewer.Viewer || function(file) {
	// Public properties
	this.volume = new papaya.volume.Volume();
	this.axialSlice; this.coronalSlice; this.sagittalSlice;
	this.mainImage; this.lowerImageBot; this.lowerImageTop;
	this.canvas = document.getElementById(PAPAYA_VIEWER_ID+"Canvas");
    this.context = this.canvas.getContext("2d");
    this.viewerDim = 0;
    this.currentCoord = new papaya.volume.Coordinate(0, 0, 0);
	this.longestDim; this.longestDimSize; this.draggingSliceDir;
    this.isDragging = false;
    
	this.volume.readFile(file, bind(this, this.initializeViewer));
}


// Public constants
papaya.viewer.Viewer.GAP = PAPAYA_SPACING;  // padding between slice views
papaya.viewer.Viewer.BACKGROUND_COLOR = "rgba(0, 0, 0, 255)";
papaya.viewer.Viewer.CROSSHAIRS_COLOR = "rgba(28, 134, 238, 255)";
papaya.viewer.Viewer.KEYCODE_ROTATE_VIEWS = 32;


// Public methods

/**
 * Initializes the viewer.
 */
papaya.viewer.Viewer.prototype.initializeViewer = function() {
	if (this.volume.hasError()) {
		alert(this.volume.errorMessage);
		return;
	}

	this.mainImage = this.axialSlice = new papaya.viewer.ScreenSlice(this.volume, papaya.viewer.ScreenSlice.DIRECTION_AXIAL,
	this.volume.getXDim(), this.volume.getYDim(), this.volume.getXSize(), this.volume.getYSize());

	this.lowerImageBot = this.coronalSlice = new papaya.viewer.ScreenSlice(this.volume, papaya.viewer.ScreenSlice.DIRECTION_CORONAL,
	this.volume.getXDim(), this.volume.getZDim(), this.volume.getXSize(), this.volume.getZSize());

	this.lowerImageTop = this.sagittalSlice = new papaya.viewer.ScreenSlice(this.volume, papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL,
	this.volume.getYDim(), this.volume.getZDim(), this.volume.getYSize(), this.volume.getZSize());

	this.canvas.addEventListener("mousemove", bind(this, this.mouseMoveEvent), false);
	this.canvas.addEventListener("mousedown", bind(this, this.mouseDownEvent), false);
	document.addEventListener("mouseup", bind(this, this.mouseUpEvent), false);
	document.addEventListener("keydown", bind(this, this.keyDownEvent), true);

	this.setLongestDim(this.volume);
	this.calculateScreenSliceTransforms(this);
	this.currentCoord.setCoordinate(this.volume.getXDim() / 2, this.volume.getYDim() / 2, this.volume.getZDim() / 2);
	this.updateScreenRange();
	PAPAYA_CANVAS.css({'background-color':'white', 'cursor':'crosshair'});
	this.drawViewer();
}


/**
 * Update position of current coordinate (intersection of crosshairs).
 * @param {Viewer} viewer	the viewer
 * @param {Numeric} xLoc	the new X location
 * @param {Numeric} yLoc	the new Y location 
 */
papaya.viewer.Viewer.prototype.updatePosition = function(viewer, xLoc, yLoc) {
	if (this.insideScreenSlice(viewer.axialSlice, xLoc, yLoc, viewer.volume.getXDim(), viewer.volume.getYDim())) {
		if (!this.isDragging || (this.draggingSliceDir == papaya.viewer.ScreenSlice.DIRECTION_AXIAL)) {
			var xImageLoc = (xLoc - viewer.axialSlice.xformTransX) / viewer.axialSlice.xformScaleX;
			var yImageLoc = (yLoc - viewer.axialSlice.xformTransY) / viewer.axialSlice.xformScaleY;

			if ((xImageLoc != viewer.currentCoord.x) || (yImageLoc != viewer.currentCoord.y)) {
				viewer.currentCoord.x = xImageLoc;
				viewer.currentCoord.y = yImageLoc;

				viewer.drawViewer();
			}
		}

		return papaya.viewer.ScreenSlice.DIRECTION_AXIAL;
	} else if (this.insideScreenSlice(viewer.coronalSlice, xLoc, yLoc, viewer.volume.getXDim(), viewer.volume.getZDim())) {
		if (!this.isDragging || (this.draggingSliceDir == papaya.viewer.ScreenSlice.DIRECTION_CORONAL)) {
			var xImageLoc = (xLoc - viewer.coronalSlice.xformTransX) / viewer.coronalSlice.xformScaleX;
			var yImageLoc = (yLoc - viewer.coronalSlice.xformTransY) / viewer.coronalSlice.xformScaleY;

			if ((xImageLoc != viewer.currentCoord.x) || (yImageLoc != viewer.currentCoord.y)) {
				viewer.currentCoord.x = xImageLoc;
				viewer.currentCoord.z = yImageLoc;

				viewer.drawViewer();
			}
		}

		return papaya.viewer.ScreenSlice.DIRECTION_CORONAL;
	} else if (this.insideScreenSlice(viewer.sagittalSlice, xLoc, yLoc, viewer.volume.getYDim(), viewer.volume.getZDim())) {
		if (!this.isDragging || (this.draggingSliceDir == papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL)) {
			var xImageLoc = (xLoc - viewer.sagittalSlice.xformTransX) / viewer.sagittalSlice.xformScaleX;
			var yImageLoc = (yLoc - viewer.sagittalSlice.xformTransY) / viewer.sagittalSlice.xformScaleY;

			if ((xImageLoc != viewer.currentCoord.x) || (yImageLoc != viewer.currentCoord.y)) {
				viewer.currentCoord.y = xImageLoc;
				viewer.currentCoord.z = yImageLoc;

				viewer.drawViewer();
			}
		}

		return papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL;
	} else {
		return papaya.viewer.ScreenSlice.DIRECTION_UNKNOWN;
	}
}


/**
 * Tests whether a screen coordinate is within a slice.
 * @param {ScreenSlice} screenSlice	the screen slice to test
 * @param {Numeric} xLoc	the X location
 * @param {Numeric} yLoc	the Y location
 * @param {Numeric} xBound	the X dimension limit
 * @param {Numeric} yBound	the Y dimension limit
 */
papaya.viewer.Viewer.prototype.insideScreenSlice = function(screenSlice, xLoc, yLoc, xBound, yBound) {
	var xStart = round(screenSlice.xformTransX);
	var xEnd = round(screenSlice.xformTransX + xBound*screenSlice.xformScaleX);
	var yStart = round(screenSlice.xformTransY);
	var yEnd = round(screenSlice.xformTransY + yBound*screenSlice.xformScaleY);
	return ((xLoc >= xStart) && (xLoc < xEnd) && (yLoc >= yStart) && (yLoc < yEnd));
}


/**
 * Draw the current state of the viewer.
 */
papaya.viewer.Viewer.prototype.drawViewer = function() {
	this.context.save();

	// update slice data
	this.axialSlice.updateSlice(this.currentCoord.z);
	this.coronalSlice.updateSlice(this.currentCoord.y);
	this.sagittalSlice.updateSlice(this.currentCoord.x);

	// intialize screen slices
	this.context.fillStyle = papaya.viewer.Viewer.BACKGROUND_COLOR;

	// draw screen slices
	this.context.setTransform(1, 0, 0, 1, 0, 0);
	this.context.fillRect(this.mainImage.screenOffsetX, this.mainImage.screenOffsetY, this.mainImage.screenDim, this.mainImage.screenDim);
	this.context.setTransform(this.mainImage.xformScaleX, 0, 0, this.mainImage.xformScaleY, this.mainImage.xformTransX, this.mainImage.xformTransY);
	this.context.drawImage(this.mainImage.canvas, 0, 0);

	this.context.setTransform(1, 0, 0, 1, 0, 0);
	this.context.fillRect(this.lowerImageBot.screenOffsetX, this.lowerImageBot.screenOffsetY, this.lowerImageBot.screenDim, this.lowerImageBot.screenDim);
	this.context.setTransform(this.lowerImageBot.xformScaleX, 0, 0, this.lowerImageBot.xformScaleY, this.lowerImageBot.xformTransX, this.lowerImageBot.xformTransY);
	this.context.drawImage(this.lowerImageBot.canvas, 0, 0);

	this.context.setTransform(1, 0, 0, 1, 0, 0);
	this.context.fillRect(this.lowerImageTop.screenOffsetX, this.lowerImageTop.screenOffsetY, this.lowerImageTop.screenDim, this.lowerImageTop.screenDim);
	this.context.setTransform(this.lowerImageTop.xformScaleX, 0, 0, this.lowerImageTop.xformScaleY, this.lowerImageTop.xformTransX, this.lowerImageTop.xformTransY);
	this.context.drawImage(this.lowerImageTop.canvas, 0, 0);

	// initialize crosshairs
	this.context.setTransform(1, 0, 0, 1, 0, 0);
	this.context.strokeStyle = papaya.viewer.Viewer.CROSSHAIRS_COLOR;
	this.context.lineWidth = 1.0;
	this.context.beginPath();

	// draw axial crosshairs
	var xLoc = floor(this.axialSlice.xformTransX + (this.currentCoord.x)*this.axialSlice.xformScaleX);
	var yStart = floor(this.axialSlice.xformTransY);
	var yEnd = floor(this.axialSlice.xformTransY + this.axialSlice.yDim*this.axialSlice.xformScaleY);
	this.context.moveTo(xLoc+.5, yStart);
	this.context.lineTo(xLoc+.5, yEnd);

	var yLoc = floor(this.axialSlice.xformTransY + (this.currentCoord.y)*this.axialSlice.xformScaleY);
	var xStart = floor(this.axialSlice.xformTransX);
	var xEnd = floor(this.axialSlice.xformTransX + this.axialSlice.xDim*this.axialSlice.xformScaleX);
	this.context.moveTo(xStart, yLoc+.5);
	this.context.lineTo(xEnd, yLoc+.5);

	// draw coronal crosshairs
	xLoc = floor(this.coronalSlice.xformTransX + this.currentCoord.x*this.coronalSlice.xformScaleX);
	yStart = floor(this.coronalSlice.xformTransY);
	yEnd = floor(this.coronalSlice.xformTransY + this.coronalSlice.yDim*this.coronalSlice.xformScaleY);
	this.context.moveTo(xLoc+.5, yStart);
	this.context.lineTo(xLoc+.5, yEnd);

	yLoc = floor(this.coronalSlice.xformTransY + this.currentCoord.z*this.coronalSlice.xformScaleY);
	xStart = floor(this.coronalSlice.xformTransX);
	xEnd = floor(this.coronalSlice.xformTransX + this.coronalSlice.xDim*this.coronalSlice.xformScaleX);
	this.context.moveTo(xStart, yLoc+.5);
	this.context.lineTo(xEnd, yLoc+.5);

	// draw sagittal crosshairs
	xLoc = floor(this.sagittalSlice.xformTransX + this.currentCoord.y*this.sagittalSlice.xformScaleX);
	yStart = floor(this.sagittalSlice.xformTransY);
	yEnd = floor(this.sagittalSlice.xformTransY + this.sagittalSlice.yDim*this.sagittalSlice.xformScaleY);
	this.context.moveTo(xLoc+.5, yStart);
	this.context.lineTo(xLoc+.5, yEnd);

	yLoc = floor(this.sagittalSlice.xformTransY + this.currentCoord.z*this.sagittalSlice.xformScaleY);
	xStart = floor(this.sagittalSlice.xformTransX);
	xEnd = floor(this.sagittalSlice.xformTransX + this.sagittalSlice.xDim*this.sagittalSlice.xformScaleX);
	this.context.moveTo(xStart, yLoc+.5);
	this.context.lineTo(xEnd, yLoc+.5);

	// finish crosshairs drawing
	this.context.closePath();
	this.context.stroke();

	this.context.restore();
}


/**
 * Calculates screen slice positions.
 * @param {Viewer} viewer	the viewer
 */
papaya.viewer.Viewer.prototype.calculateScreenSliceTransforms = function(viewer) {
	viewer.canvas.height = PAPAYA_DEFAULT_HEIGHT;
	viewer.viewerDim = viewer.canvas.height - (4 * papaya.viewer.Viewer.GAP);
	viewer.canvas.setAttribute("width", viewer.viewerDim * 1.5 + (4 * papaya.viewer.Viewer.GAP));

	this.getTransformParameters(viewer.mainImage, viewer.viewerDim, false);
	viewer.mainImage.xformTransX += viewer.mainImage.screenOffsetX = (2 * papaya.viewer.Viewer.GAP);
	viewer.mainImage.xformTransY += viewer.mainImage.screenOffsetY = (2 * papaya.viewer.Viewer.GAP);

	this.getTransformParameters(viewer.lowerImageBot, viewer.viewerDim, true);
	viewer.lowerImageBot.xformTransX += viewer.lowerImageBot.screenOffsetX = (viewer.viewerDim + (3 * papaya.viewer.Viewer.GAP));
	viewer.lowerImageBot.xformTransY += viewer.lowerImageBot.screenOffsetY = (((viewer.viewerDim-papaya.viewer.Viewer.GAP) / 2) + (3 * papaya.viewer.Viewer.GAP));

	this.getTransformParameters(viewer.lowerImageTop, viewer.viewerDim, true);
	viewer.lowerImageTop.xformTransX += viewer.lowerImageTop.screenOffsetX = (viewer.viewerDim + (3 * papaya.viewer.Viewer.GAP));
	viewer.lowerImageTop.xformTransY += viewer.lowerImageTop.screenOffsetY = (2 * papaya.viewer.Viewer.GAP);
}


/**
 * Calculates individual screen slice position.
 * @param {ScreenSlice} image	the screen slice
 * @param {Numeric} height	the height of the viewer
 * @param {Boolean} lower	true if this screen slice it not the main (larger) slice
 */
papaya.viewer.Viewer.prototype.getTransformParameters = function(image, height, lower) {
	var bigScale = lower ? 2 : 1;
	var scaleX, scaleY;

	if (image.getRealWidth() > image.getRealHeight()) {
		scaleX = (((lower ? height-papaya.viewer.Viewer.GAP : height) / this.longestDim) / bigScale) * (image.getXSize() / this.longestDimSize);
		scaleY = ((((lower ? height-papaya.viewer.Viewer.GAP : height) / this.longestDim) * image.getYXratio()) / bigScale) * (image.getXSize() / this.longestDimSize);
	} else {
		scaleX = ((((lower ? height-papaya.viewer.Viewer.GAP : height) / this.longestDim) * image.getXYratio()) / bigScale) * (image.getYSize() / this.longestDimSize);
		scaleY = (((lower ? height-papaya.viewer.Viewer.GAP : height) / this.longestDim) / bigScale) * (image.getYSize() / this.longestDimSize);
	}

	var transX = (((lower ? height-papaya.viewer.Viewer.GAP : height) / bigScale) - (image.getXDim() * scaleX)) / 2;
	var transY = (((lower ? height-papaya.viewer.Viewer.GAP : height) / bigScale) - (image.getYDim() * scaleY)) / 2;

	image.screenDim = (lower ? (height-papaya.viewer.Viewer.GAP) / 2 : height);
	image.xformScaleX = scaleX;
	image.xformScaleY = scaleY;
	image.xformTransX = transX;
	image.xformTransY = transY;
}


/**
 * Calculates the longest dimension.
 * @param {Volume} volume	the volume
 */
papaya.viewer.Viewer.prototype.setLongestDim = function(volume) {
	this.longestDim = volume.getXDim();
	this.longestDimSize = volume.getXSize();

	if ((volume.getYDim() * volume.getYSize()) > (this.longestDim * this.longestDimSize)) {
		this.longestDim = volume.getYDim();
		this.longestDimSize = volume.getYSize();
	}

	if ((volume.getZDim() * volume.getZSize()) > (this.longestDim * this.longestDimSize)) {
		this.longestDim = volume.getZDim();
		this.longestDimSize = volume.getZSize();
	}
}


/**
 * The keydown event callback.
 * @param {Object} ke	the key event
 */
papaya.viewer.Viewer.prototype.keyDownEvent = function(ke) {
	var keyCode = getKeyCode(ke);

	if (keyCode == papaya.viewer.Viewer.KEYCODE_ROTATE_VIEWS) {
		var temp = this.lowerImageBot;
		this.lowerImageBot = this.lowerImageTop;
		this.lowerImageTop = this.mainImage;
		this.mainImage = temp;
		this.calculateScreenSliceTransforms(this);
		this.drawViewer();
	}
}


/**
 * The mousedown event callback.
 * @param {Object} me	the mouse event
 */
papaya.viewer.Viewer.prototype.mouseDownEvent = function(me) {
	this.draggingSliceDir = this.updatePosition(this, getMousePositionX(me), getMousePositionY(me));
	this.isDragging = true;
}


/**
 * The mouseup event callback.
 * @param {Object} me	the mouse event
 */
papaya.viewer.Viewer.prototype.mouseUpEvent = function(me) {
	this.isDragging = false;
}


/**
 * The mousemove event callback.
 * @param {Object} me 	the mouse event
 */
papaya.viewer.Viewer.prototype.mouseMoveEvent = function(me) {
	if (this.isDragging) {
		this.updatePosition(this, getMousePositionX(me), getMousePositionY(me));
	}
}


/**
 * Sets the ratio of screen pixel range to image display range and other range info.
 */
papaya.viewer.Viewer.prototype.updateScreenRange = function() {
	var ratio = (papaya.viewer.ScreenSlice.SCREEN_PIXEL_MAX / (this.volume.header.imageRange.displayMax - this.volume.header.imageRange.displayMin));
	var min = this.volume.header.imageRange.displayMin;
	var max = this.volume.header.imageRange.displayMax;
	
	this.lowerImageBot.setScreenRange(min, max, ratio);
	this.lowerImageTop.setScreenRange(min, max, ratio);
	this.mainImage.setScreenRange(min, max, ratio);
}
