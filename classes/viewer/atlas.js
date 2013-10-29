
/*jslint browser: true, node: true */
/*global bind, isString, papayaMain, deref */

"use strict";

var papaya = papaya || {};
papaya.viewer = papaya.viewer || {};


// only supports Label, not Probabilistic type; assumes label indices go from 0 to n-1 (with no gaps); assumes labels use place holders
papaya.viewer.Atlas = papaya.viewer.Atlas || function (atlas) {
    this.name = null;
    this.transformedname = null;
    this.atlasLabels = atlas.labels;
    this.volume = new papaya.volume.Volume();
    this.displayColumns = new Array(4);
    this.labels = new Array(4);
    this.numLabels = 0;
    this.transform = null;
    this.currentAtlas = null;

    var loadableImage = papayaMain.findLoadableImage(atlas.labels.atlas.header.images.summaryimagefile);

    if ((loadableImage !== null) && (loadableImage.encode !== undefined)) {
        this.volume.readEncodedData(loadableImage.encode, bind(this, this.readFinished));
    } else if ((loadableImage !== null) && (loadableImage.url !== undefined)) {
        this.volume.readURL(loadableImage.url, bind(this, this.readFinished));
    }
};



papaya.viewer.Atlas.MAX_LABELS = 4;



papaya.viewer.Atlas.prototype.getLabelAtCoordinate = function (xLoc, yLoc, zLoc) {
    var labelString, labelsCurrent, ctr, xTrans, yTrans, zTrans;

    if (this.transform && (this.currentAtlas === this.transformedname)) {
        xTrans = ((xLoc * this.transform[0][0]) + (yLoc * this.transform[0][1]) + (zLoc * this.transform[0][2]) + (this.transform[0][3]));
        yTrans = ((xLoc * this.transform[1][0]) + (yLoc * this.transform[1][1]) + (zLoc * this.transform[1][2]) + (this.transform[1][3]));
        zTrans = ((xLoc * this.transform[2][0]) + (yLoc * this.transform[2][1]) + (zLoc * this.transform[2][2]) + (this.transform[2][3]));
    } else {
        xTrans = xLoc;
        yTrans = yLoc;
        zTrans = zLoc;
    }

    labelString = this.getLabelString(this.volume.getVoxelAtCoordinate(xTrans, yTrans, zTrans, true));

    if (labelString) {
        labelsCurrent = labelString.split(/\.|:/);

        for (ctr = 0; ctr < this.numLabels; ctr += 1) {
            this.labels[ctr] = labelsCurrent[this.displayColumns[ctr]];
        }
    } else {
        for (ctr = 0; ctr < this.numLabels; ctr += 1) {
            this.labels[ctr] = "";
        }
    }

    return this.labels;
};



papaya.viewer.Atlas.prototype.readFinished = function () {
    this.findNumLabels();
    this.parseTransform();
    this.name = this.atlasLabels.atlas.header.name;
    this.currentAtlas = this.name;

    if (this.atlasLabels.atlas.header.transformedname) {
        this.transformedname = this.atlasLabels.atlas.header.transformedname;
    }
};



papaya.viewer.Atlas.prototype.findNumLabels = function () {
    var index, columns, ctr, testStr, testStrSplit;

    if (this.atlasLabels.atlas.header.display) {  // uses "display" attribute
        index = 0;
        columns = this.atlasLabels.atlas.header.display.split(".");

        for (ctr = 0; ctr < columns.length; ctr += 1) {
            if (columns[ctr] === "*") {
                this.displayColumns[index] = ctr;
                index += 1;
            }
        }

        this.numLabels = index;
    } else {  // parse first label to find number of parts
        testStr = this.getLabelString(0);
        testStrSplit = testStr.split(/\.|:/);

        for (ctr = 0; ctr < testStrSplit.length; ctr += 1) {
            this.displayColumns[ctr] = ctr;
        }

        this.numLabels = testStrSplit.length;
    }
};



papaya.viewer.Atlas.prototype.parseTransform = function () {
    var parts, ctrOut, ctrIn;

    if (this.atlasLabels.atlas.header.transform) {
        parts = this.atlasLabels.atlas.header.transform.split(" ");
        this.transform = papaya.volume.Transform.IDENTITY.clone();

        if (parts.length === 16) {
            for (ctrOut = 0; ctrOut < 4; ctrOut += 1) {
                for (ctrIn = 0; ctrIn < 4; ctrIn += 1) {
                    this.transform[ctrOut][ctrIn] = parseFloat(parts[(ctrOut * 4) + ctrIn]);
                }
            }
        }
    }
};



papaya.viewer.Atlas.prototype.getLabelString = function (val) {
    var label;

    if (this.atlasLabels.atlas.data.label) {
        label = this.atlasLabels.atlas.data.label[val];

        if (label.content) {
            return label.content;
        }

        return label;
    }

    return "";
};
