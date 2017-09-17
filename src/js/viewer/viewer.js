
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
    this.surfaceView = null;
    this.selectedSlice = null;
    this.mainImage = null;
    this.lowerImageBot2 = null;
    this.lowerImageBot = null;
    this.lowerImageTop = null;
    this.viewerDim = 0;
    this.worldSpace = false;
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
};


/*** Static Pseudo-constants ***/

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
        if (loadableImages) {
            for (ctr = 0; ctr < loadableImages.length; ctr += 1) {
                imageRefs.push(loadableImages[ctr].encode);
            }
        }

        this.volume.readBinaryData(imageRefs, papaya.utilities.ObjectUtils.bind(this, this.initializeViewer));
    } else if (forceEncode) {
        if (loadableImages) {
            for (ctr = 0; ctr < loadableImages.length; ctr += 1) {
                imageRefs.push(loadableImages[ctr].encode);
            }
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

        this.canvas.addEventListener("mousemove", this.listenerMouseMove, false);
        this.canvas.addEventListener("mousedown", this.listenerMouseDown, false);
        this.canvas.addEventListener("mouseout", this.listenerMouseOut, false);
        this.canvas.addEventListener("mouseleave", this.listenerMouseLeave, false);
        this.canvas.addEventListener("mouseup", this.listenerMouseUp, false);
        document.addEventListener("keydown", this.listenerKeyDown, true);
        document.addEventListener("keyup", this.listenerKeyUp, true);
        this.canvas.addEventListener("touchmove", this.listenerTouchMove, false);
        this.canvas.addEventListener("touchstart", this.listenerTouchStart, false);
        this.canvas.addEventListener("touchend", this.listenerTouchEnd, false);
        this.canvas.addEventListener("dblclick", this.listenerMouseDoubleClick, false);
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
            this.worldSpace = true;
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
    this.updateOffsetRect();
    xLoc = xLoc - this.canvasRect.left;
    yLoc = yLoc - this.canvasRect.top;

    if (this.mainImage === this.axialSlice) {
        return this.insideScreenSlice(this.axialSlice, xLoc, yLoc, this.volume.getXDim(), this.volume.getYDim());
    } else if (this.mainImage === this.coronalSlice) {
        return this.insideScreenSlice(this.coronalSlice, xLoc, yLoc, this.volume.getXDim(), this.volume.getZDim());
    } else if (this.mainImage === this.sagittalSlice) {
        return this.insideScreenSlice(this.sagittalSlice, xLoc, yLoc, this.volume.getYDim(), this.volume.getZDim());
    }

    return false;
};



papaya.viewer.Viewer.prototype.updatePosition = function (viewer, xLoc, yLoc, crosshairsOnly) {
    var xImageLoc, yImageLoc, temp, originalX, originalY, surfaceCoord;

    viewer.updateOffsetRect();
    originalX = xLoc;
    originalY = yLoc;
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
    } else if (this.insideScreenSlice(viewer.coronalSlice, xLoc, yLoc, viewer.volume.getXDim(),
            viewer.volume.getZDim())) {
        if (!this.isDragging || (this.draggingSliceDir === papaya.viewer.ScreenSlice.DIRECTION_CORONAL)) {
            xImageLoc = this.convertScreenToImageCoordinateX(xLoc, viewer.coronalSlice);
            yImageLoc = this.convertScreenToImageCoordinateY(yLoc, viewer.coronalSlice);

            if ((xImageLoc !== viewer.currentCoord.x) || (yImageLoc !== viewer.currentCoord.y)) {
                viewer.currentCoord.x = xImageLoc;
                viewer.currentCoord.z = yImageLoc;
                this.draggingSliceDir = papaya.viewer.ScreenSlice.DIRECTION_CORONAL;
            }
        }
    } else if (this.insideScreenSlice(viewer.sagittalSlice, xLoc, yLoc, viewer.volume.getYDim(),
            viewer.volume.getZDim())) {
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
    } else if (viewer.surfaceView && this.insideScreenSlice(viewer.surfaceView, xLoc, yLoc, viewer.surfaceView.screenDim,
            viewer.surfaceView.screenDim)) {
        viewer.surfaceView.updateDynamic(originalX, originalY, (this.selectedSlice === this.mainImage) ? 1 : 3);
    }

    this.container.coordinateChanged(this);
    viewer.drawViewer(false, crosshairsOnly);
};



papaya.viewer.Viewer.prototype.convertScreenToImageCoordinateX = function (xLoc, screenSlice) {
    return papaya.viewer.Viewer.validDimBounds(papayaFloorFast((xLoc - screenSlice.finalTransform[0][2]) / screenSlice.finalTransform[0][0]),
        screenSlice.xDim);
};



