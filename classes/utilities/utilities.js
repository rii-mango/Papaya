
/**
 * Utility functions.
 */

function bind(scope, fn) {
    return function () {
        return fn.apply(scope, arguments);
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
}




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
