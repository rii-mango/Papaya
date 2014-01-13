
/*jslint browser: true, node: true */
/*global PAPAYA_SPACING, bind, papayaMain, isString, round, floor, getKeyCode, isControlKey, getMousePositionX,
getMousePositionY, signum, wordwrap, getSizeString, formatNumber, papayaParams, deref */

"use strict";


var papaya = papaya || {};
papaya.viewer = papaya.viewer || {};
var PAPAYA_VERSION_ID = PAPAYA_VERSION_ID || "0.0";
var PAPAYA_BUILD_NUM = PAPAYA_BUILD_NUM || "0";


papaya.viewer.Viewer = papaya.viewer.Viewer || function (width, height, params) {
    this.canvas = document.createElement("canvas");
    this.canvas.width = width;
    this.canvas.height = height;
    this.context = this.canvas.getContext("2d");
    this.canvas.style.padding = 0;
    this.canvas.style.margin = 0;
    this.canvas.style.border = "none";
    this.atlas = null;
    this.initialized = false;
    this.loadingVolume = null;
    this.volume = new papaya.volume.Volume();
    this.screenVolumes = [];
    this.currentScreenVolume = null;
    this.axialSlice = null;
    this.coronalSlice = null;
    this.sagittalSlice = null;
    this.mainImage = null;
    this.lowerImageBot = null;
    this.lowerImageTop = null;
    this.viewerDim = 0;
    this.worldSpace = false;
    this.currentCoord = new papaya.core.Coordinate(0, 0, 0);
    this.longestDim = 0;
    this.longestDimSize = 0;
    this.draggingSliceDir = 0;
    this.isDragging = false;
    this.isWindowControl = false;
    this.previousMousePosition = new papaya.core.Point();
    this.isControlKeyDown = false;
    this.toggleMainCrosshairs = true;
    this.listenerMouseMove = bind(this, this.mouseMoveEvent);
    this.listenerMouseDown = bind(this, this.mouseDownEvent);
    this.listenerMouseOut = bind(this, this.mouseOutEvent);
    this.listenerMouseUp = bind(this, this.mouseUpEvent);
    this.listenerKeyDown = bind(this, this.keyDownEvent);
    this.listenerKeyUp = bind(this, this.keyUpEvent);
    this.listenerTouchMove = bind(this, this.touchMoveEvent);
    this.updateTimer = null;
    this.updateTimerEvent = null;
    this.listenerContextMenu = function (e) { e.preventDefault(); return false; };
    this.drawEmptyViewer();

    this.processParams(params);
};



papaya.viewer.Viewer.GAP = PAPAYA_SPACING;  // padding between slice views
papaya.viewer.Viewer.BACKGROUND_COLOR = "rgba(0, 0, 0, 255)";
papaya.viewer.Viewer.CROSSHAIRS_COLOR = "rgba(28, 134, 238, 255)";
papaya.viewer.Viewer.KEYCODE_ROTATE_VIEWS = 32;
papaya.viewer.Viewer.KEYCODE_CENTER = 67;
papaya.viewer.Viewer.KEYCODE_ORIGIN = 79;
papaya.viewer.Viewer.KEYCODE_ARROW_UP = 38;
papaya.viewer.Viewer.KEYCODE_ARROW_DOWN = 40;
papaya.viewer.Viewer.KEYCODE_ARROW_RIGHT = 39;
papaya.viewer.Viewer.KEYCODE_ARROW_LEFT = 37;
papaya.viewer.Viewer.KEYCODE_PAGE_UP = 33;
papaya.viewer.Viewer.KEYCODE_PAGE_DOWN = 34;
papaya.viewer.Viewer.KEYCODE_SINGLE_QUOTE = 222;
papaya.viewer.Viewer.KEYCODE_FORWARD_SLASH = 191;
papaya.viewer.Viewer.KEYCODE_INCREMENT_MAIN = 71;
papaya.viewer.Viewer.KEYCODE_DECREMENT_MAIN = 86;
papaya.viewer.Viewer.KEYCODE_TOGGLE_CROSSHAIRS = 65;
papaya.viewer.Viewer.MAX_OVERLAYS = 8;
papaya.viewer.Viewer.ORIENTATION_MARKER_SUPERIOR = "S";
papaya.viewer.Viewer.ORIENTATION_MARKER_INFERIOR = "I";
papaya.viewer.Viewer.ORIENTATION_MARKER_ANTERIOR = "A";
papaya.viewer.Viewer.ORIENTATION_MARKER_POSTERIOR = "P";
papaya.viewer.Viewer.ORIENTATION_MARKER_LEFT = "L";
papaya.viewer.Viewer.ORIENTATION_MARKER_RIGHT = "R";
papaya.viewer.Viewer.ORIENTATION_MARKER_SIZE = 16;
papaya.viewer.Viewer.ORIENTATION_CERTAINTY_UNKNOWN_COLOR = "red";
papaya.viewer.Viewer.ORIENTATION_CERTAINTY_LOW_COLOR = "yellow";
papaya.viewer.Viewer.ORIENTATION_CERTAINTY_HIGH_COLOR = "white";
papaya.viewer.Viewer.UPDATE_TIMER_INTERVAL = 250;



papaya.viewer.Viewer.prototype.loadImage = function (name, forceUrl, forceEncode) {
    if (this.screenVolumes.length === 0) {
        this.loadBaseImage(name, forceUrl, forceEncode);
    } else {
        this.loadOverlay(name, forceUrl, forceEncode);
    }
};



papaya.viewer.Viewer.prototype.loadBaseImage = function (name, forceUrl, forceEncode) {
    var loadableImage = papayaMain.findLoadableImage(name, forceUrl, forceEncode);
    this.volume = new papaya.volume.Volume();

    if (forceEncode) {
        this.volume.readEncodedData(name, bind(this, this.initializeViewer));
    } else if ((loadableImage !== null) && (loadableImage.encode !== undefined)) {
        this.volume.readEncodedData(loadableImage.encode, bind(this, this.initializeViewer));
    } else if (forceUrl) {
        this.volume.readURL(name, bind(this, this.initializeViewer));
    } else if ((loadableImage !== null) && (loadableImage.url !== undefined)) {
        this.volume.readURL(loadableImage.url, bind(this, this.initializeViewer));
    } else {
        this.volume.readFile(name, bind(this, this.initializeViewer));
    }
};



