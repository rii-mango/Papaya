
/*jslint browser: true, node: true */
/*global GUNZIP_MAGIC_COOKIE1, GUNZIP_MAGIC_COOKIE2, Base64Binary, pako, numeric */

"use strict";

/*** Imports ***/
var papaya = papaya || {};
papaya.volume = papaya.volume || {};


/*** Constructor ***/
papaya.volume.Volume = papaya.volume.Volume || function (progressMeter, dialogHandler, params) {
    this.progressMeter = progressMeter;
    this.dialogHandler = dialogHandler;
    this.files = [];
    this.rawData = [];
    this.fileLength = 0;
    this.urls = null;
    this.fileName = null;
    this.compressed = false;
    this.transform = null;
    this.numTimepoints = 0;
    this.onFinishedRead = null;
    this.error = null;
    this.transform = null;
    this.isLoaded = false;
    this.numTimepoints = 1;
    this.loaded = false;
    this.params = params;

    this.header = new papaya.volume.Header((this.params !== undefined) && this.params.padAllImages);
    this.imageData = new papaya.volume.ImageData((this.params !== undefined) && this.params.padAllImages);
};


/*** Static Pseudo-constants ***/

papaya.volume.Volume.PROGRESS_LABEL_LOADING = "Loading";


/*** Prototype Methods ***/

papaya.volume.Volume.prototype.fileIsCompressed = function (filename, data) {
    var buf, magicCookie1, magicCookie2;

    if (filename && filename.indexOf(".gz") !== -1) {
        return true;
    }

    if (data) {
        buf = new DataView(data);

        magicCookie1 = buf.getUint8(0);
        magicCookie2 = buf.getUint8(1);

        if (magicCookie1 === GUNZIP_MAGIC_COOKIE1) {
            return true;
        }

        if (magicCookie2 === GUNZIP_MAGIC_COOKIE2) {
            return true;
        }
    }

    return false;
};



papaya.volume.Volume.prototype.readFiles = function (files, callback) {
    this.files = files;
    this.fileName = files[0].name;
    this.onFinishedRead = callback;
    this.compressed = this.fileIsCompressed(this.fileName);
    this.fileLength = this.files[0].size;
    this.readNextFile(this, 0);
};



papaya.volume.Volume.prototype.readNextFile = function (vol, index) {
    var blob;

    if (index < this.files.length) {
        blob = papaya.utilities.PlatformUtils.makeSlice(this.files[index], 0, this.files[index].size);

        try {
            var reader = new FileReader();

            reader.onloadend = papaya.utilities.ObjectUtils.bind(vol, function (evt) {
                if (evt.target.readyState === FileReader.DONE) {
                    vol.rawData[index] = evt.target.result;
                    setTimeout(function () {vol.readNextFile(vol, index + 1); }, 0);
                }
            });

            reader.onerror = papaya.utilities.ObjectUtils.bind(vol, function (evt) {
                vol.error = new Error("There was a problem reading that file:\n\n" + evt.getMessage());
                vol.finishedLoad();
            });

            reader.readAsArrayBuffer(blob);
        } catch (err) {
            vol.error = new Error("There was a problem reading that file:\n\n" + err.message);
            vol.finishedLoad();
        }
    } else {
        setTimeout(function () {vol.decompress(vol); }, 0);
    }
};



papaya.volume.Volume.prototype.readURLs = function (urls, callback) {
    var self = this;
    this.urls = urls;
    this.fileName = urls[0].substr(urls[0].lastIndexOf("/") + 1, urls[0].length);
    this.onFinishedRead = callback;
    this.compressed = this.fileIsCompressed(this.fileName);

    if (this.fileName.indexOf("?") !== -1) {
        this.fileName = this.fileName.substr(0, this.fileName.indexOf("?"));
    }

    this.rawData = [];
    this.loadedFileCount = 0;
    this.readEachURL(this)
        .done(function () {
            // recieves `arguments` which are results off xhr requests
            setTimeout(function () {self.decompress(self); }, 0);
        })
        .fail(function (vol, err, xhr) {

            var message = err.message || '';
            // if error came from ajax request
            if ( typeof xhr !== "undefined" ) {
                message = "Response status = " + xhr.status;
            }

            vol.error = new Error("There was a problem reading that file (" +
                vol.fileName + "):\n\n" + message);
            vol.finishedLoad();
        });
};



