
/*jslint browser: true, node: true */
/*global papayaRoundFast */
// Author: Triet Cao

"use strict";

/*** Imports ***/
var papaya = papaya || {};
papaya.viewer = papaya.viewer || {};

papaya.viewer.ScreenMeasurements.MEASUREMENT_TYPE_ANGLE = 'angle';

/*** Constructor ***/
papaya.viewer.ScreenMeasurements = papaya.viewer.ScreenMeasurements || function (viewer, slice, context, canvas) {
/*jslint sub: true */
    this.viewer = viewer;
    this.slice = slice;
    this.context = context;
    this.canvas = canvas;
    this.drawOptions = {
        lineWidth = 2.0,
        lineColor = "green",
        lineColorAlternate = "red",
        fillStyle = "green",
        fillStyleAlternate = "red"
    }
    this.measurementsList = [];
    // console.log('ScreenMeasurements imported');
};
// functions

papaya.viewer.ScreenMeasurements.prototype.addMeasurement = function (measurementType) {
    switch (measurementType) {
        case papaya.viewer.ScreenMeasurements.MEASUREMENT_TYPE_ANGLE:
            this.measurementsList.push(new papaya.measurements.Angle(viewer, slice, this.drawOptions));
            break;
        default:
            throw new Error('Error in adding measurement: No measurement type supplied.');
    }
};

papaya.viewer.ScreenMeasurements.prototype.drawMeasurementsOnSlice = function () {
    this.measurementsList.map(function (measurement) {
        measurement.draw(slice, this.canvas, this.context)
    });
}