papaya.viewer.Viewer.prototype.loadOverlay = function (name, forceUrl, forceEncode) {
    var loadableImage = papayaMain.findLoadableImage(name);
    this.loadingVolume = new papaya.volume.Volume();

    if (this.screenVolumes.length > papaya.viewer.Viewer.MAX_OVERLAYS) {
        this.loadingVolume.errorMessage = "Maximum number of overlays (" + papaya.viewer.Viewer.MAX_OVERLAYS + ") has been reached!";
        this.initializeOverlay();
    } else {
        if (forceEncode) {
            this.loadingVolume.readEncodedData(name, bind(this, this.initializeOverlay));
        } else if ((loadableImage !== null) && (loadableImage.encode !== undefined)) {
            this.loadingVolume.readEncodedData(loadableImage.encode, bind(this, this.initializeOverlay));
        } else if (forceUrl) {
            this.loadingVolume.readURL(name, bind(this, this.initializeOverlay));
        } else if ((loadableImage !== null) && (loadableImage.url !== undefined)) {
            this.loadingVolume.readURL(loadableImage.url, bind(this, this.initializeOverlay));
        } else {
            this.loadingVolume.readFile(name, bind(this, this.initializeOverlay));
        }
    }
};



papaya.viewer.Viewer.prototype.initializeViewer = function () {
    var papayaDataType, papayaDataTalairachAtlasType;

    if (this.volume.hasError()) {
        console.error(this.volume.errorMessage);

        if (papayaMain.papayaDisplay) {
            papayaMain.papayaDisplay.drawError(this.volume.errorMessage);
        }
        return;
    }

    papayaDataType = (typeof papaya.data);

    if (papayaDataType !== "undefined") {
        papayaDataTalairachAtlasType = (typeof papaya.data.Atlas);

        if (papayaDataTalairachAtlasType !== "undefined") {
            this.atlas = new papaya.viewer.Atlas(papaya.data.Atlas);
        }
    }

    this.screenVolumes[0] = new papaya.viewer.ScreenVolume(this.volume, papaya.viewer.ColorTable.DEFAULT_COLOR_TABLE.name, true);
    this.setCurrentScreenVol(0);

    this.mainImage = this.axialSlice = new papaya.viewer.ScreenSlice(this.volume, papaya.viewer.ScreenSlice.DIRECTION_AXIAL,
        this.volume.getXDim(), this.volume.getYDim(), this.volume.getXSize(), this.volume.getYSize(), this.screenVolumes);

    this.lowerImageBot = this.coronalSlice = new papaya.viewer.ScreenSlice(this.volume, papaya.viewer.ScreenSlice.DIRECTION_CORONAL,
        this.volume.getXDim(), this.volume.getZDim(), this.volume.getXSize(), this.volume.getZSize(), this.screenVolumes);

    this.lowerImageTop = this.sagittalSlice = new papaya.viewer.ScreenSlice(this.volume, papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL,
        this.volume.getYDim(), this.volume.getZDim(), this.volume.getYSize(), this.volume.getZSize(), this.screenVolumes);

    this.canvas.addEventListener("mousemove", this.listenerMouseMove, false);
    this.canvas.addEventListener("mousedown", this.listenerMouseDown, false);
    this.canvas.addEventListener("mouseout", this.listenerMouseOut, false);
    document.addEventListener("mouseup", this.listenerMouseUp, false);
    document.addEventListener("keydown", this.listenerKeyDown, true);
    document.addEventListener("keyup", this.listenerKeyUp, true);
    document.addEventListener("contextmenu", this.listenerContextMenu, false);
    this.canvas.addEventListener("touchmove", this.listenerTouchMove, false);
    this.canvas.addEventListener("touchstart", this.listenerMouseDown, false);
    this.canvas.addEventListener("touchend", this.listenerMouseUp, false);

    this.setLongestDim(this.volume);
    this.calculateScreenSliceTransforms(this);
    this.currentCoord.setCoordinate(this.volume.getXDim() / 2, this.volume.getYDim() / 2, this.volume.getZDim() / 2);

    this.canvasRect = this.canvas.getBoundingClientRect();

    this.context.fillStyle = "white";
    this.context.fillRect(0, 0, this.canvasRect.right, this.canvasRect.bottom);

    this.initialized = true;
    this.drawViewer();

    papayaMain.papayaToolbar.buildToolbar();
    papayaMain.papayaToolbar.updateImageButtons();

    papayaMain.loadNext();
};



papaya.viewer.Viewer.prototype.initializeOverlay = function () {
    var screenParams, parametric;

    if (this.loadingVolume.hasError()) {
        papayaMain.papayaDisplay.drawError(this.loadingVolume.errorMessage);
        this.loadingVolume = null;
        return;
    }

    screenParams = papayaParams[this.loadingVolume.fileName];
    parametric = (screenParams && screenParams.parametric);

    this.screenVolumes[this.screenVolumes.length] = new papaya.viewer.ScreenVolume(this.loadingVolume, (parametric ? papaya.viewer.ColorTable.PARAMETRIC_COLOR_TABLES[0].name : this.getNextColorTable()), false);
    this.setCurrentScreenVol(this.screenVolumes.length - 1);
    this.drawViewer(true);
    papayaMain.papayaToolbar.buildToolbar();
    papayaMain.papayaToolbar.updateImageButtons();

    //even if "parametric" is set to true we should not add another screenVolume if the value range does not cross zero
    if (parametric) {
        this.screenVolumes[this.screenVolumes.length - 1].findImageRange();
        if (this.screenVolumes[this.screenVolumes.length - 1].volume.header.imageRange.imageMin < 0) {
            this.screenVolumes[this.screenVolumes.length] = new papaya.viewer.ScreenVolume(this.loadingVolume, papaya.viewer.ColorTable.PARAMETRIC_COLOR_TABLES[1].name, false, true);
            this.setCurrentScreenVol(this.screenVolumes.length - 1);
            this.drawViewer(true);
            papayaMain.papayaToolbar.buildToolbar();
            papayaMain.papayaToolbar.updateImageButtons();
        }
    }

    this.loadingVolume = null;
    papayaMain.loadNext();
};



