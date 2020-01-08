
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


// https://stackoverflow.com/questions/281264/remove-empty-elements-from-an-array-in-javascript
papaya.utilities.ArrayUtils.cleanArray = function (actual) {
    var newArray = new Array();
    for (var i = 0; i < actual.length; i++) {
        if (actual[i]) {
            newArray.push(actual[i]);
        }
    }
    return newArray;
};

papaya.utilities.ArrayUtils.multiplyMatrices = function (m1, m2) {
    var result = [];
    for (var i = 0; i < m1.length; i++) {
        result[i] = [];
        for (var j = 0; j < m2[0].length; j++) {
            var sum = 0;
            for (var k = 0; k < m1[0].length; k++) {
                sum += m1[i][k] * m2[k][j];
            }
            result[i][j] = sum;
        }
    }
    return result;
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
