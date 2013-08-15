
/**
 * @classDescription	An ImageRange stores min, max, and data scale information.
 */
var papaya = papaya || {};
papaya.volume = papaya.volume || {};


/**
 * Constructor.
 * @param {Numeric} min	The value which represents black.
 * @param {Numeric} max	The value which represents white.
 */
papaya.volume.ImageRange = papaya.volume.ImageRange || function(min, max) {
	// Public properties
	this.displayMin = min;
	this.displayMax = max;
	this.imageMin = min;
	this.imageMax = max;
	this.globalScale = papaya.volume.ImageRange.DEFAULT_SCALE;
	this.globalIntercept = papaya.volume.ImageRange.DEFAULT_INTERCEPT;
}


// Public constats
papaya.volume.ImageRange.DEFAULT_SCALE = 1.0;
papaya.volume.ImageRange.DEFAULT_INTERCEPT = 0.0;


// Public methods

/**
 * Tests wheter this object has a valid state.
 * @return {Boolean}	true if state is valid
 */
papaya.volume.ImageRange.prototype.isValid = function() {
	return true;
}


/**
 * Sets the global data scale and intercepts.
 * @param {Numeric} scale	The global scale.
 * @param {Numeric} intercept	The global intercept.
 */
papaya.volume.ImageRange.prototype.setGlobalDataScale = function(scale, intercept) {
	this.globalScale = scale;
	this.globalIntercept = intercept;
}