papaya.viewer.Viewer.prototype.updatePosition = function (viewer, xLoc, yLoc, crosshairsOnly) {
    var xImageLoc, yImageLoc, temp;

    xLoc = xLoc - this.canvasRect.left;
    yLoc = yLoc - this.canvasRect.top;

    if (this.insideScreenSlice(viewer.axialSlice, xLoc, yLoc, viewer.volume.getXDim(), viewer.volume.getYDim())) {
        if (!this.isDragging || (this.draggingSliceDir === papaya.viewer.ScreenSlice.DIRECTION_AXIAL)) {
            xImageLoc = (xLoc - viewer.axialSlice.xformTransX) / viewer.axialSlice.xformScaleX;
            yImageLoc = (yLoc - viewer.axialSlice.xformTransY) / viewer.axialSlice.xformScaleY;

            if ((xImageLoc !== viewer.currentCoord.x) || (yImageLoc !== viewer.currentCoord.y)) {
                viewer.currentCoord.x = xImageLoc;
                viewer.currentCoord.y = yImageLoc;
                this.draggingSliceDir = papaya.viewer.ScreenSlice.DIRECTION_AXIAL;
            }
        }
    } else if (this.insideScreenSlice(viewer.coronalSlice, xLoc, yLoc, viewer.volume.getXDim(), viewer.volume.getZDim())) {
        if (!this.isDragging || (this.draggingSliceDir === papaya.viewer.ScreenSlice.DIRECTION_CORONAL)) {
            xImageLoc = (xLoc - viewer.coronalSlice.xformTransX) / viewer.coronalSlice.xformScaleX;
            yImageLoc = (yLoc - viewer.coronalSlice.xformTransY) / viewer.coronalSlice.xformScaleY;

            if ((xImageLoc !== viewer.currentCoord.x) || (yImageLoc !== viewer.currentCoord.y)) {
                viewer.currentCoord.x = xImageLoc;
                viewer.currentCoord.z = yImageLoc;
                this.draggingSliceDir = papaya.viewer.ScreenSlice.DIRECTION_CORONAL;
            }
        }
    } else if (this.insideScreenSlice(viewer.sagittalSlice, xLoc, yLoc, viewer.volume.getYDim(), viewer.volume.getZDim())) {
        if (!this.isDragging || (this.draggingSliceDir === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL)) {
            xImageLoc = (xLoc - viewer.sagittalSlice.xformTransX) / viewer.sagittalSlice.xformScaleX;
            yImageLoc = (yLoc - viewer.sagittalSlice.xformTransY) / viewer.sagittalSlice.xformScaleY;

            if ((xImageLoc !== viewer.currentCoord.x) || (yImageLoc !== viewer.currentCoord.y)) {
                temp = xImageLoc;
                viewer.currentCoord.y = temp;
                viewer.currentCoord.z = yImageLoc;
                this.draggingSliceDir = papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL;
            }
        }
    }

    viewer.drawViewer(false, crosshairsOnly);
};



papaya.viewer.Viewer.prototype.updateCursorPosition = function (viewer, xLoc, yLoc) {
    var xImageLoc, yImageLoc, zImageLoc, found;

    if (papayaMain.papayaDisplay) {
        xLoc = xLoc - this.canvasRect.left;
        yLoc = yLoc - this.canvasRect.top;

        if (this.insideScreenSlice(viewer.axialSlice, xLoc, yLoc, viewer.volume.getXDim(), viewer.volume.getYDim())) {
            xImageLoc = (xLoc - viewer.axialSlice.xformTransX) / viewer.axialSlice.xformScaleX;
            yImageLoc = (yLoc - viewer.axialSlice.xformTransY) / viewer.axialSlice.xformScaleY;
            zImageLoc = viewer.axialSlice.currentSlice;
            found = true;
        } else if (this.insideScreenSlice(viewer.coronalSlice, xLoc, yLoc, viewer.volume.getXDim(), viewer.volume.getZDim())) {
            xImageLoc = (xLoc - viewer.coronalSlice.xformTransX) / viewer.coronalSlice.xformScaleX;
            zImageLoc = (yLoc - viewer.coronalSlice.xformTransY) / viewer.coronalSlice.xformScaleY;
            yImageLoc = viewer.coronalSlice.currentSlice;
            found = true;
        } else if (this.insideScreenSlice(viewer.sagittalSlice, xLoc, yLoc, viewer.volume.getYDim(), viewer.volume.getZDim())) {
            yImageLoc = (xLoc - viewer.sagittalSlice.xformTransX) / viewer.sagittalSlice.xformScaleX;
            zImageLoc = (yLoc - viewer.sagittalSlice.xformTransY) / viewer.sagittalSlice.xformScaleY;
            xImageLoc = viewer.sagittalSlice.currentSlice;
            found = true;
        }

        if (found) {
            papayaMain.papayaDisplay.drawDisplay(xImageLoc, yImageLoc, zImageLoc);
        } else {
            papayaMain.papayaDisplay.drawEmptyDisplay();
        }
    }
};



papaya.viewer.Viewer.prototype.insideScreenSlice = function (screenSlice, xLoc, yLoc, xBound, yBound) {
    var xStart, xEnd, yStart, yEnd;

    xStart = round(screenSlice.xformTransX);
    xEnd = round(screenSlice.xformTransX + xBound * screenSlice.xformScaleX);
    yStart = round(screenSlice.xformTransY);
    yEnd = round(screenSlice.xformTransY + yBound * screenSlice.xformScaleY);

    return ((xLoc >= xStart) && (xLoc < xEnd) && (yLoc >= yStart) && (yLoc < yEnd));
};



papaya.viewer.Viewer.prototype.drawEmptyViewer = function () {
    var locY, fontSize, text, metrics, textWidth;

    // clear area
    this.context.fillStyle = "#000000";
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // draw drop text
    this.context.fillStyle = "#AAAAAA";
    fontSize = 18;
    this.context.font = fontSize + "px Arial";
    locY = this.canvas.height - 22;
    text = "Drop here or click the File menu";
    metrics = this.context.measureText(text);
    textWidth = metrics.width;
    this.context.fillText(text, (this.canvas.width / 2) - (textWidth / 2), locY);

    if (this.canvas.width > 900) {
        // draw supported formats
        fontSize = 14;
        this.context.font = fontSize + "px Arial";
        locY = this.canvas.height - 20;
        text = "Supported formats: NIFTI (.nii, .nii.gz)";
        this.context.fillText(text, 20, locY);

        // draw Papaya version info
        fontSize = 14;
        this.context.font = fontSize + "px Arial";
        locY = this.canvas.height - 20;

        text = "Papaya v" + (PAPAYA_VERSION_ID || "Dev")
            + " (build " + (PAPAYA_BUILD_NUM !== undefined ? PAPAYA_BUILD_NUM : "Dev") + ")";
        metrics = this.context.measureText(text);
        textWidth = metrics.width;
        this.context.fillText(text, this.canvas.width - textWidth - 20, locY);
    }
};



