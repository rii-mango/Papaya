
/**
 * Utility functions.


function bind(scope, fn) {
    return function () {
        return fn.apply(scope, arguments);
    };
}
 */

function bind (scope, fn, args, appendArgs) {
    if (arguments.length === 2) {
        return function() {
            return fn.apply(scope, arguments);
        }
    }

    var method = fn,
        slice = Array.prototype.slice;

    return function() {
        var callArgs = args || arguments;

        if (appendArgs === true) {
            callArgs = slice.call(arguments, 0);
            callArgs = callArgs.concat(args);
        }
        else if (typeof appendArgs == 'number') {
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
    return (typeof obj == 'string' || obj instanceof String);
}


function signum(val) {
    return val?val<0?-1:1:0
}


// http://stackoverflow.com/questions/2294703/multidimensional-array-cloning-using-javascript
Array.prototype.clone = function() {
    var arr = this.slice(0);
    for( var i = 0; i < this.length; i++ ) {
        if( this[i].clone ) {
            //recursion
            arr[i] = this[i].clone();
        }
    }
    return arr;
};


if (typeof String.prototype.startsWith != 'function') {
    String.prototype.startsWith = function (str){
        return this.indexOf(str) == 0;
    };
}


// adapted from: http://stackoverflow.com/questions/158070/jquery-how-to-position-one-element-relative-to-another
var showMenu = function(viewer, el, menu, right) {
    //get the position of the placeholder element
    var posV = $(viewer.canvas).offset();
    var pos = $(el).offset();
    var eWidth = $(el).outerWidth();
    var eHeight = $(el).outerHeight();
    var mWidth = $(menu).outerWidth();
    var left = pos.left + (right ? ((-1 * mWidth) + eWidth) : 5) +  "px";

    var top = (posV.top) + "px";
    //show the menu directly over the placeholder
    $(menu).css( {
        position: 'absolute',
        zIndex: 100,
        left: left,
        top: top
    } );

    $(menu).hide().fadeIn(200);
};


var showModalDialog = function(viewer, dialog) {
    var viewerOffset = $(viewer.canvas).offset();
    var viewerWidth = $(viewer.canvas).outerWidth();
    var viewerHeight = $(viewer.canvas).outerHeight();

    var dialogWidth = $(dialog).outerWidth();
    var dialogHeight = $(dialog).outerHeight();

    var left = viewerOffset.left + (viewerWidth / 2) - (dialogWidth / 2) + "px";
    var top = viewerOffset.top + (viewerHeight / 2) - (dialogHeight / 2) + "px";

    $(dialog).css( {
        position: 'absolute',
        zIndex: 100,
        left: left,
        top: top
    } );

    $(dialog).hide().fadeIn(200);
};


// http://stackoverflow.com/questions/15397036/drawing-dashed-lines-on-html5-canvas
CanvasRenderingContext2D.prototype.dashedLine = function (x1, y1, x2, y2, dashLen) {
    if (dashLen == undefined) dashLen = 2;
    this.moveTo(x1, y1);
    var dX = x2 - x1;
    var dY = y2 - y1;
    var dashes = Math.floor(Math.sqrt(dX * dX + dY * dY) / dashLen);
    var dashX = dX / dashes;
    var dashY = dY / dashes;

    var q = 0;
    while (q++ < dashes) {
        x1 += dashX;
        y1 += dashY;
        this[q % 2 == 0 ? 'moveTo' : 'lineTo'](x1, y1);
    }
    this[q % 2 == 0 ? 'moveTo' : 'lineTo'](x2, y2);
};


function isControlKey(ke) {
    var keyCode = getKeyCode(ke);

    if ((OSName == "MacOS") && (
            (keyCode == 91) || // left command key
            (keyCode == 93) || // right command key
            (keyCode == 224))) { // FF command key code
        return true;
    } else if ((OSName != "MacOS") && (keyCode == 17)) {
        return true;
    }

    return false;
}


function fullyQualifiedVariableExists(dat) {
    var obj = window[dat[0]];

    for (var ctr = 1; ctr < dat.length; ctr++) {
        if (typeof obj === "undefined") {
            return false;
        }

        obj = obj[dat[ctr]];
    }

    if (typeof obj === "undefined") {
        return false;
    } else {
        return true;
    }
}


// http://www.quirksmode.org/js/cookies.html
function createCookie(name,value,days) {
    if (days) {
        var date = new Date();
        date.setTime(date.getTime()+(days*24*60*60*1000));
        var expires = "; expires="+date.toGMTString();
    }
    else var expires = "";
    document.cookie = name+"="+value+expires+"; path=/";
}


function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}


function eraseCookie(name) {
    createCookie(name,"",-1);
}
