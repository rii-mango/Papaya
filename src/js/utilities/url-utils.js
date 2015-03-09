
/*jslint browser: true, node: true */
/*global */

"use strict";

/*** Imports ***/
var papaya = papaya || {};
papaya.utilities = papaya.utilities || {};
papaya.utilities.UrlUtils = papaya.utilities.UrlUtils || {};


/*** Static Methods ***/

// http://www.quirksmode.org/js/cookies.html
papaya.utilities.UrlUtils.createCookie = function (name, value, days) {
    var date, expires;

    if (days) {
        date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toGMTString();
    } else {
        expires = "";
    }

    document.cookie = name + "=" + value + expires + "; path=/";
};



papaya.utilities.UrlUtils.readCookie = function (name) {
    var nameEQ, ca, i, c;

    nameEQ = name + "=";
    ca = document.cookie.split(';');

    for (i = 0; i < ca.length; i += 1) {
        c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1, c.length);
        }

        if (c.indexOf(nameEQ) === 0) {
            return c.substring(nameEQ.length, c.length);
        }
    }

    return null;
};



papaya.utilities.UrlUtils.eraseCookie = function (name) {
    papaya.utilities.UrlUtils.createCookie(name, "", -1);
};



// adapted from: http://stackoverflow.com/questions/979975/how-to-get-the-value-from-url-parameter
papaya.utilities.UrlUtils.getQueryParams = function (params) {
    /*jslint regexp: true */
    var tokens, qs, re = /[?&]?([^=]+)=([^&]*)/g;

    if (document.location.href.indexOf("?") !== -1) {
        qs = document.location.href.substring(document.location.href.indexOf("?") + 1);
        qs = qs.split("+").join(" ");

        tokens = re.exec(qs);
        while (tokens) {
            params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
            tokens = re.exec(qs);
        }
    }
};



papaya.utilities.UrlUtils.getAbsoluteUrl = function (protocol, relative) {
    var base, link, host, path;

    base = window.location.href;
    base = base.substring(0, base.lastIndexOf("/"));
    link = document.createElement("a");
    link.href = base + "/" +  relative;

    host = link.host;
    path = link.pathname;

    if (path.charAt(0) !== '/') {
        path = "/" + path;
    }


    return (protocol + "://" + host + path);
};