papaya.viewer.Viewer.prototype.drawViewer = function (force, skipUpdate) {
    var orientWidth, orientHeight, orientStartX, orientEndX, orientMidX, orientStartY, orientEndY, orientMidY,
        orientSlice, metrics, textWidth, top, bottom, left, right, temp;

    if (!this.initialized) {
        this.drawEmptyViewer();
        return;
    }

    this.context.save();

    if (!skipUpdate) {
        if (force || (this.draggingSliceDir !== papaya.viewer.ScreenSlice.DIRECTION_AXIAL)) {
            this.axialSlice.updateSlice(this.currentCoord.z, force, this.worldSpace);
        }

        if (force || (this.draggingSliceDir !== papaya.viewer.ScreenSlice.DIRECTION_CORONAL)) {
            this.coronalSlice.updateSlice(this.currentCoord.y, force, this.worldSpace);
        }

        if (force || (this.draggingSliceDir !== papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL)) {
            this.sagittalSlice.updateSlice(this.currentCoord.x, force, this.worldSpace);
        }
    }

    // intialize screen slices
    this.context.fillStyle = papaya.viewer.Viewer.BACKGROUND_COLOR;

    // draw screen slices
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.fillRect(this.mainImage.screenOffsetX, this.mainImage.screenOffsetY, this.mainImage.screenDim,
        this.mainImage.screenDim);
    this.context.setTransform(this.mainImage.xformScaleX, 0, 0, this.mainImage.xformScaleY, this.mainImage.xformTransX,
        this.mainImage.xformTransY);
    this.context.drawImage(this.mainImage.canvasMain, 0, 0);

    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.fillRect(this.lowerImageBot.screenOffsetX, this.lowerImageBot.screenOffsetY,
        this.lowerImageBot.screenDim, this.lowerImageBot.screenDim);
    this.context.setTransform(this.lowerImageBot.xformScaleX, 0, 0, this.lowerImageBot.xformScaleY,
        this.lowerImageBot.xformTransX, this.lowerImageBot.xformTransY);
    this.context.drawImage(this.lowerImageBot.canvasMain, 0, 0);

    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.fillRect(this.lowerImageTop.screenOffsetX, this.lowerImageTop.screenOffsetY,
        this.lowerImageTop.screenDim, this.lowerImageTop.screenDim);
    this.context.setTransform(this.lowerImageTop.xformScaleX, 0, 0, this.lowerImageTop.xformScaleY,
        this.lowerImageTop.xformTransX, this.lowerImageTop.xformTransY);
    this.context.drawImage(this.lowerImageTop.canvasMain, 0, 0);

    if (papayaMain.preferences.showOrientation === "Yes") {
        this.context.setTransform(1, 0, 0, 1, 0, 0);
        this.context.fillStyle = this.getOrientationCertaintyColor();
        this.context.font = papaya.viewer.Viewer.ORIENTATION_MARKER_SIZE + "px Arial";
        metrics = this.context.measureText("X");
        textWidth = metrics.width;

        if (this.mainImage === this.axialSlice) {
            orientWidth = this.volume.header.imageDimensions.xDim;
            orientHeight = this.volume.header.imageDimensions.yDim;

            top = papaya.viewer.Viewer.ORIENTATION_MARKER_ANTERIOR;
            bottom = papaya.viewer.Viewer.ORIENTATION_MARKER_POSTERIOR;
            left = papaya.viewer.Viewer.ORIENTATION_MARKER_LEFT;
            right = papaya.viewer.Viewer.ORIENTATION_MARKER_RIGHT;

            orientSlice = this.axialSlice;
        } else if (this.mainImage === this.coronalSlice) {
            orientWidth = this.volume.header.imageDimensions.xDim;
            orientHeight = this.volume.header.imageDimensions.zDim;

            top = papaya.viewer.Viewer.ORIENTATION_MARKER_SUPERIOR;
            bottom = papaya.viewer.Viewer.ORIENTATION_MARKER_INFERIOR;
            left = papaya.viewer.Viewer.ORIENTATION_MARKER_LEFT;
            right = papaya.viewer.Viewer.ORIENTATION_MARKER_RIGHT;

            orientSlice = this.coronalSlice;
        } else if (this.mainImage === this.sagittalSlice) {
            temp = this.volume.header.imageDimensions.yDim;
            orientWidth = temp;
            orientHeight = this.volume.header.imageDimensions.zDim;

            top = papaya.viewer.Viewer.ORIENTATION_MARKER_SUPERIOR;
            bottom = papaya.viewer.Viewer.ORIENTATION_MARKER_INFERIOR;
            left = papaya.viewer.Viewer.ORIENTATION_MARKER_ANTERIOR;
            right = papaya.viewer.Viewer.ORIENTATION_MARKER_POSTERIOR;

            orientSlice = this.sagittalSlice;
        }

        orientStartX = orientSlice.xformTransX;
        orientEndX = floor(orientSlice.xformTransX + orientWidth * orientSlice.xformScaleX);
        orientMidX = floor(orientSlice.xformTransX + (orientWidth / 2.0) * orientSlice.xformScaleX);

        orientStartY = orientSlice.xformTransY;
        orientEndY = floor(orientSlice.xformTransY + orientHeight * orientSlice.xformScaleY);
        orientMidY = floor(orientSlice.xformTransY + (orientHeight / 2.0) * orientSlice.xformScaleY);

        this.context.fillText(top, orientMidX - (textWidth / 2), orientStartY
            + papaya.viewer.Viewer.ORIENTATION_MARKER_SIZE * 1.5);
        this.context.fillText(bottom, orientMidX - (textWidth / 2), orientEndY
            - papaya.viewer.Viewer.ORIENTATION_MARKER_SIZE);
        this.context.fillText(left, orientStartX + papaya.viewer.Viewer.ORIENTATION_MARKER_SIZE, orientMidY
            + (papaya.viewer.Viewer.ORIENTATION_MARKER_SIZE * 0.5));
        this.context.fillText(right, orientEndX - 1.5 * papaya.viewer.Viewer.ORIENTATION_MARKER_SIZE, orientMidY
            + (papaya.viewer.Viewer.ORIENTATION_MARKER_SIZE * 0.5));
    }

    if (papayaMain.preferences.showCrosshairs !== "None") {
        this.drawCrosshairs();
    }

    if (papayaMain.papayaDisplay) {
        papayaMain.papayaDisplay.drawDisplay(this.currentCoord.x, this.currentCoord.y, this.currentCoord.z,
            this.getCurrentValueAt(this.currentCoord.x, this.currentCoord.y, this.currentCoord.z));
    }
};



