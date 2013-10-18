
/*jslint browser: true, node: true */
/*global */

"use strict";

var papaya = papaya || {};
papaya.core = papaya.core || {};



papaya.core.Dimensions = papaya.core.Dimensions || function (width, height) {
    this.width = width;
    this.height = height;
    this.widthPadding = 0;
    this.heightPadding = 0;
};
