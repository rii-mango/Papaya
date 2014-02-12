
/*jslint browser: true, node: true */
/*global $, isStringBlank, bind, PAPAYA_MENU_SPACER_CSS, PAPAYA_MENU_UNSELECTABLE */

"use strict";

var papaya = papaya || {};
papaya.ui = papaya.ui || {};



papaya.ui.MenuItemSpacer = papaya.ui.MenuItemSpacer || function () {};



papaya.ui.MenuItemSpacer.prototype.buildHTML = function (parentId) {
    var html;

    html = "<div class='" + PAPAYA_MENU_SPACER_CSS + " " + PAPAYA_MENU_UNSELECTABLE + "'></div>";
    $("#" + parentId).append(html);
};
