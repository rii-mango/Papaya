
/**
 * Utility functions.
 */

function bind(scope, fn) {
    return function () {
        fn.apply(scope, arguments);
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