
/*jslint browser: true, node: true */
/*global $, PAPAYA_SPACING, papayaContainers, papayaFloorFast, papayaRoundFast, PAPAYA_CONTROL_DIRECTION_SLIDER,
 PAPAYA_CONTROL_MAIN_SLIDER, PAPAYA_CONTROL_SWAP_BUTTON_CSS, PAPAYA_CONTROL_GOTO_ORIGIN_BUTTON_CSS,
 PAPAYA_CONTROL_GOTO_CENTER_BUTTON_CSS,  PAPAYA_CONTROL_MAIN_INCREMENT_BUTTON_CSS, PAPAYA_PADDING,
 PAPAYA_CONTROL_MAIN_DECREMENT_BUTTON_CSS, PAPAYA_CONTROL_MAIN_SWAP_BUTTON_CSS, PAPAYA_CONTROL_INCREMENT_BUTTON_CSS,
 PAPAYA_CONTROL_MAIN_GOTO_CENTER_BUTTON_CSS, PAPAYA_CONTROL_MAIN_GOTO_ORIGIN_BUTTON_CSS */

"use strict";

/*** Imports ***/
var papaya = papaya || {};
papaya.viewer = papaya.viewer || {};
var PAPAYA_BUILD_NUM = PAPAYA_BUILD_NUM || "0";

/*** Constructor ***/
papaya.viewer.Viewer = papaya.viewer.Viewer || function (container, width, height, params) {
    this.container = container;
    this.canvas = document.createElement("canvas");
    this.canvas.width = width;
    this.canvas.height = height;
    this.context = this.canvas.getContext("2d");
    this.canvas.style.padding = 0;
    this.canvas.style.margin = 0;
    this.canvas.style.border = "none";
    // Modified 18/12/2019: add Crosshair canvas
    this.canvasAnnotation = document.createElement("canvas");
    // this.canvasAnnotation.title = "localizer";
    this.canvasAnnotation.width = width;
    this.canvasAnnotation.height = height;
    this.canvasAnnotation.zIndex = 1;
    // this.canvasAnnotation.setAttribute('style', 'pointer-events: none');
    this.contextAnnotation = this.canvasAnnotation.getContext("2d");
    this.canvasAnnotation.style.padding = 0;
    this.canvasAnnotation.style.margin = 0;
    this.canvasAnnotation.style.border = "none";
    this.canvasAnnotation.style.position = 'absolute';
    this.canvasAnnotation.style.left = 0;
    this.canvasAnnotation.style.top = 0;
    this.crossHair = {
        xLoc: null,
        yLoc: null
    };
    ///////////////////////////
    this.atlas = null;
    this.initialized = false;
    this.pageLoaded = false;
    this.loadingVolume = null;
    this.volume = new papaya.volume.Volume(this.container.display, this);
    this.screenVolumes = [];
    this.surfaces = [];
    this.currentScreenVolume = null;
    this.axialSlice = null;
    this.coronalSlice = null;
    this.sagittalSlice = null;
    this.cmprSlice = null;
    this.surfaceView = null;
    this.obliqueView = null;
    this.selectedSlice = null;
    this.mainImage = null;
    this.lowerImageBot2 = null;
    this.lowerImageBot = null;
    this.lowerImageTop = null;
    this.viewerDim = 0;
    this.worldSpace = false;
    this.ignoreSync = false;
    this.currentCoord = new papaya.core.Coordinate(0, 0, 0);
    this.cursorPosition = new papaya.core.Coordinate(0, 0, 0);
    this.longestDim = 0;
    this.longestDimSize = 0;
    this.draggingSliceDir = 0;
    this.isDragging = false;
    this.isWindowControl = false;
    this.isZoomMode = false;
    this.isContextMode = false;
    this.isPanning = false;
    this.didLongTouch = false;
    this.isLongTouch = false;
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
    this.bgColor = null;
    this.hasSeries = false;
    this.controlsHidden = false;
    this.loadingDTI = false;
    this.loadingDTIModRef = null;
    this.tempCoor = new papaya.core.Coordinate();

    this.listenerContextMenu = function (me) { me.preventDefault(); return false; };
    this.listenerMouseMove = papaya.utilities.ObjectUtils.bind(this, this.mouseMoveEvent);
    this.listenerMouseDown = papaya.utilities.ObjectUtils.bind(this, this.mouseDownEvent);
    this.listenerMouseOut = papaya.utilities.ObjectUtils.bind(this, this.mouseOutEvent);
    this.listenerMouseLeave = papaya.utilities.ObjectUtils.bind(this, this.mouseLeaveEvent);
    this.listenerMouseUp = papaya.utilities.ObjectUtils.bind(this, this.mouseUpEvent);
    this.listenerMouseDoubleClick = papaya.utilities.ObjectUtils.bind(this, this.mouseDoubleClickEvent);
    this.listenerKeyDown = papaya.utilities.ObjectUtils.bind(this, this.keyDownEvent);
    this.listenerKeyUp = papaya.utilities.ObjectUtils.bind(this, this.keyUpEvent);
    this.listenerTouchMove = papaya.utilities.ObjectUtils.bind(this, this.touchMoveEvent);
    this.listenerTouchStart = papaya.utilities.ObjectUtils.bind(this, this.touchStartEvent);
    this.listenerTouchEnd = papaya.utilities.ObjectUtils.bind(this, this.touchEndEvent);
    this.initialCoordinate = null;
    this.listenerScroll = papaya.utilities.ObjectUtils.bind(this, this.scrolled);
    this.longTouchTimer = null;
    this.updateTimer = null;
    this.updateTimerEvent = null;
    this.drawEmptyViewer();

    this.processParams(params);

    // modification 25/11/2019
    

    // modification 28/11/2019: add reactPapayaViewport constructor
    // this.reactPapayaViewport = null;

    // modification 16/01/2020: add current interacting slice
    this.currentInteractingSlice = this.axialSlice;
    this.currentDetectionRadius = 20;
    this.isGrabbingLocalizer = false;
    this.localizerDetected = 0; // 1: rotate, 2: move, 0: no detection
    this.centerCoordInverse = null;
    this.screenCurve = new papaya.viewer.ScreenCurve(this);
    this.screenLayout = [this.mainImage, this.lowerImageTop, this.lowerImageBot, this.lowerImageBot2];

    /// communication between Papaya and React Viewer
    this.reactViewerConnector = {
        PapayaViewport: null,
        imageReplacedExternally: false,
        mainImageChanged: false,
        activeTool: null,
        returnSliceDataCallback: null
    }

    // mouse move handler
    this.mouseMoveHandler = false;
    this.throttleAmount = 33; // in ms
    // use for performance testing
    this.updateSliceCount = 0;
    this.isPerformanceTest = false;
};


/*** Static Pseudo-constants ***/

papaya.viewer.Viewer.GAP = PAPAYA_SPACING;  // padding between slice views
papaya.viewer.Viewer.BACKGROUND_COLOR = "rgba(0, 0, 0, 255)";
// papaya.viewer.Viewer.CROSSHAIRS_COLOR = "rgba(28, 134, 238, 255)";
papaya.viewer.Viewer.CROSSHAIR_COLOR_AXIAL = "red";
papaya.viewer.Viewer.CROSSHAIR_COLOR_CORONAL = "blue";
papaya.viewer.Viewer.CROSSHAIR_COLOR_SAGITTAL = "rgba(0, 128, 0, 1)";
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
papaya.viewer.Viewer.KEYCODE_RULER = 82;
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


/*** Static Methods ***/

papaya.viewer.Viewer.validDimBounds = function (val, dimBound) {
    return (val < dimBound) ? val : dimBound - 1;
};



papaya.viewer.Viewer.getKeyCode = function (ev) {
    return (ev.keyCode || ev.charCode);
};



papaya.viewer.Viewer.isControlKey = function (ke) {
    var keyCode = papaya.viewer.Viewer.getKeyCode(ke);

    if ((papaya.utilities.PlatformUtils.os === "MacOS") && (
        (keyCode === 91) || // left command key
        (keyCode === 93) || // right command key
        (keyCode === 224)
        )) { // FF command key code
        return true;
    }

    return ((papaya.utilities.PlatformUtils.os !== "MacOS") && (keyCode === 17));
};



papaya.viewer.Viewer.isAltKey = function (ke) {
    var keyCode = papaya.viewer.Viewer.getKeyCode(ke);
    return (keyCode === 18);
};



papaya.viewer.Viewer.isShiftKey = function (ke) {
    var isShift = !!ke.shiftKey;

    if (!isShift && window.event) {
        isShift = !!window.event.shiftKey;
    }

    return isShift;
};



papaya.viewer.Viewer.getOffsetRect = function (elem) {
    // (1)
    var box = elem.getBoundingClientRect();

    var body = document.body;
    var docElem = document.documentElement;

    // (2)
    var scrollTop = window.pageYOffset || docElem.scrollTop;
    var scrollLeft = window.pageXOffset || docElem.scrollLeft;

    // (3)
    var clientTop = docElem.clientTop || body.clientTop || 0;
    var clientLeft = docElem.clientLeft || body.clientLeft || 0;

    // (4)
    var top  = box.top + scrollTop - clientTop;
    var left = box.left + scrollLeft - clientLeft;

    return { top: Math.round(top), left: Math.round(left) };
};



// http://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-on-html-canvas
papaya.viewer.Viewer.drawRoundRect = function (ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof stroke === "undefined" ) {
        stroke = true;
    }
    if (typeof radius === "undefined") {
        radius = 5;
    }
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (stroke) {
        ctx.stroke();
    }
    if (fill) {
        ctx.fill();
    }
};



/*** Prototype Methods ***/

papaya.viewer.Viewer.prototype.loadImage = function (refs, forceUrl, forceEncode, forceBinary) {
    if (this.screenVolumes.length === 0) {
        this.loadBaseImage(refs, forceUrl, forceEncode, forceBinary);
    } else {
        this.loadOverlay(refs, forceUrl, forceEncode, forceBinary);
    }
};
/**
 * loadCornerstoneImages
 * @Constraints cornerstoneImages are parsed and it's metadata is available
 * @params cornerstoneImages: array of Cornerstone Image object, metadata: array of Metadata ob
 */
papaya.viewer.Viewer.prototype.loadCornerstoneImages = function (cornerstoneImages, stackMetadata) {
    if (this.screenVolumes.length === 0) {
        this.volume = new papaya.volume.Volume(this.container.display, this, this.container.params);
        this.volume.readCornerstoneData(cornerstoneImages, stackMetadata, papaya.utilities.ObjectUtils.bind(this, this.initializeViewer));
    }
};



papaya.viewer.Viewer.prototype.showDialog = function (title, data, datasource, callback, callbackOk) {
    var ctr, index = -1;

    for (ctr = 0; ctr < papayaContainers.length; ctr += 1) {
        if (papayaContainers[ctr] === this.container) {
            index = ctr;
            break;
        }
    }

    var dialog = new papaya.ui.Dialog(this.container, title, data, datasource, callback, callbackOk, index);
    dialog.showDialog();
};



papaya.viewer.Viewer.prototype.loadBaseImage = function (refs, forceUrl, forceEncode, forceBinary) {
    var ctr, imageRefs = [], loadableImages = this.container.findLoadableImages(refs);
    this.volume = new papaya.volume.Volume(this.container.display, this, this.container.params);

    if (forceBinary) {
        if (loadableImages && loadableImages.length) {
            for (ctr = 0; ctr < loadableImages.length; ctr += 1) {
                imageRefs.push(loadableImages[ctr].encode);
            }
        } else {
            if (!Array.isArray(refs)) {
                refs = [refs];
            }

            imageRefs = refs;
        }

        this.volume.readBinaryData(imageRefs, papaya.utilities.ObjectUtils.bind(this, this.initializeViewer));
    } else if (forceEncode) {
        if (loadableImages) {
            for (ctr = 0; ctr < loadableImages.length; ctr += 1) {
                imageRefs.push(loadableImages[ctr].encode);
            }
        } else {
            imageRefs = refs;
        }

        this.volume.readEncodedData(imageRefs, papaya.utilities.ObjectUtils.bind(this, this.initializeViewer));
    } else if ((loadableImages !== null) && (loadableImages[0].encode !== undefined)) {
        for (ctr = 0; ctr < loadableImages.length; ctr += 1) {
            imageRefs.push(loadableImages[ctr].encode);
        }

        this.volume.readEncodedData(imageRefs, papaya.utilities.ObjectUtils.bind(this, this.initializeViewer));
    } else if (forceUrl) {
        this.volume.readURLs(refs, papaya.utilities.ObjectUtils.bind(this, this.initializeViewer));
    } else if ((loadableImages !== null) && (loadableImages[0].url !== undefined)) {
        if (loadableImages) {
            for (ctr = 0; ctr < loadableImages.length; ctr += 1) {
                imageRefs.push(loadableImages[ctr].url);
            }
        }

        this.volume.readURLs(imageRefs, papaya.utilities.ObjectUtils.bind(this, this.initializeViewer));
    } else {
        this.volume.readFiles(refs, papaya.utilities.ObjectUtils.bind(this, this.initializeViewer));
    }
};



papaya.viewer.Viewer.prototype.loadOverlay = function (refs, forceUrl, forceEncode, forceBinary) {
    var imageRefs, loadableImage = this.container.findLoadableImage(refs);
    this.loadingVolume = new papaya.volume.Volume(this.container.display, this, this.container.params);

    if (this.screenVolumes.length > papaya.viewer.Viewer.MAX_OVERLAYS) {
        this.loadingVolume.error = new Error("Maximum number of overlays (" + papaya.viewer.Viewer.MAX_OVERLAYS +
            ") has been reached!");
        this.initializeOverlay();
    } else {
        if (forceBinary) {
            if (!Array.isArray(refs)) {
                refs = [refs];
            }

            imageRefs = refs;

            this.loadingVolume.readBinaryData(imageRefs, papaya.utilities.ObjectUtils.bind(this, this.initializeOverlay));
        } else if (forceEncode) {
            imageRefs = loadableImage.encode;
            if (!(imageRefs instanceof Array)) {
                imageRefs = [];
                imageRefs[0] = loadableImage.encode;
            }

            this.loadingVolume.readEncodedData(imageRefs, papaya.utilities.ObjectUtils.bind(this, this.initializeOverlay));
        } else if ((loadableImage !== null) && (loadableImage.encode !== undefined)) {
            imageRefs = loadableImage.encode;
            if (!(imageRefs instanceof Array)) {
                imageRefs = [];
                imageRefs[0] = loadableImage.encode;
            }

            this.loadingVolume.readEncodedData(imageRefs, papaya.utilities.ObjectUtils.bind(this, this.initializeOverlay));
        } else if (forceUrl) {
            this.loadingVolume.readURLs(refs, papaya.utilities.ObjectUtils.bind(this, this.initializeOverlay));
        } else if ((loadableImage !== null) && (loadableImage.url !== undefined)) {
            this.loadingVolume.readURLs([loadableImage.url], papaya.utilities.ObjectUtils.bind(this, this.initializeOverlay));
        } else {
            this.loadingVolume.readFiles(refs, papaya.utilities.ObjectUtils.bind(this, this.initializeOverlay));
        }
    }
};



papaya.viewer.Viewer.prototype.loadSurface = function (ref, forceUrl, forceEncode) {
    var loadableImage = this.container.findLoadableImage(ref, true);

    if (this.screenVolumes.length == 0) {
        this.container.display.drawError("Load an image before loading a surface!");
        return;
    }

    var surface = new papaya.surface.Surface(this.container.display, this.container.params);

    if (forceEncode) {
        surface.readEncodedData(ref[0], this.volume, papaya.utilities.ObjectUtils.bind(this, this.initializeSurface));
    } else if ((loadableImage !== null) && (loadableImage.encode !== undefined)) {
        surface.readEncodedData(loadableImage.encode, this.volume, papaya.utilities.ObjectUtils.bind(this, this.initializeSurface));
    } else if (forceUrl) {
        surface.readURL(ref, this.volume, papaya.utilities.ObjectUtils.bind(this, this.initializeSurface));
    } else if ((loadableImage !== null) && (loadableImage.url !== undefined)) {
        surface.readURL(loadableImage.url, this.volume, papaya.utilities.ObjectUtils.bind(this, this.initializeSurface));
    } else {
        surface.readFile(ref[0], this.volume, papaya.utilities.ObjectUtils.bind(this, this.initializeSurface));
    }
};




papaya.viewer.Viewer.prototype.initializeSurface = function (surface) {
    var currentSurface = surface;

    if (!surface.error) {
        while (currentSurface !== null) {
            this.surfaces.push(currentSurface);
            currentSurface = currentSurface.nextSurface;
        }

        if (this.surfaceView === null) {
            this.lowerImageBot2 = this.surfaceView = new papaya.viewer.ScreenSurface(this.volume, this.surfaces, this, this.container.params);
            this.container.resizeViewerComponents(true);
        } else {
            currentSurface = surface;

            while (currentSurface !== null) {
                this.surfaceView.initBuffers(this.surfaceView.context, currentSurface);
                currentSurface = currentSurface.nextSurface;
            }
        }

        if (this.container.params.mainView && (this.container.params.mainView.toLowerCase() === "surface")) {
            this.mainImage = this.surfaceView;
            this.lowerImageTop = this.axialSlice;
            this.lowerImageBot = this.sagittalSlice;
            this.lowerImageBot2 = this.coronalSlice;
            this.viewsChanged();
        }

        this.container.toolbar.buildToolbar();
        this.container.toolbar.updateImageButtons();

        if (this.container.hasMoreToLoad()) {
            this.container.loadNext();
        } else {
            this.finishedLoading();
        }
    } else if (surface.error) {
        this.container.display.drawError(surface.error);
    }
};

papaya.viewer.Viewer.prototype.initializeCMPRView = function () {
    var dummyValue = 1;

    this.lowerImageBot2 = this.cmprSlice = new papaya.viewer.ScreenSlice(this.volume, papaya.viewer.ScreenSlice.DIRECTION_CURVED,
        1, 1, this.volume.getXSize(), this.volume.getYSize(),
        this.screenVolumes, this);
    this.cmprSlice.imageData = [];
    this.obliqueView = this.cmprSlice; // for compatibility 
    // this.cmprSlice.imageData[0] = this.axialSlice.imageData[0];
    // this.surfaces.push(dummyValue);
    this.container.resizeViewerComponents(true);
    this.viewsChanged();
};




papaya.viewer.Viewer.prototype.atlasLoaded = function () {
    this.finishedLoading();
};



