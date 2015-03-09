
/*jslint browser: true, node: true */
/*global */

"use strict";

/*** Imports ***/
var papaya = papaya || {};
papaya.core = papaya.core || {};


/*** Constructor ***/
papaya.core.Point = papaya.core.Point || function (xLoc, yLoc) {
    this.x = xLoc;
    this.y = yLoc;
};
