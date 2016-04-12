
/*jslint browser: true, node: true */
/*global $, PAPAYA_MENU_UNSELECTABLE, PAPAYA_MENU_INPUT_FIELD, PAPAYA_MENU_HOVERING_CSS */

"use strict";

/*** Imports ***/
var papaya = papaya || {};
papaya.ui = papaya.ui || {};


/*** Constructor ***/
papaya.ui.MenuItemRange = papaya.ui.MenuItemRange || function (viewer, label, action, callback, dataSource, method,
                                                               modifier) {
    if (action === "ChangeRangeNeg") {
        this.negatives = true;
        modifier = viewer.getScreenVolumeIndex(viewer.screenVolumes[parseInt(modifier)].negativeScreenVol).toString();
    }

    this.viewer = viewer;
    this.label = label;

    this.index = modifier;
    this.modifier = "";
    if (modifier !== undefined) {
        this.modifier = "-" + modifier;
    }

    this.action = action + this.modifier;
    this.minId = this.action.replace(/ /g, "_") + "Min" + this.viewer.container.containerIndex;
    this.maxId = this.action.replace(/ /g, "_") + "Max" + this.viewer.container.containerIndex;
    this.callback = callback;
    this.dataSource = dataSource;
    this.method = method;
    this.id = label + this.modifier + this.viewer.container.containerIndex;

    this.grabOffset = 0;
    this.screenVol = this.viewer.screenVolumes[this.index];
};


/*** Static Methods ***/

papaya.ui.MenuItemRange.getRelativeMousePositionFromParentX = function (elem, ev) {
    var parentOffset = elem.parent().offset();
    return papaya.utilities.PlatformUtils.getMousePositionX(ev) - parentOffset.left;
};



papaya.ui.MenuItemRange.getRelativeMousePositionX = function (elem, ev) {
    var parentOffset = elem.offset();
    return papaya.utilities.PlatformUtils.getMousePositionX(ev) - parentOffset.left;
};


/*** Prototype Methods ***/

