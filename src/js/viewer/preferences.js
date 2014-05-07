
/*jslint browser: true, node: true */
/*global createCookie, readCookie */

"use strict";

var papaya = papaya || {};
papaya.volume = papaya.volume || {};



papaya.viewer.Preferences = papaya.viewer.Preferences || function () {
    this.viewer = null;
    this.showCrosshairs = papaya.viewer.Preferences.DEFAULT_SHOW_CROSSHAIRS;
    this.atlasLocks = papaya.viewer.Preferences.DEFAULT_ATLAS_LOCKS;
    this.showOrientation = papaya.viewer.Preferences.DEFAULT_SHOW_ORIENTATION;
    this.scrollBehavior = papaya.viewer.Preferences.DEFAULT_SCROLL;
    this.smoothDisplay = papaya.viewer.Preferences.DEFAULT_SMOOTH_DISPLAY;

    this.readPreferences();
};



papaya.viewer.Preferences.COOKIE_PREFIX = "papaya-";
papaya.viewer.Preferences.COOKIE_EXPIRY_DAYS = 365;
papaya.viewer.Preferences.DEFAULT_SHOW_CROSSHAIRS = "All";
papaya.viewer.Preferences.DEFAULT_ATLAS_LOCKS = "Mouse";
papaya.viewer.Preferences.DEFAULT_SHOW_ORIENTATION = "Yes";
papaya.viewer.Preferences.DEFAULT_SCROLL = "Increment Slice";
papaya.viewer.Preferences.DEFAULT_SMOOTH_DISPLAY = "Yes";



papaya.viewer.Preferences.prototype.updatePreference = function (field, value) {
    this[field] = value;
    this.viewer.drawViewer(true);

    createCookie(papaya.viewer.Preferences.COOKIE_PREFIX + field, value, papaya.viewer.Preferences.COOKIE_EXPIRY_DAYS);
};



papaya.viewer.Preferences.prototype.readPreferences = function () {
    var ctr, value;

    for (ctr = 0; ctr < papaya.ui.Toolbar.PREFERENCES_DATA.items.length; ctr += 1) {
        value = readCookie(papaya.viewer.Preferences.COOKIE_PREFIX + papaya.ui.Toolbar.PREFERENCES_DATA.items[ctr].field);

        if (value) {
            this[papaya.ui.Toolbar.PREFERENCES_DATA.items[ctr].field] = value;
        }
    }
};



