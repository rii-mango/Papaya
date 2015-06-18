
/*jslint browser: true, node: true */
/*global */

"use strict";

/*** Imports ***/
var papaya = papaya || {};
papaya.utilities = papaya.utilities || {};
papaya.utilities.ArrayUtils = papaya.utilities.ArrayUtils || {};


/*** Static Methods ***/

// http://stackoverflow.com/questions/966225/how-can-i-create-a-two-dimensional-array-in-javascript
papaya.utilities.ArrayUtils.createArray = function (length) {
    var arr = new Array(length || 0),
        ctr;

    if (arguments.length > 1) {
        var args = Array.prototype.slice.call(arguments, 1);
        for (ctr = 0; ctr < length; ctr += 1) {
            arr[ctr] = papaya.utilities.ArrayUtils.createArray.apply(this, args);
        }
    }

    return arr;
};


papaya.utilities.ArrayUtils.contains = function (a, obj) {
    var i = a.length;
    while (i--) {
        if (a[i] === obj) {
            return true;
        }
    }
    return false;
};


/*** Array (Prototype Methods) ***/

// http://stackoverflow.com/questions/2294703/multidimensional-array-cloning-using-javascript
Array.prototype.clone = function () {
    var arr, i;

    arr = this.slice(0);
    for (i = 0; i < this.length; i += 1) {
        if (this[i].clone) {
            //recursion
            arr[i] = this[i].clone();
        }
    }

    return arr;
};
