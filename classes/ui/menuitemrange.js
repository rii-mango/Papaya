
/*jslint browser: true, node: true */
/*global $, bind */

"use strict";

var papaya = papaya || {};
papaya.ui = papaya.ui || {};



papaya.ui.MenuItemRange = papaya.ui.MenuItemRange || function (viewer, label, action, callback, dataSource, method, modifier) {
    this.viewer = viewer;
    this.label = label;

    this.modifier = "";
    if (modifier !== undefined) {
        this.modifier = "-" + modifier;
    }

    this.action = action + this.modifier;
    this.minId = this.action.replace(/ /g, "_") + "Min";
    this.maxId = this.action.replace(/ /g, "_") + "Max";
    this.callback = callback;
    this.dataSource = dataSource;
    this.method = method;
};



papaya.ui.MenuItemRange.prototype.buildHTML = function (parentId) {
    var range, html, menuItemRange;

    range = this.dataSource[this.method]();
    html = "<li id='" + this.id + "'><span class='unselectable'>" + this.label + ": &nbsp;<input type='text' size='6' style='width:55px' id='" + this.minId + "' value='" + range[0] + "' /> to <input type='text' size='6' style='width:55px' id='" + this.maxId + "' value='" + range[1] + "' /></span></li>";
    $("#" + parentId).append(html);
    $("#" + this.id).hover(function () {$(this).toggleClass('menuHover'); });

    menuItemRange = this;

    $("#" + this.minId).change(bind(this, function () {
        menuItemRange.updateDataSource(this);
        this.viewer.drawViewer(true);
    }));

    $("#" + this.maxId).change(bind(this, function () {
        menuItemRange.updateDataSource(this);
        this.viewer.drawViewer(true);
    }));
};



papaya.ui.MenuItemRange.prototype.updateDataSource = function (menuItemRange) {
    var max, min, maxHtml, minHtml;

    minHtml = $("#" + menuItemRange.minId);
    maxHtml = $("#" + menuItemRange.maxId);

    min = parseFloat(minHtml.val());
    if (isNaN(min)) {
        min = menuItemRange.dataSource.screenMin;
    }

    max = parseFloat(maxHtml.val());
    if (isNaN(max)) {
        max = menuItemRange.dataSource.screenMax;
    }

    minHtml.val(min);
    maxHtml.val(max);

    menuItemRange.dataSource.setScreenRange(min, max);
};
