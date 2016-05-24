
/*jslint browser: true, node: true */
/*global papayaRoundFast */

"use strict";

/*** Imports ***/
var papaya = papaya || {};
papaya.viewer = papaya.viewer || {};


/*** Constructor ***/
papaya.viewer.ScreenSlice = papaya.viewer.ScreenSlice || function (vol, dir, width, height, widthSize, heightSize,
                                                                   screenVols, manager) {
        this.screenVolumes = screenVols;
        this.sliceDirection = dir;
        this.currentSlice = -1;
        this.xDim = width;
        this.yDim = height;
        this.xSize = widthSize;
        this.ySize = heightSize;
        this.canvasMain = document.createElement("canvas");
        this.canvasMain.width = this.xDim;
        this.canvasMain.height = this.yDim;
        this.contextMain = this.canvasMain.getContext("2d");
        this.imageDataDraw = this.contextMain.createImageData(this.xDim, this.yDim);
        this.screenOffsetX = 0;
        this.screenOffsetY = 0;
        this.screenDim = 0;
        this.screenTransform = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
        this.zoomTransform = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
        this.finalTransform = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
        this.radiologicalTransform = [[-1, 0, this.xDim], [0, 1, 0], [0, 0, 1]];
        this.tempTransform = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
        this.tempTransform2 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
        this.screenTransform2 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
        this.finalTransform2 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
        this.imageData = [];
        this.imageData2 = [];
        this.manager = manager;
        this.rulerPoints = [new papaya.core.Point(parseInt(width * 0.25), parseInt(height * 0.25)),
            new papaya.core.Point(parseInt(width * 0.75), parseInt(height * 0.75))];
        this.tempPoint = new papaya.core.Point();
        this.canvasDTILines = null;
        this.contextDTILines = null;
    };


/*** Static Pseudo-constants ***/

papaya.viewer.ScreenSlice.DIRECTION_UNKNOWN = 0;
papaya.viewer.ScreenSlice.DIRECTION_AXIAL = 1;
papaya.viewer.ScreenSlice.DIRECTION_CORONAL = 2;
papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL = 3;
papaya.viewer.ScreenSlice.DIRECTION_TEMPORAL = 4;
papaya.viewer.ScreenSlice.DIRECTION_SURFACE = 5;
papaya.viewer.ScreenSlice.SCREEN_PIXEL_MAX = 255;
papaya.viewer.ScreenSlice.SCREEN_PIXEL_MIN = 0;
papaya.viewer.ScreenSlice.GRAB_RADIUS = 5;
papaya.viewer.ScreenSlice.DTI_COLORS = ['#ff0000', '#00ff00', '#0000ff'];


/*** Prototype Methods ***/

