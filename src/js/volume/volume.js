
/*jslint browser: true, node: true */
/*global makeSlice, Base64Binary, FileReader, bind, Gunzip, isPlatformLittleEndian, deref, DataView,
GUNZIP_MAGIC_COOKIE1, GUNZIP_MAGIC_COOKIE2, numeric, Uint8Array, pako */

"use strict";

var papaya = papaya || {};
papaya.volume = papaya.volume || {};



papaya.volume.Volume = papaya.volume.Volume || function (progressMeter) {
    this.progressMeter = progressMeter;
    this.fileState = null;
    this.file = null;
    this.fileLength = 0;
    this.url = null;
    this.fileName = null;
    this.compressed = false;
    this.headerType = papaya.volume.Volume.TYPE_UNKNOWN;
    this.header = new papaya.volume.Header();
    this.imageData = new papaya.volume.ImageData();
    this.transform = null;
    this.numTimepoints = 0;
    this.rawData = null;
    this.onFinishedRead = null;
    this.errorMessage = null;
    this.transform = null;
    this.isLoaded = false;
    this.numTimepoints = 1;
    this.loaded = false;
};



papaya.volume.Volume.TYPE_UNKNOWN = 0;
papaya.volume.Volume.TYPE_NIFTI = 1;
papaya.volume.Volume.TYPE_JSON = 2; // json added

papaya.volume.Volume.PROGRESS_LABEL_LOADING = "Loading";



papaya.volume.Volume.prototype.findFileType = function (filename) {
    if (filename.indexOf(".nii") !== -1) {
        return papaya.volume.Volume.TYPE_NIFTI;
    }
    else if (filename.indexOf(".json") !== -1) { // adds json filetype to list of recognized files
        return papaya.volume.Volume.TYPE_JSON;
    }

    return papaya.volume.Volume.TYPE_UNKNOWN;
};



papaya.volume.Volume.prototype.findFileTypeByMagicNumber = function (data) {
    var buf, mag1, mag2, mag3;

    buf = new DataView(data);

    mag1 = buf.getUint8(papaya.volume.nifti.MAGIC_NUMBER_LOCATION);
    mag2 = buf.getUint8(papaya.volume.nifti.MAGIC_NUMBER_LOCATION + 1);
    mag3 = buf.getUint8(papaya.volume.nifti.MAGIC_NUMBER_LOCATION + 2);

    if ((mag1 === papaya.volume.nifti.MAGIC_NUMBER[0]) && (mag2 === papaya.volume.nifti.MAGIC_NUMBER[1]) && (mag3 === papaya.volume.nifti.MAGIC_NUMBER[2])) {
        return papaya.volume.Volume.TYPE_NIFTI;
    }

    return papaya.volume.Volume.TYPE_UNKNOWN;
};



papaya.volume.Volume.prototype.fileIsCompressed = function (filename, data) {
    var buf, magicCookie1, magicCookie2;

    if (filename.indexOf(".gz") !== -1) {
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



papaya.volume.Volume.prototype.readFile = function (file, callback) {
    this.file = file;
    this.fileName = file.name;
    this.onFinishedRead = callback;
    this.fileState = 1

    this.headerType = this.findFileType(this.fileName);

    if (this.headerType === papaya.volume.Volume.TYPE_UNKNOWN) {
        this.errorMessage = "File type is not recognized!";
        this.finishedLoad();
    } else {
        console.log("before type check");
        if (this.headerType === papaya.volume.Volume.TYPE_JSON) {
            var JsonObj = null;

            var json_reader = new FileReader();

            // load json and find value of base_image
            json_reader.onload = (function (file) {
                console.log("inside onload function");
                /* readURL seems to be running here
                
                after everything finishes running,
                window.image is set to the correct URL but it is too late
                since readURL already ran. */


                // test below to see if setting window before return function loads the image, and it does
                // window.image = "https://dl.dropbox.com/s/a4hn2k20pqewdir/T1_001_brain.nii.gz"
                return function (e) { 
                    console.log("inside reader return function");
                    JsonObj = e.target.result;
                    console.log(JsonObj);
                    var parsedJSON = JSON.parse(JsonObj);
                    var image_url = parsedJSON['base_image'];
                    window.image = image_url;
                    console.log(window.image); 
                };
            })(this.file);

            json_reader.readAsText(this.file);
            console.log(window.image);

            // return window.image;

        } else {
        this.compressed = this.fileIsCompressed(this.fileName);
        this.fileLength = this.file.size;
        var blob = makeSlice(this.file, 0, this.file.size);
        this.readData(this, blob);
    }
}
};



papaya.volume.Volume.prototype.readURL = function (url, callback) {
    var vol = null, supported, xhr;

    try {
        this.url = url;
        console.log(this.url);
        console.log(window.image);
        this.fileName = url.substr(url.lastIndexOf("/") + 1, url.length);
        this.onFinishedRead = callback;

        this.headerType = this.findFileType(this.fileName);
        this.compressed = this.fileIsCompressed(this.fileName);

        vol = this;

        supported = typeof new XMLHttpRequest().responseType === 'string';
        if (supported) {
            xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = 'arraybuffer';

            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        vol.rawData = xhr.response;
                        vol.fileLength = vol.rawData.byteLength;
                        vol.decompress(vol);
                    } else {
                        vol.errorMessage = "There was a problem reading that file (" + vol.fileName + "):\n\nResponse status = " + xhr.status;
                        vol.finishedLoad();
                    }
                }
            };

            xhr.onprogress = function (evt) {
                vol.progressMeter.drawProgress(evt.loaded / evt.total, papaya.volume.Volume.PROGRESS_LABEL_LOADING);
            };

            xhr.send(null);
        } else {
            vol.errorMessage = "There was a problem reading that file (" + vol.fileName + "):\n\nResponse type is not supported.";
            vol.finishedLoad();
        }
    } catch (err) {
        if (vol !== null) {
            vol.errorMessage = "There was a problem reading that file (" + vol.fileName + "):\n\n" + err.message;
            vol.finishedLoad();
        }
    }
};



