
/*jslint browser: true, node: true */
/*global $, PAPAYA_VIEWER_CSS, PAPAYA_DEFAULT_TOOLBAR_ID, PAPAYA_DEFAULT_VIEWER_ID, PAPAYA_DEFAULT_DISPLAY_ID,
 PAPAYA_TOOLBAR_CSS, PAPAYA_DISPLAY_CSS, PAPAYA_DEFAULT_SLIDER_ID, PAPAYA_DEFAULT_CONTAINER_ID, PAPAYA_SLIDER_CSS,
 PAPAYA_UTILS_UNSUPPORTED_CSS, PAPAYA_UTILS_UNSUPPORTED_MESSAGE_CSS, PAPAYA_CONTAINER_CLASS_NAME,
 PAPAYA_CONTAINER_FULLSCREEN, PAPAYA_CONTAINER_CLASS_NAME, PAPAYA_UTILS_CHECKFORJS_CSS, PAPAYA_SPACING,
 papayaRoundFast, PAPAYA_PADDING, PAPAYA_CONTAINER_PADDING_TOP, PAPAYA_CONTAINER_COLLAPSABLE_EXEMPT,
 PAPAYA_CONTAINER_COLLAPSABLE, PAPAYA_MANGO_INSTALLED, PAPAYA_KIOSK_CONTROLS_CSS, PAPAYA_CONTROL_INCREMENT_BUTTON_CSS,
 PAPAYA_CONTROL_SLIDER_CSS, PAPAYA_CONTROL_GOTO_CENTER_BUTTON_CSS, PAPAYA_CONTROL_GOTO_ORIGIN_BUTTON_CSS,
 PAPAYA_CONTROL_SWAP_BUTTON_CSS, PAPAYA_CONTROL_DIRECTION_SLIDER, PAPAYA_CONTROL_MAIN_SLIDER,
 PAPAYA_CONTROL_MAIN_INCREMENT_BUTTON_CSS, PAPAYA_CONTROL_MAIN_INCREMENT_BUTTON_CSS,
 PAPAYA_CONTROL_MAIN_DECREMENT_BUTTON_CSS, PAPAYA_CONTROL_MAIN_SWAP_BUTTON_CSS, PAPAYA_CONTROL_BAR_LABELS_CSS,
 PAPAYA_CONTROL_MAIN_GOTO_CENTER_BUTTON_CSS, PAPAYA_CONTROL_MAIN_GOTO_ORIGIN_BUTTON_CSS
 */

"use strict";

/*** Imports ***/
var papaya = papaya || {};
/*** Imports ***/
"use strict";

var papaya = papaya || {};
papaya.viewer = papaya.viewer || {};


papaya.viewer.Tools = papaya.viewer.Tools || function () {
    this.imageIndexValueforCine = 0;
    this.currentCineImageIndex = null;
    this.playCineImageId = null;
    this.IsplayingCine = false;
    this.IsPlayingCineSync = false;
    this.isForwardDirection = true;
    this.lastSelectedButton;
    this.IsForwardCine = true;
    this.IsRepeatCine = true;
    this.sliderValue = 10;
    this.imageNeedsUpdateForDrawTool = false;
    this.selectedIndexRulerOnImage;
    this.selectedIndexAngleOnImage;
    this.selectedIndexRectangleOnImage;
    this.selectedIndexEllipseOnImage;
    this.selectedIndexCobsAngleOnImage;
    this.selectedIndexPixelProbeOnImage
}

papaya.viewer.Tools.prototype.GetToolOnMouseDown = function (button, viewer, me) {
    if (viewer.container.params.imageTools) {
        switch (button) {
            case PAPAYA_SIDENAV_BUTTON_STACK:
                this.StackImagesInCanvas(viewer, me);
                break;
            case PAPAYA_SIDENAV_BUTTON_PAN:
                this.PanImagesInCanvas(viewer, me);
                break;
            case PAPAYA_SIDENAV_BUTTON_ZOOM:
                this.ZoomImageInCanvas(viewer, me);
                break;
            case PAPAYA_SIDENAV_BUTTON_WINDOWLEVEL:
                this.AddWindowLevelToImageInCanvas(viewer, me);
                break;
            case PAPAYA_SIDENAV_BUTTON_CROSSHAIR:
                this.DrawCrosshairOnImage(viewer, me);
                break;
            case PAPAYA_SIDENAV_BUTTON_MAGNIFY:
                this.MagnifyToolMoveEvent(viewer, me);
                break;
            case PAPAYA_SIDENAV_BUTTON_RULER:
                viewer.isRulerMode = true;
                this.DrawToolOnImageSlice(viewer, me, PAPAYA_TOOL_RULER);
                break;
            case PAPAYA_SIDENAV_BUTTON_ANGLE:
                this.DrawAngleOnImageSlice(viewer, me);
                break;
            case PAPAYA_SIDENAV_BUTTON_REACTANGLE:
                viewer.isRectangleMode = true;
                this.DrawToolOnImageSlice(viewer, me, PAPAYA_TOOL_RECTANGLE);
                break;
            case PAPAYA_SIDENAV_BUTTON_ELLIPSE:
                viewer.isEllipseMode = true;
                this.DrawToolOnImageSlice(viewer, me, PAPAYA_TOOL_ELLIPSE);
                break;
            case PAPAYA_SIDENAV_BUTTON_COBSANGLE:
                this.DrawCobsAngleOnImageSlice(viewer, me);
                break;
            case PAPAYA_SIDENAV_BUTTON_PROBE:
                viewer.isPixelProbeMode = true;
                this.DrawToolOnImageSlice(viewer, me, PAPAYA_TOOL_PIXELPROBE);
                break;
        }
    } else {
        this.DrawCrosshairOnImage(viewer, me);
    }
};

papaya.viewer.Tools.prototype.StackImagesInCanvas = function (viewer, me) {
    if (me.offsetY != undefined) {
        this.lastY = me.offsetY;
    } else {
        var rect = me.target.getBoundingClientRect();
        var x = me.targetTouches[0].pageX - rect.left;
        var y = me.targetTouches[0].pageY - rect.top;
        this.lastY = y;
    }
    viewer.isStackMode = true;
    viewer.container.preferences.showCrosshairs = "No"
    this.GetSurfaceDisplayOnCanvas(viewer, me);
};

papaya.viewer.Tools.prototype.PanImagesInCanvas = function (viewer, me) {
    viewer.isPanning = true;
    viewer.container.preferences.showCrosshairs = "No"
    viewer.previousMousePosition.x = papaya.utilities.PlatformUtils.getMousePositionX(me);
    viewer.previousMousePosition.y = papaya.utilities.PlatformUtils.getMousePositionY(me);
    this.setStartPanLocationToUpdate(viewer, viewer.convertScreenToImageCoordinateX(viewer.previousMousePosition.x, viewer.mainImage), viewer.convertScreenToImageCoordinateY(viewer.previousMousePosition.y, viewer.mainImage), viewer.mainImage.sliceDirection);
    this.GetSurfaceDisplayOnCanvas(viewer, me);
};

papaya.viewer.Tools.prototype.ZoomImageInCanvas = function (viewer, me) {
    viewer.isZoomMode = true;
    viewer.container.preferences.showCrosshairs = "No";
    viewer.previousMousePosition.x = papaya.utilities.PlatformUtils.getMousePositionX(me);
    viewer.previousMousePosition.y = papaya.utilities.PlatformUtils.getMousePositionY(me);
    this.GetSurfaceDisplayOnCanvas(viewer, me);
};

papaya.viewer.Tools.prototype.AddWindowLevelToImageInCanvas = function (viewer, me) {
    viewer.isWindowControl = true;
    viewer.previousMousePosition.x = papaya.utilities.PlatformUtils.getMousePositionX(me);
    viewer.previousMousePosition.y = papaya.utilities.PlatformUtils.getMousePositionY(me);
    viewer.container.preferences.showCrosshairs = "No";
    this.GetSurfaceDisplayOnCanvas(viewer, me);
};

papaya.viewer.Tools.prototype.DrawCrosshairOnImage = function (viewer, me) {
    viewer.isCrosshairMode = true;
    viewer.previousMousePosition.x = papaya.utilities.PlatformUtils.getMousePositionX(me);
    viewer.previousMousePosition.y = papaya.utilities.PlatformUtils.getMousePositionY(me);
    viewer.container.preferences.showCrosshairs = "Yes";
    viewer.findClickedSlice(viewer, viewer.previousMousePosition.x, viewer.previousMousePosition.y);
    this.GetSurfaceDisplayOnCanvas(viewer, me);
};

papaya.viewer.Tools.prototype.setStartPanLocationToUpdate = function (viewer, xLoc, yLoc, sliceDirection) {
    var temp;

    if (sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
        viewer.panLocX = xLoc;
        viewer.panLocY = yLoc;
        viewer.panLocZ = viewer.axialSlice.currentSlice;
    } else if (sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
        viewer.panLocX = xLoc;
        viewer.panLocY = viewer.coronalSlice.currentSlice;
        viewer.panLocZ = yLoc;
    } else if (sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
        viewer.panLocX = viewer.sagittalSlice.currentSlice;
        temp = xLoc;  // because of dumb IDE warning
        viewer.panLocY = temp;
        viewer.panLocZ = yLoc;

    }
};

papaya.viewer.Tools.prototype.GetSurfaceDisplayOnCanvas = function (viewer, me) {


    if (viewer.selectedSlice && (viewer.selectedSlice !== viewer.surfaceView)) {
        viewer.grabbedHandle = viewer.selectedSlice.findProximalRulerHandle(viewer.convertScreenToImageCoordinateX(viewer.previousMousePosition.x - viewer.canvasRect.left, viewer.selectedSlice),
            viewer.convertScreenToImageCoordinateY(viewer.previousMousePosition.y - viewer.canvasRect.top, viewer.selectedSlice));

        if (viewer.grabbedHandle === null) {
            viewer.updatePosition(viewer, papaya.utilities.PlatformUtils.getMousePositionX(me), papaya.utilities.PlatformUtils.getMousePositionY(me), false);
            viewer.resetUpdateTimer(me);
        }
    } else if (viewer.selectedSlice && (viewer.selectedSlice === viewer.surfaceView)) {
        if (viewer.container.hasSurface()) {
            if (viewer.surfaceView.findProximalRulerHandle(viewer.previousMousePosition.x - viewer.canvasRect.left,
                viewer.previousMousePosition.y - viewer.canvasRect.top)) {

            } else {
                viewer.isPanning = viewer.isShiftKeyDown;
                viewer.surfaceView.setStartDynamic(viewer.previousMousePosition.x, viewer.previousMousePosition.y);
            }
        }

        viewer.container.display.drawEmptyDisplay();
    }
};

papaya.viewer.Tools.prototype.GetCurrentCursorPosition = function (me, viewer) {
    var position = {
        posX: 0,
        posY: 0
    };

    if (me.pageX || me.pageY) {
        position.posX = me.pageX;
        position.posY = me.pageY;
    }
    else if (me.clientX) {
        position.posX = me.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        position.posY = me.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    } else {
        position.posX = me.targetTouches[0].pageX;
        position.posX = me.targetTouches[0].pageY;
    }
    position.posX -= viewer.canvas.offsetLeft;
    position.posY -= viewer.canvas.offsetTop;
    return { position };
};

