
/*jslint browser: true, node: true */
/*global papayaRoundFast */

"use strict";

/*** Imports ***/
var papaya = papaya || {};
papaya.viewer = papaya.viewer || {};


/*** Constructor ***/
papaya.viewer.ScreenSlice = papaya.viewer.ScreenSlice || function (vol, dir, width, height, widthSize, heightSize,
                                                                   screenVols, manager) {
        // Mod 21/10/2020: add custom scale factor to increase viewport resolution by scale factor
        // Ex: scaleFactor = 4 -> final image size will be 4x original size
        this.originalSliceDir = vol.header.orientation.originalSliceDir;
        this.scaleFactor = 1;
        this.screenVolumes = screenVols;
        this.sliceDirection = dir;
        this.currentSlice = -1;
        this.xDim = width;
        this.yDim = height;
        this.xSize = widthSize;
        this.ySize = heightSize;
        this.canvasMain = document.createElement("canvas");
        this.canvasMain.width = this.xDim * this.scaleFactor;
        this.canvasMain.height = this.yDim * this.scaleFactor;
        this.contextMain = this.canvasMain.getContext("2d");
        this.imageDataDraw = this.contextMain.createImageData(this.xDim * this.scaleFactor, this.yDim * this.scaleFactor);
        this.screenOffsetX = 0;
        this.screenOffsetY = 0;
        this.screenDim = 0;
        this.screenWidth = 0;
        this.screenHeight = 0;
        this.screenTransform = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
        this.zoomTransform = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
        this.finalTransform = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
        this.radiologicalTransform = [[-1, 0, this.xDim * this.scaleFactor], [0, 1, 0], [0, 0, 1]];
        this.tempTransform = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
        this.tempTransform2 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
        this.screenTransform2 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
        this.finalTransform2 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
        this.imageData = [];
        this.imageData2 = [];
        this.manager = manager;
        // this.rulerPoints = [new papaya.core.Point(parseInt(width * 0.25), parseInt(height * 0.25)),
        //     new papaya.core.Point(parseInt(width * 0.75), parseInt(height * 0.75))];
        this.rulerPoints = [null, null]
        this.tempPoint = new papaya.core.Point();
        this.canvasDTILines = null;
        this.contextDTILines = null;
        // modification 16/01/2020: add localizers information
        this.localizerLines = {
            xStart: [],
            yStart: [],
            xEnd: [],
            yEnd: [],
        };
        this.localizerCenter = {
            x: null,
            y: null
        };

        // add custom zoom value for each slice
        this.zoomFactor = 1;
        this.zoomLocX = 0;
        this.zoomLocY = 0;
        this.zoomLocZ = 0;
        this.panLocX = 0;
        this.panLocY = 0;
        this.panLocZ = 0;
        this.panAmountX = 0;
        this.panAmountY = 0;
        this.panAmountZ = 0;

        // init worker
        this.workerPool = [];
        this.numOfWorkers = this.manager.canUseMultithreading ? window.navigator.hardwareConcurrency : 0;
        // this.numOfWorkers = 1;
        this.workersFinished = 0;
        this.initWebWorkers(this.numOfWorkers);
        this.drawReady = false;
        if (this.manager.canUseMultithreading)
        this.workerOutputImage = new Int32Array(new SharedArrayBuffer(4 * 4 * this.xDim * this.yDim * this.scaleFactor * this.scaleFactor));
};


/*** Static Pseudo-constants ***/

papaya.viewer.ScreenSlice.DIRECTION_UNKNOWN = 0;
papaya.viewer.ScreenSlice.DIRECTION_AXIAL = 1;
papaya.viewer.ScreenSlice.DIRECTION_CORONAL = 2;
papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL = 3;
papaya.viewer.ScreenSlice.DIRECTION_TEMPORAL = 4;
papaya.viewer.ScreenSlice.DIRECTION_SURFACE = 5;
papaya.viewer.ScreenSlice.DIRECTION_CURVED = 6;
papaya.viewer.ScreenSlice.SCREEN_PIXEL_MAX = 255;
papaya.viewer.ScreenSlice.SCREEN_PIXEL_MIN = 0;
papaya.viewer.ScreenSlice.GRAB_RADIUS = 5;
papaya.viewer.ScreenSlice.DTI_COLORS = ['#ff0000', '#00ff00', '#0000ff'];
papaya.viewer.ScreenSlice.DEFAULT_SCALE = 4;

/*** Prototype Methods ***/

