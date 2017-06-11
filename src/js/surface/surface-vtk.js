
/*jslint browser: true, node: true */
/*global  */

"use strict";

/*** Imports ***/
var papaya = papaya || {};
papaya.surface = papaya.surface || {};


/*** Constructor ***/
papaya.surface.SurfaceVTK = papaya.surface.SurfaceVTK || function () {
        this.error = null;
        this.onFinishedRead = null;
        this.dv = null;
        this.index = 0;
        this.littleEndian = true;
        this.numPoints = 0;
        this.pointData = null;
        this.triangleData = null;
        this.normalsData = null;
        this.colorsData = null;
        this.vtkVersion = null;
        this.description = null;
        this.ascii = false;
        this.volume = null;
        this.done = false;
        this.headerRead = false;
    };


/*** Constants ***/

papaya.surface.SurfaceVTK.MAGIC_NUMBER = "# vtk DataFile Version";
papaya.surface.SurfaceVTK.MAGIC_NUMBER_ASCII = "ASCII";
papaya.surface.SurfaceVTK.MAGIC_NUMBER_DATASET = "DATASET";
papaya.surface.SurfaceVTK.MAGIC_NUMBER_POLYDATA = "POLYDATA";
papaya.surface.SurfaceVTK.MAGIC_NUMBER_POINTS = "POINTS";
papaya.surface.SurfaceVTK.MAGIC_NUMBER_POLYGONS = "POLYGONS";
papaya.surface.SurfaceVTK.MAGIC_NUMBER_NORMALS = "NORMALS";


/*** Static Methods ***/

papaya.surface.SurfaceVTK.isThisFormat = function (filename) {
    return filename.endsWith(".vtk");
};



/*** Prototype Methods ***/

papaya.surface.SurfaceVTK.prototype.isSurfaceDataBinary = function () {
    return true;
};



papaya.surface.SurfaceVTK.prototype.hasOverlay = function () {
    return false;
};



papaya.surface.SurfaceVTK.prototype.getNextLine = function (limit) {
    var ctr, val, array = [];

    if (!limit) {
        limit = 256;
    }

    for (ctr = 0; ctr < limit; ctr += 1) {
        if (this.index >= this.dv.byteLength) {
            this.done = true;
            break;
        }

        val = this.dv.getUint8(this.index++);
        if (val < 32) { // newline
            if ((!this.headerRead || this.ascii) && (this.index < this.dv.byteLength) && (this.dv.getUint8(this.index) < 32)) {
                this.index++;
            }
            break;
        }

        array[ctr] = val;
    }

    return String.fromCharCode.apply(null, array);
};



papaya.surface.SurfaceVTK.prototype.readData = function (data, progress, onFinishedRead, volume) {
    var surf = this, section;
    progress(0.2);

    this.onFinishedRead = onFinishedRead;
    this.dv = new DataView(data);
    this.volume = volume;

    this.vtkVersion = this.getNextLine().substring(papaya.surface.SurfaceVTK.MAGIC_NUMBER.length).trim();
    this.description = this.getNextLine().trim();
    this.ascii = (this.getNextLine() == papaya.surface.SurfaceVTK.MAGIC_NUMBER_ASCII);
    this.datasetType = this.getNextLine().substring(papaya.surface.SurfaceVTK.MAGIC_NUMBER_DATASET.length).trim();

    this.headerRead = true;

    if (this.datasetType != papaya.surface.SurfaceVTK.MAGIC_NUMBER_POLYDATA) {
        this.error = new Error("VTK: Only POLYDATA format is currently supported!");
        this.onFinishedRead();
    }

    section = this.getNextLine().split(" ");
    if (section[0] == papaya.surface.SurfaceVTK.MAGIC_NUMBER_POINTS) {
        setTimeout(function() { surf.readDataPoints(surf, section[1], progress); }, 0);
    }
};



papaya.surface.SurfaceVTK.prototype.readNextData = function (surf, progress) {
    var section, progressCount = 0.2;

    if (surf.pointData) {
        progressCount += 0.2;
    }

    if (surf.normalsData) {
        progressCount += 0.2;
    }

    if (surf.triangleData) {
        progressCount += 0.2;
    }

    progress(progressCount);

    if (surf.done || (surf.pointData && surf.normalsData && surf.triangleData)) {
        surf.onFinishedRead();
    } else {
        section = this.getNextLine().split(" ");

        if (section && (section[0] == papaya.surface.SurfaceVTK.MAGIC_NUMBER_POINTS)) {
            setTimeout(function() { surf.readDataPoints(surf, section[1], progress); }, 0);
        } else if (section && (section[0] == papaya.surface.SurfaceVTK.MAGIC_NUMBER_POLYGONS)) {
            setTimeout(function() { surf.readDataTriangles(surf, section[1], progress); }, 0);
        } else if (section && (section[0] == papaya.surface.SurfaceVTK.MAGIC_NUMBER_NORMALS)) {
            setTimeout(function() { surf.readDataNormals(surf, progress); }, 0);
        } else {
            setTimeout(function() { surf.readNextData(surf, progress); }, 0);
        }
    }
};