papaya.viewer.Tools.prototype.MagnifyToolMoveEvent = function (viewer, me) {
    viewer.previousMousePosition.x = papaya.utilities.PlatformUtils.getMousePositionX(me);
    viewer.previousMousePosition.y = papaya.utilities.PlatformUtils.getMousePositionY(me);
    viewer.isMagnifyMode = true;
    viewer.container.preferences.showCrosshairs = "No";

    if (viewer.magnifyCanvas == null) {
        viewer.createMagnifyCanvas();
    }
    viewer.context.clearRect(0, 0, viewer.canvas.width, viewer.canvas.height);
    viewer.drawViewer(false, true);
    viewer.magnifyCanvasContext = viewer.magnifyCanvas.getContext("2d");
    viewer.magnifyCanvasContext.setTransform(1, 0, 0, 1, 0, 0);
    viewer.magnifyCanvasContext.clearRect(0, 0, 240, 240);
    viewer.magnifyCanvasContext.fillStyle = 'transparent';
    viewer.magnifyCanvasContext.fillRect(0, 0, 240, 240);
    var initialPosotionCopied = this.GetCurrentCursorPosition(me, viewer);
    initialPosotionCopied.position.posX = initialPosotionCopied.position.posX - 37;
    initialPosotionCopied.position.posY = initialPosotionCopied.position.posY - 37;
    initialPosotionCopied.position.posX = Math.min(initialPosotionCopied.position.posX, viewer.canvas.width);
    initialPosotionCopied.position.posY = Math.min(initialPosotionCopied.position.posY, viewer.canvas.height);
    var scaledMagnify = {
        x: (viewer.canvas.width - initialPosotionCopied.position.posX) * 2,
        y: (viewer.canvas.height - initialPosotionCopied.position.posY) * 2
    };
    viewer.magnifyCanvasContext.drawImage(viewer.canvas, initialPosotionCopied.position.posX, initialPosotionCopied.position.posY, viewer.canvas.width - initialPosotionCopied.position.posX, viewer.canvas.height - initialPosotionCopied.position.posY, 0, 0, scaledMagnify.x, scaledMagnify.y);

    viewer.findClickedSlice(viewer, viewer.previousMousePosition.x, viewer.previousMousePosition.y);
    if (viewer.selectedSlice == null) {
        return;
    } else {
        viewer.magnifyCanvas.style.top = papaya.utilities.PlatformUtils.getMousePositionY(me) - (viewer.magnifyCanvas.height / 2) + "px";
        viewer.magnifyCanvas.style.left = papaya.utilities.PlatformUtils.getMousePositionX(me) - (viewer.magnifyCanvas.width / 2) + 'px';
        viewer.magnifyCanvas.style.zIndex = 100;
        viewer.magnifyCanvas.style.display = 'block';
        if (viewer.selectedSlice == viewer.axialSlice) {
            viewer.magnifyCanvas.style.border = "1px solid red";
        } else if (viewer.selectedSlice == viewer.coronalSlice) {
            viewer.magnifyCanvas.style.border = "1px solid green";
        } else if (viewer.selectedSlice == viewer.surfaceView) {
            viewer.magnifyCanvas.style.border = "1px solid yellow";
        } else {
            viewer.magnifyCanvas.style.border = "1px solid blue";
        }
    }
};

papaya.viewer.Tools.prototype.DrawToolOnMouseMoveEvent = function (viewer, me, toolName, imageIndex) {

    if (viewer.selectedSlice === viewer.surfaceView) {
        return;
    }
    var cordinate = {};
    if (me.offsetX || me.offsetY) {
        cordinate = {
            xCord: me.offsetX,
            yCord: me.offsetY
        };
    } else {
        var clientRect = me.target.getBoundingClientRect();
        cordinate = {
            xCord: me.targetTouches[0].pageX - clientRect.left,
            yCord: me.targetTouches[0].pageY - clientRect.top
        }
    }
    if (viewer.selectedSlice != null && viewer.selectedSlice.getImageToolState(toolName) != undefined) {
        cordinate = viewer.convertScreenToImageCoordinate(cordinate.xCord, cordinate.yCord, viewer.selectedSlice);
        var tooldata = viewer.selectedSlice.getImageToolState(toolName).imageDatas;
        var toolHandles = tooldata[imageIndex].toolHandles;
        
        if (toolHandles != undefined) {
            Object.keys(toolHandles).forEach(function (name) {
                var toolHandle = toolHandles[name];
                if (toolHandle.toolActive == true) {
                    toolHandle.xCord = cordinate.x;
                    toolHandle.yCord = cordinate.y;
                    toolHandle.zCord = cordinate.z;
                }
            });
        }
    }
};

papaya.viewer.Tools.prototype.ButtonClickEvent = function () {
    $("." + PAPAYA_SIDENAVIGATION_CSS + " button").on("click", function (event) {
        //Only Click Event

        papayaContainers[0].preferences.showCrosshairs = "No";
        if ($("." + PAPAYA_SIDETOOL_CONFIGURATION_CSS).css("display") == "block") {
            $("." + PAPAYA_SIDETOOL_CONFIGURATION_CSS).css("display", "none");
        }
        var button = $(this).attr("id");

        if ($("#" + PAPAYA_SIDENAV_BUTTON_PLAYCENE).find("span").hasClass("fa-pause") && button != "playClipImages") {
            return;
        }
        switch (button) {
            case PAPAYA_SIDENAV_BUTTON_PLAYCENE:
                if ($("button.selected").attr("id") != undefined) {
                    papayaContainers[0].viewer.Tools.lastSelectedButton = $("button.selected").attr("id");
                }
                $("button.selected").removeClass("selected");
                if (!papayaContainers[0].viewer.Tools.IsplayingCine) {
                    papayaContainers[0].viewer.Tools.IsplayingCine = true;
                    $("." + PAPAYA_SIDETOOL_CONFIGURATION_CSS).css("display", "none");
                    papayaContainers[0].viewer.Tools.PlayClineClip(papayaContainers[0].viewer)
                    if (papayaContainers[0].viewer.Tools.IsplayingCine) {
                        $(this).find('span').removeClass('fa-play').addClass('fa-pause');
                        $(this).css({ backgroundColor: "green" });
                        $("." + PAPAYA_SIDENAVPANEL_CSS).css("display", "block");
                        $("." + PAPAYA_SIDENAVPANEL_CSS).css("top", parseFloat($(this).offset().top)).css("left", parseFloat($("." + PAPAYA_SIDENAVIGATION_CSS).css("left")) - parseFloat($("." + PAPAYA_SIDENAVIGATION_CSS).width()) - (parseFloat($("." + PAPAYA_SIDENAVPANEL_CSS).width()) / 2) + "px")

                    }
                } else {
                    papayaContainers[0].viewer.Tools.IsplayingCine = false;
                    papayaContainers[0].viewer.Tools.StopCineClip(papayaContainers[0].viewer);
                    if (!papayaContainers[0].viewer.Tools.IsplayingCine) {
                        $(this).find('span').removeClass('fa-pause').addClass('fa-play');
                        $(this).css({ backgroundColor: "darkgoldenrod" });
                        $("." + PAPAYA_SIDENAVPANEL_CSS).css("display", "none");
                        $("#" + papayaContainers[0].viewer.Tools.lastSelectedButton).addClass("selected")
                        if ($("#" + papayaContainers[0].viewer.Tools.lastSelectedButton).attr("name") == "drawtool") {
                            $("." + PAPAYA_SIDETOOL_CONFIGURATION_CSS).css("display", "block");
                            $("." + PAPAYA_SIDETOOL_CONFIGURATION_CSS).css("top", parseFloat($(this).offset().top)).css("left", parseFloat($("." + PAPAYA_SIDENAVIGATION_CSS).css("left")) - (parseFloat($("." + PAPAYA_SIDETOOL_CONFIGURATION_CSS).width()) + 12) + "px")

                        } else {
                            $("." + PAPAYA_SIDETOOL_CONFIGURATION_CSS).css("display", "none");
                        }
                        if (papayaContainers[0].viewer.Tools.lastSelectedButton == PAPAYA_SIDENAV_BUTTON_CROSSHAIR) {
                            papayaContainers[0].preferences.showCrosshairs = "Yes";
                        }

                    }
                }
                break;
            case PAPAYA_SIDENAV_BUTTON_CROSSHAIR:
                papayaContainers[0].preferences.showCrosshairs = "Yes";
                $("button.selected").removeClass("selected");
                $(this).addClass("selected");
                papayaContainers[0].viewer.drawViewer(true, true);
                break;
            case PAPAYA_SIDENAV_BUTTON_INVERT:
                if (this.isInvert != 0) {
                    $("#" + button).css("background-color", "white").css("color", "black");
                    papayaContainers[0].viewer.screenVolumes[0].changeColorTable(papayaContainers[0].viewer, "Inverted");
                    this.isInvert = 0;
                } else {
                    papayaContainers[0].viewer.screenVolumes[0].changeColorTable(papayaContainers[0].viewer, "Grayscale");
                    this.isInvert = 1;
                    $("#" + button).css("background-color", "darkgoldenrod").css("color", "white");

                }
                break;
            case PAPAYA_SIDENAV_BUTTON_RESET:
                papayaContainers[0].viewer.Tools.ResetAllTools(papayaContainers[0].viewer);
                break;
            default:
                papayaContainers[0].preferences.showCrosshairs = "No";
                $('.' + PAPAYA_VIEWER_CSS).find("canvas").css({ 'cursor': "default" });
                if ($(this).attr("name") == "drawtool") {
                    if (papayaContainers[0].viewer.mainImage === papayaContainers[0].viewer.surfaceView) {
                        return;
                    }
                    $("." + PAPAYA_SIDETOOL_CONFIGURATION_CSS).css("display", "block");
                    $("." + PAPAYA_SIDETOOL_CONFIGURATION_CSS).css("top", parseFloat($("#" + PAPAYA_SIDENAV_BUTTON_RULER).offset().top)).css("left", parseFloat($("." + PAPAYA_SIDENAVIGATION_CSS).css("left")) - (parseFloat($("." + PAPAYA_SIDETOOL_CONFIGURATION_CSS).width()) + 12) + "px")
                    if ($(this).attr("id") == PAPAYA_SIDENAV_BUTTON_ANGLE || $(this).attr("id") == PAPAYA_SIDENAV_BUTTON_PROBE) {
                        $("#" + PAPAYA_RULER_LENGTH_UNIT).parent().css("display", "none");
                    } else {
                        $("#" + PAPAYA_RULER_LENGTH_UNIT).parent().css("display", "block");
                    }
                } else {
                    $("." + PAPAYA_SIDETOOL_CONFIGURATION_CSS).css("display", "none");
                }
                $("button.selected").removeClass("selected");
                $(this).addClass("selected");
                break;
        }
        papayaContainers[0].viewer.drawViewer(true, true);
    });

    var range = $('.input-range'),
        value = $('.range-value');

    value.html(range.attr('value'));

    range.on('input', function () {
        value.html(this.value);
        papayaContainers[0].viewer.Tools.sliderValue = this.value;
        if (papayaContainers[0].viewer.Tools.IsplayingCine) {
            papayaContainers[0].viewer.Tools.StopCineClip(papayaContainers[0].viewer);
            papayaContainers[0].viewer.Tools.IsplayingCine = true;
            papayaContainers[0].viewer.Tools.PlayClineClip(papayaContainers[0].viewer);
        }
    });

    $("." + PAPAYA_NAVPANEL_BUTTON_SYNCCINE).on("change", function () {
        papayaContainers[0].viewer.Tools.GoToCenter(papayaContainers[0].viewer);
        if (papayaContainers[0].viewer.Tools.IsPlayingCineSync) {
            papayaContainers[0].viewer.Tools.IsPlayingCineSync = false;

        } else {
            papayaContainers[0].viewer.Tools.IsPlayingCineSync = true;
        }


    });

    $("#" + PAPAYA_NAVPANEL_BUTTON_REVERSE).on("click", function () {
        if (papayaContainers[0].viewer.Tools.isForwardDirection) {
            papayaContainers[0].viewer.Tools.isForwardDirection = false;
            $(this).css("background-color", "green").css("color", "white");

        } else {
            papayaContainers[0].viewer.Tools.isForwardDirection = true;
            $(this).css("background-color", "darkgoldenrod").css("color", "white");
        }
    });

    $("#" + PAPAYA_NAVPANEL_BUTTON_REPEAT).on("click", function () {
        if (papayaContainers[0].viewer.Tools.IsRepeatCine) {
            papayaContainers[0].viewer.Tools.IsRepeatCine = false;
            $(this).css("background-color", "darkgoldenrod").css("color", "white");

        } else {
            papayaContainers[0].viewer.Tools.IsRepeatCine = true;
            $(this).css("background-color", "green").css("color", "white");
        }
    });

    $("." + PAPAYA_SIDETOOL_CONFIGURATION_CSS + " select").on("change", function () {
        var selectId = $(this).attr("id");
        switch (selectId) {
            case PAPAYA_RULER_LINE_WIDTH:
                papayaContainers[0].viewer.rulerWidth = $("#" + PAPAYA_RULER_LINE_WIDTH).val();
                break;
            case PAPAYA_RULER_FONT_SIZE:
                papayaContainers[0].viewer.rulerFontSize = $("#" + PAPAYA_RULER_FONT_SIZE).val();
                break;
            case PAPAYA_RULER_LENGTH_UNIT:
                papayaContainers[0].viewer.rulerUnit = $("#" + PAPAYA_RULER_LENGTH_UNIT).val();
                break;
            case PAPAYA_RULER_COLOR:
                papayaContainers[0].viewer.rulerColor = $("#" + PAPAYA_RULER_COLOR).val();
                break;
            case PAPAYA_RULER_ACTIVE_COLOR:
                papayaContainers[0].viewer.activeRulerColor = $("#" + PAPAYA_RULER_ACTIVE_COLOR).val();
                break;
        }
        papayaContainers[0].viewer.drawViewer(true, true);
    });
};

