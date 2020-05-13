
/*jslint browser: true, node: true */
/*global papayaRoundFast */

"use strict";

/*** Imports ***/
var papaya = papaya || {};
papaya.viewer = papaya.viewer || {};

/*** Constructor ***/
papaya.viewer.ScreenCurve = papaya.viewer.ScreenCurve || function (viewer, slice, pointsRef) {
/*jslint sub: true */
    this.viewer = viewer;
    this.slice = slice;
    this.points = []; // curve's CONTROL points, [x0, y0, x1, y1, x2, y2...], values in SCREEN COORDINATE, use this to draw
    this.otherViewsPoints = []; // 2-D array containing static control points in other views, each array element will have this structure [x0, y0, x1, y1, x2, y2...]
    this.detectedPoint = []; // current point mouse over  [x0, y0], values in SCREEN COORDINATE, use this to draw
    this.lineWidth = 3;
    this.lineColor = "red";
    this.lineColorAlternate = "green"
    this.fillStyle = "red"
    this.fillStyleAlternate = "green"
    this.pointRadius = 5;
    this.tension = 0.5;
    // this.segmentResolutions = Math.floor(724*Math.sqrt(2));
    this.segmentResolutions = 20; // number of segments between 2 control points
    this.curveSegments = null; // curve's points (including segments), [x0, y0, x1, y1, x2, y2...], values in SCREEN COORDINATE, output of Curve.js
    this.papayaCoordCurveSegments = {}; // curve's points, [p0, p1, p2...] where p is papaya.core.Coordinate object
    this.isClosed = false;
    (pointsRef) ? this.pointsRef = pointsRef : this.pointsRef = []; // control point's information, including ID and SCREEN COORDINATE
    this.detectedPointRef = []; // detected point's information, including ID and SCREEN COORDINATE
    this.maxPointIndex = 0;
    this.pointsNeedUpdate = false;
    this.finalTransform = slice ? slice.finalTransform.clone() : [];
    this.initialized = false;
    // console.log('ScreenCurve imported');
};
// functions

