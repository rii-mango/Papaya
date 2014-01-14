
/*jslint browser: true, node: true */
/*global $, Ext, CanvasRenderingContext2D, getKeyCode, OSName */

"use strict";


function bind(scope, fn, args, appendArgs) {
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
}



function round(val) {
    return (0.5 + val) | 0;
}



function floor(val) {
    return val | 0;
}



function isString(obj) {
    return (typeof obj === "string" || obj instanceof String);
}



function isStringBlank(str) {
    return ($.trim(str).length === 0);
}



function signum(val) {
    return val ? val < 0 ? -1 : 1 : 0;
}



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



if (typeof String.prototype.startsWith !== 'function') {
    String.prototype.startsWith = function (str) {
        return this.indexOf(str) === 0;
    };
}



// adapted from: http://stackoverflow.com/questions/158070/jquery-how-to-position-one-element-relative-to-another
var showMenu = function (viewer, el, menu, right) {
    var posV, pos, eWidth, mWidth, left, top;

    //get the position of the placeholder element
    posV = $(viewer.canvas).offset();
    pos = $(el).offset();
    eWidth = $(el).outerWidth();
    mWidth = $(menu).outerWidth();
    left = pos.left + (right ? ((-1 * mWidth) + eWidth) : 5) +  "px";

    top = (posV.top) + "px";
    //show the menu directly over the placeholder
    $(menu).css({
        position: 'absolute',
        zIndex: 100,
        left: left,
        top: top
    });

    $(menu).hide().fadeIn(200);
};



var showModalDialog = function (viewer, dialog) {
    var viewerOffset, viewerWidth, viewerHeight, dialogWidth, dialogHeight, left, top;

    viewerOffset = $(viewer.canvas).offset();
    viewerWidth = $(viewer.canvas).outerWidth();
    viewerHeight = $(viewer.canvas).outerHeight();

    dialogWidth = $(dialog).outerWidth();
    dialogHeight = $(dialog).outerHeight();

    left = viewerOffset.left + (viewerWidth / 2) - (dialogWidth / 2) + "px";
    top = viewerOffset.top + (viewerHeight / 2) - (dialogHeight / 2) + "px";

    $(dialog).css({
        position: 'absolute',
        zIndex: 100,
        left: left,
        top: top
    });

    $(dialog).hide().fadeIn(200);
};



function isControlKey(ke) {
    var keyCode = getKeyCode(ke);

    if ((OSName === "MacOS") && (
            (keyCode === 91) || // left command key
            (keyCode === 93) || // right command key
            (keyCode === 224)
        )) { // FF command key code
        return true;
    }

    return ((OSName !== "MacOS") && (keyCode === 17));
}




function isAltKey(ke) {
    var keyCode = getKeyCode(ke);
    return (keyCode === 18);
}



function fullyQualifiedVariableExists(dat) {
    var obj, ctr;

    obj = window[dat[0]];

    for (ctr = 1; ctr < dat.length; ctr += 1) {
        if (obj === undefined) {
            return false;
        }

        obj = obj[dat[ctr]];
    }

    return (!(obj === undefined) && !(obj === null));
}



// http://www.quirksmode.org/js/cookies.html
function createCookie(name, value, days) {
    var date, expires;

    if (days) {
        date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toGMTString();
    } else {
        expires = "";
    }

    document.cookie = name + "=" + value + expires + "; path=/";
}



function readCookie(name) {
    var nameEQ, ca, i, c;

    nameEQ = name + "=";
    ca = document.cookie.split(';');

    for (i = 0; i < ca.length; i += 1) {
        c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1, c.length);
        }

        if (c.indexOf(nameEQ) === 0) {
            return c.substring(nameEQ.length, c.length);
        }
    }

    return null;
}



//function eraseCookie(name) {
//    createCookie(name, "", -1);
//}



function formatNumber(num, shortFormat) {
    var val = 0;

    if (isString(num)) {
        val = parseFloat(num);
    } else {
        val = num;
    }

    if (shortFormat) {
        val = val.toPrecision(5);
    } else {
        val = val.toPrecision(7);
    }

    return parseFloat(val);
}



function getSizeString(imageFileSize) {
    var imageFileSizeString = null;

    if (imageFileSize > 1048576) {
        imageFileSizeString = formatNumber(imageFileSize / 1048576, true) + " Mb";
    } else if (imageFileSize > 1024) {
        imageFileSizeString = formatNumber(imageFileSize / 1024, true) + " Kb";
    } else {
        imageFileSizeString = imageFileSize + " Bytes";
    }

    return imageFileSizeString;
}



// http://james.padolsey.com/javascript/wordwrap-for-javascript/
function wordwrap(str, width, brk, cut) {
    brk = brk || '\n';
    width = width || 75;
    cut = cut || false;

    if (!str) { return str; }

    var regex = '.{1,' + width + '}(\\s|$)' + (cut ? '|.{' + width + '}|.+$' : '|\\S+?(\\s|$)');

    return str.match(new RegExp(regex, 'g')).join(brk);

}



// adapted from: http://stackoverflow.com/questions/979975/how-to-get-the-value-from-url-parameter
function getQueryParams(params) {
    /*jslint regexp: true */
    var tokens, qs, re = /[?&]?([^=]+)=([^&]*)/g;

    if (document.location.href.indexOf("?") !== -1) {
        qs = document.location.href.substring(document.location.href.indexOf("?") + 1);
        qs = qs.split("+").join(" ");

        while (tokens = re.exec(qs)) {
            params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
        }
    }
}



// adapted from: http://stackoverflow.com/questions/724857/how-to-find-javascript-variable-by-its-name
function deref(name) {
    var obj, M;

    if (!isString(name)) {
        return null;
    }

    M = name.replace(/(^[' "]+|[" ']+$)/g, '').match(/(^[\w\$]+(\.[\w\$]+)*)/);

    if (M) {
        M = M[1].split('.');
        obj = window[M.shift()];
        while (obj && M.length) {
            obj = obj[M.shift()];
        }
    }

    return obj || null;
}