papaya.viewer.Tools.prototype.PlayClineClip = function (viewer) {
    if ((this.imageIndexValueforCine != 1 || this.imageIndexValueforCine != viewer.mainImage.sliceCounts)) {

        if (viewer.mainImage.currentSlice + 1 === (viewer.mainImage.sliceCounts && !this.isForwardDirection)) {
            this.imageIndexValueforCine = 2;
            if (viewer.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL && this.imageIndexValueforCine == 2) {
                viewer.currentCoord.z = 0;
            } else if (viewer.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL && this.imageIndexValueforCine == 2) {
                viewer.currentCoord.y = 0;
            } else if (viewer.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL && this.imageIndexValueforCine == 2) {
                viewer.currentCoord.x = 0;
            }
        }

        else if (viewer.mainImage.currentSlice === 0 && !this.isForwardDirection) {
            this.imageIndexValueforCine = 1;
            if (viewer.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL && this.imageIndexValueforCine == 1) {
                viewer.currentCoord.z = viewer.mainImage.sliceCounts - 1;
            } else if (viewer.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL && this.imageIndexValueforCine == 1) {
                viewer.currentCoord.y = viewer.mainImage.sliceCounts - 1;
            } else if (viewer.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL && this.imageIndexValueforCine == 1) {
                viewer.currentCoord.x = viewer.mainImage.sliceCounts - 1;
            }
        }
    }

    if (viewer.mainImage.sliceCounts === 1) {
        viewer.drawViewer(true, false);
        $('#' + PAPAYA_SIDENAV_BUTTON_PLAYCENE).find('span').removeClass('fa-pause').addClass('fa-play');
        $('#' + PAPAYA_SIDENAV_BUTTON_PLAYCENE).css({ backgroundColor: "darkgoldenrod" });
        this.StopCineClip();
        this.IsplayingCine = false;
    } else {
        this.playCineImageId = setInterval(function () {
            if (!papayaContainers[0].viewer.Tools.IsPlayingCineSync) {
                if (papayaContainers[0].viewer.Tools.isForwardDirection) {
                    papayaContainers[0].viewer.Tools.currentCineImageIndex = 1;
                    if (viewer.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
                        papayaContainers[0].viewer.Tools.PlayClineClipSync(viewer, true, viewer.axialSlice);
                    } else if (viewer.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
                        papayaContainers[0].viewer.Tools.PlayClineClipSync(viewer, true, viewer.coronalSlice);
                    } else if (viewer.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
                        papayaContainers[0].viewer.Tools.PlayClineClipSync(viewer, true, viewer.sagittalSlice);
                    }

                } else {
                    papayaContainers[0].viewer.Tools.currentImageIndex = 1;
                    if (viewer.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
                        papayaContainers[0].viewer.Tools.PlayClineClipSync(viewer, false, viewer.axialSlice);
                    } else if (viewer.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
                        papayaContainers[0].viewer.Tools.PlayClineClipSync(viewer, false, viewer.coronalSlice);
                    } else if (viewer.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
                        papayaContainers[0].viewer.Tools.PlayClineClipSync(viewer, false, viewer.sagittalSlice)
                    }
                }
            } else {
                if (papayaContainers[0].viewer.Tools.isForwardDirection) {
                    papayaContainers[0].viewer.Tools.currentCineImageIndex = 1;
                    papayaContainers[0].viewer.Tools.PlayClineClipSync(viewer, true, viewer.axialSlice);
                    papayaContainers[0].viewer.Tools.PlayClineClipSync(viewer, true, viewer.coronalSlice);
                    papayaContainers[0].viewer.Tools.PlayClineClipSync(viewer, true, viewer.sagittalSlice);
                } else {
                    papayaContainers[0].viewer.Tools.currentImageIndex = 1;
                    papayaContainers[0].viewer.Tools.PlayClineClipSync(viewer, false, viewer.axialSlice);
                    papayaContainers[0].viewer.Tools.PlayClineClipSync(viewer, false, viewer.coronalSlice);
                    papayaContainers[0].viewer.Tools.PlayClineClipSync(viewer, false, viewer.sagittalSlice);
                }
            }
        }, 1000 / Math.abs(this.sliderValue));
    }

};

papaya.viewer.Tools.prototype.StopCineClip = function () {

    if (this.playCineImageId != undefined) {
        clearInterval(this.playCineImageId);
        this.playCineImageId = undefined;
        this.IsplayingCine = false;
    }
};

papaya.viewer.Tools.prototype.PlayClineClipSync = function (viewer, isForword, screenSlice) {
    if (screenSlice.currentSlice + 1 >= screenSlice.sliceCounts && this.IsRepeatCine) {
        if (screenSlice === viewer.axialSlice) {
            viewer.currentCoord.z = 0;
        } else if (screenSlice === viewer.coronalSlice) {
            viewer.currentCoord.y = 0;
        } else if (screenSlice === viewer.sagittalSlice) {
            viewer.currentCoord.x = 0;
        }
    }
    else if (screenSlice.currentSlice === 0 && this.IsRepeatCine) {
        if (screenSlice === viewer.axialSlice) {
            viewer.currentCoord.z = screenSlice.sliceCounts - 1;
        } else if (screenSlice === viewer.coronalSlice) {
            viewer.currentCoord.y = screenSlice.sliceCounts - 1;
        } else if (screenSlice === viewer.sagittalSlice) {
            viewer.currentCoord.x = screenSlice.sliceCounts - 1;
        }
    }
    if (screenSlice.currentSlice + 1 >= screenSlice.sliceCounts && !this.IsRepeatCine) {
        if (screenSlice === viewer.axialSlice) {
            if (this.imageIndexValueforCine == 2 && viewer.currentCoord.z != viewer.mainImage.sliceCounts - 1) {
                viewer.incrementAxial(isForword, this.currentCineImageIndex);
            }
        } else if (screenSlice === viewer.coronalSlice) {
            if (this.imageIndexValueforCine == 2 && viewer.currentCoord.y != viewer.mainImage.sliceCounts - 1) {
                viewer.incrementCoronal(isForword, this.currentCineImageIndex);
            }
        } else if (screenSlice === viewer.sagittalSlice) {
            if (this.imageIndexValueforCine == 2 && viewer.currentCoord.x != viewer.mainImage.sliceCounts - 1) {
                viewer.incrementSagittal(isForword, this.currentCineImageIndex);
            }
        } else {
            this.imageIndexValueforCine = 0;
            if (screenSlice === viewer.axialSlice) {
                viewer.currentCoord.z = 0;
            } else if (screenSlice === viewer.coronalSlice) {
                viewer.currentCoord.y = 0;
            } else if (screenSlice === viewer.sagittalSlice) {
                viewer.currentCoord.x = 0;
            }
            viewer.drawViewer(true, false);
            $('#' + PAPAYA_SIDENAV_BUTTON_PLAYCENE).find('span').removeClass('fa-pause').addClass('fa-play');
            $('#' + PAPAYA_SIDENAV_BUTTON_PLAYCENE).css({ backgroundColor: "darkgoldenrod" });
            this.StopCineClip();
        }
    }
    else {
        if (screenSlice === viewer.axialSlice) {
            viewer.incrementAxial(isForword, this.currentCineImageIndex);
        } else if (screenSlice === viewer.coronalSlice) {
            viewer.incrementCoronal(isForword, this.currentCineImageIndex);
        } else if (screenSlice === viewer.sagittalSlice) {
            viewer.incrementSagittal(isForword, this.currentCineImageIndex);
        }
    }
};

papaya.viewer.Tools.prototype.ResetAllTools = function (viewer) {
    viewer.axialSlice.updateZoomTransform(1, 1, 1, 0, 0, 0);
    viewer.coronalSlice.updateZoomTransform(1, 1, 1, 0, 0, 0);
    viewer.sagittalSlice.updateZoomTransform(1, 1, 1, 0, 0, 0);
    viewer.zoomFactorPreviousA = 1;
    viewer.zoomFactorPreviousC = 1;
    viewer.zoomFactorPreviousS = 1;
    viewer.setZoomFactor(1);
    viewer.screenVolumes[0].resetScreenRange();
    viewer.screenVolumes[0].rotationX = 0.5;
    viewer.screenVolumes[0].rotationY = 0.5;
    viewer.screenVolumes[0].rotationZ = 0.5;
    viewer.screenVolumes[0].updateTransform();
    $('#rotationX0_0Slider').val('50')
    $('#rotationY0_0Slider').val('50')
    $('#rotationZ0_0Slider').val('50')
    if (this.IsplayingCine) {
        this.StopCineClip();
        $("#" + PAPAYA_SIDENAV_BUTTON_PLAYCENE).find('span').removeClass('fa-pause').addClass('fa-play');
        $("#" + PAPAYA_SIDENAV_BUTTON_PLAYCENE).css({ backgroundColor: "darkgoldenrod" });
        $("." + PAPAYA_SIDENAVPANEL_CSS).css("display", "none");
        $("#" + this.lastSelectedButton).addClass("selected")
    }
    viewer.screenVolumes[0].changeColorTable(papayaContainers[0].viewer, "Grayscale");
    $("#" + PAPAYA_SIDENAV_BUTTON_INVERT).css("background-color", "darkgoldenrod").css("color", "white");
    this.GoToCenter(viewer);
    if (viewer.selectedSlice === viewer.surfaceView) {
        $("#" + PAPAYA_SIDENAV_BUTTON_CROSSHAIR).trigger("click");
    }
    if ($("button.selected").attr("id") == PAPAYA_SIDENAV_BUTTON_CROSSHAIR) {
        papayaContainers[0].preferences.showCrosshairs = "Yes";
    }
    if (viewer.mainImage != viewer.surfaceView) {
        viewer.mainImage.clearImageToolState('ruler');
        viewer.mainImage.clearImageToolState('angle');
    }
    if (viewer.lowerImageTop != viewer.surfaceView) {
        viewer.lowerImageTop.clearImageToolState('ruler');
        viewer.lowerImageTop.clearImageToolState('angle');
    }
    if (viewer.lowerImageBot != viewer.surfaceView) {
        viewer.lowerImageBot.clearImageToolState('ruler');
        viewer.lowerImageBot.clearImageToolState('angle');
    }
    if (viewer.lowerImageBot2 != viewer.surfaceView) {
        viewer.lowerImageBot2.clearImageToolState('ruler');
        viewer.lowerImageBot2.clearImageToolState('angle');
    }
    viewer.drawViewer(true, false);
}

papaya.viewer.Tools.prototype.GoToCenter = function (viewer) {
    var center = new papaya.core.Coordinate(Math.floor(viewer.volume.header.imageDimensions.xDim / 2),
        Math.floor(viewer.volume.header.imageDimensions.yDim / 2),
        Math.floor(viewer.volume.header.imageDimensions.zDim / 2));
    viewer.gotoCoordinate(center);
};

papaya.viewer.Tools.prototype.DrawAngleOnImageSlice = function (viewer, me) {
    this.imageNeedsUpdateForDrawTool = false;
    viewer.container.preferences.showCrosshairs = "No";
    viewer.isAngleMode = true;

    viewer.previousMousePosition.x = papaya.utilities.PlatformUtils.getMousePositionX(me);
    viewer.previousMousePosition.y = papaya.utilities.PlatformUtils.getMousePositionY(me);

    viewer.findClickedSlice(viewer, viewer.previousMousePosition.x, viewer.previousMousePosition.y);

    if (viewer.selectedSlice == viewer.surfaceView) {
        return;
    }
    var pointCord = {
        xCord: 0,
        yCord: 0
    }

    if (me.offsetX) {
        pointCord.xCord = me.offsetX;
        pointCord.yCord = me.offsetY;
    } else {
        var clientRect = me.target.getBoundingClientRect();
        pointCord.xCord = me.targetTouches[0].pageX - clientRect.left;
        pointCord.yCord = me.targetTouches[0].pageY - clientRect.top;
    }

    var firstPointSelect = { xCord: pointCord.xCord, yCord: pointCord.yCord };

    var cordOne = viewer.convertScreenToImageCoordinate(firstPointSelect.xCord, firstPointSelect.yCord, viewer.selectedSlice);

    firstPointSelect = { xCord: cordOne.x, yCord: cordOne.y, zCord: cordOne.z };

    var toolImageData = viewer.selectedSlice.getImageToolState('angle');
    if (toolImageData != undefined && toolImageData.imageDatas != undefined && toolImageData.imageDatas.length > 0) {  
        var imageToolData = toolImageData.imageDatas;
        if (imageToolData.length != 0) {
            this.selectedIndexAngleOnImage = imageToolData.length - 1;
            if (imageToolData[this.selectedIndexAngleOnImage].toolHandles.end.toolActive && imageToolData[this.selectedIndexAngleOnImage].isWaitingForLine == true) {
                imageToolData[this.selectedIndexAngleOnImage].toolHandles.end.toolActive = false;
                imageToolData[this.selectedIndexAngleOnImage].isWaitingForLine = "complete";
                viewer.isDragging = false;
                this.imageNeedsUpdateForDrawTool = true;
            }
        }


        for (var i = 0; i < imageToolData.length; i++) {
            var nearbyToolHandle = this.getToolHandleNearToImagePoint(imageToolData[i].toolHandles, firstPointSelect, 5);
            if (nearbyToolHandle !== undefined) {
                this.selectedIndexAngleOnImage = i;
                nearbyToolHandle.toolActive = true;
                imageToolData[i].toolActive = true;
                nearbyToolHandle.xCord = firstPointSelect.xCord;
                nearbyToolHandle.yCord = firstPointSelect.yCord;
                nearbyToolHandle.zCord = firstPointSelect.zCord;
                this.imageNeedsUpdateForDrawTool = true;
            }
            var activeToolHandle = this.getActiveToolHandle(imageToolData[i].toolHandles);
            if (activeToolHandle != undefined && activeToolHandle != nearbyToolHandle)
                activeToolHandle.toolActive = false;
        }
    }
    if (!this.imageNeedsUpdateForDrawTool) {
        var angelObject = {
            isWaitingForLine: false,
            toolActive: true,
            toolHandles: {
                start: {
                    xCord:firstPointSelect.xCord,
                    yCord:firstPointSelect.yCord,
                    zCord: firstPointSelect.zCord,
                    toolActive: false
                },
                middle: {
                    xCord: firstPointSelect.xCord,
                    yCord: firstPointSelect.yCord,
                    zCord: firstPointSelect.zCord,
                    toolActive: true
                },
                end: {
                    xCord: firstPointSelect.xCord,
                    yCord: firstPointSelect.yCord,
                    zCord: firstPointSelect.zCord,
                    toolActive: false
                }
            }
        }
        viewer.selectedSlice.setImageToolState('angle', angelObject);
        toolImageData = viewer.selectedSlice.getImageToolState('angle');
        if (toolImageData != undefined && toolImageData.imageDatas != undefined && toolImageData.imageDatas.length > 0) {       
            toolImageData = toolImageData.imageDatas;
        }
        this.selectedIndexAngleOnImage = toolImageData.length - 1;
    }

};

