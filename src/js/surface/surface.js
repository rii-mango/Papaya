
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
    this.volume = null;
    this.alpha = 1;
};

/*** Static Pseudo-constants ***/

papaya.surface.Surface.SURFACE_TYPE_UNKNOWN = 0;
papaya.surface.Surface.SURFACE_TYPE_GIFTI = 1;
papaya.surface.Surface.SURFACE_TYPE_MANGO = 2;
papaya.surface.Surface.SURFACE_TYPE_VTK = 3;



/*** Static Methods ***/

papaya.surface.Surface.findSurfaceType = function (filename) {
    if (gifti.isThisFormat(filename)) {
        return papaya.surface.Surface.SURFACE_TYPE_GIFTI;
    } else if (papaya.surface.SurfaceMango.isThisFormat(filename)) {
        return papaya.surface.Surface.SURFACE_TYPE_MANGO;
    } else if (papaya.surface.SurfaceVTK.isThisFormat(filename)) {
        return papaya.surface.Surface.SURFACE_TYPE_VTK;
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
    } else if (this.surfaceType === papaya.surface.Surface.SURFACE_TYPE_VTK) {
        this.fileFormat = new papaya.surface.SurfaceVTK();
    }
};



papaya.surface.Surface.prototype.readURL = function (url, volume, callback) {
    var xhr, surface = this;

    this.filename = url.substr(url.lastIndexOf("/") + 1, url.length);
    this.onFinishedRead = callback;
    this.volume = volume;
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



papaya.surface.Surface.prototype.readFile = function (file, volume, callback) {
    var blob = papaya.utilities.PlatformUtils.makeSlice(file, 0, file.size),
        surface = this;

    this.filename = file.name;
    this.onFinishedRead = callback;
    this.volume = volume;
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



papaya.surface.Surface.prototype.readEncodedData = function (name, volume, callback) {
    this.filename = (name + ".surf.gii");
    this.onFinishedRead = callback;
    this.volume = volume;
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
    var screenParams = this.params[name];
    if (screenParams) {
        if (screenParams.color !== undefined) {
            this.solidColor = screenParams.color;
        }

        if (screenParams.alpha !== undefined) {
            this.alpha = screenParams.alpha;
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
        this.fileFormat.readData(this.rawData, prog, papaya.utilities.ObjectUtils.bind(this, this.finishedReading), this.volume);
    } catch (err) {
        this.error = err;
        this.onFinishedRead(this);
    }
};



papaya.surface.Surface.prototype.finishedReading = function () {
    var numSurfaces = this.fileFormat.getNumSurfaces(), currentSurface = this, ctr;

    if (this.fileFormat.error) {
        this.error = this.fileFormat.error;
    } else {
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

            if (currentSurface.normalsData === null) {
                this.generateNormals();
            }

            if (this.fileFormat.getSolidColor(ctr)) {
                currentSurface.solidColor = this.fileFormat.getSolidColor(ctr);
            }
        }
    }

    this.progressMeter.drawProgress(1, "Loading surface...");
    this.onFinishedRead(this);
};



papaya.surface.Surface.prototype.generateNormals = function () {
    var p1 = [], p2 = [], p3 = [], normal = [], nn = [], ctr,
        normalsDataLength = this.pointData.length, numIndices,
        qx, qy, qz, px, py, pz, index1, index2, index3;

    this.normalsData = new Float32Array(normalsDataLength);

    numIndices = this.numTriangles * 3;
    for (ctr = 0; ctr < numIndices; ctr += 3) {
        index1 = this.triangleData[ctr] * 3;
        index2 = this.triangleData[ctr + 1] * 3;
        index3 = this.triangleData[ctr + 2] * 3;

        p1.x = this.pointData[index1];
        p1.y = this.pointData[index1 + 1];
        p1.z = this.pointData[index1 + 2];

        p2.x = this.pointData[index2];
        p2.y = this.pointData[index2 + 1];
        p2.z = this.pointData[index2 + 2];

        p3.x = this.pointData[index3];
        p3.y = this.pointData[index3 + 1];
        p3.z = this.pointData[index3 + 2];

        qx = p2.x - p1.x;
        qy = p2.y - p1.y;
        qz = p2.z - p1.z;
        px = p3.x - p1.x;
        py = p3.y - p1.y;
        pz = p3.z - p1.z;

        normal[0] = (py * qz) - (pz * qy);
        normal[1] = (pz * qx) - (px * qz);
        normal[2] = (px * qy) - (py * qx);

        this.normalsData[index1] += normal[0];
        this.normalsData[index1 + 1] += normal[1];
        this.normalsData[index1 + 2] += normal[2];

        this.normalsData[index2] += normal[0];
        this.normalsData[index2 + 1] += normal[1];
        this.normalsData[index2 + 2] += normal[2];

        this.normalsData[index3] += normal[0];
        this.normalsData[index3 + 1] += normal[1];
        this.normalsData[index3 + 2] += normal[2];
    }

    for (ctr = 0; ctr < normalsDataLength; ctr += 3) {
        normal[0] = -1 * this.normalsData[ctr];
        normal[1] = -1 * this.normalsData[ctr + 1];
        normal[2] = -1 * this.normalsData[ctr + 2];

        vec3.normalize(normal, nn);

        this.normalsData[ctr] = nn[0];
        this.normalsData[ctr + 1] = nn[1];
        this.normalsData[ctr + 2] = nn[2];
    }
};