papaya.viewer.ScreenSlice.prototype.updateSlice = function (slice, force, returnSliceImageData) {
    /*jslint bitwise: true */   
    // console.log('updateSlice', slice, this.sliceDirection);
    var origin, voxelDims, ctr, ctrY, ctrX, value, thresholdAlpha, index, layerAlpha, timepoint, rgb, dti, valueA,
        dtiLines, dtiX1, dtiY1, dtiX2, dtiY2, dtiX1T, dtiY1T, dtiX2T, dtiY2T, dtiXC, dtiYC, valueR, valueG, valueB,
        angle, s, c, dtiColors, dtiLocX, dtiLocY, dtiLocZ, dtiRGB, angle2, dtiAlphaFactor, readFirstRaster = false,
        radioFactor, dtiColorIndex = 0, interpolation, usedRaster = false, worldSpace = this.manager.isWorldMode(),
        originalVal;



    // if (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
    //     window.corSlice = this;
    //     console.log('papaya updateSlice finalTransform2', this);
    //     console.table(this.finalTransform2);
    // }
    // console.log('papaya updateSlice with slice', slice);
    slice = Math.round(slice);

    if ((this.manager.isRadiologicalMode() && this.isRadiologicalSensitive())) {
        radioFactor = -1;
    } else {
        radioFactor = 1;
    }

    if (force || (this.currentSlice !== slice)) {
        this.currentSlice = slice; // currentSlice is the Current Slice Number e.g. 32
        this.drawReady = false;
        // console.time(('allocateWorker' + this.sliceDirection));
        origin = this.screenVolumes[0].volume.header.origin;  // base image origin
        voxelDims = this.screenVolumes[0].volume.header.voxelDimensions;
        // console.log('papaya updateSlice canvasMain', this.canvasMain);
        // this.contextMain.clearRect(0, 0, this.canvasMain.width, this.canvasMain.height);

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

            if (this.manager.canUseMultithreading && this.sliceDirection !== papaya.viewer.ScreenSlice.DIRECTION_CURVED) {
                // test new multithread op
                // console.log('CHECK shared', this.screenVolumes[0].volume.header.hasSharedArrayBuffer);
                this.workersFinished = 0;
                this.imageData[0] = [];

                // console.time(('allocateWorker' + this.sliceDirection));
                for (var i = 0; i < this.workerPool.length; i++) {
                    // var sliceProps = this.getWorkerSliceProps(i);
                    this.screenVolumes[ctr].volume.workerGetVoxelAtMM(this.workerPool[i], this.getWorkerSliceProps(i, this.screenVolumes[ctr], slice));
                };
            } else {
                // revert to old single thread op
                // this.scaleFactor = 1;
                var stepping = 1 / this.scaleFactor;
                for (ctrY = 0; ctrY < this.yDim; ctrY += stepping) {
                    for (ctrX = 0; ctrX < this.xDim; ctrX += stepping) {
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
    
                            // index = ((ctrY * this.xDim) + ctrX) * 4;
                            index = ((papayaRoundFast(ctrY * this.scaleFactor) * papayaRoundFast(this.xDim * this.scaleFactor)) + papayaRoundFast(ctrX * this.scaleFactor)) * 4;
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
    
                            // index = ((ctrY * this.xDim) + ctrX) * 4;
                            index = ((papayaRoundFast(ctrY * this.scaleFactor) * papayaRoundFast(this.xDim * this.scaleFactor)) + papayaRoundFast(ctrX * this.scaleFactor)) * 4;

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
                                console.log('WORLDSPACE');
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
                                        voxelDims.ySize, slice * voxelDims.zSize, timepoint, !interpolation, this.sliceDirection);
                                } else if (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
                                    value = this.screenVolumes[ctr].volume.getVoxelAtMM(ctrX * voxelDims.xSize, slice *
                                        voxelDims.ySize, ctrY * voxelDims.zSize, timepoint, !interpolation, this.sliceDirection);
                                } else if (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
                                    value = this.screenVolumes[ctr].volume.getVoxelAtMM(slice * voxelDims.xSize, ctrX *
                                        voxelDims.ySize, ctrY * voxelDims.zSize, timepoint, !interpolation, this.sliceDirection);
                                }
                            }
    
                            // index = ((ctrY * this.xDim) + ctrX) * 4;
                            index = ((papayaRoundFast(ctrY * this.scaleFactor) * papayaRoundFast(this.xDim * this.scaleFactor)) + papayaRoundFast(ctrX * this.scaleFactor)) * 4;
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
                        // testing
                if (this.manager.isPerformanceTest) {
                    this.manager.onTestEnd();
                }

                if (usedRaster) {
                    this.contextMain.putImageData(this.imageDataDraw, 0, 0);
                    this.drawReady = true;
                }
            }

            if (!dtiColors) {
                this.contextDTILines.stroke();
            }

            if (!dtiLines) {
                readFirstRaster = true;
            }
        }


    }
};


