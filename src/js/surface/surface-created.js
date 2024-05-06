
/*jslint browser: true, node: true */
/*global  */

"use strict";

/*** Imports ***/
var papaya = papaya || {};
papaya.surface = papaya.surface || {};


/*** Constructor ***/

papaya.surface.SurfaceCreated = papaya.surface.SurfaceCreated || function () {
    this.error = null;
    this.onFinishedRead = null;
    this.origin = [];
    this.imageDims = [];
    this.voxelDims = [];
    this.center = [];
    this.diffs = [];
    this.dv = null;
    this.index = 0;
    this.surfaceIndex = 0;
    this.dataLength = 0;
    this.numSurfaces = 0;
    this.littleEndian = false;
    this.surfaces = [];
    this.v14 = false;
    this.v15 = false;
};

papaya.surface.SurfaceCreateData = papaya.surface.SurfaceCreateData || function () {
    this.pointData = null;
    this.triangleData = null;
    this.normalsData = null;
    this.colorsData = null;
    this.solidColor = [];
};

papaya.surface.SurfaceCreated.prototype.readData = function (data, progress, onFinishedRead) {
    var previewLength;

    progress(0.2);  
    this.dv = new DataView(data);  
    this.onFinishedRead = onFinishedRead;
    this.readNextSurface(this, progress);
};



papaya.surface.SurfaceCreated.prototype.readNextSurface = function (surf, progress) {
    var surfData = new papaya.surface.SurfaceCreateData();

    surf.index += papaya.surface.SurfaceMango.NAME_SIZE;
    surf.surfaces[surf.surfaceIndex] = surfData;

    surf.surfaces[surf.surfaceIndex].solidColor[0] = surf.dv.getFloat32(surf.index, surf.littleEndian); surf.index += 4;
    surf.surfaces[surf.surfaceIndex].solidColor[1] = surf.dv.getFloat32(surf.index, surf.littleEndian); surf.index += 4;
    surf.surfaces[surf.surfaceIndex].solidColor[2] = surf.dv.getFloat32(surf.index, surf.littleEndian); surf.index += 4;

    setTimeout(function () { surf.readDataPoints(surf, progress); }, 0);
};

papaya.surface.SurfaceCreated.prototype.hasOverlay = function () {
    var ctr, val;

    for (ctr = 0; ctr < papaya.surface.SurfaceMango.SURFACE_OVERLAY_MAGIC_NUMBER.length; ctr += 1) {
        val = papaya.surface.SurfaceMango.SURFACE_OVERLAY_MAGIC_NUMBER[ctr];

        if (val) {
            val = papaya.surface.SurfaceMango.SURFACE_OVERLAY_MAGIC_NUMBER[ctr].charCodeAt(0);
        }

        if (this.dv.getUint8(this.index + ctr) !== val) {
            return false;
        }
    }

    return true;
};



papaya.surface.SurfaceCreated.prototype.getString = function (length) {
    var ctr, array = [];

    for (ctr = 0; ctr < length; ctr += 1) {
        array[ctr] = this.dv.getUint8(this.index + ctr);
    }

    return String.fromCharCode.apply(null, array)
};


papaya.surface.SurfaceCreated.prototype.readDataPoints = function (surf, progress) {
    var numPointVals, ctr;

    progress(0.4);

    surf.index += 4; // num parts (should always be 1)
    numPointVals = surf.dv.getInt32(surf.index, surf.littleEndian); surf.index += 4;
    surf.surfaces[surf.surfaceIndex].pointData = new Float32Array(numPointVals);

    if (surf.v14) {
        for (ctr = 0; ctr < numPointVals; ctr += 1, surf.index += 4) {
            surf.surfaces[surf.surfaceIndex].pointData[ctr] = (((ctr % 3) !== 2) ? -1 : 1) *
                (surf.dv.getFloat32(surf.index, surf.littleEndian) +
                    (surf.diffs[ctr % 3]));
        }
    } else {
        for (ctr = 0; ctr < numPointVals; ctr += 1, surf.index += 4) {
            surf.surfaces[surf.surfaceIndex].pointData[ctr] = (((ctr % 3) !== 0) ? -1 : 1) *
                (surf.dv.getFloat32(surf.index, surf.littleEndian) +
                    (surf.diffs[ctr % 3]));
        }
    }

    setTimeout(function () { surf.readDataNormals(surf, progress); }, 0);
};