papaya.viewer.Viewer.prototype.initializeViewer = function () {
    var message, viewer;

    viewer = this;
    
    if (this.volume.hasError()) {
        message = this.volume.error.message;
        this.resetViewer();
        this.container.clearParams();
        this.container.display.drawError(message);
    } else {
        this.screenVolumes[0] = new papaya.viewer.ScreenVolume(this.volume, this.container.params,
            papaya.viewer.ColorTable.DEFAULT_COLOR_TABLE.name, true, false, this.currentCoord);

        if (this.loadingDTI) {
            this.loadingDTI = false;

            this.screenVolumes[0].dti = true;

            if (this.screenVolumes[0].dti && (this.screenVolumes[0].volume.numTimepoints !== 3)) {
                this.screenVolumes[0].error = new Error("DTI vector series must have 3 series points!");
            }

            if (this.screenVolumes[0].dti) {
                this.screenVolumes[0].initDTI();
            }
        }

        if (this.screenVolumes[0].hasError()) {
            message = this.screenVolumes[0].error.message;
            this.resetViewer();
            this.container.clearParams();
            this.container.display.drawError(message);
            return;
        }

        this.setCurrentScreenVol(0);

        this.axialSlice = new papaya.viewer.ScreenSlice(this.volume, papaya.viewer.ScreenSlice.DIRECTION_AXIAL,
            this.volume.getXDim(), this.volume.getYDim(), this.volume.getXSize(), this.volume.getYSize(),
            this.screenVolumes, this);

        this.coronalSlice = new papaya.viewer.ScreenSlice(this.volume, papaya.viewer.ScreenSlice.DIRECTION_CORONAL,
            this.volume.getXDim(), this.volume.getZDim(), this.volume.getXSize(), this.volume.getZSize(),
            this.screenVolumes, this);

        this.sagittalSlice = new papaya.viewer.ScreenSlice(this.volume, papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL,
            this.volume.getYDim(), this.volume.getZDim(), this.volume.getYSize(), this.volume.getZSize(),
            this.screenVolumes, this);

        this.currentInteractingSlice = this.axialSlice;

        if ((this.container.params.mainView === undefined) ||
            (this.container.params.mainView.toLowerCase() === "axial")) {
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

        this.canvasAnnotation.addEventListener("mousemove", this.listenerMouseMove, false);
        this.canvasAnnotation.addEventListener("mousedown", this.listenerMouseDown, false);
        this.canvasAnnotation.addEventListener("mouseout", this.listenerMouseOut, false);
        this.canvasAnnotation.addEventListener("mouseleave", this.listenerMouseLeave, false);
        this.canvasAnnotation.addEventListener("mouseup", this.listenerMouseUp, false);
        document.addEventListener("keydown", this.listenerKeyDown, true);
        document.addEventListener("keyup", this.listenerKeyUp, true);
        this.canvasAnnotation.addEventListener("touchmove", this.listenerTouchMove, false);
        this.canvasAnnotation.addEventListener("touchstart", this.listenerTouchStart, false);
        this.canvasAnnotation.addEventListener("touchend", this.listenerTouchEnd, false);
        this.canvasAnnotation.addEventListener("dblclick", this.listenerMouseDoubleClick, false);
        document.addEventListener("contextmenu", this.listenerContextMenu, false);

        if (this.container.showControlBar) {
            // main slice
            $(this.container.sliderControlHtml.find("." + PAPAYA_CONTROL_MAIN_SLIDER).find("button")).eq(0).click(function () {
                if (viewer.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
                    viewer.incrementAxial(false);
                } else if (viewer.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
                    viewer.incrementCoronal(false);
                } else if (viewer.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
                    viewer.incrementSagittal(true);
                }
            });

            $(this.container.sliderControlHtml.find("." + PAPAYA_CONTROL_MAIN_SLIDER).find("button")).eq(1).click(function () {
                if (viewer.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
                    viewer.incrementAxial(true);
                } else if (viewer.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
                    viewer.incrementCoronal(true);
                } else if (viewer.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
                    viewer.incrementSagittal(false);
                }
            });

            // axial slice
            $(this.container.sliderControlHtml.find("." + PAPAYA_CONTROL_DIRECTION_SLIDER).eq(0).find("button").eq(0)).click(function () {
                viewer.incrementAxial(false);
            });

            $(this.container.sliderControlHtml.find("." + PAPAYA_CONTROL_DIRECTION_SLIDER).eq(0).find("button").eq(1)).click(function () {
                viewer.incrementAxial(true);
            });

            // coronal slice
            $(this.container.sliderControlHtml.find("." + PAPAYA_CONTROL_DIRECTION_SLIDER).eq(1).find("button").eq(0)).click(function () {
                viewer.incrementCoronal(false);
            });

            $(this.container.sliderControlHtml.find("." + PAPAYA_CONTROL_DIRECTION_SLIDER).eq(1).find("button").eq(1)).click(function () {
                viewer.incrementCoronal(true);
            });

            // sagittal slice
            $(this.container.sliderControlHtml.find("." + PAPAYA_CONTROL_DIRECTION_SLIDER).eq(2).find("button").eq(0)).click(function () {
                viewer.incrementSagittal(true);
            });

            $(this.container.sliderControlHtml.find("." + PAPAYA_CONTROL_DIRECTION_SLIDER).eq(2).find("button").eq(1)).click(function () {
                viewer.incrementSagittal(false);
            });

            // series
            $(this.container.sliderControlHtml.find("." + PAPAYA_CONTROL_DIRECTION_SLIDER).eq(3).find("button").eq(0)).click(function () {
                viewer.decrementSeriesPoint();
            });

            $(this.container.sliderControlHtml.find("." + PAPAYA_CONTROL_DIRECTION_SLIDER).eq(3).find("button").eq(1)).click(function () {
                viewer.incrementSeriesPoint();
            });

            // buttons
            $(this.container.sliderControlHtml.find("." + PAPAYA_CONTROL_SWAP_BUTTON_CSS)).click(function () {
                viewer.rotateViews();
            });

            $(this.container.sliderControlHtml.find("." + PAPAYA_CONTROL_GOTO_CENTER_BUTTON_CSS)).click(function () {
                var center = new papaya.core.Coordinate(Math.floor(viewer.volume.header.imageDimensions.xDim / 2),
                    Math.floor(viewer.volume.header.imageDimensions.yDim / 2),
                    Math.floor(viewer.volume.header.imageDimensions.zDim / 2));
                viewer.gotoCoordinate(center);
            });

            $(this.container.sliderControlHtml.find("." + PAPAYA_CONTROL_GOTO_ORIGIN_BUTTON_CSS)).click(function () {
                viewer.gotoCoordinate(viewer.volume.header.origin);
            });

            $("." + PAPAYA_CONTROL_INCREMENT_BUTTON_CSS).prop('disabled', false);
            $("." + PAPAYA_CONTROL_SWAP_BUTTON_CSS).prop('disabled', false);
            $("." + PAPAYA_CONTROL_GOTO_CENTER_BUTTON_CSS).prop('disabled', false);
            $("." + PAPAYA_CONTROL_GOTO_ORIGIN_BUTTON_CSS).prop('disabled', false);
        } else if (this.container.showControls) {
            $("#" + PAPAYA_CONTROL_MAIN_INCREMENT_BUTTON_CSS + this.container.containerIndex).css({display: "inline"});
            $("#" + PAPAYA_CONTROL_MAIN_DECREMENT_BUTTON_CSS + this.container.containerIndex).css({display: "inline"});
            $("#" + PAPAYA_CONTROL_MAIN_SWAP_BUTTON_CSS + this.container.containerIndex).css({display: "inline"});

            $(this.container.containerHtml.find("#" + PAPAYA_CONTROL_MAIN_SWAP_BUTTON_CSS + this.container.containerIndex)).click(function () {
                viewer.rotateViews();
            });

            $(this.container.containerHtml.find("#" + PAPAYA_CONTROL_MAIN_INCREMENT_BUTTON_CSS + this.container.containerIndex)).click(function () {
                if (viewer.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
                    viewer.incrementAxial(false);
                } else if (viewer.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
                    viewer.incrementCoronal(false);
                } else if (viewer.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
                    viewer.incrementSagittal(true);
                }
            });

            $(this.container.containerHtml.find("#" + PAPAYA_CONTROL_MAIN_DECREMENT_BUTTON_CSS + this.container.containerIndex)).click(function () {
                if (viewer.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
                    viewer.incrementAxial(true);
                } else if (viewer.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
                    viewer.incrementCoronal(true);
                } else if (viewer.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
                    viewer.incrementSagittal(false);
                }
            });

            $(this.container.containerHtml.find("#" + PAPAYA_CONTROL_MAIN_GOTO_CENTER_BUTTON_CSS + this.container.containerIndex)).click(function () {
                var center = new papaya.core.Coordinate(Math.floor(viewer.volume.header.imageDimensions.xDim / 2),
                    Math.floor(viewer.volume.header.imageDimensions.yDim / 2),
                    Math.floor(viewer.volume.header.imageDimensions.zDim / 2));
                viewer.gotoCoordinate(center);
            });

            $(this.container.containerHtml.find("#" + PAPAYA_CONTROL_MAIN_GOTO_ORIGIN_BUTTON_CSS + this.container.containerIndex)).click(function () {
                viewer.gotoCoordinate(viewer.volume.header.origin);
            });
        }

        this.hasSeries = (this.volume.header.imageDimensions.timepoints > 1);

        if (this.container.allowScroll) {
            this.addScroll();
        }

        this.setLongestDim(this.volume);
        this.calculateScreenSliceTransforms(this);
        this.currentCoord.setCoordinate(papayaFloorFast(this.volume.getXDim() / 2), papayaFloorFast(this.volume.getYDim() / 2),
            papayaFloorFast(this.volume.getZDim() / 2));

        this.updateOffsetRect();

        this.bgColor = $("body").css("background-color");

        if ((this.bgColor === "rgba(0, 0, 0, 0)") || ((this.bgColor === "transparent"))) {
            this.bgColor = "rgba(255, 255, 255, 255)";
        }

        this.context.fillStyle = this.bgColor;
        this.context.fillRect(0, 0, this.canvas.offsetWidth, this.canvas.offsetHeight);

        if (this.volume.isWorldSpaceOnly()) {
            if (this.ignoreNiftiTransforms) {
                this.volume.header.orientationCertainty = papaya.volume.Header.ORIENTATION_CERTAINTY_UNKNOWN;
            } else {
                this.worldSpace = true;
            }
        }

        if (papaya.Container.atlas) {
            this.atlas = papaya.Container.atlas;
        }

        this.initialized = true;
        this.container.resizeViewerComponents(true);
        this.drawViewer();

        this.container.toolbar.buildToolbar();
        this.container.toolbar.updateImageButtons();
        this.updateWindowTitle();

        this.container.loadingImageIndex = 1;
        if (this.container.hasMoreToLoad()) {
            this.container.loadNext();
        } else {
            this.finishedLoading();
        }

        // add throttle handler
        this.eventHandler = window.setInterval(function() {
            // console.log('eventHandler');
            viewer.mouseMoveHandler = true;
        }, this.throttleAmount);
    }
};



papaya.viewer.Viewer.prototype.finishedLoading = function () {
    if (!this.pageLoaded) {
        this.goToInitialCoordinate();
        this.updateSliceSliderControl();
        this.pageLoaded = true;
    }

    if (this.container.loadingComplete) {
        this.container.loadingComplete();
        this.container.loadingComplete = null;
    }

    this.container.toolbar.buildToolbar();
    this.container.toolbar.updateImageButtons();
    this.updateWindowTitle();
};



papaya.viewer.Viewer.prototype.addScroll = function () {
    // if (!this.container.nestedViewer) {
        window.addEventListener(papaya.utilities.PlatformUtils.getSupportedScrollEvent(), this.listenerScroll, false);
    // }
};



papaya.viewer.Viewer.prototype.removeScroll = function () {
    window.removeEventListener(papaya.utilities.PlatformUtils.getSupportedScrollEvent(), this.listenerScroll, false);
};



papaya.viewer.Viewer.prototype.updateOffsetRect = function () {
    this.canvasRect = papaya.viewer.Viewer.getOffsetRect(this.canvas);
};



papaya.viewer.Viewer.prototype.initializeOverlay = function () {
    var screenParams, parametric, ctr, overlay, overlayNeg, dti, screenVolV1;

    if (this.loadingVolume.hasError()) {
        this.container.display.drawError(this.loadingVolume.error.message);
        this.container.clearParams();
        this.loadingVolume = null;
    } else {
        screenParams = this.container.params[this.loadingVolume.fileName];
        parametric = (screenParams && screenParams.parametric);
        dti = (screenParams && screenParams.dtiMod);

        if (this.loadingDTIModRef) {
            this.loadingDTIModRef.dtiVolumeMod = this.loadingVolume;
            this.loadingDTIModRef = null;
        } else if (dti) {
            screenVolV1 = this.getScreenVolumeByName(screenParams.dtiRef);

            if (screenVolV1) {
                screenVolV1.dtiVolumeMod = this.loadingVolume;

                if (screenParams.dtiModAlphaFactor !== undefined) {
                    screenVolV1.dtiAlphaFactor = screenParams.dtiModAlphaFactor;
                } else {
                    screenVolV1.dtiAlphaFactor = 1.0;
                }
            }
        } else {
            overlay = new papaya.viewer.ScreenVolume(this.loadingVolume,
                this.container.params, (parametric ? papaya.viewer.ColorTable.PARAMETRIC_COLOR_TABLES[0].name :
                    this.getNextColorTable()), false, false, this.currentCoord);

            if (this.loadingDTI) {
                this.loadingDTI = false;

                overlay.dti = true;

                if (overlay.dti && (overlay.volume.numTimepoints !== 3)) {
                    overlay.error = new Error("DTI vector series must have 3 series points!");
                }

                if (overlay.dti) {
                    overlay.initDTI();
                }
            }

            if (overlay.hasError()) {
                this.container.display.drawError(overlay.error.message);
                this.container.clearParams();
                this.loadingVolume = null;
                return;
            }

            this.screenVolumes[this.screenVolumes.length] = overlay;
            this.setCurrentScreenVol(this.screenVolumes.length - 1);

            // even if "parametric" is set to true we should not add another screenVolume if the value range does not cross
            // zero
            if (parametric) {
                this.screenVolumes[this.screenVolumes.length - 1].findImageRange();
                if (this.screenVolumes[this.screenVolumes.length - 1].volume.header.imageRange.imageMin < 0) {
                    this.screenVolumes[this.screenVolumes.length] = overlayNeg = new papaya.viewer.ScreenVolume(this.loadingVolume,
                        this.container.params, papaya.viewer.ColorTable.PARAMETRIC_COLOR_TABLES[1].name, false, true, this.currentCoord);
                    overlay.negativeScreenVol = overlayNeg;

                    this.setCurrentScreenVol(this.screenVolumes.length - 1);
                }
            }
        }

        this.container.toolbar.buildToolbar();
        this.container.toolbar.updateImageButtons();
        this.drawViewer(true);

        this.hasSeries = false;
        for (ctr = 0; ctr < this.screenVolumes.length; ctr += 1) {
            if (this.screenVolumes[ctr].volume.header.imageDimensions.timepoints > 1) {
                this.hasSeries = true;
                break;
            }
        }

        this.container.resizeViewerComponents();

        this.updateWindowTitle();
        this.loadingVolume = null;

        if (screenParams && screenParams.loadingComplete) {
            screenParams.loadingComplete();
        }

        if (this.container.hasMoreToLoad()) {
            this.container.loadNext();
        } else {
            this.finishedLoading();
        }
    }
};



papaya.viewer.Viewer.prototype.closeOverlayByRef = function (screenVol) {
    this.closeOverlay(this.getScreenVolumeIndex(screenVol));
};



papaya.viewer.Viewer.prototype.closeOverlay = function (index) {
    var ctr;

    for (ctr = 0; ctr < this.screenVolumes.length; ctr += 1) {
        if (this.screenVolumes[ctr].negativeScreenVol === this.screenVolumes[index]) {
            this.screenVolumes[ctr].negativeScreenVol = null;
        }
    }

    this.screenVolumes.splice(index, 1);
    this.setCurrentScreenVol(this.screenVolumes.length - 1);
    this.drawViewer(true);
    this.container.toolbar.buildToolbar();
    this.container.toolbar.updateImageButtons();
    this.updateWindowTitle();

    this.hasSeries = false;
    for (ctr = 0; ctr < this.screenVolumes.length; ctr += 1) {
        if (this.screenVolumes[ctr].volume.header.imageDimensions.timepoints > 1) {
            this.hasSeries = true;
            break;
        }
    }
    this.container.resizeViewerComponents();
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
    var viewer = this;

    if (this.atlas === null) {
        this.atlas = new papaya.viewer.Atlas(papaya.data.Atlas, this.container, papaya.utilities.ObjectUtils.bind(viewer,
            viewer.atlasLoaded));
    }
};



papaya.viewer.Viewer.prototype.isInsideMainSlice = function (xLoc, yLoc) {
    // this.updateOffsetRect();
    // xLoc = xLoc - this.canvasRect.left;
    // yLoc = yLoc - this.canvasRect.top;
    var loc = this.convertMouseCoordToCanvas(xLoc, yLoc);
    xLoc = loc.x;
    yLoc = loc.y;

    if (this.mainImage === this.axialSlice) {
        return this.insideScreenSlice(this.axialSlice, xLoc, yLoc, this.volume.getXDim(), this.volume.getYDim());
    } else if (this.mainImage === this.coronalSlice) {
        return this.insideScreenSlice(this.coronalSlice, xLoc, yLoc, this.volume.getXDim(), this.volume.getZDim());
    } else if (this.mainImage === this.sagittalSlice) {
        return this.insideScreenSlice(this.sagittalSlice, xLoc, yLoc, this.volume.getYDim(), this.volume.getZDim());
    }

    return false;
};



papaya.viewer.Viewer.prototype.updatePosition = function (viewer, xLoc, yLoc, crosshairsOnly, updateCenterCoord) {
    var xImageLoc, yImageLoc, zImageLoc, temp, originalX, originalY, surfaceCoord;
    var rotatedAngle, imageCoord;
    // var sliceLabel = null;
    // viewer.updateOffsetRect();
    originalX = xLoc;
    originalY = yLoc;
    // xLoc = xLoc - this.canvasRect.left;
    // yLoc = yLoc - this.canvasRect.top;

    if (this.insideScreenSlice(viewer.axialSlice, xLoc, yLoc, viewer.volume.getXDim(), viewer.volume.getYDim())) {
        if (this.isDragging || (this.draggingSliceDir === papaya.viewer.ScreenSlice.DIRECTION_AXIAL)) {
            // var center = this.getSliceCenterPosition(this.axialSlice, false);
            var center = this.axialSlice.getCenter(this.volume, false);

            // var center = this.this.axialSlice.localizerCenter;
            // console.log(this.axialSlice.finalTransform);
            rotatedAngle = viewer.volume.transform.localizerAngleAxial * Math.PI / 180;
            var inverseRotatedCoordinate = this.getCoordinateFromRotatedSlice(rotatedAngle, xLoc, yLoc, center.x, center.y, true);
            imageCoord = this.convertScreenToImageCoordinate(inverseRotatedCoordinate[0], inverseRotatedCoordinate[1], viewer.axialSlice);
            // xImageLoc = this.convertScreenToImageCoordinateX(xLoc, viewer.axialSlice);
            // yImageLoc = this.convertScreenToImageCoordinateY(yLoc, viewer.axialSlice);
            // var absCenter = this.getSliceCenterPosition(this.axialSlice, true);
            // var rotatedCoordinate = this.getCoordinateFromRotatedSlice(-rotatedAngle, xLoc, yLoc, absCenter.x, absCenter.y, true);
            // this.centerCoordInverse = this.convertScreenToImageCoordinate(rotatedCoordinate[0], rotatedCoordinate[1], viewer.axialSlice);
            // this.centerCoordInverse = imageCoord;
            // console.table([imageCoord.x, imageCoord.y, imageCoord.z]);
            xImageLoc = imageCoord.x;
            yImageLoc = imageCoord.y;
            zImageLoc = imageCoord.z;
            // xImageLoc = inverseRotatedCoordinate[0];
            // yImageLoc = inverseRotatedCoordinate[1];
            // zImageLoc = imageCoord.z;
            this.currentInteractingSlice = viewer.axialSlice;
            // if (updateCenterCoord) this.screenVolumes[0].updateCenterCoord(imageCoord);

            if ((xImageLoc !== viewer.currentCoord.x) || (yImageLoc !== viewer.currentCoord.y)) {
                // console.log('currentCoord updated');
                viewer.currentCoord.x = xImageLoc;
                viewer.currentCoord.y = yImageLoc;
                viewer.currentCoord.z = zImageLoc;
                this.draggingSliceDir = papaya.viewer.ScreenSlice.DIRECTION_AXIAL;
            }
        }
    } else if (this.insideScreenSlice(viewer.coronalSlice, xLoc, yLoc, viewer.volume.getXDim(),
            viewer.volume.getZDim())) {
        if (this.isDragging || (this.draggingSliceDir === papaya.viewer.ScreenSlice.DIRECTION_CORONAL)) {
            // xImageLoc = this.convertScreenToImageCoordinateX(xLoc, viewer.coronalSlice);
            // yImageLoc = this.convertScreenToImageCoordinateY(yLoc, viewer.coronalSlice);
            var center = this.coronalSlice.getCenter(this.volume, false);
            rotatedAngle = viewer.volume.transform.localizerAngleCoronal * Math.PI / 180;
            var inverseRotatedCoordinate = this.getCoordinateFromRotatedSlice(-rotatedAngle, xLoc, yLoc, center.x, center.y, true);
            imageCoord = this.convertScreenToImageCoordinate(inverseRotatedCoordinate[0], inverseRotatedCoordinate[1], viewer.coronalSlice);
            xImageLoc = imageCoord.x;
            yImageLoc = imageCoord.y;
            zImageLoc = imageCoord.z;

            this.currentInteractingSlice = viewer.coronalSlice;
            if ((xImageLoc !== viewer.currentCoord.x) || (zImageLoc !== viewer.currentCoord.z)) {
                // viewer.currentCoord.x = xImageLoc;
                // viewer.currentCoord.z = yImageLoc;

                viewer.currentCoord.x = xImageLoc;
                viewer.currentCoord.y = yImageLoc;
                viewer.currentCoord.z = zImageLoc;

                this.draggingSliceDir = papaya.viewer.ScreenSlice.DIRECTION_CORONAL;
            }
        }
    } else if (this.insideScreenSlice(viewer.sagittalSlice, xLoc, yLoc, viewer.volume.getYDim(),
            viewer.volume.getZDim())) {
        if (this.isDragging || (this.draggingSliceDir === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL)) {
            // xImageLoc = this.convertScreenToImageCoordinateX(xLoc, viewer.sagittalSlice);
            // yImageLoc = this.convertScreenToImageCoordinateY(yLoc, viewer.sagittalSlice);
            var center = this.sagittalSlice.getCenter(this.volume, false);
            rotatedAngle = viewer.volume.transform.localizerAngleSagittal * Math.PI / 180;
            var inverseRotatedCoordinate = this.getCoordinateFromRotatedSlice(-rotatedAngle, xLoc, yLoc, center.x, center.y, true);
            imageCoord = this.convertScreenToImageCoordinate(inverseRotatedCoordinate[0], inverseRotatedCoordinate[1], viewer.sagittalSlice);
            // console.log('updatePosition imageCoord', imageCoord);
            xImageLoc = imageCoord.x;
            yImageLoc = imageCoord.y;
            zImageLoc = imageCoord.z;

            this.currentInteractingSlice = viewer.sagittalSlice;
            if ((zImageLoc !== viewer.currentCoord.z) || (yImageLoc !== viewer.currentCoord.y)) {
                // viewer.currentCoord.y = xImageLoc;
                // viewer.currentCoord.z = yImageLoc;
                viewer.currentCoord.x = xImageLoc;
                viewer.currentCoord.y = yImageLoc;
                viewer.currentCoord.z = zImageLoc;
                
                this.draggingSliceDir = papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL;
            }
        }
    } else if (viewer.surfaceView && this.insideScreenSlice(viewer.surfaceView, xLoc, yLoc, viewer.surfaceView.screenDim,
            viewer.surfaceView.screenDim)) {
        viewer.surfaceView.updateDynamic(originalX, originalY, (this.selectedSlice === this.mainImage) ? 1 : 3);
    }


    viewer.screenVolumes[0].updatePosition(this.currentInteractingSlice.sliceDirection, this.currentCoord);
    // this.container.coordinateChanged(this);
    // viewer.drawViewer(false, false, false, this.currentInteractingSlice);
};



papaya.viewer.Viewer.prototype.convertScreenToImageCoordinateX = function (xLoc, screenSlice, debug) {
    if (debug) console.log('convertScreenToImageCoordinateX ', screenSlice.finalTransform[0][2], screenSlice.finalTransform[0][0]);
    return papaya.viewer.Viewer.validDimBounds(Math.floor((xLoc - screenSlice.finalTransform[0][2]) / screenSlice.finalTransform[0][0]),
        screenSlice.xDim + 10000);
};



papaya.viewer.Viewer.prototype.convertScreenToImageCoordinateY = function (yLoc, screenSlice) {
    return papaya.viewer.Viewer.validDimBounds(Math.floor((yLoc - screenSlice.finalTransform[1][2]) / screenSlice.finalTransform[1][1]),
        screenSlice.yDim + 10000);
};



papaya.viewer.Viewer.prototype.convertScreenToImageCoordinate = function (xLoc, yLoc, screenSlice, debug) {
    var xImageLoc, yImageLoc, zImageLoc;

    if (screenSlice === undefined) {
        screenSlice = this.mainImage;
    }
    if (debug) console.log('convertScreenToImageCoordinate ', xLoc, yLoc);
    if (screenSlice.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
        xImageLoc = this.convertScreenToImageCoordinateX(xLoc, screenSlice, debug);
        yImageLoc = this.convertScreenToImageCoordinateY(yLoc, screenSlice, debug);
        zImageLoc = this.axialSlice.currentSlice;
    } else if (screenSlice.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
        xImageLoc = this.convertScreenToImageCoordinateX(xLoc, screenSlice);
        zImageLoc = this.convertScreenToImageCoordinateY(yLoc, screenSlice);
        yImageLoc = this.coronalSlice.currentSlice;
    } else if (screenSlice.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
        yImageLoc = this.convertScreenToImageCoordinateX(xLoc, screenSlice);
        zImageLoc = this.convertScreenToImageCoordinateY(yLoc, screenSlice);
        xImageLoc = this.sagittalSlice.currentSlice;
    }

    return new papaya.core.Coordinate(xImageLoc, yImageLoc, zImageLoc);
};



papaya.viewer.Viewer.prototype.convertCurrentCoordinateToScreen = function (screenSlice) {
    return this.convertCoordinateToScreen(this.currentCoord, screenSlice);
};



papaya.viewer.Viewer.prototype.intersectsMainSlice = function (coord) {
    var sliceDirection = this.mainImage.sliceDirection;

    if (sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
        return (coord.z === this.mainImage.currentSlice);
    } else if (sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
        return (coord.y === this.mainImage.currentSlice);
    } else if (sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
        return (coord.x === this.mainImage.currentSlice);
    }

    return false;
};



papaya.viewer.Viewer.prototype.convertCoordinateToScreen = function (coor, screenSlice) {
    var x, y, sliceDirection;

    if (screenSlice === undefined) {
        screenSlice = this.mainImage;
    }

    sliceDirection = screenSlice.sliceDirection;

    if (sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
        x = papayaFloorFast(screenSlice.finalTransform[0][2] + (coor.x + 0.5) * screenSlice.finalTransform[0][0]);
        y = papayaFloorFast(screenSlice.finalTransform[1][2] + (coor.y + 0.5) * screenSlice.finalTransform[1][1]);
    } else if (sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
        x = papayaFloorFast(screenSlice.finalTransform[0][2] + (coor.x + 0.5) * screenSlice.finalTransform[0][0]);
        y = papayaFloorFast(screenSlice.finalTransform[1][2] + (coor.z + 0.5) * screenSlice.finalTransform[1][1]);
    } else if (sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
        x = papayaFloorFast(screenSlice.finalTransform[0][2] + (coor.y + 0.5) * screenSlice.finalTransform[0][0]);
        y = papayaFloorFast(screenSlice.finalTransform[1][2] + (coor.z + 0.5) * screenSlice.finalTransform[1][1]);
    }

    return new papaya.core.Point(x, y);
};



papaya.viewer.Viewer.prototype.updateCursorPosition = function (viewer, xLoc, yLoc) {
    var xImageLoc, yImageLoc, zImageLoc, surfaceCoord = null, found;
    var center;
    if (this.container.display) {
        xLoc = xLoc - this.canvasRect.left;
        yLoc = yLoc - this.canvasRect.top;

        if (this.insideScreenSlice(viewer.axialSlice, xLoc, yLoc, viewer.volume.getXDim(), viewer.volume.getYDim())) {
            xImageLoc = this.convertScreenToImageCoordinateX(xLoc, viewer.axialSlice);
            yImageLoc = this.convertScreenToImageCoordinateY(yLoc, viewer.axialSlice);

            // center = {
            //     x: this.convertScreenToImageCoordinateX(viewer.axialSlice.localizerCenter.x, viewer.axialSlice),
            //     y: this.convertScreenToImageCoordinateY(viewer.axialSlice.localizerCenter.y, viewer.axialSlice)
            // };

            // var tempX = xImageLoc - center.x;
            // var tempY = yImageLoc - center.y;
            // var theta = this.volume.transform.localizerAngleSagittal * Math.PI / 180;
            // var rotatedX = tempX * Math.cos(theta) - tempY * Math.sin(theta);
            // var rotatedY = tempX * Math.sin(theta) + tempY * Math.cos(theta);
            // console.log('rotated', theta, rotatedX, rotatedY);
            // xImageLoc = rotatedX + center.x;
            // yImageLoc = rotatedY + center.y;

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
        } else if (this.insideScreenSlice(viewer.surfaceView, xLoc, yLoc)) {
            xLoc -= viewer.surfaceView.screenOffsetX;
            yLoc -= viewer.surfaceView.screenOffsetY;

            surfaceCoord = this.surfaceView.pick(xLoc, yLoc);

            if (surfaceCoord) {
                this.getIndexCoordinateAtWorld(surfaceCoord.coordinate[0], surfaceCoord.coordinate[1], surfaceCoord.coordinate[2], this.tempCoor);
                xImageLoc = this.tempCoor.x;
                yImageLoc = this.tempCoor.y;
                zImageLoc = this.tempCoor.z;
                found = true;
            }
        }

        if (found) {
            this.cursorPosition.x = xImageLoc;
            this.cursorPosition.y = yImageLoc;
            this.cursorPosition.z = zImageLoc;
            // this.container.display.drawDisplay(xImageLoc, yImageLoc, zImageLoc);
            this.drawAnnotation();
        } else {
            this.container.display.drawEmptyDisplay();
        }
    }
};



papaya.viewer.Viewer.prototype.insideScreenSlice = function (screenSlice, xLoc, yLoc, xBound, yBound) {
    var xStart, xEnd, yStart, yEnd;

    if (!screenSlice) {
        return false;
    }

    if (screenSlice === this.surfaceView) {
        xStart = screenSlice.screenOffsetX;
        xEnd = screenSlice.screenOffsetX + screenSlice.screenDim;
        yStart = screenSlice.screenOffsetY;
        yEnd = screenSlice.screenOffsetY + screenSlice.screenDim;
    } else {
        xStart = papayaRoundFast(screenSlice.screenTransform[0][2]);
        xEnd = papayaRoundFast(screenSlice.screenTransform[0][2] + xBound * screenSlice.screenTransform[0][0]);
        yStart = papayaRoundFast(screenSlice.screenTransform[1][2]);
        yEnd = papayaRoundFast(screenSlice.screenTransform[1][2] + yBound * screenSlice.screenTransform[1][1]);
        // console.table([xStart, xEnd, yStart, yEnd, xLoc, yLoc]);
    }

    return ((xLoc >= xStart) && (xLoc < xEnd) && (yLoc >= yStart) && (yLoc < yEnd));
};



papaya.viewer.Viewer.prototype.drawEmptyViewer = function () {
    var locY, fontSize, text, metrics, textWidth;

    // clear area
    this.context.fillStyle = "#000000";
    // this.context.fillStyle = "#FFFFFF";
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Modification 26/11/2019: disable drop && corner texts

    // draw drop text
    // this.context.fillStyle = "#AAAAAA";

    // if (this.container.readyForDnD()) {
    //     fontSize = 18;
    //     this.context.font = fontSize + "px sans-serif";
    //     locY = this.canvas.height - 22;
    //     text = "Drop here or click the File menu";
    //     metrics = this.context.measureText(text);
    //     textWidth = metrics.width;
    //     this.context.fillText(text, (this.canvas.width / 2) - (textWidth / 2), locY);
    // }

    
    // if (this.canvas.width > 900) {
    //     // draw supported formats
    //     fontSize = 14;
    //     this.context.font = fontSize + "px sans-serif";
    //     locY = this.canvas.height - 20;
    //     text = "Supported formats: NIFTI" + (papaya.Container.DICOM_SUPPORT ? ", DICOM" : "");
    //     this.context.fillText(text, 20, locY);

    //     // draw Papaya version info
    //     fontSize = 14;
    //     this.context.font = fontSize + "px sans-serif";
    //     locY = this.canvas.height - 20;

    //     text = "Papaya (Build " + PAPAYA_BUILD_NUM + ")";
    //     metrics = this.context.measureText(text);
    //     textWidth = metrics.width;
    //     this.context.fillText(text, this.canvas.width - textWidth - 20, locY);
    // }
};



papaya.viewer.Viewer.prototype.drawViewer = function (force, skipUpdate) {
    // console.log('drawViewer is called by ', papaya.viewer.Viewer.prototype.drawViewer.caller);
    // console.time('drawViewer');
    var radiological = (this.container.preferences.radiological === "Yes"),
        showOrientation = (this.container.preferences.showOrientation === "Yes");
    var currentSliceDir = (this.currentInteractingSlice) ? this.currentInteractingSlice.sliceDirection : -1;
    if (!this.initialized) {
        this.drawEmptyViewer();
        return;
    }
    // Modified: 12/12/2019
    // console.log('drawViewer imageReplacedExternally', this.reactViewerConnector.imageReplacedExternally);
    if (this.reactViewerConnector.imageReplacedExternally) {
        skipUpdate = true;
    }
    // if (this.reactPapayaViewport.props.viewportSpecificData.intensityActive) {
    //     if (!this.reactPapayaViewport.state.updateMIP) this.reactPapayaViewport.setState({ updateMIP: true });
    //     else this.reactPapayaViewport.setState({ updateMIP: false });
    // }
    // else this.reactPapayaViewport.setState({ updateMIP: false });
    // console.log('Current Coord:', this.currentCoord.x, this.currentCoord.y, this.currentCoord.z);
    //////////
    this.context.save();

    if (skipUpdate) {
        this.axialSlice.repaint(this.currentCoord.z, force, this.worldSpace);
        this.coronalSlice.repaint(this.currentCoord.y, force, this.worldSpace);
        this.sagittalSlice.repaint(this.currentCoord.x, force, this.worldSpace);
    } else {
        if (force || (currentSliceDir === papaya.viewer.ScreenSlice.DIRECTION_AXIAL)) {
            this.axialSlice.updateSlice(this.currentCoord.z, force);
        }

        if (force || (currentSliceDir === papaya.viewer.ScreenSlice.DIRECTION_CORONAL)) {
            this.coronalSlice.updateSlice(this.currentCoord.y, force);
        }

        if (force || (currentSliceDir === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL)) {
            this.sagittalSlice.updateSlice(this.currentCoord.x, force);
        }
    }

    if (this.hasSurface() && (!papaya.utilities.PlatformUtils.smallScreen || force || (this.selectedSlice === this.surfaceView))) {
        this.surfaceView.draw();
    }

    if (this.hasOblique()) {
        this.cmprSlice.repaint();
    }

    // intialize screen slices
    if (this.container.preferences.smoothDisplay === "No") {
        this.context.imageSmoothingEnabled = false;
        this.context.mozImageSmoothingEnabled = false;
        this.context.msImageSmoothingEnabled = false;
    } else {
        this.context.imageSmoothingEnabled = true;
        this.context.mozImageSmoothingEnabled = true;
        this.context.msImageSmoothingEnabled = true;
    }

    // draw screen slices
    this.drawScreenSlice(this.mainImage);


    if (this.container.orthogonal) {
        this.drawScreenSlice(this.lowerImageTop);
        this.drawScreenSlice(this.lowerImageBot);

        if (this.hasSurface() || this.hasOblique()) {
            this.drawScreenSlice(this.lowerImageBot2);
        }
    }

    if (showOrientation || radiological) {
        this.drawOrientation();
    }
    // Modification 20/01/2020: add draw annotation method
    this.drawAnnotation();


    // duplicate drawCurve in drawAnnotation to keep curve on screen when dragging
    if (this.screenCurve.hasPoint()) this.screenCurve.drawCurve(this.contextAnnotation, this.canvasAnnotation, this.screenCurve.slice.finalTransform);

    // if (this.container.preferences.showRuler === "Yes") {
    //     this.drawRuler(); //draw Ruler is now merged in drawAnnotation
    // }

    // if (this.container.display) {
    //     this.container.display.drawDisplay(this.currentCoord.x, this.currentCoord.y, this.currentCoord.z);
    // }

    if (this.container.contextManager && this.container.contextManager.drawToViewer) {
        this.container.contextManager.drawToViewer(this.context);
    }
    this.reactViewerConnector.PapayaViewport.setState({ onMainImageChanged: false });
    this.reactViewerConnector.imageReplacedExternally = false;
    // console.timeEnd('drawViewer');
};

papaya.viewer.Viewer.prototype.drawOverlay = function () {
    // since drawViewer function is not very flexible, I splitted the function into images and annotations/ruler/curves
    // keep the drawViewer function for compability
    // call this after using drawScreenSlice separately and dont use with the old drawViewer
    var radiological = (this.container.preferences.radiological === "Yes"),
    showOrientation = (this.container.preferences.showOrientation === "Yes");
    if (showOrientation || radiological) {
        this.drawOrientation();
    }
    this.drawAnnotation();
    if (this.screenCurve.hasPoint()) this.screenCurve.drawCurve(this.contextAnnotation, this.canvasAnnotation, this.screenCurve.slice.finalTransform);
    this.reactViewerConnector.PapayaViewport.setState({ onMainImageChanged: false });
    this.reactViewerConnector.imageReplacedExternally = false;
};

papaya.viewer.Viewer.prototype.hasSurface = function () {
    return (this.container.hasSurface() && this.surfaceView && this.surfaceView.initialized);
};

papaya.viewer.Viewer.prototype.hasOblique = function () {
    return (this.container.hasOblique() && this.obliqueView);
};



papaya.viewer.Viewer.prototype.drawScreenSlice = function (slice) {
    var textWidth, textWidthExample, offset, padding = 5;
    // console.log('papaya drawScreenSlice', slice);

    if (slice === this.surfaceView) {
        this.context.fillStyle = this.surfaceView.getBackgroundColor();
        this.context.fillRect(slice.screenOffsetX, slice.screenOffsetY, slice.screenDim, slice.screenDim);
        this.context.drawImage(slice.canvas, slice.screenOffsetX, slice.screenOffsetY);

        if (this.container.preferences.showRuler === "Yes") {
            if (this.surfaceView === this.mainImage) {
                this.context.font = papaya.viewer.Viewer.ORIENTATION_MARKER_SIZE + "px sans-serif";
                textWidth = this.context.measureText("Ruler Length: ").width;
                textWidthExample = this.context.measureText("Ruler Length: 000.00").width;
                offset = (textWidthExample / 2);

                this.context.fillStyle = "#ffb3db";
                this.context.fillText("Ruler Length:  ", slice.screenDim / 2 - (offset / 2), papaya.viewer.Viewer.ORIENTATION_MARKER_SIZE + padding);
                this.context.fillStyle = "#FFFFFF";
                this.context.fillText(this.surfaceView.getRulerLength().toFixed(2), (slice.screenDim / 2) + textWidth - (offset / 2), papaya.viewer.Viewer.ORIENTATION_MARKER_SIZE + padding);
            }
        }
    } else {
        this.context.fillStyle = papaya.viewer.Viewer.BACKGROUND_COLOR;
        this.context.setTransform(1, 0, 0, 1, 0, 0);
        // this.context.fillRect(slice.screenOffsetX, slice.screenOffsetY, slice.screenDim, slice.screenDim);
        // console.log('papaya drawScreenSlice with', slice.screenOffsetX, slice.screenOffsetY, slice.screenWidth, slice.screenHeight)
        this.context.fillRect(slice.screenOffsetX, slice.screenOffsetY, slice.screenWidth, slice.screenHeight);
        this.context.save();
        this.context.beginPath();
        // this.context.rect(slice.screenOffsetX, slice.screenOffsetY, slice.screenDim, slice.screenDim);
        this.context.rect(slice.screenOffsetX, slice.screenOffsetY, slice.screenWidth, slice.screenHeight);
        this.context.clip();
        this.context.setTransform(slice.finalTransform[0][0], 0, 0, slice.finalTransform[1][1], slice.finalTransform[0][2], slice.finalTransform[1][2]);
        this.context.drawImage(slice.canvasMain, 0, 0);
        this.context.restore();

        if (slice.canvasDTILines) {
            this.context.drawImage(slice.canvasDTILines, slice.screenOffsetX, slice.screenOffsetY);
        }
    }
};



papaya.viewer.Viewer.prototype.drawOrientation = function () {
    var metrics, textWidth, radiological, top, bottom, left, right, orientStartX, orientEndX, orientMidX,
        orientStartY, orientEndY, orientMidY,
        showOrientation = (this.container.preferences.showOrientation === "Yes");

    if (this.mainImage === this.surfaceView || this.mainImage === this.obliqueView) {
        return;
    }

    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.fillStyle = this.getOrientationCertaintyColor();
    this.context.font = papaya.viewer.Viewer.ORIENTATION_MARKER_SIZE + "px sans-serif";
    metrics = this.context.measureText("X");
    textWidth = metrics.width;
    radiological = (this.container.preferences.radiological === "Yes");

    if (this.mainImage === this.axialSlice) {
        top = papaya.viewer.Viewer.ORIENTATION_MARKER_ANTERIOR;
        bottom = papaya.viewer.Viewer.ORIENTATION_MARKER_POSTERIOR;

        if (radiological) {
            left = papaya.viewer.Viewer.ORIENTATION_MARKER_RIGHT;
            right = papaya.viewer.Viewer.ORIENTATION_MARKER_LEFT;
        } else {
            left = papaya.viewer.Viewer.ORIENTATION_MARKER_LEFT;
            right = papaya.viewer.Viewer.ORIENTATION_MARKER_RIGHT;
        }
    } else if (this.mainImage === this.coronalSlice) {
        top = papaya.viewer.Viewer.ORIENTATION_MARKER_SUPERIOR;
        bottom = papaya.viewer.Viewer.ORIENTATION_MARKER_INFERIOR;

        if (radiological) {
            left = papaya.viewer.Viewer.ORIENTATION_MARKER_RIGHT;
            right = papaya.viewer.Viewer.ORIENTATION_MARKER_LEFT;
        } else {
            left = papaya.viewer.Viewer.ORIENTATION_MARKER_LEFT;
            right = papaya.viewer.Viewer.ORIENTATION_MARKER_RIGHT;
        }
    } else if (this.mainImage === this.sagittalSlice) {
        top = papaya.viewer.Viewer.ORIENTATION_MARKER_SUPERIOR;
        bottom = papaya.viewer.Viewer.ORIENTATION_MARKER_INFERIOR;
        left = papaya.viewer.Viewer.ORIENTATION_MARKER_ANTERIOR;
        right = papaya.viewer.Viewer.ORIENTATION_MARKER_POSTERIOR;
    }

    orientStartX = this.mainImage.screenOffsetX;
    // orientEndX = this.mainImage.screenOffsetX + this.mainImage.screenDim; // original
    // Modified 02/12/2019: change screenDim to screenWidth to accomodate non-square viewport
    orientEndX = this.mainImage.screenOffsetX + this.mainImage.screenWidth;
    orientMidX = Math.round(orientEndX / 2.0);

    orientStartY = this.mainImage.screenOffsetY;
    // orientEndY = this.mainImage.screenOffsetY + this.mainImage.screenDim; // original
    // Modified 02/12/2019: change screenDim to screenHeight to accomodate non-square viewport
    orientEndY = this.mainImage.screenOffsetY + this.mainImage.screenHeight;
    orientMidY = Math.round(orientEndY / 2.0);

    if (showOrientation || this.mainImage.isRadiologicalSensitive()) {
        this.context.fillText(left, orientStartX + papaya.viewer.Viewer.ORIENTATION_MARKER_SIZE, orientMidY +
            (papaya.viewer.Viewer.ORIENTATION_MARKER_SIZE * 0.5));
        this.context.fillText(right, orientEndX - 1.5 * papaya.viewer.Viewer.ORIENTATION_MARKER_SIZE, orientMidY +
            (papaya.viewer.Viewer.ORIENTATION_MARKER_SIZE * 0.5));
    }

    if (showOrientation) {
        this.context.fillText(top, orientMidX - (textWidth / 2), orientStartY +
            papaya.viewer.Viewer.ORIENTATION_MARKER_SIZE * 1.5);
        this.context.fillText(bottom, orientMidX - (textWidth / 2), orientEndY -
            papaya.viewer.Viewer.ORIENTATION_MARKER_SIZE);
    }
};
// Modification 20/01/2020: add draw annotation function
papaya.viewer.Viewer.prototype.drawAnnotation = function () {
    var metrics, textWidth, radiological, coordinate, orientStartX, orientEndX, orientMidX,
        orientStartY, orientEndY, orientMidY,
        showOrientation = (this.container.preferences.showOrientation === "Yes");
    var text;
    if (this.mainImage === this.surfaceView) {
        return;
    }
    if (this.container.preferences.showCrosshairs === "Yes") {
        this.drawCrosshairs();
    }
    // this.drawCrosshairs();
    if (this.screenCurve.hasPoint()) this.screenCurve.drawCurve(this.contextAnnotation, this.canvasAnnotation, this.screenCurve.slice.finalTransform)

    // this.contextAnnotation.setTransform(1, 0, 0, 1, 0, 0);
    this.contextAnnotation.font = papaya.viewer.Viewer.ORIENTATION_MARKER_SIZE + "px sans-serif";
    metrics = this.contextAnnotation.measureText("X");
    textWidth = metrics.width;
    radiological = (this.container.preferences.radiological === "Yes");
    coordinate = {
        x: this.cursorPosition.x,
        y: this.cursorPosition.y,
        z: this.cursorPosition.z,
    };

    orientStartX = this.mainImage.screenOffsetX;
    // orientEndX = this.mainImage.screenOffsetX + this.mainImage.screenDim; // original
    // Modified 02/12/2019: change screenDim to screenWidth to accomodate non-square viewport
    orientEndX = this.mainImage.screenOffsetX + this.mainImage.screenWidth;
    orientMidX = Math.round(orientEndX / 2.0);

    orientStartY = this.mainImage.screenOffsetY;
    // orientEndY = this.mainImage.screenOffsetY + this.mainImage.screenDim; // original
    // Modified 02/12/2019: change screenDim to screenHeight to accomodate non-square viewport
    orientEndY = this.mainImage.screenOffsetY + this.mainImage.screenHeight;
    orientMidY = Math.round(orientEndY / 2.0);
    text = 'X: ' + coordinate.x + '    ' + 'Y: ' + coordinate.y + '    ' + 'Z: ' + coordinate.z;
    if (showOrientation) {
        // this.contextAnnotation.fillStyle = '#ffffff';
        // this.contextAnnotation.fillText(text, PAPAYA_PADDING, orientEndY - PAPAYA_PADDING);
        this.contextAnnotation.fillStyle = this.getOrientationCertaintyColor();
        this.contextAnnotation.fillText(text, papaya.viewer.Viewer.ORIENTATION_MARKER_SIZE * 0.5, orientEndY - (papaya.viewer.Viewer.ORIENTATION_MARKER_SIZE * 0.5));
    }
    if (this.container.preferences.showRuler === "Yes") {
        this.screenLayout.forEach(function (view) {
            this.drawRuler(view);
        }, this);
    }
};

papaya.viewer.Viewer.prototype.drawRuler = function (slice) {
    var rulerPoint1, rulerPoint2, text, metrics, textWidth, textHeight, padding, xText, yText;
    var displacement = 40;
    if (slice === this.surfaceView || slice === this.obliqueView) {
        return;
    }
    if (!slice.rulerPoints[0] || !slice.rulerPoints[1]) return;
    rulerPoint1 = papaya.utilities.ViewerUtils.convertImageToScreenCoordinate(slice, slice.rulerPoints[0]);
    rulerPoint2 = papaya.utilities.ViewerUtils.convertImageToScreenCoordinate(slice, slice.rulerPoints[1]);
    this.contextAnnotation.save();
    this.contextAnnotation.rect(slice.screenOffsetX, slice.screenOffsetY, slice.screenWidth, slice.screenHeight);
    this.contextAnnotation.clip();

    this.contextAnnotation.setTransform(1, 0, 0, 1, 0, 0);
    this.contextAnnotation.strokeStyle = "green";
    this.contextAnnotation.fillStyle = "green";
    this.contextAnnotation.lineWidth = 2.0;
    this.contextAnnotation.beginPath();
    this.contextAnnotation.moveTo(rulerPoint1[0], rulerPoint1[1]);
    this.contextAnnotation.lineTo(rulerPoint2[0], rulerPoint2[1]);
    this.contextAnnotation.stroke();
    this.contextAnnotation.closePath();

    this.contextAnnotation.beginPath();
    this.contextAnnotation.arc(rulerPoint1[0], rulerPoint1[1], 3, 0, 2 * Math.PI, false);
    this.contextAnnotation.arc(rulerPoint2[0], rulerPoint2[1], 3, 0, 2 * Math.PI, false);
    this.contextAnnotation.fill();
    this.contextAnnotation.closePath();
    // console.log("Ruler measurements", [this.mainImage.xSize, this.mainImage.ySize]);
    var spacing3D = papaya.utilities.ViewerUtils.get3DSpacing(this.volume);
    text = papaya.utilities.StringUtils.formatNumber(papaya.utilities.MathUtils.lineDistance3d(
        slice.rulerPoints[0].x * spacing3D.x,
        slice.rulerPoints[0].y * spacing3D.y,
        slice.rulerPoints[0].z * spacing3D.z,
        slice.rulerPoints[1].x * spacing3D.x,
        slice.rulerPoints[1].y * spacing3D.y,
        slice.rulerPoints[1].z * spacing3D.z), true);
    text = text + " mm"; // template literals are not possible!
    metrics = this.contextAnnotation.measureText(text);
    textWidth = metrics.width;
    textHeight = 14;
    padding = 2;
    xText = parseInt((rulerPoint1[0] + rulerPoint2[0]) / 2) - (textWidth / 2) + displacement;
    yText = parseInt((rulerPoint2[1] + rulerPoint2[1]) / 2) + (textHeight / 2) + displacement;
    xText = papaya.utilities.MathUtils.clip(xText, slice.screenOffsetX + slice.screenWidth - textWidth, slice.screenOffsetX);
    yText = papaya.utilities.MathUtils.clip(yText, slice.screenOffsetY + slice.screenHeight - textHeight, slice.screenOffsetY + textHeight);
    this.contextAnnotation.fillStyle = "#FFFFFF";
    papaya.viewer.Viewer.drawRoundRect(this.contextAnnotation, xText - padding, yText - textHeight - padding + 1, textWidth + (padding * 2), textHeight+ (padding * 2), 5, true, false);

    this.contextAnnotation.font = papaya.viewer.Viewer.ORIENTATION_MARKER_SIZE + "px sans-serif";
    this.contextAnnotation.strokeStyle = "green";
    this.contextAnnotation.fillStyle = "green";
    this.contextAnnotation.fillText(text, xText, yText);
    this.contextAnnotation.restore();
};

papaya.viewer.Viewer.prototype.drawCrosshairs = function () {
    var xLoc, yStart, yEnd, yLoc, xStart, xEnd, rotateAngle, rotateAngle2;
    // console.log('drawCrosshairs');
    // Modified 18/12/2019 add clearRect function
    var drawLine = function (context, lineStyle, xStart, xEnd, yStart, yEnd) {
        context.beginPath();
        context.strokeStyle = lineStyle;
        context.moveTo(xStart, yStart);
        context.lineTo(xEnd, yEnd);
        context.closePath();
        context.stroke();
    };
    var clipCenter = function (context, canvas, xLoc, yLoc) {
        var centerClipRadius = 10;
        context.save();
        context.beginPath();
        context.rect(xLoc - centerClipRadius, yLoc - centerClipRadius, centerClipRadius * 2,
        centerClipRadius * 2);
        context.closePath();
        context.clip();
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.restore();
    };
    var drawCornerBox = function (context, boxStyle, slice) {
        var boxSize = 20;
        context.fillStyle = boxStyle;
        context.fillRect(slice.screenOffsetX + slice.screenWidth - boxSize, slice.screenOffsetY, boxSize, boxSize);
    };

    this.contextAnnotation.clearRect(0, 0, this.canvasAnnotation.width, this.canvasAnnotation.height);
    ///////////////////////
    // initialize crosshairs
    this.contextAnnotation.setTransform(1, 0, 0, 1, 0, 0);
    this.contextAnnotation.strokeStyle = papaya.viewer.Viewer.CROSSHAIR_COLOR_SAGITTAL;
    this.contextAnnotation.lineWidth = 1.0;

    if ((this.mainImage !== this.axialSlice) || this.toggleMainCrosshairs) {
        // draw axial crosshairs
        var radius = this.axialSlice.screenWidth + this.axialSlice.screenHeight;
        rotateAngle = (-this.volume.transform.localizerAngleAxial) * Math.PI / 180 - Math.PI/2;
        rotateAngle2 = (-this.volume.transform.localizerAngleAxial) * Math.PI / 180;

        // this.contextAnnotation.rotate(rotateAngle * Math.PI / 180);
        this.contextAnnotation.save();
        this.contextAnnotation.beginPath();
        this.contextAnnotation.rect(this.axialSlice.screenOffsetX, this.axialSlice.screenOffsetY, this.axialSlice.screenWidth,
            this.axialSlice.screenHeight);
        this.contextAnnotation.closePath();
        this.contextAnnotation.clip();

        // console.log('drawCrosshairs finalTransform axial');
        // console.log(this.volume);
        // console.table(this.axialSlice.finalTransform);
        xLoc = (this.axialSlice.finalTransform[0][2] + (this.currentCoord.x + 0.5) *
            this.axialSlice.finalTransform[0][0]);
        yLoc = (this.axialSlice.finalTransform[1][2] + (this.currentCoord.y + 0.5) *
            this.axialSlice.finalTransform[1][1]);
        var center = this.getSliceCenterPosition(this.axialSlice);
        var rotatedLoc = this.getCoordinateFromRotatedSlice(rotateAngle2, xLoc, yLoc, center.x, center.y, true);
        xLoc = rotatedLoc[0];
        yLoc = rotatedLoc[1];
        
        this.axialSlice.localizerCenter.x = xLoc;
        this.axialSlice.localizerCenter.y = yLoc;

        xStart = xLoc + radius * Math.cos(rotateAngle);
        yStart = yLoc + radius * Math.sin(rotateAngle);
        xEnd = xLoc + radius * Math.cos(rotateAngle + Math.PI);
        yEnd = yLoc + radius * Math.sin(rotateAngle + Math.PI);
        this.axialSlice.localizerLines.xStart[0] = xStart;
        this.axialSlice.localizerLines.yStart[0] = yStart;
        this.axialSlice.localizerLines.xEnd[0] = xEnd;
        this.axialSlice.localizerLines.yEnd[0] = yEnd;

        // draw first line
        drawLine(this.contextAnnotation, papaya.viewer.Viewer.CROSSHAIR_COLOR_SAGITTAL, xStart, xEnd, yStart, yEnd);

        // this.contextAnnotation.moveTo(xLoc, yLoc);
        // this.contextAnnotation.lineTo(xLoc + radius * Math.cos(rotateAngle + Math.PI), yLoc + radius * Math.sin(rotateAngle + Math.PI));
        xStart = xLoc + radius * Math.cos(rotateAngle2);
        yStart = yLoc + radius * Math.sin(rotateAngle2);
        xEnd = xLoc + radius * Math.cos(rotateAngle2 + Math.PI);
        yEnd = yLoc + radius * Math.sin(rotateAngle2 + Math.PI);
        this.axialSlice.localizerLines.xStart[1] = xStart;
        this.axialSlice.localizerLines.yStart[1] = yStart;
        this.axialSlice.localizerLines.xEnd[1] = xEnd;
        this.axialSlice.localizerLines.yEnd[1] = yEnd;

        drawLine(this.contextAnnotation, papaya.viewer.Viewer.CROSSHAIR_COLOR_CORONAL, xStart, xEnd, yStart, yEnd);
        clipCenter(this.contextAnnotation, this.canvasAnnotation, xLoc, yLoc);
        drawCornerBox(this.contextAnnotation, papaya.viewer.Viewer.CROSSHAIR_COLOR_AXIAL, this.axialSlice);
        this.contextAnnotation.restore();
    }


    if ((this.mainImage !== this.coronalSlice) || this.toggleMainCrosshairs) {
        // draw coronal crosshairs
        var radius = this.coronalSlice.screenWidth + this.coronalSlice.screenHeight;
        rotateAngle = (this.volume.transform.localizerAngleCoronal) * Math.PI / 180 - Math.PI/2;
        rotateAngle2 = (this.volume.transform.localizerAngleCoronal) * Math.PI / 180;

        this.contextAnnotation.save();
        this.contextAnnotation.beginPath();
        this.contextAnnotation.rect(this.coronalSlice.screenOffsetX, this.coronalSlice.screenOffsetY, this.coronalSlice.screenWidth,
            this.coronalSlice.screenHeight);
        this.contextAnnotation.closePath();
        this.contextAnnotation.clip();

        // console.log('drawCrosshairs finalTransform coronal');
        // console.table(this.coronalSlice.finalTransform);
        xLoc = (this.coronalSlice.finalTransform[0][2] + (this.currentCoord.x + 0.5) *
            this.coronalSlice.finalTransform[0][0]);
        yLoc = (this.coronalSlice.finalTransform[1][2] + (this.currentCoord.z + 0.5) *
            this.coronalSlice.finalTransform[1][1]);
        
        var center = this.getSliceCenterPosition(this.coronalSlice);
        // xCenter = this.sagittalSlice.screenOffsetX + (this.sagittalSlice.screenWidth / 2);
        // yCenter = this.sagittalSlice.screenOffsetY + (this.sagittalSlice.screenHeight / 2);
        var rotatedLoc = this.getCoordinateFromRotatedSlice(rotateAngle2, xLoc, yLoc, center.x, center.y, true);
        xLoc = rotatedLoc[0];
        yLoc = rotatedLoc[1];

        this.coronalSlice.localizerCenter.x = xLoc;
        this.coronalSlice.localizerCenter.y = yLoc;
        xStart = xLoc + radius * Math.cos(rotateAngle);
        yStart = yLoc + radius * Math.sin(rotateAngle);
        xEnd = xLoc + radius * Math.cos(rotateAngle + Math.PI);
        yEnd = yLoc + radius * Math.sin(rotateAngle + Math.PI);
        this.coronalSlice.localizerLines.xStart[0] = xStart;
        this.coronalSlice.localizerLines.yStart[0] = yStart;
        this.coronalSlice.localizerLines.xEnd[0] = xEnd;
        this.coronalSlice.localizerLines.yEnd[0] = yEnd;

        // draw first line

        drawLine(this.contextAnnotation, papaya.viewer.Viewer.CROSSHAIR_COLOR_SAGITTAL, xStart, xEnd, yStart, yEnd);


        xStart = xLoc + radius * Math.cos(rotateAngle2);
        yStart = yLoc + radius * Math.sin(rotateAngle2);
        xEnd = xLoc + radius * Math.cos(rotateAngle2 + Math.PI);
        yEnd = yLoc + radius * Math.sin(rotateAngle2 + Math.PI);
        this.coronalSlice.localizerLines.xStart[1] = xStart;
        this.coronalSlice.localizerLines.yStart[1] = yStart;
        this.coronalSlice.localizerLines.xEnd[1] = xEnd;
        this.coronalSlice.localizerLines.yEnd[1] = yEnd;
        
        drawLine(this.contextAnnotation, papaya.viewer.Viewer.CROSSHAIR_COLOR_AXIAL, xStart, xEnd, yStart, yEnd);
        clipCenter(this.contextAnnotation, this.canvasAnnotation, xLoc, yLoc);
        drawCornerBox(this.contextAnnotation, papaya.viewer.Viewer.CROSSHAIR_COLOR_CORONAL, this.coronalSlice);
        this.contextAnnotation.restore();
    }

    if ((this.mainImage !== this.sagittalSlice) || this.toggleMainCrosshairs) {
        // draw sagittal crosshairs
        
        var radius = this.sagittalSlice.screenWidth + this.sagittalSlice.screenHeight;
        rotateAngle = (this.volume.transform.localizerAngleSagittal) * Math.PI / 180 - Math.PI/2;
        rotateAngle2 = (this.volume.transform.localizerAngleSagittal) * Math.PI / 180;

        this.contextAnnotation.save();
        this.contextAnnotation.beginPath();
        this.contextAnnotation.rect(this.sagittalSlice.screenOffsetX, this.sagittalSlice.screenOffsetY,
            this.sagittalSlice.screenWidth, this.sagittalSlice.screenHeight);
        this.contextAnnotation.closePath();
        this.contextAnnotation.clip();

        // console.log('drawCrosshairs finalTransform sagittal');
        // console.table(this.sagittalSlice.finalTransform);

        xLoc = (this.sagittalSlice.finalTransform[0][2] + (this.currentCoord.y + 0.5) *
            this.sagittalSlice.finalTransform[0][0]);
        yLoc = (this.sagittalSlice.finalTransform[1][2] + (this.currentCoord.z + 0.5) *
            this.sagittalSlice.finalTransform[1][1]);
        var center = this.getSliceCenterPosition(this.sagittalSlice);
        // xCenter = this.sagittalSlice.screenOffsetX + (this.sagittalSlice.screenWidth / 2);
        // yCenter = this.sagittalSlice.screenOffsetY + (this.sagittalSlice.screenHeight / 2);
        var rotatedLoc = this.getCoordinateFromRotatedSlice(-rotateAngle2, xLoc, yLoc, center.x, center.y);
        xLoc = rotatedLoc[0];
        yLoc = rotatedLoc[1];
        // console.log('Sagittal Slice center', xLoc, yLoc);

        this.sagittalSlice.localizerCenter.x = xLoc;
        this.sagittalSlice.localizerCenter.y = yLoc;

        xStart = xLoc + radius * Math.cos(rotateAngle);
        yStart = yLoc + radius * Math.sin(rotateAngle);
        xEnd = xLoc + radius * Math.cos(rotateAngle + Math.PI);
        yEnd = yLoc + radius * Math.sin(rotateAngle + Math.PI);
        this.sagittalSlice.localizerLines.xStart[0] = xStart;
        this.sagittalSlice.localizerLines.yStart[0] = yStart;
        this.sagittalSlice.localizerLines.xEnd[0] = xEnd;
        this.sagittalSlice.localizerLines.yEnd[0] = yEnd;

        // draw first line
        drawLine(this.contextAnnotation, papaya.viewer.Viewer.CROSSHAIR_COLOR_CORONAL, xStart, xEnd, yStart, yEnd);

        xStart = xLoc + radius * Math.cos(rotateAngle2);
        yStart = yLoc + radius * Math.sin(rotateAngle2);
        xEnd = xLoc + radius * Math.cos(rotateAngle2 + Math.PI);
        yEnd = yLoc + radius * Math.sin(rotateAngle2 + Math.PI);
        this.sagittalSlice.localizerLines.xStart[1] = xStart;
        this.sagittalSlice.localizerLines.yStart[1] = yStart;
        this.sagittalSlice.localizerLines.xEnd[1] = xEnd;
        this.sagittalSlice.localizerLines.yEnd[1] = yEnd;

        drawLine(this.contextAnnotation, papaya.viewer.Viewer.CROSSHAIR_COLOR_AXIAL, xStart, xEnd, yStart, yEnd);
        clipCenter(this.contextAnnotation, this.canvasAnnotation, xLoc, yLoc);
        drawCornerBox(this.contextAnnotation, papaya.viewer.Viewer.CROSSHAIR_COLOR_SAGITTAL, this.sagittalSlice);
        this.contextAnnotation.restore();
    }
};



papaya.viewer.Viewer.prototype.calculateScreenSliceTransforms = function () {
    // console.log('calculateScreenSliceTransforms');
    var horizontalFactor = 0.65;
    var verticalFactor = 0.65;
    this.viewerDim = {
        width: this.canvas.width,
        height: this.canvas.height
    };
    // console.log(this.viewerDim);

    if (this.container.orthogonalTall) {
        if (this.container.hasSurface() || this.container.hasOblique()) {
            console.log('ORTHOGONAL TALL HAS OBLIQUE');
            // this.viewerDim = this.canvas.height / 1.333;

            this.getTransformParameters(this.mainImage, this.viewerDim, true, 1 / verticalFactor, 0);
            this.mainImage.screenTransform[0][2] += this.mainImage.screenOffsetX = 0;
            this.mainImage.screenTransform[1][2] += this.mainImage.screenOffsetY = 0;

            this.getTransformParameters(this.lowerImageTop, this.viewerDim, true, 1 / (1 - verticalFactor), 1 - 1 / 3);
            this.lowerImageTop.screenTransform[0][2] += this.lowerImageTop.screenOffsetX = 0;
            this.lowerImageTop.screenTransform[1][2] += this.lowerImageTop.screenOffsetY = this.viewerDim.height * verticalFactor + (papaya.viewer.Viewer.GAP);

            this.getTransformParameters(this.lowerImageBot, this.viewerDim, true, 1 / (1 - verticalFactor), 1 - 1 / 3);
            this.lowerImageBot.screenTransform[0][2] += this.lowerImageBot.screenOffsetX = (((this.viewerDim.width - papaya.viewer.Viewer.GAP) / 3) + (papaya.viewer.Viewer.GAP));
            this.lowerImageBot.screenTransform[1][2] += this.lowerImageBot.screenOffsetY =  this.viewerDim.height * verticalFactor + (papaya.viewer.Viewer.GAP);

            this.getTransformParameters(this.lowerImageBot2, this.viewerDim, true, 1 / (1 - verticalFactor), 1 - 1 / 3);
            this.lowerImageBot2.screenTransform[0][2] += this.lowerImageBot2.screenOffsetX = 2 * ((((this.viewerDim.width - papaya.viewer.Viewer.GAP) / 3) + (papaya.viewer.Viewer.GAP)));
            this.lowerImageBot2.screenTransform[1][2] += this.lowerImageBot2.screenOffsetY =  this.viewerDim.height * verticalFactor + (papaya.viewer.Viewer.GAP);
        } else {
            console.log('ORTHOGONAL TALL NO OBLIQUE');
            // this.viewerDim = this.canvas.height / 1.5;

            this.getTransformParameters(this.mainImage, this.viewerDim, true, 1 / verticalFactor, 0);
            this.mainImage.screenTransform[0][2] += this.mainImage.screenOffsetX = 0;
            this.mainImage.screenTransform[1][2] += this.mainImage.screenOffsetY = 0;

            this.getTransformParameters(this.lowerImageBot, this.viewerDim, true, 1 / (1 - verticalFactor), 1 / 2);
            this.lowerImageBot.screenTransform[0][2] += this.lowerImageBot.screenOffsetX = (((this.viewerDim.width - papaya.viewer.Viewer.GAP) / 2) + (papaya.viewer.Viewer.GAP));
            this.lowerImageBot.screenTransform[1][2] += this.lowerImageBot.screenOffsetY = this.viewerDim.height * verticalFactor + (papaya.viewer.Viewer.GAP);

            this.getTransformParameters(this.lowerImageTop, this.viewerDim, true, 1 / (1 - verticalFactor), 1 / 2);
            this.lowerImageTop.screenTransform[0][2] += this.lowerImageTop.screenOffsetX = 0;
            this.lowerImageTop.screenTransform[1][2] += this.lowerImageTop.screenOffsetY =  this.viewerDim.height * verticalFactor + (papaya.viewer.Viewer.GAP);
        }
    } else {
        //orthogonal no tall, has surface
        // this.viewerDim = this.canvas.height;

        if (this.container.hasSurface() || this.container.hasOblique()) {
            // console.log('calculateScreenSliceTransforms hasOblique');

            this.getTransformParameters(this.mainImage, this.viewerDim, false, 3, horizontalFactor);
            this.mainImage.screenTransform[0][2] += this.mainImage.screenOffsetX = 0;
            this.mainImage.screenTransform[1][2] += this.mainImage.screenOffsetY = 0;

            this.getTransformParameters(this.lowerImageBot, this.viewerDim, true, 3, horizontalFactor);
            this.lowerImageBot.screenTransform[0][2] += this.lowerImageBot.screenOffsetX =
                (this.viewerDim.width * horizontalFactor + (papaya.viewer.Viewer.GAP));
            this.lowerImageBot.screenTransform[1][2] += this.lowerImageBot.screenOffsetY =
                (((this.viewerDim.height - papaya.viewer.Viewer.GAP) / 3) + (papaya.viewer.Viewer.GAP));

            this.getTransformParameters(this.lowerImageTop, this.viewerDim, true, 3, horizontalFactor);
            this.lowerImageTop.screenTransform[0][2] += this.lowerImageTop.screenOffsetX =
                (this.viewerDim.width * horizontalFactor + (papaya.viewer.Viewer.GAP));
            this.lowerImageTop.screenTransform[1][2] += this.lowerImageTop.screenOffsetY = 0;

            this.getTransformParameters(this.lowerImageBot2, this.viewerDim, true, 3, horizontalFactor);
            this.lowerImageBot2.screenTransform[0][2] += this.lowerImageBot2.screenOffsetX =
                (this.viewerDim.width * horizontalFactor + (papaya.viewer.Viewer.GAP));
            this.lowerImageBot2.screenTransform[1][2] += this.lowerImageBot2.screenOffsetY =
                (((this.viewerDim.height - papaya.viewer.Viewer.GAP) / 3) * 2 + (papaya.viewer.Viewer.GAP) * 2);
        } else {
            //orthogonal no tall no surface
            // Modified 29/11/2019:
            this.getTransformParameters(this.mainImage, this.viewerDim, false, 2, horizontalFactor);
            this.mainImage.screenTransform[0][2] += this.mainImage.screenOffsetX = 0;
            this.mainImage.screenTransform[1][2] += this.mainImage.screenOffsetY = 0;

            this.getTransformParameters(this.lowerImageBot, this.viewerDim, true, 2, horizontalFactor);
            this.lowerImageBot.screenTransform[0][2] += this.lowerImageBot.screenOffsetX =
                (this.viewerDim.width * horizontalFactor + (papaya.viewer.Viewer.GAP));
            this.lowerImageBot.screenTransform[1][2] += this.lowerImageBot.screenOffsetY =
                (((this.viewerDim.height - papaya.viewer.Viewer.GAP) / 2) + (papaya.viewer.Viewer.GAP));

            this.getTransformParameters(this.lowerImageTop, this.viewerDim, true, 2, horizontalFactor);
            this.lowerImageTop.screenTransform[0][2] += this.lowerImageTop.screenOffsetX =
                (this.viewerDim.width * horizontalFactor + (papaya.viewer.Viewer.GAP));
            this.lowerImageTop.screenTransform[1][2] += this.lowerImageTop.screenOffsetY = 0;

            // Original code
            // this.getTransformParameters(this.mainImage, this.viewerDim, false, 2, horizontalFactor);
            // this.mainImage.screenTransform[0][2] += this.mainImage.screenOffsetX = 0;
            // this.mainImage.screenTransform[1][2] += this.mainImage.screenOffsetY = 0;

            // this.getTransformParameters(this.lowerImageBot, this.viewerDim, true, 2, horizontalFactor);
            // this.lowerImageBot.screenTransform[0][2] += this.lowerImageBot.screenOffsetX =
            //     (this.viewerDim + (papaya.viewer.Viewer.GAP));
            // this.lowerImageBot.screenTransform[1][2] += this.lowerImageBot.screenOffsetY =
            //     (((this.viewerDim - papaya.viewer.Viewer.GAP) / 2) + (papaya.viewer.Viewer.GAP));

            // this.getTransformParameters(this.lowerImageTop, this.viewerDim, true, 2, horizontalFactor);
            // this.lowerImageTop.screenTransform[0][2] += this.lowerImageTop.screenOffsetX =
            //     (this.viewerDim + (papaya.viewer.Viewer.GAP));
            // this.lowerImageTop.screenTransform[1][2] += this.lowerImageTop.screenOffsetY = 0;
        }
    }

    this.updateScreenSliceTransforms();
};



papaya.viewer.Viewer.prototype.updateScreenSliceTransforms = function () {
    this.axialSlice.updateFinalTransform();
    this.coronalSlice.updateFinalTransform();
    this.sagittalSlice.updateFinalTransform();
    if (this.hasOblique()) this.cmprSlice.updateFinalTransform();
};



papaya.viewer.Viewer.prototype.getTransformParameters = function (image, viewerDim, lower, verticalFactor, horizontalFactor) {
    // Modification 29/11/2019: change `factor` to verticalFactor, add horizontalFactor

    var viewportWidth = (lower ? viewerDim.width * (1 - horizontalFactor) : viewerDim.width * horizontalFactor);
    var bigScale, scaleX, scaleY, transX, transY;
    bigScale = lower ? verticalFactor : 1;
    // console.log('getTransformParameters', width, viewerDim, papaya.viewer.Viewer.GAP);
    var viewportHeight = viewerDim.height / bigScale; // 'height' input is viewer height, not individual slice's height
    var scaleDimension = viewportWidth <= viewportHeight ? viewportWidth : viewportHeight;
    var longestDim = this.longestDim;
    var longestDimSize = this.longestDimSize;
    var imageScreenWidth = image.canvasMain.width * image.screenTransform[0][0];
    var imageScreenHeight = image.canvasMain.height * image.screenTransform[1][1];
    // var scaleDimension = width;
    // console.table([viewerDim.width, viewerDim.height, lower, bigScale, verticalFactor, horizontalFactor]);

    if (image === this.surfaceView) {
        this.surfaceView.resize(this.viewerDim.height / bigScale);
        return;
    }
    // test 
    if (imageScreenWidth >= imageScreenHeight) {
        // scaleDimension = viewportWidth
        longestDim = image.canvasMain.width;
        longestDimSize = image.xSize;
    } else {
        longestDim = image.canvasMain.height;
        longestDimSize = image.ySize;
    }
    // }
    scaleX = ((((lower ? scaleDimension - papaya.viewer.Viewer.GAP : scaleDimension) / longestDim) *
    image.getXYratio())) * (image.getYSize() / longestDimSize);
    scaleY = (((lower ? scaleDimension - papaya.viewer.Viewer.GAP : scaleDimension) / longestDim)) *
    (image.getYSize() / longestDimSize);

    // if (image === this.obliqueView) {
    //     console.log('getTransformParameters', scaleDimension, longestDim);
    //     console.log('viewport Dimension', viewportWidth, viewportHeight);
    //     console.log('image Dimension', image.canvasMain.width, image.canvasMain.height);
    //     console.log('real image Dimension', image.canvasMain.width * image.screenTransform[0][0], image.canvasMain.height * image.screenTransform[1][1]);
    //     console.log('scale', scaleX, scaleY);
    // }

    // if (image.getRealWidth() > image.getRealHeight()) {
    //     console.log('readWidth > realHeight', image);
    //     scaleX = (((lower ? scaleDimension - papaya.viewer.Viewer.GAP : scaleDimension) / this.longestDim) / bigScale) *
    //         (image.getXSize() / this.longestDimSize);
    //     scaleY = ((((scaleDimension ? height - papaya.viewer.Viewer.GAP : scaleDimension) / this.longestDim) *
    //         image.getYXratio()) / bigScale) * (image.getXSize() / this.longestDimSize);
    // } else {
    //     // console.log('getTransformParameters', width, realHeight);
    //     console.log('readWidth < realHeight', image);
    //     scaleX = ((((lower ? scaleDimension - papaya.viewer.Viewer.GAP : scaleDimension) / this.longestDim) *
    //         image.getXYratio())) * (image.getYSize() / this.longestDimSize);
    //     scaleY = (((lower ? scaleDimension - papaya.viewer.Viewer.GAP : scaleDimension) / this.longestDim)) *
    //         (image.getYSize() / this.longestDimSize);
    // }

    transX = (((lower ? viewportWidth - papaya.viewer.Viewer.GAP : viewportWidth)) - (image.getXDim() * scaleX)) / 2;
    transY = (((lower ? viewportHeight - papaya.viewer.Viewer.GAP : viewportHeight)) - (image.getYDim() * scaleY)) / 2;

    // Original code
    // if (image.getRealWidth() > image.getRealHeight()) {
    //     scaleX = (((lower ? height - papaya.viewer.Viewer.GAP : height) / this.longestDim) / bigScale) *
    //         (image.getXSize() / this.longestDimSize);
    //     scaleY = ((((lower ? height - papaya.viewer.Viewer.GAP : height) / this.longestDim) *
    //         image.getYXratio()) / bigScale) * (image.getXSize() / this.longestDimSize);
    // } else {
    //     console.log('getTransformParameters');
    //     scaleX = ((((lower ? height - papaya.viewer.Viewer.GAP : height) / this.longestDim) *
    //         image.getXYratio()) / bigScale) * (image.getYSize() / this.longestDimSize);
    //     scaleY = (((lower ? height - papaya.viewer.Viewer.GAP : height) / this.longestDim) / bigScale) *
    //         (image.getYSize() / this.longestDimSize);
    // }
    // transX = (((lower ? height - papaya.viewer.Viewer.GAP : height) / bigScale) - (image.getXDim() * scaleX)) / 2;
    // transY = (((lower ? height - papaya.viewer.Viewer.GAP : height) / bigScale) - (image.getYDim() * scaleY)) / 2;

    image.screenDim = (lower ? (viewerDim.height - papaya.viewer.Viewer.GAP) / verticalFactor : viewportHeight); //compatibility
    // image.screenHeight = (lower ? height / verticalFactor : height);
    image.screenHeight = viewportHeight;

    // image.screenWidth = image.screenDim;
    // console.log('papaya getTransformParameters', image.screenDim);
    // console.log(this);
    image.screenWidth = viewportWidth;
    // console.table([image.screenWidth, image.screenHeight]);
    image.screenTransform[0][0] = scaleX;
    image.screenTransform[1][1] = scaleY;
    image.screenTransform[0][2] = transX;
    image.screenTransform[1][2] = transY;

    image.screenTransform2[0][0] = scaleX;
    image.screenTransform2[1][1] = scaleY;
    image.screenTransform2[0][2] = transX;
    image.screenTransform2[1][2] = transY;
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

    if (((papayaContainers.length > 1) || papayaContainers[0].nestedViewer) && (papaya.Container.papayaLastHoveredViewer !== this)) {
        return;
    }

    keyCode = papaya.viewer.Viewer.getKeyCode(ke);

    if (papaya.viewer.Viewer.isControlKey(ke)) {
        this.isControlKeyDown = true;
    } else if (papaya.viewer.Viewer.isAltKey(ke)) {
        this.isAltKeyDown = true;
    } else if (papaya.viewer.Viewer.isShiftKey(ke)) {
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
    } else if ((keyCode === papaya.viewer.Viewer.KEYCODE_PAGE_DOWN) ||
        (keyCode === papaya.viewer.Viewer.KEYCODE_FORWARD_SLASH)) {
        this.incrementAxial(true);
    } else if ((keyCode === papaya.viewer.Viewer.KEYCODE_PAGE_UP) ||
        (keyCode === papaya.viewer.Viewer.KEYCODE_SINGLE_QUOTE)) {
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
        if (this.container.preferences.showCrosshairs === "Yes") {
            this.toggleMainCrosshairs = !this.toggleMainCrosshairs;
            this.drawViewer(true);
        }
    } else if (keyCode === papaya.viewer.Viewer.KEYCODE_SERIES_FORWARD) {
        this.incrementSeriesPoint();
    } else if (keyCode === papaya.viewer.Viewer.KEYCODE_SERIES_BACK) {
        this.decrementSeriesPoint();
    } else if (keyCode === papaya.viewer.Viewer.KEYCODE_RULER) {
        if (this.container.preferences.showRuler === "Yes") {
            this.container.preferences.showRuler = "No";
        } else {
            this.container.preferences.showRuler = "Yes";
        }
        this.drawViewer(true, true);
    } else {
        this.keyPressIgnored = true;
    }

    if (!this.keyPressIgnored) {
        ke.handled = true;
        ke.preventDefault();
    }
};



papaya.viewer.Viewer.prototype.keyUpEvent = function (ke) {
    if ((papayaContainers.length > 1) && (papaya.Container.papayaLastHoveredViewer !== this)) {
        return;
    }

    this.isControlKeyDown = false;
    this.isAltKeyDown = false;
    this.isShiftKeyDown = false;

    if (!this.keyPressIgnored) {
        ke.handled = true;
        ke.preventDefault();
    }

    if (this.hasSurface()) {
        if (papaya.utilities.PlatformUtils.smallScreen) {
            this.drawViewer(true, false);
        }
    }
};



papaya.viewer.Viewer.prototype.rotateViews = function () {
    var temp;

    if (this.container.contextManager && this.container.contextManager.clearContext) {
        this.container.contextManager.clearContext();
    }

    if (this.hasSurface() || this.hasOblique()) {
        temp = this.lowerImageBot2;
        this.lowerImageBot2 = this.lowerImageBot;
        this.lowerImageBot = this.lowerImageTop;
        this.lowerImageTop = this.mainImage;
        this.mainImage = temp;
    } else {
        temp = this.lowerImageBot;
        this.lowerImageBot = this.lowerImageTop;
        this.lowerImageTop = this.mainImage;
        this.mainImage = temp;
    }
    if (this.screenCurve) this.screenCurve.pointsNeedUpdate = true;
    this.viewsChanged();
};



papaya.viewer.Viewer.prototype.viewsChanged = function () {
    this.calculateScreenSliceTransforms();

    if (this.hasSurface() || this.hasOblique()) {
        this.lowerImageBot2.clearDTILinesImage();
    }

    this.lowerImageBot.clearDTILinesImage();
    this.lowerImageTop.clearDTILinesImage();
    this.mainImage.clearDTILinesImage();

    if (!this.controlsHidden) {
        if (this.mainImage !== this.surfaceView) {
            this.fadeInControls();
        } else {
            $("#" + PAPAYA_CONTROL_MAIN_INCREMENT_BUTTON_CSS + this.container.containerIndex).fadeOut();
            $("#" + PAPAYA_CONTROL_MAIN_DECREMENT_BUTTON_CSS + this.container.containerIndex).fadeOut();
        }

        $("#" + PAPAYA_DEFAULT_SLIDER_ID + this.container.containerIndex + "main").find("button").prop("disabled",
            (this.mainImage === this.surfaceView));
    }
    this.updateCurrentScreenLayout();
    this.drawViewer(true);
    this.updateSliceSliderControl();
};



papaya.viewer.Viewer.prototype.timepointChanged = function () {
    this.drawViewer(true);
    this.updateSliceSliderControl();
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
        this.updateTimer = window.setTimeout(papaya.utilities.ObjectUtils.bind(viewer,
            function () {
                viewer.updatePosition(this, papaya.utilities.PlatformUtils.getMousePositionX(viewer.updateTimerEvent),
                    papaya.utilities.PlatformUtils.getMousePositionY(viewer.updateTimerEvent));
            }),
            papaya.viewer.Viewer.UPDATE_TIMER_INTERVAL);
    }
};



