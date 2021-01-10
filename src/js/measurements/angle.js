
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
    this.detectedPointRef = []; // detected point's information
    this.points = [];
    this.maxPointIndex = 0;
    this.pointRadius = 6;
    this.measurementType = papaya.viewer.ScreenMeasurements.MEASUREMENT_TYPE_ANGLE;
    this.pointsNeedUpdate = false;
    this.angle = null;
    this.isGrabbing = false;
    this.tempPoint = {};
    // console.log('ScreenMeasurements imported');
};
// functions

papaya.measurements.Angle.prototype.addPoint = function (imageCoord, slice) {
        // this.points.push([mouseX, mouseY]);
    // console.log(slice, this.slice);
    if (!this.viewer.reactViewerConnector.customParams.showAnnotation) return;
    if (this.pointsRef.length > 2) return;
    // console.log('adding Point', imageCoord);
    if (slice.sliceDirection !== this.slice.sliceDirection) return false;
    this.pointsRef.push({
        id: this.maxPointIndex,
        value: new papaya.core.Coordinate(imageCoord.x, imageCoord.y, imageCoord.z)
    });
    this.maxPointIndex += 1;
    this.pointsNeedUpdate = true;
    // console.log('point added', this.pointsRef, this.initialized);
}

papaya.measurements.Angle.prototype.draw = function (context, canvas) {
    if (!this.pointsRef.length) return;
    if (this.pointsNeedUpdate) {
        if (this.pointsRef.length === 3) this.updateAngle();
        this.pointsNeedUpdate = false;
    }
    for (var i = 0; i < this.pointsRef.length; ++i) {
        var screenPoint = papaya.utilities.ViewerUtils.convertImageToScreenCoordinate(this.slice, this.pointsRef[i].value);
        context.save();
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.strokeStyle = this.drawOptions.strokeStyle;
        context.fillStyle = this.drawOptions.fillStyle;
        context.lineWidth = this.drawOptions.lineWidth;

        if (i < this.pointsRef.length - 1) {
            var screenPointNext = papaya.utilities.ViewerUtils.convertImageToScreenCoordinate(this.slice, this.pointsRef[i+1].value);
            context.beginPath();
            context.moveTo(screenPoint[0], screenPoint[1]);
            context.lineTo(screenPointNext[0], screenPointNext[1]);
            context.stroke();
            context.closePath();
        }
    }

    if (this.tempPoint.value) {
        var screenPoint = papaya.utilities.ViewerUtils.convertImageToScreenCoordinate(this.slice, this.pointsRef[this.pointsRef.length - 1].value);
        var screenTemp = papaya.utilities.ViewerUtils.convertImageToScreenCoordinate(this.slice, this.tempPoint.value);
        context.beginPath();
        context.moveTo(screenPoint[0], screenPoint[1]);
        context.lineTo(screenTemp[0], screenTemp[1]);
        context.stroke();
        context.closePath();
    }

    if (this.pointsRef.length === 3) this.drawAngleBox(context, canvas, this.pointsRef[1]); // draw box at middle point

    if (this.detectedPointRef.length) {
        var detectedScreenPoint = papaya.utilities.ViewerUtils.convertImageToScreenCoordinate(this.slice, this.detectedPointRef[0].value);
        this.drawPoint(context, canvas, detectedScreenPoint[0], detectedScreenPoint[1], this.pointRadius);
    }
    context.restore();
}

papaya.measurements.Angle.prototype.drawPoint = function (context, canvas, posX, posY, radius) {
    // console.log(this.points);
    context.fillStyle = this.drawOptions.fillStyle;
    context.lineWidth = this.drawOptions.lineWidth;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.beginPath();
    context.arc(posX, posY, radius, 0, 2 * Math.PI);
    context.stroke();
    // context.fill();
};

papaya.measurements.Angle.prototype.drawAngleBox = function (context, canvas, boxOrigin) {
    var screenPoint = papaya.utilities.ViewerUtils.convertImageToScreenCoordinate(this.slice, boxOrigin.value);

    if (this.angle) {
        var text = papaya.utilities.MathUtils.roundToTwo((this.angle * 180 / Math.PI)) + String.fromCharCode(176); // degree symbol
        papaya.utilities.ViewerUtils.drawFloatingTextBox(context, canvas, this.slice, {
            text: text,
            originX: screenPoint[0],
            originY: screenPoint[1],
            displacement : 30
        });
    }
};

