
/*jslint browser: true, node: true */
/*global isStringBlank */

"use strict";

var papaya = papaya || {};
papaya.volume = papaya.volume || {};



papaya.volume.ImageDescription = papaya.volume.ImageDescription || function (notes) {
    this.notes = "(none)";

    if (!isStringBlank(notes)) {
        this.notes = notes;
    }
};