papaya.viewer.Viewer.prototype.convertScreenToImageCoordinateY = function (yLoc, screenSlice) {
    return papaya.viewer.Viewer.validDimBounds(papayaFloorFast((yLoc - screenSlice.finalTransform[1][2]) / screenSlice.finalTransform[1][1]),
        screenSlice.yDim);
};



papaya.viewer.Viewer.prototype.convertScreenToImageCoordinate = function (xLoc, yLoc, screenSlice) {
    var xImageLoc, yImageLoc, zImageLoc;

    if (screenSlice === undefined) {
        screenSlice = this.mainImage;
    }

    if (screenSlice.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
        xImageLoc = this.convertScreenToImageCoordinateX(xLoc, screenSlice);
        yImageLoc = this.convertScreenToImageCoordinateY(yLoc, screenSlice);
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
            this.container.display.drawDisplay(xImageLoc, yImageLoc, zImageLoc);
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
    }

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
        this.context.font = fontSize + "px sans-serif";
        locY = this.canvas.height - 22;
        text = "Drop here or click the File menu";
        metrics = this.context.measureText(text);
        textWidth = metrics.width;
        this.context.fillText(text, (this.canvas.width / 2) - (textWidth / 2), locY);
    }

    if (this.canvas.width > 900) {
        // draw supported formats
        fontSize = 14;
        this.context.font = fontSize + "px sans-serif";
        locY = this.canvas.height - 20;
        text = "Supported formats: NIFTI" + (papaya.Container.DICOM_SUPPORT ? ", DICOM" : "");
        this.context.fillText(text, 20, locY);

        // draw Papaya version info
        fontSize = 14;
        this.context.font = fontSize + "px sans-serif";
        locY = this.canvas.height - 20;

        text = "Papaya (Build " + PAPAYA_BUILD_NUM + ")";
        metrics = this.context.measureText(text);
        textWidth = metrics.width;
        this.context.fillText(text, this.canvas.width - textWidth - 20, locY);
    }
};



papaya.viewer.Viewer.prototype.drawViewer = function (force, skipUpdate) {
    var radiological = (this.container.preferences.radiological === "Yes"),
        showOrientation = (this.container.preferences.showOrientation === "Yes");

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

    if (this.hasSurface() && (!papaya.utilities.PlatformUtils.smallScreen || force || (this.selectedSlice === this.surfaceView))) {
        this.surfaceView.draw();
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

        if (this.hasSurface()) {
            this.drawScreenSlice(this.lowerImageBot2);
        }
    }

    if (showOrientation || radiological) {
        this.drawOrientation();
    }

    if (this.container.preferences.showCrosshairs === "Yes") {
        this.drawCrosshairs();
    }

    if (this.container.preferences.showRuler === "Yes") {
        this.drawRuler();
    }

    if (this.container.display) {
        this.container.display.drawDisplay(this.currentCoord.x, this.currentCoord.y, this.currentCoord.z);
    }

    if (this.container.contextManager && this.container.contextManager.drawToViewer) {
        this.container.contextManager.drawToViewer(this.context);
    }
};



papaya.viewer.Viewer.prototype.hasSurface = function () {
    return (this.container.hasSurface() && this.surfaceView && this.surfaceView.initialized);
};