papaya.volume.Volume.prototype.loadURL = function (url, vol) {
    var supported, deferredLoading, xhr, progPerc, progressText;

    deferredLoading = jQuery.Deferred();

    supported = typeof new XMLHttpRequest().responseType === 'string';
    if (supported) {
        xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    vol.fileLength = vol.rawData.byteLength;
                    deferredLoading.resolve( xhr.response );
                } else {
                    deferredLoading.reject(vol,false,xhr);
                }
            }
        };

        xhr.onprogress = function (evt) {
            if(evt.lengthComputable) {
                deferredLoading.notify(evt.loaded, evt.total);
            }
        };

        xhr.send(null);
    } else {
        vol.error = new Error("There was a problem reading that file (" + vol.fileName +
            "):\n\nResponse type is not supported.");
        vol.finishedLoad();
    }

    var promise = deferredLoading
        .promise()
        .done(function (file) {
            vol.loadedFileCount++;
            vol.rawData.push(file);
        })
        .fail(function (vol, err, xhr) {
            console.error(vol, err, xhr);
        })
        .progress(function (loaded,total) {
            progPerc = parseInt(100 * (vol.loadedFileCount) / vol.urls.length, 10);
            progressText = papaya.volume.Volume.PROGRESS_LABEL_LOADING +
                ' image ' + (vol.loadedFileCount + 1) + ' of ' + vol.urls.length + ' (' + progPerc + '%)';
            vol.progressMeter.drawProgress(loaded / total, progressText);
        });

    return promise;
};



papaya.volume.Volume.prototype.readEachURL = function (vol, index) {
    var deferredLoads = [];
    for (var i = 0; i < vol.urls.length; i++) {
        var getFileDeferred = vol.loadURL( vol.urls[i], vol );
        deferredLoads.push(
            getFileDeferred
        );
    }
    return $.when.apply($, deferredLoads);
};

papaya.volume.Volume.prototype.readBinaryData = function (names, callback) {
    var vol = null;

    try {
        this.fileName = names[0];
        this.onFinishedRead = callback;
        vol = this;
        this.fileLength = 0;
        vol.readNextBinaryData(vol, 0, names);
    } catch (err) {
        if (vol) {
            vol.error = new Error("There was a problem reading that file:\n\n" + err.message);
            vol.finishedLoad();
        }
    }
};

papaya.volume.Volume.prototype.readNextBinaryData = function (vol, index, names) {
    if (index < names.length) {
        try {
            vol.rawData[index] = papaya.utilities.ObjectUtils.dereference(names[index]);
            vol.compressed = this.fileIsCompressed(this.fileName, vol.rawData[index]);
            setTimeout(function () {vol.readNextBinaryData(vol, index + 1, names); }, 0);
        } catch (err) {
            if (vol) {
                vol.error = new Error("There was a problem reading that file:\n\n" + err.message);
                vol.finishedLoad();
            }
        }
    } else {
        vol.decompress(vol);
    }
};

papaya.volume.Volume.prototype.readEncodedData = function (names, callback) {
    var vol = null;

    try {
        this.fileName = names[0];
        this.onFinishedRead = callback;
        vol = this;
        this.fileLength = 0;
        vol.readNextEncodedData(vol, 0, names);
    } catch (err) {
        if (vol) {
            vol.error = new Error("There was a problem reading that file:\n\n" + err.message);
            vol.finishedLoad();
        }
    }
};



papaya.volume.Volume.prototype.readNextEncodedData = function (vol, index, names) {
    if (index < names.length) {
        try {
            vol.rawData[index] = Base64Binary.decodeArrayBuffer(papaya.utilities.ObjectUtils.dereference(names[index]));
            vol.compressed = this.fileIsCompressed(this.fileName, vol.rawData[index]);
            setTimeout(function () {vol.readNextEncodedData(vol, index + 1, names); }, 0);
        } catch (err) {
            if (vol) {
                vol.error = new Error("There was a problem reading that file:\n\n" + err.message);
                vol.finishedLoad();
            }
        }
    } else {
        vol.decompress(vol);
    }
};



papaya.volume.Volume.prototype.getVoxelAtIndexNative = function (ctrX, ctrY, ctrZ, timepoint, useNN) {
    return this.transform.getVoxelAtIndexNative(ctrX, ctrY, ctrZ, 0, useNN);
};



papaya.volume.Volume.prototype.getVoxelAtIndex = function (ctrX, ctrY, ctrZ, timepoint, useNN) {
    return this.transform.getVoxelAtIndex(ctrX, ctrY, ctrZ, timepoint, useNN);
};



papaya.volume.Volume.prototype.getVoxelAtCoordinate = function (xLoc, yLoc, zLoc, timepoint, useNN) {
    return this.transform.getVoxelAtCoordinate(xLoc, yLoc, zLoc, timepoint, useNN);
};



papaya.volume.Volume.prototype.getVoxelAtMM = function (xLoc, yLoc, zLoc, timepoint, useNN) {
    return this.transform.getVoxelAtMM(xLoc, yLoc, zLoc, timepoint, useNN);
};