papaya.viewer.ScreenSlice.prototype.repaint = function (slice, force, worldSpace) {
    /*jslint bitwise: true */
    // console.log('repaint is called', this.sliceDirection);
    var ctr, ctrY, ctrX, value, thresholdAlpha, index = 0, layerAlpha, rgb, dti, dtiLines, dtiRGB, angle2,
        dtiXC, dtiYC, dtiX1, dtiX2, dtiY1, dtiY2, dtiX1T, dtiX2T, dtiY1T, dtiY2T, angle, s, c, dtiColors,
        valueR, valueG, valueB, dtiColorIndex = 0, readFirstRaster = false, originalVal;

    // slice = Math.round(slice);

    // this.currentSlice = slice;
    if (!this.drawReady) return;
    // if (this.imageDataDraw.data.length !== this.workerOutputImage.length) {
    //     console.log('ImageDataDraw length', this.imageDataDraw.data.length);
    //     console.log('WorkerOutputImage length', this.workerOutputImage.length);
    // }
    //Modified
    // Rebuild ImageData array when slice is oblique since it will change the dimensions of the slice
    if (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CURVED) this.imageDataDraw = this.contextMain.createImageData(this.xDim * this.scaleFactor, this.yDim * this.scaleFactor);
    // console.log('sliceDirection', this.sliceDirection);
    // var expectedImageSize = this.xDim * this.scaleFactor * this.yDim * this.scaleFactor * 4;
    // if (expectedImageSize !== this.imageDataDraw.data.length) {
    //     console.log('scaleFactor', this.scaleFactor);
    //     console.log('ImageDataDraw length', this.imageDataDraw.data.length);
    //     console.log('WorkerOutputImage length', this.workerOutputImage.length);
    //     console.log('expected imageDataDrawSize', expectedImageSize);
    // }
    // console.log('imageDataDraw', this.imageDataDraw.data.length);
    // console.log('workerOutputImage', this.workerOutputImage.length);
    // console.log('sliceSize', this.xSize, this.ySize);

    // var debugIndexes = [];
    /////////////////////
    var testImageData = this.contextMain.createImageData(this.canvasMain.width, this.canvasMain.height);
    // this.contextMain.clearRect(0, 0, this.canvasMain.width, this.canvasMain.height);
    if (this.contextDTILines) {
        this.contextDTILines.clearRect(0, 0, this.screenDim, this.screenDim);
    }

    if (this.imageData.length === this.screenVolumes.length) {
        // if (this.imageData[0].length > 0 && this.imageData[0].length < (this.xDim * this.yDim * 4)) {
        //     // FIXME quick hack to convert outsite processed image to Papaya format
        //     this.imageData[0] = papaya.utilities.ArrayUtils.convertToPapayaImage(this.imageData[0]);
        // }
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
            var stepping = 1 / this.scaleFactor;
            // console.log('repaint xDim yDim', this.xDim, this.yDim);
            for (ctrY = 0; ctrY < this.yDim; ctrY += stepping) {
                for (ctrX = 0; ctrX < this.xDim; ctrX += stepping) {
                    value = this.imageData[ctr][index];
                    thresholdAlpha = 255;
                    layerAlpha = this.screenVolumes[ctr].alpha;

                    // index = ((ctrY * this.scaleFactor * this.xDim * this.scaleFactor) + ctrX * this.scaleFactor) * 4;
                    index = ((papayaRoundFast(ctrY * this.scaleFactor) * papayaRoundFast(this.xDim * this.scaleFactor)) + papayaRoundFast(ctrX * this.scaleFactor)) * 4;
                    // debugIndexes.push(index);

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

                            testImageData.data[index] = this.screenVolumes[ctr].colorTable.lookupRed(value, originalVal) * layerAlpha;
                            testImageData.data[index + 1] = this.screenVolumes[ctr].colorTable.lookupGreen(value, originalVal) * layerAlpha;
                            testImageData.data[index + 2] = this.screenVolumes[ctr].colorTable.lookupBlue(value, originalVal) * layerAlpha;
                            testImageData.data[index + 3] = thresholdAlpha;
                        } else if (thresholdAlpha > 0) {
                            this.imageDataDraw.data[index] = (this.imageDataDraw.data[index] * (1 - layerAlpha) +
                            this.screenVolumes[ctr].colorTable.lookupRed(value, originalVal) * layerAlpha);
                            this.imageDataDraw.data[index + 1] = (this.imageDataDraw.data[index + 1] * (1 - layerAlpha) +
                            this.screenVolumes[ctr].colorTable.lookupGreen(value, originalVal) * layerAlpha);
                            this.imageDataDraw.data[index + 2] = (this.imageDataDraw.data[index + 2] * (1 - layerAlpha) +
                            this.screenVolumes[ctr].colorTable.lookupBlue(value, originalVal) * layerAlpha);
                            this.imageDataDraw.data[index + 3] = thresholdAlpha;

                            testImageData.data[index] = (testImageData.data[index] * (1 - layerAlpha) +
                            this.screenVolumes[ctr].colorTable.lookupRed(value, originalVal) * layerAlpha);
                            testImageData.data[index + 1] = (testImageData.data[index + 1] * (1 - layerAlpha) +
                            this.screenVolumes[ctr].colorTable.lookupGreen(value, originalVal) * layerAlpha);
                            testImageData.data[index + 2] = (testImageData.data[index + 2] * (1 - layerAlpha) +
                            this.screenVolumes[ctr].colorTable.lookupBlue(value, originalVal) * layerAlpha);
                            testImageData.data[index + 3] = thresholdAlpha;
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
        // console.log('repaint imageData', this.imageData[0]);
        // test pad last row
        // if (this.scaleFactor === 0.5) {
        //     for (var x = 0; x < this.xDim * this.scaleFactor; x += 1) {
        //         var index = (papayaRoundFast(this.yDim * this.scaleFactor ) * papayaRoundFast(this.xDim * this.scaleFactor) + x) * 4;
        //         // var index = x * 4;
        //         testImageData.data[index] = 248;
        //         testImageData.data[index + 1] = 24;
        //         testImageData.data[index + 2] = 148;
        //     }
        //     console.log('test length', testImageData.data.length / (this.xDim * this.scaleFactor * 4));
        //     console.log('normal lenght', this.imageDataDraw.data.length / (this.xDim * this.scaleFactor * 4));
        //     this.contextMain.putImageData(testImageData, 0, 0);
        //     console.log(this.canvasMain.height);
        // }
        // else this.contextMain.putImageData(this.imageDataDraw, 0, 0);
        // this.contextMain.putImageData(this.imageDataDraw, 0, 0);
        // var drawOffsetY = this.scaleFactor === 0.5 ? -0.5 : 0

        // Do khi thay doi scaleFactor thi hinh anh co ve bi lech sau khi render
        // dung drawOffsetY de can chinh lai do lech ve huong Y
        var drawOffsetY = this.scaleFactor / 2;
        this.contextMain.putImageData(this.imageDataDraw, 0, drawOffsetY);

        // save test image
        // if (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
        //     // console.log('screenDim', this.screenDim);
        //     this.saveImage(this.canvasMain.toDataURL('image/png'));
        // }
    } 
    // else {
    //     this.updateSlice(slice, true);
    // }
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
    return this.xSize / this.scaleFactor;
};



papaya.viewer.ScreenSlice.prototype.getYSize = function () {
    return this.ySize / this.scaleFactor;
};



papaya.viewer.ScreenSlice.prototype.getXDim = function () {
    return this.xDim * this.scaleFactor;
};



papaya.viewer.ScreenSlice.prototype.getYDim = function () {
    return this.yDim * this.scaleFactor;
};

papaya.viewer.ScreenSlice.prototype.getCenter = function (volume, isAbsolute) {
    var xCenter, yCenter;
    var center;
    // var slice = this;
    if (isAbsolute) {
        xCenter = this.screenOffsetX + (this.screenWidth / 2);
        yCenter = this.screenOffsetY + (this.screenHeight / 2);
    } else {
        // switch (this.sliceDirection) {
        //     case papaya.viewer.ScreenSlice.DIRECTION_AXIAL:
        //         xCenter = (this.finalTransform[0][2] + (volume.transform.centerCoord.x + 0.5) *
        //         this.finalTransform[0][0]);
        //         yCenter = (this.finalTransform[1][2] + (volume.transform.centerCoord.y + 0.5) *
        //         this.finalTransform[1][1]);
        //         break;
        //     case papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL:
        //         xCenter = (this.finalTransform[0][2] + (volume.transform.centerCoord.y + 0.5) *
        //         this.finalTransform[0][0]);
        //         yCenter = (this.finalTransform[1][2] + (volume.transform.centerCoord.z + 0.5) *
        //         this.finalTransform[1][1]);
        //         break;
        //     case papaya.viewer.ScreenSlice.DIRECTION_CORONAL:
        //         xCenter = (this.finalTransform[0][2] + (volume.transform.centerCoord.x + 0.5) *
        //         this.finalTransform[0][0]);
        //         yCenter = (this.finalTransform[1][2] + (volume.transform.centerCoord.z + 0.5) *
        //         this.finalTransform[1][1]);
        //         break;
        //     default:
        //         break;
        // }
        center = papaya.utilities.ViewerUtils.convertImageToScreenCoordinate(this, volume.transform.centerCoord);
        xCenter = center[0];
        yCenter = center[1];
        // console.log('get center', center);
    }

    return {x: xCenter, y: yCenter};
}

papaya.viewer.ScreenSlice.prototype.resetZoomTransform = function () {
    this.zoomFactor = 1;
    this.zoomLocX = 0;
    this.zoomLocY = 0;
    this.zoomLocZ = 0;
    this.panLocX = 0;
    this.panLocY = 0;
    this.panLocZ = 0;
    this.panAmountX = 0;
    this.panAmountY = 0;
    this.panAmountZ = 0;
    this.zoomTransform[0][0] = this.zoomFactor;
    this.zoomTransform[0][1] = 0;
    this.zoomTransform[0][2] = 0;
    this.zoomTransform[1][0] = 0;
    this.zoomTransform[1][1] = this.zoomFactor;
    this.zoomTransform[1][2] = 0;
}


papaya.viewer.ScreenSlice.prototype.updateZoomTransform = function (zoomFactor, xZoomTrans, yZoomTrans, xPanTrans,
                                                                    yPanTrans, viewer) {
    var xTrans, yTrans, maxTranslateX, maxTranslateY;
    var zoomFactor, xZoomTrans, yZoomTrans, xPanTrans, yPanTrans;
    var prevXtrans = this.zoomTransform[0][2];
    var prevYtrans = this.zoomTransform[1][2];
    zoomFactor = this.zoomFactor;
    /*
     I don't understand why Papaya does this when Panning * Zooming only take account for X and Y
     TODO: rewrite this to only take account for (x, y) mouse coordinate delta
     */
    // dirty test 
    if (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
        xZoomTrans = this.zoomLocX;                                         
        yZoomTrans = this.zoomLocY;
        xPanTrans = this.panAmountX;
        yPanTrans = this.panAmountY;
    } else if (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
        xZoomTrans = this.zoomLocX;                                         
        yZoomTrans = this.zoomLocZ;
        xPanTrans = this.panAmountX;
        yPanTrans = this.panAmountZ;
    } else if (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
        xZoomTrans = this.zoomLocY;                                         
        yZoomTrans = this.zoomLocZ;
        xPanTrans = this.panAmountY;
        yPanTrans = this.panAmountZ;
    }
    // console.log('updateZoomTransform', [prevXtrans, prevYtrans]);
    // console.log('updateZoomTransform', [this.panAmountX, this.panAmountY]);
    xZoomTrans = (xZoomTrans) * (zoomFactor - 1.0) * -1;
    yZoomTrans = (yZoomTrans) * (zoomFactor - 1.0) * -1;
    xPanTrans = xPanTrans * (zoomFactor - 1.0);
    yPanTrans = yPanTrans * (zoomFactor - 1.0);

    // limit pan translation such that it cannot pan out of bounds of image
    xTrans = xZoomTrans + xPanTrans;
    // console.log('pre xTrans', xTrans);
    // maxTranslateX = -1 * (zoomFactor - 1.0) * this.xDim;
    // if (xTrans > 0) {
    //     xTrans = 0;
    // } else if (xTrans < maxTranslateX) {
    //     xTrans = maxTranslateX;
    // }
    yTrans = yZoomTrans + yPanTrans;
    // console.log('pre yTrans', yTrans);
    // maxTranslateY = -1 * (zoomFactor - 1.0) * this.yDim;
    // if (yTrans > 0) {
    //     yTrans = 0;
    // } else if (yTrans < maxTranslateY) {
    //     yTrans = maxTranslateY;
    // }
    // update parent viewer with pan translation (may have been limited by step above)
    // if (zoomFactor > 1) {
    //     if (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
    //         viewer.panAmountX = (Math.round((xTrans - xZoomTrans) / (zoomFactor - 1)));
    //         viewer.panAmountY = (Math.round((yTrans - yZoomTrans) / (zoomFactor - 1)));
    //     } else if (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
    //         viewer.panAmountX = (Math.round((xTrans - xZoomTrans) / (zoomFactor - 1)));
    //         viewer.panAmountZ = (Math.round((yTrans - yZoomTrans) / (zoomFactor - 1)));
    //     } else if (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
    //         viewer.panAmountY = (Math.round((xTrans - xZoomTrans) / (zoomFactor - 1)));
    //         viewer.panAmountZ = (Math.round((yTrans - yZoomTrans) / (zoomFactor - 1)));
    //     }
    // }

    // console.log('updateZoomTransform trans', [xTrans, yTrans] );
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

/////////////////////////////////////////////////////////////////////////////////////////////

papaya.viewer.ScreenSlice.prototype.updateObliqueSlice = function (segment, sliceDirection) {
    // parse image along the sliceDirection line of sight (current slice's direction)
    // input points can be of a line or a curve, point must be papaya.Core.coordinate object
    // console.log('updateObliqueSlice', this);
    // scaleDimension update: the segment.points has already account for the increased scaleDimension
    // if (segment.points.length < 1) return false;
    var points = segment.points;
    var maxDim = 0; // maximum dimension along line of sight
    var voxelDims = this.screenVolumes[0].volume.header.voxelDimensions;
    var imageDims = this.screenVolumes[0].volume.header.imageDimensions;
    var imageData = [[]];
    var index, value;
    var timepoint = 0;
    var interpolation = true;
    if (!points) return;
    if (!points.length) return;

    // test case where oblique rotation are not allowed, line of sights is exactly perpendicular to the default planes
    switch (sliceDirection) {
        case papaya.viewer.ScreenSlice.DIRECTION_AXIAL:
            maxDim = imageDims.zDim;
            break;
        case papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL:
            maxDim = imageDims.xDim;
            break;
        case papaya.viewer.ScreenSlice.DIRECTION_CORONAL:
            maxDim = imageDims.yDim;
            break;
    }
    var stepping = 1 / this.scaleFactor;
    for (var i = 0; i < maxDim; i += stepping) { // pad MaxDim dimension because points are already padded
        for (var j = 0; j < points.length; j++) {
            switch (sliceDirection) {
                case papaya.viewer.ScreenSlice.DIRECTION_AXIAL:
                    value = this.screenVolumes[0].volume.getVoxelAtMM(points[j].x * voxelDims.xSize, points[j].y *
                        voxelDims.ySize, i * voxelDims.zSize, timepoint, !interpolation, papaya.viewer.ScreenSlice.DIRECTION_OBLIQUE);
                    break;
                case papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL:
                    value = this.screenVolumes[0].volume.getVoxelAtMM(i * voxelDims.xSize, points[j].y *
                        voxelDims.ySize, points[j].z * voxelDims.zSize, timepoint, !interpolation, papaya.viewer.ScreenSlice.DIRECTION_OBLIQUE);
                    break;
                case papaya.viewer.ScreenSlice.DIRECTION_CORONAL:
                    value = this.screenVolumes[0].volume.getVoxelAtMM(points[j].x * voxelDims.xSize, i *
                        voxelDims.ySize, points[j].z * voxelDims.zSize, timepoint, !interpolation, papaya.viewer.ScreenSlice.DIRECTION_OBLIQUE);
                    break;
            }
            index = ((papayaRoundFast(i * this.scaleFactor) * points.length) + j) * 4;
            // originalVal = value;
            imageData[0][index] = value;
        }
    }
    this.imageData = imageData;
    // this.yDim = maxDim;
    // this.xDim = points.length;
    // this.xSize = pixelSpacing.xSize;
    // this.ySize = pixelSpacing.ySize;
    var pixelSpacing = this.calculateObliquePixelSpacing(sliceDirection, segment, voxelDims, imageDims);
    this.updateDimension(points.length / this.scaleFactor, maxDim, pixelSpacing.xSize, pixelSpacing.ySize);
    // this.updateFinalTransform();

    var debug = function (debug) {
        window.currentSlice = this;
        console.log('input length', segment.points.length);
        console.log('sliceDir', sliceDirection);
        console.log('imageData', this.imageData);
        console.log('maxDim', imageDims, maxDim);
        console.log('delta', segment.delta);
        console.log('pixelSpacing', voxelDims, pixelSpacing);
    }
    // debug.call(this);
}
papaya.viewer.ScreenSlice.prototype.updateDimension = function (xDim, yDim, xSize, ySize) {
    // update image canvas dimension
    this.canvasMain.width = xDim * this.scaleFactor;
    this.canvasMain.height = yDim * this.scaleFactor;
    // update slice dimension
    this.yDim = yDim;
    this.xDim = xDim;
    this.xSize = xSize;
    this.ySize = ySize;
    this.radiologicalTransform = [[-1, 0, this.xDim * this.scaleFactor], [0, 1, 0], [0, 0, 1]];
}
papaya.viewer.ScreenSlice.prototype.calculateObliquePixelSpacing = function (sliceDirection, segment, voxelDims, imageDims) {
    // calculate the final image's pixel spacing
    // final image needs pixel spacing information to compute transformation matrix, if pixel spacing is incorrect, the image will be warped or distorted
    // hardcore, does not expected to work on non-orthogonal curves (curve on oblique slices)
    var xSize, ySize;
    var delta = segment.delta;
    var length = segment.points.length;
    var ratio;
    var sinAlpha, cosAlpha;
    var deltaXY, xSizeComponent, ySizeComponent;

    var getXYratio = function (sinAlpha, cosAlpha) {
        var xRatio, yRatio;
        var maxSinCos = Math.SQRT2 / 2;
        if (sinAlpha === cosAlpha) xRatio = yRatio = 1;
        else if (cosAlpha > sinAlpha) {
            xRatio = 1;
            yRatio = sinAlpha / maxSinCos;
        } else if (cosAlpha < sinAlpha) {
            xRatio = cosAlpha / maxSinCos;
            yRatio = 1;
        }
        return { x: xRatio, y: yRatio }
    };
    switch (sliceDirection) {
        case papaya.viewer.ScreenSlice.DIRECTION_AXIAL:
            deltaXY = Math.sqrt(delta.x * delta.x + delta.y * delta.y) ;
            cosAlpha = delta.x / deltaXY;
            sinAlpha = delta.y / deltaXY;
            ratio = getXYratio(sinAlpha, cosAlpha);
            xSizeComponent = voxelDims.xSize * ratio.x;
            ySizeComponent = voxelDims.ySize * ratio.y;
            xSize = Math.sqrt(xSizeComponent * xSizeComponent + ySizeComponent * ySizeComponent);
            ySize = voxelDims.zSize;
            break;
        case papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL:
            deltaXY = Math.sqrt(delta.z * delta.z + delta.y * delta.y) ;
            cosAlpha = delta.z / deltaXY;
            sinAlpha = delta.y / deltaXY;
            ratio = getXYratio(sinAlpha, cosAlpha);
            xSizeComponent = voxelDims.zSize * ratio.x;
            ySizeComponent = voxelDims.ySize * ratio.y;
            xSize = Math.sqrt(xSizeComponent * xSizeComponent + ySizeComponent * ySizeComponent);
            ySize = voxelDims.xSize;
            break;
        case papaya.viewer.ScreenSlice.DIRECTION_CORONAL:
            deltaXY = Math.sqrt(delta.x * delta.x + delta.z * delta.z) ;
            cosAlpha = delta.x / deltaXY;
            sinAlpha = delta.z / deltaXY;
            ratio = getXYratio(sinAlpha, cosAlpha);
            xSizeComponent = voxelDims.xSize * ratio.x;
            ySizeComponent = voxelDims.zSize * ratio.y;
            xSize = Math.sqrt(xSizeComponent * xSizeComponent + ySizeComponent * ySizeComponent);
            ySize = voxelDims.ySize;
            break;
    }

    var debug = function (debug) {
        window.currentSlice = this;
        console.log('segment', segment);
        console.log('voxelDims', voxelDims);
        console.log('ratio', ratio, cosAlpha, sinAlpha);
        console.log('spacing', xSize, ySize);
        console.log('finalTransform', this.finalTransform);
    };

    // debug.call(this);
    return {xSize: xSize, ySize: ySize};
}


// papaya.viewer.ScreenSlice.prototype.repaintTest = function (slice, force, worldSpace) {
//     /*jslint bitwise: true */
//     console.log('repaintTest');
//     var ctr, ctrY, ctrX, value, thresholdAlpha, index = 0, layerAlpha, rgb, dti, dtiLines, dtiRGB, angle2,
//         dtiXC, dtiYC, dtiX1, dtiX2, dtiY1, dtiY2, dtiX1T, dtiX2T, dtiY1T, dtiY2T, angle, s, c, dtiColors,
//         valueR, valueG, valueB, dtiColorIndex = 0, readFirstRaster = false, originalVal;

//     slice = Math.round(slice);

//     this.currentSlice = slice;

//     this.contextMain.clearRect(0, 0, this.canvasMain.width, this.canvasMain.height);

//     if (this.contextDTILines) {
//         this.contextDTILines.clearRect(0, 0, this.screenDim, this.screenDim);
//     }
//     // clear imageDataDraw
//     this.imageDataDraw = this.contextMain.createImageData(this.xDim, this.yDim);
//     // this.imageDataDraw.data = [[]];
//     if (this.imageData.length === this.screenVolumes.length) {
//         for (ctr = 0; ctr < this.screenVolumes.length; ctr += 1) {
//             if (this.screenVolumes[ctr].hidden) {
//                 continue;
//             }

//             rgb = this.screenVolumes[ctr].rgb;
//             dti = this.screenVolumes[ctr].dti;
//             dtiLines = this.screenVolumes[ctr].dtiLines;
//             dtiColors = this.screenVolumes[ctr].dtiColors;

//             if (dtiLines) {
//                 this.contextDTILines.lineWidth = 1;

//                 if (!dtiColors) {
//                     this.contextDTILines.strokeStyle = papaya.viewer.ScreenSlice.DTI_COLORS[dtiColorIndex];
//                     dtiColorIndex += 1;
//                     dtiColorIndex = dtiColorIndex % 3;
//                     this.contextDTILines.beginPath();
//                 }
//             }

//             for (ctrY = 0; ctrY < this.yDim; ctrY += 1) {
//                 for (ctrX = 0; ctrX < this.xDim; ctrX += 1) {
//                     value = this.imageData[ctr][index];
//                     thresholdAlpha = 255;
//                     layerAlpha = this.screenVolumes[ctr].alpha;

//                     index = ((ctrY * this.xDim) + ctrX) * 4;

//                     if (rgb) {
//                         this.imageDataDraw.data[index] = (value >> 16) & 0xff;
//                         this.imageDataDraw.data[index + 1] = (value >> 8) & 0xff;
//                         this.imageDataDraw.data[index + 2] = (value) & 0xff;
//                         this.imageDataDraw.data[index + 3] = thresholdAlpha;
//                     } else if (dti) {
//                         if (dtiLines) {
//                             angle = this.imageData[ctr][index];

//                             if (!isNaN(angle)) {
//                                 value = this.imageData2[ctr][index];
//                                 valueR = (value >> 16) & 0xFF;
//                                 valueG = (value >> 8) & 0xFF;
//                                 valueB = value & 0xFF;

//                                 dtiRGB = (value & 0x00FFFFFF);

//                                 if (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
//                                     angle2 = Math.acos(Math.abs(valueB) / Math.sqrt(valueR * valueR + valueG * valueG + valueB * valueB));
//                                 } else if (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_CORONAL) {
//                                     angle2 = Math.acos(Math.abs(valueG) / Math.sqrt(valueR * valueR + valueG * valueG + valueB * valueB));
//                                 } else if (this.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL) {
//                                     angle2 = Math.acos(Math.abs(valueR) / Math.sqrt(valueR * valueR + valueG * valueG + valueB * valueB));
//                                 }

//                                 angle2 = 1.0 - (angle2 / 1.5708);

//                                 if (dtiColors) {
//                                     this.contextDTILines.beginPath();
//                                     this.contextDTILines.strokeStyle = '#' + papaya.utilities.StringUtils.pad(dtiRGB.toString(16), 6);
//                                 }

//                                 s = Math.sin(angle);
//                                 c = Math.cos(angle);

//                                 dtiXC = (this.finalTransform2[0][2] + (ctrX + 0.5) * this.finalTransform2[0][0]);
//                                 dtiYC = (this.finalTransform2[1][2] + (ctrY + 0.5) * this.finalTransform2[1][1]);

//                                 dtiX1 = (this.finalTransform2[0][2] + (ctrX + (0.5 * angle2)) * this.finalTransform2[0][0]);
//                                 dtiY1 = (this.finalTransform2[1][2] + (ctrY + 0.5) * this.finalTransform2[1][1]);
//                                 dtiX1T = c * (dtiX1 - dtiXC) - s * (dtiY1 - dtiYC) + dtiXC;
//                                 dtiY1T = s * (dtiX1 - dtiXC) + c * (dtiY1 - dtiYC) + dtiYC;
//                                 this.contextDTILines.moveTo(dtiX1T, dtiY1T);

//                                 dtiX2 = (this.finalTransform2[0][2] + (ctrX + 1 - (0.5 * angle2)) * this.finalTransform2[0][0]);
//                                 dtiY2 = (this.finalTransform2[1][2] + (ctrY + 0.5) * this.finalTransform2[1][1]);
//                                 dtiX2T = c * (dtiX2 - dtiXC) - s * (dtiY2 - dtiYC) + dtiXC;
//                                 dtiY2T = s * (dtiX2 - dtiXC) + c * (dtiY2 - dtiYC) + dtiYC;
//                                 this.contextDTILines.lineTo(dtiX2T, dtiY2T);

//                                 if (dtiColors) {
//                                     this.contextDTILines.stroke();
//                                 }
//                             }
//                         } else {
//                             value = this.imageData[ctr][index];
//                             dtiRGB = (value & 0x00FFFFFF);

//                             if (dtiRGB !== 0) {
//                                 layerAlpha = (((value >> 24) & 0xff) / 255.0);
//                             } else {
//                                 layerAlpha = 0;
//                             }

//                             if (!readFirstRaster) {
//                                 this.imageDataDraw.data[index] = (value >> 16) & 0xff;
//                                 this.imageDataDraw.data[index + 1] = (value >> 8) & 0xff;
//                                 this.imageDataDraw.data[index + 2] = (value) & 0xff;
//                                 this.imageDataDraw.data[index + 3] = (value >> 24) & 0xff;
//                             } else {
//                                 this.imageDataDraw.data[index] = (this.imageDataDraw.data[index] * (1 - layerAlpha) +
//                                 ((value >> 16) & 0xff) * layerAlpha);
//                                 this.imageDataDraw.data[index + 1] = (this.imageDataDraw.data[index + 1] * (1 - layerAlpha) +
//                                 ((value >> 8) & 0xff) * layerAlpha);
//                                 this.imageDataDraw.data[index + 2] = (this.imageDataDraw.data[index + 2] * (1 - layerAlpha) +
//                                 ((value) & 0xff) * layerAlpha);
//                                 this.imageDataDraw.data[index + 3] = thresholdAlpha;
//                             }
//                         }
//                     } else {
//                         value = this.imageData[ctr][index];
//                         originalVal = value;

//                         if ((!this.screenVolumes[ctr].negative && (value <= this.screenVolumes[ctr].screenMin)) ||
//                             (this.screenVolumes[ctr].negative && (value >= this.screenVolumes[ctr].screenMin)) ||
//                             isNaN(value)) {
//                             value = papaya.viewer.ScreenSlice.SCREEN_PIXEL_MIN;  // screen value
//                             thresholdAlpha = this.screenVolumes[ctr].isOverlay() ? 0 : 255;
//                         } else if ((!this.screenVolumes[ctr].negative && (value >= this.screenVolumes[ctr].screenMax)) ||
//                             (this.screenVolumes[ctr].negative && (value <= this.screenVolumes[ctr].screenMax))) {
//                             value = papaya.viewer.ScreenSlice.SCREEN_PIXEL_MAX;  // screen value
//                         } else {
//                             value = papayaRoundFast(((value - this.screenVolumes[ctr].screenMin) *
//                             this.screenVolumes[ctr].screenRatio));  // screen value
//                         }

//                         if (!readFirstRaster) {
//                             this.imageDataDraw.data[index] = this.screenVolumes[ctr].colorTable.lookupRed(value, originalVal) * layerAlpha;
//                             this.imageDataDraw.data[index + 1] = this.screenVolumes[ctr].colorTable.lookupGreen(value, originalVal) * layerAlpha;
//                             this.imageDataDraw.data[index + 2] = this.screenVolumes[ctr].colorTable.lookupBlue(value, originalVal) * layerAlpha;
//                             this.imageDataDraw.data[index + 3] = thresholdAlpha;
//                         } else if (thresholdAlpha > 0) {
//                             this.imageDataDraw.data[index] = (this.imageDataDraw.data[index] * (1 - layerAlpha) +
//                             this.screenVolumes[ctr].colorTable.lookupRed(value, originalVal) * layerAlpha);
//                             this.imageDataDraw.data[index + 1] = (this.imageDataDraw.data[index + 1] * (1 - layerAlpha) +
//                             this.screenVolumes[ctr].colorTable.lookupGreen(value, originalVal) * layerAlpha);
//                             this.imageDataDraw.data[index + 2] = (this.imageDataDraw.data[index + 2] * (1 - layerAlpha) +
//                             this.screenVolumes[ctr].colorTable.lookupBlue(value, originalVal) * layerAlpha);
//                             this.imageDataDraw.data[index + 3] = thresholdAlpha;
//                         }
//                     }
//                 }
//             }

//             if (!dtiColors) {
//                 this.contextDTILines.stroke();
//             }

//             if (!dtiLines) {
//                 readFirstRaster = true;
//             }
//         }
//         // console.log('repaint imageDataDraw', this.imageDataDraw);
//         this.contextMain.putImageData(this.imageDataDraw, 0, 0);
//     } else {
//         console.log('repaintTest updateSlice');
//         this.updateSlice(slice, true);
//     }
//     var debug = function (debug) {
//         window.currentSlice = this;
//         // console.log('input', points);
//         // console.log('sliceDir', sliceDirection);
//         console.log('imageDataDraw', this.imageDataDraw);
//         // console.log('maxDim', maxDim);
//     }
//     debug.call(this);
// };

papaya.viewer.ScreenSlice.prototype.initWebWorkers = function (numOfWorkers) {
    // create a number of workers based on the supplied number

    if (window.Worker) {
        for (var i = 0; i < numOfWorkers; i++) {
            var worker = new Worker('/papayaWorker.js')
            this.workerPool.push(worker);
            worker.onmessage = papaya.utilities.ObjectUtils.bind(this,  this.handleWorkerFinished);
            // worker.postMessage(testPayload);
        }
    } else throw Error('Web Workers are not supported in this browser');

    console.log('Using', this.numOfWorkers, 'workers per slice');
}

papaya.viewer.ScreenSlice.prototype.terminateWebWorkers = function () {
    for (var i = 0; i < this.workerPool.length; i++) {
        if (this.workerPool[i]) this.workerPool[i].terminate();
    }
}

papaya.viewer.ScreenSlice.prototype.handleWorkerFinished = function (message) {
    // message is data received back from worker
    // console.log('hello from main thread:', message.data);
    // console.log('handleWorkerFinished', this.sliceDirection, message.data);
    if (message.data.sliceProps.sliceDirection === this.sliceDirection) {
        this.workersFinished++;
        // this.imageData[0] = this.imageData[0].concat(message.data.imageSegment);
    }
    if (this.workersFinished === this.numOfWorkers) {
        // console.log('finished for slice', message.data.sliceProps.slice);
        // console.log('finished for direction', message.data.sliceProps.sliceDirection);
        // console.log('message', message);
        // this.imageData[0] = papaya.utilities.ArrayUtils.convertToPapayaImage(message.data.sliceProps.imageData);
        this.drawReady = true;
        if (!message.data.sliceProps.returnSliceData) this.updateImageOnViewer(message.data.sliceProps.imageData);
        else this.manager.reactViewerConnector.returnSliceDataCallback(message.data.sliceProps.imageData);
        this.workersFinished = 0;
        
        // this.manager.drawViewer(false, false);
        // console.timeEnd('MiddleButtonScroll');
    }
}

papaya.viewer.ScreenSlice.prototype.updateImageOnViewer = function (imageData) {
    var comingScaleFactor = Math.sqrt(imageData.length / (this.xDim * this.yDim * 4));
    if (comingScaleFactor !== this.scaleFactor) {
        // console.log('imageDataLength', imageData.length);
        // console.log('scaleFactor squared', comingScaleFactor);
        // console.log('this scaleFactor', this.scaleFactor);
        console.warn('Scalefactor mismatch, skipping drawing. This behavior is normal in Multithreading mode');
        return;
    }
    this.imageData[0] = imageData;
    this.repaint(this.currentSlice);
    this.manager.drawScreenSlice(this);
    this.manager.drawOverlay();
    // this.manager.drawViewer(false, true);
    if (this.manager.isPerformanceTest) {
        this.manager.onTestEnd();
    }
}

papaya.viewer.ScreenSlice.prototype.initWorkerSegments = function (axis) {
    // split the images according to x-axis or y-axis depending on input
    var segments = [0];
    for (var i = 0; i < this.numOfWorkers; i++) {
        segments.push(Math.round(axis / this.numOfWorkers));
    }
    segments[segments.length - 1] += axis % this.numOfWorkers; // cover cases where xDim is not divisible by numOfWorkers
    for (var i = 0; i < segments.length - 1; i++) {
        segments[i + 1] += segments[i];
    }
    return segments;
}

papaya.viewer.ScreenSlice.prototype.getWorkerSliceProps = function (workerIndex, screenVol, slice, returnSliceData) {
    var voxelDims = screenVol.volume.header.voxelDimensions;
    var timepoint = screenVol.currentTimepoint;
    var xSegments = this.initWorkerSegments(this.xDim);
    var ySegments = this.initWorkerSegments(this.yDim);
    var interpolation = ((ctr === 0) || screenVol.interpolation);
    interpolation &= (this.manager.container.preferences.smoothDisplay === "Yes");
    var sliceProps = {
        yDim: this.yDim,
        xDim: this.xDim,
        xSegments: [xSegments[workerIndex], xSegments[workerIndex+1]], // split vertically
        ySegments: [ySegments[workerIndex], ySegments[workerIndex+1]], // split horizontally
        xSize: voxelDims.xSize,
        ySize: voxelDims.ySize,
        zSize: voxelDims.zSize,
        slice: slice,
        sliceDirection: this.sliceDirection,
        returnSliceData: returnSliceData,
        timepoint: timepoint,
        interpolation: interpolation,
        imageData: this.workerOutputImage,
        scaleFactor: this.scaleFactor
    };
    return sliceProps;
}

papaya.viewer.ScreenSlice.prototype.getCrosshairColor = function () {
    switch (this.sliceDirection) {
        case papaya.viewer.ScreenSlice.DIRECTION_AXIAL:
            return papaya.viewer.Viewer.CROSSHAIR_COLOR_AXIAL
        case papaya.viewer.ScreenSlice.DIRECTION_SAGITTAL:
            return papaya.viewer.Viewer.CROSSHAIR_COLOR_SAGITTAL
        case papaya.viewer.ScreenSlice.DIRECTION_CORONAL:
            return papaya.viewer.Viewer.CROSSHAIR_COLOR_CORONAL
        default:
            return 0;
    }
}

papaya.viewer.ScreenSlice.prototype.setScaleFactor = function (customScale, force) {
    // console.time('setScaleFactor');
    var scale = customScale ? customScale : papaya.viewer.ScreenSlice.DEFAULT_SCALE;
    if (scale !== this.scaleFactor && (this.sliceDirection !== this.originalSliceDir || force)) {
            this.contextMain.clearRect(0, 0, this.canvasMain.width, this.canvasMain.height);
            this.scaleFactor = scale;
            this.canvasMain.width = this.xDim * this.scaleFactor;
            this.canvasMain.height = this.yDim * this.scaleFactor;
            this.imageDataDraw = this.contextMain.createImageData(this.canvasMain.width, this.yDim * this.scaleFactor);
            this.radiologicalTransform = [[-1, 0, this.xDim * this.scaleFactor], [0, 1, 0], [0, 0, 1]];
            if (this.manager.canUseMultithreading) {
                this.workerOutputImage = [];
                this.workerOutputImage = new Int32Array(new SharedArrayBuffer(4 * 4 * this.xDim * this.yDim * this.scaleFactor * this.scaleFactor));
            }
            this.manager.scaleChanged = true;
    }
}

papaya.viewer.ScreenSlice.prototype.saveImage = function (base64Img) {
    var saveImg = document.createElement('a');
    saveImg.download = 'download.png';
    // use this hack to download image with download atribute above in some cases
    saveImg.target = '_blank';
    document.body.appendChild(saveImg);

    saveImg.href = base64Img;
    saveImg.click();
};