papaya.viewer.ScreenSlice.prototype.updateSlice = function (slice, force) {
    /*jslint bitwise: true */

    var origin, voxelDims, ctr, ctrY, ctrX, value, thresholdAlpha, index, layerAlpha, timepoint, rgb, dti, valueA,
        dtiLines, dtiX1, dtiY1, dtiX2, dtiY2, dtiX1T, dtiY1T, dtiX2T, dtiY2T, dtiXC, dtiYC, valueR, valueG, valueB,
        angle, s, c, dtiColors, dtiLocX, dtiLocY, dtiLocZ, dtiRGB, angle2, dtiAlphaFactor, readFirstRaster = false,
        radioFactor, dtiColorIndex = 0, interpolation, usedRaster = false, worldSpace = this.manager.isWorldMode(),
        originalVal;

    slice = Math.round(slice);

    if ((this.manager.isRadiologicalMode() && this.isRadiologicalSensitive())) {
        radioFactor = -1;
    } else {
        radioFactor = 1;
    }

    if (force || (this.currentSlice !== slice)) {
        this.currentSlice = slice;
        origin = this.screenVolumes[0].volume.header.origin;  // base image origin
        voxelDims = this.screenVolumes[0].volume.header.voxelDimensions;

        this.contextMain.clearRect(0, 0, this.canvasMain.width, this.canvasMain.height);

        if (this.contextDTILines) {
            this.contextDTILines.clearRect(0, 0, this.screenDim, this.screenDim);
        }

        if (this.imageData.length < this.screenVolumes.length) {
            this.imageData = papaya.utilities.ArrayUtils.createArray(this.screenVolumes.length, this.xDim * this.yDim);
            this.imageData2 = papaya.utilities.ArrayUtils.createArray(this.screenVolumes.length, 1);
        }

        for (ctr = 0; ctr < this.screenVolumes.length; ctr += 1) {
            if (this.screenVolumes[ctr].hidden) {
                continue;
            }

            timepoint = this.screenVolumes[ctr].currentTimepoint;
            rgb = this.screenVolumes[ctr].rgb;
            dti = this.screenVolumes[ctr].dti;
            dtiLines = this.screenVolumes[ctr].dtiLines;
            usedRaster |= !dtiLines;
            dtiColors = this.screenVolumes[ctr].dtiColors;
            dtiAlphaFactor = this.screenVolumes[ctr].dtiAlphaFactor;
            interpolation = ((ctr === 0) || this.screenVolumes[ctr].interpolation);
            interpolation &= (this.manager.container.preferences.smoothDisplay === "Yes");

            if (dtiLines) {
                this.updateDTILinesImage();
                this.contextDTILines.lineWidth = 1;

                if (!dtiColors) {
                    this.contextDTILines.strokeStyle = papaya.viewer.ScreenSlice.DTI_COLORS[dtiColorIndex];
                    dtiColorIndex += 1;
                    dtiColorIndex = dtiColorIndex % 3;
                    this.contextDTILines.beginPath();
                }
            }

            for (ctrY = 0; ctrY < this.yDim; ctrY += 1) {
                for (ctrX = 0; ctrX < this.xDim; ctrX += 1) {
                    value = 0;
                    thresholdAlpha = 255;
                    layerAlpha = this.screenVolumes[ctr].alpha;

                    if (rgb) {
                        if (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
                            value = this.screenVolumes[ctr].volume.getVoxelAtIndex(ctrX, ctrY, slice, timepoint, true);
                        } else if (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
                            value = this.screenVolumes[ctr].volume.getVoxelAtIndex(ctrX, slice, ctrY, timepoint, true);
                        } else if (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
                            value = this.screenVolumes[ctr].volume.getVoxelAtIndex(slice, ctrX, ctrY, timepoint, true);
                        }

                        index = ((ctrY * this.xDim) + ctrX) * 4;
                        this.imageData[ctr][index] = value;

                        this.imageDataDraw.data[index] = (value >> 16) & 0xff;
                        this.imageDataDraw.data[index + 1] = (value >> 8) & 0xff;
                        this.imageDataDraw.data[index + 2] = (value) & 0xff;
                        this.imageDataDraw.data[index + 3] = thresholdAlpha;
                    } else if (dti) {
                        if (worldSpace) {
                            if (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
                                dtiLocX = (ctrX - origin.x) * voxelDims.xSize;
                                dtiLocY = (origin.y - ctrY) * voxelDims.ySize;
                                dtiLocZ = (origin.z - slice) * voxelDims.zSize;
                            } else if (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
                                dtiLocX = (ctrX - origin.x) * voxelDims.xSize;
                                dtiLocY = (origin.y - slice) * voxelDims.ySize;
                                dtiLocZ = (origin.z - ctrY) * voxelDims.zSize;
                            } else if (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
                                dtiLocX = (slice - origin.x) * voxelDims.xSize;
                                dtiLocY = (origin.y - ctrX) * voxelDims.ySize;
                                dtiLocZ = (origin.z - ctrY) * voxelDims.zSize;
                            }

                            valueR = this.screenVolumes[ctr].volume.getVoxelAtCoordinate(dtiLocX, dtiLocY, dtiLocZ, 0, !interpolation);
                            valueG = this.screenVolumes[ctr].volume.getVoxelAtCoordinate(dtiLocX, dtiLocY, dtiLocZ, 1, !interpolation);
                            valueB = this.screenVolumes[ctr].volume.getVoxelAtCoordinate(dtiLocX, dtiLocY, dtiLocZ, 2, !interpolation);

                            if (this.screenVolumes[ctr].dtiVolumeMod) {
                                layerAlpha = Math.min(1.0, this.screenVolumes[ctr].dtiVolumeMod.getVoxelAtCoordinate(dtiLocX, dtiLocY, dtiLocZ, 0, !interpolation));
                            }
                        } else {
                            if (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
                                dtiLocX = ctrX * voxelDims.xSize;
                                dtiLocY = ctrY * voxelDims.ySize;
                                dtiLocZ = slice * voxelDims.zSize;
                            } else if (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
                                dtiLocX = ctrX * voxelDims.xSize;
                                dtiLocY = slice * voxelDims.ySize;
                                dtiLocZ = ctrY * voxelDims.zSize;
                            } else if (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
                                dtiLocX = slice * voxelDims.xSize;
                                dtiLocY = ctrX * voxelDims.ySize;
                                dtiLocZ = ctrY * voxelDims.zSize;
                            }

                            valueR = this.screenVolumes[ctr].volume.getVoxelAtMM(dtiLocX, dtiLocY, dtiLocZ, 0, !interpolation);
                            valueG = this.screenVolumes[ctr].volume.getVoxelAtMM(dtiLocX, dtiLocY, dtiLocZ, 1, !interpolation);
                            valueB = this.screenVolumes[ctr].volume.getVoxelAtMM(dtiLocX, dtiLocY, dtiLocZ, 2, !interpolation);

                            if (this.screenVolumes[ctr].dtiVolumeMod) {
                                layerAlpha = Math.min(1.0, this.screenVolumes[ctr].dtiVolumeMod.getVoxelAtMM(dtiLocX, dtiLocY, dtiLocZ, 0, !interpolation));
                            }
                        }

                        index = ((ctrY * this.xDim) + ctrX) * 4;

                        if (dtiLines) {
                            if ((valueR !== 0) || (valueG !== 0) || (valueB !== 0)) {
                                if (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
                                    angle = Math.atan2(radioFactor * valueG, valueR);
                                    angle2 = Math.acos(Math.abs(valueB) / Math.sqrt(valueR * valueR + valueG * valueG + valueB * valueB));
                                } else if (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
                                    angle = Math.atan2(radioFactor * valueB, valueR);
                                    angle2 = Math.acos(Math.abs(valueG) / Math.sqrt(valueR * valueR + valueG * valueG + valueB * valueB));
                                } else if (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
                                    angle = Math.atan2(valueB, valueG);
                                    angle2 = Math.acos(Math.abs(valueR) / Math.sqrt(valueR * valueR + valueG * valueG + valueB * valueB));
                                }

                                angle2 = 1.0 - (angle2 / 1.5708);

                                valueR = papayaRoundFast(Math.abs((255 * valueR)));
                                valueG = papayaRoundFast(Math.abs((255 * valueG)));
                                valueB = papayaRoundFast(Math.abs((255 * valueB)));
                                valueA = papayaRoundFast(255 * layerAlpha);

                                value = (((valueA & 0xFF) << 24) | ((valueR & 0xFF) << 16) | ((valueG & 0xFF) << 8) | (valueB & 0xFF));

                                if (dtiColors) {
                                    this.contextDTILines.beginPath();
                                    dtiRGB = (value & 0x00FFFFFF);
                                    this.contextDTILines.strokeStyle = '#' + papaya.utilities.StringUtils.pad(dtiRGB.toString(16), 6);
                                }

                                this.imageData[ctr][index] = angle;
                                this.imageData2[ctr][index] = value;

                                s = Math.sin(angle);
                                c = Math.cos(angle);

                                dtiXC = (this.finalTransform2[0][2] + (ctrX + 0.5) * this.finalTransform2[0][0]);
                                dtiYC = (this.finalTransform2[1][2] + (ctrY + 0.5) * this.finalTransform2[1][1]);

                                dtiX1 = (this.finalTransform2[0][2] + (ctrX + (0.5 * angle2)) * this.finalTransform2[0][0]);
                                dtiY1 = (this.finalTransform2[1][2] + (ctrY + 0.5) * this.finalTransform2[1][1]);
                                dtiX1T = c * (dtiX1 - dtiXC) - s * (dtiY1 - dtiYC) + dtiXC;
                                dtiY1T = s * (dtiX1 - dtiXC) + c * (dtiY1 - dtiYC) + dtiYC;
                                this.contextDTILines.moveTo(dtiX1T, dtiY1T);

                                dtiX2 = (this.finalTransform2[0][2] + (ctrX + 1 - (0.5 * angle2)) * this.finalTransform2[0][0]);
                                dtiY2 = (this.finalTransform2[1][2] + (ctrY + 0.5) * this.finalTransform2[1][1]);
                                dtiX2T = c * (dtiX2 - dtiXC) - s * (dtiY2 - dtiYC) + dtiXC;
                                dtiY2T = s * (dtiX2 - dtiXC) + c * (dtiY2 - dtiYC) + dtiYC;
                                this.contextDTILines.lineTo(dtiX2T, dtiY2T);

                                if (dtiColors) {
                                    this.contextDTILines.stroke();
                                }
                            } else {
                                this.imageData[ctr][index] = Number.NaN;
                            }
                        } else {
                            if ((valueR !== 0) || (valueG !== 0) || (valueB !== 0)) {
                                layerAlpha = (1 - (((1 - layerAlpha) * dtiAlphaFactor)));
                            } else {
                                layerAlpha = 0;
                            }

                            valueR = papayaRoundFast(Math.abs((255 * valueR)));
                            valueG = papayaRoundFast(Math.abs((255 * valueG)));
                            valueB = papayaRoundFast(Math.abs((255 * valueB)));
                            valueA = papayaRoundFast(255 * layerAlpha);

                            this.imageData[ctr][index] = (((valueA & 0xFF) << 24) | ((valueR & 0xFF) << 16) | ((valueG & 0xFF) << 8) | (valueB & 0xFF));

                            if (!readFirstRaster) {
                                this.imageDataDraw.data[index] = valueR & 0xff;
                                this.imageDataDraw.data[index + 1] = valueG & 0xff;
                                this.imageDataDraw.data[index + 2] = valueB & 0xff;
                                this.imageDataDraw.data[index + 3] = valueA & 0xff;
                            } else {
                                this.imageDataDraw.data[index] = (this.imageDataDraw.data[index] * (1 - layerAlpha) +
                                (valueR & 0xff) * layerAlpha);
                                this.imageDataDraw.data[index + 1] = (this.imageDataDraw.data[index + 1] * (1 - layerAlpha) +
                                (valueG & 0xff) * layerAlpha);
                                this.imageDataDraw.data[index + 2] = (this.imageDataDraw.data[index + 2] * (1 - layerAlpha) +
                                (valueB & 0xff) * layerAlpha);
                                this.imageDataDraw.data[index + 3] = thresholdAlpha;
                            }
                        }
                    } else {
                        if (worldSpace) {
                            if (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
                                value = this.screenVolumes[ctr].volume.getVoxelAtCoordinate((ctrX - origin.x) *
                                    voxelDims.xSize, (origin.y - ctrY) * voxelDims.ySize, (origin.z - slice) *
                                    voxelDims.zSize, timepoint, !interpolation);
                            } else if (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
                                value = this.screenVolumes[ctr].volume.getVoxelAtCoordinate((ctrX - origin.x) *
                                    voxelDims.xSize, (origin.y - slice) * voxelDims.ySize, (origin.z - ctrY) *
                                    voxelDims.zSize, timepoint, !interpolation);
                            } else if (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
                                value = this.screenVolumes[ctr].volume.getVoxelAtCoordinate((slice - origin.x) *
                                    voxelDims.xSize, (origin.y - ctrX) * voxelDims.ySize, (origin.z - ctrY) *
                                    voxelDims.zSize, timepoint, !interpolation);
                            }
                        } else {
                            if (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
                                value = this.screenVolumes[ctr].volume.getVoxelAtMM(ctrX * voxelDims.xSize, ctrY *
                                    voxelDims.ySize, slice * voxelDims.zSize, timepoint, !interpolation);
                            } else if (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
                                value = this.screenVolumes[ctr].volume.getVoxelAtMM(ctrX * voxelDims.xSize, slice *
                                    voxelDims.ySize, ctrY * voxelDims.zSize, timepoint, !interpolation);
                            } else if (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
                                value = this.screenVolumes[ctr].volume.getVoxelAtMM(slice * voxelDims.xSize, ctrX *
                                    voxelDims.ySize, ctrY * voxelDims.zSize, timepoint, !interpolation);
                            }
                        }

                        index = ((ctrY * this.xDim) + ctrX) * 4;
                        originalVal = value;
                        this.imageData[ctr][index] = value;

                        if ((!this.screenVolumes[ctr].negative && (value <= this.screenVolumes[ctr].screenMin)) ||
                            (this.screenVolumes[ctr].negative && (value >= this.screenVolumes[ctr].screenMin)) ||
                            isNaN(value)) {
                            value = papaya.viewer.ScreenSlice.SCREEN_PIXEL_MIN;  // screen value
                            thresholdAlpha = this.screenVolumes[ctr].isOverlay() ? 0 : 255;
                        } else if ((!this.screenVolumes[ctr].negative && (value >= this.screenVolumes[ctr].screenMax)) ||
                            (this.screenVolumes[ctr].negative && (value <= this.screenVolumes[ctr].screenMax))) {
                            value = papaya.viewer.ScreenSlice.SCREEN_PIXEL_MAX;  // screen value
                        } else {
                            value = papayaRoundFast(((value - this.screenVolumes[ctr].screenMin) *
                            this.screenVolumes[ctr].screenRatio));  // screen value
                        }

                        if (!readFirstRaster) {
                            this.imageDataDraw.data[index] = this.screenVolumes[ctr].colorTable.lookupRed(value, originalVal) * layerAlpha;
                            this.imageDataDraw.data[index + 1] = this.screenVolumes[ctr].colorTable.lookupGreen(value, originalVal) * layerAlpha;
                            this.imageDataDraw.data[index + 2] = this.screenVolumes[ctr].colorTable.lookupBlue(value, originalVal) * layerAlpha;
                            this.imageDataDraw.data[index + 3] = thresholdAlpha;
                        } else if (thresholdAlpha > 0) {
                            this.imageDataDraw.data[index] = (this.imageDataDraw.data[index] * (1 - layerAlpha) +
                            this.screenVolumes[ctr].colorTable.lookupRed(value, originalVal) * layerAlpha);
                            this.imageDataDraw.data[index + 1] = (this.imageDataDraw.data[index + 1] * (1 - layerAlpha) +
                            this.screenVolumes[ctr].colorTable.lookupGreen(value, originalVal) * layerAlpha);
                            this.imageDataDraw.data[index + 2] = (this.imageDataDraw.data[index + 2] * (1 - layerAlpha) +
                            this.screenVolumes[ctr].colorTable.lookupBlue(value, originalVal) * layerAlpha);
                            this.imageDataDraw.data[index + 3] = thresholdAlpha;
                        }
                    }
                }
            }

            if (!dtiColors) {
                this.contextDTILines.stroke();
            }

            if (!dtiLines) {
                readFirstRaster = true;
            }
        }

        if (usedRaster) {
            this.contextMain.putImageData(this.imageDataDraw, 0, 0);
        }
    }
};



