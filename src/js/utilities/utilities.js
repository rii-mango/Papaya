
/*jslint browser: true, node: true */
/*global $, Ext, CanvasRenderingContext2D, getKeyCode, OSName, getMousePositionX, PAPAYA_BROWSER */

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



function roundFast(val) {
    return (0.5 + val) | 0;
}



function floorFast(val) {
    return val | 0;
}


function validDimBounds(val, dimBound) {
    return (val < dimBound) ? val : dimBound - 1;
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
    var viewerWidth, viewerHeight, dialogWidth, dialogHeight, left, top;

    var docElem = document.documentElement;
    var scrollTop = window.pageYOffset || docElem.scrollTop;

    viewerWidth = $(window).outerWidth();
    viewerHeight = $(window).outerHeight();

    dialogWidth = $(dialog).outerWidth();
    dialogHeight = $(dialog).outerHeight();

    left = (viewerWidth / 2) - (dialogWidth / 2) + "px";
    top = scrollTop + (viewerHeight / 2) - (dialogHeight / 2) + "px";

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

    if ((PAPAYA_BROWSER.os === "MacOS") && (
            (keyCode === 91) || // left command key
            (keyCode === 93) || // right command key
            (keyCode === 224)
        )) { // FF command key code
        return true;
    }

    return ((PAPAYA_BROWSER.os !== "MacOS") && (keyCode === 17));
}




function isAltKey(ke) {
    var keyCode = getKeyCode(ke);
    return (keyCode === 18);
}



function isShiftKey(ke) {
    var isShift = ke.shiftKey ? true : false;

    if (!isShift && window.event) {
        isShift = window.event.shiftKey ? true : false;
    }

    return isShift;
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



function eraseCookie(name) {
    createCookie(name, "", -1);
}



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
    return derefIn(window, name);
}


function derefIn(parent, name) {
    var obj, M;

    if (!isString(name)) {
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
}


function getOffsetRect(elem) {
    // (1)
    var box = elem.getBoundingClientRect();

    var body = document.body;
    var docElem = document.documentElement;

    // (2)
    var scrollTop = window.pageYOffset || docElem.scrollTop;
    var scrollLeft = window.pageXOffset || docElem.scrollLeft;

    // (3)
    var clientTop = docElem.clientTop || body.clientTop || 0;
    var clientLeft = docElem.clientLeft || body.clientLeft || 0;

    // (4)
    var top  = box.top + scrollTop - clientTop;
    var left = box.left + scrollLeft - clientLeft;

    return { top: Math.round(top), left: Math.round(left) };
}



function getColorComponents(rgbStr) {
    if (rgbStr) {
        return rgbStr.match(/\d+/g);
    }

    return [0, 0, 0, 255];
}



function getNiceForegroundColor(rgbStr) {
    var colors = getColorComponents(rgbStr);

    var avg = (parseInt(colors[0]) + parseInt(colors[1]) + parseInt(colors[2])) / 3;

    if (avg > 127) {
        colors[0] = colors[1] = colors[2] = 0;
    } else {
        colors[0] = colors[1] = colors[2] = 255;
    }

    return ("rgb(" + colors[0] + ", " + colors[1] + ", " + colors[2] + ")");
}



function getRelativeMousePositionFromParentX(elem, ev) {
    var parentOffset = elem.parent().offset();
    return getMousePositionX(ev) - parentOffset.left;
}



function getRelativeMousePositionX(elem, ev) {
    var parentOffset = elem.offset();
    return getMousePositionX(ev) - parentOffset.left;
}


// http://stackoverflow.com/questions/966225/how-can-i-create-a-two-dimensional-array-in-javascript
function createArray(length) {
    var arr = new Array(length || 0),
        i = length;

    if (arguments.length > 1) {
        var args = Array.prototype.slice.call(arguments, 1);
        while(i--) arr[length-1 - i] = createArray.apply(this, args);
    }

    return arr;
}


function getAbsoluteUrl(protocol, relative) {
    var base, link, host, path;

    base = window.location.href;
    base = base.substring(0, base.lastIndexOf("/"));
    link = document.createElement("a");
    link.href = base + "/" +  relative;

    host = link.host;
    path = link.pathname;

    if (path.charAt(0) !== '/') {
        path = "/" + path;
    }


    return (protocol + "://" + host + path);
}