papaya.viewer.Viewer.prototype.drawCrosshairs = function () {
    var xLoc, yStart, yEnd, yLoc, xStart, xEnd;

    // initialize crosshairs
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.strokeStyle = papaya.viewer.Viewer.CROSSHAIRS_COLOR;
    this.context.lineWidth = 1.0;
    this.context.beginPath();

    if (((this.mainImage !== this.axialSlice) && (papayaMain.preferences.showCrosshairs !== 'Main'))
            || ((this.mainImage === this.axialSlice) && (papayaMain.preferences.showCrosshairs !== 'Lower')
            && this.toggleMainCrosshairs)) {
        // draw axial crosshairs
        xLoc = floor(this.axialSlice.xformTransX + (this.currentCoord.x) * this.axialSlice.xformScaleX);
        yStart = floor(this.axialSlice.xformTransY);
        yEnd = floor(this.axialSlice.xformTransY + this.axialSlice.yDim * this.axialSlice.xformScaleY);
        this.context.moveTo(xLoc + 0.5, yStart);
        this.context.lineTo(xLoc + 0.5, yEnd);

        yLoc = floor(this.axialSlice.xformTransY + (this.currentCoord.y) * this.axialSlice.xformScaleY);
        xStart = floor(this.axialSlice.xformTransX);
        xEnd = floor(this.axialSlice.xformTransX + this.axialSlice.xDim * this.axialSlice.xformScaleX);
        this.context.moveTo(xStart, yLoc + 0.5);
        this.context.lineTo(xEnd, yLoc + 0.5);
    }

    if (((this.mainImage !== this.coronalSlice) && (papayaMain.preferences.showCrosshairs !== 'Main'))
            || ((this.mainImage === this.coronalSlice) && (papayaMain.preferences.showCrosshairs !== 'Lower')
            && this.toggleMainCrosshairs)) {
        // draw coronal crosshairs
        xLoc = floor(this.coronalSlice.xformTransX + this.currentCoord.x * this.coronalSlice.xformScaleX);
        yStart = floor(this.coronalSlice.xformTransY);
        yEnd = floor(this.coronalSlice.xformTransY + this.coronalSlice.yDim * this.coronalSlice.xformScaleY);
        this.context.moveTo(xLoc + 0.5, yStart);
        this.context.lineTo(xLoc + 0.5, yEnd);

        yLoc = floor(this.coronalSlice.xformTransY + this.currentCoord.z * this.coronalSlice.xformScaleY);
        xStart = floor(this.coronalSlice.xformTransX);
        xEnd = floor(this.coronalSlice.xformTransX + this.coronalSlice.xDim * this.coronalSlice.xformScaleX);
        this.context.moveTo(xStart, yLoc + 0.5);
        this.context.lineTo(xEnd, yLoc + 0.5);
    }

    if (((this.mainImage !== this.sagittalSlice) && (papayaMain.preferences.showCrosshairs !== 'Main'))
            || ((this.mainImage === this.sagittalSlice) && (papayaMain.preferences.showCrosshairs !== 'Lower')
            && this.toggleMainCrosshairs)) {
        // draw sagittal crosshairs
        xLoc = floor(this.sagittalSlice.xformTransX + this.currentCoord.y * this.sagittalSlice.xformScaleX);
        yStart = floor(this.sagittalSlice.xformTransY);
        yEnd = floor(this.sagittalSlice.xformTransY + this.sagittalSlice.yDim * this.sagittalSlice.xformScaleY);
        this.context.moveTo(xLoc + 0.5, yStart);
        this.context.lineTo(xLoc + 0.5, yEnd);

        yLoc = floor(this.sagittalSlice.xformTransY + this.currentCoord.z * this.sagittalSlice.xformScaleY);
        xStart = floor(this.sagittalSlice.xformTransX);
        xEnd = floor(this.sagittalSlice.xformTransX + this.sagittalSlice.xDim * this.sagittalSlice.xformScaleX);
        this.context.moveTo(xStart, yLoc + 0.5);
        this.context.lineTo(xEnd, yLoc + 0.5);
    }

    // finish crosshairs drawing
    this.context.closePath();
    this.context.stroke();
    this.context.restore();
};



papaya.viewer.Viewer.prototype.calculateScreenSliceTransforms = function (viewer) {
    //viewer.canvas.height = PAPAYA_DEFAULT_HEIGHT;
    viewer.viewerDim = viewer.canvas.height;
    //viewer.canvas.setAttribute("width", viewer.viewerDim * 1.5);

    this.getTransformParameters(viewer.mainImage, viewer.viewerDim, false);
    viewer.mainImage.xformTransX += viewer.mainImage.screenOffsetX = 0;
    viewer.mainImage.xformTransY += viewer.mainImage.screenOffsetY = 0;

    this.getTransformParameters(viewer.lowerImageBot, viewer.viewerDim, true);
    viewer.lowerImageBot.xformTransX += viewer.lowerImageBot.screenOffsetX
        = (viewer.viewerDim + (papaya.viewer.Viewer.GAP));
    viewer.lowerImageBot.xformTransY += viewer.lowerImageBot.screenOffsetY
        = (((viewer.viewerDim - papaya.viewer.Viewer.GAP) / 2) + (papaya.viewer.Viewer.GAP));

    this.getTransformParameters(viewer.lowerImageTop, viewer.viewerDim, true);
    viewer.lowerImageTop.xformTransX += viewer.lowerImageTop.screenOffsetX
        = (viewer.viewerDim + (papaya.viewer.Viewer.GAP));
    viewer.lowerImageTop.xformTransY += viewer.lowerImageTop.screenOffsetY = 0;
};



