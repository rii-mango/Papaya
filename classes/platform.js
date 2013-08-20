
PAPAYA_VIEWER_ID  = "papayaViewer";
PAPAYA_CANVAS = null;
PAPAYA_DEFAULT_HEIGHT = 400;
PAPAYA_SPACING = 2;  // padding between slice views
BORDER_RADIUS = 10;
MARGIN_VERTICAL_SIZE = 30;
MARGIN_HORIZONTAL_SIZE = 10;

BROWSER_MIN_FIREFOX = 7;
BROWSER_MIN_CHROME = 7;
BROWSER_MIN_SAFARI = 6;
BROWSER_MIN_IE = 10;
BROWSER_MIN_OPERA = 12;

// http://www.quirksmode.org/js/detect.html
var BrowserDetect = {
    init: function () {
        this.browser = this.searchString(this.dataBrowser) || "An unknown browser";
        this.version = this.searchVersion(navigator.userAgent)
            || this.searchVersion(navigator.appVersion)
            || "an unknown version";
        this.OS = this.searchString(this.dataOS) || "an unknown OS";
    },
    searchString: function (data) {
        for (var i=0;i<data.length;i++)	{
            var dataString = data[i].string;
            var dataProp = data[i].prop;
            this.versionSearchString = data[i].versionSearch || data[i].identity;
            if (dataString) {
                if (dataString.indexOf(data[i].subString) != -1)
                    return data[i].identity;
            }
            else if (dataProp)
                return data[i].identity;
        }
    },
    searchVersion: function (dataString) {
        var index = dataString.indexOf(this.versionSearchString);
        if (index == -1) return;
        return parseFloat(dataString.substring(index+this.versionSearchString.length+1));
    },
    dataBrowser: [
        {
            string: navigator.userAgent,
            subString: "Chrome",
            identity: "Chrome"
        },
        { 	string: navigator.userAgent,
            subString: "OmniWeb",
            versionSearch: "OmniWeb/",
            identity: "OmniWeb"
        },
        {
            string: navigator.vendor,
            subString: "Apple",
            identity: "Safari",
            versionSearch: "Version"
        },
        {
            prop: window.opera,
            identity: "Opera",
            versionSearch: "Version"
        },
        {
            string: navigator.vendor,
            subString: "iCab",
            identity: "iCab"
        },
        {
            string: navigator.vendor,
            subString: "KDE",
            identity: "Konqueror"
        },
        {
            string: navigator.userAgent,
            subString: "Firefox",
            identity: "Firefox"
        },
        {
            string: navigator.vendor,
            subString: "Camino",
            identity: "Camino"
        },
        {		// for newer Netscapes (6+)
            string: navigator.userAgent,
            subString: "Netscape",
            identity: "Netscape"
        },
        {
            string: navigator.userAgent,
            subString: "MSIE",
            identity: "Explorer",
            versionSearch: "MSIE"
        },
        {
            string: navigator.userAgent,
            subString: "Gecko",
            identity: "Mozilla",
            versionSearch: "rv"
        },
        { 		// for older Netscapes (4-)
            string: navigator.userAgent,
            subString: "Mozilla",
            identity: "Netscape",
            versionSearch: "Mozilla"
        }
    ],
    dataOS : [
        {
            string: navigator.platform,
            subString: "Win",
            identity: "Windows"
        },
        {
            string: navigator.platform,
            subString: "Mac",
            identity: "Mac"
        },
        {
            string: navigator.userAgent,
            subString: "iPhone",
            identity: "iPhone/iPod"
        },
        {
            string: navigator.platform,
            subString: "Linux",
            identity: "Linux"
        }
    ]

};
BrowserDetect.init();



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

    if (BrowserDetect.browser == "Firefox") {
        if (BrowserDetect.version < BROWSER_MIN_FIREFOX) {
            showCompatibilityWarning();
        }
    } else if (BrowserDetect.browser == "Chrome") {
        if (BrowserDetect.version < BROWSER_MIN_CHROME) {
            showCompatibilityWarning();
        }
    } else if (BrowserDetect.browser == "Explorer") {
        if (BrowserDetect.version < BROWSER_MIN_IE) {
            showCompatibilityWarning();
        }
    } else if (BrowserDetect.browser == "Safari") {
        if (BrowserDetect.version < BROWSER_MIN_SAFARI) {
            showCompatibilityWarning();
        }
    } else if (BrowserDetect.browser == "Opera") {
        if (BrowserDetect.version < BROWSER_MIN_OPERA) {
            showCompatibilityWarning();
        }
    }
});



