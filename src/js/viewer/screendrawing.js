
/*jslint browser: true, node: true */
/*global papayaRoundFast */

"use strict";

/*** Imports ***/
var papaya = papaya || {};
papaya.viewer = papaya.viewer || {};

/*** Constructor ***/
papaya.viewer.ScreenCurve = papaya.viewer.ScreenCurve || function (viewer, pointsRef) {
/*jslint sub: true */
    this.viewer = viewer;
    this.points = [];
    this.detectedPoint = [];
    this.lineWidth = 3;
    this.lineColor = "red";
    this.fillStyle = "red"
    this.pointRadius = 5;
    this.tension = 0.5;
    this.segmentResolutions = 30;
    this.isClosed = false;
    (pointsRef) ? this.pointsRef = pointsRef : this.pointsRef = [];
    this.detectedPointRef = [];
    this.maxPointIndex = 0;
    this.pointsNeedUpdate = false;
    this.finalTransform = [];
    // console.log('ScreenCurve imported');
};
// functions

papaya.viewer.ScreenCurve.prototype.drawCurve = function (context, canvas, finalTransform) {
    if (this.pointsNeedUpdate) {
        this.buildPointsArray(finalTransform);
        this.pointsNeedUpdate = false;
        context.clearRect(0, 0, canvas.width, canvas.height);
    }
    // console.log(this.points);

    if (this.points.length > 1) {
        // draw curve
        context.strokeStyle = this.lineColor;
        context.lineWidth = this.lineWidth;
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.beginPath();
        context.moveTo(this.points[0], this.points[1]);
        context.curve(this.points, this.tension, this.segmentResolutions, this.isClosed);
        context.stroke();

        //draw points
        for (var i = 0; i < this.points.length; i += 2) {
            this.drawPoint(context, canvas, this.points[i], this.points[i+1], this.pointRadius);
        }
    }
    if (this.detectedPoint.length > 1) {
        this.drawPoint(context, canvas, this.detectedPoint[0], this.detectedPoint[1], this.pointRadius*2);
    }
};

papaya.viewer.ScreenCurve.prototype.drawPoint = function (context, canvas, posX, posY, radius) {
    // console.log(this.points);

        // context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = this.fillStyle;
    context.lineWidth = this.lineWidth;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.beginPath();
    context.arc(posX, posY, radius, 0, 2 * Math.PI);
    context.fill();
};

papaya.viewer.ScreenCurve.prototype.addPoint = function (mouseX, mouseY) {
    // accept input that is converted to canvas coordinates
    // this.points.push([mouseX, mouseY]);
    this.pointsRef.push({
        id: this.maxPointIndex,
        value: [mouseX, mouseY]
    });
    this.maxPointIndex += 1;
    this.pointsNeedUpdate = true;
    // console.log('point added', this.pointsRef);
};

papaya.viewer.ScreenCurve.prototype.getPoint = function (pointID) {
    return this.pointsRef.filter(function (point) {return point.id === pointID});
};

papaya.viewer.ScreenCurve.prototype.removePoint = function (pointID) {
    // remove a point by pointID from array
    this.pointsRef = this.pointsRef.filter(function (point) {return point.id !== pointID});
    this.detectedPointRef = [];
    this.pointsNeedUpdate = true;
};

papaya.viewer.ScreenCurve.prototype.updatePointDetection = function (mouseX, mouseY) {
    var tolerance = this.pointRadius;
    this.detectedPointRef = this.pointsRef.filter(function (point) {
        // console.log((point.value[0] - tolerance, mouseX, point.value[1] - tolerance <= mouseY <= point.value[1] + tolerance));
        return ((point.value[0] - tolerance <= mouseX && mouseX <= point.value[0] + tolerance) &&
        (point.value[1] - tolerance <= mouseY && mouseY <= point.value[1] + tolerance))
    });
    // console.log(this.pointsRef, [mouseX, mouseY]);
    if (this.detectedPointRef.length > 0) {
        // console.log(detected);
        this.pointsNeedUpdate = true;
        return this.detectedPointRef;
    }
    else {
        this.detectedPoint = [];
        this.detectedPointRef = [];
        return null;
    }
};

papaya.viewer.ScreenCurve.prototype.updatePointPosition = function (pointID, mouseX, mouseY) {
    this.pointsNeedUpdate = true;
    this.pointsRef.forEach(function (item, index) {
        if (item.id === pointID) {
            item.value[0] = mouseX;
            item.value[1] = mouseY;
        }
    })
};

papaya.viewer.ScreenCurve.prototype.buildPointsArray = function (finalTransform) {
    // build array of points for drawing
    var pointsArray = [];
    var detectedPoint = [];
    this.clearPoints(false);
    this.pointsRef.forEach(function (item, index) {
        var screenX = finalTransform[0][2] + (item.value[0] + 0.5) * finalTransform[0][0];
        var screenY = finalTransform[1][2] + (item.value[1] + 0.5) * finalTransform[1][1];
        // pointsArray = pointsArray.concat(item.value);
        pointsArray = pointsArray.concat([screenX, screenY]);
        // console.log(pointsArray);
    });
    this.detectedPointRef.forEach(function (item, index) {
        var screenX = finalTransform[0][2] + (item.value[0] + 0.5) * finalTransform[0][0];
        var screenY = finalTransform[1][2] + (item.value[1] + 0.5) * finalTransform[1][1];
        // detectedPoint.push(item.value[0], item.value[1]);
        detectedPoint.push(screenX, screenY);
    });
    this.points = pointsArray;
    this.detectedPoint = detectedPoint;
    // console.log('detectedPoint', this.detectedPoint);
};

papaya.viewer.ScreenCurve.prototype.clearPoints = function (clearAll) {
    if (clearAll) {
        this.pointsRef = [];
        this.detectedPointRef = [];
        this.maxPointIndex = 0;
        this.points = [];
        this.detectedPoint = [];
    } else {
        this.points = [];
    }
    // this.pointsNeedUpdate = true;
};

papaya.viewer.ScreenCurve.prototype.updateFinalTransform = function (slice) {
    this.finalTransform = slice.finalTransform
    // this.pointsNeedUpdate = true;
};