
/*jslint browser: true, node: true */
/*global $, bind, PAPAYA_SPACING, floorFast, validDimBounds, roundFast, getKeyCode, isControlKey, isAltKey, isShiftKey,
 getMousePositionY, getMousePositionX, signum, formatNumber, wordwrap, getSizeString, getScrollSign, papayaContainers,
 papayaLastHoveredViewer:true, getOffsetRect */

"use strict";


var papaya = papaya || {};
papaya.viewer = papaya.viewer || {};
var PAPAYA_VERSION_ID = PAPAYA_VERSION_ID || "0.0";
var PAPAYA_BUILD_NUM = PAPAYA_BUILD_NUM || "0";


papaya.viewer.Viewer = papaya.viewer.Viewer || function (container, width, height, params) {
    this.container = container;
    this.canvas = document.createElement("canvas");
    this.canvas.width = width;
    this.canvas.height = height;
    this.context = this.canvas.getContext("2d");
    this.canvas.style.padding = 0;
    this.canvas.style.margin = 0;
    this.canvas.style.border = "none";
    this.atlas = null;
    this.initialized = false;
    this.pageLoaded = false;
    this.loadingVolume = null;
    this.volume = new papaya.volume.Volume(this.container.display);
    this.screenVolumes = [];
    this.currentScreenVolume = null;
    this.axialSlice = null;
    this.coronalSlice = null;
    this.sagittalSlice = null;
    this.selectedSlice = null;
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
    this.isZoomMode = false;
    this.isPanning = false;
    this.zoomFactor = papaya.viewer.Viewer.ZOOM_FACTOR_MIN;
    this.zoomFactorPrevious = papaya.viewer.Viewer.ZOOM_FACTOR_MIN;
    this.zoomLocX = 0;
    this.zoomLocY = 0;
    this.zoomLocZ = 0;
    this.panLocX = 0;
    this.panLocY = 0;
    this.panLocZ = 0;
    this.panAmountX = 0;
    this.panAmountY = 0;
    this.panAmountZ = 0;
    this.keyPressIgnored = false;
    this.previousMousePosition = new papaya.core.Point();
    this.isControlKeyDown = false;
    this.isAltKeyDown = false;
    this.isShiftKeyDown = false;
    this.toggleMainCrosshairs = true;
    this.sliceSliderControl = null;
    this.bgColor = null;

    this.listenerMouseMove = bind(this, this.mouseMoveEvent);
    this.listenerMouseDown = bind(this, this.mouseDownEvent);
    this.listenerMouseOut = bind(this, this.mouseOutEvent);
    this.listenerMouseUp = bind(this, this.mouseUpEvent);
    this.listenerMouseDoubleClick = bind(this, this.mouseDoubleClickEvent);
    this.listenerKeyDown = bind(this, this.keyDownEvent);
    this.listenerKeyUp = bind(this, this.keyUpEvent);
    this.listenerTouchMove = bind(this, this.touchMoveEvent);
    this.initialCoordinate = null;
    this.listenerScroll = bind(this, this.scrolled);

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
papaya.viewer.Viewer.KEYCODE_SERIES_BACK = 188;  // , <
papaya.viewer.Viewer.KEYCODE_SERIES_FORWARD = 190;  // . >
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
papaya.viewer.Viewer.ZOOM_FACTOR_MAX = 10.0;
papaya.viewer.Viewer.ZOOM_FACTOR_MIN = 1.0;
papaya.viewer.Viewer.MOUSE_SCROLL_THRESHLD = 0.25;
papaya.viewer.Viewer.TITLE_MAX_LENGTH = 30;



papaya.viewer.Viewer.prototype.loadImage = function (name, forceUrl, forceEncode) {
    if (this.screenVolumes.length === 0) {
        this.loadBaseImage(name, forceUrl, forceEncode);
    } else {
        this.loadOverlay(name, forceUrl, forceEncode);
    }
};



papaya.viewer.Viewer.prototype.loadBaseImage = function (name, forceUrl, forceEncode) {
    var loadableImage = this.container.findLoadableImage(name, forceUrl, forceEncode);
    this.volume = new papaya.volume.Volume(this.container.display);

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
    var loadableImage = this.container.findLoadableImage(name);
    this.loadingVolume = new papaya.volume.Volume(this.container.display);

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




papaya.viewer.Viewer.prototype.atlasLoaded = function () {
    this.finishedLoading();
};



papaya.viewer.Viewer.prototype.initializeViewer = function () {
    var message, viewer;

    viewer = this;

    if (this.volume.hasError()) {
        message = this.volume.errorMessage;
        this.resetViewer();
        this.container.clearParams();
        this.container.display.drawError(message);
    } else {
        this.screenVolumes[0] = new papaya.viewer.ScreenVolume(this.volume, this.container.params, papaya.viewer.ColorTable.DEFAULT_COLOR_TABLE.name, true);
        this.setCurrentScreenVol(0);

        this.axialSlice = new papaya.viewer.ScreenSlice(this.volume, papaya.viewer.ScreenSlice.DIRECTION_AXIAL,
            this.volume.getXDim(), this.volume.getYDim(), this.volume.getXSize(), this.volume.getYSize(), this.screenVolumes);

        this.coronalSlice = new papaya.viewer.ScreenSlice(this.volume, papaya.viewer.ScreenSlice.DIRECTION_CORONAL,
            this.volume.getXDim(), this.volume.getZDim(), this.volume.getXSize(), this.volume.getZSize(), this.screenVolumes);

        this.sagittalSlice = new papaya.viewer.ScreenSlice(this.volume, papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL,
            this.volume.getYDim(), this.volume.getZDim(), this.volume.getYSize(), this.volume.getZSize(), this.screenVolumes);


        if ((this.container.params.mainView === undefined) || (this.container.params.mainView.toLowerCase() === "axial")) {
            this.mainImage = this.axialSlice;
            this.lowerImageTop = this.sagittalSlice;
            this.lowerImageBot = this.coronalSlice;
        } else if (this.container.params.mainView.toLowerCase() === "coronal") {
            this.mainImage = this.coronalSlice;
            this.lowerImageTop = this.axialSlice;
            this.lowerImageBot = this.sagittalSlice;
        } else if (this.container.params.mainView.toLowerCase() === "sagittal") {
            this.mainImage = this.sagittalSlice;
            this.lowerImageTop = this.coronalSlice;
            this.lowerImageBot = this.axialSlice;
        } else {
            this.mainImage = this.axialSlice;
            this.lowerImageTop = this.sagittalSlice;
            this.lowerImageBot = this.coronalSlice;
        }

        this.canvas.addEventListener("mousemove", this.listenerMouseMove, false);
        this.canvas.addEventListener("mousedown", this.listenerMouseDown, false);
        this.canvas.addEventListener("mouseout", this.listenerMouseOut, false);
        this.canvas.addEventListener("mouseup", this.listenerMouseUp, false);
        document.addEventListener("keydown", this.listenerKeyDown, true);
        document.addEventListener("keyup", this.listenerKeyUp, true);
        this.canvas.addEventListener("contextmenu", this.listenerContextMenu, false);
        this.canvas.addEventListener("touchmove", this.listenerTouchMove, false);
        this.canvas.addEventListener("touchstart", this.listenerMouseDown, false);
        this.canvas.addEventListener("touchend", this.listenerMouseUp, false);
        this.canvas.addEventListener("dblclick", this.listenerMouseDoubleClick, false);

        if (!this.container.orthogonal) {
            this.sliceSliderControl = $(this.container.sliderControlHtml.find("input"));
            this.sliceSliderControl.on("input change", function () {
                viewer.sliceSliderControlChanged();
            });
        }

        this.addScroll();

        this.setLongestDim(this.volume);
        this.calculateScreenSliceTransforms(this);
        this.currentCoord.setCoordinate(floorFast(this.volume.getXDim() / 2), floorFast(this.volume.getYDim() / 2), floorFast(this.volume.getZDim() / 2));

        this.updateOffsetRect();

        this.bgColor = $("body").css("background-color");

        if ((this.bgColor === "rgba(0, 0, 0, 0)") || ((this.bgColor === "transparent"))) {
            this.bgColor = "rgba(255, 255, 255, 255)";
        }

        this.context.fillStyle = this.bgColor;
        this.context.fillRect(0, 0, this.canvas.offsetWidth, this.canvas.offsetHeight);

        this.initialized = true;
        this.drawViewer();

        this.container.toolbar.buildToolbar();
        this.container.toolbar.updateImageButtons();
        this.updateWindowTitle();

        if (!this.container.loadNext()) {
            if (this.hasDefinedAtlas()) {
                this.loadAtlas();
            } else {
                this.finishedLoading();
            }
        }
    }
};



papaya.viewer.Viewer.prototype.finishedLoading = function () {
    if (!this.pageLoaded) {
        this.goToInitialCoordinate();
        this.updateSliceSliderControl();
        this.pageLoaded = true;
    }
};



papaya.viewer.Viewer.prototype.addScroll = function () {
    if (!this.container.nestedViewer) {
        if (window.addEventListener) {
            window.addEventListener('DOMMouseScroll', this.listenerScroll, false);
        }
        window.onmousewheel = document.onmousewheel = this.listenerScroll;
    }
};


papaya.viewer.Viewer.prototype.removeScroll = function () {
    window.removeEventListener('DOMMouseScroll', this.listenerScroll, false);
    window.onmousewheel = document.onmousewheel = null;
};



papaya.viewer.Viewer.prototype.updateOffsetRect = function () {
    this.canvasRect = getOffsetRect(this.canvas);
};



papaya.viewer.Viewer.prototype.initializeOverlay = function () {
    var screenParams, parametric;

    if (this.loadingVolume.hasError()) {
        this.container.display.drawError(this.loadingVolume.errorMessage);
        this.container.clearParams();
        this.loadingVolume = null;
    } else {
        screenParams = this.container.params[this.loadingVolume.fileName];
        parametric = (screenParams && screenParams.parametric);

        this.screenVolumes[this.screenVolumes.length] = new papaya.viewer.ScreenVolume(this.loadingVolume, this.container.params, (parametric ? papaya.viewer.ColorTable.PARAMETRIC_COLOR_TABLES[0].name : this.getNextColorTable()), false);
        this.setCurrentScreenVol(this.screenVolumes.length - 1);
        this.drawViewer(true);
        this.container.toolbar.buildToolbar();
        this.container.toolbar.updateImageButtons();

        //even if "parametric" is set to true we should not add another screenVolume if the value range does not cross zero
        if (parametric) {
            this.screenVolumes[this.screenVolumes.length - 1].findImageRange();
            if (this.screenVolumes[this.screenVolumes.length - 1].volume.header.imageRange.imageMin < 0) {
                this.screenVolumes[this.screenVolumes.length] = new papaya.viewer.ScreenVolume(this.loadingVolume, this.container.params, papaya.viewer.ColorTable.PARAMETRIC_COLOR_TABLES[1].name, false, true);
                this.setCurrentScreenVol(this.screenVolumes.length - 1);
                this.drawViewer(true);
                this.container.toolbar.buildToolbar();
                this.container.toolbar.updateImageButtons();
            }
        }

        this.updateWindowTitle();

        this.loadingVolume = null;

        if (!this.container.loadNext()) {
            if (this.hasDefinedAtlas()) {
                this.loadAtlas();
            } else {
                this.finishedLoading();
            }
        }
    }
};



papaya.viewer.Viewer.prototype.hasDefinedAtlas = function () {
    var papayaDataType, papayaDataTalairachAtlasType;

    papayaDataType = (typeof papaya.data);

    if (papayaDataType !== "undefined") {
        papayaDataTalairachAtlasType = (typeof papaya.data.Atlas);

        if (papayaDataTalairachAtlasType !== "undefined") {
            return true;
        }
    }

    return false;
};



papaya.viewer.Viewer.prototype.loadAtlas = function () {
    if (this.atlas === null) {
        this.atlas = new papaya.viewer.Atlas(papaya.data.Atlas, this.container, bind(this, papaya.viewer.Viewer.prototype.atlasLoaded));
    }
};



papaya.viewer.Viewer.prototype.updatePosition = function (viewer, xLoc, yLoc, crosshairsOnly) {
    var xImageLoc, yImageLoc, temp;

    xLoc = xLoc - this.canvasRect.left;
    yLoc = yLoc - this.canvasRect.top;

    if (this.insideScreenSlice(viewer.axialSlice, xLoc, yLoc, viewer.volume.getXDim(), viewer.volume.getYDim())) {
        if (!this.isDragging || (this.draggingSliceDir === papaya.viewer.ScreenSlice.DIRECTION_AXIAL)) {
            xImageLoc = this.convertScreenToImageCoordinateX(xLoc, viewer.axialSlice);
            yImageLoc = this.convertScreenToImageCoordinateY(yLoc, viewer.axialSlice);

            if ((xImageLoc !== viewer.currentCoord.x) || (yImageLoc !== viewer.currentCoord.y)) {
                viewer.currentCoord.x = xImageLoc;
                viewer.currentCoord.y = yImageLoc;
                this.draggingSliceDir = papaya.viewer.ScreenSlice.DIRECTION_AXIAL;
            }
        }
    } else if (this.insideScreenSlice(viewer.coronalSlice, xLoc, yLoc, viewer.volume.getXDim(), viewer.volume.getZDim())) {
        if (!this.isDragging || (this.draggingSliceDir === papaya.viewer.ScreenSlice.DIRECTION_CORONAL)) {
            xImageLoc = this.convertScreenToImageCoordinateX(xLoc, viewer.coronalSlice);
            yImageLoc = this.convertScreenToImageCoordinateY(yLoc, viewer.coronalSlice);

            if ((xImageLoc !== viewer.currentCoord.x) || (yImageLoc !== viewer.currentCoord.y)) {
                viewer.currentCoord.x = xImageLoc;
                viewer.currentCoord.z = yImageLoc;
                this.draggingSliceDir = papaya.viewer.ScreenSlice.DIRECTION_CORONAL;
            }
        }
    } else if (this.insideScreenSlice(viewer.sagittalSlice, xLoc, yLoc, viewer.volume.getYDim(), viewer.volume.getZDim())) {
        if (!this.isDragging || (this.draggingSliceDir === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL)) {
            xImageLoc = this.convertScreenToImageCoordinateX(xLoc, viewer.sagittalSlice);
            yImageLoc = this.convertScreenToImageCoordinateY(yLoc, viewer.sagittalSlice);

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



papaya.viewer.Viewer.prototype.convertScreenToImageCoordinateX = function (xLoc, screenSlice) {
    return validDimBounds(floorFast((xLoc - screenSlice.finalTransform[0][2]) / screenSlice.finalTransform[0][0]), screenSlice.xDim);
};



papaya.viewer.Viewer.prototype.convertScreenToImageCoordinateY = function (yLoc, screenSlice) {
    return validDimBounds(floorFast((yLoc - screenSlice.finalTransform[1][2]) / screenSlice.finalTransform[1][1]), screenSlice.yDim);
};



papaya.viewer.Viewer.prototype.updateCursorPosition = function (viewer, xLoc, yLoc) {
    var xImageLoc, yImageLoc, zImageLoc, found;

    if (this.container.display) {
        xLoc = xLoc - this.canvasRect.left;
        yLoc = yLoc - this.canvasRect.top;

        if (this.insideScreenSlice(viewer.axialSlice, xLoc, yLoc, viewer.volume.getXDim(), viewer.volume.getYDim())) {
            xImageLoc = this.convertScreenToImageCoordinateX(xLoc, viewer.axialSlice);
            yImageLoc = this.convertScreenToImageCoordinateY(yLoc, viewer.axialSlice);
            zImageLoc = viewer.axialSlice.currentSlice;
            found = true;
        } else if (this.insideScreenSlice(viewer.coronalSlice, xLoc, yLoc, viewer.volume.getXDim(), viewer.volume.getZDim())) {
            xImageLoc = this.convertScreenToImageCoordinateX(xLoc, viewer.coronalSlice);
            zImageLoc = this.convertScreenToImageCoordinateY(yLoc, viewer.coronalSlice);
            yImageLoc = viewer.coronalSlice.currentSlice;
            found = true;
        } else if (this.insideScreenSlice(viewer.sagittalSlice, xLoc, yLoc, viewer.volume.getYDim(), viewer.volume.getZDim())) {
            yImageLoc = this.convertScreenToImageCoordinateX(xLoc, viewer.sagittalSlice);
            zImageLoc = this.convertScreenToImageCoordinateY(yLoc, viewer.sagittalSlice);
            xImageLoc = viewer.sagittalSlice.currentSlice;
            found = true;
        }

        if (found) {
            this.container.display.drawDisplay(xImageLoc, yImageLoc, zImageLoc);
        } else {
            this.container.display.drawEmptyDisplay();
        }
    }
};



papaya.viewer.Viewer.prototype.insideScreenSlice = function (screenSlice, xLoc, yLoc, xBound, yBound) {
    var xStart, xEnd, yStart, yEnd;

    xStart = roundFast(screenSlice.screenTransform[0][2]);
    xEnd = roundFast(screenSlice.screenTransform[0][2] + xBound * screenSlice.screenTransform[0][0]);
    yStart = roundFast(screenSlice.screenTransform[1][2]);
    yEnd = roundFast(screenSlice.screenTransform[1][2] + yBound * screenSlice.screenTransform[1][1]);

    return ((xLoc >= xStart) && (xLoc < xEnd) && (yLoc >= yStart) && (yLoc < yEnd));
};



papaya.viewer.Viewer.prototype.drawEmptyViewer = function () {
    var locY, fontSize, text, metrics, textWidth;

    // clear area
    this.context.fillStyle = "#000000";
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // draw drop text
    this.context.fillStyle = "#AAAAAA";

    if (this.container.readyForDnD()) {
        fontSize = 18;
        this.context.font = fontSize + "px Arial";
        locY = this.canvas.height - 22;
        text = "Drop here or click the File menu";
        metrics = this.context.measureText(text);
        textWidth = metrics.width;
        this.context.fillText(text, (this.canvas.width / 2) - (textWidth / 2), locY);
    }

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


//papaya.viewer.Viewer.prototype.getMainImageNumSlices = function () {
//    if (this.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
//        return this.volume.header.imageDimensions.zDim;
//    }
//
//    if (this.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
//        return this.volume.header.imageDimensions.yDim;
//    }
//
//    if (this.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
//        return this.volume.header.imageDimensions.xDim;
//    }
//
//    return 0;
//};



papaya.viewer.Viewer.prototype.drawViewer = function (force, skipUpdate) {
    var orientStartX, orientEndX, orientMidX, orientStartY, orientEndY, orientMidY, metrics, textWidth, top, bottom, left, right;

    if (!this.initialized) {
        this.drawEmptyViewer();
        return;
    }

    this.context.save();

    if (skipUpdate) {
        this.axialSlice.repaint(this.currentCoord.z, force, this.worldSpace);
        this.coronalSlice.repaint(this.currentCoord.y, force, this.worldSpace);
        this.sagittalSlice.repaint(this.currentCoord.x, force, this.worldSpace);
    } else {
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

    if (this.container.preferences.smoothDisplay === "No") {
        this.context.imageSmoothingEnabled = false;
        this.context.webkitImageSmoothingEnabled = false;
        this.context.mozImageSmoothingEnabled = false;
        this.context.msImageSmoothingEnabled = false;
    } else {
        this.context.imageSmoothingEnabled = true;
        this.context.webkitImageSmoothingEnabled = true;
        this.context.mozImageSmoothingEnabled = true;
        this.context.msImageSmoothingEnabled = true;
    }

    // draw screen slices
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.fillRect(this.mainImage.screenOffsetX, this.mainImage.screenOffsetY, this.mainImage.screenDim, this.mainImage.screenDim);
    this.context.save();
    this.context.beginPath();
    this.context.rect(this.mainImage.screenOffsetX, this.mainImage.screenOffsetY, this.mainImage.screenDim, this.mainImage.screenDim);
    this.context.clip();
    this.context.setTransform(this.mainImage.finalTransform[0][0], 0, 0, this.mainImage.finalTransform[1][1], this.mainImage.finalTransform[0][2], this.mainImage.finalTransform[1][2]);
    this.context.drawImage(this.mainImage.canvasMain, 0, 0);
    this.context.restore();

    if (this.container.orthogonal) {
        this.context.setTransform(1, 0, 0, 1, 0, 0);
        this.context.fillRect(this.lowerImageBot.screenOffsetX, this.lowerImageBot.screenOffsetY, this.lowerImageBot.screenDim, this.lowerImageBot.screenDim);
        this.context.save();
        this.context.beginPath();
        this.context.rect(this.lowerImageBot.screenOffsetX, this.lowerImageBot.screenOffsetY, this.lowerImageBot.screenDim, this.lowerImageBot.screenDim);
        this.context.clip();
        this.context.setTransform(this.lowerImageBot.finalTransform[0][0], 0, 0, this.lowerImageBot.finalTransform[1][1], this.lowerImageBot.finalTransform[0][2], this.lowerImageBot.finalTransform[1][2]);
        this.context.drawImage(this.lowerImageBot.canvasMain, 0, 0);
        this.context.restore();

        this.context.setTransform(1, 0, 0, 1, 0, 0);
        this.context.fillRect(this.lowerImageTop.screenOffsetX, this.lowerImageTop.screenOffsetY, this.lowerImageTop.screenDim, this.lowerImageTop.screenDim);
        this.context.save();
        this.context.beginPath();
        this.context.rect(this.lowerImageTop.screenOffsetX, this.lowerImageTop.screenOffsetY, this.lowerImageTop.screenDim, this.lowerImageTop.screenDim);
        this.context.clip();
        this.context.setTransform(this.lowerImageTop.finalTransform[0][0], 0, 0, this.lowerImageTop.finalTransform[1][1], this.lowerImageTop.finalTransform[0][2], this.lowerImageTop.finalTransform[1][2]);
        this.context.drawImage(this.lowerImageTop.canvasMain, 0, 0);
        this.context.restore();
    }
//    else {
//        var barWidth = 20;
//        var barHeight = barWidth * 2;
//        var barPadding = PAPAYA_SPACING * 2;
//        var totalHeight = (this.mainImage.screenDim - (2 * barPadding));
//        var ratio = (this.mainImage.currentSlice / (this.getMainImageNumSlices() - 1));
//        var ratioDiff = ratio - 0.5;
//        var loc = (totalHeight * ratio) - (barHeight / 2) - (barHeight * ratioDiff);
//
//
//        this.context.save();
//        this.context.beginPath();
//        this.context.rect(this.mainImage.screenDim - barWidth - barPadding, loc + barPadding, barWidth, barHeight);
//        this.context.globalAlpha = 0.5;
//        this.context.fillStyle = 'rgb(255, 255, 255)';
//        this.context.fill();
//        this.context.restore();
//    }

    if (this.container.preferences.showOrientation === "Yes") {
        this.context.setTransform(1, 0, 0, 1, 0, 0);
        this.context.fillStyle = this.getOrientationCertaintyColor();
        this.context.font = papaya.viewer.Viewer.ORIENTATION_MARKER_SIZE + "px Arial";
        metrics = this.context.measureText("X");
        textWidth = metrics.width;

        if (this.mainImage === this.axialSlice) {
            top = papaya.viewer.Viewer.ORIENTATION_MARKER_ANTERIOR;
            bottom = papaya.viewer.Viewer.ORIENTATION_MARKER_POSTERIOR;
            left = papaya.viewer.Viewer.ORIENTATION_MARKER_LEFT;
            right = papaya.viewer.Viewer.ORIENTATION_MARKER_RIGHT;
        } else if (this.mainImage === this.coronalSlice) {
            top = papaya.viewer.Viewer.ORIENTATION_MARKER_SUPERIOR;
            bottom = papaya.viewer.Viewer.ORIENTATION_MARKER_INFERIOR;
            left = papaya.viewer.Viewer.ORIENTATION_MARKER_LEFT;
            right = papaya.viewer.Viewer.ORIENTATION_MARKER_RIGHT;
        } else if (this.mainImage === this.sagittalSlice) {
            top = papaya.viewer.Viewer.ORIENTATION_MARKER_SUPERIOR;
            bottom = papaya.viewer.Viewer.ORIENTATION_MARKER_INFERIOR;
            left = papaya.viewer.Viewer.ORIENTATION_MARKER_ANTERIOR;
            right = papaya.viewer.Viewer.ORIENTATION_MARKER_POSTERIOR;
        }

        orientStartX = this.mainImage.screenOffsetX;
        orientEndX = this.mainImage.screenOffsetX + this.mainImage.screenDim;
        orientMidX = Math.round(orientEndX / 2.0);

        orientStartY = this.mainImage.screenOffsetY;
        orientEndY = this.mainImage.screenOffsetY + this.mainImage.screenDim;
        orientMidY = Math.round(orientEndY / 2.0);

        this.context.fillText(top, orientMidX - (textWidth / 2), orientStartY
            + papaya.viewer.Viewer.ORIENTATION_MARKER_SIZE * 1.5);
        this.context.fillText(bottom, orientMidX - (textWidth / 2), orientEndY
            - papaya.viewer.Viewer.ORIENTATION_MARKER_SIZE);
        this.context.fillText(left, orientStartX + papaya.viewer.Viewer.ORIENTATION_MARKER_SIZE, orientMidY
            + (papaya.viewer.Viewer.ORIENTATION_MARKER_SIZE * 0.5));
        this.context.fillText(right, orientEndX - 1.5 * papaya.viewer.Viewer.ORIENTATION_MARKER_SIZE, orientMidY
            + (papaya.viewer.Viewer.ORIENTATION_MARKER_SIZE * 0.5));
    }

    if (this.container.preferences.showCrosshairs !== "None") {
        this.drawCrosshairs();
    }

    if (this.container.display) {
        this.container.display.drawDisplay(this.currentCoord.x, this.currentCoord.y, this.currentCoord.z,
            this.getCurrentValueAt(this.currentCoord.x, this.currentCoord.y, this.currentCoord.z));
    }
};



papaya.viewer.Viewer.prototype.drawCrosshairs = function () {
    var xLoc, yStart, yEnd, yLoc, xStart, xEnd;

    // initialize crosshairs
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.strokeStyle = papaya.viewer.Viewer.CROSSHAIRS_COLOR;
    this.context.lineWidth = 1.0;

    if ((((this.mainImage !== this.axialSlice) && (this.container.preferences.showCrosshairs !== 'Main'))
            || ((this.mainImage === this.axialSlice) && (this.container.preferences.showCrosshairs !== 'Lower')
            && this.toggleMainCrosshairs)) && (this.container.orthogonal || (this.axialSlice === this.mainImage))) {
        // draw axial crosshairs
        this.context.save();
        this.context.beginPath();
        this.context.rect(this.axialSlice.screenOffsetX, this.axialSlice.screenOffsetY, this.axialSlice.screenDim, this.axialSlice.screenDim);
        this.context.closePath();
        this.context.clip();

        this.context.beginPath();

        xLoc = (this.axialSlice.finalTransform[0][2] + (this.currentCoord.x + 0.5) * this.axialSlice.finalTransform[0][0]);
        yStart = (this.axialSlice.finalTransform[1][2]);
        yEnd = (this.axialSlice.finalTransform[1][2] + this.axialSlice.yDim * this.axialSlice.finalTransform[1][1]);
        this.context.moveTo(xLoc, yStart);
        this.context.lineTo(xLoc, yEnd);

        yLoc = (this.axialSlice.finalTransform[1][2] + (this.currentCoord.y + 0.5) * this.axialSlice.finalTransform[1][1]);
        xStart = (this.axialSlice.finalTransform[0][2]);
        xEnd = (this.axialSlice.finalTransform[0][2] + this.axialSlice.xDim * this.axialSlice.finalTransform[0][0]);
        this.context.moveTo(xStart, yLoc);
        this.context.lineTo(xEnd, yLoc);

        this.context.closePath();
        this.context.stroke();
        this.context.restore();
    }


    if ((((this.mainImage !== this.coronalSlice) && (this.container.preferences.showCrosshairs !== 'Main'))
            || ((this.mainImage === this.coronalSlice) && (this.container.preferences.showCrosshairs !== 'Lower')
            && this.toggleMainCrosshairs)) && (this.container.orthogonal || (this.coronalSlice === this.mainImage))) {
        // draw coronal crosshairs
        this.context.save();
        this.context.beginPath();
        this.context.rect(this.coronalSlice.screenOffsetX, this.coronalSlice.screenOffsetY, this.coronalSlice.screenDim, this.coronalSlice.screenDim);
        this.context.closePath();
        this.context.clip();

        this.context.beginPath();

        xLoc = (this.coronalSlice.finalTransform[0][2] + (this.currentCoord.x + 0.5) * this.coronalSlice.finalTransform[0][0]);
        yStart = (this.coronalSlice.finalTransform[1][2]);
        yEnd = (this.coronalSlice.finalTransform[1][2] + this.coronalSlice.yDim * this.coronalSlice.finalTransform[1][1]);
        this.context.moveTo(xLoc, yStart);
        this.context.lineTo(xLoc, yEnd);

        yLoc = (this.coronalSlice.finalTransform[1][2] + (this.currentCoord.z + 0.5) * this.coronalSlice.finalTransform[1][1]);
        xStart = (this.coronalSlice.finalTransform[0][2]);
        xEnd = (this.coronalSlice.finalTransform[0][2] + this.coronalSlice.xDim * this.coronalSlice.finalTransform[0][0]);
        this.context.moveTo(xStart, yLoc);
        this.context.lineTo(xEnd, yLoc);

        this.context.closePath();
        this.context.stroke();
        this.context.restore();
    }

    if ((((this.mainImage !== this.sagittalSlice) && (this.container.preferences.showCrosshairs !== 'Main'))
            || ((this.mainImage === this.sagittalSlice) && (this.container.preferences.showCrosshairs !== 'Lower')
            && this.toggleMainCrosshairs)) && (this.container.orthogonal || (this.sagittalSlice === this.mainImage))) {
        // draw sagittal crosshairs
        this.context.save();
        this.context.beginPath();
        this.context.rect(this.sagittalSlice.screenOffsetX, this.sagittalSlice.screenOffsetY, this.sagittalSlice.screenDim, this.sagittalSlice.screenDim);
        this.context.closePath();
        this.context.clip();

        this.context.beginPath();

        xLoc = (this.sagittalSlice.finalTransform[0][2] + (this.currentCoord.y + 0.5) * this.sagittalSlice.finalTransform[0][0]);
        yStart = (this.sagittalSlice.finalTransform[1][2]);
        yEnd = (this.sagittalSlice.finalTransform[1][2] + this.sagittalSlice.yDim * this.sagittalSlice.finalTransform[1][1]);
        this.context.moveTo(xLoc, yStart);
        this.context.lineTo(xLoc, yEnd);

        yLoc = (this.sagittalSlice.finalTransform[1][2] + (this.currentCoord.z + 0.5) * this.sagittalSlice.finalTransform[1][1]);
        xStart = (this.sagittalSlice.finalTransform[0][2]);
        xEnd = (this.sagittalSlice.finalTransform[0][2] + this.sagittalSlice.xDim * this.sagittalSlice.finalTransform[0][0]);
        this.context.moveTo(xStart, yLoc);
        this.context.lineTo(xEnd, yLoc);

        this.context.closePath();
        this.context.stroke();
        this.context.restore();
    }
};



papaya.viewer.Viewer.prototype.calculateScreenSliceTransforms = function () {
    this.viewerDim = this.canvas.height;

    this.getTransformParameters(this.mainImage, this.viewerDim, false);
    this.mainImage.screenTransform[0][2] += this.mainImage.screenOffsetX = 0;
    this.mainImage.screenTransform[1][2] += this.mainImage.screenOffsetY = 0;

    this.getTransformParameters(this.lowerImageBot, this.viewerDim, true);
    this.lowerImageBot.screenTransform[0][2] += this.lowerImageBot.screenOffsetX
        = (this.viewerDim + (papaya.viewer.Viewer.GAP));
    this.lowerImageBot.screenTransform[1][2] += this.lowerImageBot.screenOffsetY
        = (((this.viewerDim - papaya.viewer.Viewer.GAP) / 2) + (papaya.viewer.Viewer.GAP));

    this.getTransformParameters(this.lowerImageTop, this.viewerDim, true);
    this.lowerImageTop.screenTransform[0][2] += this.lowerImageTop.screenOffsetX
        = (this.viewerDim + (papaya.viewer.Viewer.GAP));
    this.lowerImageTop.screenTransform[1][2] += this.lowerImageTop.screenOffsetY = 0;

    this.axialSlice.updateFinalTransform();
    this.coronalSlice.updateFinalTransform();
    this.sagittalSlice.updateFinalTransform();
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
    image.screenTransform[0][0] = scaleX;
    image.screenTransform[1][1] = scaleY;
    image.screenTransform[0][2] = transX;
    image.screenTransform[1][2] = transY;
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
    var keyCode, center;

    this.keyPressIgnored = false;

    if (this.container.toolbar.isShowingMenus()) {
        return;
    }

    if (((papayaContainers.length > 1) || papayaContainers[0].nestedViewer) && (papayaLastHoveredViewer !== this)) {
        return;
    }

    keyCode = getKeyCode(ke);

    if (isControlKey(ke)) {
        this.isControlKeyDown = true;
    } else if (isAltKey(ke)) {
        this.isAltKeyDown = true;
    } else if (isShiftKey(ke)) {
        this.isShiftKeyDown = true;
    } else if (keyCode === papaya.viewer.Viewer.KEYCODE_ROTATE_VIEWS) {
        this.rotateViews();
    } else if (keyCode === papaya.viewer.Viewer.KEYCODE_CENTER) {
        center = new papaya.core.Coordinate(Math.floor(this.volume.header.imageDimensions.xDim / 2),
            Math.floor(this.volume.header.imageDimensions.yDim / 2),
            Math.floor(this.volume.header.imageDimensions.zDim / 2));
        this.gotoCoordinate(center);
    } else if (keyCode === papaya.viewer.Viewer.KEYCODE_ORIGIN) {
        this.gotoCoordinate(this.volume.header.origin);
    } else if (keyCode === papaya.viewer.Viewer.KEYCODE_ARROW_UP) {
        this.incrementCoronal(false);
    } else if (keyCode === papaya.viewer.Viewer.KEYCODE_ARROW_DOWN) {
        this.incrementCoronal(true);
    } else if (keyCode === papaya.viewer.Viewer.KEYCODE_ARROW_LEFT) {
        this.incrementSagittal(true);
    } else if (keyCode === papaya.viewer.Viewer.KEYCODE_ARROW_RIGHT) {
        this.incrementSagittal(false);
    } else if ((keyCode === papaya.viewer.Viewer.KEYCODE_PAGE_DOWN) || (keyCode === papaya.viewer.Viewer.KEYCODE_FORWARD_SLASH)) {
        this.incrementAxial(true);
    } else if ((keyCode === papaya.viewer.Viewer.KEYCODE_PAGE_UP) || (keyCode === papaya.viewer.Viewer.KEYCODE_SINGLE_QUOTE)) {
        this.incrementAxial(false);
    } else if (keyCode === papaya.viewer.Viewer.KEYCODE_INCREMENT_MAIN) {
        if (this.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
            this.incrementAxial(false);
        } else if (this.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
            this.incrementCoronal(false);
        } else if (this.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
            this.incrementSagittal(true);
        }
    } else if (keyCode === papaya.viewer.Viewer.KEYCODE_DECREMENT_MAIN) {
        if (this.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
            this.incrementAxial(true);
        } else if (this.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
            this.incrementCoronal(true);
        } else if (this.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
            this.incrementSagittal(false);
        }
    } else if (keyCode === papaya.viewer.Viewer.KEYCODE_TOGGLE_CROSSHAIRS) {
        if ((this.container.preferences.showCrosshairs === "All") || (this.container.preferences.showCrosshairs === "Main")) {
            this.toggleMainCrosshairs = !this.toggleMainCrosshairs;
            this.drawViewer(true);
        }
    } else if (keyCode === papaya.viewer.Viewer.KEYCODE_SERIES_FORWARD) {
        this.incrementSeriesPoint();
    } else if (keyCode === papaya.viewer.Viewer.KEYCODE_SERIES_BACK) {
        this.decrementSeriesPoint();
    } else {
        this.keyPressIgnored = true;
    }

    if (!this.keyPressIgnored) {
        ke.handled = true;
        ke.preventDefault();
    }
};



papaya.viewer.Viewer.prototype.keyUpEvent = function (ke) {
    //var keyCode = getKeyCode(ke);

    if ((papayaContainers.length > 1) && (papayaLastHoveredViewer !== this)) {
        return;
    }

    this.isControlKeyDown = false;
    this.isAltKeyDown = false;
    this.isShiftKeyDown = false;

    if (!this.keyPressIgnored) {
        ke.handled = true;
        ke.preventDefault();
    }
};



papaya.viewer.Viewer.prototype.rotateViews = function () {
    var temp;

    temp = this.lowerImageBot;
    this.lowerImageBot = this.lowerImageTop;
    this.lowerImageTop = this.mainImage;
    this.mainImage = temp;
    this.calculateScreenSliceTransforms();

    this.drawViewer();
    this.updateSliceSliderControl();
};



papaya.viewer.Viewer.prototype.timepointChanged = function () {
    this.drawViewer(true);
    this.updateWindowTitle();
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
                viewer.updatePosition(this, getMousePositionX(viewer.updateTimerEvent),
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
            this.container.toolbar.closeAllMenus();

            this.previousMousePosition.x = getMousePositionX(me);
            this.previousMousePosition.y = getMousePositionY(me);

            this.findClickedSlice(this, this.previousMousePosition.x, this.previousMousePosition.y);

            if ((me.which === 3) || this.isControlKeyDown) {
                this.isWindowControl = true;
                this.container.toolbar.showImageMenu(this.getCurrentScreenVolIndex());
            } else if (this.isAltKeyDown && this.selectedSlice) {
                this.isZoomMode = true;

                if (this.isZooming() && this.isShiftKeyDown) {
                    this.isPanning = true;

                    this.setStartPanLocation(
                        this.convertScreenToImageCoordinateX(this.previousMousePosition.x, this.selectedSlice),
                        this.convertScreenToImageCoordinateY(this.previousMousePosition.y, this.selectedSlice),
                        this.selectedSlice.sliceDirection
                    );
                } else {
                    this.setZoomLocation();
                }
            } else {
                this.updatePosition(this, getMousePositionX(me), getMousePositionY(me), false);
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
            if (!this.isWindowControl && !this.isZoomMode) {
                this.updatePosition(this, getMousePositionX(me), getMousePositionY(me));
            }

            this.zoomFactorPrevious = this.zoomFactor;
            this.isDragging = false;
            this.isWindowControl = false;
            this.isZoomMode = false;
            this.isPanning = false;
            this.selectedSlice = null;

            me.handled = true;
        }
    }

    this.updateWindowTitle();
    this.container.toolbar.closeAllMenus();
};



papaya.viewer.Viewer.prototype.findClickedSlice = function (viewer, xLoc, yLoc) {
    xLoc = xLoc - this.canvasRect.left;
    yLoc = yLoc - this.canvasRect.top;

    if (this.insideScreenSlice(viewer.axialSlice, xLoc, yLoc, viewer.volume.getXDim(), viewer.volume.getYDim())) {
        this.selectedSlice = this.axialSlice;
    } else if (this.insideScreenSlice(viewer.coronalSlice, xLoc, yLoc, viewer.volume.getXDim(), viewer.volume.getZDim())) {
        this.selectedSlice = this.coronalSlice;
    } else if (this.insideScreenSlice(viewer.sagittalSlice, xLoc, yLoc, viewer.volume.getYDim(), viewer.volume.getZDim())) {
        this.selectedSlice = this.sagittalSlice;
    } else {
        this.selectedSlice = null;
    }
};


papaya.viewer.Viewer.prototype.mouseMoveEvent = function (me) {
    me.preventDefault();

    var currentMouseX, currentMouseY, zoomFactorCurrent;

    papayaLastHoveredViewer = this;

    currentMouseX = getMousePositionX(me);
    currentMouseY = getMousePositionY(me);

    if (this.isDragging) {
        if (this.isWindowControl) {
            this.windowLevelChanged(this.previousMousePosition.x - currentMouseX,
                this.previousMousePosition.y - currentMouseY);

            this.previousMousePosition.x = currentMouseX;
            this.previousMousePosition.y = currentMouseY;
        } else if (this.isPanning) {
            this.setCurrentPanLocation(
                this.convertScreenToImageCoordinateX(currentMouseX, this.selectedSlice),
                this.convertScreenToImageCoordinateY(currentMouseY, this.selectedSlice),
                this.selectedSlice.sliceDirection
            );
        } else if (this.isZoomMode) {
            zoomFactorCurrent = ((this.previousMousePosition.y - currentMouseY) * 0.05);
            this.setZoomFactor(this.zoomFactorPrevious - zoomFactorCurrent);

            this.axialSlice.updateZoomTransform(this.zoomFactor, this.zoomLocX, this.zoomLocY, this.panAmountX, this.panAmountY, this);
            this.coronalSlice.updateZoomTransform(this.zoomFactor, this.zoomLocX, this.zoomLocZ, this.panAmountX, this.panAmountZ, this);
            this.sagittalSlice.updateZoomTransform(this.zoomFactor, this.zoomLocY, this.zoomLocZ, this.panAmountY, this.panAmountZ, this);
            this.drawViewer(true);
        } else {
            this.resetUpdateTimer(null);
            this.updatePosition(this, getMousePositionX(me), getMousePositionY(me));
        }
    } else {
        this.updateCursorPosition(this, getMousePositionX(me), getMousePositionY(me));
        this.isZoomMode = false;
    }
};


papaya.viewer.Viewer.prototype.mouseDoubleClickEvent = function () {
    if (this.isAltKeyDown) {
        this.zoomFactorPrevious = 1;
        this.setZoomFactor(1);
    }
};


papaya.viewer.Viewer.prototype.mouseOutEvent = function () {
    papayaLastHoveredViewer = null;

    if (this.container.display) {
        this.container.display.drawEmptyDisplay();
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
    this.container.toolbar.updateImageMenuRange(this.getCurrentScreenVolIndex(), parseFloat(minFinal.toPrecision(7)), parseFloat(maxFinal.toPrecision(7)));
    this.drawViewer(true);
};



papaya.viewer.Viewer.prototype.gotoCoordinate = function (coor) {
    this.currentCoord.x = coor.x;
    this.currentCoord.y = coor.y;
    this.currentCoord.z = coor.z;

    this.drawViewer(true);
    this.updateSliceSliderControl();
};



papaya.viewer.Viewer.prototype.resizeViewer = function (dims) {
    this.canvas.width = dims[0];
    this.canvas.height = dims[1];

    if (this.initialized) {
        this.calculateScreenSliceTransforms();
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



papaya.viewer.Viewer.prototype.getIndexCoordinateAtWorld = function (ctrX, ctrY, ctrZ, coord) {
    coord.setCoordinate((ctrX / this.volume.header.voxelDimensions.xSize) + this.volume.header.origin.x,
        -1 * ((ctrY / this.volume.header.voxelDimensions.ySize) - this.volume.header.origin.y),
        -1 * ((ctrZ / this.volume.header.voxelDimensions.zSize) - this.volume.header.origin.z), true);
    return coord;
};



papaya.viewer.Viewer.prototype.getNextColorTable = function () {
    var value = (this.screenVolumes.length - 1) % papaya.viewer.ColorTable.OVERLAY_COLOR_TABLES.length;
    return papaya.viewer.ColorTable.OVERLAY_COLOR_TABLES[value].name;
};



papaya.viewer.Viewer.prototype.getCurrentValueAt = function (ctrX, ctrY, ctrZ) {
    return this.currentScreenVolume.volume.getVoxelAtCoordinate((ctrX - this.volume.header.origin.x)
        * this.volume.header.voxelDimensions.xSize,
        (this.volume.header.origin.y - ctrY) * this.volume.header.voxelDimensions.ySize,
        (this.volume.header.origin.z - ctrZ) * this.volume.header.voxelDimensions.zSize, this.currentScreenVolume.currentTimepoint, false);
};




papaya.viewer.Viewer.prototype.resetViewer = function () {
    this.initialized = false;
    this.loadingVolume = null;
    this.volume = new papaya.volume.Volume(this.container.display);
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
    this.canvas.removeEventListener("mouseup", this.listenerMouseUp, false);
    document.removeEventListener("keydown", this.listenerKeyDown, true);
    document.removeEventListener("keyup", this.listenerKeyUp, true);
    this.canvas.removeEventListener("contextmenu", this.listenerContextMenu, false);
    this.canvas.removeEventListener("touchmove", this.listenerTouchMove, false);
    this.canvas.removeEventListener("touchstart", this.listenerMouseDown, false);
    this.canvas.removeEventListener("touchend", this.listenerMouseUp, false);
    this.canvas.removeEventListener("dblclick", this.listenerMouseDoubleClick, false);

    this.removeScroll();

    this.updateTimer = null;
    this.updateTimerEvent = null;
    this.drawEmptyViewer();
    if (this.container.display) {
        this.container.display.drawEmptyDisplay();
    }

    this.updateSliceSliderControl();
    this.container.toolbar.buildToolbar();
};





papaya.viewer.Viewer.prototype.getImageDimensionsDescription = function (index) {
    var orientationStr, imageDims;

    orientationStr = this.screenVolumes[index].volume.header.orientation.orientation;
    imageDims = this.screenVolumes[index].volume.header.imageDimensions;

    return ("(" + orientationStr.charAt(0) + ", " + orientationStr.charAt(1) + ", " + orientationStr.charAt(2) + ") "
        + imageDims.cols + " x " + imageDims.rows + " x " + imageDims.slices);
};



papaya.viewer.Viewer.prototype.getVoxelDimensionsDescription = function (index) {
    var orientationStr, voxelDims;

    orientationStr = this.screenVolumes[index].volume.header.orientation.orientation;
    voxelDims = this.screenVolumes[index].volume.header.voxelDimensions;

    return ("(" + orientationStr.charAt(0) + ", " + orientationStr.charAt(1) + ", " + orientationStr.charAt(2) + ") "
        + formatNumber(voxelDims.colSize, true) + " x " + formatNumber(voxelDims.rowSize, true) + " x "
        + formatNumber(voxelDims.sliceSize, true) + " " + voxelDims.getSpatialUnitString());
};


papaya.viewer.Viewer.prototype.getSeriesDimensionsDescription = function (index) {
    var imageDims = this.screenVolumes[index].volume.header.imageDimensions;

    return (imageDims.timepoints.toString());
};



papaya.viewer.Viewer.prototype.getSeriesSizeDescription = function (index) {
    var voxelDims = this.screenVolumes[index].volume.header.voxelDimensions;

    return (voxelDims.timeSize.toString() + " " + voxelDims.getTemporalUnitString());
};


papaya.viewer.Viewer.prototype.getFilename = function (index) {
    return wordwrap(this.screenVolumes[index].volume.fileName, 25, "<br />", true);
};



papaya.viewer.Viewer.prototype.getNiceFilename = function (index) {
    var truncateText, filename;

    truncateText = "...";
    filename = this.screenVolumes[index].volume.fileName.replace(".nii", "").replace(".gz", "");

    if (filename.length > papaya.viewer.Viewer.TITLE_MAX_LENGTH) {
        filename = filename.substr(0, papaya.viewer.Viewer.TITLE_MAX_LENGTH - truncateText.length) + truncateText;
    }

    return filename;
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
    this.updateWindowTitle();
};



papaya.viewer.Viewer.prototype.updateWindowTitle = function () {
    var title;

    title = this.getNiceFilename(this.getCurrentScreenVolIndex());

    if (this.currentScreenVolume.volume.numTimepoints > 1) {
        title = (title + " (" + (this.currentScreenVolume.currentTimepoint + 1) + " of " + this.currentScreenVolume.volume.numTimepoints + ")");
    }

    if (this.isZooming()) {
        title = (title + " " + this.getZoomString());
    }

    this.container.toolbar.updateTitleBar(title);
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
    this.reconcileOverlaySeriesPoint(this.currentScreenVolume);
};



papaya.viewer.Viewer.prototype.isSelected = function (index) {
    return (this.isSelectable() && (index === this.getCurrentScreenVolIndex()));
};



papaya.viewer.Viewer.prototype.isSelectable = function () {
    return (this.screenVolumes.length > 1);
};



papaya.viewer.Viewer.prototype.processParams = function (params) {
    if (params.worldSpace) {
        this.worldSpace = true;
    }

    if (params.showOrientation) {
        this.container.preferences.showOrientation = "Yes";
    }

    if (params.coordinate) {
        this.initialCoordinate = params.coordinate;
    }

    if (params.smoothDisplay !== undefined) {
        this.container.preferences.smoothDisplay = (params.smoothDisplay ? "Yes" : "No");
    }
};



papaya.viewer.Viewer.prototype.goToInitialCoordinate = function () {
    var coord = new papaya.core.Coordinate();

    if (this.initialCoordinate === null) {
        coord.setCoordinate(this.volume.header.imageDimensions.xDim / 2, this.volume.header.imageDimensions.yDim / 2, this.volume.header.imageDimensions.zDim / 2, true);
    } else {
        if (this.worldSpace) {
            this.getIndexCoordinateAtWorld(this.initialCoordinate[0], this.initialCoordinate[1], this.initialCoordinate[2], coord);
        } else {
            coord.setCoordinate(this.initialCoordinate[0], this.initialCoordinate[1], this.initialCoordinate[2], true);
        }

        this.initialCoordinate = null;
    }

    this.gotoCoordinate(coord);

    if (this.container.display) {
        this.container.display.drawDisplay(this.currentCoord.x, this.currentCoord.y, this.currentCoord.z,
            this.getCurrentValueAt(this.currentCoord.x, this.currentCoord.y, this.currentCoord.z));
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



papaya.viewer.Viewer.prototype.scrolled = function (e) {
    var scrollSign;

    if (!this.nestedViewer) {
        e = e || window.event;
        if (e.preventDefault) {
            e.preventDefault();
        }

        e.returnValue = false;

        scrollSign = getScrollSign(e);

        if (this.container.preferences.scrollBehavior === "Increment Slice") {
            if (scrollSign < 0) {
                if (this.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
                    this.incrementAxial(false);
                } else if (this.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
                    this.incrementCoronal(false);
                } else if (this.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
                    this.incrementSagittal(false);
                }

                this.gotoCoordinate(this.currentCoord);
            } else if (scrollSign > 0) {
                if (this.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
                    this.incrementAxial(true);
                } else if (this.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
                    this.incrementCoronal(true);
                } else if (this.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
                    this.incrementSagittal(true);
                }

                this.gotoCoordinate(this.currentCoord);
            }
        } else {
            if (scrollSign !== 0) {
                this.isZoomMode = true;
                if (this.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
                    this.setZoomLocation(this.currentCoord.x, this.currentCoord.y, this.mainImage.sliceDirection);
                } else if (this.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
                    this.setZoomLocation(this.currentCoord.x, this.currentCoord.z, this.mainImage.sliceDirection);
                } else if (this.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
                    this.setZoomLocation(this.currentCoord.y, this.currentCoord.z, this.mainImage.sliceDirection);
                }

                this.setZoomFactor(this.zoomFactorPrevious + (scrollSign * 0.1 * this.zoomFactorPrevious));
                this.zoomFactorPrevious = this.zoomFactor;
            }
        }
    }
};



papaya.viewer.Viewer.prototype.incrementAxial = function (increment) {
    var max = this.volume.header.imageDimensions.zDim;

    if (increment) {
        this.currentCoord.z += 1;

        if (this.currentCoord.z >= max) {
            this.currentCoord.z = max - 1;
        }
    } else {
        this.currentCoord.z -= 1;

        if (this.currentCoord.z < 0) {
            this.currentCoord.z = 0;
        }
    }

    this.gotoCoordinate(this.currentCoord);
};



papaya.viewer.Viewer.prototype.incrementCoronal = function (increment) {
    var max = this.volume.header.imageDimensions.yDim;

    if (increment) {
        this.currentCoord.y += 1;

        if (this.currentCoord.y >= max) {
            this.currentCoord.y = max - 1;
        }
    } else {
        this.currentCoord.y -= 1;

        if (this.currentCoord.y < 0) {
            this.currentCoord.y = 0;
        }
    }

    this.gotoCoordinate(this.currentCoord);
};



papaya.viewer.Viewer.prototype.incrementSagittal = function (increment) {
    var max = this.volume.header.imageDimensions.xDim;

    if (increment) {
        this.currentCoord.x -= 1;

        if (this.currentCoord.x < 0) {
            this.currentCoord.x = 0;
        }
    } else {
        this.currentCoord.x += 1;

        if (this.currentCoord.x >= max) {
            this.currentCoord.x = max - 1;
        }
    }

    this.gotoCoordinate(this.currentCoord);
};



papaya.viewer.Viewer.prototype.setZoomFactor = function (val) {
    if (val > papaya.viewer.Viewer.ZOOM_FACTOR_MAX) {
        val = papaya.viewer.Viewer.ZOOM_FACTOR_MAX;
    } else if (val < papaya.viewer.Viewer.ZOOM_FACTOR_MIN) {
        val = papaya.viewer.Viewer.ZOOM_FACTOR_MIN;
    }

    this.zoomFactor = val;

    if (this.zoomFactor === 1) {
        this.panAmountX = this.panAmountY = this.panAmountZ = 0;
    }

    this.axialSlice.updateZoomTransform(this.zoomFactor, this.zoomLocX, this.zoomLocY, this.panAmountX, this.panAmountY, this);
    this.coronalSlice.updateZoomTransform(this.zoomFactor, this.zoomLocX, this.zoomLocZ, this.panAmountX, this.panAmountZ, this);
    this.sagittalSlice.updateZoomTransform(this.zoomFactor, this.zoomLocY, this.zoomLocZ, this.panAmountY, this.panAmountZ, this);
    this.drawViewer(false, true);

    this.updateWindowTitle();
};





papaya.viewer.Viewer.prototype.getZoomString = function () {
    return (parseInt(this.zoomFactor * 100, 10) + "%");
};



papaya.viewer.Viewer.prototype.isZooming = function () {
    return (this.zoomFactor > 1);
};



papaya.viewer.Viewer.prototype.setZoomLocation = function () {
    if (this.zoomFactor === 1) {
        this.zoomLocX = this.currentCoord.x;
        this.zoomLocY = this.currentCoord.y;
        this.zoomLocZ = this.currentCoord.z;

        this.axialSlice.updateZoomTransform(this.zoomFactor, this.zoomLocX, this.zoomLocY, this.panAmountX, this.panAmountY, this);
        this.coronalSlice.updateZoomTransform(this.zoomFactor, this.zoomLocX, this.zoomLocZ, this.panAmountX, this.panAmountZ, this);
        this.sagittalSlice.updateZoomTransform(this.zoomFactor, this.zoomLocY, this.zoomLocZ, this.panAmountY, this.panAmountZ, this);
        this.drawViewer(false, true);
    }
};



papaya.viewer.Viewer.prototype.setStartPanLocation = function (xLoc, yLoc, sliceDirection) {
    var temp;

    if (this.zoomFactor > 1) {
        if (sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
            this.panLocX = xLoc;
            this.panLocY = yLoc;
            this.panLocZ = this.axialSlice.currentSlice;
        } else if (sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
            this.panLocX = xLoc;
            this.panLocY = this.coronalSlice.currentSlice;
            this.panLocZ = yLoc;
        } else if (sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
            this.panLocX = this.sagittalSlice.currentSlice;
            temp = xLoc;  // because of dumb IDE warning
            this.panLocY = temp;
            this.panLocZ = yLoc;
        }
    }
};



papaya.viewer.Viewer.prototype.setCurrentPanLocation = function (xLoc, yLoc, sliceDirection) {
    if (this.zoomFactor > 1) {
        if (sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
            this.panAmountX += (xLoc - this.panLocX);
            this.panAmountY += (yLoc - this.panLocY);
            this.panAmountZ = 0;
        } else if (sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
            this.panAmountX += (xLoc - this.panLocX);
            this.panAmountY = 0;
            this.panAmountZ += (yLoc - this.panLocZ);
        } else if (sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
            this.panAmountX = 0;
            this.panAmountY += (xLoc - this.panLocY);
            this.panAmountZ += (yLoc - this.panLocZ);
        }

        this.axialSlice.updateZoomTransform(this.zoomFactor, this.zoomLocX, this.zoomLocY, this.panAmountX, this.panAmountY, this);
        this.coronalSlice.updateZoomTransform(this.zoomFactor, this.zoomLocX, this.zoomLocZ, this.panAmountX, this.panAmountZ, this);
        this.sagittalSlice.updateZoomTransform(this.zoomFactor, this.zoomLocY, this.zoomLocZ, this.panAmountY, this.panAmountZ, this);
        this.drawViewer(false, true);
    }
};



papaya.viewer.Viewer.prototype.isWorldMode = function () {
    return this.worldSpace;
};



papaya.viewer.Viewer.prototype.isCollapsable = function () {
    return this.container.collapsable;
};


papaya.viewer.Viewer.prototype.sliceSliderControlChanged = function () {
    if (this.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
        this.currentCoord.z = parseInt(this.sliceSliderControl.val(), 10);
    } else if (this.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
        this.currentCoord.y = parseInt(this.sliceSliderControl.val(), 10);
    } else if (this.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
        this.currentCoord.x = parseInt(this.sliceSliderControl.val(), 10);
    }

    this.gotoCoordinate(this.currentCoord);
};



papaya.viewer.Viewer.prototype.updateSliceSliderControl = function () {
    if (this.sliceSliderControl) {
        if (this.initialized) {
            this.sliceSliderControl.prop("disabled", false);
            this.sliceSliderControl.prop("min", "0");
            this.sliceSliderControl.prop("step", "1");

            if (this.sliceSliderControl) {
                if (this.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
                    this.sliceSliderControl.prop("max", (this.volume.header.imageDimensions.zDim - 1).toString());
                    this.sliceSliderControl.val(this.currentCoord.z);
                } else if (this.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
                    this.sliceSliderControl.prop("max", (this.volume.header.imageDimensions.yDim - 1).toString());
                    this.sliceSliderControl.val(this.currentCoord.y);
                } else if (this.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
                    this.sliceSliderControl.prop("max", (this.volume.header.imageDimensions.xDim - 1).toString());
                    this.sliceSliderControl.val(this.currentCoord.x);
                }
            }
        } else {
            this.sliceSliderControl.prop("disabled", true);
            this.sliceSliderControl.prop("min", "0");
            this.sliceSliderControl.prop("step", "1");
            this.sliceSliderControl.prop("max", "1");
            this.sliceSliderControl.val(0);
        }
    }
};



papaya.viewer.Viewer.prototype.incrementSeriesPoint = function () {
    this.currentScreenVolume.incrementTimepoint();

    if (this.currentScreenVolume.isOverlay()) {
        this.reconcileOverlaySeriesPoint(this.currentScreenVolume);
    }

    this.timepointChanged();
};



papaya.viewer.Viewer.prototype.decrementSeriesPoint = function () {
    this.currentScreenVolume.decrementTimepoint();

    if (this.currentScreenVolume.isOverlay()) {
        this.reconcileOverlaySeriesPoint(this.currentScreenVolume);
    }

    this.timepointChanged();
};



papaya.viewer.Viewer.prototype.reconcileOverlaySeriesPoint = function (screenVolume) {
    var ctr, seriesPoint, seriesPointSeconds;

    if (this.worldSpace) {
        seriesPointSeconds = screenVolume.getCurrentTime();

        for (ctr = 1; ctr < this.screenVolumes.length; ctr += 1) {
            if (this.screenVolumes[ctr] !== screenVolume) {
                this.screenVolumes[ctr].setCurrentTime(seriesPointSeconds);
            }
        }
    } else {
        seriesPoint = screenVolume.currentTimepoint;

        for (ctr = 1; ctr < this.screenVolumes.length; ctr += 1) {
            if (this.screenVolumes[ctr] !== screenVolume) {
                this.screenVolumes[ctr].setTimepoint(seriesPoint);
            }
        }
    }
};
