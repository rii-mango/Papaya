
/*jslint browser: true, node: true */
/*global $, isStringBlank, bind, PAPAYA_MENU_HOVERING_CSS, PAPAYA_MENU_UNSELECTABLE */

"use strict";

var papaya = papaya || {};
papaya.ui = papaya.ui || {};


papaya.ui.MenuItemSlider = papaya.ui.MenuItemSlider || function (viewer, label, action, callback, dataSource, method, modifier) {
    this.viewer = viewer;
    this.label = label;

    this.index = modifier;
    this.modifier = "";
    if (!isStringBlank(modifier)) {
        this.modifier = "-" + modifier;
    }

    this.dataSource = dataSource;
    this.method = method;
    this.action = action + this.modifier;
    this.id = this.action.replace(/ /g, "_") + this.viewer.container.containerIndex;
    this.callback = callback;
    this.screenVol = this.viewer.screenVolumes[this.index];
};



papaya.ui.MenuItemSlider.prototype.buildHTML = function (parentId) {
    var html, thisHtml, sliderId, sliderHtml, menuItem;

    sliderId = this.id + "Slider";

    html = "<li id='" + this.id + "'><span style='padding-right:5px;' class='" + PAPAYA_MENU_UNSELECTABLE + "'>" + this.label + ":</span><input min='0' max='100' value='" + parseInt((1.0 - this.screenVol.alpha) * 100, 10) + "' id='" + sliderId + "' style='vertical-align:middle;text-align:center;width:125px;padding:0;margin:0;' type='range' /></li>";
    $("#" + parentId).append(html);

    thisHtml = $("#" + this.id);
    thisHtml.hover(function () { $(this).toggleClass(PAPAYA_MENU_HOVERING_CSS); });
    sliderHtml = $("#" + sliderId);

    menuItem = this;

    $("#" + this.id + "Slider").change(function () {
        menuItem.screenVol.alpha = 1.0 - (sliderHtml.val() / 100.0);
        menuItem.viewer.drawViewer(false, true);
    });
};



papaya.ui.MenuItemSlider.prototype.doAction = function () {
    this.callback(this.action);
};