papaya.ui.MenuItemRange.prototype.buildHTML = function (parentId) {
    var range, html, menuItemRange, minHtml, maxHtml, minSliderId, minSliderHtml, maxSliderId, maxSliderHtml, sliderId,
        sliderHtml;

    minSliderId = this.id + "SliderMin";
    maxSliderId = this.id + "SliderMax";
    sliderId = this.id + "Slider";
    range = this.dataSource[this.method]();

    menuItemRange = this;

    html = "<li id='" + this.id + "'>" +
                "<span class='" + PAPAYA_MENU_UNSELECTABLE + "' style=''>" +
                    "<input class='" + PAPAYA_MENU_INPUT_FIELD + "' type='text' size='4' id='" + this.minId +
                        "' value='" + range[0] + "' />" +
                    "<div style='display:inline-block;position:relative;width:" +
                            (papaya.viewer.ColorTable.COLOR_BAR_WIDTH + papaya.viewer.ColorTable.ARROW_ICON_WIDTH) +
                            "px;top:-12px;'>" +
                        "<img id='" + minSliderId + "' class='" + PAPAYA_MENU_UNSELECTABLE +
                            "' style='position:absolute;top:5px;left:" +
                            (menuItemRange.screenVol.colorTable.minLUT / papaya.viewer.ColorTable.LUT_MAX) *
                            (papaya.viewer.ColorTable.COLOR_BAR_WIDTH - 1) + "px;z-index:99' src='" +
                            papaya.viewer.ColorTable.ARROW_ICON + "' />" +
                        "<img id='" + maxSliderId + "' class='" + PAPAYA_MENU_UNSELECTABLE +
                            "' style='position:absolute;top:5px;left:" +
                            (menuItemRange.screenVol.colorTable.maxLUT / papaya.viewer.ColorTable.LUT_MAX) *
                            (papaya.viewer.ColorTable.COLOR_BAR_WIDTH - 1) + "px;z-index:99' src='" +
                            papaya.viewer.ColorTable.ARROW_ICON + "' />" +
                        "<img id='" + sliderId + "' class='" + PAPAYA_MENU_UNSELECTABLE +
                            "' style='position:absolute;top:0;left:" +
                            (parseInt(papaya.viewer.ColorTable.ARROW_ICON_WIDTH / 2, 10)) + "px;' src='" +
                            this.viewer.screenVolumes[parseInt(this.index, 10)].colorBar + "' />" +
                    "</div>" +
                    "<input class='" + PAPAYA_MENU_INPUT_FIELD + "' type='text' size='4' id='" + this.maxId +
                        "' value='" + range[1] + "' />" +
                "</span>" +
           "</li>";

    $("#" + parentId).append(html);

    minHtml = $("#" + this.minId);
    maxHtml = $("#" + this.maxId);
    minSliderHtml = $("#" + minSliderId);
    maxSliderHtml = $("#" + maxSliderId);
    sliderHtml = $("#" + sliderId);

    if (papaya.utilities.PlatformUtils.ios) {
        minHtml[0].style.width = 35 + 'px';
        minHtml[0].style.marginRight = 4 + 'px';
        maxHtml[0].style.width = 35 + 'px';
        maxHtml[0].style.marginRight = 4 + 'px';
    }

    minSliderHtml.bind(papaya.utilities.PlatformUtils.ios ? 'touchstart' : 'mousedown', function (ev) {
        menuItemRange.grabOffset = papaya.ui.MenuItemRange.getRelativeMousePositionX(minSliderHtml, ev);

        $(window).bind(papaya.utilities.PlatformUtils.ios ? 'touchmove' : 'mousemove', function (ev) {
            var val, maxVal;

            maxVal = (menuItemRange.screenVol.colorTable.maxLUT / papaya.viewer.ColorTable.LUT_MAX) *
                (papaya.viewer.ColorTable.COLOR_BAR_WIDTH - 1);
            val = (papaya.ui.MenuItemRange.getRelativeMousePositionFromParentX(minSliderHtml, ev) - menuItemRange.grabOffset);

            if (val < 0) {
                val = 0;
            } else if (val >= papaya.viewer.ColorTable.COLOR_BAR_WIDTH) {
                val = (papaya.viewer.ColorTable.COLOR_BAR_WIDTH - 1);
            } else if (val > maxVal) {
                val = maxVal;
            }

            menuItemRange.screenVol.updateMinLUT(Math.round((val / (papaya.viewer.ColorTable.COLOR_BAR_WIDTH - 1)) *
                papaya.viewer.ColorTable.LUT_MAX));
            minSliderHtml.css({"left": val + "px"});
            menuItemRange.viewer.drawViewer(false, true);
            minHtml.val(menuItemRange.dataSource[menuItemRange.method]()[0]);
            menuItemRange.screenVol.updateColorBar();
            sliderHtml.attr("src", menuItemRange.screenVol.colorBar);
        });

        return false;  // disable img drag
    });

    maxSliderHtml.bind(papaya.utilities.PlatformUtils.ios ? 'touchstart' : 'mousedown', function (ev) {
        menuItemRange.grabOffset = papaya.ui.MenuItemRange.getRelativeMousePositionX(maxSliderHtml, ev);
        $(window).bind(papaya.utilities.PlatformUtils.ios ? 'touchmove' : 'mousemove', function (ev) {
            var val, minVal;

            minVal = (menuItemRange.screenVol.colorTable.minLUT / papaya.viewer.ColorTable.LUT_MAX) *
                (papaya.viewer.ColorTable.COLOR_BAR_WIDTH - 1);
            val = (papaya.ui.MenuItemRange.getRelativeMousePositionFromParentX(maxSliderHtml, ev) - menuItemRange.grabOffset);

            if (val < 0) {
                val = 0;
            } else if (val >= papaya.viewer.ColorTable.COLOR_BAR_WIDTH) {
                val = (papaya.viewer.ColorTable.COLOR_BAR_WIDTH - 1);
            } else if (val < minVal) {
                val = minVal;
            }

            menuItemRange.screenVol.updateMaxLUT(Math.round((val / (papaya.viewer.ColorTable.COLOR_BAR_WIDTH - 1)) *
                papaya.viewer.ColorTable.LUT_MAX));
            maxSliderHtml.css({"left": val + "px"});
            menuItemRange.viewer.drawViewer(false, true);
            maxHtml.val(menuItemRange.dataSource[menuItemRange.method]()[1]);
            menuItemRange.screenVol.updateColorBar();
            sliderHtml.attr("src", menuItemRange.screenVol.colorBar);
        });

        return false;  // disable img drag
    });

    $(window).bind(papaya.utilities.PlatformUtils.ios ? 'touchend' : 'mouseup', function () {
        $(window).unbind(papaya.utilities.PlatformUtils.ios ? 'touchmove' : 'mousemove');
    });

    $("#" + this.id).hover(function () {$(this).toggleClass(PAPAYA_MENU_HOVERING_CSS); });

    minHtml.change(papaya.utilities.ObjectUtils.bind(this, function () {
        menuItemRange.rangeChanged(true);
    }));

    maxHtml.change(papaya.utilities.ObjectUtils.bind(this, function () {
        menuItemRange.rangeChanged(false);
    }));

    minHtml.keyup(papaya.utilities.ObjectUtils.bind(this, function (e) {
        if (e.keyCode === 13) {
            menuItemRange.rangeChanged(false);
            menuItemRange.viewer.container.toolbar.closeAllMenus();
        }
    }));

    maxHtml.keyup(papaya.utilities.ObjectUtils.bind(this, function (e) {
        if (e.keyCode === 13) {
            menuItemRange.rangeChanged(false);
            menuItemRange.viewer.container.toolbar.closeAllMenus();
        }
    }));

    if (!papaya.utilities.PlatformUtils.ios) {
        setTimeout(function () {  // IE wasn't picking up on the focus
            minHtml.focus();
            minHtml.select();
        }, 10);
    }
};