papaya.viewer.Tools.prototype.DrawCobsAngleOnImageSlice = function (viewer, me) {
    this.imageNeedsUpdateForDrawTool = false;
    viewer.container.preferences.showCrosshairs = "No";
    viewer.isCobsAngleMode = true;

    viewer.previousMousePosition.x = papaya.utilities.PlatformUtils.getMousePositionX(me);
    viewer.previousMousePosition.y = papaya.utilities.PlatformUtils.getMousePositionY(me);

    viewer.findClickedSlice(viewer, viewer.previousMousePosition.x, viewer.previousMousePosition.y);

    if (viewer.selectedSlice == viewer.surfaceView) {
        return;
    }
    var pointCord = {
        xCord: 0,
        yCord: 0
    }

    if (me.offsetX) {
        pointCord.xCord = me.offsetX;
        pointCord.yCord = me.offsetY;
    } else {
        var clientRect = me.target.getBoundingClientRect();
        pointCord.xCord = me.targetTouches[0].pageX - clientRect.left;
        pointCord.yCord = me.targetTouches[0].pageY - clientRect.top;
    }

    var firstPointSelect;

    firstPointSelect = { xCord: pointCord.xCord, yCord: pointCord.yCord };

    var cordOne = viewer.convertScreenToImageCoordinate(firstPointSelect.xCord, firstPointSelect.yCord, viewer.selectedSlice);

    firstPointSelect = { xCord: cordOne.x, yCord: cordOne.y, zCord: cordOne.z };

    var toolImageData = viewer.selectedSlice.getImageToolState('cobsangle');
    if (toolImageData != undefined && toolImageData.imageDatas != undefined && toolImageData.imageDatas.length > 0) {
        var toolImageData = toolImageData.imageDatas;
        for (var i = 0; i < toolImageData.length; i++) {
            var nearbyHandle = this.getToolHandleNearToImagePoint(toolImageData[i].toolHandles, firstPointSelect, 5);
            if (nearbyHandle !== undefined) {
                this.selectedIndexCobsAngleOnImage = i;
                nearbyHandle.toolActive = true;
                toolImageData[i].toolActive = true;
                nearbyHandle.x = firstPointSelect.xCord;
                nearbyHandle.y = firstPointSelect.yCord;
                nearbyHandle.z = firstPointSelect.zCord;
                this.imageNeedsUpdateForDrawTool = true;
            }
            var activeHandle = this.getActiveToolHandle(toolImageData[i].toolHandles);
            if (activeHandle != undefined && activeHandle != nearbyHandle)
                activeHandle.toolActive = false;
        }
    }
    if (!this.imageNeedsUpdateForDrawTool) {
        var toolImageData = viewer.selectedSlice.getImageToolState('cobsangle');
        if (toolImageData === undefined || toolImageData.imageDatas === undefined || toolImageData.imageDatas.length === 0) {

            var cobsAngleObject = {
                isWaitingForLine: false,
                toolActive: true,
                toolHandles: {
                    startOne: {
                        xCord: firstPointSelect.xCord,
                        yCord: firstPointSelect.yCord,
                        zCord: firstPointSelect.zCord,
                        toolActive: false
                    },
                    endOne: {
                        xCord: firstPointSelect.xCord,
                        yCord: firstPointSelect.yCord,
                        zCord: firstPointSelect.zCord,
                        toolActive: true
                    }
                }
            }
            viewer.selectedSlice.setImageToolState('cobsangle', cobsAngleObject);

            var toolImagedata = viewer.selectedSlice.getImageToolState('cobsangle');
            if (toolImagedata != undefined && toolImagedata.imageDatas != undefined && toolImagedata.imageDatas.length > 0) {
                toolImagedata = toolImagedata.imageDatas;
            }
            this.selectedIndexCobsAngleOnImage = toolImagedata.length - 1;
        }
        else {
            toolImageData = toolImageData.imageDatas;

            var cobsAngleData = toolImageData[toolImageData.length - 1];
            if (cobsAngleData.isWaitingForLine == true) {
                var cobsAngleObject = cobsAngleData;
                cobsAngleObject.toolHandles.startTwo = {
                    xCord: firstPointSelect.xCord,
                    yCord: firstPointSelect.yCord,
                    zCord: firstPointSelect.zCord,
                    toolActive: false
                };
                cobsAngleObject.toolHandles.endTwo = {
                    xCord: firstPointSelect.xCord,
                    yCord: firstPointSelect.yCord,
                    zCord: firstPointSelect.zCord,
                    toolActive: true
                };
                this.selectedIndexCobsAngleOnImage = toolImageData.length - 1;
            }
            else if (cobsAngleData.isWaitingForLine == false || cobsAngleData.isWaitingForLine == "complete") {
                var cobsAngleObject = {
                    isWaitingForLine: false,
                    toolActive: true,
                    toolHandles: {
                        startOne: {
                            xCord: firstPointSelect.xCord,
                            yCord: firstPointSelect.yCord,
                            zCord: firstPointSelect.zCord,
                            toolActive: false
                        },
                        endOne: {
                            xCord: firstPointSelect.xCord,
                            yCord: firstPointSelect.yCord,
                            zCord: firstPointSelect.zCord,
                            toolActive: true
                        }
                    }
                }
                viewer.selectedSlice.setImageToolState('cobsangle', cobsAngleObject);
                toolImageData = viewer.selectedSlice.getImageToolState('cobsangle');
                if (toolImageData != undefined && toolImageData.imageDatas != undefined && toolImageData.imageDatas.length > 0) {
                
                    toolImageData = toolImageData.imageDatas;
                }
                this.selectedIndexCobsAngleOnImage = toolImageData.length - 1;
            }
        }
    }

};

papaya.viewer.Tools.prototype.DrawToolOnImageSlice = function (viewer, me, toolName) {

    viewer.isDrawToolMode = true;
    viewer.container.preferences.showCrosshairs = "No";
    this.imageNeedsUpdateForDrawTool = false;

    viewer.previousMousePosition.x = papaya.utilities.PlatformUtils.getMousePositionX(me);
    viewer.previousMousePosition.y = papaya.utilities.PlatformUtils.getMousePositionY(me);

    viewer.findClickedSlice(viewer, viewer.previousMousePosition.x, viewer.previousMousePosition.y);

    if (viewer.selectedSlice == viewer.surfaceView) {
        return;
    }
    var pointsCord = {
        xCords: 0,
        yCords: 0
    }

    if (me.offsetX) {
        pointsCord.xCords = me.offsetX;
        pointsCord.yCords = me.offsetY;
    } else {
        var rect = me.target.getBoundingClientRect();
        pointsCord.xCords = me.targetTouches[0].pageX - rect.left;
        pointsCord.yCords = me.targetTouches[0].pageY - rect.top;
    }

    var pointsCordOne = { xCord: pointsCord.xCords, yCord: pointsCord.yCords };
    var CordOne = viewer.convertScreenToImageCoordinate(pointsCordOne.xCord, pointsCordOne.yCord, viewer.selectedSlice);
    pointsCordOne = { xCord: CordOne.x, yCord: CordOne.y, zCord: CordOne.z };
    var imageToolData = viewer.selectedSlice.getImageToolState(toolName);
    if (imageToolData != undefined && imageToolData.imageDatas != undefined && imageToolData.imageDatas.length > 0) {
        var imageToolData = imageToolData.imageDatas;
        if (imageToolData.length != 0 && toolName === "angle") {
            this.getSelectedIndexForImageSlice(toolName, imageToolData.length - 1)
            //this.sliceIndex = imageToolData.length - 1;
            if (imageToolData[this.selectedIndexAngleOnImage].toolHandles.end.toolActive && imageToolData[this.selectedIndexAngleOnImage].isWaitingForLine == true) {
                imageToolData[this.selectedIndexAngleOnImage].toolHandles.end.toolActive = false;
                imageToolData[this.selectedIndexAngleOnImage].isWaitingForLine = "complete";
                viewer.isDragging = false;
                this.imageNeedsUpdateForDrawTool = true;
            }
        }
        for (var i = 0; i < imageToolData.length; i++) {
            var nearbyHandle = this.getToolHandleNearToImagePoint(imageToolData[i].toolHandles, pointsCordOne, 5);
            if (nearbyHandle !== undefined) {
                this.getSelectedIndexForImageSlice(toolName, i);
                nearbyHandle.toolActive = true;
                imageToolData[i].toolActive = true;
                nearbyHandle.xCord = pointsCordOne.xCord
                nearbyHandle.yCord = pointsCordOne.yCord;
                nearbyHandle.zCord = pointsCordOne.zCord;
                this.imageNeedsUpdateForDrawTool = true;
            }
            var activeHandle = this.getActiveToolHandle(imageToolData[i].toolHandles);
            if (activeHandle != undefined && activeHandle != nearbyHandle)
                activeHandle.toolActive = false;
        }
    }
    if (!this.imageNeedsUpdateForDrawTool) {

        var toolDataObject = this.createToolObjectForDraw(toolName, pointsCordOne);
        viewer.selectedSlice.setImageToolState(toolName, toolDataObject);
        var imageToolData = viewer.selectedSlice.getImageToolState(toolName);
        if (imageToolData != undefined && imageToolData.imageDatas != undefined && imageToolData.imageDatas.length > 0) {

            imageToolData = imageToolData.imageDatas;
        }
        this.getSelectedIndexForImageSlice(toolName, imageToolData.length - 1);
        // sliceIndex = imageToolData.length - 1;
    }

}
//CornerStone.js and CornerStoneMath.js functions for drawing Ruler as implemented in cornerStone.js
papaya.viewer.Tools.prototype.findClosestPoint = function (sources, target) {
    var distances = [];
    var minDistance;
    var tools = this;
    sources.forEach(function (source, index) {
        var d = tools.distance(source, target);

        distances.push(d);

        if (index === 0) {
            minDistance = d;
        } else {
            minDistance = Math.min(d, minDistance);
        }
    });

    var index = distances.indexOf(minDistance);


    return sources[index];
};

papaya.viewer.Tools.prototype.distance = function (from, to) {
    return Math.sqrt(this.distanceSquared(from, to));
}

papaya.viewer.Tools.prototype.distanceSquared = function (from, to) {
    var delta = this.subtract(from, to);
    return delta.x * delta.x + delta.y * delta.y;
}

papaya.viewer.Tools.prototype.subtract = function (lhs, rhs) {
    return {
        x: lhs.xCord - rhs.xCord,
        y: lhs.yCord - rhs.yCord
    };
}

papaya.viewer.Tools.prototype.roundToDecimal = function (value, precision) {
    var multiplier = Math.pow(10, precision);
    return (Math.round(value * multiplier) / multiplier);
}

papaya.viewer.Tools.prototype.getActiveToolHandle = function (toolHandles) {
    var activeToolHandle;

    Object.keys(toolHandles).forEach(function (toolHandleName) {
        var toolHandleName = toolHandles[toolHandleName];
        if (toolHandleName.toolActive === true) {
            activeToolHandle = toolHandleName;
            return;
        }
    });

    return activeToolHandle;
};

