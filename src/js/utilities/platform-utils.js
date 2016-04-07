
/*jslint browser: true, node: true */
/*global $, PAPAYA_BROWSER_MIN_FIREFOX, PAPAYA_BROWSER_MIN_CHROME, PAPAYA_BROWSER_MIN_IE, PAPAYA_BROWSER_MIN_SAFARI,
PAPAYA_BROWSER_MIN_OPERA, bowser, File, PAPAYA_MANGO_INSTALLED, confirm */

"use strict";

/*** Imports ***/
var papaya = papaya || {};
papaya.utilities = papaya.utilities || {};
papaya.utilities.PlatformUtils = papaya.utilities.PlatformUtils || {};

var console = console || {};
console.log = console.log || function () {};
console.warn = console.warn || function () {};
console.error = console.error || function () {};
console.info = console.info || function () {};


/*** Static Fields ***/

papaya.utilities.PlatformUtils.os = null;
papaya.utilities.PlatformUtils.browser = bowser.name;
papaya.utilities.PlatformUtils.browserVersion = bowser.version;
papaya.utilities.PlatformUtils.ios = bowser.ios;
papaya.utilities.PlatformUtils.mobile = bowser.mobile;
papaya.utilities.PlatformUtils.lastScrollEventTimestamp = 0;
papaya.utilities.PlatformUtils.smallScreen = window.matchMedia && window.matchMedia("only screen and (max-width: 760px)").matches;

/*** Static Methods ***/

papaya.utilities.PlatformUtils.detectOs = function () {
    if (navigator.appVersion.indexOf("Win") !== -1) {
        return "Windows";
    } else if (navigator.appVersion.indexOf("Mac") !== -1) {
        return "MacOS";
    } else if ((navigator.appVersion.indexOf("X11") !== -1) || (navigator.appVersion.indexOf("Linux") !== -1)) {
        return "Linux";
    } else {
        return "Unknown";
    }
};
papaya.utilities.PlatformUtils.os = papaya.utilities.PlatformUtils.detectOs();



papaya.utilities.PlatformUtils.checkForBrowserCompatibility = function () {
    if (papaya.utilities.PlatformUtils.browser === "Firefox") {
        if (papaya.utilities.PlatformUtils.browserVersion < PAPAYA_BROWSER_MIN_FIREFOX) {
            return ("Papaya requires Firefox version " + PAPAYA_BROWSER_MIN_FIREFOX + " or higher.");
        }
    } else if (papaya.utilities.PlatformUtils.browser === "Chrome") {
        if (papaya.utilities.PlatformUtils.browserVersion < PAPAYA_BROWSER_MIN_CHROME) {
            return ("Papaya requires Chrome version " + PAPAYA_BROWSER_MIN_CHROME + " or higher.");
        }
    } else if (papaya.utilities.PlatformUtils.browser === "Internet Explorer") {
        if (papaya.utilities.PlatformUtils.browserVersion < PAPAYA_BROWSER_MIN_IE) {
            return ("Papaya requires Internet Explorer version " + PAPAYA_BROWSER_MIN_IE + " or higher.");
        }
    } else if (papaya.utilities.PlatformUtils.browser === "Safari") {
        if (papaya.utilities.PlatformUtils.browserVersion < PAPAYA_BROWSER_MIN_SAFARI) {
            return ("Papaya requires Safari version " + PAPAYA_BROWSER_MIN_SAFARI + " or higher.");
        }
    } else if (papaya.utilities.PlatformUtils.browser === "Opera") {
        if (papaya.utilities.PlatformUtils.browserVersion < PAPAYA_BROWSER_MIN_OPERA) {
            return ("Papaya requires Opera version " + PAPAYA_BROWSER_MIN_OPERA + " or higher.");
        }
    }

    return null;
};



papaya.utilities.PlatformUtils.isWebGLSupported = function () {
    var canvas;
    var ctx;
    var ext;

    try {
        canvas = document.createElement('canvas');
        ctx = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        ext = ctx.getExtension('OES_element_index_uint');
        if (!ext) {
            return false;
        }
    } catch (e) {
        console.log("There was a problem detecting WebGL! " + e);
        return false;
    }

    canvas = null;
    ctx = null;
    ext = null;

    return true;
};



papaya.utilities.PlatformUtils.getMousePositionX = function (ev) {
    var touch;

    if (ev.originalEvent) {
        ev = ev.originalEvent;
    }

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
};



papaya.utilities.PlatformUtils.getMousePositionY = function (ev) {
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
};



// a somewhat more consistent scroll across platforms
papaya.utilities.PlatformUtils.getScrollSign = function (ev, slow) {
    var wait, sign, rawValue, value;

    if (slow) {
        wait = 75;
    } else if (papaya.utilities.PlatformUtils.browser === "Firefox") {
        wait = 10;
    } else if (papaya.utilities.PlatformUtils.browser === "Chrome") {
        wait = 50;
    } else if (papaya.utilities.PlatformUtils.browser === "Internet Explorer") {
        wait = 0;
    } else if (papaya.utilities.PlatformUtils.browser === "Safari") {
        wait = 50;
    } else {
        wait = 10;
    }

    var now = Date.now();

    if ((now - papaya.utilities.PlatformUtils.lastScrollEventTimestamp) > wait) {
        papaya.utilities.PlatformUtils.lastScrollEventTimestamp = now;
        rawValue = papaya.utilities.PlatformUtils.normalizeWheel(ev).spinY;
        sign = (-1 * papaya.utilities.PlatformUtils.normalizeWheel(ev).spinY) > 0 ? 1 : -1;
        value = Math.ceil(Math.abs(rawValue / 10.0)) * sign;
        return value;
    }

    return 0;
};



