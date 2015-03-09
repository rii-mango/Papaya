
/*jslint browser: true, node: true */
/*global Ext */

"use strict";

/*** Imports ***/
var papaya = papaya || {};
papaya.utilities = papaya.utilities || {};
papaya.utilities.ObjectUtils = papaya.utilities.ObjectUtils || {};


/*** Static Methods ***/

papaya.utilities.ObjectUtils.bind = function (scope, fn, args, appendArgs) {
    if (arguments.length === 2) {
        return function () {
            return fn.apply(scope, arguments);
        };
    }

    var method = fn,
        slice = Array.prototype.slice;

    return function () {
        var callArgs = args || arguments;

        if (appendArgs === true) {
            callArgs = slice.call(arguments, 0);
            callArgs = callArgs.concat(args);
        } else if (typeof appendArgs === 'number') {
            callArgs = slice.call(arguments, 0); // copy arguments first
            Ext.Array.insert(callArgs, appendArgs, args);
        }

        return method.apply(scope || window, callArgs);
    };
};



papaya.utilities.ObjectUtils.isString = function (obj) {
    return (typeof obj === "string" || obj instanceof String);
};



// adapted from: http://stackoverflow.com/questions/724857/how-to-find-javascript-variable-by-its-name
papaya.utilities.ObjectUtils.dereference = function (name) {
    return papaya.utilities.ObjectUtils.dereferenceIn(window, name);
};



papaya.utilities.ObjectUtils.dereferenceIn = function (parent, name) {
    var obj, M;

    if (!papaya.utilities.ObjectUtils.isString(name)) {
        return null;
    }

    M = name.replace(/(^[' "]+|[" ']+$)/g, '').match(/(^[\w\$]+(\.[\w\$]+)*)/);

    if (M) {
        M = M[1].split('.');
        obj = parent[M.shift()];
        while (obj && M.length) {
            obj = obj[M.shift()];
        }
    }

    return obj || null;
};