papaya.viewer.Tools.prototype.getToolHandleNearToImagePoint = function (toolHandles, imageCoords, distanceThresholdForImage) {

    var nearbyToolHandle;

    if (!toolHandles) {
        return;
    }
    Object.keys(toolHandles).forEach(function (toolHandleName) {
        var toolHandleName = toolHandles[toolHandleName];

        var distanceToPointOnImage = papayaContainers[0].viewer.Tools.distance(toolHandleName, imageCoords);

        if (distanceToPointOnImage <= distanceThresholdForImage) {
            nearbyToolHandle = toolHandleName;
            return;
        }
    });

    return nearbyToolHandle;
};

papaya.viewer.Tools.prototype.distanceBetweenTwoPoints = function (pointSecond, pointFirst) {

    var distanceBetweenTwoPoints;
    if (this.mainImage === this.axialSlice) {
        distanceBetweenTwoPoints = this.distance({ x: pointSecond.x, y: pointSecond.y }, { x: pointFirst.x, y: pointFirst.y });
    } else if (this.mainImage === this.coronalSlice) {
        distanceBetweenTwoPoints = this.distance({ x: pointSecond.x, y: pointSecond.z }, { x: pointFirst.x, y: pointFirst.z });
    } else if (this.mainImage === this.sagittalSlice) {
        distanceBetweenTwoPoints = this.distance({ x: pointSecond.y, y: pointSecond.z }, { x: pointFirst.y, y: pointFirst.z });
    }
    return distanceBetweenTwoPoints;
};

papaya.viewer.Tools.prototype.findClosestPointNearRularLine = function (lineSegmentOne, intersectionPointNearLine) {
    var closestPointNearLine, lineSegmentFirst;

    if (this.mainImage === this.axialSlice) {
        closestPointNearLine = this.findClosestPoint([lineSegmentOne.start, lineSegmentOne.end], intersectionPointNearLine);
    } else if (this.mainImage === this.coronalSlice) {
        lineSegmentFirst = { start: { x: lineSegmentOne.start.x, y: lineSegmentOne.start.z }, end: { x: lineSegmentOne.end.x, y: lineSegmentOne.end.z } };
        closestPointNearLine = this.findClosestPoint([lineSegmentFirst.start, lineSegmentFirst.end], intersectionPointNearLine);
        closestPointNearLine = { x: closestPointLine.x, y: lineSegmentOne.start.y, z: closestPointLine.y };
    } else if (this.mainImage === this.sagittalSlice) {
        lineSegmentFirst = { start: { x: lineSegmentOne.start.y, y: lineSegmentOne.start.z }, end: { x: lineSegmentOne.end.y, y: lineSegmentOne.end.z } };
        closestPointNearLine = this.findClosestPoint([lineSegmentFirst.start, lineSegmentFirst.end], intersectionPointNearLine);
        closestPointNearLine = { x: lineSegmentOne.start.x, y: closestPointLine.x, z: closestPointLine.y };
    }
    return closestPointNearLine;
};

papaya.viewer.Tools.prototype.checkForIntersectionOnLine = function (lineSegmentFirst, lineSegmentSecond, screenSlice, viewer) {
    var intersectionPointOneLine, lineSegmentOne, lineSegmentTwo;
    if (screenSlice === viewer.axialSlice) {
        intersectionPointOneLine = this.checkLineIntersection(lineSegmentFirst, lineSegmentSecond);
    } else if (screenSlice === viewer.coronalSlice) {
        lineSegmentOne = { start: { xCord: lineSegmentFirst.start.xCord, yCord: lineSegmentFirst.start.zCord }, end: { xCord: lineSegmentFirst.end.xCord, yCord: lineSegmentFirst.end.zCord } };
        lineSegmentTwo = { start: { xCord: lineSegmentSecond.start.xCord, yCord: lineSegmentSecond.start.zCord }, end: { xCord: lineSegmentSecond.end.xCord, yCord: lineSegmentSecond.end.zCord } };
        intersectionPointOneLine = this.checkLineIntersection(lineSegmentOne, lineSegmentTwo);
    } else if (screenSlice === viewer.sagittalSlice) {
        lineSegmentOne = { start: { xCord: lineSegmentFirst.start.yCord, yCord: lineSegmentFirst.start.zCord }, end: { xCord: lineSegmentFirst.end.yCord, yCord: lineSegmentFirst.end.zCord } };
        lineSegmentTwo = { start: { xCord: lineSegmentSecond.start.yCord, yCord: lineSegmentSecond.start.zCord }, end: { xCord: lineSegmentSecond.end.yCord, yCord: lineSegmentSecond.end.zCord } };
        intersectionPointOneLine = this.checkLineIntersection(lineSegmentOne, lineSegmentTwo);
    }
    return intersectionPointOneLine;
};

papaya.viewer.Tools.prototype.checkLineIntersection = function (lineSegmentFirst, lineSegmentSecond) {
    // x1, y1, x2, y2, x3, y3, x4, y4
    var x1 = lineSegmentFirst.start.xCord,
        y1 = lineSegmentFirst.start.yCord,
        x2 = lineSegmentFirst.end.xCord,
        y2 = lineSegmentFirst.end.yCord,
        x3 = lineSegmentSecond.start.xCord,
        y3 = lineSegmentSecond.start.yCord,
        x4 = lineSegmentSecond.end.xCord,
        y4 = lineSegmentSecond.end.yCord;
    // if the lines intersect, the result contains the x and y of the intersection (treating the lines as infinite) and booleans for whether line segment 1 or line segment 2 contain the point
    var denominator, a, b, numeratorFirst, numeratorSecond, result = {
        xCord: null,
        yCord: null,
        onLineOne: false,
        onLineTwo: false
    };
    denominator = ((y4 - y3) * (x2 - x1)) - ((x4 - x3) * (y2 - y1));
    if (denominator == 0) {
        return result;
    }
    a = y1 - y3;
    b = x1 - x3;
    numeratorFirst = ((x4 - x3) * a) - ((y4 - y3) * b);
    numeratorSecond = ((x2 - x1) * a) - ((y2 - y1) * b);
    a = numeratorFirst / denominator;
    b = numeratorSecond / denominator;

    // if we cast these lines infinitely in both directions, they intersect here:
    result.xCord = x1 + (a * (x2 - x1));
    result.yCord = y1 + (a * (y2 - y1));
    /*
    // it is worth noting that this should be the same as:
    x = x3 + (b * (x4 - x3));
    y = x3 + (b * (y4 - y3));
    */
    // if line1 is a segment and line2 is infinite, they intersect if:
    if (a > 0 && a < 1) {
        result.onLineOne = true;
    }
    // if line2 is a segment and line1 is infinite, they intersect if:
    if (b > 0 && b < 1) {
        result.onLineTwo = true;
    }
    // if line1 and line2 are segments, they intersect if both of the above are true
    return result;
};