papaya.surface.SurfaceCreated.prototype.readDataNormals = function (surf, progress) {
    var numNormalVals, ctr;

    progress(0.6);

    surf.index += 4; // num parts (should always be 1)
    numNormalVals = surf.dv.getInt32(surf.index, surf.littleEndian); surf.index += 4;
    surf.surfaces[surf.surfaceIndex].normalsData = new Float32Array(numNormalVals);

    if (surf.v14) {
        for (ctr = 0; ctr < numNormalVals; ctr += 1, surf.index += 4) {
            surf.surfaces[surf.surfaceIndex].normalsData[ctr] = (((ctr % 3) !== 2) ? -1 : 1) *
                surf.dv.getFloat32(surf.index, surf.littleEndian);
        }
    } else {
        for (ctr = 0; ctr < numNormalVals; ctr += 1, surf.index += 4) {
            surf.surfaces[surf.surfaceIndex].normalsData[ctr] = (((ctr % 3) !== 0) ? -1 : 1) *
                surf.dv.getFloat32(surf.index, surf.littleEndian);
        }
    }

    setTimeout(function () { surf.readDataTriangles(surf, progress); }, 0);
};



papaya.surface.SurfaceCreated.prototype.readDataTriangles = function (surf, progress) {
    var numIndexVals, ctr;

    progress(0.8);

    surf.index += 4; // num parts (should always be 1)
    numIndexVals = surf.dv.getInt32(surf.index, surf.littleEndian); surf.index += 4;
    surf.surfaces[surf.surfaceIndex].triangleData = new Uint32Array(numIndexVals);
    for (ctr = 0; ctr < numIndexVals; ctr += 1, surf.index += 4) {
        surf.surfaces[surf.surfaceIndex].triangleData[ctr] = surf.dv.getUint32(surf.index, surf.littleEndian);
    }

    setTimeout(function () { surf.readDataColors(surf, progress); }, 0);
};



