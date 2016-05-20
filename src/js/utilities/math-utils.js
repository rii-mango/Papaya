
/*jslint browser: true, node: true */
/*global */

"use strict";

/*** Imports ***/
var papaya = papaya || {};
papaya.utilities = papaya.utilities || {};
papaya.utilities.MathUtils = papaya.utilities.MathUtils || {};


/*** Static Pseudo-constants ***/

papaya.utilities.MathUtils.EPSILON = 0.00000001;



/*** Static Methods ***/

papaya.utilities.MathUtils.signum = function (val) {
    return val ? val < 0 ? -1 : 1 : 0;
};



papaya.utilities.MathUtils.lineDistance = function (point1x, point1y, point2x, point2y) {
    var xs, ys;

    xs = point2x - point1x;
    xs = xs * xs;

    ys = point2y - point1y;
    ys = ys * ys;

    return Math.sqrt(xs + ys);
};



papaya.utilities.MathUtils.lineDistance3d = function (point1x, point1y, point1z, point2x, point2y, point2z) {
    var xs, ys, zs;

    xs = point2x - point1x;
    xs = xs * xs;

    ys = point2y - point1y;
    ys = ys * ys;

    zs = point2z - point1z;
    zs = zs * zs;

    return Math.sqrt(xs + ys + zs);
};



papaya.utilities.MathUtils.essentiallyEqual = function (a, b) {
    return (a === b) || (Math.abs(a - b) <= ((Math.abs(a) > Math.abs(b) ? Math.abs(b) : Math.abs(a)) *
        papaya.utilities.MathUtils.EPSILON));
};



papaya.utilities.MathUtils.getPowerOfTwo = function (value, pow) {
    var pow = pow || 1;

    while (pow < value) {
        pow *= 2;
    }

    return pow;
};



function papayaRoundFast(val) {
    /*jslint bitwise: true */
    return (0.5 + val) | 0;
}



function papayaFloorFast(val) {
    /*jslint bitwise: true */
    return val | 0;
}