papaya.viewer.Tools.prototype.DrawMarkerForScreenSlice = function (viewer) {
    viewer.mainImageOverlaysTopLeft.css("position", "absolute").css("top", viewer.paddingTop + 30).css("left", parseFloat($("." + PAPAYA_VIEWER_CSS).css("padding-left")) + 15);
    viewer.mainImageOverlaysTopRight.css("position", "absolute").css("top", viewer.paddingTop + 30).css("left", parseFloat($("." + PAPAYA_VIEWER_CSS).css("padding-left")) + viewer.mainImage.screenDim - parseFloat(viewer.mainImageOverlaysTopRight.css("width")));
    viewer.mainImageOverlaysBottomLeft.css("position", "absolute").css("top", viewer.mainImage.screenDim + 10 - parseFloat(viewer.mainImageOverlaysBottomLeft.css("height"))).css("left", parseFloat($("." + PAPAYA_VIEWER_CSS).css("padding-left")) + 15);
    viewer.mainImageOverlaysBottomRight.css("position", "absolute").css("top", viewer.mainImage.screenDim + 10 - parseFloat(viewer.mainImageOverlaysBottomRight.css("height"))).css("left", parseFloat($("." + PAPAYA_VIEWER_CSS).css("padding-left")) + viewer.mainImage.screenDim - parseFloat(viewer.mainImageOverlaysBottomRight.css("width")));
    var textWidth = 0;
    if (parseFloat(viewer.lowerImageTopOverlayBottomRight.css("width")) === 0) {
        textWidth = 112;
    }
    else {
        textWidth = parseFloat(viewer.lowerImageTopOverlayBottomRight.css("width"));
    }
    viewer.lowerImageTopOverlayBottomRight.css("position", "absolute").css("top", viewer.lowerImageTop.screenDim + 25 - parseFloat(viewer.lowerImageTopOverlayBottomRight.css("height"))).css("left", parseFloat($("." + PAPAYA_VIEWER_CSS).css("padding-left")) + (viewer.mainImage.screenDim + viewer.lowerImageTop.screenDim) - textWidth);
    var textWidth = 0;
    if (parseFloat(viewer.lowerImageBotOverlayBottomRight.css("width")) === 0) {
        textWidth = 112;
    }
    else {
        textWidth = parseFloat(viewer.lowerImageBotOverlayBottomRight.css("width"));
    }
    viewer.lowerImageBotOverlayBottomRight.css("position", "absolute").css("top", viewer.lowerImageTop.screenDim + viewer.lowerImageBot.screenDim + 25 - parseFloat(viewer.lowerImageBotOverlayBottomRight.css("height"))).css("left", parseFloat($("." + PAPAYA_VIEWER_CSS).css("padding-left")) + (viewer.mainImage.screenDim + viewer.lowerImageBot.screenDim) - textWidth);
    if (viewer.lowerImageBot2 != null) {
        var textWidth = 0;
        if (parseFloat(viewer.lowerImageBotTwoOverlayBottomRight.css("width")) === 0) {
            textWidth = 112;
        }
        else {
            textWidth = parseFloat(viewer.lowerImageBotTwoOverlayBottomRight.css("width"));
        }
        viewer.lowerImageBotTwoOverlayBottomRight.css("position", "absolute").css("top", viewer.lowerImageTop.screenDim + viewer.lowerImageBot.screenDim + viewer.lowerImageBot2.screenDim + 25 - parseFloat(viewer.lowerImageBotTwoOverlayBottomRight.css("height"))).css("left", parseFloat($("." + PAPAYA_VIEWER_CSS).css("padding-left")) + (viewer.mainImage.screenDim + viewer.lowerImageBot2.screenDim) - textWidth);

    }
    if (viewer.mainImage.sliceDirection == papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
        viewer.crossHairAxialRed.css("position", "absolute").css("top", viewer.paddingTop).css("left", parseFloat($("." + PAPAYA_VIEWER_CSS).css("padding-left")) + 8).css('height', '5px').css('width', viewer.mainImage.screenDim - 1 + "px");
        viewer.selectedSliceAxialRed.css("position", "absolute").css("top", viewer.paddingTop + 7).css("left", parseFloat($("." + PAPAYA_VIEWER_CSS).css("padding-left")) + 12);
        //overlays

    } else if (viewer.mainImage.sliceDirection == papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
        viewer.crossHairCoronalBlue.css("position", "absolute").css("top", viewer.paddingTop).css("left", parseFloat($("." + PAPAYA_VIEWER_CSS).css("padding-left")) + 8).css('height', '5px').css('width', viewer.mainImage.screenDim - 1 + "px");
        viewer.selectedSliceCoronalBlue.css("position", "absolute").css("top", viewer.paddingTop + 7).css("left", parseFloat($("." + PAPAYA_VIEWER_CSS).css("padding-left")) + 12);

    } else if (viewer.mainImage.sliceDirection == papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
        viewer.crossHairSagitalGreen.css("position", "absolute").css("top", viewer.paddingTop).css("left", parseFloat($("." + PAPAYA_VIEWER_CSS).css("padding-left")) + 8).css('height', '5px').css('width', viewer.mainImage.screenDim - 1 + "px");
        viewer.selectedSliceSagitalGreen.css("position", "absolute").css("top", viewer.paddingTop + 7).css("left", parseFloat($("." + PAPAYA_VIEWER_CSS).css("padding-left")) + 12);

    }
    else {
        viewer.crossHairSurfaceYellow.css("position", "absolute").css("top", viewer.paddingTop).css("left", parseFloat($("." + PAPAYA_VIEWER_CSS).css("padding-left")) + 8).css('height', '5px').css('width', viewer.mainImage.screenDim - 1 + "px");
        viewer.selectedSliceSurfaceYellow.css("position", "absolute").css("top", viewer.paddingTop + 7).css("left", parseFloat($("." + PAPAYA_VIEWER_CSS).css("padding-left")) + 12);
    }

    if (viewer.lowerImageTop.sliceDirection == papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
        viewer.crossHairAxialRed.css("position", "absolute").css("top", viewer.paddingTop).css("left", (parseFloat($("." + PAPAYA_VIEWER_CSS).css("padding-left")) + (viewer.lowerImageTop.screenOffsetX) + 8)).css('height', '5px').css('width', viewer.lowerImageTop.screenDim - 1 + 'px');
        viewer.selectedSliceAxialRed.css("position", "absolute").css("top", viewer.paddingTop + 7).css("left", parseFloat($("." + PAPAYA_VIEWER_CSS).css("padding-left")) + (viewer.lowerImageTop.screenOffsetX) + 12);

    } else if (viewer.lowerImageTop.sliceDirection == papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
        viewer.crossHairCoronalBlue.css("position", "absolute").css("top", viewer.paddingTop).css("left", (parseFloat($("." + PAPAYA_VIEWER_CSS).css("padding-left")) + (viewer.lowerImageTop.screenOffsetX) + 8)).css('height', '5px').css('width', viewer.lowerImageTop.screenDim - 1 + 'px');
        viewer.selectedSliceCoronalBlue.css("position", "absolute").css("top", viewer.paddingTop + 7).css("left", parseFloat($("." + PAPAYA_VIEWER_CSS).css("padding-left")) + (viewer.lowerImageTop.screenOffsetX) + 12);

    } else if (viewer.lowerImageTop.sliceDirection == papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
        viewer.crossHairSagitalGreen.css("position", "absolute").css("top", viewer.paddingTop).css("left", (parseFloat($("." + PAPAYA_VIEWER_CSS).css("padding-left")) + (viewer.lowerImageTop.screenOffsetX) + 8)).css('height', '5px').css('width', viewer.lowerImageTop.screenDim - 1 + 'px');
        viewer.selectedSliceSagitalGreen.css("position", "absolute").css("top", viewer.paddingTop + 7).css("left", parseFloat($("." + PAPAYA_VIEWER_CSS).css("padding-left")) + (viewer.lowerImageTop.screenOffsetX) + 12);

    }
    else {
        viewer.crossHairSurfaceYellow.css("position", "absolute").css("top", viewer.paddingTop).css("left", (parseFloat($("." + PAPAYA_VIEWER_CSS).css("padding-left")) + (viewer.lowerImageTop.screenOffsetX) + 8)).css('height', '5px').css('width', viewer.lowerImageTop.screenDim - 1 + 'px');
        viewer.selectedSliceSurfaceYellow.css("position", "absolute").css("top", viewer.paddingTop + 7).css("left", parseFloat($("." + PAPAYA_VIEWER_CSS).css("padding-left")) + (viewer.lowerImageTop.screenOffsetX) + 12);
    }

    if (viewer.lowerImageBot.sliceDirection == papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
        viewer.crossHairAxialRed.css("position", "absolute").css("top", viewer.lowerImageBot.screenOffsetY + viewer.paddingTop).css("left", (parseFloat($("." + PAPAYA_VIEWER_CSS).css("padding-left")) + (viewer.lowerImageBot.screenOffsetX) + 8)).css('height', '5px').css('width', viewer.lowerImageBot.screenDim - 1 + 'px');
        viewer.selectedSliceAxialRed.css("position", "absolute").css("top", viewer.lowerImageBot.screenOffsetY + viewer.paddingTop + 7).css("left", parseFloat($("." + PAPAYA_VIEWER_CSS).css("padding-left")) + (viewer.lowerImageBot.screenOffsetX) + 12);

    } else if (viewer.lowerImageBot.sliceDirection == papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
        viewer.crossHairCoronalBlue.css("position", "absolute").css("top", viewer.lowerImageBot.screenOffsetY + viewer.paddingTop).css("left", (parseFloat($("." + PAPAYA_VIEWER_CSS).css("padding-left")) + (viewer.lowerImageBot.screenOffsetX) + 8)).css('height', '5px').css('width', viewer.lowerImageBot.screenDim - 1 + 'px');
        viewer.selectedSliceCoronalBlue.css("position", "absolute").css("top", viewer.lowerImageBot.screenOffsetY + viewer.paddingTop + 7).css("left", parseFloat($("." + PAPAYA_VIEWER_CSS).css("padding-left")) + (viewer.lowerImageBot.screenOffsetX) + 12);

    } else if (viewer.lowerImageBot.sliceDirection == papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
        viewer.crossHairSagitalGreen.css("position", "absolute").css("top", viewer.lowerImageBot.screenOffsetY + viewer.paddingTop).css("left", (parseFloat($("." + PAPAYA_VIEWER_CSS).css("padding-left")) + (viewer.lowerImageBot.screenOffsetX) + 8)).css('height', '5px').css('width', viewer.lowerImageBot.screenDim - 1 + 'px');
        viewer.selectedSliceSagitalGreen.css("position", "absolute").css("top", viewer.lowerImageBot.screenOffsetY + viewer.paddingTop + 7).css("left", parseFloat($("." + PAPAYA_VIEWER_CSS).css("padding-left")) + (viewer.lowerImageBot.screenOffsetX) + 12);


    } else {
        viewer.crossHairSurfaceYellow.css("position", "absolute").css("top", viewer.lowerImageBot.screenOffsetY + viewer.paddingTop).css("left", (parseFloat($("." + PAPAYA_VIEWER_CSS).css("padding-left")) + (viewer.lowerImageBot.screenOffsetX) + 8)).css('height', '5px').css('width', viewer.lowerImageBot2.screenDim - 1 + 'px');
        viewer.selectedSliceSurfaceYellow.css("position", "absolute").css("top", viewer.lowerImageBot.screenOffsetY + viewer.paddingTop + 7).css("left", parseFloat($("." + PAPAYA_VIEWER_CSS).css("padding-left")) + (viewer.lowerImageBot.screenOffsetX) + 12);
    }

    if (viewer.lowerImageBot2 != null) {
        if (viewer.lowerImageBot2.sliceDirection == papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
            viewer.crossHairAxialRed.css("position", "absolute").css("top", viewer.lowerImageBot2.screenOffsetY + viewer.paddingTop).css("left", (parseFloat($("." + PAPAYA_VIEWER_CSS).css("padding-left")) + (viewer.lowerImageBot2.screenOffsetX) + 8)).css('height', '5px').css('width', viewer.lowerImageBot2.screenDim - 1 + 'px');
            viewer.selectedSliceAxialRed.css("position", "absolute").css("top", viewer.lowerImageBot2.screenOffsetY + viewer.paddingTop + 7).css("left", parseFloat($("." + PAPAYA_VIEWER_CSS).css("padding-left")) + (viewer.lowerImageBot2.screenOffsetX) + 12);


        } else if (viewer.lowerImageBot2.sliceDirection == papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
            viewer.crossHairCoronalBlue.css("position", "absolute").css("top", viewer.lowerImageBot2.screenOffsetY + viewer.paddingTop).css("left", (parseFloat($("." + PAPAYA_VIEWER_CSS).css("padding-left")) + (viewer.lowerImageBot2.screenOffsetX) + 8)).css('height', '5px').css('width', viewer.lowerImageBot2.screenDim - 1 + 'px');
            viewer.selectedSliceCoronalBlue.css("position", "absolute").css("top", viewer.lowerImageBot2.screenOffsetY + viewer.paddingTop + 7).css("left", parseFloat($("." + PAPAYA_VIEWER_CSS).css("padding-left")) + (viewer.lowerImageBot2.screenOffsetX) + 12);

        } else if (viewer.lowerImageBot2.sliceDirection == papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
            viewer.crossHairSagitalGreen.css("position", "absolute").css("top", viewer.lowerImageBot2.screenOffsetY + viewer.paddingTop).css("left", (parseFloat($("." + PAPAYA_VIEWER_CSS).css("padding-left")) + (viewer.lowerImageBot2.screenOffsetX) + 8)).css('height', '5px').css('width', viewer.lowerImageBot2.screenDim - 1 + 'px');
            viewer.selectedSliceSagitalGreen.css("position", "absolute").css("top", viewer.lowerImageBot2.screenOffsetY + viewer.paddingTop + 7).css("left", parseFloat($("." + PAPAYA_VIEWER_CSS).css("padding-left")) + (viewer.lowerImageBot2.screenOffsetX) + 12);

        } else {
            viewer.crossHairSurfaceYellow.css("position", "absolute").css("top", viewer.lowerImageBot2.screenOffsetY + viewer.paddingTop).css("left", (parseFloat($("." + PAPAYA_VIEWER_CSS).css("padding-left")) + (viewer.lowerImageBot2.screenOffsetX) + 8)).css('height', '5px').css('width', viewer.lowerImageBot2.screenDim - 1 + 'px');
            viewer.selectedSliceSurfaceYellow.css("position", "absolute").css("top", viewer.lowerImageBot2.screenOffsetY + viewer.paddingTop + 7).css("left", parseFloat($("." + PAPAYA_VIEWER_CSS).css("padding-left")) + (viewer.lowerImageBot2.screenOffsetX) + 12);
        }
    }
}

papaya.viewer.Tools.prototype.getScaleUnit = function (unit, text) {
    var textSuffix = {
        text: text,
        suffix: ""
    };

    switch (unit) {
        case "cm":
            textSuffix.text = text / 10;
            textSuffix.suffix = ' cm';
            break;
        case "inches":
            textSuffix.text = text / 25.4;
            textSuffix.suffix = ' in';
            break;
        case "feet":
            textSuffix.text = text / 304.8;
            textSuffix.suffix = ' ft';
            break;
        case "micrometer":
            textSuffix.text = text / 0.0010000;
            textSuffix.suffix = ' \xB5' + "m";
            break;
        case "meter":
            textSuffix.text = text / 1000.0;
            textSuffix.suffix = ' m';
            break;
        case "yd":
            textSuffix.text = text * 0.0010936132983377078;
            textSuffix.suffix = ' yd';
            break;
        default:
            textSuffix.suffix = " mm";
    }
    return textSuffix;
}

papaya.viewer.Tools.prototype.getRectAndEllipseUnit = function (unit, area) {
    var textSuffix = {
        area: area,
        suffix: "",
        areaText: ""
    };
    switch (unit) {
        case "cm":
            textSuffix.area = (area / 100).toFixed(3);
            textSuffix.suffix = ' cm' + String.fromCharCode(178);
            textSuffix.areaText = 'Area: ' + textSuffix.area + textSuffix.suffix;
            break;
        case "inches":
            textSuffix.area = (area * 0.001550003100006).toFixed(3);
            textSuffix.suffix = ' in' + String.fromCharCode(178);
            textSuffix.areaText = 'Area: ' + textSuffix.area + textSuffix.suffix;
            break;
        case "feet":
            textSuffix.area = (area * 0.00001076391041671).toFixed(3);
            textSuffix.suffix = ' ft' + String.fromCharCode(178);
            textSuffix.areaText = 'Area: ' + textSuffix.area + textSuffix.suffix;
            break;

        case "micrometer":
            textSuffix.area = (area * 1000000).toFixed(3);
            textSuffix.suffix = ' \xB5' + "m" + String.fromCharCode(178);
            textSuffix.areaText = 'Area: ' + textSuffix.area + textSuffix.suffix;
            break;
        case "meter":
            textSuffix.area = (area * 0.000001).toFixed(3);
            textSuffix.suffix = ' m' + String.fromCharCode(178);
            textSuffix.areaText = 'Area: ' + textSuffix.area + textSuffix.suffix;
            break;
        case "yd":
            textSuffix.area = (area * 0.000001195990046301).toFixed(3);
            textSuffix.suffix = ' yd' + String.fromCharCode(178);
            textSuffix.areaText = 'Area: ' + textSuffix.area + textSuffix.suffix;
            break;
        default:
            textSuffix.suffix = ' mm' + String.fromCharCode(178);
            textSuffix.areaText = 'Area: ' + (area.toFixed(3)) + textSuffix.suffix;
            break;
    }
    return textSuffix;
};

papaya.viewer.Tools.prototype.calculateStanderdMeanDeviation = function (sp, ellipse) {
    var sum = 0;
    var sumSquared = 0;
    var count = 0;
    var index = 0;

    for (var y = ellipse.top; y < ellipse.top + ellipse.height; y++) {
        for (var x = ellipse.left; x < ellipse.left + ellipse.width; x++) {
            sum += sp[index];
            sumSquared += sp[index] * sp[index];
            count++;
            index++;
        }
    }

    if (count === 0) {
        return {
            count: count,
            mean: 0.0,
            variance: 0.0,
            stdDev: 0.0
        };
    }

    var mean = sum / count;
    var variance = sumSquared / count - mean * mean;

    return {
        count: count,
        mean: mean,
        variance: variance,
        stdDev: Math.sqrt(variance)
    };
};

