
/*jslint browser: true, node: true */
/*global $, PAPAYA_MENU_UNSELECTABLE, PAPAYA_MENU_SPACER_CSS */

"use strict";

/*** Imports ***/
var papaya = papaya || {};
papaya.ui = papaya.ui || {};


/*** Constructor ***/
papaya.ui.MenuItemSpacer = papaya.ui.MenuItemSpacer || function () {};


/*** Prototype Methods ***/

papaya.ui.MenuItemSpacer.prototype.buildHTML = function (parentId) {
    var html;

    html = "<div class='" + PAPAYA_MENU_SPACER_CSS + " " + PAPAYA_MENU_UNSELECTABLE + "'></div>";
    $("#" + parentId).append(html);
};
