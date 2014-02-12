
/*jslint browser: true, node: true */
/*global $, bind, PAPAYA_MENU_HOVERING_CSS, PAPAYA_MENU_UNSELECTABLE */

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
    this.minId = this.action.replace(/ /g, "_") + "Min" + this.viewer.container.containerIndex;
    this.maxId = this.action.replace(/ /g, "_") + "Max" + this.viewer.container.containerIndex;
    this.callback = callback;
    this.dataSource = dataSource;
    this.method = method;
};



papaya.ui.MenuItemRange.prototype.buildHTML = function (parentId) {
    var range, html, menuItemRange, minHtml, maxHtml;

    range = this.dataSource[this.method]();
    html = "<li id='" + this.id + "'><span class='" + PAPAYA_MENU_UNSELECTABLE + "'>" + this.label + ": &nbsp;<input type='text' size='6' style='width:55px' id='" + this.minId + "' value='" + range[0] + "' /> to <input type='text' size='6' style='width:55px' id='" + this.maxId + "' value='" + range[1] + "' /></span></li>";
    $("#" + parentId).append(html);
    $("#" + this.id).hover(function () {$(this).toggleClass(PAPAYA_MENU_HOVERING_CSS); });

    menuItemRange = this;

    minHtml = $("#" + this.minId);
    maxHtml = $("#" + this.maxId);

    minHtml.change(bind(this, function () {
        menuItemRange.updateDataSource(this, true);
        menuItemRange.viewer.drawViewer(true);
    }));

    maxHtml.change(bind(this, function () {
        menuItemRange.updateDataSource(this, false);
        menuItemRange.viewer.drawViewer(true);
    }));

    minHtml.focus();
    minHtml.select();

    minHtml.keyup(bind(this, function (e) {
        if (e.keyCode === 13) {
            menuItemRange.viewer.container.toolbar.closeAllMenus();
        }
    }));

    maxHtml.keyup(bind(this, function (e) {
        if (e.keyCode === 13) {
            menuItemRange.viewer.container.toolbar.closeAllMenus();
        }
    }));
};



papaya.ui.MenuItemRange.prototype.updateDataSource = function (menuItemRange, minChanged) {
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

    if (minChanged) {
        maxHtml.focus();
        maxHtml.select();
    }
};