papaya.viewer.Viewer.prototype.getTransformParameters = function (image, height, lower) {
    var bigScale, scaleX, scaleY, transX, transY;

    bigScale = lower ? 2 : 1;

    if (image.getRealWidth() > image.getRealHeight()) {
        scaleX = (((lower ? height - papaya.viewer.Viewer.GAP : height) / this.longestDim) / bigScale)
            * (image.getXSize() / this.longestDimSize);
        scaleY = ((((lower ? height - papaya.viewer.Viewer.GAP : height) / this.longestDim)
            * image.getYXratio()) / bigScale) * (image.getXSize() / this.longestDimSize);
    } else {
        scaleX = ((((lower ? height - papaya.viewer.Viewer.GAP : height) / this.longestDim)
            * image.getXYratio()) / bigScale) * (image.getYSize() / this.longestDimSize);
        scaleY = (((lower ? height - papaya.viewer.Viewer.GAP : height) / this.longestDim) / bigScale)
            * (image.getYSize() / this.longestDimSize);
    }

    transX = (((lower ? height - papaya.viewer.Viewer.GAP : height) / bigScale) - (image.getXDim() * scaleX)) / 2;
    transY = (((lower ? height - papaya.viewer.Viewer.GAP : height) / bigScale) - (image.getYDim() * scaleY)) / 2;

    image.screenDim = (lower ? (height - papaya.viewer.Viewer.GAP) / 2 : height);
    image.xformScaleX = scaleX;
    image.xformScaleY = scaleY;
    image.xformTransX = transX;
    image.xformTransY = transY;
};



papaya.viewer.Viewer.prototype.setLongestDim = function (volume) {
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
};



papaya.viewer.Viewer.prototype.keyDownEvent = function (ke) {
    var keyCode, temp, center;

    if (papayaMain.papayaToolbar.isShowingMenus()) {
        return;
    }

    keyCode = getKeyCode(ke);

    if (isControlKey(ke)) {
        this.isControlKeyDown = true;
    } else if (keyCode === papaya.viewer.Viewer.KEYCODE_ROTATE_VIEWS) {
        temp = this.lowerImageBot;
        this.lowerImageBot = this.lowerImageTop;
        this.lowerImageTop = this.mainImage;
        this.mainImage = temp;
        this.calculateScreenSliceTransforms(this);
        this.drawViewer();
    } else if (keyCode === papaya.viewer.Viewer.KEYCODE_CENTER) {
        center = new papaya.core.Coordinate(Math.floor(this.volume.header.imageDimensions.xDim / 2),
            Math.floor(this.volume.header.imageDimensions.yDim / 2),
            Math.floor(this.volume.header.imageDimensions.zDim / 2));
        this.gotoCoordinate(center);
    } else if (keyCode === papaya.viewer.Viewer.KEYCODE_ORIGIN) {
        this.gotoCoordinate(this.volume.header.origin);
    } else if (keyCode === papaya.viewer.Viewer.KEYCODE_ARROW_UP) {
        this.currentCoord.y -= 1;
        this.gotoCoordinate(this.currentCoord);
    } else if (keyCode === papaya.viewer.Viewer.KEYCODE_ARROW_DOWN) {
        this.currentCoord.y += 1;
        this.gotoCoordinate(this.currentCoord);
    } else if (keyCode === papaya.viewer.Viewer.KEYCODE_ARROW_LEFT) {
        this.currentCoord.x -= 1;
        this.gotoCoordinate(this.currentCoord);
    } else if (keyCode === papaya.viewer.Viewer.KEYCODE_ARROW_RIGHT) {
        this.currentCoord.x += 1;
        this.gotoCoordinate(this.currentCoord);
    } else if ((keyCode === papaya.viewer.Viewer.KEYCODE_PAGE_DOWN)
            || (keyCode === papaya.viewer.Viewer.KEYCODE_FORWARD_SLASH)) {
        this.currentCoord.z += 1;
        this.gotoCoordinate(this.currentCoord);
    } else if ((keyCode === papaya.viewer.Viewer.KEYCODE_PAGE_UP)
            || (keyCode === papaya.viewer.Viewer.KEYCODE_SINGLE_QUOTE)) {
        this.currentCoord.z -= 1;
        this.gotoCoordinate(this.currentCoord);
    } else if ((keyCode === papaya.viewer.Viewer.KEYCODE_PAGE_DOWN)
            || (keyCode === papaya.viewer.Viewer.KEYCODE_FORWARD_SLASH)) {
        this.currentCoord.z += 1;
        this.gotoCoordinate(this.currentCoord);
    } else if (keyCode === papaya.viewer.Viewer.KEYCODE_INCREMENT_MAIN) {
        if (this.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
            this.currentCoord.z -= 1;
        } else if (this.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
            this.currentCoord.y -= 1;
        } else if (this.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
            this.currentCoord.x += 1;
        }

        this.gotoCoordinate(this.currentCoord);
    } else if (keyCode === papaya.viewer.Viewer.KEYCODE_DECREMENT_MAIN) {
        if (this.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
            this.currentCoord.z += 1;
        } else if (this.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
            this.currentCoord.y += 1;
        } else if (this.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
            this.currentCoord.x -= 1;
        }

        this.gotoCoordinate(this.currentCoord);
    } else if (keyCode === papaya.viewer.Viewer.KEYCODE_TOGGLE_CROSSHAIRS) {
        if ((papayaMain.preferences.showCrosshairs === "All") || (papayaMain.preferences.showCrosshairs === "Main")) {
            this.toggleMainCrosshairs = !this.toggleMainCrosshairs;
            this.drawViewer(true);
        }
    }
};



papaya.viewer.Viewer.prototype.keyUpEvent = function (ke) {
    //var keyCode = getKeyCode(ke);

    if (isControlKey(ke)) {
        this.isControlKeyDown = false;
    }
};