papaya.viewer.ScreenSlice.prototype.repaint = function (slice, force, worldSpace) {
    /*jslint bitwise: true */

    var ctr, ctrY, ctrX, value, thresholdAlpha, index = 0, layerAlpha, rgb, dti, dtiLines, dtiRGB, angle2,
        dtiXC, dtiYC, dtiX1, dtiX2, dtiY1, dtiY2, dtiX1T, dtiX2T, dtiY1T, dtiY2T, angle, s, c, dtiColors,
        valueR, valueG, valueB, dtiColorIndex = 0, readFirstRaster = false, originalVal;

    slice = Math.round(slice);

    this.currentSlice = slice;

    this.contextMain.clearRect(0, 0, this.canvasMain.width, this.canvasMain.height);

    if (this.contextDTILines) {
        this.contextDTILines.clearRect(0, 0, this.screenDim, this.screenDim);
    }

    if (this.imageData.length === this.screenVolumes.length) {
        for (ctr = 0; ctr < this.screenVolumes.length; ctr += 1) {
            if (this.screenVolumes[ctr].hidden) {
                continue;
            }

            rgb = this.screenVolumes[ctr].rgb;
            dti = this.screenVolumes[ctr].dti;
            dtiLines = this.screenVolumes[ctr].dtiLines;
            dtiColors = this.screenVolumes[ctr].dtiColors;

            if (dtiLines) {
                this.contextDTILines.lineWidth = 1;

                if (!dtiColors) {
                    this.contextDTILines.strokeStyle = papaya.viewer.ScreenSlice.DTI_COLORS[dtiColorIndex];
                    dtiColorIndex += 1;
                    dtiColorIndex = dtiColorIndex % 3;
                    this.contextDTILines.beginPath();
                }
            }

            for (ctrY = 0; ctrY < this.yDim; ctrY += 1) {
                for (ctrX = 0; ctrX < this.xDim; ctrX += 1) {
                    value = this.imageData[ctr][index];
                    thresholdAlpha = 255;
                    layerAlpha = this.screenVolumes[ctr].alpha;

                    index = ((ctrY * this.xDim) + ctrX) * 4;

                    if (rgb) {
                        this.imageDataDraw.data[index] = (value >> 16) & 0xff;
                        this.imageDataDraw.data[index + 1] = (value >> 8) & 0xff;
                        this.imageDataDraw.data[index + 2] = (value) & 0xff;
                        this.imageDataDraw.data[index + 3] = thresholdAlpha;
                    } else if (dti) {
                        if (dtiLines) {
                            angle = this.imageData[ctr][index];

                            if (!isNaN(angle)) {
                                value = this.imageData2[ctr][index];
                                valueR = (value >> 16) & 0xFF;
                                valueG = (value >> 8) & 0xFF;
                                valueB = value & 0xFF;

                                dtiRGB = (value & 0x00FFFFFF);

                                if (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
                                    angle2 = Math.acos(Math.abs(valueB) / Math.sqrt(valueR * valueR + valueG * valueG + valueB * valueB));
                                } else if (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
                                    angle2 = Math.acos(Math.abs(valueG) / Math.sqrt(valueR * valueR + valueG * valueG + valueB * valueB));
                                } else if (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
                                    angle2 = Math.acos(Math.abs(valueR) / Math.sqrt(valueR * valueR + valueG * valueG + valueB * valueB));
                                }

                                angle2 = 1.0 - (angle2 / 1.5708);

                                if (dtiColors) {
                                    this.contextDTILines.beginPath();
                                    this.contextDTILines.strokeStyle = '#' + papaya.utilities.StringUtils.pad(dtiRGB.toString(16), 6);
                                }

                                s = Math.sin(angle);
                                c = Math.cos(angle);

                                dtiXC = (this.finalTransform2[0][2] + (ctrX + 0.5) * this.finalTransform2[0][0]);
                                dtiYC = (this.finalTransform2[1][2] + (ctrY + 0.5) * this.finalTransform2[1][1]);

                                dtiX1 = (this.finalTransform2[0][2] + (ctrX + (0.5 * angle2)) * this.finalTransform2[0][0]);
                                dtiY1 = (this.finalTransform2[1][2] + (ctrY + 0.5) * this.finalTransform2[1][1]);
                                dtiX1T = c * (dtiX1 - dtiXC) - s * (dtiY1 - dtiYC) + dtiXC;
                                dtiY1T = s * (dtiX1 - dtiXC) + c * (dtiY1 - dtiYC) + dtiYC;
                                this.contextDTILines.moveTo(dtiX1T, dtiY1T);

                                dtiX2 = (this.finalTransform2[0][2] + (ctrX + 1 - (0.5 * angle2)) * this.finalTransform2[0][0]);
                                dtiY2 = (this.finalTransform2[1][2] + (ctrY + 0.5) * this.finalTransform2[1][1]);
                                dtiX2T = c * (dtiX2 - dtiXC) - s * (dtiY2 - dtiYC) + dtiXC;
                                dtiY2T = s * (dtiX2 - dtiXC) + c * (dtiY2 - dtiYC) + dtiYC;
                                this.contextDTILines.lineTo(dtiX2T, dtiY2T);

                                if (dtiColors) {
                                    this.contextDTILines.stroke();
                                }
                            }
                        } else {
                            value = this.imageData[ctr][index];
                            dtiRGB = (value & 0x00FFFFFF);

                            if (dtiRGB !== 0) {
                                layerAlpha = (((value >> 24) & 0xff) / 255.0);
                            } else {
                                layerAlpha = 0;
                            }

                            if (!readFirstRaster) {
                                this.imageDataDraw.data[index] = (value >> 16) & 0xff;
                                this.imageDataDraw.data[index + 1] = (value >> 8) & 0xff;
                                this.imageDataDraw.data[index + 2] = (value) & 0xff;
                                this.imageDataDraw.data[index + 3] = (value >> 24) & 0xff;
                            } else {
                                this.imageDataDraw.data[index] = (this.imageDataDraw.data[index] * (1 - layerAlpha) +
                                ((value >> 16) & 0xff) * layerAlpha);
                                this.imageDataDraw.data[index + 1] = (this.imageDataDraw.data[index + 1] * (1 - layerAlpha) +
                                ((value >> 8) & 0xff) * layerAlpha);
                                this.imageDataDraw.data[index + 2] = (this.imageDataDraw.data[index + 2] * (1 - layerAlpha) +
                                ((value) & 0xff) * layerAlpha);
                                this.imageDataDraw.data[index + 3] = thresholdAlpha;
                            }
                        }
                    } else {
                        value = this.imageData[ctr][index];
                        originalVal = value;

                        if ((!this.screenVolumes[ctr].negative && (value <= this.screenVolumes[ctr].screenMin)) ||
                            (this.screenVolumes[ctr].negative && (value >= this.screenVolumes[ctr].screenMin)) ||
                            isNaN(value)) {
                            value = papaya.viewer.ScreenSlice.SCREEN_PIXEL_MIN;  // screen value
                            thresholdAlpha = this.screenVolumes[ctr].isOverlay() ? 0 : 255;
                        } else if ((!this.screenVolumes[ctr].negative && (value >= this.screenVolumes[ctr].screenMax)) ||
                            (this.screenVolumes[ctr].negative && (value <= this.screenVolumes[ctr].screenMax))) {
                            value = papaya.viewer.ScreenSlice.SCREEN_PIXEL_MAX;  // screen value
                        } else {
                            value = papayaRoundFast(((value - this.screenVolumes[ctr].screenMin) *
                            this.screenVolumes[ctr].screenRatio));  // screen value
                        }

                        if (!readFirstRaster) {
                            this.imageDataDraw.data[index] = this.screenVolumes[ctr].colorTable.lookupRed(value, originalVal) * layerAlpha;
                            this.imageDataDraw.data[index + 1] = this.screenVolumes[ctr].colorTable.lookupGreen(value, originalVal) * layerAlpha;
                            this.imageDataDraw.data[index + 2] = this.screenVolumes[ctr].colorTable.lookupBlue(value, originalVal) * layerAlpha;
                            this.imageDataDraw.data[index + 3] = thresholdAlpha;
                        } else if (thresholdAlpha > 0) {
                            this.imageDataDraw.data[index] = (this.imageDataDraw.data[index] * (1 - layerAlpha) +
                            this.screenVolumes[ctr].colorTable.lookupRed(value, originalVal) * layerAlpha);
                            this.imageDataDraw.data[index + 1] = (this.imageDataDraw.data[index + 1] * (1 - layerAlpha) +
                            this.screenVolumes[ctr].colorTable.lookupGreen(value, originalVal) * layerAlpha);
                            this.imageDataDraw.data[index + 2] = (this.imageDataDraw.data[index + 2] * (1 - layerAlpha) +
                            this.screenVolumes[ctr].colorTable.lookupBlue(value, originalVal) * layerAlpha);
                            this.imageDataDraw.data[index + 3] = thresholdAlpha;
                        }
                    }
                }
            }

            if (!dtiColors) {
                this.contextDTILines.stroke();
            }

            if (!dtiLines) {
                readFirstRaster = true;
            }
        }

        this.contextMain.putImageData(this.imageDataDraw, 0, 0);
    } else {
        this.updateSlice(slice, true);
    }
};



