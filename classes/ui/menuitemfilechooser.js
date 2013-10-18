
/*jslint browser: true, node: true */
/*global $, bind */

"use strict";

var papaya = papaya || {};
papaya.ui = papaya.ui || {};



papaya.ui.MenuItemFileChooser = papaya.ui.MenuItemFileChooser || function (label, action, callback) {
    this.label = label;
    this.action = action;
    this.id = this.action.replace(/ /g, "_");
    this.callback = callback;
};



papaya.ui.MenuItemFileChooser.prototype.buildHTML = function (parentId) {
    var html = "<li id='" + this.id + "'><span class='unselectable'><label class='fileChooser' for='fileChooser'>" + this.label + "</label><input type='file' id='fileChooser' name='files' /></span></li>";
    $("#" + parentId).append(html);
    $("#fileChooser")[0].onchange = bind(this, function () {
        this.callback(this.action, document.getElementById('fileChooser').files[0]);
    });
    $("#" + this.id).hover(function () {$(this).toggleClass('menuHover'); });
};