papaya.viewer.Tools.prototype.getStoredPixelData = function (pixelData, volume, x, y, width, height) {
    if (pixelData === undefined) {
        throw "getStoredPixels: parameter element must not be undefined";
    }

    x = Math.round(x);
    y = Math.round(y);
    var storedPixelsData = [];
    var index = 0;
    for (var row = 0; row < height; row++) {
        for (var column = 0; column < width; column++) {
            var spIndex = ((row + y) * volume.header.imageDimensions.cols) + (column + x);
            storedPixelsData[index++] = pixelData[spIndex];
        }
    }
    return storedPixelsData;
}

papaya.viewer.Tools.prototype.drawEllipseMode = function (context, x, y, w, h) {
    var kappa = 0.5522848,
        ox = (w / 2) * kappa,
        oy = (h / 2) * kappa,
        xe = x + w,
        ye = y + h,
        xm = x + w / 2,
        ym = y + h / 2;
    context.beginPath();
    context.moveTo(x, ym);
    context.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
    context.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
    context.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
    context.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
    context.closePath();
    context.stroke();
}

papaya.viewer.Tools.prototype.createToolObjectForDraw = function (toolName, pointsCordOne) {
    var toolObject;
    switch (toolName) {
        case PAPAYA_TOOL_RULER:
            toolObject = {
                toolActive: true,
                toolHandles: {
                    start: {
                        xCord: pointsCordOne.xCord,
                        yCord: pointsCordOne.yCord,
                        zCord: pointsCordOne.zCord,
                        toolActive: false
                    },
                    end: {
                        xCord: pointsCordOne.xCord,
                        yCord: pointsCordOne.yCord,
                        zCord: pointsCordOne.zCord,
                        toolActive: true
                    }
                }
            };
            break
        case PAPAYA_TOOL_ANGLE:
            toolObject = {
                isWaitingForLine: false,
                toolActive: true,
                toolHandles: {
                    start: {
                        xCord: pointsCordOne.xCord,
                        yCord: pointsCordOne.yCord,
                        zCord: pointsCordOne.zCord,
                        toolActive: false
                    },
                    middle: {
                        xCord: pointsCordOne.xCord,
                        yCord: pointsCordOne.yCord,
                        zCord: pointsCordOne.zCord,
                        toolActive: true
                    },
                    end: {
                        xCord: pointsCordOne.xCord,
                        yCord: pointsCordOne.yCord,
                        zCord: pointsCordOne.zCord,
                        toolActive: false
                    }
                }
            };
            break;
        case PAPAYA_TOOL_RECTANGLE:
            toolObject = {
                toolActive: true,
                toolHandles: {
                    start: {
                        xCord: pointsCordOne.xCord,
                        yCord: pointsCordOne.yCord,
                        zCord: pointsCordOne.zCord,
                        toolActive: false
                    },
                    end: {
                        xCord: pointsCordOne.xCord,
                        yCord: pointsCordOne.yCord,
                        zCord: pointsCordOne.zCord,
                        toolActive: true
                    }
                }
            };
            break;
        case PAPAYA_TOOL_ELLIPSE:
            toolObject = {
                toolActive: true,
                toolHandles: {
                    start: {
                        xCord: pointsCordOne.xCord,
                        yCord: pointsCordOne.yCord,
                        zCord: pointsCordOne.zCord,
                        toolActive: false
                    },
                    end: {
                        xCord: pointsCordOne.xCord,
                        yCord: pointsCordOne.yCord,
                        zCord: pointsCordOne.zCord,
                        toolActive: true
                    }
                }
            };
            break;
        case PAPAYA_TOOL_COBSANGLE:
            toolObject = {
                isWaitingForLine: false,
                toolActive: true,
                toolHandles: {
                    startOne: {
                        xCord: pointsCordOne.xCord,
                        yCord: pointsCordOne.yCord,
                        zCord: pointsCordOne.zCord,
                        toolActive: false
                    },
                    endOne: {
                        xCord: pointsCordOne.xCord,
                        yCord: pointsCordOne.yCord,
                        zCord: pointsCordOne.zCord,
                        toolActive: true
                    }
                }
            }
            break;
        case PAPAYA_TOOL_PIXELPROBE:
            toolObject = {
                toolActive: true,
                toolHandles: {
                    end: {
                        xCord: pointsCordOne.xCord,
                        yCord: pointsCordOne.yCord,
                        zCord: pointsCordOne.zCord,
                        toolActive: true
                    }
                }
            }
            break;
    }
    return toolObject;
};

papaya.viewer.Tools.prototype.getSelectedIndexForImageSlice = function (toolName, selectedIndex) {

    switch (toolName) {
        case PAPAYA_TOOL_RULER:
            this.selectedIndexRulerOnImage = selectedIndex;
            break;
        case PAPAYA_TOOL_ANGLE:
            this.selectedIndexAngleOnImage = selectedIndex;
            break;
        case PAPAYA_TOOL_RECTANGLE:
            this.selectedIndexRectangleOnImage = selectedIndex;
            break;
        case PAPAYA_TOOL_ELLIPSE:
            this.selectedIndexEllipseOnImage = selectedIndex;
            break;
        case PAPAYA_TOOL_COBSANGLE:
            this.selectedIndexCobsAngleOnImage = selectedIndex;
            break;
        case PAPAYA_TOOL_PIXELPROBE:
            this.selectedIndexPixelProbeOnImage = selectedIndex;
            break;
    }
};

