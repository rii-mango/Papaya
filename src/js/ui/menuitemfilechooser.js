
/*jslint browser: true, node: true */
/*global $, PAPAYA_MENU_FILECHOOSER, PAPAYA_MENU_UNSELECTABLE, PAPAYA_MENU_HOVERING_CSS */

"use strict";

/*** Imports ***/
var papaya = papaya || {};
papaya.ui = papaya.ui || {};


/*** Constructor ***/
papaya.ui.MenuItemFileChooser = papaya.ui.MenuItemFileChooser || function (viewer, label, action, callback, folder, modifier) {
    this.viewer = viewer;
    this.label = label;

    this.modifier = "";
    if ((modifier !== undefined) && (modifier !== null)) {
        this.modifier = "-" + modifier;
    }

    this.action = action + this.modifier;
    this.id = this.action.replace(/ /g, "_") + this.viewer.container.containerIndex;
    this.fileChooserId = "fileChooser" + this.label.replace(/ /g, "_").replace(/\./g, "") + this.viewer.container.containerIndex + (folder ? "folder" : "");
    this.callback = callback;
    this.folder = folder;
};


/*** Prototype Methods ***/

papaya.ui.MenuItemFileChooser.prototype.buildHTML = function (parentId) {
    var filechooser, html;

    filechooser = this;

    html = "<li id='" + this.id + "'><span class='" + PAPAYA_MENU_UNSELECTABLE + "'><label class='" +
        PAPAYA_MENU_FILECHOOSER + "' for='" + this.fileChooserId + "'>" + this.label;

    if (this.folder) {
        html += "</label><input type='file' id='" + this.fileChooserId +
            "' multiple='multiple' webkitdirectory directory name='files' /></span></li>";
    } else {
        html += "</label><input type='file' id='" + this.fileChooserId +
            "' multiple='multiple' name='files' /></span></li>";
    }

    $("#" + parentId).append(html);

    $("#" + this.fileChooserId)[0].onchange = papaya.utilities.ObjectUtils.bind(filechooser, function () {
        filechooser.callback(filechooser.action, document.getElementById(filechooser.fileChooserId).files);
    });

    $("#" + this.id).hover(function () {$(this).toggleClass(PAPAYA_MENU_HOVERING_CSS); });
};
