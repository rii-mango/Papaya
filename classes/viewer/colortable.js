
var papaya = papaya || {};
papaya.viewer = papaya.viewer || {};


papaya.viewer.ColorTable = papaya.viewer.ColorTable || function(lut, baseImage, gradation) {
	this.lut = lut;
    this.maxLUT, this.minLUT;
    this.knotThresholds = new Array();
    this.knotRangeRatios = new Array();

    this.LUTarrayG = new Array(256);
    this.LUTarrayR = new Array(256);
    this.LUTarrayB = new Array(256);
    this.isBaseImage = baseImage;

    this.knotMin = this.lut[0];
    this.knotMax = this.lut[this.lut.length - 1];
    this.useGradation = gradation;

    this.updateLUT(papaya.viewer.ColorTable.LUT_MAX, papaya.viewer.ColorTable.LUT_MIN);
}

papaya.viewer.ColorTable.TABLE_GRAYSCALE = [[0, 0, 0, 0], [1, 1, 1, 1]];
papaya.viewer.ColorTable.TABLE_SPECTRUM = [[0, 0, 0, 0], [.1, 0, 0, 1], [.33, 0, 1, 1], [.5, 0, 1, 0], [.66, 1, 1, 0], [.9, 1, 0, 0], [1, 1, 1, 1]];
papaya.viewer.ColorTable.TABLE_HOTANDCOLD = [[0, 0, 0, 1], [.15, 0, 1, 1], [.3, 0, 1, 0], [.45, 0, 0, 0], [.5, 0, 0, 0], [.55, 0, 0, 0], [.7, 1, 1, 0], [.85, 1, 0, 0], [1, 1, 1, 1]];
papaya.viewer.ColorTable.TABLE_GOLD =  [[0, 0, 0, 0], [.13, .19, .03, 0], [.25, .39, .12, 0], [.38, .59, .26, 0], [.50, .80, .46, .08], [.63, .99, .71, .21], [.75, .99, .88, .34], [.88, .99, .99, .48], [1, .90, .95, .61]];
papaya.viewer.ColorTable.TABLE_RED2WHITE = [[0, 1, 0, 0], [1, 1, 1, 1]];
papaya.viewer.ColorTable.TABLE_GREEN2WHITE = [[0, 0, 1, 0], [1, 1, 1, 1]];
papaya.viewer.ColorTable.TABLE_BLUE2WHITE = [[0, 0, 0, 1], [1, 1, 1, 1]];
papaya.viewer.ColorTable.TABLE_ORANGE2WHITE = [[0, 1, .5, 0], [1, 1, 1, 1]];
papaya.viewer.ColorTable.TABLE_PURPLE2WHITE = [[0, .5, 0, 1], [1, 1, 1, 1]];

papaya.viewer.ColorTable.MAP = {"Grayscale":papaya.viewer.ColorTable.TABLE_GRAYSCALE, "Spectrum":papaya.viewer.ColorTable.TABLE_SPECTRUM, "Hot-and-Cold":papaya.viewer.ColorTable.TABLE_HOTANDCOLD, "Gold":papaya.viewer.ColorTable.TABLE_GOLD,
    "Red-to-White":papaya.viewer.ColorTable.TABLE_RED2WHITE, "Green-to-White":papaya.viewer.ColorTable.TABLE_GREEN2WHITE, "Blue-to-White":papaya.viewer.ColorTable.TABLE_BLUE2WHITE, "Orange-to-White":papaya.viewer.ColorTable.TABLE_ORANGE2WHITE,
    "Purple-to-White":papaya.viewer.ColorTable.TABLE_PURPLE2WHITE};
papaya.viewer.ColorTable.LUT_MIN = 0;
papaya.viewer.ColorTable.LUT_MAX = 255;



papaya.viewer.ColorTable.prototype.updateLUT = function(maxLUTnew, minLUTnew) {
    maxLUT = maxLUTnew;
    minLUT = minLUTnew;

    var range = maxLUT - minLUT;

    for (ctr = 0; ctr < this.lut.length; ctr++) {
        this.knotThresholds[ctr] = (this.lut[ctr][0] * range) + minLUT;
    }

    for (ctr = 0; ctr < (this.lut.length - 1); ctr++) {
        this.knotRangeRatios[ctr] = papaya.viewer.ColorTable.LUT_MAX / (this.knotThresholds[ctr + 1] - this.knotThresholds[ctr]);
    }

    for (ctr = 0; ctr < 256; ctr++) {
        if (ctr <= minLUT) {
            this.LUTarrayR[ctr] = this.knotMin[1];
            this.LUTarrayG[ctr] = this.knotMin[2];
            this.LUTarrayB[ctr] = this.knotMin[3];
        } else if (ctr > maxLUT) {
            this.LUTarrayR[ctr] = this.knotMax[1];
            this.LUTarrayG[ctr] = this.knotMax[2];
            this.LUTarrayB[ctr] = this.knotMax[3];
        } else {
            for (ctrKnot = 0; ctrKnot < (this.lut.length - 1); ctrKnot++) {
                if ((ctr > this.knotThresholds[ctrKnot]) && (ctr <= this.knotThresholds[ctrKnot + 1])) {
                    if (this.useGradation) {
                        var value = (((ctr - this.knotThresholds[ctrKnot]) * this.knotRangeRatios[ctrKnot]) + .5) / papaya.viewer.ColorTable.LUT_MAX;

                        this.LUTarrayR[ctr] = (((1 - value) * this.lut[ctrKnot][1]) + (value * this.lut[ctrKnot + 1][1])) * papaya.viewer.ColorTable.LUT_MAX;
                        this.LUTarrayG[ctr] = (((1 - value) * this.lut[ctrKnot][2]) + (value * this.lut[ctrKnot + 1][2])) * papaya.viewer.ColorTable.LUT_MAX;
                        this.LUTarrayB[ctr] = (((1 - value) * this.lut[ctrKnot][3]) + (value * this.lut[ctrKnot + 1][3])) * papaya.viewer.ColorTable.LUT_MAX;
                    } else {
                        this.LUTarrayR[ctr] = (this.lut[ctrKnot][1]) * papaya.viewer.ColorTable.LUT_MAX;
                        this.LUTarrayG[ctr] = (this.lut[ctrKnot][2]) * papaya.viewer.ColorTable.LUT_MAX;
                        this.LUTarrayB[ctr] = (this.lut[ctrKnot][3]) * papaya.viewer.ColorTable.LUT_MAX;
                    }
                }
            }
        }
    }
}


papaya.viewer.ColorTable.prototype.lookupRed = function(index) {
    if ((index >= 0) && (index < 256)) {
        return (this.LUTarrayR[index] & 0xff);
    } else {
        return 0;
    }
}



papaya.viewer.ColorTable.prototype.lookupGreen = function(index) {
    if ((index >= 0) && (index < 256)) {
        return (this.LUTarrayG[index] & 0xff);
    } else {
        return 0;
    }
}



papaya.viewer.ColorTable.prototype.lookupBlue = function(index) {
    if ((index >= 0) && (index < 256)) {
        return (this.LUTarrayB[index] & 0xff);
    } else {
        return 0;
    }
}
