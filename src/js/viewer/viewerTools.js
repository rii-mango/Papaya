
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
    this.isForwardDirection = true;
    this.lastSelectedButton;
    this.IsForwardCine = true;
    this.IsRepeatCine = true;
    this.sliderValue = 10;
    this.imageNeedsUpdateForDrawTool = false;
    this.selectedIndexLength;
    this.selectedIndexAngleOnImage;
    this.selectedIndexRectangleOnImage;
}

papaya.viewer.Tools.prototype.GetToolOnMouseDown = function (button, viewer, me) {
    if (viewer.container.params.imageTools) {
        switch (button) {

            case PAPAYA_SIDENAV_BUTTON_STACK:
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

                break;
            case PAPAYA_SIDENAV_BUTTON_PAN:
                viewer.isPanning = true;
                viewer.container.preferences.showCrosshairs = "No"
                viewer.previousMousePosition.x = papaya.utilities.PlatformUtils.getMousePositionX(me);
                viewer.previousMousePosition.y = papaya.utilities.PlatformUtils.getMousePositionY(me);
                this.setStartPanLocationToUpdate(viewer, viewer.convertScreenToImageCoordinateX(viewer.previousMousePosition.x, viewer.mainImage), viewer.convertScreenToImageCoordinateY(viewer.previousMousePosition.y, viewer.mainImage), viewer.mainImage.sliceDirection);
                this.GetSurfaceDisplayOnCanvas(viewer, me);

                break;
            case PAPAYA_SIDENAV_BUTTON_ZOOM:
                viewer.isZoomMode = true;
                viewer.container.preferences.showCrosshairs = "No";
                viewer.previousMousePosition.x = papaya.utilities.PlatformUtils.getMousePositionX(me);
                viewer.previousMousePosition.y = papaya.utilities.PlatformUtils.getMousePositionY(me);
                this.GetSurfaceDisplayOnCanvas(viewer, me);

                break;
            case PAPAYA_SIDENAV_BUTTON_WINDOWLEVEL:
                viewer.isWindowControl = true;
                viewer.previousMousePosition.x = papaya.utilities.PlatformUtils.getMousePositionX(me);
                viewer.previousMousePosition.y = papaya.utilities.PlatformUtils.getMousePositionY(me);
                viewer.container.preferences.showCrosshairs = "No";
                this.GetSurfaceDisplayOnCanvas(viewer, me);

                break;
            case PAPAYA_SIDENAV_BUTTON_CROSSHAIR:
                viewer.isCrosshairMode = true;
                viewer.previousMousePosition.x = papaya.utilities.PlatformUtils.getMousePositionX(me);
                viewer.previousMousePosition.y = papaya.utilities.PlatformUtils.getMousePositionY(me);
                viewer.container.preferences.showCrosshairs = "Yes";
                viewer.findClickedSlice(viewer, viewer.previousMousePosition.x, viewer.previousMousePosition.y);
                this.GetSurfaceDisplayOnCanvas(viewer, me);

                break;
            case PAPAYA_SIDENAV_BUTTON_MAGNIFY:

                this.MagnifyToolEvent(viewer, me);
                break;
            case PAPAYA_SIDENAV_BUTTON_RULER:
                this.DrawRulerOnImageSlice(viewer, me);
                break;
            case PAPAYA_SIDENAV_BUTTON_ANGLE:
                this.DrawAngleOnImageSlice(viewer, me);
                break;
            case PAPAYA_SIDENAV_BUTTON_REACTANGLE:
                this.DrawReactanleOnImageSlice(viewer, me);

        }
    } else {
        viewer.isCrosshairMode = true;
        viewer.previousMousePosition.x = papaya.utilities.PlatformUtils.getMousePositionX(me);
        viewer.previousMousePosition.y = papaya.utilities.PlatformUtils.getMousePositionY(me);
        viewer.container.preferences.showCrosshairs = "Yes";
        viewer.findClickedSlice(viewer, viewer.previousMousePosition.x, viewer.previousMousePosition.y);
        this.GetSurfaceDisplayOnCanvas(viewer, me);
    }
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

papaya.viewer.Tools.prototype.MagnifyToolEvent = function (viewer, me) {
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
                            if ($(this).attr("id") != PAPAYA_SIDENAV_BUTTON_RULER) {
                                $("#" + PAPAYA_RULER_LENGTH_UNIT).css("display", "none");
                            } else {
                                $("#" + PAPAYA_RULER_LENGTH_UNIT).css("display", "block");
                            }
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
                    if ($(this).attr("id") == PAPAYA_SIDENAV_BUTTON_ANGLE) {
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
            if (papayaContainers[0].viewer.Tools.isForwardDirection) {
                papayaContainers[0].viewer.Tools.currentCineImageIndex = 1;
                if (viewer.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
                    papayaContainers[0].viewer.Tools.PlayClineClipAxial(viewer, true);
                } else if (viewer.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
                    papayaContainers[0].viewer.Tools.PlayClineClipCoronal(viewer, true);
                } else if (viewer.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
                    papayaContainers[0].viewer.Tools.PlayClineClipSagittal(viewer, true
                    );
                }

            } else {
                papayaContainers[0].viewer.Tools.currentImageIndex = 1;
                if (viewer.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
                    papayaContainers[0].viewer.Tools.PlayClineClipAxial(viewer, false);
                } else if (viewer.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
                    papayaContainers[0].viewer.Tools.PlayClineClipCoronal(viewer, false);
                } else if (viewer.mainImage.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
                    papayaContainers[0].viewer.Tools.PlayClineClipSagittal(viewer, false)
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

papaya.viewer.Tools.prototype.PlayClineClipAxial = function (viewer, isForword) {
    if (viewer.mainImage.currentSlice + 1 >= viewer.mainImage.sliceCounts && this.IsRepeatCine) {
        viewer.currentCoord.z = 0;
    }
    else if (viewer.mainImage.currentSlice === 0 && this.IsRepeatCine) {
        viewer.currentCoord.z = viewer.mainImage.sliceCounts - 1;
    }
    if (viewer.mainImage.currentSlice + 1 === viewer.mainImage.sliceCounts && !this.IsRepeatCine) {
        if (this.imageIndexValueforCine == 2 && viewer.currentCoord.z != viewer.mainImage.sliceCounts - 1) {
            viewer.incrementAxial(isForword, this.currentCineImageIndex);
        }
        else {
            this.newIamgeIndexValue = 0;
            viewer.currentCoord.z = 0;
            viewer.drawViewer(true, false);
            $('#' + PAPAYA_SIDENAV_BUTTON_PLAYCENE).find('span').removeClass('fa-pause').addClass('fa-play');
            $('#' + PAPAYA_SIDENAV_BUTTON_PLAYCENE).css({ backgroundColor: "darkgoldenrod" });
            this.StopCineClip();
        }

    } else {
        viewer.incrementAxial(isForword, this.currentCineImageIndex);
    }

};

papaya.viewer.Tools.prototype.PlayClineClipCoronal = function (viewer, isForword) {
    if (viewer.mainImage.currentSlice + 1 >= viewer.mainImage.sliceCounts && this.IsRepeatCine) {
        viewer.currentCoord.y = 0;
    }
    else if (viewer.mainImage.currentSlice === 0 && this.IsRepeatCine) {
        viewer.currentCoord.y = viewer.mainImage.sliceCounts - 1;
    }
    if (viewer.mainImage.currentSlice + 1 >= viewer.mainImage.sliceCounts && !this.IsRepeatCine) {
        if (viewer.newIamgeIndexValue == 2 && viewer.currentCoord.y != viewer.mainImage.sliceCounts - 1) {
            viewer.incrementCoronal(isForword, this.currentCineImageIndex);
        }
        else {
            this.imageIndexValueforCine = 0;
            viewer.currentCoord.y = 0;
            viewer.drawViewer(true, false);
            $('#' + PAPAYA_SIDENAV_BUTTON_PLAYCENE).find('span').removeClass('fa-pause').addClass('fa-play');
            $('#' + PAPAYA_SIDENAV_BUTTON_PLAYCENE).css({ backgroundColor: "darkgoldenrod" });
            this.StopCineClip();
        }
    } else {
        viewer.incrementCoronal(isForword, this.currentCineImageIndex);
    }
};

papaya.viewer.Tools.prototype.PlayClineClipSagittal = function (viewer, isForword) {

    if (viewer.mainImage.currentSlice + 1 >= viewer.mainImage.sliceCounts && this.IsRepeatCine) {
        viewer.currentCoord.x = 0;
    }
    else if (viewer.mainImage.currentSlice === 0 && this.IsRepeatCine) {
        viewer.currentCoord.x = viewer.mainImage.sliceCounts - 1;
    }
    if (viewer.mainImage.currentSlice + 1 >= viewer.mainImage.sliceCounts && !this.IsRepeatCine) {
        if (this.imageIndexValueforCine == 2 && viewer.currentCoord.x != viewer.mainImage.sliceCounts - 1) {
            viewer.incrementSagittal(isForword, this.currentCineImageIndex);
        }
        else {
            this.imageIndexValueforCine = 0;
            viewer.currentCoord.x = 0;
            viewer.drawViewer(true, false);
            $('#' + PAPAYA_SIDENAV_BUTTON_PLAYCENE).find('span').removeClass('fa-pause').addClass('fa-play');
            $('#' + PAPAYA_SIDENAV_BUTTON_PLAYCENE).css({ backgroundColor: "darkgoldenrod" });
            this.StopCineClip();
        }
    } else {
        viewer.incrementSagittal(isForword, this.currentCineImageIndex);
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
        $("#" + papayaContainers[0].viewer.Tools.lastSelectedButton).addClass("selected")
    }
    papayaContainers[0].viewer.screenVolumes[0].changeColorTable(papayaContainers[0].viewer, "Grayscale");
    $("#" + PAPAYA_SIDENAV_BUTTON_INVERT).css("background-color", "darkgoldenrod").css("color", "white");
    var center = new papaya.core.Coordinate(Math.floor(viewer.volume.header.imageDimensions.xDim / 2),
        Math.floor(viewer.volume.header.imageDimensions.yDim / 2),
        Math.floor(viewer.volume.header.imageDimensions.zDim / 2));
    viewer.gotoCoordinate(center);
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

papaya.viewer.Tools.prototype.DrawRulerOnImageSlice = function (viewer, me) {
    viewer.isRulerMode = true;
    viewer.container.preferences.showCrosshairs = "No";
    if (viewer.selectedSlice === viewer.surfaceView) {
        return;
    }
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
        pointsCord.x = me.targetTouches[0].pageY - rect.top;
    }
    var pointsCordOne = {
        xCord: 0,
        yCord: 0,
        zCord: 0

    }
    pointsCordOne = { xCord: pointsCord.xCords, yCord: pointsCord.yCords };
    var CordOne = viewer.convertScreenToImageCoordinate(pointsCordOne.xCord, pointsCordOne.yCord, viewer.selectedSlice);
    pointsCordOne = { xCord: CordOne.x, yCord: CordOne.y, zCord: CordOne.z };
    var imgaeTooldata = viewer.selectedSlice.getImageToolState('ruler');
    if (imgaeTooldata === undefined || imgaeTooldata.imageDatas === undefined || imgaeTooldata.imageDatas.length === 0) {

    }
    else {
        var imgaeTooldata = imgaeTooldata.imageDatas;
        for (var i = 0; i < imgaeTooldata.length; i++) {
            var nearbyHandle = this.getToolHandleNearToImagePoint(imgaeTooldata[i].rulerHandles, pointsCordOne, 5);
            if (nearbyHandle !== undefined) {
                this.selectedIndexLength = i;
                nearbyHandle.toolActive = true;
                imgaeTooldata[i].toolActive = true;
                nearbyHandle.xCord = pointsCordOne.xCord
                nearbyHandle.yCord = pointsCordOne.yCord;
                nearbyHandle.zCord = pointsCordOne.zCord;
                this.imageNeedsUpdateForDrawTool = true;
            }
            var activeHandle = this.getActiveToolHandle(imgaeTooldata[i].rulerHandles);
            if (activeHandle != undefined && activeHandle != nearbyHandle)
                activeHandle.toolActive = false;
        }
    }
    if (!this.imageNeedsUpdateForDrawTool) {

        var rulerObject = {
            toolActive: true,
            rulerHandles: {
                rulerStart: {
                    xCord: pointsCordOne.xCord,
                    yCord: pointsCordOne.yCord,
                    zCord: pointsCordOne.zCord,
                    toolActive: false
                },
                rulerEnd: {
                    xCord: pointsCordOne.xCord,
                    yCord: pointsCordOne.yCord,
                    zCord: pointsCordOne.zCord,
                    toolActive: true
                }
            }
        }
        viewer.selectedSlice.setImageToolState('ruler', rulerObject);
        var imageToolData = viewer.selectedSlice.getImageToolState('ruler');
        if (imageToolData === undefined || imageToolData.imageDatas === undefined || imageToolData.imageDatas.length === 0) {

        }
        else {
            imageToolData = imageToolData.imageDatas;
        }
        this.selectedIndexLength = imageToolData.length - 1;
    }
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

    var firstPointSelect;

    firstPointSelect = { xCord: pointCord.xCord, yCord: pointCord.yCord };

    var cordOne = viewer.convertScreenToImageCoordinate(firstPointSelect.xCord, firstPointSelect.yCord, viewer.selectedSlice);

    firstPointSelect = { xCord: cordOne.x, yCord: cordOne.y, zCord: cordOne.z };

    var toolImageData = viewer.selectedSlice.getImageToolState('angle');
    if (toolImageData === undefined || toolImageData.imageDatas === undefined || toolImageData.imageDatas.length === 0) {

    }
    else {
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
                nearbyToolHandle.x = cordOne.x;
                nearbyToolHandle.y = cordOne.y;
                nearbyToolHandle.z = cordOne.z;
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
                    xCord: cordOne.x,
                    yCord: cordOne.y,
                    zCord: cordOne.z,
                    toolActive: false
                },
                middle: {
                    xCord: cordOne.x,
                    yCord: cordOne.y,
                    zCord: cordOne.z,
                    toolActive: true
                },
                end: {
                    xCord: cordOne.x,
                    yCord: cordOne.y,
                    zCord: cordOne.z,
                    toolActive: false
                }
            }
        }
        viewer.selectedSlice.setImageToolState('angle', angelObject);
        toolImageData = viewer.selectedSlice.getImageToolState('angle');
        if (toolImageData === undefined || toolImageData.imageDatas === undefined || toolImageData.imageDatas.length === 0) {

        }
        else {
            toolImageData = toolImageData.imageDatas;
        }
        this.selectedIndexAngleOnImage = toolImageData.length - 1;
    }

};

papaya.viewer.Tools.prototype.DrawReactanleOnImageSlice = function (viewer, me) {

    this.imageNeedsUpdateForDrawTool = false;
    viewer.container.preferences.showCrosshairs = "No";
    viewer.isRectangleMode = true;

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

    var toolImageData = viewer.selectedSlice.getImageToolState('rectangle');
    if (toolImageData === undefined || toolImageData.imageDatas === undefined || toolImageData.imageDatas.length === 0) {

    }
    else {
        var toolImageData = toolImageData.imageDatas;
        for (var i = 0; i < toolImageData.length; i++) {
            var nearbyHandle = this.getToolHandleNearToImagePoint(toolImageData[i].toolHandles, firstPointSelect, 5);
            if (nearbyHandle !== undefined) {
                this.selectedIndexRectangleOnImage = i;
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
        var rectangleObject = {
            toolActive: true,
            toolHandles: {
                start: {
                    xCord: cordOne.x,
                    yCord: cordOne.y,
                    zCord: cordOne.z,
                    toolActive: false
                },
                end: {
                    xCord: cordOne.x,
                    yCord: cordOne.y,
                    zCord: cordOne.z,
                    toolActive: true
                }
            }
        }
        viewer.selectedSlice.setImageToolState('rectangle', rectangleObject);
        var toolImagedata = viewer.selectedSlice.getImageToolState('rectangle');
        if (toolImagedata === undefined || toolImagedata.imageDatas === undefined || toolImagedata.imageDatas.length === 0) {

        }
        else {
            toolImagedata = toolImagedata.imageDatas;
        }
        this.selectedIndexRectangleOnImage = toolImagedata.length - 1;
    }

};

//CornerStone.js and CornerStoneMath.js functions for drawing Ruler as implemented in cornerStone.js
papaya.viewer.Tools.prototype.findClosestPoint = function (sources, target) {
    var distances = [];
    var minDistance;

    sources.forEach(function (source, index) {
        var d = distance(source, target);

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

papaya.viewer.Tools.prototype.checkForIntersectionOnLine = function (lineSegmentFirst, lineSegmentSecond) {
    //var distanceToPoint = point2.distanceTo(point1);
    var intersectionPointOneLine, lineSegmentOne, lineSegmentTwo;
    if (this.mainImage === this.axialSlice) {
        intersectionPoint = this.checkLineIntersection(lineSegmentFirst, lineSegmentSecond);
    } else if (this.mainImage === this.coronalSlice) {
        lineSegment1temp = { start: { x: lineSegmentFirst.start.x, y: lineSegmentFirst.start.z }, end: { x: lineSegmentFirst.end.x, y: lineSegmentFirst.end.z } };
        lineSegment2temp = { start: { x: lineSegmentSecond.start.x, y: lineSegmentSecond.start.z }, end: { x: lineSegmentSecond.end.x, y: lineSegmentSecond.end.z } };
        intersectionPoint = this.checkLineIntersection(lineSegmentOne, lineSegment2temp);
    } else if (this.mainImage === this.sagittalSlice) {
        lineSegment1temp = { start: { x: lineSegmentFirst.start.y, y: lineSegmentFirst.start.z }, end: { x: lineSegmentFirst.end.y, y: lineSegmentFirst.end.z } };
        lineSegment2temp = { start: { x: lineSegmentSecond.start.y, y: lineSegmentSecond.start.z }, end: { x: lineSegmentSecond.end.y, y: lineSegmentSecond.end.z } };
        intersectionPoint = this.checkLineIntersection(lineSegmentOne, lineSegment2temp);
    }
    return intersectionPoint;
};

papaya.viewer.Tools.prototype.checkLineIntersection = function (lineSegmentFirst, lineSegmentSecond) {
    // x1, y1, x2, y2, x3, y3, x4, y4
    var x1 = lineSegmentFirst.start.x,
        y1 = lineSegmentFirst.start.y,
        x2 = lineSegmentFirst.end.x,
        y2 = lineSegmentFirst.end.y,
        x3 = lineSegmentSecond.start.x,
        y3 = lineSegmentSecond.start.y,
        x4 = lineSegmentSecond.end.x,
        y4 = lineSegmentSecond.end.y;
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
    numerator1 = ((x4 - x3) * a) - ((y4 - y3) * b);
    numerator2 = ((x2 - x1) * a) - ((y2 - y1) * b);
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

    if (viewer.mainImage.sliceDirection == papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
        viewer.crossHairAxialRed.css("position", "absolute").css("top", viewer.paddingTop).css("left", parseFloat($("." + PAPAYA_VIEWER_CSS).css("padding-left")) + 8).css('height', '5px').css('width', viewer.mainImage.screenDim - 1 + "px");
        viewer.selectedSliceAxialRed.css("position", "absolute").css("top", viewer.paddingTop + 7).css("left", parseFloat($("." + PAPAYA_VIEWER_CSS).css("padding-left")) + 12);
        //overlays
        viewer.mainImageOverlaysTopLeft.css("position", "absolute").css("top", viewer.paddingTop + 30).css("left", parseFloat($("." + PAPAYA_VIEWER_CSS).css("padding-left")) + 15);
        viewer.mainImageOverlaysTopRight.css("position", "absolute").css("top", viewer.paddingTop + 30).css("left", parseFloat($("." + PAPAYA_VIEWER_CSS).css("padding-left")) + viewer.mainImage.screenDim - parseFloat(viewer.mainImageOverlaysTopRight.css("width")));
        viewer.mainImageOverlaysBottomLeft.css("position", "absolute").css("top", viewer.mainImage.screenDim + 10 - parseFloat(viewer.mainImageOverlaysBottomLeft.css("height"))).css("left", parseFloat($("." + PAPAYA_VIEWER_CSS).css("padding-left")) + 15);
        viewer.mainImageOverlaysBottomRight.css("position", "absolute").css("top", viewer.mainImage.screenDim + 10 - parseFloat(viewer.mainImageOverlaysBottomRight.css("height"))).css("left", parseFloat($("." + PAPAYA_VIEWER_CSS).css("padding-left")) + viewer.mainImage.screenDim - parseFloat(viewer.mainImageOverlaysBottomRight.css("width")));

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
