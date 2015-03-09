
/*jslint browser: true, node: true */
/*global */

"use strict";

/*** Imports ***/
var papaya = papaya || {};
papaya.viewer = papaya.viewer || {};


/*** Constructor ***/
papaya.viewer.Display = papaya.viewer.Display || function (container, width) {
    this.container = container;
    this.viewer = container.viewer;
    this.canvas = document.createElement("canvas");
    this.canvas.width = width;
    this.canvas.height = papaya.viewer.Display.SIZE;
    this.context = this.canvas.getContext("2d");
    this.canvas.style.padding = 0;
    this.canvas.style.margin = 0;
    this.canvas.style.border = "none";
    this.canvas.style.cursor = "default";
    this.tempCoord = new papaya.core.Coordinate(0, 0, 0);
    this.drawingError = false;
    this.progress = 0;
    this.progressStartTime = 0;
    this.progressTimeout = null;
    this.drawingProgress = false;
    this.errorMessage = "";

    this.drawUninitializedDisplay();
};


/*** Static Pseudo-constants ***/

papaya.viewer.Display.SIZE = 50;

papaya.viewer.Display.MINI_LABELS_THRESH = 700;

papaya.viewer.Display.PADDING = 8;

papaya.viewer.Display.FONT_COLOR_WHITE = "white";
papaya.viewer.Display.FONT_COLOR_ORANGE = "rgb(182, 59, 0)";

papaya.viewer.Display.FONT_SIZE_COORDINATE_LABEL = 12;
papaya.viewer.Display.FONT_COLOR_COORDINATE_LABEL = papaya.viewer.Display.FONT_COLOR_WHITE;
papaya.viewer.Display.FONT_TYPE_COORDINATE_LABEL = "Arial";

papaya.viewer.Display.FONT_SIZE_COORDINATE_VALUE = 18;
papaya.viewer.Display.FONT_COLOR_COORDINATE_VALUE = papaya.viewer.Display.FONT_COLOR_ORANGE;
papaya.viewer.Display.FONT_TYPE_COORDINATE_VALUE = "Arial";
papaya.viewer.Display.PRECISION_COORDINATE_VALUE = 5;
papaya.viewer.Display.PRECISION_COORDINATE_MAX = 12;

papaya.viewer.Display.FONT_SIZE_IMAGE_VALUE = 20;
papaya.viewer.Display.FONT_COLOR_IMAGE_VALUE = papaya.viewer.Display.FONT_COLOR_WHITE;
papaya.viewer.Display.FONT_TYPE_IMAGE_VALUE = "Arial";
papaya.viewer.Display.PRECISION_IMAGE_VALUE = 9;
papaya.viewer.Display.PRECISION_IMAGE_MAX = 14;

papaya.viewer.Display.FONT_SIZE_ATLAS_MINI = 14;
papaya.viewer.Display.FONT_SIZE_ATLAS = 20;
papaya.viewer.Display.FONT_TYPE_ATLAS = "Arial";

papaya.viewer.Display.FONT_SIZE_MESSAGE_VALUE = 20;
papaya.viewer.Display.FONT_TYPE_MESSAGE_VALUE = "Arial";
papaya.viewer.Display.FONT_COLOR_MESSAGE = "rgb(200, 75, 25)";

papaya.viewer.Display.PROGRESS_LABEL_SUFFIX = ["...", "", ".", ".."];
papaya.viewer.Display.PROGRESS_LABEL_DEFAULT = "Loading";


/*** Prototype Methods ***/

papaya.viewer.Display.prototype.drawUninitializedDisplay = function () {
    this.context.fillStyle = "#000000";
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
};



papaya.viewer.Display.prototype.canDraw = function () {
    return !(this.drawingError || this.drawingProgress);
};