papaya.viewer.Viewer.prototype.mouseDownEvent = function (me) {
    var draggingStarted = true, menuData, menu, pickedColor;
    if (!papaya.Container.allowPropagation) {
        me.stopPropagation();
    }
    console.log('mouseDown', me);
    me.preventDefault();

    if (this.showingContextMenu) {
        this.container.toolbar.closeAllMenus();
        me.handled = true;
        return;
    }
    var absoluteMouseX = papaya.utilities.PlatformUtils.getMousePositionX(me);
    var absoluteMouseY = papaya.utilities.PlatformUtils.getMousePositionY(me);
    var canvasMouse = this.convertMouseCoordToCanvas(absoluteMouseX, absoluteMouseY);

    if ((me.target.nodeName === "IMG") || (me.target.nodeName === "CANVAS")) {
        if (me.handled !== true) {
            this.container.toolbar.closeAllMenus();

            this.previousMousePosition.x = papaya.utilities.PlatformUtils.getMousePositionX(me);
            this.previousMousePosition.y = papaya.utilities.PlatformUtils.getMousePositionY(me);

            this.findClickedSlice(this, this.previousMousePosition.x, this.previousMousePosition.y);
            this.updateCurrentInteractingSlice(canvasMouse.x, canvasMouse.y);
            this.localizerDetected = this.detectLocalizer(this.currentInteractingSlice, canvasMouse.x, canvasMouse.y);

            if (((me.button === 2) || this.isControlKeyDown || this.isLongTouch) && this.container.contextManager && (this.selectedSlice === this.mainImage) && (this.mainImage === this.surfaceView)) {
                this.contextMenuMousePositionX = this.previousMousePosition.x - this.canvasRect.left;
                this.contextMenuMousePositionY = this.previousMousePosition.y - this.canvasRect.top;

                if (this.container.contextManager.prefersColorPicking && this.container.contextManager.prefersColorPicking()) {
                    pickedColor = this.surfaceView.pickColor(this.contextMenuMousePositionX, this.contextMenuMousePositionY);
                    menuData = this.container.contextManager.getContextAtColor(pickedColor[0], pickedColor[1], pickedColor[2]);
                }

                if (menuData) {
                    this.isContextMode = true;
                    menu = this.container.toolbar.buildMenu(menuData, null, null, null, true);
                    papaya.ui.Toolbar.applyContextState(menu);
                    draggingStarted = false;
                    menu.showMenu();
                    this.showingContextMenu = true;
                }

                this.isContextMode = true;
            } else if (((me.button === 2) || this.isControlKeyDown || this.isLongTouch) && this.container.contextManager && (this.selectedSlice === this.mainImage)) {
                if (this.isLongTouch) {
                    var point = this.convertCurrentCoordinateToScreen(this.mainImage);
                    this.contextMenuMousePositionX = point.x;
                    this.contextMenuMousePositionY = point.y;
                    menuData = this.container.contextManager.getContextAtImagePosition(this.currentCoord.x, this.currentCoord.y, this.currentCoord.z);
                } else {
                    this.contextMenuMousePositionX = this.previousMousePosition.x - this.canvasRect.left;
                    this.contextMenuMousePositionY = this.previousMousePosition.y - this.canvasRect.top;
                    menuData = this.container.contextManager.getContextAtImagePosition(this.cursorPosition.x, this.cursorPosition.y, this.cursorPosition.z);
                }

                if (menuData) {
                    this.isContextMode = true;
                    menu = this.container.toolbar.buildMenu(menuData, null, null, null, true);
                    papaya.ui.Toolbar.applyContextState(menu);
                    draggingStarted = false;
                    menu.showMenu();
                    this.showingContextMenu = true;
                }
            } else if (((me.button === 2) || this.isControlKeyDown) && !this.currentScreenVolume.rgb) {
                this.isWindowControl = true;

                if (this.container.showImageButtons && (this.container.showControlBar || !this.container.kioskMode) &&
                        this.screenVolumes[this.getCurrentScreenVolIndex()].supportsDynamicColorTable()) {
                    this.container.toolbar.showImageMenu(this.getCurrentScreenVolIndex());
                }
            } else if (this.reactViewerConnector.activeTool === "CMPR.Active") {
                console.log(me.button);
                if (me.button === 0) {
                    if (this.screenCurve.detectedPointRef.length){
                        this.isGrabbingLocalizer = true;
                    } else {
                        // this.screenCurve.addPoint(canvasMouse.x, canvasMouse.y);
                        // var cursorPosition = this.getXYImageCoordinate(this.currentInteractingSlice);
                        if (!this.screenCurve.slice || this.screenCurve.pointsRef.length < 1) this.screenCurve.updateCurrentSlice(this.currentInteractingSlice);
                        this.screenCurve.addPoint(this.cursorPosition, this.currentInteractingSlice);
                        this.onCurveUpdated();
                        // this.screenCurve.drawCurve(this.contextAnnotation, this.canvasAnnotation, this.sagittalSlice.finalTransform);
                    }
                } else if (me.button === 1) {
                    // this.screenCurve.updatePointDetection(canvasMouse.x, canvasMouse.y);
                    // var cursorPosition = this.getXYImageCoordinate(this.currentInteractingSlice);
                    this.screenCurve.updatePointDetection(this.cursorPosition);
                    console.log('REMOVING POINT BRO');
                    if (this.screenCurve.detectedPointRef.length){
                        this.screenCurve.removePoint(this.screenCurve.detectedPointRef[0].id);
                        this.onCurveUpdated();
                    }
                }
            } else if (this.reactViewerConnector.activeTool === 'Pan') {
                this.setStartPanLocation(
                    papaya.utilities.ViewerUtils.convertScreenToImageCoordinate(this.currentInteractingSlice, 
                        [this.previousMousePosition.x - this.canvasRect.left, this.previousMousePosition.y - this.canvasRect.top]),
                    this.currentInteractingSlice
                );
                // this.setStartPanLocation(
                //     this.convertScreenToImageCoordinateX(this.previousMousePosition.x, this.currentInteractingSlice),
                //     this.convertScreenToImageCoordinateY(this.previousMousePosition.y, this.currentInteractingSlice),
                //     this.currentInteractingSlice
                // );
            } else if (this.reactViewerConnector.activeTool === 'Zoom') {
                var mouseCoord = papaya.utilities.ViewerUtils.convertScreenToImageCoordinate(this.currentInteractingSlice, [canvasMouse.x, canvasMouse.y], false);
                if (this.currentInteractingSlice.zoomFactor === 1) this.setZoomLocation(mouseCoord, this.currentInteractingSlice);
            } else if (this.reactViewerConnector.activeTool === 'Ruler' && !this.localizerDetected) {
                this.currentInteractingSlice.rulerPoints[0] = papaya.utilities.ViewerUtils.convertScreenToImageCoordinate(this.currentInteractingSlice, 
                        [canvasMouse.x, canvasMouse.y]);
                // console.log(this.currentInteractingSlice.rulerPoints[0]);
            } else {
                // if (this.selectedSlice && (this.selectedSlice !== this.surfaceView)) {
                //     this.grabbedHandle = this.selectedSlice.findProximalRulerHandle(this.convertScreenToImageCoordinateX(this.previousMousePosition.x - this.canvasRect.left, this.selectedSlice),
                //         this.convertScreenToImageCoordinateY(this.previousMousePosition.y - this.canvasRect.top, this.selectedSlice));

                //     if (this.grabbedHandle === null && this.localizerDetected === 2) {
                //         // console.log('mousedown', this.isGrabbingLocalizer);
                //         // this.updatePosition(this, papaya.utilities.PlatformUtils.getMousePositionX(me), papaya.utilities.PlatformUtils.getMousePositionY(me), true);
                //         // this.resetUpdateTimer(me);
                //     }
                // } else if (this.selectedSlice && (this.selectedSlice === this.surfaceView)) {
                //     if (this.surfaceView.findProximalRulerHandle(this.previousMousePosition.x - this.canvasRect.left,
                //             this.previousMousePosition.y - this.canvasRect.top)) {

                //     } else {
                //         this.isPanning = this.isShiftKeyDown;
                //         this.surfaceView.setStartDynamic(this.previousMousePosition.x, this.previousMousePosition.y);
                //     }

                    this.container.display.drawEmptyDisplay();
                // }
            }

            this.isDragging = draggingStarted;
            // console.log('mouseDown', this.isDragging);
            me.handled = true;
        } 

        if (!this.controlsHidden) {
            this.controlsHiddenPrimed = true;
        }
    }
};



