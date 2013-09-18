
var papaya = papaya || {};
papaya.viewer = papaya.viewer || {};


papaya.viewer.ScreenVolume = papaya.viewer.ScreenVolume || function(vol, lutName, baseImage) {
    this.volume = vol;
    this.lutName = lutName;
    this.colorTable = new papaya.viewer.ColorTable(lutName, baseImage, true);
    this.screenMin = this.volume.header.imageRange.displayMin;
    this.screenMax = this.volume.header.imageRange.displayMax;
    this.imageMin = this.volume.header.imageRange.imageMin;
    this.imageMax = this.volume.header.imageRange.imageMax;
    this.alpha = 1.0;
    this.findImageRange();
    this.findDisplayRange();
    this.updateScreenRange();
}



papaya.viewer.ScreenVolume.prototype.setScreenRange = function(min, max) {
    this.screenMin = min;
    this.screenMax = max;
    this.updateScreenRange();
}



papaya.viewer.ScreenVolume.prototype.updateScreenRange = function() {
    this.screenRatio = (papaya.viewer.ScreenSlice.SCREEN_PIXEL_MAX / (this.screenMax - this.screenMin));
}


papaya.viewer.ScreenVolume.prototype.isOverlay = function() {
    return !this.colorTable.isBaseImage;
}





papaya.viewer.ScreenVolume.prototype.findImageRange = function() {
    var hasImageRange = (this.imageMin != this.imageMax);

    if (!hasImageRange) {
        var min = Number.MAX_VALUE;
        var max = Number.MIN_VALUE;

        var xDim = this.volume.header.imageDimensions.xDim;
        var yDim = this.volume.header.imageDimensions.yDim;
        var zDim = this.volume.header.imageDimensions.zDim;

        for (var ctrZ = 0; ctrZ < zDim; ctrZ++) {
            for (var ctrY = 0; ctrY < yDim; ctrY++) {
                for (var ctrX = 0; ctrX < xDim; ctrX++) {
                    var value = this.volume.getVoxelAtIndex(ctrX, ctrY, ctrZ);

                    if (value > max) {
                        max = value;
                    }

                    if (value < min) {
                        min = value;
                    }
                }
            }
        }
    }
}



papaya.viewer.ScreenVolume.prototype.findDisplayRange = function() {
    var min = this.screenMin;
    var max = this.screenMax;

    if (this.isOverlay()) {
        if ((min == max) || ((min < 0) && (max > 0))) {  // if not set or crosses zero
            min = this.imageMax - (this.imageMax * .75);
            max = this.imageMax - (this.imageMax * .25);
        }

        if (!((min < 1) && (min > -1) && (max < 1) && (max > -1))) { // if not small numbers, round
            min = Math.round(min);
            max = Math.round(max);
        }
    } else {
        if (!((min < 1) && (min > -1) && (max < 1) && (max > -1))) {  // if not small numbers, round
            min = Math.round(min);
            max = Math.round(max);
        }

        if ((min == 0) && (max == 0)) { // if not found, for some reason, e.g., data not centered in image
            min = this.imageMin;
            max = this.imageMax;
        }

        if (!(max > min)) { // sanity check
            min = this.imageMin;
            max = this.imageMax;
        }

        if (min < this.imageMin) {
            min = this.imageMin;
        }

        if (max > this.imageMax) {
            max = this.imageMax;
        }
    }

    this.screenMin = min;
    this.screenMax = max;
}


papaya.viewer.ScreenVolume.prototype.isUsingColorTable = function(lutName) {
    return (this.lutName == lutName);
}



papaya.viewer.ScreenVolume.prototype.changeColorTable = function(lutName) {
    this.colorTable = new papaya.viewer.ColorTable(lutName, !this.isOverlay(), true);
    this.lutName = lutName;
    papayaMain.papayaViewer.drawViewer(true);
}