papaya.viewer.ScreenSlice.prototype.getRealWidth = function () {
    return this.xDim * this.xSize;
};



papaya.viewer.ScreenSlice.prototype.getRealHeight = function () {
    return this.yDim * this.ySize;
};



papaya.viewer.ScreenSlice.prototype.getXYratio = function () {
    return this.xSize / this.ySize;
};



papaya.viewer.ScreenSlice.prototype.getYXratio = function () {
    return this.ySize / this.xSize;
};



papaya.viewer.ScreenSlice.prototype.getXSize = function () {
    return this.xSize;
};



papaya.viewer.ScreenSlice.prototype.getYSize = function () {
    return this.ySize;
};



papaya.viewer.ScreenSlice.prototype.getXDim = function () {
    return this.xDim;
};



papaya.viewer.ScreenSlice.prototype.getYDim = function () {
    return this.yDim;
};



papaya.viewer.ScreenSlice.prototype.updateZoomTransform = function (zoomFactor, xZoomTrans, yZoomTrans, xPanTrans,
                                                                    yPanTrans, viewer) {
    var xTrans, yTrans, maxTranslateX, maxTranslateY;

    xZoomTrans = (xZoomTrans + 0.5) * (zoomFactor - 1) * -1;
    yZoomTrans = (yZoomTrans + 0.5) * (zoomFactor - 1) * -1;
    xPanTrans = xPanTrans * (zoomFactor - 1);
    yPanTrans = yPanTrans * (zoomFactor - 1);

    // limit pan translation such that it cannot pan out of bounds of image
    xTrans = xZoomTrans + xPanTrans;
    maxTranslateX = -1 * (zoomFactor - 1.0) * this.xDim;
    if (xTrans > 0) {
        xTrans = 0;
    } else if (xTrans < maxTranslateX) {
        xTrans = maxTranslateX;
    }

    yTrans = yZoomTrans + yPanTrans;
    maxTranslateY = -1 * (zoomFactor - 1.0) * this.yDim;
    if (yTrans > 0) {
        yTrans = 0;
    } else if (yTrans < maxTranslateY) {
        yTrans = maxTranslateY;
    }

    // update parent viewer with pan translation (may have been limited by step above)
    if (zoomFactor > 1) {
        if (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
            viewer.panAmountX = (Math.round((xTrans - xZoomTrans) / (zoomFactor - 1)));
            viewer.panAmountY = (Math.round((yTrans - yZoomTrans) / (zoomFactor - 1)));
        } else if (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
            viewer.panAmountX = (Math.round((xTrans - xZoomTrans) / (zoomFactor - 1)));
            viewer.panAmountZ = (Math.round((yTrans - yZoomTrans) / (zoomFactor - 1)));
        } else if (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
            viewer.panAmountY = (Math.round((xTrans - xZoomTrans) / (zoomFactor - 1)));
            viewer.panAmountZ = (Math.round((yTrans - yZoomTrans) / (zoomFactor - 1)));
        }
    }

    // update transform
    this.zoomTransform[0][0] = zoomFactor;
    this.zoomTransform[0][1] = 0;
    this.zoomTransform[0][2] = xTrans;
    this.zoomTransform[1][0] = 0;
    this.zoomTransform[1][1] = zoomFactor;
    this.zoomTransform[1][2] = yTrans;

    this.updateFinalTransform();
};