papaya.ui.MenuItemRange.prototype.rangeChanged = function (focusMax) {
    this.updateDataSource(focusMax);
    this.viewer.drawViewer(true);
    this.resetSlider();
};



papaya.ui.MenuItemRange.prototype.updateDataSource = function (focusMax) {
    var max, min, maxHtml, minHtml;

    minHtml = $("#" + this.minId);
    maxHtml = $("#" + this.maxId);

    min = parseFloat(minHtml.val());
    if (isNaN(min)) {
        min = this.dataSource.screenMin;
    }

    max = parseFloat(maxHtml.val());
    if (isNaN(max)) {
        max = this.dataSource.screenMax;
    }

    minHtml.val(min);
    maxHtml.val(max);

    if (this.negatives) {
        this.dataSource.setScreenRangeNegatives(min, max);
    } else {
        this.dataSource.setScreenRange(min, max);
    }

    if (focusMax) {
        maxHtml.focus();
        maxHtml.select();
    }
};



papaya.ui.MenuItemRange.prototype.resetSlider = function () {
    var minSliderId, minSliderHtml, maxSliderId, maxSliderHtml, sliderId, sliderHtml;

    minSliderId = this.id + "SliderMin";
    maxSliderId = this.id + "SliderMax";
    sliderId = this.id + "Slider";
    minSliderHtml = $("#" + minSliderId);
    maxSliderHtml = $("#" + maxSliderId);
    sliderHtml = $("#" + sliderId);

    minSliderHtml.css({"left": 0});
    maxSliderHtml.css({"left": (papaya.viewer.ColorTable.COLOR_BAR_WIDTH - 1) + "px"});

    this.screenVol.resetDynamicRange();
    sliderHtml.attr("src", this.screenVol.colorBar);
};