papaya.measurements.Angle.prototype.updateAngle = function () {
    var screenPoints = [];
    this.pointsRef.forEach(function (point) {
        screenPoints.push(papaya.utilities.ViewerUtils.convertImageToScreenCoordinate(this.slice, point.value));
    }, this);

    var v1 = [screenPoints[2][0] - screenPoints[1][0], screenPoints[2][1] - screenPoints[1][1]];
    var v2 = [screenPoints[0][0] - screenPoints[1][0], screenPoints[0][1] - screenPoints[1][1]];

    v1 = papaya.utilities.MathUtils.normalizeVector(v1);
    v2 = papaya.utilities.MathUtils.normalizeVector(v2);
    // this.angle = Math.atan2(v1[1], v1[0]) - Math.atan2(v2[1], v2[0]);

    this.angle = Math.acos(v1[0]*v2[0] + v1[1]*v2[1]);
    // console.log('angle', this.angle, v1, v2);
    // if (this.angle > Math.PI) this.angle -= Math.PI;
    // else if (this.angle < -Math.PI) this.angle += Math.PI;
    // if (this.angle < (-Math.PI)) this.angle += Math.PI;
    // if (this.angle > (Math.PI)) this.angle -= Math.PI * 2 - this.angle;
};

papaya.measurements.Angle.prototype.handleMouseMove = function (me, options) {
    var cursorPosition = options.cursorPosition;
    var handled = false;
    if (!options.isDragging) this.updatePointDetection(cursorPosition);
    if (this.pointsRef.length && this.pointsRef.length < 3) {
        this.tempPoint.value = cursorPosition;
    } else this.tempPoint.value = null;

    if (options.isDragging) {
        if (this.detectedPointRef.length) {
            this.isGrabbing = true;
            handled = true;
            var id = this.detectedPointRef[0].id;
            // var imageCoord = papaya.utilities.ViewerUtils.convertScreenToImageCoordinate(this.slice, cursorPosition, true);
            this.updatePointPosition(id, cursorPosition);
            this.pointsNeedUpdate = true;
            return handled;
        }
    }
    return handled;
};

papaya.measurements.Angle.prototype.handleMouseUp = function (me, options) {
    this.isGrabbing = false;
    if (this.pointsRef.length && this.pointsRef.length < 3) {
        var cursorPosition = options.cursorPosition;
        if (!papaya.utilities.ViewerUtils.checkEqualPoints(this.pointsRef[this.pointsRef.length - 1].value, cursorPosition)) this.addPoint(cursorPosition, this.slice);
    }
};

papaya.measurements.Angle.prototype.updatePointDetection = function (mouseImageCoord) {
    if (!this.slice) return null;
    var pad = 2 // relative size for each viewport
    var toleranceX = (this.pointRadius) / this.slice.screenTransform[0][0] + pad;
    var toleranceY = (this.pointRadius) / this.slice.screenTransform[1][1] + pad;
    // console.log('updatePointDetection', toleranceX, toleranceY);
    var mouseScreenCoord = papaya.utilities.ViewerUtils.convertImageToScreenCoordinate(this.slice, mouseImageCoord);
    this.detectedPointRef = this.pointsRef.filter(function (point) {
        // console.log(point.value[0], point.value[1]);
        var pointScreenCoord = papaya.utilities.ViewerUtils.convertImageToScreenCoordinate(this.slice, point.value);
        return ((pointScreenCoord[0] - toleranceX <= mouseScreenCoord[0] && mouseScreenCoord[0] <= pointScreenCoord[0] + toleranceX) &&
        (pointScreenCoord[1] - toleranceY <= mouseScreenCoord[1] && mouseScreenCoord[1] <= pointScreenCoord[1] + toleranceY))
    }, this);
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

papaya.measurements.Angle.prototype.updatePointPosition = function (pointID, imageCoord) {
    this.pointsNeedUpdate = true;
    this.pointsRef.forEach(function (item, index) {
        if (item.id === pointID) {
            switch (this.slice.sliceDirection) {
                case papaya.viewer.ScreenSlice.DIRECTION_AXIAL:
                    item.value.x = imageCoord.x;
                    item.value.y = imageCoord.y;
                    break;
                case papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL:
                    item.value.y = imageCoord.y;
                    item.value.z = imageCoord.z;
                    break;
                case papaya.viewer.ScreenSlice.DIRECTION_CORONAL:
                    item.value.x = imageCoord.x;
                    item.value.z = imageCoord.z;
                    break;
                default:
                    return; 
            }
            // item.value = new papaya.core.Coordinate(imageCoord.x, imageCoord.y, imageCoord.z);
        }
    }, this);
};

papaya.measurements.Angle.prototype.clearPoints = function (clearAll) {
    if (clearAll) {
        this.pointsRef = [];
        this.detectedPointRef = [];
        this.maxPointIndex = 0;
        this.slice = null;
        this.initialized = false;
    } else {
        this.pointsRef = [];
        this.detectedPointRef = [];
        this.maxPointIndex = 0;
    }
    this.angle = null;
    this.pointsNeedUpdate = true;
};
