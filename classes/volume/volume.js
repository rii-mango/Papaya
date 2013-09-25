
var papaya = papaya || {};
papaya.volume = papaya.volume || {};



papaya.volume.Volume = papaya.volume.Volume || function() {
	this.file = null;
    this.fileLength = 0;
    this.url = null;
	this.fileName = null;
	this.compressed = false;
	this.headerType = papaya.volume.Volume.TYPE_UNKNOWN;
	this.header = new papaya.volume.Header();
	this.imageData = new papaya.volume.ImageData();
	this.rawData = null;
	this.onFinishedRead = null;
	this.errorMessage = null;
    this.transform = null;
    this.isLoaded = false;
};


papaya.volume.Volume.TYPE_UNKNOWN = 0;
papaya.volume.Volume.TYPE_NIFTI = 1;



papaya.volume.Volume.prototype.findFileType = function(filename) {
	if (filename.indexOf(".nii") != -1) {
		return papaya.volume.Volume.TYPE_NIFTI;
	} else {
		return papaya.volume.Volume.TYPE_UNKNOWN;
	}
};



papaya.volume.Volume.prototype.fileIsCompressed = function(filename) {
	return (filename.indexOf(".gz") != -1);
};



papaya.volume.Volume.prototype.readFile = function(file, callback) {
	this.file = file;
	this.fileName = file.name;
	this.onFinishedRead = callback;

	this.headerType = this.findFileType(this.fileName);

    if (this.headerType == papaya.volume.Volume.TYPE_UNKNOWN) {
        this.errorMessage = "File type is not recognized!";
        this.finishedLoad();
    } else {
        this.compressed = this.fileIsCompressed(this.fileName);
        this.fileLength = this.file.size;
        var blob = makeSlice(this.file, 0, this.file.size);
        this.readData(this, blob);
    }
};




papaya.volume.Volume.prototype.readURL = function(url, callback) {
    var vol = null, supported, xhr;

    try {

        this.url = url;
        this.fileName = url.substr(url.lastIndexOf("/")+1, url.length);
        this.onFinishedRead = callback;

        this.headerType = this.findFileType(this.fileName);
        this.compressed = this.fileIsCompressed(this.fileName);

        vol = this;

        supported = typeof new XMLHttpRequest().responseType === 'string';
        if (supported) {
            xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = 'arraybuffer';

            xhr.onreadystatechange = function() {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        vol.rawData = xhr.response;
                        vol.fileLength = vol.rawData.byteLength;
                        vol.decompress(vol);
                    } else {
                        vol.errorMessage = "There was a problem reading that file:\n\nResponse status = " + xhr.status;
                        vol.finishedLoad();
                    }
                }
            };
            xhr.send(null);
        } else {
            vol.errorMessage = "There was a problem reading that file:\n\nResponse type is not supported.";
            vol.finishedLoad();
        }
    } catch (err) {
        if (vol != null) {
            vol.errorMessage = "There was a problem reading that file:\n\n" + err.message;
            vol.finishedLoad();
        }
    }
};




papaya.volume.Volume.prototype.readEncodedData = function(data, name, callback) {
    var vol = null;

    try {
        this.fileName = name;
        this.onFinishedRead = callback;

        this.headerType = this.findFileType(this.fileName);
        this.compressed = this.fileIsCompressed(this.fileName);

        vol = this;

        vol.rawData = Base64Binary.decodeArrayBuffer(data);

        this.fileLength = vol.rawData.byteLength;

        vol.decompress(vol);
   } catch (err) {
       if (vol) {
           vol.errorMessage = "There was a problem reading that file:\n\n" + err.message;
           vol.finishedLoad();
       }
   }
};




papaya.volume.Volume.prototype.getVoxelAtIndex = function(ctrX, ctrY, ctrZ, useNN) {
	return this.transform.getVoxelAtIndex(ctrX, ctrY, ctrZ, useNN);
};




papaya.volume.Volume.prototype.getVoxelAtCoordinate = function(xLoc, yLoc, zLoc, useNN) {
    return this.transform.getVoxelAtCoordinate(xLoc, yLoc, zLoc, useNN);
};




papaya.volume.Volume.prototype.hasError = function() {
	return (this.errorMessage != null);
};



papaya.volume.Volume.prototype.getXDim = function() {
	return this.header.imageDimensions.xDim;
};


papaya.volume.Volume.prototype.getYDim = function() {
	return this.header.imageDimensions.yDim;
};


papaya.volume.Volume.prototype.getZDim = function() {
	return this.header.imageDimensions.zDim;
};


papaya.volume.Volume.prototype.getXSize = function() {
	return this.header.voxelDimensions.xSize;
};


papaya.volume.Volume.prototype.getYSize = function() {
	return this.header.voxelDimensions.ySize;
};



papaya.volume.Volume.prototype.getZSize = function() {
	return this.header.voxelDimensions.zSize;
};


papaya.volume.Volume.prototype.readData = function(vol, blob) {
    try {
        var reader = new FileReader();

	    reader.onloadend = bind(vol, function(evt) {
		    if (evt.target.readyState == FileReader.DONE) {
		    	vol.rawData = evt.target.result;
		    	setTimeout(function(){vol.decompress(vol)}, 0);
		    }
	    });

        reader.onerror = bind(vol, function(evt) {
            vol.errorMessage = "There was a problem reading that file:\n\n" + evt.getMessage();
            vol.finishedLoad();
        });

        reader.readAsArrayBuffer(blob);
   } catch (err) {
        vol.errorMessage = "There was a problem reading that file:\n\n" + err.message;
        vol.finishedLoad();
   }
};



papaya.volume.Volume.prototype.decompress = function(vol) {
	if (vol.compressed) {
		var gunzip = new Gunzip();
		gunzip.gunzip(vol.rawData, function(data){vol.finishedDecompress(vol, data)});

		if (gunzip.hasError()) {
			vol.errorMessage = gunzip.getError();
			vol.finishedLoad();
		}
	} else {
		setTimeout(function(){vol.finishedReadData(vol)}, 0);
	}
};


papaya.volume.Volume.prototype.finishedDecompress = function(vol, data) {
	vol.rawData = data;
	setTimeout(function(){vol.finishedReadData(vol)}, 0);
};



papaya.volume.Volume.prototype.finishedReadData = function(vol) {
    vol.header.readData(vol.headerType, vol.rawData, this.compressed);
    vol.header.imageType.swapped = (vol.header.imageType.littleEndian != isPlatformLittleEndian());

	if (vol.header.hasError()) {
		vol.errorMessage = vol.header.errorMessage;
		vol.onFinishedRead(vol);
		return;
	}

	vol.imageData.readData(vol.header, vol.rawData, bind(vol, vol.finishedLoad));
};


papaya.volume.Volume.prototype.finishedLoad = function() {
    if (this.onFinishedRead) {
        if (!this.hasError()) {
            this.transform = new papaya.volume.Transform(papaya.volume.Transform.IDENTITY.clone(), this);
        }

        this.isLoaded = true;
        this.rawData = null;
		this.onFinishedRead(this);
	}
};
