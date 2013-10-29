
/*jslint browser: true, node: true */
/*global $, isStringBlank, bind */

"use strict";

var papaya = papaya || {};
papaya.ui = papaya.ui || {};



papaya.ui.MenuItemSpacer = papaya.ui.MenuItemSpacer || function () {};



papaya.ui.MenuItemSpacer.prototype.buildHTML = function (parentId) {
    var html, thisHtml;

    html = "<div class='spacer unselectable'></div>";
    $("#" + parentId).append(html);
};