papaya.viewer.ScreenSlice.prototype.updateFinalTransform = function () {
    var ctrOut, ctrIn;

    if (this.manager.isRadiologicalMode() && this.isRadiologicalSensitive()) {
        for (ctrOut = 0; ctrOut < 3; ctrOut += 1) {
            for (ctrIn = 0; ctrIn < 3; ctrIn += 1) {
                this.tempTransform[ctrOut][ctrIn] = this.screenTransform[ctrOut][ctrIn];
            }
        }

        for (ctrOut = 0; ctrOut < 3; ctrOut += 1) {
            for (ctrIn = 0; ctrIn < 3; ctrIn += 1) {
                this.tempTransform2[ctrOut][ctrIn] =
                    (this.tempTransform[ctrOut][0] * this.radiologicalTransform[0][ctrIn]) +
                    (this.tempTransform[ctrOut][1] * this.radiologicalTransform[1][ctrIn]) +
                    (this.tempTransform[ctrOut][2] * this.radiologicalTransform[2][ctrIn]);
            }
        }

        for (ctrOut = 0; ctrOut < 3; ctrOut += 1) {
            for (ctrIn = 0; ctrIn < 3; ctrIn += 1) {
                this.finalTransform[ctrOut][ctrIn] =
                    (this.tempTransform2[ctrOut][0] * this.zoomTransform[0][ctrIn]) +
                    (this.tempTransform2[ctrOut][1] * this.zoomTransform[1][ctrIn]) +
                    (this.tempTransform2[ctrOut][2] * this.zoomTransform[2][ctrIn]);
            }
        }


        for (ctrOut = 0; ctrOut < 3; ctrOut += 1) {
            for (ctrIn = 0; ctrIn < 3; ctrIn += 1) {
                this.tempTransform[ctrOut][ctrIn] = this.screenTransform2[ctrOut][ctrIn];
            }
        }

        for (ctrOut = 0; ctrOut < 3; ctrOut += 1) {
            for (ctrIn = 0; ctrIn < 3; ctrIn += 1) {
                this.tempTransform2[ctrOut][ctrIn] =
                    (this.tempTransform[ctrOut][0] * this.radiologicalTransform[0][ctrIn]) +
                    (this.tempTransform[ctrOut][1] * this.radiologicalTransform[1][ctrIn]) +
                    (this.tempTransform[ctrOut][2] * this.radiologicalTransform[2][ctrIn]);
            }
        }

        for (ctrOut = 0; ctrOut < 3; ctrOut += 1) {
            for (ctrIn = 0; ctrIn < 3; ctrIn += 1) {
                this.finalTransform2[ctrOut][ctrIn] =
                    (this.tempTransform2[ctrOut][0] * this.zoomTransform[0][ctrIn]) +
                    (this.tempTransform2[ctrOut][1] * this.zoomTransform[1][ctrIn]) +
                    (this.tempTransform2[ctrOut][2] * this.zoomTransform[2][ctrIn]);
            }
        }
    } else {
        for (ctrOut = 0; ctrOut < 3; ctrOut += 1) {
            for (ctrIn = 0; ctrIn < 3; ctrIn += 1) {
                this.finalTransform[ctrOut][ctrIn] =
                    (this.screenTransform[ctrOut][0] * this.zoomTransform[0][ctrIn]) +
                    (this.screenTransform[ctrOut][1] * this.zoomTransform[1][ctrIn]) +
                    (this.screenTransform[ctrOut][2] * this.zoomTransform[2][ctrIn]);
            }
        }

        for (ctrOut = 0; ctrOut < 3; ctrOut += 1) {
            for (ctrIn = 0; ctrIn < 3; ctrIn += 1) {
                this.finalTransform2[ctrOut][ctrIn] =
                    (this.screenTransform2[ctrOut][0] * this.zoomTransform[0][ctrIn]) +
                    (this.screenTransform2[ctrOut][1] * this.zoomTransform[1][ctrIn]) +
                    (this.screenTransform2[ctrOut][2] * this.zoomTransform[2][ctrIn]);
            }
        }
    }
};



