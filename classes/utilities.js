
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