papaya.viewer.Viewer.prototype.drawScreenSlice = function (slice) {
    var textWidth, textWidthExample, offset, padding = 5;

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
        this.context.fillRect(slice.screenOffsetX, slice.screenOffsetY, slice.screenDim, slice.screenDim);
        this.context.save();
        this.context.beginPath();
        this.context.rect(slice.screenOffsetX, slice.screenOffsetY, slice.screenDim, slice.screenDim);
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

    if (this.mainImage === this.surfaceView) {
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
    orientEndX = this.mainImage.screenOffsetX + this.mainImage.screenDim;
    orientMidX = Math.round(orientEndX / 2.0);

    orientStartY = this.mainImage.screenOffsetY;
    orientEndY = this.mainImage.screenOffsetY + this.mainImage.screenDim;
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



papaya.viewer.Viewer.prototype.drawRuler = function () {
    var ruler1x, ruler1y, ruler2x, ruler2y, text, metrics, textWidth, textHeight, padding, xText, yText;

    if (this.mainImage === this.surfaceView) {
        return;
    }

    if (this.mainImage === this.axialSlice) {
        ruler1x = (this.axialSlice.finalTransform[0][2] + (this.axialSlice.rulerPoints[0].x + 0.5) *
            this.axialSlice.finalTransform[0][0]);
        ruler1y = (this.axialSlice.finalTransform[1][2] + (this.axialSlice.rulerPoints[0].y + 0.5) *
            this.axialSlice.finalTransform[1][1]);
        ruler2x = (this.axialSlice.finalTransform[0][2] + (this.axialSlice.rulerPoints[1].x + 0.5) *
            this.axialSlice.finalTransform[0][0]);
        ruler2y = (this.axialSlice.finalTransform[1][2] + (this.axialSlice.rulerPoints[1].y + 0.5) *
            this.axialSlice.finalTransform[1][1]);
    } else if (this.mainImage === this.coronalSlice) {
        ruler1x = (this.coronalSlice.finalTransform[0][2] + (this.coronalSlice.rulerPoints[0].x + 0.5) *
            this.coronalSlice.finalTransform[0][0]);
        ruler1y = (this.coronalSlice.finalTransform[1][2] + (this.coronalSlice.rulerPoints[0].y + 0.5) *
            this.coronalSlice.finalTransform[1][1]);
        ruler2x = (this.coronalSlice.finalTransform[0][2] + (this.coronalSlice.rulerPoints[1].x + 0.5) *
            this.coronalSlice.finalTransform[0][0]);
        ruler2y = (this.coronalSlice.finalTransform[1][2] + (this.coronalSlice.rulerPoints[1].y + 0.5) *
            this.coronalSlice.finalTransform[1][1]);
    } else if (this.mainImage === this.sagittalSlice) {
        ruler1x = (this.sagittalSlice.finalTransform[0][2] + (this.sagittalSlice.rulerPoints[0].x + 0.5) *
            this.sagittalSlice.finalTransform[0][0]);
        ruler1y = (this.sagittalSlice.finalTransform[1][2] + (this.sagittalSlice.rulerPoints[0].y + 0.5) *
            this.sagittalSlice.finalTransform[1][1]);
        ruler2x = (this.sagittalSlice.finalTransform[0][2] + (this.sagittalSlice.rulerPoints[1].x + 0.5) *
            this.sagittalSlice.finalTransform[0][0]);
        ruler2y = (this.sagittalSlice.finalTransform[1][2] + (this.sagittalSlice.rulerPoints[1].y + 0.5) *
            this.sagittalSlice.finalTransform[1][1]);
    }

    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.strokeStyle = "#FF1493";
    this.context.fillStyle = "#FF1493";
    this.context.lineWidth = 2.0;
    this.context.save();
    this.context.beginPath();
    this.context.moveTo(ruler1x, ruler1y);
    this.context.lineTo(ruler2x, ruler2y);
    this.context.stroke();
    this.context.closePath();

    this.context.beginPath();
    this.context.arc(ruler1x, ruler1y, 3, 0, 2 * Math.PI, false);
    this.context.arc(ruler2x, ruler2y, 3, 0, 2 * Math.PI, false);
    this.context.fill();
    this.context.closePath();

    text = papaya.utilities.StringUtils.formatNumber(papaya.utilities.MathUtils.lineDistance(
        this.mainImage.rulerPoints[0].x * this.mainImage.xSize,
        this.mainImage.rulerPoints[0].y * this.mainImage.ySize,
        this.mainImage.rulerPoints[1].x * this.mainImage.xSize,
        this.mainImage.rulerPoints[1].y * this.mainImage.ySize), false);
    metrics = this.context.measureText(text);
    textWidth = metrics.width;
    textHeight = 14;
    padding = 2;
    xText = parseInt((ruler1x + ruler2x) / 2) - (textWidth / 2);
    yText = parseInt((ruler1y + ruler2y) / 2) + (textHeight / 2);

    this.context.fillStyle = "#FFFFFF";
    papaya.viewer.Viewer.drawRoundRect(this.context, xText - padding, yText - textHeight - padding + 1, textWidth + (padding * 2), textHeight+ (padding * 2), 5, true, false);

    this.context.font = papaya.viewer.Viewer.ORIENTATION_MARKER_SIZE + "px sans-serif";
    this.context.strokeStyle = "#FF1493";
    this.context.fillStyle = "#FF1493";
    this.context.fillText(text, xText, yText);
};



papaya.viewer.Viewer.prototype.drawCrosshairs = function () {
    var xLoc, yStart, yEnd, yLoc, xStart, xEnd;

    // initialize crosshairs
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.strokeStyle = papaya.viewer.Viewer.CROSSHAIRS_COLOR;
    this.context.lineWidth = 1.0;

    if ((this.mainImage !== this.axialSlice) || this.toggleMainCrosshairs) {
        // draw axial crosshairs
        this.context.save();
        this.context.beginPath();
        this.context.rect(this.axialSlice.screenOffsetX, this.axialSlice.screenOffsetY, this.axialSlice.screenDim,
            this.axialSlice.screenDim);
        this.context.closePath();
        this.context.clip();

        this.context.beginPath();

        xLoc = (this.axialSlice.finalTransform[0][2] + (this.currentCoord.x + 0.5) *
            this.axialSlice.finalTransform[0][0]);
        yStart = (this.axialSlice.finalTransform[1][2]);
        yEnd = (this.axialSlice.finalTransform[1][2] + this.axialSlice.yDim * this.axialSlice.finalTransform[1][1]);
        this.context.moveTo(xLoc, yStart);
        this.context.lineTo(xLoc, yEnd);

        yLoc = (this.axialSlice.finalTransform[1][2] + (this.currentCoord.y + 0.5) *
            this.axialSlice.finalTransform[1][1]);
        xStart = (this.axialSlice.finalTransform[0][2]);
        xEnd = (this.axialSlice.finalTransform[0][2] + this.axialSlice.xDim * this.axialSlice.finalTransform[0][0]);
        this.context.moveTo(xStart, yLoc);
        this.context.lineTo(xEnd, yLoc);

        this.context.closePath();
        this.context.stroke();
        this.context.restore();
    }


    if ((this.mainImage !== this.coronalSlice) || this.toggleMainCrosshairs) {
        // draw coronal crosshairs
        this.context.save();
        this.context.beginPath();
        this.context.rect(this.coronalSlice.screenOffsetX, this.coronalSlice.screenOffsetY, this.coronalSlice.screenDim,
            this.coronalSlice.screenDim);
        this.context.closePath();
        this.context.clip();

        this.context.beginPath();

        xLoc = (this.coronalSlice.finalTransform[0][2] + (this.currentCoord.x + 0.5) *
            this.coronalSlice.finalTransform[0][0]);
        yStart = (this.coronalSlice.finalTransform[1][2]);
        yEnd = (this.coronalSlice.finalTransform[1][2] + this.coronalSlice.yDim *
            this.coronalSlice.finalTransform[1][1]);
        this.context.moveTo(xLoc, yStart);
        this.context.lineTo(xLoc, yEnd);

        yLoc = (this.coronalSlice.finalTransform[1][2] + (this.currentCoord.z + 0.5) *
            this.coronalSlice.finalTransform[1][1]);
        xStart = (this.coronalSlice.finalTransform[0][2]);
        xEnd = (this.coronalSlice.finalTransform[0][2] + this.coronalSlice.xDim *
            this.coronalSlice.finalTransform[0][0]);
        this.context.moveTo(xStart, yLoc);
        this.context.lineTo(xEnd, yLoc);

        this.context.closePath();
        this.context.stroke();
        this.context.restore();
    }

    if ((this.mainImage !== this.sagittalSlice) || this.toggleMainCrosshairs) {
        // draw sagittal crosshairs
        this.context.save();
        this.context.beginPath();
        this.context.rect(this.sagittalSlice.screenOffsetX, this.sagittalSlice.screenOffsetY,
            this.sagittalSlice.screenDim, this.sagittalSlice.screenDim);
        this.context.closePath();
        this.context.clip();

        this.context.beginPath();

        xLoc = (this.sagittalSlice.finalTransform[0][2] + (this.currentCoord.y + 0.5) *
            this.sagittalSlice.finalTransform[0][0]);
        yStart = (this.sagittalSlice.finalTransform[1][2]);
        yEnd = (this.sagittalSlice.finalTransform[1][2] + this.sagittalSlice.yDim *
            this.sagittalSlice.finalTransform[1][1]);
        this.context.moveTo(xLoc, yStart);
        this.context.lineTo(xLoc, yEnd);

        yLoc = (this.sagittalSlice.finalTransform[1][2] + (this.currentCoord.z + 0.5) *
            this.sagittalSlice.finalTransform[1][1]);
        xStart = (this.sagittalSlice.finalTransform[0][2]);
        xEnd = (this.sagittalSlice.finalTransform[0][2] + this.sagittalSlice.xDim *
            this.sagittalSlice.finalTransform[0][0]);
        this.context.moveTo(xStart, yLoc);
        this.context.lineTo(xEnd, yLoc);

        this.context.closePath();
        this.context.stroke();
        this.context.restore();
    }
};



papaya.viewer.Viewer.prototype.calculateScreenSliceTransforms = function () {
    if (this.container.orthogonalTall) {
        if (this.container.hasSurface()) {
            this.viewerDim = this.canvas.height / 1.333;

            this.getTransformParameters(this.mainImage, this.viewerDim, false, 3);
            this.mainImage.screenTransform[0][2] += this.mainImage.screenOffsetX = 0;
            this.mainImage.screenTransform[1][2] += this.mainImage.screenOffsetY = 0;

            this.getTransformParameters(this.lowerImageTop, this.viewerDim, true, 3);
            this.lowerImageTop.screenTransform[0][2] += this.lowerImageTop.screenOffsetX = 0;
            this.lowerImageTop.screenTransform[1][2] += this.lowerImageTop.screenOffsetY = this.viewerDim + (papaya.viewer.Viewer.GAP);

            this.getTransformParameters(this.lowerImageBot, this.viewerDim, true, 3);
            this.lowerImageBot.screenTransform[0][2] += this.lowerImageBot.screenOffsetX = (((this.viewerDim - papaya.viewer.Viewer.GAP) / 3) + (papaya.viewer.Viewer.GAP));
            this.lowerImageBot.screenTransform[1][2] += this.lowerImageBot.screenOffsetY =  this.viewerDim + (papaya.viewer.Viewer.GAP);

            this.getTransformParameters(this.lowerImageBot2, this.viewerDim, true, 3);
            this.lowerImageBot2.screenTransform[0][2] += this.lowerImageBot2.screenOffsetX = 2 * ((((this.viewerDim - papaya.viewer.Viewer.GAP) / 3) + (papaya.viewer.Viewer.GAP)));
            this.lowerImageBot2.screenTransform[1][2] += this.lowerImageBot2.screenOffsetY =  this.viewerDim + (papaya.viewer.Viewer.GAP);
        } else {
            this.viewerDim = this.canvas.height / 1.5;

            this.getTransformParameters(this.mainImage, this.viewerDim, false, 2);
            this.mainImage.screenTransform[0][2] += this.mainImage.screenOffsetX = 0;
            this.mainImage.screenTransform[1][2] += this.mainImage.screenOffsetY = 0;

            this.getTransformParameters(this.lowerImageBot, this.viewerDim, true, 2);
            this.lowerImageBot.screenTransform[0][2] += this.lowerImageBot.screenOffsetX = 0;
            this.lowerImageBot.screenTransform[1][2] += this.lowerImageBot.screenOffsetY = this.viewerDim + (papaya.viewer.Viewer.GAP);

            this.getTransformParameters(this.lowerImageTop, this.viewerDim, true, 2);
            this.lowerImageTop.screenTransform[0][2] += this.lowerImageTop.screenOffsetX = (((this.viewerDim - papaya.viewer.Viewer.GAP) / 2) + (papaya.viewer.Viewer.GAP));
            this.lowerImageTop.screenTransform[1][2] += this.lowerImageTop.screenOffsetY =  this.viewerDim + (papaya.viewer.Viewer.GAP);
        }
    } else {
        this.viewerDim = this.canvas.height;

        if (this.container.hasSurface()) {
            this.getTransformParameters(this.mainImage, this.viewerDim, false, 3);
            this.mainImage.screenTransform[0][2] += this.mainImage.screenOffsetX = 0;
            this.mainImage.screenTransform[1][2] += this.mainImage.screenOffsetY = 0;

            this.getTransformParameters(this.lowerImageTop, this.viewerDim, true, 3);
            this.lowerImageTop.screenTransform[0][2] += this.lowerImageTop.screenOffsetX =
                (this.viewerDim + (papaya.viewer.Viewer.GAP));
            this.lowerImageTop.screenTransform[1][2] += this.lowerImageTop.screenOffsetY = 0;

            this.getTransformParameters(this.lowerImageBot, this.viewerDim, true, 3);
            this.lowerImageBot.screenTransform[0][2] += this.lowerImageBot.screenOffsetX =
                (this.viewerDim + (papaya.viewer.Viewer.GAP));
            this.lowerImageBot.screenTransform[1][2] += this.lowerImageBot.screenOffsetY =
                (((this.viewerDim - papaya.viewer.Viewer.GAP) / 3) + (papaya.viewer.Viewer.GAP));

            this.getTransformParameters(this.lowerImageBot2, this.viewerDim, true, 3);
            this.lowerImageBot2.screenTransform[0][2] += this.lowerImageBot2.screenOffsetX =
                (this.viewerDim + (papaya.viewer.Viewer.GAP));
            this.lowerImageBot2.screenTransform[1][2] += this.lowerImageBot2.screenOffsetY =
                (((this.viewerDim - papaya.viewer.Viewer.GAP) / 3) * 2 + (papaya.viewer.Viewer.GAP) * 2);
        } else {
            this.getTransformParameters(this.mainImage, this.viewerDim, false, 2);
            this.mainImage.screenTransform[0][2] += this.mainImage.screenOffsetX = 0;
            this.mainImage.screenTransform[1][2] += this.mainImage.screenOffsetY = 0;

            this.getTransformParameters(this.lowerImageBot, this.viewerDim, true, 2);
            this.lowerImageBot.screenTransform[0][2] += this.lowerImageBot.screenOffsetX =
                (this.viewerDim + (papaya.viewer.Viewer.GAP));
            this.lowerImageBot.screenTransform[1][2] += this.lowerImageBot.screenOffsetY =
                (((this.viewerDim - papaya.viewer.Viewer.GAP) / 2) + (papaya.viewer.Viewer.GAP));

            this.getTransformParameters(this.lowerImageTop, this.viewerDim, true, 2);
            this.lowerImageTop.screenTransform[0][2] += this.lowerImageTop.screenOffsetX =
                (this.viewerDim + (papaya.viewer.Viewer.GAP));
            this.lowerImageTop.screenTransform[1][2] += this.lowerImageTop.screenOffsetY = 0;
        }
    }

    this.updateScreenSliceTransforms();
};



papaya.viewer.Viewer.prototype.updateScreenSliceTransforms = function () {
    this.axialSlice.updateFinalTransform();
    this.coronalSlice.updateFinalTransform();
    this.sagittalSlice.updateFinalTransform();
};



papaya.viewer.Viewer.prototype.getTransformParameters = function (image, height, lower, factor) {
    var bigScale, scaleX, scaleY, transX, transY;

    bigScale = lower ? factor : 1;

    if (image === this.surfaceView) {
        this.surfaceView.resize(this.viewerDim / bigScale);
        return;
    }

    if (image.getRealWidth() > image.getRealHeight()) {
        scaleX = (((lower ? height - papaya.viewer.Viewer.GAP : height) / this.longestDim) / bigScale) *
            (image.getXSize() / this.longestDimSize);
        scaleY = ((((lower ? height - papaya.viewer.Viewer.GAP : height) / this.longestDim) *
            image.getYXratio()) / bigScale) * (image.getXSize() / this.longestDimSize);
    } else {
        scaleX = ((((lower ? height - papaya.viewer.Viewer.GAP : height) / this.longestDim) *
            image.getXYratio()) / bigScale) * (image.getYSize() / this.longestDimSize);
        scaleY = (((lower ? height - papaya.viewer.Viewer.GAP : height) / this.longestDim) / bigScale) *
            (image.getYSize() / this.longestDimSize);
    }

    transX = (((lower ? height - papaya.viewer.Viewer.GAP : height) / bigScale) - (image.getXDim() * scaleX)) / 2;
    transY = (((lower ? height - papaya.viewer.Viewer.GAP : height) / bigScale) - (image.getYDim() * scaleY)) / 2;

    image.screenDim = (lower ? (height - papaya.viewer.Viewer.GAP) / factor : height);
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

    if (this.hasSurface()) {
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

    this.viewsChanged();
};



papaya.viewer.Viewer.prototype.viewsChanged = function () {
    this.calculateScreenSliceTransforms();

    if (this.hasSurface()) {
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

    me.preventDefault();

    if (this.showingContextMenu) {
        this.container.toolbar.closeAllMenus();
        me.handled = true;
        return;
    }

    if ((me.target.nodeName === "IMG") || (me.target.nodeName === "CANVAS")) {
        if (me.handled !== true) {
            this.container.toolbar.closeAllMenus();

            this.previousMousePosition.x = papaya.utilities.PlatformUtils.getMousePositionX(me);
            this.previousMousePosition.y = papaya.utilities.PlatformUtils.getMousePositionY(me);

            this.findClickedSlice(this, this.previousMousePosition.x, this.previousMousePosition.y);

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
            } else if (this.isAltKeyDown && this.selectedSlice) {
                this.isZoomMode = true;

                if (this.selectedSlice === this.surfaceView) {
                    this.isPanning = this.isShiftKeyDown;
                    this.surfaceView.setStartDynamic(this.previousMousePosition.x, this.previousMousePosition.y);
                } else if (this.isZooming() && this.isShiftKeyDown) {
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
                if (this.selectedSlice && (this.selectedSlice !== this.surfaceView)) {
                    this.grabbedHandle = this.selectedSlice.findProximalRulerHandle(this.convertScreenToImageCoordinateX(this.previousMousePosition.x - this.canvasRect.left, this.selectedSlice),
                        this.convertScreenToImageCoordinateY(this.previousMousePosition.y - this.canvasRect.top, this.selectedSlice));

                    if (this.grabbedHandle === null) {
                        this.updatePosition(this, papaya.utilities.PlatformUtils.getMousePositionX(me), papaya.utilities.PlatformUtils.getMousePositionY(me), false);
                        this.resetUpdateTimer(me);
                    }
                } else if (this.selectedSlice && (this.selectedSlice === this.surfaceView)) {
                    if (this.surfaceView.findProximalRulerHandle(this.previousMousePosition.x - this.canvasRect.left,
                            this.previousMousePosition.y - this.canvasRect.top)) {

                    } else {
                        this.isPanning = this.isShiftKeyDown;
                        this.surfaceView.setStartDynamic(this.previousMousePosition.x, this.previousMousePosition.y);
                    }

                    this.container.display.drawEmptyDisplay();
                }
            }

            this.isDragging = draggingStarted;
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
            if (!this.isWindowControl && !this.isZoomMode && !this.isContextMode && (this.grabbedHandle === null) && (!this.surfaceView || (this.surfaceView.grabbedRulerPoint === -1))) {
                this.updatePosition(this, papaya.utilities.PlatformUtils.getMousePositionX(me), papaya.utilities.PlatformUtils.getMousePositionY(me));
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
    me.preventDefault();

    if (this.showingContextMenu) {
        me.handled = true;
        return;
    }

    var currentMouseX, currentMouseY, zoomFactorCurrent;

    papaya.Container.papayaLastHoveredViewer = this;

    currentMouseX = papaya.utilities.PlatformUtils.getMousePositionX(me);
    currentMouseY = papaya.utilities.PlatformUtils.getMousePositionY(me);

    if (this.isDragging) {
        if (this.grabbedHandle) {
            if (this.isInsideMainSlice(currentMouseX, currentMouseY)) {
                this.grabbedHandle.x = this.convertScreenToImageCoordinateX(currentMouseX - this.canvasRect.left, this.selectedSlice);
                this.grabbedHandle.y = this.convertScreenToImageCoordinateY(currentMouseY - this.canvasRect.top, this.selectedSlice);
                this.drawViewer(true, true);
            }
        } else if (this.isWindowControl) {
            this.windowLevelChanged(this.previousMousePosition.x - currentMouseX, this.previousMousePosition.y - currentMouseY);
            this.previousMousePosition.x = currentMouseX;
            this.previousMousePosition.y = currentMouseY;
        } else if (this.isPanning) {
            if (this.selectedSlice === this.surfaceView) {
                this.surfaceView.updateTranslateDynamic(papaya.utilities.PlatformUtils.getMousePositionX(me),
                    papaya.utilities.PlatformUtils.getMousePositionY(me), (this.selectedSlice === this.mainImage) ? 1 : 3);
                this.drawViewer(false, true);
            } else {
                this.setCurrentPanLocation(
                    this.convertScreenToImageCoordinateX(currentMouseX, this.selectedSlice),
                    this.convertScreenToImageCoordinateY(currentMouseY, this.selectedSlice),
                    this.selectedSlice.sliceDirection
                );
            }
        } else if (this.isZoomMode) {
            if (this.selectedSlice === this.surfaceView) {
                zoomFactorCurrent = ((this.previousMousePosition.y - currentMouseY) * 0.5) * this.surfaceView.scaleFactor;
                this.surfaceView.zoom += zoomFactorCurrent;
                this.previousMousePosition.x = currentMouseX;
                this.previousMousePosition.y = currentMouseY;
            } else {
                zoomFactorCurrent = ((this.previousMousePosition.y - currentMouseY) * 0.05);
                this.setZoomFactor(this.zoomFactorPrevious - zoomFactorCurrent);

                this.axialSlice.updateZoomTransform(this.zoomFactor, this.zoomLocX, this.zoomLocY, this.panAmountX,
                    this.panAmountY, this);
                this.coronalSlice.updateZoomTransform(this.zoomFactor, this.zoomLocX, this.zoomLocZ, this.panAmountX,
                    this.panAmountZ, this);
                this.sagittalSlice.updateZoomTransform(this.zoomFactor, this.zoomLocY, this.zoomLocZ, this.panAmountY,
                    this.panAmountZ, this);
            }

            this.drawViewer(true);
        } else {
            this.resetUpdateTimer(null);

            if (this.selectedSlice !== null) {
                if (this.selectedSlice === this.surfaceView) {
                    if (this.surfaceView.grabbedRulerPoint !== -1) {
                        this.surfaceView.pickRuler(currentMouseX - this.canvasRect.left,
                            currentMouseY - this.canvasRect.top);
                        this.drawViewer(false, true);
                    } else {
                        this.surfaceView.updateDynamic(papaya.utilities.PlatformUtils.getMousePositionX(me),
                            papaya.utilities.PlatformUtils.getMousePositionY(me), (this.selectedSlice === this.mainImage) ? 1 : 3);
                        this.drawViewer(false, true);
                        this.container.display.drawEmptyDisplay();
                    }
                } else {
                    this.updatePosition(this, papaya.utilities.PlatformUtils.getMousePositionX(me),
                        papaya.utilities.PlatformUtils.getMousePositionY(me));
                }
            }
        }
    } else {
        this.updateCursorPosition(this, papaya.utilities.PlatformUtils.getMousePositionX(me),
            papaya.utilities.PlatformUtils.getMousePositionY(me));
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
    }
};



papaya.viewer.Viewer.prototype.touchStartEvent = function (me) {
    if (!papaya.Container.allowPropagation) {
        me.stopPropagation();
    }

    me.preventDefault();
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

    this.drawViewer(true);
};



papaya.viewer.Viewer.prototype.gotoCoordinate = function (coor, nosync) {
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

    this.drawViewer(true);
    this.updateSliceSliderControl();

    if (nosync) {
        return;
    }

    this.container.coordinateChanged(this);
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
            this.currentScreenVolume.currentTimepoint, !interpolation);
    }
};



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
    this.volume = new papaya.volume.Volume(this.container.display, this);
    this.screenVolumes = [];
    this.surfaces = [];
    this.surfaceView = null;
    this.currentScreenVolume = null;
    this.axialSlice = null;
    this.coronalSlice = null;
    this.sagittalSlice = null;
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
    this.canvas.removeEventListener("mousemove", this.listenerMouseMove, false);
    this.canvas.removeEventListener("mousedown", this.listenerMouseDown, false);
    this.canvas.removeEventListener("mouseout", this.listenerMouseOut, false);
    this.canvas.removeEventListener("mouseleave", this.listenerMouseLeave, false);
    this.canvas.removeEventListener("mouseup", this.listenerMouseUp, false);
    document.removeEventListener("keydown", this.listenerKeyDown, true);
    document.removeEventListener("keyup", this.listenerKeyUp, true);
    document.removeEventListener("contextmenu", this.listenerContextMenu, false);
    this.canvas.removeEventListener("touchmove", this.listenerTouchMove, false);
    this.canvas.removeEventListener("touchstart", this.listenerTouchStart, false);
    this.canvas.removeEventListener("touchend", this.listenerTouchEnd, false);
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

    if (params.coordinate) {
        this.initialCoordinate = params.coordinate;
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
    var scrollSign, isSliceScroll;
/*
    if (this.container.nestedViewer || ((papayaContainers.length > 1) && !this.container.collapsable)) {
        return;
    }
*/
    e = e || window.event;

    //If the scroll event happened outside the canvas don't handle it
    if(e.target != this.canvas) {
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
            if (this.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
                this.incrementAxial(false, Math.abs(scrollSign));
            } else if (this.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
                this.incrementCoronal(false, Math.abs(scrollSign));
            } else if (this.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
                this.incrementSagittal(false, Math.abs(scrollSign));
            }

            this.gotoCoordinate(this.currentCoord);
        } else if (scrollSign > 0) {
            if (this.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
                this.incrementAxial(true, Math.abs(scrollSign));
            } else if (this.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
                this.incrementCoronal(true, Math.abs(scrollSign));
            } else if (this.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
                this.incrementSagittal(true, Math.abs(scrollSign));
            }

            this.gotoCoordinate(this.currentCoord);
        }
    } else {
        if (scrollSign !== 0) {
            this.isZoomMode = true;

            if (this.mainImage === this.surfaceView) {
                this.surfaceView.zoom += ((scrollSign * -5) * this.surfaceView.scaleFactor);
                this.drawViewer(false, true);
            } else {
                if (this.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
                    this.setZoomLocation(this.currentCoord.x, this.currentCoord.y, this.mainImage.sliceDirection);
                } else if (this.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
                    this.setZoomLocation(this.currentCoord.x, this.currentCoord.z, this.mainImage.sliceDirection);
                } else if (this.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
                    this.setZoomLocation(this.currentCoord.y, this.currentCoord.z, this.mainImage.sliceDirection);
                }

                this.setZoomFactor(this.zoomFactorPrevious + (scrollSign * 0.1 * this.zoomFactorPrevious));
            }

            this.zoomFactorPrevious = this.zoomFactor;
        }
    }
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

    this.gotoCoordinate(this.currentCoord);
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

    this.gotoCoordinate(this.currentCoord);
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

    this.axialSlice.updateZoomTransform(this.zoomFactor, this.zoomLocX, this.zoomLocY, this.panAmountX,
        this.panAmountY, this);
    this.coronalSlice.updateZoomTransform(this.zoomFactor, this.zoomLocX, this.zoomLocZ, this.panAmountX,
        this.panAmountZ, this);
    this.sagittalSlice.updateZoomTransform(this.zoomFactor, this.zoomLocY, this.zoomLocZ, this.panAmountY,
        this.panAmountZ, this);
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

        this.axialSlice.updateZoomTransform(this.zoomFactor, this.zoomLocX, this.zoomLocY, this.panAmountX,
            this.panAmountY, this);
        this.coronalSlice.updateZoomTransform(this.zoomFactor, this.zoomLocX, this.zoomLocZ, this.panAmountX,
            this.panAmountZ, this);
        this.sagittalSlice.updateZoomTransform(this.zoomFactor, this.zoomLocY, this.zoomLocZ, this.panAmountY,
            this.panAmountZ, this);
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

        this.axialSlice.updateZoomTransform(this.zoomFactor, this.zoomLocX, this.zoomLocY, this.panAmountX,
            this.panAmountY, this);
        this.coronalSlice.updateZoomTransform(this.zoomFactor, this.zoomLocX, this.zoomLocZ, this.panAmountX,
            this.panAmountZ, this);
        this.sagittalSlice.updateZoomTransform(this.zoomFactor, this.zoomLocY, this.zoomLocZ, this.panAmountY,
            this.panAmountZ, this);
        this.drawViewer(false, true);
    }
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