papaya.viewer.ScreenCurve.prototype.drawCurve = function (context, canvas, finalTransform) {
    if (this.pointsNeedUpdate) {
        this.buildPointsArray();
        this.pointsNeedUpdate = false;
        context.clearRect(0, 0, canvas.width, canvas.height);
    }
    // console.log(this.points);
    // draw main slice's points
    if (this.points.length > 1) {
        // draw curve
        context.strokeStyle = this.lineColor;
        context.lineWidth = this.lineWidth;
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.beginPath();
        context.moveTo(this.points[0], this.points[1]);
        this.curveSegments = context.curve(this.points, this.tension, this.segmentResolutions, this.isClosed);
        context.stroke();
        //draw points
        for (var i = 0; i < this.points.length; i += 2) {
            this.drawPoint(context, canvas, this.points[i], this.points[i+1], this.pointRadius);
        }
    }

    // draw other slice's points
    if (this.otherViewsPoints.length > 1) {
        // draw curve
        this.otherViewsPoints.forEach(function (points) {
            context.strokeStyle = this.lineColorAlternate;
            context.lineWidth = this.lineWidth;
            context.setTransform(1, 0, 0, 1, 0, 0);
            context.beginPath();
            context.moveTo(points[0], points[1]);
            context.curve(points, 0, this.segmentResolutions, this.isClosed);
            context.stroke();
            //draw points
            for (var i = 0; i < this.points.length; i += 2) {
                this.drawPoint(context, canvas, points[i], points[i+1], this.pointRadius);
            }
        }, this);
    }

    if (this.detectedPoint.length > 1) {
        this.drawPoint(context, canvas, this.detectedPoint[0], this.detectedPoint[1], this.pointRadius*2); //draw bigger detected point
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

papaya.viewer.ScreenCurve.prototype.addPoint = function (imageX, imageY, imageZ, slice) {
    // accept input that is converted to canvas coordinates
    // this.points.push([mouseX, mouseY]);
    // console.log(slice, this.slice);
    if (slice.sliceDirection !== this.slice.sliceDirection) return false;
    this.pointsRef.push({
        id: this.maxPointIndex,
        value: [imageX, imageY, imageZ]
    });
    this.maxPointIndex += 1;
    this.pointsNeedUpdate = true;
    if (this.pointsRef.length > 2) this.initialized = true;
    // console.log('point added', this.pointsRef, this.initialized);
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
    if (!this.slice) return null;
    var percent = 100 // relative size for each viewport
    var toleranceX = this.pointRadius / this.slice.screenTransform[0][0];
    var toleranceY = this.pointRadius / this.slice.screenTransform[1][1];
    // console.log('updatePointDetection', toleranceX, toleranceY);
    this.detectedPointRef = this.pointsRef.filter(function (point) {
        // console.log(point.value[0], point.value[1]);
        return ((point.value[0] - toleranceX <= mouseX && mouseX <= point.value[0] + toleranceX) &&
        (point.value[1] - toleranceY <= mouseY && mouseY <= point.value[1] + toleranceY))
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

papaya.viewer.ScreenCurve.prototype.buildPointsArray = function () {
    // build array of points for drawing, convert papaya coordinate to screen coordinates
    // console.log('buildPointsArray', this.slice);
    var otherViews = this.getOtherViews(this.slice, this.viewer.screenLayout);
    console.log(otherViews);
    // console.log(this.pointsRef);
    var pointsArray = [];
    var detectedPoint = [];
    this.clearPoints(false);

    this.pointsRef.forEach(function (item, index) {
        pointsArray = pointsArray.concat(this.imageCoordToScreenCoord(item.value[0], item.value[1], this.slice.finalTransform));
    }, this);
    this.detectedPointRef.forEach(function (item, index) {
        var point = this.imageCoordToScreenCoord(item.value[0], item.value[1], this.slice.finalTransform);
        detectedPoint.push(point[0], point[1]);
    }, this);
    otherViews.forEach(function (view) {
        var array = [];
        var x;
        var y;
        switch (this.slice.sliceDirection) {
            case papaya.viewer.ScreenSlice.DIRECTION_AXIAL:
                if (view.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
                    x = 1;
                    y = 2;
                }
                if (view.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
                    x = 0;
                    y = 2;
                }
                break;
            case papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL:
                if (view.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
                    x = 2;
                    y = 0;
                }
                if (view.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
                    x = 2;
                    y = 1;
                }
                break;
            case papaya.viewer.ScreenSlice.DIRECTION_CORONAL:
                if (view.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
                    x = 0;
                    y = 2;
                }
                if (view.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
                    x = 2;
                    y = 1;
                }
        }
        console.log('xy selection', x, y)
        var count = 1;
        this.pointsRef.forEach(function (point) {
            if (count !== 0) console.log(--count, point);
            array = array.concat(this.imageCoordToScreenCoord(point.value[x], point.value[y], view.finalTransform));
        }, this);
        this.otherViewsPoints.push(array);
    }, this);
    this.points = pointsArray;
    this.detectedPoint = detectedPoint;
    // console.log(this.otherViewsPoints);
    this.pointsNeedUpdate = false;
    // console.log('detectedPoint', this.detectedPoint);
};

papaya.viewer.ScreenCurve.prototype.imageCoordToScreenCoord = function (imageX, imageY, finalTransform) {
    var screenX;
    var screenY;
    screenX = finalTransform[0][2] + (imageX + 0.5) * finalTransform[0][0];
    screenY = finalTransform[1][2] + (imageY + 0.5) * finalTransform[1][1];
    return [screenX, screenY];
}

papaya.viewer.ScreenCurve.prototype.buildPapayaCurveSegments = function () {
    // console.log('buildPapayaCurveSegments');
    var point, papayaCoord;
    var roundResult = true;
    var min = [Infinity, Infinity, Infinity];
    var max = [-1, -1, -1]; // use this to calculate pixel size
    this.papayaCoordCurveSegments.delta = {
        x: 0,
        y: 0,
        z: 0
    };
    this.papayaCoordCurveSegments.points = [];
    for (var i = 0; i < this.curveSegments.length; i += 2) {
        point = [this.curveSegments[i], this.curveSegments[i+1]];
        papayaCoord = this.convertScreenToImageCoordinate(this.slice.sliceDirection, point, roundResult);
        if (papayaCoord.x < min[0]) min[0] = papayaCoord.x;
        if (papayaCoord.y < min[1]) min[1] = papayaCoord.y;
        if (papayaCoord.z < min[2]) min[2] = papayaCoord.z;
        if (papayaCoord.x > max[0]) max[0] = papayaCoord.x;
        if (papayaCoord.y > max[1]) max[1] = papayaCoord.y;
        if (papayaCoord.z > max[2]) max[2] = papayaCoord.z;
        // map 1-1 to image coordinate
        if (i > 2 && roundResult) {
            var prevCoord = this.papayaCoordCurveSegments.points[this.papayaCoordCurveSegments.points.length - 1];
            if (papayaCoord.x !== prevCoord.x || papayaCoord.y !== prevCoord.y || papayaCoord.z !== prevCoord.z) this.papayaCoordCurveSegments.points.push(papayaCoord);
        }             
        else this.papayaCoordCurveSegments.points.push(papayaCoord);
    }
    this.papayaCoordCurveSegments.delta.x = max[0] - min[0];
    this.papayaCoordCurveSegments.delta.y = max[1] - min[1];
    this.papayaCoordCurveSegments.delta.z = max[2] - min[2];
    // pad points between segments
    this.papayaCoordCurveSegments.points = this.padCoordinate(this.papayaCoordCurveSegments.points);
    // console.log(this.papayaCoordCurveSegments);
};

papaya.viewer.ScreenCurve.prototype.clearPoints = function (clearAll) {
    if (clearAll) {
        this.pointsRef = [];
        this.detectedPointRef = [];
        this.maxPointIndex = 0;
        this.points = [];
        this.otherViewsPoints = [];
        this.detectedPoint = [];
        this.slice = null;
        this.initialized = false;
    } else {
        this.points = [];
        this.otherViewsPoints = [];
    }
    this.pointsNeedUpdate = true;
};

papaya.viewer.ScreenCurve.prototype.updateFinalTransform = function (slice) {
    this.finalTransform = slice.finalTransform
    // this.pointsNeedUpdate = true;
};

papaya.viewer.ScreenCurve.prototype.updateCurrentSlice = function (slice) {
    this.slice = slice;
    this.finalTransform = slice.finalTransform
    // this.pointsNeedUpdate = true;
};

papaya.viewer.ScreenCurve.prototype.hasPoint = function () {
    return (this.pointsRef.length > 0 ? true : false)
};

papaya.viewer.ScreenCurve.prototype.convertScreenToImageCoordinate = function (sliceDirection, screenCoord, roundResult) {
    // screenCoord: array of 2 elements
    // screenCoord[0]: x, screenCoord[1]: y
    var xImage, yImage;
    switch (sliceDirection) {
        case papaya.viewer.ScreenSlice.DIRECTION_AXIAL:
            xImage = (screenCoord[0] - this.finalTransform[0][2]) / this.slice.finalTransform[0][0];
            yImage = (screenCoord[1] - this.finalTransform[1][2]) / this.slice.finalTransform[1][1];
            zImage = this.viewer.axialSlice.currentSlice;
            break;
        case papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL:
            yImage = (screenCoord[0] - this.finalTransform[0][2]) / this.slice.finalTransform[0][0];
            zImage = (screenCoord[1] - this.finalTransform[1][2]) / this.slice.finalTransform[1][1];
            xImage = this.viewer.sagittalSlice.currentSlice;
            break;
        case papaya.viewer.ScreenSlice.DIRECTION_CORONAL:
            xImage = (screenCoord[0] - this.finalTransform[0][2]) / this.slice.finalTransform[0][0];
            zImage = (screenCoord[1] - this.finalTransform[1][2]) / this.slice.finalTransform[1][1];
            yImage = this.viewer.coronalSlice.currentSlice;
            break;
    }
    if (roundResult) return new papaya.core.Coordinate(Math.round(xImage), Math.round(yImage), Math.round(zImage));
    else return new papaya.core.Coordinate(xImage, yImage, zImage);
}

papaya.viewer.ScreenCurve.prototype.padCoordinate = function (segments) {
    // fill coordinates between 2 distance point
    // we need to create a continuos line of coordinates between each point
    // using Bresenham line drawing algorithm, the resulting line will always be 1 pixel thick
    var MIN_DISTANCE = 5; // minimum segment distance
    var result = [];
    var pad = function (x0, y0, z0, x1, y1, z1) {
        // Bresenham line 3D
        result.push(new papaya.core.Coordinate(x0, y0, z0));
        var dx = Math.abs(x1 - x0);
        var dy = Math.abs(y1 - y0);
        var dz = Math.abs(z1 - z0);
        var sx = x1 > x0 ? 1 : -1;
        var sy = y1 > y0 ? 1 : -1;
        var sz = z1 > z0 ? 1 : -1;
        var e1;
        var e2;
        // Driving axis is X-axis
        if (dx >= dy && dx >= dz) {
          e1 = 2 * dy - dx;
          e2 = 2 * dz - dx;
          while (x0 !== x1) {
            x0 += sx;
            if (e1 >= 0) {
              y0 += sy;
              e1 -= 2 * dx;
            }
            if (e2 >= 0) {
              z0 += sz;
              e2 -= 2 * dx;
            }
            e1 += 2 * dy;
            e2 += 2 * dz;
            result.push(new papaya.core.Coordinate(x0, y0, z0));
          }
        }
          // Driving axis is Y-axis
        else if (dy >= dx && dy >= dz) {
          e1 = 2 * dx - dy;
          e2 = 2 * dz - dy;
          while (y0 !== y1) {
            y0 += sy;
            if (e1 >= 0) {
              x0 += sx;
              e1 -= 2 * dy;
            }
            if (e2 >= 0) {
              z0 += sz;
              e2 -= 2 * dy;
            }
            e1 += 2 * dx;
            e2 += 2 * dz;
            result.push(new papaya.core.Coordinate(x0, y0, z0));
          }
        }
        // Driving axis is Z-axis
        else {
          e1 = 2 * dy - dz;
          e2 = 2 * dx - dz;
          while (z0 !== z1) {
            z0 += sz;
            if (e1 >= 0) {
              y0 += sy;
              e1 -= 2 * dz;
            }
            if (e2 >= 0) {
              x0 += sx;
              e2 -= 2 * dz;
            }
            e1 += 2 * dy;
            e2 += 2 * dx;
            result.push(new papaya.core.Coordinate(x0, y0, z0));
          }
        }
    };
    var getDistance = function (p1, p2) {
        return Math.sqrt(Math.pow((p2.x - p1.x), 2) + Math.pow((p2.y - p1.y), 2) + Math.pow((p2.z - p1.z), 2));
    };

    // iterate through segments
    var delta = 1;
    var index = 0;
    // console.log('padCoordinate', segments);
    while (index + delta < segments.length) {
        // console.log(index, delta);
        var dis = getDistance(segments[index], segments[index+delta]);
        if (dis > MIN_DISTANCE) {
            // do stuff
            pad(segments[index].x, segments[index].y, segments[index].z, segments[index+delta].x, segments[index+delta].y, segments[index+delta].z);
            index += delta;
            delta = 1;
        } else {
            delta++;
        }
    }
    if (index < segments.length - 1) pad(segments[index].x, segments[index].y, segments[index].z, segments[segments.length - 1].x, segments[segments.length - 1].y, segments[segments.length - 1].z);
    // result.push(new papaya.core.Coordinate(segments[segments.length - 1].x, segments[segments.length - 1].y, segments[segments.length - 1].z));
    // console.log('padCoordinate', result);
    return result;
};

//TODO: move this to viewer-utils
papaya.viewer.ScreenCurve.prototype.getOtherViews = function (currentSlice, screenLayout) {
    var thisDirection = currentSlice.sliceDirection;
    return screenLayout.filter(function (slice) {
        return (slice.sliceDirection !== thisDirection && 
            slice.sliceDirection !== papaya.viewer.ScreenSlice.DIRECTION_CURVED && 
            slice.sliceDirection !== papaya.viewer.ScreenSlice.DIRECTION_TEMPORAL && 
            slice.sliceDirection !== papaya.viewer.ScreenSlice.DIRECTION_SURFACE)
    });
}