papaya.surface.SurfaceVTK.prototype.readDataPoints = function (surf, numPoints, progress) {
    var ctr, compIndex = 0, comps = [], parts, pointIndex = 0, numPointsVals = numPoints * 3;

    surf.numPoints = numPoints;
    surf.pointData = new Float32Array(numPointsVals);

    var orientation = surf.volume.header.orientation.orientation;
    var vd = surf.volume.header.voxelDimensions;
    var origin = surf.volume.header.origin;
    var colFlip = (orientation.charAt(3) === '-' ? 1 : -1) * (vd.flip ? -1 : 1);
    var rowFlip = (orientation.charAt(4) !== '-' ? 1 : -1);
    var sliceFlip = (orientation.charAt(5) !== '-' ? 1 : -1);
    var xIndex = orientation.indexOf('X');
    var yIndex = orientation.indexOf('Y');
    var zIndex = orientation.indexOf('Z');
    var xDiff = colFlip * origin.x * vd.xSize;
    var yDiff = rowFlip * origin.y * vd.ySize;
    var zDiff = sliceFlip * origin.z * vd.zSize;

    if (surf.ascii) {
        while (pointIndex < numPointsVals) {
            parts = surf.getNextLine().trim().split(" ");

            for (ctr = 0; ctr < parts.length; ctr += 1) {
                comps[compIndex] = parseFloat(parts[ctr]);

                if (compIndex === 2) {
                    surf.pointData[pointIndex++] = comps[xIndex] * colFlip - xDiff;
                    surf.pointData[pointIndex++] = comps[yIndex] * rowFlip - yDiff;
                    surf.pointData[pointIndex++] = comps[zIndex] * sliceFlip - zDiff;
                }

                compIndex++;
                compIndex %= 3;
            }
        }
    } else {
        for (ctr = 0; ctr < numPointsVals; ctr += 1, surf.index += 4) {
            comps[compIndex] = surf.dv.getFloat32(surf.index, false);

            if (compIndex === 2) {
                surf.pointData[pointIndex++] = comps[xIndex] * colFlip - xDiff;
                surf.pointData[pointIndex++] = comps[yIndex] * rowFlip - yDiff;
                surf.pointData[pointIndex++] = comps[zIndex] * sliceFlip - zDiff;
            }

            compIndex++;
            compIndex %= 3;
        }
    }

    surf.readNextData(surf, progress);
};



papaya.surface.SurfaceVTK.prototype.readDataNormals = function (surf, progress) {
    var ctr, parts, normalsIndex = 0, numNormalsVals = surf.numPoints * 3;

    surf.normalsData = new Float32Array(numNormalsVals);

    if (surf.ascii) {
        while (normalsIndex < numNormalsVals) {
            parts = surf.getNextLine().trim().split(" ");

            for (ctr = 0; ctr < parts.length; ctr += 1) {
                surf.normalsData[normalsIndex++] = parseFloat(parts[ctr]);
            }
        }
    } else {
        for (ctr = 0; ctr < numNormalsVals; ctr += 1, surf.index += 4) {
            surf.normalsData[ctr] = surf.dv.getFloat32(surf.index, false);
        }
    }

    surf.readNextData(surf, progress);
};



papaya.surface.SurfaceVTK.prototype.readDataTriangles = function (surf, numTriangles, progress) {
    var ctr, parts, triIndex = 0, numIndexVals = numTriangles * 3;

    surf.triangleData = new Uint32Array(numIndexVals);

    if (surf.ascii) {
        while (triIndex < numIndexVals) {
            parts = surf.getNextLine().trim().split(" ");

            for (ctr = 1; ctr < parts.length; ctr += 1) {
                surf.triangleData[triIndex++] = parseInt(parts[ctr], 10);
            }
        }
    } else {
        for (ctr = 0; ctr < numTriangles; ctr += 1, surf.index += (4 * 4)) {
            surf.triangleData[(ctr * 3)] = surf.dv.getUint32(surf.index + 4, false);
            surf.triangleData[(ctr * 3) + 1] = surf.dv.getUint32(surf.index + 8, false);
            surf.triangleData[(ctr * 3) + 2] = surf.dv.getUint32(surf.index + 12, false);
        }
    }

    surf.readNextData(surf, progress);
};



papaya.surface.SurfaceVTK.prototype.getColorsData = function () {
    return null;
};



papaya.surface.SurfaceVTK.prototype.getNumSurfaces = function () {
    return 1;
};



papaya.surface.SurfaceVTK.prototype.getNumPoints = function () {
    return this.pointData.length / 3;
};



papaya.surface.SurfaceVTK.prototype.getNumTriangles = function () {
    return this.triangleData.length / 3;
};



papaya.surface.SurfaceVTK.prototype.getSolidColor = function () {
    return this.solidColor;
};



papaya.surface.SurfaceVTK.prototype.getPointData = function () {
    return this.pointData;
};



papaya.surface.SurfaceVTK.prototype.getNormalsData = function () {
    return this.normalsData;
};



papaya.surface.SurfaceVTK.prototype.getTriangleData = function () {
    return this.triangleData;
};