papaya.viewer.Display.prototype.drawEmptyDisplay = function () {
    if (this.canDraw()) {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.fillStyle = "#000000";
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else if (this.drawError) {
        this.drawError(this.errorMessage);
    }
};



papaya.viewer.Display.prototype.drawDisplay = function (xLoc, yLoc, zLoc) {
    var locY, val, viewerOrigin, height, atlasNumLabels, atlasLabelWidth, atlasLabel, ctr, metricsAtlas, sizeRatio,
        viewerVoxelDims, labelColorThresh, halfWidth, coordinateItemWidth, smallViewer, precision;

    if (this.canDraw()) {
        // initialize
        sizeRatio = this.viewer.canvas.width / 600.0;
        halfWidth = this.viewer.canvas.width / 2.0;
        coordinateItemWidth = halfWidth / 5.0;
        height = this.canvas.height;
        smallViewer = (halfWidth < 300);

        if (this.container.preferences.atlasLocks !== "Mouse") {
            xLoc = this.viewer.currentCoord.x;
            yLoc = this.viewer.currentCoord.y;
            zLoc = this.viewer.currentCoord.z;
        }


        // canvas background
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.fillStyle = "#000000";
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);


        // coordinate labels
        this.context.fillStyle = papaya.viewer.Display.FONT_COLOR_COORDINATE_LABEL;
        this.context.font = papaya.viewer.Display.FONT_SIZE_COORDINATE_LABEL + "px " +
            papaya.viewer.Display.FONT_TYPE_COORDINATE_LABEL;

        locY = papaya.viewer.Display.FONT_SIZE_COORDINATE_LABEL + papaya.viewer.Display.PADDING * 0.75;

        this.context.fillText("x", 1.5 * papaya.viewer.Display.PADDING, locY);
        this.context.fillText("y", 1.5 * papaya.viewer.Display.PADDING + coordinateItemWidth, locY);
        this.context.fillText("z", 1.5 * papaya.viewer.Display.PADDING + (2 * coordinateItemWidth), locY);


        // coordinate values
        locY += papaya.viewer.Display.FONT_SIZE_COORDINATE_VALUE + papaya.viewer.Display.PADDING / 2;

        this.context.fillStyle = papaya.viewer.Display.FONT_COLOR_COORDINATE_VALUE;
        this.context.font = (papaya.viewer.Display.FONT_SIZE_COORDINATE_VALUE - (smallViewer ? 2 : 0)) + "px " +
            papaya.viewer.Display.FONT_TYPE_COORDINATE_VALUE;

        if (this.viewer.worldSpace) {
            viewerOrigin = this.viewer.screenVolumes[0].volume.header.origin;  // base image origin
            viewerVoxelDims = this.viewer.screenVolumes[0].volume.header.voxelDimensions;
            precision = Math.min(papaya.viewer.Display.PRECISION_COORDINATE_MAX,
                (Math.round(papaya.viewer.Display.PRECISION_COORDINATE_VALUE * sizeRatio)));
            this.context.fillText(parseFloat(((xLoc - viewerOrigin.x) * viewerVoxelDims.xSize).toString().substr(0,
                precision)), 1.5 * papaya.viewer.Display.PADDING, locY);
            this.context.fillText(parseFloat(((viewerOrigin.y - yLoc) * viewerVoxelDims.ySize).toString().substr(0,
                precision)), 1.5 * papaya.viewer.Display.PADDING + coordinateItemWidth, locY);
            this.context.fillText(parseFloat(((viewerOrigin.z - zLoc) * viewerVoxelDims.zSize).toString().substr(0,
                precision)), 1.5 * papaya.viewer.Display.PADDING + (2 * coordinateItemWidth), locY);
        } else {
            this.context.fillText(Math.round(xLoc).toString(), 1.5 * papaya.viewer.Display.PADDING, locY);
            this.context.fillText(Math.round(yLoc).toString(), 1.5 * papaya.viewer.Display.PADDING +
                coordinateItemWidth, locY);
            this.context.fillText(Math.round(zLoc).toString(), 1.5 * papaya.viewer.Display.PADDING +
                (2 * coordinateItemWidth), locY);
        }


        // image value
        val = this.viewer.getCurrentValueAt(xLoc, yLoc, zLoc);
        this.canvas.currentval = val.toString();  // for unit testing

        locY = (height / 2.0) + (papaya.viewer.Display.FONT_SIZE_IMAGE_VALUE / 2.0) -
            (papaya.viewer.Display.PADDING / 2.0);
        this.context.fillStyle = papaya.viewer.Display.FONT_COLOR_IMAGE_VALUE;
        this.context.font = (papaya.viewer.Display.FONT_SIZE_IMAGE_VALUE - (smallViewer ? 2 : 0)) + "px " +
            papaya.viewer.Display.FONT_TYPE_IMAGE_VALUE;
        precision = Math.min(papaya.viewer.Display.PRECISION_IMAGE_MAX,
            Math.round(papaya.viewer.Display.PRECISION_IMAGE_VALUE * sizeRatio));
        this.context.fillText(parseFloat(val.toString().substr(0, precision)), (2 * papaya.viewer.Display.PADDING) +
            (3 * coordinateItemWidth), locY);


        // atlas labels
        if (this.viewer.atlas && this.viewer.atlas.volume.isLoaded) {
            this.viewer.getWorldCoordinateAtIndex(xLoc, yLoc, zLoc, this.tempCoord);
            atlasLabel = this.viewer.atlas.getLabelAtCoordinate(this.tempCoord.x, this.tempCoord.y, this.tempCoord.z);
            atlasNumLabels = atlasLabel.length;
            labelColorThresh = Math.ceil(this.viewer.atlas.maxLabels / 2);

            if ((halfWidth < 300) && (atlasNumLabels >= 2)) {
                atlasLabelWidth = halfWidth * 0.75;

                for (ctr = atlasNumLabels - 1; ctr >= 0; ctr -= 1) {
                    if (ctr === (atlasNumLabels - 2)) {
                        this.context.fillStyle = papaya.viewer.Display.FONT_COLOR_ORANGE;
                        this.context.font = papaya.viewer.Display.FONT_SIZE_ATLAS_MINI + "px " +
                            papaya.viewer.Display.FONT_TYPE_ATLAS;
                    } else {
                        this.context.fillStyle = papaya.viewer.Display.FONT_COLOR_WHITE;
                        this.context.font = papaya.viewer.Display.FONT_SIZE_ATLAS_MINI + "px " +
                            papaya.viewer.Display.FONT_TYPE_ATLAS;
                    }

                    metricsAtlas = this.context.measureText(atlasLabel[ctr]);
                    if (metricsAtlas.width > (atlasLabelWidth - 2 * papaya.viewer.Display.PADDING)) {
                        atlasLabel[ctr] = (atlasLabel[ctr].substr(0, Math.round(atlasLabel[ctr].length / 3)) + " ... " +
                        atlasLabel[ctr].substr(atlasLabel[ctr].length - 3, 3));
                    }

                    if (ctr === (atlasNumLabels - 2)) {
                        this.context.fillText(atlasLabel[ctr], halfWidth + (halfWidth * 0.25),
                            papaya.viewer.Display.PADDING * 1.5  + (papaya.viewer.Display.FONT_SIZE_ATLAS_MINI / 2.0));
                    } else if (ctr === (atlasNumLabels - 1)) {
                        this.context.fillText(atlasLabel[ctr], halfWidth + (halfWidth * 0.25),
                            papaya.viewer.Display.PADDING + (height / 2.0) +
                            (papaya.viewer.Display.FONT_SIZE_ATLAS_MINI / 2.0));
                    }
                }
            } else if ((halfWidth < 600) && (atlasNumLabels > 2)) {
                atlasLabelWidth = halfWidth / 2;

                for (ctr = atlasNumLabels - 1; ctr >= 0; ctr -= 1) {
                    if (ctr < labelColorThresh) {
                        this.context.fillStyle = papaya.viewer.Display.FONT_COLOR_ORANGE;
                        this.context.font = papaya.viewer.Display.FONT_SIZE_ATLAS_MINI + "px " +
                            papaya.viewer.Display.FONT_TYPE_ATLAS;
                    } else {
                        this.context.fillStyle = papaya.viewer.Display.FONT_COLOR_WHITE;
                        this.context.font = papaya.viewer.Display.FONT_SIZE_ATLAS_MINI + "px " +
                            papaya.viewer.Display.FONT_TYPE_ATLAS;
                    }

                    metricsAtlas = this.context.measureText(atlasLabel[ctr]);
                    if (metricsAtlas.width > (atlasLabelWidth - papaya.viewer.Display.PADDING * 6)) {
                        atlasLabel[ctr] = (atlasLabel[ctr].substr(0, Math.round(atlasLabel[ctr].length / 3)) +
                            " ... " + atlasLabel[ctr].substr(atlasLabel[ctr].length - 3, 3));
                    }

                    if (ctr === 0) {
                        this.context.fillText(atlasLabel[ctr], halfWidth + papaya.viewer.Display.PADDING * 5,
                            papaya.viewer.Display.PADDING * 1.5  + (papaya.viewer.Display.FONT_SIZE_ATLAS_MINI / 2.0));
                    } else if (ctr === 1) {
                        this.context.fillText(atlasLabel[ctr], halfWidth + papaya.viewer.Display.PADDING * 5,
                            papaya.viewer.Display.PADDING + (height / 2.0) +
                            (papaya.viewer.Display.FONT_SIZE_ATLAS_MINI / 2.0));
                    } else if (ctr === 2) {
                        this.context.fillText(atlasLabel[ctr], halfWidth * 1.5 + papaya.viewer.Display.PADDING * 5,
                            papaya.viewer.Display.PADDING * 1.5  + (papaya.viewer.Display.FONT_SIZE_ATLAS_MINI / 2.0));
                    } else if (ctr === 3) {
                        this.context.fillText(atlasLabel[ctr], halfWidth * 1.5 + papaya.viewer.Display.PADDING * 5,
                            papaya.viewer.Display.PADDING + (height / 2.0) +
                            (papaya.viewer.Display.FONT_SIZE_ATLAS_MINI / 2.0));
                    }
                }
            } else if ((halfWidth < 800) && (atlasNumLabels > 3)) {
                atlasLabelWidth = halfWidth / 3;

                for (ctr = 0; ctr < 4; ctr += 1) {
                    if (ctr < 2) {
                        if (ctr < labelColorThresh) {
                            this.context.fillStyle = papaya.viewer.Display.FONT_COLOR_ORANGE;
                            this.context.font = papaya.viewer.Display.FONT_SIZE_ATLAS_MINI + "px " +
                                papaya.viewer.Display.FONT_TYPE_ATLAS;
                        } else {
                            this.context.fillStyle = papaya.viewer.Display.FONT_COLOR_WHITE;
                            this.context.font = papaya.viewer.Display.FONT_SIZE_ATLAS_MINI + "px " +
                                papaya.viewer.Display.FONT_TYPE_ATLAS;
                        }

                        metricsAtlas = this.context.measureText(atlasLabel[ctr]);
                        if (metricsAtlas.width > (atlasLabelWidth - papaya.viewer.Display.PADDING * 6)) {
                            atlasLabel[ctr] = (atlasLabel[ctr].substr(0, Math.round(atlasLabel[ctr].length / 3)) +
                                " ... " + atlasLabel[ctr].substr(atlasLabel[ctr].length - 3, 3));
                        }

                        if (ctr === 0) {
                            this.context.fillText(atlasLabel[ctr], halfWidth + papaya.viewer.Display.PADDING * 5,
                                papaya.viewer.Display.PADDING * 1.5  +
                                (papaya.viewer.Display.FONT_SIZE_ATLAS_MINI / 2.0));
                        } else if (ctr === 1) {
                            this.context.fillText(atlasLabel[ctr], halfWidth + papaya.viewer.Display.PADDING * 5,
                                papaya.viewer.Display.PADDING + (height / 2.0) +
                                (papaya.viewer.Display.FONT_SIZE_ATLAS_MINI / 2.0));
                        } else if (ctr === 2) {
                            this.context.fillText(atlasLabel[ctr], halfWidth * 1.5 + papaya.viewer.Display.PADDING * 5,
                                papaya.viewer.Display.PADDING * 1.5  +
                                (papaya.viewer.Display.FONT_SIZE_ATLAS_MINI / 2.0));
                        } else if (ctr === 3) {
                            this.context.fillText(atlasLabel[ctr], halfWidth * 1.5 + papaya.viewer.Display.PADDING * 5,
                                papaya.viewer.Display.PADDING + (height / 2.0) +
                                (papaya.viewer.Display.FONT_SIZE_ATLAS_MINI / 2.0));
                        }
                    } else {
                        locY = (height / 2.0) + (papaya.viewer.Display.FONT_SIZE_ATLAS / 2.0) -
                            (papaya.viewer.Display.PADDING / 2.0);

                        if (ctr < labelColorThresh) {
                            this.context.fillStyle = papaya.viewer.Display.FONT_COLOR_ORANGE;
                            this.context.font = papaya.viewer.Display.FONT_SIZE_ATLAS + "px " +
                                papaya.viewer.Display.FONT_TYPE_ATLAS;
                        } else {
                            this.context.fillStyle = papaya.viewer.Display.FONT_COLOR_WHITE;
                            this.context.font = papaya.viewer.Display.FONT_SIZE_ATLAS + "px " +
                                papaya.viewer.Display.FONT_TYPE_ATLAS;
                        }

                        metricsAtlas = this.context.measureText(atlasLabel[ctr]);
                        if (metricsAtlas.width > (atlasLabelWidth - (2 * papaya.viewer.Display.PADDING))) {
                            atlasLabel[ctr] = (atlasLabel[ctr].substr(0, Math.round(atlasLabel[ctr].length / 3)) +
                                " ... " + atlasLabel[ctr].substr(atlasLabel[ctr].length - 3, 3));
                        }

                        if (ctr === 2) {
                            this.context.fillText(atlasLabel[ctr], halfWidth + papaya.viewer.Display.PADDING +
                                atlasLabelWidth, locY);
                        } else if (ctr === 3) {
                            this.context.fillText(atlasLabel[ctr], halfWidth + papaya.viewer.Display.PADDING +
                                (2 * atlasLabelWidth), locY);
                        }
                    }
                }
            } else {
                atlasLabelWidth = halfWidth / atlasNumLabels;
                locY = (height / 2.0) + (papaya.viewer.Display.FONT_SIZE_ATLAS / 2.0) -
                    (papaya.viewer.Display.PADDING / 2.0);

                for (ctr = 0; ctr < atlasNumLabels; ctr += 1) {
                    if (ctr < labelColorThresh) {
                        this.context.fillStyle = papaya.viewer.Display.FONT_COLOR_ORANGE;
                        this.context.font = (papaya.viewer.Display.FONT_SIZE_ATLAS - (smallViewer ? 4 : 0)) + "px " +
                            papaya.viewer.Display.FONT_TYPE_ATLAS;
                    } else {
                        this.context.fillStyle = papaya.viewer.Display.FONT_COLOR_WHITE;
                        this.context.font = (papaya.viewer.Display.FONT_SIZE_ATLAS - (smallViewer ? 4 : 0)) + "px " +
                            papaya.viewer.Display.FONT_TYPE_ATLAS;
                    }

                    metricsAtlas = this.context.measureText(atlasLabel[ctr]);
                    if (metricsAtlas.width > (atlasLabelWidth - (2 * papaya.viewer.Display.PADDING)) -
                            (halfWidth * 0.05 * Math.max(0, 3 - atlasNumLabels))) {
                        atlasLabel[ctr] = (atlasLabel[ctr].substr(0, Math.round(atlasLabel[ctr].length / 3)) + " ... " +
                            atlasLabel[ctr].substr(atlasLabel[ctr].length - 3, 3));
                    }

                    this.context.fillText(atlasLabel[ctr], halfWidth + papaya.viewer.Display.PADDING +
                        (halfWidth * 0.05 * Math.max(0, 3 - atlasNumLabels)) + (ctr * atlasLabelWidth), locY);
                }
            }
        }
    } else if (this.drawError) {
        this.drawError(this.errorMessage);
    }
};