function showCompatibilityWarning() {
    if (BrowserDetect.browser == "Firefox") {
        alert("This version of " +BrowserDetect.browser+ " is " + BrowserDetect.version + ".\n" +BrowserDetect.browser+ " version "+BROWSER_MIN_FIREFOX+" or higher is required.\n\nPlease consider upgrading or using a different browser.")
    } else if (BrowserDetect.browser == "Chrome") {
        alert("This version of " +BrowserDetect.browser+ " is " + BrowserDetect.version + ".\n" +BrowserDetect.browser+ " version "+BROWSER_MIN_CHROME+" or higher is required.\n\nPlease consider upgrading or using a different browser.")
    } else if (BrowserDetect.browser == "Explorer") {
        alert("This version of " +BrowserDetect.browser+ " is " + BrowserDetect.version + ".\n" +BrowserDetect.browser+ " version "+BROWSER_MIN_IE+" or higher is required.\n\nPlease consider upgrading or using a different browser.")
    } else if (BrowserDetect.browser == "Safari") {
        alert("This version of " +BrowserDetect.browser+ " is " + BrowserDetect.version + ".\n" +BrowserDetect.browser+ " version "+BROWSER_MIN_SAFARI+" or higher is required.\n\nPlease consider upgrading or using a different browser.")
    } else if (BrowserDetect.browser == "Opera") {
        alert("This version of " +BrowserDetect.browser+ " is " + BrowserDetect.version + ".\n" +BrowserDetect.browser+ " version "+BROWSER_MIN_OPERA+" or higher is required.\n\nPlease consider upgrading or using a different browser.")
    }
}




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
	return ev.pageX - MARGIN_HORIZONTAL_SIZE - BORDER_RADIUS;
}

function getMousePositionY(ev) {
	return ev.pageY - MARGIN_VERTICAL_SIZE - BORDER_RADIUS;
}

// https://gist.github.com/912082/c6a61eb804e554a7e30e6eb4d6eb59906670a0e0
//if (!FileReader.prototype.readAsArrayBuffer) {
//	FileReader.prototype.readAsArrayBuffer = function readAsArrayBuffer () {
//		this.readAsBinaryString.apply(this, arguments);
//		this.__defineGetter__('resultString', this.__lookupGetter__('result'));
//		Object.defineProperty(this, 'result', {
//			get: function () {
//				var string = this.resultString;
//				var result = new Uint8Array(string.length);
//				for (var i = 0; i < string.length; i++) {
//					result[i] = string.charCodeAt(i);
//				}
//				return result.buffer;
//			}
//		});
//	};
//}




