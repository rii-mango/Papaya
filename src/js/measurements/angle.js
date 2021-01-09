
/*jslint browser: true, node: true */
/*global papayaRoundFast */

"use strict";

/*** Imports ***/
var papaya = papaya || {};
papaya.measurements = papaya.measurements || {};

/*** Constructor ***/
papaya.measurements.Angle = papaya.measurements.Angle || function (viewer, slice, drawOptions) {
/*jslint sub: true */
    this.viewer = viewer;
    this.slice = slice;
    this.drawOptions = drawOptions;
    this.pointsRef = [];
    this.points = [];
    this.maxPointIndex = 0;

    // console.log('ScreenMeasurements imported');
};
// functions

papaya.measurements.Angle.prototype.addPoint = function (imageCoord, slice) {
        // this.points.push([mouseX, mouseY]);
    // console.log(slice, this.slice);
    if (!this.viewer.reactViewerConnector.customParams.showAnnotation) return;
    console.log('adding Point', imageCoord);
    if (slice.sliceDirection !== this.slice.sliceDirection) return false;
    this.pointsRef.push({
        id: this.maxPointIndex,
        value: new papaya.core.Coordinate(imageCoord.x, imageCoord.y, imageCoord.z)
    });
    this.maxPointIndex += 1;
    this.pointsNeedUpdate = true;
    if (this.pointsRef.length > 2) this.initialized = true;
    // console.log('point added', this.pointsRef, this.initialized);
}

papaya.measurements.Angle.prototype.drawPoint = function (context, canvas, posX, posY, radius) {
    // console.log(this.points);
    context.fillStyle = this.fillStyle;
    context.lineWidth = this.lineWidth;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.beginPath();
    context.arc(posX, posY, radius, 0, 2 * Math.PI);
    context.fill();
};