papaya.viewer.ScreenSlice.prototype.isRadiologicalSensitive = function () {
    return ((this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) ||
    (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL));
};



papaya.viewer.ScreenSlice.prototype.findProximalRulerHandle = function (xLoc, yLoc) {
    this.tempPoint.x = xLoc;
    this.tempPoint.y = yLoc;

    if (papaya.utilities.MathUtils.lineDistance(this.tempPoint.x, this.tempPoint.y, this.rulerPoints[0].x, this.rulerPoints[0].y) < papaya.viewer.ScreenSlice.GRAB_RADIUS) {
        return this.rulerPoints[0];
    } else if (papaya.utilities.MathUtils.lineDistance(this.tempPoint.x, this.tempPoint.y, this.rulerPoints[1].x, this.rulerPoints[1].y) < papaya.viewer.ScreenSlice.GRAB_RADIUS) {
        return this.rulerPoints[1];
    }

    return null;
};



papaya.viewer.ScreenSlice.prototype.updateDTILinesImage = function () {
    if ((this.canvasDTILines === null) || (this.canvasDTILines.width !== this.screenDim)) {
        this.canvasDTILines = document.createElement("canvas");
        this.canvasDTILines.width = this.screenDim;
        this.canvasDTILines.height = this.screenDim;
        this.contextDTILines = this.canvasDTILines.getContext("2d");
    }
};



papaya.viewer.ScreenSlice.prototype.clearDTILinesImage = function () {
    this.canvasDTILines = null;
    this.contextDTILines = null;
};