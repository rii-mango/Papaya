
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
    this.pointsNeedUpdate = true;
    // console.log('ScreenDrawing imported');
}
// functions

papaya.viewer.ScreenDrawing.prototype.drawCurve = function (context, canvas) {
    if (this.points[0] && this.points[1]) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.moveTo(this.points[0], this.points[1]);
        context.curve(points, this.tension, this.segmentResolutions, this.isClosed);
        context.stroke();
    }
}

papaya.viewer.ScreenDrawing.prototype.addPoint = function (mouseX, mouseY) {
    // accept input that is converted to canvas coordinates
    // this.points.push([mouseX, mouseY]);
    this.pointsRef.push({
        id: this.maxPointIndex,
        value: [mouseX, mouseY]
    });
    this.maxPointIndex += 1;
}

papaya.viewer.ScreenDrawing.prototype.getPoint = function (pointID) {
    // remove point from points array and update indexes

}

papaya.viewer.ScreenDrawing.prototype.removePoint = function (pointID) {
    // remove last 2 elements from array

}

papaya.viewer.ScreenDrawing.prototype.buildPointsArray = function (pointID) {
    // build array of points for drawing
    this.clearPoints();
    this.pointsRef.forEach((item, index) => {
        this.points.push(item.value);
    });
}

papaya.viewer.ScreenDrawing.prototype.clearPoints = function () {
    this.points = [];
}
