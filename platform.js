
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


PAPAYA_VIEWER_ID  = "papayaViewer";
PAPAYA_CANVAS = null;
PAPAYA_DEFAULT_HEIGHT = 400;
PAPAYA_SPACING = 2;  // padding between slice views
BORDER_RADIUS = 10;
MARGIN_VERTICAL_SIZE = 30;
MARGIN_HORIZONTAL_SIZE = 10;

$(document).ready(function() {
	var width = (PAPAYA_DEFAULT_HEIGHT - (4 * PAPAYA_SPACING)) * 1.5 + (4 * PAPAYA_SPACING);
	var height = PAPAYA_DEFAULT_HEIGHT;
	
	PAPAYA_CANVAS = $('<canvas></canvas>').attr("id", PAPAYA_VIEWER_ID+"Canvas");
	PAPAYA_CANVAS.css({'padding':'0', 'margin':'0', 'border':'none', 'background-color':'black'});
	PAPAYA_CANVAS.width(width);
	PAPAYA_CANVAS.height(height);

	var viewerDiv = $("#"+PAPAYA_VIEWER_ID);
	viewerDiv.css({'border-top':MARGIN_VERTICAL_SIZE+'px solid grey', 'border-bottom':MARGIN_VERTICAL_SIZE+'px solid grey', 
		'border-right':MARGIN_HORIZONTAL_SIZE+'px solid grey',
		'border-left':MARGIN_HORIZONTAL_SIZE+'px solid grey', /*'margin':'20px auto',*/ 'border-radius':BORDER_RADIUS+'px', 'padding':'2px'});
	viewerDiv.append(PAPAYA_CANVAS);
	viewerDiv.width(width);
	viewerDiv.height(height);

	$('*').css({'-webkit-user-select':'none', '-khtml-user-select':'none', '-moz-user-select':'none', '-o-user-select':'none',
		'user-select':'none'});
});




if (!window.console) {
	console = {};
}

console.log = console.log || function() { };
console.warn = console.warn || function() { };
console.error = console.error || function() { };
console.info = console.info || function() { };


function getKeyCode(ev) {
	return (ev.keyCode ? ev.keyCode : ev.charCode);
}

function getMousePositionX(ev) {
	if (ev.layerX || (ev.layerX == 0)) { // Firefox
		return ev.layerX - MARGIN_HORIZONTAL_SIZE - BORDER_RADIUS;
	} else if (ev.offsetX || (ev.offsetX == 0)) { // Opera
		return ev.offsetX - MARGIN_HORIZONTAL_SIZE - BORDER_RADIUS;
	}
}

function getMousePositionY(ev) {
	if (ev.layerY || ev.layerY == 0) { // Firefox
		return ev.layerY - MARGIN_VERTICAL_SIZE - BORDER_RADIUS;
	} else if (ev.offsetY || ev.offsetY == 0) { // Opera
		return ev.offsetY - MARGIN_VERTICAL_SIZE - BORDER_RADIUS;
	}
}

// https://gist.github.com/912082/c6a61eb804e554a7e30e6eb4d6eb59906670a0e0
if (!FileReader.prototype.readAsArrayBuffer) {
	FileReader.prototype.readAsArrayBuffer = function readAsArrayBuffer () {
		this.readAsBinaryString.apply(this, arguments);
		this.__defineGetter__('resultString', this.__lookupGetter__('result'));
		Object.defineProperty(this, 'result', {
			get: function () {
				var string = this.resultString;
				var result = new Uint8Array(string.length);
				for (var i = 0; i < string.length; i++) {
					result[i] = string.charCodeAt(i);
				}
				return result.buffer;
			}
		});
	};
}

// Cross-browser slice method.
var makeSlice = function(file, start, length) {
	if (File.prototype.slice) {
		return file.slice(start, start+length);
	} else if (File.prototype.mozSlice) {
		return file.mozSlice(start, length);
	} else if (File.prototype.webkitSlice) {
		return file.webkitSlice(start, length);
	}
}
/*
 * DataView.js:
 * An implementation of the DataView class on top of typed arrays.
 * Useful for Firefox 4 which implements TypedArrays but not DataView.
 *
 * Copyright 2011 by David Flanagan
 * http://creativecommons.org/licenses/by-nc-sa/3.0/
 */
"use strict";

