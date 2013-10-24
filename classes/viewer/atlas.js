
/*jslint browser: true, node: true */
/*global bind */

"use strict";

var papaya = papaya || {};
papaya.viewer = papaya.viewer || {};



papaya.viewer.Atlas = papaya.viewer.Atlas || function (atlasData, atlasImage, atlasLabels) {
    this.name = null;
    this.atlasData = atlasData;
    this.atlasImage = atlasImage;
    this.atlasLabels = atlasLabels;
    this.volume = new papaya.volume.Volume();
    this.displayColumns = new Array(4);
    this.labels = new Array(4);
    this.numLabels = 0;

    if (this.atlasData) {
        this.volume.readEncodedData(this.atlasData, papaya.data.Atlas.name, bind(this, this.readFinished));
    } else if (this.atlasImage) {
        this.volume.readURL(this.atlasImage, bind(this, this.readFinished));
    }
};



papaya.viewer.Atlas.MAX_LABELS = 4;



papaya.viewer.Atlas.prototype.getLabelAtCoordinate = function (xLoc, yLoc, zLoc) {
    var labelString, labelsCurrent, ctr;

    labelString = this.atlasLabels.atlas.data.label[this.volume.getVoxelAtCoordinate(xLoc, yLoc, zLoc, true)];
    labelsCurrent = labelString.split(":");

    for (ctr = 0; ctr < this.numLabels; ctr += 1) {
        this.labels[ctr] = labelsCurrent[this.displayColumns[ctr]];
    }

    return this.labels;
};



papaya.viewer.Atlas.prototype.readFinished = function () {
    var index, columns, ctr;

    index = 0;
    columns = this.atlasLabels.atlas.header.display.split(".");

    for (ctr = 0; ctr < columns.length; ctr += 1) {
        if (columns[ctr] === "*") {
            this.displayColumns[index] = ctr;
            index += 1;
        }
    }

    this.numLabels = index;
    this.name = this.atlasLabels.atlas.header.name;
};
