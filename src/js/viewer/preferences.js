
/*jslint browser: true, node: true */
/*global */

"use strict";

/*** Imports ***/
var papaya = papaya || {};
papaya.volume = papaya.volume || {};


/*** Constructor ***/
papaya.viewer.Preferences = papaya.viewer.Preferences || function () {
    this.viewer = null;
    this.showCrosshairs = papaya.viewer.Preferences.DEFAULT_SHOW_CROSSHAIRS;
    this.atlasLocks = papaya.viewer.Preferences.DEFAULT_ATLAS_LOCKS;
    this.showOrientation = papaya.viewer.Preferences.DEFAULT_SHOW_ORIENTATION;
    this.scrollBehavior = papaya.viewer.Preferences.DEFAULT_SCROLL;
    this.smoothDisplay = papaya.viewer.Preferences.DEFAULT_SMOOTH_DISPLAY;
    this.radiological = papaya.viewer.Preferences.DEFAULT_RADIOLOGICAL;
    this.showRuler = papaya.viewer.Preferences.DEFAULT_SHOW_RULER;
    this.surfaceBackgroundColor = papaya.viewer.Preferences.DEFAULT_SURFACE_BACKGROUND_COLOR;
    this.showSurfacePlanes = papaya.viewer.Preferences.DEFAULT_SHOW_SURFACE_PLANES;
    this.showSurfaceCrosshairs = papaya.viewer.Preferences.DEFAULT_SHOW_SURFACE_CROSSHAIRS;
};


/*** Static Pseudo-constants ***/

papaya.viewer.Preferences.ALL_PREFS = ["showCrosshairs", "atlasLocks", "showOrientation", "scrollBehavior",
    "smoothDisplay", "radiological", "showRuler", "surfaceBackgroundColor", "showSurfacePlanes"];
papaya.viewer.Preferences.COOKIE_PREFIX = "papaya-";
papaya.viewer.Preferences.COOKIE_EXPIRY_DAYS = 365;
papaya.viewer.Preferences.DEFAULT_SHOW_CROSSHAIRS = "Yes";
papaya.viewer.Preferences.DEFAULT_ATLAS_LOCKS = "Mouse";
papaya.viewer.Preferences.DEFAULT_SHOW_ORIENTATION = "No";
papaya.viewer.Preferences.DEFAULT_SCROLL = "Increment Slice";
papaya.viewer.Preferences.DEFAULT_SMOOTH_DISPLAY = "Yes";
papaya.viewer.Preferences.DEFAULT_RADIOLOGICAL = "No";
papaya.viewer.Preferences.DEFAULT_SHOW_RULER = "No";
papaya.viewer.Preferences.DEFAULT_SURFACE_BACKGROUND_COLOR = "Gray";
papaya.viewer.Preferences.DEFAULT_SHOW_SURFACE_PLANES = "Yes";


/*** Prototype Methods ***/

papaya.viewer.Preferences.prototype.updatePreference = function (field, value) {
    this[field] = value;
    this.viewer.drawViewer(true);
    papaya.utilities.UrlUtils.createCookie(papaya.viewer.Preferences.COOKIE_PREFIX + field, value, papaya.viewer.Preferences.COOKIE_EXPIRY_DAYS);
};



papaya.viewer.Preferences.prototype.readPreferences = function () {
    var ctr, value;

    for (ctr = 0; ctr < papaya.viewer.Preferences.ALL_PREFS.length; ctr += 1) {
        value = papaya.utilities.UrlUtils.readCookie(papaya.viewer.Preferences.COOKIE_PREFIX +
        papaya.viewer.Preferences.ALL_PREFS[ctr]);

        if (value) {
            this[papaya.viewer.Preferences.ALL_PREFS[ctr]] = value;
        }
    }
};
