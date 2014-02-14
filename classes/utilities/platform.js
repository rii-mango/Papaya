
/*jslint browser: true, node: true */
/*global BrowserDetect, File, ArrayBuffer, DataView, Int16Array */

"use strict";

var BROWSER_MIN_FIREFOX = 7;
var BROWSER_MIN_CHROME = 7;
var BROWSER_MIN_SAFARI = 6;
var BROWSER_MIN_IE = 10;
var BROWSER_MIN_OPERA = 12;
var console = console || {};
console.log = console.log || function () {};
console.warn = console.warn || function () {};
console.error = console.error || function () {};
console.info = console.info || function () {};

var SCROLL_APROXIMATE_MAX_FIREFOX = 60;
var SCROLL_APROXIMATE_MAX_SAFARI = 1200;
var SCROLL_APROXIMATE_MAX_CHROME = 1200;


var LAST_SCROLL_EVENT_TIMESTAMP = 0;


var OSName = "Unknown OS";
if (navigator.appVersion.indexOf("Win") !== -1) {
    OSName = "Windows";
}

if (navigator.appVersion.indexOf("Mac") !== -1) {
    OSName = "MacOS";
}

if (navigator.appVersion.indexOf("X11") !== -1) {
    OSName = "Linux";
}

if (navigator.appVersion.indexOf("Linux") !== -1) {
    OSName = "Linux";
}


var browserIsFirefox = false;
var browserIsSafari = false;
var browserIsOpera = false;
var browserIsChrome = false;
var browserIsIE = false;
function checkForBrowserCompatibility() {
    if (BrowserDetect.browser === "Firefox") {
        browserIsFirefox = true;
        if (BrowserDetect.version < BROWSER_MIN_FIREFOX) {
            return ("Papaya requires Firefox version " + BROWSER_MIN_FIREFOX + " or higher.");
        }
    } else if (BrowserDetect.browser === "Chrome") {
        browserIsChrome = true;
        if (BrowserDetect.version < BROWSER_MIN_CHROME) {
            return ("Papaya requires Chrome version " + BROWSER_MIN_CHROME + " or higher.");
        }
    } else if (BrowserDetect.browser === "Explorer") {
        browserIsIE = true;
        if (BrowserDetect.version < BROWSER_MIN_IE) {
            return ("Papaya requires Internet Explorer version " + BROWSER_MIN_IE + " or higher.");
        }
    } else if (BrowserDetect.browser === "Safari") {
        browserIsSafari = true;
        if (BrowserDetect.version < BROWSER_MIN_SAFARI) {
            return ("Papaya requires Safari version " + BROWSER_MIN_SAFARI + " or higher.");
        }
    } else if (BrowserDetect.browser === "Opera") {
        browserIsOpera = true;
        if (BrowserDetect.version < BROWSER_MIN_OPERA) {
            return ("Papaya requires Opera version " + BROWSER_MIN_OPERA + " or higher.");
        }
    }

    return null;
}



function getKeyCode(ev) {
    return (ev.keyCode || ev.charCode);
}



function getMousePositionX(ev) {
    var touch;

    if (ev.targetTouches) {
        if (ev.targetTouches.length === 1) {
            touch = ev.targetTouches[0];
            if (touch) {
                return touch.pageX;
            }
        }
    } else if (ev.changedTouches) {
        if (ev.changedTouches.length === 1) {
            touch = ev.changedTouches[0];
            if (touch) {
                return touch.pageX;
            }
        }
    }

    return ev.pageX;
}



function getMousePositionY(ev) {
    var touch;

    if (ev.targetTouches) {
        if (ev.targetTouches.length === 1) {
            touch = ev.targetTouches[0];
            if (touch) {
                return touch.pageY;
            }
        }
    } else if (ev.changedTouches) {
        if (ev.changedTouches.length === 1) {
            touch = ev.changedTouches[0];
            if (touch) {
                return touch.pageY;
            }
        }
    }

    return ev.pageY;
}


// a somewhat more consistent scroll across platforms
function getScrollSign(ev) {
    var now = Date.now();

    if ((now - LAST_SCROLL_EVENT_TIMESTAMP) > 50) {
        LAST_SCROLL_EVENT_TIMESTAMP = now;

        if (ev.wheelDelta) {
            return ev.wheelDelta > 0 ? 1 : -1;
        }

        if (ev.detail) {
            return ev.detail < 0 ? 1 : -1;
        }
    }

    return 0;
}




// Cross-browser slice method.
var makeSlice = function (file, start, length) {
    var fileType = (typeof File);

    if (fileType === 'undefined') {
        return function () {};
    }

    if (File.prototype.slice) {
        return file.slice(start, start + length);
    }

    if (File.prototype.mozSlice) {
        return file.mozSlice(start, length);
    }

    if (File.prototype.webkitSlice) {
        return file.webkitSlice(start, length);
    }

    return null;
};



function isPlatformLittleEndian() {
    var buffer = new ArrayBuffer(2);
    new DataView(buffer).setInt16(0, 256, true);
    return new Int16Array(buffer)[0] === 256;
}



function isInputRangeSupported() {
    var test = document.createElement("input");
    test.setAttribute("type", "range");
    return (test.type === "range");
}