// Cross-browser slice method.
var makeSlice = function(file, start, length) {
    if (typeof File === 'undefined') {
        return function() { };
    } else if (File.prototype.slice) {
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
//"use strict";
//
//( function(global) {
//	// If DataView already exists, do nothing
//	if (global.DataView)
//		return;
//
//	// If ArrayBuffer is not supported, fail with an error
//	if (!global.ArrayBuffer)
//		fail("ArrayBuffer not supported");
//
//	// If ES5 is not supported, fail
//	if (!Object.defineProperties)
//		fail("This module requires ECMAScript 5");
//
//	// Figure if the platform is natively little-endian.
//	// If the integer 0x00000001 is arranged in memory as 01 00 00 00 then
//	// we're on a little endian platform. On a big-endian platform we'd get
//	// get bytes 00 00 00 01 instead.
//	var nativele = new Int8Array(new Int32Array([1]).buffer)[0] === 1;
//
//	// A temporary array for copying or reversing bytes into.
//	// Since js is single-threaded, we only need this one static copy
//	var temp = new Uint8Array(8);
//
//	// The DataView() constructor
//	global.DataView = function DataView(buffer, offset, length) {
//		if (!(buffer instanceof ArrayBuffer))
//			fail("Bad ArrayBuffer");
//
//		// Default values for omitted arguments
//		offset = offset || 0;
//		length = length || (buffer.byteLength - offset);
//
//		if (offset < 0 || length < 0 || offset+length > buffer.byteLength)
//			fail("Illegal offset and/or length");
//
//		// Define the 3 read-only, non-enumerable ArrayBufferView properties
//		Object.defineProperties(this, {
//			buffer: {
//				value: buffer,
//				enumerable:false,
//				writable: false,
//				configurable: false
//			},
//			byteOffset: {
//				value: offset,
//				enumerable:false,
//				writable: false,
//				configurable: false
//			},
//			byteLength: {
//				value: length,
//				enumerable:false,
//				writable: false,
//				configurable: false
//			},
//			_bytes: {
//				value: new Uint8Array(buffer, offset, length),
//				enumerable:false,
//				writable: false,
//				configurable: false
//			}
//		});
//	}
//	// The DataView prototype object
//	global.DataView.prototype = {
//		constructor: DataView,
//
//		getInt8: function getInt8(offset) {
//			return get(this, Int8Array, 1, offset);
//		},
//		getUint8: function getUint8(offset) {
//			return get(this, Uint8Array, 1, offset);
//		},
//		getInt16: function getInt16(offset, le) {
//			return get(this, Int16Array, 2, offset, le);
//		},
//		getUint16: function getUint16(offset, le) {
//			return get(this, Uint16Array, 2, offset, le);
//		},
//		getInt32: function getInt32(offset, le) {
//			return get(this, Int32Array, 4, offset, le);
//		},
//		getUint32: function getUint32(offset, le) {
//			return get(this, Uint32Array, 4, offset, le);
//		},
//		getFloat32: function getFloat32(offset, le) {
//			return get(this, Float32Array, 4, offset, le);
//		},
//		getFloat64: function getFloat32(offset, le) {
//			return get(this, Float64Array, 8, offset, le);
//		},
//		setInt8: function setInt8(offset, value) {
//			set(this, Int8Array, 1, offset, value);
//		},
//		setUint8: function setUint8(offset, value) {
//			set(this, Uint8Array, 1, offset, value);
//		},
//		setInt16: function setInt16(offset, value, le) {
//			set(this, Int16Array, 2, offset, value, le);
//		},
//		setUint16: function setUint16(offset, value, le) {
//			set(this, Uint16Array, 2, offset, value, le);
//		},
//		setInt32: function setInt32(offset, value, le) {
//			set(this, Int32Array, 4, offset, value, le);
//		},
//		setUint32: function setUint32(offset, value, le) {
//			set(this, Uint32Array, 4, offset, value, le);
//		},
//		setFloat32: function setFloat32(offset, value, le) {
//			set(this, Float32Array, 4, offset, value, le);
//		},
//		setFloat64: function setFloat64(offset, value, le) {
//			set(this, Float64Array, 8, offset, value, le);
//		}
//	};
//
//	// The get() utility function used by the get methods
//	function get(view, type, size, offset, le) {
//		if (offset === undefined)
//			fail("Missing required offset argument");
//
//		if (offset < 0 || offset + size > view.byteLength)
//			fail("Invalid index: " + offset);
//
//		if (size === 1 || !!le === nativele) {
//			// This is the easy case: the desired endianness
//			// matches the native endianness.
//
//			// Typed arrays require proper alignment.  DataView does not.
//			if ((view.byteOffset + offset) % size === 0)
//				return (new type(view.buffer, view.byteOffset+offset, 1))[0];
//			else {
//				// Copy bytes into the temp array, to fix alignment
//				for(var i = 0; i < size; i++)
//					temp[i] = view._bytes[offset+i];
//				// Now wrap that buffer with an array of the desired type
//				return (new type(temp.buffer))[0];
//			}
//		} else {
//			// If the native endianness doesn't match the desired, then
//			// we have to reverse the bytes
//			for(var i = 0; i < size; i++)
//				temp[size-i-1] = view._bytes[offset+i];
//			return (new type(temp.buffer))[0];
//		}
//	}
//
//	// The set() utility function used by the set methods
//	function set(view, type, size, offset, value, le) {
//		if (offset === undefined)
//			fail("Missing required offset argument");
//		if (value === undefined)
//			fail("Missing required value argument");
//
//		if (offset < 0 || offset + size > view.byteLength)
//			fail("Invalid index: " + offset);
//
//		if (size === 1 || !!le === nativele) {
//			// This is the easy case: the desired endianness
//			// matches the native endianness.
//			if ((view.byteOffset + offset) % size === 0) {
//				(new type(view.buffer,view.byteOffset+offset, 1))[0] = value;
//			} else {
//				(new type(temp.buffer))[0] = value;
//				// Now copy the bytes into the view's buffer
//				for(var i = 0; i < size; i++)
//					view._bytes[i+offset] = temp[i];
//			}
//		} else {
//			// If the native endianness doesn't match the desired, then
//			// we have to reverse the bytes
//
//			// Store the value into our temporary buffer
//			(new type(temp.buffer))[0] = value;
//
//			// Now copy the bytes, in reverse order, into the view's buffer
//			for(var i = 0; i < size; i++)
//				view._bytes[offset+i] = temp[size-1-i];
//		}
//	}
//
//	function fail(msg) { throw new Error(msg);
//	}
//
//}(this));



function isPlatformLittleEndian() {
	var buffer = new ArrayBuffer(2);
	new DataView(buffer).setInt16(0, 256, true);
	return new Int16Array(buffer)[0] === 256;
};
