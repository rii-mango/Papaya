
/*jslint browser: true, node: true */
/*global */

"use strict";

/*** Imports ***/
var papaya = papaya || {};
papaya.utilities = papaya.utilities || {};
papaya.utilities.MathUtils = papaya.utilities.MathUtils || {};


/*** Static Methods ***/

papaya.utilities.MathUtils.signum = function (val) {
    return val ? val < 0 ? -1 : 1 : 0;
};



papaya.utilities.MathUtils.lineDistance = function (point1, point2) {
    var xs, ys;

    xs = point2.x - point1.x;
    xs = xs * xs;

    ys = point2.y - point1.y;
    ys = ys * ys;

    return Math.sqrt(xs + ys);
};



function papayaRoundFast(val) {
    /*jslint bitwise: true */
    return (0.5 + val) | 0;
}



function papayaFloorFast(val) {
    /*jslint bitwise: true */
    return val | 0;
}