papaya.viewer.Viewer.prototype.mouseUpEvent = function (me) {
    if (!papaya.Container.allowPropagation) {
        me.stopPropagation();
    }

    me.preventDefault();

    if (this.showingContextMenu) {
        this.showingContextMenu = false;
        me.handled = true;
        return;
    }

    if ((me.target.nodeName === "IMG") || (me.target.nodeName === "CANVAS")) {
        if (me.handled !== true) {
            if (!this.isWindowControl && !this.isZoomMode && !this.isContextMode && (this.grabbedHandle === null) && (!this.surfaceView || (this.surfaceView.grabbedRulerPoint === -1)) && this.reactViewerConnector.activeTool == 'Crosshair') {
                // this.updatePosition(this, papaya.utilities.PlatformUtils.getMousePositionX(me), papaya.utilities.PlatformUtils.getMousePositionY(me));
            }

            if (this.selectedSlice === this.surfaceView) {
                this.updateCursorPosition(this, papaya.utilities.PlatformUtils.getMousePositionX(me), papaya.utilities.PlatformUtils.getMousePositionY(me));
            }

            this.zoomFactorPrevious = this.zoomFactor;
            this.isDragging = false;
            this.isWindowControl = false;
            this.isZoomMode = false;
            this.isPanning = false;
            this.selectedSlice = null;
            this.controlsHiddenPrimed = false;
            this.isGrabbingLocalizer = false;
            this.screenCurve.detectedPointRef = [];
            me.handled = true;
        }
    }

    this.grabbedHandle = null;
    this.isContextMode = false;

    this.updateWindowTitle();
    this.updateSliceSliderControl();
    this.container.toolbar.closeAllMenus(true);

    if (this.hasSurface()) {
        if (this.surfaceView.grabbedRulerPoint === -1) {
            this.surfaceView.updateCurrent();
        } else {
            this.surfaceView.grabbedRulerPoint = -1;
        }

        if (papaya.utilities.PlatformUtils.smallScreen) {
            this.drawViewer(true, false);
        }
    }

    if (this.controlsHidden) {
        this.controlsHidden = false;
        this.fadeInControls();
    }
    ///
    if (this.reactViewerConnector.mainImageChanged) this.onMainImageChanged();
};


