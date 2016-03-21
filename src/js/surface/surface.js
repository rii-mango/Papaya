
/*jslint browser: true, node: true */
/*global  */

"use strict";

/*** Imports ***/
var papaya = papaya || {};
papaya.surface = papaya.surface || {};


/*** Constructor ***/
papaya.surface.Surface = papaya.surface.Surface || function (progressMeter, params) {
    this.progressMeter = progressMeter;
    this.error = null;
    this.filename = null;
    this.rawData = null;
    this.onFinishedRead = null;
    this.pointData = null;
    this.triangleData = null;
    this.normalsData = null;
    this.colorsData = null;
    this.numPoints = 0;
    this.numTriangles = 0;
    this.pointsBuffer = null;
    this.trianglesBuffer = null;
    this.normalsBuffer = null;
    this.colorsBuffer = null;
    this.solidColor = null;
        this.params = params;
};



papaya.surface.Surface.prototype.readURL = function (url, callback) {
    var xhr, surface = this;

    this.filename = url.substr(url.lastIndexOf("/") + 1, url.length);
    this.onFinishedRead = callback;

    try {
        if (typeof new XMLHttpRequest().responseType === 'string') {
            xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);

            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        surface.rawData = xhr.response;
                        surface.finishedLoading();
                    } else {
                        surface.error = new Error("There was a problem reading that file (" + surface.filename + "):\n\nResponse status = " + xhr.status);
                        surface.finishedLoading();
                    }
                }
            };

            xhr.onprogress = function (evt) {
                if (evt.lengthComputable) {
                    surface.progressMeter.drawProgress(evt.loaded / evt.total, papaya.volume.Volume.PROGRESS_LABEL_LOADING);
                }
            };

            xhr.send(null);
        } else {
            surface.error = new Error("There was a problem reading that file (" + surface.filename + "):\n\nResponse type is not supported.");
            surface.finishedLoading();
        }
    } catch (err) {
        if (surface !== null) {
            surface.error = new Error("There was a problem reading that file (" + surface.filename + "):\n\n" + err.message);
            surface.finishedLoading();
        }
    }
};



papaya.surface.Surface.prototype.readFile = function (file, callback) {
    var blob = papaya.utilities.PlatformUtils.makeSlice(file, 0, file.size),
        surface = this;

    this.filename = file.name;
    this.onFinishedRead = callback;

    try {
        var reader = new FileReader();

        reader.onloadend = function (evt) {
            if (evt.target.readyState === FileReader.DONE) {
                surface.rawData = evt.target.result;
                surface.finishedLoading();
            }
        };

        reader.onerror = function (evt) {
            surface.error = new Error("There was a problem reading that file:\n\n" + evt.getMessage());
            surface.finishedLoading();
        };

        reader.readAsText(blob);
    } catch (err) {
        surface.error = new Error("There was a problem reading that file:\n\n" + err.message);
        surface.finishedLoading();
    }
};




papaya.surface.Surface.prototype.finishedLoading = function () {
    this.readData();
};



papaya.surface.Surface.prototype.readData = function () {
    if (this.error) {
        console.log(this.error);
        this.onFinishedRead(this);
        return;
    }

    if (!gifti.isThisFormat(this.filename)) {
        this.error = new Error("This surface format is not supported!");
        console.log(this.error);
        this.onFinishedRead(this);
        return;
    }

    var screenParams = params[this.filename];
    if (screenParams) {
        if (screenParams.color !== undefined) {
            this.solidColor = screenParams.color;
        }
    }

    var gii = gifti.parse(this.rawData);
    this.numPoints = gii.getNumPoints();
    this.numTriangles = gii.getNumTriangles();

    this.readPoints(this, gii);
};



papaya.surface.Surface.prototype.readPoints = function (surf, gii) {
    var progMeter = surf.progressMeter;
    var prog = function(val) {
        progMeter.drawProgress(val, "Loading surface points...");
    };

    var next = function(data) {
        surf.pointData = data;
        surf.readNormals(surf, gii);
    };

    if (gii.getPointsDataArray()) {
        gii.getPointsDataArray().getDataAsync(prog, next);
    } else {
        surf.error = new Error("Surface is missing vertex information!");
        surf.onFinishedRead(surf);
    }
};



papaya.surface.Surface.prototype.readNormals = function (surf, gii) {
    var progMeter = surf.progressMeter;
    var prog = function(val) {
        progMeter.drawProgress(val, "Loading surface normals...");
    };

    var next = function(data) {
        surf.normalsData = data;
        surf.readColors(surf, gii);
    };

    if (gii.getNormalsDataArray()) {
        gii.getNormalsDataArray().getDataAsync(prog, next);
    } else {
        surf.error = new Error("Surface is missing normals information!");
        surf.onFinishedRead(surf);
    }
};



papaya.surface.Surface.prototype.readColors = function (surf, gii) {
    var progMeter = surf.progressMeter;
    var prog = function(val) {
        progMeter.drawProgress(val, "Loading surface colors...");
    };

    var next = function(data) {
        surf.colorsData = data;
        surf.readTriangles(surf, gii);
    };

    if (gii.getColorsDataArray() !== null) {
        gii.getColorsDataArray().getDataAsync(prog, next);
    } else {
        surf.readTriangles(surf, gii);
    }
};



papaya.surface.Surface.prototype.readTriangles = function (surf, gii) {
    var progMeter = surf.progressMeter;
    var prog = function(val) {
        progMeter.drawProgress(val, "Loading surface triangles...");
    };

    var next = function(data) {
        surf.triangleData = data;
        surf.onFinishedRead(surf);
    };

    if (gii.getTrianglesDataArray()) {
        gii.getTrianglesDataArray().getDataAsync(prog, next);
    } else {
        surf.error = new Error("Surface is missing indices information!");
        surf.onFinishedRead(surf);
    }
};
