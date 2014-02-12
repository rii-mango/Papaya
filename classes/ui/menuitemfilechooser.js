
/*jslint browser: true, node: true */
/*global $, bind, PAPAYA_MENU_HOVERING_CSS, PAPAYA_MENU_UNSELECTABLE, PAPAYA_MENU_FILECHOOSER */

"use strict";

var papaya = papaya || {};
papaya.ui = papaya.ui || {};



papaya.ui.MenuItemFileChooser = papaya.ui.MenuItemFileChooser || function (viewer, label, action, callback) {
    this.viewer = viewer;
    this.label = label;
    this.action = action;
    this.id = this.action.replace(/ /g, "_");
    this.callback = callback;
};



papaya.ui.MenuItemFileChooser.prototype.buildHTML = function (parentId) {
    var html = "<li id='" + this.id + "'><span class='" + PAPAYA_MENU_UNSELECTABLE + "'><label class='" + PAPAYA_MENU_FILECHOOSER + "' for='fileChooser'>" + this.label + "</label><input type='file' id='fileChooser' name='files' /></span></li>";
    $("#" + parentId).append(html);
    $("#fileChooser")[0].onchange = bind(this, function () {
        this.callback(this.action, document.getElementById('fileChooser').files[0]);
    });
    $("#" + this.id).hover(function () {$(this).toggleClass(PAPAYA_MENU_HOVERING_CSS); });
};