// Cross-browser slice method.
papaya.utilities.PlatformUtils.makeSlice = function (file, start, length) {
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



papaya.utilities.PlatformUtils.isPlatformLittleEndian = function () {
    var buffer = new ArrayBuffer(2);
    new DataView(buffer).setInt16(0, 256, true);
    return new Int16Array(buffer)[0] === 256;
};



papaya.utilities.PlatformUtils.isInputRangeSupported = function () {
    var test = document.createElement("input");
    test.setAttribute("type", "range");
    return (test.type === "range");
};



// adapted from: http://www.rajeshsegu.com/2012/09/browser-detect-custom-protocols/comment-page-1/
papaya.utilities.PlatformUtils.launchCustomProtocol = function (container, url, callback) {
    var iframe, myWindow, cookie, success = false;

    if (papaya.utilities.PlatformUtils.browser === "Internet Explorer") {
        myWindow = window.open('', '', 'width=0,height=0');
        myWindow.document.write("<iframe src='" + url + "'></iframe>");

        setTimeout(function () {
            try {
                myWindow.location.href;
                success = true;
            } catch (ex) {
                console.log(ex);
            }

            if (success) {
                myWindow.setTimeout('window.close()', 100);
            } else {
                myWindow.close();
            }

            callback(success);
        }, 100);
    } else if (papaya.utilities.PlatformUtils.browser === "Firefox") {
        try {
            iframe = $("<iframe />");
            iframe.css({"display": "none"});
            iframe.appendTo("body");
            iframe[0].contentWindow.location.href = url;

            success = true;
        } catch (ex) {
            success = false;
        }

        iframe.remove();

        callback(success);
    } else if (papaya.utilities.PlatformUtils.browser === "Chrome") {
        container.viewerHtml.css({"outline": 0});
        container.viewerHtml.attr("tabindex", "1");
        container.viewerHtml.focus();

        container.viewerHtml.blur(function () {
            success = true;
            callback(true);  // true
        });

        location.href = url;

        setTimeout(function () {
            container.viewerHtml.off('blur');
            container.viewerHtml.removeAttr("tabindex");

            if (!success) {
                callback(false);  // false
            }
        }, 2000);
    } else {
        cookie = papaya.utilities.UrlUtils.readCookie(papaya.viewer.Preferences.COOKIE_PREFIX + PAPAYA_MANGO_INSTALLED);

        if (cookie || papaya.mangoinstalled) {
            success = true;
        } else {
            if (confirm("This feature requires that " + (papaya.utilities.PlatformUtils.ios ? "iMango" : "Mango") + " is installed.  Continue?")) {
                papaya.utilities.UrlUtils.createCookie(papaya.viewer.Preferences.COOKIE_PREFIX + PAPAYA_MANGO_INSTALLED, true, papaya.viewer.Preferences.COOKIE_EXPIRY_DAYS);
                success = true;
            }
        }

        if (success) {
            location.href = url;
        }

        callback(success);
    }
};


papaya.utilities.PlatformUtils.getSupportedScrollEvent = function() {
    var support;
    if (papaya.utilities.PlatformUtils.browser === "Firefox") {
        support = "DOMMouseScroll";
    } else {
        // https://developer.mozilla.org/en-US/docs/Web/Events/wheel
        support = "onwheel" in document.createElement("div") ? "wheel" : // Modern browsers support "wheel"
            document.onmousewheel !== undefined ? "mousewheel" : // Webkit and IE support at least "mousewheel"
                "DOMMouseScroll"; // let's assume that remaining browsers are older Firefox
    }

    return support;
};



// Reasonable defaults
var PIXEL_STEP  = 10;
var LINE_HEIGHT = 40;
var PAGE_HEIGHT = 800;


/**
 * Copyright (c) 2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule normalizeWheel
 * @typechecks
 */
// https://github.com/facebook/fixed-data-table/blob/master/src/vendor_upstream/dom/normalizeWheel.js
// http://stackoverflow.com/questions/5527601/normalizing-mousewheel-speed-across-browsers
papaya.utilities.PlatformUtils.normalizeWheel = function(/*object*/ event) /*object*/ {
    var sX = 0, sY = 0,       // spinX, spinY
        pX = 0, pY = 0;       // pixelX, pixelY

    // Legacy
    if ('detail'      in event) { sY = event.detail; }
    if ('wheelDelta'  in event) { sY = -event.wheelDelta / 120; }
    if ('wheelDeltaY' in event) { sY = -event.wheelDeltaY / 120; }
    if ('wheelDeltaX' in event) { sX = -event.wheelDeltaX / 120; }

    // side scrolling on FF with DOMMouseScroll
    if ( 'axis' in event && event.axis === event.HORIZONTAL_AXIS ) {
        sX = sY;
        sY = 0;
    }

    pX = sX * PIXEL_STEP;
    pY = sY * PIXEL_STEP;

    if ('deltaY' in event) { pY = event.deltaY; }
    if ('deltaX' in event) { pX = event.deltaX; }

    if ((pX || pY) && event.deltaMode) {
        if (event.deltaMode == 1) {          // delta in LINE units
            pX *= LINE_HEIGHT;
            pY *= LINE_HEIGHT;
        } else {                             // delta in PAGE units
            pX *= PAGE_HEIGHT;
            pY *= PAGE_HEIGHT;
        }
    }

    // Fall-back if spin cannot be determined
    if (pX && !sX) { sX = (pX < 1) ? -1 : 1; }
    if (pY && !sY) { sY = (pY < 1) ? -1 : 1; }

    return { spinX  : sX,
        spinY  : sY,
        pixelX : pX,
        pixelY : pY };
};