papaya.viewer.Viewer.prototype.fadeOutControls = function () {
    $("#" + PAPAYA_CONTROL_MAIN_INCREMENT_BUTTON_CSS + this.container.containerIndex).fadeOut();
    $("#" + PAPAYA_CONTROL_MAIN_DECREMENT_BUTTON_CSS + this.container.containerIndex).fadeOut();
    $("#" + PAPAYA_CONTROL_MAIN_SWAP_BUTTON_CSS + this.container.containerIndex).fadeOut();
    $("#" + PAPAYA_CONTROL_MAIN_GOTO_CENTER_BUTTON_CSS + this.container.containerIndex).fadeOut();
    $("#" + PAPAYA_CONTROL_MAIN_GOTO_ORIGIN_BUTTON_CSS + this.container.containerIndex).fadeOut();
};



papaya.viewer.Viewer.prototype.fadeInControls = function () {
    if (this.container.getViewerDimensions()[0] < 600) {
        if (this.mainImage !== this.surfaceView) {
            $("#" + PAPAYA_CONTROL_MAIN_INCREMENT_BUTTON_CSS + this.container.containerIndex).fadeIn();
            $("#" + PAPAYA_CONTROL_MAIN_DECREMENT_BUTTON_CSS + this.container.containerIndex).fadeIn();
        }

        $("#" + PAPAYA_CONTROL_MAIN_SWAP_BUTTON_CSS + this.container.containerIndex).fadeIn();
    } else {
        if (this.mainImage !== this.surfaceView) {
            $("#" + PAPAYA_CONTROL_MAIN_INCREMENT_BUTTON_CSS + this.container.containerIndex).fadeIn();
            $("#" + PAPAYA_CONTROL_MAIN_DECREMENT_BUTTON_CSS + this.container.containerIndex).fadeIn();
        }

        $("#" + PAPAYA_CONTROL_MAIN_SWAP_BUTTON_CSS + this.container.containerIndex).fadeIn();
        $("#" + PAPAYA_CONTROL_MAIN_GOTO_CENTER_BUTTON_CSS + this.container.containerIndex).fadeIn();
        $("#" + PAPAYA_CONTROL_MAIN_GOTO_ORIGIN_BUTTON_CSS + this.container.containerIndex).fadeIn();
    }
};



