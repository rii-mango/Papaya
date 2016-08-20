
/*jslint browser: true, node: true */
/*global */

"use strict";

/*** Imports ***/
var papaya = papaya || {};
papaya.volume = papaya.volume || {};


/*** Constructor ***/
papaya.volume.VoxelDimensions = papaya.volume.VoxelDimensions || function (colSize, rowSize, sliceSize, timeSize) {
    this.colSize = Math.abs(colSize);
    this.rowSize = Math.abs(rowSize);
    this.sliceSize = Math.abs(sliceSize);
    this.xSize = 0;
    this.ySize = 0;
    this.zSize = 0;
    this.flip = false;
    this.timeSize = timeSize;
    this.spatialUnit = papaya.volume.VoxelDimensions.UNITS_UNKNOWN;
    this.temporalUnit = papaya.volume.VoxelDimensions.UNITS_UNKNOWN;
};

/*** Static Pseudo-constants ***/

papaya.volume.VoxelDimensions.UNITS_UNKNOWN = 0;
papaya.volume.VoxelDimensions.UNITS_METER = 1;
papaya.volume.VoxelDimensions.UNITS_MM = 2;
papaya.volume.VoxelDimensions.UNITS_MICRON = 3;
papaya.volume.VoxelDimensions.UNITS_SEC = 8;
papaya.volume.VoxelDimensions.UNITS_MSEC = 16;
papaya.volume.VoxelDimensions.UNITS_USEC = 24;
papaya.volume.VoxelDimensions.UNITS_HZ = 32;
papaya.volume.VoxelDimensions.UNITS_PPM = 40;
papaya.volume.VoxelDimensions.UNITS_RADS = 48;

papaya.volume.VoxelDimensions.UNIT_STRINGS = [];
papaya.volume.VoxelDimensions.UNIT_STRINGS[papaya.volume.VoxelDimensions.UNITS_UNKNOWN] = "Unknown Unit";
papaya.volume.VoxelDimensions.UNIT_STRINGS[papaya.volume.VoxelDimensions.UNITS_METER] = "Meters";
papaya.volume.VoxelDimensions.UNIT_STRINGS[papaya.volume.VoxelDimensions.UNITS_MM] = "Millimeters";
papaya.volume.VoxelDimensions.UNIT_STRINGS[papaya.volume.VoxelDimensions.UNITS_MICRON] = "Microns";
papaya.volume.VoxelDimensions.UNIT_STRINGS[papaya.volume.VoxelDimensions.UNITS_SEC] = "Seconds";
papaya.volume.VoxelDimensions.UNIT_STRINGS[papaya.volume.VoxelDimensions.UNITS_MSEC] = "Milliseconds";
papaya.volume.VoxelDimensions.UNIT_STRINGS[papaya.volume.VoxelDimensions.UNITS_USEC] = "Microseconds";
papaya.volume.VoxelDimensions.UNIT_STRINGS[papaya.volume.VoxelDimensions.UNITS_HZ] = "Hertz";
papaya.volume.VoxelDimensions.UNIT_STRINGS[papaya.volume.VoxelDimensions.UNITS_PPM] = "Parts-per-million";
papaya.volume.VoxelDimensions.UNIT_STRINGS[papaya.volume.VoxelDimensions.UNITS_RADS] = "Radians-per-second";


/*** Prototype Methods ***/

papaya.volume.VoxelDimensions.prototype.isValid = function () {
    return ((this.colSize > 0) && (this.rowSize > 0) && (this.sliceSize > 0) && (this.timeSize >= 0));
};



papaya.volume.VoxelDimensions.prototype.getSpatialUnitString = function () {
    return papaya.volume.VoxelDimensions.UNIT_STRINGS[this.spatialUnit];
};



papaya.volume.VoxelDimensions.prototype.getTemporalUnitString = function () {
    return papaya.volume.VoxelDimensions.UNIT_STRINGS[this.temporalUnit];
};


papaya.volume.VoxelDimensions.prototype.getTemporalUnitMultiplier = function () {
    if (this.temporalUnit === papaya.volume.VoxelDimensions.UNITS_MSEC) {
        return 0.001;
    }

    if (this.temporalUnit === papaya.volume.VoxelDimensions.UNITS_USEC) {
        return 0.000001;
    }

    return 1;
};
