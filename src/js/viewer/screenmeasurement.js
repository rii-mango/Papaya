
/*jslint browser: true, node: true */
/*global papayaRoundFast */
// Author: Triet Cao

"use strict";

/*** Imports ***/
var papaya = papaya || {};
papaya.viewer = papaya.viewer || {};


/*** Constructor ***/
papaya.viewer.ScreenMeasurements = papaya.viewer.ScreenMeasurements || function (viewer, slice) {
/*jslint sub: true */
    this.viewer = viewer;
    this.slice = slice;
    this.drawOptions = {
        lineWidth: 2.0,
        lineColor: "green",
        lineColorAlternate: "red",
        fillStyle: "green",
        fillStyleAlternate: "red",
        strokeStyle: "green",
        strokeStyleAlternate: "red"
    };
    this.measurementsList = [];
    // console.log('ScreenMeasurements imported');
};

papaya.viewer.ScreenMeasurements.MEASUREMENT_TYPE_ANGLE = 'Angle';

// functions

papaya.viewer.ScreenMeasurements.prototype.addMeasurement = function (measurementType) {

    switch (measurementType) {
        case papaya.viewer.ScreenMeasurements.MEASUREMENT_TYPE_ANGLE:
            this.measurementsList.push(new papaya.measurements.Angle(this.viewer, this.slice, this.drawOptions));
            break;
        default:
            throw new Error('Error in adding measurement: No measurement type supplied.');
    }
};

papaya.viewer.ScreenMeasurements.prototype.drawMeasurementsOnSlice = function (context, canvas) {
    if (!this.viewer.reactViewerConnector.customParams.showAnnotation) return;
    this.measurementsList.map(function (measurement) {
        measurement.draw(context, canvas);
    });
};

papaya.viewer.ScreenMeasurements.prototype.checkTypeExists = function (type) {
    var res = false;
    this.measurementsList.forEach(function (measurement) {
        if (measurement.measurementType === type) res = true;
    });
    return res;
};

papaya.viewer.ScreenMeasurements.prototype.getIndexOfMeasurement = function (type) {
    var res = -1;
    this.measurementsList.forEach(function (measurement, index) {
        if (measurement.measurementType === type) res = index;
    });
    return res;
};

papaya.viewer.ScreenMeasurements.prototype.clear = function () {
    for (var i = 0; i < this.measurementsList.length; ++i) {
        // this.measurementsList[i] = {};
        delete this.measurementsList[i];
    }
    this.measurementsList = [];
};

papaya.viewer.ScreenMeasurements.prototype.handleMouseMove = function (me, options) {
    var handled = false;
    for (var i = 0; i < this.measurementsList.length; ++i) {
        handled = this.measurementsList[i].handleMouseMove(me, options);
        if (handled) break;
    };
    // console.log('screen measurements handled', handled);
    return handled;
};

papaya.viewer.ScreenMeasurements.prototype.handleMouseUp = function (me, options) {
    var handled = false;
    for (var i = 0; i < this.measurementsList.length; ++i) {
        handled = this.measurementsList[i].handleMouseUp(me, options);
        if (handled) break;
    };
    return handled;
};