( function(global) {
	// If DataView already exists, do nothing
	if (global.DataView)
		return;

	// If ArrayBuffer is not supported, fail with an error
	if (!global.ArrayBuffer)
		fail("ArrayBuffer not supported");

	// If ES5 is not supported, fail
	if (!Object.defineProperties)
		fail("This module requires ECMAScript 5");

	// Figure if the platform is natively little-endian.
	// If the integer 0x00000001 is arranged in memory as 01 00 00 00 then
	// we're on a little endian platform. On a big-endian platform we'd get
	// get bytes 00 00 00 01 instead.
	var nativele = new Int8Array(new Int32Array([1]).buffer)[0] === 1;

	// A temporary array for copying or reversing bytes into.
	// Since js is single-threaded, we only need this one static copy
	var temp = new Uint8Array(8);

	// The DataView() constructor
	global.DataView = function DataView(buffer, offset, length) {
		if (!(buffer instanceof ArrayBuffer))
			fail("Bad ArrayBuffer");

		// Default values for omitted arguments
		offset = offset || 0;
		length = length || (buffer.byteLength - offset);

		if (offset < 0 || length < 0 || offset+length > buffer.byteLength)
			fail("Illegal offset and/or length");

		// Define the 3 read-only, non-enumerable ArrayBufferView properties
		Object.defineProperties(this, {
			buffer: {
				value: buffer,
				enumerable:false,
				writable: false,
				configurable: false
			},
			byteOffset: {
				value: offset,
				enumerable:false,
				writable: false,
				configurable: false
			},
			byteLength: {
				value: length,
				enumerable:false,
				writable: false,
				configurable: false
			},
			_bytes: {
				value: new Uint8Array(buffer, offset, length),
				enumerable:false,
				writable: false,
				configurable: false
			}
		});
	}
	// The DataView prototype object
	global.DataView.prototype = {
		constructor: DataView,

		getInt8: function getInt8(offset) {
			return get(this, Int8Array, 1, offset);
		},
		getUint8: function getUint8(offset) {
			return get(this, Uint8Array, 1, offset);
		},
		getInt16: function getInt16(offset, le) {
			return get(this, Int16Array, 2, offset, le);
		},
		getUint16: function getUint16(offset, le) {
			return get(this, Uint16Array, 2, offset, le);
		},
		getInt32: function getInt32(offset, le) {
			return get(this, Int32Array, 4, offset, le);
		},
		getUint32: function getUint32(offset, le) {
			return get(this, Uint32Array, 4, offset, le);
		},
		getFloat32: function getFloat32(offset, le) {
			return get(this, Float32Array, 4, offset, le);
		},
		getFloat64: function getFloat32(offset, le) {
			return get(this, Float64Array, 8, offset, le);
		},
		setInt8: function setInt8(offset, value) {
			set(this, Int8Array, 1, offset, value);
		},
		setUint8: function setUint8(offset, value) {
			set(this, Uint8Array, 1, offset, value);
		},
		setInt16: function setInt16(offset, value, le) {
			set(this, Int16Array, 2, offset, value, le);
		},
		setUint16: function setUint16(offset, value, le) {
			set(this, Uint16Array, 2, offset, value, le);
		},
		setInt32: function setInt32(offset, value, le) {
			set(this, Int32Array, 4, offset, value, le);
		},
		setUint32: function setUint32(offset, value, le) {
			set(this, Uint32Array, 4, offset, value, le);
		},
		setFloat32: function setFloat32(offset, value, le) {
			set(this, Float32Array, 4, offset, value, le);
		},
		setFloat64: function setFloat64(offset, value, le) {
			set(this, Float64Array, 8, offset, value, le);
		}
	};

	// The get() utility function used by the get methods
	function get(view, type, size, offset, le) {
		if (offset === undefined)
			fail("Missing required offset argument");

		if (offset < 0 || offset + size > view.byteLength)
			fail("Invalid index: " + offset);

		if (size === 1 || !!le === nativele) {
			// This is the easy case: the desired endianness
			// matches the native endianness.

			// Typed arrays require proper alignment.  DataView does not.
			if ((view.byteOffset + offset) % size === 0)
				return (new type(view.buffer, view.byteOffset+offset, 1))[0];
			else {
				// Copy bytes into the temp array, to fix alignment
				for(var i = 0; i < size; i++)
					temp[i] = view._bytes[offset+i];
				// Now wrap that buffer with an array of the desired type
				return (new type(temp.buffer))[0];
			}
		} else {
			// If the native endianness doesn't match the desired, then
			// we have to reverse the bytes
			for(var i = 0; i < size; i++)
				temp[size-i-1] = view._bytes[offset+i];
			return (new type(temp.buffer))[0];
		}
	}

	// The set() utility function used by the set methods
	function set(view, type, size, offset, value, le) {
		if (offset === undefined)
			fail("Missing required offset argument");
		if (value === undefined)
			fail("Missing required value argument");

		if (offset < 0 || offset + size > view.byteLength)
			fail("Invalid index: " + offset);

		if (size === 1 || !!le === nativele) {
			// This is the easy case: the desired endianness
			// matches the native endianness.
			if ((view.byteOffset + offset) % size === 0) {
				(new type(view.buffer,view.byteOffset+offset, 1))[0] = value;
			} else {
				(new type(temp.buffer))[0] = value;
				// Now copy the bytes into the view's buffer
				for(var i = 0; i < size; i++)
					view._bytes[i+offset] = temp[i];
			}
		} else {
			// If the native endianness doesn't match the desired, then
			// we have to reverse the bytes

			// Store the value into our temporary buffer
			(new type(temp.buffer))[0] = value;

			// Now copy the bytes, in reverse order, into the view's buffer
			for(var i = 0; i < size; i++)
				view._bytes[offset+i] = temp[size-1-i];
		}
	}

	function fail(msg) { throw new Error(msg);
	}

}(this));