papaya.viewer.Display.prototype.drawError = function (message) {
    var valueLoc, display;

    this.errorMessage = message;
    this.drawingError = true;
    display = this;
    window.setTimeout(papaya.utilities.ObjectUtils.bind(display, function () {display.drawingError = false; }), 3000);

    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.fillStyle = "#000000";
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.fillStyle = "red";
    this.context.font = papaya.viewer.Display.FONT_SIZE_MESSAGE_VALUE + "px " +
        papaya.viewer.Display.FONT_TYPE_MESSAGE_VALUE;

    valueLoc = papaya.viewer.Display.FONT_SIZE_COORDINATE_LABEL + papaya.viewer.Display.PADDING + 1.5 *
        papaya.viewer.Display.PADDING;

    this.context.fillText(message, papaya.viewer.Display.PADDING, valueLoc);
};



papaya.viewer.Display.prototype.drawProgress = function (progress, label) {
    var prog, display, now, progressIndex, yLoc, progressLabel;
    prog = Math.round(progress * 1000);

    if (prog > this.progress) {
        this.progress = prog;

        if (label !== undefined) {
            progressLabel = label;
        } else {
            progressLabel = papaya.viewer.Display.PROGRESS_LABEL_DEFAULT;
        }

        if (this.progressStartTime === 0) {
            this.progressStartTime = new Date().getTime();
            now = this.progressStartTime;
        } else {
            now = new Date().getTime();
        }

        progressIndex = parseInt((now - this.progressStartTime) / 500, 10) % 4;

        if (this.progress >= 990) {
            if (this.progressTimeout) {
                window.clearTimeout(this.progressTimeout);
                this.progressTimeout = null;
            }

            this.drawingProgress = false;
            this.progress = 0;
            this.progressStartTime = 0;
            this.drawEmptyDisplay();
        } else {
            if (this.progressTimeout) {
                window.clearTimeout(this.progressTimeout);
            }

            display = this;
            this.progressTimeout = window.setTimeout(papaya.utilities.ObjectUtils.bind(display, function () {display.drawingProgress = false; }),
                3000);

            // clear background
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.context.fillStyle = "#fff";
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // draw progress block
            this.context.fillStyle = "#000";
            this.context.fillRect(0, 0, this.canvas.width * progress, this.canvas.height);

            // draw progress label
            this.context.font = papaya.viewer.Display.FONT_SIZE_MESSAGE_VALUE + "px " +
                papaya.viewer.Display.FONT_TYPE_MESSAGE_VALUE;
            this.context.fillStyle = papaya.viewer.Display.FONT_COLOR_MESSAGE;
            yLoc = papaya.viewer.Display.FONT_SIZE_COORDINATE_LABEL + papaya.viewer.Display.PADDING + 1.5 *
                papaya.viewer.Display.PADDING;
            this.context.fillText(progressLabel + papaya.viewer.Display.PROGRESS_LABEL_SUFFIX[progressIndex],
                papaya.viewer.Display.PADDING * 2, yLoc);
        }
    }
};