papaya.viewer.Tools.prototype.drawToolOnCanvasSlice = function (toolName, viewer, screenSlice) {
    var ruler1x, ruler1y, ruler2x, ruler2y, ruler3x, ruler3y, text, metrics, textWidth, textHeight, padding, xText, yText;

    if (screenSlice === viewer.surfaceView) {
        return;
    }
    var imageToolData = screenSlice.getImageToolState(toolName);
    if (imageToolData != undefined && imageToolData.imageDatas != undefined && imageToolData.imageDatas.length > 0) {
        viewer.clipCanvas(screenSlice);
        imageToolData = imageToolData.imageDatas;
        for (var i = 0; i < imageToolData.length; i++) {

            if (screenSlice === viewer.axialSlice) {
                ruler1x = (viewer.axialSlice.finalTransform[0][2] + (imageToolData[i].toolHandles.start.xCord + 0.5) * viewer.axialSlice.finalTransform[0][0]);
                ruler1y = (viewer.axialSlice.finalTransform[1][2] + (imageToolData[i].toolHandles.start.yCord + 0.5) * viewer.axialSlice.finalTransform[1][1]);
                switch (toolName) {
                    case PAPAYA_TOOL_ANGLE:
                        ruler2x = (viewer.axialSlice.finalTransform[0][2] + (imageToolData[i].toolHandles.middle.xCord + 0.5) * viewer.axialSlice.finalTransform[0][0]);
                        ruler2y = (viewer.axialSlice.finalTransform[1][2] + (imageToolData[i].toolHandles.middle.yCord + 0.5) * viewer.axialSlice.finalTransform[1][1]);
                        ruler3x = (viewer.axialSlice.finalTransform[0][2] + (imageToolData[i].toolHandles.end.xCord + 0.5) * viewer.axialSlice.finalTransform[0][0]);
                        ruler3y = (viewer.axialSlice.finalTransform[1][2] + (imageToolData[i].toolHandles.end.yCord + 0.5) * viewer.axialSlice.finalTransform[1][1]);
                        break;
                    default:
                        ruler2x = (viewer.axialSlice.finalTransform[0][2] + (imageToolData[i].toolHandles.end.xCord + 0.5) * viewer.axialSlice.finalTransform[0][0]);
                        ruler2y = (viewer.axialSlice.finalTransform[1][2] + (imageToolData[i].toolHandles.end.yCord + 0.5) * viewer.axialSlice.finalTransform[1][1]);
                        text = papaya.utilities.StringUtils.formatNumber(papaya.utilities.MathUtils.lineDistance(
                            imageToolData[i].toolHandles.start.xCord * screenSlice.xSize,
                            imageToolData[i].toolHandles.start.yCord * screenSlice.ySize,
                            imageToolData[i].toolHandles.end.xCord * screenSlice.xSize,
                            imageToolData[i].toolHandles.end.yCord * screenSlice.ySize), false);
                }
            } else if (screenSlice === viewer.coronalSlice) {
                ruler1x = (viewer.coronalSlice.finalTransform[0][2] + (imageToolData[i].toolHandles.start.xCord + 0.5) * viewer.coronalSlice.finalTransform[0][0]);
                ruler1y = (viewer.coronalSlice.finalTransform[1][2] + (imageToolData[i].toolHandles.start.zCord + 0.5) * viewer.coronalSlice.finalTransform[1][1]);
                switch (toolName) {
                    case PAPAYA_TOOL_ANGLE:
                        ruler2x = (viewer.coronalSlice.finalTransform[0][2] + (imageToolData[i].toolHandles.end.xCord + 0.5) * viewer.coronalSlice.finalTransform[0][0]);
                        ruler2y = (viewer.coronalSlice.finalTransform[1][2] + (imageToolData[i].toolHandles.end.zCord + 0.5) * viewer.coronalSlice.finalTransform[1][1]);
                        ruler3x = (viewer.coronalSlice.finalTransform[0][2] + (imageToolData[i].toolHandles.end.xCord + 0.5) * viewer.coronalSlice.finalTransform[0][0]);
                        ruler3y = (viewer.coronalSlice.finalTransform[1][2] + (imageToolData[i].toolHandles.end.zCord + 0.5) * viewer.coronalSlice.finalTransform[1][1]);
                        break;
                    default:
                        ruler2x = (viewer.coronalSlice.finalTransform[0][2] + (imageToolData[i].toolHandles.end.xCord + 0.5) * viewer.coronalSlice.finalTransform[0][0]);
                        ruler2y = (viewer.coronalSlice.finalTransform[1][2] + (imageToolData[i].toolHandles.end.zCord + 0.5) * viewer.coronalSlice.finalTransform[1][1]);
                        text = papaya.utilities.StringUtils.formatNumber(papaya.utilities.MathUtils.lineDistance(
                            imageToolData[i].toolHandles.start.xCord * screenSlice.xSize,
                            imageToolData[i].toolHandles.start.zCord * screenSlice.ySize,
                            imageToolData[i].toolHandles.end.xCord * screenSlice.xSize,
                            imageToolData[i].toolHandles.end.zCord * screenSlice.ySize), false);
                }

            } else if (screenSlice === viewer.sagittalSlice) {
                ruler1x = (viewer.sagittalSlice.finalTransform[0][2] + (imageToolData[i].toolHandles.start.yCord + 0.5) * viewer.sagittalSlice.finalTransform[0][0]);
                ruler1y = (viewer.sagittalSlice.finalTransform[1][2] + (imageToolData[i].toolHandles.start.zCord + 0.5) * viewer.sagittalSlice.finalTransform[1][1]);
                switch (toolName) {
                    case PAPAYA_TOOL_ANGLE:
                        ruler2x = (viewer.sagittalSlice.finalTransform[0][2] + (imageToolData[i].toolHandles.end.yCord + 0.5) * viewer.sagittalSlice.finalTransform[0][0]);
                        ruler2y = (viewer.sagittalSlice.finalTransform[1][2] + (imageToolData[i].toolHandles.end.zCord + 0.5) * viewer.sagittalSlice.finalTransform[1][1]);
                        ruler3x = (viewer.axialSlice.finalTransform[0][2] + (imageToolData[i].toolHandles.end.yCord + 0.5) * viewer.axialSlice.finalTransform[0][0]);
                        ruler3y = (viewer.axialSlice.finalTransform[1][2] + (imageToolData[i].toolHandles.end.zCord + 0.5) * viewer.axialSlice.finalTransform[1][1]);
                        break;
                    default:
                        ruler2x = (viewer.sagittalSlice.finalTransform[0][2] + (imageToolData[i].toolHandles.end.yCord + 0.5) * viewer.sagittalSlice.finalTransform[0][0]);
                        ruler2y = (viewer.sagittalSlice.finalTransform[1][2] + (imageToolData[i].toolHandles.end.zCord + 0.5) * viewer.sagittalSlice.finalTransform[1][1]);
                        text = papaya.utilities.StringUtils.formatNumber(papaya.utilities.MathUtils.lineDistance(
                            imageToolData[i].toolHandles.start.yCord * screenSlice.xSize,
                            imageToolData[i].toolHandles.start.zCord * screenSlice.ySize,
                            imageToolData[i].toolHandles.end.yCord * screenSlice.xSize,
                            imageToolData[i].toolHandles.end.zCord * screenSlice.ySize), false);
                }
            }
            viewer.context.setTransform(1, 0, 0, 1, 0, 0);
            var color;
            if (imageToolData[i].toolActive) {
                color = viewer.activeRulerColor;
            }
            else {
                color = viewer.rulerColor;
            }
            viewer.context.strokeStyle = color;
            viewer.context.fillStyle = color;
            viewer.context.lineWidth = viewer.rulerWidth;
            viewer.context.beginPath();
            if (toolName === PAPAYA_TOOL_RULER) {
                viewer.context.moveTo(ruler1x, ruler1y);
                viewer.context.lineTo(ruler2x, ruler2y);
            }
            else if (toolName === PAPAYA_TOOL_ANGLE) {
                viewer.context.moveTo(ruler1x, ruler1y);
                viewer.context.lineTo(ruler2x, ruler2y);
                viewer.context.lineTo(ruler3x, ruler3y);
            } else if (toolName === PAPAYA_TOOL_RECTANGLE) {
                var canvasWidth = Math.abs(ruler1x - ruler2x);
                var canvasHeight = Math.abs(ruler1y - ruler2y);
                var canvasLeft = Math.min(ruler1x, ruler2x);
                var canvasTop = Math.min(ruler1y, ruler2y);
                viewer.context.rect(canvasLeft, canvasTop, canvasWidth, canvasHeight);
            } else if (toolName === PAPAYA_TOOL_ELLIPSE) {
                var canvasWidth = Math.abs(ruler1x - ruler2x);
                var canvasHeight = Math.abs(ruler1y - ruler2y);
                var canvasLeft = Math.min(ruler1x, ruler2x);
                var canvasTop = Math.min(ruler1y, ruler2y);
                this.drawEllipseMode(viewer.context, canvasLeft, canvasTop, canvasWidth, canvasHeight);
            }
            viewer.context.stroke();
            viewer.context.closePath();

            viewer.context.beginPath();
            viewer.context.arc(ruler1x, ruler1y, 3, 0, 2 * Math.PI, false);
            viewer.context.fillStyle = color;
            viewer.context.fill();
            viewer.context.stroke();
            viewer.context.closePath();
            viewer.context.beginPath();
            viewer.context.arc(ruler2x, ruler2y, 3, 0, 2 * Math.PI, false);
            viewer.context.fillStyle = color;
            viewer.context.fill();
            viewer.context.stroke();
            viewer.context.closePath();

            switch (toolName) {
                case PAPAYA_TOOL_RULER:
                    var suffix;
                    viewer.context.font = viewer.rulerFontSize + "px sans-serif"; //papaya.viewer.Viewer.ORIENTATION_MARKER_SIZE + "px sans-serif";

                    var textSuffix = this.getScaleUnit(this.rulerUnit, text);
                    text = this.roundToDecimal(textSuffix.text, 2);
                    suffix = textSuffix.suffix;
                    metrics = viewer.context.measureText(text + suffix);
                    textWidth = metrics.width;
                    textHeight = viewer.rulerFontSize;
                    padding = 2;
                    xText = parseInt((ruler1x + ruler2x) / 2) - (textWidth / 2);
                    yText = parseInt((ruler1y + ruler2y) / 2) + (textHeight / 2);

                    viewer.context.fillStyle = "transparent"; //"#000000";//#ffffff
                    viewer.drawRoundRect(viewer.context, xText - padding, yText - textHeight - padding + 1, textWidth + (padding * 2), textHeight + (padding * 2), 5, true, false);

                    viewer.context.strokeStyle = color;
                    viewer.context.fillStyle = color;

                    viewer.context.fillText(text + suffix, xText, yText);
                    break;
                case PAPAYA_TOOL_ANGLE:
                    viewer.context.beginPath();
                    viewer.context.arc(ruler3x, ruler3y, 3, 0, 2 * Math.PI);
                    viewer.context.fillStyle = color;
                    viewer.context.fill();
                    viewer.context.stroke();
                    viewer.context.closePath();
                    var sideALength, sideBLength, sideCLength;
                    if (screenSlice === viewer.axialSlice) {
                        sideALength = papaya.utilities.StringUtils.formatNumber(papaya.utilities.MathUtils.lineDistance(
                            imageToolData[i].toolHandles.start.xCord * screenSlice.xSize,
                            imageToolData[i].toolHandles.start.yCord * screenSlice.ySize,
                            imageToolData[i].toolHandles.middle.xCord * screenSlice.xSize,
                            imageToolData[i].toolHandles.middle.yCord * screenSlice.ySize), false);
                        sideBLength = papaya.utilities.StringUtils.formatNumber(papaya.utilities.MathUtils.lineDistance(
                            imageToolData[i].toolHandles.middle.xCord * screenSlice.xSize,
                            imageToolData[i].toolHandles.middle.yCord * screenSlice.ySize,
                            imageToolData[i].toolHandles.end.xCord * screenSlice.xSize,
                            imageToolData[i].toolHandles.end.yCord * screenSlice.ySize), false);
                        sideCLength = papaya.utilities.StringUtils.formatNumber(papaya.utilities.MathUtils.lineDistance(
                            imageToolData[i].toolHandles.end.xCord * screenSlice.xSize,
                            imageToolData[i].toolHandles.end.yCord * screenSlice.ySize,
                            imageToolData[i].toolHandles.start.xCord * screenSlice.xSize,
                            imageToolData[i].toolHandles.start.yCord * screenSlice.ySize), false);
                    }
                    else if (screenSlice === viewer.coronalSlice) {
                        sideALength = papaya.utilities.StringUtils.formatNumber(papaya.utilities.MathUtils.lineDistance(
                            imageToolData[i].toolHandles.start.xCord * screenSlice.xSize,
                            imageToolData[i].toolHandles.start.zCord * screenSlice.ySize,
                            imageToolData[i].toolHandles.middle.xCord * screenSlice.xSize,
                            imageToolData[i].toolHandles.middle.zCord * screenSlice.ySize), false);
                        sideBLength = papaya.utilities.StringUtils.formatNumber(papaya.utilities.MathUtils.lineDistance(
                            imageToolData[i].toolHandles.middle.xCord * screenSlice.xSize,
                            imageToolData[i].toolHandles.middle.zCord * screenSlice.ySize,
                            imageToolData[i].toolHandles.end.xCord * screenSlice.xSize,
                            imageToolData[i].toolHandles.end.zCord * screenSlice.ySize), false);
                        sideCLength = papaya.utilities.StringUtils.formatNumber(papaya.utilities.MathUtils.lineDistance(
                            imageToolData[i].toolHandles.end.xCord * screenSlice.xSize,
                            imageToolData[i].toolHandles.end.zCord * screenSlice.ySize,
                            imageToolData[i].toolHandles.start.xCord * screenSlice.xSize,
                            imageToolData[i].toolHandles.start.zCord * screenSlice.ySize), false);
                    }
                    else if (screenSlice === viewer.sagittalSlice) {
                        sideALength = papaya.utilities.StringUtils.formatNumber(papaya.utilities.MathUtils.lineDistance(
                            imageToolData[i].toolHandles.start.yCord * screenSlice.xSize,
                            imageToolData[i].toolHandles.start.zCord * screenSlice.ySize,
                            imageToolData[i].toolHandles.middle.yCord * screenSlice.xSize,
                            imageToolData[i].toolHandles.middle.zCord * screenSlice.ySize), false);
                        sideBLength = papaya.utilities.StringUtils.formatNumber(papaya.utilities.MathUtils.lineDistance(
                            imageToolData[i].toolHandles.middle.yCord * screenSlice.xSize,
                            imageToolData[i].toolHandles.middle.zCord * screenSlice.ySize,
                            imageToolData[i].toolHandles.end.yCord * screenSlice.xSize,
                            imageToolData[i].toolHandles.end.zCord * screenSlice.ySize), false);
                        sideCLength = papaya.utilities.StringUtils.formatNumber(papaya.utilities.MathUtils.lineDistance(
                            imageToolData[i].toolHandles.end.yCord * screenSlice.xSize,
                            imageToolData[i].toolHandles.end.zCord * screenSlice.ySize,
                            imageToolData[i].toolHandles.start.yCord * screenSlice.xSize,
                            imageToolData[i].toolHandles.start.zCord * screenSlice.ySize), false);
                    }
                    // Cosine law
                    var angle = Math.acos((Math.pow(sideALength, 2) + Math.pow(sideBLength, 2) - Math.pow(sideCLength, 2)) / (2 * sideALength * sideBLength));
                    angle = angle * (180 / Math.PI);

                    var angleValue = this.roundToDecimal(angle, 2);

                    if (angleValue) {
                        viewer.context.font = viewer.rulerFontSize + "px sans-serif";
                        var str = '00B0'; // degrees symbol
                        text = angleValue.toString() + String.fromCharCode(parseInt(str, 16));
                        metrics = viewer.context.measureText(text);
                        textWidth = metrics.width;
                        textHeight = viewer.rulerFontSize;
                        padding = 5;
                        var distance = 5;
                        xText = parseInt(ruler2x);
                        yText = parseInt(ruler2y) + (textHeight / 2);

                        if (ruler2x < ruler1x) {
                            xText -= distance + textWidth;
                        } else {
                            xText += distance;
                        }

                        viewer.context.fillStyle = "transparent";
                        viewer.drawRoundRect(viewer.context, xText - padding, yText - textHeight - padding + 1, textWidth + (padding), textHeight + (padding), 5, true, false);

                        viewer.context.strokeStyle = color;
                        viewer.context.fillStyle = color;

                        viewer.context.fillText(text, xText, yText);                       
                    }
                    break;
                case PAPAYA_TOOL_RECTANGLE:
                    this.drawEllipseAndRectangleSMD(screenSlice, viewer, ruler1x, ruler2x, ruler1y, ruler2y, color, textWidth, textHeight, metrics);
                    break;
                case PAPAYA_TOOL_ELLIPSE:
                    this.drawEllipseAndRectangleSMD(screenSlice, viewer, ruler1x, ruler2x, ruler1y, ruler2y, color, textWidth, textHeight, metrics);
                    break;
            }
        }
        viewer.context.restore();
    }
};

papaya.viewer.Tools.prototype.drawEllipseAndRectangleSMD = function (screenSlice, viewer, ruler1x, ruler2x, ruler1y, ruler2y, color, textWidth, textHeight, metrics) {
    var firstPoint = viewer.convertScreenToImageCoordinate(ruler1x, ruler1y, screenSlice);
    var secondPoint = viewer.convertScreenToImageCoordinate(ruler2x, ruler2y, screenSlice);
    var ellipse = {};
    if (screenSlice === viewer.axialSlice) {
        ellipse = {
            left: Math.min(firstPoint.x, secondPoint.x),
            top: Math.min(firstPoint.y, secondPoint.y),
            width: Math.abs(firstPoint.x - secondPoint.x),
            height: Math.abs(firstPoint.y - secondPoint.y)
        };
    }
    else if (screenSlice === viewer.coronalSlice) {
        ellipse = {
            left: Math.min(firstPoint.x, secondPoint.x),
            top: Math.min(firstPoint.z, secondPoint.z),
            width: Math.abs(firstPoint.x - secondPoint.x),
            height: Math.abs(firstPoint.z - secondPoint.z)
        };
    }
    else {
        ellipse = {
            left: Math.min(firstPoint.y, secondPoint.y),
            top: Math.min(firstPoint.z, secondPoint.z),
            width: Math.abs(firstPoint.x - secondPoint.y),
            height: Math.abs(firstPoint.y - secondPoint.z)
        };
    }

    var pixelData = screenSlice.imageDataDraw.data;
    var byteArray = this.getStoredPixelData(pixelData, viewer.volume, ellipse.left, ellipse.top, ellipse.width, ellipse.height);
    var meanStdDev = this.calculateStanderdMeanDeviation(byteArray, ellipse);
    var stdDev = "Mean DEV.: " + meanStdDev.stdDev.toFixed(2);
    var mean = "Mean: " + meanStdDev.mean.toFixed(2);
    var area = this.roundToDecimal(Math.PI * (ellipse.width / 2) * (ellipse.height / 2), 2);

    var textSuffix = this.getRectAndEllipseUnit(viewer.rulerUnit, area);
    viewer.context.font = viewer.rulerFontSize + "px sans-serif";
    var text = stdDev + " HU" + "\n" + mean + " HU" + "\n" + textSuffix.areaText;

    viewer.context.strokeStyle = color;
    viewer.context.fillStyle = color;

    textWidth = 2;
    textHeight = viewer.rulerFontSize;

    var maxWidth = 100;
    var words = text.split('\n');
    var line = '';
    var xText = parseInt((ruler1x + ruler2x) / 2) - (textWidth / 2);
    var yText = parseInt((ruler1y + ruler2y) / 2) + (textHeight / 2);

    for (var n = 0; n < words.length; n++) {
        var testLine = line + words[n] + ' ';
        metrics = viewer.context.measureText(testLine);
        var testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            viewer.context.fillText(line, xText, yText);
            line = words[n] + ' ';
            yText += parseInt(textHeight);
        }
        else {
            line = testLine;
        }
    }
    viewer.context.fillText(line, xText, yText);

}