papaya.volume.Volume.prototype.readEncodedData = function (name, callback) {
    var vol = null;

    try {
        this.fileName = name;
        this.onFinishedRead = callback;

        vol = this;

        vol.rawData = Base64Binary.decodeArrayBuffer(deref(name));

        this.headerType = this.findFileType(this.fileName);
        this.compressed = this.fileIsCompressed(this.fileName, vol.rawData);

        this.fileLength = vol.rawData.byteLength;

        vol.decompress(vol);
    } catch (err) {
        if (vol) {
            vol.errorMessage = "There was a problem reading that file:\n\n" + err.message;
            vol.finishedLoad();
        }
    }
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
    return (this.errorMessage !== null);
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



papaya.volume.Volume.prototype.readData = function (vol, blob) {
    try {
        var reader = new FileReader();

        reader.onloadend = bind(vol, function (evt) {
            if (evt.target.readyState === FileReader.DONE) {
                vol.rawData = evt.target.result;
                setTimeout(function () {vol.decompress(vol); }, 0);
            }
        });

        reader.onerror = bind(vol, function (evt) {
            vol.errorMessage = "There was a problem reading that file:\n\n" + evt.getMessage();
            vol.finishedLoad();
        });

        reader.readAsArrayBuffer(blob);
    } catch (err) {
        vol.errorMessage = "There was a problem reading that file:\n\n" + err.message;
        vol.finishedLoad();
    }
};



papaya.volume.Volume.prototype.decompress = function (vol) {
    if (vol.compressed) {
        try {
            pako.inflate(new Uint8Array(vol.rawData), null, this.progressMeter, function (data) {vol.finishedDecompress(vol, data.buffer); });
        } catch (err) {
            console.log(err);
        }
    } else {
        setTimeout(function () {vol.finishedReadData(vol); }, 0);
    }
};



papaya.volume.Volume.prototype.finishedDecompress = function (vol, data) {
    vol.rawData = data;

    if (this.headerType === papaya.volume.Volume.TYPE_UNKNOWN) {  // try again to determine type by reading magic cookie
        this.headerType = this.findFileTypeByMagicNumber(vol.rawData);
    }

    setTimeout(function () {vol.finishedReadData(vol); }, 0);
};



papaya.volume.Volume.prototype.finishedReadData = function (vol) {
    vol.header.readData(vol.headerType, vol.rawData, this.compressed);
    vol.header.imageType.swapped = (vol.header.imageType.littleEndian !== isPlatformLittleEndian());

    if (vol.header.hasError()) {
        vol.errorMessage = vol.header.errorMessage;
        vol.onFinishedRead(vol);
        return;
    }

    vol.imageData.readData(vol.header, vol.rawData, bind(vol, vol.finishedLoad));
};



papaya.volume.Volume.prototype.finishedLoad = function () {
    if (!this.loaded) {
        this.loaded = true;
        if (this.onFinishedRead) {
            if (!this.hasError()) {
                this.transform = new papaya.volume.Transform(papaya.volume.Transform.IDENTITY.clone(), this);
                this.numTimepoints = this.header.imageDimensions.timepoints || 1;

                this.applyBestTransform();
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