papaya.surface.SurfaceCreated.prototype.readDataColors = function (surf, progress) {
    var min, max, ratio, numScalars, length, scalars, val, scalar, colorTableName, ctr, colorTable, hasOverlay = false;

    while (surf.index < surf.dataLength) {
        if (surf.hasOverlay()) {
            hasOverlay = true;
            surf.index += papaya.surface.SurfaceMango.SURFACE_OVERLAY_MAGIC_NUMBER.length;
            surf.index += papaya.surface.SurfaceMango.NAME_SIZE;
            colorTableName = surf.getString(papaya.surface.SurfaceMango.NAME_SIZE); surf.index += papaya.surface.SurfaceMango.NAME_SIZE;
            colorTableName = colorTableName.replace(/\0/g, '');

            surf.index += 4; // alpha (ignore)
            min = surf.dv.getFloat32(this.index, this.littleEndian); surf.index += 4;
            max = surf.dv.getFloat32(this.index, this.littleEndian); surf.index += 4;
            ratio = 255.0 / (max - min);
            surf.index += 4; // brightness (ignore)
            surf.index += 4; // num parts (should always be 1)
            numScalars = surf.dv.getUint32(this.index, this.littleEndian); surf.index += 4;
            scalars = new Float32Array(numScalars);

            for (ctr = 0; ctr < numScalars; ctr += 1, surf.index += 4) {
                scalars[ctr] = surf.dv.getFloat32(surf.index, surf.littleEndian);
            }

            if (papaya.viewer.ColorTable.findLUT(colorTableName) !== papaya.viewer.ColorTable.TABLE_GRAYSCALE) {
                colorTable = new papaya.viewer.ColorTable(colorTableName, false);
            } else {
                colorTable = new papaya.viewer.ColorTable("Spectrum", false);
            }

            colorTable.updateLUT(0, 255);
            length = surf.surfaces[surf.surfaceIndex].pointData.length / 3;

            if (surf.surfaces[surf.surfaceIndex].colorsData === null) {
                surf.surfaces[surf.surfaceIndex].colorsData = new Float32Array(length * 4);
            }

            for (ctr = 0; ctr < length; ctr += 1) {
                scalar = scalars[ctr];

                if (scalar <= min) {
                    if (surf.surfaces[surf.surfaceIndex].colorsData[(ctr * 4) + 3] === 0) {
                        surf.surfaces[surf.surfaceIndex].colorsData[(ctr * 4)] = surf.surfaces[surf.surfaceIndex].solidColor[0];
                        surf.surfaces[surf.surfaceIndex].colorsData[(ctr * 4) + 1] = surf.surfaces[surf.surfaceIndex].solidColor[1];
                        surf.surfaces[surf.surfaceIndex].colorsData[(ctr * 4) + 2] = surf.surfaces[surf.surfaceIndex].solidColor[2];
                        surf.surfaces[surf.surfaceIndex].colorsData[(ctr * 4) + 3] = 1;
                    }
                } else if (scalar > max) {
                    surf.surfaces[surf.surfaceIndex].colorsData[(ctr * 4)] = colorTable.lookupRed(255) / 255.0;
                    surf.surfaces[surf.surfaceIndex].colorsData[(ctr * 4) + 1] = colorTable.lookupGreen(255) / 255.0;
                    surf.surfaces[surf.surfaceIndex].colorsData[(ctr * 4) + 2] = colorTable.lookupBlue(255) / 255.0;
                    surf.surfaces[surf.surfaceIndex].colorsData[(ctr * 4) + 3] = 1;
                } else {
                    val = Math.floor(((scalar - min) * ratio) + .5);
                    surf.surfaces[surf.surfaceIndex].colorsData[(ctr * 4)] = colorTable.lookupRed(val) / 255.0;
                    surf.surfaces[surf.surfaceIndex].colorsData[(ctr * 4) + 1] = colorTable.lookupGreen(val) / 255.0;
                    surf.surfaces[surf.surfaceIndex].colorsData[(ctr * 4) + 2] = colorTable.lookupBlue(val) / 255.0;
                    surf.surfaces[surf.surfaceIndex].colorsData[(ctr * 4) + 3] = 1;
                }
            }
        } else {
            break;
        }
    }

    surf.surfaceIndex++;

    if (surf.surfaceIndex === surf.numSurfaces) {
        setTimeout(function () { surf.onFinishedRead(); }, 0);
    } else {
        setTimeout(function () { surf.readNextSurface(surf, progress); }, 0);
    }
};



papaya.surface.SurfaceCreated.prototype.getNumSurfaces = function () {
    return this.numSurfaces;
};



papaya.surface.SurfaceCreated.prototype.getNumPoints = function (index) {
    return this.surfaces[index].pointData.length / 3;
};



papaya.surface.SurfaceCreated.prototype.getNumTriangles = function (index) {
    return this.surfaces[index].triangleData.length / 3;
};



papaya.surface.SurfaceCreated.prototype.getSolidColor = function (index) {
    return this.surfaces[index].solidColor;
};



papaya.surface.SurfaceCreated.prototype.getPointData = function (index) {
    return this.surfaces[index].pointData;
};



papaya.surface.SurfaceCreated.prototype.getNormalsData = function (index) {
    return this.surfaces[index].normalsData;
};



papaya.surface.SurfaceCreated.prototype.getTriangleData = function (index) {
    return this.surfaces[index].triangleData;
};



papaya.surface.SurfaceCreated.prototype.getColorsData = function (index) {
    return this.surfaces[index].colorsData;
};