papaya.viewer.Viewer.prototype.resetUpdateTimer = function (me) {
    var viewer = this;

    if (this.updateTimer !== null) {
        window.clearTimeout(this.updateTimer);
        this.updateTimer = null;
        this.updateTimerEvent = null;
    }

    if (me !== null) {
        this.updateTimerEvent = me;
        this.updateTimer = window.setTimeout(bind(viewer,
            function () {
                this.updatePosition(this, getMousePositionX(viewer.updateTimerEvent),
                    getMousePositionY(viewer.updateTimerEvent));
            }),
            papaya.viewer.Viewer.UPDATE_TIMER_INTERVAL);
    }
};



papaya.viewer.Viewer.prototype.mouseDownEvent = function (me) {
    me.stopPropagation();
    me.preventDefault();

    if ((me.target.nodeName === "IMG") || (me.target.nodeName === "CANVAS")) {
        if (me.handled !== true) {
            papayaMain.papayaToolbar.closeAllMenus();

            if ((me.which === 3) || this.isControlKeyDown) {
                this.isWindowControl = true;
                this.previousMousePosition.x = getMousePositionX(me);
                this.previousMousePosition.y = getMousePositionY(me);
            } else {
                this.updatePosition(this, getMousePositionX(me), getMousePositionY(me), true);
                this.resetUpdateTimer(me);
            }

            this.isDragging = true;
            me.handled = true;
        }
    }
};



papaya.viewer.Viewer.prototype.mouseUpEvent = function (me) {
    me.stopPropagation();
    me.preventDefault();

    if ((me.target.nodeName === "IMG") || (me.target.nodeName === "CANVAS")) {
        if (me.handled !== true) {
            if (!this.isWindowControl) {
                this.updatePosition(this, getMousePositionX(me), getMousePositionY(me));
            }

            this.isDragging = false;
            this.isWindowControl = false;

            me.handled = true;
        }
    }
};



papaya.viewer.Viewer.prototype.mouseMoveEvent = function (me) {
    me.preventDefault();

    var currentMouseX, currentMouseY;

    if (this.isDragging) {
        if (this.isWindowControl) {
            currentMouseX = getMousePositionX(me);
            currentMouseY = getMousePositionY(me);

            this.windowLevelChanged(this.previousMousePosition.x - currentMouseX,
                this.previousMousePosition.y - currentMouseY);

            this.previousMousePosition.x = currentMouseX;
            this.previousMousePosition.y = currentMouseY;
        } else {
            this.resetUpdateTimer(null);
            this.updatePosition(this, getMousePositionX(me), getMousePositionY(me));
        }
    } else {
        this.updateCursorPosition(this, getMousePositionX(me), getMousePositionY(me));
    }
};



papaya.viewer.Viewer.prototype.mouseOutEvent = function () {
    if (papayaMain.papayaDisplay) {
        papayaMain.papayaDisplay.drawEmptyDisplay();
    }
};



papaya.viewer.Viewer.prototype.touchMoveEvent = function (me) {
    this.updatePosition(this, getMousePositionX(me), getMousePositionY(me), true);
    this.resetUpdateTimer(me);

    me.preventDefault();
};



papaya.viewer.Viewer.prototype.windowLevelChanged = function (contrastChange, brightnessChange) {
    var range, step, minFinal, maxFinal;

    range = this.currentScreenVolume.screenMax - this.currentScreenVolume.screenMin;
    step = range * 0.025;

    if (Math.abs(contrastChange) > Math.abs(brightnessChange)) {
        minFinal = this.currentScreenVolume.screenMin + (step * signum(contrastChange));
        maxFinal = this.currentScreenVolume.screenMax + (-1 * step * signum(contrastChange));

        if (maxFinal <= minFinal) {
            minFinal = this.currentScreenVolume.screenMin;
            maxFinal = this.currentScreenVolume.screenMin; // yes, min
        }
    } else {
        minFinal = this.currentScreenVolume.screenMin + (step * signum(brightnessChange));
        maxFinal = this.currentScreenVolume.screenMax + (step * signum(brightnessChange));
    }

    this.currentScreenVolume.setScreenRange(minFinal, maxFinal);
    this.drawViewer(true);
};



papaya.viewer.Viewer.prototype.gotoCoordinate = function (coor) {
    this.currentCoord.x = coor.x;
    this.currentCoord.y = coor.y;
    this.currentCoord.z = coor.z;

    this.drawViewer(true);
};



papaya.viewer.Viewer.prototype.resizeViewer = function (dims) {
    this.canvas.width = dims.width;
    this.canvas.height = dims.height;

    if (this.initialized) {
        this.calculateScreenSliceTransforms(this);
        this.canvasRect = this.canvas.getBoundingClientRect();
        this.drawViewer(true);
    }
};



papaya.viewer.Viewer.prototype.getWorldCoordinateAtIndex = function (ctrX, ctrY, ctrZ, coord) {
    coord.setCoordinate((ctrX - this.volume.header.origin.x) * this.volume.header.voxelDimensions.xSize,
        (this.volume.header.origin.y - ctrY) * this.volume.header.voxelDimensions.ySize,
        (this.volume.header.origin.z - ctrZ) * this.volume.header.voxelDimensions.zSize);
    return coord;
};



papaya.viewer.Viewer.prototype.getNextColorTable = function () {
    var value = (this.screenVolumes.length - 1) % 5;
    return papaya.viewer.ColorTable.OVERLAY_COLOR_TABLES[value].name;
};



papaya.viewer.Viewer.prototype.getCurrentValueAt = function (ctrX, ctrY, ctrZ) {
    if (this.currentScreenVolume.isOverlay()) {
        return this.currentScreenVolume.volume.getVoxelAtCoordinate((ctrX - this.volume.header.origin.x)
            * this.volume.header.voxelDimensions.xSize,
                (this.volume.header.origin.y - ctrY) * this.volume.header.voxelDimensions.ySize,
            (this.volume.header.origin.z - ctrZ) * this.volume.header.voxelDimensions.zSize, true);
    }

    return this.currentScreenVolume.volume.getVoxelAtIndex(ctrX, ctrY, ctrZ, true);
};



