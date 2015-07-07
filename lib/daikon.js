(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.daikon = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * @license
 * Copyright 2015 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function loadURLasArrayBuffer(path, callback) {
    if (path.indexOf("data:") === 0) {
        var offset = path.indexOf("base64,") + 7;
        var data = atob(path.substring(offset));
        var arr = new Uint8Array(data.length);
        for (var i = data.length - 1; i >= 0; i--) {
            arr[i] = data.charCodeAt(i);
        }
        callback(arr.buffer);
        return;
    }
    var xhr = new XMLHttpRequest();
    xhr.open("GET", path, true);
    xhr.responseType = "arraybuffer";
    xhr.onload = function() {
        callback(xhr.response);
    };
    xhr.send(null);
}

var JpegImage = function jpegImage() {
    function JpegImage() {
        this._src = null;
        this._parser = new PDFJS.JpegImage();
        this.onload = null;
    }
    JpegImage.prototype = {
        get src() {
            return this._src;
        },
        set src(value) {
            this.load(value);
        },
        get width() {
            return this._parser.width;
        },
        get height() {
            return this._parser.height;
        },
        load: function load(path) {
            this._src = path;
            loadURLasArrayBuffer(path, function(buffer) {
                this.parse(new Uint8Array(buffer));
                if (this.onload) {
                    this.onload();
                }
            }.bind(this));
        },
        parse: function(data) {
            this._parser.parse(data);
        },
        getData: function(width, height) {
            return this._parser.getData(width, height, false);
        },
        copyToImageData: function copyToImageData(imageData) {
            if (this._parser.numComponents === 2 || this._parser.numComponents > 4) {
                throw new Error("Unsupported amount of components");
            }
            var width = imageData.width, height = imageData.height;
            var imageDataBytes = width * height * 4;
            var imageDataArray = imageData.data;
            var i, j;
            if (this._parser.numComponents === 1) {
                var values = this._parser.getData(width, height, false);
                for (i = 0, j = 0; i < imageDataBytes; ) {
                    var value = values[j++];
                    imageDataArray[i++] = value;
                    imageDataArray[i++] = value;
                    imageDataArray[i++] = value;
                    imageDataArray[i++] = 255;
                }
                return;
            }
            var rgb = this._parser.getData(width, height, true);
            for (i = 0, j = 0; i < imageDataBytes; ) {
                imageDataArray[i++] = rgb[j++];
                imageDataArray[i++] = rgb[j++];
                imageDataArray[i++] = rgb[j++];
                imageDataArray[i++] = 255;
            }
        }
    };
    return JpegImage;
}();




var PDFJS;

(function(PDFJS) {
    "use strict";
    var JpegImage = function jpegImage() {
        var dctZigZag = new Uint8Array([ 0, 1, 8, 16, 9, 2, 3, 10, 17, 24, 32, 25, 18, 11, 4, 5, 12, 19, 26, 33, 40, 48, 41, 34, 27, 20, 13, 6, 7, 14, 21, 28, 35, 42, 49, 56, 57, 50, 43, 36, 29, 22, 15, 23, 30, 37, 44, 51, 58, 59, 52, 45, 38, 31, 39, 46, 53, 60, 61, 54, 47, 55, 62, 63 ]);
        var dctCos1 = 4017;
        var dctSin1 = 799;
        var dctCos3 = 3406;
        var dctSin3 = 2276;
        var dctCos6 = 1567;
        var dctSin6 = 3784;
        var dctSqrt2 = 5793;
        var dctSqrt1d2 = 2896;
        function constructor() {}
        function buildHuffmanTable(codeLengths, values) {
            var k = 0, code = [], i, j, length = 16;
            while (length > 0 && !codeLengths[length - 1]) {
                length--;
            }
            code.push({
                children: [],
                index: 0
            });
            var p = code[0], q;
            for (i = 0; i < length; i++) {
                for (j = 0; j < codeLengths[i]; j++) {
                    p = code.pop();
                    p.children[p.index] = values[k];
                    while (p.index > 0) {
                        p = code.pop();
                    }
                    p.index++;
                    code.push(p);
                    while (code.length <= i) {
                        code.push(q = {
                            children: [],
                            index: 0
                        });
                        p.children[p.index] = q.children;
                        p = q;
                    }
                    k++;
                }
                if (i + 1 < length) {
                    code.push(q = {
                        children: [],
                        index: 0
                    });
                    p.children[p.index] = q.children;
                    p = q;
                }
            }
            return code[0].children;
        }
        function getBlockBufferOffset(component, row, col) {
            return 64 * ((component.blocksPerLine + 1) * row + col);
        }
        function decodeScan(data, offset, frame, components, resetInterval, spectralStart, spectralEnd, successivePrev, successive) {
            var precision = frame.precision;
            var samplesPerLine = frame.samplesPerLine;
            var scanLines = frame.scanLines;
            var mcusPerLine = frame.mcusPerLine;
            var progressive = frame.progressive;
            var maxH = frame.maxH, maxV = frame.maxV;
            var startOffset = offset, bitsData = 0, bitsCount = 0;
            function readBit() {
                if (bitsCount > 0) {
                    bitsCount--;
                    return bitsData >> bitsCount & 1;
                }
                bitsData = data[offset++];
                if (bitsData === 255) {
                    var nextByte = data[offset++];
                    if (nextByte) {
                        throw "unexpected marker: " + (bitsData << 8 | nextByte).toString(16);
                    }
                }
                bitsCount = 7;
                return bitsData >>> 7;
            }
            function decodeHuffman(tree) {
                var node = tree;
                while (true) {
                    node = node[readBit()];
                    if (typeof node === "number") {
                        return node;
                    }
                    if (typeof node !== "object") {
                        throw "invalid huffman sequence";
                    }
                }
            }
            function receive(length) {
                var n = 0;
                while (length > 0) {
                    n = n << 1 | readBit();
                    length--;
                }
                return n;
            }
            function receiveAndExtend(length) {
                if (length === 1) {
                    return readBit() === 1 ? 1 : -1;
                }
                var n = receive(length);
                if (n >= 1 << length - 1) {
                    return n;
                }
                return n + (-1 << length) + 1;
            }
            function decodeBaseline(component, offset) {
                var t = decodeHuffman(component.huffmanTableDC);
                var diff = t === 0 ? 0 : receiveAndExtend(t);
                component.blockData[offset] = component.pred += diff;
                var k = 1;
                while (k < 64) {
                    var rs = decodeHuffman(component.huffmanTableAC);
                    var s = rs & 15, r = rs >> 4;
                    if (s === 0) {
                        if (r < 15) {
                            break;
                        }
                        k += 16;
                        continue;
                    }
                    k += r;
                    var z = dctZigZag[k];
                    component.blockData[offset + z] = receiveAndExtend(s);
                    k++;
                }
            }
            function decodeDCFirst(component, offset) {
                var t = decodeHuffman(component.huffmanTableDC);
                var diff = t === 0 ? 0 : receiveAndExtend(t) << successive;
                component.blockData[offset] = component.pred += diff;
            }
            function decodeDCSuccessive(component, offset) {
                component.blockData[offset] |= readBit() << successive;
            }
            var eobrun = 0;
            function decodeACFirst(component, offset) {
                if (eobrun > 0) {
                    eobrun--;
                    return;
                }
                var k = spectralStart, e = spectralEnd;
                while (k <= e) {
                    var rs = decodeHuffman(component.huffmanTableAC);
                    var s = rs & 15, r = rs >> 4;
                    if (s === 0) {
                        if (r < 15) {
                            eobrun = receive(r) + (1 << r) - 1;
                            break;
                        }
                        k += 16;
                        continue;
                    }
                    k += r;
                    var z = dctZigZag[k];
                    component.blockData[offset + z] = receiveAndExtend(s) * (1 << successive);
                    k++;
                }
            }
            var successiveACState = 0, successiveACNextValue;
            function decodeACSuccessive(component, offset) {
                var k = spectralStart;
                var e = spectralEnd;
                var r = 0;
                var s;
                var rs;
                while (k <= e) {
                    var z = dctZigZag[k];
                    switch (successiveACState) {
                      case 0:
                        rs = decodeHuffman(component.huffmanTableAC);
                        s = rs & 15;
                        r = rs >> 4;
                        if (s === 0) {
                            if (r < 15) {
                                eobrun = receive(r) + (1 << r);
                                successiveACState = 4;
                            } else {
                                r = 16;
                                successiveACState = 1;
                            }
                        } else {
                            if (s !== 1) {
                                throw "invalid ACn encoding";
                            }
                            successiveACNextValue = receiveAndExtend(s);
                            successiveACState = r ? 2 : 3;
                        }
                        continue;

                      case 1:
                      case 2:
                        if (component.blockData[offset + z]) {
                            component.blockData[offset + z] += readBit() << successive;
                        } else {
                            r--;
                            if (r === 0) {
                                successiveACState = successiveACState === 2 ? 3 : 0;
                            }
                        }
                        break;

                      case 3:
                        if (component.blockData[offset + z]) {
                            component.blockData[offset + z] += readBit() << successive;
                        } else {
                            component.blockData[offset + z] = successiveACNextValue << successive;
                            successiveACState = 0;
                        }
                        break;

                      case 4:
                        if (component.blockData[offset + z]) {
                            component.blockData[offset + z] += readBit() << successive;
                        }
                        break;
                    }
                    k++;
                }
                if (successiveACState === 4) {
                    eobrun--;
                    if (eobrun === 0) {
                        successiveACState = 0;
                    }
                }
            }
            function decodeMcu(component, decode, mcu, row, col) {
                var mcuRow = mcu / mcusPerLine | 0;
                var mcuCol = mcu % mcusPerLine;
                var blockRow = mcuRow * component.v + row;
                var blockCol = mcuCol * component.h + col;
                var offset = getBlockBufferOffset(component, blockRow, blockCol);
                decode(component, offset);
            }
            function decodeBlock(component, decode, mcu) {
                var blockRow = mcu / component.blocksPerLine | 0;
                var blockCol = mcu % component.blocksPerLine;
                var offset = getBlockBufferOffset(component, blockRow, blockCol);
                decode(component, offset);
            }
            var componentsLength = components.length;
            var component, i, j, k, n;
            var decodeFn;
            if (progressive) {
                if (spectralStart === 0) {
                    decodeFn = successivePrev === 0 ? decodeDCFirst : decodeDCSuccessive;
                } else {
                    decodeFn = successivePrev === 0 ? decodeACFirst : decodeACSuccessive;
                }
            } else {
                decodeFn = decodeBaseline;
            }
            var mcu = 0, marker;
            var mcuExpected;
            if (componentsLength === 1) {
                mcuExpected = components[0].blocksPerLine * components[0].blocksPerColumn;
            } else {
                mcuExpected = mcusPerLine * frame.mcusPerColumn;
            }
            if (!resetInterval) {
                resetInterval = mcuExpected;
            }
            var h, v;
            while (mcu < mcuExpected) {
                for (i = 0; i < componentsLength; i++) {
                    components[i].pred = 0;
                }
                eobrun = 0;
                if (componentsLength === 1) {
                    component = components[0];
                    for (n = 0; n < resetInterval; n++) {
                        decodeBlock(component, decodeFn, mcu);
                        mcu++;
                    }
                } else {
                    for (n = 0; n < resetInterval; n++) {
                        for (i = 0; i < componentsLength; i++) {
                            component = components[i];
                            h = component.h;
                            v = component.v;
                            for (j = 0; j < v; j++) {
                                for (k = 0; k < h; k++) {
                                    decodeMcu(component, decodeFn, mcu, j, k);
                                }
                            }
                        }
                        mcu++;
                    }
                }
                bitsCount = 0;
                marker = data[offset] << 8 | data[offset + 1];
                if (marker <= 65280) {
                    throw "marker was not found";
                }
                if (marker >= 65488 && marker <= 65495) {
                    offset += 2;
                } else {
                    break;
                }
            }
            return offset - startOffset;
        }
        function quantizeAndInverse(component, blockBufferOffset, p) {
            var qt = component.quantizationTable, blockData = component.blockData;
            var v0, v1, v2, v3, v4, v5, v6, v7;
            var p0, p1, p2, p3, p4, p5, p6, p7;
            var t;
            for (var row = 0; row < 64; row += 8) {
                p0 = blockData[blockBufferOffset + row];
                p1 = blockData[blockBufferOffset + row + 1];
                p2 = blockData[blockBufferOffset + row + 2];
                p3 = blockData[blockBufferOffset + row + 3];
                p4 = blockData[blockBufferOffset + row + 4];
                p5 = blockData[blockBufferOffset + row + 5];
                p6 = blockData[blockBufferOffset + row + 6];
                p7 = blockData[blockBufferOffset + row + 7];
                p0 *= qt[row];
                if ((p1 | p2 | p3 | p4 | p5 | p6 | p7) === 0) {
                    t = dctSqrt2 * p0 + 512 >> 10;
                    p[row] = t;
                    p[row + 1] = t;
                    p[row + 2] = t;
                    p[row + 3] = t;
                    p[row + 4] = t;
                    p[row + 5] = t;
                    p[row + 6] = t;
                    p[row + 7] = t;
                    continue;
                }
                p1 *= qt[row + 1];
                p2 *= qt[row + 2];
                p3 *= qt[row + 3];
                p4 *= qt[row + 4];
                p5 *= qt[row + 5];
                p6 *= qt[row + 6];
                p7 *= qt[row + 7];
                v0 = dctSqrt2 * p0 + 128 >> 8;
                v1 = dctSqrt2 * p4 + 128 >> 8;
                v2 = p2;
                v3 = p6;
                v4 = dctSqrt1d2 * (p1 - p7) + 128 >> 8;
                v7 = dctSqrt1d2 * (p1 + p7) + 128 >> 8;
                v5 = p3 << 4;
                v6 = p5 << 4;
                v0 = v0 + v1 + 1 >> 1;
                v1 = v0 - v1;
                t = v2 * dctSin6 + v3 * dctCos6 + 128 >> 8;
                v2 = v2 * dctCos6 - v3 * dctSin6 + 128 >> 8;
                v3 = t;
                v4 = v4 + v6 + 1 >> 1;
                v6 = v4 - v6;
                v7 = v7 + v5 + 1 >> 1;
                v5 = v7 - v5;
                v0 = v0 + v3 + 1 >> 1;
                v3 = v0 - v3;
                v1 = v1 + v2 + 1 >> 1;
                v2 = v1 - v2;
                t = v4 * dctSin3 + v7 * dctCos3 + 2048 >> 12;
                v4 = v4 * dctCos3 - v7 * dctSin3 + 2048 >> 12;
                v7 = t;
                t = v5 * dctSin1 + v6 * dctCos1 + 2048 >> 12;
                v5 = v5 * dctCos1 - v6 * dctSin1 + 2048 >> 12;
                v6 = t;
                p[row] = v0 + v7;
                p[row + 7] = v0 - v7;
                p[row + 1] = v1 + v6;
                p[row + 6] = v1 - v6;
                p[row + 2] = v2 + v5;
                p[row + 5] = v2 - v5;
                p[row + 3] = v3 + v4;
                p[row + 4] = v3 - v4;
            }
            for (var col = 0; col < 8; ++col) {
                p0 = p[col];
                p1 = p[col + 8];
                p2 = p[col + 16];
                p3 = p[col + 24];
                p4 = p[col + 32];
                p5 = p[col + 40];
                p6 = p[col + 48];
                p7 = p[col + 56];
                if ((p1 | p2 | p3 | p4 | p5 | p6 | p7) === 0) {
                    t = dctSqrt2 * p0 + 8192 >> 14;
                    t = t < -2040 ? 0 : t >= 2024 ? 255 : t + 2056 >> 4;
                    blockData[blockBufferOffset + col] = t;
                    blockData[blockBufferOffset + col + 8] = t;
                    blockData[blockBufferOffset + col + 16] = t;
                    blockData[blockBufferOffset + col + 24] = t;
                    blockData[blockBufferOffset + col + 32] = t;
                    blockData[blockBufferOffset + col + 40] = t;
                    blockData[blockBufferOffset + col + 48] = t;
                    blockData[blockBufferOffset + col + 56] = t;
                    continue;
                }
                v0 = dctSqrt2 * p0 + 2048 >> 12;
                v1 = dctSqrt2 * p4 + 2048 >> 12;
                v2 = p2;
                v3 = p6;
                v4 = dctSqrt1d2 * (p1 - p7) + 2048 >> 12;
                v7 = dctSqrt1d2 * (p1 + p7) + 2048 >> 12;
                v5 = p3;
                v6 = p5;
                v0 = (v0 + v1 + 1 >> 1) + 4112;
                v1 = v0 - v1;
                t = v2 * dctSin6 + v3 * dctCos6 + 2048 >> 12;
                v2 = v2 * dctCos6 - v3 * dctSin6 + 2048 >> 12;
                v3 = t;
                v4 = v4 + v6 + 1 >> 1;
                v6 = v4 - v6;
                v7 = v7 + v5 + 1 >> 1;
                v5 = v7 - v5;
                v0 = v0 + v3 + 1 >> 1;
                v3 = v0 - v3;
                v1 = v1 + v2 + 1 >> 1;
                v2 = v1 - v2;
                t = v4 * dctSin3 + v7 * dctCos3 + 2048 >> 12;
                v4 = v4 * dctCos3 - v7 * dctSin3 + 2048 >> 12;
                v7 = t;
                t = v5 * dctSin1 + v6 * dctCos1 + 2048 >> 12;
                v5 = v5 * dctCos1 - v6 * dctSin1 + 2048 >> 12;
                v6 = t;
                p0 = v0 + v7;
                p7 = v0 - v7;
                p1 = v1 + v6;
                p6 = v1 - v6;
                p2 = v2 + v5;
                p5 = v2 - v5;
                p3 = v3 + v4;
                p4 = v3 - v4;
                p0 = p0 < 16 ? 0 : p0 >= 4080 ? 255 : p0 >> 4;
                p1 = p1 < 16 ? 0 : p1 >= 4080 ? 255 : p1 >> 4;
                p2 = p2 < 16 ? 0 : p2 >= 4080 ? 255 : p2 >> 4;
                p3 = p3 < 16 ? 0 : p3 >= 4080 ? 255 : p3 >> 4;
                p4 = p4 < 16 ? 0 : p4 >= 4080 ? 255 : p4 >> 4;
                p5 = p5 < 16 ? 0 : p5 >= 4080 ? 255 : p5 >> 4;
                p6 = p6 < 16 ? 0 : p6 >= 4080 ? 255 : p6 >> 4;
                p7 = p7 < 16 ? 0 : p7 >= 4080 ? 255 : p7 >> 4;
                blockData[blockBufferOffset + col] = p0;
                blockData[blockBufferOffset + col + 8] = p1;
                blockData[blockBufferOffset + col + 16] = p2;
                blockData[blockBufferOffset + col + 24] = p3;
                blockData[blockBufferOffset + col + 32] = p4;
                blockData[blockBufferOffset + col + 40] = p5;
                blockData[blockBufferOffset + col + 48] = p6;
                blockData[blockBufferOffset + col + 56] = p7;
            }
        }
        function buildComponentData(frame, component) {
            var blocksPerLine = component.blocksPerLine;
            var blocksPerColumn = component.blocksPerColumn;
            var computationBuffer = new Int16Array(64);
            for (var blockRow = 0; blockRow < blocksPerColumn; blockRow++) {
                for (var blockCol = 0; blockCol < blocksPerLine; blockCol++) {
                    var offset = getBlockBufferOffset(component, blockRow, blockCol);
                    quantizeAndInverse(component, offset, computationBuffer);
                }
            }
            return component.blockData;
        }
        function clamp0to255(a) {
            return a <= 0 ? 0 : a >= 255 ? 255 : a;
        }
        constructor.prototype = {
            parse: function parse(data) {
                function readUint16() {
                    var value = data[offset] << 8 | data[offset + 1];
                    offset += 2;
                    return value;
                }
                function readDataBlock() {
                    var length = readUint16();
                    var array = data.subarray(offset, offset + length - 2);
                    offset += array.length;
                    return array;
                }
                function prepareComponents(frame) {
                    var mcusPerLine = Math.ceil(frame.samplesPerLine / 8 / frame.maxH);
                    var mcusPerColumn = Math.ceil(frame.scanLines / 8 / frame.maxV);
                    for (var i = 0; i < frame.components.length; i++) {
                        component = frame.components[i];
                        var blocksPerLine = Math.ceil(Math.ceil(frame.samplesPerLine / 8) * component.h / frame.maxH);
                        var blocksPerColumn = Math.ceil(Math.ceil(frame.scanLines / 8) * component.v / frame.maxV);
                        var blocksPerLineForMcu = mcusPerLine * component.h;
                        var blocksPerColumnForMcu = mcusPerColumn * component.v;
                        var blocksBufferSize = 64 * blocksPerColumnForMcu * (blocksPerLineForMcu + 1);
                        component.blockData = new Int16Array(blocksBufferSize);
                        component.blocksPerLine = blocksPerLine;
                        component.blocksPerColumn = blocksPerColumn;
                    }
                    frame.mcusPerLine = mcusPerLine;
                    frame.mcusPerColumn = mcusPerColumn;
                }
                var offset = 0, length = data.length;
                var jfif = null;
                var adobe = null;
                var pixels = null;
                var frame, resetInterval;
                var quantizationTables = [];
                var huffmanTablesAC = [], huffmanTablesDC = [];
                var fileMarker = readUint16();
                if (fileMarker !== 65496) {
                    throw "SOI not found";
                }
                fileMarker = readUint16();
                while (fileMarker !== 65497) {
                    var i, j, l;
                    switch (fileMarker) {
                      case 65504:
                      case 65505:
                      case 65506:
                      case 65507:
                      case 65508:
                      case 65509:
                      case 65510:
                      case 65511:
                      case 65512:
                      case 65513:
                      case 65514:
                      case 65515:
                      case 65516:
                      case 65517:
                      case 65518:
                      case 65519:
                      case 65534:
                        var appData = readDataBlock();
                        if (fileMarker === 65504) {
                            if (appData[0] === 74 && appData[1] === 70 && appData[2] === 73 && appData[3] === 70 && appData[4] === 0) {
                                jfif = {
                                    version: {
                                        major: appData[5],
                                        minor: appData[6]
                                    },
                                    densityUnits: appData[7],
                                    xDensity: appData[8] << 8 | appData[9],
                                    yDensity: appData[10] << 8 | appData[11],
                                    thumbWidth: appData[12],
                                    thumbHeight: appData[13],
                                    thumbData: appData.subarray(14, 14 + 3 * appData[12] * appData[13])
                                };
                            }
                        }
                        if (fileMarker === 65518) {
                            if (appData[0] === 65 && appData[1] === 100 && appData[2] === 111 && appData[3] === 98 && appData[4] === 101 && appData[5] === 0) {
                                adobe = {
                                    version: appData[6],
                                    flags0: appData[7] << 8 | appData[8],
                                    flags1: appData[9] << 8 | appData[10],
                                    transformCode: appData[11]
                                };
                            }
                        }
                        break;

                      case 65499:
                        var quantizationTablesLength = readUint16();
                        var quantizationTablesEnd = quantizationTablesLength + offset - 2;
                        var z;
                        while (offset < quantizationTablesEnd) {
                            var quantizationTableSpec = data[offset++];
                            var tableData = new Uint16Array(64);
                            if (quantizationTableSpec >> 4 === 0) {
                                for (j = 0; j < 64; j++) {
                                    z = dctZigZag[j];
                                    tableData[z] = data[offset++];
                                }
                            } else if (quantizationTableSpec >> 4 === 1) {
                                for (j = 0; j < 64; j++) {
                                    z = dctZigZag[j];
                                    tableData[z] = readUint16();
                                }
                            } else {
                                throw "DQT: invalid table spec";
                            }
                            quantizationTables[quantizationTableSpec & 15] = tableData;
                        }
                        break;

                      case 65472:
                      case 65473:
                      case 65474:
                        if (frame) {
                            throw "Only single frame JPEGs supported";
                        }
                        readUint16();
                        frame = {};
                        frame.extended = fileMarker === 65473;
                        frame.progressive = fileMarker === 65474;
                        frame.precision = data[offset++];
                        frame.scanLines = readUint16();
                        frame.samplesPerLine = readUint16();
                        frame.components = [];
                        frame.componentIds = {};
                        var componentsCount = data[offset++], componentId;
                        var maxH = 0, maxV = 0;
                        for (i = 0; i < componentsCount; i++) {
                            componentId = data[offset];
                            var h = data[offset + 1] >> 4;
                            var v = data[offset + 1] & 15;
                            if (maxH < h) {
                                maxH = h;
                            }
                            if (maxV < v) {
                                maxV = v;
                            }
                            var qId = data[offset + 2];
                            l = frame.components.push({
                                h: h,
                                v: v,
                                quantizationTable: quantizationTables[qId]
                            });
                            frame.componentIds[componentId] = l - 1;
                            offset += 3;
                        }
                        frame.maxH = maxH;
                        frame.maxV = maxV;
                        prepareComponents(frame);
                        break;

                      case 65476:
                        var huffmanLength = readUint16();
                        for (i = 2; i < huffmanLength; ) {
                            var huffmanTableSpec = data[offset++];
                            var codeLengths = new Uint8Array(16);
                            var codeLengthSum = 0;
                            for (j = 0; j < 16; j++, offset++) {
                                codeLengthSum += codeLengths[j] = data[offset];
                            }
                            var huffmanValues = new Uint8Array(codeLengthSum);
                            for (j = 0; j < codeLengthSum; j++, offset++) {
                                huffmanValues[j] = data[offset];
                            }
                            i += 17 + codeLengthSum;
                            (huffmanTableSpec >> 4 === 0 ? huffmanTablesDC : huffmanTablesAC)[huffmanTableSpec & 15] = buildHuffmanTable(codeLengths, huffmanValues);
                        }
                        break;

                      case 65501:
                        readUint16();
                        resetInterval = readUint16();
                        break;

                      case 65498:
                        var scanLength = readUint16();
                        var selectorsCount = data[offset++];
                        var components = [], component;
                        for (i = 0; i < selectorsCount; i++) {
                            var componentIndex = frame.componentIds[data[offset++]];
                            component = frame.components[componentIndex];
                            var tableSpec = data[offset++];
                            component.huffmanTableDC = huffmanTablesDC[tableSpec >> 4];
                            component.huffmanTableAC = huffmanTablesAC[tableSpec & 15];
                            components.push(component);
                        }
                        var spectralStart = data[offset++];
                        var spectralEnd = data[offset++];
                        var successiveApproximation = data[offset++];
                        var processed = decodeScan(data, offset, frame, components, resetInterval, spectralStart, spectralEnd, successiveApproximation >> 4, successiveApproximation & 15);
                        offset += processed;
                        break;

                      case 65535:
                        if (data[offset] !== 255) {
                            offset--;
                        }
                        break;

                      default:
                        if (data[offset - 3] === 255 && data[offset - 2] >= 192 && data[offset - 2] <= 254) {
                            offset -= 3;
                            break;
                        }
                        throw "unknown JPEG marker " + fileMarker.toString(16);
                    }
                    fileMarker = readUint16();
                }
                this.width = frame.samplesPerLine;
                this.height = frame.scanLines;
                this.jfif = jfif;
                this.adobe = adobe;
                this.components = [];
                for (i = 0; i < frame.components.length; i++) {
                    component = frame.components[i];
                    this.components.push({
                        output: buildComponentData(frame, component),
                        scaleX: component.h / frame.maxH,
                        scaleY: component.v / frame.maxV,
                        blocksPerLine: component.blocksPerLine,
                        blocksPerColumn: component.blocksPerColumn
                    });
                }
                this.numComponents = this.components.length;
            },
            _getLinearizedBlockData: function getLinearizedBlockData(width, height) {
                var scaleX = this.width / width, scaleY = this.height / height;
                var component, componentScaleX, componentScaleY, blocksPerScanline;
                var x, y, i, j, k;
                var index;
                var offset = 0;
                var output;
                var numComponents = this.components.length;
                var dataLength = width * height * numComponents;
                var data = new Uint8Array(dataLength);
                var xScaleBlockOffset = new Uint32Array(width);
                var mask3LSB = 4294967288;
                for (i = 0; i < numComponents; i++) {
                    component = this.components[i];
                    componentScaleX = component.scaleX * scaleX;
                    componentScaleY = component.scaleY * scaleY;
                    offset = i;
                    output = component.output;
                    blocksPerScanline = component.blocksPerLine + 1 << 3;
                    for (x = 0; x < width; x++) {
                        j = 0 | x * componentScaleX;
                        xScaleBlockOffset[x] = (j & mask3LSB) << 3 | j & 7;
                    }
                    for (y = 0; y < height; y++) {
                        j = 0 | y * componentScaleY;
                        index = blocksPerScanline * (j & mask3LSB) | (j & 7) << 3;
                        for (x = 0; x < width; x++) {
                            data[offset] = output[index + xScaleBlockOffset[x]];
                            offset += numComponents;
                        }
                    }
                }
                var transform = this.decodeTransform;
                if (transform) {
                    for (i = 0; i < dataLength; ) {
                        for (j = 0, k = 0; j < numComponents; j++, i++, k += 2) {
                            data[i] = (data[i] * transform[k] >> 8) + transform[k + 1];
                        }
                    }
                }
                return data;
            },
            _isColorConversionNeeded: function isColorConversionNeeded() {
                if (this.adobe && this.adobe.transformCode) {
                    return true;
                } else if (this.numComponents === 3) {
                    return true;
                } else {
                    return false;
                }
            },
            _convertYccToRgb: function convertYccToRgb(data) {
                var Y, Cb, Cr;
                for (var i = 0, length = data.length; i < length; i += 3) {
                    Y = data[i];
                    Cb = data[i + 1];
                    Cr = data[i + 2];
                    data[i] = clamp0to255(Y - 179.456 + 1.402 * Cr);
                    data[i + 1] = clamp0to255(Y + 135.459 - .344 * Cb - .714 * Cr);
                    data[i + 2] = clamp0to255(Y - 226.816 + 1.772 * Cb);
                }
                return data;
            },
            _convertYcckToRgb: function convertYcckToRgb(data) {
                var Y, Cb, Cr, k;
                var offset = 0;
                for (var i = 0, length = data.length; i < length; i += 4) {
                    Y = data[i];
                    Cb = data[i + 1];
                    Cr = data[i + 2];
                    k = data[i + 3];
                    var r = -122.67195406894 + Cb * (-660635669420364e-19 * Cb + .000437130475926232 * Cr - 54080610064599e-18 * Y + .00048449797120281 * k - .154362151871126) + Cr * (-.000957964378445773 * Cr + .000817076911346625 * Y - .00477271405408747 * k + 1.53380253221734) + Y * (.000961250184130688 * Y - .00266257332283933 * k + .48357088451265) + k * (-.000336197177618394 * k + .484791561490776);
                    var g = 107.268039397724 + Cb * (219927104525741e-19 * Cb - .000640992018297945 * Cr + .000659397001245577 * Y + .000426105652938837 * k - .176491792462875) + Cr * (-.000778269941513683 * Cr + .00130872261408275 * Y + .000770482631801132 * k - .151051492775562) + Y * (.00126935368114843 * Y - .00265090189010898 * k + .25802910206845) + k * (-.000318913117588328 * k - .213742400323665);
                    var b = -20.810012546947 + Cb * (-.000570115196973677 * Cb - 263409051004589e-19 * Cr + .0020741088115012 * Y - .00288260236853442 * k + .814272968359295) + Cr * (-153496057440975e-19 * Cr - .000132689043961446 * Y + .000560833691242812 * k - .195152027534049) + Y * (.00174418132927582 * Y - .00255243321439347 * k + .116935020465145) + k * (-.000343531996510555 * k + .24165260232407);
                    data[offset++] = clamp0to255(r);
                    data[offset++] = clamp0to255(g);
                    data[offset++] = clamp0to255(b);
                }
                return data;
            },
            _convertYcckToCmyk: function convertYcckToCmyk(data) {
                var Y, Cb, Cr;
                for (var i = 0, length = data.length; i < length; i += 4) {
                    Y = data[i];
                    Cb = data[i + 1];
                    Cr = data[i + 2];
                    data[i] = clamp0to255(434.456 - Y - 1.402 * Cr);
                    data[i + 1] = clamp0to255(119.541 - Y + .344 * Cb + .714 * Cr);
                    data[i + 2] = clamp0to255(481.816 - Y - 1.772 * Cb);
                }
                return data;
            },
            _convertCmykToRgb: function convertCmykToRgb(data) {
                var c, m, y, k;
                var offset = 0;
                var min = -255 * 255 * 255;
                var scale = 1 / 255 / 255;
                for (var i = 0, length = data.length; i < length; i += 4) {
                    c = data[i];
                    m = data[i + 1];
                    y = data[i + 2];
                    k = data[i + 3];
                    var r = c * (-4.387332384609988 * c + 54.48615194189176 * m + 18.82290502165302 * y + 212.25662451639585 * k - 72734.4411664936) + m * (1.7149763477362134 * m - 5.6096736904047315 * y - 17.873870861415444 * k - 1401.7366389350734) + y * (-2.5217340131683033 * y - 21.248923337353073 * k + 4465.541406466231) - k * (21.86122147463605 * k + 48317.86113160301);
                    var g = c * (8.841041422036149 * c + 60.118027045597366 * m + 6.871425592049007 * y + 31.159100130055922 * k - 20220.756542821975) + m * (-15.310361306967817 * m + 17.575251261109482 * y + 131.35250912493976 * k - 48691.05921601825) + y * (4.444339102852739 * y + 9.8632861493405 * k - 6341.191035517494) - k * (20.737325471181034 * k + 47890.15695978492);
                    var b = c * (.8842522430003296 * c + 8.078677503112928 * m + 30.89978309703729 * y - .23883238689178934 * k - 3616.812083916688) + m * (10.49593273432072 * m + 63.02378494754052 * y + 50.606957656360734 * k - 28620.90484698408) + y * (.03296041114873217 * y + 115.60384449646641 * k - 49363.43385999684) - k * (22.33816807309886 * k + 45932.16563550634);
                    data[offset++] = r >= 0 ? 255 : r <= min ? 0 : 255 + r * scale | 0;
                    data[offset++] = g >= 0 ? 255 : g <= min ? 0 : 255 + g * scale | 0;
                    data[offset++] = b >= 0 ? 255 : b <= min ? 0 : 255 + b * scale | 0;
                }
                return data;
            },
            getData: function getData(width, height, forceRGBoutput) {
                if (this.numComponents > 4) {
                    throw "Unsupported color mode";
                }
                var data = this._getLinearizedBlockData(width, height);
                if (this.numComponents === 3) {
                    return this._convertYccToRgb(data);
                } else if (this.numComponents === 4) {
                    if (this._isColorConversionNeeded()) {
                        if (forceRGBoutput) {
                            return this._convertYcckToRgb(data);
                        } else {
                            return this._convertYcckToCmyk(data);
                        }
                    } else if (forceRGBoutput) {
                        return this._convertCmykToRgb(data);
                    }
                }
                return data;
            }
        };
        return constructor;
    }();
    "use strict";
    var ArithmeticDecoder = function ArithmeticDecoderClosure() {
        var QeTable = [ {
            qe: 22017,
            nmps: 1,
            nlps: 1,
            switchFlag: 1
        }, {
            qe: 13313,
            nmps: 2,
            nlps: 6,
            switchFlag: 0
        }, {
            qe: 6145,
            nmps: 3,
            nlps: 9,
            switchFlag: 0
        }, {
            qe: 2753,
            nmps: 4,
            nlps: 12,
            switchFlag: 0
        }, {
            qe: 1313,
            nmps: 5,
            nlps: 29,
            switchFlag: 0
        }, {
            qe: 545,
            nmps: 38,
            nlps: 33,
            switchFlag: 0
        }, {
            qe: 22017,
            nmps: 7,
            nlps: 6,
            switchFlag: 1
        }, {
            qe: 21505,
            nmps: 8,
            nlps: 14,
            switchFlag: 0
        }, {
            qe: 18433,
            nmps: 9,
            nlps: 14,
            switchFlag: 0
        }, {
            qe: 14337,
            nmps: 10,
            nlps: 14,
            switchFlag: 0
        }, {
            qe: 12289,
            nmps: 11,
            nlps: 17,
            switchFlag: 0
        }, {
            qe: 9217,
            nmps: 12,
            nlps: 18,
            switchFlag: 0
        }, {
            qe: 7169,
            nmps: 13,
            nlps: 20,
            switchFlag: 0
        }, {
            qe: 5633,
            nmps: 29,
            nlps: 21,
            switchFlag: 0
        }, {
            qe: 22017,
            nmps: 15,
            nlps: 14,
            switchFlag: 1
        }, {
            qe: 21505,
            nmps: 16,
            nlps: 14,
            switchFlag: 0
        }, {
            qe: 20737,
            nmps: 17,
            nlps: 15,
            switchFlag: 0
        }, {
            qe: 18433,
            nmps: 18,
            nlps: 16,
            switchFlag: 0
        }, {
            qe: 14337,
            nmps: 19,
            nlps: 17,
            switchFlag: 0
        }, {
            qe: 13313,
            nmps: 20,
            nlps: 18,
            switchFlag: 0
        }, {
            qe: 12289,
            nmps: 21,
            nlps: 19,
            switchFlag: 0
        }, {
            qe: 10241,
            nmps: 22,
            nlps: 19,
            switchFlag: 0
        }, {
            qe: 9217,
            nmps: 23,
            nlps: 20,
            switchFlag: 0
        }, {
            qe: 8705,
            nmps: 24,
            nlps: 21,
            switchFlag: 0
        }, {
            qe: 7169,
            nmps: 25,
            nlps: 22,
            switchFlag: 0
        }, {
            qe: 6145,
            nmps: 26,
            nlps: 23,
            switchFlag: 0
        }, {
            qe: 5633,
            nmps: 27,
            nlps: 24,
            switchFlag: 0
        }, {
            qe: 5121,
            nmps: 28,
            nlps: 25,
            switchFlag: 0
        }, {
            qe: 4609,
            nmps: 29,
            nlps: 26,
            switchFlag: 0
        }, {
            qe: 4353,
            nmps: 30,
            nlps: 27,
            switchFlag: 0
        }, {
            qe: 2753,
            nmps: 31,
            nlps: 28,
            switchFlag: 0
        }, {
            qe: 2497,
            nmps: 32,
            nlps: 29,
            switchFlag: 0
        }, {
            qe: 2209,
            nmps: 33,
            nlps: 30,
            switchFlag: 0
        }, {
            qe: 1313,
            nmps: 34,
            nlps: 31,
            switchFlag: 0
        }, {
            qe: 1089,
            nmps: 35,
            nlps: 32,
            switchFlag: 0
        }, {
            qe: 673,
            nmps: 36,
            nlps: 33,
            switchFlag: 0
        }, {
            qe: 545,
            nmps: 37,
            nlps: 34,
            switchFlag: 0
        }, {
            qe: 321,
            nmps: 38,
            nlps: 35,
            switchFlag: 0
        }, {
            qe: 273,
            nmps: 39,
            nlps: 36,
            switchFlag: 0
        }, {
            qe: 133,
            nmps: 40,
            nlps: 37,
            switchFlag: 0
        }, {
            qe: 73,
            nmps: 41,
            nlps: 38,
            switchFlag: 0
        }, {
            qe: 37,
            nmps: 42,
            nlps: 39,
            switchFlag: 0
        }, {
            qe: 21,
            nmps: 43,
            nlps: 40,
            switchFlag: 0
        }, {
            qe: 9,
            nmps: 44,
            nlps: 41,
            switchFlag: 0
        }, {
            qe: 5,
            nmps: 45,
            nlps: 42,
            switchFlag: 0
        }, {
            qe: 1,
            nmps: 45,
            nlps: 43,
            switchFlag: 0
        }, {
            qe: 22017,
            nmps: 46,
            nlps: 46,
            switchFlag: 0
        } ];
        function ArithmeticDecoder(data, start, end) {
            this.data = data;
            this.bp = start;
            this.dataEnd = end;
            this.chigh = data[start];
            this.clow = 0;
            this.byteIn();
            this.chigh = this.chigh << 7 & 65535 | this.clow >> 9 & 127;
            this.clow = this.clow << 7 & 65535;
            this.ct -= 7;
            this.a = 32768;
        }
        ArithmeticDecoder.prototype = {
            byteIn: function ArithmeticDecoder_byteIn() {
                var data = this.data;
                var bp = this.bp;
                if (data[bp] === 255) {
                    var b1 = data[bp + 1];
                    if (b1 > 143) {
                        this.clow += 65280;
                        this.ct = 8;
                    } else {
                        bp++;
                        this.clow += data[bp] << 9;
                        this.ct = 7;
                        this.bp = bp;
                    }
                } else {
                    bp++;
                    this.clow += bp < this.dataEnd ? data[bp] << 8 : 65280;
                    this.ct = 8;
                    this.bp = bp;
                }
                if (this.clow > 65535) {
                    this.chigh += this.clow >> 16;
                    this.clow &= 65535;
                }
            },
            readBit: function ArithmeticDecoder_readBit(contexts, pos) {
                var cx_index = contexts[pos] >> 1, cx_mps = contexts[pos] & 1;
                var qeTableIcx = QeTable[cx_index];
                var qeIcx = qeTableIcx.qe;
                var d;
                var a = this.a - qeIcx;
                if (this.chigh < qeIcx) {
                    if (a < qeIcx) {
                        a = qeIcx;
                        d = cx_mps;
                        cx_index = qeTableIcx.nmps;
                    } else {
                        a = qeIcx;
                        d = 1 ^ cx_mps;
                        if (qeTableIcx.switchFlag === 1) {
                            cx_mps = d;
                        }
                        cx_index = qeTableIcx.nlps;
                    }
                } else {
                    this.chigh -= qeIcx;
                    if ((a & 32768) !== 0) {
                        this.a = a;
                        return cx_mps;
                    }
                    if (a < qeIcx) {
                        d = 1 ^ cx_mps;
                        if (qeTableIcx.switchFlag === 1) {
                            cx_mps = d;
                        }
                        cx_index = qeTableIcx.nlps;
                    } else {
                        d = cx_mps;
                        cx_index = qeTableIcx.nmps;
                    }
                }
                do {
                    if (this.ct === 0) {
                        this.byteIn();
                    }
                    a <<= 1;
                    this.chigh = this.chigh << 1 & 65535 | this.clow >> 15 & 1;
                    this.clow = this.clow << 1 & 65535;
                    this.ct--;
                } while ((a & 32768) === 0);
                this.a = a;
                contexts[pos] = cx_index << 1 | cx_mps;
                return d;
            }
        };
        return ArithmeticDecoder;
    }();
    //"use strict";
    //var JpxImage = function JpxImageClosure() {
    //    var SubbandsGainLog2 = {
    //        LL: 0,
    //        LH: 1,
    //        HL: 1,
    //        HH: 2
    //    };
    //    function JpxImage() {
    //        this.failOnCorruptedImage = false;
    //    }
    //    JpxImage.prototype = {
    //        parse: function JpxImage_parse(data) {
    //            var head = readUint16(data, 0);
    //            if (head === 65359) {
    //                this.parseCodestream(data, 0, data.length);
    //                return;
    //            }
    //            var position = 0, length = data.length;
    //            while (position < length) {
    //                var headerSize = 8;
    //                var lbox = readUint32(data, position);
    //                var tbox = readUint32(data, position + 4);
    //                position += headerSize;
    //                if (lbox === 1) {
    //                    lbox = readUint32(data, position) * 4294967296 + readUint32(data, position + 4);
    //                    position += 8;
    //                    headerSize += 8;
    //                }
    //                if (lbox === 0) {
    //                    lbox = length - position + headerSize;
    //                }
    //                if (lbox < headerSize) {
    //                    throw new Error("JPX Error: Invalid box field size");
    //                }
    //                var dataLength = lbox - headerSize;
    //                var jumpDataLength = true;
    //                switch (tbox) {
    //                  case 1785737832:
    //                    jumpDataLength = false;
    //                    break;
    //
    //                  case 1668246642:
    //                    var method = data[position];
    //                    var precedence = data[position + 1];
    //                    var approximation = data[position + 2];
    //                    if (method === 1) {
    //                        var colorspace = readUint32(data, position + 3);
    //                        switch (colorspace) {
    //                          case 16:
    //                          case 17:
    //                          case 18:
    //                            break;
    //
    //                          default:
    //                            warn("Unknown colorspace " + colorspace);
    //                            break;
    //                        }
    //                    } else if (method === 2) {
    //                        info("ICC profile not supported");
    //                    }
    //                    break;
    //
    //                  case 1785737827:
    //                    this.parseCodestream(data, position, position + dataLength);
    //                    break;
    //
    //                  case 1783636e3:
    //                    if (218793738 !== readUint32(data, position)) {
    //                        warn("Invalid JP2 signature");
    //                    }
    //                    break;
    //
    //                  case 1783634458:
    //                  case 1718909296:
    //                  case 1920099697:
    //                  case 1919251232:
    //                  case 1768449138:
    //                    break;
    //
    //                  default:
    //                    var headerType = String.fromCharCode(tbox >> 24 & 255, tbox >> 16 & 255, tbox >> 8 & 255, tbox & 255);
    //                    warn("Unsupported header type " + tbox + " (" + headerType + ")");
    //                    break;
    //                }
    //                if (jumpDataLength) {
    //                    position += dataLength;
    //                }
    //            }
    //        },
    //        parseImageProperties: function JpxImage_parseImageProperties(stream) {
    //            var newByte = stream.getByte();
    //            while (newByte >= 0) {
    //                var oldByte = newByte;
    //                newByte = stream.getByte();
    //                var code = oldByte << 8 | newByte;
    //                if (code === 65361) {
    //                    stream.skip(4);
    //                    var Xsiz = stream.getInt32() >>> 0;
    //                    var Ysiz = stream.getInt32() >>> 0;
    //                    var XOsiz = stream.getInt32() >>> 0;
    //                    var YOsiz = stream.getInt32() >>> 0;
    //                    stream.skip(16);
    //                    var Csiz = stream.getUint16();
    //                    this.width = Xsiz - XOsiz;
    //                    this.height = Ysiz - YOsiz;
    //                    this.componentsCount = Csiz;
    //                    this.bitsPerComponent = 8;
    //                    return;
    //                }
    //            }
    //            throw new Error("JPX Error: No size marker found in JPX stream");
    //        },
    //        parseCodestream: function JpxImage_parseCodestream(data, start, end) {
    //            var context = {};
    //            try {
    //                var doNotRecover = false;
    //                var position = start;
    //                while (position + 1 < end) {
    //                    var code = readUint16(data, position);
    //                    position += 2;
    //                    var length = 0, j, sqcd, spqcds, spqcdSize, scalarExpounded, tile;
    //                    switch (code) {
    //                      case 65359:
    //                        context.mainHeader = true;
    //                        break;
    //
    //                      case 65497:
    //                        break;
    //
    //                      case 65361:
    //                        length = readUint16(data, position);
    //                        var siz = {};
    //                        siz.Xsiz = readUint32(data, position + 4);
    //                        siz.Ysiz = readUint32(data, position + 8);
    //                        siz.XOsiz = readUint32(data, position + 12);
    //                        siz.YOsiz = readUint32(data, position + 16);
    //                        siz.XTsiz = readUint32(data, position + 20);
    //                        siz.YTsiz = readUint32(data, position + 24);
    //                        siz.XTOsiz = readUint32(data, position + 28);
    //                        siz.YTOsiz = readUint32(data, position + 32);
    //                        var componentsCount = readUint16(data, position + 36);
    //                        siz.Csiz = componentsCount;
    //                        var components = [];
    //                        j = position + 38;
    //                        for (var i = 0; i < componentsCount; i++) {
    //                            var component = {
    //                                precision: (data[j] & 127) + 1,
    //                                isSigned: !!(data[j] & 128),
    //                                XRsiz: data[j + 1],
    //                                YRsiz: data[j + 1]
    //                            };
    //                            calculateComponentDimensions(component, siz);
    //                            components.push(component);
    //                        }
    //                        context.SIZ = siz;
    //                        context.components = components;
    //                        calculateTileGrids(context, components);
    //                        context.QCC = [];
    //                        context.COC = [];
    //                        break;
    //
    //                      case 65372:
    //                        length = readUint16(data, position);
    //                        var qcd = {};
    //                        j = position + 2;
    //                        sqcd = data[j++];
    //                        switch (sqcd & 31) {
    //                          case 0:
    //                            spqcdSize = 8;
    //                            scalarExpounded = true;
    //                            break;
    //
    //                          case 1:
    //                            spqcdSize = 16;
    //                            scalarExpounded = false;
    //                            break;
    //
    //                          case 2:
    //                            spqcdSize = 16;
    //                            scalarExpounded = true;
    //                            break;
    //
    //                          default:
    //                            throw new Error("JPX Error: Invalid SQcd value " + sqcd);
    //                        }
    //                        qcd.noQuantization = spqcdSize === 8;
    //                        qcd.scalarExpounded = scalarExpounded;
    //                        qcd.guardBits = sqcd >> 5;
    //                        spqcds = [];
    //                        while (j < length + position) {
    //                            var spqcd = {};
    //                            if (spqcdSize === 8) {
    //                                spqcd.epsilon = data[j++] >> 3;
    //                                spqcd.mu = 0;
    //                            } else {
    //                                spqcd.epsilon = data[j] >> 3;
    //                                spqcd.mu = (data[j] & 7) << 8 | data[j + 1];
    //                                j += 2;
    //                            }
    //                            spqcds.push(spqcd);
    //                        }
    //                        qcd.SPqcds = spqcds;
    //                        if (context.mainHeader) {
    //                            context.QCD = qcd;
    //                        } else {
    //                            context.currentTile.QCD = qcd;
    //                            context.currentTile.QCC = [];
    //                        }
    //                        break;
    //
    //                      case 65373:
    //                        length = readUint16(data, position);
    //                        var qcc = {};
    //                        j = position + 2;
    //                        var cqcc;
    //                        if (context.SIZ.Csiz < 257) {
    //                            cqcc = data[j++];
    //                        } else {
    //                            cqcc = readUint16(data, j);
    //                            j += 2;
    //                        }
    //                        sqcd = data[j++];
    //                        switch (sqcd & 31) {
    //                          case 0:
    //                            spqcdSize = 8;
    //                            scalarExpounded = true;
    //                            break;
    //
    //                          case 1:
    //                            spqcdSize = 16;
    //                            scalarExpounded = false;
    //                            break;
    //
    //                          case 2:
    //                            spqcdSize = 16;
    //                            scalarExpounded = true;
    //                            break;
    //
    //                          default:
    //                            throw new Error("JPX Error: Invalid SQcd value " + sqcd);
    //                        }
    //                        qcc.noQuantization = spqcdSize === 8;
    //                        qcc.scalarExpounded = scalarExpounded;
    //                        qcc.guardBits = sqcd >> 5;
    //                        spqcds = [];
    //                        while (j < length + position) {
    //                            spqcd = {};
    //                            if (spqcdSize === 8) {
    //                                spqcd.epsilon = data[j++] >> 3;
    //                                spqcd.mu = 0;
    //                            } else {
    //                                spqcd.epsilon = data[j] >> 3;
    //                                spqcd.mu = (data[j] & 7) << 8 | data[j + 1];
    //                                j += 2;
    //                            }
    //                            spqcds.push(spqcd);
    //                        }
    //                        qcc.SPqcds = spqcds;
    //                        if (context.mainHeader) {
    //                            context.QCC[cqcc] = qcc;
    //                        } else {
    //                            context.currentTile.QCC[cqcc] = qcc;
    //                        }
    //                        break;
    //
    //                      case 65362:
    //                        length = readUint16(data, position);
    //                        var cod = {};
    //                        j = position + 2;
    //                        var scod = data[j++];
    //                        cod.entropyCoderWithCustomPrecincts = !!(scod & 1);
    //                        cod.sopMarkerUsed = !!(scod & 2);
    //                        cod.ephMarkerUsed = !!(scod & 4);
    //                        cod.progressionOrder = data[j++];
    //                        cod.layersCount = readUint16(data, j);
    //                        j += 2;
    //                        cod.multipleComponentTransform = data[j++];
    //                        cod.decompositionLevelsCount = data[j++];
    //                        cod.xcb = (data[j++] & 15) + 2;
    //                        cod.ycb = (data[j++] & 15) + 2;
    //                        var blockStyle = data[j++];
    //                        cod.selectiveArithmeticCodingBypass = !!(blockStyle & 1);
    //                        cod.resetContextProbabilities = !!(blockStyle & 2);
    //                        cod.terminationOnEachCodingPass = !!(blockStyle & 4);
    //                        cod.verticalyStripe = !!(blockStyle & 8);
    //                        cod.predictableTermination = !!(blockStyle & 16);
    //                        cod.segmentationSymbolUsed = !!(blockStyle & 32);
    //                        cod.reversibleTransformation = data[j++];
    //                        if (cod.entropyCoderWithCustomPrecincts) {
    //                            var precinctsSizes = [];
    //                            while (j < length + position) {
    //                                var precinctsSize = data[j++];
    //                                precinctsSizes.push({
    //                                    PPx: precinctsSize & 15,
    //                                    PPy: precinctsSize >> 4
    //                                });
    //                            }
    //                            cod.precinctsSizes = precinctsSizes;
    //                        }
    //                        var unsupported = [];
    //                        if (cod.selectiveArithmeticCodingBypass) {
    //                            unsupported.push("selectiveArithmeticCodingBypass");
    //                        }
    //                        if (cod.resetContextProbabilities) {
    //                            unsupported.push("resetContextProbabilities");
    //                        }
    //                        if (cod.terminationOnEachCodingPass) {
    //                            unsupported.push("terminationOnEachCodingPass");
    //                        }
    //                        if (cod.verticalyStripe) {
    //                            unsupported.push("verticalyStripe");
    //                        }
    //                        if (cod.predictableTermination) {
    //                            unsupported.push("predictableTermination");
    //                        }
    //                        if (unsupported.length > 0) {
    //                            doNotRecover = true;
    //                            throw new Error("JPX Error: Unsupported COD options (" + unsupported.join(", ") + ")");
    //                        }
    //                        if (context.mainHeader) {
    //                            context.COD = cod;
    //                        } else {
    //                            context.currentTile.COD = cod;
    //                            context.currentTile.COC = [];
    //                        }
    //                        break;
    //
    //                      case 65424:
    //                        length = readUint16(data, position);
    //                        tile = {};
    //                        tile.index = readUint16(data, position + 2);
    //                        tile.length = readUint32(data, position + 4);
    //                        tile.dataEnd = tile.length + position - 2;
    //                        tile.partIndex = data[position + 8];
    //                        tile.partsCount = data[position + 9];
    //                        context.mainHeader = false;
    //                        if (tile.partIndex === 0) {
    //                            tile.COD = context.COD;
    //                            tile.COC = context.COC.slice(0);
    //                            tile.QCD = context.QCD;
    //                            tile.QCC = context.QCC.slice(0);
    //                        }
    //                        context.currentTile = tile;
    //                        break;
    //
    //                      case 65427:
    //                        tile = context.currentTile;
    //                        if (tile.partIndex === 0) {
    //                            initializeTile(context, tile.index);
    //                            buildPackets(context);
    //                        }
    //                        length = tile.dataEnd - position;
    //                        parseTilePackets(context, data, position, length);
    //                        break;
    //
    //                      case 65365:
    //                      case 65367:
    //                      case 65368:
    //                      case 65380:
    //                        length = readUint16(data, position);
    //                        break;
    //
    //                      case 65363:
    //                        throw new Error("JPX Error: Codestream code 0xFF53 (COC) is " + "not implemented");
    //
    //                      default:
    //                        throw new Error("JPX Error: Unknown codestream code: " + code.toString(16));
    //                    }
    //                    position += length;
    //                }
    //            } catch (e) {
    //                if (doNotRecover || this.failOnCorruptedImage) {
    //                    throw e;
    //                } else {
    //                    warn("Trying to recover from " + e.message);
    //                }
    //            }
    //            this.tiles = transformComponents(context);
    //            this.width = context.SIZ.Xsiz - context.SIZ.XOsiz;
    //            this.height = context.SIZ.Ysiz - context.SIZ.YOsiz;
    //            this.componentsCount = context.SIZ.Csiz;
    //        }
    //    };
    //    function calculateComponentDimensions(component, siz) {
    //        component.x0 = Math.ceil(siz.XOsiz / component.XRsiz);
    //        component.x1 = Math.ceil(siz.Xsiz / component.XRsiz);
    //        component.y0 = Math.ceil(siz.YOsiz / component.YRsiz);
    //        component.y1 = Math.ceil(siz.Ysiz / component.YRsiz);
    //        component.width = component.x1 - component.x0;
    //        component.height = component.y1 - component.y0;
    //    }
    //    function calculateTileGrids(context, components) {
    //        var siz = context.SIZ;
    //        var tile, tiles = [];
    //        var numXtiles = Math.ceil((siz.Xsiz - siz.XTOsiz) / siz.XTsiz);
    //        var numYtiles = Math.ceil((siz.Ysiz - siz.YTOsiz) / siz.YTsiz);
    //        for (var q = 0; q < numYtiles; q++) {
    //            for (var p = 0; p < numXtiles; p++) {
    //                tile = {};
    //                tile.tx0 = Math.max(siz.XTOsiz + p * siz.XTsiz, siz.XOsiz);
    //                tile.ty0 = Math.max(siz.YTOsiz + q * siz.YTsiz, siz.YOsiz);
    //                tile.tx1 = Math.min(siz.XTOsiz + (p + 1) * siz.XTsiz, siz.Xsiz);
    //                tile.ty1 = Math.min(siz.YTOsiz + (q + 1) * siz.YTsiz, siz.Ysiz);
    //                tile.width = tile.tx1 - tile.tx0;
    //                tile.height = tile.ty1 - tile.ty0;
    //                tile.components = [];
    //                tiles.push(tile);
    //            }
    //        }
    //        context.tiles = tiles;
    //        var componentsCount = siz.Csiz;
    //        for (var i = 0, ii = componentsCount; i < ii; i++) {
    //            var component = components[i];
    //            for (var j = 0, jj = tiles.length; j < jj; j++) {
    //                var tileComponent = {};
    //                tile = tiles[j];
    //                tileComponent.tcx0 = Math.ceil(tile.tx0 / component.XRsiz);
    //                tileComponent.tcy0 = Math.ceil(tile.ty0 / component.YRsiz);
    //                tileComponent.tcx1 = Math.ceil(tile.tx1 / component.XRsiz);
    //                tileComponent.tcy1 = Math.ceil(tile.ty1 / component.YRsiz);
    //                tileComponent.width = tileComponent.tcx1 - tileComponent.tcx0;
    //                tileComponent.height = tileComponent.tcy1 - tileComponent.tcy0;
    //                tile.components[i] = tileComponent;
    //            }
    //        }
    //    }
    //    function getBlocksDimensions(context, component, r) {
    //        var codOrCoc = component.codingStyleParameters;
    //        var result = {};
    //        if (!codOrCoc.entropyCoderWithCustomPrecincts) {
    //            result.PPx = 15;
    //            result.PPy = 15;
    //        } else {
    //            result.PPx = codOrCoc.precinctsSizes[r].PPx;
    //            result.PPy = codOrCoc.precinctsSizes[r].PPy;
    //        }
    //        result.xcb_ = r > 0 ? Math.min(codOrCoc.xcb, result.PPx - 1) : Math.min(codOrCoc.xcb, result.PPx);
    //        result.ycb_ = r > 0 ? Math.min(codOrCoc.ycb, result.PPy - 1) : Math.min(codOrCoc.ycb, result.PPy);
    //        return result;
    //    }
    //    function buildPrecincts(context, resolution, dimensions) {
    //        var precinctWidth = 1 << dimensions.PPx;
    //        var precinctHeight = 1 << dimensions.PPy;
    //        var isZeroRes = resolution.resLevel === 0;
    //        var precinctWidthInSubband = 1 << dimensions.PPx + (isZeroRes ? 0 : -1);
    //        var precinctHeightInSubband = 1 << dimensions.PPy + (isZeroRes ? 0 : -1);
    //        var numprecinctswide = resolution.trx1 > resolution.trx0 ? Math.ceil(resolution.trx1 / precinctWidth) - Math.floor(resolution.trx0 / precinctWidth) : 0;
    //        var numprecinctshigh = resolution.try1 > resolution.try0 ? Math.ceil(resolution.try1 / precinctHeight) - Math.floor(resolution.try0 / precinctHeight) : 0;
    //        var numprecincts = numprecinctswide * numprecinctshigh;
    //        resolution.precinctParameters = {
    //            precinctWidth: precinctWidth,
    //            precinctHeight: precinctHeight,
    //            numprecinctswide: numprecinctswide,
    //            numprecinctshigh: numprecinctshigh,
    //            numprecincts: numprecincts,
    //            precinctWidthInSubband: precinctWidthInSubband,
    //            precinctHeightInSubband: precinctHeightInSubband
    //        };
    //    }
    //    function buildCodeblocks(context, subband, dimensions) {
    //        var xcb_ = dimensions.xcb_;
    //        var ycb_ = dimensions.ycb_;
    //        var codeblockWidth = 1 << xcb_;
    //        var codeblockHeight = 1 << ycb_;
    //        var cbx0 = subband.tbx0 >> xcb_;
    //        var cby0 = subband.tby0 >> ycb_;
    //        var cbx1 = subband.tbx1 + codeblockWidth - 1 >> xcb_;
    //        var cby1 = subband.tby1 + codeblockHeight - 1 >> ycb_;
    //        var precinctParameters = subband.resolution.precinctParameters;
    //        var codeblocks = [];
    //        var precincts = [];
    //        var i, j, codeblock, precinctNumber;
    //        for (j = cby0; j < cby1; j++) {
    //            for (i = cbx0; i < cbx1; i++) {
    //                codeblock = {
    //                    cbx: i,
    //                    cby: j,
    //                    tbx0: codeblockWidth * i,
    //                    tby0: codeblockHeight * j,
    //                    tbx1: codeblockWidth * (i + 1),
    //                    tby1: codeblockHeight * (j + 1)
    //                };
    //                codeblock.tbx0_ = Math.max(subband.tbx0, codeblock.tbx0);
    //                codeblock.tby0_ = Math.max(subband.tby0, codeblock.tby0);
    //                codeblock.tbx1_ = Math.min(subband.tbx1, codeblock.tbx1);
    //                codeblock.tby1_ = Math.min(subband.tby1, codeblock.tby1);
    //                var pi = Math.floor((codeblock.tbx0_ - subband.tbx0) / precinctParameters.precinctWidthInSubband);
    //                var pj = Math.floor((codeblock.tby0_ - subband.tby0) / precinctParameters.precinctHeightInSubband);
    //                precinctNumber = pi + pj * precinctParameters.numprecinctswide;
    //                codeblock.precinctNumber = precinctNumber;
    //                codeblock.subbandType = subband.type;
    //                codeblock.Lblock = 3;
    //                if (codeblock.tbx1_ <= codeblock.tbx0_ || codeblock.tby1_ <= codeblock.tby0_) {
    //                    continue;
    //                }
    //                codeblocks.push(codeblock);
    //                var precinct = precincts[precinctNumber];
    //                if (precinct !== undefined) {
    //                    if (i < precinct.cbxMin) {
    //                        precinct.cbxMin = i;
    //                    } else if (i > precinct.cbxMax) {
    //                        precinct.cbxMax = i;
    //                    }
    //                    if (j < precinct.cbyMin) {
    //                        precinct.cbxMin = j;
    //                    } else if (j > precinct.cbyMax) {
    //                        precinct.cbyMax = j;
    //                    }
    //                } else {
    //                    precincts[precinctNumber] = precinct = {
    //                        cbxMin: i,
    //                        cbyMin: j,
    //                        cbxMax: i,
    //                        cbyMax: j
    //                    };
    //                }
    //                codeblock.precinct = precinct;
    //            }
    //        }
    //        subband.codeblockParameters = {
    //            codeblockWidth: xcb_,
    //            codeblockHeight: ycb_,
    //            numcodeblockwide: cbx1 - cbx0 + 1,
    //            numcodeblockhigh: cby1 - cby0 + 1
    //        };
    //        subband.codeblocks = codeblocks;
    //        subband.precincts = precincts;
    //    }
    //    function createPacket(resolution, precinctNumber, layerNumber) {
    //        var precinctCodeblocks = [];
    //        var subbands = resolution.subbands;
    //        for (var i = 0, ii = subbands.length; i < ii; i++) {
    //            var subband = subbands[i];
    //            var codeblocks = subband.codeblocks;
    //            for (var j = 0, jj = codeblocks.length; j < jj; j++) {
    //                var codeblock = codeblocks[j];
    //                if (codeblock.precinctNumber !== precinctNumber) {
    //                    continue;
    //                }
    //                precinctCodeblocks.push(codeblock);
    //            }
    //        }
    //        return {
    //            layerNumber: layerNumber,
    //            codeblocks: precinctCodeblocks
    //        };
    //    }
    //    function LayerResolutionComponentPositionIterator(context) {
    //        var siz = context.SIZ;
    //        var tileIndex = context.currentTile.index;
    //        var tile = context.tiles[tileIndex];
    //        var layersCount = tile.codingStyleDefaultParameters.layersCount;
    //        var componentsCount = siz.Csiz;
    //        var maxDecompositionLevelsCount = 0;
    //        for (var q = 0; q < componentsCount; q++) {
    //            maxDecompositionLevelsCount = Math.max(maxDecompositionLevelsCount, tile.components[q].codingStyleParameters.decompositionLevelsCount);
    //        }
    //        var l = 0, r = 0, i = 0, k = 0;
    //        this.nextPacket = function JpxImage_nextPacket() {
    //            for (;l < layersCount; l++) {
    //                for (;r <= maxDecompositionLevelsCount; r++) {
    //                    for (;i < componentsCount; i++) {
    //                        var component = tile.components[i];
    //                        if (r > component.codingStyleParameters.decompositionLevelsCount) {
    //                            continue;
    //                        }
    //                        var resolution = component.resolutions[r];
    //                        var numprecincts = resolution.precinctParameters.numprecincts;
    //                        for (;k < numprecincts; ) {
    //                            var packet = createPacket(resolution, k, l);
    //                            k++;
    //                            return packet;
    //                        }
    //                        k = 0;
    //                    }
    //                    i = 0;
    //                }
    //                r = 0;
    //            }
    //            throw new Error("JPX Error: Out of packets");
    //        };
    //    }
    //    function ResolutionLayerComponentPositionIterator(context) {
    //        var siz = context.SIZ;
    //        var tileIndex = context.currentTile.index;
    //        var tile = context.tiles[tileIndex];
    //        var layersCount = tile.codingStyleDefaultParameters.layersCount;
    //        var componentsCount = siz.Csiz;
    //        var maxDecompositionLevelsCount = 0;
    //        for (var q = 0; q < componentsCount; q++) {
    //            maxDecompositionLevelsCount = Math.max(maxDecompositionLevelsCount, tile.components[q].codingStyleParameters.decompositionLevelsCount);
    //        }
    //        var r = 0, l = 0, i = 0, k = 0;
    //        this.nextPacket = function JpxImage_nextPacket() {
    //            for (;r <= maxDecompositionLevelsCount; r++) {
    //                for (;l < layersCount; l++) {
    //                    for (;i < componentsCount; i++) {
    //                        var component = tile.components[i];
    //                        if (r > component.codingStyleParameters.decompositionLevelsCount) {
    //                            continue;
    //                        }
    //                        var resolution = component.resolutions[r];
    //                        var numprecincts = resolution.precinctParameters.numprecincts;
    //                        for (;k < numprecincts; ) {
    //                            var packet = createPacket(resolution, k, l);
    //                            k++;
    //                            return packet;
    //                        }
    //                        k = 0;
    //                    }
    //                    i = 0;
    //                }
    //                l = 0;
    //            }
    //            throw new Error("JPX Error: Out of packets");
    //        };
    //    }
    //    function ResolutionPositionComponentLayerIterator(context) {
    //        var siz = context.SIZ;
    //        var tileIndex = context.currentTile.index;
    //        var tile = context.tiles[tileIndex];
    //        var layersCount = tile.codingStyleDefaultParameters.layersCount;
    //        var componentsCount = siz.Csiz;
    //        var l, r, c, p;
    //        var maxDecompositionLevelsCount = 0;
    //        for (c = 0; c < componentsCount; c++) {
    //            var component = tile.components[c];
    //            maxDecompositionLevelsCount = Math.max(maxDecompositionLevelsCount, component.codingStyleParameters.decompositionLevelsCount);
    //        }
    //        var maxNumPrecinctsInLevel = new Int32Array(maxDecompositionLevelsCount + 1);
    //        for (r = 0; r <= maxDecompositionLevelsCount; ++r) {
    //            var maxNumPrecincts = 0;
    //            for (c = 0; c < componentsCount; ++c) {
    //                var resolutions = tile.components[c].resolutions;
    //                if (r < resolutions.length) {
    //                    maxNumPrecincts = Math.max(maxNumPrecincts, resolutions[r].precinctParameters.numprecincts);
    //                }
    //            }
    //            maxNumPrecinctsInLevel[r] = maxNumPrecincts;
    //        }
    //        l = 0;
    //        r = 0;
    //        c = 0;
    //        p = 0;
    //        this.nextPacket = function JpxImage_nextPacket() {
    //            for (;r <= maxDecompositionLevelsCount; r++) {
    //                for (;p < maxNumPrecinctsInLevel[r]; p++) {
    //                    for (;c < componentsCount; c++) {
    //                        var component = tile.components[c];
    //                        if (r > component.codingStyleParameters.decompositionLevelsCount) {
    //                            continue;
    //                        }
    //                        var resolution = component.resolutions[r];
    //                        var numprecincts = resolution.precinctParameters.numprecincts;
    //                        if (p >= numprecincts) {
    //                            continue;
    //                        }
    //                        for (;l < layersCount; ) {
    //                            var packet = createPacket(resolution, p, l);
    //                            l++;
    //                            return packet;
    //                        }
    //                        l = 0;
    //                    }
    //                    c = 0;
    //                }
    //                p = 0;
    //            }
    //            throw new Error("JPX Error: Out of packets");
    //        };
    //    }
    //    function PositionComponentResolutionLayerIterator(context) {
    //        var siz = context.SIZ;
    //        var tileIndex = context.currentTile.index;
    //        var tile = context.tiles[tileIndex];
    //        var layersCount = tile.codingStyleDefaultParameters.layersCount;
    //        var componentsCount = siz.Csiz;
    //        var precinctsSizes = getPrecinctSizesInImageScale(tile);
    //        var precinctsIterationSizes = precinctsSizes;
    //        var l = 0, r = 0, c = 0, px = 0, py = 0;
    //        this.nextPacket = function JpxImage_nextPacket() {
    //            for (;py < precinctsIterationSizes.maxNumHigh; py++) {
    //                for (;px < precinctsIterationSizes.maxNumWide; px++) {
    //                    for (;c < componentsCount; c++) {
    //                        var component = tile.components[c];
    //                        var decompositionLevelsCount = component.codingStyleParameters.decompositionLevelsCount;
    //                        for (;r <= decompositionLevelsCount; r++) {
    //                            var resolution = component.resolutions[r];
    //                            var sizeInImageScale = precinctsSizes.components[c].resolutions[r];
    //                            var k = getPrecinctIndexIfExist(px, py, sizeInImageScale, precinctsIterationSizes, resolution);
    //                            if (k === null) {
    //                                continue;
    //                            }
    //                            for (;l < layersCount; ) {
    //                                var packet = createPacket(resolution, k, l);
    //                                l++;
    //                                return packet;
    //                            }
    //                            l = 0;
    //                        }
    //                        r = 0;
    //                    }
    //                    c = 0;
    //                }
    //                px = 0;
    //            }
    //            throw new Error("JPX Error: Out of packets");
    //        };
    //    }
    //    function ComponentPositionResolutionLayerIterator(context) {
    //        var siz = context.SIZ;
    //        var tileIndex = context.currentTile.index;
    //        var tile = context.tiles[tileIndex];
    //        var layersCount = tile.codingStyleDefaultParameters.layersCount;
    //        var componentsCount = siz.Csiz;
    //        var precinctsSizes = getPrecinctSizesInImageScale(tile);
    //        var l = 0, r = 0, c = 0, px = 0, py = 0;
    //        this.nextPacket = function JpxImage_nextPacket() {
    //            for (;c < componentsCount; ++c) {
    //                var component = tile.components[c];
    //                var precinctsIterationSizes = precinctsSizes.components[c];
    //                var decompositionLevelsCount = component.codingStyleParameters.decompositionLevelsCount;
    //                for (;py < precinctsIterationSizes.maxNumHigh; py++) {
    //                    for (;px < precinctsIterationSizes.maxNumWide; px++) {
    //                        for (;r <= decompositionLevelsCount; r++) {
    //                            var resolution = component.resolutions[r];
    //                            var sizeInImageScale = precinctsIterationSizes.resolutions[r];
    //                            var k = getPrecinctIndexIfExist(px, py, sizeInImageScale, precinctsIterationSizes, resolution);
    //                            if (k === null) {
    //                                continue;
    //                            }
    //                            for (;l < layersCount; ) {
    //                                var packet = createPacket(resolution, k, l);
    //                                l++;
    //                                return packet;
    //                            }
    //                            l = 0;
    //                        }
    //                        r = 0;
    //                    }
    //                    px = 0;
    //                }
    //                py = 0;
    //            }
    //            throw new Error("JPX Error: Out of packets");
    //        };
    //    }
    //    function getPrecinctIndexIfExist(pxIndex, pyIndex, sizeInImageScale, precinctIterationSizes, resolution) {
    //        var posX = pxIndex * precinctIterationSizes.minWidth;
    //        var posY = pyIndex * precinctIterationSizes.minHeight;
    //        if (posX % sizeInImageScale.width !== 0 || posY % sizeInImageScale.height !== 0) {
    //            return null;
    //        }
    //        var startPrecinctRowIndex = posY / sizeInImageScale.width * resolution.precinctParameters.numprecinctswide;
    //        return posX / sizeInImageScale.height + startPrecinctRowIndex;
    //    }
    //    function getPrecinctSizesInImageScale(tile) {
    //        var componentsCount = tile.components.length;
    //        var minWidth = Number.MAX_VALUE;
    //        var minHeight = Number.MAX_VALUE;
    //        var maxNumWide = 0;
    //        var maxNumHigh = 0;
    //        var sizePerComponent = new Array(componentsCount);
    //        for (var c = 0; c < componentsCount; c++) {
    //            var component = tile.components[c];
    //            var decompositionLevelsCount = component.codingStyleParameters.decompositionLevelsCount;
    //            var sizePerResolution = new Array(decompositionLevelsCount + 1);
    //            var minWidthCurrentComponent = Number.MAX_VALUE;
    //            var minHeightCurrentComponent = Number.MAX_VALUE;
    //            var maxNumWideCurrentComponent = 0;
    //            var maxNumHighCurrentComponent = 0;
    //            var scale = 1;
    //            for (var r = decompositionLevelsCount; r >= 0; --r) {
    //                var resolution = component.resolutions[r];
    //                var widthCurrentResolution = scale * resolution.precinctParameters.precinctWidth;
    //                var heightCurrentResolution = scale * resolution.precinctParameters.precinctHeight;
    //                minWidthCurrentComponent = Math.min(minWidthCurrentComponent, widthCurrentResolution);
    //                minHeightCurrentComponent = Math.min(minHeightCurrentComponent, heightCurrentResolution);
    //                maxNumWideCurrentComponent = Math.max(maxNumWideCurrentComponent, resolution.precinctParameters.numprecinctswide);
    //                maxNumHighCurrentComponent = Math.max(maxNumHighCurrentComponent, resolution.precinctParameters.numprecinctshigh);
    //                sizePerResolution[r] = {
    //                    width: widthCurrentResolution,
    //                    height: heightCurrentResolution
    //                };
    //                scale <<= 1;
    //            }
    //            minWidth = Math.min(minWidth, minWidthCurrentComponent);
    //            minHeight = Math.min(minHeight, minHeightCurrentComponent);
    //            maxNumWide = Math.max(maxNumWide, maxNumWideCurrentComponent);
    //            maxNumHigh = Math.max(maxNumHigh, maxNumHighCurrentComponent);
    //            sizePerComponent[c] = {
    //                resolutions: sizePerResolution,
    //                minWidth: minWidthCurrentComponent,
    //                minHeight: minHeightCurrentComponent,
    //                maxNumWide: maxNumWideCurrentComponent,
    //                maxNumHigh: maxNumHighCurrentComponent
    //            };
    //        }
    //        return {
    //            components: sizePerComponent,
    //            minWidth: minWidth,
    //            minHeight: minHeight,
    //            maxNumWide: maxNumWide,
    //            maxNumHigh: maxNumHigh
    //        };
    //    }
    //    function buildPackets(context) {
    //        var siz = context.SIZ;
    //        var tileIndex = context.currentTile.index;
    //        var tile = context.tiles[tileIndex];
    //        var componentsCount = siz.Csiz;
    //        for (var c = 0; c < componentsCount; c++) {
    //            var component = tile.components[c];
    //            var decompositionLevelsCount = component.codingStyleParameters.decompositionLevelsCount;
    //            var resolutions = [];
    //            var subbands = [];
    //            for (var r = 0; r <= decompositionLevelsCount; r++) {
    //                var blocksDimensions = getBlocksDimensions(context, component, r);
    //                var resolution = {};
    //                var scale = 1 << decompositionLevelsCount - r;
    //                resolution.trx0 = Math.ceil(component.tcx0 / scale);
    //                resolution.try0 = Math.ceil(component.tcy0 / scale);
    //                resolution.trx1 = Math.ceil(component.tcx1 / scale);
    //                resolution.try1 = Math.ceil(component.tcy1 / scale);
    //                resolution.resLevel = r;
    //                buildPrecincts(context, resolution, blocksDimensions);
    //                resolutions.push(resolution);
    //                var subband;
    //                if (r === 0) {
    //                    subband = {};
    //                    subband.type = "LL";
    //                    subband.tbx0 = Math.ceil(component.tcx0 / scale);
    //                    subband.tby0 = Math.ceil(component.tcy0 / scale);
    //                    subband.tbx1 = Math.ceil(component.tcx1 / scale);
    //                    subband.tby1 = Math.ceil(component.tcy1 / scale);
    //                    subband.resolution = resolution;
    //                    buildCodeblocks(context, subband, blocksDimensions);
    //                    subbands.push(subband);
    //                    resolution.subbands = [ subband ];
    //                } else {
    //                    var bscale = 1 << decompositionLevelsCount - r + 1;
    //                    var resolutionSubbands = [];
    //                    subband = {};
    //                    subband.type = "HL";
    //                    subband.tbx0 = Math.ceil(component.tcx0 / bscale - .5);
    //                    subband.tby0 = Math.ceil(component.tcy0 / bscale);
    //                    subband.tbx1 = Math.ceil(component.tcx1 / bscale - .5);
    //                    subband.tby1 = Math.ceil(component.tcy1 / bscale);
    //                    subband.resolution = resolution;
    //                    buildCodeblocks(context, subband, blocksDimensions);
    //                    subbands.push(subband);
    //                    resolutionSubbands.push(subband);
    //                    subband = {};
    //                    subband.type = "LH";
    //                    subband.tbx0 = Math.ceil(component.tcx0 / bscale);
    //                    subband.tby0 = Math.ceil(component.tcy0 / bscale - .5);
    //                    subband.tbx1 = Math.ceil(component.tcx1 / bscale);
    //                    subband.tby1 = Math.ceil(component.tcy1 / bscale - .5);
    //                    subband.resolution = resolution;
    //                    buildCodeblocks(context, subband, blocksDimensions);
    //                    subbands.push(subband);
    //                    resolutionSubbands.push(subband);
    //                    subband = {};
    //                    subband.type = "HH";
    //                    subband.tbx0 = Math.ceil(component.tcx0 / bscale - .5);
    //                    subband.tby0 = Math.ceil(component.tcy0 / bscale - .5);
    //                    subband.tbx1 = Math.ceil(component.tcx1 / bscale - .5);
    //                    subband.tby1 = Math.ceil(component.tcy1 / bscale - .5);
    //                    subband.resolution = resolution;
    //                    buildCodeblocks(context, subband, blocksDimensions);
    //                    subbands.push(subband);
    //                    resolutionSubbands.push(subband);
    //                    resolution.subbands = resolutionSubbands;
    //                }
    //            }
    //            component.resolutions = resolutions;
    //            component.subbands = subbands;
    //        }
    //        var progressionOrder = tile.codingStyleDefaultParameters.progressionOrder;
    //        switch (progressionOrder) {
    //          case 0:
    //            tile.packetsIterator = new LayerResolutionComponentPositionIterator(context);
    //            break;
    //
    //          case 1:
    //            tile.packetsIterator = new ResolutionLayerComponentPositionIterator(context);
    //            break;
    //
    //          case 2:
    //            tile.packetsIterator = new ResolutionPositionComponentLayerIterator(context);
    //            break;
    //
    //          case 3:
    //            tile.packetsIterator = new PositionComponentResolutionLayerIterator(context);
    //            break;
    //
    //          case 4:
    //            tile.packetsIterator = new ComponentPositionResolutionLayerIterator(context);
    //            break;
    //
    //          default:
    //            throw new Error("JPX Error: Unsupported progression order " + progressionOrder);
    //        }
    //    }
    //    function parseTilePackets(context, data, offset, dataLength) {
    //        var position = 0;
    //        var buffer, bufferSize = 0, skipNextBit = false;
    //        function readBits(count) {
    //            while (bufferSize < count) {
    //                var b = data[offset + position];
    //                position++;
    //                if (skipNextBit) {
    //                    buffer = buffer << 7 | b;
    //                    bufferSize += 7;
    //                    skipNextBit = false;
    //                } else {
    //                    buffer = buffer << 8 | b;
    //                    bufferSize += 8;
    //                }
    //                if (b === 255) {
    //                    skipNextBit = true;
    //                }
    //            }
    //            bufferSize -= count;
    //            return buffer >>> bufferSize & (1 << count) - 1;
    //        }
    //        function skipMarkerIfEqual(value) {
    //            if (data[offset + position - 1] === 255 && data[offset + position] === value) {
    //                skipBytes(1);
    //                return true;
    //            } else if (data[offset + position] === 255 && data[offset + position + 1] === value) {
    //                skipBytes(2);
    //                return true;
    //            }
    //            return false;
    //        }
    //        function skipBytes(count) {
    //            position += count;
    //        }
    //        function alignToByte() {
    //            bufferSize = 0;
    //            if (skipNextBit) {
    //                position++;
    //                skipNextBit = false;
    //            }
    //        }
    //        function readCodingpasses() {
    //            if (readBits(1) === 0) {
    //                return 1;
    //            }
    //            if (readBits(1) === 0) {
    //                return 2;
    //            }
    //            var value = readBits(2);
    //            if (value < 3) {
    //                return value + 3;
    //            }
    //            value = readBits(5);
    //            if (value < 31) {
    //                return value + 6;
    //            }
    //            value = readBits(7);
    //            return value + 37;
    //        }
    //        var tileIndex = context.currentTile.index;
    //        var tile = context.tiles[tileIndex];
    //        var sopMarkerUsed = context.COD.sopMarkerUsed;
    //        var ephMarkerUsed = context.COD.ephMarkerUsed;
    //        var packetsIterator = tile.packetsIterator;
    //        while (position < dataLength) {
    //            alignToByte();
    //            if (sopMarkerUsed && skipMarkerIfEqual(145)) {
    //                skipBytes(4);
    //            }
    //            var packet = packetsIterator.nextPacket();
    //            if (!readBits(1)) {
    //                continue;
    //            }
    //            var layerNumber = packet.layerNumber;
    //            var queue = [], codeblock;
    //            for (var i = 0, ii = packet.codeblocks.length; i < ii; i++) {
    //                codeblock = packet.codeblocks[i];
    //                var precinct = codeblock.precinct;
    //                var codeblockColumn = codeblock.cbx - precinct.cbxMin;
    //                var codeblockRow = codeblock.cby - precinct.cbyMin;
    //                var codeblockIncluded = false;
    //                var firstTimeInclusion = false;
    //                var valueReady;
    //                if (codeblock["included"] !== undefined) {
    //                    codeblockIncluded = !!readBits(1);
    //                } else {
    //                    precinct = codeblock.precinct;
    //                    var inclusionTree, zeroBitPlanesTree;
    //                    if (precinct["inclusionTree"] !== undefined) {
    //                        inclusionTree = precinct.inclusionTree;
    //                    } else {
    //                        var width = precinct.cbxMax - precinct.cbxMin + 1;
    //                        var height = precinct.cbyMax - precinct.cbyMin + 1;
    //                        inclusionTree = new InclusionTree(width, height, layerNumber);
    //                        zeroBitPlanesTree = new TagTree(width, height);
    //                        precinct.inclusionTree = inclusionTree;
    //                        precinct.zeroBitPlanesTree = zeroBitPlanesTree;
    //                    }
    //                    if (inclusionTree.reset(codeblockColumn, codeblockRow, layerNumber)) {
    //                        while (true) {
    //                            if (readBits(1)) {
    //                                valueReady = !inclusionTree.nextLevel();
    //                                if (valueReady) {
    //                                    codeblock.included = true;
    //                                    codeblockIncluded = firstTimeInclusion = true;
    //                                    break;
    //                                }
    //                            } else {
    //                                inclusionTree.incrementValue(layerNumber);
    //                                break;
    //                            }
    //                        }
    //                    }
    //                }
    //                if (!codeblockIncluded) {
    //                    continue;
    //                }
    //                if (firstTimeInclusion) {
    //                    zeroBitPlanesTree = precinct.zeroBitPlanesTree;
    //                    zeroBitPlanesTree.reset(codeblockColumn, codeblockRow);
    //                    while (true) {
    //                        if (readBits(1)) {
    //                            valueReady = !zeroBitPlanesTree.nextLevel();
    //                            if (valueReady) {
    //                                break;
    //                            }
    //                        } else {
    //                            zeroBitPlanesTree.incrementValue();
    //                        }
    //                    }
    //                    codeblock.zeroBitPlanes = zeroBitPlanesTree.value;
    //                }
    //                var codingpasses = readCodingpasses();
    //                while (readBits(1)) {
    //                    codeblock.Lblock++;
    //                }
    //                var codingpassesLog2 = log2(codingpasses);
    //                var bits = (codingpasses < 1 << codingpassesLog2 ? codingpassesLog2 - 1 : codingpassesLog2) + codeblock.Lblock;
    //                var codedDataLength = readBits(bits);
    //                queue.push({
    //                    codeblock: codeblock,
    //                    codingpasses: codingpasses,
    //                    dataLength: codedDataLength
    //                });
    //            }
    //            alignToByte();
    //            if (ephMarkerUsed) {
    //                skipMarkerIfEqual(146);
    //            }
    //            while (queue.length > 0) {
    //                var packetItem = queue.shift();
    //                codeblock = packetItem.codeblock;
    //                if (codeblock["data"] === undefined) {
    //                    codeblock.data = [];
    //                }
    //                codeblock.data.push({
    //                    data: data,
    //                    start: offset + position,
    //                    end: offset + position + packetItem.dataLength,
    //                    codingpasses: packetItem.codingpasses
    //                });
    //                position += packetItem.dataLength;
    //            }
    //        }
    //        return position;
    //    }
    //    function copyCoefficients(coefficients, levelWidth, levelHeight, subband, delta, mb, reversible, segmentationSymbolUsed) {
    //        var x0 = subband.tbx0;
    //        var y0 = subband.tby0;
    //        var width = subband.tbx1 - subband.tbx0;
    //        var codeblocks = subband.codeblocks;
    //        var right = subband.type.charAt(0) === "H" ? 1 : 0;
    //        var bottom = subband.type.charAt(1) === "H" ? levelWidth : 0;
    //        for (var i = 0, ii = codeblocks.length; i < ii; ++i) {
    //            var codeblock = codeblocks[i];
    //            var blockWidth = codeblock.tbx1_ - codeblock.tbx0_;
    //            var blockHeight = codeblock.tby1_ - codeblock.tby0_;
    //            if (blockWidth === 0 || blockHeight === 0) {
    //                continue;
    //            }
    //            if (codeblock["data"] === undefined) {
    //                continue;
    //            }
    //            var bitModel, currentCodingpassType;
    //            bitModel = new BitModel(blockWidth, blockHeight, codeblock.subbandType, codeblock.zeroBitPlanes, mb);
    //            currentCodingpassType = 2;
    //            var data = codeblock.data, totalLength = 0, codingpasses = 0;
    //            var j, jj, dataItem;
    //            for (j = 0, jj = data.length; j < jj; j++) {
    //                dataItem = data[j];
    //                totalLength += dataItem.end - dataItem.start;
    //                codingpasses += dataItem.codingpasses;
    //            }
    //            var encodedData = new Uint8Array(totalLength);
    //            var position = 0;
    //            for (j = 0, jj = data.length; j < jj; j++) {
    //                dataItem = data[j];
    //                var chunk = dataItem.data.subarray(dataItem.start, dataItem.end);
    //                encodedData.set(chunk, position);
    //                position += chunk.length;
    //            }
    //            var decoder = new ArithmeticDecoder(encodedData, 0, totalLength);
    //            bitModel.setDecoder(decoder);
    //            for (j = 0; j < codingpasses; j++) {
    //                switch (currentCodingpassType) {
    //                  case 0:
    //                    bitModel.runSignificancePropogationPass();
    //                    break;
    //
    //                  case 1:
    //                    bitModel.runMagnitudeRefinementPass();
    //                    break;
    //
    //                  case 2:
    //                    bitModel.runCleanupPass();
    //                    if (segmentationSymbolUsed) {
    //                        bitModel.checkSegmentationSymbol();
    //                    }
    //                    break;
    //                }
    //                currentCodingpassType = (currentCodingpassType + 1) % 3;
    //            }
    //            var offset = codeblock.tbx0_ - x0 + (codeblock.tby0_ - y0) * width;
    //            var sign = bitModel.coefficentsSign;
    //            var magnitude = bitModel.coefficentsMagnitude;
    //            var bitsDecoded = bitModel.bitsDecoded;
    //            var magnitudeCorrection = reversible ? 0 : .5;
    //            var k, n, nb;
    //            position = 0;
    //            var interleave = subband.type !== "LL";
    //            for (j = 0; j < blockHeight; j++) {
    //                var row = offset / width | 0;
    //                var levelOffset = 2 * row * (levelWidth - width) + right + bottom;
    //                for (k = 0; k < blockWidth; k++) {
    //                    n = magnitude[position];
    //                    if (n !== 0) {
    //                        n = (n + magnitudeCorrection) * delta;
    //                        if (sign[position] !== 0) {
    //                            n = -n;
    //                        }
    //                        nb = bitsDecoded[position];
    //                        var pos = interleave ? levelOffset + (offset << 1) : offset;
    //                        if (reversible && nb >= mb) {
    //                            coefficients[pos] = n;
    //                        } else {
    //                            coefficients[pos] = n * (1 << mb - nb);
    //                        }
    //                    }
    //                    offset++;
    //                    position++;
    //                }
    //                offset += width - blockWidth;
    //            }
    //        }
    //    }
    //    function transformTile(context, tile, c) {
    //        var component = tile.components[c];
    //        var codingStyleParameters = component.codingStyleParameters;
    //        var quantizationParameters = component.quantizationParameters;
    //        var decompositionLevelsCount = codingStyleParameters.decompositionLevelsCount;
    //        var spqcds = quantizationParameters.SPqcds;
    //        var scalarExpounded = quantizationParameters.scalarExpounded;
    //        var guardBits = quantizationParameters.guardBits;
    //        var segmentationSymbolUsed = codingStyleParameters.segmentationSymbolUsed;
    //        var precision = context.components[c].precision;
    //        var reversible = codingStyleParameters.reversibleTransformation;
    //        var transform = reversible ? new ReversibleTransform() : new IrreversibleTransform();
    //        var subbandCoefficients = [];
    //        var b = 0;
    //        for (var i = 0; i <= decompositionLevelsCount; i++) {
    //            var resolution = component.resolutions[i];
    //            var width = resolution.trx1 - resolution.trx0;
    //            var height = resolution.try1 - resolution.try0;
    //            var coefficients = new Float32Array(width * height);
    //            for (var j = 0, jj = resolution.subbands.length; j < jj; j++) {
    //                var mu, epsilon;
    //                if (!scalarExpounded) {
    //                    mu = spqcds[0].mu;
    //                    epsilon = spqcds[0].epsilon + (i > 0 ? 1 - i : 0);
    //                } else {
    //                    mu = spqcds[b].mu;
    //                    epsilon = spqcds[b].epsilon;
    //                    b++;
    //                }
    //                var subband = resolution.subbands[j];
    //                var gainLog2 = SubbandsGainLog2[subband.type];
    //                var delta = reversible ? 1 : Math.pow(2, precision + gainLog2 - epsilon) * (1 + mu / 2048);
    //                var mb = guardBits + epsilon - 1;
    //                copyCoefficients(coefficients, width, height, subband, delta, mb, reversible, segmentationSymbolUsed);
    //            }
    //            subbandCoefficients.push({
    //                width: width,
    //                height: height,
    //                items: coefficients
    //            });
    //        }
    //        var result = transform.calculate(subbandCoefficients, component.tcx0, component.tcy0);
    //        return {
    //            left: component.tcx0,
    //            top: component.tcy0,
    //            width: result.width,
    //            height: result.height,
    //            items: result.items
    //        };
    //    }
    //    function transformComponents(context) {
    //        var siz = context.SIZ;
    //        var components = context.components;
    //        var componentsCount = siz.Csiz;
    //        var resultImages = [];
    //        for (var i = 0, ii = context.tiles.length; i < ii; i++) {
    //            var tile = context.tiles[i];
    //            var transformedTiles = [];
    //            var c;
    //            for (c = 0; c < componentsCount; c++) {
    //                transformedTiles[c] = transformTile(context, tile, c);
    //            }
    //            var tile0 = transformedTiles[0];
    //            var out = new Uint8Array(tile0.items.length * componentsCount);
    //            var result = {
    //                left: tile0.left,
    //                top: tile0.top,
    //                width: tile0.width,
    //                height: tile0.height,
    //                items: out
    //            };
    //            var shift, offset, max, min, maxK;
    //            var pos = 0, j, jj, y0, y1, y2, r, g, b, k, val;
    //            if (tile.codingStyleDefaultParameters.multipleComponentTransform) {
    //                var fourComponents = componentsCount === 4;
    //                var y0items = transformedTiles[0].items;
    //                var y1items = transformedTiles[1].items;
    //                var y2items = transformedTiles[2].items;
    //                var y3items = fourComponents ? transformedTiles[3].items : null;
    //                shift = components[0].precision - 8;
    //                offset = (128 << shift) + .5;
    //                max = 255 * (1 << shift);
    //                maxK = max * .5;
    //                min = -maxK;
    //                var component0 = tile.components[0];
    //                var alpha01 = componentsCount - 3;
    //                jj = y0items.length;
    //                if (!component0.codingStyleParameters.reversibleTransformation) {
    //                    for (j = 0; j < jj; j++, pos += alpha01) {
    //                        y0 = y0items[j] + offset;
    //                        y1 = y1items[j];
    //                        y2 = y2items[j];
    //                        r = y0 + 1.402 * y2;
    //                        g = y0 - .34413 * y1 - .71414 * y2;
    //                        b = y0 + 1.772 * y1;
    //                        out[pos++] = r <= 0 ? 0 : r >= max ? 255 : r >> shift;
    //                        out[pos++] = g <= 0 ? 0 : g >= max ? 255 : g >> shift;
    //                        out[pos++] = b <= 0 ? 0 : b >= max ? 255 : b >> shift;
    //                    }
    //                } else {
    //                    for (j = 0; j < jj; j++, pos += alpha01) {
    //                        y0 = y0items[j] + offset;
    //                        y1 = y1items[j];
    //                        y2 = y2items[j];
    //                        g = y0 - (y2 + y1 >> 2);
    //                        r = g + y2;
    //                        b = g + y1;
    //                        out[pos++] = r <= 0 ? 0 : r >= max ? 255 : r >> shift;
    //                        out[pos++] = g <= 0 ? 0 : g >= max ? 255 : g >> shift;
    //                        out[pos++] = b <= 0 ? 0 : b >= max ? 255 : b >> shift;
    //                    }
    //                }
    //                if (fourComponents) {
    //                    for (j = 0, pos = 3; j < jj; j++, pos += 4) {
    //                        k = y3items[j];
    //                        out[pos] = k <= min ? 0 : k >= maxK ? 255 : k + offset >> shift;
    //                    }
    //                }
    //            } else {
    //                for (c = 0; c < componentsCount; c++) {
    //                    var items = transformedTiles[c].items;
    //                    shift = components[c].precision - 8;
    //                    offset = (128 << shift) + .5;
    //                    max = 127.5 * (1 << shift);
    //                    min = -max;
    //                    for (pos = c, j = 0, jj = items.length; j < jj; j++) {
    //                        val = items[j];
    //                        out[pos] = val <= min ? 0 : val >= max ? 255 : val + offset >> shift;
    //                        pos += componentsCount;
    //                    }
    //                }
    //            }
    //            resultImages.push(result);
    //        }
    //        return resultImages;
    //    }
    //    function initializeTile(context, tileIndex) {
    //        var siz = context.SIZ;
    //        var componentsCount = siz.Csiz;
    //        var tile = context.tiles[tileIndex];
    //        for (var c = 0; c < componentsCount; c++) {
    //            var component = tile.components[c];
    //            var qcdOrQcc = context.currentTile.QCC[c] !== undefined ? context.currentTile.QCC[c] : context.currentTile.QCD;
    //            component.quantizationParameters = qcdOrQcc;
    //            var codOrCoc = context.currentTile.COC[c] !== undefined ? context.currentTile.COC[c] : context.currentTile.COD;
    //            component.codingStyleParameters = codOrCoc;
    //        }
    //        tile.codingStyleDefaultParameters = context.currentTile.COD;
    //    }
    //    var TagTree = function TagTreeClosure() {
    //        function TagTree(width, height) {
    //            var levelsLength = log2(Math.max(width, height)) + 1;
    //            this.levels = [];
    //            for (var i = 0; i < levelsLength; i++) {
    //                var level = {
    //                    width: width,
    //                    height: height,
    //                    items: []
    //                };
    //                this.levels.push(level);
    //                width = Math.ceil(width / 2);
    //                height = Math.ceil(height / 2);
    //            }
    //        }
    //        TagTree.prototype = {
    //            reset: function TagTree_reset(i, j) {
    //                var currentLevel = 0, value = 0, level;
    //                while (currentLevel < this.levels.length) {
    //                    level = this.levels[currentLevel];
    //                    var index = i + j * level.width;
    //                    if (level.items[index] !== undefined) {
    //                        value = level.items[index];
    //                        break;
    //                    }
    //                    level.index = index;
    //                    i >>= 1;
    //                    j >>= 1;
    //                    currentLevel++;
    //                }
    //                currentLevel--;
    //                level = this.levels[currentLevel];
    //                level.items[level.index] = value;
    //                this.currentLevel = currentLevel;
    //                delete this.value;
    //            },
    //            incrementValue: function TagTree_incrementValue() {
    //                var level = this.levels[this.currentLevel];
    //                level.items[level.index]++;
    //            },
    //            nextLevel: function TagTree_nextLevel() {
    //                var currentLevel = this.currentLevel;
    //                var level = this.levels[currentLevel];
    //                var value = level.items[level.index];
    //                currentLevel--;
    //                if (currentLevel < 0) {
    //                    this.value = value;
    //                    return false;
    //                }
    //                this.currentLevel = currentLevel;
    //                level = this.levels[currentLevel];
    //                level.items[level.index] = value;
    //                return true;
    //            }
    //        };
    //        return TagTree;
    //    }();
    //    var InclusionTree = function InclusionTreeClosure() {
    //        function InclusionTree(width, height, defaultValue) {
    //            var levelsLength = log2(Math.max(width, height)) + 1;
    //            this.levels = [];
    //            for (var i = 0; i < levelsLength; i++) {
    //                var items = new Uint8Array(width * height);
    //                for (var j = 0, jj = items.length; j < jj; j++) {
    //                    items[j] = defaultValue;
    //                }
    //                var level = {
    //                    width: width,
    //                    height: height,
    //                    items: items
    //                };
    //                this.levels.push(level);
    //                width = Math.ceil(width / 2);
    //                height = Math.ceil(height / 2);
    //            }
    //        }
    //        InclusionTree.prototype = {
    //            reset: function InclusionTree_reset(i, j, stopValue) {
    //                var currentLevel = 0;
    //                while (currentLevel < this.levels.length) {
    //                    var level = this.levels[currentLevel];
    //                    var index = i + j * level.width;
    //                    level.index = index;
    //                    var value = level.items[index];
    //                    if (value === 255) {
    //                        break;
    //                    }
    //                    if (value > stopValue) {
    //                        this.currentLevel = currentLevel;
    //                        this.propagateValues();
    //                        return false;
    //                    }
    //                    i >>= 1;
    //                    j >>= 1;
    //                    currentLevel++;
    //                }
    //                this.currentLevel = currentLevel - 1;
    //                return true;
    //            },
    //            incrementValue: function InclusionTree_incrementValue(stopValue) {
    //                var level = this.levels[this.currentLevel];
    //                level.items[level.index] = stopValue + 1;
    //                this.propagateValues();
    //            },
    //            propagateValues: function InclusionTree_propagateValues() {
    //                var levelIndex = this.currentLevel;
    //                var level = this.levels[levelIndex];
    //                var currentValue = level.items[level.index];
    //                while (--levelIndex >= 0) {
    //                    level = this.levels[levelIndex];
    //                    level.items[level.index] = currentValue;
    //                }
    //            },
    //            nextLevel: function InclusionTree_nextLevel() {
    //                var currentLevel = this.currentLevel;
    //                var level = this.levels[currentLevel];
    //                var value = level.items[level.index];
    //                level.items[level.index] = 255;
    //                currentLevel--;
    //                if (currentLevel < 0) {
    //                    return false;
    //                }
    //                this.currentLevel = currentLevel;
    //                level = this.levels[currentLevel];
    //                level.items[level.index] = value;
    //                return true;
    //            }
    //        };
    //        return InclusionTree;
    //    }();
    //    var BitModel = function BitModelClosure() {
    //        var UNIFORM_CONTEXT = 17;
    //        var RUNLENGTH_CONTEXT = 18;
    //        var LLAndLHContextsLabel = new Uint8Array([ 0, 5, 8, 0, 3, 7, 8, 0, 4, 7, 8, 0, 0, 0, 0, 0, 1, 6, 8, 0, 3, 7, 8, 0, 4, 7, 8, 0, 0, 0, 0, 0, 2, 6, 8, 0, 3, 7, 8, 0, 4, 7, 8, 0, 0, 0, 0, 0, 2, 6, 8, 0, 3, 7, 8, 0, 4, 7, 8, 0, 0, 0, 0, 0, 2, 6, 8, 0, 3, 7, 8, 0, 4, 7, 8 ]);
    //        var HLContextLabel = new Uint8Array([ 0, 3, 4, 0, 5, 7, 7, 0, 8, 8, 8, 0, 0, 0, 0, 0, 1, 3, 4, 0, 6, 7, 7, 0, 8, 8, 8, 0, 0, 0, 0, 0, 2, 3, 4, 0, 6, 7, 7, 0, 8, 8, 8, 0, 0, 0, 0, 0, 2, 3, 4, 0, 6, 7, 7, 0, 8, 8, 8, 0, 0, 0, 0, 0, 2, 3, 4, 0, 6, 7, 7, 0, 8, 8, 8 ]);
    //        var HHContextLabel = new Uint8Array([ 0, 1, 2, 0, 1, 2, 2, 0, 2, 2, 2, 0, 0, 0, 0, 0, 3, 4, 5, 0, 4, 5, 5, 0, 5, 5, 5, 0, 0, 0, 0, 0, 6, 7, 7, 0, 7, 7, 7, 0, 7, 7, 7, 0, 0, 0, 0, 0, 8, 8, 8, 0, 8, 8, 8, 0, 8, 8, 8, 0, 0, 0, 0, 0, 8, 8, 8, 0, 8, 8, 8, 0, 8, 8, 8 ]);
    //        function BitModel(width, height, subband, zeroBitPlanes, mb) {
    //            this.width = width;
    //            this.height = height;
    //            this.contextLabelTable = subband === "HH" ? HHContextLabel : subband === "HL" ? HLContextLabel : LLAndLHContextsLabel;
    //            var coefficientCount = width * height;
    //            this.neighborsSignificance = new Uint8Array(coefficientCount);
    //            this.coefficentsSign = new Uint8Array(coefficientCount);
    //            this.coefficentsMagnitude = mb > 14 ? new Uint32Array(coefficientCount) : mb > 6 ? new Uint16Array(coefficientCount) : new Uint8Array(coefficientCount);
    //            this.processingFlags = new Uint8Array(coefficientCount);
    //            var bitsDecoded = new Uint8Array(coefficientCount);
    //            if (zeroBitPlanes !== 0) {
    //                for (var i = 0; i < coefficientCount; i++) {
    //                    bitsDecoded[i] = zeroBitPlanes;
    //                }
    //            }
    //            this.bitsDecoded = bitsDecoded;
    //            this.reset();
    //        }
    //        BitModel.prototype = {
    //            setDecoder: function BitModel_setDecoder(decoder) {
    //                this.decoder = decoder;
    //            },
    //            reset: function BitModel_reset() {
    //                this.contexts = new Int8Array(19);
    //                this.contexts[0] = 4 << 1 | 0;
    //                this.contexts[UNIFORM_CONTEXT] = 46 << 1 | 0;
    //                this.contexts[RUNLENGTH_CONTEXT] = 3 << 1 | 0;
    //            },
    //            setNeighborsSignificance: function BitModel_setNeighborsSignificance(row, column, index) {
    //                var neighborsSignificance = this.neighborsSignificance;
    //                var width = this.width, height = this.height;
    //                var left = column > 0;
    //                var right = column + 1 < width;
    //                var i;
    //                if (row > 0) {
    //                    i = index - width;
    //                    if (left) {
    //                        neighborsSignificance[i - 1] += 16;
    //                    }
    //                    if (right) {
    //                        neighborsSignificance[i + 1] += 16;
    //                    }
    //                    neighborsSignificance[i] += 4;
    //                }
    //                if (row + 1 < height) {
    //                    i = index + width;
    //                    if (left) {
    //                        neighborsSignificance[i - 1] += 16;
    //                    }
    //                    if (right) {
    //                        neighborsSignificance[i + 1] += 16;
    //                    }
    //                    neighborsSignificance[i] += 4;
    //                }
    //                if (left) {
    //                    neighborsSignificance[index - 1] += 1;
    //                }
    //                if (right) {
    //                    neighborsSignificance[index + 1] += 1;
    //                }
    //                neighborsSignificance[index] |= 128;
    //            },
    //            runSignificancePropogationPass: function BitModel_runSignificancePropogationPass() {
    //                var decoder = this.decoder;
    //                var width = this.width, height = this.height;
    //                var coefficentsMagnitude = this.coefficentsMagnitude;
    //                var coefficentsSign = this.coefficentsSign;
    //                var neighborsSignificance = this.neighborsSignificance;
    //                var processingFlags = this.processingFlags;
    //                var contexts = this.contexts;
    //                var labels = this.contextLabelTable;
    //                var bitsDecoded = this.bitsDecoded;
    //                var processedInverseMask = ~1;
    //                var processedMask = 1;
    //                var firstMagnitudeBitMask = 2;
    //                for (var i0 = 0; i0 < height; i0 += 4) {
    //                    for (var j = 0; j < width; j++) {
    //                        var index = i0 * width + j;
    //                        for (var i1 = 0; i1 < 4; i1++, index += width) {
    //                            var i = i0 + i1;
    //                            if (i >= height) {
    //                                break;
    //                            }
    //                            processingFlags[index] &= processedInverseMask;
    //                            if (coefficentsMagnitude[index] || !neighborsSignificance[index]) {
    //                                continue;
    //                            }
    //                            var contextLabel = labels[neighborsSignificance[index]];
    //                            var decision = decoder.readBit(contexts, contextLabel);
    //                            if (decision) {
    //                                var sign = this.decodeSignBit(i, j, index);
    //                                coefficentsSign[index] = sign;
    //                                coefficentsMagnitude[index] = 1;
    //                                this.setNeighborsSignificance(i, j, index);
    //                                processingFlags[index] |= firstMagnitudeBitMask;
    //                            }
    //                            bitsDecoded[index]++;
    //                            processingFlags[index] |= processedMask;
    //                        }
    //                    }
    //                }
    //            },
    //            decodeSignBit: function BitModel_decodeSignBit(row, column, index) {
    //                var width = this.width, height = this.height;
    //                var coefficentsMagnitude = this.coefficentsMagnitude;
    //                var coefficentsSign = this.coefficentsSign;
    //                var contribution, sign0, sign1, significance1;
    //                var contextLabel, decoded;
    //                significance1 = column > 0 && coefficentsMagnitude[index - 1] !== 0;
    //                if (column + 1 < width && coefficentsMagnitude[index + 1] !== 0) {
    //                    sign1 = coefficentsSign[index + 1];
    //                    if (significance1) {
    //                        sign0 = coefficentsSign[index - 1];
    //                        contribution = 1 - sign1 - sign0;
    //                    } else {
    //                        contribution = 1 - sign1 - sign1;
    //                    }
    //                } else if (significance1) {
    //                    sign0 = coefficentsSign[index - 1];
    //                    contribution = 1 - sign0 - sign0;
    //                } else {
    //                    contribution = 0;
    //                }
    //                var horizontalContribution = 3 * contribution;
    //                significance1 = row > 0 && coefficentsMagnitude[index - width] !== 0;
    //                if (row + 1 < height && coefficentsMagnitude[index + width] !== 0) {
    //                    sign1 = coefficentsSign[index + width];
    //                    if (significance1) {
    //                        sign0 = coefficentsSign[index - width];
    //                        contribution = 1 - sign1 - sign0 + horizontalContribution;
    //                    } else {
    //                        contribution = 1 - sign1 - sign1 + horizontalContribution;
    //                    }
    //                } else if (significance1) {
    //                    sign0 = coefficentsSign[index - width];
    //                    contribution = 1 - sign0 - sign0 + horizontalContribution;
    //                } else {
    //                    contribution = horizontalContribution;
    //                }
    //                if (contribution >= 0) {
    //                    contextLabel = 9 + contribution;
    //                    decoded = this.decoder.readBit(this.contexts, contextLabel);
    //                } else {
    //                    contextLabel = 9 - contribution;
    //                    decoded = this.decoder.readBit(this.contexts, contextLabel) ^ 1;
    //                }
    //                return decoded;
    //            },
    //            runMagnitudeRefinementPass: function BitModel_runMagnitudeRefinementPass() {
    //                var decoder = this.decoder;
    //                var width = this.width, height = this.height;
    //                var coefficentsMagnitude = this.coefficentsMagnitude;
    //                var neighborsSignificance = this.neighborsSignificance;
    //                var contexts = this.contexts;
    //                var bitsDecoded = this.bitsDecoded;
    //                var processingFlags = this.processingFlags;
    //                var processedMask = 1;
    //                var firstMagnitudeBitMask = 2;
    //                var length = width * height;
    //                var width4 = width * 4;
    //                for (var index0 = 0, indexNext; index0 < length; index0 = indexNext) {
    //                    indexNext = Math.min(length, index0 + width4);
    //                    for (var j = 0; j < width; j++) {
    //                        for (var index = index0 + j; index < indexNext; index += width) {
    //                            if (!coefficentsMagnitude[index] || (processingFlags[index] & processedMask) !== 0) {
    //                                continue;
    //                            }
    //                            var contextLabel = 16;
    //                            if ((processingFlags[index] & firstMagnitudeBitMask) !== 0) {
    //                                processingFlags[index] ^= firstMagnitudeBitMask;
    //                                var significance = neighborsSignificance[index] & 127;
    //                                contextLabel = significance === 0 ? 15 : 14;
    //                            }
    //                            var bit = decoder.readBit(contexts, contextLabel);
    //                            coefficentsMagnitude[index] = coefficentsMagnitude[index] << 1 | bit;
    //                            bitsDecoded[index]++;
    //                            processingFlags[index] |= processedMask;
    //                        }
    //                    }
    //                }
    //            },
    //            runCleanupPass: function BitModel_runCleanupPass() {
    //                var decoder = this.decoder;
    //                var width = this.width, height = this.height;
    //                var neighborsSignificance = this.neighborsSignificance;
    //                var coefficentsMagnitude = this.coefficentsMagnitude;
    //                var coefficentsSign = this.coefficentsSign;
    //                var contexts = this.contexts;
    //                var labels = this.contextLabelTable;
    //                var bitsDecoded = this.bitsDecoded;
    //                var processingFlags = this.processingFlags;
    //                var processedMask = 1;
    //                var firstMagnitudeBitMask = 2;
    //                var oneRowDown = width;
    //                var twoRowsDown = width * 2;
    //                var threeRowsDown = width * 3;
    //                var iNext;
    //                for (var i0 = 0; i0 < height; i0 = iNext) {
    //                    iNext = Math.min(i0 + 4, height);
    //                    var indexBase = i0 * width;
    //                    var checkAllEmpty = i0 + 3 < height;
    //                    for (var j = 0; j < width; j++) {
    //                        var index0 = indexBase + j;
    //                        var allEmpty = checkAllEmpty && processingFlags[index0] === 0 && processingFlags[index0 + oneRowDown] === 0 && processingFlags[index0 + twoRowsDown] === 0 && processingFlags[index0 + threeRowsDown] === 0 && neighborsSignificance[index0] === 0 && neighborsSignificance[index0 + oneRowDown] === 0 && neighborsSignificance[index0 + twoRowsDown] === 0 && neighborsSignificance[index0 + threeRowsDown] === 0;
    //                        var i1 = 0, index = index0;
    //                        var i = i0, sign;
    //                        if (allEmpty) {
    //                            var hasSignificantCoefficent = decoder.readBit(contexts, RUNLENGTH_CONTEXT);
    //                            if (!hasSignificantCoefficent) {
    //                                bitsDecoded[index0]++;
    //                                bitsDecoded[index0 + oneRowDown]++;
    //                                bitsDecoded[index0 + twoRowsDown]++;
    //                                bitsDecoded[index0 + threeRowsDown]++;
    //                                continue;
    //                            }
    //                            i1 = decoder.readBit(contexts, UNIFORM_CONTEXT) << 1 | decoder.readBit(contexts, UNIFORM_CONTEXT);
    //                            if (i1 !== 0) {
    //                                i = i0 + i1;
    //                                index += i1 * width;
    //                            }
    //                            sign = this.decodeSignBit(i, j, index);
    //                            coefficentsSign[index] = sign;
    //                            coefficentsMagnitude[index] = 1;
    //                            this.setNeighborsSignificance(i, j, index);
    //                            processingFlags[index] |= firstMagnitudeBitMask;
    //                            index = index0;
    //                            for (var i2 = i0; i2 <= i; i2++, index += width) {
    //                                bitsDecoded[index]++;
    //                            }
    //                            i1++;
    //                        }
    //                        for (i = i0 + i1; i < iNext; i++, index += width) {
    //                            if (coefficentsMagnitude[index] || (processingFlags[index] & processedMask) !== 0) {
    //                                continue;
    //                            }
    //                            var contextLabel = labels[neighborsSignificance[index]];
    //                            var decision = decoder.readBit(contexts, contextLabel);
    //                            if (decision === 1) {
    //                                sign = this.decodeSignBit(i, j, index);
    //                                coefficentsSign[index] = sign;
    //                                coefficentsMagnitude[index] = 1;
    //                                this.setNeighborsSignificance(i, j, index);
    //                                processingFlags[index] |= firstMagnitudeBitMask;
    //                            }
    //                            bitsDecoded[index]++;
    //                        }
    //                    }
    //                }
    //            },
    //            checkSegmentationSymbol: function BitModel_checkSegmentationSymbol() {
    //                var decoder = this.decoder;
    //                var contexts = this.contexts;
    //                var symbol = decoder.readBit(contexts, UNIFORM_CONTEXT) << 3 | decoder.readBit(contexts, UNIFORM_CONTEXT) << 2 | decoder.readBit(contexts, UNIFORM_CONTEXT) << 1 | decoder.readBit(contexts, UNIFORM_CONTEXT);
    //                if (symbol !== 10) {
    //                    throw new Error("JPX Error: Invalid segmentation symbol");
    //                }
    //            }
    //        };
    //        return BitModel;
    //    }();
    //    var Transform = function TransformClosure() {
    //        function Transform() {}
    //        Transform.prototype.calculate = function transformCalculate(subbands, u0, v0) {
    //            var ll = subbands[0];
    //            for (var i = 1, ii = subbands.length; i < ii; i++) {
    //                ll = this.iterate(ll, subbands[i], u0, v0);
    //            }
    //            return ll;
    //        };
    //        Transform.prototype.extend = function extend(buffer, offset, size) {
    //            var i1 = offset - 1, j1 = offset + 1;
    //            var i2 = offset + size - 2, j2 = offset + size;
    //            buffer[i1--] = buffer[j1++];
    //            buffer[j2++] = buffer[i2--];
    //            buffer[i1--] = buffer[j1++];
    //            buffer[j2++] = buffer[i2--];
    //            buffer[i1--] = buffer[j1++];
    //            buffer[j2++] = buffer[i2--];
    //            buffer[i1] = buffer[j1];
    //            buffer[j2] = buffer[i2];
    //        };
    //        Transform.prototype.iterate = function Transform_iterate(ll, hl_lh_hh, u0, v0) {
    //            var llWidth = ll.width, llHeight = ll.height, llItems = ll.items;
    //            var width = hl_lh_hh.width;
    //            var height = hl_lh_hh.height;
    //            var items = hl_lh_hh.items;
    //            var i, j, k, l, u, v;
    //            for (k = 0, i = 0; i < llHeight; i++) {
    //                l = i * 2 * width;
    //                for (j = 0; j < llWidth; j++, k++, l += 2) {
    //                    items[l] = llItems[k];
    //                }
    //            }
    //            llItems = ll.items = null;
    //            var bufferPadding = 4;
    //            var rowBuffer = new Float32Array(width + 2 * bufferPadding);
    //            if (width === 1) {
    //                if ((u0 & 1) !== 0) {
    //                    for (v = 0, k = 0; v < height; v++, k += width) {
    //                        items[k] *= .5;
    //                    }
    //                }
    //            } else {
    //                for (v = 0, k = 0; v < height; v++, k += width) {
    //                    rowBuffer.set(items.subarray(k, k + width), bufferPadding);
    //                    this.extend(rowBuffer, bufferPadding, width);
    //                    this.filter(rowBuffer, bufferPadding, width);
    //                    items.set(rowBuffer.subarray(bufferPadding, bufferPadding + width), k);
    //                }
    //            }
    //            var numBuffers = 16;
    //            var colBuffers = [];
    //            for (i = 0; i < numBuffers; i++) {
    //                colBuffers.push(new Float32Array(height + 2 * bufferPadding));
    //            }
    //            var b, currentBuffer = 0;
    //            ll = bufferPadding + height;
    //            if (height === 1) {
    //                if ((v0 & 1) !== 0) {
    //                    for (u = 0; u < width; u++) {
    //                        items[u] *= .5;
    //                    }
    //                }
    //            } else {
    //                for (u = 0; u < width; u++) {
    //                    if (currentBuffer === 0) {
    //                        numBuffers = Math.min(width - u, numBuffers);
    //                        for (k = u, l = bufferPadding; l < ll; k += width, l++) {
    //                            for (b = 0; b < numBuffers; b++) {
    //                                colBuffers[b][l] = items[k + b];
    //                            }
    //                        }
    //                        currentBuffer = numBuffers;
    //                    }
    //                    currentBuffer--;
    //                    var buffer = colBuffers[currentBuffer];
    //                    this.extend(buffer, bufferPadding, height);
    //                    this.filter(buffer, bufferPadding, height);
    //                    if (currentBuffer === 0) {
    //                        k = u - numBuffers + 1;
    //                        for (l = bufferPadding; l < ll; k += width, l++) {
    //                            for (b = 0; b < numBuffers; b++) {
    //                                items[k + b] = colBuffers[b][l];
    //                            }
    //                        }
    //                    }
    //                }
    //            }
    //            return {
    //                width: width,
    //                height: height,
    //                items: items
    //            };
    //        };
    //        return Transform;
    //    }();
    //    var IrreversibleTransform = function IrreversibleTransformClosure() {
    //        function IrreversibleTransform() {
    //            Transform.call(this);
    //        }
    //        IrreversibleTransform.prototype = Object.create(Transform.prototype);
    //        IrreversibleTransform.prototype.filter = function irreversibleTransformFilter(x, offset, length) {
    //            var len = length >> 1;
    //            offset = offset | 0;
    //            var j, n, current, next;
    //            var alpha = -1.586134342059924;
    //            var beta = -.052980118572961;
    //            var gamma = .882911075530934;
    //            var delta = .443506852043971;
    //            var K = 1.230174104914001;
    //            var K_ = 1 / K;
    //            j = offset - 3;
    //            for (n = len + 4; n--; j += 2) {
    //                x[j] *= K_;
    //            }
    //            j = offset - 2;
    //            current = delta * x[j - 1];
    //            for (n = len + 3; n--; j += 2) {
    //                next = delta * x[j + 1];
    //                x[j] = K * x[j] - current - next;
    //                if (n--) {
    //                    j += 2;
    //                    current = delta * x[j + 1];
    //                    x[j] = K * x[j] - current - next;
    //                } else {
    //                    break;
    //                }
    //            }
    //            j = offset - 1;
    //            current = gamma * x[j - 1];
    //            for (n = len + 2; n--; j += 2) {
    //                next = gamma * x[j + 1];
    //                x[j] -= current + next;
    //                if (n--) {
    //                    j += 2;
    //                    current = gamma * x[j + 1];
    //                    x[j] -= current + next;
    //                } else {
    //                    break;
    //                }
    //            }
    //            j = offset;
    //            current = beta * x[j - 1];
    //            for (n = len + 1; n--; j += 2) {
    //                next = beta * x[j + 1];
    //                x[j] -= current + next;
    //                if (n--) {
    //                    j += 2;
    //                    current = beta * x[j + 1];
    //                    x[j] -= current + next;
    //                } else {
    //                    break;
    //                }
    //            }
    //            if (len !== 0) {
    //                j = offset + 1;
    //                current = alpha * x[j - 1];
    //                for (n = len; n--; j += 2) {
    //                    next = alpha * x[j + 1];
    //                    x[j] -= current + next;
    //                    if (n--) {
    //                        j += 2;
    //                        current = alpha * x[j + 1];
    //                        x[j] -= current + next;
    //                    } else {
    //                        break;
    //                    }
    //                }
    //            }
    //        };
    //        return IrreversibleTransform;
    //    }();
    //    var ReversibleTransform = function ReversibleTransformClosure() {
    //        function ReversibleTransform() {
    //            Transform.call(this);
    //        }
    //        ReversibleTransform.prototype = Object.create(Transform.prototype);
    //        ReversibleTransform.prototype.filter = function reversibleTransformFilter(x, offset, length) {
    //            var len = length >> 1;
    //            offset = offset | 0;
    //            var j, n;
    //            for (j = offset, n = len + 1; n--; j += 2) {
    //                x[j] -= x[j - 1] + x[j + 1] + 2 >> 2;
    //            }
    //            for (j = offset + 1, n = len; n--; j += 2) {
    //                x[j] += x[j - 1] + x[j + 1] >> 1;
    //            }
    //        };
    //        return ReversibleTransform;
    //    }();
    //    return JpxImage;
    //}();
    //"use strict";
    //var Jbig2Image = function Jbig2ImageClosure() {
    //    function ContextCache() {}
    //    ContextCache.prototype = {
    //        getContexts: function(id) {
    //            if (id in this) {
    //                return this[id];
    //            }
    //            return this[id] = new Int8Array(1 << 16);
    //        }
    //    };
    //    function DecodingContext(data, start, end) {
    //        this.data = data;
    //        this.start = start;
    //        this.end = end;
    //    }
    //    DecodingContext.prototype = {
    //        get decoder() {
    //            var decoder = new ArithmeticDecoder(this.data, this.start, this.end);
    //            return shadow(this, "decoder", decoder);
    //        },
    //        get contextCache() {
    //            var cache = new ContextCache();
    //            return shadow(this, "contextCache", cache);
    //        }
    //    };
    //    function decodeInteger(contextCache, procedure, decoder) {
    //        var contexts = contextCache.getContexts(procedure);
    //        var prev = 1;
    //        function readBits(length) {
    //            var v = 0;
    //            for (var i = 0; i < length; i++) {
    //                var bit = decoder.readBit(contexts, prev);
    //                prev = prev < 256 ? prev << 1 | bit : (prev << 1 | bit) & 511 | 256;
    //                v = v << 1 | bit;
    //            }
    //            return v >>> 0;
    //        }
    //        var sign = readBits(1);
    //        var value = readBits(1) ? readBits(1) ? readBits(1) ? readBits(1) ? readBits(1) ? readBits(32) + 4436 : readBits(12) + 340 : readBits(8) + 84 : readBits(6) + 20 : readBits(4) + 4 : readBits(2);
    //        return sign === 0 ? value : value > 0 ? -value : null;
    //    }
    //    function decodeIAID(contextCache, decoder, codeLength) {
    //        var contexts = contextCache.getContexts("IAID");
    //        var prev = 1;
    //        for (var i = 0; i < codeLength; i++) {
    //            var bit = decoder.readBit(contexts, prev);
    //            prev = prev << 1 | bit;
    //        }
    //        if (codeLength < 31) {
    //            return prev & (1 << codeLength) - 1;
    //        }
    //        return prev & 2147483647;
    //    }
    //    var SegmentTypes = [ "SymbolDictionary", null, null, null, "IntermediateTextRegion", null, "ImmediateTextRegion", "ImmediateLosslessTextRegion", null, null, null, null, null, null, null, null, "patternDictionary", null, null, null, "IntermediateHalftoneRegion", null, "ImmediateHalftoneRegion", "ImmediateLosslessHalftoneRegion", null, null, null, null, null, null, null, null, null, null, null, null, "IntermediateGenericRegion", null, "ImmediateGenericRegion", "ImmediateLosslessGenericRegion", "IntermediateGenericRefinementRegion", null, "ImmediateGenericRefinementRegion", "ImmediateLosslessGenericRefinementRegion", null, null, null, null, "PageInformation", "EndOfPage", "EndOfStripe", "EndOfFile", "Profiles", "Tables", null, null, null, null, null, null, null, null, "Extension" ];
    //    var CodingTemplates = [ [ {
    //        x: -1,
    //        y: -2
    //    }, {
    //        x: 0,
    //        y: -2
    //    }, {
    //        x: 1,
    //        y: -2
    //    }, {
    //        x: -2,
    //        y: -1
    //    }, {
    //        x: -1,
    //        y: -1
    //    }, {
    //        x: 0,
    //        y: -1
    //    }, {
    //        x: 1,
    //        y: -1
    //    }, {
    //        x: 2,
    //        y: -1
    //    }, {
    //        x: -4,
    //        y: 0
    //    }, {
    //        x: -3,
    //        y: 0
    //    }, {
    //        x: -2,
    //        y: 0
    //    }, {
    //        x: -1,
    //        y: 0
    //    } ], [ {
    //        x: -1,
    //        y: -2
    //    }, {
    //        x: 0,
    //        y: -2
    //    }, {
    //        x: 1,
    //        y: -2
    //    }, {
    //        x: 2,
    //        y: -2
    //    }, {
    //        x: -2,
    //        y: -1
    //    }, {
    //        x: -1,
    //        y: -1
    //    }, {
    //        x: 0,
    //        y: -1
    //    }, {
    //        x: 1,
    //        y: -1
    //    }, {
    //        x: 2,
    //        y: -1
    //    }, {
    //        x: -3,
    //        y: 0
    //    }, {
    //        x: -2,
    //        y: 0
    //    }, {
    //        x: -1,
    //        y: 0
    //    } ], [ {
    //        x: -1,
    //        y: -2
    //    }, {
    //        x: 0,
    //        y: -2
    //    }, {
    //        x: 1,
    //        y: -2
    //    }, {
    //        x: -2,
    //        y: -1
    //    }, {
    //        x: -1,
    //        y: -1
    //    }, {
    //        x: 0,
    //        y: -1
    //    }, {
    //        x: 1,
    //        y: -1
    //    }, {
    //        x: -2,
    //        y: 0
    //    }, {
    //        x: -1,
    //        y: 0
    //    } ], [ {
    //        x: -3,
    //        y: -1
    //    }, {
    //        x: -2,
    //        y: -1
    //    }, {
    //        x: -1,
    //        y: -1
    //    }, {
    //        x: 0,
    //        y: -1
    //    }, {
    //        x: 1,
    //        y: -1
    //    }, {
    //        x: -4,
    //        y: 0
    //    }, {
    //        x: -3,
    //        y: 0
    //    }, {
    //        x: -2,
    //        y: 0
    //    }, {
    //        x: -1,
    //        y: 0
    //    } ] ];
    //    var RefinementTemplates = [ {
    //        coding: [ {
    //            x: 0,
    //            y: -1
    //        }, {
    //            x: 1,
    //            y: -1
    //        }, {
    //            x: -1,
    //            y: 0
    //        } ],
    //        reference: [ {
    //            x: 0,
    //            y: -1
    //        }, {
    //            x: 1,
    //            y: -1
    //        }, {
    //            x: -1,
    //            y: 0
    //        }, {
    //            x: 0,
    //            y: 0
    //        }, {
    //            x: 1,
    //            y: 0
    //        }, {
    //            x: -1,
    //            y: 1
    //        }, {
    //            x: 0,
    //            y: 1
    //        }, {
    //            x: 1,
    //            y: 1
    //        } ]
    //    }, {
    //        coding: [ {
    //            x: -1,
    //            y: -1
    //        }, {
    //            x: 0,
    //            y: -1
    //        }, {
    //            x: 1,
    //            y: -1
    //        }, {
    //            x: -1,
    //            y: 0
    //        } ],
    //        reference: [ {
    //            x: 0,
    //            y: -1
    //        }, {
    //            x: -1,
    //            y: 0
    //        }, {
    //            x: 0,
    //            y: 0
    //        }, {
    //            x: 1,
    //            y: 0
    //        }, {
    //            x: 0,
    //            y: 1
    //        }, {
    //            x: 1,
    //            y: 1
    //        } ]
    //    } ];
    //    var ReusedContexts = [ 39717, 1941, 229, 405 ];
    //    var RefinementReusedContexts = [ 32, 8 ];
    //    function decodeBitmapTemplate0(width, height, decodingContext) {
    //        var decoder = decodingContext.decoder;
    //        var contexts = decodingContext.contextCache.getContexts("GB");
    //        var contextLabel, i, j, pixel, row, row1, row2, bitmap = [];
    //        var OLD_PIXEL_MASK = 31735;
    //        for (i = 0; i < height; i++) {
    //            row = bitmap[i] = new Uint8Array(width);
    //            row1 = i < 1 ? row : bitmap[i - 1];
    //            row2 = i < 2 ? row : bitmap[i - 2];
    //            contextLabel = row2[0] << 13 | row2[1] << 12 | row2[2] << 11 | row1[0] << 7 | row1[1] << 6 | row1[2] << 5 | row1[3] << 4;
    //            for (j = 0; j < width; j++) {
    //                row[j] = pixel = decoder.readBit(contexts, contextLabel);
    //                contextLabel = (contextLabel & OLD_PIXEL_MASK) << 1 | (j + 3 < width ? row2[j + 3] << 11 : 0) | (j + 4 < width ? row1[j + 4] << 4 : 0) | pixel;
    //            }
    //        }
    //        return bitmap;
    //    }
    //    function decodeBitmap(mmr, width, height, templateIndex, prediction, skip, at, decodingContext) {
    //        if (mmr) {
    //            error("JBIG2 error: MMR encoding is not supported");
    //        }
    //        if (templateIndex === 0 && !skip && !prediction && at.length === 4 && at[0].x === 3 && at[0].y === -1 && at[1].x === -3 && at[1].y === -1 && at[2].x === 2 && at[2].y === -2 && at[3].x === -2 && at[3].y === -2) {
    //            return decodeBitmapTemplate0(width, height, decodingContext);
    //        }
    //        var useskip = !!skip;
    //        var template = CodingTemplates[templateIndex].concat(at);
    //        template.sort(function(a, b) {
    //            return a.y - b.y || a.x - b.x;
    //        });
    //        var templateLength = template.length;
    //        var templateX = new Int8Array(templateLength);
    //        var templateY = new Int8Array(templateLength);
    //        var changingTemplateEntries = [];
    //        var reuseMask = 0, minX = 0, maxX = 0, minY = 0;
    //        var c, k;
    //        for (k = 0; k < templateLength; k++) {
    //            templateX[k] = template[k].x;
    //            templateY[k] = template[k].y;
    //            minX = Math.min(minX, template[k].x);
    //            maxX = Math.max(maxX, template[k].x);
    //            minY = Math.min(minY, template[k].y);
    //            if (k < templateLength - 1 && template[k].y === template[k + 1].y && template[k].x === template[k + 1].x - 1) {
    //                reuseMask |= 1 << templateLength - 1 - k;
    //            } else {
    //                changingTemplateEntries.push(k);
    //            }
    //        }
    //        var changingEntriesLength = changingTemplateEntries.length;
    //        var changingTemplateX = new Int8Array(changingEntriesLength);
    //        var changingTemplateY = new Int8Array(changingEntriesLength);
    //        var changingTemplateBit = new Uint16Array(changingEntriesLength);
    //        for (c = 0; c < changingEntriesLength; c++) {
    //            k = changingTemplateEntries[c];
    //            changingTemplateX[c] = template[k].x;
    //            changingTemplateY[c] = template[k].y;
    //            changingTemplateBit[c] = 1 << templateLength - 1 - k;
    //        }
    //        var sbb_left = -minX;
    //        var sbb_top = -minY;
    //        var sbb_right = width - maxX;
    //        var pseudoPixelContext = ReusedContexts[templateIndex];
    //        var row = new Uint8Array(width);
    //        var bitmap = [];
    //        var decoder = decodingContext.decoder;
    //        var contexts = decodingContext.contextCache.getContexts("GB");
    //        var ltp = 0, j, i0, j0, contextLabel = 0, bit, shift;
    //        for (var i = 0; i < height; i++) {
    //            if (prediction) {
    //                var sltp = decoder.readBit(contexts, pseudoPixelContext);
    //                ltp ^= sltp;
    //                if (ltp) {
    //                    bitmap.push(row);
    //                    continue;
    //                }
    //            }
    //            row = new Uint8Array(row);
    //            bitmap.push(row);
    //            for (j = 0; j < width; j++) {
    //                if (useskip && skip[i][j]) {
    //                    row[j] = 0;
    //                    continue;
    //                }
    //                if (j >= sbb_left && j < sbb_right && i >= sbb_top) {
    //                    contextLabel = contextLabel << 1 & reuseMask;
    //                    for (k = 0; k < changingEntriesLength; k++) {
    //                        i0 = i + changingTemplateY[k];
    //                        j0 = j + changingTemplateX[k];
    //                        bit = bitmap[i0][j0];
    //                        if (bit) {
    //                            bit = changingTemplateBit[k];
    //                            contextLabel |= bit;
    //                        }
    //                    }
    //                } else {
    //                    contextLabel = 0;
    //                    shift = templateLength - 1;
    //                    for (k = 0; k < templateLength; k++, shift--) {
    //                        j0 = j + templateX[k];
    //                        if (j0 >= 0 && j0 < width) {
    //                            i0 = i + templateY[k];
    //                            if (i0 >= 0) {
    //                                bit = bitmap[i0][j0];
    //                                if (bit) {
    //                                    contextLabel |= bit << shift;
    //                                }
    //                            }
    //                        }
    //                    }
    //                }
    //                var pixel = decoder.readBit(contexts, contextLabel);
    //                row[j] = pixel;
    //            }
    //        }
    //        return bitmap;
    //    }
    //    function decodeRefinement(width, height, templateIndex, referenceBitmap, offsetX, offsetY, prediction, at, decodingContext) {
    //        var codingTemplate = RefinementTemplates[templateIndex].coding;
    //        if (templateIndex === 0) {
    //            codingTemplate = codingTemplate.concat([ at[0] ]);
    //        }
    //        var codingTemplateLength = codingTemplate.length;
    //        var codingTemplateX = new Int32Array(codingTemplateLength);
    //        var codingTemplateY = new Int32Array(codingTemplateLength);
    //        var k;
    //        for (k = 0; k < codingTemplateLength; k++) {
    //            codingTemplateX[k] = codingTemplate[k].x;
    //            codingTemplateY[k] = codingTemplate[k].y;
    //        }
    //        var referenceTemplate = RefinementTemplates[templateIndex].reference;
    //        if (templateIndex === 0) {
    //            referenceTemplate = referenceTemplate.concat([ at[1] ]);
    //        }
    //        var referenceTemplateLength = referenceTemplate.length;
    //        var referenceTemplateX = new Int32Array(referenceTemplateLength);
    //        var referenceTemplateY = new Int32Array(referenceTemplateLength);
    //        for (k = 0; k < referenceTemplateLength; k++) {
    //            referenceTemplateX[k] = referenceTemplate[k].x;
    //            referenceTemplateY[k] = referenceTemplate[k].y;
    //        }
    //        var referenceWidth = referenceBitmap[0].length;
    //        var referenceHeight = referenceBitmap.length;
    //        var pseudoPixelContext = RefinementReusedContexts[templateIndex];
    //        var bitmap = [];
    //        var decoder = decodingContext.decoder;
    //        var contexts = decodingContext.contextCache.getContexts("GR");
    //        var ltp = 0;
    //        for (var i = 0; i < height; i++) {
    //            if (prediction) {
    //                var sltp = decoder.readBit(contexts, pseudoPixelContext);
    //                ltp ^= sltp;
    //                if (ltp) {
    //                    error("JBIG2 error: prediction is not supported");
    //                }
    //            }
    //            var row = new Uint8Array(width);
    //            bitmap.push(row);
    //            for (var j = 0; j < width; j++) {
    //                var i0, j0;
    //                var contextLabel = 0;
    //                for (k = 0; k < codingTemplateLength; k++) {
    //                    i0 = i + codingTemplateY[k];
    //                    j0 = j + codingTemplateX[k];
    //                    if (i0 < 0 || j0 < 0 || j0 >= width) {
    //                        contextLabel <<= 1;
    //                    } else {
    //                        contextLabel = contextLabel << 1 | bitmap[i0][j0];
    //                    }
    //                }
    //                for (k = 0; k < referenceTemplateLength; k++) {
    //                    i0 = i + referenceTemplateY[k] + offsetY;
    //                    j0 = j + referenceTemplateX[k] + offsetX;
    //                    if (i0 < 0 || i0 >= referenceHeight || j0 < 0 || j0 >= referenceWidth) {
    //                        contextLabel <<= 1;
    //                    } else {
    //                        contextLabel = contextLabel << 1 | referenceBitmap[i0][j0];
    //                    }
    //                }
    //                var pixel = decoder.readBit(contexts, contextLabel);
    //                row[j] = pixel;
    //            }
    //        }
    //        return bitmap;
    //    }
    //    function decodeSymbolDictionary(huffman, refinement, symbols, numberOfNewSymbols, numberOfExportedSymbols, huffmanTables, templateIndex, at, refinementTemplateIndex, refinementAt, decodingContext) {
    //        if (huffman) {
    //            error("JBIG2 error: huffman is not supported");
    //        }
    //        var newSymbols = [];
    //        var currentHeight = 0;
    //        var symbolCodeLength = log2(symbols.length + numberOfNewSymbols);
    //        var decoder = decodingContext.decoder;
    //        var contextCache = decodingContext.contextCache;
    //        while (newSymbols.length < numberOfNewSymbols) {
    //            var deltaHeight = decodeInteger(contextCache, "IADH", decoder);
    //            currentHeight += deltaHeight;
    //            var currentWidth = 0;
    //            var totalWidth = 0;
    //            while (true) {
    //                var deltaWidth = decodeInteger(contextCache, "IADW", decoder);
    //                if (deltaWidth === null) {
    //                    break;
    //                }
    //                currentWidth += deltaWidth;
    //                totalWidth += currentWidth;
    //                var bitmap;
    //                if (refinement) {
    //                    var numberOfInstances = decodeInteger(contextCache, "IAAI", decoder);
    //                    if (numberOfInstances > 1) {
    //                        bitmap = decodeTextRegion(huffman, refinement, currentWidth, currentHeight, 0, numberOfInstances, 1, symbols.concat(newSymbols), symbolCodeLength, 0, 0, 1, 0, huffmanTables, refinementTemplateIndex, refinementAt, decodingContext);
    //                    } else {
    //                        var symbolId = decodeIAID(contextCache, decoder, symbolCodeLength);
    //                        var rdx = decodeInteger(contextCache, "IARDX", decoder);
    //                        var rdy = decodeInteger(contextCache, "IARDY", decoder);
    //                        var symbol = symbolId < symbols.length ? symbols[symbolId] : newSymbols[symbolId - symbols.length];
    //                        bitmap = decodeRefinement(currentWidth, currentHeight, refinementTemplateIndex, symbol, rdx, rdy, false, refinementAt, decodingContext);
    //                    }
    //                } else {
    //                    bitmap = decodeBitmap(false, currentWidth, currentHeight, templateIndex, false, null, at, decodingContext);
    //                }
    //                newSymbols.push(bitmap);
    //            }
    //        }
    //        var exportedSymbols = [];
    //        var flags = [], currentFlag = false;
    //        var totalSymbolsLength = symbols.length + numberOfNewSymbols;
    //        while (flags.length < totalSymbolsLength) {
    //            var runLength = decodeInteger(contextCache, "IAEX", decoder);
    //            while (runLength--) {
    //                flags.push(currentFlag);
    //            }
    //            currentFlag = !currentFlag;
    //        }
    //        for (var i = 0, ii = symbols.length; i < ii; i++) {
    //            if (flags[i]) {
    //                exportedSymbols.push(symbols[i]);
    //            }
    //        }
    //        for (var j = 0; j < numberOfNewSymbols; i++, j++) {
    //            if (flags[i]) {
    //                exportedSymbols.push(newSymbols[j]);
    //            }
    //        }
    //        return exportedSymbols;
    //    }
    //    function decodeTextRegion(huffman, refinement, width, height, defaultPixelValue, numberOfSymbolInstances, stripSize, inputSymbols, symbolCodeLength, transposed, dsOffset, referenceCorner, combinationOperator, huffmanTables, refinementTemplateIndex, refinementAt, decodingContext) {
    //        if (huffman) {
    //            error("JBIG2 error: huffman is not supported");
    //        }
    //        var bitmap = [];
    //        var i, row;
    //        for (i = 0; i < height; i++) {
    //            row = new Uint8Array(width);
    //            if (defaultPixelValue) {
    //                for (var j = 0; j < width; j++) {
    //                    row[j] = defaultPixelValue;
    //                }
    //            }
    //            bitmap.push(row);
    //        }
    //        var decoder = decodingContext.decoder;
    //        var contextCache = decodingContext.contextCache;
    //        var stripT = -decodeInteger(contextCache, "IADT", decoder);
    //        var firstS = 0;
    //        i = 0;
    //        while (i < numberOfSymbolInstances) {
    //            var deltaT = decodeInteger(contextCache, "IADT", decoder);
    //            stripT += deltaT;
    //            var deltaFirstS = decodeInteger(contextCache, "IAFS", decoder);
    //            firstS += deltaFirstS;
    //            var currentS = firstS;
    //            do {
    //                var currentT = stripSize === 1 ? 0 : decodeInteger(contextCache, "IAIT", decoder);
    //                var t = stripSize * stripT + currentT;
    //                var symbolId = decodeIAID(contextCache, decoder, symbolCodeLength);
    //                var applyRefinement = refinement && decodeInteger(contextCache, "IARI", decoder);
    //                var symbolBitmap = inputSymbols[symbolId];
    //                var symbolWidth = symbolBitmap[0].length;
    //                var symbolHeight = symbolBitmap.length;
    //                if (applyRefinement) {
    //                    var rdw = decodeInteger(contextCache, "IARDW", decoder);
    //                    var rdh = decodeInteger(contextCache, "IARDH", decoder);
    //                    var rdx = decodeInteger(contextCache, "IARDX", decoder);
    //                    var rdy = decodeInteger(contextCache, "IARDY", decoder);
    //                    symbolWidth += rdw;
    //                    symbolHeight += rdh;
    //                    symbolBitmap = decodeRefinement(symbolWidth, symbolHeight, refinementTemplateIndex, symbolBitmap, (rdw >> 1) + rdx, (rdh >> 1) + rdy, false, refinementAt, decodingContext);
    //                }
    //                var offsetT = t - (referenceCorner & 1 ? 0 : symbolHeight);
    //                var offsetS = currentS - (referenceCorner & 2 ? symbolWidth : 0);
    //                var s2, t2, symbolRow;
    //                if (transposed) {
    //                    for (s2 = 0; s2 < symbolHeight; s2++) {
    //                        row = bitmap[offsetS + s2];
    //                        if (!row) {
    //                            continue;
    //                        }
    //                        symbolRow = symbolBitmap[s2];
    //                        var maxWidth = Math.min(width - offsetT, symbolWidth);
    //                        switch (combinationOperator) {
    //                          case 0:
    //                            for (t2 = 0; t2 < maxWidth; t2++) {
    //                                row[offsetT + t2] |= symbolRow[t2];
    //                            }
    //                            break;
    //
    //                          case 2:
    //                            for (t2 = 0; t2 < maxWidth; t2++) {
    //                                row[offsetT + t2] ^= symbolRow[t2];
    //                            }
    //                            break;
    //
    //                          default:
    //                            error("JBIG2 error: operator " + combinationOperator + " is not supported");
    //                        }
    //                    }
    //                    currentS += symbolHeight - 1;
    //                } else {
    //                    for (t2 = 0; t2 < symbolHeight; t2++) {
    //                        row = bitmap[offsetT + t2];
    //                        if (!row) {
    //                            continue;
    //                        }
    //                        symbolRow = symbolBitmap[t2];
    //                        switch (combinationOperator) {
    //                          case 0:
    //                            for (s2 = 0; s2 < symbolWidth; s2++) {
    //                                row[offsetS + s2] |= symbolRow[s2];
    //                            }
    //                            break;
    //
    //                          case 2:
    //                            for (s2 = 0; s2 < symbolWidth; s2++) {
    //                                row[offsetS + s2] ^= symbolRow[s2];
    //                            }
    //                            break;
    //
    //                          default:
    //                            error("JBIG2 error: operator " + combinationOperator + " is not supported");
    //                        }
    //                    }
    //                    currentS += symbolWidth - 1;
    //                }
    //                i++;
    //                var deltaS = decodeInteger(contextCache, "IADS", decoder);
    //                if (deltaS === null) {
    //                    break;
    //                }
    //                currentS += deltaS + dsOffset;
    //            } while (true);
    //        }
    //        return bitmap;
    //    }
    //    function readSegmentHeader(data, start) {
    //        var segmentHeader = {};
    //        segmentHeader.number = readUint32(data, start);
    //        var flags = data[start + 4];
    //        var segmentType = flags & 63;
    //        if (!SegmentTypes[segmentType]) {
    //            error("JBIG2 error: invalid segment type: " + segmentType);
    //        }
    //        segmentHeader.type = segmentType;
    //        segmentHeader.typeName = SegmentTypes[segmentType];
    //        segmentHeader.deferredNonRetain = !!(flags & 128);
    //        var pageAssociationFieldSize = !!(flags & 64);
    //        var referredFlags = data[start + 5];
    //        var referredToCount = referredFlags >> 5 & 7;
    //        var retainBits = [ referredFlags & 31 ];
    //        var position = start + 6;
    //        if (referredFlags === 7) {
    //            referredToCount = readUint32(data, position - 1) & 536870911;
    //            position += 3;
    //            var bytes = referredToCount + 7 >> 3;
    //            retainBits[0] = data[position++];
    //            while (--bytes > 0) {
    //                retainBits.push(data[position++]);
    //            }
    //        } else if (referredFlags === 5 || referredFlags === 6) {
    //            error("JBIG2 error: invalid referred-to flags");
    //        }
    //        segmentHeader.retainBits = retainBits;
    //        var referredToSegmentNumberSize = segmentHeader.number <= 256 ? 1 : segmentHeader.number <= 65536 ? 2 : 4;
    //        var referredTo = [];
    //        var i, ii;
    //        for (i = 0; i < referredToCount; i++) {
    //            var number = referredToSegmentNumberSize === 1 ? data[position] : referredToSegmentNumberSize === 2 ? readUint16(data, position) : readUint32(data, position);
    //            referredTo.push(number);
    //            position += referredToSegmentNumberSize;
    //        }
    //        segmentHeader.referredTo = referredTo;
    //        if (!pageAssociationFieldSize) {
    //            segmentHeader.pageAssociation = data[position++];
    //        } else {
    //            segmentHeader.pageAssociation = readUint32(data, position);
    //            position += 4;
    //        }
    //        segmentHeader.length = readUint32(data, position);
    //        position += 4;
    //        if (segmentHeader.length === 4294967295) {
    //            if (segmentType === 38) {
    //                var genericRegionInfo = readRegionSegmentInformation(data, position);
    //                var genericRegionSegmentFlags = data[position + RegionSegmentInformationFieldLength];
    //                var genericRegionMmr = !!(genericRegionSegmentFlags & 1);
    //                var searchPatternLength = 6;
    //                var searchPattern = new Uint8Array(searchPatternLength);
    //                if (!genericRegionMmr) {
    //                    searchPattern[0] = 255;
    //                    searchPattern[1] = 172;
    //                }
    //                searchPattern[2] = genericRegionInfo.height >>> 24 & 255;
    //                searchPattern[3] = genericRegionInfo.height >> 16 & 255;
    //                searchPattern[4] = genericRegionInfo.height >> 8 & 255;
    //                searchPattern[5] = genericRegionInfo.height & 255;
    //                for (i = position, ii = data.length; i < ii; i++) {
    //                    var j = 0;
    //                    while (j < searchPatternLength && searchPattern[j] === data[i + j]) {
    //                        j++;
    //                    }
    //                    if (j === searchPatternLength) {
    //                        segmentHeader.length = i + searchPatternLength;
    //                        break;
    //                    }
    //                }
    //                if (segmentHeader.length === 4294967295) {
    //                    error("JBIG2 error: segment end was not found");
    //                }
    //            } else {
    //                error("JBIG2 error: invalid unknown segment length");
    //            }
    //        }
    //        segmentHeader.headerEnd = position;
    //        return segmentHeader;
    //    }
    //    function readSegments(header, data, start, end) {
    //        var segments = [];
    //        var position = start;
    //        while (position < end) {
    //            var segmentHeader = readSegmentHeader(data, position);
    //            position = segmentHeader.headerEnd;
    //            var segment = {
    //                header: segmentHeader,
    //                data: data
    //            };
    //            if (!header.randomAccess) {
    //                segment.start = position;
    //                position += segmentHeader.length;
    //                segment.end = position;
    //            }
    //            segments.push(segment);
    //            if (segmentHeader.type === 51) {
    //                break;
    //            }
    //        }
    //        if (header.randomAccess) {
    //            for (var i = 0, ii = segments.length; i < ii; i++) {
    //                segments[i].start = position;
    //                position += segments[i].header.length;
    //                segments[i].end = position;
    //            }
    //        }
    //        return segments;
    //    }
    //    function readRegionSegmentInformation(data, start) {
    //        return {
    //            width: readUint32(data, start),
    //            height: readUint32(data, start + 4),
    //            x: readUint32(data, start + 8),
    //            y: readUint32(data, start + 12),
    //            combinationOperator: data[start + 16] & 7
    //        };
    //    }
    //    var RegionSegmentInformationFieldLength = 17;
    //    function processSegment(segment, visitor) {
    //        var header = segment.header;
    //        var data = segment.data, position = segment.start, end = segment.end;
    //        var args, at, i, atLength;
    //        switch (header.type) {
    //          case 0:
    //            var dictionary = {};
    //            var dictionaryFlags = readUint16(data, position);
    //            dictionary.huffman = !!(dictionaryFlags & 1);
    //            dictionary.refinement = !!(dictionaryFlags & 2);
    //            dictionary.huffmanDHSelector = dictionaryFlags >> 2 & 3;
    //            dictionary.huffmanDWSelector = dictionaryFlags >> 4 & 3;
    //            dictionary.bitmapSizeSelector = dictionaryFlags >> 6 & 1;
    //            dictionary.aggregationInstancesSelector = dictionaryFlags >> 7 & 1;
    //            dictionary.bitmapCodingContextUsed = !!(dictionaryFlags & 256);
    //            dictionary.bitmapCodingContextRetained = !!(dictionaryFlags & 512);
    //            dictionary.template = dictionaryFlags >> 10 & 3;
    //            dictionary.refinementTemplate = dictionaryFlags >> 12 & 1;
    //            position += 2;
    //            if (!dictionary.huffman) {
    //                atLength = dictionary.template === 0 ? 4 : 1;
    //                at = [];
    //                for (i = 0; i < atLength; i++) {
    //                    at.push({
    //                        x: readInt8(data, position),
    //                        y: readInt8(data, position + 1)
    //                    });
    //                    position += 2;
    //                }
    //                dictionary.at = at;
    //            }
    //            if (dictionary.refinement && !dictionary.refinementTemplate) {
    //                at = [];
    //                for (i = 0; i < 2; i++) {
    //                    at.push({
    //                        x: readInt8(data, position),
    //                        y: readInt8(data, position + 1)
    //                    });
    //                    position += 2;
    //                }
    //                dictionary.refinementAt = at;
    //            }
    //            dictionary.numberOfExportedSymbols = readUint32(data, position);
    //            position += 4;
    //            dictionary.numberOfNewSymbols = readUint32(data, position);
    //            position += 4;
    //            args = [ dictionary, header.number, header.referredTo, data, position, end ];
    //            break;
    //
    //          case 6:
    //          case 7:
    //            var textRegion = {};
    //            textRegion.info = readRegionSegmentInformation(data, position);
    //            position += RegionSegmentInformationFieldLength;
    //            var textRegionSegmentFlags = readUint16(data, position);
    //            position += 2;
    //            textRegion.huffman = !!(textRegionSegmentFlags & 1);
    //            textRegion.refinement = !!(textRegionSegmentFlags & 2);
    //            textRegion.stripSize = 1 << (textRegionSegmentFlags >> 2 & 3);
    //            textRegion.referenceCorner = textRegionSegmentFlags >> 4 & 3;
    //            textRegion.transposed = !!(textRegionSegmentFlags & 64);
    //            textRegion.combinationOperator = textRegionSegmentFlags >> 7 & 3;
    //            textRegion.defaultPixelValue = textRegionSegmentFlags >> 9 & 1;
    //            textRegion.dsOffset = textRegionSegmentFlags << 17 >> 27;
    //            textRegion.refinementTemplate = textRegionSegmentFlags >> 15 & 1;
    //            if (textRegion.huffman) {
    //                var textRegionHuffmanFlags = readUint16(data, position);
    //                position += 2;
    //                textRegion.huffmanFS = textRegionHuffmanFlags & 3;
    //                textRegion.huffmanDS = textRegionHuffmanFlags >> 2 & 3;
    //                textRegion.huffmanDT = textRegionHuffmanFlags >> 4 & 3;
    //                textRegion.huffmanRefinementDW = textRegionHuffmanFlags >> 6 & 3;
    //                textRegion.huffmanRefinementDH = textRegionHuffmanFlags >> 8 & 3;
    //                textRegion.huffmanRefinementDX = textRegionHuffmanFlags >> 10 & 3;
    //                textRegion.huffmanRefinementDY = textRegionHuffmanFlags >> 12 & 3;
    //                textRegion.huffmanRefinementSizeSelector = !!(textRegionHuffmanFlags & 14);
    //            }
    //            if (textRegion.refinement && !textRegion.refinementTemplate) {
    //                at = [];
    //                for (i = 0; i < 2; i++) {
    //                    at.push({
    //                        x: readInt8(data, position),
    //                        y: readInt8(data, position + 1)
    //                    });
    //                    position += 2;
    //                }
    //                textRegion.refinementAt = at;
    //            }
    //            textRegion.numberOfSymbolInstances = readUint32(data, position);
    //            position += 4;
    //            if (textRegion.huffman) {
    //                error("JBIG2 error: huffman is not supported");
    //            }
    //            args = [ textRegion, header.referredTo, data, position, end ];
    //            break;
    //
    //          case 38:
    //          case 39:
    //            var genericRegion = {};
    //            genericRegion.info = readRegionSegmentInformation(data, position);
    //            position += RegionSegmentInformationFieldLength;
    //            var genericRegionSegmentFlags = data[position++];
    //            genericRegion.mmr = !!(genericRegionSegmentFlags & 1);
    //            genericRegion.template = genericRegionSegmentFlags >> 1 & 3;
    //            genericRegion.prediction = !!(genericRegionSegmentFlags & 8);
    //            if (!genericRegion.mmr) {
    //                atLength = genericRegion.template === 0 ? 4 : 1;
    //                at = [];
    //                for (i = 0; i < atLength; i++) {
    //                    at.push({
    //                        x: readInt8(data, position),
    //                        y: readInt8(data, position + 1)
    //                    });
    //                    position += 2;
    //                }
    //                genericRegion.at = at;
    //            }
    //            args = [ genericRegion, data, position, end ];
    //            break;
    //
    //          case 48:
    //            var pageInfo = {
    //                width: readUint32(data, position),
    //                height: readUint32(data, position + 4),
    //                resolutionX: readUint32(data, position + 8),
    //                resolutionY: readUint32(data, position + 12)
    //            };
    //            if (pageInfo.height === 4294967295) {
    //                delete pageInfo.height;
    //            }
    //            var pageSegmentFlags = data[position + 16];
    //            var pageStripingInformatiom = readUint16(data, position + 17);
    //            pageInfo.lossless = !!(pageSegmentFlags & 1);
    //            pageInfo.refinement = !!(pageSegmentFlags & 2);
    //            pageInfo.defaultPixelValue = pageSegmentFlags >> 2 & 1;
    //            pageInfo.combinationOperator = pageSegmentFlags >> 3 & 3;
    //            pageInfo.requiresBuffer = !!(pageSegmentFlags & 32);
    //            pageInfo.combinationOperatorOverride = !!(pageSegmentFlags & 64);
    //            args = [ pageInfo ];
    //            break;
    //
    //          case 49:
    //            break;
    //
    //          case 50:
    //            break;
    //
    //          case 51:
    //            break;
    //
    //          case 62:
    //            break;
    //
    //          default:
    //            error("JBIG2 error: segment type " + header.typeName + "(" + header.type + ") is not implemented");
    //        }
    //        var callbackName = "on" + header.typeName;
    //        if (callbackName in visitor) {
    //            visitor[callbackName].apply(visitor, args);
    //        }
    //    }
    //    function processSegments(segments, visitor) {
    //        for (var i = 0, ii = segments.length; i < ii; i++) {
    //            processSegment(segments[i], visitor);
    //        }
    //    }
    //    function parseJbig2(data, start, end) {
    //        var position = start;
    //        if (data[position] !== 151 || data[position + 1] !== 74 || data[position + 2] !== 66 || data[position + 3] !== 50 || data[position + 4] !== 13 || data[position + 5] !== 10 || data[position + 6] !== 26 || data[position + 7] !== 10) {
    //            error("JBIG2 error: invalid header");
    //        }
    //        var header = {};
    //        position += 8;
    //        var flags = data[position++];
    //        header.randomAccess = !(flags & 1);
    //        if (!(flags & 2)) {
    //            header.numberOfPages = readUint32(data, position);
    //            position += 4;
    //        }
    //        var segments = readSegments(header, data, position, end);
    //        error("Not implemented");
    //    }
    //    function parseJbig2Chunks(chunks) {
    //        var visitor = new SimpleSegmentVisitor();
    //        for (var i = 0, ii = chunks.length; i < ii; i++) {
    //            var chunk = chunks[i];
    //            var segments = readSegments({}, chunk.data, chunk.start, chunk.end);
    //            processSegments(segments, visitor);
    //        }
    //        return visitor;
    //    }
    //    function SimpleSegmentVisitor() {}
    //    SimpleSegmentVisitor.prototype = {
    //        onPageInformation: function SimpleSegmentVisitor_onPageInformation(info) {
    //            this.currentPageInfo = info;
    //            var rowSize = info.width + 7 >> 3;
    //            var buffer = new Uint8Array(rowSize * info.height);
    //            if (info.defaultPixelValue) {
    //                for (var i = 0, ii = buffer.length; i < ii; i++) {
    //                    buffer[i] = 255;
    //                }
    //            }
    //            this.buffer = buffer;
    //        },
    //        drawBitmap: function SimpleSegmentVisitor_drawBitmap(regionInfo, bitmap) {
    //            var pageInfo = this.currentPageInfo;
    //            var width = regionInfo.width, height = regionInfo.height;
    //            var rowSize = pageInfo.width + 7 >> 3;
    //            var combinationOperator = pageInfo.combinationOperatorOverride ? regionInfo.combinationOperator : pageInfo.combinationOperator;
    //            var buffer = this.buffer;
    //            var mask0 = 128 >> (regionInfo.x & 7);
    //            var offset0 = regionInfo.y * rowSize + (regionInfo.x >> 3);
    //            var i, j, mask, offset;
    //            switch (combinationOperator) {
    //              case 0:
    //                for (i = 0; i < height; i++) {
    //                    mask = mask0;
    //                    offset = offset0;
    //                    for (j = 0; j < width; j++) {
    //                        if (bitmap[i][j]) {
    //                            buffer[offset] |= mask;
    //                        }
    //                        mask >>= 1;
    //                        if (!mask) {
    //                            mask = 128;
    //                            offset++;
    //                        }
    //                    }
    //                    offset0 += rowSize;
    //                }
    //                break;
    //
    //              case 2:
    //                for (i = 0; i < height; i++) {
    //                    mask = mask0;
    //                    offset = offset0;
    //                    for (j = 0; j < width; j++) {
    //                        if (bitmap[i][j]) {
    //                            buffer[offset] ^= mask;
    //                        }
    //                        mask >>= 1;
    //                        if (!mask) {
    //                            mask = 128;
    //                            offset++;
    //                        }
    //                    }
    //                    offset0 += rowSize;
    //                }
    //                break;
    //
    //              default:
    //                error("JBIG2 error: operator " + combinationOperator + " is not supported");
    //            }
    //        },
    //        onImmediateGenericRegion: function SimpleSegmentVisitor_onImmediateGenericRegion(region, data, start, end) {
    //            var regionInfo = region.info;
    //            var decodingContext = new DecodingContext(data, start, end);
    //            var bitmap = decodeBitmap(region.mmr, regionInfo.width, regionInfo.height, region.template, region.prediction, null, region.at, decodingContext);
    //            this.drawBitmap(regionInfo, bitmap);
    //        },
    //        onImmediateLosslessGenericRegion: function SimpleSegmentVisitor_onImmediateLosslessGenericRegion() {
    //            this.onImmediateGenericRegion.apply(this, arguments);
    //        },
    //        onSymbolDictionary: function SimpleSegmentVisitor_onSymbolDictionary(dictionary, currentSegment, referredSegments, data, start, end) {
    //            var huffmanTables;
    //            if (dictionary.huffman) {
    //                error("JBIG2 error: huffman is not supported");
    //            }
    //            var symbols = this.symbols;
    //            if (!symbols) {
    //                this.symbols = symbols = {};
    //            }
    //            var inputSymbols = [];
    //            for (var i = 0, ii = referredSegments.length; i < ii; i++) {
    //                inputSymbols = inputSymbols.concat(symbols[referredSegments[i]]);
    //            }
    //            var decodingContext = new DecodingContext(data, start, end);
    //            symbols[currentSegment] = decodeSymbolDictionary(dictionary.huffman, dictionary.refinement, inputSymbols, dictionary.numberOfNewSymbols, dictionary.numberOfExportedSymbols, huffmanTables, dictionary.template, dictionary.at, dictionary.refinementTemplate, dictionary.refinementAt, decodingContext);
    //        },
    //        onImmediateTextRegion: function SimpleSegmentVisitor_onImmediateTextRegion(region, referredSegments, data, start, end) {
    //            var regionInfo = region.info;
    //            var huffmanTables;
    //            var symbols = this.symbols;
    //            var inputSymbols = [];
    //            for (var i = 0, ii = referredSegments.length; i < ii; i++) {
    //                inputSymbols = inputSymbols.concat(symbols[referredSegments[i]]);
    //            }
    //            var symbolCodeLength = log2(inputSymbols.length);
    //            var decodingContext = new DecodingContext(data, start, end);
    //            var bitmap = decodeTextRegion(region.huffman, region.refinement, regionInfo.width, regionInfo.height, region.defaultPixelValue, region.numberOfSymbolInstances, region.stripSize, inputSymbols, symbolCodeLength, region.transposed, region.dsOffset, region.referenceCorner, region.combinationOperator, huffmanTables, region.refinementTemplate, region.refinementAt, decodingContext);
    //            this.drawBitmap(regionInfo, bitmap);
    //        },
    //        onImmediateLosslessTextRegion: function SimpleSegmentVisitor_onImmediateLosslessTextRegion() {
    //            this.onImmediateTextRegion.apply(this, arguments);
    //        }
    //    };
    //    function Jbig2Image() {}
    //    Jbig2Image.prototype = {
    //        parseChunks: function Jbig2Image_parseChunks(chunks) {
    //            return parseJbig2Chunks(chunks);
    //        }
    //    };
    //    return Jbig2Image;
    //}();
    function log2(x) {
        var n = 1, i = 0;
        while (x > n) {
            n <<= 1;
            i++;
        }
        return i;
    }
    function readInt8(data, start) {
        return data[start] << 24 >> 24;
    }
    function readUint16(data, offset) {
        return data[offset] << 8 | data[offset + 1];
    }
    function readUint32(data, offset) {
        return (data[offset] << 24 | data[offset + 1] << 16 | data[offset + 2] << 8 | data[offset + 3]) >>> 0;
    }
    function shadow(obj, prop, value) {
        Object.defineProperty(obj, prop, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: false
        });
        return value;
    }
    var error = function() {
        console.error.apply(console, arguments);
        throw new Error("PDFJS error: " + arguments[0]);
    };
    var warn = function() {
        console.warn.apply(console, arguments);
    };
    var info = function() {
        console.info.apply(console, arguments);
    };
    //Jbig2Image.prototype.parse = function parseJbig2(data) {
    //    var position = 0, end = data.length;
    //    if (data[position] !== 151 || data[position + 1] !== 74 || data[position + 2] !== 66 || data[position + 3] !== 50 || data[position + 4] !== 13 || data[position + 5] !== 10 || data[position + 6] !== 26 || data[position + 7] !== 10) {
    //        error("JBIG2 error: invalid header");
    //    }
    //    var header = {};
    //    position += 8;
    //    var flags = data[position++];
    //    header.randomAccess = !(flags & 1);
    //    if (!(flags & 2)) {
    //        header.numberOfPages = readUint32(data, position);
    //        position += 4;
    //    }
    //    var visitor = this.parseChunks([ {
    //        data: data,
    //        start: position,
    //        end: end
    //    } ]);
    //    var width = visitor.currentPageInfo.width;
    //    var height = visitor.currentPageInfo.height;
    //    var bitPacked = visitor.buffer;
    //    var data = new Uint8Array(width * height);
    //    var q = 0, k = 0;
    //    for (var i = 0; i < height; i++) {
    //        var mask = 0, buffer;
    //        for (var j = 0; j < width; j++) {
    //            if (!mask) {
    //                mask = 128;
    //                buffer = bitPacked[k++];
    //            }
    //            data[q++] = buffer & mask ? 0 : 255;
    //            mask >>= 1;
    //        }
    //    }
    //    this.width = width;
    //    this.height = height;
    //    this.data = data;
    //};
    PDFJS.JpegImage = JpegImage;
    //PDFJS.JpxImage = JpxImage;
    //PDFJS.Jbig2Image = Jbig2Image;
})(PDFJS || (PDFJS = {}));

var JpegDecoder = PDFJS.JpegImage;

//var JpxDecoder = PDFJS.JpxImage;

//var Jbig2Decoder = PDFJS.Jbig2Image;


var moduleType = typeof module;
if ((moduleType !== 'undefined') && module.exports) {
    module.exports = {
        JpegImage: JpegImage,
        JpegDecoder: JpegDecoder
        //JpxDecoder: JpxDecoder,
        //Jbig2Decoder: Jbig2Decoder
    };
}
},{}],2:[function(require,module,exports){
/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/* Copyright 2012 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/* globals ArithmeticDecoder, globalScope, log2, readUint16, readUint32,
           info, warn */

'use strict';

var JpxImage = (function JpxImageClosure() {
  // Table E.1
  var SubbandsGainLog2 = {
    'LL': 0,
    'LH': 1,
    'HL': 1,
    'HH': 2
  };
  function JpxImage() {
    this.failOnCorruptedImage = false;
  }
  JpxImage.prototype = {
    parse: function JpxImage_parse(data) {

      var head = readUint16(data, 0);
      // No box header, immediate start of codestream (SOC)
      if (head === 0xFF4F) {
        this.parseCodestream(data, 0, data.length);
        return;
      }

      var position = 0, length = data.length;
      while (position < length) {
        var headerSize = 8;
        var lbox = readUint32(data, position);
        var tbox = readUint32(data, position + 4);
        position += headerSize;
        if (lbox === 1) {
          // XLBox: read UInt64 according to spec.
          // JavaScript's int precision of 53 bit should be sufficient here.
          lbox = readUint32(data, position) * 4294967296 +
                 readUint32(data, position + 4);
          position += 8;
          headerSize += 8;
        }
        if (lbox === 0) {
          lbox = length - position + headerSize;
        }
        if (lbox < headerSize) {
          throw new Error('JPX Error: Invalid box field size');
        }
        var dataLength = lbox - headerSize;
        var jumpDataLength = true;
        switch (tbox) {
          case 0x6A703268: // 'jp2h'
            jumpDataLength = false; // parsing child boxes
            break;
          case 0x636F6C72: // 'colr'
            // Colorspaces are not used, the CS from the PDF is used.
            var method = data[position];
            var precedence = data[position + 1];
            var approximation = data[position + 2];
            if (method === 1) {
              // enumerated colorspace
              var colorspace = readUint32(data, position + 3);
              switch (colorspace) {
                case 16: // this indicates a sRGB colorspace
                case 17: // this indicates a grayscale colorspace
                case 18: // this indicates a YUV colorspace
                  break;
                default:
                  warn('Unknown colorspace ' + colorspace);
                  break;
              }
            } else if (method === 2) {
              info('ICC profile not supported');
            }
            break;
          case 0x6A703263: // 'jp2c'
            this.parseCodestream(data, position, position + dataLength);
            break;
          case 0x6A502020: // 'jP\024\024'
            if (0x0d0a870a !== readUint32(data, position)) {
              warn('Invalid JP2 signature');
            }
            break;
          // The following header types are valid but currently not used:
          case 0x6A501A1A: // 'jP\032\032'
          case 0x66747970: // 'ftyp'
          case 0x72726571: // 'rreq'
          case 0x72657320: // 'res '
          case 0x69686472: // 'ihdr'
            break;
          default:
            var headerType = String.fromCharCode((tbox >> 24) & 0xFF,
                                                 (tbox >> 16) & 0xFF,
                                                 (tbox >> 8) & 0xFF,
                                                 tbox & 0xFF);
            warn('Unsupported header type ' + tbox + ' (' + headerType + ')');
            break;
        }
        if (jumpDataLength) {
          position += dataLength;
        }
      }
    },
    parseImageProperties: function JpxImage_parseImageProperties(stream) {
      var newByte = stream.getByte();
      while (newByte >= 0) {
        var oldByte = newByte;
        newByte = stream.getByte();
        var code = (oldByte << 8) | newByte;
        // Image and tile size (SIZ)
        if (code === 0xFF51) {
          stream.skip(4);
          var Xsiz = stream.getInt32() >>> 0; // Byte 4
          var Ysiz = stream.getInt32() >>> 0; // Byte 8
          var XOsiz = stream.getInt32() >>> 0; // Byte 12
          var YOsiz = stream.getInt32() >>> 0; // Byte 16
          stream.skip(16);
          var Csiz = stream.getUint16(); // Byte 36
          this.width = Xsiz - XOsiz;
          this.height = Ysiz - YOsiz;
          this.componentsCount = Csiz;
          // Results are always returned as Uint8Arrays
          this.bitsPerComponent = 8;
          return;
        }
      }
      throw new Error('JPX Error: No size marker found in JPX stream');
    },
    parseCodestream: function JpxImage_parseCodestream(data, start, end) {
      var context = {};
      try {
        var doNotRecover = false;
        var position = start;
        while (position + 1 < end) {
          var code = readUint16(data, position);
          position += 2;

          var length = 0, j, sqcd, spqcds, spqcdSize, scalarExpounded, tile;
          switch (code) {
            case 0xFF4F: // Start of codestream (SOC)
              context.mainHeader = true;
              break;
            case 0xFFD9: // End of codestream (EOC)
              break;
            case 0xFF51: // Image and tile size (SIZ)
              length = readUint16(data, position);
              var siz = {};
              siz.Xsiz = readUint32(data, position + 4);
              siz.Ysiz = readUint32(data, position + 8);
              siz.XOsiz = readUint32(data, position + 12);
              siz.YOsiz = readUint32(data, position + 16);
              siz.XTsiz = readUint32(data, position + 20);
              siz.YTsiz = readUint32(data, position + 24);
              siz.XTOsiz = readUint32(data, position + 28);
              siz.YTOsiz = readUint32(data, position + 32);
              var componentsCount = readUint16(data, position + 36);
              siz.Csiz = componentsCount;
              var components = [];
              j = position + 38;
              for (var i = 0; i < componentsCount; i++) {
                var component = {
                  precision: (data[j] & 0x7F) + 1,
                  isSigned: !!(data[j] & 0x80),
                  XRsiz: data[j + 1],
                  YRsiz: data[j + 1]
                };
                calculateComponentDimensions(component, siz);
                components.push(component);
              }
              context.SIZ = siz;
              context.components = components;
              calculateTileGrids(context, components);
              context.QCC = [];
              context.COC = [];
              break;
            case 0xFF5C: // Quantization default (QCD)
              length = readUint16(data, position);
              var qcd = {};
              j = position + 2;
              sqcd = data[j++];
              switch (sqcd & 0x1F) {
                case 0:
                  spqcdSize = 8;
                  scalarExpounded = true;
                  break;
                case 1:
                  spqcdSize = 16;
                  scalarExpounded = false;
                  break;
                case 2:
                  spqcdSize = 16;
                  scalarExpounded = true;
                  break;
                default:
                  throw new Error('JPX Error: Invalid SQcd value ' + sqcd);
              }
              qcd.noQuantization = (spqcdSize === 8);
              qcd.scalarExpounded = scalarExpounded;
              qcd.guardBits = sqcd >> 5;
              spqcds = [];
              while (j < length + position) {
                var spqcd = {};
                if (spqcdSize === 8) {
                  spqcd.epsilon = data[j++] >> 3;
                  spqcd.mu = 0;
                } else {
                  spqcd.epsilon = data[j] >> 3;
                  spqcd.mu = ((data[j] & 0x7) << 8) | data[j + 1];
                  j += 2;
                }
                spqcds.push(spqcd);
              }
              qcd.SPqcds = spqcds;
              if (context.mainHeader) {
                context.QCD = qcd;
              } else {
                context.currentTile.QCD = qcd;
                context.currentTile.QCC = [];
              }
              break;
            case 0xFF5D: // Quantization component (QCC)
              length = readUint16(data, position);
              var qcc = {};
              j = position + 2;
              var cqcc;
              if (context.SIZ.Csiz < 257) {
                cqcc = data[j++];
              } else {
                cqcc = readUint16(data, j);
                j += 2;
              }
              sqcd = data[j++];
              switch (sqcd & 0x1F) {
                case 0:
                  spqcdSize = 8;
                  scalarExpounded = true;
                  break;
                case 1:
                  spqcdSize = 16;
                  scalarExpounded = false;
                  break;
                case 2:
                  spqcdSize = 16;
                  scalarExpounded = true;
                  break;
                default:
                  throw new Error('JPX Error: Invalid SQcd value ' + sqcd);
              }
              qcc.noQuantization = (spqcdSize === 8);
              qcc.scalarExpounded = scalarExpounded;
              qcc.guardBits = sqcd >> 5;
              spqcds = [];
              while (j < (length + position)) {
                spqcd = {};
                if (spqcdSize === 8) {
                  spqcd.epsilon = data[j++] >> 3;
                  spqcd.mu = 0;
                } else {
                  spqcd.epsilon = data[j] >> 3;
                  spqcd.mu = ((data[j] & 0x7) << 8) | data[j + 1];
                  j += 2;
                }
                spqcds.push(spqcd);
              }
              qcc.SPqcds = spqcds;
              if (context.mainHeader) {
                context.QCC[cqcc] = qcc;
              } else {
                context.currentTile.QCC[cqcc] = qcc;
              }
              break;
            case 0xFF52: // Coding style default (COD)
              length = readUint16(data, position);
              var cod = {};
              j = position + 2;
              var scod = data[j++];
              cod.entropyCoderWithCustomPrecincts = !!(scod & 1);
              cod.sopMarkerUsed = !!(scod & 2);
              cod.ephMarkerUsed = !!(scod & 4);
              cod.progressionOrder = data[j++];
              cod.layersCount = readUint16(data, j);
              j += 2;
              cod.multipleComponentTransform = data[j++];

              cod.decompositionLevelsCount = data[j++];
              cod.xcb = (data[j++] & 0xF) + 2;
              cod.ycb = (data[j++] & 0xF) + 2;
              var blockStyle = data[j++];
              cod.selectiveArithmeticCodingBypass = !!(blockStyle & 1);
              cod.resetContextProbabilities = !!(blockStyle & 2);
              cod.terminationOnEachCodingPass = !!(blockStyle & 4);
              cod.verticalyStripe = !!(blockStyle & 8);
              cod.predictableTermination = !!(blockStyle & 16);
              cod.segmentationSymbolUsed = !!(blockStyle & 32);
              cod.reversibleTransformation = data[j++];
              if (cod.entropyCoderWithCustomPrecincts) {
                var precinctsSizes = [];
                while (j < length + position) {
                  var precinctsSize = data[j++];
                  precinctsSizes.push({
                    PPx: precinctsSize & 0xF,
                    PPy: precinctsSize >> 4
                  });
                }
                cod.precinctsSizes = precinctsSizes;
              }
              var unsupported = [];
              if (cod.selectiveArithmeticCodingBypass) {
                unsupported.push('selectiveArithmeticCodingBypass');
              }
              if (cod.resetContextProbabilities) {
                unsupported.push('resetContextProbabilities');
              }
              if (cod.terminationOnEachCodingPass) {
                unsupported.push('terminationOnEachCodingPass');
              }
              if (cod.verticalyStripe) {
                unsupported.push('verticalyStripe');
              }
              if (cod.predictableTermination) {
                unsupported.push('predictableTermination');
              }
              if (unsupported.length > 0) {
                doNotRecover = true;
                throw new Error('JPX Error: Unsupported COD options (' +
                                unsupported.join(', ') + ')');
              }
              if (context.mainHeader) {
                context.COD = cod;
              } else {
                context.currentTile.COD = cod;
                context.currentTile.COC = [];
              }
              break;
            case 0xFF90: // Start of tile-part (SOT)
              length = readUint16(data, position);
              tile = {};
              tile.index = readUint16(data, position + 2);
              tile.length = readUint32(data, position + 4);
              tile.dataEnd = tile.length + position - 2;
              tile.partIndex = data[position + 8];
              tile.partsCount = data[position + 9];

              context.mainHeader = false;
              if (tile.partIndex === 0) {
                // reset component specific settings
                tile.COD = context.COD;
                tile.COC = context.COC.slice(0); // clone of the global COC
                tile.QCD = context.QCD;
                tile.QCC = context.QCC.slice(0); // clone of the global COC
              }
              context.currentTile = tile;
              break;
            case 0xFF93: // Start of data (SOD)
              tile = context.currentTile;
              if (tile.partIndex === 0) {
                initializeTile(context, tile.index);
                buildPackets(context);
              }

              // moving to the end of the data
              length = tile.dataEnd - position;
              parseTilePackets(context, data, position, length);
              break;
            case 0xFF55: // Tile-part lengths, main header (TLM)
            case 0xFF57: // Packet length, main header (PLM)
            case 0xFF58: // Packet length, tile-part header (PLT)
            case 0xFF64: // Comment (COM)
              length = readUint16(data, position);
              // skipping content
              break;
            case 0xFF53: // Coding style component (COC)
              throw new Error('JPX Error: Codestream code 0xFF53 (COC) is ' +
                              'not implemented');
            default:
              throw new Error('JPX Error: Unknown codestream code: ' +
                              code.toString(16));
          }
          position += length;
        }
      } catch (e) {
        if (doNotRecover || this.failOnCorruptedImage) {
          throw e;
        } else {
          warn('Trying to recover from ' + e.message);
        }
      }
      this.tiles = transformComponents(context);
      this.width = context.SIZ.Xsiz - context.SIZ.XOsiz;
      this.height = context.SIZ.Ysiz - context.SIZ.YOsiz;
      this.componentsCount = context.SIZ.Csiz;
    }
  };
  function calculateComponentDimensions(component, siz) {
    // Section B.2 Component mapping
    component.x0 = Math.ceil(siz.XOsiz / component.XRsiz);
    component.x1 = Math.ceil(siz.Xsiz / component.XRsiz);
    component.y0 = Math.ceil(siz.YOsiz / component.YRsiz);
    component.y1 = Math.ceil(siz.Ysiz / component.YRsiz);
    component.width = component.x1 - component.x0;
    component.height = component.y1 - component.y0;
  }
  function calculateTileGrids(context, components) {
    var siz = context.SIZ;
    // Section B.3 Division into tile and tile-components
    var tile, tiles = [];
    var numXtiles = Math.ceil((siz.Xsiz - siz.XTOsiz) / siz.XTsiz);
    var numYtiles = Math.ceil((siz.Ysiz - siz.YTOsiz) / siz.YTsiz);
    for (var q = 0; q < numYtiles; q++) {
      for (var p = 0; p < numXtiles; p++) {
        tile = {};
        tile.tx0 = Math.max(siz.XTOsiz + p * siz.XTsiz, siz.XOsiz);
        tile.ty0 = Math.max(siz.YTOsiz + q * siz.YTsiz, siz.YOsiz);
        tile.tx1 = Math.min(siz.XTOsiz + (p + 1) * siz.XTsiz, siz.Xsiz);
        tile.ty1 = Math.min(siz.YTOsiz + (q + 1) * siz.YTsiz, siz.Ysiz);
        tile.width = tile.tx1 - tile.tx0;
        tile.height = tile.ty1 - tile.ty0;
        tile.components = [];
        tiles.push(tile);
      }
    }
    context.tiles = tiles;

    var componentsCount = siz.Csiz;
    for (var i = 0, ii = componentsCount; i < ii; i++) {
      var component = components[i];
      for (var j = 0, jj = tiles.length; j < jj; j++) {
        var tileComponent = {};
        tile = tiles[j];
        tileComponent.tcx0 = Math.ceil(tile.tx0 / component.XRsiz);
        tileComponent.tcy0 = Math.ceil(tile.ty0 / component.YRsiz);
        tileComponent.tcx1 = Math.ceil(tile.tx1 / component.XRsiz);
        tileComponent.tcy1 = Math.ceil(tile.ty1 / component.YRsiz);
        tileComponent.width = tileComponent.tcx1 - tileComponent.tcx0;
        tileComponent.height = tileComponent.tcy1 - tileComponent.tcy0;
        tile.components[i] = tileComponent;
      }
    }
  }
  function getBlocksDimensions(context, component, r) {
    var codOrCoc = component.codingStyleParameters;
    var result = {};
    if (!codOrCoc.entropyCoderWithCustomPrecincts) {
      result.PPx = 15;
      result.PPy = 15;
    } else {
      result.PPx = codOrCoc.precinctsSizes[r].PPx;
      result.PPy = codOrCoc.precinctsSizes[r].PPy;
    }
    // calculate codeblock size as described in section B.7
    result.xcb_ = (r > 0 ? Math.min(codOrCoc.xcb, result.PPx - 1) :
                   Math.min(codOrCoc.xcb, result.PPx));
    result.ycb_ = (r > 0 ? Math.min(codOrCoc.ycb, result.PPy - 1) :
                   Math.min(codOrCoc.ycb, result.PPy));
    return result;
  }
  function buildPrecincts(context, resolution, dimensions) {
    // Section B.6 Division resolution to precincts
    var precinctWidth = 1 << dimensions.PPx;
    var precinctHeight = 1 << dimensions.PPy;
    // Jasper introduces codeblock groups for mapping each subband codeblocks
    // to precincts. Precinct partition divides a resolution according to width
    // and height parameters. The subband that belongs to the resolution level
    // has a different size than the level, unless it is the zero resolution.

    // From Jasper documentation: jpeg2000.pdf, section K: Tier-2 coding:
    // The precinct partitioning for a particular subband is derived from a
    // partitioning of its parent LL band (i.e., the LL band at the next higher
    // resolution level)... The LL band associated with each resolution level is
    // divided into precincts... Each of the resulting precinct regions is then
    // mapped into its child subbands (if any) at the next lower resolution
    // level. This is accomplished by using the coordinate transformation
    // (u, v) = (ceil(x/2), ceil(y/2)) where (x, y) and (u, v) are the
    // coordinates of a point in the LL band and child subband, respectively.
    var isZeroRes = resolution.resLevel === 0;
    var precinctWidthInSubband = 1 << (dimensions.PPx + (isZeroRes ? 0 : -1));
    var precinctHeightInSubband = 1 << (dimensions.PPy + (isZeroRes ? 0 : -1));
    var numprecinctswide = (resolution.trx1 > resolution.trx0 ?
      Math.ceil(resolution.trx1 / precinctWidth) -
      Math.floor(resolution.trx0 / precinctWidth) : 0);
    var numprecinctshigh = (resolution.try1 > resolution.try0 ?
      Math.ceil(resolution.try1 / precinctHeight) -
      Math.floor(resolution.try0 / precinctHeight) : 0);
    var numprecincts = numprecinctswide * numprecinctshigh;

    resolution.precinctParameters = {
      precinctWidth: precinctWidth,
      precinctHeight: precinctHeight,
      numprecinctswide: numprecinctswide,
      numprecinctshigh: numprecinctshigh,
      numprecincts: numprecincts,
      precinctWidthInSubband: precinctWidthInSubband,
      precinctHeightInSubband: precinctHeightInSubband
    };
  }
  function buildCodeblocks(context, subband, dimensions) {
    // Section B.7 Division sub-band into code-blocks
    var xcb_ = dimensions.xcb_;
    var ycb_ = dimensions.ycb_;
    var codeblockWidth = 1 << xcb_;
    var codeblockHeight = 1 << ycb_;
    var cbx0 = subband.tbx0 >> xcb_;
    var cby0 = subband.tby0 >> ycb_;
    var cbx1 = (subband.tbx1 + codeblockWidth - 1) >> xcb_;
    var cby1 = (subband.tby1 + codeblockHeight - 1) >> ycb_;
    var precinctParameters = subband.resolution.precinctParameters;
    var codeblocks = [];
    var precincts = [];
    var i, j, codeblock, precinctNumber;
    for (j = cby0; j < cby1; j++) {
      for (i = cbx0; i < cbx1; i++) {
        codeblock = {
          cbx: i,
          cby: j,
          tbx0: codeblockWidth * i,
          tby0: codeblockHeight * j,
          tbx1: codeblockWidth * (i + 1),
          tby1: codeblockHeight * (j + 1)
        };

        codeblock.tbx0_ = Math.max(subband.tbx0, codeblock.tbx0);
        codeblock.tby0_ = Math.max(subband.tby0, codeblock.tby0);
        codeblock.tbx1_ = Math.min(subband.tbx1, codeblock.tbx1);
        codeblock.tby1_ = Math.min(subband.tby1, codeblock.tby1);

        // Calculate precinct number for this codeblock, codeblock position
        // should be relative to its subband, use actual dimension and position
        // See comment about codeblock group width and height
        var pi = Math.floor((codeblock.tbx0_ - subband.tbx0) /
          precinctParameters.precinctWidthInSubband);
        var pj = Math.floor((codeblock.tby0_ - subband.tby0) /
          precinctParameters.precinctHeightInSubband);
        precinctNumber = pi + (pj * precinctParameters.numprecinctswide);

        codeblock.precinctNumber = precinctNumber;
        codeblock.subbandType = subband.type;
        codeblock.Lblock = 3;

        if (codeblock.tbx1_ <= codeblock.tbx0_ ||
            codeblock.tby1_ <= codeblock.tby0_) {
          continue;
        }
        codeblocks.push(codeblock);
        // building precinct for the sub-band
        var precinct = precincts[precinctNumber];
        if (precinct !== undefined) {
          if (i < precinct.cbxMin) {
            precinct.cbxMin = i;
          } else if (i > precinct.cbxMax) {
            precinct.cbxMax = i;
          }
          if (j < precinct.cbyMin) {
            precinct.cbxMin = j;
          } else if (j > precinct.cbyMax) {
            precinct.cbyMax = j;
          }
        } else {
          precincts[precinctNumber] = precinct = {
            cbxMin: i,
            cbyMin: j,
            cbxMax: i,
            cbyMax: j
          };
        }
        codeblock.precinct = precinct;
      }
    }
    subband.codeblockParameters = {
      codeblockWidth: xcb_,
      codeblockHeight: ycb_,
      numcodeblockwide: cbx1 - cbx0 + 1,
      numcodeblockhigh: cby1 - cby0 + 1
    };
    subband.codeblocks = codeblocks;
    subband.precincts = precincts;
  }
  function createPacket(resolution, precinctNumber, layerNumber) {
    var precinctCodeblocks = [];
    // Section B.10.8 Order of info in packet
    var subbands = resolution.subbands;
    // sub-bands already ordered in 'LL', 'HL', 'LH', and 'HH' sequence
    for (var i = 0, ii = subbands.length; i < ii; i++) {
      var subband = subbands[i];
      var codeblocks = subband.codeblocks;
      for (var j = 0, jj = codeblocks.length; j < jj; j++) {
        var codeblock = codeblocks[j];
        if (codeblock.precinctNumber !== precinctNumber) {
          continue;
        }
        precinctCodeblocks.push(codeblock);
      }
    }
    return {
      layerNumber: layerNumber,
      codeblocks: precinctCodeblocks
    };
  }
  function LayerResolutionComponentPositionIterator(context) {
    var siz = context.SIZ;
    var tileIndex = context.currentTile.index;
    var tile = context.tiles[tileIndex];
    var layersCount = tile.codingStyleDefaultParameters.layersCount;
    var componentsCount = siz.Csiz;
    var maxDecompositionLevelsCount = 0;
    for (var q = 0; q < componentsCount; q++) {
      maxDecompositionLevelsCount = Math.max(maxDecompositionLevelsCount,
        tile.components[q].codingStyleParameters.decompositionLevelsCount);
    }

    var l = 0, r = 0, i = 0, k = 0;

    this.nextPacket = function JpxImage_nextPacket() {
      // Section B.12.1.1 Layer-resolution-component-position
      for (; l < layersCount; l++) {
        for (; r <= maxDecompositionLevelsCount; r++) {
          for (; i < componentsCount; i++) {
            var component = tile.components[i];
            if (r > component.codingStyleParameters.decompositionLevelsCount) {
              continue;
            }

            var resolution = component.resolutions[r];
            var numprecincts = resolution.precinctParameters.numprecincts;
            for (; k < numprecincts;) {
              var packet = createPacket(resolution, k, l);
              k++;
              return packet;
            }
            k = 0;
          }
          i = 0;
        }
        r = 0;
      }
    };
  }
  function ResolutionLayerComponentPositionIterator(context) {
    var siz = context.SIZ;
    var tileIndex = context.currentTile.index;
    var tile = context.tiles[tileIndex];
    var layersCount = tile.codingStyleDefaultParameters.layersCount;
    var componentsCount = siz.Csiz;
    var maxDecompositionLevelsCount = 0;
    for (var q = 0; q < componentsCount; q++) {
      maxDecompositionLevelsCount = Math.max(maxDecompositionLevelsCount,
        tile.components[q].codingStyleParameters.decompositionLevelsCount);
    }

    var r = 0, l = 0, i = 0, k = 0;

    this.nextPacket = function JpxImage_nextPacket() {
      // Section B.12.1.2 Resolution-layer-component-position
      for (; r <= maxDecompositionLevelsCount; r++) {
        for (; l < layersCount; l++) {
          for (; i < componentsCount; i++) {
            var component = tile.components[i];
            if (r > component.codingStyleParameters.decompositionLevelsCount) {
              continue;
            }

            var resolution = component.resolutions[r];
            var numprecincts = resolution.precinctParameters.numprecincts;
            for (; k < numprecincts;) {
              var packet = createPacket(resolution, k, l);
              k++;
              return packet;
            }
            k = 0;
          }
          i = 0;
        }
        l = 0;
      }
    };
  }
  function ResolutionPositionComponentLayerIterator(context) {
    var siz = context.SIZ;
    var tileIndex = context.currentTile.index;
    var tile = context.tiles[tileIndex];
    var layersCount = tile.codingStyleDefaultParameters.layersCount;
    var componentsCount = siz.Csiz;
    var l, r, c, p;
    var maxDecompositionLevelsCount = 0;
    for (c = 0; c < componentsCount; c++) {
      var component = tile.components[c];
      maxDecompositionLevelsCount = Math.max(maxDecompositionLevelsCount,
        component.codingStyleParameters.decompositionLevelsCount);
    }
    var maxNumPrecinctsInLevel = new Int32Array(
      maxDecompositionLevelsCount + 1);
    for (r = 0; r <= maxDecompositionLevelsCount; ++r) {
      var maxNumPrecincts = 0;
      for (c = 0; c < componentsCount; ++c) {
        var resolutions = tile.components[c].resolutions;
        if (r < resolutions.length) {
          maxNumPrecincts = Math.max(maxNumPrecincts,
            resolutions[r].precinctParameters.numprecincts);
        }
      }
      maxNumPrecinctsInLevel[r] = maxNumPrecincts;
    }
    l = 0;
    r = 0;
    c = 0;
    p = 0;

    this.nextPacket = function JpxImage_nextPacket() {
      // Section B.12.1.3 Resolution-position-component-layer
      for (; r <= maxDecompositionLevelsCount; r++) {
        for (; p < maxNumPrecinctsInLevel[r]; p++) {
          for (; c < componentsCount; c++) {
            var component = tile.components[c];
            if (r > component.codingStyleParameters.decompositionLevelsCount) {
              continue;
            }
            var resolution = component.resolutions[r];
            var numprecincts = resolution.precinctParameters.numprecincts;
            if (p >= numprecincts) {
              continue;
            }
            for (; l < layersCount;) {
              var packet = createPacket(resolution, p, l);
              l++;
              return packet;
            }
            l = 0;
          }
          c = 0;
        }
        p = 0;
      }
    };
  }
  function PositionComponentResolutionLayerIterator(context) {
    var siz = context.SIZ;
    var tileIndex = context.currentTile.index;
    var tile = context.tiles[tileIndex];
    var layersCount = tile.codingStyleDefaultParameters.layersCount;
    var componentsCount = siz.Csiz;
    var precinctsSizes = getPrecinctSizesInImageScale(tile);
    var precinctsIterationSizes = precinctsSizes;
    var l = 0, r = 0, c = 0, px = 0, py = 0;

    this.nextPacket = function JpxImage_nextPacket() {
      // Section B.12.1.4 Position-component-resolution-layer
      for (; py < precinctsIterationSizes.maxNumHigh; py++) {
        for (; px < precinctsIterationSizes.maxNumWide; px++) {
          for (; c < componentsCount; c++) {
            var component = tile.components[c];
            var decompositionLevelsCount =
              component.codingStyleParameters.decompositionLevelsCount;
            for (; r <= decompositionLevelsCount; r++) {
              var resolution = component.resolutions[r];
              var sizeInImageScale =
                precinctsSizes.components[c].resolutions[r];
              var k = getPrecinctIndexIfExist(
                px,
                py,
                sizeInImageScale,
                precinctsIterationSizes,
                resolution);
              if (k === null) {
                continue;
              }
              for (; l < layersCount;) {
                var packet = createPacket(resolution, k, l);
                l++;
                return packet;
              }
              l = 0;
            }
            r = 0;
          }
          c = 0;
        }
        px = 0;
      }
    };
  }
  function ComponentPositionResolutionLayerIterator(context) {
    var siz = context.SIZ;
    var tileIndex = context.currentTile.index;
    var tile = context.tiles[tileIndex];
    var layersCount = tile.codingStyleDefaultParameters.layersCount;
    var componentsCount = siz.Csiz;
    var precinctsSizes = getPrecinctSizesInImageScale(tile);
    var l = 0, r = 0, c = 0, px = 0, py = 0;

    this.nextPacket = function JpxImage_nextPacket() {
      // Section B.12.1.5 Component-position-resolution-layer
      for (; c < componentsCount; ++c) {
        var component = tile.components[c];
        var precinctsIterationSizes = precinctsSizes.components[c];
        var decompositionLevelsCount =
          component.codingStyleParameters.decompositionLevelsCount;
        for (; py < precinctsIterationSizes.maxNumHigh; py++) {
          for (; px < precinctsIterationSizes.maxNumWide; px++) {
            for (; r <= decompositionLevelsCount; r++) {
              var resolution = component.resolutions[r];
              var sizeInImageScale = precinctsIterationSizes.resolutions[r];
              var k = getPrecinctIndexIfExist(
                px,
                py,
                sizeInImageScale,
                precinctsIterationSizes,
                resolution);
              if (k === null) {
                continue;
              }
              for (; l < layersCount;) {
                var packet = createPacket(resolution, k, l);
                l++;
                return packet;
              }
              l = 0;
            }
            r = 0;
          }
          px = 0;
        }
        py = 0;
      }
    };
  }
  function getPrecinctIndexIfExist(
    pxIndex, pyIndex, sizeInImageScale, precinctIterationSizes, resolution) {
    var posX = pxIndex * precinctIterationSizes.minWidth;
    var posY = pyIndex * precinctIterationSizes.minHeight;
    if (posX % sizeInImageScale.width !== 0 ||
        posY % sizeInImageScale.height !== 0) {
      return null;
    }
    var startPrecinctRowIndex =
      (posY / sizeInImageScale.width) *
      resolution.precinctParameters.numprecinctswide;
    return (posX / sizeInImageScale.height) + startPrecinctRowIndex;
  }
  function getPrecinctSizesInImageScale(tile) {
    var componentsCount = tile.components.length;
    var minWidth = Number.MAX_VALUE;
    var minHeight = Number.MAX_VALUE;
    var maxNumWide = 0;
    var maxNumHigh = 0;
    var sizePerComponent = new Array(componentsCount);
    for (var c = 0; c < componentsCount; c++) {
      var component = tile.components[c];
      var decompositionLevelsCount =
        component.codingStyleParameters.decompositionLevelsCount;
      var sizePerResolution = new Array(decompositionLevelsCount + 1);
      var minWidthCurrentComponent = Number.MAX_VALUE;
      var minHeightCurrentComponent = Number.MAX_VALUE;
      var maxNumWideCurrentComponent = 0;
      var maxNumHighCurrentComponent = 0;
      var scale = 1;
      for (var r = decompositionLevelsCount; r >= 0; --r) {
        var resolution = component.resolutions[r];
        var widthCurrentResolution =
          scale * resolution.precinctParameters.precinctWidth;
        var heightCurrentResolution =
          scale * resolution.precinctParameters.precinctHeight;
        minWidthCurrentComponent = Math.min(
          minWidthCurrentComponent,
          widthCurrentResolution);
        minHeightCurrentComponent = Math.min(
          minHeightCurrentComponent,
          heightCurrentResolution);
        maxNumWideCurrentComponent = Math.max(maxNumWideCurrentComponent,
          resolution.precinctParameters.numprecinctswide);
        maxNumHighCurrentComponent = Math.max(maxNumHighCurrentComponent,
          resolution.precinctParameters.numprecinctshigh);
        sizePerResolution[r] = {
          width: widthCurrentResolution,
          height: heightCurrentResolution
        };
        scale <<= 1;
      }
      minWidth = Math.min(minWidth, minWidthCurrentComponent);
      minHeight = Math.min(minHeight, minHeightCurrentComponent);
      maxNumWide = Math.max(maxNumWide, maxNumWideCurrentComponent);
      maxNumHigh = Math.max(maxNumHigh, maxNumHighCurrentComponent);
      sizePerComponent[c] = {
        resolutions: sizePerResolution,
        minWidth: minWidthCurrentComponent,
        minHeight: minHeightCurrentComponent,
        maxNumWide: maxNumWideCurrentComponent,
        maxNumHigh: maxNumHighCurrentComponent
      };
    }
    return {
      components: sizePerComponent,
      minWidth: minWidth,
      minHeight: minHeight,
      maxNumWide: maxNumWide,
      maxNumHigh: maxNumHigh
    };
  }
  function buildPackets(context) {
    var siz = context.SIZ;
    var tileIndex = context.currentTile.index;
    var tile = context.tiles[tileIndex];
    var componentsCount = siz.Csiz;
    // Creating resolutions and sub-bands for each component
    for (var c = 0; c < componentsCount; c++) {
      var component = tile.components[c];
      var decompositionLevelsCount =
        component.codingStyleParameters.decompositionLevelsCount;
      // Section B.5 Resolution levels and sub-bands
      var resolutions = [];
      var subbands = [];
      for (var r = 0; r <= decompositionLevelsCount; r++) {
        var blocksDimensions = getBlocksDimensions(context, component, r);
        var resolution = {};
        var scale = 1 << (decompositionLevelsCount - r);
        resolution.trx0 = Math.ceil(component.tcx0 / scale);
        resolution.try0 = Math.ceil(component.tcy0 / scale);
        resolution.trx1 = Math.ceil(component.tcx1 / scale);
        resolution.try1 = Math.ceil(component.tcy1 / scale);
        resolution.resLevel = r;
        buildPrecincts(context, resolution, blocksDimensions);
        resolutions.push(resolution);

        var subband;
        if (r === 0) {
          // one sub-band (LL) with last decomposition
          subband = {};
          subband.type = 'LL';
          subband.tbx0 = Math.ceil(component.tcx0 / scale);
          subband.tby0 = Math.ceil(component.tcy0 / scale);
          subband.tbx1 = Math.ceil(component.tcx1 / scale);
          subband.tby1 = Math.ceil(component.tcy1 / scale);
          subband.resolution = resolution;
          buildCodeblocks(context, subband, blocksDimensions);
          subbands.push(subband);
          resolution.subbands = [subband];
        } else {
          var bscale = 1 << (decompositionLevelsCount - r + 1);
          var resolutionSubbands = [];
          // three sub-bands (HL, LH and HH) with rest of decompositions
          subband = {};
          subband.type = 'HL';
          subband.tbx0 = Math.ceil(component.tcx0 / bscale - 0.5);
          subband.tby0 = Math.ceil(component.tcy0 / bscale);
          subband.tbx1 = Math.ceil(component.tcx1 / bscale - 0.5);
          subband.tby1 = Math.ceil(component.tcy1 / bscale);
          subband.resolution = resolution;
          buildCodeblocks(context, subband, blocksDimensions);
          subbands.push(subband);
          resolutionSubbands.push(subband);

          subband = {};
          subband.type = 'LH';
          subband.tbx0 = Math.ceil(component.tcx0 / bscale);
          subband.tby0 = Math.ceil(component.tcy0 / bscale - 0.5);
          subband.tbx1 = Math.ceil(component.tcx1 / bscale);
          subband.tby1 = Math.ceil(component.tcy1 / bscale - 0.5);
          subband.resolution = resolution;
          buildCodeblocks(context, subband, blocksDimensions);
          subbands.push(subband);
          resolutionSubbands.push(subband);

          subband = {};
          subband.type = 'HH';
          subband.tbx0 = Math.ceil(component.tcx0 / bscale - 0.5);
          subband.tby0 = Math.ceil(component.tcy0 / bscale - 0.5);
          subband.tbx1 = Math.ceil(component.tcx1 / bscale - 0.5);
          subband.tby1 = Math.ceil(component.tcy1 / bscale - 0.5);
          subband.resolution = resolution;
          buildCodeblocks(context, subband, blocksDimensions);
          subbands.push(subband);
          resolutionSubbands.push(subband);

          resolution.subbands = resolutionSubbands;
        }
      }
      component.resolutions = resolutions;
      component.subbands = subbands;
    }
    // Generate the packets sequence
    var progressionOrder = tile.codingStyleDefaultParameters.progressionOrder;
    switch (progressionOrder) {
      case 0:
        tile.packetsIterator =
          new LayerResolutionComponentPositionIterator(context);
        break;
      case 1:
        tile.packetsIterator =
          new ResolutionLayerComponentPositionIterator(context);
        break;
      case 2:
        tile.packetsIterator =
          new ResolutionPositionComponentLayerIterator(context);
        break;
      case 3:
        tile.packetsIterator =
          new PositionComponentResolutionLayerIterator(context);
        break;
      case 4:
        tile.packetsIterator =
          new ComponentPositionResolutionLayerIterator(context);
        break;
      default:
        throw new Error('JPX Error: Unsupported progression order ' +
                        progressionOrder);
    }
  }
  function parseTilePackets(context, data, offset, dataLength) {
    var position = 0;
    var buffer, bufferSize = 0, skipNextBit = false;
    function readBits(count) {
      while (bufferSize < count) {
        var b = data[offset + position];
        position++;
        if (skipNextBit) {
          buffer = (buffer << 7) | b;
          bufferSize += 7;
          skipNextBit = false;
        } else {
          buffer = (buffer << 8) | b;
          bufferSize += 8;
        }
        if (b === 0xFF) {
          skipNextBit = true;
        }
      }
      bufferSize -= count;
      return (buffer >>> bufferSize) & ((1 << count) - 1);
    }
    function skipMarkerIfEqual(value) {
      if (data[offset + position - 1] === 0xFF &&
          data[offset + position] === value) {
        skipBytes(1);
        return true;
      } else if (data[offset + position] === 0xFF &&
                 data[offset + position + 1] === value) {
        skipBytes(2);
        return true;
      }
      return false;
    }
    function skipBytes(count) {
      position += count;
    }
    function alignToByte() {
      bufferSize = 0;
      if (skipNextBit) {
        position++;
        skipNextBit = false;
      }
    }
    function readCodingpasses() {
      if (readBits(1) === 0) {
        return 1;
      }
      if (readBits(1) === 0) {
        return 2;
      }
      var value = readBits(2);
      if (value < 3) {
        return value + 3;
      }
      value = readBits(5);
      if (value < 31) {
        return value + 6;
      }
      value = readBits(7);
      return value + 37;
    }
    var tileIndex = context.currentTile.index;
    var tile = context.tiles[tileIndex];
    var sopMarkerUsed = context.COD.sopMarkerUsed;
    var ephMarkerUsed = context.COD.ephMarkerUsed;
    var packetsIterator = tile.packetsIterator;
    while (position < dataLength) {
      alignToByte();
      if (sopMarkerUsed && skipMarkerIfEqual(0x91)) {
        // Skip also marker segment length and packet sequence ID
        skipBytes(4);
      }
      var packet = packetsIterator.nextPacket();
      if (packet === undefined) {
        //No more packets. Stream is probably truncated.
        return;
      }
      if (!readBits(1)) {
        continue;
      }
      var layerNumber = packet.layerNumber;
      var queue = [], codeblock;
      for (var i = 0, ii = packet.codeblocks.length; i < ii; i++) {
        codeblock = packet.codeblocks[i];
        var precinct = codeblock.precinct;
        var codeblockColumn = codeblock.cbx - precinct.cbxMin;
        var codeblockRow = codeblock.cby - precinct.cbyMin;
        var codeblockIncluded = false;
        var firstTimeInclusion = false;
        var valueReady;
        if (codeblock['included'] !== undefined) {
          codeblockIncluded = !!readBits(1);
        } else {
          // reading inclusion tree
          precinct = codeblock.precinct;
          var inclusionTree, zeroBitPlanesTree;
          if (precinct['inclusionTree'] !== undefined) {
            inclusionTree = precinct.inclusionTree;
          } else {
            // building inclusion and zero bit-planes trees
            var width = precinct.cbxMax - precinct.cbxMin + 1;
            var height = precinct.cbyMax - precinct.cbyMin + 1;
            inclusionTree = new InclusionTree(width, height);
            zeroBitPlanesTree = new TagTree(width, height);
            precinct.inclusionTree = inclusionTree;
            precinct.zeroBitPlanesTree = zeroBitPlanesTree;
          }

          inclusionTree.reset(codeblockColumn, codeblockRow, layerNumber);
          while (true) {
            if (position >= data.length) {
              return;
            }
            if (inclusionTree.isAboveThreshold()){
              break;
            }
            if (inclusionTree.isKnown()) {
                inclusionTree.nextLevel();
                continue;
            }
            if (readBits(1)) {
              inclusionTree.setKnown();
              if (inclusionTree.isLeaf()) {
                codeblock.included = true;
                codeblockIncluded = firstTimeInclusion = true;
                break;
              } else {
                inclusionTree.nextLevel();
              }
            } else {
              inclusionTree.incrementValue();
            }
          }
        }
        if (!codeblockIncluded) {
          continue;
        }
        if (firstTimeInclusion) {
          zeroBitPlanesTree = precinct.zeroBitPlanesTree;
          zeroBitPlanesTree.reset(codeblockColumn, codeblockRow);
          while (true) {
            if (position >= data.length) {
              return;
            }
            if (readBits(1)) {
              valueReady = !zeroBitPlanesTree.nextLevel();
              if (valueReady) {
                break;
              }
            } else {
              zeroBitPlanesTree.incrementValue();
            }
          }
          codeblock.zeroBitPlanes = zeroBitPlanesTree.value;
        }
        var codingpasses = readCodingpasses();
        while (readBits(1)) {
          codeblock.Lblock++;
        }
        var codingpassesLog2 = log2(codingpasses);
        // rounding down log2
        var bits = ((codingpasses < (1 << codingpassesLog2)) ?
          codingpassesLog2 - 1 : codingpassesLog2) + codeblock.Lblock;
        var codedDataLength = readBits(bits);
        queue.push({
          codeblock: codeblock,
          codingpasses: codingpasses,
          dataLength: codedDataLength
        });
      }
      alignToByte();
      if (ephMarkerUsed) {
        skipMarkerIfEqual(0x92);
      }
      while (queue.length > 0) {
        var packetItem = queue.shift();
        codeblock = packetItem.codeblock;
        if (codeblock['data'] === undefined) {
          codeblock.data = [];
        }
        codeblock.data.push({
          data: data,
          start: offset + position,
          end: offset + position + packetItem.dataLength,
          codingpasses: packetItem.codingpasses
        });
        position += packetItem.dataLength;
      }
    }
    return position;
  }
  function copyCoefficients(coefficients, levelWidth, levelHeight, subband,
                            delta, mb, reversible, segmentationSymbolUsed) {
    var x0 = subband.tbx0;
    var y0 = subband.tby0;
    var width = subband.tbx1 - subband.tbx0;
    var codeblocks = subband.codeblocks;
    var right = subband.type.charAt(0) === 'H' ? 1 : 0;
    var bottom = subband.type.charAt(1) === 'H' ? levelWidth : 0;

    for (var i = 0, ii = codeblocks.length; i < ii; ++i) {
      var codeblock = codeblocks[i];
      var blockWidth = codeblock.tbx1_ - codeblock.tbx0_;
      var blockHeight = codeblock.tby1_ - codeblock.tby0_;
      if (blockWidth === 0 || blockHeight === 0) {
        continue;
      }
      if (codeblock['data'] === undefined) {
        continue;
      }

      var bitModel, currentCodingpassType;
      bitModel = new BitModel(blockWidth, blockHeight, codeblock.subbandType,
                              codeblock.zeroBitPlanes, mb);
      currentCodingpassType = 2; // first bit plane starts from cleanup

      // collect data
      var data = codeblock.data, totalLength = 0, codingpasses = 0;
      var j, jj, dataItem;
      for (j = 0, jj = data.length; j < jj; j++) {
        dataItem = data[j];
        totalLength += dataItem.end - dataItem.start;
        codingpasses += dataItem.codingpasses;
      }
      var encodedData = new Int16Array(totalLength);
      var position = 0;
      for (j = 0, jj = data.length; j < jj; j++) {
        dataItem = data[j];
        var chunk = dataItem.data.subarray(dataItem.start, dataItem.end);
        encodedData.set(chunk, position);
        position += chunk.length;
      }
      // decoding the item
      var decoder = new ArithmeticDecoder(encodedData, 0, totalLength);
      bitModel.setDecoder(decoder);

      for (j = 0; j < codingpasses; j++) {
        switch (currentCodingpassType) {
          case 0:
            bitModel.runSignificancePropogationPass();
            break;
          case 1:
            bitModel.runMagnitudeRefinementPass();
            break;
          case 2:
            bitModel.runCleanupPass();
            if (segmentationSymbolUsed) {
              bitModel.checkSegmentationSymbol();
            }
            break;
        }
        currentCodingpassType = (currentCodingpassType + 1) % 3;
      }

      var offset = (codeblock.tbx0_ - x0) + (codeblock.tby0_ - y0) * width;
      var sign = bitModel.coefficentsSign;
      var magnitude = bitModel.coefficentsMagnitude;
      var bitsDecoded = bitModel.bitsDecoded;
      var magnitudeCorrection = reversible ? 0 : 0.5;
      var k, n, nb;
      position = 0;
      // Do the interleaving of Section F.3.3 here, so we do not need
      // to copy later. LL level is not interleaved, just copied.
      var interleave = (subband.type !== 'LL');
      for (j = 0; j < blockHeight; j++) {
        var row = (offset / width) | 0; // row in the non-interleaved subband
        var levelOffset = 2 * row * (levelWidth - width) + right + bottom;
        for (k = 0; k < blockWidth; k++) {
          n = magnitude[position];
          if (n !== 0) {
            n = (n + magnitudeCorrection) * delta;
            if (sign[position] !== 0) {
              n = -n;
            }
            nb = bitsDecoded[position];
            var pos = interleave ? (levelOffset + (offset << 1)) : offset;
            if (reversible && (nb >= mb)) {
              coefficients[pos] = n;
            } else {
              coefficients[pos] = n * (1 << (mb - nb));
            }
          }
          offset++;
          position++;
        }
        offset += width - blockWidth;
      }
    }
  }
  function transformTile(context, tile, c) {
    var component = tile.components[c];
    var codingStyleParameters = component.codingStyleParameters;
    var quantizationParameters = component.quantizationParameters;
    var decompositionLevelsCount =
      codingStyleParameters.decompositionLevelsCount;
    var spqcds = quantizationParameters.SPqcds;
    var scalarExpounded = quantizationParameters.scalarExpounded;
    var guardBits = quantizationParameters.guardBits;
    var segmentationSymbolUsed = codingStyleParameters.segmentationSymbolUsed;
    var precision = context.components[c].precision;

    var reversible = codingStyleParameters.reversibleTransformation;
    var transform = (reversible ? new ReversibleTransform() :
                                  new IrreversibleTransform());

    var subbandCoefficients = [];
    var b = 0;
    for (var i = 0; i <= decompositionLevelsCount; i++) {
      var resolution = component.resolutions[i];

      var width = resolution.trx1 - resolution.trx0;
      var height = resolution.try1 - resolution.try0;
      // Allocate space for the whole sublevel.
      var coefficients = new Float32Array(width * height);

      for (var j = 0, jj = resolution.subbands.length; j < jj; j++) {
        var mu, epsilon;
        if (!scalarExpounded) {
          // formula E-5
          mu = spqcds[0].mu;
          epsilon = spqcds[0].epsilon + (i > 0 ? 1 - i : 0);
        } else {
          mu = spqcds[b].mu;
          epsilon = spqcds[b].epsilon;
          b++;
        }

        var subband = resolution.subbands[j];
        var gainLog2 = SubbandsGainLog2[subband.type];

        // calulate quantization coefficient (Section E.1.1.1)
        var delta = (reversible ? 1 :
          Math.pow(2, precision + gainLog2 - epsilon) * (1 + mu / 2048));
        var mb = (guardBits + epsilon - 1);

        // In the first resolution level, copyCoefficients will fill the
        // whole array with coefficients. In the succeding passes,
        // copyCoefficients will consecutively fill in the values that belong
        // to the interleaved positions of the HL, LH, and HH coefficients.
        // The LL coefficients will then be interleaved in Transform.iterate().
        copyCoefficients(coefficients, width, height, subband, delta, mb,
                         reversible, segmentationSymbolUsed);
      }
      subbandCoefficients.push({
        width: width,
        height: height,
        items: coefficients
      });
    }

    var result = transform.calculate(subbandCoefficients,
                                     component.tcx0, component.tcy0);
    return {
      left: component.tcx0,
      top: component.tcy0,
      width: result.width,
      height: result.height,
      items: result.items
    };
  }
  function transformComponents(context) {
    var siz = context.SIZ;
    var components = context.components;
    var componentsCount = siz.Csiz;
    var resultImages = [];
    for (var i = 0, ii = context.tiles.length; i < ii; i++) {
      var tile = context.tiles[i];
      var transformedTiles = [];
      var c;
      for (c = 0; c < componentsCount; c++) {
        transformedTiles[c] = transformTile(context, tile, c);
      }
      var tile0 = transformedTiles[0];
      var isSigned = components[0].isSigned;
      if (isSigned) {
        var out = new Int16Array(tile0.items.length * componentsCount);
      } else {
        var out = new Uint16Array(tile0.items.length * componentsCount);
      }
      var result = {
        left: tile0.left,
        top: tile0.top,
        width: tile0.width,
        height: tile0.height,
        items: out
      };

      // Section G.2.2 Inverse multi component transform
      var shift, offset, max, min, maxK;
      var pos = 0, j, jj, y0, y1, y2, r, g, b, k, val;
      if (tile.codingStyleDefaultParameters.multipleComponentTransform) {
        var fourComponents = componentsCount === 4;
        var y0items = transformedTiles[0].items;
        var y1items = transformedTiles[1].items;
        var y2items = transformedTiles[2].items;
        var y3items = fourComponents ? transformedTiles[3].items : null;

        // HACK: The multiple component transform formulas below assume that
        // all components have the same precision. With this in mind, we
        // compute shift and offset only once.
        shift = components[0].precision - 8;
        offset = (128 << shift) + 0.5;
        max = 255 * (1 << shift);
        maxK = max * 0.5;
        min = -maxK;

        var component0 = tile.components[0];
        var alpha01 = componentsCount - 3;
        jj = y0items.length;
        if (!component0.codingStyleParameters.reversibleTransformation) {
          // inverse irreversible multiple component transform
          for (j = 0; j < jj; j++, pos += alpha01) {
            y0 = y0items[j] + offset;
            y1 = y1items[j];
            y2 = y2items[j];
            r = y0 + 1.402 * y2;
            g = y0 - 0.34413 * y1 - 0.71414 * y2;
            b = y0 + 1.772 * y1;
            out[pos++] = r <= 0 ? 0 : r >= max ? 255 : r >> shift;
            out[pos++] = g <= 0 ? 0 : g >= max ? 255 : g >> shift;
            out[pos++] = b <= 0 ? 0 : b >= max ? 255 : b >> shift;
          }
        } else {
          // inverse reversible multiple component transform
          for (j = 0; j < jj; j++, pos += alpha01) {
            y0 = y0items[j] + offset;
            y1 = y1items[j];
            y2 = y2items[j];
            g = y0 - ((y2 + y1) >> 2);
            r = g + y2;
            b = g + y1;
            out[pos++] = r <= 0 ? 0 : r >= max ? 255 : r >> shift;
            out[pos++] = g <= 0 ? 0 : g >= max ? 255 : g >> shift;
            out[pos++] = b <= 0 ? 0 : b >= max ? 255 : b >> shift;
          }
        }
        if (fourComponents) {
          for (j = 0, pos = 3; j < jj; j++, pos += 4) {
            k = y3items[j];
            out[pos] = k <= min ? 0 : k >= maxK ? 255 : (k + offset) >> shift;
          }
        }
      } else { // no multi-component transform
        for (c = 0; c < componentsCount; c++) {
          if (components[c].precision === 8){
            var items = transformedTiles[c].items;
            shift = components[c].precision - 8;
            offset = (128 << shift) + 0.5;
            max = (127.5 * (1 << shift));
            min = -max;
            for (pos = c, j = 0, jj = items.length; j < jj; j++) {
              val = items[j];
              out[pos] = val <= min ? 0 :
                         val >= max ? 255 : (val + offset) >> shift;
              pos += componentsCount;
            }
          }else{
            var isSigned = components[c].isSigned;
            var items = transformedTiles[c].items;

            if(isSigned){
              shift = 0;
              offset = 0;
            }else{
              shift = components[c].precision - 8;
              offset = (128 << shift) + 0.5;
            }

            for (pos = c, j = 0, jj = items.length; j < jj; j++) {
              val = items[j];
              out[pos] = (val + offset);
              pos += componentsCount;
            }
          }
        }
      }
      resultImages.push(result);
    }
    return resultImages;
  }
  function initializeTile(context, tileIndex) {
    var siz = context.SIZ;
    var componentsCount = siz.Csiz;
    var tile = context.tiles[tileIndex];
    for (var c = 0; c < componentsCount; c++) {
      var component = tile.components[c];
      var qcdOrQcc = (context.currentTile.QCC[c] !== undefined ?
        context.currentTile.QCC[c] : context.currentTile.QCD);
      component.quantizationParameters = qcdOrQcc;
      var codOrCoc = (context.currentTile.COC[c] !== undefined  ?
        context.currentTile.COC[c] : context.currentTile.COD);
      component.codingStyleParameters = codOrCoc;
    }
    tile.codingStyleDefaultParameters = context.currentTile.COD;
  }

  // Section B.10.2 Tag trees
  var TagTree = (function TagTreeClosure() {
    function TagTree(width, height) {
      var levelsLength = log2(Math.max(width, height)) + 1;
      this.levels = [];
      for (var i = 0; i < levelsLength; i++) {
        var level = {
          width: width,
          height: height,
          items: []
        };
        this.levels.push(level);
        width = Math.ceil(width / 2);
        height = Math.ceil(height / 2);
      }
    }
    TagTree.prototype = {
      reset: function TagTree_reset(i, j) {
        var currentLevel = 0, value = 0, level;
        while (currentLevel < this.levels.length) {
          level = this.levels[currentLevel];
          var index = i + j * level.width;
          if (level.items[index] !== undefined) {
            value = level.items[index];
            break;
          }
          level.index = index;
          i >>= 1;
          j >>= 1;
          currentLevel++;
        }
        currentLevel--;
        level = this.levels[currentLevel];
        level.items[level.index] = value;
        this.currentLevel = currentLevel;
        delete this.value;
      },
      incrementValue: function TagTree_incrementValue() {
        var level = this.levels[this.currentLevel];
        level.items[level.index]++;
      },
      nextLevel: function TagTree_nextLevel() {
        var currentLevel = this.currentLevel;
        var level = this.levels[currentLevel];
        var value = level.items[level.index];
        currentLevel--;
        if (currentLevel < 0) {
          this.value = value;
          return false;
        }

        this.currentLevel = currentLevel;
        level = this.levels[currentLevel];
        level.items[level.index] = value;
        return true;
      }
    };
    return TagTree;
  })();

  var InclusionTree = (function InclusionTreeClosure() {
    function InclusionTree(width, height) {
      var levelsLength = log2(Math.max(width, height)) + 1;
      this.levels = [];
      for (var i = 0; i < levelsLength; i++) {
        var items = new Uint8Array(width * height);
        var status = new Uint8Array(width * height);
        for (var j = 0, jj = items.length; j < jj; j++) {
          items[j] = 0;
          status[j] = 0;
        }

        var level = {
          width: width,
          height: height,
          items: items,
          status: status
        };
        this.levels.push(level);

        width = Math.ceil(width / 2);
        height = Math.ceil(height / 2);
      }
    }
    InclusionTree.prototype = {
      reset: function InclusionTree_reset(i, j, stopValue) {
        this.currentStopValue = stopValue;
        var currentLevel = 0;
        while (currentLevel < this.levels.length) {
          var level = this.levels[currentLevel];
          var index = i + j * level.width;
          level.index = index;

          i >>= 1;
          j >>= 1;
          currentLevel++;
        }

        this.currentLevel = this.levels.length - 1;
        this.minValue =this.levels[this.currentLevel].items[0];
        return;
      },
      incrementValue: function InclusionTree_incrementValue() {
        var level = this.levels[this.currentLevel];
        level.items[level.index] = level.items[level.index] + 1;
        if(level.items[level.index] > this.minValue) {
          this.minValue = level.items[level.index];
        }
      },
      nextLevel: function InclusionTree_nextLevel() {
        var currentLevel = this.currentLevel;
        currentLevel--;
        if (currentLevel < 0) {
          return false;
        } else {
          this.currentLevel = currentLevel;
          var level = this.levels[currentLevel];
          if(level.items[level.index] < this.minValue) {
            level.items[level.index] = this.minValue;
          }else if (level.items[level.index] > this.minValue) {
            this.minValue = level.items[level.index];
          }
          return true;
        }
      },
    isLeaf: function InclusionTree_isLeaf(){
      return (this.currentLevel === 0);
    },
    isAboveThreshold: function InclusionTree_isAboveThreshold(){
      var levelindex = this.currentLevel;
      var level = this.levels[levelindex];
      return (level.items[level.index] > this.currentStopValue);
    },
    isKnown: function InclusionTree_isKnown(){
      var levelindex = this.currentLevel;
      var level = this.levels[levelindex];
      return (level.status[level.index] > 0);
    },
    setKnown: function InclusionTree_setKnown(){
      var levelindex = this.currentLevel;
      var level = this.levels[levelindex];
      level.status[level.index] = 1;
      return;
    }

    };
    return InclusionTree;
  })();

  // Section D. Coefficient bit modeling
  var BitModel = (function BitModelClosure() {
    var UNIFORM_CONTEXT = 17;
    var RUNLENGTH_CONTEXT = 18;
    // Table D-1
    // The index is binary presentation: 0dddvvhh, ddd - sum of Di (0..4),
    // vv - sum of Vi (0..2), and hh - sum of Hi (0..2)
    var LLAndLHContextsLabel = new Uint8Array([
      0, 5, 8, 0, 3, 7, 8, 0, 4, 7, 8, 0, 0, 0, 0, 0, 1, 6, 8, 0, 3, 7, 8, 0, 4,
      7, 8, 0, 0, 0, 0, 0, 2, 6, 8, 0, 3, 7, 8, 0, 4, 7, 8, 0, 0, 0, 0, 0, 2, 6,
      8, 0, 3, 7, 8, 0, 4, 7, 8, 0, 0, 0, 0, 0, 2, 6, 8, 0, 3, 7, 8, 0, 4, 7, 8
    ]);
    var HLContextLabel = new Uint8Array([
      0, 3, 4, 0, 5, 7, 7, 0, 8, 8, 8, 0, 0, 0, 0, 0, 1, 3, 4, 0, 6, 7, 7, 0, 8,
      8, 8, 0, 0, 0, 0, 0, 2, 3, 4, 0, 6, 7, 7, 0, 8, 8, 8, 0, 0, 0, 0, 0, 2, 3,
      4, 0, 6, 7, 7, 0, 8, 8, 8, 0, 0, 0, 0, 0, 2, 3, 4, 0, 6, 7, 7, 0, 8, 8, 8
    ]);
    var HHContextLabel = new Uint8Array([
      0, 1, 2, 0, 1, 2, 2, 0, 2, 2, 2, 0, 0, 0, 0, 0, 3, 4, 5, 0, 4, 5, 5, 0, 5,
      5, 5, 0, 0, 0, 0, 0, 6, 7, 7, 0, 7, 7, 7, 0, 7, 7, 7, 0, 0, 0, 0, 0, 8, 8,
      8, 0, 8, 8, 8, 0, 8, 8, 8, 0, 0, 0, 0, 0, 8, 8, 8, 0, 8, 8, 8, 0, 8, 8, 8
    ]);

    function BitModel(width, height, subband, zeroBitPlanes, mb) {
      this.width = width;
      this.height = height;

      this.contextLabelTable = (subband === 'HH' ? HHContextLabel :
        (subband === 'HL' ? HLContextLabel : LLAndLHContextsLabel));

      var coefficientCount = width * height;

      // coefficients outside the encoding region treated as insignificant
      // add border state cells for significanceState
      this.neighborsSignificance = new Uint8Array(coefficientCount);
      this.coefficentsSign = new Uint8Array(coefficientCount);
      this.coefficentsMagnitude = mb > 14 ? new Uint32Array(coefficientCount) :
                                  mb > 6 ? new Uint16Array(coefficientCount) :
                                  new Uint8Array(coefficientCount);
      this.processingFlags = new Uint8Array(coefficientCount);

      var bitsDecoded = new Uint8Array(coefficientCount);
      if (zeroBitPlanes !== 0) {
        for (var i = 0; i < coefficientCount; i++) {
          bitsDecoded[i] = zeroBitPlanes;
        }
      }
      this.bitsDecoded = bitsDecoded;

      this.reset();
    }

    BitModel.prototype = {
      setDecoder: function BitModel_setDecoder(decoder) {
        this.decoder = decoder;
      },
      reset: function BitModel_reset() {
        // We have 17 contexts that are accessed via context labels,
        // plus the uniform and runlength context.
        this.contexts = new Int8Array(19);

        // Contexts are packed into 1 byte:
        // highest 7 bits carry the index, lowest bit carries mps
        this.contexts[0] = (4 << 1) | 0;
        this.contexts[UNIFORM_CONTEXT] = (46 << 1) | 0;
        this.contexts[RUNLENGTH_CONTEXT] = (3 << 1) | 0;
      },
      setNeighborsSignificance:
        function BitModel_setNeighborsSignificance(row, column, index) {
        var neighborsSignificance = this.neighborsSignificance;
        var width = this.width, height = this.height;
        var left = (column > 0);
        var right = (column + 1 < width);
        var i;

        if (row > 0) {
          i = index - width;
          if (left) {
            neighborsSignificance[i - 1] += 0x10;
          }
          if (right) {
            neighborsSignificance[i + 1] += 0x10;
          }
          neighborsSignificance[i] += 0x04;
        }

        if (row + 1 < height) {
          i = index + width;
          if (left) {
            neighborsSignificance[i - 1] += 0x10;
          }
          if (right) {
            neighborsSignificance[i + 1] += 0x10;
          }
          neighborsSignificance[i] += 0x04;
        }

        if (left) {
          neighborsSignificance[index - 1] += 0x01;
        }
        if (right) {
          neighborsSignificance[index + 1] += 0x01;
        }
        neighborsSignificance[index] |= 0x80;
      },
      runSignificancePropogationPass:
        function BitModel_runSignificancePropogationPass() {
        var decoder = this.decoder;
        var width = this.width, height = this.height;
        var coefficentsMagnitude = this.coefficentsMagnitude;
        var coefficentsSign = this.coefficentsSign;
        var neighborsSignificance = this.neighborsSignificance;
        var processingFlags = this.processingFlags;
        var contexts = this.contexts;
        var labels = this.contextLabelTable;
        var bitsDecoded = this.bitsDecoded;
        var processedInverseMask = ~1;
        var processedMask = 1;
        var firstMagnitudeBitMask = 2;

        for (var i0 = 0; i0 < height; i0 += 4) {
          for (var j = 0; j < width; j++) {
            var index = i0 * width + j;
            for (var i1 = 0; i1 < 4; i1++, index += width) {
              var i = i0 + i1;
              if (i >= height) {
                break;
              }
              // clear processed flag first
              processingFlags[index] &= processedInverseMask;

              if (coefficentsMagnitude[index] ||
                  !neighborsSignificance[index]) {
                continue;
              }

              var contextLabel = labels[neighborsSignificance[index]];
              var decision = decoder.readBit(contexts, contextLabel);
              if (decision) {
                var sign = this.decodeSignBit(i, j, index);
                coefficentsSign[index] = sign;
                coefficentsMagnitude[index] = 1;
                this.setNeighborsSignificance(i, j, index);
                processingFlags[index] |= firstMagnitudeBitMask;
              }
              bitsDecoded[index]++;
              processingFlags[index] |= processedMask;
            }
          }
        }
      },
      decodeSignBit: function BitModel_decodeSignBit(row, column, index) {
        var width = this.width, height = this.height;
        var coefficentsMagnitude = this.coefficentsMagnitude;
        var coefficentsSign = this.coefficentsSign;
        var contribution, sign0, sign1, significance1;
        var contextLabel, decoded;

        // calculate horizontal contribution
        significance1 = (column > 0 && coefficentsMagnitude[index - 1] !== 0);
        if (column + 1 < width && coefficentsMagnitude[index + 1] !== 0) {
          sign1 = coefficentsSign[index + 1];
          if (significance1) {
            sign0 = coefficentsSign[index - 1];
            contribution = 1 - sign1 - sign0;
          } else {
            contribution = 1 - sign1 - sign1;
          }
        } else if (significance1) {
          sign0 = coefficentsSign[index - 1];
          contribution = 1 - sign0 - sign0;
        } else {
          contribution = 0;
        }
        var horizontalContribution = 3 * contribution;

        // calculate vertical contribution and combine with the horizontal
        significance1 = (row > 0 && coefficentsMagnitude[index - width] !== 0);
        if (row + 1 < height && coefficentsMagnitude[index + width] !== 0) {
          sign1 = coefficentsSign[index + width];
          if (significance1) {
            sign0 = coefficentsSign[index - width];
            contribution = 1 - sign1 - sign0 + horizontalContribution;
          } else {
            contribution = 1 - sign1 - sign1 + horizontalContribution;
          }
        } else if (significance1) {
          sign0 = coefficentsSign[index - width];
          contribution = 1 - sign0 - sign0 + horizontalContribution;
        } else {
          contribution = horizontalContribution;
        }

        if (contribution >= 0) {
          contextLabel = 9 + contribution;
          decoded = this.decoder.readBit(this.contexts, contextLabel);
        } else {
          contextLabel = 9 - contribution;
          decoded = this.decoder.readBit(this.contexts, contextLabel) ^ 1;
        }
        return decoded;
      },
      runMagnitudeRefinementPass:
        function BitModel_runMagnitudeRefinementPass() {
        var decoder = this.decoder;
        var width = this.width, height = this.height;
        var coefficentsMagnitude = this.coefficentsMagnitude;
        var neighborsSignificance = this.neighborsSignificance;
        var contexts = this.contexts;
        var bitsDecoded = this.bitsDecoded;
        var processingFlags = this.processingFlags;
        var processedMask = 1;
        var firstMagnitudeBitMask = 2;
        var length = width * height;
        var width4 = width * 4;

        for (var index0 = 0, indexNext; index0 < length; index0 = indexNext) {
          indexNext = Math.min(length, index0 + width4);
          for (var j = 0; j < width; j++) {
            for (var index = index0 + j; index < indexNext; index += width) {

              // significant but not those that have just become
              if (!coefficentsMagnitude[index] ||
                (processingFlags[index] & processedMask) !== 0) {
                continue;
              }

              var contextLabel = 16;
              if ((processingFlags[index] & firstMagnitudeBitMask) !== 0) {
                processingFlags[index] ^= firstMagnitudeBitMask;
                // first refinement
               var significance = neighborsSignificance[index] & 127;
               contextLabel = significance === 0 ? 15 : 14;
              }

              var bit = decoder.readBit(contexts, contextLabel);
              coefficentsMagnitude[index] =
                (coefficentsMagnitude[index] << 1) | bit;
              bitsDecoded[index]++;
              processingFlags[index] |= processedMask;
            }
          }
        }
      },
      runCleanupPass: function BitModel_runCleanupPass() {
        var decoder = this.decoder;
        var width = this.width, height = this.height;
        var neighborsSignificance = this.neighborsSignificance;
        var coefficentsMagnitude = this.coefficentsMagnitude;
        var coefficentsSign = this.coefficentsSign;
        var contexts = this.contexts;
        var labels = this.contextLabelTable;
        var bitsDecoded = this.bitsDecoded;
        var processingFlags = this.processingFlags;
        var processedMask = 1;
        var firstMagnitudeBitMask = 2;
        var oneRowDown = width;
        var twoRowsDown = width * 2;
        var threeRowsDown = width * 3;
        var iNext;
        for (var i0 = 0; i0 < height; i0 = iNext) {
          iNext = Math.min(i0 + 4, height);
          var indexBase = i0 * width;
          var checkAllEmpty = i0 + 3 < height;
          for (var j = 0; j < width; j++) {
            var index0 = indexBase + j;
            // using the property: labels[neighborsSignificance[index]] === 0
            // when neighborsSignificance[index] === 0
            var allEmpty = (checkAllEmpty &&
              processingFlags[index0] === 0 &&
              processingFlags[index0 + oneRowDown] === 0 &&
              processingFlags[index0 + twoRowsDown] === 0 &&
              processingFlags[index0 + threeRowsDown] === 0 &&
              neighborsSignificance[index0] === 0 &&
              neighborsSignificance[index0 + oneRowDown] === 0 &&
              neighborsSignificance[index0 + twoRowsDown] === 0 &&
              neighborsSignificance[index0 + threeRowsDown] === 0);
            var i1 = 0, index = index0;
            var i = i0, sign;
            if (allEmpty) {
              var hasSignificantCoefficent =
                decoder.readBit(contexts, RUNLENGTH_CONTEXT);
              if (!hasSignificantCoefficent) {
                bitsDecoded[index0]++;
                bitsDecoded[index0 + oneRowDown]++;
                bitsDecoded[index0 + twoRowsDown]++;
                bitsDecoded[index0 + threeRowsDown]++;
                continue; // next column
              }
              i1 = (decoder.readBit(contexts, UNIFORM_CONTEXT) << 1) |
                    decoder.readBit(contexts, UNIFORM_CONTEXT);
              if (i1 !== 0) {
                i = i0 + i1;
                index += i1 * width;
              }

              sign = this.decodeSignBit(i, j, index);
              coefficentsSign[index] = sign;
              coefficentsMagnitude[index] = 1;
              this.setNeighborsSignificance(i, j, index);
              processingFlags[index] |= firstMagnitudeBitMask;

              index = index0;
              for (var i2 = i0; i2 <= i; i2++, index += width) {
                bitsDecoded[index]++;
              }

              i1++;
            }
            for (i = i0 + i1; i < iNext; i++, index += width) {
              if (coefficentsMagnitude[index] ||
                (processingFlags[index] & processedMask) !== 0) {
                continue;
              }

              var contextLabel = labels[neighborsSignificance[index]];
              var decision = decoder.readBit(contexts, contextLabel);
              if (decision === 1) {
                sign = this.decodeSignBit(i, j, index);
                coefficentsSign[index] = sign;
                coefficentsMagnitude[index] = 1;
                this.setNeighborsSignificance(i, j, index);
                processingFlags[index] |= firstMagnitudeBitMask;
              }
              bitsDecoded[index]++;
            }
          }
        }
      },
      checkSegmentationSymbol: function BitModel_checkSegmentationSymbol() {
        var decoder = this.decoder;
        var contexts = this.contexts;
        var symbol = (decoder.readBit(contexts, UNIFORM_CONTEXT) << 3) |
                     (decoder.readBit(contexts, UNIFORM_CONTEXT) << 2) |
                     (decoder.readBit(contexts, UNIFORM_CONTEXT) << 1) |
                      decoder.readBit(contexts, UNIFORM_CONTEXT);
        if (symbol !== 0xA) {
          throw new Error('JPX Error: Invalid segmentation symbol');
        }
      }
    };

    return BitModel;
  })();

  // Section F, Discrete wavelet transformation
  var Transform = (function TransformClosure() {
    function Transform() {}

    Transform.prototype.calculate =
      function transformCalculate(subbands, u0, v0) {
      var ll = subbands[0];
      for (var i = 1, ii = subbands.length; i < ii; i++) {
        ll = this.iterate(ll, subbands[i], u0, v0);
      }
      return ll;
    };
    Transform.prototype.extend = function extend(buffer, offset, size) {
      // Section F.3.7 extending... using max extension of 4
      var i1 = offset - 1, j1 = offset + 1;
      var i2 = offset + size - 2, j2 = offset + size;
      buffer[i1--] = buffer[j1++];
      buffer[j2++] = buffer[i2--];
      buffer[i1--] = buffer[j1++];
      buffer[j2++] = buffer[i2--];
      buffer[i1--] = buffer[j1++];
      buffer[j2++] = buffer[i2--];
      buffer[i1] = buffer[j1];
      buffer[j2] = buffer[i2];
    };
    Transform.prototype.iterate = function Transform_iterate(ll, hl_lh_hh,
                                                             u0, v0) {
      var llWidth = ll.width, llHeight = ll.height, llItems = ll.items;
      var width = hl_lh_hh.width;
      var height = hl_lh_hh.height;
      var items = hl_lh_hh.items;
      var i, j, k, l, u, v;

      // Interleave LL according to Section F.3.3
      for (k = 0, i = 0; i < llHeight; i++) {
        l = i * 2 * width;
        for (j = 0; j < llWidth; j++, k++, l += 2) {
          items[l] = llItems[k];
        }
      }
      // The LL band is not needed anymore.
      llItems = ll.items = null;

      var bufferPadding = 4;
      var rowBuffer = new Float32Array(width + 2 * bufferPadding);

      // Section F.3.4 HOR_SR
      if (width === 1) {
        // if width = 1, when u0 even keep items as is, when odd divide by 2
        if ((u0 & 1) !== 0) {
          for (v = 0, k = 0; v < height; v++, k += width) {
            items[k] *= 0.5;
          }
        }
      } else {
        for (v = 0, k = 0; v < height; v++, k += width) {
          rowBuffer.set(items.subarray(k, k + width), bufferPadding);

          this.extend(rowBuffer, bufferPadding, width);
          this.filter(rowBuffer, bufferPadding, width);

          items.set(
            rowBuffer.subarray(bufferPadding, bufferPadding + width),
            k);
        }
      }

      // Accesses to the items array can take long, because it may not fit into
      // CPU cache and has to be fetched from main memory. Since subsequent
      // accesses to the items array are not local when reading columns, we
      // have a cache miss every time. To reduce cache misses, get up to
      // 'numBuffers' items at a time and store them into the individual
      // buffers. The colBuffers should be small enough to fit into CPU cache.
      var numBuffers = 16;
      var colBuffers = [];
      for (i = 0; i < numBuffers; i++) {
        colBuffers.push(new Float32Array(height + 2 * bufferPadding));
      }
      var b, currentBuffer = 0;
      ll = bufferPadding + height;

      // Section F.3.5 VER_SR
      if (height === 1) {
          // if height = 1, when v0 even keep items as is, when odd divide by 2
        if ((v0 & 1) !== 0) {
          for (u = 0; u < width; u++) {
            items[u] *= 0.5;
          }
        }
      } else {
        for (u = 0; u < width; u++) {
          // if we ran out of buffers, copy several image columns at once
          if (currentBuffer === 0) {
            numBuffers = Math.min(width - u, numBuffers);
            for (k = u, l = bufferPadding; l < ll; k += width, l++) {
              for (b = 0; b < numBuffers; b++) {
                colBuffers[b][l] = items[k + b];
              }
            }
            currentBuffer = numBuffers;
          }

          currentBuffer--;
          var buffer = colBuffers[currentBuffer];
          this.extend(buffer, bufferPadding, height);
          this.filter(buffer, bufferPadding, height);

          // If this is last buffer in this group of buffers, flush all buffers.
          if (currentBuffer === 0) {
            k = u - numBuffers + 1;
            for (l = bufferPadding; l < ll; k += width, l++) {
              for (b = 0; b < numBuffers; b++) {
                items[k + b] = colBuffers[b][l];
              }
            }
          }
        }
      }

      return {
        width: width,
        height: height,
        items: items
      };
    };
    return Transform;
  })();

  // Section 3.8.2 Irreversible 9-7 filter
  var IrreversibleTransform = (function IrreversibleTransformClosure() {
    function IrreversibleTransform() {
      Transform.call(this);
    }

    IrreversibleTransform.prototype = Object.create(Transform.prototype);
    IrreversibleTransform.prototype.filter =
      function irreversibleTransformFilter(x, offset, length) {
      var len = length >> 1;
      offset = offset | 0;
      var j, n, current, next;

      var alpha = -1.586134342059924;
      var beta = -0.052980118572961;
      var gamma = 0.882911075530934;
      var delta = 0.443506852043971;
      var K = 1.230174104914001;
      var K_ = 1 / K;

      // step 1 is combined with step 3

      // step 2
      j = offset - 3;
      for (n = len + 4; n--; j += 2) {
        x[j] *= K_;
      }

      // step 1 & 3
      j = offset - 2;
      current = delta * x[j -1];
      for (n = len + 3; n--; j += 2) {
        next = delta * x[j + 1];
        x[j] = K * x[j] - current - next;
        if (n--) {
          j += 2;
          current = delta * x[j + 1];
          x[j] = K * x[j] - current - next;
        } else {
          break;
        }
      }

      // step 4
      j = offset - 1;
      current = gamma * x[j - 1];
      for (n = len + 2; n--; j += 2) {
        next = gamma * x[j + 1];
        x[j] -= current + next;
        if (n--) {
          j += 2;
          current = gamma * x[j + 1];
          x[j] -= current + next;
        } else {
          break;
        }
      }

      // step 5
      j = offset;
      current = beta * x[j - 1];
      for (n = len + 1; n--; j += 2) {
        next = beta * x[j + 1];
        x[j] -= current + next;
        if (n--) {
          j += 2;
          current = beta * x[j + 1];
          x[j] -= current + next;
        } else {
          break;
        }
      }

      // step 6
      if (len !== 0) {
        j = offset + 1;
        current = alpha * x[j - 1];
        for (n = len; n--; j += 2) {
          next = alpha * x[j + 1];
          x[j] -= current + next;
          if (n--) {
            j += 2;
            current = alpha * x[j + 1];
            x[j] -= current + next;
          } else {
            break;
          }
        }
      }
    };

    return IrreversibleTransform;
  })();

  // Section 3.8.1 Reversible 5-3 filter
  var ReversibleTransform = (function ReversibleTransformClosure() {
    function ReversibleTransform() {
      Transform.call(this);
    }

    ReversibleTransform.prototype = Object.create(Transform.prototype);
    ReversibleTransform.prototype.filter =
      function reversibleTransformFilter(x, offset, length) {
      var len = length >> 1;
      offset = offset | 0;
      var j, n;

      for (j = offset, n = len + 1; n--; j += 2) {
        x[j] -= (x[j - 1] + x[j + 1] + 2) >> 2;
      }

      for (j = offset + 1, n = len; n--; j += 2) {
        x[j] += (x[j - 1] + x[j + 1]) >> 1;
      }
    };

    return ReversibleTransform;
  })();

  return JpxImage;
})();


/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/* Copyright 2012 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

/* This class implements the QM Coder decoding as defined in
 *   JPEG 2000 Part I Final Committee Draft Version 1.0
 *   Annex C.3 Arithmetic decoding procedure 
 * available at http://www.jpeg.org/public/fcd15444-1.pdf
 * 
 * The arithmetic decoder is used in conjunction with context models to decode
 * JPEG2000 and JBIG2 streams.
 */
var ArithmeticDecoder = (function ArithmeticDecoderClosure() {
  // Table C-2
  var QeTable = [
    {qe: 0x5601, nmps: 1, nlps: 1, switchFlag: 1},
    {qe: 0x3401, nmps: 2, nlps: 6, switchFlag: 0},
    {qe: 0x1801, nmps: 3, nlps: 9, switchFlag: 0},
    {qe: 0x0AC1, nmps: 4, nlps: 12, switchFlag: 0},
    {qe: 0x0521, nmps: 5, nlps: 29, switchFlag: 0},
    {qe: 0x0221, nmps: 38, nlps: 33, switchFlag: 0},
    {qe: 0x5601, nmps: 7, nlps: 6, switchFlag: 1},
    {qe: 0x5401, nmps: 8, nlps: 14, switchFlag: 0},
    {qe: 0x4801, nmps: 9, nlps: 14, switchFlag: 0},
    {qe: 0x3801, nmps: 10, nlps: 14, switchFlag: 0},
    {qe: 0x3001, nmps: 11, nlps: 17, switchFlag: 0},
    {qe: 0x2401, nmps: 12, nlps: 18, switchFlag: 0},
    {qe: 0x1C01, nmps: 13, nlps: 20, switchFlag: 0},
    {qe: 0x1601, nmps: 29, nlps: 21, switchFlag: 0},
    {qe: 0x5601, nmps: 15, nlps: 14, switchFlag: 1},
    {qe: 0x5401, nmps: 16, nlps: 14, switchFlag: 0},
    {qe: 0x5101, nmps: 17, nlps: 15, switchFlag: 0},
    {qe: 0x4801, nmps: 18, nlps: 16, switchFlag: 0},
    {qe: 0x3801, nmps: 19, nlps: 17, switchFlag: 0},
    {qe: 0x3401, nmps: 20, nlps: 18, switchFlag: 0},
    {qe: 0x3001, nmps: 21, nlps: 19, switchFlag: 0},
    {qe: 0x2801, nmps: 22, nlps: 19, switchFlag: 0},
    {qe: 0x2401, nmps: 23, nlps: 20, switchFlag: 0},
    {qe: 0x2201, nmps: 24, nlps: 21, switchFlag: 0},
    {qe: 0x1C01, nmps: 25, nlps: 22, switchFlag: 0},
    {qe: 0x1801, nmps: 26, nlps: 23, switchFlag: 0},
    {qe: 0x1601, nmps: 27, nlps: 24, switchFlag: 0},
    {qe: 0x1401, nmps: 28, nlps: 25, switchFlag: 0},
    {qe: 0x1201, nmps: 29, nlps: 26, switchFlag: 0},
    {qe: 0x1101, nmps: 30, nlps: 27, switchFlag: 0},
    {qe: 0x0AC1, nmps: 31, nlps: 28, switchFlag: 0},
    {qe: 0x09C1, nmps: 32, nlps: 29, switchFlag: 0},
    {qe: 0x08A1, nmps: 33, nlps: 30, switchFlag: 0},
    {qe: 0x0521, nmps: 34, nlps: 31, switchFlag: 0},
    {qe: 0x0441, nmps: 35, nlps: 32, switchFlag: 0},
    {qe: 0x02A1, nmps: 36, nlps: 33, switchFlag: 0},
    {qe: 0x0221, nmps: 37, nlps: 34, switchFlag: 0},
    {qe: 0x0141, nmps: 38, nlps: 35, switchFlag: 0},
    {qe: 0x0111, nmps: 39, nlps: 36, switchFlag: 0},
    {qe: 0x0085, nmps: 40, nlps: 37, switchFlag: 0},
    {qe: 0x0049, nmps: 41, nlps: 38, switchFlag: 0},
    {qe: 0x0025, nmps: 42, nlps: 39, switchFlag: 0},
    {qe: 0x0015, nmps: 43, nlps: 40, switchFlag: 0},
    {qe: 0x0009, nmps: 44, nlps: 41, switchFlag: 0},
    {qe: 0x0005, nmps: 45, nlps: 42, switchFlag: 0},
    {qe: 0x0001, nmps: 45, nlps: 43, switchFlag: 0},
    {qe: 0x5601, nmps: 46, nlps: 46, switchFlag: 0}
  ];

  // C.3.5 Initialisation of the decoder (INITDEC)
  function ArithmeticDecoder(data, start, end) {
    this.data = data;
    this.bp = start;
    this.dataEnd = end;

    this.chigh = data[start];
    this.clow = 0;

    this.byteIn();

    this.chigh = ((this.chigh << 7) & 0xFFFF) | ((this.clow >> 9) & 0x7F);
    this.clow = (this.clow << 7) & 0xFFFF;
    this.ct -= 7;
    this.a = 0x8000;
  }

  ArithmeticDecoder.prototype = {
    // C.3.4 Compressed data input (BYTEIN)
    byteIn: function ArithmeticDecoder_byteIn() {
      var data = this.data;
      var bp = this.bp;
      if (data[bp] === 0xFF) {
        var b1 = data[bp + 1];
        if (b1 > 0x8F) {
          this.clow += 0xFF00;
          this.ct = 8;
        } else {
          bp++;
          this.clow += (data[bp] << 9);
          this.ct = 7;
          this.bp = bp;
        }
      } else {
        bp++;
        this.clow += bp < this.dataEnd ? (data[bp] << 8) : 0xFF00;
        this.ct = 8;
        this.bp = bp;
      }
      if (this.clow > 0xFFFF) {
        this.chigh += (this.clow >> 16);
        this.clow &= 0xFFFF;
      }
    },
    // C.3.2 Decoding a decision (DECODE)
    readBit: function ArithmeticDecoder_readBit(contexts, pos) {
      // contexts are packed into 1 byte:
      // highest 7 bits carry cx.index, lowest bit carries cx.mps
      var cx_index = contexts[pos] >> 1, cx_mps = contexts[pos] & 1;
      var qeTableIcx = QeTable[cx_index];
      var qeIcx = qeTableIcx.qe;
      var d;
      var a = this.a - qeIcx;

      if (this.chigh < qeIcx) {
        // exchangeLps
        if (a < qeIcx) {
          a = qeIcx;
          d = cx_mps;
          cx_index = qeTableIcx.nmps;
        } else {
          a = qeIcx;
          d = 1 ^ cx_mps;
          if (qeTableIcx.switchFlag === 1) {
            cx_mps = d;
          }
          cx_index = qeTableIcx.nlps;
        }
      } else {
        this.chigh -= qeIcx;
        if ((a & 0x8000) !== 0) {
          this.a = a;
          return cx_mps;
        }
        // exchangeMps
        if (a < qeIcx) {
          d = 1 ^ cx_mps;
          if (qeTableIcx.switchFlag === 1) {
            cx_mps = d;
          }
          cx_index = qeTableIcx.nlps;
        } else {
          d = cx_mps;
          cx_index = qeTableIcx.nmps;
        }
      }
      // C.3.3 renormD;
      do {
        if (this.ct === 0) {
          this.byteIn();
        }

        a <<= 1;
        this.chigh = ((this.chigh << 1) & 0xFFFF) | ((this.clow >> 15) & 1);
        this.clow = (this.clow << 1) & 0xFFFF;
        this.ct--;
      } while ((a & 0x8000) === 0);
      this.a = a;

      contexts[pos] = cx_index << 1 | cx_mps;
      return d;
    }
  };

  return ArithmeticDecoder;
})();

/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/* Copyright 2012 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/* globals Cmd, ColorSpace, Dict, MozBlobBuilder, Name, PDFJS, Ref, URL,
           Promise */

'use strict';

var globalScope = (typeof window === 'undefined') ? this : window;

var isWorker = (typeof window === 'undefined');

var FONT_IDENTITY_MATRIX = [0.001, 0, 0, 0.001, 0, 0];

var TextRenderingMode = {
  FILL: 0,
  STROKE: 1,
  FILL_STROKE: 2,
  INVISIBLE: 3,
  FILL_ADD_TO_PATH: 4,
  STROKE_ADD_TO_PATH: 5,
  FILL_STROKE_ADD_TO_PATH: 6,
  ADD_TO_PATH: 7,
  FILL_STROKE_MASK: 3,
  ADD_TO_PATH_FLAG: 4
};

var ImageKind = {
  GRAYSCALE_1BPP: 1,
  RGB_24BPP: 2,
  RGBA_32BPP: 3
};

var AnnotationType = {
  WIDGET: 1,
  TEXT: 2,
  LINK: 3
};

var StreamType = {
  UNKNOWN: 0,
  FLATE: 1,
  LZW: 2,
  DCT: 3,
  JPX: 4,
  JBIG: 5,
  A85: 6,
  AHX: 7,
  CCF: 8,
  RL: 9
};

var FontType = {
  UNKNOWN: 0,
  TYPE1: 1,
  TYPE1C: 2,
  CIDFONTTYPE0: 3,
  CIDFONTTYPE0C: 4,
  TRUETYPE: 5,
  CIDFONTTYPE2: 6,
  TYPE3: 7,
  OPENTYPE: 8,
  TYPE0: 9,
  MMTYPE1: 10
};

// The global PDFJS object exposes the API
// In production, it will be declared outside a global wrapper
// In development, it will be declared here
if (!globalScope.PDFJS) {
  globalScope.PDFJS = {};
}

//globalScope.PDFJS.pdfBug = false;

var PDFJS = PDFJS || {};

PDFJS.VERBOSITY_LEVELS = {
  errors: 0,
  warnings: 1,
  infos: 5
};

// All the possible operations for an operator list.
var OPS = PDFJS.OPS = {
  // Intentionally start from 1 so it is easy to spot bad operators that will be
  // 0's.
  dependency: 1,
  setLineWidth: 2,
  setLineCap: 3,
  setLineJoin: 4,
  setMiterLimit: 5,
  setDash: 6,
  setRenderingIntent: 7,
  setFlatness: 8,
  setGState: 9,
  save: 10,
  restore: 11,
  transform: 12,
  moveTo: 13,
  lineTo: 14,
  curveTo: 15,
  curveTo2: 16,
  curveTo3: 17,
  closePath: 18,
  rectangle: 19,
  stroke: 20,
  closeStroke: 21,
  fill: 22,
  eoFill: 23,
  fillStroke: 24,
  eoFillStroke: 25,
  closeFillStroke: 26,
  closeEOFillStroke: 27,
  endPath: 28,
  clip: 29,
  eoClip: 30,
  beginText: 31,
  endText: 32,
  setCharSpacing: 33,
  setWordSpacing: 34,
  setHScale: 35,
  setLeading: 36,
  setFont: 37,
  setTextRenderingMode: 38,
  setTextRise: 39,
  moveText: 40,
  setLeadingMoveText: 41,
  setTextMatrix: 42,
  nextLine: 43,
  showText: 44,
  showSpacedText: 45,
  nextLineShowText: 46,
  nextLineSetSpacingShowText: 47,
  setCharWidth: 48,
  setCharWidthAndBounds: 49,
  setStrokeColorSpace: 50,
  setFillColorSpace: 51,
  setStrokeColor: 52,
  setStrokeColorN: 53,
  setFillColor: 54,
  setFillColorN: 55,
  setStrokeGray: 56,
  setFillGray: 57,
  setStrokeRGBColor: 58,
  setFillRGBColor: 59,
  setStrokeCMYKColor: 60,
  setFillCMYKColor: 61,
  shadingFill: 62,
  beginInlineImage: 63,
  beginImageData: 64,
  endInlineImage: 65,
  paintXObject: 66,
  markPoint: 67,
  markPointProps: 68,
  beginMarkedContent: 69,
  beginMarkedContentProps: 70,
  endMarkedContent: 71,
  beginCompat: 72,
  endCompat: 73,
  paintFormXObjectBegin: 74,
  paintFormXObjectEnd: 75,
  beginGroup: 76,
  endGroup: 77,
  beginAnnotations: 78,
  endAnnotations: 79,
  beginAnnotation: 80,
  endAnnotation: 81,
  paintJpegXObject: 82,
  paintImageMaskXObject: 83,
  paintImageMaskXObjectGroup: 84,
  paintImageXObject: 85,
  paintInlineImageXObject: 86,
  paintInlineImageXObjectGroup: 87,
  paintImageXObjectRepeat: 88,
  paintImageMaskXObjectRepeat: 89,
  paintSolidColorImageMask: 90,
  constructPath: 91
};

// A notice for devs. These are good for things that are helpful to devs, such
// as warning that Workers were disabled, which is important to devs but not
// end users.
function info(msg) {
  if (PDFJS.verbosity >= PDFJS.VERBOSITY_LEVELS.infos) {
    console.log('Info: ' + msg);
  }
}

// Non-fatal warnings.
function warn(msg) {
  if (PDFJS.verbosity >= PDFJS.VERBOSITY_LEVELS.warnings) {
    console.log('Warning: ' + msg);
  }
}

// Fatal errors that should trigger the fallback UI and halt execution by
// throwing an exception.
function error(msg) {
  // If multiple arguments were passed, pass them all to the log function.
  if (arguments.length > 1) {
    var logArguments = ['Error:'];
    logArguments.push.apply(logArguments, arguments);
    console.log.apply(console, logArguments);
    // Join the arguments into a single string for the lines below.
    msg = [].join.call(arguments, ' ');
  } else {
    console.log('Error: ' + msg);
  }
  console.log(backtrace());
  UnsupportedManager.notify(UNSUPPORTED_FEATURES.unknown);
  throw new Error(msg);
}

function backtrace() {
  try {
    throw new Error();
  } catch (e) {
    return e.stack ? e.stack.split('\n').slice(2).join('\n') : '';
  }
}

function assert(cond, msg) {
  if (!cond) {
    error(msg);
  }
}

var UNSUPPORTED_FEATURES = PDFJS.UNSUPPORTED_FEATURES = {
  unknown: 'unknown',
  forms: 'forms',
  javaScript: 'javaScript',
  smask: 'smask',
  shadingPattern: 'shadingPattern',
  font: 'font'
};

var UnsupportedManager = PDFJS.UnsupportedManager =
  (function UnsupportedManagerClosure() {
  var listeners = [];
  return {
    listen: function (cb) {
      listeners.push(cb);
    },
    notify: function (featureId) {
      warn('Unsupported feature "' + featureId + '"');
      for (var i = 0, ii = listeners.length; i < ii; i++) {
        listeners[i](featureId);
      }
    }
  };
})();

// Combines two URLs. The baseUrl shall be absolute URL. If the url is an
// absolute URL, it will be returned as is.
function combineUrl(baseUrl, url) {
  if (!url) {
    return baseUrl;
  }
  if (/^[a-z][a-z0-9+\-.]*:/i.test(url)) {
    return url;
  }
  var i;
  if (url.charAt(0) === '/') {
    // absolute path
    i = baseUrl.indexOf('://');
    if (url.charAt(1) === '/') {
      ++i;
    } else {
      i = baseUrl.indexOf('/', i + 3);
    }
    return baseUrl.substring(0, i) + url;
  } else {
    // relative path
    var pathLength = baseUrl.length;
    i = baseUrl.lastIndexOf('#');
    pathLength = i >= 0 ? i : pathLength;
    i = baseUrl.lastIndexOf('?', pathLength);
    pathLength = i >= 0 ? i : pathLength;
    var prefixLength = baseUrl.lastIndexOf('/', pathLength);
    return baseUrl.substring(0, prefixLength + 1) + url;
  }
}

// Validates if URL is safe and allowed, e.g. to avoid XSS.
function isValidUrl(url, allowRelative) {
  if (!url) {
    return false;
  }
  // RFC 3986 (http://tools.ietf.org/html/rfc3986#section-3.1)
  // scheme = ALPHA *( ALPHA / DIGIT / "+" / "-" / "." )
  var protocol = /^[a-z][a-z0-9+\-.]*(?=:)/i.exec(url);
  if (!protocol) {
    return allowRelative;
  }
  protocol = protocol[0].toLowerCase();
  switch (protocol) {
    case 'http':
    case 'https':
    case 'ftp':
    case 'mailto':
    case 'tel':
      return true;
    default:
      return false;
  }
}
PDFJS.isValidUrl = isValidUrl;

function shadow(obj, prop, value) {
  Object.defineProperty(obj, prop, { value: value,
                                     enumerable: true,
                                     configurable: true,
                                     writable: false });
  return value;
}
PDFJS.shadow = shadow;

var PasswordResponses = PDFJS.PasswordResponses = {
  NEED_PASSWORD: 1,
  INCORRECT_PASSWORD: 2
};

var PasswordException = (function PasswordExceptionClosure() {
  function PasswordException(msg, code) {
    this.name = 'PasswordException';
    this.message = msg;
    this.code = code;
  }

  PasswordException.prototype = new Error();
  PasswordException.constructor = PasswordException;

  return PasswordException;
})();
PDFJS.PasswordException = PasswordException;

var UnknownErrorException = (function UnknownErrorExceptionClosure() {
  function UnknownErrorException(msg, details) {
    this.name = 'UnknownErrorException';
    this.message = msg;
    this.details = details;
  }

  UnknownErrorException.prototype = new Error();
  UnknownErrorException.constructor = UnknownErrorException;

  return UnknownErrorException;
})();
PDFJS.UnknownErrorException = UnknownErrorException;

var InvalidPDFException = (function InvalidPDFExceptionClosure() {
  function InvalidPDFException(msg) {
    this.name = 'InvalidPDFException';
    this.message = msg;
  }

  InvalidPDFException.prototype = new Error();
  InvalidPDFException.constructor = InvalidPDFException;

  return InvalidPDFException;
})();
PDFJS.InvalidPDFException = InvalidPDFException;

var MissingPDFException = (function MissingPDFExceptionClosure() {
  function MissingPDFException(msg) {
    this.name = 'MissingPDFException';
    this.message = msg;
  }

  MissingPDFException.prototype = new Error();
  MissingPDFException.constructor = MissingPDFException;

  return MissingPDFException;
})();
PDFJS.MissingPDFException = MissingPDFException;

var UnexpectedResponseException =
    (function UnexpectedResponseExceptionClosure() {
  function UnexpectedResponseException(msg, status) {
    this.name = 'UnexpectedResponseException';
    this.message = msg;
    this.status = status;
  }

  UnexpectedResponseException.prototype = new Error();
  UnexpectedResponseException.constructor = UnexpectedResponseException;

  return UnexpectedResponseException;
})();
PDFJS.UnexpectedResponseException = UnexpectedResponseException;

var NotImplementedException = (function NotImplementedExceptionClosure() {
  function NotImplementedException(msg) {
    this.message = msg;
  }

  NotImplementedException.prototype = new Error();
  NotImplementedException.prototype.name = 'NotImplementedException';
  NotImplementedException.constructor = NotImplementedException;

  return NotImplementedException;
})();

var MissingDataException = (function MissingDataExceptionClosure() {
  function MissingDataException(begin, end) {
    this.begin = begin;
    this.end = end;
    this.message = 'Missing data [' + begin + ', ' + end + ')';
  }

  MissingDataException.prototype = new Error();
  MissingDataException.prototype.name = 'MissingDataException';
  MissingDataException.constructor = MissingDataException;

  return MissingDataException;
})();

var XRefParseException = (function XRefParseExceptionClosure() {
  function XRefParseException(msg) {
    this.message = msg;
  }

  XRefParseException.prototype = new Error();
  XRefParseException.prototype.name = 'XRefParseException';
  XRefParseException.constructor = XRefParseException;

  return XRefParseException;
})();


function bytesToString(bytes) {
  assert(bytes !== null && typeof bytes === 'object' &&
         bytes.length !== undefined, 'Invalid argument for bytesToString');
  var length = bytes.length;
  var MAX_ARGUMENT_COUNT = 8192;
  if (length < MAX_ARGUMENT_COUNT) {
    return String.fromCharCode.apply(null, bytes);
  }
  var strBuf = [];
  for (var i = 0; i < length; i += MAX_ARGUMENT_COUNT) {
    var chunkEnd = Math.min(i + MAX_ARGUMENT_COUNT, length);
    var chunk = bytes.subarray(i, chunkEnd);
    strBuf.push(String.fromCharCode.apply(null, chunk));
  }
  return strBuf.join('');
}

function stringToBytes(str) {
  assert(typeof str === 'string', 'Invalid argument for stringToBytes');
  var length = str.length;
  var bytes = new Uint8Array(length);
  for (var i = 0; i < length; ++i) {
    bytes[i] = str.charCodeAt(i) & 0xFF;
  }
  return bytes;
}

function string32(value) {
  return String.fromCharCode((value >> 24) & 0xff, (value >> 16) & 0xff,
                             (value >> 8) & 0xff, value & 0xff);
}

function log2(x) {
  var n = 1, i = 0;
  while (x > n) {
    n <<= 1;
    i++;
  }
  return i;
}

function readInt8(data, start) {
  return (data[start] << 24) >> 24;
}

function readUint16(data, offset) {
  return (data[offset] << 8) | data[offset + 1];
}

function readUint32(data, offset) {
  return ((data[offset] << 24) | (data[offset + 1] << 16) |
         (data[offset + 2] << 8) | data[offset + 3]) >>> 0;
}

// Lazy test the endianness of the platform
// NOTE: This will be 'true' for simulated TypedArrays
function isLittleEndian() {
  var buffer8 = new Uint8Array(2);
  buffer8[0] = 1;
  var buffer16 = new Uint16Array(buffer8.buffer);
  return (buffer16[0] === 1);
}

Object.defineProperty(PDFJS, 'isLittleEndian', {
  configurable: true,
  get: function PDFJS_isLittleEndian() {
    return shadow(PDFJS, 'isLittleEndian', isLittleEndian());
  }
});

//#if !(FIREFOX || MOZCENTRAL || B2G || CHROME)
//// Lazy test if the userAgant support CanvasTypedArrays
function hasCanvasTypedArrays() {
  var canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  var ctx = canvas.getContext('2d');
  var imageData = ctx.createImageData(1, 1);
  return (typeof imageData.data.buffer !== 'undefined');
}

Object.defineProperty(PDFJS, 'hasCanvasTypedArrays', {
  configurable: true,
  get: function PDFJS_hasCanvasTypedArrays() {
    return shadow(PDFJS, 'hasCanvasTypedArrays', hasCanvasTypedArrays());
  }
});

var Uint32ArrayView = (function Uint32ArrayViewClosure() {

  function Uint32ArrayView(buffer, length) {
    this.buffer = buffer;
    this.byteLength = buffer.length;
    this.length = length === undefined ? (this.byteLength >> 2) : length;
    ensureUint32ArrayViewProps(this.length);
  }
  Uint32ArrayView.prototype = Object.create(null);

  var uint32ArrayViewSetters = 0;
  function createUint32ArrayProp(index) {
    return {
      get: function () {
        var buffer = this.buffer, offset = index << 2;
        return (buffer[offset] | (buffer[offset + 1] << 8) |
          (buffer[offset + 2] << 16) | (buffer[offset + 3] << 24)) >>> 0;
      },
      set: function (value) {
        var buffer = this.buffer, offset = index << 2;
        buffer[offset] = value & 255;
        buffer[offset + 1] = (value >> 8) & 255;
        buffer[offset + 2] = (value >> 16) & 255;
        buffer[offset + 3] = (value >>> 24) & 255;
      }
    };
  }

  function ensureUint32ArrayViewProps(length) {
    while (uint32ArrayViewSetters < length) {
      Object.defineProperty(Uint32ArrayView.prototype,
        uint32ArrayViewSetters,
        createUint32ArrayProp(uint32ArrayViewSetters));
      uint32ArrayViewSetters++;
    }
  }

  return Uint32ArrayView;
})();
//#else
//PDFJS.hasCanvasTypedArrays = true;
//#endif

var IDENTITY_MATRIX = [1, 0, 0, 1, 0, 0];

var Util = PDFJS.Util = (function UtilClosure() {
  function Util() {}

  var rgbBuf = ['rgb(', 0, ',', 0, ',', 0, ')'];

  // makeCssRgb() can be called thousands of times. Using |rgbBuf| avoids
  // creating many intermediate strings.
  Util.makeCssRgb = function Util_makeCssRgb(r, g, b) {
    rgbBuf[1] = r;
    rgbBuf[3] = g;
    rgbBuf[5] = b;
    return rgbBuf.join('');
  };

  // Concatenates two transformation matrices together and returns the result.
  Util.transform = function Util_transform(m1, m2) {
    return [
      m1[0] * m2[0] + m1[2] * m2[1],
      m1[1] * m2[0] + m1[3] * m2[1],
      m1[0] * m2[2] + m1[2] * m2[3],
      m1[1] * m2[2] + m1[3] * m2[3],
      m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
      m1[1] * m2[4] + m1[3] * m2[5] + m1[5]
    ];
  };

  // For 2d affine transforms
  Util.applyTransform = function Util_applyTransform(p, m) {
    var xt = p[0] * m[0] + p[1] * m[2] + m[4];
    var yt = p[0] * m[1] + p[1] * m[3] + m[5];
    return [xt, yt];
  };

  Util.applyInverseTransform = function Util_applyInverseTransform(p, m) {
    var d = m[0] * m[3] - m[1] * m[2];
    var xt = (p[0] * m[3] - p[1] * m[2] + m[2] * m[5] - m[4] * m[3]) / d;
    var yt = (-p[0] * m[1] + p[1] * m[0] + m[4] * m[1] - m[5] * m[0]) / d;
    return [xt, yt];
  };

  // Applies the transform to the rectangle and finds the minimum axially
  // aligned bounding box.
  Util.getAxialAlignedBoundingBox =
    function Util_getAxialAlignedBoundingBox(r, m) {

    var p1 = Util.applyTransform(r, m);
    var p2 = Util.applyTransform(r.slice(2, 4), m);
    var p3 = Util.applyTransform([r[0], r[3]], m);
    var p4 = Util.applyTransform([r[2], r[1]], m);
    return [
      Math.min(p1[0], p2[0], p3[0], p4[0]),
      Math.min(p1[1], p2[1], p3[1], p4[1]),
      Math.max(p1[0], p2[0], p3[0], p4[0]),
      Math.max(p1[1], p2[1], p3[1], p4[1])
    ];
  };

  Util.inverseTransform = function Util_inverseTransform(m) {
    var d = m[0] * m[3] - m[1] * m[2];
    return [m[3] / d, -m[1] / d, -m[2] / d, m[0] / d,
      (m[2] * m[5] - m[4] * m[3]) / d, (m[4] * m[1] - m[5] * m[0]) / d];
  };

  // Apply a generic 3d matrix M on a 3-vector v:
  //   | a b c |   | X |
  //   | d e f | x | Y |
  //   | g h i |   | Z |
  // M is assumed to be serialized as [a,b,c,d,e,f,g,h,i],
  // with v as [X,Y,Z]
  Util.apply3dTransform = function Util_apply3dTransform(m, v) {
    return [
      m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
      m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
      m[6] * v[0] + m[7] * v[1] + m[8] * v[2]
    ];
  };

  // This calculation uses Singular Value Decomposition.
  // The SVD can be represented with formula A = USV. We are interested in the
  // matrix S here because it represents the scale values.
  Util.singularValueDecompose2dScale =
    function Util_singularValueDecompose2dScale(m) {

    var transpose = [m[0], m[2], m[1], m[3]];

    // Multiply matrix m with its transpose.
    var a = m[0] * transpose[0] + m[1] * transpose[2];
    var b = m[0] * transpose[1] + m[1] * transpose[3];
    var c = m[2] * transpose[0] + m[3] * transpose[2];
    var d = m[2] * transpose[1] + m[3] * transpose[3];

    // Solve the second degree polynomial to get roots.
    var first = (a + d) / 2;
    var second = Math.sqrt((a + d) * (a + d) - 4 * (a * d - c * b)) / 2;
    var sx = first + second || 1;
    var sy = first - second || 1;

    // Scale values are the square roots of the eigenvalues.
    return [Math.sqrt(sx), Math.sqrt(sy)];
  };

  // Normalize rectangle rect=[x1, y1, x2, y2] so that (x1,y1) < (x2,y2)
  // For coordinate systems whose origin lies in the bottom-left, this
  // means normalization to (BL,TR) ordering. For systems with origin in the
  // top-left, this means (TL,BR) ordering.
  Util.normalizeRect = function Util_normalizeRect(rect) {
    var r = rect.slice(0); // clone rect
    if (rect[0] > rect[2]) {
      r[0] = rect[2];
      r[2] = rect[0];
    }
    if (rect[1] > rect[3]) {
      r[1] = rect[3];
      r[3] = rect[1];
    }
    return r;
  };

  // Returns a rectangle [x1, y1, x2, y2] corresponding to the
  // intersection of rect1 and rect2. If no intersection, returns 'false'
  // The rectangle coordinates of rect1, rect2 should be [x1, y1, x2, y2]
  Util.intersect = function Util_intersect(rect1, rect2) {
    function compare(a, b) {
      return a - b;
    }

    // Order points along the axes
    var orderedX = [rect1[0], rect1[2], rect2[0], rect2[2]].sort(compare),
        orderedY = [rect1[1], rect1[3], rect2[1], rect2[3]].sort(compare),
        result = [];

    rect1 = Util.normalizeRect(rect1);
    rect2 = Util.normalizeRect(rect2);

    // X: first and second points belong to different rectangles?
    if ((orderedX[0] === rect1[0] && orderedX[1] === rect2[0]) ||
        (orderedX[0] === rect2[0] && orderedX[1] === rect1[0])) {
      // Intersection must be between second and third points
      result[0] = orderedX[1];
      result[2] = orderedX[2];
    } else {
      return false;
    }

    // Y: first and second points belong to different rectangles?
    if ((orderedY[0] === rect1[1] && orderedY[1] === rect2[1]) ||
        (orderedY[0] === rect2[1] && orderedY[1] === rect1[1])) {
      // Intersection must be between second and third points
      result[1] = orderedY[1];
      result[3] = orderedY[2];
    } else {
      return false;
    }

    return result;
  };

  Util.sign = function Util_sign(num) {
    return num < 0 ? -1 : 1;
  };

  Util.appendToArray = function Util_appendToArray(arr1, arr2) {
    Array.prototype.push.apply(arr1, arr2);
  };

  Util.prependToArray = function Util_prependToArray(arr1, arr2) {
    Array.prototype.unshift.apply(arr1, arr2);
  };

  Util.extendObj = function extendObj(obj1, obj2) {
    for (var key in obj2) {
      obj1[key] = obj2[key];
    }
  };

  Util.getInheritableProperty = function Util_getInheritableProperty(dict,
                                                                     name) {
    while (dict && !dict.has(name)) {
      dict = dict.get('Parent');
    }
    if (!dict) {
      return null;
    }
    return dict.get(name);
  };

  Util.inherit = function Util_inherit(sub, base, prototype) {
    sub.prototype = Object.create(base.prototype);
    sub.prototype.constructor = sub;
    for (var prop in prototype) {
      sub.prototype[prop] = prototype[prop];
    }
  };

  Util.loadScript = function Util_loadScript(src, callback) {
    var script = document.createElement('script');
    var loaded = false;
    script.setAttribute('src', src);
    if (callback) {
      script.onload = function() {
        if (!loaded) {
          callback();
        }
        loaded = true;
      };
    }
    document.getElementsByTagName('head')[0].appendChild(script);
  };

  return Util;
})();

/**
 * PDF page viewport created based on scale, rotation and offset.
 * @class
 * @alias PDFJS.PageViewport
 */
var PageViewport = PDFJS.PageViewport = (function PageViewportClosure() {
  /**
   * @constructor
   * @private
   * @param viewBox {Array} xMin, yMin, xMax and yMax coordinates.
   * @param scale {number} scale of the viewport.
   * @param rotation {number} rotations of the viewport in degrees.
   * @param offsetX {number} offset X
   * @param offsetY {number} offset Y
   * @param dontFlip {boolean} if true, axis Y will not be flipped.
   */
  function PageViewport(viewBox, scale, rotation, offsetX, offsetY, dontFlip) {
    this.viewBox = viewBox;
    this.scale = scale;
    this.rotation = rotation;
    this.offsetX = offsetX;
    this.offsetY = offsetY;

    // creating transform to convert pdf coordinate system to the normal
    // canvas like coordinates taking in account scale and rotation
    var centerX = (viewBox[2] + viewBox[0]) / 2;
    var centerY = (viewBox[3] + viewBox[1]) / 2;
    var rotateA, rotateB, rotateC, rotateD;
    rotation = rotation % 360;
    rotation = rotation < 0 ? rotation + 360 : rotation;
    switch (rotation) {
      case 180:
        rotateA = -1; rotateB = 0; rotateC = 0; rotateD = 1;
        break;
      case 90:
        rotateA = 0; rotateB = 1; rotateC = 1; rotateD = 0;
        break;
      case 270:
        rotateA = 0; rotateB = -1; rotateC = -1; rotateD = 0;
        break;
      //case 0:
      default:
        rotateA = 1; rotateB = 0; rotateC = 0; rotateD = -1;
        break;
    }

    if (dontFlip) {
      rotateC = -rotateC; rotateD = -rotateD;
    }

    var offsetCanvasX, offsetCanvasY;
    var width, height;
    if (rotateA === 0) {
      offsetCanvasX = Math.abs(centerY - viewBox[1]) * scale + offsetX;
      offsetCanvasY = Math.abs(centerX - viewBox[0]) * scale + offsetY;
      width = Math.abs(viewBox[3] - viewBox[1]) * scale;
      height = Math.abs(viewBox[2] - viewBox[0]) * scale;
    } else {
      offsetCanvasX = Math.abs(centerX - viewBox[0]) * scale + offsetX;
      offsetCanvasY = Math.abs(centerY - viewBox[1]) * scale + offsetY;
      width = Math.abs(viewBox[2] - viewBox[0]) * scale;
      height = Math.abs(viewBox[3] - viewBox[1]) * scale;
    }
    // creating transform for the following operations:
    // translate(-centerX, -centerY), rotate and flip vertically,
    // scale, and translate(offsetCanvasX, offsetCanvasY)
    this.transform = [
      rotateA * scale,
      rotateB * scale,
      rotateC * scale,
      rotateD * scale,
      offsetCanvasX - rotateA * scale * centerX - rotateC * scale * centerY,
      offsetCanvasY - rotateB * scale * centerX - rotateD * scale * centerY
    ];

    this.width = width;
    this.height = height;
    this.fontScale = scale;
  }
  PageViewport.prototype = /** @lends PDFJS.PageViewport.prototype */ {
    /**
     * Clones viewport with additional properties.
     * @param args {Object} (optional) If specified, may contain the 'scale' or
     * 'rotation' properties to override the corresponding properties in
     * the cloned viewport.
     * @returns {PDFJS.PageViewport} Cloned viewport.
     */
    clone: function PageViewPort_clone(args) {
      args = args || {};
      var scale = 'scale' in args ? args.scale : this.scale;
      var rotation = 'rotation' in args ? args.rotation : this.rotation;
      return new PageViewport(this.viewBox.slice(), scale, rotation,
                              this.offsetX, this.offsetY, args.dontFlip);
    },
    /**
     * Converts PDF point to the viewport coordinates. For examples, useful for
     * converting PDF location into canvas pixel coordinates.
     * @param x {number} X coordinate.
     * @param y {number} Y coordinate.
     * @returns {Object} Object that contains 'x' and 'y' properties of the
     * point in the viewport coordinate space.
     * @see {@link convertToPdfPoint}
     * @see {@link convertToViewportRectangle}
     */
    convertToViewportPoint: function PageViewport_convertToViewportPoint(x, y) {
      return Util.applyTransform([x, y], this.transform);
    },
    /**
     * Converts PDF rectangle to the viewport coordinates.
     * @param rect {Array} xMin, yMin, xMax and yMax coordinates.
     * @returns {Array} Contains corresponding coordinates of the rectangle
     * in the viewport coordinate space.
     * @see {@link convertToViewportPoint}
     */
    convertToViewportRectangle:
      function PageViewport_convertToViewportRectangle(rect) {
      var tl = Util.applyTransform([rect[0], rect[1]], this.transform);
      var br = Util.applyTransform([rect[2], rect[3]], this.transform);
      return [tl[0], tl[1], br[0], br[1]];
    },
    /**
     * Converts viewport coordinates to the PDF location. For examples, useful
     * for converting canvas pixel location into PDF one.
     * @param x {number} X coordinate.
     * @param y {number} Y coordinate.
     * @returns {Object} Object that contains 'x' and 'y' properties of the
     * point in the PDF coordinate space.
     * @see {@link convertToViewportPoint}
     */
    convertToPdfPoint: function PageViewport_convertToPdfPoint(x, y) {
      return Util.applyInverseTransform([x, y], this.transform);
    }
  };
  return PageViewport;
})();

var PDFStringTranslateTable = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0x2D8, 0x2C7, 0x2C6, 0x2D9, 0x2DD, 0x2DB, 0x2DA, 0x2DC, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x2022, 0x2020, 0x2021, 0x2026, 0x2014,
  0x2013, 0x192, 0x2044, 0x2039, 0x203A, 0x2212, 0x2030, 0x201E, 0x201C,
  0x201D, 0x2018, 0x2019, 0x201A, 0x2122, 0xFB01, 0xFB02, 0x141, 0x152, 0x160,
  0x178, 0x17D, 0x131, 0x142, 0x153, 0x161, 0x17E, 0, 0x20AC
];

function stringToPDFString(str) {
  var i, n = str.length, strBuf = [];
  if (str[0] === '\xFE' && str[1] === '\xFF') {
    // UTF16BE BOM
    for (i = 2; i < n; i += 2) {
      strBuf.push(String.fromCharCode(
        (str.charCodeAt(i) << 8) | str.charCodeAt(i + 1)));
    }
  } else {
    for (i = 0; i < n; ++i) {
      var code = PDFStringTranslateTable[str.charCodeAt(i)];
      strBuf.push(code ? String.fromCharCode(code) : str.charAt(i));
    }
  }
  return strBuf.join('');
}

function stringToUTF8String(str) {
  return decodeURIComponent(escape(str));
}

function isEmptyObj(obj) {
  for (var key in obj) {
    return false;
  }
  return true;
}

function isBool(v) {
  return typeof v === 'boolean';
}

function isInt(v) {
  return typeof v === 'number' && ((v | 0) === v);
}

function isNum(v) {
  return typeof v === 'number';
}

function isString(v) {
  return typeof v === 'string';
}

function isNull(v) {
  return v === null;
}

function isName(v) {
  return v instanceof Name;
}

function isCmd(v, cmd) {
  return v instanceof Cmd && (cmd === undefined || v.cmd === cmd);
}

function isDict(v, type) {
  if (!(v instanceof Dict)) {
    return false;
  }
  if (!type) {
    return true;
  }
  var dictType = v.get('Type');
  return isName(dictType) && dictType.name === type;
}

function isArray(v) {
  return v instanceof Array;
}

function isStream(v) {
  return typeof v === 'object' && v !== null && v.getBytes !== undefined;
}

function isArrayBuffer(v) {
  return typeof v === 'object' && v !== null && v.byteLength !== undefined;
}

function isRef(v) {
  return v instanceof Ref;
}

/**
 * Promise Capability object.
 *
 * @typedef {Object} PromiseCapability
 * @property {Promise} promise - A promise object.
 * @property {function} resolve - Fullfills the promise.
 * @property {function} reject - Rejects the promise.
 */

/**
 * Creates a promise capability object.
 * @alias PDFJS.createPromiseCapability
 *
 * @return {PromiseCapability} A capability object contains:
 * - a Promise, resolve and reject methods.
 */
function createPromiseCapability() {
  var capability = {};
  capability.promise = new Promise(function (resolve, reject) {
    capability.resolve = resolve;
    capability.reject = reject;
  });
  return capability;
}

PDFJS.createPromiseCapability = createPromiseCapability;

/**
 * Polyfill for Promises:
 * The following promise implementation tries to generally implement the
 * Promise/A+ spec. Some notable differences from other promise libaries are:
 * - There currently isn't a seperate deferred and promise object.
 * - Unhandled rejections eventually show an error if they aren't handled.
 *
 * Based off of the work in:
 * https://bugzilla.mozilla.org/show_bug.cgi?id=810490
 */
(function PromiseClosure() {
  if (globalScope.Promise) {
    // Promises existing in the DOM/Worker, checking presence of all/resolve
    if (typeof globalScope.Promise.all !== 'function') {
      globalScope.Promise.all = function (iterable) {
        var count = 0, results = [], resolve, reject;
        var promise = new globalScope.Promise(function (resolve_, reject_) {
          resolve = resolve_;
          reject = reject_;
        });
        iterable.forEach(function (p, i) {
          count++;
          p.then(function (result) {
            results[i] = result;
            count--;
            if (count === 0) {
              resolve(results);
            }
          }, reject);
        });
        if (count === 0) {
          resolve(results);
        }
        return promise;
      };
    }
    if (typeof globalScope.Promise.resolve !== 'function') {
      globalScope.Promise.resolve = function (value) {
        return new globalScope.Promise(function (resolve) { resolve(value); });
      };
    }
    if (typeof globalScope.Promise.reject !== 'function') {
      globalScope.Promise.reject = function (reason) {
        return new globalScope.Promise(function (resolve, reject) {
          reject(reason);
        });
      };
    }
    if (typeof globalScope.Promise.prototype.catch2 !== 'function') {
      globalScope.Promise.prototype.catch2 = function (onReject) {
        return globalScope.Promise.prototype.then(undefined, onReject);
      };
    }
    return;
  }
//#if !MOZCENTRAL
  var STATUS_PENDING = 0;
  var STATUS_RESOLVED = 1;
  var STATUS_REJECTED = 2;

  // In an attempt to avoid silent exceptions, unhandled rejections are
  // tracked and if they aren't handled in a certain amount of time an
  // error is logged.
  var REJECTION_TIMEOUT = 500;

  var HandlerManager = {
    handlers: [],
    running: false,
    unhandledRejections: [],
    pendingRejectionCheck: false,

    scheduleHandlers: function scheduleHandlers(promise) {
      if (promise._status === STATUS_PENDING) {
        return;
      }

      this.handlers = this.handlers.concat(promise._handlers);
      promise._handlers = [];

      if (this.running) {
        return;
      }
      this.running = true;

      setTimeout(this.runHandlers.bind(this), 0);
    },

    runHandlers: function runHandlers() {
      var RUN_TIMEOUT = 1; // ms
      var timeoutAt = Date.now() + RUN_TIMEOUT;
      while (this.handlers.length > 0) {
        var handler = this.handlers.shift();

        var nextStatus = handler.thisPromise._status;
        var nextValue = handler.thisPromise._value;

        try {
          if (nextStatus === STATUS_RESOLVED) {
            if (typeof handler.onResolve === 'function') {
              nextValue = handler.onResolve(nextValue);
            }
          } else if (typeof handler.onReject === 'function') {
              nextValue = handler.onReject(nextValue);
              nextStatus = STATUS_RESOLVED;

              if (handler.thisPromise._unhandledRejection) {
                this.removeUnhandeledRejection(handler.thisPromise);
              }
          }
        } catch (ex) {
          nextStatus = STATUS_REJECTED;
          nextValue = ex;
        }

        handler.nextPromise._updateStatus(nextStatus, nextValue);
        if (Date.now() >= timeoutAt) {
          break;
        }
      }

      if (this.handlers.length > 0) {
        setTimeout(this.runHandlers.bind(this), 0);
        return;
      }

      this.running = false;
    },

    addUnhandledRejection: function addUnhandledRejection(promise) {
      this.unhandledRejections.push({
        promise: promise,
        time: Date.now()
      });
      this.scheduleRejectionCheck();
    },

    removeUnhandeledRejection: function removeUnhandeledRejection(promise) {
      promise._unhandledRejection = false;
      for (var i = 0; i < this.unhandledRejections.length; i++) {
        if (this.unhandledRejections[i].promise === promise) {
          this.unhandledRejections.splice(i);
          i--;
        }
      }
    },

    scheduleRejectionCheck: function scheduleRejectionCheck() {
      if (this.pendingRejectionCheck) {
        return;
      }
      this.pendingRejectionCheck = true;
      setTimeout(function rejectionCheck() {
        this.pendingRejectionCheck = false;
        var now = Date.now();
        for (var i = 0; i < this.unhandledRejections.length; i++) {
          if (now - this.unhandledRejections[i].time > REJECTION_TIMEOUT) {
            var unhandled = this.unhandledRejections[i].promise._value;
            var msg = 'Unhandled rejection: ' + unhandled;
            if (unhandled.stack) {
              msg += '\n' + unhandled.stack;
            }
            warn(msg);
            this.unhandledRejections.splice(i);
            i--;
          }
        }
        if (this.unhandledRejections.length) {
          this.scheduleRejectionCheck();
        }
      }.bind(this), REJECTION_TIMEOUT);
    }
  };

  function Promise(resolver) {
    this._status = STATUS_PENDING;
    this._handlers = [];
    try {
      resolver.call(this, this._resolve.bind(this), this._reject.bind(this));
    } catch (e) {
      this._reject(e);
    }
  }
  /**
   * Builds a promise that is resolved when all the passed in promises are
   * resolved.
   * @param {array} array of data and/or promises to wait for.
   * @return {Promise} New dependant promise.
   */
  Promise.all = function Promise_all(promises) {
    var resolveAll, rejectAll;
    var deferred = new Promise(function (resolve, reject) {
      resolveAll = resolve;
      rejectAll = reject;
    });
    var unresolved = promises.length;
    var results = [];
    if (unresolved === 0) {
      resolveAll(results);
      return deferred;
    }
    function reject(reason) {
      if (deferred._status === STATUS_REJECTED) {
        return;
      }
      results = [];
      rejectAll(reason);
    }
    for (var i = 0, ii = promises.length; i < ii; ++i) {
      var promise = promises[i];
      var resolve = (function(i) {
        return function(value) {
          if (deferred._status === STATUS_REJECTED) {
            return;
          }
          results[i] = value;
          unresolved--;
          if (unresolved === 0) {
            resolveAll(results);
          }
        };
      })(i);
      if (Promise.isPromise(promise)) {
        promise.then(resolve, reject);
      } else {
        resolve(promise);
      }
    }
    return deferred;
  };

  /**
   * Checks if the value is likely a promise (has a 'then' function).
   * @return {boolean} true if value is thenable
   */
  Promise.isPromise = function Promise_isPromise(value) {
    return value && typeof value.then === 'function';
  };

  /**
   * Creates resolved promise
   * @param value resolve value
   * @returns {Promise}
   */
  Promise.resolve = function Promise_resolve(value) {
    return new Promise(function (resolve) { resolve(value); });
  };

  /**
   * Creates rejected promise
   * @param reason rejection value
   * @returns {Promise}
   */
  Promise.reject = function Promise_reject(reason) {
    return new Promise(function (resolve, reject) { reject(reason); });
  };

  Promise.prototype = {
    _status: null,
    _value: null,
    _handlers: null,
    _unhandledRejection: null,

    _updateStatus: function Promise__updateStatus(status, value) {
      if (this._status === STATUS_RESOLVED ||
          this._status === STATUS_REJECTED) {
        return;
      }

      if (status === STATUS_RESOLVED &&
          Promise.isPromise(value)) {
        value.then(this._updateStatus.bind(this, STATUS_RESOLVED),
                   this._updateStatus.bind(this, STATUS_REJECTED));
        return;
      }

      this._status = status;
      this._value = value;

      if (status === STATUS_REJECTED && this._handlers.length === 0) {
        this._unhandledRejection = true;
        HandlerManager.addUnhandledRejection(this);
      }

      HandlerManager.scheduleHandlers(this);
    },

    _resolve: function Promise_resolve(value) {
      this._updateStatus(STATUS_RESOLVED, value);
    },

    _reject: function Promise_reject(reason) {
      this._updateStatus(STATUS_REJECTED, reason);
    },

    then: function Promise_then(onResolve, onReject) {
      var nextPromise = new Promise(function (resolve, reject) {
        this.resolve = resolve;
        this.reject = reject;
      });
      this._handlers.push({
        thisPromise: this,
        onResolve: onResolve,
        onReject: onReject,
        nextPromise: nextPromise
      });
      HandlerManager.scheduleHandlers(this);
      return nextPromise;
    },

    catch2: function Promise_catch(onReject) {
      return this.then(undefined, onReject);
    }
  };

  globalScope.Promise = Promise;
//#else
//throw new Error('DOM Promise is not present');
//#endif
})();

var StatTimer = (function StatTimerClosure() {
  function rpad(str, pad, length) {
    while (str.length < length) {
      str += pad;
    }
    return str;
  }
  function StatTimer() {
    this.started = {};
    this.times = [];
    this.enabled = true;
  }
  StatTimer.prototype = {
    time: function StatTimer_time(name) {
      if (!this.enabled) {
        return;
      }
      if (name in this.started) {
        warn('Timer is already running for ' + name);
      }
      this.started[name] = Date.now();
    },
    timeEnd: function StatTimer_timeEnd(name) {
      if (!this.enabled) {
        return;
      }
      if (!(name in this.started)) {
        warn('Timer has not been started for ' + name);
      }
      this.times.push({
        'name': name,
        'start': this.started[name],
        'end': Date.now()
      });
      // Remove timer from started so it can be called again.
      delete this.started[name];
    },
    toString: function StatTimer_toString() {
      var i, ii;
      var times = this.times;
      var out = '';
      // Find the longest name for padding purposes.
      var longest = 0;
      for (i = 0, ii = times.length; i < ii; ++i) {
        var name = times[i]['name'];
        if (name.length > longest) {
          longest = name.length;
        }
      }
      for (i = 0, ii = times.length; i < ii; ++i) {
        var span = times[i];
        var duration = span.end - span.start;
        out += rpad(span['name'], ' ', longest) + ' ' + duration + 'ms\n';
      }
      return out;
    }
  };
  return StatTimer;
})();

PDFJS.createBlob = function createBlob(data, contentType) {
  if (typeof Blob !== 'undefined') {
    return new Blob([data], { type: contentType });
  }
  // Blob builder is deprecated in FF14 and removed in FF18.
  var bb = new MozBlobBuilder();
  bb.append(data);
  return bb.getBlob(contentType);
};

PDFJS.createObjectURL = (function createObjectURLClosure() {
  // Blob/createObjectURL is not available, falling back to data schema.
  var digits =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

  return function createObjectURL(data, contentType) {
    if (!PDFJS.disableCreateObjectURL &&
        typeof URL !== 'undefined' && URL.createObjectURL) {
      var blob = PDFJS.createBlob(data, contentType);
      return URL.createObjectURL(blob);
    }

    var buffer = 'data:' + contentType + ';base64,';
    for (var i = 0, ii = data.length; i < ii; i += 3) {
      var b1 = data[i] & 0xFF;
      var b2 = data[i + 1] & 0xFF;
      var b3 = data[i + 2] & 0xFF;
      var d1 = b1 >> 2, d2 = ((b1 & 3) << 4) | (b2 >> 4);
      var d3 = i + 1 < ii ? ((b2 & 0xF) << 2) | (b3 >> 6) : 64;
      var d4 = i + 2 < ii ? (b3 & 0x3F) : 64;
      buffer += digits[d1] + digits[d2] + digits[d3] + digits[d4];
    }
    return buffer;
  };
})();

function MessageHandler(name, comObj) {
  this.name = name;
  this.comObj = comObj;
  this.callbackIndex = 1;
  this.postMessageTransfers = true;
  var callbacksCapabilities = this.callbacksCapabilities = {};
  var ah = this.actionHandler = {};

  ah['console_log'] = [function ahConsoleLog(data) {
    console.log.apply(console, data);
  }];
  ah['console_error'] = [function ahConsoleError(data) {
    console.error.apply(console, data);
  }];
  ah['_unsupported_feature'] = [function ah_unsupportedFeature(data) {
    UnsupportedManager.notify(data);
  }];

  comObj.onmessage = function messageHandlerComObjOnMessage(event) {
    var data = event.data;
    if (data.isReply) {
      var callbackId = data.callbackId;
      if (data.callbackId in callbacksCapabilities) {
        var callback = callbacksCapabilities[callbackId];
        delete callbacksCapabilities[callbackId];
        if ('error' in data) {
          callback.reject(data.error);
        } else {
          callback.resolve(data.data);
        }
      } else {
        error('Cannot resolve callback ' + callbackId);
      }
    } else if (data.action in ah) {
      var action = ah[data.action];
      if (data.callbackId) {
        Promise.resolve().then(function () {
          return action[0].call(action[1], data.data);
        }).then(function (result) {
          comObj.postMessage({
            isReply: true,
            callbackId: data.callbackId,
            data: result
          });
        }, function (reason) {
          comObj.postMessage({
            isReply: true,
            callbackId: data.callbackId,
            error: reason
          });
        });
      } else {
        action[0].call(action[1], data.data);
      }
    } else {
      error('Unknown action from worker: ' + data.action);
    }
  };
}

MessageHandler.prototype = {
  on: function messageHandlerOn(actionName, handler, scope) {
    var ah = this.actionHandler;
    if (ah[actionName]) {
      error('There is already an actionName called "' + actionName + '"');
    }
    ah[actionName] = [handler, scope];
  },
  /**
   * Sends a message to the comObj to invoke the action with the supplied data.
   * @param {String} actionName Action to call.
   * @param {JSON} data JSON data to send.
   * @param {Array} [transfers] Optional list of transfers/ArrayBuffers
   */
  send: function messageHandlerSend(actionName, data, transfers) {
    var message = {
      action: actionName,
      data: data
    };
    this.postMessage(message, transfers);
  },
  /**
   * Sends a message to the comObj to invoke the action with the supplied data.
   * Expects that other side will callback with the response.
   * @param {String} actionName Action to call.
   * @param {JSON} data JSON data to send.
   * @param {Array} [transfers] Optional list of transfers/ArrayBuffers.
   * @returns {Promise} Promise to be resolved with response data.
   */
  sendWithPromise:
    function messageHandlerSendWithPromise(actionName, data, transfers) {
    var callbackId = this.callbackIndex++;
    var message = {
      action: actionName,
      data: data,
      callbackId: callbackId
    };
    var capability = createPromiseCapability();
    this.callbacksCapabilities[callbackId] = capability;
    try {
      this.postMessage(message, transfers);
    } catch (e) {
      capability.reject(e);
    }
    return capability.promise;
  },
  /**
   * Sends raw message to the comObj.
   * @private
   * @param message {Object} Raw message.
   * @param transfers List of transfers/ArrayBuffers, or undefined.
   */
  postMessage: function (message, transfers) {
    if (transfers && this.postMessageTransfers) {
      this.comObj.postMessage(message, transfers);
    } else {
      this.comObj.postMessage(message);
    }
  }
};

function loadJpegStream(id, imageUrl, objs) {
  var img = new Image();
  img.onload = (function loadJpegStream_onloadClosure() {
    objs.resolve(id, img);
  });
  img.onerror = (function loadJpegStream_onerrorClosure() {
    objs.resolve(id, null);
    warn('Error during JPEG image loading');
  });
  img.src = imageUrl;
}


var moduleType = typeof module;
if ((moduleType !== 'undefined') && module.exports) {
    module.exports = JpxImage;
}
},{}],3:[function(require,module,exports){
/*
 * Copyright (C) 2015 Michael Martinez
 * Changes: Added support for selection values 2-7, fixed minor bugs &
 * warnings, split into multiple class files, and general clean up.
 */

/*
 * Copyright (C) 2003-2009 JNode.org
 * Original source: http://webuser.fh-furtwangen.de/~dersch/
 * Changed License to LGPL with the friendly permission of Helmut Dersch.
 */

/*
 * Copyright (C) Helmut Dersch
 *
 * This library is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as published
 * by the Free Software Foundation; either version 2.1 of the License, or
 * (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public
 * License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this library; If not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

/*jslint browser: true, node: true */
/*global require, module */

"use strict";

/*** Imports ***/
var jpeg = jpeg || {};
jpeg.lossless = jpeg.lossless || {};


/*** Constructor ***/
jpeg.lossless.ComponentSpec = jpeg.lossless.ComponentSpec || function () {
    this.hSamp = 0; // Horizontal sampling factor
    this.quantTableSel = 0; // Quantization table destination selector
    this.vSamp = 0; // Vertical
};


/*** Exports ***/

var moduleType = typeof module;
if ((moduleType !== 'undefined') && module.exports) {
    module.exports = jpeg.lossless.ComponentSpec;
}

},{}],4:[function(require,module,exports){
/*
 * Copyright (C) 2015 Michael Martinez
 * Changes: Added support for selection values 2-7, fixed minor bugs &
 * warnings, split into multiple class files, and general clean up.
 */

/*
 * Copyright (C) 2003-2009 JNode.org
 * Original source: http://webuser.fh-furtwangen.de/~dersch/
 * Changed License to LGPL with the friendly permission of Helmut Dersch.
 */

/*
 * Copyright (C) Helmut Dersch
 *
 * This library is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as published
 * by the Free Software Foundation; either version 2.1 of the License, or
 * (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public
 * License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this library; If not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

/*jslint browser: true, node: true */
/*global require, module */

"use strict";

/*** Imports ***/
var jpeg = jpeg || {};
jpeg.lossless = jpeg.lossless || {};


/*** Constructor ***/
jpeg.lossless.DataStream = jpeg.lossless.DataStream || function (data) {
    this.buffer = new DataView(data);
    this.index = 0;
};



jpeg.lossless.DataStream.prototype.get16 = function () {
    var value = this.buffer.getUint16(this.index, false);
    this.index += 2;
    return value;
};



jpeg.lossless.DataStream.prototype.get8 = function () {
    var value = this.buffer.getUint8(this.index);
    this.index += 1;
    return value;
};


/*** Exports ***/

var moduleType = typeof module;
if ((moduleType !== 'undefined') && module.exports) {
    module.exports = jpeg.lossless.DataStream;
}

},{}],5:[function(require,module,exports){
/*
 * Copyright (C) 2015 Michael Martinez
 * Changes: Added support for selection values 2-7, fixed minor bugs &
 * warnings, split into multiple class files, and general clean up.
 */

/*
 * Copyright (C) 2003-2009 JNode.org
 * Original source: http://webuser.fh-furtwangen.de/~dersch/
 * Changed License to LGPL with the friendly permission of Helmut Dersch.
 */

/*
 * Copyright (C) Helmut Dersch
 *
 * This library is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as published
 * by the Free Software Foundation; either version 2.1 of the License, or
 * (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public
 * License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this library; If not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

/*jslint browser: true, node: true */
/*global require, module */

"use strict";

/*** Imports ***/
var jpeg = jpeg || {};
jpeg.lossless = jpeg.lossless || {};
jpeg.lossless.DataStream = jpeg.lossless.DataStream || ((typeof require !== 'undefined') ? require('./data-stream.js') : null);
jpeg.lossless.HuffmanTable = jpeg.lossless.HuffmanTable || ((typeof require !== 'undefined') ? require('./huffman-table.js') : null);
jpeg.lossless.QuantizationTable = jpeg.lossless.QuantizationTable || ((typeof require !== 'undefined') ? require('./quantization-table.js') : null);
jpeg.lossless.ScanHeader = jpeg.lossless.ScanHeader || ((typeof require !== 'undefined') ? require('./scan-header.js') : null);
jpeg.lossless.FrameHeader = jpeg.lossless.FrameHeader || ((typeof require !== 'undefined') ? require('./frame-header.js') : null);
jpeg.lossless.Utils = jpeg.lossless.Utils || ((typeof require !== 'undefined') ? require('./utils.js') : null);


/*** Constructor ***/
jpeg.lossless.Decoder = jpeg.lossless.Decoder || function (buffer, numBytes) {
    this.stream = new jpeg.lossless.DataStream(buffer);
    this.frame = new jpeg.lossless.FrameHeader();
    this.huffTable = new jpeg.lossless.HuffmanTable();
    this.quantTable = new jpeg.lossless.QuantizationTable();
    this.scan = new jpeg.lossless.ScanHeader();
    this.DU = jpeg.lossless.Utils.createArray(10, 4, 64); // at most 10 data units in a MCU, at most 4 data units in one component
    this.HuffTab = jpeg.lossless.Utils.createArray(4, 2, 50 * 256);
    this.IDCT_Source = [];
    this.nBlock = []; // number of blocks in the i-th Comp in a scan
    this.acTab = jpeg.lossless.Utils.createArray(10, 1); // ac HuffTab for the i-th Comp in a scan
    this.dcTab = jpeg.lossless.Utils.createArray(10, 1); // dc HuffTab for the i-th Comp in a scan
    this.qTab = jpeg.lossless.Utils.createArray(10, 1); // quantization table for the i-th Comp in a scan
    this.marker = 0;
    this.markerIndex = 0;
    this.numComp = 0;
    this.restartInterval = 0;
    this.selection = 0;
    this.xDim = 0;
    this.yDim = 0;
    this.xLoc = 0;
    this.yLoc = 0;
    this.outputData = null;

    if (typeof numBytes === "undefined") {
        this.numBytes = 2;
    } else {
        this.numBytes = numBytes;
    }

    if (this.numBytes === 2) {
        this.getter = this.getValue16;
        this.setter = this.setValue16;
    } else if (this.numBytes === 1) {
        this.getter = this.getValue8;
        this.setter = this.setValue8;
    }
};


/*** Static Pseudo-constants ***/

jpeg.lossless.Decoder.IDCT_P = [0, 5, 40, 16, 45, 2, 7, 42, 21, 56, 8, 61, 18, 47, 1, 4, 41, 23, 58, 13, 32, 24, 37, 10, 63, 17, 44, 3, 6, 43, 20,
    57, 15, 34, 29, 48, 53, 26, 39, 9, 60, 19, 46, 22, 59, 12, 33, 31, 50, 55, 25, 36, 11, 62, 14, 35, 28, 49, 52, 27, 38, 30, 51, 54];
jpeg.lossless.Decoder.TABLE = [0, 1, 5, 6, 14, 15, 27, 28, 2, 4, 7, 13, 16, 26, 29, 42, 3, 8, 12, 17, 25, 30, 41, 43, 9, 11, 18, 24, 31, 40, 44, 53,
    10, 19, 23, 32, 39, 45, 52, 54, 20, 22, 33, 38, 46, 51, 55, 60, 21, 34, 37, 47, 50, 56, 59, 61, 35, 36, 48, 49, 57, 58, 62, 63];
jpeg.lossless.Decoder.MAX_HUFFMAN_SUBTREE = 50;
jpeg.lossless.Decoder.MSB = 0x80000000;


/*** Prototype Methods ***/

jpeg.lossless.Decoder.prototype.decode = function () {
    /*jslint bitwise: true */

    var current, scanNum = 0, pred = [], i, compN, temp = [], index = [], mcuNum;

    this.xLoc = 0;
    this.yLoc = 0;
    current = this.stream.get16();

    if (current !== 0xFFD8) { // SOI
        throw new Error("Not a JPEG file");
    }

    current = this.stream.get16();

    while ((((current >> 4) !== 0x0FFC) || (current === 0xFFC4))) { // SOF 0~15
        switch (current) {
            case 0xFFC4: // DHT
                this.huffTable.read(this.stream, this.HuffTab);
                break;
            case 0xFFCC: // DAC
                throw new Error("Program doesn't support arithmetic coding. (format throw new IOException)");
            case 0xFFDB:
                this.quantTable.read(this.stream, jpeg.lossless.Decoder.TABLE);
                break;
            case 0xFFDD:
                this.restartInterval = this.readNumber();
                break;
            case 0xFFE0:
            case 0xFFE1:
            case 0xFFE2:
            case 0xFFE3:
            case 0xFFE4:
            case 0xFFE5:
            case 0xFFE6:
            case 0xFFE7:
            case 0xFFE8:
            case 0xFFE9:
            case 0xFFEA:
            case 0xFFEB:
            case 0xFFEC:
            case 0xFFED:
            case 0xFFEE:
            case 0xFFEF:
                this.readApp();
                break;
            case 0xFFFE:
                this.readComment();
                break;
            default:
                if ((current >> 8) !== 0xFF) {
                    throw new Error("ERROR: format throw new IOException! (decode)");
                }
        }

        current = this.stream.get16();
    }

    if ((current < 0xFFC0) || (current > 0xFFC7)) {
        throw new Error("ERROR: could not handle arithmetic code!");
    }

    this.frame.read(this.stream);
    current = this.stream.get16();

    do {
        while (current !== 0x0FFDA) { // SOS
            switch (current) {
                case 0xFFC4: // DHT
                    this.huffTable.read(this.stream, this.HuffTab);
                    break;
                case 0xFFCC: // DAC
                    throw new Error("Program doesn't support arithmetic coding. (format throw new IOException)");
                case 0xFFDB:
                    this.quantTable.read(this.stream, jpeg.lossless.Decoder.TABLE);
                    break;
                case 0xFFDD:
                    this.restartInterval = this.readNumber();
                    break;
                case 0xFFE0:
                case 0xFFE1:
                case 0xFFE2:
                case 0xFFE3:
                case 0xFFE4:
                case 0xFFE5:
                case 0xFFE6:
                case 0xFFE7:
                case 0xFFE8:
                case 0xFFE9:
                case 0xFFEA:
                case 0xFFEB:
                case 0xFFEC:
                case 0xFFED:
                case 0xFFEE:
                case 0xFFEF:
                    this.readApp();
                    break;
                case 0xFFFE:
                    this.readComment();
                    break;
                default:
                    if ((current >> 8) !== 0xFF) {
                        throw new Error("ERROR: format throw new IOException! (Parser.decode)");
                    }
            }

            current = this.stream.get16();
        }

        this.precision = this.frame.precision;
        this.components = this.frame.components;

        this.scan.read(this.stream);
        this.numComp = this.scan.numComp;
        this.selection = this.scan.selection;

        this.scanComps = this.scan.components;
        this.quantTables = this.quantTable.quantTables;

        for (i = 0; i < this.numComp; i+=1) {
            compN = this.scanComps[i].scanCompSel;
            this.qTab[i] = this.quantTables[this.components[compN].quantTableSel];
            this.nBlock[i] = this.components[compN].vSamp * this.components[compN].hSamp;
            this.dcTab[i] = this.HuffTab[this.scanComps[i].dcTabSel][0];
            this.acTab[i] = this.HuffTab[this.scanComps[i].acTabSel][1];
        }

        this.xDim = this.frame.dimX;
        this.yDim = this.frame.dimY;
        this.outputData = new DataView(new ArrayBuffer(this.xDim * this.yDim * this.numBytes));

        scanNum+=1;

        while (true) { // Decode one scan
            temp[0] = 0;
            index[0] = 0;

            for (i = 0; i < 10; i+=1) {
                pred[i] = (1 << (this.precision - 1));
            }

            if (this.restartInterval === 0) {
                current = this.decodeUnit(pred, temp, index);

                while ((current === 0) && ((this.xLoc < this.xDim) && (this.yLoc < this.yDim))) {
                    this.output(pred);
                    current = this.decodeUnit(pred, temp, index);
                }

                break; //current=MARKER
            }

            for (mcuNum = 0; mcuNum < this.restartInterval; mcuNum+=1) {
                current = this.decodeUnit(pred, temp, index);
                this.output(pred);

                if (current !== 0) {
                    break;
                }
            }

            if (current === 0) {
                if (this.markerIndex !== 0) {
                    current = (0xFF00 | this.marker);
                    this.markerIndex = 0;
                } else {
                    current = this.stream.get16();
                }
            }

            if (!((current >= 0xFFD0) && (current <= 0xFFD7))) {
                break; //current=MARKER
            }
        }

        if ((current === 0xFFDC) && (scanNum === 1)) { //DNL
            this.readNumber();
            current = this.stream.get16();
        }
    } while ((current !== 0xFFD9) && ((this.xLoc < this.xDim) && (this.yLoc < this.yDim)) && (scanNum === 0));

    return this.outputData;
};



jpeg.lossless.Decoder.prototype.decodeUnit = function (prev, temp, index) {
    /*jslint bitwise: true */

    var value, actab, dctab, qtab, ctrC, i, k, j;

    switch (this.selection) {
        case 2:
            prev[0] = this.getPreviousY();
            break;
        case 3:
            prev[0] = this.getPreviousXY();
            break;
        case 4:
            prev[0] = (this.getPreviousX() + this.getPreviousY()) - this.getPreviousXY();
            break;
        case 5:
            prev[0] = this.getPreviousX() + ((this.getPreviousY() - this.getPreviousXY()) >> 1);
            break;
        case 6:
            prev[0] = this.getPreviousY() + ((this.getPreviousX() - this.getPreviousXY()) >> 1);
            break;
        case 7:
            prev[0] = ((this.getPreviousX() + this.getPreviousY()) / 2);
            break;
        default:
            prev[0] = this.getPreviousX();
            break;
    }

    if (this.numComp > 1) {
        for (ctrC = 0; ctrC < this.numComp; ctrC+=1) {
            qtab = this.qTab[ctrC];
            actab = this.acTab[ctrC];
            dctab = this.dcTab[ctrC];
            for (i = 0; i < this.nBlock[ctrC]; i+=1) {
                for (k = 0; k < this.IDCT_Source.length; k+=1) {
                    this.IDCT_Source[k] = 0;
                }

                value = this.getHuffmanValue(dctab, temp, index);

                if (value >= 0xFF00) {
                    return value;
                }

                prev[ctrC] = this.IDCT_Source[0] = prev[ctrC] + this.getn(index, value, temp, index);
                this.IDCT_Source[0] *= qtab[0];

                for (j = 1; j < 64; j+=1) {
                    value = this.getHuffmanValue(actab, temp, index);

                    if (value >= 0xFF00) {
                        return value;
                    }

                    j += (value >> 4);

                    if ((value & 0x0F) === 0) {
                        if ((value >> 4) === 0) {
                            break;
                        }
                    } else {
                        this.IDCT_Source[jpeg.lossless.Decoder.IDCT_P[j]] = this.getn(index, value & 0x0F, temp, index) * qtab[j];
                    }
                }

                this.scaleIDCT(this.DU[ctrC][i]);
            }
        }

        return 0;
    } else {
        for (i = 0; i < this.nBlock[0]; i+=1) {
            value = this.getHuffmanValue(this.dcTab[0], temp, index);
            if (value >= 0xFF00) {
                return value;
            }

            prev[0] += this.getn(prev, value, temp, index);
        }

        return 0;
    }
};



//	Huffman table for fast search: (HuffTab) 8-bit Look up table 2-layer search architecture, 1st-layer represent 256 node (8 bits) if codeword-length > 8
//	bits, then the entry of 1st-layer = (# of 2nd-layer table) | MSB and it is stored in the 2nd-layer Size of tables in each layer are 256.
//	HuffTab[*][*][0-256] is always the only 1st-layer table.
//
//	An entry can be: (1) (# of 2nd-layer table) | MSB , for code length > 8 in 1st-layer (2) (Code length) << 8 | HuffVal
//
//	HuffmanValue(table   HuffTab[x][y] (ex) HuffmanValue(HuffTab[1][0],...)
//	                ):
//	    return: Huffman Value of table
//	            0xFF?? if it receives a MARKER
//	    Parameter:  table   HuffTab[x][y] (ex) HuffmanValue(HuffTab[1][0],...)
//	                temp    temp storage for remainded bits
//	                index   index to bit of temp
//	                in      FILE pointer
//	    Effect:
//	        temp  store new remainded bits
//	        index change to new index
//	        in    change to new position
//	    NOTE:
//	      Initial by   temp=0; index=0;
//	    NOTE: (explain temp and index)
//	      temp: is always in the form at calling time or returning time
//	       |  byte 4  |  byte 3  |  byte 2  |  byte 1  |
//	       |     0    |     0    | 00000000 | 00000??? |  if not a MARKER
//	                                               ^index=3 (from 0 to 15)
//	                                               321
//	    NOTE (marker and marker_index):
//	      If get a MARKER from 'in', marker=the low-byte of the MARKER
//	        and marker_index=9
//	      If marker_index=9 then index is always > 8, or HuffmanValue()
//	        will not be called
jpeg.lossless.Decoder.prototype.getHuffmanValue = function (table, temp, index) {
    /*jslint bitwise: true */

    var code, input, mask;
    mask = 0xFFFF;

    if (index[0] < 8) {
        temp[0] <<= 8;
        input = this.stream.get8();
        if (input === 0xFF) {
            this.marker = this.stream.get8();
            if (this.marker !== 0) {
                this.markerIndex = 9;
            }
        }
        temp[0] |= input;
    } else {
        index[0] -= 8;
    }

    code = table[temp[0] >> index[0]];

    if ((code & jpeg.lossless.Decoder.MSB) !== 0) {
        if (this.markerIndex !== 0) {
            this.markerIndex = 0;
            return 0xFF00 | this.marker;
        }

        temp[0] &= (mask >> (16 - index[0]));
        temp[0] <<= 8;
        input = this.stream.get8();

        if (input === 0xFF) {
            this.marker = this.stream.get8();
            if (this.marker !== 0) {
                this.markerIndex = 9;
            }
        }

        temp[0] |= input;
        code = table[((code & 0xFF) * 256) + (temp[0] >> index[0])];
        index[0] += 8;
    }

    index[0] += 8 - (code >> 8);

    if (index[0] < 0) {
        throw new Error("index=" + index[0] + " temp=" + temp[0] + " code=" + code + " in HuffmanValue()");
    }

    if (index[0] < this.markerIndex) {
        this.markerIndex = 0;
        return 0xFF00 | this.marker;
    }

    temp[0] &= (mask >> (16 - index[0]));
    return code & 0xFF;
};



jpeg.lossless.Decoder.prototype.getn = function (PRED, n, temp, index) {
    /*jslint bitwise: true */

    var result, one, n_one, mask, input;
    one = 1;
    n_one = -1;
    mask = 0xFFFF;

    if (n === 0) {
        return 0;
    }

    if (n === 16) {
        if (PRED[0] >= 0) {
            return -32768;
        } else {
            return 32768;
        }
    }

    index[0] -= n;

    if (index[0] >= 0) {
        if ((index[0] < this.markerIndex) && !this.isLastPixel()) { // this was corrupting the last pixel in some cases
            this.markerIndex = 0;
            return (0xFF00 | this.marker) << 8;
        }

        result = temp[0] >> index[0];
        temp[0] &= (mask >> (16 - index[0]));
    } else {
        temp[0] <<= 8;
        input = this.stream.get8();

        if (input === 0xFF) {
            this.marker = this.stream.get8();
            if (this.marker !== 0) {
                this.markerIndex = 9;
            }
        }

        temp[0] |= input;
        index[0] += 8;

        if (index[0] < 0) {
            if (this.markerIndex !== 0) {
                this.markerIndex = 0;
                return (0xFF00 | this.marker) << 8;
            }

            temp[0] <<= 8;
            input = this.stream.get8();

            if (input === 0xFF) {
                this.marker = this.stream.get8();
                if (this.marker !== 0) {
                    this.markerIndex = 9;
                }
            }

            temp[0] |= input;
            index[0] += 8;
        }

        if (index[0] < 0) {
            throw new Error("index=" + index[0] + " in getn()");
        }

        if (index[0] < this.markerIndex) {
            this.markerIndex = 0;
            return (0xFF00 | this.marker) << 8;
        }

        result = temp[0] >> index[0];
        temp[0] &= (mask >> (16 - index[0]));
    }

    if (result < (one << (n - 1))) {
        result += (n_one << n) + 1;
    }

    return result;
};



jpeg.lossless.Decoder.prototype.getPreviousX = function () {
    /*jslint bitwise: true */

    if (this.xLoc > 0) {
        return this.getter((((this.yLoc * this.xDim) + this.xLoc) - 1));
    } else if (this.yLoc > 0) {
        return this.getPreviousY();
    } else {
        return (1 << (this.frame.precision - 1));
    }
};



jpeg.lossless.Decoder.prototype.getPreviousXY = function () {
    /*jslint bitwise: true */

    if ((this.xLoc > 0) && (this.yLoc > 0)) {
        return this.getter(((((this.yLoc - 1) * this.xDim) + this.xLoc) - 1));
    } else {
        return this.getPreviousY();
    }
};



jpeg.lossless.Decoder.prototype.getPreviousY = function () {
    /*jslint bitwise: true */

    if (this.yLoc > 0) {
        return this.getter((((this.yLoc - 1) * this.xDim) + this.xLoc));
    } else {
        return this.getPreviousX();
    }
};



jpeg.lossless.Decoder.prototype.isLastPixel = function () {
    return (this.xLoc === (this.xDim - 1)) && (this.yLoc === (this.yDim - 1));
};



jpeg.lossless.Decoder.prototype.output = function (PRED) {
    if ((this.xLoc < this.xDim) && (this.yLoc < this.yDim)) {
        this.setter((((this.yLoc * this.xDim) + this.xLoc)), PRED[0]);

        this.xLoc+=1;

        if (this.xLoc >= this.xDim) {
            this.yLoc+=1;
            this.xLoc = 0;
        }
    }
};



jpeg.lossless.Decoder.prototype.setValue16 = function (index, val) {
    this.outputData.setInt16(index * 2, val, true);
};



jpeg.lossless.Decoder.prototype.getValue16 = function (index) {
    return this.outputData.getInt16(index * 2, true);
};



jpeg.lossless.Decoder.prototype.setValue8 = function (index, val) {
    this.outputData.setInt8(index, val);
};



jpeg.lossless.Decoder.prototype.getValue8 = function (index) {
    return this.outputData.getInt8(index);
};



jpeg.lossless.Decoder.prototype.readApp = function() {
    var count = 0, length = this.stream.get16();
    count += 2;

    while (count < length) {
        this.stream.get8();
        count+=1;
    }

    return length;
};



jpeg.lossless.Decoder.prototype.readComment = function () {
    var sb = "", count = 0, length;

    length = this.stream.get16();
    count += 2;

    while (count < length) {
        sb += this.stream.get8();
        count+=1;
    }

    return sb;
};



jpeg.lossless.Decoder.prototype.readNumber = function() {
    var Ld = this.stream.get16();

    if (Ld !== 4) {
        throw new Error("ERROR: Define number format throw new IOException [Ld!=4]");
    }

    return this.stream.get16();
};



jpeg.lossless.Decoder.prototype.scaleIDCT = function (matrix) {
    /*jslint bitwise: true */

    var p = jpeg.lossless.Utils.createArray(8, 8), t0, t1, t2, t3, i, src0, src1, src2, src3, src4, src5, src6, src7, det0, det1, det2, det3, det4,
        det5, det6, det7, mindex = 0;

    for (i = 0; i < 8; i+=1) {
        src0 = this.IDCT_Source[(0) + i];
        src1 = this.IDCT_Source[(8) + i];
        src2 = this.IDCT_Source[(16) + i] - this.IDCT_Source[(24) + i];
        src3 = this.IDCT_Source[(24) + i] + this.IDCT_Source[(16) + i];
        src4 = this.IDCT_Source[(32) + i] - this.IDCT_Source[(56) + i];
        src6 = this.IDCT_Source[(40) + i] - this.IDCT_Source[(48) + i];
        t0 = this.IDCT_Source[(40) + i] + this.IDCT_Source[(48) + i];
        t1 = this.IDCT_Source[(32) + i] + this.IDCT_Source[(56) + i];
        src5 = t0 - t1;
        src7 = t0 + t1;

        det4 = (-src4 * 480) - (src6 * 192);
        det5 = src5 * 384;
        det6 = (src6 * 480) - (src4 * 192);
        det7 = src7 * 256;
        t0 = src0 * 256;
        t1 = src1 * 256;
        t2 = src2 * 384;
        t3 = src3 * 256;
        det3 = t3;
        det0 = t0 + t1;
        det1 = t0 - t1;
        det2 = t2 - t3;

        src0 = det0 + det3;
        src1 = det1 + det2;
        src2 = det1 - det2;
        src3 = det0 - det3;
        src4 = det6 - det4 - det5 - det7;
        src5 = (det5 - det6) + det7;
        src6 = det6 - det7;
        src7 = det7;

        p[0][i] = (src0 + src7 + (1 << 12)) >> 13;
        p[1][i] = (src1 + src6 + (1 << 12)) >> 13;
        p[2][i] = (src2 + src5 + (1 << 12)) >> 13;
        p[3][i] = (src3 + src4 + (1 << 12)) >> 13;
        p[4][i] = ((src3 - src4) + (1 << 12)) >> 13;
        p[5][i] = ((src2 - src5) + (1 << 12)) >> 13;
        p[6][i] = ((src1 - src6) + (1 << 12)) >> 13;
        p[7][i] = ((src0 - src7) + (1 << 12)) >> 13;
    }

    for (i = 0; i < 8; i+=1) {
        src0 = p[i][0];
        src1 = p[i][1];
        src2 = p[i][2] - p[i][3];
        src3 = p[i][3] + p[i][2];
        src4 = p[i][4] - p[i][7];
        src6 = p[i][5] - p[i][6];
        t0 = p[i][5] + p[i][6];
        t1 = p[i][4] + p[i][7];
        src5 = t0 - t1;
        src7 = t0 + t1;

        det4 = (-src4 * 480) - (src6 * 192);
        det5 = src5 * 384;
        det6 = (src6 * 480) - (src4 * 192);
        det7 = src7 * 256;
        t0 = src0 * 256;
        t1 = src1 * 256;
        t2 = src2 * 384;
        t3 = src3 * 256;
        det3 = t3;
        det0 = t0 + t1;
        det1 = t0 - t1;
        det2 = t2 - t3;

        src0 = det0 + det3;
        src1 = det1 + det2;
        src2 = det1 - det2;
        src3 = det0 - det3;
        src4 = det6 - det4 - det5 - det7;
        src5 = (det5 - det6) + det7;
        src6 = det6 - det7;
        src7 = det7;

        matrix[mindex+=1] = (src0 + src7 + (1 << 12)) >> 13;
        matrix[mindex+=1] = (src1 + src6 + (1 << 12)) >> 13;
        matrix[mindex+=1] = (src2 + src5 + (1 << 12)) >> 13;
        matrix[mindex+=1] = (src3 + src4 + (1 << 12)) >> 13;
        matrix[mindex+=1] = ((src3 - src4) + (1 << 12)) >> 13;
        matrix[mindex+=1] = ((src2 - src5) + (1 << 12)) >> 13;
        matrix[mindex+=1] = ((src1 - src6) + (1 << 12)) >> 13;
        matrix[mindex+=1] = ((src0 - src7) + (1 << 12)) >> 13;
    }
};



/*** Exports ***/

var moduleType = typeof module;
if ((moduleType !== 'undefined') && module.exports) {
    module.exports = jpeg.lossless.Decoder;
}

},{"./data-stream.js":4,"./frame-header.js":6,"./huffman-table.js":7,"./quantization-table.js":8,"./scan-header.js":10,"./utils.js":11}],6:[function(require,module,exports){
/*
 * Copyright (C) 2015 Michael Martinez
 * Changes: Added support for selection values 2-7, fixed minor bugs &
 * warnings, split into multiple class files, and general clean up.
 */

/*
 * Copyright (C) 2003-2009 JNode.org
 * Original source: http://webuser.fh-furtwangen.de/~dersch/
 * Changed License to LGPL with the friendly permission of Helmut Dersch.
 */

/*
 * Copyright (C) Helmut Dersch
 *
 * This library is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as published
 * by the Free Software Foundation; either version 2.1 of the License, or
 * (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public
 * License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this library; If not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

/*jslint browser: true, node: true */
/*global require, module */

"use strict";

/*** Imports ***/
var jpeg = jpeg || {};
jpeg.lossless = jpeg.lossless || {};
jpeg.lossless.ComponentSpec = jpeg.lossless.ComponentSpec || ((typeof require !== 'undefined') ? require('./component-spec.js') : null);
jpeg.lossless.DataStream = jpeg.lossless.DataStream || ((typeof require !== 'undefined') ? require('./data-stream.js') : null);


/*** Constructor ***/
jpeg.lossless.FrameHeader = jpeg.lossless.FrameHeader || function () {
    this.components = []; // Components
    this.dimX = 0; // Number of samples per line
    this.dimY = 0; // Number of lines
    this.numComp = 0; // Number of component in the frame
    this.precision = 0; // Sample Precision (from the original image)
};



/*** Prototype Methods ***/

jpeg.lossless.FrameHeader.prototype.read = function (data) {
    /*jslint bitwise: true */

    var count = 0, length, i, c, temp;

    length = data.get16();
    count += 2;

    this.precision = data.get8();
    count+=1;

    this.dimY = data.get16();
    count += 2;

    this.dimX = data.get16();
    count += 2;

    this.numComp = data.get8();
    count+=1;
    for (i = 1; i <= this.numComp; i+=1) {
        if (count > length) {
            throw new Error("ERROR: frame format error");
        }

        c = data.get8();
        count+=1;

        if (count >= length) {
            throw new Error("ERROR: frame format error [c>=Lf]");
        }

        temp = data.get8();
        count+=1;

        if (!this.components[c]) {
            this.components[c] = new jpeg.lossless.ComponentSpec();
        }

        this.components[c].hSamp = temp >> 4;
        this.components[c].vSamp = temp & 0x0F;
        this.components[c].quantTableSel = data.get8();
        count+=1;
    }

    if (count !== length) {
        throw new Error("ERROR: frame format error [Lf!=count]");
    }

    return 1;
};


/*** Exports ***/

var moduleType = typeof module;
if ((moduleType !== 'undefined') && module.exports) {
    module.exports = jpeg.lossless.FrameHeader;
}

},{"./component-spec.js":3,"./data-stream.js":4}],7:[function(require,module,exports){
/*
 * Copyright (C) 2015 Michael Martinez
 * Changes: Added support for selection values 2-7, fixed minor bugs &
 * warnings, split into multiple class files, and general clean up.
 */

/*
 * Copyright (C) 2003-2009 JNode.org
 * Original source: http://webuser.fh-furtwangen.de/~dersch/
 * Changed License to LGPL with the friendly permission of Helmut Dersch.
 */

/*
 * Copyright (C) Helmut Dersch
 *
 * This library is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as published
 * by the Free Software Foundation; either version 2.1 of the License, or
 * (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public
 * License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this library; If not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

/*jslint browser: true, node: true */
/*global require, module */

"use strict";

/*** Imports ***/
var jpeg = jpeg || {};
jpeg.lossless = jpeg.lossless || {};
jpeg.lossless.DataStream = jpeg.lossless.DataStream || ((typeof require !== 'undefined') ? require('./data-stream.js') : null);
jpeg.lossless.Utils = jpeg.lossless.Utils || ((typeof require !== 'undefined') ? require('./utils.js') : null);


/*** Constructor ***/
jpeg.lossless.HuffmanTable = jpeg.lossless.HuffmanTable || function () {
    this.l = jpeg.lossless.Utils.createArray(4, 2, 16);
    this.th = [];
    this.v = jpeg.lossless.Utils.createArray(4, 2, 16, 200);
    this.tc = jpeg.lossless.Utils.createArray(4, 2);

    this.tc[0][0] = 0;
    this.tc[1][0] = 0;
    this.tc[2][0] = 0;
    this.tc[3][0] = 0;
    this.tc[0][1] = 0;
    this.tc[1][1] = 0;
    this.tc[2][1] = 0;
    this.tc[3][1] = 0;
    this.th[0] = 0;
    this.th[1] = 0;
    this.th[2] = 0;
    this.th[3] = 0;
};



/*** Static Pseudo-constants ***/

jpeg.lossless.HuffmanTable.MSB = 0x80000000;


/*** Prototype Methods ***/

jpeg.lossless.HuffmanTable.prototype.read = function(data, HuffTab) {
    /*jslint bitwise: true */

    var count = 0, length, temp, t, c, i, j;

    length = data.get16();
    count += 2;

    while (count < length) {
        temp = data.get8();
        count+=1;
        t = temp & 0x0F;
        if (t > 3) {
            throw new Error("ERROR: Huffman table ID > 3");
        }

        c = temp >> 4;
        if (c > 2) {
            throw new Error("ERROR: Huffman table [Table class > 2 ]");
        }

        this.th[t] = 1;
        this.tc[t][c] = 1;

        for (i = 0; i < 16; i+=1) {
            this.l[t][c][i] = data.get8();
            count+=1;
        }

        for (i = 0; i < 16; i+=1) {
            for (j = 0; j < this.l[t][c][i]; j+=1) {
                if (count > length) {
                    throw new Error("ERROR: Huffman table format error [count>Lh]");
                }

                this.v[t][c][i][j] = data.get8();
                count+=1;
            }
        }
    }

    if (count !== length) {
        throw new Error("ERROR: Huffman table format error [count!=Lf]");
    }

    for (i = 0; i < 4; i+=1) {
        for (j = 0; j < 2; j+=1) {
            if (this.tc[i][j] !== 0) {
                this.buildHuffTable(HuffTab[i][j], this.l[i][j], this.v[i][j]);
            }
        }
    }

    return 1;
};



//	Build_HuffTab()
//	Parameter:  t       table ID
//	            c       table class ( 0 for DC, 1 for AC )
//	            L[i]    # of codewords which length is i
//	            V[i][j] Huffman Value (length=i)
//	Effect:
//	    build up HuffTab[t][c] using L and V.
jpeg.lossless.HuffmanTable.prototype.buildHuffTable = function(tab, L, V) {
    /*jslint bitwise: true */

    var currentTable, temp, k, i, j, n;
    temp = 256;
    k = 0;

    for (i = 0; i < 8; i+=1) { // i+1 is Code length
        for (j = 0; j < L[i]; j+=1) {
            for (n = 0; n < (temp >> (i + 1)); n+=1) {
                tab[k] = V[i][j] | ((i + 1) << 8);
                k+=1;
            }
        }
    }

    for (i = 1; k < 256; i+=1, k+=1) {
        tab[k] = i | jpeg.lossless.HuffmanTable.MSB;
    }

    currentTable = 1;
    k = 0;

    for (i = 8; i < 16; i+=1) { // i+1 is Code length
        for (j = 0; j < L[i]; j+=1) {
            for (n = 0; n < (temp >> (i - 7)); n+=1) {
                tab[(currentTable * 256) + k] = V[i][j] | ((i + 1) << 8);
                k+=1;
            }

            if (k >= 256) {
                if (k > 256) {
                    this.error = "ERROR: Huffman table error(1)!";
                }

                k = 0;
                currentTable+=1;
            }
        }
    }
};


/*** Exports ***/

var moduleType = typeof module;
if ((moduleType !== 'undefined') && module.exports) {
    module.exports = jpeg.lossless.HuffmanTable;
}

},{"./data-stream.js":4,"./utils.js":11}],8:[function(require,module,exports){
/*
 * Copyright (C) 2015 Michael Martinez
 * Changes: Added support for selection values 2-7, fixed minor bugs &
 * warnings, split into multiple class files, and general clean up.
 */

/*
 * Copyright (C) 2003-2009 JNode.org
 * Original source: http://webuser.fh-furtwangen.de/~dersch/
 * Changed License to LGPL with the friendly permission of Helmut Dersch.
 */

/*
 * Copyright (C) Helmut Dersch
 *
 * This library is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as published
 * by the Free Software Foundation; either version 2.1 of the License, or
 * (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public
 * License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this library; If not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

/*jslint browser: true, node: true */
/*global require, module */

"use strict";

/*** Imports ***/
var jpeg = jpeg || {};
jpeg.lossless = jpeg.lossless || {};
jpeg.lossless.DataStream = jpeg.lossless.DataStream || ((typeof require !== 'undefined') ? require('./data-stream.js') : null);
jpeg.lossless.Utils = jpeg.lossless.Utils || ((typeof require !== 'undefined') ? require('./utils.js') : null);


/*** Constructor ***/
jpeg.lossless.QuantizationTable = jpeg.lossless.QuantizationTable || function () {
    this.precision = []; // Quantization precision 8 or 16
    this.tq = []; // 1: this table is presented
    this.quantTables = jpeg.lossless.Utils.createArray(4, 64); // Tables

    this.tq[0] = 0;
    this.tq[1] = 0;
    this.tq[2] = 0;
    this.tq[3] = 0;
};



/*** Static Methods ***/

jpeg.lossless.QuantizationTable.enhanceQuantizationTable = function(qtab, table) {
    /*jslint bitwise: true */

    var i;

    for (i = 0; i < 8; i+=1) {
        qtab[table[(0 * 8) + i]] *= 90;
        qtab[table[(4 * 8) + i]] *= 90;
        qtab[table[(2 * 8) + i]] *= 118;
        qtab[table[(6 * 8) + i]] *= 49;
        qtab[table[(5 * 8) + i]] *= 71;
        qtab[table[(1 * 8) + i]] *= 126;
        qtab[table[(7 * 8) + i]] *= 25;
        qtab[table[(3 * 8) + i]] *= 106;
    }

    for (i = 0; i < 8; i+=1) {
        qtab[table[0 + (8 * i)]] *= 90;
        qtab[table[4 + (8 * i)]] *= 90;
        qtab[table[2 + (8 * i)]] *= 118;
        qtab[table[6 + (8 * i)]] *= 49;
        qtab[table[5 + (8 * i)]] *= 71;
        qtab[table[1 + (8 * i)]] *= 126;
        qtab[table[7 + (8 * i)]] *= 25;
        qtab[table[3 + (8 * i)]] *= 106;
    }

    for (i = 0; i < 64; i+=1) {
        qtab[i] >>= 6;
    }
};


/*** Prototype Methods ***/

jpeg.lossless.QuantizationTable.prototype.read = function (data, table) {
    /*jslint bitwise: true */

    var count = 0, length, temp, t, i;

    length = data.get16();
    count += 2;

    while (count < length) {
        temp = data.get8();
        count+=1;
        t = temp & 0x0F;

        if (t > 3) {
            throw new Error("ERROR: Quantization table ID > 3");
        }

        this.precision[t] = temp >> 4;

        if (this.precision[t] === 0) {
            this.precision[t] = 8;
        } else if (this.precision[t] === 1) {
            this.precision[t] = 16;
        } else {
            throw new Error("ERROR: Quantization table precision error");
        }

        this.tq[t] = 1;

        if (this.precision[t] === 8) {
            for (i = 0; i < 64; i+=1) {
                if (count > length) {
                    throw new Error("ERROR: Quantization table format error");
                }

                this.quantTables[t][i] = data.get8();
                count+=1;
            }

            jpeg.lossless.QuantizationTable.enhanceQuantizationTable(this.quantTables[t], table);
        } else {
            for (i = 0; i < 64; i+=1) {
                if (count > length) {
                    throw new Error("ERROR: Quantization table format error");
                }

                this.quantTables[t][i] = data.get16();
                count += 2;
            }

            jpeg.lossless.QuantizationTable.enhanceQuantizationTable(this.quantTables[t], table);
        }
    }

    if (count !== length) {
        throw new Error("ERROR: Quantization table error [count!=Lq]");
    }

    return 1;
};



/*** Exports ***/

var moduleType = typeof module;
if ((moduleType !== 'undefined') && module.exports) {
    module.exports = jpeg.lossless.QuantizationTable;
}

},{"./data-stream.js":4,"./utils.js":11}],9:[function(require,module,exports){
/*
 * Copyright (C) 2015 Michael Martinez
 * Changes: Added support for selection values 2-7, fixed minor bugs &
 * warnings, split into multiple class files, and general clean up.
 */

/*
 * Copyright (C) 2003-2009 JNode.org
 * Original source: http://webuser.fh-furtwangen.de/~dersch/
 * Changed License to LGPL with the friendly permission of Helmut Dersch.
 */

/*
 * Copyright (C) Helmut Dersch
 *
 * This library is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as published
 * by the Free Software Foundation; either version 2.1 of the License, or
 * (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public
 * License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this library; If not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

/*jslint browser: true, node: true */
/*global require, module */

"use strict";

/*** Imports ***/
var jpeg = jpeg || {};
jpeg.lossless = jpeg.lossless || {};


/*** Constructor ***/
jpeg.lossless.ScanComponent = jpeg.lossless.ScanComponent || function () {
    this.acTabSel = 0; // AC table selector
    this.dcTabSel = 0; // DC table selector
    this.scanCompSel = 0; // Scan component selector
};



/*** Exports ***/

var moduleType = typeof module;
if ((moduleType !== 'undefined') && module.exports) {
    module.exports = jpeg.lossless.ScanComponent;
}

},{}],10:[function(require,module,exports){
/*
 * Copyright (C) 2015 Michael Martinez
 * Changes: Added support for selection values 2-7, fixed minor bugs &
 * warnings, split into multiple class files, and general clean up.
 */

/*
 * Copyright (C) 2003-2009 JNode.org
 * Original source: http://webuser.fh-furtwangen.de/~dersch/
 * Changed License to LGPL with the friendly permission of Helmut Dersch.
 */

/*
 * Copyright (C) Helmut Dersch
 *
 * This library is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as published
 * by the Free Software Foundation; either version 2.1 of the License, or
 * (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public
 * License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this library; If not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

/*jslint browser: true, node: true */
/*global require, module */

"use strict";

/*** Imports ***/
var jpeg = jpeg || {};
jpeg.lossless = jpeg.lossless || {};
jpeg.lossless.DataStream = jpeg.lossless.DataStream || ((typeof require !== 'undefined') ? require('./data-stream.js') : null);
jpeg.lossless.ScanComponent = jpeg.lossless.ScanComponent || ((typeof require !== 'undefined') ? require('./scan-component.js') : null);


/*** Constructor ***/
jpeg.lossless.ScanHeader = jpeg.lossless.ScanHeader || function () {
    this.ah = 0;
    this.al = 0;
    this.numComp = 0; // Number of components in the scan
    this.selection = 0; // Start of spectral or predictor selection
    this.spectralEnd = 0; // End of spectral selection
    this.components = [];
};


/*** Prototype Methods ***/

jpeg.lossless.ScanHeader.prototype.read = function(data) {
    /*jslint bitwise: true */

    var count = 0, length, i, temp;

    length = data.get16();
    count += 2;

    this.numComp = data.get8();
    count+=1;

    for (i = 0; i < this.numComp; i+=1) {
        this.components[i] = new jpeg.lossless.ScanComponent();

        if (count > length) {
            throw new Error("ERROR: scan header format error");
        }

        this.components[i].scanCompSel = data.get8();
        count+=1;

        temp = data.get8();
        count+=1;

        this.components[i].dcTabSel = (temp >> 4);
        this.components[i].acTabSel = (temp & 0x0F);
    }

    this.selection = data.get8();
    count+=1;

    this.spectralEnd = data.get8();
    count+=1;

    temp = data.get8();
    this.ah = (temp >> 4);
    this.al = (temp & 0x0F);
    count+=1;

    if (count !== length) {
        throw new Error("ERROR: scan header format error [count!=Ns]");
    }

    return 1;
};



/*** Exports ***/

var moduleType = typeof module;
if ((moduleType !== 'undefined') && module.exports) {
    module.exports = jpeg.lossless.ScanHeader;
}

},{"./data-stream.js":4,"./scan-component.js":9}],11:[function(require,module,exports){
/*
 * Copyright (C) 2015 Michael Martinez
 * Changes: Added support for selection values 2-7, fixed minor bugs &
 * warnings, split into multiple class files, and general clean up.
 */

/*
 * Copyright (C) 2003-2009 JNode.org
 * Original source: http://webuser.fh-furtwangen.de/~dersch/
 * Changed License to LGPL with the friendly permission of Helmut Dersch.
 */

/*
 * Copyright (C) Helmut Dersch
 *
 * This library is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as published
 * by the Free Software Foundation; either version 2.1 of the License, or
 * (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public
 * License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this library; If not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

/*jslint browser: true, node: true */
/*global require, module */

"use strict";

/*** Imports ***/
var jpeg = jpeg || {};
jpeg.lossless = jpeg.lossless || {};


/*** Constructor ***/
jpeg.lossless.Utils = jpeg.lossless.Utils || {};


/*** Static methods ***/

// http://stackoverflow.com/questions/966225/how-can-i-create-a-two-dimensional-array-in-javascript
jpeg.lossless.Utils.createArray = function (length) {
    var arr = new Array(length || 0),
        i = length;

    if (arguments.length > 1) {
        var args = Array.prototype.slice.call(arguments, 1);
        while(i--) arr[length-1 - i] = jpeg.lossless.Utils.createArray.apply(this, args);
    }

    return arr;
};


/*** Exports ***/

var moduleType = typeof module;
if ((moduleType !== 'undefined') && module.exports) {
    module.exports = jpeg.lossless.Utils;
}

},{}],12:[function(require,module,exports){

/*jslint browser: true, node: true */
/*global require, module */

"use strict";

/*** Imports ***/
var daikon = daikon || {};
daikon.CompressionUtils = daikon.CompressionUtils || {};


/*** Static Pseudo-constants ***/

daikon.CompressionUtils.JPEG_MAGIC_NUMBER = [0xFF, 0xD8];
daikon.CompressionUtils.JPEG2000_MAGIC_NUMBER = [0xFF, 0x4F, 0xFF, 0x51];


/*** Static methods ***/

daikon.CompressionUtils.isHeaderJPEG = function (data) {
    if (data) {
        if (data.getUint8(0) !== daikon.CompressionUtils.JPEG_MAGIC_NUMBER[0]) {
            return false;
        }

        if (data.getUint8(1) !== daikon.CompressionUtils.JPEG_MAGIC_NUMBER[1]) {
            return false;
        }

        return true;
    }

    return false;
};


daikon.CompressionUtils.isHeaderJPEG2000 = function (data) {
    var ctr;

    if (data) {
        for (ctr = 0; ctr < daikon.CompressionUtils.JPEG2000_MAGIC_NUMBER.length; ctr+=1) {
            if (data.getUint8(ctr) !== daikon.CompressionUtils.JPEG2000_MAGIC_NUMBER[ctr]) {
                return false;
            }
        }

        return true;
    }

    return false;
};


/*** Exports ***/

var moduleType = typeof module;
if ((moduleType !== 'undefined') && module.exports) {
    module.exports = daikon.CompressionUtils;
}
},{}],13:[function(require,module,exports){

/*jslint browser: true, node: true */
/*global require, module */

"use strict";

/*** Imports ***/
var daikon = daikon || {};
daikon.Dictionary = daikon.Dictionary || {};
daikon.Utils = daikon.Utils || ((typeof require !== 'undefined') ? require('./utilities.js') : null);


/*** Static Pseudo-constants ***/

daikon.Dictionary.dictPrivate = {
    "0207" : {
        "101F" : ["FE", "ElscintDataScale"] // uses special Elscint double type (see Tag class)
    }
};


daikon.Dictionary.dict = {
    "0002" : {
        "0001" : ["OB", "FileMetaInformationVersion"],
        "0002" : ["UI", "MediaStoredSOPClassUID"],
        "0003" : ["UI", "MediaStoredSOPInstanceUID"],
        "0010" : ["UI", "TransferSyntaxUID"],
        "0012" : ["UI", "ImplementationClassUID"],
        "0013" : ["SH", "ImplementationVersionName"],
        "0016" : ["AE", "SourceApplicationEntityTitle"],
        "0100" : ["UI", "PrivateInformationCreatorUID"],
        "0102" : ["OB", "PrivateInformation"]
    },
    "0004" : {
        "1130" : ["CS", "FilesetID"],
        "1141" : ["CS", "FilesetDescriptorFileFileID"],
        "1142" : ["CS", "FilesetDescriptorFileFormat"],
        "1200" : ["UL", "RootDirectoryEntitysFirstDirectoryRecordOffset"],
        "1202" : ["UL", "RootDirectoryEntitysLastDirectoryRecordOffset"],
        "1212" : ["US", "File-setConsistenceFlag"],
        "1220" : ["SQ", "DirectoryRecordSequence"],
        "1400" : ["UL", "NextDirectoryRecordOffset"],
        "1410" : ["US", "RecordInuseFlag"],
        "1420" : ["UL", "ReferencedLowerlevelDirectoryEntityOffset"],
        "1430" : ["CS", "DirectoryRecordType"],
        "1432" : ["UI", "PrivateRecordUID"],
        "1500" : ["CS", "ReferencedFileID"],
        "1510" : ["UI", "ReferencedSOPClassUIDInFile"],
        "1511" : ["UI", "ReferencedSOPInstanceUIDInFile"],
        "1600" : ["UL", "NumberOfReferences"]
    },
    "0008" : {
        "0001" : ["UL", "LengthToEnd"],
        "0005" : ["CS", "SpecificCharacterSet"],
        "0006" : ["SQ", "LanguageCodeSequence"],
        "0008" : ["CS", "ImageType"],
        "0010" : ["SH", "RecognitionCode"],
        "0012" : ["DA", "InstanceCreationDate"],
        "0013" : ["TM", "InstanceCreationTime"],
        "0014" : ["UI", "InstanceCreatorUID"],
        "0016" : ["UI", "SOPClassUID"],
        "0018" : ["UI", "SOPInstanceUID"],
        "001A" : ["UI", "RelatedGeneralSOPClassUID"],
        "001B" : ["UI", "OriginalSpecializedSOPClassUID"],
        "0020" : ["DA", "StudyDate"],
        "0021" : ["DA", "SeriesDate"],
        "0022" : ["DA", "AcquisitionDate"],
        "0023" : ["DA", "ContentDate"],
        "0024" : ["DA", "OverlayDate"],
        "0025" : ["DA", "CurveDate"],
        "002A" : ["DT", "AcquisitionDateTime"],
        "0030" : ["TM", "StudyTime"],
        "0031" : ["TM", "SeriesTime"],
        "0032" : ["TM", "AcquisitionTime"],
        "0033" : ["TM", "ContentTime"],
        "0034" : ["TM", "OverlayTime"],
        "0035" : ["TM", "CurveTime"],
        "0040" : ["US", "DataSetType"],
        "0041" : ["LO", "DataSetSubtype"],
        "0042" : ["CS", "NuclearMedicineSeriesType"],
        "0050" : ["SH", "AccessionNumber"],
        "0051" : ["SQ", "IssuerOfAccessionNumberSequence"],
        "0052" : ["CS", "QueryRetrieveLevel"],
        "0054" : ["AE", "RetrieveAETitle"],
        "0056" : ["CS", "InstanceAvailability"],
        "0058" : ["UI", "FailedSOPInstanceUIDList"],
        "0060" : ["CS", "Modality"],
        "0061" : ["CS", "ModalitiesInStudy"],
        "0062" : ["UI", "SOPClassesInStudy"],
        "0064" : ["CS", "ConversionType"],
        "0068" : ["CS", "PresentationIntentType"],
        "0070" : ["LO", "Manufacturer"],
        "0080" : ["LO", "InstitutionName"],
        "0081" : ["ST", "InstitutionAddress"],
        "0082" : ["SQ", "InstitutionCodeSequence"],
        "0090" : ["PN", "ReferringPhysicianName"],
        "0092" : ["ST", "ReferringPhysicianAddress"],
        "0094" : ["SH", "ReferringPhysicianTelephoneNumbers"],
        "0096" : ["SQ", "ReferringPhysicianIdentificationSequence"],
        "0100" : ["SH", "CodeValue"],
        "0102" : ["SH", "CodingSchemeDesignator"],
        "0103" : ["SH", "CodingSchemeVersion"],
        "0104" : ["LO", "CodeMeaning"],
        "0105" : ["CS", "MappingResource"],
        "0106" : ["DT", "ContextGroupVersion"],
        "0107" : ["DT", "ContextGroupLocalVersion"],
        "010B" : ["CS", "ContextGroupExtensionFlag"],
        "010C" : ["UI", "CodingSchemeUID"],
        "010D" : ["UI", "ContextGroupExtensionCreatorUID"],
        "010F" : ["CS", "ContextIdentifier"],
        "0110" : ["SQ", "CodingSchemeIdentificationSequence"],
        "0112" : ["LO", "CodingSchemeRegistry"],
        "0114" : ["ST", "CodingSchemeExternalID"],
        "0115" : ["ST", "CodingSchemeName"],
        "0116" : ["ST", "CodingSchemeResponsibleOrganization"],
        "0117" : ["UI", "ContextUID"],
        "0201" : ["SH", "TimezoneOffsetFromUTC"],
        "1000" : ["AE", "NetworkID"],
        "1010" : ["SH", "StationName"],
        "1030" : ["LO", "StudyDescription"],
        "1032" : ["SQ", "ProcedureCodeSequence"],
        "103E" : ["LO", "SeriesDescription"],
        "103F" : ["SQ", "SeriesDescriptionCodeSequence"],
        "1040" : ["LO", "InstitutionalDepartmentName"],
        "1048" : ["PN", "PhysiciansOfRecord"],
        "1049" : ["SQ", "PhysiciansOfRecordIdentificationSequence"],
        "1050" : ["PN", "PerformingPhysicianName"],
        "1052" : ["SQ", "PerformingPhysicianIdentificationSequence"],
        "1060" : ["PN", "NameOfPhysiciansReadingStudy"],
        "1062" : ["SQ", "PhysiciansReadingStudyIdentificationSequence"],
        "1070" : ["PN", "OperatorsName"],
        "1072" : ["SQ", "OperatorIdentificationSequence"],
        "1080" : ["LO", "AdmittingDiagnosesDescription"],
        "1084" : ["SQ", "AdmittingDiagnosesCodeSequence"],
        "1090" : ["LO", "ManufacturerModelName"],
        "1100" : ["SQ", "ReferencedResultsSequence"],
        "1110" : ["SQ", "ReferencedStudySequence"],
        "1111" : ["SQ", "ReferencedPerformedProcedureStepSequence"],
        "1115" : ["SQ", "ReferencedSeriesSequence"],
        "1120" : ["SQ", "ReferencedPatientSequence"],
        "1125" : ["SQ", "ReferencedVisitSequence"],
        "1130" : ["SQ", "ReferencedOverlaySequence"],
        "1134" : ["SQ", "ReferencedStereometricInstanceSequence"],
        "113A" : ["SQ", "ReferencedWaveformSequence"],
        "1140" : ["SQ", "ReferencedImageSequence"],
        "1145" : ["SQ", "ReferencedCurveSequence"],
        "114A" : ["SQ", "ReferencedInstanceSequence"],
        "114B" : ["SQ", "ReferencedRealWorldValueMappingInstanceSequence"],
        "1150" : ["UI", "ReferencedSOPClassUID"],
        "1155" : ["UI", "ReferencedSOPInstanceUID"],
        "115A" : ["UI", "SOPClassesSupported"],
        "1160" : ["IS", "ReferencedFrameNumber"],
        "1161" : ["UL", "SimpleFrameList"],
        "1162" : ["UL", "CalculatedFrameList"],
        "1163" : ["FD", "TimeRange"],
        "1164" : ["SQ", "FrameExtractionSequence"],
        "1167" : ["UI", "MultiFrameSourceSOPInstanceUID"],
        "1195" : ["UI", "TransactionUID"],
        "1197" : ["US", "FailureReason"],
        "1198" : ["SQ", "FailedSOPSequence"],
        "1199" : ["SQ", "ReferencedSOPSequence"],
        "1200" : ["SQ", "StudiesContainingOtherReferencedInstancesSequence"],
        "1250" : ["SQ", "RelatedSeriesSequence"],
        "2110" : ["CS", "LossyImageCompressionRetired"],
        "2111" : ["ST", "DerivationDescription"],
        "2112" : ["SQ", "SourceImageSequence"],
        "2120" : ["SH", "StageName"],
        "2122" : ["IS", "StageNumber"],
        "2124" : ["IS", "NumberOfStages"],
        "2127" : ["SH", "ViewName"],
        "2128" : ["IS", "ViewNumber"],
        "2129" : ["IS", "NumberOfEventTimers"],
        "212A" : ["IS", "NumberOfViewsInStage"],
        "2130" : ["DS", "EventElapsedTimes"],
        "2132" : ["LO", "EventTimerNames"],
        "2133" : ["SQ", "EventTimerSequence"],
        "2134" : ["FD", "EventTimeOffset"],
        "2135" : ["SQ", "EventCodeSequence"],
        "2142" : ["IS", "StartTrim"],
        "2143" : ["IS", "StopTrim"],
        "2144" : ["IS", "RecommendedDisplayFrameRate"],
        "2200" : ["CS", "TransducerPosition"],
        "2204" : ["CS", "TransducerOrientation"],
        "2208" : ["CS", "AnatomicStructure"],
        "2218" : ["SQ", "AnatomicRegionSequence"],
        "2220" : ["SQ", "AnatomicRegionModifierSequence"],
        "2228" : ["SQ", "PrimaryAnatomicStructureSequence"],
        "2229" : ["SQ", "AnatomicStructureSpaceOrRegionSequence"],
        "2230" : ["SQ", "PrimaryAnatomicStructureModifierSequence"],
        "2240" : ["SQ", "TransducerPositionSequence"],
        "2242" : ["SQ", "TransducerPositionModifierSequence"],
        "2244" : ["SQ", "TransducerOrientationSequence"],
        "2246" : ["SQ", "TransducerOrientationModifierSequence"],
        "2251" : ["SQ", "AnatomicStructureSpaceOrRegionCodeSequenceTrial"],
        "2253" : ["SQ", "AnatomicPortalOfEntranceCodeSequenceTrial"],
        "2255" : ["SQ", "AnatomicApproachDirectionCodeSequenceTrial"],
        "2256" : ["ST", "AnatomicPerspectiveDescriptionTrial"],
        "2257" : ["SQ", "AnatomicPerspectiveCodeSequenceTrial"],
        "2258" : ["ST", "AnatomicLocationOfExaminingInstrumentDescriptionTrial"],
        "2259" : ["SQ", "AnatomicLocationOfExaminingInstrumentCodeSequenceTrial"],
        "225A" : ["SQ", "AnatomicStructureSpaceOrRegionModifierCodeSequenceTrial"],
        "225C" : ["SQ", "OnAxisBackgroundAnatomicStructureCodeSequenceTrial"],
        "3001" : ["SQ", "AlternateRepresentationSequence"],
        "3010" : ["UI", "IrradiationEventUID"],
        "4000" : ["LT", "IdentifyingComments"],
        "9007" : ["CS", "FrameType"],
        "9092" : ["SQ", "ReferencedImageEvidenceSequence"],
        "9121" : ["SQ", "ReferencedRawDataSequence"],
        "9123" : ["UI", "CreatorVersionUID"],
        "9124" : ["SQ", "DerivationImageSequence"],
        "9154" : ["SQ", "SourceImageEvidenceSequence"],
        "9205" : ["CS", "PixelPresentation"],
        "9206" : ["CS", "VolumetricProperties"],
        "9207" : ["CS", "VolumeBasedCalculationTechnique"],
        "9208" : ["CS", "ComplexImageComponent"],
        "9209" : ["CS", "AcquisitionContrast"],
        "9215" : ["SQ", "DerivationCodeSequence"],
        "9237" : ["SQ", "ReferencedPresentationStateSequence"],
        "9410" : ["SQ", "ReferencedOtherPlaneSequence"],
        "9458" : ["SQ", "FrameDisplaySequence"],
        "9459" : ["FL", "RecommendedDisplayFrameRateInFloat"],
        "9460" : ["CS", "SkipFrameRangeFlag"]
    },
    "0010" : {
        "0010" : ["PN", "PatientName"],
        "0020" : ["LO", "PatientID"],
        "0021" : ["LO", "IssuerOfPatientID"],
        "0022" : ["CS", "TypeOfPatientID"],
        "0024" : ["SQ", "IssuerOfPatientIDQualifiersSequence"],
        "0030" : ["DA", "PatientBirthDate"],
        "0032" : ["TM", "PatientBirthTime"],
        "0040" : ["CS", "PatientSex"],
        "0050" : ["SQ", "PatientInsurancePlanCodeSequence"],
        "0101" : ["SQ", "PatientPrimaryLanguageCodeSequence"],
        "0102" : ["SQ", "PatientPrimaryLanguageModifierCodeSequence"],
        "1000" : ["LO", "OtherPatientIDs"],
        "1001" : ["PN", "OtherPatientNames"],
        "1002" : ["SQ", "OtherPatientIDsSequence"],
        "1005" : ["PN", "PatientBirthName"],
        "1010" : ["AS", "PatientAge"],
        "1020" : ["DS", "PatientSize"],
        "1021" : ["SQ", "PatientSizeCodeSequence"],
        "1030" : ["DS", "PatientWeight"],
        "1040" : ["LO", "PatientAddress"],
        "1050" : ["LO", "InsurancePlanIdentification"],
        "1060" : ["PN", "PatientMotherBirthName"],
        "1080" : ["LO", "MilitaryRank"],
        "1081" : ["LO", "BranchOfService"],
        "1090" : ["LO", "MedicalRecordLocator"],
        "2000" : ["LO", "MedicalAlerts"],
        "2110" : ["LO", "Allergies"],
        "2150" : ["LO", "CountryOfResidence"],
        "2152" : ["LO", "RegionOfResidence"],
        "2154" : ["SH", "PatientTelephoneNumbers"],
        "2160" : ["SH", "EthnicGroup"],
        "2180" : ["SH", "Occupation"],
        "21A0" : ["CS", "SmokingStatus"],
        "21B0" : ["LT", "AdditionalPatientHistory"],
        "21C0" : ["US", "PregnancyStatus"],
        "21D0" : ["DA", "LastMenstrualDate"],
        "21F0" : ["LO", "PatientReligiousPreference"],
        "2201" : ["LO", "PatientSpeciesDescription"],
        "2202" : ["SQ", "PatientSpeciesCodeSequence"],
        "2203" : ["CS", "PatientSexNeutered"],
        "2210" : ["CS", "AnatomicalOrientationType"],
        "2292" : ["LO", "PatientBreedDescription"],
        "2293" : ["SQ", "PatientBreedCodeSequence"],
        "2294" : ["SQ", "BreedRegistrationSequence"],
        "2295" : ["LO", "BreedRegistrationNumber"],
        "2296" : ["SQ", "BreedRegistryCodeSequence"],
        "2297" : ["PN", "ResponsiblePerson"],
        "2298" : ["CS", "ResponsiblePersonRole"],
        "2299" : ["LO", "ResponsibleOrganization"],
        "4000" : ["LT", "PatientComments"],
        "9431" : ["FL", "ExaminedBodyThickness"]
    },
    "0012" : {
        "0010" : ["LO", "ClinicalTrialSponsorName"],
        "0020" : ["LO", "ClinicalTrialProtocolID"],
        "0021" : ["LO", "ClinicalTrialProtocolName"],
        "0030" : ["LO", "ClinicalTrialSiteID"],
        "0031" : ["LO", "ClinicalTrialSiteName"],
        "0040" : ["LO", "ClinicalTrialSubjectID"],
        "0042" : ["LO", "ClinicalTrialSubjectReadingID"],
        "0050" : ["LO", "ClinicalTrialTimePointID"],
        "0051" : ["ST", "ClinicalTrialTimePointDescription"],
        "0060" : ["LO", "ClinicalTrialCoordinatingCenterName"],
        "0062" : ["CS", "PatientIdentityRemoved"],
        "0063" : ["LO", "DeidentificationMethod"],
        "0064" : ["SQ", "DeidentificationMethodCodeSequence"],
        "0071" : ["LO", "ClinicalTrialSeriesID"],
        "0072" : ["LO", "ClinicalTrialSeriesDescription"],
        "0081" : ["LO", "ClinicalTrialProtocolEthicsCommitteeName"],
        "0082" : ["LO", "ClinicalTrialProtocolEthicsCommitteeApprovalNumber"],
        "0083" : ["SQ", "ConsentForClinicalTrialUseSequence"],
        "0084" : ["CS", "DistributionType"],
        "0085" : ["CS", "ConsentForDistributionFlag"]
    },
    "0014" : {
        "0023" : ["ST", "CADFileFormat"],
        "0024" : ["ST", "ComponentReferenceSystem"],
        "0025" : ["ST", "ComponentManufacturingProcedure"],
        "0028" : ["ST", "ComponentManufacturer"],
        "0030" : ["DS", "MaterialThickness"],
        "0032" : ["DS", "MaterialPipeDiameter"],
        "0034" : ["DS", "MaterialIsolationDiameter"],
        "0042" : ["ST", "MaterialGrade"],
        "0044" : ["ST", "MaterialPropertiesFileID"],
        "0045" : ["ST", "MaterialPropertiesFileFormat"],
        "0046" : ["LT", "MaterialNotes"],
        "0050" : ["CS", "ComponentShape"],
        "0052" : ["CS", "CurvatureType"],
        "0054" : ["DS", "OuterDiameter"],
        "0056" : ["DS", "InnerDiameter"],
        "1010" : ["ST", "ActualEnvironmentalConditions"],
        "1020" : ["DA", "ExpiryDate"],
        "1040" : ["ST", "EnvironmentalConditions"],
        "2002" : ["SQ", "EvaluatorSequence"],
        "2004" : ["IS", "EvaluatorNumber"],
        "2006" : ["PN", "EvaluatorName"],
        "2008" : ["IS", "EvaluationAttempt"],
        "2012" : ["SQ", "IndicationSequence"],
        "2014" : ["IS", "IndicationNumber "],
        "2016" : ["SH", "IndicationLabel"],
        "2018" : ["ST", "IndicationDescription"],
        "201A" : ["CS", "IndicationType"],
        "201C" : ["CS", "IndicationDisposition"],
        "201E" : ["SQ", "IndicationROISequence"],
        "2030" : ["SQ", "IndicationPhysicalPropertySequence"],
        "2032" : ["SH", "PropertyLabel"],
        "2202" : ["IS", "CoordinateSystemNumberOfAxes "],
        "2204" : ["SQ", "CoordinateSystemAxesSequence"],
        "2206" : ["ST", "CoordinateSystemAxisDescription"],
        "2208" : ["CS", "CoordinateSystemDataSetMapping"],
        "220A" : ["IS", "CoordinateSystemAxisNumber"],
        "220C" : ["CS", "CoordinateSystemAxisType"],
        "220E" : ["CS", "CoordinateSystemAxisUnits"],
        "2210" : ["OB", "CoordinateSystemAxisValues"],
        "2220" : ["SQ", "CoordinateSystemTransformSequence"],
        "2222" : ["ST", "TransformDescription"],
        "2224" : ["IS", "TransformNumberOfAxes"],
        "2226" : ["IS", "TransformOrderOfAxes"],
        "2228" : ["CS", "TransformedAxisUnits"],
        "222A" : ["DS", "CoordinateSystemTransformRotationAndScaleMatrix"],
        "222C" : ["DS", "CoordinateSystemTransformTranslationMatrix"],
        "3011" : ["DS", "InternalDetectorFrameTime"],
        "3012" : ["DS", "NumberOfFramesIntegrated"],
        "3020" : ["SQ", "DetectorTemperatureSequence"],
        "3022" : ["DS", "SensorName"],
        "3024" : ["DS", "HorizontalOffsetOfSensor"],
        "3026" : ["DS", "VerticalOffsetOfSensor"],
        "3028" : ["DS", "SensorTemperature"],
        "3040" : ["SQ", "DarkCurrentSequence"],
        "3050" : ["OB", "DarkCurrentCounts"],
        "3060" : ["SQ", "GainCorrectionReferenceSequence"],
        "3070" : ["OB", "AirCounts"],
        "3071" : ["DS", "KVUsedInGainCalibration"],
        "3072" : ["DS", "MAUsedInGainCalibration"],
        "3073" : ["DS", "NumberOfFramesUsedForIntegration"],
        "3074" : ["LO", "FilterMaterialUsedInGainCalibration"],
        "3075" : ["DS", "FilterThicknessUsedInGainCalibration"],
        "3076" : ["DA", "DateOfGainCalibration"],
        "3077" : ["TM", "TimeOfGainCalibration"],
        "3080" : ["OB", "BadPixelImage"],
        "3099" : ["LT", "CalibrationNotes"],
        "4002" : ["SQ", "PulserEquipmentSequence"],
        "4004" : ["CS", "PulserType"],
        "4006" : ["LT", "PulserNotes"],
        "4008" : ["SQ", "ReceiverEquipmentSequence"],
        "400A" : ["CS", "AmplifierType"],
        "400C" : ["LT", "ReceiverNotes"],
        "400E" : ["SQ", "PreAmplifierEquipmentSequence"],
        "400F" : ["LT", "PreAmplifierNotes"],
        "4010" : ["SQ", "TransmitTransducerSequence"],
        "4011" : ["SQ", "ReceiveTransducerSequence"],
        "4012" : ["US", "NumberOfElements"],
        "4013" : ["CS", "ElementShape"],
        "4014" : ["DS", "ElementDimensionA"],
        "4015" : ["DS", "ElementDimensionB"],
        "4016" : ["DS", "ElementPitch"],
        "4017" : ["DS", "MeasuredBeamDimensionA"],
        "4018" : ["DS", "MeasuredBeamDimensionB"],
        "4019" : ["DS", "LocationOfMeasuredBeamDiameter"],
        "401A" : ["DS", "NominalFrequency"],
        "401B" : ["DS", "MeasuredCenterFrequency"],
        "401C" : ["DS", "MeasuredBandwidth"],
        "4020" : ["SQ", "PulserSettingsSequence"],
        "4022" : ["DS", "PulseWidth"],
        "4024" : ["DS", "ExcitationFrequency"],
        "4026" : ["CS", "ModulationType"],
        "4028" : ["DS", "Damping"],
        "4030" : ["SQ", "ReceiverSettingsSequence"],
        "4031" : ["DS", "AcquiredSoundpathLength"],
        "4032" : ["CS", "AcquisitionCompressionType"],
        "4033" : ["IS", "AcquisitionSampleSize"],
        "4034" : ["DS", "RectifierSmoothing"],
        "4035" : ["SQ", "DACSequence"],
        "4036" : ["CS", "DACType"],
        "4038" : ["DS", "DACGainPoints"],
        "403A" : ["DS", "DACTimePoints"],
        "403C" : ["DS", "DACAmplitude"],
        "4040" : ["SQ", "PreAmplifierSettingsSequence"],
        "4050" : ["SQ", "TransmitTransducerSettingsSequence"],
        "4051" : ["SQ", "ReceiveTransducerSettingsSequence"],
        "4052" : ["DS", "IncidentAngle"],
        "4054" : ["ST", "CouplingTechnique"],
        "4056" : ["ST", "CouplingMedium"],
        "4057" : ["DS", "CouplingVelocity"],
        "4058" : ["DS", "CrystalCenterLocationX"],
        "4059" : ["DS", "CrystalCenterLocationZ"],
        "405A" : ["DS", "SoundPathLength"],
        "405C" : ["ST", "DelayLawIdentifier"],
        "4060" : ["SQ", "GateSettingsSequence"],
        "4062" : ["DS", "GateThreshold"],
        "4064" : ["DS", "VelocityOfSound"],
        "4070" : ["SQ", "CalibrationSettingsSequence"],
        "4072" : ["ST", "CalibrationProcedure"],
        "4074" : ["SH", "ProcedureVersion"],
        "4076" : ["DA", "ProcedureCreationDate"],
        "4078" : ["DA", "ProcedureExpirationDate"],
        "407A" : ["DA", "ProcedureLastModifiedDate"],
        "407C" : ["TM", "CalibrationTime"],
        "407E" : ["DA", "CalibrationDate"],
        "5002" : ["IS", "LINACEnergy"],
        "5004" : ["IS", "LINACOutput"]
    },
    "0018" : {
        "0010" : ["LO", "ContrastBolusAgent"],
        "0012" : ["SQ", "ContrastBolusAgentSequence"],
        "0014" : ["SQ", "ContrastBolusAdministrationRouteSequence"],
        "0015" : ["CS", "BodyPartExamined"],
        "0020" : ["CS", "ScanningSequence"],
        "0021" : ["CS", "SequenceVariant"],
        "0022" : ["CS", "ScanOptions"],
        "0023" : ["CS", "MRAcquisitionType"],
        "0024" : ["SH", "SequenceName"],
        "0025" : ["CS", "AngioFlag"],
        "0026" : ["SQ", "InterventionDrugInformationSequence"],
        "0027" : ["TM", "InterventionDrugStopTime"],
        "0028" : ["DS", "InterventionDrugDose"],
        "0029" : ["SQ", "InterventionDrugCodeSequence"],
        "002A" : ["SQ", "AdditionalDrugSequence"],
        "0030" : ["LO", "Radionuclide"],
        "0031" : ["LO", "Radiopharmaceutical"],
        "0032" : ["DS", "EnergyWindowCenterline"],
        "0033" : ["DS", "EnergyWindowTotalWidth"],
        "0034" : ["LO", "InterventionDrugName"],
        "0035" : ["TM", "InterventionDrugStartTime"],
        "0036" : ["SQ", "InterventionSequence"],
        "0037" : ["CS", "TherapyType"],
        "0038" : ["CS", "InterventionStatus"],
        "0039" : ["CS", "TherapyDescription"],
        "003A" : ["ST", "InterventionDescription"],
        "0040" : ["IS", "CineRate"],
        "0042" : ["CS", "InitialCineRunState"],
        "0050" : ["DS", "SliceThickness"],
        "0060" : ["DS", "KVP"],
        "0070" : ["IS", "CountsAccumulated"],
        "0071" : ["CS", "AcquisitionTerminationCondition"],
        "0072" : ["DS", "EffectiveDuration"],
        "0073" : ["CS", "AcquisitionStartCondition"],
        "0074" : ["IS", "AcquisitionStartConditionData"],
        "0075" : ["IS", "AcquisitionTerminationConditionData"],
        "0080" : ["DS", "RepetitionTime"],
        "0081" : ["DS", "EchoTime"],
        "0082" : ["DS", "InversionTime"],
        "0083" : ["DS", "NumberOfAverages"],
        "0084" : ["DS", "ImagingFrequency"],
        "0085" : ["SH", "ImagedNucleus"],
        "0086" : ["IS", "EchoNumbers"],
        "0087" : ["DS", "MagneticFieldStrength"],
        "0088" : ["DS", "SpacingBetweenSlices"],
        "0089" : ["IS", "NumberOfPhaseEncodingSteps"],
        "0090" : ["DS", "DataCollectionDiameter"],
        "0091" : ["IS", "EchoTrainLength"],
        "0093" : ["DS", "PercentSampling"],
        "0094" : ["DS", "PercentPhaseFieldOfView"],
        "0095" : ["DS", "PixelBandwidth"],
        "1000" : ["LO", "DeviceSerialNumber"],
        "1002" : ["UI", "DeviceUID"],
        "1003" : ["LO", "DeviceID"],
        "1004" : ["LO", "PlateID"],
        "1005" : ["LO", "GeneratorID"],
        "1006" : ["LO", "GridID"],
        "1007" : ["LO", "CassetteID"],
        "1008" : ["LO", "GantryID"],
        "1010" : ["LO", "SecondaryCaptureDeviceID"],
        "1011" : ["LO", "HardcopyCreationDeviceID"],
        "1012" : ["DA", "DateOfSecondaryCapture"],
        "1014" : ["TM", "TimeOfSecondaryCapture"],
        "1016" : ["LO", "SecondaryCaptureDeviceManufacturer"],
        "1017" : ["LO", "HardcopyDeviceManufacturer"],
        "1018" : ["LO", "SecondaryCaptureDeviceManufacturerModelName"],
        "1019" : ["LO", "SecondaryCaptureDeviceSoftwareVersions"],
        "101A" : ["LO", "HardcopyDeviceSoftwareVersion"],
        "101B" : ["LO", "HardcopyDeviceManufacturerModelName"],
        "1020" : ["LO", "SoftwareVersions"],
        "1022" : ["SH", "VideoImageFormatAcquired"],
        "1023" : ["LO", "DigitalImageFormatAcquired"],
        "1030" : ["LO", "ProtocolName"],
        "1040" : ["LO", "ContrastBolusRoute"],
        "1041" : ["DS", "ContrastBolusVolume"],
        "1042" : ["TM", "ContrastBolusStartTime"],
        "1043" : ["TM", "ContrastBolusStopTime"],
        "1044" : ["DS", "ContrastBolusTotalDose"],
        "1045" : ["IS", "SyringeCounts"],
        "1046" : ["DS", "ContrastFlowRate"],
        "1047" : ["DS", "ContrastFlowDuration"],
        "1048" : ["CS", "ContrastBolusIngredient"],
        "1049" : ["DS", "ContrastBolusIngredientConcentration"],
        "1050" : ["DS", "SpatialResolution"],
        "1060" : ["DS", "TriggerTime"],
        "1061" : ["LO", "TriggerSourceOrType"],
        "1062" : ["IS", "NominalInterval"],
        "1063" : ["DS", "FrameTime"],
        "1064" : ["LO", "CardiacFramingType"],
        "1065" : ["DS", "FrameTimeVector"],
        "1066" : ["DS", "FrameDelay"],
        "1067" : ["DS", "ImageTriggerDelay"],
        "1068" : ["DS", "MultiplexGroupTimeOffset"],
        "1069" : ["DS", "TriggerTimeOffset"],
        "106A" : ["CS", "SynchronizationTrigger"],
        "106C" : ["US", "SynchronizationChannel"],
        "106E" : ["UL", "TriggerSamplePosition"],
        "1070" : ["LO", "RadiopharmaceuticalRoute"],
        "1071" : ["DS", "RadiopharmaceuticalVolume"],
        "1072" : ["TM", "RadiopharmaceuticalStartTime"],
        "1073" : ["TM", "RadiopharmaceuticalStopTime"],
        "1074" : ["DS", "RadionuclideTotalDose"],
        "1075" : ["DS", "RadionuclideHalfLife"],
        "1076" : ["DS", "RadionuclidePositronFraction"],
        "1077" : ["DS", "RadiopharmaceuticalSpecificActivity"],
        "1078" : ["DT", "RadiopharmaceuticalStartDateTime"],
        "1079" : ["DT", "RadiopharmaceuticalStopDateTime"],
        "1080" : ["CS", "BeatRejectionFlag"],
        "1081" : ["IS", "LowRRValue"],
        "1082" : ["IS", "HighRRValue"],
        "1083" : ["IS", "IntervalsAcquired"],
        "1084" : ["IS", "IntervalsRejected"],
        "1085" : ["LO", "PVCRejection"],
        "1086" : ["IS", "SkipBeats"],
        "1088" : ["IS", "HeartRate"],
        "1090" : ["IS", "CardiacNumberOfImages"],
        "1094" : ["IS", "TriggerWindow"],
        "1100" : ["DS", "ReconstructionDiameter"],
        "1110" : ["DS", "DistanceSourceToDetector"],
        "1111" : ["DS", "DistanceSourceToPatient"],
        "1114" : ["DS", "EstimatedRadiographicMagnificationFactor"],
        "1120" : ["DS", "GantryDetectorTilt"],
        "1121" : ["DS", "GantryDetectorSlew"],
        "1130" : ["DS", "TableHeight"],
        "1131" : ["DS", "TableTraverse"],
        "1134" : ["CS", "TableMotion"],
        "1135" : ["DS", "TableVerticalIncrement"],
        "1136" : ["DS", "TableLateralIncrement"],
        "1137" : ["DS", "TableLongitudinalIncrement"],
        "1138" : ["DS", "TableAngle"],
        "113A" : ["CS", "TableType"],
        "1140" : ["CS", "RotationDirection"],
        "1141" : ["DS", "AngularPosition"],
        "1142" : ["DS", "RadialPosition"],
        "1143" : ["DS", "ScanArc"],
        "1144" : ["DS", "AngularStep"],
        "1145" : ["DS", "CenterOfRotationOffset"],
        "1146" : ["DS", "RotationOffset"],
        "1147" : ["CS", "FieldOfViewShape"],
        "1149" : ["IS", "FieldOfViewDimensions"],
        "1150" : ["IS", "ExposureTime"],
        "1151" : ["IS", "XRayTubeCurrent"],
        "1152" : ["IS", "Exposure"],
        "1153" : ["IS", "ExposureInuAs"],
        "1154" : ["DS", "AveragePulseWidth"],
        "1155" : ["CS", "RadiationSetting"],
        "1156" : ["CS", "RectificationType"],
        "115A" : ["CS", "RadiationMode"],
        "115E" : ["DS", "ImageAndFluoroscopyAreaDoseProduct"],
        "1160" : ["SH", "FilterType"],
        "1161" : ["LO", "TypeOfFilters"],
        "1162" : ["DS", "IntensifierSize"],
        "1164" : ["DS", "ImagerPixelSpacing"],
        "1166" : ["CS", "Grid"],
        "1170" : ["IS", "GeneratorPower"],
        "1180" : ["SH", "CollimatorGridName"],
        "1181" : ["CS", "CollimatorType"],
        "1182" : ["IS", "FocalDistance"],
        "1183" : ["DS", "XFocusCenter"],
        "1184" : ["DS", "YFocusCenter"],
        "1190" : ["DS", "FocalSpots"],
        "1191" : ["CS", "AnodeTargetMaterial"],
        "11A0" : ["DS", "BodyPartThickness"],
        "11A2" : ["DS", "CompressionForce"],
        "1200" : ["DA", "DateOfLastCalibration"],
        "1201" : ["TM", "TimeOfLastCalibration"],
        "1210" : ["SH", "ConvolutionKernel"],
        "1240" : ["IS", "UpperLowerPixelValues"],
        "1242" : ["IS", "ActualFrameDuration"],
        "1243" : ["IS", "CountRate"],
        "1244" : ["US", "PreferredPlaybackSequencing"],
        "1250" : ["SH", "ReceiveCoilName"],
        "1251" : ["SH", "TransmitCoilName"],
        "1260" : ["SH", "PlateType"],
        "1261" : ["LO", "PhosphorType"],
        "1300" : ["DS", "ScanVelocity"],
        "1301" : ["CS", "WholeBodyTechnique"],
        "1302" : ["IS", "ScanLength"],
        "1310" : ["US", "AcquisitionMatrix"],
        "1312" : ["CS", "InPlanePhaseEncodingDirection"],
        "1314" : ["DS", "FlipAngle"],
        "1315" : ["CS", "VariableFlipAngleFlag"],
        "1316" : ["DS", "SAR"],
        "1318" : ["DS", "dBdt"],
        "1400" : ["LO", "AcquisitionDeviceProcessingDescription"],
        "1401" : ["LO", "AcquisitionDeviceProcessingCode"],
        "1402" : ["CS", "CassetteOrientation"],
        "1403" : ["CS", "CassetteSize"],
        "1404" : ["US", "ExposuresOnPlate"],
        "1405" : ["IS", "RelativeXRayExposure"],
        "1411" : ["DS", "ExposureIndex"],
        "1412" : ["DS", "TargetExposureIndex"],
        "1413" : ["DS", "DeviationIndex"],
        "1450" : ["DS", "ColumnAngulation"],
        "1460" : ["DS", "TomoLayerHeight"],
        "1470" : ["DS", "TomoAngle"],
        "1480" : ["DS", "TomoTime"],
        "1490" : ["CS", "TomoType"],
        "1491" : ["CS", "TomoClass"],
        "1495" : ["IS", "NumberOfTomosynthesisSourceImages"],
        "1500" : ["CS", "PositionerMotion"],
        "1508" : ["CS", "PositionerType"],
        "1510" : ["DS", "PositionerPrimaryAngle"],
        "1511" : ["DS", "PositionerSecondaryAngle"],
        "1520" : ["DS", "PositionerPrimaryAngleIncrement"],
        "1521" : ["DS", "PositionerSecondaryAngleIncrement"],
        "1530" : ["DS", "DetectorPrimaryAngle"],
        "1531" : ["DS", "DetectorSecondaryAngle"],
        "1600" : ["CS", "ShutterShape"],
        "1602" : ["IS", "ShutterLeftVerticalEdge"],
        "1604" : ["IS", "ShutterRightVerticalEdge"],
        "1606" : ["IS", "ShutterUpperHorizontalEdge"],
        "1608" : ["IS", "ShutterLowerHorizontalEdge"],
        "1610" : ["IS", "CenterOfCircularShutter"],
        "1612" : ["IS", "RadiusOfCircularShutter"],
        "1620" : ["IS", "VerticesOfThePolygonalShutter"],
        "1622" : ["US", "ShutterPresentationValue"],
        "1623" : ["US", "ShutterOverlayGroup"],
        "1624" : ["US", "ShutterPresentationColorCIELabValue"],
        "1700" : ["CS", "CollimatorShape"],
        "1702" : ["IS", "CollimatorLeftVerticalEdge"],
        "1704" : ["IS", "CollimatorRightVerticalEdge"],
        "1706" : ["IS", "CollimatorUpperHorizontalEdge"],
        "1708" : ["IS", "CollimatorLowerHorizontalEdge"],
        "1710" : ["IS", "CenterOfCircularCollimator"],
        "1712" : ["IS", "RadiusOfCircularCollimator"],
        "1720" : ["IS", "VerticesOfThePolygonalCollimator"],
        "1800" : ["CS", "AcquisitionTimeSynchronized"],
        "1801" : ["SH", "TimeSource"],
        "1802" : ["CS", "TimeDistributionProtocol"],
        "1803" : ["LO", "NTPSourceAddress"],
        "2001" : ["IS", "PageNumberVector"],
        "2002" : ["SH", "FrameLabelVector"],
        "2003" : ["DS", "FramePrimaryAngleVector"],
        "2004" : ["DS", "FrameSecondaryAngleVector"],
        "2005" : ["DS", "SliceLocationVector"],
        "2006" : ["SH", "DisplayWindowLabelVector"],
        "2010" : ["DS", "NominalScannedPixelSpacing"],
        "2020" : ["CS", "DigitizingDeviceTransportDirection"],
        "2030" : ["DS", "RotationOfScannedFilm"],
        "3100" : ["CS", "IVUSAcquisition"],
        "3101" : ["DS", "IVUSPullbackRate"],
        "3102" : ["DS", "IVUSGatedRate"],
        "3103" : ["IS", "IVUSPullbackStartFrameNumber"],
        "3104" : ["IS", "IVUSPullbackStopFrameNumber"],
        "3105" : ["IS", "LesionNumber"],
        "4000" : ["LT", "AcquisitionComments"],
        "5000" : ["SH", "OutputPower"],
        "5010" : ["LO", "TransducerData"],
        "5012" : ["DS", "FocusDepth"],
        "5020" : ["LO", "ProcessingFunction"],
        "5021" : ["LO", "PostprocessingFunction"],
        "5022" : ["DS", "MechanicalIndex"],
        "5024" : ["DS", "BoneThermalIndex"],
        "5026" : ["DS", "CranialThermalIndex"],
        "5027" : ["DS", "SoftTissueThermalIndex"],
        "5028" : ["DS", "SoftTissueFocusThermalIndex"],
        "5029" : ["DS", "SoftTissueSurfaceThermalIndex"],
        "5030" : ["DS", "DynamicRange"],
        "5040" : ["DS", "TotalGain"],
        "5050" : ["IS", "DepthOfScanField"],
        "5100" : ["CS", "PatientPosition"],
        "5101" : ["CS", "ViewPosition"],
        "5104" : ["SQ", "ProjectionEponymousNameCodeSequence"],
        "5210" : ["DS", "ImageTransformationMatrix"],
        "5212" : ["DS", "ImageTranslationVector"],
        "6000" : ["DS", "Sensitivity"],
        "6011" : ["SQ", "SequenceOfUltrasoundRegions"],
        "6012" : ["US", "RegionSpatialFormat"],
        "6014" : ["US", "RegionDataType"],
        "6016" : ["UL", "RegionFlags"],
        "6018" : ["UL", "RegionLocationMinX0"],
        "601A" : ["UL", "RegionLocationMinY0"],
        "601C" : ["UL", "RegionLocationMaxX1"],
        "601E" : ["UL", "RegionLocationMaxY1"],
        "6020" : ["SL", "ReferencePixelX0"],
        "6022" : ["SL", "ReferencePixelY0"],
        "6024" : ["US", "PhysicalUnitsXDirection"],
        "6026" : ["US", "PhysicalUnitsYDirection"],
        "6028" : ["FD", "ReferencePixelPhysicalValueX"],
        "602A" : ["FD", "ReferencePixelPhysicalValueY"],
        "602C" : ["FD", "PhysicalDeltaX"],
        "602E" : ["FD", "PhysicalDeltaY"],
        "6030" : ["UL", "TransducerFrequency"],
        "6031" : ["CS", "TransducerType"],
        "6032" : ["UL", "PulseRepetitionFrequency"],
        "6034" : ["FD", "DopplerCorrectionAngle"],
        "6036" : ["FD", "SteeringAngle"],
        "6038" : ["UL", "DopplerSampleVolumeXPositionRetired"],
        "6039" : ["SL", "DopplerSampleVolumeXPosition"],
        "603A" : ["UL", "DopplerSampleVolumeYPositionRetired"],
        "603B" : ["SL", "DopplerSampleVolumeYPosition"],
        "603C" : ["UL", "TMLinePositionX0Retired"],
        "603D" : ["SL", "TMLinePositionX0"],
        "603E" : ["UL", "TMLinePositionY0Retired"],
        "603F" : ["SL", "TMLinePositionY0"],
        "6040" : ["UL", "TMLinePositionX1Retired"],
        "6041" : ["SL", "TMLinePositionX1"],
        "6042" : ["UL", "TMLinePositionY1Retired"],
        "6043" : ["SL", "TMLinePositionY1"],
        "6044" : ["US", "PixelComponentOrganization"],
        "6046" : ["UL", "PixelComponentMask"],
        "6048" : ["UL", "PixelComponentRangeStart"],
        "604A" : ["UL", "PixelComponentRangeStop"],
        "604C" : ["US", "PixelComponentPhysicalUnits"],
        "604E" : ["US", "PixelComponentDataType"],
        "6050" : ["UL", "NumberOfTableBreakPoints"],
        "6052" : ["UL", "TableOfXBreakPoints"],
        "6054" : ["FD", "TableOfYBreakPoints"],
        "6056" : ["UL", "NumberOfTableEntries"],
        "6058" : ["UL", "TableOfPixelValues"],
        "605A" : ["FL", "TableOfParameterValues"],
        "6060" : ["FL", "RWaveTimeVector"],
        "7000" : ["CS", "DetectorConditionsNominalFlag"],
        "7001" : ["DS", "DetectorTemperature"],
        "7004" : ["CS", "DetectorType"],
        "7005" : ["CS", "DetectorConfiguration"],
        "7006" : ["LT", "DetectorDescription"],
        "7008" : ["LT", "DetectorMode"],
        "700A" : ["SH", "DetectorID"],
        "700C" : ["DA", "DateOfLastDetectorCalibration"],
        "700E" : ["TM", "TimeOfLastDetectorCalibration"],
        "7010" : ["IS", "ExposuresOnDetectorSinceLastCalibration"],
        "7011" : ["IS", "ExposuresOnDetectorSinceManufactured"],
        "7012" : ["DS", "DetectorTimeSinceLastExposure"],
        "7014" : ["DS", "DetectorActiveTime"],
        "7016" : ["DS", "DetectorActivationOffsetFromExposure"],
        "701A" : ["DS", "DetectorBinning"],
        "7020" : ["DS", "DetectorElementPhysicalSize"],
        "7022" : ["DS", "DetectorElementSpacing"],
        "7024" : ["CS", "DetectorActiveShape"],
        "7026" : ["DS", "DetectorActiveDimensions"],
        "7028" : ["DS", "DetectorActiveOrigin"],
        "702A" : ["LO", "DetectorManufacturerName"],
        "702B" : ["LO", "DetectorManufacturerModelName"],
        "7030" : ["DS", "FieldOfViewOrigin"],
        "7032" : ["DS", "FieldOfViewRotation"],
        "7034" : ["CS", "FieldOfViewHorizontalFlip"],
        "7036" : ["FL", "PixelDataAreaOriginRelativeToFOV"],
        "7038" : ["FL", "PixelDataAreaRotationAngleRelativeToFOV"],
        "7040" : ["LT", "GridAbsorbingMaterial"],
        "7041" : ["LT", "GridSpacingMaterial"],
        "7042" : ["DS", "GridThickness"],
        "7044" : ["DS", "GridPitch"],
        "7046" : ["IS", "GridAspectRatio"],
        "7048" : ["DS", "GridPeriod"],
        "704C" : ["DS", "GridFocalDistance"],
        "7050" : ["CS", "FilterMaterial"],
        "7052" : ["DS", "FilterThicknessMinimum"],
        "7054" : ["DS", "FilterThicknessMaximum"],
        "7056" : ["FL", "FilterBeamPathLengthMinimum"],
        "7058" : ["FL", "FilterBeamPathLengthMaximum"],
        "7060" : ["CS", "ExposureControlMode"],
        "7062" : ["LT", "ExposureControlModeDescription"],
        "7064" : ["CS", "ExposureStatus"],
        "7065" : ["DS", "PhototimerSetting"],
        "8150" : ["DS", "ExposureTimeInuS"],
        "8151" : ["DS", "XRayTubeCurrentInuA"],
        "9004" : ["CS", "ContentQualification"],
        "9005" : ["SH", "PulseSequenceName"],
        "9006" : ["SQ", "MRImagingModifierSequence"],
        "9008" : ["CS", "EchoPulseSequence"],
        "9009" : ["CS", "InversionRecovery"],
        "9010" : ["CS", "FlowCompensation"],
        "9011" : ["CS", "MultipleSpinEcho"],
        "9012" : ["CS", "MultiPlanarExcitation"],
        "9014" : ["CS", "PhaseContrast"],
        "9015" : ["CS", "TimeOfFlightContrast"],
        "9016" : ["CS", "Spoiling"],
        "9017" : ["CS", "SteadyStatePulseSequence"],
        "9018" : ["CS", "EchoPlanarPulseSequence"],
        "9019" : ["FD", "TagAngleFirstAxis"],
        "9020" : ["CS", "MagnetizationTransfer"],
        "9021" : ["CS", "T2Preparation"],
        "9022" : ["CS", "BloodSignalNulling"],
        "9024" : ["CS", "SaturationRecovery"],
        "9025" : ["CS", "SpectrallySelectedSuppression"],
        "9026" : ["CS", "SpectrallySelectedExcitation"],
        "9027" : ["CS", "SpatialPresaturation"],
        "9028" : ["CS", "Tagging"],
        "9029" : ["CS", "OversamplingPhase"],
        "9030" : ["FD", "TagSpacingFirstDimension"],
        "9032" : ["CS", "GeometryOfKSpaceTraversal"],
        "9033" : ["CS", "SegmentedKSpaceTraversal"],
        "9034" : ["CS", "RectilinearPhaseEncodeReordering"],
        "9035" : ["FD", "TagThickness"],
        "9036" : ["CS", "PartialFourierDirection"],
        "9037" : ["CS", "CardiacSynchronizationTechnique"],
        "9041" : ["LO", "ReceiveCoilManufacturerName"],
        "9042" : ["SQ", "MRReceiveCoilSequence"],
        "9043" : ["CS", "ReceiveCoilType"],
        "9044" : ["CS", "QuadratureReceiveCoil"],
        "9045" : ["SQ", "MultiCoilDefinitionSequence"],
        "9046" : ["LO", "MultiCoilConfiguration"],
        "9047" : ["SH", "MultiCoilElementName"],
        "9048" : ["CS", "MultiCoilElementUsed"],
        "9049" : ["SQ", "MRTransmitCoilSequence"],
        "9050" : ["LO", "TransmitCoilManufacturerName"],
        "9051" : ["CS", "TransmitCoilType"],
        "9052" : ["FD", "SpectralWidth"],
        "9053" : ["FD", "ChemicalShiftReference"],
        "9054" : ["CS", "VolumeLocalizationTechnique"],
        "9058" : ["US", "MRAcquisitionFrequencyEncodingSteps"],
        "9059" : ["CS", "Decoupling"],
        "9060" : ["CS", "DecoupledNucleus"],
        "9061" : ["FD", "DecouplingFrequency"],
        "9062" : ["CS", "DecouplingMethod"],
        "9063" : ["FD", "DecouplingChemicalShiftReference"],
        "9064" : ["CS", "KSpaceFiltering"],
        "9065" : ["CS", "TimeDomainFiltering"],
        "9066" : ["US", "NumberOfZeroFills"],
        "9067" : ["CS", "BaselineCorrection"],
        "9069" : ["FD", "ParallelReductionFactorInPlane"],
        "9070" : ["FD", "CardiacRRIntervalSpecified"],
        "9073" : ["FD", "AcquisitionDuration"],
        "9074" : ["DT", "FrameAcquisitionDateTime"],
        "9075" : ["CS", "DiffusionDirectionality"],
        "9076" : ["SQ", "DiffusionGradientDirectionSequence"],
        "9077" : ["CS", "ParallelAcquisition"],
        "9078" : ["CS", "ParallelAcquisitionTechnique"],
        "9079" : ["FD", "InversionTimes"],
        "9080" : ["ST", "MetaboliteMapDescription"],
        "9081" : ["CS", "PartialFourier"],
        "9082" : ["FD", "EffectiveEchoTime"],
        "9083" : ["SQ", "MetaboliteMapCodeSequence"],
        "9084" : ["SQ", "ChemicalShiftSequence"],
        "9085" : ["CS", "CardiacSignalSource"],
        "9087" : ["FD", "DiffusionBValue"],
        "9089" : ["FD", "DiffusionGradientOrientation"],
        "9090" : ["FD", "VelocityEncodingDirection"],
        "9091" : ["FD", "VelocityEncodingMinimumValue"],
        "9092" : ["SQ", "VelocityEncodingAcquisitionSequence"],
        "9093" : ["US", "NumberOfKSpaceTrajectories"],
        "9094" : ["CS", "CoverageOfKSpace"],
        "9095" : ["UL", "SpectroscopyAcquisitionPhaseRows"],
        "9096" : ["FD", "ParallelReductionFactorInPlaneRetired"],
        "9098" : ["FD", "TransmitterFrequency"],
        "9100" : ["CS", "ResonantNucleus"],
        "9101" : ["CS", "FrequencyCorrection"],
        "9103" : ["SQ", "MRSpectroscopyFOVGeometrySequence"],
        "9104" : ["FD", "SlabThickness"],
        "9105" : ["FD", "SlabOrientation"],
        "9106" : ["FD", "MidSlabPosition"],
        "9107" : ["SQ", "MRSpatialSaturationSequence"],
        "9112" : ["SQ", "MRTimingAndRelatedParametersSequence"],
        "9114" : ["SQ", "MREchoSequence"],
        "9115" : ["SQ", "MRModifierSequence"],
        "9117" : ["SQ", "MRDiffusionSequence"],
        "9118" : ["SQ", "CardiacSynchronizationSequence"],
        "9119" : ["SQ", "MRAveragesSequence"],
        "9125" : ["SQ", "MRFOVGeometrySequence"],
        "9126" : ["SQ", "VolumeLocalizationSequence"],
        "9127" : ["UL", "SpectroscopyAcquisitionDataColumns"],
        "9147" : ["CS", "DiffusionAnisotropyType"],
        "9151" : ["DT", "FrameReferenceDateTime"],
        "9152" : ["SQ", "MRMetaboliteMapSequence"],
        "9155" : ["FD", "ParallelReductionFactorOutOfPlane"],
        "9159" : ["UL", "SpectroscopyAcquisitionOutOfPlanePhaseSteps"],
        "9166" : ["CS", "BulkMotionStatus"],
        "9168" : ["FD", "ParallelReductionFactorSecondInPlane"],
        "9169" : ["CS", "CardiacBeatRejectionTechnique"],
        "9170" : ["CS", "RespiratoryMotionCompensationTechnique"],
        "9171" : ["CS", "RespiratorySignalSource"],
        "9172" : ["CS", "BulkMotionCompensationTechnique"],
        "9173" : ["CS", "BulkMotionSignalSource"],
        "9174" : ["CS", "ApplicableSafetyStandardAgency"],
        "9175" : ["LO", "ApplicableSafetyStandardDescription"],
        "9176" : ["SQ", "OperatingModeSequence"],
        "9177" : ["CS", "OperatingModeType"],
        "9178" : ["CS", "OperatingMode"],
        "9179" : ["CS", "SpecificAbsorptionRateDefinition"],
        "9180" : ["CS", "GradientOutputType"],
        "9181" : ["FD", "SpecificAbsorptionRateValue"],
        "9182" : ["FD", "GradientOutput"],
        "9183" : ["CS", "FlowCompensationDirection"],
        "9184" : ["FD", "TaggingDelay"],
        "9185" : ["ST", "RespiratoryMotionCompensationTechniqueDescription"],
        "9186" : ["SH", "RespiratorySignalSourceID"],
        "9195" : ["FD", "ChemicalShiftMinimumIntegrationLimitInHz"],
        "9196" : ["FD", "ChemicalShiftMaximumIntegrationLimitInHz"],
        "9197" : ["SQ", "MRVelocityEncodingSequence"],
        "9198" : ["CS", "FirstOrderPhaseCorrection"],
        "9199" : ["CS", "WaterReferencedPhaseCorrection"],
        "9200" : ["CS", "MRSpectroscopyAcquisitionType"],
        "9214" : ["CS", "RespiratoryCyclePosition"],
        "9217" : ["FD", "VelocityEncodingMaximumValue"],
        "9218" : ["FD", "TagSpacingSecondDimension"],
        "9219" : ["SS", "TagAngleSecondAxis"],
        "9220" : ["FD", "FrameAcquisitionDuration"],
        "9226" : ["SQ", "MRImageFrameTypeSequence"],
        "9227" : ["SQ", "MRSpectroscopyFrameTypeSequence"],
        "9231" : ["US", "MRAcquisitionPhaseEncodingStepsInPlane"],
        "9232" : ["US", "MRAcquisitionPhaseEncodingStepsOutOfPlane"],
        "9234" : ["UL", "SpectroscopyAcquisitionPhaseColumns"],
        "9236" : ["CS", "CardiacCyclePosition"],
        "9239" : ["SQ", "SpecificAbsorptionRateSequence"],
        "9240" : ["US", "RFEchoTrainLength"],
        "9241" : ["US", "GradientEchoTrainLength"],
        "9250" : ["CS", "ArterialSpinLabelingContrast"],
        "9251" : ["SQ", "MRArterialSpinLabelingSequence"],
        "9252" : ["LO", "ASLTechniqueDescription"],
        "9253" : ["US", "ASLSlabNumber"],
        "9254" : ["FD ", "ASLSlabThickness"],
        "9255" : ["FD ", "ASLSlabOrientation"],
        "9256" : ["FD ", "ASLMidSlabPosition"],
        "9257" : ["CS", "ASLContext"],
        "9258" : ["UL", "ASLPulseTrainDuration"],
        "9259" : ["CS", "ASLCrusherFlag"],
        "925A" : ["FD", "ASLCrusherFlow"],
        "925B" : ["LO", "ASLCrusherDescription"],
        "925C" : ["CS", "ASLBolusCutoffFlag"],
        "925D" : ["SQ", "ASLBolusCutoffTimingSequence"],
        "925E" : ["LO", "ASLBolusCutoffTechnique"],
        "925F" : ["UL", "ASLBolusCutoffDelayTime"],
        "9260" : ["SQ", "ASLSlabSequence"],
        "9295" : ["FD", "ChemicalShiftMinimumIntegrationLimitInppm"],
        "9296" : ["FD", "ChemicalShiftMaximumIntegrationLimitInppm"],
        "9301" : ["SQ", "CTAcquisitionTypeSequence"],
        "9302" : ["CS", "AcquisitionType"],
        "9303" : ["FD", "TubeAngle"],
        "9304" : ["SQ", "CTAcquisitionDetailsSequence"],
        "9305" : ["FD", "RevolutionTime"],
        "9306" : ["FD", "SingleCollimationWidth"],
        "9307" : ["FD", "TotalCollimationWidth"],
        "9308" : ["SQ", "CTTableDynamicsSequence"],
        "9309" : ["FD", "TableSpeed"],
        "9310" : ["FD", "TableFeedPerRotation"],
        "9311" : ["FD", "SpiralPitchFactor"],
        "9312" : ["SQ", "CTGeometrySequence"],
        "9313" : ["FD", "DataCollectionCenterPatient"],
        "9314" : ["SQ", "CTReconstructionSequence"],
        "9315" : ["CS", "ReconstructionAlgorithm"],
        "9316" : ["CS", "ConvolutionKernelGroup"],
        "9317" : ["FD", "ReconstructionFieldOfView"],
        "9318" : ["FD", "ReconstructionTargetCenterPatient"],
        "9319" : ["FD", "ReconstructionAngle"],
        "9320" : ["SH", "ImageFilter"],
        "9321" : ["SQ", "CTExposureSequence"],
        "9322" : ["FD", "ReconstructionPixelSpacing"],
        "9323" : ["CS", "ExposureModulationType"],
        "9324" : ["FD", "EstimatedDoseSaving"],
        "9325" : ["SQ", "CTXRayDetailsSequence"],
        "9326" : ["SQ", "CTPositionSequence"],
        "9327" : ["FD", "TablePosition"],
        "9328" : ["FD", "ExposureTimeInms"],
        "9329" : ["SQ", "CTImageFrameTypeSequence"],
        "9330" : ["FD", "XRayTubeCurrentInmA"],
        "9332" : ["FD", "ExposureInmAs"],
        "9333" : ["CS", "ConstantVolumeFlag"],
        "9334" : ["CS", "FluoroscopyFlag"],
        "9335" : ["FD", "DistanceSourceToDataCollectionCenter"],
        "9337" : ["US", "ContrastBolusAgentNumber"],
        "9338" : ["SQ", "ContrastBolusIngredientCodeSequence"],
        "9340" : ["SQ", "ContrastAdministrationProfileSequence"],
        "9341" : ["SQ", "ContrastBolusUsageSequence"],
        "9342" : ["CS", "ContrastBolusAgentAdministered"],
        "9343" : ["CS", "ContrastBolusAgentDetected"],
        "9344" : ["CS", "ContrastBolusAgentPhase"],
        "9345" : ["FD", "CTDIvol"],
        "9346" : ["SQ", "CTDIPhantomTypeCodeSequence"],
        "9351" : ["FL", "CalciumScoringMassFactorPatient"],
        "9352" : ["FL", "CalciumScoringMassFactorDevice"],
        "9353" : ["FL", "EnergyWeightingFactor"],
        "9360" : ["SQ", "CTAdditionalXRaySourceSequence"],
        "9401" : ["SQ", "ProjectionPixelCalibrationSequence"],
        "9402" : ["FL", "DistanceSourceToIsocenter"],
        "9403" : ["FL", "DistanceObjectToTableTop"],
        "9404" : ["FL", "ObjectPixelSpacingInCenterOfBeam"],
        "9405" : ["SQ", "PositionerPositionSequence"],
        "9406" : ["SQ", "TablePositionSequence"],
        "9407" : ["SQ", "CollimatorShapeSequence"],
        "9410" : ["CS", "PlanesInAcquisition"],
        "9412" : ["SQ", "XAXRFFrameCharacteristicsSequence"],
        "9417" : ["SQ", "FrameAcquisitionSequence"],
        "9420" : ["CS", "XRayReceptorType"],
        "9423" : ["LO", "AcquisitionProtocolName"],
        "9424" : ["LT", "AcquisitionProtocolDescription"],
        "9425" : ["CS", "ContrastBolusIngredientOpaque"],
        "9426" : ["FL", "DistanceReceptorPlaneToDetectorHousing"],
        "9427" : ["CS", "IntensifierActiveShape"],
        "9428" : ["FL", "IntensifierActiveDimensions"],
        "9429" : ["FL", "PhysicalDetectorSize"],
        "9430" : ["FL", "PositionOfIsocenterProjection"],
        "9432" : ["SQ", "FieldOfViewSequence"],
        "9433" : ["LO", "FieldOfViewDescription"],
        "9434" : ["SQ", "ExposureControlSensingRegionsSequence"],
        "9435" : ["CS", "ExposureControlSensingRegionShape"],
        "9436" : ["SS", "ExposureControlSensingRegionLeftVerticalEdge"],
        "9437" : ["SS", "ExposureControlSensingRegionRightVerticalEdge"],
        "9438" : ["SS", "ExposureControlSensingRegionUpperHorizontalEdge"],
        "9439" : ["SS", "ExposureControlSensingRegionLowerHorizontalEdge"],
        "9440" : ["SS", "CenterOfCircularExposureControlSensingRegion"],
        "9441" : ["US", "RadiusOfCircularExposureControlSensingRegion"],
        "9442" : ["SS", "VerticesOfThePolygonalExposureControlSensingRegion"],
        "9447" : ["FL", "ColumnAngulationPatient"],
        "9449" : ["FL", "BeamAngle"],
        "9451" : ["SQ", "FrameDetectorParametersSequence"],
        "9452" : ["FL", "CalculatedAnatomyThickness"],
        "9455" : ["SQ", "CalibrationSequence"],
        "9456" : ["SQ", "ObjectThicknessSequence"],
        "9457" : ["CS", "PlaneIdentification"],
        "9461" : ["FL", "FieldOfViewDimensionsInFloat"],
        "9462" : ["SQ", "IsocenterReferenceSystemSequence"],
        "9463" : ["FL", "PositionerIsocenterPrimaryAngle"],
        "9464" : ["FL", "PositionerIsocenterSecondaryAngle"],
        "9465" : ["FL", "PositionerIsocenterDetectorRotationAngle"],
        "9466" : ["FL", "TableXPositionToIsocenter"],
        "9467" : ["FL", "TableYPositionToIsocenter"],
        "9468" : ["FL", "TableZPositionToIsocenter"],
        "9469" : ["FL", "TableHorizontalRotationAngle"],
        "9470" : ["FL", "TableHeadTiltAngle"],
        "9471" : ["FL", "TableCradleTiltAngle"],
        "9472" : ["SQ", "FrameDisplayShutterSequence"],
        "9473" : ["FL", "AcquiredImageAreaDoseProduct"],
        "9474" : ["CS", "CArmPositionerTabletopRelationship"],
        "9476" : ["SQ", "XRayGeometrySequence"],
        "9477" : ["SQ", "IrradiationEventIdentificationSequence"],
        "9504" : ["SQ", "XRay3DFrameTypeSequence"],
        "9506" : ["SQ", "ContributingSourcesSequence"],
        "9507" : ["SQ", "XRay3DAcquisitionSequence"],
        "9508" : ["FL", "PrimaryPositionerScanArc"],
        "9509" : ["FL", "SecondaryPositionerScanArc"],
        "9510" : ["FL ", "PrimaryPositionerScanStartAngle"],
        "9511" : ["FL", "SecondaryPositionerScanStartAngle"],
        "9514" : ["FL", "PrimaryPositionerIncrement"],
        "9515" : ["FL", "SecondaryPositionerIncrement"],
        "9516" : ["DT", "StartAcquisitionDateTime"],
        "9517" : ["DT", "EndAcquisitionDateTime"],
        "9524" : ["LO", "ApplicationName"],
        "9525" : ["LO", "ApplicationVersion"],
        "9526" : ["LO", "ApplicationManufacturer"],
        "9527" : ["CS", "AlgorithmType"],
        "9528" : ["LO", "AlgorithmDescription"],
        "9530" : ["SQ", "XRay3DReconstructionSequence"],
        "9531" : ["LO", "ReconstructionDescription"],
        "9538" : ["SQ", "PerProjectionAcquisitionSequence"],
        "9601" : ["SQ", "DiffusionBMatrixSequence"],
        "9602" : ["FD", "DiffusionBValueXX"],
        "9603" : ["FD", "DiffusionBValueXY"],
        "9604" : ["FD", "DiffusionBValueXZ"],
        "9605" : ["FD", "DiffusionBValueYY"],
        "9606" : ["FD", "DiffusionBValueYZ"],
        "9607" : ["FD", "DiffusionBValueZZ"],
        "9701" : ["DT", "DecayCorrectionDateTime"],
        "9715" : ["FD", "StartDensityThreshold"],
        "9716" : ["FD", "StartRelativeDensityDifferenceThreshold"],
        "9717" : ["FD", "StartCardiacTriggerCountThreshold"],
        "9718" : ["FD", "StartRespiratoryTriggerCountThreshold"],
        "9719" : ["FD", "TerminationCountsThreshold"],
        "9720" : ["FD", "TerminationDensityThreshold"],
        "9721" : ["FD", "TerminationRelativeDensityThreshold"],
        "9722" : ["FD", "TerminationTimeThreshold"],
        "9723" : ["FD", "TerminationCardiacTriggerCountThreshold"],
        "9724" : ["FD", "TerminationRespiratoryTriggerCountThreshold"],
        "9725" : ["CS", "DetectorGeometry"],
        "9726" : ["FD", "TransverseDetectorSeparation"],
        "9727" : ["FD", "AxialDetectorDimension"],
        "9729" : ["US", "RadiopharmaceuticalAgentNumber"],
        "9732" : ["SQ", "PETFrameAcquisitionSequence"],
        "9733" : ["SQ", "PETDetectorMotionDetailsSequence"],
        "9734" : ["SQ", "PETTableDynamicsSequence"],
        "9735" : ["SQ", "PETPositionSequence"],
        "9736" : ["SQ", "PETFrameCorrectionFactorsSequence"],
        "9737" : ["SQ", "RadiopharmaceuticalUsageSequence"],
        "9738" : ["CS", "AttenuationCorrectionSource"],
        "9739" : ["US", "NumberOfIterations"],
        "9740" : ["US", "NumberOfSubsets"],
        "9749" : ["SQ", "PETReconstructionSequence"],
        "9751" : ["SQ", "PETFrameTypeSequence"],
        "9755" : ["CS", "TimeOfFlightInformationUsed"],
        "9756" : ["CS", "ReconstructionType"],
        "9758" : ["CS", "DecayCorrected"],
        "9759" : ["CS", "AttenuationCorrected"],
        "9760" : ["CS", "ScatterCorrected"],
        "9761" : ["CS", "DeadTimeCorrected"],
        "9762" : ["CS", "GantryMotionCorrected"],
        "9763" : ["CS", "PatientMotionCorrected"],
        "9764" : ["CS", "CountLossNormalizationCorrected"],
        "9765" : ["CS", "RandomsCorrected"],
        "9766" : ["CS", "NonUniformRadialSamplingCorrected"],
        "9767" : ["CS", "SensitivityCalibrated"],
        "9768" : ["CS", "DetectorNormalizationCorrection"],
        "9769" : ["CS", "IterativeReconstructionMethod"],
        "9770" : ["CS", "AttenuationCorrectionTemporalRelationship"],
        "9771" : ["SQ", "PatientPhysiologicalStateSequence"],
        "9772" : ["SQ", "PatientPhysiologicalStateCodeSequence"],
        "9801" : ["FD", "DepthsOfFocus"],
        "9803" : ["SQ", "ExcludedIntervalsSequence"],
        "9804" : ["DT", "ExclusionStartDatetime"],
        "9805" : ["FD", "ExclusionDuration"],
        "9806" : ["SQ", "USImageDescriptionSequence"],
        "9807" : ["SQ", "ImageDataTypeSequence"],
        "9808" : ["CS", "DataType"],
        "9809" : ["SQ", "TransducerScanPatternCodeSequence"],
        "980B" : ["CS", "AliasedDataType"],
        "980C" : ["CS", "PositionMeasuringDeviceUsed"],
        "980D" : ["SQ", "TransducerGeometryCodeSequence"],
        "980E" : ["SQ", "TransducerBeamSteeringCodeSequence"],
        "980F" : ["SQ", "TransducerApplicationCodeSequence"],
        "A001" : ["SQ", "ContributingEquipmentSequence"],
        "A002" : ["DT", "ContributionDateTime"],
        "A003" : ["ST", "ContributionDescription"]
    },
    "0020" : {
        "000D" : ["UI", "StudyInstanceUID"],
        "000E" : ["UI", "SeriesInstanceUID"],
        "0010" : ["SH", "StudyID"],
        "0011" : ["IS", "SeriesNumber"],
        "0012" : ["IS", "AcquisitionNumber"],
        "0013" : ["IS", "InstanceNumber"],
        "0014" : ["IS", "IsotopeNumber"],
        "0015" : ["IS", "PhaseNumber"],
        "0016" : ["IS", "IntervalNumber"],
        "0017" : ["IS", "TimeSlotNumber"],
        "0018" : ["IS", "AngleNumber"],
        "0019" : ["IS", "ItemNumber"],
        "0020" : ["CS", "PatientOrientation"],
        "0022" : ["IS", "OverlayNumber"],
        "0024" : ["IS", "CurveNumber"],
        "0026" : ["IS", "LUTNumber"],
        "0030" : ["DS", "ImagePosition"],
        "0032" : ["DS", "ImagePositionPatient"],
        "0035" : ["DS", "ImageOrientation"],
        "0037" : ["DS", "ImageOrientationPatient"],
        "0050" : ["DS", "Location"],
        "0052" : ["UI", "FrameOfReferenceUID"],
        "0060" : ["CS", "Laterality"],
        "0062" : ["CS", "ImageLaterality"],
        "0070" : ["LO", "ImageGeometryType"],
        "0080" : ["CS", "MaskingImage"],
        "00AA" : ["IS", "ReportNumber"],
        "0100" : ["IS", "TemporalPositionIdentifier"],
        "0105" : ["IS", "NumberOfTemporalPositions"],
        "0110" : ["DS", "TemporalResolution"],
        "0200" : ["UI", "SynchronizationFrameOfReferenceUID"],
        "0242" : ["UI", "SOPInstanceUIDOfConcatenationSource"],
        "1000" : ["IS", "SeriesInStudy"],
        "1001" : ["IS", "AcquisitionsInSeries"],
        "1002" : ["IS", "ImagesInAcquisition"],
        "1003" : ["IS", "ImagesInSeries"],
        "1004" : ["IS", "AcquisitionsInStudy"],
        "1005" : ["IS", "ImagesInStudy"],
        "1020" : ["LO", "Reference"],
        "1040" : ["LO", "PositionReferenceIndicator"],
        "1041" : ["DS", "SliceLocation"],
        "1070" : ["IS", "OtherStudyNumbers"],
        "1200" : ["IS", "NumberOfPatientRelatedStudies"],
        "1202" : ["IS", "NumberOfPatientRelatedSeries"],
        "1204" : ["IS", "NumberOfPatientRelatedInstances"],
        "1206" : ["IS", "NumberOfStudyRelatedSeries"],
        "1208" : ["IS", "NumberOfStudyRelatedInstances"],
        "1209" : ["IS", "NumberOfSeriesRelatedInstances"],
        "3401" : ["CS", "ModifyingDeviceID"],
        "3402" : ["CS", "ModifiedImageID"],
        "3403" : ["DA", "ModifiedImageDate"],
        "3404" : ["LO", "ModifyingDeviceManufacturer"],
        "3405" : ["TM", "ModifiedImageTime"],
        "3406" : ["LO", "ModifiedImageDescription"],
        "4000" : ["LT", "ImageComments"],
        "5000" : ["AT", "OriginalImageIdentification"],
        "5002" : ["LO", "OriginalImageIdentificationNomenclature"],
        "9056" : ["SH", "StackID"],
        "9057" : ["UL", "InStackPositionNumber"],
        "9071" : ["SQ", "FrameAnatomySequence"],
        "9072" : ["CS", "FrameLaterality"],
        "9111" : ["SQ", "FrameContentSequence"],
        "9113" : ["SQ", "PlanePositionSequence"],
        "9116" : ["SQ", "PlaneOrientationSequence"],
        "9128" : ["UL", "TemporalPositionIndex"],
        "9153" : ["FD", "NominalCardiacTriggerDelayTime"],
        "9154" : ["FL", "NominalCardiacTriggerTimePriorToRPeak"],
        "9155" : ["FL", "ActualCardiacTriggerTimePriorToRPeak"],
        "9156" : ["US", "FrameAcquisitionNumber"],
        "9157" : ["UL", "DimensionIndexValues"],
        "9158" : ["LT", "FrameComments"],
        "9161" : ["UI", "ConcatenationUID"],
        "9162" : ["US", "InConcatenationNumber"],
        "9163" : ["US", "InConcatenationTotalNumber"],
        "9164" : ["UI", "DimensionOrganizationUID"],
        "9165" : ["AT", "DimensionIndexPointer"],
        "9167" : ["AT", "FunctionalGroupPointer"],
        "9213" : ["LO", "DimensionIndexPrivateCreator"],
        "9221" : ["SQ", "DimensionOrganizationSequence"],
        "9222" : ["SQ", "DimensionIndexSequence"],
        "9228" : ["UL", "ConcatenationFrameOffsetNumber"],
        "9238" : ["LO", "FunctionalGroupPrivateCreator"],
        "9241" : ["FL", "NominalPercentageOfCardiacPhase"],
        "9245" : ["FL", "NominalPercentageOfRespiratoryPhase"],
        "9246" : ["FL", "StartingRespiratoryAmplitude"],
        "9247" : ["CS", "StartingRespiratoryPhase"],
        "9248" : ["FL", "EndingRespiratoryAmplitude"],
        "9249" : ["CS", "EndingRespiratoryPhase"],
        "9250" : ["CS", "RespiratoryTriggerType"],
        "9251" : ["FD", "RRIntervalTimeNominal"],
        "9252" : ["FD", "ActualCardiacTriggerDelayTime"],
        "9253" : ["SQ", "RespiratorySynchronizationSequence"],
        "9254" : ["FD", "RespiratoryIntervalTime"],
        "9255" : ["FD", "NominalRespiratoryTriggerDelayTime"],
        "9256" : ["FD", "RespiratoryTriggerDelayThreshold"],
        "9257" : ["FD", "ActualRespiratoryTriggerDelayTime"],
        "9301" : ["FD", "ImagePositionVolume"],
        "9302" : ["FD", "ImageOrientationVolume"],
        "9307" : ["CS", "UltrasoundAcquisitionGeometry"],
        "9308" : ["FD", "ApexPosition"],
        "9309" : ["FD", "VolumeToTransducerMappingMatrix"],
        "930A" : ["FD", "VolumeToTableMappingMatrix"],
        "930C" : ["CS", "PatientFrameOfReferenceSource"],
        "930D" : ["FD", "TemporalPositionTimeOffset"],
        "930E" : ["SQ", "PlanePositionVolumeSequence"],
        "930F" : ["SQ", "PlaneOrientationVolumeSequence"],
        "9310" : ["SQ", "TemporalPositionSequence"],
        "9311" : ["CS", "DimensionOrganizationType"],
        "9312" : ["UI", "VolumeFrameOfReferenceUID"],
        "9313" : ["UI", "TableFrameOfReferenceUID"],
        "9421" : ["LO", "DimensionDescriptionLabel"],
        "9450" : ["SQ", "PatientOrientationInFrameSequence"],
        "9453" : ["LO", "FrameLabel"],
        "9518" : ["US", "AcquisitionIndex"],
        "9529" : ["SQ", "ContributingSOPInstancesReferenceSequence"],
        "9536" : ["US", "ReconstructionIndex"]
    },
    "0022" : {
        "0001" : ["US", "LightPathFilterPassThroughWavelength"],
        "0002" : ["US", "LightPathFilterPassBand"],
        "0003" : ["US", "ImagePathFilterPassThroughWavelength"],
        "0004" : ["US", "ImagePathFilterPassBand"],
        "0005" : ["CS", "PatientEyeMovementCommanded"],
        "0006" : ["SQ", "PatientEyeMovementCommandCodeSequence"],
        "0007" : ["FL", "SphericalLensPower"],
        "0008" : ["FL", "CylinderLensPower"],
        "0009" : ["FL", "CylinderAxis"],
        "000A" : ["FL", "EmmetropicMagnification"],
        "000B" : ["FL", "IntraOcularPressure"],
        "000C" : ["FL", "HorizontalFieldOfView"],
        "000D" : ["CS", "PupilDilated"],
        "000E" : ["FL", "DegreeOfDilation"],
        "0010" : ["FL", "StereoBaselineAngle"],
        "0011" : ["FL", "StereoBaselineDisplacement"],
        "0012" : ["FL", "StereoHorizontalPixelOffset"],
        "0013" : ["FL", "StereoVerticalPixelOffset"],
        "0014" : ["FL", "StereoRotation"],
        "0015" : ["SQ", "AcquisitionDeviceTypeCodeSequence"],
        "0016" : ["SQ", "IlluminationTypeCodeSequence"],
        "0017" : ["SQ", "LightPathFilterTypeStackCodeSequence"],
        "0018" : ["SQ", "ImagePathFilterTypeStackCodeSequence"],
        "0019" : ["SQ", "LensesCodeSequence"],
        "001A" : ["SQ", "ChannelDescriptionCodeSequence"],
        "001B" : ["SQ", "RefractiveStateSequence"],
        "001C" : ["SQ", "MydriaticAgentCodeSequence"],
        "001D" : ["SQ", "RelativeImagePositionCodeSequence"],
        "001E" : ["FL", "CameraAngleOfView"],
        "0020" : ["SQ", "StereoPairsSequence"],
        "0021" : ["SQ", "LeftImageSequence"],
        "0022" : ["SQ", "RightImageSequence"],
        "0030" : ["FL", "AxialLengthOfTheEye"],
        "0031" : ["SQ", "OphthalmicFrameLocationSequence"],
        "0032" : ["FL", "ReferenceCoordinates"],
        "0035" : ["FL", "DepthSpatialResolution"],
        "0036" : ["FL", "MaximumDepthDistortion"],
        "0037" : ["FL", "AlongScanSpatialResolution"],
        "0038" : ["FL", "MaximumAlongScanDistortion"],
        "0039" : ["CS", "OphthalmicImageOrientation"],
        "0041" : ["FL", "DepthOfTransverseImage"],
        "0042" : ["SQ", "MydriaticAgentConcentrationUnitsSequence"],
        "0048" : ["FL", "AcrossScanSpatialResolution"],
        "0049" : ["FL", "MaximumAcrossScanDistortion"],
        "004E" : ["DS", "MydriaticAgentConcentration"],
        "0055" : ["FL", "IlluminationWaveLength"],
        "0056" : ["FL", "IlluminationPower"],
        "0057" : ["FL", "IlluminationBandwidth"],
        "0058" : ["SQ", "MydriaticAgentSequence"],
        "1007" : ["SQ", "OphthalmicAxialMeasurementsRightEyeSequence"],
        "1008" : ["SQ", "OphthalmicAxialMeasurementsLeftEyeSequence"],
        "1010" : ["CS", "OphthalmicAxialLengthMeasurementsType"],
        "1019" : ["FL", "OphthalmicAxialLength"],
        "1024" : ["SQ", "LensStatusCodeSequence"],
        "1025" : ["SQ", "VitreousStatusCodeSequence"],
        "1028" : ["SQ", "IOLFormulaCodeSequence"],
        "1029" : ["LO", "IOLFormulaDetail"],
        "1033" : ["FL", "KeratometerIndex"],
        "1035" : ["SQ", "SourceOfOphthalmicAxialLengthCodeSequence"],
        "1037" : ["FL", "TargetRefraction"],
        "1039" : ["CS", "RefractiveProcedureOccurred"],
        "1040" : ["SQ", "RefractiveSurgeryTypeCodeSequence"],
        "1044" : ["SQ", "OphthalmicUltrasoundAxialMeasurementsTypeCodeSequence"],
        "1050" : ["SQ", "OphthalmicAxialLengthMeasurementsSequence"],
        "1053" : ["FL", "IOLPower"],
        "1054" : ["FL", "PredictedRefractiveError"],
        "1059" : ["FL", "OphthalmicAxialLengthVelocity"],
        "1065" : ["LO", "LensStatusDescription"],
        "1066" : ["LO", "VitreousStatusDescription"],
        "1090" : ["SQ", "IOLPowerSequence"],
        "1092" : ["SQ", "LensConstantSequence"],
        "1093" : ["LO", "IOLManufacturer"],
        "1094" : ["LO", "LensConstantDescription"],
        "1096" : ["SQ", "KeratometryMeasurementTypeCodeSequence"],
        "1100" : ["SQ", "ReferencedOphthalmicAxialMeasurementsSequence"],
        "1101" : ["SQ", "OphthalmicAxialLengthMeasurementsSegmentNameCodeSequence"],
        "1103" : ["SQ", "RefractiveErrorBeforeRefractiveSurgeryCodeSequence"],
        "1121" : ["FL", "IOLPowerForExactEmmetropia"],
        "1122" : ["FL", "IOLPowerForExactTargetRefraction"],
        "1125" : ["SQ", "AnteriorChamberDepthDefinitionCodeSequence"],
        "1130" : ["FL", "LensThickness"],
        "1131" : ["FL", "AnteriorChamberDepth"],
        "1132" : ["SQ", "SourceOfLensThicknessDataCodeSequence"],
        "1133" : ["SQ", "SourceOfAnteriorChamberDepthDataCodeSequence"],
        "1135" : ["SQ", "SourceOfRefractiveErrorDataCodeSequence"],
        "1140" : ["CS", "OphthalmicAxialLengthMeasurementModified"],
        "1150" : ["SQ", "OphthalmicAxialLengthDataSourceCodeSequence"],
        "1153" : ["SQ", "OphthalmicAxialLengthAcquisitionMethodCodeSequence"],
        "1155" : ["FL", "SignalToNoiseRatio"],
        "1159" : ["LO", "OphthalmicAxialLengthDataSourceDescription"],
        "1210" : ["SQ", "OphthalmicAxialLengthMeasurementsTotalLengthSequence"],
        "1211" : ["SQ", "OphthalmicAxialLengthMeasurementsSegmentalLengthSequence"],
        "1212" : ["SQ", "OphthalmicAxialLengthMeasurementsLengthSummationSequence"],
        "1220" : ["SQ", "UltrasoundOphthalmicAxialLengthMeasurementsSequence"],
        "1225" : ["SQ", "OpticalOphthalmicAxialLengthMeasurementsSequence"],
        "1230" : ["SQ", "UltrasoundSelectedOphthalmicAxialLengthSequence"],
        "1250" : ["SQ", "OphthalmicAxialLengthSelectionMethodCodeSequence"],
        "1255" : ["SQ", "OpticalSelectedOphthalmicAxialLengthSequence"],
        "1257" : ["SQ", "SelectedSegmentalOphthalmicAxialLengthSequence"],
        "1260" : ["SQ", "SelectedTotalOphthalmicAxialLengthSequence"],
        "1262" : ["SQ", "OphthalmicAxialLengthQualityMetricSequence"],
        "1273" : ["LO", "OphthalmicAxialLengthQualityMetricTypeDescription"],
        "1300" : ["SQ", "IntraocularLensCalculationsRightEyeSequence"],
        "1310" : ["SQ", "IntraocularLensCalculationsLeftEyeSequence"],
        "1330" : ["SQ", "ReferencedOphthalmicAxialLengthMeasurementQCImageSequence"]
    },
    "0024" : {
        "0010" : ["FL", "VisualFieldHorizontalExtent"],
        "0011" : ["FL", "VisualFieldVerticalExtent"],
        "0012" : ["CS", "VisualFieldShape"],
        "0016" : ["SQ", "ScreeningTestModeCodeSequence"],
        "0018" : ["FL", "MaximumStimulusLuminance"],
        "0020" : ["FL", "BackgroundLuminance"],
        "0021" : ["SQ", "StimulusColorCodeSequence"],
        "0024" : ["SQ", "BackgroundIlluminationColorCodeSequence"],
        "0025" : ["FL", "StimulusArea"],
        "0028" : ["FL", "StimulusPresentationTime"],
        "0032" : ["SQ", "FixationSequence"],
        "0033" : ["SQ", "FixationMonitoringCodeSequence"],
        "0034" : ["SQ", "VisualFieldCatchTrialSequence"],
        "0035" : ["US", "FixationCheckedQuantity"],
        "0036" : ["US", "PatientNotProperlyFixatedQuantity"],
        "0037" : ["CS", "PresentedVisualStimuliDataFlag"],
        "0038" : ["US", "NumberOfVisualStimuli"],
        "0039" : ["CS", "ExcessiveFixationLossesDataFlag"],
        "0040" : ["CS", "ExcessiveFixationLosses"],
        "0042" : ["US", "StimuliRetestingQuantity"],
        "0044" : ["LT", "CommentsOnPatientPerformanceOfVisualField"],
        "0045" : ["CS", "FalseNegativesEstimateFlag"],
        "0046" : ["FL", "FalseNegativesEstimate"],
        "0048" : ["US", "NegativeCatchTrialsQuantity"],
        "0050" : ["US", "FalseNegativesQuantity"],
        "0051" : ["CS", "ExcessiveFalseNegativesDataFlag"],
        "0052" : ["CS", "ExcessiveFalseNegatives"],
        "0053" : ["CS", "FalsePositivesEstimateFlag"],
        "0054" : ["FL", "FalsePositivesEstimate"],
        "0055" : ["CS", "CatchTrialsDataFlag"],
        "0056" : ["US", "PositiveCatchTrialsQuantity"],
        "0057" : ["CS", "TestPointNormalsDataFlag"],
        "0058" : ["SQ", "TestPointNormalsSequence"],
        "0059" : ["CS", "GlobalDeviationProbabilityNormalsFlag"],
        "0060" : ["US", "FalsePositivesQuantity"],
        "0061" : ["CS", "ExcessiveFalsePositivesDataFlag"],
        "0062" : ["CS", "ExcessiveFalsePositives"],
        "0063" : ["CS", "VisualFieldTestNormalsFlag"],
        "0064" : ["SQ", "ResultsNormalsSequence"],
        "0065" : ["SQ", "AgeCorrectedSensitivityDeviationAlgorithmSequence"],
        "0066" : ["FL", "GlobalDeviationFromNormal"],
        "0067" : ["SQ", "GeneralizedDefectSensitivityDeviationAlgorithmSequence"],
        "0068" : ["FL", "LocalizedDeviationfromNormal"],
        "0069" : ["LO", "PatientReliabilityIndicator"],
        "0070" : ["FL", "VisualFieldMeanSensitivity"],
        "0071" : ["FL", "GlobalDeviationProbability"],
        "0072" : ["CS", "LocalDeviationProbabilityNormalsFlag"],
        "0073" : ["FL", "LocalizedDeviationProbability"],
        "0074" : ["CS", "ShortTermFluctuationCalculated"],
        "0075" : ["FL", "ShortTermFluctuation"],
        "0076" : ["CS", "ShortTermFluctuationProbabilityCalculated"],
        "0077" : ["FL", "ShortTermFluctuationProbability"],
        "0078" : ["CS", "CorrectedLocalizedDeviationFromNormalCalculated"],
        "0079" : ["FL", "CorrectedLocalizedDeviationFromNormal"],
        "0080" : ["CS", "CorrectedLocalizedDeviationFromNormalProbabilityCalculated"],
        "0081" : ["FL", "CorrectedLocalizedDeviationFromNormalProbability"],
        "0083" : ["SQ", "GlobalDeviationProbabilitySequence"],
        "0085" : ["SQ", "LocalizedDeviationProbabilitySequence"],
        "0086" : ["CS", "FovealSensitivityMeasured"],
        "0087" : ["FL", "FovealSensitivity"],
        "0088" : ["FL", "VisualFieldTestDuration"],
        "0089" : ["SQ", "VisualFieldTestPointSequence"],
        "0090" : ["FL", "VisualFieldTestPointXCoordinate"],
        "0091" : ["FL", "VisualFieldTestPointYCoordinate"],
        "0092" : ["FL", "AgeCorrectedSensitivityDeviationValue"],
        "0093" : ["CS", "StimulusResults"],
        "0094" : ["FL", "SensitivityValue"],
        "0095" : ["CS", "RetestStimulusSeen"],
        "0096" : ["FL", "RetestSensitivityValue"],
        "0097" : ["SQ", "VisualFieldTestPointNormalsSequence"],
        "0098" : ["FL", "QuantifiedDefect"],
        "0100" : ["FL", "AgeCorrectedSensitivityDeviationProbabilityValue"],
        "0102" : ["CS", "GeneralizedDefectCorrectedSensitivityDeviationFlag "],
        "0103" : ["FL", "GeneralizedDefectCorrectedSensitivityDeviationValue "],
        "0104" : ["FL", "GeneralizedDefectCorrectedSensitivityDeviationProbabilityValue"],
        "0105" : ["FL ", "MinimumSensitivityValue"],
        "0106" : ["CS", "BlindSpotLocalized"],
        "0107" : ["FL", "BlindSpotXCoordinate"],
        "0108" : ["FL", "BlindSpotYCoordinate "],
        "0110" : ["SQ", "VisualAcuityMeasurementSequence"],
        "0112" : ["SQ", "RefractiveParametersUsedOnPatientSequence"],
        "0113" : ["CS", "MeasurementLaterality"],
        "0114" : ["SQ", "OphthalmicPatientClinicalInformationLeftEyeSequence"],
        "0115" : ["SQ", "OphthalmicPatientClinicalInformationRightEyeSequence"],
        "0117" : ["CS", "FovealPointNormativeDataFlag"],
        "0118" : ["FL", "FovealPointProbabilityValue"],
        "0120" : ["CS", "ScreeningBaselineMeasured"],
        "0122" : ["SQ", "ScreeningBaselineMeasuredSequence"],
        "0124" : ["CS", "ScreeningBaselineType"],
        "0126" : ["FL", "ScreeningBaselineValue"],
        "0202" : ["LO", "AlgorithmSource"],
        "0306" : ["LO", "DataSetName"],
        "0307" : ["LO", "DataSetVersion"],
        "0308" : ["LO", "DataSetSource"],
        "0309" : ["LO", "DataSetDescription"],
        "0317" : ["SQ", "VisualFieldTestReliabilityGlobalIndexSequence"],
        "0320" : ["SQ", "VisualFieldGlobalResultsIndexSequence"],
        "0325" : ["SQ", "DataObservationSequence"],
        "0338" : ["CS", "IndexNormalsFlag"],
        "0341" : ["FL", "IndexProbability"],
        "0344" : ["SQ", "IndexProbabilitySequence"]
    },
    "0028" : {
        "0002" : ["US", "SamplesPerPixel"],
        "0003" : ["US", "SamplesPerPixelUsed"],
        "0004" : ["CS", "PhotometricInterpretation"],
        "0005" : ["US", "ImageDimensions"],
        "0006" : ["US", "PlanarConfiguration"],
        "0008" : ["IS", "NumberOfFrames"],
        "0009" : ["AT", "FrameIncrementPointer"],
        "000A" : ["AT", "FrameDimensionPointer"],
        "0010" : ["US", "Rows"],
        "0011" : ["US", "Columns"],
        "0012" : ["US", "Planes"],
        "0014" : ["US", "UltrasoundColorDataPresent"],
        "0030" : ["DS", "PixelSpacing"],
        "0031" : ["DS", "ZoomFactor"],
        "0032" : ["DS", "ZoomCenter"],
        "0034" : ["IS", "PixelAspectRatio"],
        "0040" : ["CS", "ImageFormat"],
        "0050" : ["LO", "ManipulatedImage"],
        "0051" : ["CS", "CorrectedImage"],
        "005F" : ["LO", "CompressionRecognitionCode"],
        "0060" : ["CS", "CompressionCode"],
        "0061" : ["SH", "CompressionOriginator"],
        "0062" : ["LO", "CompressionLabel"],
        "0063" : ["SH", "CompressionDescription"],
        "0065" : ["CS", "CompressionSequence"],
        "0066" : ["AT", "CompressionStepPointers"],
        "0068" : ["US", "RepeatInterval"],
        "0069" : ["US", "BitsGrouped"],
        "0070" : ["US", "PerimeterTable"],
        "0071" : ["SS", "PerimeterValue"],
        "0080" : ["US", "PredictorRows"],
        "0081" : ["US", "PredictorColumns"],
        "0082" : ["US", "PredictorConstants"],
        "0090" : ["CS", "BlockedPixels"],
        "0091" : ["US", "BlockRows"],
        "0092" : ["US", "BlockColumns"],
        "0093" : ["US", "RowOverlap"],
        "0094" : ["US", "ColumnOverlap"],
        "0100" : ["US", "BitsAllocated"],
        "0101" : ["US", "BitsStored"],
        "0102" : ["US", "HighBit"],
        "0103" : ["US", "PixelRepresentation"],
        "0104" : ["SS", "SmallestValidPixelValue"],
        "0105" : ["SS", "LargestValidPixelValue"],
        "0106" : ["SS", "SmallestImagePixelValue"],
        "0107" : ["SS", "LargestImagePixelValue"],
        "0108" : ["SS", "SmallestPixelValueInSeries"],
        "0109" : ["SS", "LargestPixelValueInSeries"],
        "0110" : ["SS", "SmallestImagePixelValueInPlane"],
        "0111" : ["SS", "LargestImagePixelValueInPlane"],
        "0120" : ["SS", "PixelPaddingValue"],
        "0121" : ["SS", "PixelPaddingRangeLimit"],
        "0200" : ["US", "ImageLocation"],
        "0300" : ["CS", "QualityControlImage"],
        "0301" : ["CS", "BurnedInAnnotation"],
        "0302" : ["CS", "RecognizableVisualFeatures"],
        "0303" : ["CS", "LongitudinalTemporalInformationModified"],
        "0400" : ["LO", "TransformLabel"],
        "0401" : ["LO", "TransformVersionNumber"],
        "0402" : ["US", "NumberOfTransformSteps"],
        "0403" : ["LO", "SequenceOfCompressedData"],
        "0404" : ["AT", "DetailsOfCoefficients"],
        "0700" : ["LO", "DCTLabel"],
        "0701" : ["CS", "DataBlockDescription"],
        "0702" : ["AT", "DataBlock"],
        "0710" : ["US", "NormalizationFactorFormat"],
        "0720" : ["US", "ZonalMapNumberFormat"],
        "0721" : ["AT", "ZonalMapLocation"],
        "0722" : ["US", "ZonalMapFormat"],
        "0730" : ["US", "AdaptiveMapFormat"],
        "0740" : ["US", "CodeNumberFormat"],
        "0A02" : ["CS", "PixelSpacingCalibrationType"],
        "0A04" : ["LO", "PixelSpacingCalibrationDescription"],
        "1040" : ["CS", "PixelIntensityRelationship"],
        "1041" : ["SS", "PixelIntensityRelationshipSign"],
        "1050" : ["DS", "WindowCenter"],
        "1051" : ["DS", "WindowWidth"],
        "1052" : ["DS", "RescaleIntercept"],
        "1053" : ["DS", "RescaleSlope"],
        "1054" : ["LO", "RescaleType"],
        "1055" : ["LO", "WindowCenterWidthExplanation"],
        "1056" : ["CS", "VOILUTFunction"],
        "1080" : ["CS", "GrayScale"],
        "1090" : ["CS", "RecommendedViewingMode"],
        "1100" : ["SS", "GrayLookupTableDescriptor"],
        "1101" : ["SS", "RedPaletteColorLookupTableDescriptor"],
        "1102" : ["SS", "GreenPaletteColorLookupTableDescriptor"],
        "1103" : ["SS", "BluePaletteColorLookupTableDescriptor"],
        "1104" : ["US", "AlphaPaletteColorLookupTableDescriptor"],
        "1111" : ["SS", "LargeRedPaletteColorLookupTableDescriptor"],
        "1112" : ["SS", "LargeGreenPaletteColorLookupTableDescriptor"],
        "1113" : ["SS", "LargeBluePaletteColorLookupTableDescriptor"],
        "1199" : ["UI", "PaletteColorLookupTableUID"],
        "1200" : ["OW", "GrayLookupTableData"],
        "1201" : ["OW", "RedPaletteColorLookupTableData"],
        "1202" : ["OW", "GreenPaletteColorLookupTableData"],
        "1203" : ["OW", "BluePaletteColorLookupTableData"],
        "1204" : ["OW", "AlphaPaletteColorLookupTableData"],
        "1211" : ["OW", "LargeRedPaletteColorLookupTableData"],
        "1212" : ["OW", "LargeGreenPaletteColorLookupTableData"],
        "1213" : ["OW", "LargeBluePaletteColorLookupTableData"],
        "1214" : ["UI", "LargePaletteColorLookupTableUID"],
        "1221" : ["OW", "SegmentedRedPaletteColorLookupTableData"],
        "1222" : ["OW", "SegmentedGreenPaletteColorLookupTableData"],
        "1223" : ["OW", "SegmentedBluePaletteColorLookupTableData"],
        "1300" : ["CS", "BreastImplantPresent"],
        "1350" : ["CS", "PartialView"],
        "1351" : ["ST", "PartialViewDescription"],
        "1352" : ["SQ", "PartialViewCodeSequence"],
        "135A" : ["CS", "SpatialLocationsPreserved"],
        "1401" : ["SQ", "DataFrameAssignmentSequence"],
        "1402" : ["CS", "DataPathAssignment"],
        "1403" : ["US", "BitsMappedToColorLookupTable"],
        "1404" : ["SQ", "BlendingLUT1Sequence"],
        "1405" : ["CS", "BlendingLUT1TransferFunction"],
        "1406" : ["FD", "BlendingWeightConstant"],
        "1407" : ["US", "BlendingLookupTableDescriptor"],
        "1408" : ["OW", "BlendingLookupTableData"],
        "140B" : ["SQ", "EnhancedPaletteColorLookupTableSequence"],
        "140C" : ["SQ", "BlendingLUT2Sequence"],
        "140D" : ["CS", "BlendingLUT2TransferFunction"],
        "140E" : ["CS", "DataPathID"],
        "140F" : ["CS", "RGBLUTTransferFunction"],
        "1410" : ["CS", "AlphaLUTTransferFunction"],
        "2000" : ["OB", "ICCProfile"],
        "2110" : ["CS", "LossyImageCompression"],
        "2112" : ["DS", "LossyImageCompressionRatio"],
        "2114" : ["CS", "LossyImageCompressionMethod"],
        "3000" : ["SQ", "ModalityLUTSequence"],
        "3002" : ["SS", "LUTDescriptor"],
        "3003" : ["LO", "LUTExplanation"],
        "3004" : ["LO", "ModalityLUTType"],
        "3006" : ["OW", "LUTData"],
        "3010" : ["SQ", "VOILUTSequence"],
        "3110" : ["SQ", "SoftcopyVOILUTSequence"],
        "4000" : ["LT", "ImagePresentationComments"],
        "5000" : ["SQ", "BiPlaneAcquisitionSequence"],
        "6010" : ["US", "RepresentativeFrameNumber"],
        "6020" : ["US", "FrameNumbersOfInterest"],
        "6022" : ["LO", "FrameOfInterestDescription"],
        "6023" : ["CS", "FrameOfInterestType"],
        "6030" : ["US", "MaskPointers"],
        "6040" : ["US", "RWavePointer"],
        "6100" : ["SQ", "MaskSubtractionSequence"],
        "6101" : ["CS", "MaskOperation"],
        "6102" : ["US", "ApplicableFrameRange"],
        "6110" : ["US", "MaskFrameNumbers"],
        "6112" : ["US", "ContrastFrameAveraging"],
        "6114" : ["FL", "MaskSubPixelShift"],
        "6120" : ["SS", "TIDOffset"],
        "6190" : ["ST", "MaskOperationExplanation"],
        "7FE0" : ["UT", "PixelDataProviderURL"],
        "9001" : ["UL", "DataPointRows"],
        "9002" : ["UL", "DataPointColumns"],
        "9003" : ["CS", "SignalDomainColumns"],
        "9099" : ["US", "LargestMonochromePixelValue"],
        "9108" : ["CS", "DataRepresentation"],
        "9110" : ["SQ", "PixelMeasuresSequence"],
        "9132" : ["SQ", "FrameVOILUTSequence"],
        "9145" : ["SQ", "PixelValueTransformationSequence"],
        "9235" : ["CS", "SignalDomainRows"],
        "9411" : ["FL", "DisplayFilterPercentage"],
        "9415" : ["SQ", "FramePixelShiftSequence"],
        "9416" : ["US", "SubtractionItemID"],
        "9422" : ["SQ", "PixelIntensityRelationshipLUTSequence"],
        "9443" : ["SQ", "FramePixelDataPropertiesSequence"],
        "9444" : ["CS", "GeometricalProperties"],
        "9445" : ["FL", "GeometricMaximumDistortion"],
        "9446" : ["CS", "ImageProcessingApplied"],
        "9454" : ["CS", "MaskSelectionMode"],
        "9474" : ["CS", "LUTFunction"],
        "9478" : ["FL", "MaskVisibilityPercentage"],
        "9501" : ["SQ", "PixelShiftSequence"],
        "9502" : ["SQ", "RegionPixelShiftSequence"],
        "9503" : ["SS", "VerticesOfTheRegion"],
        "9505" : ["SQ", "MultiFramePresentationSequence"],
        "9506" : ["US", "PixelShiftFrameRange"],
        "9507" : ["US", "LUTFrameRange"],
        "9520" : ["DS", "ImageToEquipmentMappingMatrix"],
        "9537" : ["CS", "EquipmentCoordinateSystemIdentification"]
    },
    "0032" : {
        "000A" : ["CS", "StudyStatusID"],
        "000C" : ["CS", "StudyPriorityID"],
        "0012" : ["LO", "StudyIDIssuer"],
        "0032" : ["DA", "StudyVerifiedDate"],
        "0033" : ["TM", "StudyVerifiedTime"],
        "0034" : ["DA", "StudyReadDate"],
        "0035" : ["TM", "StudyReadTime"],
        "1000" : ["DA", "ScheduledStudyStartDate"],
        "1001" : ["TM", "ScheduledStudyStartTime"],
        "1010" : ["DA", "ScheduledStudyStopDate"],
        "1011" : ["TM", "ScheduledStudyStopTime"],
        "1020" : ["LO", "ScheduledStudyLocation"],
        "1021" : ["AE", "ScheduledStudyLocationAETitle"],
        "1030" : ["LO", "ReasonForStudy"],
        "1031" : ["SQ", "RequestingPhysicianIdentificationSequence"],
        "1032" : ["PN", "RequestingPhysician"],
        "1033" : ["LO", "RequestingService"],
        "1034" : ["SQ", "RequestingServiceCodeSequence"],
        "1040" : ["DA", "StudyArrivalDate"],
        "1041" : ["TM", "StudyArrivalTime"],
        "1050" : ["DA", "StudyCompletionDate"],
        "1051" : ["TM", "StudyCompletionTime"],
        "1055" : ["CS", "StudyComponentStatusID"],
        "1060" : ["LO", "RequestedProcedureDescription"],
        "1064" : ["SQ", "RequestedProcedureCodeSequence"],
        "1070" : ["LO", "RequestedContrastAgent"],
        "4000" : ["LT", "StudyComments"]
    },
    "0038" : {
        "0004" : ["SQ", "ReferencedPatientAliasSequence"],
        "0008" : ["CS", "VisitStatusID"],
        "0010" : ["LO", "AdmissionID"],
        "0011" : ["LO", "IssuerOfAdmissionID"],
        "0014" : ["SQ", "IssuerOfAdmissionIDSequence"],
        "0016" : ["LO", "RouteOfAdmissions"],
        "001A" : ["DA", "ScheduledAdmissionDate"],
        "001B" : ["TM", "ScheduledAdmissionTime"],
        "001C" : ["DA", "ScheduledDischargeDate"],
        "001D" : ["TM", "ScheduledDischargeTime"],
        "001E" : ["LO", "ScheduledPatientInstitutionResidence"],
        "0020" : ["DA", "AdmittingDate"],
        "0021" : ["TM", "AdmittingTime"],
        "0030" : ["DA", "DischargeDate"],
        "0032" : ["TM", "DischargeTime"],
        "0040" : ["LO", "DischargeDiagnosisDescription"],
        "0044" : ["SQ", "DischargeDiagnosisCodeSequence"],
        "0050" : ["LO", "SpecialNeeds"],
        "0060" : ["LO", "ServiceEpisodeID"],
        "0061" : ["LO", "IssuerOfServiceEpisodeID"],
        "0062" : ["LO", "ServiceEpisodeDescription"],
        "0064" : ["SQ", "IssuerOfServiceEpisodeIDSequence"],
        "0100" : ["SQ", "PertinentDocumentsSequence"],
        "0300" : ["LO", "CurrentPatientLocation"],
        "0400" : ["LO", "PatientInstitutionResidence"],
        "0500" : ["LO", "PatientState"],
        "0502" : ["SQ", "PatientClinicalTrialParticipationSequence"],
        "4000" : ["LT", "VisitComments"]
    },
    "003A" : {
        "0004" : ["CS", "WaveformOriginality"],
        "0005" : ["US", "NumberOfWaveformChannels"],
        "0010" : ["UL", "NumberOfWaveformSamples"],
        "001A" : ["DS", "SamplingFrequency"],
        "0020" : ["SH", "MultiplexGroupLabel"],
        "0200" : ["SQ", "ChannelDefinitionSequence"],
        "0202" : ["IS", "WaveformChannelNumber"],
        "0203" : ["SH", "ChannelLabel"],
        "0205" : ["CS", "ChannelStatus"],
        "0208" : ["SQ", "ChannelSourceSequence"],
        "0209" : ["SQ", "ChannelSourceModifiersSequence"],
        "020A" : ["SQ", "SourceWaveformSequence"],
        "020C" : ["LO", "ChannelDerivationDescription"],
        "0210" : ["DS", "ChannelSensitivity"],
        "0211" : ["SQ", "ChannelSensitivityUnitsSequence"],
        "0212" : ["DS", "ChannelSensitivityCorrectionFactor"],
        "0213" : ["DS", "ChannelBaseline"],
        "0214" : ["DS", "ChannelTimeSkew"],
        "0215" : ["DS", "ChannelSampleSkew"],
        "0218" : ["DS", "ChannelOffset"],
        "021A" : ["US", "WaveformBitsStored"],
        "0220" : ["DS", "FilterLowFrequency"],
        "0221" : ["DS", "FilterHighFrequency"],
        "0222" : ["DS", "NotchFilterFrequency"],
        "0223" : ["DS", "NotchFilterBandwidth"],
        "0230" : ["FL", "WaveformDataDisplayScale"],
        "0231" : ["US", "WaveformDisplayBackgroundCIELabValue"],
        "0240" : ["SQ", "WaveformPresentationGroupSequence"],
        "0241" : ["US", "PresentationGroupNumber"],
        "0242" : ["SQ", "ChannelDisplaySequence"],
        "0244" : ["US", "ChannelRecommendedDisplayCIELabValue"],
        "0245" : ["FL", "ChannelPosition"],
        "0246" : ["CS", "DisplayShadingFlag"],
        "0247" : ["FL", "FractionalChannelDisplayScale"],
        "0248" : ["FL", "AbsoluteChannelDisplayScale"],
        "0300" : ["SQ", "MultiplexedAudioChannelsDescriptionCodeSequence"],
        "0301" : ["IS", "ChannelIdentificationCode"],
        "0302" : ["CS", "ChannelMode"]
    },
    "0040" : {
        "0001" : ["AE", "ScheduledStationAETitle"],
        "0002" : ["DA", "ScheduledProcedureStepStartDate"],
        "0003" : ["TM", "ScheduledProcedureStepStartTime"],
        "0004" : ["DA", "ScheduledProcedureStepEndDate"],
        "0005" : ["TM", "ScheduledProcedureStepEndTime"],
        "0006" : ["PN", "ScheduledPerformingPhysicianName"],
        "0007" : ["LO", "ScheduledProcedureStepDescription"],
        "0008" : ["SQ", "ScheduledProtocolCodeSequence"],
        "0009" : ["SH", "ScheduledProcedureStepID"],
        "000A" : ["SQ", "StageCodeSequence"],
        "000B" : ["SQ", "ScheduledPerformingPhysicianIdentificationSequence"],
        "0010" : ["SH", "ScheduledStationName"],
        "0011" : ["SH", "ScheduledProcedureStepLocation"],
        "0012" : ["LO", "PreMedication"],
        "0020" : ["CS", "ScheduledProcedureStepStatus"],
        "0026" : ["SQ", "OrderPlacerIdentifierSequence"],
        "0027" : ["SQ", "OrderFillerIdentifierSequence"],
        "0031" : ["UT", "LocalNamespaceEntityID"],
        "0032" : ["UT", "UniversalEntityID"],
        "0033" : ["CS", "UniversalEntityIDType"],
        "0035" : ["CS", "IdentifierTypeCode"],
        "0036" : ["SQ", "AssigningFacilitySequence"],
        "0039" : ["SQ", "AssigningJurisdictionCodeSequence"],
        "003A" : ["SQ", "AssigningAgencyOrDepartmentCodeSequence"],
        "0100" : ["SQ", "ScheduledProcedureStepSequence"],
        "0220" : ["SQ", "ReferencedNonImageCompositeSOPInstanceSequence"],
        "0241" : ["AE", "PerformedStationAETitle"],
        "0242" : ["SH", "PerformedStationName"],
        "0243" : ["SH", "PerformedLocation"],
        "0244" : ["DA", "PerformedProcedureStepStartDate"],
        "0245" : ["TM", "PerformedProcedureStepStartTime"],
        "0250" : ["DA", "PerformedProcedureStepEndDate"],
        "0251" : ["TM", "PerformedProcedureStepEndTime"],
        "0252" : ["CS", "PerformedProcedureStepStatus"],
        "0253" : ["SH", "PerformedProcedureStepID"],
        "0254" : ["LO", "PerformedProcedureStepDescription"],
        "0255" : ["LO", "PerformedProcedureTypeDescription"],
        "0260" : ["SQ", "PerformedProtocolCodeSequence"],
        "0261" : ["CS", "PerformedProtocolType"],
        "0270" : ["SQ", "ScheduledStepAttributesSequence"],
        "0275" : ["SQ", "RequestAttributesSequence"],
        "0280" : ["ST", "CommentsOnThePerformedProcedureStep"],
        "0281" : ["SQ", "PerformedProcedureStepDiscontinuationReasonCodeSequence"],
        "0293" : ["SQ", "QuantitySequence"],
        "0294" : ["DS", "Quantity"],
        "0295" : ["SQ", "MeasuringUnitsSequence"],
        "0296" : ["SQ", "BillingItemSequence"],
        "0300" : ["US", "TotalTimeOfFluoroscopy"],
        "0301" : ["US", "TotalNumberOfExposures"],
        "0302" : ["US", "EntranceDose"],
        "0303" : ["US", "ExposedArea"],
        "0306" : ["DS", "DistanceSourceToEntrance"],
        "0307" : ["DS", "DistanceSourceToSupport"],
        "030E" : ["SQ", "ExposureDoseSequence"],
        "0310" : ["ST", "CommentsOnRadiationDose"],
        "0312" : ["DS", "XRayOutput"],
        "0314" : ["DS", "HalfValueLayer"],
        "0316" : ["DS", "OrganDose"],
        "0318" : ["CS", "OrganExposed"],
        "0320" : ["SQ", "BillingProcedureStepSequence"],
        "0321" : ["SQ", "FilmConsumptionSequence"],
        "0324" : ["SQ", "BillingSuppliesAndDevicesSequence"],
        "0330" : ["SQ", "ReferencedProcedureStepSequence"],
        "0340" : ["SQ", "PerformedSeriesSequence"],
        "0400" : ["LT", "CommentsOnTheScheduledProcedureStep"],
        "0440" : ["SQ", "ProtocolContextSequence"],
        "0441" : ["SQ", "ContentItemModifierSequence"],
        "0500" : ["SQ", "ScheduledSpecimenSequence"],
        "050A" : ["LO", "SpecimenAccessionNumber"],
        "0512" : ["LO", "ContainerIdentifier"],
        "0513" : ["SQ", "IssuerOfTheContainerIdentifierSequence"],
        "0515" : ["SQ", "AlternateContainerIdentifierSequence"],
        "0518" : ["SQ", "ContainerTypeCodeSequence"],
        "051A" : ["LO", "ContainerDescription"],
        "0520" : ["SQ", "ContainerComponentSequence"],
        "0550" : ["SQ", "SpecimenSequence"],
        "0551" : ["LO", "SpecimenIdentifier"],
        "0552" : ["SQ", "SpecimenDescriptionSequenceTrial"],
        "0553" : ["ST", "SpecimenDescriptionTrial"],
        "0554" : ["UI", "SpecimenUID"],
        "0555" : ["SQ", "AcquisitionContextSequence"],
        "0556" : ["ST", "AcquisitionContextDescription"],
        "059A" : ["SQ", "SpecimenTypeCodeSequence"],
        "0560" : ["SQ", "SpecimenDescriptionSequence"],
        "0562" : ["SQ", "IssuerOfTheSpecimenIdentifierSequence"],
        "0600" : ["LO", "SpecimenShortDescription"],
        "0602" : ["UT", "SpecimenDetailedDescription"],
        "0610" : ["SQ", "SpecimenPreparationSequence"],
        "0612" : ["SQ", "SpecimenPreparationStepContentItemSequence"],
        "0620" : ["SQ", "SpecimenLocalizationContentItemSequence"],
        "06FA" : ["LO", "SlideIdentifier"],
        "071A" : ["SQ", "ImageCenterPointCoordinatesSequence"],
        "072A" : ["DS", "XOffsetInSlideCoordinateSystem"],
        "073A" : ["DS", "YOffsetInSlideCoordinateSystem"],
        "074A" : ["DS", "ZOffsetInSlideCoordinateSystem"],
        "08D8" : ["SQ", "PixelSpacingSequence"],
        "08DA" : ["SQ", "CoordinateSystemAxisCodeSequence"],
        "08EA" : ["SQ", "MeasurementUnitsCodeSequence"],
        "09F8" : ["SQ", "VitalStainCodeSequenceTrial"],
        "1001" : ["SH", "RequestedProcedureID"],
        "1002" : ["LO", "ReasonForTheRequestedProcedure"],
        "1003" : ["SH", "RequestedProcedurePriority"],
        "1004" : ["LO", "PatientTransportArrangements"],
        "1005" : ["LO", "RequestedProcedureLocation"],
        "1006" : ["SH", "PlacerOrderNumberProcedure"],
        "1007" : ["SH", "FillerOrderNumberProcedure"],
        "1008" : ["LO", "ConfidentialityCode"],
        "1009" : ["SH", "ReportingPriority"],
        "100A" : ["SQ", "ReasonForRequestedProcedureCodeSequence"],
        "1010" : ["PN", "NamesOfIntendedRecipientsOfResults"],
        "1011" : ["SQ", "IntendedRecipientsOfResultsIdentificationSequence"],
        "1012" : ["SQ", "ReasonForPerformedProcedureCodeSequence"],
        "1060" : ["LO", "RequestedProcedureDescriptionTrial"],
        "1101" : ["SQ", "PersonIdentificationCodeSequence"],
        "1102" : ["ST", "PersonAddress"],
        "1103" : ["LO", "PersonTelephoneNumbers"],
        "1400" : ["LT", "RequestedProcedureComments"],
        "2001" : ["LO", "ReasonForTheImagingServiceRequest"],
        "2004" : ["DA", "IssueDateOfImagingServiceRequest"],
        "2005" : ["TM", "IssueTimeOfImagingServiceRequest"],
        "2006" : ["SH", "PlacerOrderNumberImagingServiceRequestRetired"],
        "2007" : ["SH", "FillerOrderNumberImagingServiceRequestRetired"],
        "2008" : ["PN", "OrderEnteredBy"],
        "2009" : ["SH", "OrderEntererLocation"],
        "2010" : ["SH", "OrderCallbackPhoneNumber"],
        "2016" : ["LO", "PlacerOrderNumberImagingServiceRequest"],
        "2017" : ["LO", "FillerOrderNumberImagingServiceRequest"],
        "2400" : ["LT", "ImagingServiceRequestComments"],
        "3001" : ["LO", "ConfidentialityConstraintOnPatientDataDescription"],
        "4001" : ["CS", "GeneralPurposeScheduledProcedureStepStatus"],
        "4002" : ["CS", "GeneralPurposePerformedProcedureStepStatus"],
        "4003" : ["CS", "GeneralPurposeScheduledProcedureStepPriority"],
        "4004" : ["SQ", "ScheduledProcessingApplicationsCodeSequence"],
        "4005" : ["DT", "ScheduledProcedureStepStartDateTime"],
        "4006" : ["CS", "MultipleCopiesFlag"],
        "4007" : ["SQ", "PerformedProcessingApplicationsCodeSequence"],
        "4009" : ["SQ", "HumanPerformerCodeSequence"],
        "4010" : ["DT", "ScheduledProcedureStepModificationDateTime"],
        "4011" : ["DT", "ExpectedCompletionDateTime"],
        "4015" : ["SQ", "ResultingGeneralPurposePerformedProcedureStepsSequence"],
        "4016" : ["SQ", "ReferencedGeneralPurposeScheduledProcedureStepSequence"],
        "4018" : ["SQ", "ScheduledWorkitemCodeSequence"],
        "4019" : ["SQ", "PerformedWorkitemCodeSequence"],
        "4020" : ["CS", "InputAvailabilityFlag"],
        "4021" : ["SQ", "InputInformationSequence"],
        "4022" : ["SQ", "RelevantInformationSequence"],
        "4023" : ["UI", "ReferencedGeneralPurposeScheduledProcedureStepTransactionUID"],
        "4025" : ["SQ", "ScheduledStationNameCodeSequence"],
        "4026" : ["SQ", "ScheduledStationClassCodeSequence"],
        "4027" : ["SQ", "ScheduledStationGeographicLocationCodeSequence"],
        "4028" : ["SQ", "PerformedStationNameCodeSequence"],
        "4029" : ["SQ", "PerformedStationClassCodeSequence"],
        "4030" : ["SQ", "PerformedStationGeographicLocationCodeSequence"],
        "4031" : ["SQ", "RequestedSubsequentWorkitemCodeSequence"],
        "4032" : ["SQ", "NonDICOMOutputCodeSequence"],
        "4033" : ["SQ", "OutputInformationSequence"],
        "4034" : ["SQ", "ScheduledHumanPerformersSequence"],
        "4035" : ["SQ", "ActualHumanPerformersSequence"],
        "4036" : ["LO", "HumanPerformerOrganization"],
        "4037" : ["PN", "HumanPerformerName"],
        "4040" : ["CS", "RawDataHandling"],
        "4041" : ["CS", "InputReadinessState"],
        "4050" : ["DT", "PerformedProcedureStepStartDateTime"],
        "4051" : ["DT", "PerformedProcedureStepEndDateTime"],
        "4052" : ["DT", "ProcedureStepCancellationDateTime"],
        "8302" : ["DS", "EntranceDoseInmGy"],
        "9094" : ["SQ", "ReferencedImageRealWorldValueMappingSequence"],
        "9096" : ["SQ", "RealWorldValueMappingSequence"],
        "9098" : ["SQ", "PixelValueMappingCodeSequence"],
        "9210" : ["SH", "LUTLabel"],
        "9211" : ["SS", "RealWorldValueLastValueMapped"],
        "9212" : ["FD", "RealWorldValueLUTData"],
        "9216" : ["SS", "RealWorldValueFirstValueMapped"],
        "9224" : ["FD", "RealWorldValueIntercept"],
        "9225" : ["FD", "RealWorldValueSlope"],
        "A007" : ["CS", "FindingsFlagTrial"],
        "A010" : ["CS", "RelationshipType"],
        "A020" : ["SQ", "FindingsSequenceTrial"],
        "A021" : ["UI", "FindingsGroupUIDTrial"],
        "A022" : ["UI", "ReferencedFindingsGroupUIDTrial"],
        "A023" : ["DA", "FindingsGroupRecordingDateTrial"],
        "A024" : ["TM", "FindingsGroupRecordingTimeTrial"],
        "A026" : ["SQ", "FindingsSourceCategoryCodeSequenceTrial"],
        "A027" : ["LO", "VerifyingOrganization"],
        "A028" : ["SQ", "DocumentingOrganizationIdentifierCodeSequenceTrial"],
        "A030" : ["DT", "VerificationDateTime"],
        "A032" : ["DT", "ObservationDateTime"],
        "A040" : ["CS", "ValueType"],
        "A043" : ["SQ", "ConceptNameCodeSequence"],
        "A047" : ["LO", "MeasurementPrecisionDescriptionTrial"],
        "A050" : ["CS", "ContinuityOfContent"],
        "A057" : ["CS", "UrgencyOrPriorityAlertsTrial"],
        "A060" : ["LO", "SequencingIndicatorTrial"],
        "A066" : ["SQ", "DocumentIdentifierCodeSequenceTrial"],
        "A067" : ["PN", "DocumentAuthorTrial"],
        "A068" : ["SQ", "DocumentAuthorIdentifierCodeSequenceTrial"],
        "A070" : ["SQ", "IdentifierCodeSequenceTrial"],
        "A073" : ["SQ", "VerifyingObserverSequence"],
        "A074" : ["OB", "ObjectBinaryIdentifierTrial"],
        "A075" : ["PN", "VerifyingObserverName"],
        "A076" : ["SQ", "DocumentingObserverIdentifierCodeSequenceTrial"],
        "A078" : ["SQ", "AuthorObserverSequence"],
        "A07A" : ["SQ", "ParticipantSequence"],
        "A07C" : ["SQ", "CustodialOrganizationSequence"],
        "A080" : ["CS", "ParticipationType"],
        "A082" : ["DT", "ParticipationDateTime"],
        "A084" : ["CS", "ObserverType"],
        "A085" : ["SQ", "ProcedureIdentifierCodeSequenceTrial"],
        "A088" : ["SQ", "VerifyingObserverIdentificationCodeSequence"],
        "A089" : ["OB", "ObjectDirectoryBinaryIdentifierTrial"],
        "A090" : ["SQ", "EquivalentCDADocumentSequence"],
        "A0B0" : ["US", "ReferencedWaveformChannels"],
        "A110" : ["DA", "DateOfDocumentOrVerbalTransactionTrial"],
        "A112" : ["TM", "TimeOfDocumentCreationOrVerbalTransactionTrial"],
        "A120" : ["DT", "DateTime"],
        "A121" : ["DA", "Date"],
        "A122" : ["TM", "Time"],
        "A123" : ["PN", "PersonName"],
        "A124" : ["UI", "UID"],
        "A125" : ["CS", "ReportStatusIDTrial"],
        "A130" : ["CS", "TemporalRangeType"],
        "A132" : ["UL", "ReferencedSamplePositions"],
        "A136" : ["US", "ReferencedFrameNumbers"],
        "A138" : ["DS", "ReferencedTimeOffsets"],
        "A13A" : ["DT", "ReferencedDateTime"],
        "A160" : ["UT", "TextValue"],
        "A167" : ["SQ", "ObservationCategoryCodeSequenceTrial"],
        "A168" : ["SQ", "ConceptCodeSequence"],
        "A16A" : ["ST", "BibliographicCitationTrial"],
        "A170" : ["SQ", "PurposeOfReferenceCodeSequence"],
        "A171" : ["UI", "ObservationUIDTrial"],
        "A172" : ["UI", "ReferencedObservationUIDTrial"],
        "A173" : ["CS", "ReferencedObservationClassTrial"],
        "A174" : ["CS", "ReferencedObjectObservationClassTrial"],
        "A180" : ["US", "AnnotationGroupNumber"],
        "A192" : ["DA", "ObservationDateTrial"],
        "A193" : ["TM", "ObservationTimeTrial"],
        "A194" : ["CS", "MeasurementAutomationTrial"],
        "A195" : ["SQ", "ModifierCodeSequence"],
        "A224" : ["ST", "IdentificationDescriptionTrial"],
        "A290" : ["CS", "CoordinatesSetGeometricTypeTrial"],
        "A296" : ["SQ", "AlgorithmCodeSequenceTrial"],
        "A297" : ["ST", "AlgorithmDescriptionTrial"],
        "A29A" : ["SL", "PixelCoordinatesSetTrial"],
        "A300" : ["SQ", "MeasuredValueSequence"],
        "A301" : ["SQ", "NumericValueQualifierCodeSequence"],
        "A307" : ["PN", "CurrentObserverTrial"],
        "A30A" : ["DS", "NumericValue"],
        "A313" : ["SQ", "ReferencedAccessionSequenceTrial"],
        "A33A" : ["ST", "ReportStatusCommentTrial"],
        "A340" : ["SQ", "ProcedureContextSequenceTrial"],
        "A352" : ["PN", "VerbalSourceTrial"],
        "A353" : ["ST", "AddressTrial"],
        "A354" : ["LO", "TelephoneNumberTrial"],
        "A358" : ["SQ", "VerbalSourceIdentifierCodeSequenceTrial"],
        "A360" : ["SQ", "PredecessorDocumentsSequence"],
        "A370" : ["SQ", "ReferencedRequestSequence"],
        "A372" : ["SQ", "PerformedProcedureCodeSequence"],
        "A375" : ["SQ", "CurrentRequestedProcedureEvidenceSequence"],
        "A380" : ["SQ", "ReportDetailSequenceTrial"],
        "A385" : ["SQ", "PertinentOtherEvidenceSequence"],
        "A390" : ["SQ", "HL7StructuredDocumentReferenceSequence"],
        "A402" : ["UI", "ObservationSubjectUIDTrial"],
        "A403" : ["CS", "ObservationSubjectClassTrial"],
        "A404" : ["SQ", "ObservationSubjectTypeCodeSequenceTrial"],
        "A491" : ["CS", "CompletionFlag"],
        "A492" : ["LO", "CompletionFlagDescription"],
        "A493" : ["CS", "VerificationFlag"],
        "A494" : ["CS", "ArchiveRequested"],
        "A496" : ["CS", "PreliminaryFlag"],
        "A504" : ["SQ", "ContentTemplateSequence"],
        "A525" : ["SQ", "IdenticalDocumentsSequence"],
        "A600" : ["CS", "ObservationSubjectContextFlagTrial"],
        "A601" : ["CS", "ObserverContextFlagTrial"],
        "A603" : ["CS", "ProcedureContextFlagTrial"],
        "A730" : ["SQ", "ContentSequence"],
        "A731" : ["SQ", "RelationshipSequenceTrial"],
        "A732" : ["SQ", "RelationshipTypeCodeSequenceTrial"],
        "A744" : ["SQ", "LanguageCodeSequenceTrial"],
        "A992" : ["ST", "UniformResourceLocatorTrial"],
        "B020" : ["SQ", "WaveformAnnotationSequence"],
        "DB00" : ["CS", "TemplateIdentifier"],
        "DB06" : ["DT", "TemplateVersion"],
        "DB07" : ["DT", "TemplateLocalVersion"],
        "DB0B" : ["CS", "TemplateExtensionFlag"],
        "DB0C" : ["UI", "TemplateExtensionOrganizationUID"],
        "DB0D" : ["UI", "TemplateExtensionCreatorUID"],
        "DB73" : ["UL", "ReferencedContentItemIdentifier"],
        "E001" : ["ST", "HL7InstanceIdentifier"],
        "E004" : ["DT", "HL7DocumentEffectiveTime"],
        "E006" : ["SQ", "HL7DocumentTypeCodeSequence"],
        "E008" : ["SQ", "DocumentClassCodeSequence"],
        "E010" : ["UT", "RetrieveURI"],
        "E011" : ["UI", "RetrieveLocationUID"],
        "E020" : ["CS", "TypeOfInstances"],
        "E021" : ["SQ", "DICOMRetrievalSequence"],
        "E022" : ["SQ", "DICOMMediaRetrievalSequence"],
        "E023" : ["SQ", "WADORetrievalSequence"],
        "E024" : ["SQ", "XDSRetrievalSequence"],
        "E030" : ["UI", "RepositoryUniqueID"],
        "E031" : ["UI", "HomeCommunityID"]
    },
    "0042" : {
        "0010" : ["ST", "DocumentTitle"],
        "0011" : ["OB", "EncapsulatedDocument"],
        "0012" : ["LO", "MIMETypeOfEncapsulatedDocument"],
        "0013" : ["SQ", "SourceInstanceSequence"],
        "0014" : ["LO", "ListOfMIMETypes"]
    },
    "0044" : {
        "0001" : ["ST", "ProductPackageIdentifier"],
        "0002" : ["CS", "SubstanceAdministrationApproval"],
        "0003" : ["LT", "ApprovalStatusFurtherDescription"],
        "0004" : ["DT", "ApprovalStatusDateTime"],
        "0007" : ["SQ", "ProductTypeCodeSequence"],
        "0008" : ["LO", "ProductName"],
        "0009" : ["LT", "ProductDescription"],
        "000A" : ["LO", "ProductLotIdentifier"],
        "000B" : ["DT", "ProductExpirationDateTime"],
        "0010" : ["DT", "SubstanceAdministrationDateTime"],
        "0011" : ["LO", "SubstanceAdministrationNotes"],
        "0012" : ["LO", "SubstanceAdministrationDeviceID"],
        "0013" : ["SQ", "ProductParameterSequence"],
        "0019" : ["SQ", "SubstanceAdministrationParameterSequence"]
    },
    "0046" : {
        "0012" : ["LO", "LensDescription"],
        "0014" : ["SQ", "RightLensSequence"],
        "0015" : ["SQ", "LeftLensSequence"],
        "0016" : ["SQ", "UnspecifiedLateralityLensSequence"],
        "0018" : ["SQ", "CylinderSequence"],
        "0028" : ["SQ", "PrismSequence"],
        "0030" : ["FD", "HorizontalPrismPower"],
        "0032" : ["CS", "HorizontalPrismBase"],
        "0034" : ["FD", "VerticalPrismPower"],
        "0036" : ["CS", "VerticalPrismBase"],
        "0038" : ["CS", "LensSegmentType"],
        "0040" : ["FD", "OpticalTransmittance"],
        "0042" : ["FD", "ChannelWidth"],
        "0044" : ["FD", "PupilSize"],
        "0046" : ["FD", "CornealSize"],
        "0050" : ["SQ", "AutorefractionRightEyeSequence"],
        "0052" : ["SQ", "AutorefractionLeftEyeSequence"],
        "0060" : ["FD", "DistancePupillaryDistance"],
        "0062" : ["FD", "NearPupillaryDistance"],
        "0063" : ["FD", "IntermediatePupillaryDistance"],
        "0064" : ["FD", "OtherPupillaryDistance"],
        "0070" : ["SQ", "KeratometryRightEyeSequence"],
        "0071" : ["SQ", "KeratometryLeftEyeSequence"],
        "0074" : ["SQ", "SteepKeratometricAxisSequence"],
        "0075" : ["FD", "RadiusOfCurvature"],
        "0076" : ["FD", "KeratometricPower"],
        "0077" : ["FD", "KeratometricAxis"],
        "0080" : ["SQ", "FlatKeratometricAxisSequence"],
        "0092" : ["CS", "BackgroundColor"],
        "0094" : ["CS", "Optotype"],
        "0095" : ["CS", "OptotypePresentation"],
        "0097" : ["SQ", "SubjectiveRefractionRightEyeSequence"],
        "0098" : ["SQ", "SubjectiveRefractionLeftEyeSequence"],
        "0100" : ["SQ", "AddNearSequence"],
        "0101" : ["SQ", "AddIntermediateSequence"],
        "0102" : ["SQ", "AddOtherSequence"],
        "0104" : ["FD", "AddPower"],
        "0106" : ["FD", "ViewingDistance"],
        "0121" : ["SQ", "VisualAcuityTypeCodeSequence"],
        "0122" : ["SQ", "VisualAcuityRightEyeSequence"],
        "0123" : ["SQ", "VisualAcuityLeftEyeSequence"],
        "0124" : ["SQ", "VisualAcuityBothEyesOpenSequence"],
        "0125" : ["CS", "ViewingDistanceType"],
        "0135" : ["SS", "VisualAcuityModifiers"],
        "0137" : ["FD", "DecimalVisualAcuity"],
        "0139" : ["LO", "OptotypeDetailedDefinition"],
        "0145" : ["SQ", "ReferencedRefractiveMeasurementsSequence"],
        "0146" : ["FD", "SpherePower"],
        "0147" : ["FD", "CylinderPower"]
    },
    "0048" : {
        "0001" : ["FL", "ImagedVolumeWidth"],
        "0002" : ["FL", "ImagedVolumeHeight"],
        "0003" : ["FL", "ImagedVolumeDepth"],
        "0006" : ["UL", "TotalPixelMatrixColumns"],
        "0007" : ["UL", "TotalPixelMatrixRows"],
        "0008" : ["SQ", "TotalPixelMatrixOriginSequence"],
        "0010" : ["CS", "SpecimenLabelInImage"],
        "0011" : ["CS", "FocusMethod"],
        "0012" : ["CS", "ExtendedDepthOfField"],
        "0013" : ["US", "NumberOfFocalPlanes"],
        "0014" : ["FL", "DistanceBetweenFocalPlanes"],
        "0015" : ["US", "RecommendedAbsentPixelCIELabValue"],
        "0100" : ["SQ", "IlluminatorTypeCodeSequence"],
        "0102" : ["DS", "ImageOrientationSlide"],
        "0105" : ["SQ", "OpticalPathSequence"],
        "0106" : ["SH", "OpticalPathIdentifier"],
        "0107" : ["ST", "OpticalPathDescription"],
        "0108" : ["SQ", "IlluminationColorCodeSequence"],
        "0110" : ["SQ", "SpecimenReferenceSequence"],
        "0111" : ["DS", "CondenserLensPower"],
        "0112" : ["DS", "ObjectiveLensPower"],
        "0113" : ["DS", "ObjectiveLensNumericalAperture"],
        "0120" : ["SQ", "PaletteColorLookupTableSequence"],
        "0200" : ["SQ", "ReferencedImageNavigationSequence"],
        "0201" : ["US", "TopLeftHandCornerOfLocalizerArea"],
        "0202" : ["US", "BottomRightHandCornerOfLocalizerArea"],
        "0207" : ["SQ", "OpticalPathIdentificationSequence"],
        "021A" : ["SQ", "PlanePositionSlideSequence"],
        "021E" : ["SL", "RowPositionInTotalImagePixelMatrix"],
        "021F" : ["SL", "ColumnPositionInTotalImagePixelMatrix"],
        "0301" : ["CS", "PixelOriginInterpretation"]
    },
    "0050" : {
        "0004" : ["CS", "CalibrationImage"],
        "0010" : ["SQ", "DeviceSequence"],
        "0012" : ["SQ", "ContainerComponentTypeCodeSequence"],
        "0013" : ["FD", "ContainerComponentThickness"],
        "0014" : ["DS", "DeviceLength"],
        "0015" : ["FD", "ContainerComponentWidth"],
        "0016" : ["DS", "DeviceDiameter"],
        "0017" : ["CS", "DeviceDiameterUnits"],
        "0018" : ["DS", "DeviceVolume"],
        "0019" : ["DS", "InterMarkerDistance"],
        "001A" : ["CS", "ContainerComponentMaterial"],
        "001B" : ["LO", "ContainerComponentID"],
        "001C" : ["FD", "ContainerComponentLength"],
        "001D" : ["FD", "ContainerComponentDiameter"],
        "001E" : ["LO", "ContainerComponentDescription"],
        "0020" : ["LO", "DeviceDescription"]
    },
    "0052" : {
        "0001" : ["FL", "ContrastBolusIngredientPercentByVolume"],
        "0002" : ["FD", "OCTFocalDistance"],
        "0003" : ["FD", "BeamSpotSize"],
        "0004" : ["FD", "EffectiveRefractiveIndex"],
        "0006" : ["CS", "OCTAcquisitionDomain"],
        "0007" : ["FD", "OCTOpticalCenterWavelength"],
        "0008" : ["FD", "AxialResolution"],
        "0009" : ["FD", "RangingDepth"],
        "0011" : ["FD", "ALineRate"],
        "0012" : ["US", "ALinesPerFrame"],
        "0013" : ["FD", "CatheterRotationalRate"],
        "0014" : ["FD", "ALinePixelSpacing"],
        "0016" : ["SQ", "ModeOfPercutaneousAccessSequence"],
        "0025" : ["SQ", "IntravascularOCTFrameTypeSequence"],
        "0026" : ["CS", "OCTZOffsetApplied"],
        "0027" : ["SQ", "IntravascularFrameContentSequence"],
        "0028" : ["FD", "IntravascularLongitudinalDistance"],
        "0029" : ["SQ", "IntravascularOCTFrameContentSequence"],
        "0030" : ["SS", "OCTZOffsetCorrection"],
        "0031" : ["CS", "CatheterDirectionOfRotation"],
        "0033" : ["FD", "SeamLineLocation"],
        "0034" : ["FD", "FirstALineLocation"],
        "0036" : ["US", "SeamLineIndex"],
        "0038" : ["US", "NumberOfPaddedAlines"],
        "0039" : ["CS", "InterpolationType"],
        "003A" : ["CS", "RefractiveIndexApplied"]
    },
    "0054" : {
        "0010" : ["US", "EnergyWindowVector"],
        "0011" : ["US", "NumberOfEnergyWindows"],
        "0012" : ["SQ", "EnergyWindowInformationSequence"],
        "0013" : ["SQ", "EnergyWindowRangeSequence"],
        "0014" : ["DS", "EnergyWindowLowerLimit"],
        "0015" : ["DS", "EnergyWindowUpperLimit"],
        "0016" : ["SQ", "RadiopharmaceuticalInformationSequence"],
        "0017" : ["IS", "ResidualSyringeCounts"],
        "0018" : ["SH", "EnergyWindowName"],
        "0020" : ["US", "DetectorVector"],
        "0021" : ["US", "NumberOfDetectors"],
        "0022" : ["SQ", "DetectorInformationSequence"],
        "0030" : ["US", "PhaseVector"],
        "0031" : ["US", "NumberOfPhases"],
        "0032" : ["SQ", "PhaseInformationSequence"],
        "0033" : ["US", "NumberOfFramesInPhase"],
        "0036" : ["IS", "PhaseDelay"],
        "0038" : ["IS", "PauseBetweenFrames"],
        "0039" : ["CS", "PhaseDescription"],
        "0050" : ["US", "RotationVector"],
        "0051" : ["US", "NumberOfRotations"],
        "0052" : ["SQ", "RotationInformationSequence"],
        "0053" : ["US", "NumberOfFramesInRotation"],
        "0060" : ["US", "RRIntervalVector"],
        "0061" : ["US", "NumberOfRRIntervals"],
        "0062" : ["SQ", "GatedInformationSequence"],
        "0063" : ["SQ", "DataInformationSequence"],
        "0070" : ["US", "TimeSlotVector"],
        "0071" : ["US", "NumberOfTimeSlots"],
        "0072" : ["SQ", "TimeSlotInformationSequence"],
        "0073" : ["DS", "TimeSlotTime"],
        "0080" : ["US", "SliceVector"],
        "0081" : ["US", "NumberOfSlices"],
        "0090" : ["US", "AngularViewVector"],
        "0100" : ["US", "TimeSliceVector"],
        "0101" : ["US", "NumberOfTimeSlices"],
        "0200" : ["DS", "StartAngle"],
        "0202" : ["CS", "TypeOfDetectorMotion"],
        "0210" : ["IS", "TriggerVector"],
        "0211" : ["US", "NumberOfTriggersInPhase"],
        "0220" : ["SQ", "ViewCodeSequence"],
        "0222" : ["SQ", "ViewModifierCodeSequence"],
        "0300" : ["SQ", "RadionuclideCodeSequence"],
        "0302" : ["SQ", "AdministrationRouteCodeSequence"],
        "0304" : ["SQ", "RadiopharmaceuticalCodeSequence"],
        "0306" : ["SQ", "CalibrationDataSequence"],
        "0308" : ["US", "EnergyWindowNumber"],
        "0400" : ["SH", "ImageID"],
        "0410" : ["SQ", "PatientOrientationCodeSequence"],
        "0412" : ["SQ", "PatientOrientationModifierCodeSequence"],
        "0414" : ["SQ", "PatientGantryRelationshipCodeSequence"],
        "0500" : ["CS", "SliceProgressionDirection"],
        "1000" : ["CS", "SeriesType"],
        "1001" : ["CS", "Units"],
        "1002" : ["CS", "CountsSource"],
        "1004" : ["CS", "ReprojectionMethod"],
        "1006" : ["CS", "SUVType"],
        "1100" : ["CS", "RandomsCorrectionMethod"],
        "1101" : ["LO", "AttenuationCorrectionMethod"],
        "1102" : ["CS", "DecayCorrection"],
        "1103" : ["LO", "ReconstructionMethod"],
        "1104" : ["LO", "DetectorLinesOfResponseUsed"],
        "1105" : ["LO", "ScatterCorrectionMethod"],
        "1200" : ["DS", "AxialAcceptance"],
        "1201" : ["IS", "AxialMash"],
        "1202" : ["IS", "TransverseMash"],
        "1203" : ["DS", "DetectorElementSize"],
        "1210" : ["DS", "CoincidenceWindowWidth"],
        "1220" : ["CS", "SecondaryCountsType"],
        "1300" : ["DS", "FrameReferenceTime"],
        "1310" : ["IS", "PrimaryPromptsCountsAccumulated"],
        "1311" : ["IS", "SecondaryCountsAccumulated"],
        "1320" : ["DS", "SliceSensitivityFactor"],
        "1321" : ["DS", "DecayFactor"],
        "1322" : ["DS", "DoseCalibrationFactor"],
        "1323" : ["DS", "ScatterFractionFactor"],
        "1324" : ["DS", "DeadTimeFactor"],
        "1330" : ["US", "ImageIndex"],
        "1400" : ["CS", "CountsIncluded"],
        "1401" : ["CS", "DeadTimeCorrectionFlag"]
    },
    "0060" : {
        "3000" : ["SQ", "HistogramSequence"],
        "3002" : ["US", "HistogramNumberOfBins"],
        "3004" : ["SS", "HistogramFirstBinValue"],
        "3006" : ["SS", "HistogramLastBinValue"],
        "3008" : ["US", "HistogramBinWidth"],
        "3010" : ["LO", "HistogramExplanation"],
        "3020" : ["UL", "HistogramData"]
    },
    "0062" : {
        "0001" : ["CS", "SegmentationType"],
        "0002" : ["SQ", "SegmentSequence"],
        "0003" : ["SQ", "SegmentedPropertyCategoryCodeSequence"],
        "0004" : ["US", "SegmentNumber"],
        "0005" : ["LO", "SegmentLabel"],
        "0006" : ["ST", "SegmentDescription"],
        "0008" : ["CS", "SegmentAlgorithmType"],
        "0009" : ["LO", "SegmentAlgorithmName"],
        "000A" : ["SQ", "SegmentIdentificationSequence"],
        "000B" : ["US", "ReferencedSegmentNumber"],
        "000C" : ["US", "RecommendedDisplayGrayscaleValue"],
        "000D" : ["US", "RecommendedDisplayCIELabValue"],
        "000E" : ["US", "MaximumFractionalValue"],
        "000F" : ["SQ", "SegmentedPropertyTypeCodeSequence"],
        "0010" : ["CS", "SegmentationFractionalType"]
    },
    "0064" : {
        "0002" : ["SQ", "DeformableRegistrationSequence"],
        "0003" : ["UI", "SourceFrameOfReferenceUID"],
        "0005" : ["SQ", "DeformableRegistrationGridSequence"],
        "0007" : ["UL", "GridDimensions"],
        "0008" : ["FD", "GridResolution"],
        "0009" : ["OF", "VectorGridData"],
        "000F" : ["SQ", "PreDeformationMatrixRegistrationSequence"],
        "0010" : ["SQ", "PostDeformationMatrixRegistrationSequence"]
    },
    "0066" : {
        "0001" : ["UL", "NumberOfSurfaces"],
        "0002" : ["SQ", "SurfaceSequence"],
        "0003" : ["UL", "SurfaceNumber"],
        "0004" : ["LT", "SurfaceComments"],
        "0009" : ["CS", "SurfaceProcessing"],
        "000A" : ["FL", "SurfaceProcessingRatio"],
        "000B" : ["LO", "SurfaceProcessingDescription"],
        "000C" : ["FL", "RecommendedPresentationOpacity"],
        "000D" : ["CS", "RecommendedPresentationType"],
        "000E" : ["CS", "FiniteVolume"],
        "0010" : ["CS", "Manifold"],
        "0011" : ["SQ", "SurfacePointsSequence"],
        "0012" : ["SQ", "SurfacePointsNormalsSequence"],
        "0013" : ["SQ", "SurfaceMeshPrimitivesSequence"],
        "0015" : ["UL", "NumberOfSurfacePoints"],
        "0016" : ["OF", "PointCoordinatesData"],
        "0017" : ["FL", "PointPositionAccuracy"],
        "0018" : ["FL", "MeanPointDistance"],
        "0019" : ["FL", "MaximumPointDistance"],
        "001A" : ["FL", "PointsBoundingBoxCoordinates"],
        "001B" : ["FL", "AxisOfRotation"],
        "001C" : ["FL", "CenterOfRotation"],
        "001E" : ["UL", "NumberOfVectors"],
        "001F" : ["US", "VectorDimensionality"],
        "0020" : ["FL", "VectorAccuracy"],
        "0021" : ["OF", "VectorCoordinateData"],
        "0023" : ["OW", "TrianglePointIndexList"],
        "0024" : ["OW", "EdgePointIndexList"],
        "0025" : ["OW", "VertexPointIndexList"],
        "0026" : ["SQ", "TriangleStripSequence"],
        "0027" : ["SQ", "TriangleFanSequence"],
        "0028" : ["SQ", "LineSequence"],
        "0029" : ["OW", "PrimitivePointIndexList"],
        "002A" : ["UL", "SurfaceCount"],
        "002B" : ["SQ", "ReferencedSurfaceSequence"],
        "002C" : ["UL", "ReferencedSurfaceNumber"],
        "002D" : ["SQ", "SegmentSurfaceGenerationAlgorithmIdentificationSequence"],
        "002E" : ["SQ", "SegmentSurfaceSourceInstanceSequence"],
        "002F" : ["SQ", "AlgorithmFamilyCodeSequence"],
        "0030" : ["SQ", "AlgorithmNameCodeSequence"],
        "0031" : ["LO", "AlgorithmVersion"],
        "0032" : ["LT", "AlgorithmParameters"],
        "0034" : ["SQ", "FacetSequence"],
        "0035" : ["SQ", "SurfaceProcessingAlgorithmIdentificationSequence"],
        "0036" : ["LO", "AlgorithmName"]
    },
    "0068" : {
        "6210" : ["LO", "ImplantSize"],
        "6221" : ["LO", "ImplantTemplateVersion"],
        "6222" : ["SQ", "ReplacedImplantTemplateSequence"],
        "6223" : ["CS", "ImplantType"],
        "6224" : ["SQ", "DerivationImplantTemplateSequence"],
        "6225" : ["SQ", "OriginalImplantTemplateSequence"],
        "6226" : ["DT", "EffectiveDateTime"],
        "6230" : ["SQ", "ImplantTargetAnatomySequence"],
        "6260" : ["SQ", "InformationFromManufacturerSequence"],
        "6265" : ["SQ", "NotificationFromManufacturerSequence"],
        "6270" : ["DT", "InformationIssueDateTime"],
        "6280" : ["ST", "InformationSummary"],
        "62A0" : ["SQ", "ImplantRegulatoryDisapprovalCodeSequence"],
        "62A5" : ["FD", "OverallTemplateSpatialTolerance"],
        "62C0" : ["SQ", "HPGLDocumentSequence"],
        "62D0" : ["US", "HPGLDocumentID"],
        "62D5" : ["LO", "HPGLDocumentLabel"],
        "62E0" : ["SQ", "ViewOrientationCodeSequence"],
        "62F0" : ["FD", "ViewOrientationModifier"],
        "62F2" : ["FD", "HPGLDocumentScaling"],
        "6300" : ["OB", "HPGLDocument"],
        "6310" : ["US", "HPGLContourPenNumber"],
        "6320" : ["SQ", "HPGLPenSequence"],
        "6330" : ["US", "HPGLPenNumber"],
        "6340" : ["LO", "HPGLPenLabel"],
        "6345" : ["ST", "HPGLPenDescription"],
        "6346" : ["FD", "RecommendedRotationPoint"],
        "6347" : ["FD", "BoundingRectangle"],
        "6350" : ["US", "ImplantTemplate3DModelSurfaceNumber"],
        "6360" : ["SQ", "SurfaceModelDescriptionSequence"],
        "6380" : ["LO", "SurfaceModelLabel"],
        "6390" : ["FD", "SurfaceModelScalingFactor"],
        "63A0" : ["SQ", "MaterialsCodeSequence"],
        "63A4" : ["SQ", "CoatingMaterialsCodeSequence"],
        "63A8" : ["SQ", "ImplantTypeCodeSequence"],
        "63AC" : ["SQ", "FixationMethodCodeSequence"],
        "63B0" : ["SQ", "MatingFeatureSetsSequence"],
        "63C0" : ["US", "MatingFeatureSetID"],
        "63D0" : ["LO", "MatingFeatureSetLabel"],
        "63E0" : ["SQ", "MatingFeatureSequence"],
        "63F0" : ["US", "MatingFeatureID"],
        "6400" : ["SQ", "MatingFeatureDegreeOfFreedomSequence"],
        "6410" : ["US", "DegreeOfFreedomID"],
        "6420" : ["CS", "DegreeOfFreedomType"],
        "6430" : ["SQ", "TwoDMatingFeatureCoordinatesSequence"],
        "6440" : ["US", "ReferencedHPGLDocumentID"],
        "6450" : ["FD", "TwoDMatingPoint"],
        "6460" : ["FD", "TwoDMatingAxes"],
        "6470" : ["SQ", "TwoDDegreeOfFreedomSequence"],
        "6490" : ["FD", "ThreeDDegreeOfFreedomAxis"],
        "64A0" : ["FD", "RangeOfFreedom"],
        "64C0" : ["FD", "ThreeDMatingPoint"],
        "64D0" : ["FD", "ThreeDMatingAxes"],
        "64F0" : ["FD", "TwoDDegreeOfFreedomAxis"],
        "6500" : ["SQ", "PlanningLandmarkPointSequence"],
        "6510" : ["SQ", "PlanningLandmarkLineSequence"],
        "6520" : ["SQ", "PlanningLandmarkPlaneSequence"],
        "6530" : ["US", "PlanningLandmarkID"],
        "6540" : ["LO", "PlanningLandmarkDescription"],
        "6545" : ["SQ", "PlanningLandmarkIdentificationCodeSequence"],
        "6550" : ["SQ", "TwoDPointCoordinatesSequence"],
        "6560" : ["FD", "TwoDPointCoordinates"],
        "6590" : ["FD", "ThreeDPointCoordinates"],
        "65A0" : ["SQ", "TwoDLineCoordinatesSequence"],
        "65B0" : ["FD", "TwoDLineCoordinates"],
        "65D0" : ["FD", "ThreeDLineCoordinates"],
        "65E0" : ["SQ", "TwoDPlaneCoordinatesSequence"],
        "65F0" : ["FD", "TwoDPlaneIntersection"],
        "6610" : ["FD", "ThreeDPlaneOrigin"],
        "6620" : ["FD", "ThreeDPlaneNormal"]
    },
    "0070" : {
        "0001" : ["SQ", "GraphicAnnotationSequence"],
        "0002" : ["CS", "GraphicLayer"],
        "0003" : ["CS", "BoundingBoxAnnotationUnits"],
        "0004" : ["CS", "AnchorPointAnnotationUnits"],
        "0005" : ["CS", "GraphicAnnotationUnits"],
        "0006" : ["ST", "UnformattedTextValue"],
        "0008" : ["SQ", "TextObjectSequence"],
        "0009" : ["SQ", "GraphicObjectSequence"],
        "0010" : ["FL", "BoundingBoxTopLeftHandCorner"],
        "0011" : ["FL", "BoundingBoxBottomRightHandCorner"],
        "0012" : ["CS", "BoundingBoxTextHorizontalJustification"],
        "0014" : ["FL", "AnchorPoint"],
        "0015" : ["CS", "AnchorPointVisibility"],
        "0020" : ["US", "GraphicDimensions"],
        "0021" : ["US", "NumberOfGraphicPoints"],
        "0022" : ["FL", "GraphicData"],
        "0023" : ["CS", "GraphicType"],
        "0024" : ["CS", "GraphicFilled"],
        "0040" : ["IS", "ImageRotationRetired"],
        "0041" : ["CS", "ImageHorizontalFlip"],
        "0042" : ["US", "ImageRotation"],
        "0050" : ["US", "DisplayedAreaTopLeftHandCornerTrial"],
        "0051" : ["US", "DisplayedAreaBottomRightHandCornerTrial"],
        "0052" : ["SL", "DisplayedAreaTopLeftHandCorner"],
        "0053" : ["SL", "DisplayedAreaBottomRightHandCorner"],
        "005A" : ["SQ", "DisplayedAreaSelectionSequence"],
        "0060" : ["SQ", "GraphicLayerSequence"],
        "0062" : ["IS", "GraphicLayerOrder"],
        "0066" : ["US", "GraphicLayerRecommendedDisplayGrayscaleValue"],
        "0067" : ["US", "GraphicLayerRecommendedDisplayRGBValue"],
        "0068" : ["LO", "GraphicLayerDescription"],
        "0080" : ["CS", "ContentLabel"],
        "0081" : ["LO", "ContentDescription"],
        "0082" : ["DA", "PresentationCreationDate"],
        "0083" : ["TM", "PresentationCreationTime"],
        "0084" : ["PN", "ContentCreatorName"],
        "0086" : ["SQ", "ContentCreatorIdentificationCodeSequence"],
        "0087" : ["SQ", "AlternateContentDescriptionSequence"],
        "0100" : ["CS", "PresentationSizeMode"],
        "0101" : ["DS", "PresentationPixelSpacing"],
        "0102" : ["IS", "PresentationPixelAspectRatio"],
        "0103" : ["FL", "PresentationPixelMagnificationRatio"],
        "0207" : ["LO", "GraphicGroupLabel"],
        "0208" : ["ST", "GraphicGroupDescription"],
        "0209" : ["SQ", "CompoundGraphicSequence"],
        "0226" : ["UL", "CompoundGraphicInstanceID"],
        "0227" : ["LO", "FontName"],
        "0228" : ["CS", "FontNameType"],
        "0229" : ["LO", "CSSFontName"],
        "0230" : ["FD", "RotationAngle"],
        "0231" : ["SQ", "TextStyleSequence"],
        "0232" : ["SQ", "LineStyleSequence"],
        "0233" : ["SQ", "FillStyleSequence"],
        "0234" : ["SQ", "GraphicGroupSequence"],
        "0241" : ["US", "TextColorCIELabValue"],
        "0242" : ["CS", "HorizontalAlignment"],
        "0243" : ["CS", "VerticalAlignment"],
        "0244" : ["CS", "ShadowStyle"],
        "0245" : ["FL", "ShadowOffsetX"],
        "0246" : ["FL", "ShadowOffsetY"],
        "0247" : ["US", "ShadowColorCIELabValue"],
        "0248" : ["CS", "Underlined"],
        "0249" : ["CS", "Bold"],
        "0250" : ["CS", "Italic"],
        "0251" : ["US", "PatternOnColorCIELabValue"],
        "0252" : ["US", "PatternOffColorCIELabValue"],
        "0253" : ["FL", "LineThickness"],
        "0254" : ["CS", "LineDashingStyle"],
        "0255" : ["UL", "LinePattern"],
        "0256" : ["OB", "FillPattern"],
        "0257" : ["CS", "FillMode"],
        "0258" : ["FL", "ShadowOpacity"],
        "0261" : ["FL", "GapLength"],
        "0262" : ["FL", "DiameterOfVisibility"],
        "0273" : ["FL", "RotationPoint"],
        "0274" : ["CS", "TickAlignment"],
        "0278" : ["CS", "ShowTickLabel"],
        "0279" : ["CS", "TickLabelAlignment"],
        "0282" : ["CS", "CompoundGraphicUnits"],
        "0284" : ["FL", "PatternOnOpacity"],
        "0285" : ["FL", "PatternOffOpacity"],
        "0287" : ["SQ", "MajorTicksSequence"],
        "0288" : ["FL", "TickPosition"],
        "0289" : ["SH", "TickLabel"],
        "0294" : ["CS", "CompoundGraphicType"],
        "0295" : ["UL", "GraphicGroupID"],
        "0306" : ["CS", "ShapeType"],
        "0308" : ["SQ", "RegistrationSequence"],
        "0309" : ["SQ", "MatrixRegistrationSequence"],
        "030A" : ["SQ", "MatrixSequence"],
        "030C" : ["CS", "FrameOfReferenceTransformationMatrixType"],
        "030D" : ["SQ", "RegistrationTypeCodeSequence"],
        "030F" : ["ST", "FiducialDescription"],
        "0310" : ["SH", "FiducialIdentifier"],
        "0311" : ["SQ", "FiducialIdentifierCodeSequence"],
        "0312" : ["FD", "ContourUncertaintyRadius"],
        "0314" : ["SQ", "UsedFiducialsSequence"],
        "0318" : ["SQ", "GraphicCoordinatesDataSequence"],
        "031A" : ["UI", "FiducialUID"],
        "031C" : ["SQ", "FiducialSetSequence"],
        "031E" : ["SQ", "FiducialSequence"],
        "0401" : ["US", "GraphicLayerRecommendedDisplayCIELabValue"],
        "0402" : ["SQ", "BlendingSequence"],
        "0403" : ["FL", "RelativeOpacity"],
        "0404" : ["SQ", "ReferencedSpatialRegistrationSequence"],
        "0405" : ["CS", "BlendingPosition"]
    },
    "0072" : {
        "0002" : ["SH", "HangingProtocolName"],
        "0004" : ["LO", "HangingProtocolDescription"],
        "0006" : ["CS", "HangingProtocolLevel"],
        "0008" : ["LO", "HangingProtocolCreator"],
        "000A" : ["DT", "HangingProtocolCreationDateTime"],
        "000C" : ["SQ", "HangingProtocolDefinitionSequence"],
        "000E" : ["SQ", "HangingProtocolUserIdentificationCodeSequence"],
        "0010" : ["LO", "HangingProtocolUserGroupName"],
        "0012" : ["SQ", "SourceHangingProtocolSequence"],
        "0014" : ["US", "NumberOfPriorsReferenced"],
        "0020" : ["SQ", "ImageSetsSequence"],
        "0022" : ["SQ", "ImageSetSelectorSequence"],
        "0024" : ["CS", "ImageSetSelectorUsageFlag"],
        "0026" : ["AT", "SelectorAttribute"],
        "0028" : ["US", "SelectorValueNumber"],
        "0030" : ["SQ", "TimeBasedImageSetsSequence"],
        "0032" : ["US", "ImageSetNumber"],
        "0034" : ["CS", "ImageSetSelectorCategory"],
        "0038" : ["US", "RelativeTime"],
        "003A" : ["CS", "RelativeTimeUnits"],
        "003C" : ["SS", "AbstractPriorValue"],
        "003E" : ["SQ", "AbstractPriorCodeSequence"],
        "0040" : ["LO", "ImageSetLabel"],
        "0050" : ["CS", "SelectorAttributeVR"],
        "0052" : ["AT", "SelectorSequencePointer"],
        "0054" : ["LO", "SelectorSequencePointerPrivateCreator"],
        "0056" : ["LO", "SelectorAttributePrivateCreator"],
        "0060" : ["AT", "SelectorATValue"],
        "0062" : ["CS", "SelectorCSValue"],
        "0064" : ["IS", "SelectorISValue"],
        "0066" : ["LO", "SelectorLOValue"],
        "0068" : ["LT", "SelectorLTValue"],
        "006A" : ["PN", "SelectorPNValue"],
        "006C" : ["SH", "SelectorSHValue"],
        "006E" : ["ST", "SelectorSTValue"],
        "0070" : ["UT", "SelectorUTValue"],
        "0072" : ["DS", "SelectorDSValue"],
        "0074" : ["FD", "SelectorFDValue"],
        "0076" : ["FL", "SelectorFLValue"],
        "0078" : ["UL", "SelectorULValue"],
        "007A" : ["US", "SelectorUSValue"],
        "007C" : ["SL", "SelectorSLValue"],
        "007E" : ["SS", "SelectorSSValue"],
        "0080" : ["SQ", "SelectorCodeSequenceValue"],
        "0100" : ["US", "NumberOfScreens"],
        "0102" : ["SQ", "NominalScreenDefinitionSequence"],
        "0104" : ["US", "NumberOfVerticalPixels"],
        "0106" : ["US", "NumberOfHorizontalPixels"],
        "0108" : ["FD", "DisplayEnvironmentSpatialPosition"],
        "010A" : ["US", "ScreenMinimumGrayscaleBitDepth"],
        "010C" : ["US", "ScreenMinimumColorBitDepth"],
        "010E" : ["US", "ApplicationMaximumRepaintTime"],
        "0200" : ["SQ", "DisplaySetsSequence"],
        "0202" : ["US", "DisplaySetNumber"],
        "0203" : ["LO", "DisplaySetLabel"],
        "0204" : ["US", "DisplaySetPresentationGroup"],
        "0206" : ["LO", "DisplaySetPresentationGroupDescription"],
        "0208" : ["CS", "PartialDataDisplayHandling"],
        "0210" : ["SQ", "SynchronizedScrollingSequence"],
        "0212" : ["US", "DisplaySetScrollingGroup"],
        "0214" : ["SQ", "NavigationIndicatorSequence"],
        "0216" : ["US", "NavigationDisplaySet"],
        "0218" : ["US", "ReferenceDisplaySets"],
        "0300" : ["SQ", "ImageBoxesSequence"],
        "0302" : ["US", "ImageBoxNumber"],
        "0304" : ["CS", "ImageBoxLayoutType"],
        "0306" : ["US", "ImageBoxTileHorizontalDimension"],
        "0308" : ["US", "ImageBoxTileVerticalDimension"],
        "0310" : ["CS", "ImageBoxScrollDirection"],
        "0312" : ["CS", "ImageBoxSmallScrollType"],
        "0314" : ["US", "ImageBoxSmallScrollAmount"],
        "0316" : ["CS", "ImageBoxLargeScrollType"],
        "0318" : ["US", "ImageBoxLargeScrollAmount"],
        "0320" : ["US", "ImageBoxOverlapPriority"],
        "0330" : ["FD", "CineRelativeToRealTime"],
        "0400" : ["SQ", "FilterOperationsSequence"],
        "0402" : ["CS", "FilterByCategory"],
        "0404" : ["CS", "FilterByAttributePresence"],
        "0406" : ["CS", "FilterByOperator"],
        "0420" : ["US", "StructuredDisplayBackgroundCIELabValue"],
        "0421" : ["US", "EmptyImageBoxCIELabValue"],
        "0422" : ["SQ", "StructuredDisplayImageBoxSequence"],
        "0424" : ["SQ", "StructuredDisplayTextBoxSequence"],
        "0427" : ["SQ", "ReferencedFirstFrameSequence"],
        "0430" : ["SQ", "ImageBoxSynchronizationSequence"],
        "0432" : ["US", "SynchronizedImageBoxList"],
        "0434" : ["CS", "TypeOfSynchronization"],
        "0500" : ["CS", "BlendingOperationType"],
        "0510" : ["CS", "ReformattingOperationType"],
        "0512" : ["FD", "ReformattingThickness"],
        "0514" : ["FD", "ReformattingInterval"],
        "0516" : ["CS", "ReformattingOperationInitialViewDirection"],
        "0520" : ["CS", "ThreeDRenderingType"],
        "0600" : ["SQ", "SortingOperationsSequence"],
        "0602" : ["CS", "SortByCategory"],
        "0604" : ["CS", "SortingDirection"],
        "0700" : ["CS", "DisplaySetPatientOrientation"],
        "0702" : ["CS", "VOIType"],
        "0704" : ["CS", "PseudoColorType"],
        "0705" : ["SQ", "PseudoColorPaletteInstanceReferenceSequence"],
        "0706" : ["CS", "ShowGrayscaleInverted"],
        "0710" : ["CS", "ShowImageTrueSizeFlag"],
        "0712" : ["CS", "ShowGraphicAnnotationFlag"],
        "0714" : ["CS", "ShowPatientDemographicsFlag"],
        "0716" : ["CS", "ShowAcquisitionTechniquesFlag"],
        "0717" : ["CS", "DisplaySetHorizontalJustification"],
        "0718" : ["CS", "DisplaySetVerticalJustification"]
    },
    "0074" : {
        "0120" : ["FD", "ContinuationStartMeterset"],
        "0121" : ["FD", "ContinuationEndMeterset"],
        "1000" : ["CS", "ProcedureStepState"],
        "1002" : ["SQ", "ProcedureStepProgressInformationSequence"],
        "1004" : ["DS", "ProcedureStepProgress"],
        "1006" : ["ST", "ProcedureStepProgressDescription"],
        "1008" : ["SQ", "ProcedureStepCommunicationsURISequence"],
        "100A" : ["ST", "ContactURI"],
        "100C" : ["LO", "ContactDisplayName"],
        "100E" : ["SQ", "ProcedureStepDiscontinuationReasonCodeSequence"],
        "1020" : ["SQ", "BeamTaskSequence"],
        "1022" : ["CS", "BeamTaskType"],
        "1024" : ["IS", "BeamOrderIndexTrial"],
        "1026" : ["FD", "TableTopVerticalAdjustedPosition"],
        "1027" : ["FD", "TableTopLongitudinalAdjustedPosition"],
        "1028" : ["FD", "TableTopLateralAdjustedPosition"],
        "102A" : ["FD", "PatientSupportAdjustedAngle"],
        "102B" : ["FD", "TableTopEccentricAdjustedAngle"],
        "102C" : ["FD", "TableTopPitchAdjustedAngle"],
        "102D" : ["FD", "TableTopRollAdjustedAngle"],
        "1030" : ["SQ", "DeliveryVerificationImageSequence"],
        "1032" : ["CS", "VerificationImageTiming"],
        "1034" : ["CS", "DoubleExposureFlag"],
        "1036" : ["CS", "DoubleExposureOrdering"],
        "1038" : ["DS", "DoubleExposureMetersetTrial"],
        "103A" : ["DS", "DoubleExposureFieldDeltaTrial"],
        "1040" : ["SQ", "RelatedReferenceRTImageSequence"],
        "1042" : ["SQ", "GeneralMachineVerificationSequence"],
        "1044" : ["SQ", "ConventionalMachineVerificationSequence"],
        "1046" : ["SQ", "IonMachineVerificationSequence"],
        "1048" : ["SQ", "FailedAttributesSequence"],
        "104A" : ["SQ", "OverriddenAttributesSequence"],
        "104C" : ["SQ", "ConventionalControlPointVerificationSequence"],
        "104E" : ["SQ", "IonControlPointVerificationSequence"],
        "1050" : ["SQ", "AttributeOccurrenceSequence"],
        "1052" : ["AT", "AttributeOccurrencePointer"],
        "1054" : ["UL", "AttributeItemSelector"],
        "1056" : ["LO", "AttributeOccurrencePrivateCreator"],
        "1057" : ["IS", "SelectorSequencePointerItems"],
        "1200" : ["CS", "ScheduledProcedureStepPriority"],
        "1202" : ["LO", "WorklistLabel"],
        "1204" : ["LO", "ProcedureStepLabel"],
        "1210" : ["SQ", "ScheduledProcessingParametersSequence"],
        "1212" : ["SQ", "PerformedProcessingParametersSequence"],
        "1216" : ["SQ", "UnifiedProcedureStepPerformedProcedureSequence"],
        "1220" : ["SQ", "RelatedProcedureStepSequence"],
        "1222" : ["LO", "ProcedureStepRelationshipType"],
        "1224" : ["SQ", "ReplacedProcedureStepSequence"],
        "1230" : ["LO", "DeletionLock"],
        "1234" : ["AE", "ReceivingAE"],
        "1236" : ["AE", "RequestingAE"],
        "1238" : ["LT", "ReasonForCancellation"],
        "1242" : ["CS", "SCPStatus"],
        "1244" : ["CS", "SubscriptionListStatus"],
        "1246" : ["CS", "UnifiedProcedureStepListStatus"],
        "1324" : ["UL", "BeamOrderIndex"],
        "1338" : ["FD", "DoubleExposureMeterset"],
        "133A" : ["FD", "DoubleExposureFieldDelta"]
    },
    "0076" : {
        "0001" : ["LO", "ImplantAssemblyTemplateName"],
        "0003" : ["LO", "ImplantAssemblyTemplateIssuer"],
        "0006" : ["LO", "ImplantAssemblyTemplateVersion"],
        "0008" : ["SQ", "ReplacedImplantAssemblyTemplateSequence"],
        "000A" : ["CS", "ImplantAssemblyTemplateType"],
        "000C" : ["SQ", "OriginalImplantAssemblyTemplateSequence"],
        "000E" : ["SQ", "DerivationImplantAssemblyTemplateSequence"],
        "0010" : ["SQ", "ImplantAssemblyTemplateTargetAnatomySequence"],
        "0020" : ["SQ", "ProcedureTypeCodeSequence"],
        "0030" : ["LO", "SurgicalTechnique"],
        "0032" : ["SQ", "ComponentTypesSequence"],
        "0034" : ["CS", "ComponentTypeCodeSequence"],
        "0036" : ["CS", "ExclusiveComponentType"],
        "0038" : ["CS", "MandatoryComponentType"],
        "0040" : ["SQ", "ComponentSequence"],
        "0055" : ["US", "ComponentID"],
        "0060" : ["SQ", "ComponentAssemblySequence"],
        "0070" : ["US", "Component1ReferencedID"],
        "0080" : ["US", "Component1ReferencedMatingFeatureSetID"],
        "0090" : ["US", "Component1ReferencedMatingFeatureID"],
        "00A0" : ["US", "Component2ReferencedID"],
        "00B0" : ["US", "Component2ReferencedMatingFeatureSetID"],
        "00C0" : ["US", "Component2ReferencedMatingFeatureID"]
    },
    "0078" : {
        "0001" : ["LO", "ImplantTemplateGroupName"],
        "0010" : ["ST", "ImplantTemplateGroupDescription"],
        "0020" : ["LO", "ImplantTemplateGroupIssuer"],
        "0024" : ["LO", "ImplantTemplateGroupVersion"],
        "0026" : ["SQ", "ReplacedImplantTemplateGroupSequence"],
        "0028" : ["SQ", "ImplantTemplateGroupTargetAnatomySequence"],
        "002A" : ["SQ", "ImplantTemplateGroupMembersSequence"],
        "002E" : ["US", "ImplantTemplateGroupMemberID"],
        "0050" : ["FD", "ThreeDImplantTemplateGroupMemberMatchingPoint"],
        "0060" : ["FD", "ThreeDImplantTemplateGroupMemberMatchingAxes"],
        "0070" : ["SQ", "ImplantTemplateGroupMemberMatching2DCoordinatesSequence"],
        "0090" : ["FD", "TwoDImplantTemplateGroupMemberMatchingPoint"],
        "00A0" : ["FD", "TwoDImplantTemplateGroupMemberMatchingAxes"],
        "00B0" : ["SQ", "ImplantTemplateGroupVariationDimensionSequence"],
        "00B2" : ["LO", "ImplantTemplateGroupVariationDimensionName"],
        "00B4" : ["SQ", "ImplantTemplateGroupVariationDimensionRankSequence"],
        "00B6" : ["US", "ReferencedImplantTemplateGroupMemberID"],
        "00B8" : ["US", "ImplantTemplateGroupVariationDimensionRank"]
    },
    "0088" : {
        "0130" : ["SH", "StorageMediaFileSetID"],
        "0140" : ["UI", "StorageMediaFileSetUID"],
        "0200" : ["SQ", "IconImageSequence"],
        "0904" : ["LO", "TopicTitle"],
        "0906" : ["ST", "TopicSubject"],
        "0910" : ["LO", "TopicAuthor"],
        "0912" : ["LO", "TopicKeywords"]
    },
    "0100" : {
        "0410" : ["CS", "SOPInstanceStatus"],
        "0420" : ["DT", "SOPAuthorizationDateTime"],
        "0424" : ["LT", "SOPAuthorizationComment"],
        "0426" : ["LO", "AuthorizationEquipmentCertificationNumber"]
    },
    "0400" : {
        "0005" : ["US", "MACIDNumber"],
        "0010" : ["UI", "MACCalculationTransferSyntaxUID"],
        "0015" : ["CS", "MACAlgorithm"],
        "0020" : ["AT", "DataElementsSigned"],
        "0100" : ["UI", "DigitalSignatureUID"],
        "0105" : ["DT", "DigitalSignatureDateTime"],
        "0110" : ["CS", "CertificateType"],
        "0115" : ["OB", "CertificateOfSigner"],
        "0120" : ["OB", "Signature"],
        "0305" : ["CS", "CertifiedTimestampType"],
        "0310" : ["OB", "CertifiedTimestamp"],
        "0401" : ["SQ", "DigitalSignaturePurposeCodeSequence"],
        "0402" : ["SQ", "ReferencedDigitalSignatureSequence"],
        "0403" : ["SQ", "ReferencedSOPInstanceMACSequence"],
        "0404" : ["OB", "MAC"],
        "0500" : ["SQ", "EncryptedAttributesSequence"],
        "0510" : ["UI", "EncryptedContentTransferSyntaxUID"],
        "0520" : ["OB", "EncryptedContent"],
        "0550" : ["SQ", "ModifiedAttributesSequence"],
        "0561" : ["SQ", "OriginalAttributesSequence"],
        "0562" : ["DT", "AttributeModificationDateTime"],
        "0563" : ["LO", "ModifyingSystem"],
        "0564" : ["LO", "SourceOfPreviousValues"],
        "0565" : ["CS", "ReasonForTheAttributeModification"]
    },
    "2000" : {
        "0010" : ["IS", "NumberOfCopies"],
        "001E" : ["SQ", "PrinterConfigurationSequence"],
        "0020" : ["CS", "PrintPriority"],
        "0030" : ["CS", "MediumType"],
        "0040" : ["CS", "FilmDestination"],
        "0050" : ["LO", "FilmSessionLabel"],
        "0060" : ["IS", "MemoryAllocation"],
        "0061" : ["IS", "MaximumMemoryAllocation"],
        "0062" : ["CS", "ColorImagePrintingFlag"],
        "0063" : ["CS", "CollationFlag"],
        "0065" : ["CS", "AnnotationFlag"],
        "0067" : ["CS", "ImageOverlayFlag"],
        "0069" : ["CS", "PresentationLUTFlag"],
        "006A" : ["CS", "ImageBoxPresentationLUTFlag"],
        "00A0" : ["US", "MemoryBitDepth"],
        "00A1" : ["US", "PrintingBitDepth"],
        "00A2" : ["SQ", "MediaInstalledSequence"],
        "00A4" : ["SQ", "OtherMediaAvailableSequence"],
        "00A8" : ["SQ", "SupportedImageDisplayFormatsSequence"],
        "0500" : ["SQ", "ReferencedFilmBoxSequence"],
        "0510" : ["SQ", "ReferencedStoredPrintSequence"]
    },
    "2010" : {
        "0010" : ["ST", "ImageDisplayFormat"],
        "0030" : ["CS", "AnnotationDisplayFormatID"],
        "0040" : ["CS", "FilmOrientation"],
        "0050" : ["CS", "FilmSizeID"],
        "0052" : ["CS", "PrinterResolutionID"],
        "0054" : ["CS", "DefaultPrinterResolutionID"],
        "0060" : ["CS", "MagnificationType"],
        "0080" : ["CS", "SmoothingType"],
        "00A6" : ["CS", "DefaultMagnificationType"],
        "00A7" : ["CS", "OtherMagnificationTypesAvailable"],
        "00A8" : ["CS", "DefaultSmoothingType"],
        "00A9" : ["CS", "OtherSmoothingTypesAvailable"],
        "0100" : ["CS", "BorderDensity"],
        "0110" : ["CS", "EmptyImageDensity"],
        "0120" : ["US", "MinDensity"],
        "0130" : ["US", "MaxDensity"],
        "0140" : ["CS", "Trim"],
        "0150" : ["ST", "ConfigurationInformation"],
        "0152" : ["LT", "ConfigurationInformationDescription"],
        "0154" : ["IS", "MaximumCollatedFilms"],
        "015E" : ["US", "Illumination"],
        "0160" : ["US", "ReflectedAmbientLight"],
        "0376" : ["DS", "PrinterPixelSpacing"],
        "0500" : ["SQ", "ReferencedFilmSessionSequence"],
        "0510" : ["SQ", "ReferencedImageBoxSequence"],
        "0520" : ["SQ", "ReferencedBasicAnnotationBoxSequence"]
    },
    "2020" : {
        "0010" : ["US", "ImageBoxPosition"],
        "0020" : ["CS", "Polarity"],
        "0030" : ["DS", "RequestedImageSize"],
        "0040" : ["CS", "RequestedDecimateCropBehavior"],
        "0050" : ["CS", "RequestedResolutionID"],
        "00A0" : ["CS", "RequestedImageSizeFlag"],
        "00A2" : ["CS", "DecimateCropResult"],
        "0110" : ["SQ", "BasicGrayscaleImageSequence"],
        "0111" : ["SQ", "BasicColorImageSequence"],
        "0130" : ["SQ", "ReferencedImageOverlayBoxSequence"],
        "0140" : ["SQ", "ReferencedVOILUTBoxSequence"]
    },
    "2030" : {
        "0010" : ["US", "AnnotationPosition"],
        "0020" : ["LO", "TextString"]
    },
    "2040" : {
        "0010" : ["SQ", "ReferencedOverlayPlaneSequence"],
        "0011" : ["US", "ReferencedOverlayPlaneGroups"],
        "0020" : ["SQ", "OverlayPixelDataSequence"],
        "0060" : ["CS", "OverlayMagnificationType"],
        "0070" : ["CS", "OverlaySmoothingType"],
        "0072" : ["CS", "OverlayOrImageMagnification"],
        "0074" : ["US", "MagnifyToNumberOfColumns"],
        "0080" : ["CS", "OverlayForegroundDensity"],
        "0082" : ["CS", "OverlayBackgroundDensity"],
        "0090" : ["CS", "OverlayMode"],
        "0100" : ["CS", "ThresholdDensity"],
        "0500" : ["SQ", "ReferencedImageBoxSequenceRetired"]
    },
    "2050" : {
        "0010" : ["SQ", "PresentationLUTSequence"],
        "0020" : ["CS", "PresentationLUTShape"],
        "0500" : ["SQ", "ReferencedPresentationLUTSequence"]
    },
    "2100" : {
        "0010" : ["SH", "PrintJobID"],
        "0020" : ["CS", "ExecutionStatus"],
        "0030" : ["CS", "ExecutionStatusInfo"],
        "0040" : ["DA", "CreationDate"],
        "0050" : ["TM", "CreationTime"],
        "0070" : ["AE", "Originator"],
        "0140" : ["AE", "DestinationAE"],
        "0160" : ["SH", "OwnerID"],
        "0170" : ["IS", "NumberOfFilms"],
        "0500" : ["SQ", "ReferencedPrintJobSequencePullStoredPrint"]
    },
    "2110" : {
        "0010" : ["CS", "PrinterStatus"],
        "0020" : ["CS", "PrinterStatusInfo"],
        "0030" : ["LO", "PrinterName"],
        "0099" : ["SH", "PrintQueueID"]
    },
    "2120" : {
        "0010" : ["CS", "QueueStatus"],
        "0050" : ["SQ", "PrintJobDescriptionSequence"],
        "0070" : ["SQ", "ReferencedPrintJobSequence"]
    },
    "2130" : {
        "0010" : ["SQ", "PrintManagementCapabilitiesSequence"],
        "0015" : ["SQ", "PrinterCharacteristicsSequence"],
        "0030" : ["SQ", "FilmBoxContentSequence"],
        "0040" : ["SQ", "ImageBoxContentSequence"],
        "0050" : ["SQ", "AnnotationContentSequence"],
        "0060" : ["SQ", "ImageOverlayBoxContentSequence"],
        "0080" : ["SQ", "PresentationLUTContentSequence"],
        "00A0" : ["SQ", "ProposedStudySequence"],
        "00C0" : ["SQ", "OriginalImageSequence"]
    },
    "2200" : {
        "0001" : ["CS", "LabelUsingInformationExtractedFromInstances"],
        "0002" : ["UT", "LabelText"],
        "0003" : ["CS", "LabelStyleSelection"],
        "0004" : ["LT", "MediaDisposition"],
        "0005" : ["LT", "BarcodeValue"],
        "0006" : ["CS", "BarcodeSymbology"],
        "0007" : ["CS", "AllowMediaSplitting"],
        "0008" : ["CS", "IncludeNonDICOMObjects"],
        "0009" : ["CS", "IncludeDisplayApplication"],
        "000A" : ["CS", "PreserveCompositeInstancesAfterMediaCreation"],
        "000B" : ["US", "TotalNumberOfPiecesOfMediaCreated"],
        "000C" : ["LO", "RequestedMediaApplicationProfile"],
        "000D" : ["SQ", "ReferencedStorageMediaSequence"],
        "000E" : ["AT", "FailureAttributes"],
        "000F" : ["CS", "AllowLossyCompression"],
        "0020" : ["CS", "RequestPriority"]
    },
    "3002" : {
        "0002" : ["SH", "RTImageLabel"],
        "0003" : ["LO", "RTImageName"],
        "0004" : ["ST", "RTImageDescription"],
        "000A" : ["CS", "ReportedValuesOrigin"],
        "000C" : ["CS", "RTImagePlane"],
        "000D" : ["DS", "XRayImageReceptorTranslation"],
        "000E" : ["DS", "XRayImageReceptorAngle"],
        "0010" : ["DS", "RTImageOrientation"],
        "0011" : ["DS", "ImagePlanePixelSpacing"],
        "0012" : ["DS", "RTImagePosition"],
        "0020" : ["SH", "RadiationMachineName"],
        "0022" : ["DS", "RadiationMachineSAD"],
        "0024" : ["DS", "RadiationMachineSSD"],
        "0026" : ["DS", "RTImageSID"],
        "0028" : ["DS", "SourceToReferenceObjectDistance"],
        "0029" : ["IS", "FractionNumber"],
        "0030" : ["SQ", "ExposureSequence"],
        "0032" : ["DS", "MetersetExposure"],
        "0034" : ["DS", "DiaphragmPosition"],
        "0040" : ["SQ", "FluenceMapSequence"],
        "0041" : ["CS", "FluenceDataSource"],
        "0042" : ["DS", "FluenceDataScale"],
        "0050" : ["SQ", "PrimaryFluenceModeSequence"],
        "0051" : ["CS", "FluenceMode"],
        "0052" : ["SH", "FluenceModeID"]
    },
    "3004" : {
        "0001" : ["CS", "DVHType"],
        "0002" : ["CS", "DoseUnits"],
        "0004" : ["CS", "DoseType"],
        "0006" : ["LO", "DoseComment"],
        "0008" : ["DS", "NormalizationPoint"],
        "000A" : ["CS", "DoseSummationType"],
        "000C" : ["DS", "GridFrameOffsetVector"],
        "000E" : ["DS", "DoseGridScaling"],
        "0010" : ["SQ", "RTDoseROISequence"],
        "0012" : ["DS", "DoseValue"],
        "0014" : ["CS", "TissueHeterogeneityCorrection"],
        "0040" : ["DS", "DVHNormalizationPoint"],
        "0042" : ["DS", "DVHNormalizationDoseValue"],
        "0050" : ["SQ", "DVHSequence"],
        "0052" : ["DS", "DVHDoseScaling"],
        "0054" : ["CS", "DVHVolumeUnits"],
        "0056" : ["IS", "DVHNumberOfBins"],
        "0058" : ["DS", "DVHData"],
        "0060" : ["SQ", "DVHReferencedROISequence"],
        "0062" : ["CS", "DVHROIContributionType"],
        "0070" : ["DS", "DVHMinimumDose"],
        "0072" : ["DS", "DVHMaximumDose"],
        "0074" : ["DS", "DVHMeanDose"]
    },
    "3006" : {
        "0002" : ["SH", "StructureSetLabel"],
        "0004" : ["LO", "StructureSetName"],
        "0006" : ["ST", "StructureSetDescription"],
        "0008" : ["DA", "StructureSetDate"],
        "0009" : ["TM", "StructureSetTime"],
        "0010" : ["SQ", "ReferencedFrameOfReferenceSequence"],
        "0012" : ["SQ", "RTReferencedStudySequence"],
        "0014" : ["SQ", "RTReferencedSeriesSequence"],
        "0016" : ["SQ", "ContourImageSequence"],
        "0020" : ["SQ", "StructureSetROISequence"],
        "0022" : ["IS", "ROINumber"],
        "0024" : ["UI", "ReferencedFrameOfReferenceUID"],
        "0026" : ["LO", "ROIName"],
        "0028" : ["ST", "ROIDescription"],
        "002A" : ["IS", "ROIDisplayColor"],
        "002C" : ["DS", "ROIVolume"],
        "0030" : ["SQ", "RTRelatedROISequence"],
        "0033" : ["CS", "RTROIRelationship"],
        "0036" : ["CS", "ROIGenerationAlgorithm"],
        "0038" : ["LO", "ROIGenerationDescription"],
        "0039" : ["SQ", "ROIContourSequence"],
        "0040" : ["SQ", "ContourSequence"],
        "0042" : ["CS", "ContourGeometricType"],
        "0044" : ["DS", "ContourSlabThickness"],
        "0045" : ["DS", "ContourOffsetVector"],
        "0046" : ["IS", "NumberOfContourPoints"],
        "0048" : ["IS", "ContourNumber"],
        "0049" : ["IS", "AttachedContours"],
        "0050" : ["DS", "ContourData"],
        "0080" : ["SQ", "RTROIObservationsSequence"],
        "0082" : ["IS", "ObservationNumber"],
        "0084" : ["IS", "ReferencedROINumber"],
        "0085" : ["SH", "ROIObservationLabel"],
        "0086" : ["SQ", "RTROIIdentificationCodeSequence"],
        "0088" : ["ST", "ROIObservationDescription"],
        "00A0" : ["SQ", "RelatedRTROIObservationsSequence"],
        "00A4" : ["CS", "RTROIInterpretedType"],
        "00A6" : ["PN", "ROIInterpreter"],
        "00B0" : ["SQ", "ROIPhysicalPropertiesSequence"],
        "00B2" : ["CS", "ROIPhysicalProperty"],
        "00B4" : ["DS", "ROIPhysicalPropertyValue"],
        "00B6" : ["SQ", "ROIElementalCompositionSequence"],
        "00B7" : ["US", "ROIElementalCompositionAtomicNumber"],
        "00B8" : ["FL", "ROIElementalCompositionAtomicMassFraction"],
        "00C0" : ["SQ", "FrameOfReferenceRelationshipSequence"],
        "00C2" : ["UI", "RelatedFrameOfReferenceUID"],
        "00C4" : ["CS", "FrameOfReferenceTransformationType"],
        "00C6" : ["DS", "FrameOfReferenceTransformationMatrix"],
        "00C8" : ["LO", "FrameOfReferenceTransformationComment"]
    },
    "3008" : {
        "0010" : ["SQ", "MeasuredDoseReferenceSequence"],
        "0012" : ["ST", "MeasuredDoseDescription"],
        "0014" : ["CS", "MeasuredDoseType"],
        "0016" : ["DS", "MeasuredDoseValue"],
        "0020" : ["SQ", "TreatmentSessionBeamSequence"],
        "0021" : ["SQ", "TreatmentSessionIonBeamSequence"],
        "0022" : ["IS", "CurrentFractionNumber"],
        "0024" : ["DA", "TreatmentControlPointDate"],
        "0025" : ["TM", "TreatmentControlPointTime"],
        "002A" : ["CS", "TreatmentTerminationStatus"],
        "002B" : ["SH", "TreatmentTerminationCode"],
        "002C" : ["CS", "TreatmentVerificationStatus"],
        "0030" : ["SQ", "ReferencedTreatmentRecordSequence"],
        "0032" : ["DS", "SpecifiedPrimaryMeterset"],
        "0033" : ["DS", "SpecifiedSecondaryMeterset"],
        "0036" : ["DS", "DeliveredPrimaryMeterset"],
        "0037" : ["DS", "DeliveredSecondaryMeterset"],
        "003A" : ["DS", "SpecifiedTreatmentTime"],
        "003B" : ["DS", "DeliveredTreatmentTime"],
        "0040" : ["SQ", "ControlPointDeliverySequence"],
        "0041" : ["SQ", "IonControlPointDeliverySequence"],
        "0042" : ["DS", "SpecifiedMeterset"],
        "0044" : ["DS", "DeliveredMeterset"],
        "0045" : ["FL", "MetersetRateSet"],
        "0046" : ["FL", "MetersetRateDelivered"],
        "0047" : ["FL", "ScanSpotMetersetsDelivered"],
        "0048" : ["DS", "DoseRateDelivered"],
        "0050" : ["SQ", "TreatmentSummaryCalculatedDoseReferenceSequence"],
        "0052" : ["DS", "CumulativeDoseToDoseReference"],
        "0054" : ["DA", "FirstTreatmentDate"],
        "0056" : ["DA", "MostRecentTreatmentDate"],
        "005A" : ["IS", "NumberOfFractionsDelivered"],
        "0060" : ["SQ", "OverrideSequence"],
        "0061" : ["AT", "ParameterSequencePointer"],
        "0062" : ["AT", "OverrideParameterPointer"],
        "0063" : ["IS", "ParameterItemIndex"],
        "0064" : ["IS", "MeasuredDoseReferenceNumber"],
        "0065" : ["AT", "ParameterPointer"],
        "0066" : ["ST", "OverrideReason"],
        "0068" : ["SQ", "CorrectedParameterSequence"],
        "006A" : ["FL", "CorrectionValue"],
        "0070" : ["SQ", "CalculatedDoseReferenceSequence"],
        "0072" : ["IS", "CalculatedDoseReferenceNumber"],
        "0074" : ["ST", "CalculatedDoseReferenceDescription"],
        "0076" : ["DS", "CalculatedDoseReferenceDoseValue"],
        "0078" : ["DS", "StartMeterset"],
        "007A" : ["DS", "EndMeterset"],
        "0080" : ["SQ", "ReferencedMeasuredDoseReferenceSequence"],
        "0082" : ["IS", "ReferencedMeasuredDoseReferenceNumber"],
        "0090" : ["SQ", "ReferencedCalculatedDoseReferenceSequence"],
        "0092" : ["IS", "ReferencedCalculatedDoseReferenceNumber"],
        "00A0" : ["SQ", "BeamLimitingDeviceLeafPairsSequence"],
        "00B0" : ["SQ", "RecordedWedgeSequence"],
        "00C0" : ["SQ", "RecordedCompensatorSequence"],
        "00D0" : ["SQ", "RecordedBlockSequence"],
        "00E0" : ["SQ", "TreatmentSummaryMeasuredDoseReferenceSequence"],
        "00F0" : ["SQ", "RecordedSnoutSequence"],
        "00F2" : ["SQ", "RecordedRangeShifterSequence"],
        "00F4" : ["SQ", "RecordedLateralSpreadingDeviceSequence"],
        "00F6" : ["SQ", "RecordedRangeModulatorSequence"],
        "0100" : ["SQ", "RecordedSourceSequence"],
        "0105" : ["LO", "SourceSerialNumber"],
        "0110" : ["SQ", "TreatmentSessionApplicationSetupSequence"],
        "0116" : ["CS", "ApplicationSetupCheck"],
        "0120" : ["SQ", "RecordedBrachyAccessoryDeviceSequence"],
        "0122" : ["IS", "ReferencedBrachyAccessoryDeviceNumber"],
        "0130" : ["SQ", "RecordedChannelSequence"],
        "0132" : ["DS", "SpecifiedChannelTotalTime"],
        "0134" : ["DS", "DeliveredChannelTotalTime"],
        "0136" : ["IS", "SpecifiedNumberOfPulses"],
        "0138" : ["IS", "DeliveredNumberOfPulses"],
        "013A" : ["DS", "SpecifiedPulseRepetitionInterval"],
        "013C" : ["DS", "DeliveredPulseRepetitionInterval"],
        "0140" : ["SQ", "RecordedSourceApplicatorSequence"],
        "0142" : ["IS", "ReferencedSourceApplicatorNumber"],
        "0150" : ["SQ", "RecordedChannelShieldSequence"],
        "0152" : ["IS", "ReferencedChannelShieldNumber"],
        "0160" : ["SQ", "BrachyControlPointDeliveredSequence"],
        "0162" : ["DA", "SafePositionExitDate"],
        "0164" : ["TM", "SafePositionExitTime"],
        "0166" : ["DA", "SafePositionReturnDate"],
        "0168" : ["TM", "SafePositionReturnTime"],
        "0200" : ["CS", "CurrentTreatmentStatus"],
        "0202" : ["ST", "TreatmentStatusComment"],
        "0220" : ["SQ", "FractionGroupSummarySequence"],
        "0223" : ["IS", "ReferencedFractionNumber"],
        "0224" : ["CS", "FractionGroupType"],
        "0230" : ["CS", "BeamStopperPosition"],
        "0240" : ["SQ", "FractionStatusSummarySequence"],
        "0250" : ["DA", "TreatmentDate"],
        "0251" : ["TM", "TreatmentTime"]
    },
    "300A" : {
        "0002" : ["SH", "RTPlanLabel"],
        "0003" : ["LO", "RTPlanName"],
        "0004" : ["ST", "RTPlanDescription"],
        "0006" : ["DA", "RTPlanDate"],
        "0007" : ["TM", "RTPlanTime"],
        "0009" : ["LO", "TreatmentProtocols"],
        "000A" : ["CS", "PlanIntent"],
        "000B" : ["LO", "TreatmentSites"],
        "000C" : ["CS", "RTPlanGeometry"],
        "000E" : ["ST", "PrescriptionDescription"],
        "0010" : ["SQ", "DoseReferenceSequence"],
        "0012" : ["IS", "DoseReferenceNumber"],
        "0013" : ["UI", "DoseReferenceUID"],
        "0014" : ["CS", "DoseReferenceStructureType"],
        "0015" : ["CS", "NominalBeamEnergyUnit"],
        "0016" : ["LO", "DoseReferenceDescription"],
        "0018" : ["DS", "DoseReferencePointCoordinates"],
        "001A" : ["DS", "NominalPriorDose"],
        "0020" : ["CS", "DoseReferenceType"],
        "0021" : ["DS", "ConstraintWeight"],
        "0022" : ["DS", "DeliveryWarningDose"],
        "0023" : ["DS", "DeliveryMaximumDose"],
        "0025" : ["DS", "TargetMinimumDose"],
        "0026" : ["DS", "TargetPrescriptionDose"],
        "0027" : ["DS", "TargetMaximumDose"],
        "0028" : ["DS", "TargetUnderdoseVolumeFraction"],
        "002A" : ["DS", "OrganAtRiskFullVolumeDose"],
        "002B" : ["DS", "OrganAtRiskLimitDose"],
        "002C" : ["DS", "OrganAtRiskMaximumDose"],
        "002D" : ["DS", "OrganAtRiskOverdoseVolumeFraction"],
        "0040" : ["SQ", "ToleranceTableSequence"],
        "0042" : ["IS", "ToleranceTableNumber"],
        "0043" : ["SH", "ToleranceTableLabel"],
        "0044" : ["DS", "GantryAngleTolerance"],
        "0046" : ["DS", "BeamLimitingDeviceAngleTolerance"],
        "0048" : ["SQ", "BeamLimitingDeviceToleranceSequence"],
        "004A" : ["DS", "BeamLimitingDevicePositionTolerance"],
        "004B" : ["FL", "SnoutPositionTolerance"],
        "004C" : ["DS", "PatientSupportAngleTolerance"],
        "004E" : ["DS", "TableTopEccentricAngleTolerance"],
        "004F" : ["FL", "TableTopPitchAngleTolerance"],
        "0050" : ["FL", "TableTopRollAngleTolerance"],
        "0051" : ["DS", "TableTopVerticalPositionTolerance"],
        "0052" : ["DS", "TableTopLongitudinalPositionTolerance"],
        "0053" : ["DS", "TableTopLateralPositionTolerance"],
        "0055" : ["CS", "RTPlanRelationship"],
        "0070" : ["SQ", "FractionGroupSequence"],
        "0071" : ["IS", "FractionGroupNumber"],
        "0072" : ["LO", "FractionGroupDescription"],
        "0078" : ["IS", "NumberOfFractionsPlanned"],
        "0079" : ["IS", "NumberOfFractionPatternDigitsPerDay"],
        "007A" : ["IS", "RepeatFractionCycleLength"],
        "007B" : ["LT", "FractionPattern"],
        "0080" : ["IS", "NumberOfBeams"],
        "0082" : ["DS", "BeamDoseSpecificationPoint"],
        "0084" : ["DS", "BeamDose"],
        "0086" : ["DS", "BeamMeterset"],
        "0088" : ["FL", "BeamDosePointDepth"],
        "0089" : ["FL", "BeamDosePointEquivalentDepth"],
        "008A" : ["FL", "BeamDosePointSSD"],
        "00A0" : ["IS", "NumberOfBrachyApplicationSetups"],
        "00A2" : ["DS", "BrachyApplicationSetupDoseSpecificationPoint"],
        "00A4" : ["DS", "BrachyApplicationSetupDose"],
        "00B0" : ["SQ", "BeamSequence"],
        "00B2" : ["SH", "TreatmentMachineName"],
        "00B3" : ["CS", "PrimaryDosimeterUnit"],
        "00B4" : ["DS", "SourceAxisDistance"],
        "00B6" : ["SQ", "BeamLimitingDeviceSequence"],
        "00B8" : ["CS", "RTBeamLimitingDeviceType"],
        "00BA" : ["DS", "SourceToBeamLimitingDeviceDistance"],
        "00BB" : ["FL", "IsocenterToBeamLimitingDeviceDistance"],
        "00BC" : ["IS", "NumberOfLeafJawPairs"],
        "00BE" : ["DS", "LeafPositionBoundaries"],
        "00C0" : ["IS", "BeamNumber"],
        "00C2" : ["LO", "BeamName"],
        "00C3" : ["ST", "BeamDescription"],
        "00C4" : ["CS", "BeamType"],
        "00C6" : ["CS", "RadiationType"],
        "00C7" : ["CS", "HighDoseTechniqueType"],
        "00C8" : ["IS", "ReferenceImageNumber"],
        "00CA" : ["SQ", "PlannedVerificationImageSequence"],
        "00CC" : ["LO", "ImagingDeviceSpecificAcquisitionParameters"],
        "00CE" : ["CS", "TreatmentDeliveryType"],
        "00D0" : ["IS", "NumberOfWedges"],
        "00D1" : ["SQ", "WedgeSequence"],
        "00D2" : ["IS", "WedgeNumber"],
        "00D3" : ["CS", "WedgeType"],
        "00D4" : ["SH", "WedgeID"],
        "00D5" : ["IS", "WedgeAngle"],
        "00D6" : ["DS", "WedgeFactor"],
        "00D7" : ["FL", "TotalWedgeTrayWaterEquivalentThickness"],
        "00D8" : ["DS", "WedgeOrientation"],
        "00D9" : ["FL", "IsocenterToWedgeTrayDistance"],
        "00DA" : ["DS", "SourceToWedgeTrayDistance"],
        "00DB" : ["FL", "WedgeThinEdgePosition"],
        "00DC" : ["SH", "BolusID"],
        "00DD" : ["ST", "BolusDescription"],
        "00E0" : ["IS", "NumberOfCompensators"],
        "00E1" : ["SH", "MaterialID"],
        "00E2" : ["DS", "TotalCompensatorTrayFactor"],
        "00E3" : ["SQ", "CompensatorSequence"],
        "00E4" : ["IS", "CompensatorNumber"],
        "00E5" : ["SH", "CompensatorID"],
        "00E6" : ["DS", "SourceToCompensatorTrayDistance"],
        "00E7" : ["IS", "CompensatorRows"],
        "00E8" : ["IS", "CompensatorColumns"],
        "00E9" : ["DS", "CompensatorPixelSpacing"],
        "00EA" : ["DS", "CompensatorPosition"],
        "00EB" : ["DS", "CompensatorTransmissionData"],
        "00EC" : ["DS", "CompensatorThicknessData"],
        "00ED" : ["IS", "NumberOfBoli"],
        "00EE" : ["CS", "CompensatorType"],
        "00F0" : ["IS", "NumberOfBlocks"],
        "00F2" : ["DS", "TotalBlockTrayFactor"],
        "00F3" : ["FL", "TotalBlockTrayWaterEquivalentThickness"],
        "00F4" : ["SQ", "BlockSequence"],
        "00F5" : ["SH", "BlockTrayID"],
        "00F6" : ["DS", "SourceToBlockTrayDistance"],
        "00F7" : ["FL", "IsocenterToBlockTrayDistance"],
        "00F8" : ["CS", "BlockType"],
        "00F9" : ["LO", "AccessoryCode"],
        "00FA" : ["CS", "BlockDivergence"],
        "00FB" : ["CS", "BlockMountingPosition"],
        "00FC" : ["IS", "BlockNumber"],
        "00FE" : ["LO", "BlockName"],
        "0100" : ["DS", "BlockThickness"],
        "0102" : ["DS", "BlockTransmission"],
        "0104" : ["IS", "BlockNumberOfPoints"],
        "0106" : ["DS", "BlockData"],
        "0107" : ["SQ", "ApplicatorSequence"],
        "0108" : ["SH", "ApplicatorID"],
        "0109" : ["CS", "ApplicatorType"],
        "010A" : ["LO", "ApplicatorDescription"],
        "010C" : ["DS", "CumulativeDoseReferenceCoefficient"],
        "010E" : ["DS", "FinalCumulativeMetersetWeight"],
        "0110" : ["IS", "NumberOfControlPoints"],
        "0111" : ["SQ", "ControlPointSequence"],
        "0112" : ["IS", "ControlPointIndex"],
        "0114" : ["DS", "NominalBeamEnergy"],
        "0115" : ["DS", "DoseRateSet"],
        "0116" : ["SQ", "WedgePositionSequence"],
        "0118" : ["CS", "WedgePosition"],
        "011A" : ["SQ", "BeamLimitingDevicePositionSequence"],
        "011C" : ["DS", "LeafJawPositions"],
        "011E" : ["DS", "GantryAngle"],
        "011F" : ["CS", "GantryRotationDirection"],
        "0120" : ["DS", "BeamLimitingDeviceAngle"],
        "0121" : ["CS", "BeamLimitingDeviceRotationDirection"],
        "0122" : ["DS", "PatientSupportAngle"],
        "0123" : ["CS", "PatientSupportRotationDirection"],
        "0124" : ["DS", "TableTopEccentricAxisDistance"],
        "0125" : ["DS", "TableTopEccentricAngle"],
        "0126" : ["CS", "TableTopEccentricRotationDirection"],
        "0128" : ["DS", "TableTopVerticalPosition"],
        "0129" : ["DS", "TableTopLongitudinalPosition"],
        "012A" : ["DS", "TableTopLateralPosition"],
        "012C" : ["DS", "IsocenterPosition"],
        "012E" : ["DS", "SurfaceEntryPoint"],
        "0130" : ["DS", "SourceToSurfaceDistance"],
        "0134" : ["DS", "CumulativeMetersetWeight"],
        "0140" : ["FL", "TableTopPitchAngle"],
        "0142" : ["CS", "TableTopPitchRotationDirection"],
        "0144" : ["FL", "TableTopRollAngle"],
        "0146" : ["CS", "TableTopRollRotationDirection"],
        "0148" : ["FL", "HeadFixationAngle"],
        "014A" : ["FL", "GantryPitchAngle"],
        "014C" : ["CS", "GantryPitchRotationDirection"],
        "014E" : ["FL", "GantryPitchAngleTolerance"],
        "0180" : ["SQ", "PatientSetupSequence"],
        "0182" : ["IS", "PatientSetupNumber"],
        "0183" : ["LO", "PatientSetupLabel"],
        "0184" : ["LO", "PatientAdditionalPosition"],
        "0190" : ["SQ", "FixationDeviceSequence"],
        "0192" : ["CS", "FixationDeviceType"],
        "0194" : ["SH", "FixationDeviceLabel"],
        "0196" : ["ST", "FixationDeviceDescription"],
        "0198" : ["SH", "FixationDevicePosition"],
        "0199" : ["FL", "FixationDevicePitchAngle"],
        "019A" : ["FL", "FixationDeviceRollAngle"],
        "01A0" : ["SQ", "ShieldingDeviceSequence"],
        "01A2" : ["CS", "ShieldingDeviceType"],
        "01A4" : ["SH", "ShieldingDeviceLabel"],
        "01A6" : ["ST", "ShieldingDeviceDescription"],
        "01A8" : ["SH", "ShieldingDevicePosition"],
        "01B0" : ["CS", "SetupTechnique"],
        "01B2" : ["ST", "SetupTechniqueDescription"],
        "01B4" : ["SQ", "SetupDeviceSequence"],
        "01B6" : ["CS", "SetupDeviceType"],
        "01B8" : ["SH", "SetupDeviceLabel"],
        "01BA" : ["ST", "SetupDeviceDescription"],
        "01BC" : ["DS", "SetupDeviceParameter"],
        "01D0" : ["ST", "SetupReferenceDescription"],
        "01D2" : ["DS", "TableTopVerticalSetupDisplacement"],
        "01D4" : ["DS", "TableTopLongitudinalSetupDisplacement"],
        "01D6" : ["DS", "TableTopLateralSetupDisplacement"],
        "0200" : ["CS", "BrachyTreatmentTechnique"],
        "0202" : ["CS", "BrachyTreatmentType"],
        "0206" : ["SQ", "TreatmentMachineSequence"],
        "0210" : ["SQ", "SourceSequence"],
        "0212" : ["IS", "SourceNumber"],
        "0214" : ["CS", "SourceType"],
        "0216" : ["LO", "SourceManufacturer"],
        "0218" : ["DS", "ActiveSourceDiameter"],
        "021A" : ["DS", "ActiveSourceLength"],
        "0222" : ["DS", "SourceEncapsulationNominalThickness"],
        "0224" : ["DS", "SourceEncapsulationNominalTransmission"],
        "0226" : ["LO", "SourceIsotopeName"],
        "0228" : ["DS", "SourceIsotopeHalfLife"],
        "0229" : ["CS", "SourceStrengthUnits"],
        "022A" : ["DS", "ReferenceAirKermaRate"],
        "022B" : ["DS", "SourceStrength"],
        "022C" : ["DA", "SourceStrengthReferenceDate"],
        "022E" : ["TM", "SourceStrengthReferenceTime"],
        "0230" : ["SQ", "ApplicationSetupSequence"],
        "0232" : ["CS", "ApplicationSetupType"],
        "0234" : ["IS", "ApplicationSetupNumber"],
        "0236" : ["LO", "ApplicationSetupName"],
        "0238" : ["LO", "ApplicationSetupManufacturer"],
        "0240" : ["IS", "TemplateNumber"],
        "0242" : ["SH", "TemplateType"],
        "0244" : ["LO", "TemplateName"],
        "0250" : ["DS", "TotalReferenceAirKerma"],
        "0260" : ["SQ", "BrachyAccessoryDeviceSequence"],
        "0262" : ["IS", "BrachyAccessoryDeviceNumber"],
        "0263" : ["SH", "BrachyAccessoryDeviceID"],
        "0264" : ["CS", "BrachyAccessoryDeviceType"],
        "0266" : ["LO", "BrachyAccessoryDeviceName"],
        "026A" : ["DS", "BrachyAccessoryDeviceNominalThickness"],
        "026C" : ["DS", "BrachyAccessoryDeviceNominalTransmission"],
        "0280" : ["SQ", "ChannelSequence"],
        "0282" : ["IS", "ChannelNumber"],
        "0284" : ["DS", "ChannelLength"],
        "0286" : ["DS", "ChannelTotalTime"],
        "0288" : ["CS", "SourceMovementType"],
        "028A" : ["IS", "NumberOfPulses"],
        "028C" : ["DS", "PulseRepetitionInterval"],
        "0290" : ["IS", "SourceApplicatorNumber"],
        "0291" : ["SH", "SourceApplicatorID"],
        "0292" : ["CS", "SourceApplicatorType"],
        "0294" : ["LO", "SourceApplicatorName"],
        "0296" : ["DS", "SourceApplicatorLength"],
        "0298" : ["LO", "SourceApplicatorManufacturer"],
        "029C" : ["DS", "SourceApplicatorWallNominalThickness"],
        "029E" : ["DS", "SourceApplicatorWallNominalTransmission"],
        "02A0" : ["DS", "SourceApplicatorStepSize"],
        "02A2" : ["IS", "TransferTubeNumber"],
        "02A4" : ["DS", "TransferTubeLength"],
        "02B0" : ["SQ", "ChannelShieldSequence"],
        "02B2" : ["IS", "ChannelShieldNumber"],
        "02B3" : ["SH", "ChannelShieldID"],
        "02B4" : ["LO", "ChannelShieldName"],
        "02B8" : ["DS", "ChannelShieldNominalThickness"],
        "02BA" : ["DS", "ChannelShieldNominalTransmission"],
        "02C8" : ["DS", "FinalCumulativeTimeWeight"],
        "02D0" : ["SQ", "BrachyControlPointSequence"],
        "02D2" : ["DS", "ControlPointRelativePosition"],
        "02D4" : ["DS", "ControlPoint3DPosition"],
        "02D6" : ["DS", "CumulativeTimeWeight"],
        "02E0" : ["CS", "CompensatorDivergence"],
        "02E1" : ["CS", "CompensatorMountingPosition"],
        "02E2" : ["DS", "SourceToCompensatorDistance"],
        "02E3" : ["FL", "TotalCompensatorTrayWaterEquivalentThickness"],
        "02E4" : ["FL", "IsocenterToCompensatorTrayDistance"],
        "02E5" : ["FL", "CompensatorColumnOffset"],
        "02E6" : ["FL", "IsocenterToCompensatorDistances"],
        "02E7" : ["FL", "CompensatorRelativeStoppingPowerRatio"],
        "02E8" : ["FL", "CompensatorMillingToolDiameter"],
        "02EA" : ["SQ", "IonRangeCompensatorSequence"],
        "02EB" : ["LT", "CompensatorDescription"],
        "0302" : ["IS", "RadiationMassNumber"],
        "0304" : ["IS", "RadiationAtomicNumber"],
        "0306" : ["SS", "RadiationChargeState"],
        "0308" : ["CS", "ScanMode"],
        "030A" : ["FL", "VirtualSourceAxisDistances"],
        "030C" : ["SQ", "SnoutSequence"],
        "030D" : ["FL", "SnoutPosition"],
        "030F" : ["SH", "SnoutID"],
        "0312" : ["IS", "NumberOfRangeShifters"],
        "0314" : ["SQ", "RangeShifterSequence"],
        "0316" : ["IS", "RangeShifterNumber"],
        "0318" : ["SH", "RangeShifterID"],
        "0320" : ["CS", "RangeShifterType"],
        "0322" : ["LO", "RangeShifterDescription"],
        "0330" : ["IS", "NumberOfLateralSpreadingDevices"],
        "0332" : ["SQ", "LateralSpreadingDeviceSequence"],
        "0334" : ["IS", "LateralSpreadingDeviceNumber"],
        "0336" : ["SH", "LateralSpreadingDeviceID"],
        "0338" : ["CS", "LateralSpreadingDeviceType"],
        "033A" : ["LO", "LateralSpreadingDeviceDescription"],
        "033C" : ["FL", "LateralSpreadingDeviceWaterEquivalentThickness"],
        "0340" : ["IS", "NumberOfRangeModulators"],
        "0342" : ["SQ", "RangeModulatorSequence"],
        "0344" : ["IS", "RangeModulatorNumber"],
        "0346" : ["SH", "RangeModulatorID"],
        "0348" : ["CS", "RangeModulatorType"],
        "034A" : ["LO", "RangeModulatorDescription"],
        "034C" : ["SH", "BeamCurrentModulationID"],
        "0350" : ["CS", "PatientSupportType"],
        "0352" : ["SH", "PatientSupportID"],
        "0354" : ["LO", "PatientSupportAccessoryCode"],
        "0356" : ["FL", "FixationLightAzimuthalAngle"],
        "0358" : ["FL", "FixationLightPolarAngle"],
        "035A" : ["FL", "MetersetRate"],
        "0360" : ["SQ", "RangeShifterSettingsSequence"],
        "0362" : ["LO", "RangeShifterSetting"],
        "0364" : ["FL", "IsocenterToRangeShifterDistance"],
        "0366" : ["FL", "RangeShifterWaterEquivalentThickness"],
        "0370" : ["SQ", "LateralSpreadingDeviceSettingsSequence"],
        "0372" : ["LO", "LateralSpreadingDeviceSetting"],
        "0374" : ["FL", "IsocenterToLateralSpreadingDeviceDistance"],
        "0380" : ["SQ", "RangeModulatorSettingsSequence"],
        "0382" : ["FL", "RangeModulatorGatingStartValue"],
        "0384" : ["FL", "RangeModulatorGatingStopValue"],
        "0386" : ["FL", "RangeModulatorGatingStartWaterEquivalentThickness"],
        "0388" : ["FL", "RangeModulatorGatingStopWaterEquivalentThickness"],
        "038A" : ["FL", "IsocenterToRangeModulatorDistance"],
        "0390" : ["SH", "ScanSpotTuneID"],
        "0392" : ["IS", "NumberOfScanSpotPositions"],
        "0394" : ["FL", "ScanSpotPositionMap"],
        "0396" : ["FL", "ScanSpotMetersetWeights"],
        "0398" : ["FL", "ScanningSpotSize"],
        "039A" : ["IS", "NumberOfPaintings"],
        "03A0" : ["SQ", "IonToleranceTableSequence"],
        "03A2" : ["SQ", "IonBeamSequence"],
        "03A4" : ["SQ", "IonBeamLimitingDeviceSequence"],
        "03A6" : ["SQ", "IonBlockSequence"],
        "03A8" : ["SQ", "IonControlPointSequence"],
        "03AA" : ["SQ", "IonWedgeSequence"],
        "03AC" : ["SQ", "IonWedgePositionSequence"],
        "0401" : ["SQ", "ReferencedSetupImageSequence"],
        "0402" : ["ST", "SetupImageComment"],
        "0410" : ["SQ", "MotionSynchronizationSequence"],
        "0412" : ["FL", "ControlPointOrientation"],
        "0420" : ["SQ", "GeneralAccessorySequence"],
        "0421" : ["SH", "GeneralAccessoryID"],
        "0422" : ["ST", "GeneralAccessoryDescription"],
        "0423" : ["CS", "GeneralAccessoryType"],
        "0424" : ["IS", "GeneralAccessoryNumber"],
        "0431" : ["SQ", "ApplicatorGeometrySequence"],
        "0432" : ["CS", "ApplicatorApertureShape"],
        "0433" : ["FL", "ApplicatorOpening"],
        "0434" : ["FL", "ApplicatorOpeningX"],
        "0435" : ["FL", "ApplicatorOpeningY"],
        "0436" : ["FL", "SourceToApplicatorMountingPositionDistance"]
    },
    "300C" : {
        "0002" : ["SQ", "ReferencedRTPlanSequence"],
        "0004" : ["SQ", "ReferencedBeamSequence"],
        "0006" : ["IS", "ReferencedBeamNumber"],
        "0007" : ["IS", "ReferencedReferenceImageNumber"],
        "0008" : ["DS", "StartCumulativeMetersetWeight"],
        "0009" : ["DS", "EndCumulativeMetersetWeight"],
        "000A" : ["SQ", "ReferencedBrachyApplicationSetupSequence"],
        "000C" : ["IS", "ReferencedBrachyApplicationSetupNumber"],
        "000E" : ["IS", "ReferencedSourceNumber"],
        "0020" : ["SQ", "ReferencedFractionGroupSequence"],
        "0022" : ["IS", "ReferencedFractionGroupNumber"],
        "0040" : ["SQ", "ReferencedVerificationImageSequence"],
        "0042" : ["SQ", "ReferencedReferenceImageSequence"],
        "0050" : ["SQ", "ReferencedDoseReferenceSequence"],
        "0051" : ["IS", "ReferencedDoseReferenceNumber"],
        "0055" : ["SQ", "BrachyReferencedDoseReferenceSequence"],
        "0060" : ["SQ", "ReferencedStructureSetSequence"],
        "006A" : ["IS", "ReferencedPatientSetupNumber"],
        "0080" : ["SQ", "ReferencedDoseSequence"],
        "00A0" : ["IS", "ReferencedToleranceTableNumber"],
        "00B0" : ["SQ", "ReferencedBolusSequence"],
        "00C0" : ["IS", "ReferencedWedgeNumber"],
        "00D0" : ["IS", "ReferencedCompensatorNumber"],
        "00E0" : ["IS", "ReferencedBlockNumber"],
        "00F0" : ["IS", "ReferencedControlPointIndex"],
        "00F2" : ["SQ", "ReferencedControlPointSequence"],
        "00F4" : ["IS", "ReferencedStartControlPointIndex"],
        "00F6" : ["IS", "ReferencedStopControlPointIndex"],
        "0100" : ["IS", "ReferencedRangeShifterNumber"],
        "0102" : ["IS", "ReferencedLateralSpreadingDeviceNumber"],
        "0104" : ["IS", "ReferencedRangeModulatorNumber"]
    },
    "300E" : {
        "0002" : ["CS", "ApprovalStatus"],
        "0004" : ["DA", "ReviewDate"],
        "0005" : ["TM", "ReviewTime"],
        "0008" : ["PN", "ReviewerName"]
    },
    "4000" : {
        "0010" : ["LT", "Arbitrary"],
        "4000" : ["LT", "TextComments"]
    },
    "4008" : {
        "0040" : ["SH", "ResultsID"],
        "0042" : ["LO", "ResultsIDIssuer"],
        "0050" : ["SQ", "ReferencedInterpretationSequence"],
        "00FF" : ["CS", "ReportProductionStatusTrial"],
        "0100" : ["DA", "InterpretationRecordedDate"],
        "0101" : ["TM", "InterpretationRecordedTime"],
        "0102" : ["PN", "InterpretationRecorder"],
        "0103" : ["LO", "ReferenceToRecordedSound"],
        "0108" : ["DA", "InterpretationTranscriptionDate"],
        "0109" : ["TM", "InterpretationTranscriptionTime"],
        "010A" : ["PN", "InterpretationTranscriber"],
        "010B" : ["ST", "InterpretationText"],
        "010C" : ["PN", "InterpretationAuthor"],
        "0111" : ["SQ", "InterpretationApproverSequence"],
        "0112" : ["DA", "InterpretationApprovalDate"],
        "0113" : ["TM", "InterpretationApprovalTime"],
        "0114" : ["PN", "PhysicianApprovingInterpretation"],
        "0115" : ["LT", "InterpretationDiagnosisDescription"],
        "0117" : ["SQ", "InterpretationDiagnosisCodeSequence"],
        "0118" : ["SQ", "ResultsDistributionListSequence"],
        "0119" : ["PN", "DistributionName"],
        "011A" : ["LO", "DistributionAddress"],
        "0200" : ["SH", "InterpretationID"],
        "0202" : ["LO", "InterpretationIDIssuer"],
        "0210" : ["CS", "InterpretationTypeID"],
        "0212" : ["CS", "InterpretationStatusID"],
        "0300" : ["ST", "Impressions"],
        "4000" : ["ST", "ResultsComments"]
    },
    "4010" : {
        "0001" : ["CS", "LowEnergyDetectors"],
        "0002" : ["CS", "HighEnergyDetectors"],
        "0004" : ["SQ", "DetectorGeometrySequence"],
        "1001" : ["SQ", "ThreatROIVoxelSequence"],
        "1004" : ["FL", "ThreatROIBase"],
        "1005" : ["FL", "ThreatROIExtents"],
        "1006" : ["OB", "ThreatROIBitmap"],
        "1007" : ["SH", "RouteSegmentID"],
        "1008" : ["CS", "GantryType"],
        "1009" : ["CS", "OOIOwnerType"],
        "100A" : ["SQ", "RouteSegmentSequence"],
        "1010" : ["US", "PotentialThreatObjectID"],
        "1011" : ["SQ", "ThreatSequence"],
        "1012" : ["CS", "ThreatCategory"],
        "1013" : ["LT", "ThreatCategoryDescription"],
        "1014" : ["CS", "ATDAbilityAssessment"],
        "1015" : ["CS", "ATDAssessmentFlag"],
        "1016" : ["FL", "ATDAssessmentProbability"],
        "1017" : ["FL", "Mass"],
        "1018" : ["FL", "Density"],
        "1019" : ["FL", "ZEffective"],
        "101A" : ["SH", "BoardingPassID"],
        "101B" : ["FL", "CenterOfMass"],
        "101C" : ["FL", "CenterOfPTO"],
        "101D" : ["FL", "BoundingPolygon"],
        "101E" : ["SH", "RouteSegmentStartLocationID"],
        "101F" : ["SH", "RouteSegmentEndLocationID"],
        "1020" : ["CS", "RouteSegmentLocationIDType"],
        "1021" : ["CS", "AbortReason"],
        "1023" : ["FL", "VolumeOfPTO"],
        "1024" : ["CS", "AbortFlag"],
        "1025" : ["DT", "RouteSegmentStartTime"],
        "1026" : ["DT", "RouteSegmentEndTime"],
        "1027" : ["CS", "TDRType"],
        "1028" : ["CS", "InternationalRouteSegment"],
        "1029" : ["LO", "ThreatDetectionAlgorithmandVersion"],
        "102A" : ["SH", "AssignedLocation"],
        "102B" : ["DT", "AlarmDecisionTime"],
        "1031" : ["CS", "AlarmDecision"],
        "1033" : ["US", "NumberOfTotalObjects"],
        "1034" : ["US", "NumberOfAlarmObjects"],
        "1037" : ["SQ", "PTORepresentationSequence"],
        "1038" : ["SQ", "ATDAssessmentSequence"],
        "1039" : ["CS", "TIPType"],
        "103A" : ["CS", "DICOSVersion"],
        "1041" : ["DT", "OOIOwnerCreationTime"],
        "1042" : ["CS", "OOIType"],
        "1043" : ["FL", "OOISize"],
        "1044" : ["CS", "AcquisitionStatus"],
        "1045" : ["SQ", "BasisMaterialsCodeSequence"],
        "1046" : ["CS", "PhantomType"],
        "1047" : ["SQ", "OOIOwnerSequence"],
        "1048" : ["CS", "ScanType"],
        "1051" : ["LO", "ItineraryID"],
        "1052" : ["SH", "ItineraryIDType"],
        "1053" : ["LO", "ItineraryIDAssigningAuthority"],
        "1054" : ["SH", "RouteID"],
        "1055" : ["SH", "RouteIDAssigningAuthority"],
        "1056" : ["CS", "InboundArrivalType"],
        "1058" : ["SH", "CarrierID"],
        "1059" : ["CS", "CarrierIDAssigningAuthority"],
        "1060" : ["FL", "SourceOrientation"],
        "1061" : ["FL", "SourcePosition"],
        "1062" : ["FL", "BeltHeight"],
        "1064" : ["SQ", "AlgorithmRoutingCodeSequence"],
        "1067" : ["CS", "TransportClassification"],
        "1068" : ["LT", "OOITypeDescriptor"],
        "1069" : ["FL", "TotalProcessingTime"],
        "106C" : ["OB", "DetectorCalibrationData"]
    }
};



/*** Static Methods ***/

daikon.Dictionary.getVR = function (group, element) {
    var vr, elementData, groupData;

    groupData = daikon.Dictionary.dict[daikon.Utils.dec2hex(group)];
    if (groupData) {
        elementData = groupData[daikon.Utils.dec2hex(element)];
        if (elementData) {
            vr = elementData[0];
        } else if (element === 0) {
            vr = 'UL';
        }
    }

    if (!vr) {
        groupData = daikon.Dictionary.dictPrivate[daikon.Utils.dec2hex(group)];
        if (groupData) {
            elementData = groupData[daikon.Utils.dec2hex(element)];
            if (elementData) {
                vr = elementData[0];
            }
        }
    }

    if (!vr) {
        vr = 'OB';
    }

    return vr;
};



daikon.Dictionary.getDescription = function (group, element) {
    var des, elementData, groupData;

    groupData = daikon.Dictionary.dict[daikon.Utils.dec2hex(group)];
    if (groupData) {
        elementData = groupData[daikon.Utils.dec2hex(element)];
        if (elementData) {
            des = elementData[1];
        } else if (element === 0) {
            des = ("Group " + daikon.Utils.dec2hex(group) + " Length");
        }
    }

    if (!des) {
        groupData = daikon.Dictionary.dictPrivate[daikon.Utils.dec2hex(group)];
        if (groupData) {
            elementData = groupData[daikon.Utils.dec2hex(element)];
            if (elementData) {
                des = elementData[1];
            }
        }
    }

    if (!des) {
        des = 'PrivateData';
    }

    return des;
};


/*** Exports ***/

var moduleType = typeof module;
if ((moduleType !== 'undefined') && module.exports) {
    module.exports = daikon.Dictionary;
}

},{"./utilities.js":22}],14:[function(require,module,exports){

/*jslint browser: true, node: true */
/*global require, module */

"use strict";

/*** Imports ***/
var daikon = daikon || {};
daikon.Tag = daikon.Tag || ((typeof require !== 'undefined') ? require('./tag.js') : null);
daikon.CompressionUtils = daikon.CompressionUtils || ((typeof require !== 'undefined') ? require('./compression-utils.js') : null);
daikon.Utils = daikon.Utils || ((typeof require !== 'undefined') ? require('./utilities.js') : null);
daikon.RLE = daikon.RLE || ((typeof require !== 'undefined') ? require('./rle.js') : null);

var jpeg = jpeg || {};
jpeg.lossless = jpeg.lossless || {};
jpeg.lossless.Decoder = ((typeof require !== 'undefined') ? require('JPEGLosslessDecoderJS') : null);
var JpegDecoder = JpegDecoder || ((typeof require !== 'undefined') ? require('../lib/jpg.js').JpegDecoder : null);
var JpxImage = JpxImage || ((typeof require !== 'undefined') ? require('../lib/jpx.js') : null);


/*** Constructor ***/
daikon.Image = daikon.Image || function () {
    this.tags = {};
    this.littleEndian = false;
    this.index = -1;
    this.decompressed = false;
};


/*** Static Pseudo-constants ***/

daikon.Image.SLICE_DIRECTION_UNKNOWN = -1;
daikon.Image.SLICE_DIRECTION_AXIAL = 2;
daikon.Image.SLICE_DIRECTION_CORONAL = 1;
daikon.Image.SLICE_DIRECTION_SAGITTAL = 0;
daikon.Image.SLICE_DIRECTION_OBLIQUE = 3;
daikon.Image.OBLIQUITY_THRESHOLD_COSINE_VALUE = 0.8;

daikon.Image.BYTE_TYPE_UNKNOWN = 0;
daikon.Image.BYTE_TYPE_BINARY = 1;
daikon.Image.BYTE_TYPE_INTEGER = 2;
daikon.Image.BYTE_TYPE_INTEGER_UNSIGNED = 3;
daikon.Image.BYTE_TYPE_FLOAT = 4;
daikon.Image.BYTE_TYPE_COMPLEX = 5;
daikon.Image.BYTE_TYPE_RGB = 6;


/*** Static Methods ***/

daikon.Image.getSingleValueSafely = function (tag, index) {
    if (tag && tag.value) {
        return tag.value[index];
    }

    return null;
};



daikon.Image.getValueSafely = function (tag) {
    if (tag) {
        return tag.value;
    }

    return null;
};



// originally from: http://public.kitware.com/pipermail/insight-users/2005-March/012246.html
daikon.Image.getMajorAxisFromPatientRelativeDirectionCosine = function(x, y, z) {
    var axis, orientationX, orientationY, orientationZ, absX, absY, absZ;

    orientationX = (x < 0) ? "R" : "L";
    orientationY = (y < 0) ? "A" : "P";
    orientationZ = (z < 0) ? "F" : "H";

    absX = Math.abs(x);
    absY = Math.abs(y);
    absZ = Math.abs(z);

    // The tests here really don't need to check the other dimensions,
    // just the threshold, since the sum of the squares should be == 1.0
    // but just in case ...

    if ((absX > daikon.Image.OBLIQUITY_THRESHOLD_COSINE_VALUE) && (absX > absY) && (absX > absZ)) {
        axis = orientationX;
    } else if ((absY > daikon.Image.OBLIQUITY_THRESHOLD_COSINE_VALUE) && (absY > absX) && (absY > absZ)) {
        axis = orientationY;
    } else if ((absZ > daikon.Image.OBLIQUITY_THRESHOLD_COSINE_VALUE) && (absZ > absX) && (absZ > absY)) {
        axis = orientationZ;
    } else {
        axis = null;
    }

    return axis;
};


/*** Prototype Methods ***/

daikon.Image.prototype.getCols = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_COLS[0], daikon.Tag.TAG_COLS[1]), 0);
};



daikon.Image.prototype.getRows = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_ROWS[0], daikon.Tag.TAG_ROWS[1]), 0);
};



daikon.Image.prototype.getSeriesDescription = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_SERIES_DESCRIPTION[0], daikon.Tag.TAG_SERIES_DESCRIPTION[1]), 0);
};



daikon.Image.prototype.getSeriesInstanceUID = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_SERIES_INSTANCE_UID[0], daikon.Tag.TAG_SERIES_INSTANCE_UID[1]), 0);
};



daikon.Image.prototype.getSeriesNumber = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_SERIES_NUMBER[0], daikon.Tag.TAG_SERIES_NUMBER[1]), 0);
};



daikon.Image.prototype.getEchoNumber = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_ECHO_NUMBER[0], daikon.Tag.TAG_ECHO_NUMBER[1]), 0);
};



daikon.Image.prototype.getImagePosition = function () {
    return daikon.Image.getValueSafely(this.getTag(daikon.Tag.TAG_IMAGE_POSITION[0], daikon.Tag.TAG_IMAGE_POSITION[1]));
};



daikon.Image.prototype.getImagePositionSliceDir = function (sliceDir) {
    var imagePos = daikon.Image.getValueSafely(this.getTag(daikon.Tag.TAG_IMAGE_POSITION[0], daikon.Tag.TAG_IMAGE_POSITION[1]));
    if (imagePos) {
        if (sliceDir >= 0) {
            return imagePos[sliceDir];
        }
    }

    return 0;
};



daikon.Image.prototype.getSliceLocation = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_SLICE_LOCATION[0], daikon.Tag.TAG_SLICE_LOCATION[1]), 0);
};



daikon.Image.prototype.getSliceLocationVector = function () {
    return daikon.Image.getValueSafely(this.getTag(daikon.Tag.TAG_SLICE_LOCATION_VECTOR[0], daikon.Tag.TAG_SLICE_LOCATION_VECTOR[1]));
};



daikon.Image.prototype.getImageNumber = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_IMAGE_NUM[0], daikon.Tag.TAG_IMAGE_NUM[1]), 0);
};



daikon.Image.prototype.getTemporalPosition = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_TEMPORAL_POSITION[0], daikon.Tag.TAG_TEMPORAL_POSITION[1]), 0);
};



daikon.Image.prototype.getTemporalNumber = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_NUMBER_TEMPORAL_POSITIONS[0], daikon.Tag.TAG_NUMBER_TEMPORAL_POSITIONS[1]), 0);
};



daikon.Image.prototype.getSliceGap = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_SLICE_GAP[0], daikon.Tag.TAG_SLICE_GAP[1]), 0);
};



daikon.Image.prototype.getSliceThickness = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_SLICE_THICKNESS[0], daikon.Tag.TAG_SLICE_THICKNESS[1]), 0);
};



daikon.Image.prototype.getImageMax = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_IMAGE_MAX[0], daikon.Tag.TAG_IMAGE_MAX[1]), 0);
};



daikon.Image.prototype.getImageMin = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_IMAGE_MIN[0], daikon.Tag.TAG_IMAGE_MIN[1]), 0);
};



daikon.Image.prototype.getDataScaleSlope = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_DATA_SCALE_SLOPE[0], daikon.Tag.TAG_DATA_SCALE_SLOPE[1]), 0);
};



daikon.Image.prototype.getDataScaleIntercept = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_DATA_SCALE_INTERCEPT[0], daikon.Tag.TAG_DATA_SCALE_INTERCEPT[1]), 0);
};



daikon.Image.prototype.getDataScaleElscint = function () {
    var scale = daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_DATA_SCALE_ELSCINT[0], daikon.Tag.TAG_DATA_SCALE_ELSCINT[1]), 0);

    if (!scale) {
        scale = 1;
    }

    var bandwidth = this.getPixelBandwidth();
    scale = Math.sqrt(bandwidth) / (10 * scale);

    if (scale <= 0) {
        scale = 1;
    }

    return scale;
};



daikon.Image.prototype.getWindowWidth = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_WINDOW_WIDTH[0], daikon.Tag.TAG_WINDOW_WIDTH[1]), 0);
};



daikon.Image.prototype.getWindowCenter = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_WINDOW_CENTER[0], daikon.Tag.TAG_WINDOW_CENTER[1]), 0);
};



daikon.Image.prototype.getPixelBandwidth = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_PIXEL_BANDWIDTH[0], daikon.Tag.TAG_PIXEL_BANDWIDTH[1]), 0);
};



daikon.Image.prototype.getSeriesId = function () {
    var des = this.getSeriesDescription();
    var uid = this.getSeriesInstanceUID();
    var num = this.getSeriesNumber();
    var echo = this.getEchoNumber();
    var orientation = this.getOrientation();

    var id = "";

    if (des !== null) {
        id += (" " + des);
    }

    if (uid !== null) {
        id += (" " + uid);
    }

    if (num !== null) {
        id += (" " + num);
    }

    if (echo !== null) {
        id += (" " + echo);
    }

    if (orientation !== null) {
        id += (" " + orientation);
    }

    return id;
};



daikon.Image.prototype.getPixelSpacing = function () {
    return daikon.Image.getValueSafely(this.getTag(daikon.Tag.TAG_PIXEL_SPACING[0], daikon.Tag.TAG_PIXEL_SPACING[1]));
};



daikon.Image.prototype.getImageType = function () {
    return daikon.Image.getValueSafely(this.getTag(daikon.Tag.TAG_IMAGE_TYPE[0], daikon.Tag.TAG_IMAGE_TYPE[1]));
};



daikon.Image.prototype.getBitsStored = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_BITS_STORED[0], daikon.Tag.TAG_BITS_STORED[1]), 0);
};



daikon.Image.prototype.getBitsAllocated = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_BITS_ALLOCATED[0], daikon.Tag.TAG_BITS_ALLOCATED[1]), 0);
};



daikon.Image.prototype.getFrameTime = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_FRAME_TIME[0], daikon.Tag.TAG_FRAME_TIME[1]), 0);
};



daikon.Image.prototype.getAcquisitionMatrix = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_ACQUISITION_MATRIX[0], daikon.Tag.TAG_ACQUISITION_MATRIX[1]), 0);
};



daikon.Image.prototype.getTR = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_TR, daikon.Tag.TAG_TR[1]), 0);
};



daikon.Image.prototype.putTag = function (tag) {
    this.tags[tag.id] = tag;
};



daikon.Image.prototype.getTag = function (group, element) {
    return this.tags[daikon.Tag.createId(group, element)];
};



daikon.Image.prototype.getPixelData = function () {
    return this.tags[daikon.Tag.createId(daikon.Tag.TAG_PIXEL_DATA[0], daikon.Tag.TAG_PIXEL_DATA[1])];
};



daikon.Image.prototype.getPixelDataBytes = function () {
    if (this.isCompressed()) {
        this.decompress();
    }

    return this.tags[daikon.Tag.createId(daikon.Tag.TAG_PIXEL_DATA[0], daikon.Tag.TAG_PIXEL_DATA[1])].value.buffer;
};



daikon.Image.prototype.decompress = function () {
    var jpegs, rle, decoder, decompressed, size, frameSize, temp, ctr, width, height, numComponents, decoded;

    if (!this.decompressed) {
        this.decompressed = true;

        frameSize = this.getRows() * this.getCols() * parseInt(this.getBitsAllocated() / 8);
        size = frameSize * this.getNumberOfFrames();
        decompressed = new DataView(new ArrayBuffer(size));

        if (this.isCompressedJPEGLossless()) {
            jpegs = this.getJpegs();

            for (ctr = 0; ctr < jpegs.length; ctr+=1) {
                decoder = new jpeg.lossless.Decoder(jpegs[ctr], parseInt(this.getBitsAllocated() / 8));
                temp = decoder.decode();
                (new Uint8Array(decompressed.buffer)).set(new Uint8Array(temp.buffer), (ctr * frameSize));
                temp = null;
            }

            this.tags[daikon.Tag.createId(daikon.Tag.TAG_PIXEL_DATA[0], daikon.Tag.TAG_PIXEL_DATA[1])].value = decompressed;
        } else if (this.isCompressedJPEGBaseline()) {
            jpegs = this.getJpegs();

            for (ctr = 0; ctr < jpegs.length; ctr+=1) {
                decoder = new JpegDecoder();
                temp = decoder.parse(new Uint8Array(jpegs[ctr]));
                width = decoder.width;
                height = decoder.height;
                numComponents = decoder.numComponents;
                decoded = decoder.getData(width, height);

                if (this.getDataType() === daikon.Image.BYTE_TYPE_RGB) {
                    daikon.Utils.fillBufferRGB(decoded, decompressed, (ctr * frameSize));
                } else {
                    daikon.Utils.fillBuffer(decoded, decompressed, (ctr * frameSize), parseInt(this.getBitsAllocated() / 8));
                }

                decoded = null;
            }

            this.tags[daikon.Tag.createId(daikon.Tag.TAG_PIXEL_DATA[0], daikon.Tag.TAG_PIXEL_DATA[1])].value = decompressed;
        } else if (this.isCompressedJPEG2000()) {
            jpegs = this.getJpegs();

            for (ctr = 0; ctr < jpegs.length; ctr+=1) {
                decoder = new JpxImage();
                decoder.parse(new Uint8Array(jpegs[ctr]));
                width = decoder.width;
                height = decoder.height;
                decoded = decoder.tiles[0].items;

                if (this.getDataType() === daikon.Image.BYTE_TYPE_RGB) {
                    daikon.Utils.fillBufferRGB(decoded, decompressed, (ctr * frameSize));
                } else {
                    daikon.Utils.fillBuffer(decoded, decompressed, (ctr * frameSize), parseInt(this.getBitsAllocated() / 8));
                }

                decoded = null;
            }

            this.tags[daikon.Tag.createId(daikon.Tag.TAG_PIXEL_DATA[0], daikon.Tag.TAG_PIXEL_DATA[1])].value = decompressed;
        } else if (this.isCompressedRLE()) {
            rle = this.getRLE();

            for (ctr = 0; ctr < rle.length; ctr+=1) {
                decoder = new daikon.RLE();
                temp = decoder.decode(rle[ctr], this.littleEndian, this.getRows() * this.getCols());
                (new Uint8Array(decompressed.buffer)).set(new Uint8Array(temp.buffer), (ctr * frameSize));
                temp = null;
            }

            this.tags[daikon.Tag.createId(daikon.Tag.TAG_PIXEL_DATA[0], daikon.Tag.TAG_PIXEL_DATA[1])].value = decompressed;
        }
    }
};



daikon.Image.prototype.hasPixelData = function () {
    return (this.tags[daikon.Tag.createId(daikon.Tag.TAG_PIXEL_DATA[0], daikon.Tag.TAG_PIXEL_DATA[1])] !== undefined);
};



daikon.Image.prototype.clearPixelData = function () {
    this.tags[daikon.Tag.createId(daikon.Tag.TAG_PIXEL_DATA[0], daikon.Tag.TAG_PIXEL_DATA[1])].value = null;
};



daikon.Image.prototype.getOrientation = function () {
    var orientation = null,
        dirCos = daikon.Image.getValueSafely(this.getTag(daikon.Tag.TAG_IMAGE_ORIENTATION[0], daikon.Tag.TAG_IMAGE_ORIENTATION[1])),
        ctr,
        spacing,
        rowSpacing,
        swapZ,
        bigRow = 0, bigCol = 0,
        biggest = 0, orient = '';

    if (!dirCos || (dirCos.length !== 6)) {
        return null;
    }

    spacing = this.getPixelSpacing();

    if (!spacing) {
        return null;
    }

    rowSpacing = spacing[0];
    swapZ = true;

    for (ctr = 0; ctr < 3; ctr += 1) {
        if (Math.abs(dirCos[ctr]) > biggest) {
            biggest = Math.abs(dirCos[ctr]);
            bigRow = ctr;
        }
    }

    biggest = 0;
    for (; ctr < 6; ctr += 1) {
        if (Math.abs(dirCos[ctr]) > biggest) {
            biggest = Math.abs(dirCos[ctr]);
            bigCol = ctr;
        }
    }

    switch (bigRow) {
        case 0:
            orient += ('X');
            if (bigCol === 4) {
                orient += ("YZ");
            } else {
                orient += ("ZY");
            }
            break;
        case 1:
            orient += ('Y');
            if (bigCol === 3) {
                orient += ("XZ");
            } else {
                orient += ("ZX");
            }
            break;
        case 2:
            orient += ('Z');
            if (bigCol === 3) {
                orient += ("XY");
            } else {
                orient += ("YX");
            }
            break;
        default:
            break;
    }

    switch (bigRow) {
        case 0:
            if (dirCos[bigRow] > 0.0) {
                orient += ('-');
            } else {
                orient += ('+');
            }
            if (bigCol === 4) {
                if (dirCos[bigCol] > 0.0) {
                    orient += ('-');
                } else {
                    orient += ('+');
                }
            } else {
                if (dirCos[bigCol] > 0.0) {
                    orient += ('+');
                } else {
                    orient += ('-');
                }
            }
            break;
        case 1:
            if (dirCos[bigRow] > 0.0) {
                orient += ('-');
            } else {
                orient += ('+');
            }
            if (bigCol === 3) {
                if (dirCos[bigCol] > 0.0) {
                    orient += ('-');
                } else {
                    orient += ('+');
                }
            } else {
                if (dirCos[bigCol] > 0.0) {
                    orient += ('+');
                } else {
                    orient += ('-');
                }
            }
            break;
        case 2:
            if (dirCos[bigRow] > 0.0) {
                orient += ('+');
            } else {
                orient += ('-');
            }
            //Has to be X or Y so opposite senses
            if (dirCos[bigCol] > 0.0) {
                orient += ('-');
            } else {
                orient += ('+');
            }
            break;
        default:
            break;
    }

    if (rowSpacing === 0.0) {
        orient += ('+');
        orientation = orient;
    } else {
        if (swapZ) {
            switch (orient.charAt(2)) {
                case 'X':
                    if (rowSpacing > 0.0) {
                        orient += ('-');
                    } else {
                        orient += ('+');
                    }
                    break;
                case 'Y':
                case 'Z':
                    if (rowSpacing > 0.0) {
                        orient += ('+');
                    } else {
                        orient += ('-');
                    }
                    break;
                default:
                    break;
            }
        } else {
            switch (orient.charAt(2)) {
                case 'X':
                    if (rowSpacing > 0.0) {
                        orient += ('+');
                    } else {
                        orient += ('-');
                    }
                    break;
                case 'Y':
                case 'Z':
                    if (rowSpacing > 0.0) {
                        orient += ('-');
                    } else {
                        orient += ('+');
                    }
                    break;
                default:
                    break;
            }
        }

        orientation = orient;
    }

    return orientation;
};



daikon.Image.prototype.isMosaic = function () {
    var imageType, labeledAsMosaic = false, canReadAsMosaic, ctr, matSize;

    imageType = this.getImageType();

    if (imageType !== null) {
        for (ctr = 0; ctr < imageType.length; ctr += 1) {
            if (imageType[ctr].toUpperCase().indexOf("MOSAIC") !== -1) {
                labeledAsMosaic = true;
                break;
            }
        }
    }

    matSize = this.getAcquisitionMatrix();
    canReadAsMosaic = (matSize > 0) && ((matSize < this.getRows()) || (matSize < this.getCols()));
    return labeledAsMosaic && canReadAsMosaic;
};



daikon.Image.prototype.getMosaicCols = function() {
    return this.getCols() / this.getAcquisitionMatrix();
};



daikon.Image.prototype.getMosaicRows = function() {
    return this.getRows() / this.getAcquisitionMatrix();
};



daikon.Image.prototype.isElscint = function() {
    var tag = this.getTag(daikon.Tag.TAG_DATA_SCALE_ELSCINT[0], daikon.Tag.TAG_DATA_SCALE_ELSCINT[1]);
    return (tag !== undefined);
};



daikon.Image.prototype.isCompressed = function() {
    daikon.Parser = daikon.Parser || ((typeof require !== 'undefined') ? require('./parser.js') : null);

    var transferSyntax = this.getTransferSyntax();
    if (transferSyntax) {
        if (transferSyntax.indexOf(daikon.Parser.TRANSFER_SYNTAX_COMPRESSION_JPEG) !== -1) {
            return true;
        } else if (transferSyntax.indexOf(daikon.Parser.TRANSFER_SYNTAX_COMPRESSION_RLE) !== -1) {
            return true;
        }
    }

    return false;
};



daikon.Image.prototype.isCompressedJPEG = function() {
    daikon.Parser = daikon.Parser || ((typeof require !== 'undefined') ? require('./parser.js') : null);

    var transferSyntax = this.getTransferSyntax();
    if (transferSyntax) {
        if (transferSyntax.indexOf(daikon.Parser.TRANSFER_SYNTAX_COMPRESSION_JPEG) !== -1) {
            return true;
        }
    }

    return false;
};



daikon.Image.prototype.isCompressedJPEGLossless = function() {
    daikon.Parser = daikon.Parser || ((typeof require !== 'undefined') ? require('./parser.js') : null);

    var transferSyntax = this.getTransferSyntax();
    if (transferSyntax) {
        if ((transferSyntax.indexOf(daikon.Parser.TRANSFER_SYNTAX_COMPRESSION_JPEG_LOSSLESS) !== -1) ||
            (transferSyntax.indexOf(daikon.Parser.TRANSFER_SYNTAX_COMPRESSION_JPEG_LOSSLESS_SEL1) !== -1)) {
            return true;
        }
    }

    return false;
};



daikon.Image.prototype.isCompressedJPEGBaseline = function() {
    daikon.Parser = daikon.Parser || ((typeof require !== 'undefined') ? require('./parser.js') : null);

    var transferSyntax = this.getTransferSyntax();
    if (transferSyntax) {
        if ((transferSyntax.indexOf(daikon.Parser.TRANSFER_SYNTAX_COMPRESSION_JPEG_BASELINE_8BIT) !== -1) ||
            (transferSyntax.indexOf(daikon.Parser.TRANSFER_SYNTAX_COMPRESSION_JPEG_BASELINE_12BIT) !== -1)) {
            return true;
        }
    }

    return false;
};



daikon.Image.prototype.isCompressedJPEG2000 = function() {
    daikon.Parser = daikon.Parser || ((typeof require !== 'undefined') ? require('./parser.js') : null);

    var transferSyntax = this.getTransferSyntax();
    if (transferSyntax) {
        if ((transferSyntax.indexOf(daikon.Parser.TRANSFER_SYNTAX_COMPRESSION_JPEG_2000) !== -1) ||
            (transferSyntax.indexOf(daikon.Parser.TRANSFER_SYNTAX_COMPRESSION_JPEG_2000_LOSSLESS) !== -1)) {
            return true;
        }
    }

    return false;
};



daikon.Image.prototype.isCompressedRLE = function() {
    daikon.Parser = daikon.Parser || ((typeof require !== 'undefined') ? require('./parser.js') : null);

    var transferSyntax = this.getTransferSyntax();
    if (transferSyntax) {
        if (transferSyntax.indexOf(daikon.Parser.TRANSFER_SYNTAX_COMPRESSION_RLE) !== -1) {
            return true;
        }
    }

    return false;
};



daikon.Image.prototype.getNumberOfFrames = function () {
    var value = daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_NUMBER_OF_FRAMES[0], daikon.Tag.TAG_NUMBER_OF_FRAMES[1]), 0);

    if (value !== null) {
        return value;
    }

    return 1;
};



daikon.Image.prototype.getNumberOfImplicitFrames = function () {
    var pixelData, length, size;

    if (this.isCompressed()) {
        return 1;
    }

    pixelData = this.getPixelData();
    length = pixelData.offsetEnd - pixelData.offsetValue;
    size = this.getCols() * this.getRows() * (parseInt(this.getBitsAllocated() / 8));

    return parseInt(length / size);
};



daikon.Image.prototype.getPixelRepresentation = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_PIXEL_REPRESENTATION[0], daikon.Tag.TAG_PIXEL_REPRESENTATION[1]), 0);
};



daikon.Image.prototype.getPhotometricInterpretation = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_PHOTOMETRIC_INTERPRETATION[0], daikon.Tag.TAG_PHOTOMETRIC_INTERPRETATION[1]), 0);
};



daikon.Image.prototype.getPatientName = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_PATIENT_NAME[0], daikon.Tag.TAG_PATIENT_NAME[1]), 0);
};



daikon.Image.prototype.getPatientID = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_PATIENT_ID[0], daikon.Tag.TAG_PATIENT_ID[1]), 0);
};



daikon.Image.prototype.getStudyTime = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_STUDY_TIME[0], daikon.Tag.TAG_STUDY_TIME[1]), 0);
};



daikon.Image.prototype.getTransferSyntax = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_TRANSFER_SYNTAX[0], daikon.Tag.TAG_TRANSFER_SYNTAX[1]), 0);
};



daikon.Image.prototype.getStudyDate = function () {
    return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_STUDY_DATE[0], daikon.Tag.TAG_STUDY_DATE[1]), 0);
};



daikon.Image.prototype.getImageDescription = function () {
    var value, string = "";

    value = daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_STUDY_DES[0], daikon.Tag.TAG_STUDY_DES[1]), 0);
    if (value !== null) {
        string += (" " + value);
    }

    value = daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_SERIES_DESCRIPTION[0], daikon.Tag.TAG_SERIES_DESCRIPTION[1]), 0);
    if (value !== null) {
        string += (" " + value);
    }

    value = daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_IMAGE_COMMENTS[0], daikon.Tag.TAG_IMAGE_COMMENTS[1]), 0);
    if (value !== null) {
        string += (" " + value);
    }

    return string.trim();
};



daikon.Image.prototype.getDataType = function () {
    var interp, dataType;

    dataType = this.getPixelRepresentation();

    if (dataType === null) {
        return daikon.Image.BYTE_TYPE_UNKNOWN;
    }

    interp = this.getPhotometricInterpretation();
    if (interp !== null) {
        if ((interp.trim().indexOf('RGB') !== -1) || (interp.trim().indexOf('YBR') !== -1)) {
            return daikon.Image.BYTE_TYPE_RGB;
        }
    }

    if (dataType === 0) {
        return daikon.Image.BYTE_TYPE_INTEGER_UNSIGNED;
    } else if (dataType === 1) {
        return daikon.Image.BYTE_TYPE_INTEGER;
    } else {
        return daikon.Image.BYTE_TYPE_UNKNOWN;
    }
};



// originally from: http://public.kitware.com/pipermail/insight-users/2005-March/012246.html
daikon.Image.prototype.getAcquiredSliceDirection = function () {
    var dirCos, rowAxis, colAxis, label;

    dirCos = daikon.Image.getValueSafely(this.getTag(daikon.Tag.TAG_IMAGE_ORIENTATION[0], daikon.Tag.TAG_IMAGE_ORIENTATION[1]));

    if (!dirCos || (dirCos.length !== 6)) {
        return daikon.Image.SLICE_DIRECTION_UNKNOWN;
    }

    rowAxis = daikon.Image.getMajorAxisFromPatientRelativeDirectionCosine(dirCos[0], dirCos[1], dirCos[2]);
    colAxis = daikon.Image.getMajorAxisFromPatientRelativeDirectionCosine(dirCos[3], dirCos[4], dirCos[5]);

    if ((rowAxis !== null) && (colAxis !== null)) {
        if (((rowAxis === "R") || (rowAxis === "L")) && ((colAxis === "A") || (colAxis === "P"))) {
            label = daikon.Image.SLICE_DIRECTION_AXIAL;
        } else if (((colAxis === "R") || (colAxis === "L")) && ((rowAxis === "A") || (rowAxis === "P"))) {
            label = daikon.Image.SLICE_DIRECTION_AXIAL;
        } else if (((rowAxis === "R") || (rowAxis === "L")) && ((colAxis === "H") || (colAxis === "F"))) {
            label = daikon.Image.SLICE_DIRECTION_CORONAL;
        } else if (((colAxis === "R") || (colAxis === "L")) && ((rowAxis === "H") || (rowAxis === "F"))) {
            label = daikon.Image.SLICE_DIRECTION_CORONAL;
        } else if (((rowAxis === "A") || (rowAxis === "P")) && ((colAxis === "H") || (colAxis === "F"))) {
            label = daikon.Image.SLICE_DIRECTION_SAGITTAL;
        } else if (((colAxis === "A") || (colAxis === "P")) && ((rowAxis === "H") || (rowAxis === "F"))) {
            label = daikon.Image.SLICE_DIRECTION_SAGITTAL;
        }
    } else {
        label = daikon.Image.SLICE_DIRECTION_OBLIQUE;
    }

    return label;
};



// returns an array of tags
daikon.Image.prototype.getEncapsulatedData = function () {
    var buffer, parser;

    daikon.Parser = daikon.Parser || ((typeof require !== 'undefined') ? require('./parser.js') : null);

    buffer = this.getPixelData().value.buffer;
    parser = new daikon.Parser();
    return parser.parseEncapsulated(new DataView(buffer));
};



daikon.Image.prototype.getJpegs = function () {
    var encapTags, numTags, ctr, currentJpeg, data = [], dataConcat = [];

    encapTags = this.getEncapsulatedData();

    // organize data as an array of an array of JPEG parts
    if (encapTags) {
        numTags = encapTags.length;

        for (ctr = 0; ctr < numTags; ctr += 1) {
            if (daikon.CompressionUtils.isHeaderJPEG(encapTags[ctr].value) ||
                daikon.CompressionUtils.isHeaderJPEG2000(encapTags[ctr].value)) {
                currentJpeg = [];
                currentJpeg.push(encapTags[ctr].value.buffer);
                data.push(currentJpeg);
            } else if (currentJpeg && encapTags[ctr].value) {
                currentJpeg.push(encapTags[ctr].value.buffer);
            }
        }
    }

    // concat into an array of full JPEGs
    for (ctr = 0; ctr < data.length; ctr += 1) {
        if (data[ctr].length > 1) {
            dataConcat[ctr] = daikon.Utils.concatArrayBuffers2(data[ctr]);
        } else {
            dataConcat[ctr] = data[ctr][0];
        }

        data[ctr] = null;
    }

    return dataConcat;
};



daikon.Image.prototype.getRLE = function () {
    var encapTags, numTags, ctr, data = [];

    encapTags = this.getEncapsulatedData();

    // organize data as an array of an array of JPEG parts
    if (encapTags) {
        numTags = encapTags.length;

        // the first sublist item contains offsets, need offsets?
        for (ctr = 1; ctr < numTags; ctr += 1) {
            if (encapTags[ctr].value) {
                data.push(encapTags[ctr].value.buffer);
            }
        }
    }

    return data;
};



daikon.Image.prototype.toString = function () {
    var ctr, tag, key, str = "";

    var sorted_keys = Object.keys(this.tags).sort();

    for (ctr = 0; ctr < sorted_keys.length; ctr+=1) {
        key = sorted_keys[ctr];
        if (this.tags.hasOwnProperty(key)) {
            tag = this.tags[key];
            str += (tag.toHTMLString() + "<br />");
        }
    }

    str = str.replace(/(?:\r\n|\r|\n)/g, '<br />');

    return str;
};


/*** Exports ***/

var moduleType = typeof module;
if ((moduleType !== 'undefined') && module.exports) {
    module.exports = daikon.Image;
}

},{"../lib/jpg.js":1,"../lib/jpx.js":2,"./compression-utils.js":12,"./parser.js":18,"./rle.js":19,"./tag.js":21,"./utilities.js":22,"JPEGLosslessDecoderJS":5}],15:[function(require,module,exports){

/*jslint browser: true, node: true */
/*global require */

"use strict";

/*** Imports ***/
var daikon = daikon || {};


/*** Constructor ***/
daikon.OrderedMapIterator = daikon.OrderedMapIterator || function (orderedMap) {
    this.orderedMap = orderedMap;
    this.index = 0;
};


/*** Prototype Methods ***/

daikon.OrderedMapIterator.prototype.hasNext = function() {
    return (this.index < this.orderedMap.orderedKeys.length);
};



daikon.OrderedMapIterator.prototype.next = function() {
    var item = this.orderedMap.get(this.orderedMap.orderedKeys[this.index]);
    this.index += 1;
    return item;
};


/*** Exports ***/

var moduleType = typeof module;
if ((moduleType !== 'undefined') && module.exports) {
    module.exports = daikon.OrderedMapIterator;
}

},{}],16:[function(require,module,exports){

/*jslint browser: true, node: true */
/*global require, module */

"use strict";

/*** Imports ***/

var daikon = daikon || {};
daikon.CompressionUtils = daikon.CompressionUtils || ((typeof require !== 'undefined') ? require('./compression-utils.js') : null);
daikon.Dictionary = daikon.Dictionary || ((typeof require !== 'undefined') ? require('./dictionary.js') : null);
daikon.Image = daikon.Image || ((typeof require !== 'undefined') ? require('./image.js') : null);
daikon.OrderedMapIterator = daikon.OrderedMapIterator || ((typeof require !== 'undefined') ? require('./iterator.js') : null);
daikon.OrderedMap = daikon.OrderedMap || ((typeof require !== 'undefined') ? require('./orderedmap.js') : null);
daikon.Parser = daikon.Parser || ((typeof require !== 'undefined') ? require('./parser.js') : null);
daikon.RLE = daikon.RLE || ((typeof require !== 'undefined') ? require('./rle.js') : null);
daikon.Series = daikon.Series || ((typeof require !== 'undefined') ? require('./series.js') : null);
daikon.Tag = daikon.Tag || ((typeof require !== 'undefined') ? require('./tag.js') : null);
daikon.Utils = daikon.Utils || ((typeof require !== 'undefined') ? require('./utilities.js') : null);

var jpeg = jpeg || {};
jpeg.lossless = jpeg.lossless || {};
jpeg.lossless.Decoder = ((typeof require !== 'undefined') ? require('JPEGLosslessDecoderJS') : null);

var JpegDecoder = JpegDecoder || ((typeof require !== 'undefined') ? require('../lib/jpg.js').JpegDecoder : null);

var JpxImage = JpxImage || ((typeof require !== 'undefined') ? require('../lib/jpx.js') : null);


/*** Exports ***/

var moduleType = typeof module;
if ((moduleType !== 'undefined') && module.exports) {
    module.exports = daikon;
}

},{"../lib/jpg.js":1,"../lib/jpx.js":2,"./compression-utils.js":12,"./dictionary.js":13,"./image.js":14,"./iterator.js":15,"./orderedmap.js":17,"./parser.js":18,"./rle.js":19,"./series.js":20,"./tag.js":21,"./utilities.js":22,"JPEGLosslessDecoderJS":5}],17:[function(require,module,exports){

/*jslint browser: true, node: true */
/*global require */

"use strict";

// Based on: http://stackoverflow.com/questions/3549894/javascript-data-structure-for-fast-lookup-and-ordered-looping

/*** Imports ***/
var daikon = daikon || {};
daikon.OrderedMapIterator = daikon.OrderedMapIterator || ((typeof require !== 'undefined') ? require('./iterator.js') : null);


/*** Constructor ***/
daikon.OrderedMap = daikon.OrderedMap || function () {
    this.map = {};
    this.orderedKeys = [];
};



daikon.OrderedMap.prototype.put = function(key, value) {
    if (key in this.map) { // key already exists, replace value
        this.map[key] = value;
    } else { // insert new key and value
        this.orderedKeys.push(key);
        this.orderedKeys.sort(function(a, b) { return parseFloat(a) - parseFloat(b); });
        this.map[key] = value;
    }
};



daikon.OrderedMap.prototype.remove = function(key) {
    var index = this.orderedKeys.indexOf(key);
    if(index === -1) {
        throw new Error('key does not exist');
    }

    this.orderedKeys.splice(index, 1);
    delete this.map[key];
};



daikon.OrderedMap.prototype.get = function(key) {
    if (key in this.map) {
        return this.map[key];
    }

    return null;
};



daikon.OrderedMap.prototype.iterator = function() {
    return new daikon.OrderedMapIterator(this);
};



daikon.OrderedMap.prototype.getOrderedValues = function() {
    var orderedValues = [], it = this.iterator();

    while (it.hasNext()) {
        orderedValues.push(it.next());
    }

    return orderedValues;
};



/*** Exports ***/

var moduleType = typeof module;
if ((moduleType !== 'undefined') && module.exports) {
    module.exports = daikon.OrderedMap;
}

},{"./iterator.js":15}],18:[function(require,module,exports){

/*jslint browser: true, node: true */
/*global require, module */

"use strict";

/*** Imports ***/
var daikon = daikon || {};
daikon.Tag = daikon.Tag || ((typeof require !== 'undefined') ? require('./tag.js') : null);
daikon.Utils = daikon.Utils || ((typeof require !== 'undefined') ? require('./utilities.js') : null);
daikon.Dictionary = daikon.Dictionary || ((typeof require !== 'undefined') ? require('./dictionary.js') : null);
daikon.Image = daikon.Image || ((typeof require !== 'undefined') ? require('./image.js') : null);


/*** Constructor ***/
daikon.Parser = daikon.Parser || function () {
    this.littleEndian = true;
    this.explicit = true;
    this.metaFound = false;
    this.metaFinished = false;
    this.metaFinishedOffset = -1;
    this.error = null;
};


/*** Static Fields ***/
daikon.Parser.verbose = false;


/*** Static Pseudo-constants ***/

daikon.Parser.MAGIC_COOKIE_OFFSET = 128;
daikon.Parser.MAGIC_COOKIE = [68, 73, 67, 77];
daikon.Parser.VRS = ["AE", "AS", "AT", "CS", "DA", "DS", "DT", "FL", "FD", "IS", "LO", "LT", "OB", "OD", "OF", "OW", "PN", "SH", "SL", "SS", "ST", "TM", "UI", "UL", "UN", "US", "UT"];
daikon.Parser.DATA_VRS = ["OB", "OW", "OF", "SQ", "UT", "UN"];
daikon.Parser.RAW_DATA_VRS = ["OB", "OD", "OF", "OW", "UN"];
daikon.Parser.TRANSFER_SYNTAX_IMPLICIT_LITTLE = "1.2.840.10008.1.2";
daikon.Parser.TRANSFER_SYNTAX_EXPLICIT_LITTLE = "1.2.840.10008.1.2.1";
daikon.Parser.TRANSFER_SYNTAX_EXPLICIT_BIG = "1.2.840.10008.1.2.2";
daikon.Parser.TRANSFER_SYNTAX_COMPRESSION_JPEG = "1.2.840.10008.1.2.4";
daikon.Parser.TRANSFER_SYNTAX_COMPRESSION_JPEG_LOSSLESS = "1.2.840.10008.1.2.4.57";
daikon.Parser.TRANSFER_SYNTAX_COMPRESSION_JPEG_LOSSLESS_SEL1 = "1.2.840.10008.1.2.4.70";
daikon.Parser.TRANSFER_SYNTAX_COMPRESSION_JPEG_BASELINE_8BIT = "1.2.840.10008.1.2.4.50";
daikon.Parser.TRANSFER_SYNTAX_COMPRESSION_JPEG_BASELINE_12BIT = "1.2.840.10008.1.2.4.51";
daikon.Parser.TRANSFER_SYNTAX_COMPRESSION_JPEG_2000_LOSSLESS = "1.2.840.10008.1.2.4.90";
daikon.Parser.TRANSFER_SYNTAX_COMPRESSION_JPEG_2000 = "1.2.840.10008.1.2.4.91";
daikon.Parser.TRANSFER_SYNTAX_COMPRESSION_RLE = "1.2.840.10008.1.2.5";
daikon.Parser.UNDEFINED_LENGTH = 0xFFFFFFFF;


/*** Static Methods ***/

daikon.Parser.isMagicCookieFound = function (data) {
    var offset = daikon.Parser.MAGIC_COOKIE_OFFSET, magicCookieLength = daikon.Parser.MAGIC_COOKIE.length, ctr;

    for (ctr = 0; ctr < magicCookieLength; ctr += 1) {
        if (data.getUint8(offset + ctr) !== daikon.Parser.MAGIC_COOKIE[ctr]) {
            return false;
        }
    }

    return true;
};


/*** Prototype Methods ***/

daikon.Parser.prototype.parse = function (data) {
    var image = null, offset, tag;

    try {
        image = new daikon.Image();
        offset = this.findFirstTagOffset(data);
        tag = this.getNextTag(data, offset);

        while (tag !== null) {
            if (daikon.Parser.verbose) {
                console.log(tag.toString());
            }

            image.putTag(tag);

            if (tag.isPixelData()) {
                break;
            }

            tag = this.getNextTag(data, tag.offsetEnd);
        }
    } catch (err) {
        this.error = err;
    }

    if (image !== null) {
        image.littleEndian = this.littleEndian;
    }

    return image;
};



daikon.Parser.prototype.parseEncapsulated = function (data) {
    var offset = 0, tag, tags = [];

    try {
        tag = this.getNextTag(data, offset);

        while (tag !== null) {
            if (tag.isSublistItem()) {
                tags.push(tag);
            }

            if (daikon.Parser.verbose) {
                console.log(tag.toString());
            }

            tag = this.getNextTag(data, tag.offsetEnd);
        }
    } catch (err) {
        this.error = err;

    }

    return tags;
};



daikon.Parser.prototype.testForValidTag = function (data) {
    var offset, tag = null;

    try {
        offset = this.findFirstTagOffset(data);
        tag = this.getNextTag(data, offset, true);
    } catch (err) {
        this.error = err;
    }

    return tag;
};



daikon.Parser.prototype.getNextTag = function (data, offset, testForTag) {
    var group = 0, element, value = null, offsetStart = offset, offsetValue, length = 0, little = true, vr = null, tag;

    if (offset >= data.byteLength) {
        return null;
    }

    if (this.metaFinished) {
        little = this.littleEndian;
        group = data.getUint16(offset, little);
    } else {
        group = data.getUint16(offset, true);

        if (((this.metaFinishedOffset !== -1) && (offset >= this.metaFinishedOffset)) || (group !== 0x0002)) {
            this.metaFinished = true;
            little = this.littleEndian;
            group = data.getUint16(offset, little);
        } else {
            little = true;
        }
    }

    if (!this.metaFound && (group === 0x0002)) {
        this.metaFound = true;
    }

    offset += 2;

    element = data.getUint16(offset, true);
    offset += 2;

    if (this.explicit || !this.metaFinished) {
        vr = daikon.Utils.getStringAt(data, offset, 2);

        if (!this.metaFound && this.metaFinished && (daikon.Parser.VRS.indexOf(vr) === -1)) {
            vr = daikon.Dictionary.getVR(group, element);
            length = data.getUint32(offset, little);
            offset += 4;
            this.explicit = false;
        } else {
            offset += 2;

            if (daikon.Parser.DATA_VRS.indexOf(vr) !== -1) {
                offset += 2;  // skip two empty bytes

                length = data.getUint32(offset, little);
                offset += 4;
            } else {
                length = data.getUint16(offset, little);
                offset += 2;
            }
        }
    } else {
        vr = daikon.Dictionary.getVR(group, element);
        length = data.getUint32(offset, little);

        if (length === daikon.Parser.UNDEFINED_LENGTH) {
            vr = 'SQ';
        }

        offset += 4;
    }

    offsetValue = offset;

    if (vr === 'SQ') {
        value = this.parseSublist(data, offset, length);

        if (length === daikon.Parser.UNDEFINED_LENGTH) {
            length = value[value.length - 1].offsetEnd - offset;
        }
    } else if ((length > 0) && !testForTag) {
        if (length === daikon.Parser.UNDEFINED_LENGTH) {
            if ((group === daikon.Tag.TAG_PIXEL_DATA[0]) && (element === daikon.Tag.TAG_PIXEL_DATA[1])) {
                length = (data.byteLength - offset);
            }
        }

        value = data.buffer.slice(offset, offset + length);
    }

    offset += length;
    tag = new daikon.Tag(group, element, vr, value, offsetStart, offsetValue, offset, this.littleEndian);

    if (tag.isTransformSyntax()) {
        if (tag.value[0] === daikon.Parser.TRANSFER_SYNTAX_IMPLICIT_LITTLE) {
            this.explicit = false;
            this.littleEndian = true;
        } else if (tag.value[0] === daikon.Parser.TRANSFER_SYNTAX_EXPLICIT_BIG) {
            this.explicit = true;
            this.littleEndian = false;
        } else {
            this.explicit = true;
            this.littleEndian = true;
        }
    } else if (tag.isMetaLength()) {
        this.metaFinishedOffset = tag.value[0] + offset;
    }

    return tag;
};



daikon.Parser.prototype.parseSublist = function (data, offset, length) {
    var sublistItem,
        offsetEnd = offset + length,
        tags = [];

    if (length === daikon.Parser.UNDEFINED_LENGTH) {
        sublistItem = this.parseSublistItem(data, offset);

        while (!sublistItem.isSequenceDelim()) {
            tags.push(sublistItem);
            offset = sublistItem.offsetEnd;
            sublistItem = this.parseSublistItem(data, offset);
        }

        tags.push(sublistItem);
    } else {
        while (offset < offsetEnd) {
            sublistItem = this.parseSublistItem(data, offset);
            tags.push(sublistItem);
            offset = sublistItem.offsetEnd;
        }
    }

    return tags;
};



daikon.Parser.prototype.parseSublistItem = function (data, offset) {
    var group, element, length, offsetEnd, tag, offsetStart = offset, offsetValue, sublistItemTag, tags = [];

    group = data.getUint16(offset, this.littleEndian);
    offset += 2;

    element = data.getUint16(offset, this.littleEndian);
    offset += 2;

    length = data.getUint32(offset, this.littleEndian);
    offset += 4;

    offsetValue = offset;

    if (length === daikon.Parser.UNDEFINED_LENGTH) {
        tag = this.getNextTag(data, offset);

        while (!tag.isSublistItemDelim()) {
            tags.push(tag);
            offset = tag.offsetEnd;
            tag = this.getNextTag(data, offset);
        }

        tags.push(tag);
        offset = tag.offsetEnd;
    } else {
        offsetEnd = offset + length;

        while (offset < offsetEnd) {
            tag = this.getNextTag(data, offset);
            tags.push(tag);
            offset = tag.offsetEnd;
        }
    }

    sublistItemTag = new daikon.Tag(group, element, null, tags, offsetStart, offsetValue, offset, this.littleEndian);

    return sublistItemTag;
};



daikon.Parser.prototype.findFirstTagOffset = function (data) {
    var offset = 0,
        magicCookieLength = daikon.Parser.MAGIC_COOKIE.length,
        searchOffsetMax = daikon.Parser.MAGIC_COOKIE_OFFSET * 2,
        found = false,
        ctr = 0,
        ctrIn = 0,
        ch = 0;

    if (daikon.Parser.isMagicCookieFound(data)) {
        offset = daikon.Parser.MAGIC_COOKIE_OFFSET + magicCookieLength;
    } else {
        for (ctr = 0; ctr < searchOffsetMax; ctr += 1) {
            ch = data.getUint8(offset);
            if (ch === daikon.Parser.MAGIC_COOKIE[0]) {
                found = true;
                for (ctrIn = 1; ctrIn < magicCookieLength; ctrIn += 1) {
                    if (data.getUint8(ctr + ctrIn) !== daikon.Parser.MAGIC_COOKIE[ctrIn]) {
                        found = false;
                    }
                }

                if (found) {
                    offset = ctr;
                    break;
                }
            }
        }
    }

    return offset;
};



daikon.Parser.prototype.hasError = function () {
    return (this.error !== null);
};


/*** Exports ***/

var moduleType = typeof module;
if ((moduleType !== 'undefined') && module.exports) {
    module.exports = daikon.Parser;
}

},{"./dictionary.js":13,"./image.js":14,"./tag.js":21,"./utilities.js":22}],19:[function(require,module,exports){

/*jslint browser: true, node: true */
/*global require, module */

"use strict";

/*** Imports ***/
var daikon = daikon || {};


/*** Constructor ***/
daikon.RLE = daikon.RLE || function () {
    this.rawData = null;
    this.bytesRead = 0;
    this.bytesPut = 0;
    this.segElemPut = 0;
    this.numSegments = 0;  // number of bytes of each voxel
    this.segmentOffsets = [];
    this.littleEndian = true;
    this.segmentIndex = 0;
    this.numElements = 0;
    this.size = 0;
    this.output = null;
};


/*** Static Pseudo-constants ***/

daikon.RLE.HEADER_SIZE = 64;


/*** Prototype Methods ***/

daikon.RLE.prototype.decode = function (data, littleEndian, numElements) {
    var ctr;

    this.rawData = new DataView(data);
    this.littleEndian = littleEndian;
    this.numElements = numElements;

    this.readHeader();
    this.output = new DataView(new ArrayBuffer(this.size));

    for (ctr = 0; ctr < this.numSegments; ctr+=1) {
        this.readNextSegment();
    }

    return this.processData();
};


daikon.RLE.prototype.processData = function () {
    /*jslint bitwise: true */

    var ctr, temp1, temp2, temp3, value, outputProcessed, offset;

    if (this.numSegments === 1) {
        return this.output;
    } else if (this.numSegments === 2) {
        outputProcessed = new DataView(new ArrayBuffer(this.size));

        for (ctr = 0; ctr < this.numElements; ctr+=1) {
            temp1 = (this.output.getInt8(ctr));
            temp2 = (this.output.getInt8(ctr + this.numElements));
            value = (((temp1 & 0xFF) << 8) | (temp2 & 0xFF));
            outputProcessed.setInt16(ctr * 2, value, this.littleEndian);
        }

        return outputProcessed;
    } else if (this.numSegments === 3) {
        outputProcessed = new DataView(new ArrayBuffer(this.numElements));
        offset = (2 * this.numElements);

        for (ctr = 0; ctr < this.numElements; ctr+=1) {
            temp1 = (this.output.getInt8(ctr));
            temp2 = (this.output.getInt8(ctr + this.numElements));
            temp3 = (this.output.getInt8(ctr + offset));
            outputProcessed.setInt8(ctr, parseInt((temp1 + temp2 + temp3) / 3.0));
        }

        return outputProcessed;
    } else {
        throw new Error("RLE data with " + this.numSegments + " segments is not supported!");
    }
};



daikon.RLE.prototype.readHeader = function () {
    var ctr;

    this.numSegments = this.getInt32();
    this.size = this.numElements * this.numSegments;

    for (ctr = 0; ctr < this.numSegments; ctr+=1) {
        this.segmentOffsets[ctr] = this.getInt32();
    }

    this.bytesRead = daikon.RLE.HEADER_SIZE;
};



daikon.RLE.prototype.hasValidInput = function () {
    return ((this.bytesRead < this.rawData.buffer.byteLength) &&
        (this.bytesPut < this.size) && (this.segElemPut < this.numElements));
};



daikon.RLE.prototype.readNextSegment = function () {
    var code;

    this.bytesRead = this.segmentOffsets[this.segmentIndex];
    this.segElemPut = 0;

    while (this.hasValidInput()) {
        code = this.get();

        if ((code >= 0) && (code < 128)) {
            this.readLiteral(code);
        } else if ((code <= -1) && (code > -128)) {
            this.readEncoded(code);
        } else if (code === -128) {
            console.warn("RLE: unsupported code!");
        }
    }

    this.segmentIndex+=1;
};



daikon.RLE.prototype.readLiteral = function (code) {
    var ctr, length = (code + 1);

    if (this.hasValidInput()) {
        for (ctr = 0; ctr < length; ctr+=1) {
            this.put(this.get());
        }
    } else {
        console.warn("RLE: insufficient data!");
    }
};



daikon.RLE.prototype.readEncoded = function (code) {
    var ctr,
        runLength = (1 - code),
        encoded = this.get();

    for (ctr = 0; ctr < runLength; ctr+=1) {
        this.put(encoded);
    }
};



daikon.RLE.prototype.getInt32 = function () {
    var value = this.rawData.getInt32(this.bytesRead, this.littleEndian);
    this.bytesRead += 4;
    return value;
};



daikon.RLE.prototype.getInt16 = function () {
    var value = this.rawData.getInt16(this.bytesRead, this.littleEndian);
    this.bytesRead += 2;
    return value;
};



daikon.RLE.prototype.get = function () {
    var value = this.rawData.getInt8(this.bytesRead);
    this.bytesRead += 1;
    return value;
};



daikon.RLE.prototype.put = function (val) {
    this.output.setInt8(this.bytesPut, val);
    this.bytesPut += 1;
    this.segElemPut += 1;
};



/*** Exports ***/

var moduleType = typeof module;
if ((moduleType !== 'undefined') && module.exports) {
    module.exports = daikon.RLE;
}

},{}],20:[function(require,module,exports){

/*jslint browser: true, node: true */
/*global require, module */

"use strict";

/*** Imports ***/
var daikon = daikon || {};
daikon.Parser = daikon.Parser || ((typeof require !== 'undefined') ? require('./parser.js') : null);
daikon.Image = daikon.Image || ((typeof require !== 'undefined') ? require('./image.js') : null);
daikon.OrderedMap = daikon.OrderedMap || ((typeof require !== 'undefined') ? require('./orderedmap.js') : null);
daikon.OrderedMapIterator = daikon.OrderedMapIterator || ((typeof require !== 'undefined') ? require('./iterator.js') : null);
daikon.Utils = daikon.Utils || ((typeof require !== 'undefined') ? require('./utilities.js') : null);


/*** Constructor ***/
daikon.Series = daikon.Series || function () {
    this.images = [];
    this.imagesOriginalOrder = null;
    this.isMosaic = false;
    this.isElscint = false;
    this.isCompressed = false;
    this.numberOfFrames = 0;
    this.numberOfFramesInFile = 0;
    this.isMultiFrame = false;
    this.isMultiFrameVolume = false;
    this.isMultiFrameTimeseries = false;
    this.isImplicitTimeseries = false;
    this.sliceSense = false;
    this.sliceDir = daikon.Image.SLICE_DIRECTION_UNKNOWN;
    this.error = null;
};


/*** Static fields ***/
daikon.Series.parserError = null;


/*** Static Methods ***/

daikon.Series.parseImage = function (data) {
    var parser, image;

    parser = new daikon.Parser();
    image = parser.parse(data);

    if (parser.hasError()) {
        daikon.Series.parserError = parser.error;
        return null;
    }

    return image;
};



daikon.Series.getMosaicOffset = function (mosaicCols, mosaicColWidth, mosaicRowHeight, mosaicWidth, xLocVal,
                                          yLocVal, zLocVal) {
    var xLoc, yLoc, zLoc;

    xLoc = xLocVal;
    yLoc = yLocVal;
    zLoc = zLocVal;

    xLoc = ((zLoc % mosaicCols) * mosaicColWidth) + xLoc;
    yLoc = (((parseInt(zLoc / mosaicCols)) * mosaicRowHeight) + yLoc) * mosaicWidth;

    return (xLoc + yLoc);
};



daikon.Series.orderDicoms = function (images, numFrames, sliceDir) {
    var hasImagePosition, hasSliceLocation, hasImageNumber, timeMap, timeIt, ctr, ctrIn, dg, ordered,
        imagesOrderedByTimeAndSpace;

    hasImagePosition = (images[0].getImagePosition() !== null);
    hasSliceLocation = (images[0].getSliceLocation() !== null);
    hasImageNumber = (images[0].getImageNumber() !== null);

    timeMap = daikon.Series.orderByTime(images, numFrames, sliceDir, hasImagePosition, hasSliceLocation);
    timeIt = timeMap.orderedKeys;

    imagesOrderedByTimeAndSpace = [];

    for (ctr = 0; ctr < timeIt.length; ctr += 1) {
        dg = timeMap.get(timeIt[ctr]);

        if (hasImagePosition) {
            ordered = daikon.Series.orderByImagePosition(dg, sliceDir);
        } else if (hasSliceLocation) {
            ordered = daikon.Series.orderBySliceLocation(dg);
        } else if (hasImageNumber) {
            ordered = daikon.Series.orderByImageNumber(dg);
        } else {
            ordered = dg;
        }

        for (ctrIn = 0; ctrIn < ordered.length; ctrIn += 1) {
            imagesOrderedByTimeAndSpace.push(ordered[ctrIn]);
        }
    }

    for (ctrIn = 0; ctrIn < imagesOrderedByTimeAndSpace.length; ctrIn += 1) {
        imagesOrderedByTimeAndSpace[ctrIn].index = ctrIn;
    }

    return imagesOrderedByTimeAndSpace;
};



daikon.Series.orderByImagePosition = function (images, sliceDir) {
    var dicomMap, ctr;
    dicomMap = new daikon.OrderedMap();

    for (ctr = 0; ctr < images.length; ctr += 1) {
        dicomMap.put(images[ctr].getImagePositionSliceDir(sliceDir), images[ctr]);
    }

    return dicomMap.getOrderedValues();
};



daikon.Series.orderBySliceLocation = function (images) {
    var dicomMap, ctr;
    dicomMap = new daikon.OrderedMap();

    for (ctr = 0; ctr < images.length; ctr += 1) {
        dicomMap.put(images[ctr].getSliceLocation(), images[ctr]);
    }

    return dicomMap.getOrderedValues();
};



daikon.Series.orderByImageNumber = function (images) {
    var dicomMap, ctr;
    dicomMap = new daikon.OrderedMap();

    for (ctr = 0; ctr < images.length; ctr += 1) {
        dicomMap.put(images[ctr].getImageNumber(), images[ctr]);
    }

    return dicomMap.getOrderedValues();
};



daikon.Series.hasMatchingSlice = function (dg, image, sliceDir, doImagePos, doSliceLoc) {
    var matchingNum = 0, ctr, current, imagePos, sliceLoc, imageNum;

    if (doImagePos) {
        matchingNum = image.getImagePositionSliceDir(sliceDir);
    } else if (doSliceLoc) {
        matchingNum = image.getSliceLocation();
    } else {
        matchingNum = image.getImageNumber();
    }

    for (ctr = 0; ctr < dg.length; ctr += 1) {
        current = dg[ctr];

        if (doImagePos) {
            imagePos = current.getImagePositionSliceDir(sliceDir);
            if (imagePos === matchingNum) {
                return true;
            }
        } else if (doSliceLoc) {
            sliceLoc = current.getSliceLocation();
            if (sliceLoc === matchingNum) {
                return true;
            }
        } else {
            imageNum = current.getImageNumber();
            if (imageNum === matchingNum) {
                return true;
            }
        }
    }

    return false;
};



daikon.Series.orderByTime = function (images, numFrames, sliceDir, hasImagePosition, hasSliceLocation) {
    var dicomMap, hasTemporalPosition, hasTemporalNumber, ctr, image, tempPos, dg, timeBySliceMap, imageNum,
        sliceMarker, slice, dicomsCopy, dicomsCopyIndex, sliceIt, timeIt, dgFound, it;

    dicomMap = new daikon.OrderedMap();
    hasTemporalPosition = (numFrames > 1) && (images[0].getTemporalPosition() !== null);
    hasTemporalNumber = (numFrames > 1) && (images[0].getTemporalNumber() !== null) && (images[0].getTemporalNumber() === numFrames);

    if (hasTemporalPosition && hasTemporalNumber) { // explicit series
        for (ctr = 0; ctr < images.length; ctr += 1) {
            image = images[ctr];

            tempPos = image.getTemporalPosition();
            dg = dicomMap.get(tempPos);
            if (!dg) {
                dg = [];
                dicomMap.put(tempPos, dg);
            }

            dg.push(image);
        }
    } else { // implicit series
        // order data by slice then time
        timeBySliceMap = new daikon.OrderedMap();
        for (ctr = 0; ctr < images.length; ctr += 1) {
            if (images[ctr] !== null) {
                imageNum = images[ctr].getImageNumber();
                sliceMarker = ctr;
                if (hasImagePosition) {
                    sliceMarker = images[ctr].getImagePositionSliceDir(sliceDir);
                } else if (hasSliceLocation) {
                    sliceMarker = images[ctr].getSliceLocation();
                }

                slice = timeBySliceMap.get(sliceMarker);
                if (slice === null) {
                    slice = new daikon.OrderedMap();
                    timeBySliceMap.put(sliceMarker, slice);
                }

                slice.put(imageNum, images[ctr]);
            }
        }

        // copy into DICOM array (ordered by slice by time)
        dicomsCopy = [];
        dicomsCopyIndex = 0;
        sliceIt = timeBySliceMap.iterator();
        while (sliceIt.hasNext()) {
            slice = sliceIt.next();
            timeIt = slice.iterator();
            while (timeIt.hasNext()) {
                dicomsCopy[dicomsCopyIndex] = timeIt.next();
                dicomsCopyIndex += 1;
            }
        }

        // groups dicoms by timepoint
        for (ctr = 0; ctr < dicomsCopy.length; ctr += 1) {
            if (dicomsCopy[ctr] !== null) {
                dgFound = null;
                it = dicomMap.iterator();
                while (it.hasNext()) {
                    dg = it.next();
                    if (!daikon.Series.hasMatchingSlice(dg, dicomsCopy[ctr], sliceDir, hasImagePosition, hasSliceLocation)) {
                        dgFound = dg;
                        break;
                    }
                }

                if (dgFound === null) {
                    dgFound = [];
                    dicomMap.put(dicomMap.orderedKeys.length, dgFound);
                }

                dgFound.push(dicomsCopy[ctr]);
            }
        }
    }

    return dicomMap;
};


/*** Prototype Methods ***/

daikon.Series.prototype.getOrder = function () {
    var ctr, order = [];

    for (ctr = 0; ctr < this.imagesOriginalOrder.length; ctr += 1) {
        order[ctr] = this.imagesOriginalOrder[ctr].index;
    }

    return order;
};



daikon.Series.prototype.toString = function () {
    return this.images[0].getSeriesId();
};



daikon.Series.prototype.getName = function () {
    var des = this.images[0].getSeriesDescription();
    var uid = this.images[0].getSeriesInstanceUID();

    if (des !== null) {
        return des;
    }

    if (uid !== null) {
        return uid;
    }

    return null;
};



daikon.Series.prototype.addImage = function (image) {
    this.images.push(image);
};



daikon.Series.prototype.matchesSeries = function (image) {
    if (this.images.length === 0) {
        return true;
    }

    return (this.images[0].getSeriesId() === image.getSeriesId());
};



daikon.Series.prototype.buildSeries = function () {
    var hasFrameTime, ctr, sliceLoc, orderedImages, sliceLocationFirst, sliceLocationLast, sliceLocDiff,
        sliceLocations, orientation, imagePos;

    this.isMosaic = this.images[0].isMosaic();
    this.isElscint = this.images[0].isElscint();
    this.isCompressed = this.images[0].isCompressed();

    // check for multi-frame
    this.numberOfFrames = this.images[0].getNumberOfFrames();
    this.numberOfFramesInFile = this.images[0].getNumberOfImplicitFrames();
    this.isMultiFrame = (this.numberOfFrames > 1) || (this.isMosaic && (this.images[0].length > 1));
    this.isMultiFrameVolume = false;
    this.isMultiFrameTimeseries = false;
    this.isImplicitTimeseries = false;

    if (this.isMultiFrame) {
        hasFrameTime = (this.images[0].getFrameTime() > 0);
        if (this.isMosaic) {
            this.isMultiFrameTimeseries = true;
        } else {
            if (hasFrameTime) {
                this.isMultiFrameTimeseries = true;
            } else if (this.numberOfFramesInFile > 1) {
                this.isMultiFrameTimeseries = true;
                this.numberOfFrames = this.images.length;
            } else {
                this.isMultiFrameVolume = true;
            }
        }
    }

    if (!this.isMosaic && (this.numberOfFrames <= 1)) { // check for implicit frame count
        imagePos = (this.images[0].getImagePosition() || []);
        sliceLoc = imagePos.toString();
        this.numberOfFrames = 0;

        for (ctr = 0; ctr < this.images.length; ctr += 1) {
            imagePos = (this.images[ctr].getImagePosition() || []);

            if (imagePos.toString() === sliceLoc) {
                this.numberOfFrames += 1;
            }
        }

        if (this.numberOfFrames > 1) {
            this.isImplicitTimeseries = true;
        }
    }

    this.sliceDir = this.images[0].getAcquiredSliceDirection();
    orderedImages = daikon.Series.orderDicoms(this.images, this.numberOfFrames, this.sliceDir);

    sliceLocationFirst = orderedImages[0].getImagePositionSliceDir(this.sliceDir);
    sliceLocationLast = orderedImages[orderedImages.length - 1].getImagePositionSliceDir(this.sliceDir);
    sliceLocDiff = sliceLocationLast - sliceLocationFirst;

    if (this.isMosaic) {
        this.sliceSense = true;
    } else if (this.isMultiFrame) {
        sliceLocations = orderedImages[0].getSliceLocationVector();
        if (sliceLocations !== null) {
            orientation = orderedImages[0].getOrientation();

            if (orientation.charAt(2) === 'Z') {
                this.sliceSense = (sliceLocations[0] - sliceLocations[sliceLocations.length - 1]) < 0;
            } else {
                this.sliceSense = (sliceLocations[0] - sliceLocations[sliceLocations.length - 1]) > 0;
            }
        } else {
            this.sliceSense = sliceLocationFirst < 0 ? false : true; // maybe???
        }
    } else {
        /*
         * "The direction of the axes is defined fully by the patient's orientation. The x-axis is increasing to the left hand side of the patient. The
         * y-axis is increasing to the posterior side of the patient. The z-axis is increasing toward the head of the patient."
         */
        if ((this.sliceDir === daikon.Image.SLICE_DIRECTION_SAGITTAL) || (this.sliceDir === daikon.Image.SLICE_DIRECTION_CORONAL)) {
            if (sliceLocDiff > 0) {
                this.sliceSense = false;
            } else {
                this.sliceSense = true;
            }
        } else {
            if (sliceLocDiff > 0) {
                this.sliceSense = true;
            } else {
                this.sliceSense = false;
            }
        }
    }

    this.imagesOriginalOrder = this.images;
    this.images = orderedImages;
};



daikon.Series.prototype.concatenateImageData = function (progressMeter, onFinishedImageRead) {
    var buffer, data;

    if (this.isMosaic) {
        data = this.getMosaicData(this.images[0], this.images[0].getPixelDataBytes());
    } else {
        data = this.images[0].getPixelDataBytes();
    }

    this.images[0].clearPixelData();
    buffer = new Uint8Array(new ArrayBuffer(data.byteLength * this.images.length));
    buffer.set(new Uint8Array(data), 0);

    setTimeout(this.concatenateNextImageData(buffer, data.byteLength, progressMeter, 1, onFinishedImageRead), 0);
};



daikon.Series.prototype.concatenateNextImageData = function (buffer, frameSize, progressMeter, index,
                                                             onFinishedImageRead) {
    var data;

    if (index >= this.images.length) {
        if (progressMeter) {
            progressMeter.drawProgress(1, "Reading DICOM Images");
        }

        onFinishedImageRead(buffer.buffer);
    } else {
        if (progressMeter) {
            progressMeter.drawProgress(index / this.images.length, "Reading DICOM Images");
        }

        if (this.isMosaic) {
            data = this.getMosaicData(this.images[index], this.images[index].getPixelDataBytes());
        } else {
            data = this.images[index].getPixelDataBytes();
        }

        this.images[index].clearPixelData();
        buffer.set(new Uint8Array(data), (frameSize * index));

        setTimeout(daikon.Utils.bind(this, function() {this.concatenateNextImageData(buffer, frameSize, progressMeter,
            index + 1, onFinishedImageRead);}), 0);
    }
};



daikon.Series.prototype.getMosaicData = function (image, data) {
    var mosaicWidth, mosaicHeight, mosaicRows, mosaicCols, mosaicRowHeight, mosaicColWidth,
        numBytes, ctrS, ctrR, ctrC, numSlices, numRows, numCols, buffer, dataTyped, offset, ctr, index = 0;

    numBytes = parseInt(this.images[0].getBitsAllocated() / 8);
    numSlices = this.images[0].getMosaicCols() * this.images[0].getMosaicRows();
    numRows = parseInt(this.images[0].getRows() / this.images[0].getMosaicRows());
    numCols = parseInt(this.images[0].getCols() / this.images[0].getMosaicCols());

    mosaicWidth = this.images[0].getCols();
    mosaicHeight = this.images[0].getRows();
    mosaicRows = this.images[0].getMosaicRows();
    mosaicCols = this.images[0].getMosaicCols();
    mosaicRowHeight = parseInt(mosaicHeight / mosaicRows);
    mosaicColWidth = parseInt(mosaicWidth / mosaicCols);

    buffer = new Uint8Array(new ArrayBuffer(numSlices * numRows * numCols * numBytes));
    dataTyped = new Uint8Array(data);

    for (ctrS = 0; ctrS < numSlices; ctrS += 1) {
        for (ctrR = 0; ctrR < numRows; ctrR += 1) {
            for (ctrC = 0; ctrC < numCols; ctrC += 1) {
                offset = daikon.Series.getMosaicOffset(mosaicCols, mosaicColWidth, mosaicRowHeight, mosaicWidth, ctrC,
                    ctrR, ctrS);
                for (ctr = 0; ctr < numBytes; ctr += 1) {
                    buffer[index] = dataTyped[(offset * numBytes) + ctr];
                    index += 1;
                }
            }
        }
    }

    return buffer.buffer;
};


/*** Exports ***/

var moduleType = typeof module;
if ((moduleType !== 'undefined') && module.exports) {
    module.exports = daikon.Series;
}

},{"./image.js":14,"./iterator.js":15,"./orderedmap.js":17,"./parser.js":18,"./utilities.js":22}],21:[function(require,module,exports){

/*jslint browser: true, node: true */
/*global require */

"use strict";

/*** Imports ***/
var daikon = daikon || {};
daikon.Utils = daikon.Utils || ((typeof require !== 'undefined') ? require('./utilities.js') : null);
daikon.Dictionary = daikon.Dictionary || ((typeof require !== 'undefined') ? require('./dictionary.js') : null);


/*** Constructor ***/
daikon.Tag = daikon.Tag || function (group, element, vr, value, offsetStart, offsetValue, offsetEnd, littleEndian) {
    this.group = group;
    this.element = element;
    this.vr = vr;
    this.offsetStart = offsetStart;
    this.offsetValue = offsetValue;
    this.offsetEnd = offsetEnd;
    this.sublist = false;
    this.id = daikon.Tag.createId(group, element);

    if (value instanceof Array) {
        this.value = value;
        this.sublist = true;
    } else if (value !== null) {
        this.value = daikon.Tag.convertValue(vr, new DataView(value), littleEndian);
    } else {
        this.value = null;
    }
};


/*** Static Pseudo-constants ***/

daikon.Tag.VR_AE_MAX_LENGTH = 16;
daikon.Tag.VR_AS_MAX_LENGTH = 4;
daikon.Tag.VR_AT_MAX_LENGTH = 4;
daikon.Tag.VR_CS_MAX_LENGTH = 16;
daikon.Tag.VR_DA_MAX_LENGTH = 8;
daikon.Tag.VR_DS_MAX_LENGTH = 16;
daikon.Tag.VR_DT_MAX_LENGTH = 26;
daikon.Tag.VR_FL_MAX_LENGTH = 4;
daikon.Tag.VR_FD_MAX_LENGTH = 8;
daikon.Tag.VR_IS_MAX_LENGTH = 12;
daikon.Tag.VR_LO_MAX_LENGTH = 64;
daikon.Tag.VR_LT_MAX_LENGTH = 10240;
daikon.Tag.VR_OB_MAX_LENGTH = -1;
daikon.Tag.VR_OD_MAX_LENGTH = -1;
daikon.Tag.VR_OF_MAX_LENGTH = -1;
daikon.Tag.VR_OW_MAX_LENGTH = -1;
daikon.Tag.VR_PN_MAX_LENGTH = 64 * 5;
daikon.Tag.VR_SH_MAX_LENGTH = 16;
daikon.Tag.VR_SL_MAX_LENGTH = 4;
daikon.Tag.VR_SS_MAX_LENGTH = 2;
daikon.Tag.VR_ST_MAX_LENGTH = 1024;
daikon.Tag.VR_TM_MAX_LENGTH = 16;
daikon.Tag.VR_UI_MAX_LENGTH = 64;
daikon.Tag.VR_UL_MAX_LENGTH = 4;
daikon.Tag.VR_UN_MAX_LENGTH = -1;
daikon.Tag.VR_US_MAX_LENGTH = 2;
daikon.Tag.VR_UT_MAX_LENGTH = -1;

// metadata
daikon.Tag.TAG_TRANSFER_SYNTAX = [0x0002, 0x0010];
daikon.Tag.TAG_META_LENGTH = [0x0002, 0x0000];

// sublists
daikon.Tag.TAG_SUBLIST_ITEM = [0xFFFE, 0xE000];
daikon.Tag.TAG_SUBLIST_ITEM_DELIM = [0xFFFE, 0xE00D];
daikon.Tag.TAG_SUBLIST_SEQ_DELIM = [0xFFFE, 0xE0DD];

// image dims
daikon.Tag.TAG_ROWS = [0x0028, 0x0010];
daikon.Tag.TAG_COLS = [0x0028, 0x0011];
daikon.Tag.TAG_ACQUISITION_MATRIX = [0x0018, 0x1310];
daikon.Tag.TAG_NUMBER_OF_FRAMES = [0x0028, 0x0008];
daikon.Tag.TAG_NUMBER_TEMPORAL_POSITIONS = [0x0020, 0x0105];

// voxel dims
daikon.Tag.TAG_PIXEL_SPACING = [0x0028, 0x0030];
daikon.Tag.TAG_SLICE_THICKNESS = [0x0018, 0x0050];
daikon.Tag.TAG_SLICE_GAP = [0x0018, 0x0088];
daikon.Tag.TAG_TR = [0x0018, 0x0080];
daikon.Tag.TAG_FRAME_TIME = [0x0018, 0x1063];

// datatype
daikon.Tag.TAG_BITS_ALLOCATED = [0x0028, 0x0100];
daikon.Tag.TAG_BITS_STORED = [0x0028, 0x0101];
daikon.Tag.TAG_PIXEL_REPRESENTATION = [0x0028, 0x0103];
daikon.Tag.TAG_HIGH_BIT = [0x0028, 0x0102];
daikon.Tag.TAG_PHOTOMETRIC_INTERPRETATION = [0x0028, 0x0004];
daikon.Tag.TAG_SAMPLES_PER_PIXEL = [0x0028, 0x0002];

// data scale
daikon.Tag.TAG_DATA_SCALE_SLOPE = [0x0028, 0x1053];
daikon.Tag.TAG_DATA_SCALE_INTERCEPT = [0x0028, 0x1052];
daikon.Tag.TAG_DATA_SCALE_ELSCINT = [0x0207, 0x101F];
daikon.Tag.TAG_PIXEL_BANDWIDTH = [0x0018, 0x0095];

// range
daikon.Tag.TAG_IMAGE_MIN = [0x0028, 0x0106];
daikon.Tag.TAG_IMAGE_MAX = [0x0028, 0x0107];
daikon.Tag.TAG_WINDOW_CENTER = [0x0028, 0x1050];
daikon.Tag.TAG_WINDOW_WIDTH = [0x0028, 0x1051];

// descriptors
daikon.Tag.TAG_PATIENT_NAME = [0x0010, 0x0010];
daikon.Tag.TAG_PATIENT_ID = [0x0010, 0x0020];
daikon.Tag.TAG_STUDY_DATE = [0x0008, 0x0020];
daikon.Tag.TAG_STUDY_TIME = [0x0008, 0x0030];
daikon.Tag.TAG_STUDY_DES = [0x0008, 0x1030];
daikon.Tag.TAG_IMAGE_TYPE = [0x0008, 0x0008];
daikon.Tag.TAG_IMAGE_COMMENTS = [0x0020, 0x4000];
daikon.Tag.TAG_SEQUENCE_NAME = [0x0018, 0x0024];
daikon.Tag.TAG_MODALITY = [0x0008, 0x0060];

// session ID
daikon.Tag.TAG_FRAME_OF_REF_UID = [0x0020, 0x0052];

// study ID
daikon.Tag.TAG_STUDY_UID = [0x0020, 0x000D];

// volume ID
daikon.Tag.TAG_SERIES_DESCRIPTION = [0x0008, 0x103E];
daikon.Tag.TAG_SERIES_INSTANCE_UID = [0x0020, 0x000E];
daikon.Tag.TAG_SERIES_NUMBER = [0x0020, 0x0011];
daikon.Tag.TAG_ECHO_NUMBER = [0x0018, 0x0086];
daikon.Tag.TAG_TEMPORAL_POSITION = [0x0020, 0x0100];

// slice ID
daikon.Tag.TAG_IMAGE_NUM = [0x0020, 0x0013];
daikon.Tag.TAG_SLICE_LOCATION = [0x0020, 0x1041];

// orientation
daikon.Tag.TAG_IMAGE_ORIENTATION = [0x0020, 0x0037];
daikon.Tag.TAG_IMAGE_POSITION = [0x0020, 0x0032];
daikon.Tag.TAG_SLICE_LOCATION_VECTOR = [0x0018, 0x2005];

// pixel data
daikon.Tag.TAG_PIXEL_DATA = [0x7FE0, 0x0010];


/*** Static methods ***/

daikon.Tag.createId = function (group, element) {
    var groupStr = daikon.Utils.dec2hex(group),
        elemStr = daikon.Utils.dec2hex(element);
    return groupStr + elemStr;
};



daikon.Tag.getUnsignedInteger16 = function (rawData, littleEndian) {
    var data, mul, ctr;

    mul = rawData.byteLength / 2;
    data = [];
    for (ctr = 0; ctr < mul; ctr += 1) {
        data[ctr] = rawData.getUint16(ctr * 2, littleEndian);
    }

    return data;
};



daikon.Tag.getSignedInteger16 = function (rawData, littleEndian) {
    var data, mul, ctr;

    mul = rawData.byteLength / 2;
    data = [];
    for (ctr = 0; ctr < mul; ctr += 1) {
        data[ctr] = rawData.getInt16(ctr * 2, littleEndian);
    }

    return data;
};



daikon.Tag.getFloat32 = function (rawData, littleEndian) {
    var data, mul, ctr;

    mul = rawData.byteLength / 4;
    data = [];
    for (ctr = 0; ctr < mul; ctr += 1) {
        data[ctr] = rawData.getFloat32(ctr * 4, littleEndian);
    }

    return data;
};



daikon.Tag.getSignedInteger32 = function (rawData, littleEndian) {
    var data, mul, ctr;

    mul = rawData.byteLength / 4;
    data = [];
    for (ctr = 0; ctr < mul; ctr += 1) {
        data[ctr] = rawData.getInt32(ctr * 4, littleEndian);
    }

    return data;
};



daikon.Tag.getUnsignedInteger32 = function (rawData, littleEndian) {
    var data, mul, ctr;

    mul = rawData.byteLength / 4;
    data = [];
    for (ctr = 0; ctr < mul; ctr += 1) {
        data[ctr] = rawData.getUint32(ctr * 4, littleEndian);
    }

    return data;
};



daikon.Tag.getFloat64 = function (rawData, littleEndian) {
    var data, mul, ctr;

    mul = rawData.byteLength / 8;
    data = [];
    for (ctr = 0; ctr < mul; ctr += 1) {
        data[ctr] = rawData.getFloat64(ctr * 8, littleEndian);
    }

    return data;
};



daikon.Tag.getDoubleElscint = function (rawData) {
    var data = [], reordered = [], ctr;

    for (ctr = 0; ctr < 8; ctr += 1) {
        data[ctr] = rawData.getUint8(ctr);
    }

    reordered[0] = data[3];
    reordered[1] = data[2];
    reordered[2] = data[1];
    reordered[3] = data[0];
    reordered[4] = data[7];
    reordered[5] = data[6];
    reordered[6] = data[5];
    reordered[7] = data[4];

    data = [daikon.Utils.bytesToDouble(reordered)];

    return data;
};



daikon.Tag.getFixedLengthStringValue = function (rawData, maxLength) {
    var data, mul, ctr;

    mul = Math.floor(rawData.byteLength / maxLength);
    data = [];
    for (ctr = 0; ctr < mul; ctr += 1) {
        data[ctr] = daikon.Utils.getStringAt(rawData, ctr * maxLength, maxLength);
    }

    return data;
};



daikon.Tag.getStringValue = function (rawData) {
    var data = daikon.Utils.getStringAt(rawData, 0, rawData.byteLength).split('\\'), ctr;

    for (ctr = 0; ctr < data.length; ctr += 1) {
        data[ctr] = daikon.Utils.trim(data[ctr]);
    }

    return data;
};



daikon.Tag.getDateStringValue = function (rawData) {
    var dotFormat = (daikon.Tag.getSingleStringValue(rawData)[0].indexOf('.') !== -1),
        stringData = daikon.Tag.getFixedLengthStringValue(rawData, dotFormat ? 10 : daikon.Tag.VR_DA_MAX_LENGTH),
        parts = null,
        data = [],
        ctr;

    for (ctr = 0; ctr < stringData.length; ctr += 1) {
        if (dotFormat) {
            parts = stringData[ctr].split('.');
            data[ctr] = new Date(daikon.Utils.safeParseInt(parts[0]),
                daikon.Utils.safeParseInt(parts[1]) - 1,
                daikon.Utils.safeParseInt(parts[2]));
        } else if (stringData[ctr].length === 8) {
            data[ctr] = new Date(daikon.Utils.safeParseInt(stringData[ctr].substring(0, 4)),
                daikon.Utils.safeParseInt(stringData[ctr].substring(4, 6)) - 1,
                daikon.Utils.safeParseInt(stringData[ctr].substring(6, 8)));
        } else {
            data[ctr] = Date.parse(stringData[ctr]);
        }
    }

    return data;
};



daikon.Tag.getDateTimeStringValue = function (rawData) {
    var stringData = daikon.Tag.getStringValue(rawData),
        data = [],
        ctr,
        year = null,
        month = null,
        date = null,
        hours = null,
        minutes = null,
        seconds = null;

    for (ctr = 0; ctr < stringData.length; ctr += 1) {
        if (stringData[ctr].length >= 4) {
            year = parseInt(stringData[ctr].substring(0, 4), 10);  // required

            if (stringData[ctr].length >= 6) {
                month = daikon.Utils.safeParseInt(stringData[ctr].substring(4, 6)) - 1;
            }

            if (stringData[ctr].length >= 8) {
                date = daikon.Utils.safeParseInt(stringData[ctr].substring(6, 8));
            }

            if (stringData[ctr].length >= 10) {
                hours = daikon.Utils.safeParseInt(stringData[ctr].substring(8, 10));
            }

            if (stringData[ctr].length >= 12) {
                minutes = daikon.Utils.safeParseInt(stringData[ctr].substring(10, 12));
            }

            if (stringData[ctr].length >= 14) {
                seconds = daikon.Utils.safeParseInt(stringData[ctr].substring(12, 14));
            }

            data[ctr] = new Date(year, month, date, hours, minutes, seconds);
        } else {
            data[ctr] = Date.parse(stringData[ctr]);
        }
    }

    return data;
};



daikon.Tag.getTimeStringValue = function (rawData) {
    var stringData = daikon.Tag.getStringValue(rawData),
        data = [],
        parts = null,
        ctr,
        hours = 0,
        minutes = 0,
        seconds = 0;

    for (ctr = 0; ctr < stringData.length; ctr += 1) {
        if (stringData[ctr].indexOf(':') !== -1) {
            parts = stringData[ctr].split(':');
            hours = daikon.Utils.safeParseInt(parts[0]);

            if (parts.length > 1) {
                minutes = daikon.Utils.safeParseInt(parts[1]);
            }

            if (parts.length > 2) {
                seconds = daikon.Utils.safeParseFloat(parts[2]);
            }
        } else {
            if (stringData[ctr].length >= 2) {
                hours = daikon.Utils.safeParseInt(stringData[ctr].substring(0, 2));
            }

            if (stringData[ctr].length >= 4) {
                minutes = daikon.Utils.safeParseInt(stringData[ctr].substring(2, 4));
            }

            if (stringData[ctr].length >= 6) {
                seconds = daikon.Utils.safeParseFloat(stringData[ctr].substring(4));
            }
        }

        data[ctr] = Math.round((hours * 60 * 60 * 1000) + (minutes * 60 * 1000) + (seconds * 1000));
    }

    return data;
};



daikon.Tag.getDoubleStringValue = function (rawData) {
    var stringData = daikon.Tag.getStringValue(rawData),
        data = [],
        ctr;

    for (ctr = 0; ctr < stringData.length; ctr += 1) {
        data[ctr] = parseFloat(stringData[ctr]);
    }

    return data;
};



daikon.Tag.getIntegerStringValue = function (rawData) {
    var stringData = daikon.Tag.getStringValue(rawData),
        data = [],
        ctr;

    for (ctr = 0; ctr < stringData.length; ctr += 1) {
        data[ctr] = parseInt(stringData[ctr], 10);
    }

    return data;
};



daikon.Tag.getSingleStringValue = function (rawData) {
    return [daikon.Utils.trim(daikon.Utils.getStringAt(rawData, 0, rawData.byteLength))];
};



daikon.Tag.getPersonNameStringValue = function (rawData) {
    var stringData = daikon.Tag.getStringValue(rawData),
        data = [],
        ctr;

    for (ctr = 0; ctr < stringData.length; ctr += 1) {
        data[ctr] = stringData[ctr].replace('^', ' ');
    }

    return data;
};



daikon.Tag.convertValue = function (vr, rawData, littleEndian) {
    var data = null;

    if (vr === 'AE') {
        data = daikon.Tag.getSingleStringValue(rawData, daikon.Tag.VR_AE_MAX_LENGTH);
    } else if (vr === 'AS') {
        data = daikon.Tag.getFixedLengthStringValue(rawData, daikon.Tag.VR_AS_MAX_LENGTH);
    } else if (vr === 'AT') {
        data = daikon.Tag.getUnsignedInteger16(rawData, littleEndian);
    } else if (vr === 'CS') {
        data = daikon.Tag.getStringValue(rawData);
    } else if (vr === 'DA') {
        data = daikon.Tag.getDateStringValue(rawData);
    } else if (vr === 'DS') {
        data = daikon.Tag.getDoubleStringValue(rawData);
    } else if (vr === 'DT') {
        data = daikon.Tag.getDateTimeStringValue(rawData);
    } else if (vr === 'FL') {
        data = daikon.Tag.getFloat32(rawData, littleEndian);
    } else if (vr === 'FD') {
        data = daikon.Tag.getFloat64(rawData, littleEndian);
    } else if (vr === 'FE') {  // special Elscint double (see dictionary)
        data = daikon.Tag.getDoubleElscint(rawData, littleEndian);
    } else if (vr === 'IS') {
        data = daikon.Tag.getIntegerStringValue(rawData);
    } else if (vr === 'LO') {
        data = daikon.Tag.getStringValue(rawData);
    } else if (vr === 'LT') {
        data = daikon.Tag.getSingleStringValue(rawData);
    } else if (vr === 'OB') {
        data = rawData;
    } else if (vr === 'OD') {
        data = rawData;
    } else if (vr === 'OF') {
        data = rawData;
    } else if (vr === 'OW') {
        data = rawData;
    } else if (vr === 'PN') {
        data = daikon.Tag.getPersonNameStringValue(rawData);
    } else if (vr === 'SH') {
        data = daikon.Tag.getStringValue(rawData);
    } else if (vr === 'SL') {
        data = daikon.Tag.getSignedInteger32(rawData, littleEndian);
    } else if (vr === 'SQ') {
        data = null;
    } else if (vr === 'SS') {
        data = daikon.Tag.getSignedInteger16(rawData, littleEndian);
    } else if (vr === 'ST') {
        data = daikon.Tag.getSingleStringValue(rawData);
    } else if (vr === 'TM') {
        data = daikon.Tag.getTimeStringValue(rawData);
    } else if (vr === 'UI') {
        data = daikon.Tag.getStringValue(rawData);
    } else if (vr === 'UL') {
        data = daikon.Tag.getUnsignedInteger32(rawData, littleEndian);
    } else if (vr === 'UN') {
        data = rawData;
    } else if (vr === 'US') {
        data = daikon.Tag.getUnsignedInteger16(rawData, littleEndian);
    } else if (vr === 'UT') {
        data = daikon.Tag.getSingleStringValue(rawData);
    }

    return data;
};


/*** Prototype Methods ***/

daikon.Tag.prototype.toString = function (level, html) {
    var valueStr = '',
        ctr,
        groupStr = daikon.Utils.dec2hex(this.group),
        elemStr = daikon.Utils.dec2hex(this.element),
        tagStr = '(' + groupStr + ',' + elemStr + ')',
        des = '',
        padding;

    if (level === undefined) {
        level = 0;
    }

    padding = "";
    for (ctr = 0; ctr < level; ctr += 1) {
        if (html) {
            padding += "&nbsp;&nbsp;";
        } else {
            padding += "  ";
        }
    }

    if (this.sublist) {
        for (ctr = 0; ctr < this.value.length; ctr += 1) {
            valueStr += ('\n' + (this.value[ctr].toString(level + 1, html)));
        }
    } else if (this.vr === 'SQ') {
        valueStr = '';
    } else if (this.isPixelData()) {
        valueStr = '';
    } else if (!this.value) {
        valueStr = '';
    } else {
        valueStr = '[' + this.value + ']';
    }

    if (this.isSublistItem()) {
        tagStr = "Sequence Item";
    } else if (this.isSublistItemDelim()) {
        tagStr = "Sequence Item Delimiter";
    } else if (this.isSequenceDelim()) {
        tagStr = "Sequence Delimiter";
    } else if (this.isPixelData()) {
        tagStr = "Pixel Data";
    } else {
        des = daikon.Utils.convertCamcelCaseToTitleCase(daikon.Dictionary.getDescription(this.group, this.element));
    }

    if (html) {
        return padding + "<span style='color:#B5CBD3'>" + tagStr + "</span>&nbsp;&nbsp;&nbsp;" + des + '&nbsp;&nbsp;&nbsp;' + valueStr;
    } else {
        return padding + ' ' + tagStr + ' ' + des + ' ' + valueStr;
    }
};




daikon.Tag.prototype.toHTMLString = function (level) {
    return this.toString(level, true);
};



daikon.Tag.prototype.isTransformSyntax = function () {
    return (this.group === daikon.Tag.TAG_TRANSFER_SYNTAX[0]) && (this.element === daikon.Tag.TAG_TRANSFER_SYNTAX[1]);
};



daikon.Tag.prototype.isPixelData = function () {
    return (this.group === daikon.Tag.TAG_PIXEL_DATA[0]) && (this.element === daikon.Tag.TAG_PIXEL_DATA[1]);
};



daikon.Tag.prototype.isSublistItem = function () {
    return (this.group === daikon.Tag.TAG_SUBLIST_ITEM[0]) && (this.element === daikon.Tag.TAG_SUBLIST_ITEM[1]);
};



daikon.Tag.prototype.isSublistItemDelim = function () {
    return (this.group === daikon.Tag.TAG_SUBLIST_ITEM_DELIM[0]) && (this.element === daikon.Tag.TAG_SUBLIST_ITEM_DELIM[1]);
};



daikon.Tag.prototype.isSequenceDelim = function () {
    return (this.group === daikon.Tag.TAG_SUBLIST_SEQ_DELIM[0]) && (this.element === daikon.Tag.TAG_SUBLIST_SEQ_DELIM[1]);
};



daikon.Tag.prototype.isMetaLength = function () {
    return (this.group === daikon.Tag.TAG_META_LENGTH[0]) && (this.element === daikon.Tag.TAG_META_LENGTH[1]);
};


/*** Exports ***/

var moduleType = typeof module;
if ((moduleType !== 'undefined') && module.exports) {
    module.exports = daikon.Tag;
}

},{"./dictionary.js":13,"./utilities.js":22}],22:[function(require,module,exports){

/*jslint browser: true, node: true */
/*global require, module */

"use strict";

/*** Imports ***/
var daikon = daikon || {};
daikon.Utils = daikon.Utils || {};


/*** Static methods ***/

daikon.Utils.dec2hex = function (i) {
    return (i + 0x10000).toString(16).substr(-4).toUpperCase();
};



// http://stackoverflow.com/questions/966225/how-can-i-create-a-two-dimensional-array-in-javascript
daikon.Utils.createArray = function (length) {
    var arr = new Array(length || 0),
        i = length;

    if (arguments.length > 1) {
        var args = Array.prototype.slice.call(arguments, 1);
        while(i--) arr[length-1 - i] = daikon.Utils.createArray.apply(this, args);
    }

    return arr;
};


daikon.Utils.getStringAt = function (dataview, start, length) {
    var str = "", ctr, ch;

    for (ctr = 0; ctr < length; ctr += 1) {
        ch = dataview.getUint8(start + ctr);

        if (ch !== 0) {
            str += String.fromCharCode(ch);
        }
    }

    return str;
};



daikon.Utils.trim = function (str) {
    return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
};



daikon.Utils.stripLeadingZeros = function (str) {
    return str.replace(/^[0]+/g, "");
};



daikon.Utils.safeParseInt = function (str) {
    str = daikon.Utils.stripLeadingZeros(str);
    if (str.length > 0) {
        return parseInt(str, 10);
    }

    return 0;
};



daikon.Utils.convertCamcelCaseToTitleCase = function (str) {
    var result = str.replace(/([A-Z][a-z])/g, " $1");
    return daikon.Utils.trim(result.charAt(0).toUpperCase() + result.slice(1));
};



daikon.Utils.safeParseFloat = function (str) {
    str = daikon.Utils.stripLeadingZeros(str);
    if (str.length > 0) {
        return parseFloat(str);
    }

    return 0;
};


// http://stackoverflow.com/questions/8361086/convert-byte-array-to-numbers-in-javascript
daikon.Utils.bytesToDouble = function (data) {
    var sign = (data[0] & 1<<7)>>7;

    var exponent = (((data[0] & 127) << 4) | (data[1]&(15<<4))>>4);

    if(exponent == 0) return 0;
    if(exponent == 0x7ff) return (sign) ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;

    var mul = Math.pow(2,exponent - 1023 - 52);
    var mantissa = data[7]+
        data[6]*Math.pow(2,8*1)+
        data[5]*Math.pow(2,8*2)+
        data[4]*Math.pow(2,8*3)+
        data[3]*Math.pow(2,8*4)+
        data[2]*Math.pow(2,8*5)+
        (data[1]&15)*Math.pow(2,8*6)+
        Math.pow(2,52);

    return Math.pow(-1,sign)*mantissa*mul;
};



daikon.Utils.concatArrayBuffers = function (buffer1, buffer2) {
    var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
    tmp.set(new Uint8Array(buffer1), 0);
    tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
    return tmp.buffer;
};



daikon.Utils.concatArrayBuffers2 = function (buffers) {
    var length = 0, offset = 0, ctr;

    for (ctr = 0; ctr < buffers.length; ctr += 1) {
        length += buffers[ctr].byteLength;
    }

    var tmp = new Uint8Array(length);

    for (ctr = 0; ctr < buffers.length; ctr += 1) {
        tmp.set(new Uint8Array(buffers[ctr]), offset);
        offset += buffers[ctr].byteLength;

    }

    return tmp.buffer;
};



daikon.Utils.fillBuffer = function (array, buffer, offset, numBytes) {
    var ctr;

    if (numBytes === 1) {
        for (ctr = 0; ctr < array.length; ctr+=1) {
            buffer.setUint8(offset + ctr, array[ctr]);
        }
    } else if (numBytes === 2) {
        for (ctr = 0; ctr < array.length; ctr+=1) {
            buffer.setUint16(offset + (ctr * 2), array[ctr], true);
        }
    }
};



daikon.Utils.fillBufferRGB = function (array, buffer, offset) {
    var r, g, b, ctr, numElements = (parseInt(array.length / 3));

    for (ctr = 0; ctr < numElements; ctr+=1) {
        r = array[ctr * 3];
        g = array[ctr * 3 + 1];
        b = array[ctr * 3 + 2];

        buffer.setUint8(offset + ctr, parseInt((r + b + g) / 3), true);
    }
};



daikon.Utils.bind = function (scope, fn, args, appendArgs) {
    if (arguments.length === 2) {
        return function () {
            return fn.apply(scope, arguments);
        };
    }

    var method = fn,
        slice = Array.prototype.slice;

    return function () {
        var callArgs = args || arguments;

        if (appendArgs === true) {
            callArgs = slice.call(arguments, 0);
            callArgs = callArgs.concat(args);
        } else if (typeof appendArgs === 'number') {
            callArgs = slice.call(arguments, 0); // copy arguments first
            Ext.Array.insert(callArgs, appendArgs, args);
        }

        return method.apply(scope || window, callArgs);
    };
};



daikon.Utils.toArrayBuffer = function (buffer) {
    var ab, view, i;

    ab = new ArrayBuffer(buffer.length);
    view = new Uint8Array(ab);
    for (i = 0; i < buffer.length; i += 1) {
        view[i] = buffer[i];
    }
    return ab;
};


/*** Exports ***/

var moduleType = typeof module;
if ((moduleType !== 'undefined') && module.exports) {
    module.exports = daikon.Utils;
}

},{}]},{},[16])(16)
});