
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
var showMenu = function(el, menu) {
    //get the position of the placeholder element
    var pos = $(el).offset();
    var eWidth = $(el).outerWidth();
    var eHeight = $(el).outerHeight();
    var mWidth = $(menu).outerWidth();
    var left = (pos.left + 5) + "px";
    var top = eHeight+pos.top + "px";
    //show the menu directly over the placeholder
    $(menu).css( {
        position: 'absolute',
        zIndex: 100,
        left: left,
        top: top
    } );

    $(menu).hide().fadeIn(200);
};