papaya.viewer.Viewer.prototype.findClickedSlice = function (viewer, xLoc, yLoc) {
    xLoc = xLoc - this.canvasRect.left;
    yLoc = yLoc - this.canvasRect.top;

    if (this.insideScreenSlice(viewer.axialSlice, xLoc, yLoc, viewer.volume.getXDim(), viewer.volume.getYDim())) {
        this.selectedSlice = this.axialSlice;
    } else if (this.insideScreenSlice(viewer.coronalSlice, xLoc, yLoc, viewer.volume.getXDim(),
            viewer.volume.getZDim())) {
        this.selectedSlice = this.coronalSlice;
    } else if (this.insideScreenSlice(viewer.sagittalSlice, xLoc, yLoc, viewer.volume.getYDim(),
            viewer.volume.getZDim())) {
        this.selectedSlice = this.sagittalSlice;
    } else if (this.insideScreenSlice(viewer.surfaceView, xLoc, yLoc, viewer.volume.getYDim(),
            viewer.volume.getZDim())) {
        this.selectedSlice = this.surfaceView;
    } else {
        this.selectedSlice = null;
    }
};



papaya.viewer.Viewer.prototype.mouseMoveEvent = function (me) {
    // me.preventDefault();

    if (this.showingContextMenu) {
        me.handled = true;
        return;
    }

    // timer to throttle mouseMoveEvent
    // console.log('this.mouseMoveHandler', this.mouseMoveHandler);

    // detection loop
    var absoluteMouseX, absoluteMouseY, zoomFactorCurrent;

    papaya.Container.papayaLastHoveredViewer = this;

    absoluteMouseX = papaya.utilities.PlatformUtils.getMousePositionX(me);
    absoluteMouseY = papaya.utilities.PlatformUtils.getMousePositionY(me);

    this.updateCursorPosition(this, absoluteMouseX,
        absoluteMouseY);

    var canvasMouse = this.convertMouseCoordToCanvas(absoluteMouseX, absoluteMouseY);
    var canvasMouseX = canvasMouse.x
    var canvasMouseY = canvasMouse.y
    if (this.screenCurve.hasPoint() && !this.isDragging) this.screenCurve.updatePointDetection(this.cursorPosition);

    if (!this.mouseMoveHandler) {
        // console.log('CANT TOUCH THIS');
        return
    }
    this.mouseMoveHandler = false;
    this.updateCurrentScreenLayout();
    // console.log(this.screenCurve.detec)
    // console.log(canvasMouseX, canvasMouseY);

    if (this.isDragging) {
        if (this.localizerDetected) this.isGrabbingLocalizer = true;
        if (this.reactViewerConnector.activeTool === 'Ruler' && !this.isGrabbingLocalizer) {
            this.currentInteractingSlice.rulerPoints[1] = papaya.utilities.ViewerUtils.convertScreenToImageCoordinate(this.currentInteractingSlice, [canvasMouseX, canvasMouseY]);
            this.drawViewer(false, true);
        } else if ((this.reactViewerConnector.activeTool === 'Window' && !this.isGrabbingLocalizer) || me.which === 2) { // original: else if (this.isWindowControl)
            this.windowLevelChanged(this.previousMousePosition.x - absoluteMouseX, this.previousMousePosition.y - absoluteMouseY);
            this.previousMousePosition.x = absoluteMouseX;
            this.previousMousePosition.y = absoluteMouseY;
        // Modification 26/11/2019: add stackScroll
        } else if (this.reactViewerConnector.activeTool === 'StackScroll' && !this.isGrabbingLocalizer) {
            var deltaY = this.previousMousePosition.y - absoluteMouseY;
            var increment;
            if (deltaY < 0) increment = false;
            else if (deltaY > 0) increment = true;
            this.previousMousePosition.y = absoluteMouseY;
            if (deltaY !== 0) {
                // console.log(deltaY);
                if (this.currentInteractingSlice === this.axialSlice) this.incrementAxial(increment, Math.ceil(Math.abs(deltaY/6)));
                if (this.currentInteractingSlice === this.coronalSlice) this.incrementCoronal(increment, Math.ceil(Math.abs(deltaY/6)));
                if (this.currentInteractingSlice === this.sagittalSlice) this.incrementSagittal(increment, Math.ceil(Math.abs(deltaY/6)));
                this.gotoCoordinate(this.currentCoord);
            }
            // if (this.reactPapayaViewport.props.viewportSpecificData.intensityActive) this.reactPapayaViewport.setState({ updateMIP: true });
        //////////////////////////////////////////////
        } else if (this.reactViewerConnector.activeTool === 'Pan' && !this.isGrabbingLocalizer) {
            if (this.selectedSlice === this.surfaceView) {
                this.surfaceView.updateTranslateDynamic(papaya.utilities.PlatformUtils.getMousePositionX(me),
                    papaya.utilities.PlatformUtils.getMousePositionY(me), (this.selectedSlice === this.mainImage) ? 1 : 3);
                this.drawViewer(false, true);
            } else {
                // console.log('Panning nha mike fen');
                this.setCurrentPanLocation(
                    papaya.utilities.ViewerUtils.convertScreenToImageCoordinate(this.currentInteractingSlice, 
                        [absoluteMouseX - this.canvasRect.left, absoluteMouseY - this.canvasRect.top]),
                    this.currentInteractingSlice
                );
            }
        } else if (this.reactViewerConnector.activeTool === 'Zoom' && !this.isGrabbingLocalizer) {
            if (this.selectedSlice === this.surfaceView) {
                zoomFactorCurrent = ((absoluteMouseY - this.previousMousePosition.y) * 0.5) * this.surfaceView.scaleFactor;
                this.surfaceView.zoom += zoomFactorCurrent;
                this.previousMousePosition.x = absoluteMouseX;
                this.previousMousePosition.y = absoluteMouseY;
            } else {
                zoomFactorCurrent = ((absoluteMouseY - this.previousMousePosition.y) * 0.001) * this.currentInteractingSlice.zoomFactor;
                this.setZoomFactor(zoomFactorCurrent, this.currentInteractingSlice);
                this.currentInteractingSlice.updateZoomTransform();
                if (this.screenCurve.hasPoint()) this.screenCurve.buildPointsArray(); // update points to account for zooming and translating
            }
            
            this.drawViewer(false, true);
        } else if (this.localizerDetected === 2 && this.reactViewerConnector.activeTool !== "CMPR.Active") { // original: else, no if
            // console.log('mousemove CROSSHAIR');
            // this.resetUpdateTimer(null);

            if (this.selectedSlice !== null) {
                if (this.selectedSlice === this.surfaceView) {
                    if (this.surfaceView.grabbedRulerPoint !== -1) {
                        this.surfaceView.pickRuler(absoluteMouseX - this.canvasRect.left,
                            absoluteMouseY - this.canvasRect.top);
                        this.drawViewer(false, true, true);
                    } else {
                        this.surfaceView.updateDynamic(papaya.utilities.PlatformUtils.getMousePositionX(me),
                            papaya.utilities.PlatformUtils.getMousePositionY(me), (this.selectedSlice === this.mainImage) ? 1 : 3);
                        this.drawViewer(false, true, true);
                        this.container.display.drawEmptyDisplay();
                    }
                } else {
                    // console.log("crosshair");
                    var currentRotatingAngle = this.screenVolumes[0].getSliceRotatingAngle(this.currentInteractingSlice.sliceDirection);
                    // this.screenVolumes[0].rotateLocalizer(0, this.currentInteractingSlice.sliceDirection, this.currentCoord);
                    // this.screenVolumes[0].resetSliceRotation(this.currentInteractingSlice.sliceDirection, this.currentCoord);
                    var canvasMouse = this.convertMouseCoordToCanvas(absoluteMouseX, absoluteMouseY);
                    this.updatePosition(this, canvasMouse.x, canvasMouse.y, false);
                    // this.screenVolumes[0].updateCenterCoord(this.currentCoord, true);
                    // this.screenVolumes[0].rotateLocalizer(currentRotatingAngle, this.currentInteractingSlice.sliceDirection, this.currentCoord);
                    this.previousMousePosition.x = absoluteMouseX;
                    this.previousMousePosition.y = absoluteMouseY;
                    this.reactViewerConnector.mainImageChanged = true;
                    this.onMainImageChanged();
                    // console.log('localizer center: ', this.currentInteractingSlice.localizerCenter);
                    // console.log('currentCoord center: ', this.convertCoordinateToScreen(this.currentCoord, this.currentInteractingSlice));
                    this.drawViewer(true, false, false);
                    // this.resetUpdateTimer(me);
                }
            }
        } else if (this.localizerDetected === 1 && this.reactViewerConnector.activeTool !== "CMPR.Active") { // original: else, no if
            // Rotate localizer
            var localizerCenter = this.currentInteractingSlice.localizerCenter;
            var oldCenter = this.convertCoordinateToScreen(this.volume.transform.centerCoord, this.currentInteractingSlice)
            // console.log('localizer center: ', localizerCenter);
            // console.log('currentCoord center: ', this.convertCoordinateToScreen(this.currentCoord, this.currentInteractingSlice));
            // console.log('slice center: ', this.volume.transform.centerCoord);
            var currentRotatingAngle = this.screenVolumes[0].getSliceRotatingAngle(this.currentInteractingSlice.sliceDirection);
            var rotateAngle = this.getRotatingAngle(this.currentInteractingSlice, this.previousMousePosition.x, this.previousMousePosition.y, absoluteMouseX, absoluteMouseY);
            var oldCoord = this.volume.transform.centerCoord;
            this.screenVolumes[0].updateCenterMat(this.currentCoord);
            this.screenVolumes[0].resetSliceRotation(this.currentInteractingSlice.sliceDirection);
            this.updatePosition(this, localizerCenter.x, localizerCenter.y, false);
            this.screenVolumes[0].updateCenterMat(this.currentCoord);
            this.screenVolumes[0].rotateLocalizer(rotateAngle + currentRotatingAngle, this.currentInteractingSlice.sliceDirection);
            this.drawViewer(true, false, false);
            if (this.hasOblique()) this.onCurveUpdated();
            this.reactViewerConnector.mainImageChanged = true;
            this.previousMousePosition.x = absoluteMouseX;
            this.previousMousePosition.y = absoluteMouseY;
            // this.drawViewer(false, false, false);
        } else if (this.screenCurve.detectedPointRef.length && this.reactViewerConnector.activeTool === "CMPR.Active" && this.isGrabbingLocalizer) {
            // console.log('OYOYOY dragging curve');
            var id = this.screenCurve.detectedPointRef[0].id;
            this.updateCursorPosition(this, papaya.utilities.PlatformUtils.getMousePositionX(me),
            papaya.utilities.PlatformUtils.getMousePositionY(me));
            // var cursorPosition = this.getXYImageCoordinate(this.currentInteractingSlice);
            this.screenCurve.updatePointPosition(id, this.cursorPosition);
            this.onCurveUpdated();
            this.reactViewerConnector.mainImageChanged = true;
        }
    } else {
        this.updateCurrentInteractingSlice(canvasMouseX, canvasMouseY);
        if (!this.isGrabbingLocalizer) {
            if (this.reactViewerConnector.activeTool === "CMPR.Active") {
                // var cursorPosition = this.getXYImageCoordinate(this.currentInteractingSlice);
                this.drawAnnotation();
            } else {
                this.localizerDetected = this.detectLocalizer(this.currentInteractingSlice, canvasMouseX, canvasMouseY);
                this.changeCursor(this.localizerDetected);
            }
        }
        // this.updateCursorPosition(this, papaya.utilities.PlatformUtils.getMousePositionX(me),
        //     papaya.utilities.PlatformUtils.getMousePositionY(me));
        this.isZoomMode = false;
    }

    if (this.controlsHidden && !this.isDragging) {
        this.controlsHidden = false;
        this.fadeInControls();
    }

    if (this.controlsTimer) {
        clearTimeout(this.controlsTimer);
        this.controlsTimer = null;
    }

    this.controlsTimer = setTimeout(papaya.utilities.ObjectUtils.bind(this, function () {
        this.controlsHidden = true;
        this.fadeOutControls();
        }), 8000);

    if (this.controlsHiddenPrimed) {
        this.controlsHiddenPrimed = false;
        this.controlsHidden = true;
        this.fadeOutControls();
    }
};



papaya.viewer.Viewer.prototype.mouseDoubleClickEvent = function () {
    if (this.isAltKeyDown) {
        this.zoomFactorPrevious = 1;
        this.setZoomFactor(1);
    }
};



papaya.viewer.Viewer.prototype.mouseOutEvent = function (me) {
    papaya.Container.papayaLastHoveredViewer = null;

    if (this.isDragging) {
        this.mouseUpEvent(me);
    } else {
        if (this.container.display) {
            this.container.display.drawEmptyDisplay();
        }

        this.grabbedHandle = null;
    }
};




papaya.viewer.Viewer.prototype.mouseLeaveEvent = function () {};


papaya.viewer.Viewer.prototype.touchMoveEvent = function (me) {
    console.log('touchMoveEvent');
    if (!this.didLongTouch) {
        if (this.longTouchTimer) {
            clearTimeout(this.longTouchTimer);
            this.longTouchTimer = null;
        }

        if (!this.isDragging) {
            this.mouseDownEvent(me);
            this.isDragging = true;
        }

        this.mouseMoveEvent(me);
    } else this.mouseMoveEvent(me);
};



papaya.viewer.Viewer.prototype.touchStartEvent = function (me) {
    if (!papaya.Container.allowPropagation) {
        me.stopPropagation();
    }
    me.preventDefault();
    this.mouseDownEvent(me);
    this.longTouchTimer = setTimeout(papaya.utilities.ObjectUtils.bind(this, function() {this.doLongTouch(me); }), 500);
};



papaya.viewer.Viewer.prototype.touchEndEvent = function (me) {
    if (!this.didLongTouch) {
        if (this.longTouchTimer) {
            clearTimeout(this.longTouchTimer);
            this.longTouchTimer = null;
        }

        if (!this.isDragging) {
            this.mouseDownEvent(me);
        }

        this.mouseUpEvent(me);
    }

    this.didLongTouch = false;
    this.isLongTouch = false;
};



papaya.viewer.Viewer.prototype.doLongTouch = function (me) {
    this.longTouchTimer = null;
    this.didLongTouch = true;
    this.isLongTouch = true;

    this.updateCursorPosition(this, papaya.utilities.PlatformUtils.getMousePositionX(me), papaya.utilities.PlatformUtils.getMousePositionY(me));

    this.mouseDownEvent(me);
    this.mouseUpEvent(me);
};



papaya.viewer.Viewer.prototype.windowLevelChanged = function (contrastChange, brightnessChange) {
    var range, step, minFinal, maxFinal;

    range = this.currentScreenVolume.screenMax - this.currentScreenVolume.screenMin;
    step = range * 0.025;

    if (Math.abs(contrastChange) > Math.abs(brightnessChange)) {
        minFinal = this.currentScreenVolume.screenMin + (step * papaya.utilities.MathUtils.signum(contrastChange));
        maxFinal = this.currentScreenVolume.screenMax + (-1 * step * papaya.utilities.MathUtils.signum(contrastChange));

        if (maxFinal <= minFinal) {
            minFinal = this.currentScreenVolume.screenMin;
            maxFinal = this.currentScreenVolume.screenMin; // yes, min
        }
    } else {
        minFinal = this.currentScreenVolume.screenMin + (step * papaya.utilities.MathUtils.signum(brightnessChange));
        maxFinal = this.currentScreenVolume.screenMax + (step * papaya.utilities.MathUtils.signum(brightnessChange));
    }

    this.currentScreenVolume.setScreenRange(minFinal, maxFinal);

    if (this.container.showImageButtons) {
        this.container.toolbar.updateImageMenuRange(this.getCurrentScreenVolIndex(), parseFloat(minFinal.toPrecision(7)),
            parseFloat(maxFinal.toPrecision(7)));
    }

    this.drawViewer(false, true);
};



papaya.viewer.Viewer.prototype.gotoCoordinate = function (coor, nosync) {
    // console.log('gotoCoordinate is called by', papaya.viewer.Viewer.prototype.gotoCoordinate.caller);
    if (!this.initialized) {
        return;
    }

    var xDim = this.volume.header.imageDimensions.xDim;
    var yDim = this.volume.header.imageDimensions.yDim;
    var zDim = this.volume.header.imageDimensions.zDim;

    if (coor.x < 0) {
        this.currentCoord.x = 0;
    } else if (coor.x >= xDim) {
        this.currentCoord.x = (xDim - 1);
    } else {
        this.currentCoord.x = coor.x;
    }

    if (coor.y < 0) {
        this.currentCoord.y = 0;
    } else if (coor.y >= yDim) {
        this.currentCoord.y = (yDim - 1);
    } else {
        this.currentCoord.y = coor.y;
    }

    if (coor.z < 0) {
        this.currentCoord.z = 0;
    } else if (coor.z >= zDim) {
        this.currentCoord.z = (zDim - 1);
    } else {
        this.currentCoord.z = coor.z;
    }
    // this.reactPapayaViewport.setState({ indexChanged: true });
    // this.drawViewer(true);
    // this.reactPapayaViewport.setState({ indexChanged: false });
    this.updateSliceSliderControl();

    if (nosync) {
        return;
    }

    this.container.coordinateChanged(this);
    this.onMainImageChanged();
    this.drawViewer(false);
};


papaya.viewer.Viewer.prototype.gotoWorldCoordinate = function (coorWorld, nosync) {
    var coor = new papaya.core.Coordinate();
    this.gotoCoordinate(this.getIndexCoordinateAtWorld(coorWorld.x, coorWorld.y, coorWorld.z, coor), nosync);
};


