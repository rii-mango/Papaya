
/*jslint browser: true, node: true */
/*global papayaRoundFast */

"use strict";

/*** Imports ***/
var papaya = papaya || {};
papaya.viewer = papaya.viewer || {};

/*** Constructor ***/
papaya.viewer.ScreenDrawing = papaya.viewer.ScreenDrawing || function () {
/*jslint sub: true */
    this.points = [];
    this.lineWidth = 4;
    this.lineColor = "rgba(0, 128, 0, 1)";
    this.pointRadius = 5;
    this.tension = 0.5;
    this.segmentResolutions = 30;
    this.isClosed = false;
    this.pointsRef = [];
    this.maxPointIndex = 0;
    this.pointsNeedUpdate = false;
    // console.log('ScreenDrawing imported');
};
// functions

papaya.viewer.ScreenDrawing.prototype.drawCurve = function (context, canvas) {
    if (this.pointsNeedUpdate) {
        this.buildPointsArray();
        this.pointsNeedUpdate = false;
    }
    // console.log(this.points);

    if (this.points.length > 1) {
        // context.clearRect(0, 0, canvas.width, canvas.height);
        context.strokeStyle = papaya.viewer.Viewer.CROSSHAIRS_COLOR;
        context.lineWidth = this.lineWidth;
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.beginPath();
        context.moveTo(this.points[0], this.points[1]);
        context.curve(this.points, this.tension, this.segmentResolutions, this.isClosed);
        context.stroke();
    }
};

papaya.viewer.ScreenDrawing.prototype.addPoint = function (mouseX, mouseY) {
    // accept input that is converted to canvas coordinates
    // this.points.push([mouseX, mouseY]);
    this.pointsRef.push({
        id: this.maxPointIndex,
        value: [mouseX, mouseY]
    });
    this.maxPointIndex += 1;
    this.pointsNeedUpdate = true;
    console.log('point added', this.pointsRef);
};

papaya.viewer.ScreenDrawing.prototype.getPoint = function (pointID) {
    // remove point from points array and update indexes
    return this.pointsRef.filter(function (point) {point.id === pointID});
};

papaya.viewer.ScreenDrawing.prototype.removePoint = function (pointID) {
    // remove a point by pointID from array
    this.pointsRef = this.pointsRef.filter(function (point) {point.id !== pointID});
};

papaya.viewer.ScreenDrawing.prototype.buildPointsArray = function () {
    // build array of points for drawing
    var pointsArray = [];
    this.clearPoints(false);
    this.pointsRef.forEach(function (item, index) {
        pointsArray = pointsArray.concat(item.value);
        // console.log(pointsArray);
    });
    this.points = pointsArray;
};

papaya.viewer.ScreenDrawing.prototype.clearPoints = function (clearAll) {
    if (clearAll) this.pointsRef = [];
    this.points = [];
    // this.pointsNeedUpdate = true;
};
