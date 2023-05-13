
/*jslint browser: true, node: true */
/*global  */

"use strict";

/*** Imports ***/
var papaya = papaya || {};
papaya.surface = papaya.surface || {};


/*** Constructor ***/
papaya.surface.SurfaceGIFTI = papaya.surface.SurfaceGIFTI || function () {
    this.gii = null;
    this.error = null;
    this.pointData = null;
    this.triangleData = null;
    this.normalsData = null;
    this.colorsData = null;
    this.onFinishedRead = null;
};


/*** Prototype Methods ***/

papaya.surface.SurfaceGIFTI.prototype.isSurfaceDataBinary = function () {
    return false;
};



papaya.surface.SurfaceGIFTI.prototype.readData = function (data, progress, onFinishedRead) {
    var surf = this;

    progress(0);
    this.onFinishedRead = onFinishedRead;
    this.gii = gifti.parse(data);

    setTimeout(function() { surf.readDataPoints(surf, progress); }, 0);
};



papaya.surface.SurfaceGIFTI.prototype.readDataPoints = function (surf, progress) {
    progress(0.2);

    if (surf.gii.getPointsDataArray() != null) {
        surf.pointData = surf.gii.getPointsDataArray().getData();
    } else {
        surf.error = new Error("Surface is missing point information!");
    }
    if (surf.gii.getPointsDataArray().attributes.ArrayIndexingOrder === 'ColumnMajorOrder') {
        //transpose points, xx..xyy..yzz..z -> xyzxyz.. 
        var ps = surf.pointData.slice();
        var np = ps.length / 3;
        var j = 0;
        for (var p = 0; p < np; p++) 
          for (var i = 0; i < 3; i++) {
            surf.pointData[j] = ps[(i * np)+p]
            j++;
          }
    }
    setTimeout(function() { surf.readDataNormals(surf, progress); }, 0);
};



papaya.surface.SurfaceGIFTI.prototype.readDataNormals = function (surf, progress) {
    progress(0.4);

    if (surf.gii.getNormalsDataArray() != null) {
        surf.normalsData = surf.gii.getNormalsDataArray().getData();
    }

    setTimeout(function() { surf.readDataTriangles(surf, progress); }, 0);
};



papaya.surface.SurfaceGIFTI.prototype.readDataTriangles = function (surf, progress) {
    progress(0.6);

    if (surf.gii.getTrianglesDataArray() != null) {
        surf.triangleData = surf.gii.getTrianglesDataArray().getData();
    } else {
        surf.error = Error("Surface is missing triangle information!");
    }
    if (surf.gii.getTrianglesDataArray().attributes.ArrayIndexingOrder === 'ColumnMajorOrder') {
        //https://github.com/rii-mango/GIFTI-Reader-JS/issues/2
        //transpose indices, xx..xyy..yzz..z -> xyzxyz..
        var ps = surf.triangleData.slice();
        var np = ps.length / 3;
        var j = 0;
        for (var p = 0; p < np; p++) 
          for (var i = 0; i < 3; i++) {
            surf.triangleData[j] = ps[(i * np)+p]
            j++;
          }
    }
    setTimeout(function() { surf.readDataColors(surf, progress); }, 0);
};



papaya.surface.SurfaceGIFTI.prototype.readDataColors = function (surf, progress) {
    progress(0.8);

    if (surf.gii.getColorsDataArray() != null) {
        surf.colorsData = surf.gii.getColorsDataArray().getData();
    }

    setTimeout(function() { surf.onFinishedRead(); }, 0);
};



papaya.surface.SurfaceGIFTI.prototype.getNumSurfaces = function () {
    return 1;
};



papaya.surface.SurfaceGIFTI.prototype.getNumPoints = function () {
    return this.gii.getNumPoints();
};



papaya.surface.SurfaceGIFTI.prototype.getNumTriangles = function () {
    return this.gii.getNumTriangles();
};



papaya.surface.SurfaceGIFTI.prototype.getPointData = function () {
    return this.pointData;
};



papaya.surface.SurfaceGIFTI.prototype.getNormalsData = function () {
    return this.normalsData;
};



papaya.surface.SurfaceGIFTI.prototype.getTriangleData = function () {
    return this.triangleData;
};



papaya.surface.SurfaceGIFTI.prototype.getColorsData = function () {
    return this.colorsData;
};



papaya.surface.SurfaceGIFTI.prototype.getSolidColor = function () {
    return this.solidColor;
};
