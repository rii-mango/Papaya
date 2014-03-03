
/*jslint browser: true, node: true */
/*global $, BrowserDetect, File, ArrayBuffer, DataView, Int16Array, bowser, detectOs, papaya, confirm, alert,
 createCookie, readCookie, PAPAYA_MANGO_INSTALLED */

"use strict";

var BROWSER_MIN_FIREFOX = 7,  // slider controls only >=23
    BROWSER_MIN_CHROME = 7,
    BROWSER_MIN_SAFARI = 6,
    BROWSER_MIN_IE = 10,
    BROWSER_MIN_OPERA = 12;

var LAST_SCROLL_EVENT_TIMESTAMP = 0;

var PAPAYA_BROWSER = bowser;
detectOs();

// make sure console is present
var console = console || {};
console.log = console.log || function () {};
console.warn = console.warn || function () {};
console.error = console.error || function () {};
console.info = console.info || function () {};



function detectOs() {
    if (navigator.appVersion.indexOf("Win") !== -1) {
        PAPAYA_BROWSER.os = "Windows";
    } else if (navigator.appVersion.indexOf("Mac") !== -1) {
        PAPAYA_BROWSER.os = "MacOS";
    } else if ((navigator.appVersion.indexOf("X11") !== -1) || (navigator.appVersion.indexOf("Linux") !== -1)) {
        PAPAYA_BROWSER.os = "Linux";
    } else {
        PAPAYA_BROWSER.os = "Unknown";
    }
}




function checkForBrowserCompatibility() {
    if (PAPAYA_BROWSER.name === "Firefox") {
        if (PAPAYA_BROWSER.version < BROWSER_MIN_FIREFOX) {
            return ("Papaya requires Firefox version " + BROWSER_MIN_FIREFOX + " or higher.");
        }
    } else if (PAPAYA_BROWSER.name === "Chrome") {
        if (PAPAYA_BROWSER.version < BROWSER_MIN_CHROME) {
            return ("Papaya requires Chrome version " + BROWSER_MIN_CHROME + " or higher.");
        }
    } else if (PAPAYA_BROWSER.name === "Internet Explorer") {
        if (PAPAYA_BROWSER.version < BROWSER_MIN_IE) {
            return ("Papaya requires Internet Explorer version " + BROWSER_MIN_IE + " or higher.");
        }
    } else if (PAPAYA_BROWSER.name === "Safari") {
        if (PAPAYA_BROWSER.version < BROWSER_MIN_SAFARI) {
            return ("Papaya requires Safari version " + BROWSER_MIN_SAFARI + " or higher.");
        }
    } else if (PAPAYA_BROWSER.name === "Opera") {
        if (PAPAYA_BROWSER.version < BROWSER_MIN_OPERA) {
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


// adapted from: http://www.rajeshsegu.com/2012/09/browser-detect-custom-protocols/comment-page-1/
function launchCustomProtocol(container, url, callback) {
    var iframe, myWindow, cookie, success = false;

    if (PAPAYA_BROWSER.name === "Internet Explorer") {
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
    } else if (PAPAYA_BROWSER.name === "Firefox") {
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
    } else if (PAPAYA_BROWSER.name === "Chrome") {
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
        cookie = readCookie(papaya.viewer.Preferences.COOKIE_PREFIX + PAPAYA_MANGO_INSTALLED);

        if (cookie || papaya.mangoinstalled) {
            success = true;
        } else {
            if (confirm("This feature requires that " + (PAPAYA_BROWSER.ios ? "iMango" : "Mango") + " is installed.  Continue?")) {
                createCookie(papaya.viewer.Preferences.COOKIE_PREFIX + PAPAYA_MANGO_INSTALLED, true, papaya.viewer.Preferences.COOKIE_EXPIRY_DAYS);
                success = true;
            }
        }

        if (success) {
            location.href = url;
        }

        callback(success);
    }
}


window.addEventListener('message', function (msg) {
    if (msg.data === PAPAYA_MANGO_INSTALLED) {
        papaya.mangoinstalled = true;
    }
}, false);