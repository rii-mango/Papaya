
/*
 * Copyright (c) 2012, RII-UTHSCSA
 * All rights reserved.

 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the 
 * following conditions are met:
 *
 *	- Redistributions of source code must retain the above copyright notice, this list of conditions and the following 
 *		disclaimer.
 *
 *	- Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the 
 *		following disclaimer in the documentation and/or other materials provided with the distribution.
 *
 *	- Neither the name of the RII-UTHSCSA nor the names of its contributors may be used to endorse or promote products 
 *		derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, 
 * INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, 
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR 
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, 
 * WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE 
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */


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