papaya.viewer.Viewer.prototype.resizeViewer = function (dims) {
    var halfPadding = PAPAYA_PADDING / 2, offset, swapButton, originButton, incButton, decButton, centerButton;
    this.canvas.width = dims[0];
    this.canvas.height = dims[1];
    // Modifiend 18/12/2019
    this.canvasAnnotation.width = dims[0];
    this.canvasAnnotation.height = dims[1];
    if (this.screenCurve) this.screenCurve.pointsNeedUpdate = true;
    ///////////////////////////

    if (this.initialized) {
        this.calculateScreenSliceTransforms();
        this.canvasRect = this.canvas.getBoundingClientRect();
        this.drawViewer(true);

        if (this.container.showControls) {
            offset = $(this.canvas).offset();

            incButton = $("#" + PAPAYA_CONTROL_MAIN_INCREMENT_BUTTON_CSS + this.container.containerIndex);
            incButton.css({
                top: offset.top + halfPadding,
                left: offset.left + this.mainImage.screenDim - incButton.outerWidth() - halfPadding,
                position:'absolute'});

            decButton = $("#" + PAPAYA_CONTROL_MAIN_DECREMENT_BUTTON_CSS + this.container.containerIndex);
            decButton.css({
                top: offset.top + decButton.outerHeight() + PAPAYA_PADDING,
                left: offset.left + this.mainImage.screenDim - decButton.outerWidth() - halfPadding,
                position:'absolute'});

            swapButton = $("#" + PAPAYA_CONTROL_MAIN_SWAP_BUTTON_CSS + this.container.containerIndex);
            swapButton.css({
                top: offset.top + this.mainImage.screenDim - swapButton.outerHeight() - halfPadding,
                left: offset.left + this.mainImage.screenDim - swapButton.outerWidth() - halfPadding,
                //width: swapButton.outerWidth(),
                position:'absolute'});

            centerButton = $("#" + PAPAYA_CONTROL_MAIN_GOTO_CENTER_BUTTON_CSS + this.container.containerIndex);
            centerButton.css({
                top: offset.top + this.mainImage.screenDim - centerButton.outerHeight() - halfPadding,
                left: offset.left + halfPadding,
                position:'absolute'});

            originButton = $("#" + PAPAYA_CONTROL_MAIN_GOTO_ORIGIN_BUTTON_CSS + this.container.containerIndex);
            originButton.css({
                top: offset.top + this.mainImage.screenDim - originButton.outerHeight() - halfPadding,
                left: offset.left + halfPadding + originButton.outerWidth() + PAPAYA_PADDING,
                position:'absolute'});
        }
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
    var ctr, count = 0, value;

    for (ctr = 1; ctr < this.screenVolumes.length; ctr += 1) {
        if (!this.screenVolumes[ctr].dti) {
            count += 1;
        }
    }

    value = count % papaya.viewer.ColorTable.OVERLAY_COLOR_TABLES.length;

    return papaya.viewer.ColorTable.OVERLAY_COLOR_TABLES[value].name;
};



papaya.viewer.Viewer.prototype.getCurrentValueAt = function (ctrX, ctrY, ctrZ) {
    /*jslint bitwise: true */

    var interpolation = !this.currentScreenVolume.interpolation;
    interpolation &= (this.container.preferences.smoothDisplay === "Yes");

    if (this.worldSpace) {
        interpolation |= ((this.currentScreenVolume.volume === this.volume) && this.volume.isWorldSpaceOnly());

        return this.currentScreenVolume.volume.getVoxelAtCoordinate(
            (ctrX - this.volume.header.origin.x) * this.volume.header.voxelDimensions.xSize,
            (this.volume.header.origin.y - ctrY) * this.volume.header.voxelDimensions.ySize,
            (this.volume.header.origin.z - ctrZ) * this.volume.header.voxelDimensions.zSize,
            this.currentScreenVolume.currentTimepoint, !interpolation);
    } else {
        return this.currentScreenVolume.volume.getVoxelAtMM(
            ctrX * this.volume.header.voxelDimensions.xSize,
            ctrY * this.volume.header.voxelDimensions.ySize,
            ctrZ * this.volume.header.voxelDimensions.zSize,
            this.currentScreenVolume.currentTimepoint, !interpolation, this.currentInteractingSlice.sliceDirection);
    }
};

////////////////////////////////////////////////////

papaya.viewer.Viewer.prototype.resetViewer = function () {
    if (this.container.showControlBar) {
        $("." + PAPAYA_CONTROL_INCREMENT_BUTTON_CSS).prop('disabled', true);
        $("." + PAPAYA_CONTROL_SWAP_BUTTON_CSS).prop('disabled', true);
        $("." + PAPAYA_CONTROL_GOTO_CENTER_BUTTON_CSS).prop('disabled', true);
        $("." + PAPAYA_CONTROL_GOTO_ORIGIN_BUTTON_CSS).prop('disabled', true);
    } else if (this.container.showControls) {
        $("#" + PAPAYA_CONTROL_MAIN_INCREMENT_BUTTON_CSS + this.container.containerIndex).css({display: "none"});
        $("#" + PAPAYA_CONTROL_MAIN_DECREMENT_BUTTON_CSS + this.container.containerIndex).css({display: "none"});
        $("#" + PAPAYA_CONTROL_MAIN_SWAP_BUTTON_CSS + this.container.containerIndex).css({display: "none"});
        $("#" + PAPAYA_CONTROL_MAIN_GOTO_CENTER_BUTTON_CSS + this.container.containerIndex).css({display: "none"});
        $("#" + PAPAYA_CONTROL_MAIN_GOTO_ORIGIN_BUTTON_CSS + this.container.containerIndex).css({display: "none"});
    }

    this.initialized = false;
    this.loadingVolume = null;
    ////
    if (this.volume) this.volume.transform = {};
    this.currentInteractingSlice = null;
    // clear slices

    this.screenLayout = [];
    if (this.screenVolumes.length > 0) {
        for (var i = 0; i < this.screenVolumes.length; i++) {
            this.screenVolumes[i].volume = {};
        }
    }
    ///
    this.volume = new papaya.volume.Volume(this.container.display, this);
    this.screenVolumes = [];
    this.surfaces = [];
    this.surfaceView = null;
    this.currentScreenVolume = null;
    if (this.axialSlice) this.axialSlice.terminateWebWorkers();
    if (this.coronalSlice) this.coronalSlice.terminateWebWorkers();
    if (this.sagittalSlice) this.sagittalSlice.terminateWebWorkers();
    if (this.cmprSlice) this.cmprSlice.terminateWebWorkers();
    this.axialSlice = null;
    this.coronalSlice = null;
    this.sagittalSlice = null;
    this.cmprSlice = null;
    this.mainImage = null;
    this.lowerImageBot2 = null;
    this.lowerImageBot = null;
    this.lowerImageTop = null;
    this.viewerDim = 0;
    this.currentCoord = new papaya.core.Coordinate(0, 0, 0);
    this.longestDim = 0;
    this.longestDimSize = 0;
    this.draggingSliceDir = 0;
    this.isDragging = false;
    this.isWindowControl = false;
    this.hasSeries = false;
    this.previousMousePosition = new papaya.core.Point();
    this.canvasAnnotation.removeEventListener("mousemove", this.listenerMouseMove, false);
    this.canvasAnnotation.removeEventListener("mousedown", this.listenerMouseDown, false);
    this.canvasAnnotation.removeEventListener("mouseout", this.listenerMouseOut, false);
    this.canvasAnnotation.removeEventListener("mouseleave", this.listenerMouseLeave, false);
    this.canvasAnnotation.removeEventListener("mouseup", this.listenerMouseUp, false);
    document.removeEventListener("keydown", this.listenerKeyDown, true);
    document.removeEventListener("keyup", this.listenerKeyUp, true);
    document.removeEventListener("contextmenu", this.listenerContextMenu, false);
    this.canvasAnnotation.removeEventListener("touchmove", this.listenerTouchMove, false);
    this.canvasAnnotation.removeEventListener("touchstart", this.listenerTouchStart, false);
    this.canvasAnnotation.removeEventListener("touchend", this.listenerTouchEnd, false);
    this.canvasAnnotation.removeEventListener("dblclick", this.listenerMouseDoubleClick, false);
    var contextAnnotation = this.canvasAnnotation.getContext('2d');
    contextAnnotation.clearRect(0, 0, this.canvasAnnotation.width, this.canvasAnnotation.height);
    this.removeScroll();

    this.canvasAnnotation.remove();
    this.canvas.remove();

    this.updateTimer = null;
    this.updateTimerEvent = null;
    this.drawEmptyViewer();
    if (this.container.display) {
        this.container.display.drawEmptyDisplay();
    }

    this.updateSliceSliderControl();
    this.container.toolbar.buildToolbar();
};



papaya.viewer.Viewer.prototype.getHeaderDescription = function (index) {
    index = index || 0;
    return this.screenVolumes[index].volume.header.toString();
};



papaya.viewer.Viewer.prototype.getImageDimensionsDescription = function (index) {
    var orientationStr, imageDims;

    orientationStr = this.screenVolumes[index].volume.header.orientation.orientation;
    imageDims = this.screenVolumes[index].volume.header.imageDimensions;

    return ("(" + orientationStr.charAt(0) + ", " + orientationStr.charAt(1) + ", " + orientationStr.charAt(2) + ") " +
        imageDims.cols + " x " + imageDims.rows + " x " + imageDims.slices);
};



papaya.viewer.Viewer.prototype.getVoxelDimensionsDescription = function (index) {
    var orientationStr, voxelDims;

    orientationStr = this.screenVolumes[index].volume.header.orientation.orientation;
    voxelDims = this.screenVolumes[index].volume.header.voxelDimensions;

    return ("(" + orientationStr.charAt(0) + ", " + orientationStr.charAt(1) + ", " + orientationStr.charAt(2) + ") " +
        papaya.utilities.StringUtils.formatNumber(voxelDims.colSize, true) + " x " + papaya.utilities.StringUtils.formatNumber(voxelDims.rowSize, true) + " x " +
        papaya.utilities.StringUtils.formatNumber(voxelDims.sliceSize, true) + " " + voxelDims.getSpatialUnitString());
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
    return papaya.utilities.StringUtils.wordwrap(this.screenVolumes[index].volume.fileName, 25, "<br />", true);
};



papaya.viewer.Viewer.prototype.getSurfaceFilename = function (index) {
    return papaya.utilities.StringUtils.wordwrap(this.surfaces[index].filename, 25, "<br />", true);
};



papaya.viewer.Viewer.prototype.getSurfaceNumPoints = function (index) {
    return this.surfaces[index].numPoints;
};



papaya.viewer.Viewer.prototype.getSurfaceNumTriangles = function (index) {
    return this.surfaces[index].numTriangles;
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
    return papaya.utilities.StringUtils.getSizeString(this.screenVolumes[index].volume.fileLength);
};



papaya.viewer.Viewer.prototype.getByteTypeDescription = function (index) {
    return (this.screenVolumes[index].volume.header.imageType.numBytes + "-Byte " +
        this.screenVolumes[index].volume.header.imageType.getTypeDescription());
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
    return papaya.utilities.StringUtils.wordwrap(this.screenVolumes[index].volume.header.imageDescription.notes, 35, "<br />", true);
};



papaya.viewer.Viewer.prototype.setCurrentScreenVol = function (index) {
    this.currentScreenVolume = this.screenVolumes[index];
    this.updateWindowTitle();
};



papaya.viewer.Viewer.prototype.updateWindowTitle = function () {
    var title;

    if (this.initialized) {
        title = this.getNiceFilename(this.getCurrentScreenVolIndex());

        if (this.currentScreenVolume.volume.numTimepoints > 1) {
            if (this.currentScreenVolume.seriesLabels && (this.currentScreenVolume.seriesLabels.length > this.currentScreenVolume.currentTimepoint)) {
                title = this.currentScreenVolume.seriesLabels[this.currentScreenVolume.currentTimepoint];
            } else {
                title = (title + " (" + (this.currentScreenVolume.currentTimepoint + 1) + " of " + this.currentScreenVolume.volume.numTimepoints + ")");
            }
        }

        if (this.isZooming()) {
            title = (title + " " + this.getZoomString());
        }

        this.container.toolbar.updateTitleBar(title);
    }
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

    if (this.container.syncOverlaySeries) {
        this.reconcileOverlaySeriesPoint(this.currentScreenVolume);
    }
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

    if (params.ignoreNiftiTransforms) {
        this.ignoreNiftiTransforms = true;
    }

    if (params.coordinate) {
        this.initialCoordinate = params.coordinate;
    }

    if (params.ignoreSync) {
        this.ignoreSync = params.ignoreSync;
    }

    if (!this.container.isDesktopMode()) {
        if (params.showOrientation !== undefined) {
            this.container.preferences.showOrientation = (params.showOrientation ? "Yes" : "No");
        }

        if (params.smoothDisplay !== undefined) {
            this.container.preferences.smoothDisplay = (params.smoothDisplay ? "Yes" : "No");
        }

        if (params.radiological !== undefined) {
            this.container.preferences.radiological = (params.radiological ? "Yes" : "No");
        }

        if (params.showRuler !== undefined) {
            this.container.preferences.showRuler = (params.showRuler ? "Yes" : "No");
        }

        if (params.showSurfacePlanes !== undefined) {
            this.container.preferences.showSurfacePlanes = (params.showSurfacePlanes ? "Yes" : "No");
        }

        if (params.showSurfaceCrosshairs !== undefined) {
            this.container.preferences.showSurfaceCrosshairs = (params.showSurfaceCrosshairs ? "Yes" : "No");
        }
    }
};



papaya.viewer.Viewer.prototype.hasLoadedDTI = function () {
    return (this.screenVolumes.length === 1) && (this.screenVolumes[0].dti) && (this.screenVolumes[0].dtiVolumeMod === null);
};



papaya.viewer.Viewer.prototype.goToInitialCoordinate = function () {
    var coord = new papaya.core.Coordinate();

    if (this.screenVolumes.length > 0) {
        if (this.initialCoordinate === null) {
            coord.setCoordinate(papayaFloorFast(this.volume.header.imageDimensions.xDim / 2),
                papayaFloorFast(this.volume.header.imageDimensions.yDim / 2),
                papayaFloorFast(this.volume.header.imageDimensions.zDim / 2), true);
        } else {
            if (this.worldSpace) {
                this.getIndexCoordinateAtWorld(this.initialCoordinate[0], this.initialCoordinate[1],
                    this.initialCoordinate[2], coord);
            } else {
                coord.setCoordinate(this.initialCoordinate[0], this.initialCoordinate[1], this.initialCoordinate[2], true);
            }

            this.initialCoordinate = null;
        }

        this.gotoCoordinate(coord);

        if (this.container.display) {
            this.container.display.drawDisplay(this.currentCoord.x, this.currentCoord.y, this.currentCoord.z);
        }
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
    // console.time('MiddleButtonScroll');
    var scrollSign, isSliceScroll;
/*
    if (this.container.nestedViewer || ((papayaContainers.length > 1) && !this.container.collapsable)) {
        return;
    }
*/
    e = e || window.event;
    /* ORIGINAL
    if(e.target != this.canvasAnnotation) {
        return;
    }
    */
   
    //If the scroll event happened outside the canvas don't handle it
    if(e.target != this.canvasAnnotation) {
        return;
    }

    if (e.preventDefault) {
        e.preventDefault();
    }

    e.returnValue = false;

    isSliceScroll = (this.container.preferences.scrollBehavior === "Increment Slice");
    scrollSign = papaya.utilities.PlatformUtils.getScrollSign(e, !isSliceScroll);

    if (isSliceScroll) {
        if (scrollSign < 0) {
            if (this.currentInteractingSlice.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
                this.incrementAxial(false, Math.abs(scrollSign));
            } else if (this.currentInteractingSlice.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
                this.incrementCoronal(false, Math.abs(scrollSign));
            } else if (this.currentInteractingSlice.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
                this.incrementSagittal(false, Math.abs(scrollSign));
            }

            this.gotoCoordinate(this.currentCoord);
        } else if (scrollSign > 0) {
            if (this.currentInteractingSlice.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
                this.incrementAxial(true, Math.abs(scrollSign));
            } else if (this.currentInteractingSlice.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
                this.incrementCoronal(true, Math.abs(scrollSign));
            } else if (this.currentInteractingSlice.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
                this.incrementSagittal(true, Math.abs(scrollSign));
            }

            this.gotoCoordinate(this.currentCoord);
        }

    } else {
        if (scrollSign !== 0) {
            this.isZoomMode = true;

            if (this.currentInteractingSlice === this.surfaceView) {
                this.surfaceView.zoom += ((scrollSign * -5) * this.surfaceView.scaleFactor);
                this.drawViewer(false, true);
            } else {
                if (this.currentInteractingSlice.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
                    this.setZoomLocation(this.currentCoord.x, this.currentCoord.y, this.currentInteractingSlice.sliceDirection);
                } else if (this.currentInteractingSlice.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
                    this.setZoomLocation(this.currentCoord.x, this.currentCoord.z, this.currentInteractingSlice.sliceDirection);
                } else if (this.currentInteractingSlice.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
                    this.setZoomLocation(this.currentCoord.y, this.currentCoord.z, this.currentInteractingSlice.sliceDirection);
                }

                this.setZoomFactor(this.zoomFactorPrevious + (scrollSign * 0.1 * this.zoomFactorPrevious));
            }

            this.zoomFactorPrevious = this.zoomFactor;
        }
    }
    // console.timeEnd('MiddleButtonScroll');
};



papaya.viewer.Viewer.prototype.incrementAxial = function (increment, degree) {
    var max = this.volume.header.imageDimensions.zDim;

    if (degree === undefined) {
        degree = 1;
    }

    if (increment) {
        this.currentCoord.z += degree;

        if (this.currentCoord.z >= max) {
            this.currentCoord.z = max - 1;
        }
    } else {
        this.currentCoord.z -= degree;

        if (this.currentCoord.z < 0) {
            this.currentCoord.z = 0;
        }
    }

    // this.gotoCoordinate(this.currentCoord);
};



papaya.viewer.Viewer.prototype.incrementCoronal = function (increment, degree) {
    var max = this.volume.header.imageDimensions.yDim;

    if (degree === undefined) {
        degree = 1;
    }

    if (increment) {
        this.currentCoord.y += degree;

        if (this.currentCoord.y >= max) {
            this.currentCoord.y = max - 1;
        }
    } else {
        this.currentCoord.y -= degree;

        if (this.currentCoord.y < 0) {
            this.currentCoord.y = 0;
        }
    }

    // this.gotoCoordinate(this.currentCoord);
};



papaya.viewer.Viewer.prototype.incrementSagittal = function (increment, degree) {
    var max = this.volume.header.imageDimensions.xDim;

    if (degree === undefined) {
        degree = 1;
    }

    if (increment) {
        this.currentCoord.x -= degree;

        if (this.currentCoord.x < 0) {
            this.currentCoord.x = 0;
        }
    } else {
        this.currentCoord.x += degree;

        if (this.currentCoord.x >= max) {
            this.currentCoord.x = max - 1;
        }
    }

    // this.gotoCoordinate(this.currentCoord);
};



papaya.viewer.Viewer.prototype.setZoomFactor = function (delta, slice) {
    var val = slice.zoomFactor - delta;
    if (val > papaya.viewer.Viewer.ZOOM_FACTOR_MAX) {
        val = papaya.viewer.Viewer.ZOOM_FACTOR_MAX;
    } else if (val < papaya.viewer.Viewer.ZOOM_FACTOR_MIN) {
        val = papaya.viewer.Viewer.ZOOM_FACTOR_MIN;
    }

    if (val === 1) {
        slice.panAmountX = slice.panAmountY = slice.panAmountZ = 0;
    }
    slice.zoomFactor = val;

    // this.axialSlice.updateZoomTransform(this.zoomFactor, this.zoomLocX, this.zoomLocY, this.panAmountX,
    //     this.panAmountY, this);
    // this.coronalSlice.updateZoomTransform(this.zoomFactor, this.zoomLocX, this.zoomLocZ, this.panAmountX,
    //     this.panAmountZ, this);
    // this.sagittalSlice.updateZoomTransform(this.zoomFactor, this.zoomLocY, this.zoomLocZ, this.panAmountY,
    //     this.panAmountZ, this);
    // this.drawViewer(false, true);
    this.updateWindowTitle();
};



papaya.viewer.Viewer.prototype.getZoomString = function () {
    return (parseInt(this.zoomFactor * 100, 10) + "%");
};



papaya.viewer.Viewer.prototype.isZooming = function () {
    return (this.zoomFactor > 1);
};



papaya.viewer.Viewer.prototype.setZoomLocation = function (coord, slice) {
    console.log('setZoomLocation', coord);
    slice.zoomLocX = coord.x;
    slice.zoomLocY = coord.y;
    slice.zoomLocZ = coord.z;

    // slice.updateZoomTransform();

    // this.axialSlice.updateZoomTransform(this.zoomFactor, this.zoomLocX, this.zoomLocY, this.panAmountX,
    //     this.panAmountY, this);
    // this.coronalSlice.updateZoomTransform(this.zoomFactor, this.zoomLocX, this.zoomLocZ, this.panAmountX,
    //     this.panAmountZ, this);
    // this.sagittalSlice.updateZoomTransform(this.zoomFactor, this.zoomLocY, this.zoomLocZ, this.panAmountY,
    //     this.panAmountZ, this);
    // this.drawViewer(false, true);
};



papaya.viewer.Viewer.prototype.setStartPanLocation = function (imageCoord, slice) {
    var temp;
    var sliceDirection = slice.sliceDirection;
    console.log('setStartPanLocation');
    slice.panLocX = imageCoord.x;
    slice.panLocY = imageCoord.y;
    slice.panLocZ = imageCoord.z;
    // if (this.zoomFactor > 1) {
    // if (true) {
    //     if (sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
    //         slice.panLocX = xLoc;
    //         slice.panLocY = yLoc;
    //         slice.panLocZ = this.axialSlice.currentSlice;
    //     } else if (sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
    //         slice.panLocX = xLoc;
    //         slice.panLocY = this.coronalSlice.currentSlice;
    //         slice.panLocZ = yLoc;
    //     } else if (sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
    //         slice.panLocX = this.sagittalSlice.currentSlice;
    //         temp = xLoc;  // because of dumb IDE warning
    //         slice.panLocY = temp;
    //         slice.panLocZ = yLoc;
    //     }
    // }
};



papaya.viewer.Viewer.prototype.setCurrentPanLocation = function (imageCoord, slice) {
    var updatePanAmmount = function (slice) {
        // if (slice.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
        //     slice.panAmountX += (xLoc - slice.panLocX);
        //     slice.panAmountY += (yLoc - slice.panLocY);
        //     slice.panAmountZ = 0;
        // } else if (slice.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
        //     slice.panAmountX += (xLoc - slice.panLocX);
        //     slice.panAmountY = 0;
        //     slice.panAmountZ += (yLoc - slice.panLocZ);
        // } else if (slice.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
        //     slice.panAmountX = 0;
        //     slice.panAmountY += (xLoc - slice.panLocY);
        //     slice.panAmountZ += (yLoc - slice.panLocZ);
        // }
        slice.panAmountX += (imageCoord.x - slice.panLocX);
        slice.panAmountY += (imageCoord.y - slice.panLocY);
        slice.panAmountZ += (imageCoord.z - slice.panLocZ);
    }
    // if (this.zoomFactor > 1) {
    //     if (sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
    //         this.panAmountX += (xLoc - this.panLocX);
    //         this.panAmountY += (yLoc - this.panLocY);
    //         this.panAmountZ = 0;
    //     } else if (sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
    //         this.panAmountX += (xLoc - this.panLocX);
    //         this.panAmountY = 0;
    //         this.panAmountZ += (yLoc - this.panLocZ);
    //     } else if (sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
    //         this.panAmountX = 0;
    //         this.panAmountY += (xLoc - this.panLocY);
    //         this.panAmountZ += (yLoc - this.panLocZ);
    //     }
    // this.axialSlice.updateZoomTransform(this.zoomFactor, this.zoomLocX, this.zoomLocY, this.panAmountX,
    //     this.panAmountY, this);
    // this.coronalSlice.updateZoomTransform(this.zoomFactor, this.zoomLocX, this.zoomLocZ, this.panAmountX,
    //     this.panAmountZ, this);
    // this.sagittalSlice.updateZoomTransform(this.zoomFactor, this.zoomLocY, this.zoomLocZ, this.panAmountY,
    //     this.panAmountZ, this);
    updatePanAmmount(slice);
    slice.updateZoomTransform();
    if (this.screenCurve.hasPoint()) this.screenCurve.buildPointsArray();
    this.drawViewer(false, true);
    // console.log('panAmount', [this.panAmountX, this.panAmountY, this.panAmountZ]);
    // console.log('panLoc', [this.panLocX, this.panLocY, this.panLocZ]);
};



papaya.viewer.Viewer.prototype.isWorldMode = function () {
    return this.worldSpace;
};



papaya.viewer.Viewer.prototype.isRadiologicalMode = function () {
    return (this.container.preferences.radiological === "Yes");
};



papaya.viewer.Viewer.prototype.isCollapsable = function () {
    return this.container.collapsable;
};



papaya.viewer.Viewer.prototype.mainSliderControlChanged = function () {
    if (this.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
        this.currentCoord.z = parseInt(this.mainSliderControl.val(), 10);
    } else if (this.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
        this.currentCoord.y = parseInt(this.mainSliderControl.val(), 10);
    } else if (this.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
        this.currentCoord.x = parseInt(this.mainSliderControl.val(), 10);
    }

    this.gotoCoordinate(this.currentCoord);
};



papaya.viewer.Viewer.prototype.axialSliderControlChanged = function () {
    this.currentCoord.z = parseInt(this.axialSliderControl.val(), 10);
    this.gotoCoordinate(this.currentCoord);
};



papaya.viewer.Viewer.prototype.coronalSliderControlChanged = function () {
    this.currentCoord.y = parseInt(this.coronalSliderControl.val(), 10);
    this.gotoCoordinate(this.currentCoord);
};



papaya.viewer.Viewer.prototype.sagittalSliderControlChanged = function () {
    this.currentCoord.x = parseInt(this.sagittalSliderControl.val(), 10);
    this.gotoCoordinate(this.currentCoord);
};



papaya.viewer.Viewer.prototype.seriesSliderControlChanged = function () {
    this.currentScreenVolume.setTimepoint(parseInt(this.seriesSliderControl.val(), 10));
    if (this.currentScreenVolume.isOverlay() && this.container.syncOverlaySeries) {
        this.reconcileOverlaySeriesPoint(this.currentScreenVolume);
    }

    this.timepointChanged();
};



papaya.viewer.Viewer.prototype.updateSliceSliderControl = function () {
    if (this.mainSliderControl) {
        this.doUpdateSliceSliderControl(this.mainSliderControl, this.mainImage.sliceDirection);
    }

    if (this.axialSliderControl) {
        this.doUpdateSliceSliderControl(this.axialSliderControl, papaya.viewer.ScreenSlice.DIRECTION_AXIAL);
    }

    if (this.coronalSliderControl) {
        this.doUpdateSliceSliderControl(this.coronalSliderControl, papaya.viewer.ScreenSlice.DIRECTION_CORONAL);
    }

    if (this.sagittalSliderControl) {
        this.doUpdateSliceSliderControl(this.sagittalSliderControl, papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL);
    }

    if (this.seriesSliderControl) {
        this.doUpdateSliceSliderControl(this.seriesSliderControl, papaya.viewer.ScreenSlice.DIRECTION_TEMPORAL);
    }
};




papaya.viewer.Viewer.prototype.doUpdateSliceSliderControl = function (slider, direction) {
    if (this.initialized) {
        slider.prop("disabled", false);
        slider.prop("min", "0");
        slider.prop("step", "1");

        if (direction === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
            slider.prop("max", (this.volume.header.imageDimensions.zDim - 1).toString());
            slider.val(this.currentCoord.z);
        } else if (direction === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
            slider.prop("max", (this.volume.header.imageDimensions.yDim - 1).toString());
            slider.val(this.currentCoord.y);
        } else if (direction === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
            slider.prop("max", (this.volume.header.imageDimensions.xDim - 1).toString());
            slider.val(this.currentCoord.x);
        } else if (direction === papaya.viewer.ScreenSlice.DIRECTION_TEMPORAL) {
            slider.prop("max", (this.currentScreenVolume.volume.header.imageDimensions.timepoints - 1).toString());
            slider.val(this.currentScreenVolume.currentTimepoint);
        }
    } else {
        slider.prop("disabled", true);
        slider.prop("min", "0");
        slider.prop("step", "1");
        slider.prop("max", "1");
        slider.val(0);
    }
};



papaya.viewer.Viewer.prototype.incrementSeriesPoint = function () {
    this.currentScreenVolume.incrementTimepoint();

    if (this.currentScreenVolume.isOverlay() && this.container.syncOverlaySeries) {
        this.reconcileOverlaySeriesPoint(this.currentScreenVolume);
    }

    this.timepointChanged();
};



papaya.viewer.Viewer.prototype.decrementSeriesPoint = function () {
    this.currentScreenVolume.decrementTimepoint();

    if (this.currentScreenVolume.isOverlay() && this.container.syncOverlaySeries) {
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



papaya.viewer.Viewer.prototype.hasParametricPair = function (index) {
    if (index) {
        return (this.screenVolumes[index].negativeScreenVol !== null);
    } else {
        return false;
    }
};


papaya.viewer.Viewer.prototype.getScreenVolumeIndex = function (screenVol) {
    var ctr;

    if (screenVol) {
        for (ctr = 0; ctr < this.screenVolumes.length; ctr += 1) {
            if (screenVol === this.screenVolumes[ctr]) {
                return ctr;
            }
        }
    }

    return -1;
};



papaya.viewer.Viewer.prototype.getScreenVolumeByName = function (name) {
    var ctr;

    for (ctr = 0; ctr < this.screenVolumes.length; ctr += 1) {
        if (name == this.screenVolumes[ctr].volume.fileName) {
            return this.screenVolumes[ctr];
        }
    }

    return null;
};



papaya.viewer.Viewer.prototype.isShowingRuler = function () {
    return (this.container.preferences.showRuler === "Yes");
};



papaya.viewer.Viewer.prototype.isShowingOrientation = function () {
    return (this.container.preferences.showOrientation === "Yes");
};



papaya.viewer.Viewer.prototype.isShowingCrosshairs = function () {
    return (this.container.preferences.showCrosshairs === "Yes");
};



papaya.viewer.Viewer.prototype.isShowingSurfacePlanes = function () {
    return (this.surfaceView && this.surfaceView.showSurfacePlanes);
};



papaya.viewer.Viewer.prototype.isShowingSurfaceCrosshairs = function () {
    return (this.surfaceView && this.surfaceView.showSurfaceCrosshairs);
};



papaya.viewer.Viewer.prototype.restart = function (refs, forceUrl, forceEncode, forceBinary) {
    this.resetViewer();
    this.container.toolbar.updateImageButtons();
    this.loadImage(refs, forceUrl, forceEncode, forceBinary);
};



papaya.viewer.Viewer.prototype.removeOverlay = function (imageIndex) {
    var screenVol, screenVolNeg;

    screenVol = this.container.viewer.screenVolumes[imageIndex];
    screenVolNeg = screenVol.negativeScreenVol;

    this.closeOverlayByRef(screenVol);

    if (this.container.combineParametric) {
        this.closeOverlayByRef(screenVolNeg);
    }

    this.drawViewer(true, false);
};



papaya.viewer.Viewer.prototype.toggleOverlay = function (imageIndex) {
    var screenVol, screenVolNeg;

    screenVol = this.container.viewer.screenVolumes[imageIndex];
    screenVol.hidden = !screenVol.hidden;

    screenVolNeg = screenVol.negativeScreenVol;

    if (this.container.combineParametric && screenVolNeg) {
        screenVolNeg.hidden = !screenVolNeg.hidden;
    }

    this.drawViewer(true, false);

    return screenVol.hidden;
};



papaya.viewer.Viewer.prototype.addParametric = function (imageIndex) {
    var screenVol = this.container.viewer.screenVolumes[imageIndex],
        overlayNeg;

    if (screenVol.negativeScreenVol === null) {
        this.screenVolumes[this.screenVolumes.length] = overlayNeg = new papaya.viewer.ScreenVolume(screenVol.volume,
            {}, papaya.viewer.ColorTable.PARAMETRIC_COLOR_TABLES[1].name, false, true, this.currentCoord);
        screenVol.negativeScreenVol = overlayNeg;

        this.setCurrentScreenVol(this.screenVolumes.length - 1);
        this.drawViewer(true, false);
        this.container.toolbar.buildToolbar();
        this.container.toolbar.updateImageButtons();
    }
};

//Modified 15/01/2020: add method to transform coordinate from rotated image to non-rotated image

papaya.viewer.Viewer.prototype.getCoordinateFromRotatedSlice = function (angle, x, y, originX, originY, inverse, debug) {
    // We need to map the coordinate of the non-rotated image (resulted from rotating the localizers) to that of the rotated image
    // Using Rotation of axes method from https://en.wikipedia.org/wiki/Rotation_of_axes
    // Angle in radians
    // x, y is screen position
    // if (this.draggingSliceDir === 1) console.table([angle, x, y, originX, originY]);

    // var epsilon = 0.001;
    var round = function roundToTwo(num) {    
        return +(Math.round(num + "e+2")  + "e-2");
    }
    x = round(x);
    y = round(y);
    originX = round(originX);
    originY = round(originY);
    var newX, newY;
    // if (inverse){
    //     newX = Math.floor((x - originX)) * Math.cos(angle) - Math.floor((y - originY)) * Math.sin(angle);
    //     newY = Math.floor((x - originX)) * Math.sin(angle) + Math.floor((y - originY)) * Math.cos(angle);
    // } else {
    //     newX = Math.floor((x - originX)) * Math.cos(angle) + Math.floor((y - originY)) * Math.sin(angle);
    //     newY = - Math.floor((x - originX)) * Math.sin(angle) + Math.floor((y - originY)) * Math.cos(angle);
    // }
    if (inverse){
        newX = (x - originX) * Math.cos(angle) - (y - originY) * Math.sin(angle);
        newY = (x - originX) * Math.sin(angle) + (y - originY) * Math.cos(angle);
    } else {
        newX = (x - originX) * Math.cos(angle) + (y - originY) * Math.sin(angle);
        newY = - (x - originX) * Math.sin(angle) + (y - originY) * Math.cos(angle);
    }
    if (debug) console.table({angle: this.volume.transform.localizerAngleAxial, 
        xLoc: x, 
        yLoc: y, 
        originX: originX, 
        originY: originY, 
        newX: newX + originX, 
        newY: newY + originY});

    return [round(newX + originX), round(newY + originY)];
}

papaya.viewer.Viewer.prototype.convertImageToScreenCoordinateX = function (screenSlice, xLoc) {
    return (screenSlice.finalTransform[0][2] + (xLoc + 0.5) *
    screenSlice.finalTransform[0][0]);
}

papaya.viewer.Viewer.prototype.convertImageToScreenCoordinateY = function (screenSlice, yLoc) {
    return (screenSlice.finalTransform[1][2] + (yLoc + 0.5) *
    screenSlice.finalTransform[1][1]);
}

// Modified 16/01/2020: add localizer detection
papaya.viewer.Viewer.prototype.detectLocalizer = function (screenSlice, mouseX, mouseY) {
    // console.log(localizerLines);
    // console.log(mouseX, mouseY);
    // console.log(screenSlice);
    if (!screenSlice) return;
    var localizerLines = screenSlice.localizerLines;
    var localizerCenter = screenSlice.localizerCenter;

    var tolerance = this.currentDetectionRadius; // pixels
    linearInterpolation = function (x, y, t) {
        return (x + t * (y - x));
    };
    getPointNearest = function (line, x, y) {
        var dx = line.xEnd - line.xStart;
        var dy = line.yEnd - line.yStart;
        var t = ((x - line.xStart) * dx + (y - line.yStart) * dy) / (dx*dx + dy*dy);
        var point = {
            x: this.linearInterpolation(line.xStart, line.xEnd, t),
            y: this.linearInterpolation(line.yStart, line.yEnd, t),
        }
        return point;
    };
    getCenterDectection = function (center, x, y, radius) {
        var distance = (center.x - x) * (center.x - x) + (center.y - y) * (center.y - y);

        radius *= radius;
        if (distance < radius) return true;
        else return false;
    }

    var line0 = {
        xStart: localizerLines.xStart[0],
        yStart: localizerLines.yStart[0],
        xEnd: localizerLines.xEnd[0],
        yEnd: localizerLines.yEnd[0],
    };
    var line1 = {
        xStart: localizerLines.xStart[1],
        yStart: localizerLines.yStart[1],
        xEnd: localizerLines.xEnd[1],
        yEnd: localizerLines.yEnd[1],
    };

    var linePoint0 = getPointNearest(line0, mouseX, mouseY);
    var linePoint1 = getPointNearest(line1, mouseX, mouseY);

    var dx = [], dy = [];
    var distance = [];

    dx[0] = mouseX - linePoint0.x;
    dx[1] = mouseX - linePoint1.x;

    dy[0] = mouseY - linePoint0.y;
    dy[1] = mouseY - linePoint1.y;

    distance[0] = Math.abs(Math.sqrt(dx[0]*dx[0] + dy[0]*dy[0]));
    distance[1] = Math.abs(Math.sqrt(dx[1]*dx[1] + dy[1]*dy[1]));
    if (getCenterDectection(localizerCenter, mouseX, mouseY, tolerance)) return 2;
    else if (distance[0] < tolerance || distance[1] < tolerance) return 1;
    else return 0;
}

papaya.viewer.Viewer.prototype.changeCursor = function (condition) {
    switch (condition) {
        case 1:
            document.body.style.cursor = 'pointer';
            break;
        case 2:
            document.body.style.cursor = 'move';
            break;
        case 3:
            document.body.style.cursor = 'default';
            break;
        default:
            document.body.style.cursor = 'default';
            break;
    }
}

papaya.viewer.Viewer.prototype.getRotatingAngle = function (slice, preX, preY, mouseX, mouseY) {
    var center = slice.localizerCenter;
    this.updateOffsetRect();
    mouseX -= this.canvasRect.left;
    mouseY -= this.canvasRect.top;
    preX -= this.canvasRect.left;
    preY -= this.canvasRect.top;
    var currentAngle = Math.atan2(mouseY - center.y, mouseX - center.x) * 180 / Math.PI;
    var prevAngle = Math.atan2(preY - center.y, preX - center.x) * 180 / Math.PI
    // reverse angle for axial since in Radiological mode Axial slice is flipped
    if (slice.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) return prevAngle - currentAngle;
    else return currentAngle - prevAngle;
}

papaya.viewer.Viewer.prototype.updateCurrentInteractingSlice = function (mouseX, mouseY) {
    // detect current slice based on current mouse position
    // Different from this.findCLickedSlice() since this doesn't account for the image in the viewport,
    // meaning it will detect if the mouse is INSIDE VIEWPORT, not INSIDE IMAGE like findClickedSlice()
    // console.log(this.screenLayout);
    // var currentSlice = null;
    for (var i = 0; i < this.screenLayout.length; i++) {
        if (this.screenLayout[i]) {
            if ((mouseX <= this.screenLayout[i].screenOffsetX + this.screenLayout[i].screenWidth && mouseX >= this.screenLayout[i].screenOffsetX)
            && (mouseY <= this.screenLayout[i].screenOffsetY + this.screenLayout[i].screenHeight && mouseY >= this.screenLayout[i].screenOffsetY)) {
                this.currentInteractingSlice = this.screenLayout[i];
                // console.log('sliceDetection', currentSlice);
            }
        }
    }
    // console.log('sliceDetection', currentSlice);
    // this.currentInteractingSlice = currentSlice;
}

papaya.viewer.Viewer.prototype.updateCurrentScreenLayout = function () {
    this.screenLayout = [];
    if (this.mainImage) this.screenLayout.push(this.mainImage);
    if (this.lowerImageTop) this.screenLayout.push(this.lowerImageTop);
    if (this.lowerImageBot) this.screenLayout.push(this.lowerImageBot);
    if (this.lowerImageBot2) this.screenLayout.push(this.lowerImageBot2);
}

papaya.viewer.Viewer.prototype.getSliceCenterPosition = function (slice, isAbsolute) {
    // get canvas center position
    // viewer.volume.transform.localizerAngleAxial
    // var xCenter = slice.screenOffsetX + (slice.screenWidth / 2);
    // var yCenter = slice.screenOffsetY + (slice.screenHeight / 2);
    var xCenter, yCenter
    if (isAbsolute) {
        xCenter = slice.screenOffsetX + (slice.screenWidth / 2);
        yCenter = slice.screenOffsetY + (slice.screenHeight / 2);
    } else {
        switch (slice.sliceDirection) {
            case papaya.viewer.ScreenSlice.DIRECTION_AXIAL:
                xCenter = (slice.finalTransform[0][2] + (this.volume.transform.centerCoord.x + 0.5) *
                slice.finalTransform[0][0]);
                yCenter = (slice.finalTransform[1][2] + (this.volume.transform.centerCoord.y + 0.5) *
                slice.finalTransform[1][1]);
                break;
            case papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL:
                xCenter = (slice.finalTransform[0][2] + (this.volume.transform.centerCoord.y + 0.5) *
                slice.finalTransform[0][0]);
                yCenter = (slice.finalTransform[1][2] + (this.volume.transform.centerCoord.z + 0.5) *
                slice.finalTransform[1][1]);
                break;
            case papaya.viewer.ScreenSlice.DIRECTION_CORONAL:
                xCenter = (slice.finalTransform[0][2] + (this.volume.transform.centerCoord.x + 0.5) *
                slice.finalTransform[0][0]);
                yCenter = (slice.finalTransform[1][2] + (this.volume.transform.centerCoord.z + 0.5) *
                slice.finalTransform[1][1]);
                break;
            default:
                break;
        }
    }
    return {x: xCenter, y: yCenter};
}

papaya.viewer.Viewer.prototype.restoreViewer = function () {
    // this.screenVolumes[0].resetTransform();
    // console.log('restoreViewer', reactPapayaViewport);
    this.currentCoord.setCoordinate(papayaFloorFast(this.volume.getXDim() / 2), papayaFloorFast(this.volume.getYDim() / 2),
    papayaFloorFast(this.volume.getZDim() / 2));
    this.volume.reset(this.currentCoord);
    this.screenVolumes[0].resetScreenRange();
    this.resetSliceZoomTransform();
    this.resetSliceRulers();
    // this.volume.reset(this.currentCoord);
    this.screenCurve.clearPoints(true);
    // papaya.Container.resetViewer(this.container.containerIndex, this.container.params);
    // console.log('restoreViewer after', reactPapayaViewport);
    // window.papayaContainers[0].viewer.reactPapayaViewport = reactPapayaViewport;
    this.updateScreenSliceTransforms();
    this.obliqueView = null;
    this.cmprSlice = null;
    this.mainImage = this.axialSlice;
    this.lowerImageTop = this.sagittalSlice;
    this.lowerImageBot = this.coronalSlice;
    this.lowerImageBot2 = null;
    console.log('screenLayout before', this.screenLayout);
    this.viewsChanged();
    console.log('screenLayout after', this.screenLayout);
    this.drawViewer(true, false);
}

papaya.viewer.Viewer.prototype.resetSliceZoomTransform = function () {
    // this.screenVolumes[0].resetTransform();
    // console.log('restoreViewer', reactPapayaViewport);
    this.screenLayout.forEach(function (slice) {
        slice.resetZoomTransform();
    });
}

papaya.viewer.Viewer.prototype.resetSliceRulers = function () {
    // this.screenVolumes[0].resetTransform();
    // console.log('restoreViewer', reactPapayaViewport);
    this.screenLayout.forEach(function (slice) {
        slice.rulerPoints = [null, null];
    });
}

papaya.viewer.Viewer.prototype.convertMouseCoordToCanvas = function (mouseX, mouseY) {
    this.updateOffsetRect();
    mouseX -= this.canvasRect.left;
    mouseY -= this.canvasRect.top;
    return {x: mouseX, y: mouseY};
}

papaya.viewer.Viewer.prototype.getXYImageCoordinate = function (slice) {
    var coord = null;
    switch (slice.sliceDirection) {
        case papaya.viewer.ScreenSlice.DIRECTION_AXIAL:
            coord = { x: this.cursorPosition.x, y: this.cursorPosition.y, z: this.cursorPosition.z}
            return coord;
        case papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL:
            coord = { x: this.cursorPosition.y, y: this.cursorPosition.z, z: this.cursorPosition.x}
            return coord;
        case papaya.viewer.ScreenSlice.DIRECTION_CORONAL:
            coord = { x: this.cursorPosition.x, y: this.cursorPosition.z, z: this.cursorPosition.y}
            return coord;
        case papaya.viewer.ScreenSlice.DIRECTION_CURVED:
            coord = { x: undefined, y: undefined }
            return coord;
        default:
            return false;
    }
}

papaya.viewer.Viewer.prototype.onCurveUpdated = function () {
    if (!this.cmprSlice) this.initializeCMPRView();
    // console.log('onCurveUpdated', this.screenCurve.initialized);
    // if (this.screenCurve.initialized) {
    //     // console.log('oncurveUpdated initialized');
    //     this.screenCurve.drawCurve(this.contextAnnotation, this.canvasAnnotation, this.screenCurve.slice.finalTransform);
    //     this.screenCurve.buildPapayaCurveSegments();
    //     this.cmprSlice.updateObliqueSlice(this.screenCurve.papayaCoordCurveSegments, this.screenCurve.slice.sliceDirection);
    //     this.calculateScreenSliceTransforms();
    //     this.drawViewer();
    // } else {
    //     this.calculateScreenSliceTransforms(); // run again to get correct transform calculation
    // }
    this.screenVolumes[0].volume.transform.setObliqueMat(this.screenCurve.slice.sliceDirection);
    this.screenCurve.drawCurve(this.contextAnnotation, this.canvasAnnotation, this.screenCurve.slice.finalTransform);
    this.screenCurve.buildPapayaCurveSegments();
    this.cmprSlice.updateObliqueSlice(this.screenCurve.papayaCoordCurveSegments, this.screenCurve.slice.sliceDirection);
    this.calculateScreenSliceTransforms();
    if (!this.screenCurve.initialized) this.calculateScreenSliceTransforms(); // run again to get correct transform calculation
    if (this.screenCurve.hasPoint()) this.drawViewer(true, true);
}

papaya.viewer.Viewer.prototype.getSliceLabel = function (sliceDiretion) {
    switch (sliceDirection) {
        case papaya.viewer.ScreenSlice.DIRECTION_AXIAL:
            return 'AXIAL';
        case papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL:
            return 'SAGITTAL';
        case papaya.viewer.ScreenSlice.DIRECTION_CORONAL:
            return 'CORONAL';
        case papaya.viewer.ScreenSlice.DIRECTION_CURVED:
            return 'CURVED SURFACE';
        default:
            return '';
    }
}

papaya.viewer.Viewer.prototype.onMainImageChanged = function () {
    // console.log('set onMainImageChanged');
    // this function must be called before drawViewer, since it tells the viewer to decide whether to replace final image or not
    // if viewer doesnt replace image, Papaya will update the slice's content and draw image as usual
    if (this.reactViewerConnector.PapayaViewport.props.viewportSpecificData.intensityActive) this.reactViewerConnector.PapayaViewport.setState({ onMainImageChanged: true });
    this.reactViewerConnector.mainImageChanged = false;
}

papaya.viewer.Viewer.prototype.suspendSliceUpdate = function () {
    this.reactViewerConnector.imageReplacedExternally = true;
}

// performance test

papaya.viewer.Viewer.prototype.updateSliceTest = function () {
    this.isPerformanceTest = true;
    var maxDim = this.volume.header.imageDimensions.zDim;
    console.log('Testing for slice direction:', this.axialSlice.sliceDirection);
    console.log('Numbers of worker:', this.axialSlice.numOfWorkers ? this.axialSlice.numOfWorkers : 0);
    console.log('Num of images:', maxDim);
    console.time('updateAllSlices');
    this.axialSlice.updateSlice(0, true);
}

papaya.viewer.Viewer.prototype.onTestEnd = function () {
    var maxDim = this.volume.header.imageDimensions.zDim;
    // console.log('Update slice count:', this.updateSliceCount);
    this.updateSliceCount++;
    if (this.updateSliceCount >= maxDim) {
        console.timeEnd('updateAllSlices');
        this.isPerformanceTest = false;
        this.updateSliceCount = 0;
        return;
    } else this.axialSlice.updateSlice(this.updateSliceCount, true);
}

papaya.viewer.Viewer.prototype.testRotateOblique = function (angle) {
    
    var transform = this.screenVolumes[0].volume.transform;
    var axis = papaya.utilities.MathUtils.normalizeVector(this.screenCurve.getAxisVector());
    var centerCoord = this.screenCurve.getAxisCenter();
    if (!this.cmprSlice.curveSegments) this.cmprSlice.curveSegments = this.screenCurve.papayaCoordCurveSegments;
    console.log('Rotate axis', axis);
    console.log('Center coord', centerCoord);
    console.log('Curve segments', this.screenCurve.papayaCoordCurveSegments);
    this.screenVolumes[0].updateCenterMat(centerCoord);
    // copy the first 3 rows and columns of rotation mat
    transform.rotateObliqueSlice(angle, axis);
    var rotMat = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (var i = 0; i < 3; i++) {
        for (var j = 0; j < 3; j++) {
            rotMat[i][j] = transform.rotMatOblique[i][j];
        }
    }
    console.log('Rotation mat', rotMat);
    for (var i = 0; i < this.cmprSlice.curveSegments.points.length; i++) {
        var pointVector = [[this.cmprSlice.curveSegments.points[i].x], [this.cmprSlice.curveSegments.points[i].y], [this.cmprSlice.curveSegments.points[i].z]];
        var rotatedPoint = papaya.utilities.MatrixUtils.multiplyMatrices(rotMat, pointVector);
        this.cmprSlice.curveSegments.points[i] = new papaya.core.Coordinate(rotatedPoint[0], rotatedPoint[1], rotatedPoint[2]);
    }
    console.log('Curve segments after', this.cmprSlice.curveSegments);
    this.cmprSlice.updateObliqueSlice(this.cmprSlice.curveSegments, this.screenCurve.slice.sliceDirection);
    this.calculateScreenSliceTransforms();
    if (!this.screenCurve.initialized) this.calculateScreenSliceTransforms(); // run again to get correct transform calculation
    if (this.screenCurve.hasPoint()) this.drawViewer(true, true);
}