papaya.viewer.Viewer.prototype.resetViewer = function () {
    this.initialized = false;
    this.loadingVolume = null;
    this.volume = new papaya.volume.Volume();
    this.screenVolumes = [];
    this.currentScreenVolume = null;
    this.axialSlice = null;
    this.coronalSlice = null;
    this.sagittalSlice = null;
    this.mainImage = null;
    this.lowerImageBot = null;
    this.lowerImageTop = null;
    this.viewerDim = 0;
    this.currentCoord = new papaya.core.Coordinate(0, 0, 0);
    this.longestDim = 0;
    this.longestDimSize = 0;
    this.draggingSliceDir = 0;
    this.isDragging = false;
    this.isWindowControl = false;
    this.previousMousePosition = new papaya.core.Point();
    this.canvas.removeEventListener("mousemove", this.listenerMouseMove, false);
    this.canvas.removeEventListener("mousedown", this.listenerMouseDown, false);
    this.canvas.removeEventListener("mouseout", this.listenerMouseOut, false);
    document.removeEventListener("mouseup", this.listenerMouseUp, false);
    document.removeEventListener("keydown", this.listenerKeyDown, true);
    document.removeEventListener("keyup", this.listenerKeyUp, true);
    document.removeEventListener("contextmenu", this.listenerContextMenu, false);
    document.removeEventListener("touchmove", this.listenerTouchMove, false);
    document.removeEventListener("touchstart", this.listenerMouseDown, false);
    document.removeEventListener("touchend", this.listenerMouseUp, false);
    this.updateTimer = null;
    this.updateTimerEvent = null;
    this.drawEmptyViewer();
    if (papayaMain.papayaDisplay) {
        papayaMain.papayaDisplay.drawEmptyDisplay();
    }

    papayaMain.papayaToolbar.buildToolbar();
};



papaya.viewer.Viewer.prototype.getImageDimensionsDescription = function (index) {
    var orientationStr, imageDims;

    orientationStr = this.screenVolumes[index].volume.header.orientation.orientation;
    imageDims = this.screenVolumes[index].volume.header.imageDimensions;

    return ("(" + orientationStr.charAt(0) + ", " + orientationStr.charAt(1) + ", " + orientationStr.charAt(2) + ") " + imageDims.cols + " x " + imageDims.rows + " x " + imageDims.slices);
};



papaya.viewer.Viewer.prototype.getVoxelDimensionsDescription = function (index) {
    var orientationStr, voxelDims;

    orientationStr = this.screenVolumes[index].volume.header.orientation.orientation;
    voxelDims = this.screenVolumes[index].volume.header.voxelDimensions;

    return ("(" + orientationStr.charAt(0) + ", " + orientationStr.charAt(1) + ", " + orientationStr.charAt(2) + ") " + formatNumber(voxelDims.colSize, true) + " x " + formatNumber(voxelDims.rowSize, true) + " x " + formatNumber(voxelDims.sliceSize, true));
};



papaya.viewer.Viewer.prototype.getFilename = function (index) {
    return wordwrap(this.screenVolumes[index].volume.fileName, 25, "<br />", true);
};



papaya.viewer.Viewer.prototype.getNiceFilename = function (index) {
    return this.screenVolumes[index].volume.fileName.replace(".nii", "").replace(".gz", "");
};



papaya.viewer.Viewer.prototype.getFileLength = function (index) {
    return getSizeString(this.screenVolumes[index].volume.fileLength);
};



papaya.viewer.Viewer.prototype.getByteTypeDescription = function (index) {
    return (this.screenVolumes[index].volume.header.imageType.numBytes + "-Byte " + this.screenVolumes[index].volume.header.imageType.getTypeDescription());
};



papaya.viewer.Viewer.prototype.getByteOrderDescription = function (index) {
    return this.screenVolumes[index].volume.header.imageType.getOrderDescription();
};



papaya.viewer.Viewer.prototype.getCompressedDescription = function (index) {
    if (this.screenVolumes[index].volume.header.imageType.compressed) {
        return "Yes";
    }

    return "No";
};



papaya.viewer.Viewer.prototype.getOrientationDescription = function (index) {
    return this.screenVolumes[index].volume.header.orientation.getOrientationDescription();
};



papaya.viewer.Viewer.prototype.getImageDescription = function (index) {
    return wordwrap(this.screenVolumes[index].volume.header.imageDescription.notes, 25, "<br />", true);
};



papaya.viewer.Viewer.prototype.setCurrentScreenVol = function (index) {
    this.currentScreenVolume = this.screenVolumes[index];
    window.document.title = this.getNiceFilename(index);
};



papaya.viewer.Viewer.prototype.getCurrentScreenVolIndex = function () {
    var ctr;

    for (ctr = 0; ctr < this.screenVolumes.length; ctr += 1) {
        if (this.screenVolumes[ctr] === this.currentScreenVolume) {
            return ctr;
        }
    }

    return -1;
};



papaya.viewer.Viewer.prototype.toggleWorldSpace = function () {
    this.worldSpace = !this.worldSpace;
};



papaya.viewer.Viewer.prototype.isSelected = function (index) {
    return (this.isSelectable() && (index === this.getCurrentScreenVolIndex()));
};



papaya.viewer.Viewer.prototype.isSelectable = function () {
    return (this.screenVolumes.length > 1);
};



papaya.viewer.Viewer.prototype.getIndex = function (name) {
    if (name === "SPACE") {
        return (this.worldSpace ? 1 : 0);
    }

    return 0;
};


papaya.viewer.Viewer.prototype.processParams = function (params) {
    if (params.worldSpace) {
        this.worldSpace = true;
    }

    if (params.showOrientation) {
        papayaMain.preferences.showOrientation = "Yes";
    }
};



papaya.viewer.Viewer.prototype.getOrientationCertaintyColor = function () {
    var certainty = this.screenVolumes[0].volume.header.orientationCertainty;

    if (certainty === papaya.volume.Header.ORIENTATION_CERTAINTY_LOW) {
        return papaya.viewer.Viewer.ORIENTATION_CERTAINTY_LOW_COLOR;
    }

    if (certainty === papaya.volume.Header.ORIENTATION_CERTAINTY_HIGH) {
        return papaya.viewer.Viewer.ORIENTATION_CERTAINTY_HIGH_COLOR;
    }

    return papaya.viewer.Viewer.ORIENTATION_CERTAINTY_UNKNOWN_COLOR;
};



papaya.viewer.Viewer.prototype.isUsingAtlas = function (name) {
    return (name === this.atlas.currentAtlas);
};
