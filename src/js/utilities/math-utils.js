
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

papaya.utilities.MathUtils.clip = function (val, max, min) {
    if (val > max) val = max;
    else if (val < min) val = min;
    return val;
};

// mod
papaya.utilities.MathUtils.normalizeVector = function (vector) {
    if (!vector.length) return;
    var vectorDim = vector.length;
    var vectorLength = 0;
    var normalized = [];
    for (var i = 0; i < vectorDim; ++i) {
        vectorLength += vector[i] * vector[i];
    }
    vectorLength = Math.sqrt(vectorLength);

    for (var i = 0; i < vectorDim; ++i) {
        normalized.push(vector[i] / vectorLength);
    }

    // var vectorLength = Math.sqrt((vector[0] * vector[0]) + (vector[1] * vector[1]) + (vector[2] * vector[2]));
    // var normalized = [vector[0] / vectorLength, vector[1] / vectorLength, vector[2] / vectorLength]
    return normalized;
};

papaya.utilities.MathUtils.roundToTwo = function (num) {    
    return +(Math.round(num + "e+2")  + "e-2");
};

function papayaRoundFast(val) {
    /*jslint bitwise: true */
    if (val > 0) {
        return (val + 0.5) | 0;
    }

    return (val - 0.5) | 0;
}

function papayaFloorFast(val) {
    /*jslint bitwise: true */
    return val | 0;
}

