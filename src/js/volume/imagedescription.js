
/*jslint browser: true, node: true */
/*global */

"use strict";

/*** Imports ***/
var papaya = papaya || {};
papaya.volume = papaya.volume || {};


/*** Constructor ***/
papaya.volume.ImageDescription = papaya.volume.ImageDescription || function (notes) {
    this.notes = "(none)";

    if (!papaya.utilities.StringUtils.isStringBlank(notes)) {
        this.notes = notes;
    }
};
