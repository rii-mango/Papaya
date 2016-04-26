
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
    this.surfaceType = papaya.surface.Surface.SURFACE_TYPE_UNKNOWN;
    this.fileFormat = null;
    this.params = params;
    this.nextSurface = null;
};

/*** Static Pseudo-constants ***/

papaya.surface.Surface.SURFACE_TYPE_UNKNOWN = 0;
papaya.surface.Surface.SURFACE_TYPE_GIFTI = 1;
papaya.surface.Surface.SURFACE_TYPE_MANGO = 2;



/*** Static Methods ***/

papaya.surface.Surface.findSurfaceType = function (filename) {
    if (gifti.isThisFormat(filename)) {
        return papaya.surface.Surface.SURFACE_TYPE_GIFTI;
    } else if (papaya.surface.SurfaceMango.isThisFormat(filename)) {
        return papaya.surface.Surface.SURFACE_TYPE_MANGO;
    }

    return papaya.surface.Surface.SURFACE_TYPE_UNKNOWN;
};



/*** Prototype Methods ***/

papaya.surface.Surface.prototype.makeFileFormat = function (filename) {
    this.surfaceType = papaya.surface.Surface.findSurfaceType(filename);

    if (this.surfaceType === papaya.surface.Surface.SURFACE_TYPE_GIFTI) {
        this.fileFormat = new papaya.surface.SurfaceGIFTI();
    } else if (this.surfaceType === papaya.surface.Surface.SURFACE_TYPE_MANGO) {
        this.fileFormat = new papaya.surface.SurfaceMango();
    }
};



papaya.surface.Surface.prototype.readURL = function (url, callback) {
    var xhr, surface = this;

    this.filename = url.substr(url.lastIndexOf("/") + 1, url.length);
    this.onFinishedRead = callback;
    this.processParams(this.filename);
    this.makeFileFormat(this.filename);

    if (this.surfaceType === papaya.surface.Surface.SURFACE_TYPE_UNKNOWN) {
        this.error = new Error("This surface format is not supported!");
        this.finishedLoading();
        return;
    }

    try {
        if (typeof new XMLHttpRequest().responseType === 'string') {
            xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            if (this.fileFormat.isSurfaceDataBinary()) {
                xhr.responseType = 'arraybuffer';
            }

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
    this.processParams(this.filename);
    this.makeFileFormat(this.filename);

    if (this.surfaceType === papaya.surface.Surface.SURFACE_TYPE_UNKNOWN) {
        this.error = new Error("This surface format is not supported!");
        this.finishedLoading();
        return;
    }

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

        if (this.fileFormat.isSurfaceDataBinary()) {
            reader.readAsArrayBuffer(blob);
        } else {
            reader.readAsText(blob);
        }
    } catch (err) {
        surface.error = new Error("There was a problem reading that file:\n\n" + err.message);
        surface.finishedLoading();
    }
};



papaya.surface.Surface.prototype.readEncodedData = function (name, callback) {
    this.filename = (name + ".surf.gii");
    this.onFinishedRead = callback;
    this.processParams(name);
    this.makeFileFormat(this.filename);

    if (this.surfaceType === papaya.surface.Surface.SURFACE_TYPE_UNKNOWN) {
        this.error = new Error("This surface format is not supported!");
        this.finishedLoading();
        return;
    }

    try {
        if (this.fileFormat.isSurfaceDataBinary()) {
            this.rawData = Base64Binary.decodeArrayBuffer(papaya.utilities.ObjectUtils.dereference(name));
        } else {
            this.rawData = atob(papaya.utilities.ObjectUtils.dereference(name));
        }
    } catch (err) {
        this.error = new Error("There was a problem reading that file:\n\n" + err.message);
    }

    this.finishedLoading();
};



papaya.surface.Surface.prototype.processParams = function (name) {
    var screenParams = params[name];
    if (screenParams) {
        if (screenParams.color !== undefined) {
            this.solidColor = screenParams.color;
        }
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

    var progMeter = this.progressMeter;
    var prog = function(val) {
        progMeter.drawProgress(val, "Loading surface...");
    };

    try {
        this.fileFormat.readData(this.rawData, prog, papaya.utilities.ObjectUtils.bind(this, this.finishedReading));
    } catch (err) {
        console.log(err.stack);
        this.error = err;
        this.onFinishedRead(this);
    }
};



papaya.surface.Surface.prototype.finishedReading = function () {
    var numSurfaces = this.fileFormat.getNumSurfaces(), currentSurface = this, ctr;

    for (ctr = 0; ctr < numSurfaces; ctr += 1) {
        if (ctr > 0) {
            currentSurface.nextSurface = new papaya.surface.Surface();
            currentSurface = currentSurface.nextSurface;
        }

        currentSurface.numPoints = this.fileFormat.getNumPoints(ctr);
        currentSurface.numTriangles = this.fileFormat.getNumTriangles(ctr);
        currentSurface.pointData = this.fileFormat.getPointData(ctr);
        currentSurface.normalsData = this.fileFormat.getNormalsData(ctr);
        currentSurface.triangleData = this.fileFormat.getTriangleData(ctr);
        currentSurface.colorsData = this.fileFormat.getColorsData(ctr);

        if (this.fileFormat.getSolidColor(ctr)) {
            currentSurface.solidColor = this.fileFormat.getSolidColor(ctr);
        }
    }


    this.progressMeter.drawProgress(1, "Loading surface...");

    this.onFinishedRead(this);
};