papaya.volume.Volume.prototype.hasError = function () {
    return (this.error !== null);
};



papaya.volume.Volume.prototype.getXDim = function () {
    return this.header.imageDimensions.xDim;
};



papaya.volume.Volume.prototype.getYDim = function () {
    return this.header.imageDimensions.yDim;
};



papaya.volume.Volume.prototype.getZDim = function () {
    return this.header.imageDimensions.zDim;
};



papaya.volume.Volume.prototype.getXSize = function () {
    return this.header.voxelDimensions.xSize;
};



papaya.volume.Volume.prototype.getYSize = function () {
    return this.header.voxelDimensions.ySize;
};



papaya.volume.Volume.prototype.getZSize = function () {
    return this.header.voxelDimensions.zSize;
};



papaya.volume.Volume.prototype.decompress = function (vol) {
    vol.compressed = vol.compressed || vol.fileIsCompressed(vol.fileName, vol.rawData[0]);

    if (vol.compressed) {
        try {
            pako.inflate(new Uint8Array(vol.rawData[0]), null, this.progressMeter,
                function (data) {vol.finishedDecompress(vol, data.buffer); });
        } catch (err) {
            console.log(err);
        }
    } else {
        setTimeout(function () {vol.finishedReadData(vol); }, 0);
    }
};



papaya.volume.Volume.prototype.finishedDecompress = function (vol, data) {
    vol.rawData[0] = data;
    setTimeout(function () {vol.finishedReadData(vol); }, 0);
};



papaya.volume.Volume.prototype.finishedReadData = function (vol) {
    vol.header.readHeaderData(vol.fileName, vol.rawData, this.progressMeter, this.dialogHandler,
        papaya.utilities.ObjectUtils.bind(this, this.finishedReadHeaderData));
};



papaya.volume.Volume.prototype.finishedReadHeaderData = function () {
    this.rawData = null;

    if (this.header.hasError()) {
        this.error = this.header.error;
        console.error(this.error.stack);
        this.onFinishedRead(this);
        return;
    }

    this.header.imageType.swapped = (this.header.imageType.littleEndian !== papaya.utilities.PlatformUtils.isPlatformLittleEndian());

    var name = this.header.getName();

    if (name) {
        this.fileName = this.header.getName();
    }

    this.header.readImageData(this.progressMeter, papaya.utilities.ObjectUtils.bind(this, this.finishedReadImageData));
};



papaya.volume.Volume.prototype.finishedReadImageData = function (imageData) {
    this.imageData.readFileData(this.header, imageData, papaya.utilities.ObjectUtils.bind(this, this.finishedLoad));
};



papaya.volume.Volume.prototype.finishedLoad = function () {
    if (!this.loaded) {
        this.loaded = true;
        if (this.onFinishedRead) {
            if (!this.hasError()) {
                this.transform = new papaya.volume.Transform(papaya.volume.Transform.IDENTITY.clone(), this);
                this.numTimepoints = this.header.imageDimensions.timepoints || 1;
                this.applyBestTransform();
            } else {
                console.log(this.error);
            }

            this.isLoaded = true;
            this.rawData = null;
            this.onFinishedRead(this);
        }
    }
};



papaya.volume.Volume.prototype.setOrigin = function (coord) {
    var coordNew = this.header.orientation.convertCoordinate(coord, new papaya.core.Coordinate(0, 0, 0));
    this.header.origin.setCoordinate(coordNew.x, coordNew.y, coordNew.z);
};



papaya.volume.Volume.prototype.getOrigin = function () {
    return this.header.orientation.convertCoordinate(this.header.origin, new papaya.core.Coordinate(0, 0, 0));
};



papaya.volume.Volume.prototype.applyBestTransform = function () {
    var bestXform = this.header.getBestTransform();

    if (bestXform !== null) {
        this.transform.worldMatNifti = numeric.inv(bestXform);
        this.setOrigin(this.header.getBestTransformOrigin());
        this.transform.updateWorldMat();
    }
};



papaya.volume.Volume.prototype.isWorldSpaceOnly = function () {
    /*jslint bitwise: true */

    var nifti, foundDataOrderTransform = false;

    if (this.header.fileFormat instanceof papaya.volume.nifti.HeaderNIFTI) {
        nifti = this.header.fileFormat;

        if (nifti.nifti.qform_code > 0) {
            foundDataOrderTransform |= !nifti.qFormHasRotations();
        }

        if (nifti.nifti.sform_code > 0) {
            foundDataOrderTransform |= !nifti.sFormHasRotations();
        }

        return !foundDataOrderTransform;
    }

    return false;
};



papaya.volume.Volume.prototype.getSeriesLabels = function () {
    return this.header.getSeriesLabels();
};
