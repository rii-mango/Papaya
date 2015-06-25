
/*jslint browser: true, node: true */
/*global */

"use strict";

/*** Imports ***/
var papaya = papaya || {};
papaya.utilities = papaya.utilities || {};
papaya.utilities.StringUtils = papaya.utilities.StringUtils || {};


/*** Static Methods ***/

papaya.utilities.StringUtils.isStringBlank = function (str) {
    if (str) {
        return (str.trim().length === 0);
    }

    return true;
};



papaya.utilities.StringUtils.formatNumber = function (num, shortFormat) {
    var val = 0;

    if (papaya.utilities.ObjectUtils.isString(num)) {
        val = Number(num);
    } else {
        val = num;
    }

    if (shortFormat) {
        val = val.toPrecision(5);
    } else {
        val = val.toPrecision(7);
    }

    return parseFloat(val);
};



papaya.utilities.StringUtils.getSizeString = function (imageFileSize) {
    var imageFileSizeString = null;

    if (imageFileSize > 1048576) {
        imageFileSizeString = papaya.utilities.StringUtils.formatNumber(imageFileSize / 1048576, true) + " Mb";
    } else if (imageFileSize > 1024) {
        imageFileSizeString = papaya.utilities.StringUtils.formatNumber(imageFileSize / 1024, true) + " Kb";
    } else {
        imageFileSizeString = imageFileSize + " Bytes";
    }

    return imageFileSizeString;
};



// http://james.padolsey.com/javascript/wordwrap-for-javascript/
papaya.utilities.StringUtils.wordwrap = function (str, width, brk, cut) {
    brk = brk || '\n';
    width = width || 75;
    cut = cut || false;

    if (!str) { return str; }

    var regex = '.{1,' + width + '}(\\s|$)' + (cut ? '|.{' + width + '}|.+$' : '|\\S+?(\\s|$)');

    return str.match(new RegExp(regex, 'g')).join(brk);
};



papaya.utilities.StringUtils.truncateMiddleString = function (fullStr, strLen) {
    if (fullStr.length <= strLen) {
        return fullStr;
    }

    var separator = '...',
        sepLen = separator.length,
        charsToShow = strLen - sepLen,
        frontChars = Math.ceil(charsToShow/2),
        backChars = Math.floor(charsToShow/2);

    return fullStr.substr(0, frontChars) + separator + fullStr.substr(fullStr.length - backChars);
};


/*** String (Prototype Methods) ***/

if (typeof String.prototype.startsWith !== 'function') {
    String.prototype.startsWith = function (str) {
        return this.indexOf(str) === 0;
    };
}



if (typeof String.prototype.trim !== 'function') {
    String.prototype.trim = function(){return this.replace(/^\s+|\s+$/g, '');};
}
