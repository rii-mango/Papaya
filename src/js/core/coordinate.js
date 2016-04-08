
/*jslint browser: true, node: true */
/*global */

"use strict";

/*** Imports ***/
var papaya = papaya || {};
papaya.core = papaya.core || {};


/*** Constructor ***/
papaya.core.Coordinate = papaya.core.Coordinate || function (xLoc, yLoc, zLoc) {
    this.x = xLoc;
    this.y = yLoc;
    this.z = zLoc;
};


/*** Prototype Methods ***/

papaya.core.Coordinate.prototype.setCoordinate = function (xLoc, yLoc, zLoc, round) {
    if (round) {
        this.x = Math.round(xLoc);
        this.y = Math.round(yLoc);
        this.z = Math.round(zLoc);
    } else {
        this.x = xLoc;
        this.y = yLoc;
        this.z = zLoc;
    }
};


papaya.core.Coordinate.prototype.toString = function () {
    return '(' + this.x + ',' + this.y + ',' + this.z + ')';
}


papaya.core.Coordinate.prototype.isAllZeros = function () {
    return ((this.x === 0) && (this.y === 0) && (this.z === 0));
};
