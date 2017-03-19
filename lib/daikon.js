(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.daikon = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
    /*
     Copyright 2011 notmasteryet

     Licensed under the Apache License, Version 2.0 (the "License");
     you may not use this file except in compliance with the License.
     You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

     Unless required by applicable law or agreed to in writing, software
     distributed under the License is distributed on an "AS IS" BASIS,
     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     See the License for the specific language governing permissions and
     limitations under the License.
     */

// - The JPEG specification can be found in the ITU CCITT Recommendation T.81
//   (www.w3.org/Graphics/JPEG/itu-t81.pdf)
// - The JFIF specification can be found in the JPEG File Interchange Format
//   (www.w3.org/Graphics/JPEG/jfif3.pdf)
// - The Adobe Application-Specific JPEG markers in the Supporting the DCT Filters
//   in PostScript Level 2, Technical Note #5116
//   (partners.adobe.com/public/developer/en/ps/sdk/5116.DCT_Filter.pdf)

    var ColorSpace = {Unkown: 0, Grayscale: 1, AdobeRGB: 2, RGB: 3, CYMK: 4};
    var JpegImage = (function jpegImage() {
        "use strict";
        var dctZigZag = new Int32Array([
            0,
            1, 8,
            16, 9, 2,
            3, 10, 17, 24,
            32, 25, 18, 11, 4,
            5, 12, 19, 26, 33, 40,
            48, 41, 34, 27, 20, 13, 6,
            7, 14, 21, 28, 35, 42, 49, 56,
            57, 50, 43, 36, 29, 22, 15,
            23, 30, 37, 44, 51, 58,
            59, 52, 45, 38, 31,
            39, 46, 53, 60,
            61, 54, 47,
            55, 62,
            63
        ]);

        var dctCos1 = 4017;   // cos(pi/16)
        var dctSin1 = 799;   // sin(pi/16)
        var dctCos3 = 3406;   // cos(3*pi/16)
        var dctSin3 = 2276;   // sin(3*pi/16)
        var dctCos6 = 1567;   // cos(6*pi/16)
        var dctSin6 = 3784;   // sin(6*pi/16)
        var dctSqrt2 = 5793;   // sqrt(2)
        var dctSqrt1d2 = 2896;  // sqrt(2) / 2

        function constructor() {
        }

        function buildHuffmanTable(codeLengths, values) {
            var k = 0, code = [], i, j, length = 16;
            while (length > 0 && !codeLengths[length - 1])
                length--;
            code.push({children: [], index: 0});
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
                        code.push(q = {children: [], index: 0});
                        p.children[p.index] = q.children;
                        p = q;
                    }
                    k++;
                }
                if (i + 1 < length) {
                    // p here points to last code
                    code.push(q = {children: [], index: 0});
                    p.children[p.index] = q.children;
                    p = q;
                }
            }
            return code[0].children;
        }

        function getBlockBufferOffset(component, row, col) {
            return 64 * ((component.blocksPerLine + 1) * row + col);
        }

        function decodeScan(data, offset,
                            frame, components, resetInterval,
                            spectralStart, spectralEnd,
                            successivePrev, successive) {
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
                    return (bitsData >> bitsCount) & 1;
                }
                bitsData = data[offset++];
                if (bitsData == 0xFF) {
                    var nextByte = data[offset++];
                    if (nextByte) {
                        throw "unexpected marker: " + ((bitsData << 8) | nextByte).toString(16);
                    }
                    // unstuff 0
                }
                bitsCount = 7;
                return bitsData >>> 7;
            }

            function decodeHuffman(tree) {
                var node = tree;
                var bit;
                while ((bit = readBit()) !== null) {
                    node = node[bit];
                    if (typeof node === 'number')
                        return node;
                    if (typeof node !== 'object')
                        throw "invalid huffman sequence";
                }
                return null;
            }

            function receive(length) {
                var n = 0;
                while (length > 0) {
                    var bit = readBit();
                    if (bit === null)
                        return;
                    n = (n << 1) | bit;
                    length--;
                }
                return n;
            }

            function receiveAndExtend(length) {
                var n = receive(length);
                if (n >= 1 << (length - 1))
                    return n;
                return n + (-1 << length) + 1;
            }

            function decodeBaseline(component, offset) {
                var t = decodeHuffman(component.huffmanTableDC);
                var diff = t === 0 ? 0 : receiveAndExtend(t);
                component.blockData[offset] = (component.pred += diff);
                var k = 1;
                while (k < 64) {
                    var rs = decodeHuffman(component.huffmanTableAC);
                    var s = rs & 15, r = rs >> 4;
                    if (s === 0) {
                        if (r < 15)
                            break;
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
                var diff = t === 0 ? 0 : (receiveAndExtend(t) << successive);
                component.blockData[offset] = (component.pred += diff);
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
                var k = spectralStart, e = spectralEnd, r = 0;
                while (k <= e) {
                    var z = dctZigZag[k];
                    switch (successiveACState) {
                        case 0: // initial state
                            var rs = decodeHuffman(component.huffmanTableAC);
                            var s = rs & 15;
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
                                if (s !== 1)
                                    throw "invalid ACn encoding";
                                successiveACNextValue = receiveAndExtend(s);
                                successiveACState = r ? 2 : 3;
                            }
                            continue;
                        case 1: // skipping r zero items
                        case 2:
                            if (component.blockData[offset + z]) {
                                component.blockData[offset + z] += (readBit() << successive);
                            } else {
                                r--;
                                if (r === 0)
                                    successiveACState = successiveACState == 2 ? 3 : 0;
                            }
                            break;
                        case 3: // set value for a zero item
                            if (component.blockData[offset + z]) {
                                component.blockData[offset + z] += (readBit() << successive);
                            } else {
                                component.blockData[offset + z] = successiveACNextValue << successive;
                                successiveACState = 0;
                            }
                            break;
                        case 4: // eob
                            if (component.blockData[offset + z]) {
                                component.blockData[offset + z] += (readBit() << successive);
                            }
                            break;
                    }
                    k++;
                }
                if (successiveACState === 4) {
                    eobrun--;
                    if (eobrun === 0)
                        successiveACState = 0;
                }
            }

            function decodeMcu(component, decode, mcu, row, col) {
                var mcuRow = (mcu / mcusPerLine) | 0;
                var mcuCol = mcu % mcusPerLine;
                var blockRow = mcuRow * component.v + row;
                var blockCol = mcuCol * component.h + col;
                var offset = getBlockBufferOffset(component, blockRow, blockCol);
                decode(component, offset);
            }

            function decodeBlock(component, decode, mcu) {
                var blockRow = (mcu / component.blocksPerLine) | 0;
                var blockCol = mcu % component.blocksPerLine;
                var offset = getBlockBufferOffset(component, blockRow, blockCol);
                decode(component, offset);
            }

            var componentsLength = components.length;
            var component, i, j, k, n;
            var decodeFn;
            if (progressive) {
                if (spectralStart === 0)
                    decodeFn = successivePrev === 0 ? decodeDCFirst : decodeDCSuccessive;
                else
                    decodeFn = successivePrev === 0 ? decodeACFirst : decodeACSuccessive;
            } else {
                decodeFn = decodeBaseline;
            }

            var mcu = 0, marker;
            var mcuExpected;
            if (componentsLength == 1) {
                mcuExpected = components[0].blocksPerLine * components[0].blocksPerColumn;
            } else {
                mcuExpected = mcusPerLine * frame.mcusPerColumn;
            }
            if (!resetInterval) {
                resetInterval = mcuExpected;
            }

            var h, v;
            while (mcu < mcuExpected) {
                // reset interval stuff
                for (i = 0; i < componentsLength; i++) {
                    components[i].pred = 0;
                }
                eobrun = 0;

                if (componentsLength == 1) {
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

                // find marker
                bitsCount = 0;
                marker = (data[offset] << 8) | data[offset + 1];
                if (marker <= 0xFF00) {
                    throw "marker was not found";
                }

                if (marker >= 0xFFD0 && marker <= 0xFFD7) { // RSTx
                    offset += 2;
                } else {
                    break;
                }
            }

            return offset - startOffset;
        }

        // A port of poppler's IDCT method which in turn is taken from:
        //   Christoph Loeffler, Adriaan Ligtenberg, George S. Moschytz,
        //   "Practical Fast 1-D DCT Algorithms with 11 Multiplications",
        //   IEEE Intl. Conf. on Acoustics, Speech & Signal Processing, 1989,
        //   988-991.
        function quantizeAndInverse(component, blockBufferOffset, p) {
            var qt = component.quantizationTable;
            var v0, v1, v2, v3, v4, v5, v6, v7, t;
            var i;

            // dequant
            for (i = 0; i < 64; i++) {
                p[i] = component.blockData[blockBufferOffset + i] * qt[i];
            }

            // inverse DCT on rows
            for (i = 0; i < 8; ++i) {
                var row = 8 * i;

                // check for all-zero AC coefficients
                if (p[1 + row] === 0 && p[2 + row] === 0 && p[3 + row] === 0 &&
                    p[4 + row] === 0 && p[5 + row] === 0 && p[6 + row] === 0 &&
                    p[7 + row] === 0) {
                    t = (dctSqrt2 * p[0 + row] + 512) >> 10;
                    p[0 + row] = t;
                    p[1 + row] = t;
                    p[2 + row] = t;
                    p[3 + row] = t;
                    p[4 + row] = t;
                    p[5 + row] = t;
                    p[6 + row] = t;
                    p[7 + row] = t;
                    continue;
                }

                // stage 4
                v0 = (dctSqrt2 * p[0 + row] + 128) >> 8;
                v1 = (dctSqrt2 * p[4 + row] + 128) >> 8;
                v2 = p[2 + row];
                v3 = p[6 + row];
                v4 = (dctSqrt1d2 * (p[1 + row] - p[7 + row]) + 128) >> 8;
                v7 = (dctSqrt1d2 * (p[1 + row] + p[7 + row]) + 128) >> 8;
                v5 = p[3 + row] << 4;
                v6 = p[5 + row] << 4;

                // stage 3
                t = (v0 - v1 + 1) >> 1;
                v0 = (v0 + v1 + 1) >> 1;
                v1 = t;
                t = (v2 * dctSin6 + v3 * dctCos6 + 128) >> 8;
                v2 = (v2 * dctCos6 - v3 * dctSin6 + 128) >> 8;
                v3 = t;
                t = (v4 - v6 + 1) >> 1;
                v4 = (v4 + v6 + 1) >> 1;
                v6 = t;
                t = (v7 + v5 + 1) >> 1;
                v5 = (v7 - v5 + 1) >> 1;
                v7 = t;

                // stage 2
                t = (v0 - v3 + 1) >> 1;
                v0 = (v0 + v3 + 1) >> 1;
                v3 = t;
                t = (v1 - v2 + 1) >> 1;
                v1 = (v1 + v2 + 1) >> 1;
                v2 = t;
                t = (v4 * dctSin3 + v7 * dctCos3 + 2048) >> 12;
                v4 = (v4 * dctCos3 - v7 * dctSin3 + 2048) >> 12;
                v7 = t;
                t = (v5 * dctSin1 + v6 * dctCos1 + 2048) >> 12;
                v5 = (v5 * dctCos1 - v6 * dctSin1 + 2048) >> 12;
                v6 = t;

                // stage 1
                p[0 + row] = v0 + v7;
                p[7 + row] = v0 - v7;
                p[1 + row] = v1 + v6;
                p[6 + row] = v1 - v6;
                p[2 + row] = v2 + v5;
                p[5 + row] = v2 - v5;
                p[3 + row] = v3 + v4;
                p[4 + row] = v3 - v4;
            }

            // inverse DCT on columns
            for (i = 0; i < 8; ++i) {
                var col = i;

                // check for all-zero AC coefficients
                if (p[1 * 8 + col] === 0 && p[2 * 8 + col] === 0 && p[3 * 8 + col] === 0 &&
                    p[4 * 8 + col] === 0 && p[5 * 8 + col] === 0 && p[6 * 8 + col] === 0 &&
                    p[7 * 8 + col] === 0) {
                    t = (dctSqrt2 * p[i + 0] + 8192) >> 14;
                    p[0 * 8 + col] = t;
                    p[1 * 8 + col] = t;
                    p[2 * 8 + col] = t;
                    p[3 * 8 + col] = t;
                    p[4 * 8 + col] = t;
                    p[5 * 8 + col] = t;
                    p[6 * 8 + col] = t;
                    p[7 * 8 + col] = t;
                    continue;
                }

                // stage 4
                v0 = (dctSqrt2 * p[0 * 8 + col] + 2048) >> 12;
                v1 = (dctSqrt2 * p[4 * 8 + col] + 2048) >> 12;
                v2 = p[2 * 8 + col];
                v3 = p[6 * 8 + col];
                v4 = (dctSqrt1d2 * (p[1 * 8 + col] - p[7 * 8 + col]) + 2048) >> 12;
                v7 = (dctSqrt1d2 * (p[1 * 8 + col] + p[7 * 8 + col]) + 2048) >> 12;
                v5 = p[3 * 8 + col];
                v6 = p[5 * 8 + col];

                // stage 3
                t = (v0 - v1 + 1) >> 1;
                v0 = (v0 + v1 + 1) >> 1;
                v1 = t;
                t = (v2 * dctSin6 + v3 * dctCos6 + 2048) >> 12;
                v2 = (v2 * dctCos6 - v3 * dctSin6 + 2048) >> 12;
                v3 = t;
                t = (v4 - v6 + 1) >> 1;
                v4 = (v4 + v6 + 1) >> 1;
                v6 = t;
                t = (v7 + v5 + 1) >> 1;
                v5 = (v7 - v5 + 1) >> 1;
                v7 = t;

                // stage 2
                t = (v0 - v3 + 1) >> 1;
                v0 = (v0 + v3 + 1) >> 1;
                v3 = t;
                t = (v1 - v2 + 1) >> 1;
                v1 = (v1 + v2 + 1) >> 1;
                v2 = t;
                t = (v4 * dctSin3 + v7 * dctCos3 + 2048) >> 12;
                v4 = (v4 * dctCos3 - v7 * dctSin3 + 2048) >> 12;
                v7 = t;
                t = (v5 * dctSin1 + v6 * dctCos1 + 2048) >> 12;
                v5 = (v5 * dctCos1 - v6 * dctSin1 + 2048) >> 12;
                v6 = t;

                // stage 1
                p[0 * 8 + col] = v0 + v7;
                p[7 * 8 + col] = v0 - v7;
                p[1 * 8 + col] = v1 + v6;
                p[6 * 8 + col] = v1 - v6;
                p[2 * 8 + col] = v2 + v5;
                p[5 * 8 + col] = v2 - v5;
                p[3 * 8 + col] = v3 + v4;
                p[4 * 8 + col] = v3 - v4;
            }

            // convert to 8-bit integers
            for (i = 0; i < 64; ++i) {
                var index = blockBufferOffset + i;
                var q = p[i];
                q = (q <= -2056 / component.bitConversion) ? 0 :
                    (q >= 2024 / component.bitConversion) ? 255 / component.bitConversion :
                        (q + 2056 / component.bitConversion) >> 4;
                component.blockData[index] = q;
            }
        }

        function buildComponentData(frame, component) {
            var lines = [];
            var blocksPerLine = component.blocksPerLine;
            var blocksPerColumn = component.blocksPerColumn;
            var samplesPerLine = blocksPerLine << 3;
            var computationBuffer = new Int32Array(64);

            var i, j, ll = 0;
            for (var blockRow = 0; blockRow < blocksPerColumn; blockRow++) {
                for (var blockCol = 0; blockCol < blocksPerLine; blockCol++) {
                    var offset = getBlockBufferOffset(component, blockRow, blockCol);
                    quantizeAndInverse(component, offset, computationBuffer);
                }
            }
            return component.blockData;
        }

        function clampToUint8(a) {
            return a <= 0 ? 0 : a >= 255 ? 255 : a | 0;
        }

        constructor.prototype = {
            load: function load(path) {
                var handleData = (function (data) {
                    this.parse(data);
                    if (this.onload)
                        this.onload();
                }).bind(this);

                if (path.indexOf("data:") > -1) {
                    var offset = path.indexOf("base64,") + 7;
                    var data = atob(path.substring(offset));
                    var arr = new Uint8Array(data.length);
                    for (var i = data.length - 1; i >= 0; i--) {
                        arr[i] = data.charCodeAt(i);
                    }
                    handleData(data);
                } else {
                    var xhr = new XMLHttpRequest();
                    xhr.open("GET", path, true);
                    xhr.responseType = "arraybuffer";
                    xhr.onload = (function () {
                        // TODO catch parse error
                        var data = new Uint8Array(xhr.response);
                        handleData(data);
                    }).bind(this);
                    xhr.send(null);
                }
            },
            parse: function parse(data) {

                function readUint16() {
                    var value = (data[offset] << 8) | data[offset + 1];
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
                if (fileMarker != 0xFFD8) { // SOI (Start of Image)
                    throw "SOI not found";
                }

                fileMarker = readUint16();
                while (fileMarker != 0xFFD9) { // EOI (End of image)
                    var i, j, l;
                    switch (fileMarker) {
                        case 0xFFE0: // APP0 (Application Specific)
                        case 0xFFE1: // APP1
                        case 0xFFE2: // APP2
                        case 0xFFE3: // APP3
                        case 0xFFE4: // APP4
                        case 0xFFE5: // APP5
                        case 0xFFE6: // APP6
                        case 0xFFE7: // APP7
                        case 0xFFE8: // APP8
                        case 0xFFE9: // APP9
                        case 0xFFEA: // APP10
                        case 0xFFEB: // APP11
                        case 0xFFEC: // APP12
                        case 0xFFED: // APP13
                        case 0xFFEE: // APP14
                        case 0xFFEF: // APP15
                        case 0xFFFE: // COM (Comment)
                            var appData = readDataBlock();

                            if (fileMarker === 0xFFE0) {
                                if (appData[0] === 0x4A && appData[1] === 0x46 && appData[2] === 0x49 &&
                                    appData[3] === 0x46 && appData[4] === 0) { // 'JFIF\x00'
                                    jfif = {
                                        version: {major: appData[5], minor: appData[6]},
                                        densityUnits: appData[7],
                                        xDensity: (appData[8] << 8) | appData[9],
                                        yDensity: (appData[10] << 8) | appData[11],
                                        thumbWidth: appData[12],
                                        thumbHeight: appData[13],
                                        thumbData: appData.subarray(14, 14 + 3 * appData[12] * appData[13])
                                    };
                                }
                            }
                            // TODO APP1 - Exif
                            if (fileMarker === 0xFFEE) {
                                if (appData[0] === 0x41 && appData[1] === 0x64 && appData[2] === 0x6F &&
                                    appData[3] === 0x62 && appData[4] === 0x65 && appData[5] === 0) { // 'Adobe\x00'
                                    adobe = {
                                        version: appData[6],
                                        flags0: (appData[7] << 8) | appData[8],
                                        flags1: (appData[9] << 8) | appData[10],
                                        transformCode: appData[11]
                                    };
                                }
                            }
                            break;

                        case 0xFFDB: // DQT (Define Quantization Tables)
                            var quantizationTablesLength = readUint16();
                            var quantizationTablesEnd = quantizationTablesLength + offset - 2;
                            while (offset < quantizationTablesEnd) {
                                var quantizationTableSpec = data[offset++];
                                var tableData = new Int32Array(64);
                                if ((quantizationTableSpec >> 4) === 0) { // 8 bit values
                                    for (j = 0; j < 64; j++) {
                                        var z = dctZigZag[j];
                                        tableData[z] = data[offset++];
                                    }
                                } else if ((quantizationTableSpec >> 4) === 1) { //16 bit
                                    for (j = 0; j < 64; j++) {
                                        var zz = dctZigZag[j];
                                        tableData[zz] = readUint16();
                                    }
                                } else
                                    throw "DQT: invalid table spec";
                                quantizationTables[quantizationTableSpec & 15] = tableData;
                            }
                            break;

                        case 0xFFC0: // SOF0 (Start of Frame, Baseline DCT)
                        case 0xFFC1: // SOF1 (Start of Frame, Extended DCT)
                        case 0xFFC2: // SOF2 (Start of Frame, Progressive DCT)
                            if (frame) {
                                throw "Only single frame JPEGs supported";
                            }
                            readUint16(); // skip data length
                            frame = {};
                            frame.extended = (fileMarker === 0xFFC1);
                            frame.progressive = (fileMarker === 0xFFC2);
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
                                if (maxH < h)
                                    maxH = h;
                                if (maxV < v)
                                    maxV = v;
                                var qId = data[offset + 2];
                                l = frame.components.push({
                                    h: h,
                                    v: v,
                                    quantizationTable: quantizationTables[qId],
                                    quantizationTableId: qId,
                                    bitConversion: 255 / ((1 << frame.precision) - 1)
                                });
                                frame.componentIds[componentId] = l - 1;
                                offset += 3;
                            }
                            frame.maxH = maxH;
                            frame.maxV = maxV;
                            prepareComponents(frame);
                            break;

                        case 0xFFC4: // DHT (Define Huffman Tables)
                            var huffmanLength = readUint16();
                            for (i = 2; i < huffmanLength; ) {
                                var huffmanTableSpec = data[offset++];
                                var codeLengths = new Uint8Array(16);
                                var codeLengthSum = 0;
                                for (j = 0; j < 16; j++, offset++)
                                    codeLengthSum += (codeLengths[j] = data[offset]);
                                var huffmanValues = new Uint8Array(codeLengthSum);
                                for (j = 0; j < codeLengthSum; j++, offset++)
                                    huffmanValues[j] = data[offset];
                                i += 17 + codeLengthSum;

                                ((huffmanTableSpec >> 4) === 0 ?
                                    huffmanTablesDC : huffmanTablesAC)[huffmanTableSpec & 15] =
                                    buildHuffmanTable(codeLengths, huffmanValues);
                            }
                            break;

                        case 0xFFDD: // DRI (Define Restart Interval)
                            readUint16(); // skip data length
                            resetInterval = readUint16();
                            break;

                        case 0xFFDA: // SOS (Start of Scan)
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
                            var processed = decodeScan(data, offset,
                                frame, components, resetInterval,
                                spectralStart, spectralEnd,
                                successiveApproximation >> 4, successiveApproximation & 15);
                            offset += processed;
                            break;
                        default:
                            if (data[offset - 3] == 0xFF &&
                                data[offset - 2] >= 0xC0 && data[offset - 2] <= 0xFE) {
                                // could be incorrect encoding -- last 0xFF byte of the previous
                                // block was eaten by the encoder
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
                switch (frame.components.length)
                {
                    case 1:
                        this.colorspace = ColorSpace.Grayscale;
                        break;
                    case 3:
                        if (this.adobe)
                            this.colorspace = ColorSpace.AdobeRGB;
                        else
                            this.colorspace = ColorSpace.RGB;
                        break;
                    case 4:
                        this.colorspace = ColorSpace.CYMK;
                        break;
                    default:
                        this.colorspace = ColorSpace.Unknown;
                }
                for (var i = 0; i < frame.components.length; i++) {
                    var component = frame.components[i];
                    if (!component.quantizationTable && component.quantizationTableId !== null)
                        component.quantizationTable = quantizationTables[component.quantizationTableId];
                    this.components.push({
                        output: buildComponentData(frame, component),
                        scaleX: component.h / frame.maxH,
                        scaleY: component.v / frame.maxV,
                        blocksPerLine: component.blocksPerLine,
                        blocksPerColumn: component.blocksPerColumn,
                        bitConversion: component.bitConversion
                    });
                }
            },
            getData16: function getData16(width, height) {
                if (this.components.length !== 1)
                    throw 'Unsupported color mode';
                var scaleX = this.width / width, scaleY = this.height / height;

                var component, componentScaleX, componentScaleY;
                var x, y, i;
                var offset = 0;
                var numComponents = this.components.length;
                var dataLength = width * height * numComponents;
                var data = new Uint16Array(dataLength);
                var componentLine;

                // lineData is reused for all components. Assume first component is
                // the biggest
                var lineData = new Uint16Array((this.components[0].blocksPerLine << 3) *
                    this.components[0].blocksPerColumn * 8);

                // First construct image data ...
                for (i = 0; i < numComponents; i++) {
                    component = this.components[i];
                    var blocksPerLine = component.blocksPerLine;
                    var blocksPerColumn = component.blocksPerColumn;
                    var samplesPerLine = blocksPerLine << 3;

                    var j, k, ll = 0;
                    var lineOffset = 0;
                    for (var blockRow = 0; blockRow < blocksPerColumn; blockRow++) {
                        var scanLine = blockRow << 3;
                        for (var blockCol = 0; blockCol < blocksPerLine; blockCol++) {
                            var bufferOffset = getBlockBufferOffset(component, blockRow, blockCol);
                            var offset = 0, sample = blockCol << 3;
                            for (j = 0; j < 8; j++) {
                                var lineOffset = (scanLine + j) * samplesPerLine;
                                for (k = 0; k < 8; k++) {
                                    lineData[lineOffset + sample + k] =
                                        component.output[bufferOffset + offset++];
                                }
                            }
                        }
                    }

                    componentScaleX = component.scaleX * scaleX;
                    componentScaleY = component.scaleY * scaleY;
                    offset = i;

                    var cx, cy;
                    var index;
                    for (y = 0; y < height; y++) {
                        for (x = 0; x < width; x++) {
                            cy = 0 | (y * componentScaleY);
                            cx = 0 | (x * componentScaleX);
                            index = cy * samplesPerLine + cx;
                            data[offset] = lineData[index];
                            offset += numComponents;
                        }
                    }
                }
                return data;
            },
            getData: function getData(width, height) {
                var scaleX = this.width / width, scaleY = this.height / height;

                var component, componentScaleX, componentScaleY;
                var x, y, i;
                var offset = 0;
                var Y, Cb, Cr, K, C, M, Ye, R, G, B;
                var colorTransform;
                var numComponents = this.components.length;
                var dataLength = width * height * numComponents;
                var data = new Uint8Array(dataLength);
                var componentLine;

                // lineData is reused for all components. Assume first component is
                // the biggest
                var lineData = new Uint8Array((this.components[0].blocksPerLine << 3) *
                    this.components[0].blocksPerColumn * 8);

                // First construct image data ...
                for (i = 0; i < numComponents; i++) {
                    component = this.components[i];
                    var blocksPerLine = component.blocksPerLine;
                    var blocksPerColumn = component.blocksPerColumn;
                    var samplesPerLine = blocksPerLine << 3;

                    var j, k, ll = 0;
                    var lineOffset = 0;
                    for (var blockRow = 0; blockRow < blocksPerColumn; blockRow++) {
                        var scanLine = blockRow << 3;
                        for (var blockCol = 0; blockCol < blocksPerLine; blockCol++) {
                            var bufferOffset = getBlockBufferOffset(component, blockRow, blockCol);
                            var offset = 0, sample = blockCol << 3;
                            for (j = 0; j < 8; j++) {
                                var lineOffset = (scanLine + j) * samplesPerLine;
                                for (k = 0; k < 8; k++) {
                                    lineData[lineOffset + sample + k] =
                                        component.output[bufferOffset + offset++] * component.bitConversion;
                                }
                            }
                        }
                    }

                    componentScaleX = component.scaleX * scaleX;
                    componentScaleY = component.scaleY * scaleY;
                    offset = i;

                    var cx, cy;
                    var index;
                    for (y = 0; y < height; y++) {
                        for (x = 0; x < width; x++) {
                            cy = 0 | (y * componentScaleY);
                            cx = 0 | (x * componentScaleX);
                            index = cy * samplesPerLine + cx;
                            data[offset] = lineData[index];
                            offset += numComponents;
                        }
                    }
                }

                // ... then transform colors, if necessary
                switch (numComponents) {
                    case 1:
                    case 2:
                        break;
                    // no color conversion for one or two compoenents

                    case 3:
                        // The default transform for three components is true
                        colorTransform = true;
                        // The adobe transform marker overrides any previous setting
                        if (this.adobe && this.adobe.transformCode)
                            colorTransform = true;
                        else if (typeof this.colorTransform !== 'undefined')
                            colorTransform = !!this.colorTransform;

                        if (colorTransform) {
                            for (i = 0; i < dataLength; i += numComponents) {
                                Y = data[i    ];
                                Cb = data[i + 1];
                                Cr = data[i + 2];

                                R = clampToUint8(Y - 179.456 + 1.402 * Cr);
                                G = clampToUint8(Y + 135.459 - 0.344 * Cb - 0.714 * Cr);
                                B = clampToUint8(Y - 226.816 + 1.772 * Cb);

                                data[i    ] = R;
                                data[i + 1] = G;
                                data[i + 2] = B;
                            }
                        }
                        break;
                    case 4:
                        if (!this.adobe)
                            throw 'Unsupported color mode (4 components)';
                        // The default transform for four components is false
                        colorTransform = false;
                        // The adobe transform marker overrides any previous setting
                        if (this.adobe && this.adobe.transformCode)
                            colorTransform = true;
                        else if (typeof this.colorTransform !== 'undefined')
                            colorTransform = !!this.colorTransform;

                        if (colorTransform) {
                            for (i = 0; i < dataLength; i += numComponents) {
                                Y = data[i];
                                Cb = data[i + 1];
                                Cr = data[i + 2];

                                C = clampToUint8(434.456 - Y - 1.402 * Cr);
                                M = clampToUint8(119.541 - Y + 0.344 * Cb + 0.714 * Cr);
                                Y = clampToUint8(481.816 - Y - 1.772 * Cb);

                                data[i    ] = C;
                                data[i + 1] = M;
                                data[i + 2] = Y;
                                // K is unchanged
                            }
                        }
                        break;
                    default:
                        throw 'Unsupported color mode';
                }
                return data;
            },
            copyToImageData: function copyToImageData(imageData) {
                var width = imageData.width, height = imageData.height;
                var imageDataBytes = width * height * 4;
                var imageDataArray = imageData.data;
                var data = this.getData16(width, height);
                var i = 0, j = 0, k0, k1;
                var Y, K, C, M, R, G, B;
                switch (this.components.length) {
                    case 1:
                        while (j < imageDataBytes) {
                            Y = data[i++];

                            imageDataArray[j++] = Y;
                            imageDataArray[j++] = Y;
                            imageDataArray[j++] = Y;
                            imageDataArray[j++] = 255;
                        }
                        break;
                    case 3:
                        while (j < imageDataBytes) {
                            R = data[i++];
                            G = data[i++];
                            B = data[i++];

                            imageDataArray[j++] = R;
                            imageDataArray[j++] = G;
                            imageDataArray[j++] = B;
                            imageDataArray[j++] = 255;
                        }
                        break;
                    case 4:
                        while (j < imageDataBytes) {
                            C = data[i++];
                            M = data[i++];
                            Y = data[i++];
                            K = data[i++];

                            k0 = 255 - K;
                            k1 = k0 / 255;


                            R = clampToUint8(k0 - C * k1);
                            G = clampToUint8(k0 - M * k1);
                            B = clampToUint8(k0 - Y * k1);

                            imageDataArray[j++] = R;
                            imageDataArray[j++] = G;
                            imageDataArray[j++] = B;
                            imageDataArray[j++] = 255;
                        }
                        break;
                    default:
                        throw 'Unsupported color mode';
                }
            }
        };

        return constructor;
    })();
    var moduleType = typeof module;
    if ((moduleType !== 'undefined') && module.exports) {
        module.exports = {
            JpegImage: JpegImage
        };
    }
},{}],2:[function(require,module,exports){
    /*! image-JPEG2000 - v0.3.1 - 2015-08-26 | https://github.com/OHIF/image-JPEG2000 */
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
                    if(offset + position  >= data.length){
                        throw new Error("Unexpected EOF");
                    }
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
                try{
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
                } catch (e) {
                    return;
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
                                for (pos = c, j = 0, jj = items.length; j < jj; j++) {
                                    out[pos] = items[j];
                                    pos += componentsCount;
                                }
                            }else{
                                shift = components[c].precision - 8;
                                offset = (128 << shift) + 0.5;
                                var precisionMax = Math.pow(2,components[c].precision)-1;
                                for (pos = c, j = 0, jj = items.length; j < jj; j++) {
                                    val = items[j];
                                    out[pos] = Math.max(Math.min((val + offset),precisionMax),0);
                                    pos += componentsCount;
                                }
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
     *
     * 08-25-2015: Helmut Dersch agreed to a license change from LGPL to MIT.
     */

    /*
     * Copyright (C) Helmut Dersch
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:

     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.

     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
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
     *
     * 08-25-2015: Helmut Dersch agreed to a license change from LGPL to MIT.
     */

    /*
     * Copyright (C) Helmut Dersch
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:

     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.

     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */

    /*jslint browser: true, node: true */
    /*global require, module */

    "use strict";

    /*** Imports ***/
    var jpeg = jpeg || {};
    jpeg.lossless = jpeg.lossless || {};


    /*** Constructor ***/
    jpeg.lossless.DataStream = jpeg.lossless.DataStream || function (data, offset, length) {
            // Note: DataView is much slower than Int8Array
            // this.buffer = new DataView(data, offset, length);
            this.buffer = new Uint8Array(data, offset, length);
            this.index = 0;
        };



    jpeg.lossless.DataStream.prototype.get16 = function () {
        // var value = this.buffer.getUint16(this.index, false);
        var value = (this.buffer[this.index] << 8) + this.buffer[this.index + 1]; // DataView is big-endian by default
        this.index += 2;
        return value;
    };



    jpeg.lossless.DataStream.prototype.get8 = function () {
        // var value = this.buffer.getUint8(this.index);
        var value = this.buffer[this.index];
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
     *
     * 08-25-2015: Helmut Dersch agreed to a license change from LGPL to MIT.
     */

    /*
     * Copyright (C) Helmut Dersch
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:

     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.

     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
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

    /**
     * The Decoder constructor.
     * @property {number} xDim - size of x dimension
     * @property {number} yDim - size of y dimension
     * @property {number} numComp - number of components
     * @property {number} numBytes - number of bytes per component
     * @type {Function}
     */
    jpeg.lossless.Decoder = jpeg.lossless.Decoder || function (buffer, numBytes) {
            this.buffer = buffer;
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
            this.numBytes = 0;
            this.outputData = null;
            this.restarting = false;
            this.mask = 0;

            if (typeof numBytes !== "undefined") {
                this.numBytes = numBytes;
            }
        };


    /*** Static Pseudo-constants ***/

    jpeg.lossless.Decoder.IDCT_P = [0, 5, 40, 16, 45, 2, 7, 42, 21, 56, 8, 61, 18, 47, 1, 4, 41, 23, 58, 13, 32, 24, 37, 10, 63, 17, 44, 3, 6, 43, 20,
        57, 15, 34, 29, 48, 53, 26, 39, 9, 60, 19, 46, 22, 59, 12, 33, 31, 50, 55, 25, 36, 11, 62, 14, 35, 28, 49, 52, 27, 38, 30, 51, 54];
    jpeg.lossless.Decoder.TABLE = [0, 1, 5, 6, 14, 15, 27, 28, 2, 4, 7, 13, 16, 26, 29, 42, 3, 8, 12, 17, 25, 30, 41, 43, 9, 11, 18, 24, 31, 40, 44, 53,
        10, 19, 23, 32, 39, 45, 52, 54, 20, 22, 33, 38, 46, 51, 55, 60, 21, 34, 37, 47, 50, 56, 59, 61, 35, 36, 48, 49, 57, 58, 62, 63];
    jpeg.lossless.Decoder.MAX_HUFFMAN_SUBTREE = 50;
    jpeg.lossless.Decoder.MSB = 0x80000000;
    jpeg.lossless.Decoder.RESTART_MARKER_BEGIN = 0xFFD0;
    jpeg.lossless.Decoder.RESTART_MARKER_END = 0xFFD7;

    /*** Prototype Methods ***/

    /**
     * Returns decompressed data.
     * @param {ArrayBuffer} buffer
     * @param {number} [offset]
     * @param {number} [length]
     * @returns {ArrayBufer}
     */
    jpeg.lossless.Decoder.prototype.decompress = function (buffer, offset, length) {
        return this.decode(buffer, offset, length).buffer;
    };



    jpeg.lossless.Decoder.prototype.decode = function (buffer, offset, length, numBytes) {
        /*jslint bitwise: true */

        var current, scanNum = 0, pred = [], i, compN, temp = [], index = [], mcuNum;

        if (typeof buffer !== "undefined") {
            this.buffer = buffer;
        }

        if (typeof numBytes !== "undefined") {
            this.numBytes = numBytes;
        }

        this.stream = new jpeg.lossless.DataStream(this.buffer, offset, length);
        this.buffer = null;

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

            if (!this.numBytes) {
                this.numBytes = parseInt(Math.ceil(this.precision / 8));
            }

            if (this.numBytes == 1) {
                this.mask = 0xFF;
            } else {
                this.mask = 0xFFFF;
            }

            this.scan.read(this.stream);
            this.numComp = this.scan.numComp;
            this.selection = this.scan.selection;

            if (this.numBytes === 1) {
                if (this.numComp === 3) {
                    this.getter = this.getValueRGB;
                    this.setter = this.setValueRGB;
                    this.output = this.outputRGB;
                } else {
                    this.getter = this.getValue8;
                    this.setter = this.setValue8;
                    this.output = this.outputSingle;
                }
            } else {
                this.getter = this.getValue16;
                this.setter = this.setValue16;
                this.output = this.outputSingle;
            }

            switch (this.selection) {
                case 2:
                    this.selector = this.select2;
                    break;
                case 3:
                    this.selector = this.select3;
                    break;
                case 4:
                    this.selector = this.select4;
                    break;
                case 5:
                    this.selector = this.select5;
                    break;
                case 6:
                    this.selector = this.select6;
                    break;
                case 7:
                    this.selector = this.select7;
                    break;
                default:
                    this.selector = this.select1;
                    break;
            }

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
            if (this.numBytes == 1) {
                this.outputData = new Uint8Array(new ArrayBuffer(this.xDim * this.yDim * this.numBytes * this.numComp));
            } else {
                this.outputData = new Uint16Array(new ArrayBuffer(this.xDim * this.yDim * this.numBytes * this.numComp));
            }

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
                    this.restarting = (mcuNum == 0);
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

                if (!((current >= jpeg.lossless.Decoder.RESTART_MARKER_BEGIN) &&
                    (current <= jpeg.lossless.Decoder.RESTART_MARKER_END))) {
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
        if (this.numComp == 1) {
            return this.decodeSingle(prev, temp, index);
        } else if (this.numComp == 3) {
            return this.decodeRGB(prev, temp, index);
        } else {
            return -1;
        }
    };



    jpeg.lossless.Decoder.prototype.select1 = function (compOffset) {
        return this.getPreviousX(compOffset);
    };



    jpeg.lossless.Decoder.prototype.select2 = function (compOffset) {
        return this.getPreviousY(compOffset);
    };



    jpeg.lossless.Decoder.prototype.select3 = function (compOffset) {
        return this.getPreviousXY(compOffset);
    };



    jpeg.lossless.Decoder.prototype.select4 = function (compOffset) {
        return (this.getPreviousX(compOffset) + this.getPreviousY(compOffset)) - this.getPreviousXY(compOffset);
    };



    jpeg.lossless.Decoder.prototype.select5 = function (compOffset) {
        return this.getPreviousX(compOffset) + ((this.getPreviousY(compOffset) - this.getPreviousXY(compOffset)) >> 1);
    };



    jpeg.lossless.Decoder.prototype.select6 = function (compOffset) {
        return this.getPreviousY(compOffset) + ((this.getPreviousX(compOffset) - this.getPreviousXY(compOffset)) >> 1);
    };



    jpeg.lossless.Decoder.prototype.select7 = function (compOffset) {
        return ((this.getPreviousX(compOffset) + this.getPreviousY(compOffset)) / 2);
    };



    jpeg.lossless.Decoder.prototype.decodeRGB = function (prev, temp, index) {
        /*jslint bitwise: true */

        var value, actab, dctab, qtab, ctrC, i, k, j;

        prev[0] = this.selector(0);
        prev[1] = this.selector(1);
        prev[2] = this.selector(2);

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
            }
        }

        return 0;
    };



    jpeg.lossless.Decoder.prototype.decodeSingle = function (prev, temp, index) {
        /*jslint bitwise: true */

        var value, i, n, nRestart;

        if (this.restarting) {
            this.restarting = false;
            prev[0] = (1 << (this.frame.precision - 1));
        } else {
            prev[0] = this.selector();
        }

        for (i = 0; i < this.nBlock[0]; i+=1) {
            value = this.getHuffmanValue(this.dcTab[0], temp, index);
            if (value >= 0xFF00) {
                return value;
            }

            n = this.getn(prev, value, temp, index);
            nRestart = (n >> 8);

            if ((nRestart >= jpeg.lossless.Decoder.RESTART_MARKER_BEGIN) && (nRestart <= jpeg.lossless.Decoder.RESTART_MARKER_END)) {
                return nRestart;
            }

            prev[0] += n;
        }

        return 0;
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



    jpeg.lossless.Decoder.prototype.getPreviousX = function (compOffset) {
        /*jslint bitwise: true */

        if (this.xLoc > 0) {
            return this.getter((((this.yLoc * this.xDim) + this.xLoc) - 1), compOffset);
        } else if (this.yLoc > 0) {
            return this.getPreviousY(compOffset);
        } else {
            return (1 << (this.frame.precision - 1));
        }
    };



    jpeg.lossless.Decoder.prototype.getPreviousXY = function (compOffset) {
        /*jslint bitwise: true */

        if ((this.xLoc > 0) && (this.yLoc > 0)) {
            return this.getter(((((this.yLoc - 1) * this.xDim) + this.xLoc) - 1), compOffset);
        } else {
            return this.getPreviousY(compOffset);
        }
    };



    jpeg.lossless.Decoder.prototype.getPreviousY = function (compOffset) {
        /*jslint bitwise: true */

        if (this.yLoc > 0) {
            return this.getter((((this.yLoc - 1) * this.xDim) + this.xLoc), compOffset);
        } else {
            return this.getPreviousX(compOffset);
        }
    };



    jpeg.lossless.Decoder.prototype.isLastPixel = function () {
        return (this.xLoc === (this.xDim - 1)) && (this.yLoc === (this.yDim - 1));
    };



    jpeg.lossless.Decoder.prototype.outputSingle = function (PRED) {
        if ((this.xLoc < this.xDim) && (this.yLoc < this.yDim)) {
            this.setter((((this.yLoc * this.xDim) + this.xLoc)), this.mask & PRED[0]);

            this.xLoc+=1;

            if (this.xLoc >= this.xDim) {
                this.yLoc+=1;
                this.xLoc = 0;
            }
        }
    };



    jpeg.lossless.Decoder.prototype.outputRGB = function (PRED) {
        var offset = ((this.yLoc * this.xDim) + this.xLoc);

        if ((this.xLoc < this.xDim) && (this.yLoc < this.yDim)) {
            this.setter(offset, PRED[0], 0);
            this.setter(offset, PRED[1], 1);
            this.setter(offset, PRED[2], 2);

            this.xLoc+=1;

            if (this.xLoc >= this.xDim) {
                this.yLoc+=1;
                this.xLoc = 0;
            }
        }
    };

    jpeg.lossless.Decoder.prototype.setValue8 = function (index, val) {
        this.outputData[index] = val;
    };

    jpeg.lossless.Decoder.prototype.getValue8 = function (index) {
        return this.outputData[index]; // mask should not be necessary because outputData is either Int8Array or Int16Array
    };

    var littleEndian = (function() {
        var buffer = new ArrayBuffer(2);
        new DataView(buffer).setInt16(0, 256, true /* littleEndian */);
        // Int16Array uses the platform's endianness.
        return new Int16Array(buffer)[0] === 256;
    })();

    if (littleEndian) {
        // just reading from an array is fine then. Int16Array will use platform endianness.
        jpeg.lossless.Decoder.prototype.setValue16 = jpeg.lossless.Decoder.prototype.setValue8;
        jpeg.lossless.Decoder.prototype.getValue16 = jpeg.lossless.Decoder.prototype.getValue8;
    }
    else {
        // If platform is big-endian, we will need to convert to little-endian
        jpeg.lossless.Decoder.prototype.setValue16 = function (index, val) {
            this.outputData[index] = ((val & 0xFF) << 8) | ((val >> 8) & 0xFF);
        };

        jpeg.lossless.Decoder.prototype.getValue16 = function (index) {
            var val = this.outputData[index];
            return ((val & 0xFF) << 8) | ((val >> 8) & 0xFF);
        };
    }

    jpeg.lossless.Decoder.prototype.setValueRGB = function (index, val, compOffset) {
        // this.outputData.setUint8(index * 3 + compOffset, val);
        this.outputData[index * 3 + compOffset] = val;
    };

    jpeg.lossless.Decoder.prototype.getValueRGB = function (index, compOffset) {
        // return this.outputData.getUint8(index * 3 + compOffset);
        return this.outputData[index * 3 + compOffset];
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



    /*** Exports ***/

    var moduleType = typeof module;
    if ((moduleType !== 'undefined') && module.exports) {
        module.exports = jpeg.lossless.Decoder;
    }

},{"./data-stream.js":4,"./frame-header.js":6,"./huffman-table.js":7,"./quantization-table.js":9,"./scan-header.js":11,"./utils.js":12}],6:[function(require,module,exports){
    /*
     * Copyright (C) 2015 Michael Martinez
     * Changes: Added support for selection values 2-7, fixed minor bugs &
     * warnings, split into multiple class files, and general clean up.
     *
     * 08-25-2015: Helmut Dersch agreed to a license change from LGPL to MIT.
     */

    /*
     * Copyright (C) Helmut Dersch
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:

     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.

     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
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
     *
     * 08-25-2015: Helmut Dersch agreed to a license change from LGPL to MIT.
     */

    /*
     * Copyright (C) Helmut Dersch
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:

     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.

     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
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
                        throw new Error("ERROR: Huffman table error(1)!");
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

},{"./data-stream.js":4,"./utils.js":12}],8:[function(require,module,exports){
    /*jslint browser: true, node: true */
    /*global require, module */

    "use strict";

    /*** Imports ****/

    /**
     * jpeg
     * @type {*|{}}
     */
    var jpeg = jpeg || {};

    /**
     * jpeg.lossless
     * @type {*|{}}
     */
    jpeg.lossless = jpeg.lossless || {};


    jpeg.lossless.ComponentSpec = jpeg.lossless.ComponentSpec || ((typeof require !== 'undefined') ? require('./component-spec.js') : null);
    jpeg.lossless.DataStream = jpeg.lossless.DataStream || ((typeof require !== 'undefined') ? require('./data-stream.js') : null);
    jpeg.lossless.Decoder = jpeg.lossless.Decoder || ((typeof require !== 'undefined') ? require('./decoder.js') : null);
    jpeg.lossless.FrameHeader = jpeg.lossless.FrameHeader || ((typeof require !== 'undefined') ? require('./frame-header.js') : null);
    jpeg.lossless.HuffmanTable = jpeg.lossless.HuffmanTable || ((typeof require !== 'undefined') ? require('./huffman-table.js') : null);
    jpeg.lossless.QuantizationTable = jpeg.lossless.QuantizationTable || ((typeof require !== 'undefined') ? require('./quantization-table.js') : null);
    jpeg.lossless.ScanComponent = jpeg.lossless.ScanComponent || ((typeof require !== 'undefined') ? require('./scan-component.js') : null);
    jpeg.lossless.ScanHeader = jpeg.lossless.ScanHeader || ((typeof require !== 'undefined') ? require('./scan-header.js') : null);
    jpeg.lossless.Utils = jpeg.lossless.Utils || ((typeof require !== 'undefined') ? require('./utils.js') : null);


    /*** Exports ***/
    var moduleType = typeof module;
    if ((moduleType !== 'undefined') && module.exports) {
        module.exports = jpeg;
    }

},{"./component-spec.js":3,"./data-stream.js":4,"./decoder.js":5,"./frame-header.js":6,"./huffman-table.js":7,"./quantization-table.js":9,"./scan-component.js":10,"./scan-header.js":11,"./utils.js":12}],9:[function(require,module,exports){
    /*
     * Copyright (C) 2015 Michael Martinez
     * Changes: Added support for selection values 2-7, fixed minor bugs &
     * warnings, split into multiple class files, and general clean up.
     *
     * 08-25-2015: Helmut Dersch agreed to a license change from LGPL to MIT.
     */

    /*
     * Copyright (C) Helmut Dersch
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:

     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.

     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
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

},{"./data-stream.js":4,"./utils.js":12}],10:[function(require,module,exports){
    /*
     * Copyright (C) 2015 Michael Martinez
     * Changes: Added support for selection values 2-7, fixed minor bugs &
     * warnings, split into multiple class files, and general clean up.
     *
     * 08-25-2015: Helmut Dersch agreed to a license change from LGPL to MIT.
     */

    /*
     * Copyright (C) Helmut Dersch
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:

     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.

     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
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

},{}],11:[function(require,module,exports){
    /*
     * Copyright (C) 2015 Michael Martinez
     * Changes: Added support for selection values 2-7, fixed minor bugs &
     * warnings, split into multiple class files, and general clean up.
     *
     * 08-25-2015: Helmut Dersch agreed to a license change from LGPL to MIT.
     */

    /*
     * Copyright (C) Helmut Dersch
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:

     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.

     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
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

},{"./data-stream.js":4,"./scan-component.js":10}],12:[function(require,module,exports){
    /*
     * Copyright (C) 2015 Michael Martinez
     * Changes: Added support for selection values 2-7, fixed minor bugs &
     * warnings, split into multiple class files, and general clean up.
     *
     * 08-25-2015: Helmut Dersch agreed to a license change from LGPL to MIT.
     */

    /*
     * Copyright (C) Helmut Dersch
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:

     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.

     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
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


// http://stackoverflow.com/questions/18638900/javascript-crc32
    jpeg.lossless.Utils.makeCRCTable = function(){
        var c;
        var crcTable = [];
        for(var n =0; n < 256; n++){
            c = n;
            for(var k =0; k < 8; k++){
                c = ((c&1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
            }
            crcTable[n] = c;
        }
        return crcTable;
    };

    jpeg.lossless.Utils.crc32 = function(dataView) {
        var uint8view = new Uint8Array(dataView.buffer);
        var crcTable = jpeg.lossless.Utils.crcTable || (jpeg.lossless.Utils.crcTable = jpeg.lossless.Utils.makeCRCTable());
        var crc = 0 ^ (-1);

        for (var i = 0; i < uint8view.length; i++ ) {
            crc = (crc >>> 8) ^ crcTable[(crc ^ uint8view[i]) & 0xFF];
        }

        return (crc ^ (-1)) >>> 0;
    };


    /*** Exports ***/

    var moduleType = typeof module;
    if ((moduleType !== 'undefined') && module.exports) {
        module.exports = jpeg.lossless.Utils;
    }

},{}],13:[function(require,module,exports){
// Top level file is just a mixin of submodules & constants
    'use strict';

    var assign    = require('./lib/utils/common').assign;

    var deflate   = require('./lib/deflate');
    var inflate   = require('./lib/inflate');
    var constants = require('./lib/zlib/constants');

    var pako = {};

    assign(pako, deflate, inflate, constants);

    module.exports = pako;

},{"./lib/deflate":14,"./lib/inflate":15,"./lib/utils/common":16,"./lib/zlib/constants":19}],14:[function(require,module,exports){
    'use strict';


    var zlib_deflate = require('./zlib/deflate.js');
    var utils = require('./utils/common');
    var strings = require('./utils/strings');
    var msg = require('./zlib/messages');
    var zstream = require('./zlib/zstream');

    var toString = Object.prototype.toString;

    /* Public constants ==========================================================*/
    /* ===========================================================================*/

    var Z_NO_FLUSH      = 0;
    var Z_FINISH        = 4;

    var Z_OK            = 0;
    var Z_STREAM_END    = 1;
    var Z_SYNC_FLUSH    = 2;

    var Z_DEFAULT_COMPRESSION = -1;

    var Z_DEFAULT_STRATEGY    = 0;

    var Z_DEFLATED  = 8;

    /* ===========================================================================*/


    /**
     * class Deflate
     *
     * Generic JS-style wrapper for zlib calls. If you don't need
     * streaming behaviour - use more simple functions: [[deflate]],
     * [[deflateRaw]] and [[gzip]].
     **/

    /* internal
     * Deflate.chunks -> Array
     *
     * Chunks of output data, if [[Deflate#onData]] not overriden.
     **/

    /**
     * Deflate.result -> Uint8Array|Array
     *
     * Compressed result, generated by default [[Deflate#onData]]
     * and [[Deflate#onEnd]] handlers. Filled after you push last chunk
     * (call [[Deflate#push]] with `Z_FINISH` / `true` param)  or if you
     * push a chunk with explicit flush (call [[Deflate#push]] with
     * `Z_SYNC_FLUSH` param).
     **/

    /**
     * Deflate.err -> Number
     *
     * Error code after deflate finished. 0 (Z_OK) on success.
     * You will not need it in real life, because deflate errors
     * are possible only on wrong options or bad `onData` / `onEnd`
     * custom handlers.
     **/

    /**
     * Deflate.msg -> String
     *
     * Error message, if [[Deflate.err]] != 0
     **/


    /**
     * new Deflate(options)
     * - options (Object): zlib deflate options.
     *
     * Creates new deflator instance with specified params. Throws exception
     * on bad params. Supported options:
     *
     * - `level`
     * - `windowBits`
     * - `memLevel`
     * - `strategy`
     *
     * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
     * for more information on these.
     *
     * Additional options, for internal needs:
     *
     * - `chunkSize` - size of generated data chunks (16K by default)
     * - `raw` (Boolean) - do raw deflate
     * - `gzip` (Boolean) - create gzip wrapper
     * - `to` (String) - if equal to 'string', then result will be "binary string"
     *    (each char code [0..255])
     * - `header` (Object) - custom header for gzip
     *   - `text` (Boolean) - true if compressed data believed to be text
     *   - `time` (Number) - modification time, unix timestamp
     *   - `os` (Number) - operation system code
     *   - `extra` (Array) - array of bytes with extra data (max 65536)
     *   - `name` (String) - file name (binary string)
     *   - `comment` (String) - comment (binary string)
     *   - `hcrc` (Boolean) - true if header crc should be added
     *
     * ##### Example:
     *
     * ```javascript
     * var pako = require('pako')
     *   , chunk1 = Uint8Array([1,2,3,4,5,6,7,8,9])
     *   , chunk2 = Uint8Array([10,11,12,13,14,15,16,17,18,19]);
     *
     * var deflate = new pako.Deflate({ level: 3});
     *
     * deflate.push(chunk1, false);
     * deflate.push(chunk2, true);  // true -> last chunk
     *
     * if (deflate.err) { throw new Error(deflate.err); }
     *
     * console.log(deflate.result);
     * ```
     **/
    var Deflate = function(options) {

        this.options = utils.assign({
            level: Z_DEFAULT_COMPRESSION,
            method: Z_DEFLATED,
            chunkSize: 16384,
            windowBits: 15,
            memLevel: 8,
            strategy: Z_DEFAULT_STRATEGY,
            to: ''
        }, options || {});

        var opt = this.options;

        if (opt.raw && (opt.windowBits > 0)) {
            opt.windowBits = -opt.windowBits;
        }

        else if (opt.gzip && (opt.windowBits > 0) && (opt.windowBits < 16)) {
            opt.windowBits += 16;
        }

        this.err    = 0;      // error code, if happens (0 = Z_OK)
        this.msg    = '';     // error message
        this.ended  = false;  // used to avoid multiple onEnd() calls
        this.chunks = [];     // chunks of compressed data

        this.strm = new zstream();
        this.strm.avail_out = 0;

        var status = zlib_deflate.deflateInit2(
            this.strm,
            opt.level,
            opt.method,
            opt.windowBits,
            opt.memLevel,
            opt.strategy
        );

        if (status !== Z_OK) {
            throw new Error(msg[status]);
        }

        if (opt.header) {
            zlib_deflate.deflateSetHeader(this.strm, opt.header);
        }
    };

    /**
     * Deflate#push(data[, mode]) -> Boolean
     * - data (Uint8Array|Array|ArrayBuffer|String): input data. Strings will be
     *   converted to utf8 byte sequence.
     * - mode (Number|Boolean): 0..6 for corresponding Z_NO_FLUSH..Z_TREE modes.
     *   See constants. Skipped or `false` means Z_NO_FLUSH, `true` meansh Z_FINISH.
     *
     * Sends input data to deflate pipe, generating [[Deflate#onData]] calls with
     * new compressed chunks. Returns `true` on success. The last data block must have
     * mode Z_FINISH (or `true`). That will flush internal pending buffers and call
     * [[Deflate#onEnd]]. For interim explicit flushes (without ending the stream) you
     * can use mode Z_SYNC_FLUSH, keeping the compression context.
     *
     * On fail call [[Deflate#onEnd]] with error code and return false.
     *
     * We strongly recommend to use `Uint8Array` on input for best speed (output
     * array format is detected automatically). Also, don't skip last param and always
     * use the same type in your code (boolean or number). That will improve JS speed.
     *
     * For regular `Array`-s make sure all elements are [0..255].
     *
     * ##### Example
     *
     * ```javascript
     * push(chunk, false); // push one of data chunks
     * ...
     * push(chunk, true);  // push last chunk
     * ```
     **/
    Deflate.prototype.push = function(data, mode) {
        var strm = this.strm;
        var chunkSize = this.options.chunkSize;
        var status, _mode;

        if (this.ended) { return false; }

        _mode = (mode === ~~mode) ? mode : ((mode === true) ? Z_FINISH : Z_NO_FLUSH);

        // Convert data if needed
        if (typeof data === 'string') {
            // If we need to compress text, change encoding to utf8.
            strm.input = strings.string2buf(data);
        } else if (toString.call(data) === '[object ArrayBuffer]') {
            strm.input = new Uint8Array(data);
        } else {
            strm.input = data;
        }

        strm.next_in = 0;
        strm.avail_in = strm.input.length;

        do {
            if (strm.avail_out === 0) {
                strm.output = new utils.Buf8(chunkSize);
                strm.next_out = 0;
                strm.avail_out = chunkSize;
            }
            status = zlib_deflate.deflate(strm, _mode);    /* no bad return value */

            if (status !== Z_STREAM_END && status !== Z_OK) {
                this.onEnd(status);
                this.ended = true;
                return false;
            }
            if (strm.avail_out === 0 || (strm.avail_in === 0 && (_mode === Z_FINISH || _mode === Z_SYNC_FLUSH))) {
                if (this.options.to === 'string') {
                    this.onData(strings.buf2binstring(utils.shrinkBuf(strm.output, strm.next_out)));
                } else {
                    this.onData(utils.shrinkBuf(strm.output, strm.next_out));
                }
            }
        } while ((strm.avail_in > 0 || strm.avail_out === 0) && status !== Z_STREAM_END);

        // Finalize on the last chunk.
        if (_mode === Z_FINISH) {
            status = zlib_deflate.deflateEnd(this.strm);
            this.onEnd(status);
            this.ended = true;
            return status === Z_OK;
        }

        // callback interim results if Z_SYNC_FLUSH.
        if (_mode === Z_SYNC_FLUSH) {
            this.onEnd(Z_OK);
            strm.avail_out = 0;
            return true;
        }

        return true;
    };


    /**
     * Deflate#onData(chunk) -> Void
     * - chunk (Uint8Array|Array|String): ouput data. Type of array depends
     *   on js engine support. When string output requested, each chunk
     *   will be string.
     *
     * By default, stores data blocks in `chunks[]` property and glue
     * those in `onEnd`. Override this handler, if you need another behaviour.
     **/
    Deflate.prototype.onData = function(chunk) {
        this.chunks.push(chunk);
    };


    /**
     * Deflate#onEnd(status) -> Void
     * - status (Number): deflate status. 0 (Z_OK) on success,
     *   other if not.
     *
     * Called once after you tell deflate that the input stream is
     * complete (Z_FINISH) or should be flushed (Z_SYNC_FLUSH)
     * or if an error happened. By default - join collected chunks,
     * free memory and fill `results` / `err` properties.
     **/
    Deflate.prototype.onEnd = function(status) {
        // On success - join
        if (status === Z_OK) {
            if (this.options.to === 'string') {
                this.result = this.chunks.join('');
            } else {
                this.result = utils.flattenChunks(this.chunks);
            }
        }
        this.chunks = [];
        this.err = status;
        this.msg = this.strm.msg;
    };


    /**
     * deflate(data[, options]) -> Uint8Array|Array|String
     * - data (Uint8Array|Array|String): input data to compress.
     * - options (Object): zlib deflate options.
     *
     * Compress `data` with deflate alrorythm and `options`.
     *
     * Supported options are:
     *
     * - level
     * - windowBits
     * - memLevel
     * - strategy
     *
     * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
     * for more information on these.
     *
     * Sugar (options):
     *
     * - `raw` (Boolean) - say that we work with raw stream, if you don't wish to specify
     *   negative windowBits implicitly.
     * - `to` (String) - if equal to 'string', then result will be "binary string"
     *    (each char code [0..255])
     *
     * ##### Example:
     *
     * ```javascript
     * var pako = require('pako')
     *   , data = Uint8Array([1,2,3,4,5,6,7,8,9]);
     *
     * console.log(pako.deflate(data));
     * ```
     **/
    function deflate(input, options) {
        var deflator = new Deflate(options);

        deflator.push(input, true);

        // That will never happens, if you don't cheat with options :)
        if (deflator.err) { throw deflator.msg; }

        return deflator.result;
    }


    /**
     * deflateRaw(data[, options]) -> Uint8Array|Array|String
     * - data (Uint8Array|Array|String): input data to compress.
     * - options (Object): zlib deflate options.
     *
     * The same as [[deflate]], but creates raw data, without wrapper
     * (header and adler32 crc).
     **/
    function deflateRaw(input, options) {
        options = options || {};
        options.raw = true;
        return deflate(input, options);
    }


    /**
     * gzip(data[, options]) -> Uint8Array|Array|String
     * - data (Uint8Array|Array|String): input data to compress.
     * - options (Object): zlib deflate options.
     *
     * The same as [[deflate]], but create gzip wrapper instead of
     * deflate one.
     **/
    function gzip(input, options) {
        options = options || {};
        options.gzip = true;
        return deflate(input, options);
    }


    exports.Deflate = Deflate;
    exports.deflate = deflate;
    exports.deflateRaw = deflateRaw;
    exports.gzip = gzip;

},{"./utils/common":16,"./utils/strings":17,"./zlib/deflate.js":21,"./zlib/messages":26,"./zlib/zstream":28}],15:[function(require,module,exports){
    'use strict';


    var zlib_inflate = require('./zlib/inflate.js');
    var utils = require('./utils/common');
    var strings = require('./utils/strings');
    var c = require('./zlib/constants');
    var msg = require('./zlib/messages');
    var zstream = require('./zlib/zstream');
    var gzheader = require('./zlib/gzheader');

    var toString = Object.prototype.toString;

    /**
     * class Inflate
     *
     * Generic JS-style wrapper for zlib calls. If you don't need
     * streaming behaviour - use more simple functions: [[inflate]]
     * and [[inflateRaw]].
     **/

    /* internal
     * inflate.chunks -> Array
     *
     * Chunks of output data, if [[Inflate#onData]] not overriden.
     **/

    /**
     * Inflate.result -> Uint8Array|Array|String
     *
     * Uncompressed result, generated by default [[Inflate#onData]]
     * and [[Inflate#onEnd]] handlers. Filled after you push last chunk
     * (call [[Inflate#push]] with `Z_FINISH` / `true` param) or if you
     * push a chunk with explicit flush (call [[Inflate#push]] with
     * `Z_SYNC_FLUSH` param).
     **/

    /**
     * Inflate.err -> Number
     *
     * Error code after inflate finished. 0 (Z_OK) on success.
     * Should be checked if broken data possible.
     **/

    /**
     * Inflate.msg -> String
     *
     * Error message, if [[Inflate.err]] != 0
     **/


    /**
     * new Inflate(options)
     * - options (Object): zlib inflate options.
     *
     * Creates new inflator instance with specified params. Throws exception
     * on bad params. Supported options:
     *
     * - `windowBits`
     *
     * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
     * for more information on these.
     *
     * Additional options, for internal needs:
     *
     * - `chunkSize` - size of generated data chunks (16K by default)
     * - `raw` (Boolean) - do raw inflate
     * - `to` (String) - if equal to 'string', then result will be converted
     *   from utf8 to utf16 (javascript) string. When string output requested,
     *   chunk length can differ from `chunkSize`, depending on content.
     *
     * By default, when no options set, autodetect deflate/gzip data format via
     * wrapper header.
     *
     * ##### Example:
     *
     * ```javascript
     * var pako = require('pako')
     *   , chunk1 = Uint8Array([1,2,3,4,5,6,7,8,9])
     *   , chunk2 = Uint8Array([10,11,12,13,14,15,16,17,18,19]);
     *
     * var inflate = new pako.Inflate({ level: 3});
     *
     * inflate.push(chunk1, false);
     * inflate.push(chunk2, true);  // true -> last chunk
     *
     * if (inflate.err) { throw new Error(inflate.err); }
     *
     * console.log(inflate.result);
     * ```
     **/
    var Inflate = function(options) {

        this.options = utils.assign({
            chunkSize: 16384,
            windowBits: 0,
            to: ''
        }, options || {});

        var opt = this.options;

        // Force window size for `raw` data, if not set directly,
        // because we have no header for autodetect.
        if (opt.raw && (opt.windowBits >= 0) && (opt.windowBits < 16)) {
            opt.windowBits = -opt.windowBits;
            if (opt.windowBits === 0) { opt.windowBits = -15; }
        }

        // If `windowBits` not defined (and mode not raw) - set autodetect flag for gzip/deflate
        if ((opt.windowBits >= 0) && (opt.windowBits < 16) &&
            !(options && options.windowBits)) {
            opt.windowBits += 32;
        }

        // Gzip header has no info about windows size, we can do autodetect only
        // for deflate. So, if window size not set, force it to max when gzip possible
        if ((opt.windowBits > 15) && (opt.windowBits < 48)) {
            // bit 3 (16) -> gzipped data
            // bit 4 (32) -> autodetect gzip/deflate
            if ((opt.windowBits & 15) === 0) {
                opt.windowBits |= 15;
            }
        }

        this.err    = 0;      // error code, if happens (0 = Z_OK)
        this.msg    = '';     // error message
        this.ended  = false;  // used to avoid multiple onEnd() calls
        this.chunks = [];     // chunks of compressed data

        this.strm   = new zstream();
        this.strm.avail_out = 0;

        var status  = zlib_inflate.inflateInit2(
            this.strm,
            opt.windowBits
        );

        if (status !== c.Z_OK) {
            throw new Error(msg[status]);
        }

        this.header = new gzheader();

        zlib_inflate.inflateGetHeader(this.strm, this.header);
    };

    /**
     * Inflate#push(data[, mode]) -> Boolean
     * - data (Uint8Array|Array|ArrayBuffer|String): input data
     * - mode (Number|Boolean): 0..6 for corresponding Z_NO_FLUSH..Z_TREE modes.
     *   See constants. Skipped or `false` means Z_NO_FLUSH, `true` meansh Z_FINISH.
     *
     * Sends input data to inflate pipe, generating [[Inflate#onData]] calls with
     * new output chunks. Returns `true` on success. The last data block must have
     * mode Z_FINISH (or `true`). That will flush internal pending buffers and call
     * [[Inflate#onEnd]]. For interim explicit flushes (without ending the stream) you
     * can use mode Z_SYNC_FLUSH, keeping the decompression context.
     *
     * On fail call [[Inflate#onEnd]] with error code and return false.
     *
     * We strongly recommend to use `Uint8Array` on input for best speed (output
     * format is detected automatically). Also, don't skip last param and always
     * use the same type in your code (boolean or number). That will improve JS speed.
     *
     * For regular `Array`-s make sure all elements are [0..255].
     *
     * ##### Example
     *
     * ```javascript
     * push(chunk, false); // push one of data chunks
     * ...
     * push(chunk, true);  // push last chunk
     * ```
     **/
    Inflate.prototype.push = function(data, mode) {
        var strm = this.strm;
        var chunkSize = this.options.chunkSize;
        var status, _mode;
        var next_out_utf8, tail, utf8str;

        // Flag to properly process Z_BUF_ERROR on testing inflate call
        // when we check that all output data was flushed.
        var allowBufError = false;

        if (this.ended) { return false; }
        _mode = (mode === ~~mode) ? mode : ((mode === true) ? c.Z_FINISH : c.Z_NO_FLUSH);

        // Convert data if needed
        if (typeof data === 'string') {
            // Only binary strings can be decompressed on practice
            strm.input = strings.binstring2buf(data);
        } else if (toString.call(data) === '[object ArrayBuffer]') {
            strm.input = new Uint8Array(data);
        } else {
            strm.input = data;
        }

        strm.next_in = 0;
        strm.avail_in = strm.input.length;

        do {
            if (strm.avail_out === 0) {
                strm.output = new utils.Buf8(chunkSize);
                strm.next_out = 0;
                strm.avail_out = chunkSize;
            }

            status = zlib_inflate.inflate(strm, c.Z_NO_FLUSH);    /* no bad return value */

            if (status === c.Z_BUF_ERROR && allowBufError === true) {
                status = c.Z_OK;
                allowBufError = false;
            }

            if (status !== c.Z_STREAM_END && status !== c.Z_OK) {
                this.onEnd(status);
                this.ended = true;
                return false;
            }

            if (strm.next_out) {
                if (strm.avail_out === 0 || status === c.Z_STREAM_END || (strm.avail_in === 0 && (_mode === c.Z_FINISH || _mode === c.Z_SYNC_FLUSH))) {

                    if (this.options.to === 'string') {

                        next_out_utf8 = strings.utf8border(strm.output, strm.next_out);

                        tail = strm.next_out - next_out_utf8;
                        utf8str = strings.buf2string(strm.output, next_out_utf8);

                        // move tail
                        strm.next_out = tail;
                        strm.avail_out = chunkSize - tail;
                        if (tail) { utils.arraySet(strm.output, strm.output, next_out_utf8, tail, 0); }

                        this.onData(utf8str);

                    } else {
                        this.onData(utils.shrinkBuf(strm.output, strm.next_out));
                    }
                }
            }

            // When no more input data, we should check that internal inflate buffers
            // are flushed. The only way to do it when avail_out = 0 - run one more
            // inflate pass. But if output data not exists, inflate return Z_BUF_ERROR.
            // Here we set flag to process this error properly.
            //
            // NOTE. Deflate does not return error in this case and does not needs such
            // logic.
            if (strm.avail_in === 0 && strm.avail_out === 0) {
                allowBufError = true;
            }

        } while ((strm.avail_in > 0 || strm.avail_out === 0) && status !== c.Z_STREAM_END);

        if (status === c.Z_STREAM_END) {
            _mode = c.Z_FINISH;
        }

        // Finalize on the last chunk.
        if (_mode === c.Z_FINISH) {
            status = zlib_inflate.inflateEnd(this.strm);
            this.onEnd(status);
            this.ended = true;
            return status === c.Z_OK;
        }

        // callback interim results if Z_SYNC_FLUSH.
        if (_mode === c.Z_SYNC_FLUSH) {
            this.onEnd(c.Z_OK);
            strm.avail_out = 0;
            return true;
        }

        return true;
    };


    /**
     * Inflate#onData(chunk) -> Void
     * - chunk (Uint8Array|Array|String): ouput data. Type of array depends
     *   on js engine support. When string output requested, each chunk
     *   will be string.
     *
     * By default, stores data blocks in `chunks[]` property and glue
     * those in `onEnd`. Override this handler, if you need another behaviour.
     **/
    Inflate.prototype.onData = function(chunk) {
        this.chunks.push(chunk);
    };


    /**
     * Inflate#onEnd(status) -> Void
     * - status (Number): inflate status. 0 (Z_OK) on success,
     *   other if not.
     *
     * Called either after you tell inflate that the input stream is
     * complete (Z_FINISH) or should be flushed (Z_SYNC_FLUSH)
     * or if an error happened. By default - join collected chunks,
     * free memory and fill `results` / `err` properties.
     **/
    Inflate.prototype.onEnd = function(status) {
        // On success - join
        if (status === c.Z_OK) {
            if (this.options.to === 'string') {
                // Glue & convert here, until we teach pako to send
                // utf8 alligned strings to onData
                this.result = this.chunks.join('');
            } else {
                this.result = utils.flattenChunks(this.chunks);
            }
        }
        this.chunks = [];
        this.err = status;
        this.msg = this.strm.msg;
    };


    /**
     * inflate(data[, options]) -> Uint8Array|Array|String
     * - data (Uint8Array|Array|String): input data to decompress.
     * - options (Object): zlib inflate options.
     *
     * Decompress `data` with inflate/ungzip and `options`. Autodetect
     * format via wrapper header by default. That's why we don't provide
     * separate `ungzip` method.
     *
     * Supported options are:
     *
     * - windowBits
     *
     * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
     * for more information.
     *
     * Sugar (options):
     *
     * - `raw` (Boolean) - say that we work with raw stream, if you don't wish to specify
     *   negative windowBits implicitly.
     * - `to` (String) - if equal to 'string', then result will be converted
     *   from utf8 to utf16 (javascript) string. When string output requested,
     *   chunk length can differ from `chunkSize`, depending on content.
     *
     *
     * ##### Example:
     *
     * ```javascript
     * var pako = require('pako')
     *   , input = pako.deflate([1,2,3,4,5,6,7,8,9])
     *   , output;
     *
     * try {
 *   output = pako.inflate(input);
 * } catch (err)
     *   console.log(err);
     * }
     * ```
     **/
    function inflate(input, options) {
        var inflator = new Inflate(options);

        inflator.push(input, true);

        // That will never happens, if you don't cheat with options :)
        if (inflator.err) { throw inflator.msg; }

        return inflator.result;
    }


    /**
     * inflateRaw(data[, options]) -> Uint8Array|Array|String
     * - data (Uint8Array|Array|String): input data to decompress.
     * - options (Object): zlib inflate options.
     *
     * The same as [[inflate]], but creates raw data, without wrapper
     * (header and adler32 crc).
     **/
    function inflateRaw(input, options) {
        options = options || {};
        options.raw = true;
        return inflate(input, options);
    }


    /**
     * ungzip(data[, options]) -> Uint8Array|Array|String
     * - data (Uint8Array|Array|String): input data to decompress.
     * - options (Object): zlib inflate options.
     *
     * Just shortcut to [[inflate]], because it autodetects format
     * by header.content. Done for convenience.
     **/


    exports.Inflate = Inflate;
    exports.inflate = inflate;
    exports.inflateRaw = inflateRaw;
    exports.ungzip  = inflate;

},{"./utils/common":16,"./utils/strings":17,"./zlib/constants":19,"./zlib/gzheader":22,"./zlib/inflate.js":24,"./zlib/messages":26,"./zlib/zstream":28}],16:[function(require,module,exports){
    'use strict';


    var TYPED_OK =  (typeof Uint8Array !== 'undefined') &&
        (typeof Uint16Array !== 'undefined') &&
        (typeof Int32Array !== 'undefined');


    exports.assign = function (obj /*from1, from2, from3, ...*/) {
        var sources = Array.prototype.slice.call(arguments, 1);
        while (sources.length) {
            var source = sources.shift();
            if (!source) { continue; }

            if (typeof source !== 'object') {
                throw new TypeError(source + 'must be non-object');
            }

            for (var p in source) {
                if (source.hasOwnProperty(p)) {
                    obj[p] = source[p];
                }
            }
        }

        return obj;
    };


// reduce buffer size, avoiding mem copy
    exports.shrinkBuf = function (buf, size) {
        if (buf.length === size) { return buf; }
        if (buf.subarray) { return buf.subarray(0, size); }
        buf.length = size;
        return buf;
    };


    var fnTyped = {
        arraySet: function (dest, src, src_offs, len, dest_offs) {
            if (src.subarray && dest.subarray) {
                dest.set(src.subarray(src_offs, src_offs+len), dest_offs);
                return;
            }
            // Fallback to ordinary array
            for (var i=0; i<len; i++) {
                dest[dest_offs + i] = src[src_offs + i];
            }
        },
        // Join array of chunks to single array.
        flattenChunks: function(chunks) {
            var i, l, len, pos, chunk, result;

            // calculate data length
            len = 0;
            for (i=0, l=chunks.length; i<l; i++) {
                len += chunks[i].length;
            }

            // join chunks
            result = new Uint8Array(len);
            pos = 0;
            for (i=0, l=chunks.length; i<l; i++) {
                chunk = chunks[i];
                result.set(chunk, pos);
                pos += chunk.length;
            }

            return result;
        }
    };

    var fnUntyped = {
        arraySet: function (dest, src, src_offs, len, dest_offs) {
            for (var i=0; i<len; i++) {
                dest[dest_offs + i] = src[src_offs + i];
            }
        },
        // Join array of chunks to single array.
        flattenChunks: function(chunks) {
            return [].concat.apply([], chunks);
        }
    };


// Enable/Disable typed arrays use, for testing
//
    exports.setTyped = function (on) {
        if (on) {
            exports.Buf8  = Uint8Array;
            exports.Buf16 = Uint16Array;
            exports.Buf32 = Int32Array;
            exports.assign(exports, fnTyped);
        } else {
            exports.Buf8  = Array;
            exports.Buf16 = Array;
            exports.Buf32 = Array;
            exports.assign(exports, fnUntyped);
        }
    };

    exports.setTyped(TYPED_OK);

},{}],17:[function(require,module,exports){
// String encode/decode helpers
    'use strict';


    var utils = require('./common');


// Quick check if we can use fast array to bin string conversion
//
// - apply(Array) can fail on Android 2.2
// - apply(Uint8Array) can fail on iOS 5.1 Safary
//
    var STR_APPLY_OK = true;
    var STR_APPLY_UIA_OK = true;

    try { String.fromCharCode.apply(null, [0]); } catch(__) { STR_APPLY_OK = false; }
    try { String.fromCharCode.apply(null, new Uint8Array(1)); } catch(__) { STR_APPLY_UIA_OK = false; }


// Table with utf8 lengths (calculated by first byte of sequence)
// Note, that 5 & 6-byte values and some 4-byte values can not be represented in JS,
// because max possible codepoint is 0x10ffff
    var _utf8len = new utils.Buf8(256);
    for (var q=0; q<256; q++) {
        _utf8len[q] = (q >= 252 ? 6 : q >= 248 ? 5 : q >= 240 ? 4 : q >= 224 ? 3 : q >= 192 ? 2 : 1);
    }
    _utf8len[254]=_utf8len[254]=1; // Invalid sequence start


// convert string to array (typed, when possible)
    exports.string2buf = function (str) {
        var buf, c, c2, m_pos, i, str_len = str.length, buf_len = 0;

        // count binary size
        for (m_pos = 0; m_pos < str_len; m_pos++) {
            c = str.charCodeAt(m_pos);
            if ((c & 0xfc00) === 0xd800 && (m_pos+1 < str_len)) {
                c2 = str.charCodeAt(m_pos+1);
                if ((c2 & 0xfc00) === 0xdc00) {
                    c = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
                    m_pos++;
                }
            }
            buf_len += c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4;
        }

        // allocate buffer
        buf = new utils.Buf8(buf_len);

        // convert
        for (i=0, m_pos = 0; i < buf_len; m_pos++) {
            c = str.charCodeAt(m_pos);
            if ((c & 0xfc00) === 0xd800 && (m_pos+1 < str_len)) {
                c2 = str.charCodeAt(m_pos+1);
                if ((c2 & 0xfc00) === 0xdc00) {
                    c = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
                    m_pos++;
                }
            }
            if (c < 0x80) {
                /* one byte */
                buf[i++] = c;
            } else if (c < 0x800) {
                /* two bytes */
                buf[i++] = 0xC0 | (c >>> 6);
                buf[i++] = 0x80 | (c & 0x3f);
            } else if (c < 0x10000) {
                /* three bytes */
                buf[i++] = 0xE0 | (c >>> 12);
                buf[i++] = 0x80 | (c >>> 6 & 0x3f);
                buf[i++] = 0x80 | (c & 0x3f);
            } else {
                /* four bytes */
                buf[i++] = 0xf0 | (c >>> 18);
                buf[i++] = 0x80 | (c >>> 12 & 0x3f);
                buf[i++] = 0x80 | (c >>> 6 & 0x3f);
                buf[i++] = 0x80 | (c & 0x3f);
            }
        }

        return buf;
    };

// Helper (used in 2 places)
    function buf2binstring(buf, len) {
        // use fallback for big arrays to avoid stack overflow
        if (len < 65537) {
            if ((buf.subarray && STR_APPLY_UIA_OK) || (!buf.subarray && STR_APPLY_OK)) {
                return String.fromCharCode.apply(null, utils.shrinkBuf(buf, len));
            }
        }

        var result = '';
        for (var i=0; i < len; i++) {
            result += String.fromCharCode(buf[i]);
        }
        return result;
    }


// Convert byte array to binary string
    exports.buf2binstring = function(buf) {
        return buf2binstring(buf, buf.length);
    };


// Convert binary string (typed, when possible)
    exports.binstring2buf = function(str) {
        var buf = new utils.Buf8(str.length);
        for (var i=0, len=buf.length; i < len; i++) {
            buf[i] = str.charCodeAt(i);
        }
        return buf;
    };


// convert array to string
    exports.buf2string = function (buf, max) {
        var i, out, c, c_len;
        var len = max || buf.length;

        // Reserve max possible length (2 words per char)
        // NB: by unknown reasons, Array is significantly faster for
        //     String.fromCharCode.apply than Uint16Array.
        var utf16buf = new Array(len*2);

        for (out=0, i=0; i<len;) {
            c = buf[i++];
            // quick process ascii
            if (c < 0x80) { utf16buf[out++] = c; continue; }

            c_len = _utf8len[c];
            // skip 5 & 6 byte codes
            if (c_len > 4) { utf16buf[out++] = 0xfffd; i += c_len-1; continue; }

            // apply mask on first byte
            c &= c_len === 2 ? 0x1f : c_len === 3 ? 0x0f : 0x07;
            // join the rest
            while (c_len > 1 && i < len) {
                c = (c << 6) | (buf[i++] & 0x3f);
                c_len--;
            }

            // terminated by end of string?
            if (c_len > 1) { utf16buf[out++] = 0xfffd; continue; }

            if (c < 0x10000) {
                utf16buf[out++] = c;
            } else {
                c -= 0x10000;
                utf16buf[out++] = 0xd800 | ((c >> 10) & 0x3ff);
                utf16buf[out++] = 0xdc00 | (c & 0x3ff);
            }
        }

        return buf2binstring(utf16buf, out);
    };


// Calculate max possible position in utf8 buffer,
// that will not break sequence. If that's not possible
// - (very small limits) return max size as is.
//
// buf[] - utf8 bytes array
// max   - length limit (mandatory);
    exports.utf8border = function(buf, max) {
        var pos;

        max = max || buf.length;
        if (max > buf.length) { max = buf.length; }

        // go back from last position, until start of sequence found
        pos = max-1;
        while (pos >= 0 && (buf[pos] & 0xC0) === 0x80) { pos--; }

        // Fuckup - very small and broken sequence,
        // return max, because we should return something anyway.
        if (pos < 0) { return max; }

        // If we came to start of buffer - that means vuffer is too small,
        // return max too.
        if (pos === 0) { return max; }

        return (pos + _utf8len[buf[pos]] > max) ? pos : max;
    };

},{"./common":16}],18:[function(require,module,exports){
    'use strict';

// Note: adler32 takes 12% for level 0 and 2% for level 6.
// It doesn't worth to make additional optimizationa as in original.
// Small size is preferable.

    function adler32(adler, buf, len, pos) {
        var s1 = (adler & 0xffff) |0,
            s2 = ((adler >>> 16) & 0xffff) |0,
            n = 0;

        while (len !== 0) {
            // Set limit ~ twice less than 5552, to keep
            // s2 in 31-bits, because we force signed ints.
            // in other case %= will fail.
            n = len > 2000 ? 2000 : len;
            len -= n;

            do {
                s1 = (s1 + buf[pos++]) |0;
                s2 = (s2 + s1) |0;
            } while (--n);

            s1 %= 65521;
            s2 %= 65521;
        }

        return (s1 | (s2 << 16)) |0;
    }


    module.exports = adler32;

},{}],19:[function(require,module,exports){
    module.exports = {

        /* Allowed flush values; see deflate() and inflate() below for details */
        Z_NO_FLUSH:         0,
        Z_PARTIAL_FLUSH:    1,
        Z_SYNC_FLUSH:       2,
        Z_FULL_FLUSH:       3,
        Z_FINISH:           4,
        Z_BLOCK:            5,
        Z_TREES:            6,

        /* Return codes for the compression/decompression functions. Negative values
         * are errors, positive values are used for special but normal events.
         */
        Z_OK:               0,
        Z_STREAM_END:       1,
        Z_NEED_DICT:        2,
        Z_ERRNO:           -1,
        Z_STREAM_ERROR:    -2,
        Z_DATA_ERROR:      -3,
        //Z_MEM_ERROR:     -4,
        Z_BUF_ERROR:       -5,
        //Z_VERSION_ERROR: -6,

        /* compression levels */
        Z_NO_COMPRESSION:         0,
        Z_BEST_SPEED:             1,
        Z_BEST_COMPRESSION:       9,
        Z_DEFAULT_COMPRESSION:   -1,


        Z_FILTERED:               1,
        Z_HUFFMAN_ONLY:           2,
        Z_RLE:                    3,
        Z_FIXED:                  4,
        Z_DEFAULT_STRATEGY:       0,

        /* Possible values of the data_type field (though see inflate()) */
        Z_BINARY:                 0,
        Z_TEXT:                   1,
        //Z_ASCII:                1, // = Z_TEXT (deprecated)
        Z_UNKNOWN:                2,

        /* The deflate compression method */
        Z_DEFLATED:               8
        //Z_NULL:                 null // Use -1 or null inline, depending on var type
    };

},{}],20:[function(require,module,exports){
    'use strict';

// Note: we can't get significant speed boost here.
// So write code to minimize size - no pregenerated tables
// and array tools dependencies.


// Use ordinary array, since untyped makes no boost here
    function makeTable() {
        var c, table = [];

        for (var n =0; n < 256; n++) {
            c = n;
            for (var k =0; k < 8; k++) {
                c = ((c&1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
            }
            table[n] = c;
        }

        return table;
    }

// Create table on load. Just 255 signed longs. Not a problem.
    var crcTable = makeTable();


    function crc32(crc, buf, len, pos) {
        var t = crcTable,
            end = pos + len;

        crc = crc ^ (-1);

        for (var i = pos; i < end; i++) {
            crc = (crc >>> 8) ^ t[(crc ^ buf[i]) & 0xFF];
        }

        return (crc ^ (-1)); // >>> 0;
    }


    module.exports = crc32;

},{}],21:[function(require,module,exports){
    'use strict';

    var utils   = require('../utils/common');
    var trees   = require('./trees');
    var adler32 = require('./adler32');
    var crc32   = require('./crc32');
    var msg   = require('./messages');

    /* Public constants ==========================================================*/
    /* ===========================================================================*/


    /* Allowed flush values; see deflate() and inflate() below for details */
    var Z_NO_FLUSH      = 0;
    var Z_PARTIAL_FLUSH = 1;
//var Z_SYNC_FLUSH    = 2;
    var Z_FULL_FLUSH    = 3;
    var Z_FINISH        = 4;
    var Z_BLOCK         = 5;
//var Z_TREES         = 6;


    /* Return codes for the compression/decompression functions. Negative values
     * are errors, positive values are used for special but normal events.
     */
    var Z_OK            = 0;
    var Z_STREAM_END    = 1;
//var Z_NEED_DICT     = 2;
//var Z_ERRNO         = -1;
    var Z_STREAM_ERROR  = -2;
    var Z_DATA_ERROR    = -3;
//var Z_MEM_ERROR     = -4;
    var Z_BUF_ERROR     = -5;
//var Z_VERSION_ERROR = -6;


    /* compression levels */
//var Z_NO_COMPRESSION      = 0;
//var Z_BEST_SPEED          = 1;
//var Z_BEST_COMPRESSION    = 9;
    var Z_DEFAULT_COMPRESSION = -1;


    var Z_FILTERED            = 1;
    var Z_HUFFMAN_ONLY        = 2;
    var Z_RLE                 = 3;
    var Z_FIXED               = 4;
    var Z_DEFAULT_STRATEGY    = 0;

    /* Possible values of the data_type field (though see inflate()) */
//var Z_BINARY              = 0;
//var Z_TEXT                = 1;
//var Z_ASCII               = 1; // = Z_TEXT
    var Z_UNKNOWN             = 2;


    /* The deflate compression method */
    var Z_DEFLATED  = 8;

    /*============================================================================*/


    var MAX_MEM_LEVEL = 9;
    /* Maximum value for memLevel in deflateInit2 */
    var MAX_WBITS = 15;
    /* 32K LZ77 window */
    var DEF_MEM_LEVEL = 8;


    var LENGTH_CODES  = 29;
    /* number of length codes, not counting the special END_BLOCK code */
    var LITERALS      = 256;
    /* number of literal bytes 0..255 */
    var L_CODES       = LITERALS + 1 + LENGTH_CODES;
    /* number of Literal or Length codes, including the END_BLOCK code */
    var D_CODES       = 30;
    /* number of distance codes */
    var BL_CODES      = 19;
    /* number of codes used to transfer the bit lengths */
    var HEAP_SIZE     = 2*L_CODES + 1;
    /* maximum heap size */
    var MAX_BITS  = 15;
    /* All codes must not exceed MAX_BITS bits */

    var MIN_MATCH = 3;
    var MAX_MATCH = 258;
    var MIN_LOOKAHEAD = (MAX_MATCH + MIN_MATCH + 1);

    var PRESET_DICT = 0x20;

    var INIT_STATE = 42;
    var EXTRA_STATE = 69;
    var NAME_STATE = 73;
    var COMMENT_STATE = 91;
    var HCRC_STATE = 103;
    var BUSY_STATE = 113;
    var FINISH_STATE = 666;

    var BS_NEED_MORE      = 1; /* block not completed, need more input or more output */
    var BS_BLOCK_DONE     = 2; /* block flush performed */
    var BS_FINISH_STARTED = 3; /* finish started, need only more output at next deflate */
    var BS_FINISH_DONE    = 4; /* finish done, accept no more input or output */

    var OS_CODE = 0x03; // Unix :) . Don't detect, use this default.

    function err(strm, errorCode) {
        strm.msg = msg[errorCode];
        return errorCode;
    }

    function rank(f) {
        return ((f) << 1) - ((f) > 4 ? 9 : 0);
    }

    function zero(buf) { var len = buf.length; while (--len >= 0) { buf[len] = 0; } }


    /* =========================================================================
     * Flush as much pending output as possible. All deflate() output goes
     * through this function so some applications may wish to modify it
     * to avoid allocating a large strm->output buffer and copying into it.
     * (See also read_buf()).
     */
    function flush_pending(strm) {
        var s = strm.state;

        //_tr_flush_bits(s);
        var len = s.pending;
        if (len > strm.avail_out) {
            len = strm.avail_out;
        }
        if (len === 0) { return; }

        utils.arraySet(strm.output, s.pending_buf, s.pending_out, len, strm.next_out);
        strm.next_out += len;
        s.pending_out += len;
        strm.total_out += len;
        strm.avail_out -= len;
        s.pending -= len;
        if (s.pending === 0) {
            s.pending_out = 0;
        }
    }


    function flush_block_only (s, last) {
        trees._tr_flush_block(s, (s.block_start >= 0 ? s.block_start : -1), s.strstart - s.block_start, last);
        s.block_start = s.strstart;
        flush_pending(s.strm);
    }


    function put_byte(s, b) {
        s.pending_buf[s.pending++] = b;
    }


    /* =========================================================================
     * Put a short in the pending buffer. The 16-bit value is put in MSB order.
     * IN assertion: the stream state is correct and there is enough room in
     * pending_buf.
     */
    function putShortMSB(s, b) {
//  put_byte(s, (Byte)(b >> 8));
//  put_byte(s, (Byte)(b & 0xff));
        s.pending_buf[s.pending++] = (b >>> 8) & 0xff;
        s.pending_buf[s.pending++] = b & 0xff;
    }


    /* ===========================================================================
     * Read a new buffer from the current input stream, update the adler32
     * and total number of bytes read.  All deflate() input goes through
     * this function so some applications may wish to modify it to avoid
     * allocating a large strm->input buffer and copying from it.
     * (See also flush_pending()).
     */
    function read_buf(strm, buf, start, size) {
        var len = strm.avail_in;

        if (len > size) { len = size; }
        if (len === 0) { return 0; }

        strm.avail_in -= len;

        utils.arraySet(buf, strm.input, strm.next_in, len, start);
        if (strm.state.wrap === 1) {
            strm.adler = adler32(strm.adler, buf, len, start);
        }

        else if (strm.state.wrap === 2) {
            strm.adler = crc32(strm.adler, buf, len, start);
        }

        strm.next_in += len;
        strm.total_in += len;

        return len;
    }


    /* ===========================================================================
     * Set match_start to the longest match starting at the given string and
     * return its length. Matches shorter or equal to prev_length are discarded,
     * in which case the result is equal to prev_length and match_start is
     * garbage.
     * IN assertions: cur_match is the head of the hash chain for the current
     *   string (strstart) and its distance is <= MAX_DIST, and prev_length >= 1
     * OUT assertion: the match length is not greater than s->lookahead.
     */
    function longest_match(s, cur_match) {
        var chain_length = s.max_chain_length;      /* max hash chain length */
        var scan = s.strstart; /* current string */
        var match;                       /* matched string */
        var len;                           /* length of current match */
        var best_len = s.prev_length;              /* best match length so far */
        var nice_match = s.nice_match;             /* stop if match long enough */
        var limit = (s.strstart > (s.w_size - MIN_LOOKAHEAD)) ?
            s.strstart - (s.w_size - MIN_LOOKAHEAD) : 0/*NIL*/;

        var _win = s.window; // shortcut

        var wmask = s.w_mask;
        var prev  = s.prev;

        /* Stop when cur_match becomes <= limit. To simplify the code,
         * we prevent matches with the string of window index 0.
         */

        var strend = s.strstart + MAX_MATCH;
        var scan_end1  = _win[scan + best_len - 1];
        var scan_end   = _win[scan + best_len];

        /* The code is optimized for HASH_BITS >= 8 and MAX_MATCH-2 multiple of 16.
         * It is easy to get rid of this optimization if necessary.
         */
        // Assert(s->hash_bits >= 8 && MAX_MATCH == 258, "Code too clever");

        /* Do not waste too much time if we already have a good match: */
        if (s.prev_length >= s.good_match) {
            chain_length >>= 2;
        }
        /* Do not look for matches beyond the end of the input. This is necessary
         * to make deflate deterministic.
         */
        if (nice_match > s.lookahead) { nice_match = s.lookahead; }

        // Assert((ulg)s->strstart <= s->window_size-MIN_LOOKAHEAD, "need lookahead");

        do {
            // Assert(cur_match < s->strstart, "no future");
            match = cur_match;

            /* Skip to next match if the match length cannot increase
             * or if the match length is less than 2.  Note that the checks below
             * for insufficient lookahead only occur occasionally for performance
             * reasons.  Therefore uninitialized memory will be accessed, and
             * conditional jumps will be made that depend on those values.
             * However the length of the match is limited to the lookahead, so
             * the output of deflate is not affected by the uninitialized values.
             */

            if (_win[match + best_len]     !== scan_end  ||
                _win[match + best_len - 1] !== scan_end1 ||
                _win[match]                !== _win[scan] ||
                _win[++match]              !== _win[scan + 1]) {
                continue;
            }

            /* The check at best_len-1 can be removed because it will be made
             * again later. (This heuristic is not always a win.)
             * It is not necessary to compare scan[2] and match[2] since they
             * are always equal when the other bytes match, given that
             * the hash keys are equal and that HASH_BITS >= 8.
             */
            scan += 2;
            match++;
            // Assert(*scan == *match, "match[2]?");

            /* We check for insufficient lookahead only every 8th comparison;
             * the 256th check will be made at strstart+258.
             */
            do {
                /*jshint noempty:false*/
            } while (_win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
            _win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
            _win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
            _win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
            scan < strend);

            // Assert(scan <= s->window+(unsigned)(s->window_size-1), "wild scan");

            len = MAX_MATCH - (strend - scan);
            scan = strend - MAX_MATCH;

            if (len > best_len) {
                s.match_start = cur_match;
                best_len = len;
                if (len >= nice_match) {
                    break;
                }
                scan_end1  = _win[scan + best_len - 1];
                scan_end   = _win[scan + best_len];
            }
        } while ((cur_match = prev[cur_match & wmask]) > limit && --chain_length !== 0);

        if (best_len <= s.lookahead) {
            return best_len;
        }
        return s.lookahead;
    }


    /* ===========================================================================
     * Fill the window when the lookahead becomes insufficient.
     * Updates strstart and lookahead.
     *
     * IN assertion: lookahead < MIN_LOOKAHEAD
     * OUT assertions: strstart <= window_size-MIN_LOOKAHEAD
     *    At least one byte has been read, or avail_in == 0; reads are
     *    performed for at least two bytes (required for the zip translate_eol
     *    option -- not supported here).
     */
    function fill_window(s) {
        var _w_size = s.w_size;
        var p, n, m, more, str;

        //Assert(s->lookahead < MIN_LOOKAHEAD, "already enough lookahead");

        do {
            more = s.window_size - s.lookahead - s.strstart;

            // JS ints have 32 bit, block below not needed
            /* Deal with !@#$% 64K limit: */
            //if (sizeof(int) <= 2) {
            //    if (more == 0 && s->strstart == 0 && s->lookahead == 0) {
            //        more = wsize;
            //
            //  } else if (more == (unsigned)(-1)) {
            //        /* Very unlikely, but possible on 16 bit machine if
            //         * strstart == 0 && lookahead == 1 (input done a byte at time)
            //         */
            //        more--;
            //    }
            //}


            /* If the window is almost full and there is insufficient lookahead,
             * move the upper half to the lower one to make room in the upper half.
             */
            if (s.strstart >= _w_size + (_w_size - MIN_LOOKAHEAD)) {

                utils.arraySet(s.window, s.window, _w_size, _w_size, 0);
                s.match_start -= _w_size;
                s.strstart -= _w_size;
                /* we now have strstart >= MAX_DIST */
                s.block_start -= _w_size;

                /* Slide the hash table (could be avoided with 32 bit values
                 at the expense of memory usage). We slide even when level == 0
                 to keep the hash table consistent if we switch back to level > 0
                 later. (Using level 0 permanently is not an optimal usage of
                 zlib, so we don't care about this pathological case.)
                 */

                n = s.hash_size;
                p = n;
                do {
                    m = s.head[--p];
                    s.head[p] = (m >= _w_size ? m - _w_size : 0);
                } while (--n);

                n = _w_size;
                p = n;
                do {
                    m = s.prev[--p];
                    s.prev[p] = (m >= _w_size ? m - _w_size : 0);
                    /* If n is not on any hash chain, prev[n] is garbage but
                     * its value will never be used.
                     */
                } while (--n);

                more += _w_size;
            }
            if (s.strm.avail_in === 0) {
                break;
            }

            /* If there was no sliding:
             *    strstart <= WSIZE+MAX_DIST-1 && lookahead <= MIN_LOOKAHEAD - 1 &&
             *    more == window_size - lookahead - strstart
             * => more >= window_size - (MIN_LOOKAHEAD-1 + WSIZE + MAX_DIST-1)
             * => more >= window_size - 2*WSIZE + 2
             * In the BIG_MEM or MMAP case (not yet supported),
             *   window_size == input_size + MIN_LOOKAHEAD  &&
             *   strstart + s->lookahead <= input_size => more >= MIN_LOOKAHEAD.
             * Otherwise, window_size == 2*WSIZE so more >= 2.
             * If there was sliding, more >= WSIZE. So in all cases, more >= 2.
             */
            //Assert(more >= 2, "more < 2");
            n = read_buf(s.strm, s.window, s.strstart + s.lookahead, more);
            s.lookahead += n;

            /* Initialize the hash value now that we have some input: */
            if (s.lookahead + s.insert >= MIN_MATCH) {
                str = s.strstart - s.insert;
                s.ins_h = s.window[str];

                /* UPDATE_HASH(s, s->ins_h, s->window[str + 1]); */
                s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[str + 1]) & s.hash_mask;
//#if MIN_MATCH != 3
//        Call update_hash() MIN_MATCH-3 more times
//#endif
                while (s.insert) {
                    /* UPDATE_HASH(s, s->ins_h, s->window[str + MIN_MATCH-1]); */
                    s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[str + MIN_MATCH-1]) & s.hash_mask;

                    s.prev[str & s.w_mask] = s.head[s.ins_h];
                    s.head[s.ins_h] = str;
                    str++;
                    s.insert--;
                    if (s.lookahead + s.insert < MIN_MATCH) {
                        break;
                    }
                }
            }
            /* If the whole input has less than MIN_MATCH bytes, ins_h is garbage,
             * but this is not important since only literal bytes will be emitted.
             */

        } while (s.lookahead < MIN_LOOKAHEAD && s.strm.avail_in !== 0);

        /* If the WIN_INIT bytes after the end of the current data have never been
         * written, then zero those bytes in order to avoid memory check reports of
         * the use of uninitialized (or uninitialised as Julian writes) bytes by
         * the longest match routines.  Update the high water mark for the next
         * time through here.  WIN_INIT is set to MAX_MATCH since the longest match
         * routines allow scanning to strstart + MAX_MATCH, ignoring lookahead.
         */
//  if (s.high_water < s.window_size) {
//    var curr = s.strstart + s.lookahead;
//    var init = 0;
//
//    if (s.high_water < curr) {
//      /* Previous high water mark below current data -- zero WIN_INIT
//       * bytes or up to end of window, whichever is less.
//       */
//      init = s.window_size - curr;
//      if (init > WIN_INIT)
//        init = WIN_INIT;
//      zmemzero(s->window + curr, (unsigned)init);
//      s->high_water = curr + init;
//    }
//    else if (s->high_water < (ulg)curr + WIN_INIT) {
//      /* High water mark at or above current data, but below current data
//       * plus WIN_INIT -- zero out to current data plus WIN_INIT, or up
//       * to end of window, whichever is less.
//       */
//      init = (ulg)curr + WIN_INIT - s->high_water;
//      if (init > s->window_size - s->high_water)
//        init = s->window_size - s->high_water;
//      zmemzero(s->window + s->high_water, (unsigned)init);
//      s->high_water += init;
//    }
//  }
//
//  Assert((ulg)s->strstart <= s->window_size - MIN_LOOKAHEAD,
//    "not enough room for search");
    }

    /* ===========================================================================
     * Copy without compression as much as possible from the input stream, return
     * the current block state.
     * This function does not insert new strings in the dictionary since
     * uncompressible data is probably not useful. This function is used
     * only for the level=0 compression option.
     * NOTE: this function should be optimized to avoid extra copying from
     * window to pending_buf.
     */
    function deflate_stored(s, flush) {
        /* Stored blocks are limited to 0xffff bytes, pending_buf is limited
         * to pending_buf_size, and each stored block has a 5 byte header:
         */
        var max_block_size = 0xffff;

        if (max_block_size > s.pending_buf_size - 5) {
            max_block_size = s.pending_buf_size - 5;
        }

        /* Copy as much as possible from input to output: */
        for (;;) {
            /* Fill the window as much as possible: */
            if (s.lookahead <= 1) {

                //Assert(s->strstart < s->w_size+MAX_DIST(s) ||
                //  s->block_start >= (long)s->w_size, "slide too late");
//      if (!(s.strstart < s.w_size + (s.w_size - MIN_LOOKAHEAD) ||
//        s.block_start >= s.w_size)) {
//        throw  new Error("slide too late");
//      }

                fill_window(s);
                if (s.lookahead === 0 && flush === Z_NO_FLUSH) {
                    return BS_NEED_MORE;
                }

                if (s.lookahead === 0) {
                    break;
                }
                /* flush the current block */
            }
            //Assert(s->block_start >= 0L, "block gone");
//    if (s.block_start < 0) throw new Error("block gone");

            s.strstart += s.lookahead;
            s.lookahead = 0;

            /* Emit a stored block if pending_buf will be full: */
            var max_start = s.block_start + max_block_size;

            if (s.strstart === 0 || s.strstart >= max_start) {
                /* strstart == 0 is possible when wraparound on 16-bit machine */
                s.lookahead = s.strstart - max_start;
                s.strstart = max_start;
                /*** FLUSH_BLOCK(s, 0); ***/
                flush_block_only(s, false);
                if (s.strm.avail_out === 0) {
                    return BS_NEED_MORE;
                }
                /***/


            }
            /* Flush if we may have to slide, otherwise block_start may become
             * negative and the data will be gone:
             */
            if (s.strstart - s.block_start >= (s.w_size - MIN_LOOKAHEAD)) {
                /*** FLUSH_BLOCK(s, 0); ***/
                flush_block_only(s, false);
                if (s.strm.avail_out === 0) {
                    return BS_NEED_MORE;
                }
                /***/
            }
        }

        s.insert = 0;

        if (flush === Z_FINISH) {
            /*** FLUSH_BLOCK(s, 1); ***/
            flush_block_only(s, true);
            if (s.strm.avail_out === 0) {
                return BS_FINISH_STARTED;
            }
            /***/
            return BS_FINISH_DONE;
        }

        if (s.strstart > s.block_start) {
            /*** FLUSH_BLOCK(s, 0); ***/
            flush_block_only(s, false);
            if (s.strm.avail_out === 0) {
                return BS_NEED_MORE;
            }
            /***/
        }

        return BS_NEED_MORE;
    }

    /* ===========================================================================
     * Compress as much as possible from the input stream, return the current
     * block state.
     * This function does not perform lazy evaluation of matches and inserts
     * new strings in the dictionary only for unmatched strings or for short
     * matches. It is used only for the fast compression options.
     */
    function deflate_fast(s, flush) {
        var hash_head;        /* head of the hash chain */
        var bflush;           /* set if current block must be flushed */

        for (;;) {
            /* Make sure that we always have enough lookahead, except
             * at the end of the input file. We need MAX_MATCH bytes
             * for the next match, plus MIN_MATCH bytes to insert the
             * string following the next match.
             */
            if (s.lookahead < MIN_LOOKAHEAD) {
                fill_window(s);
                if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) {
                    return BS_NEED_MORE;
                }
                if (s.lookahead === 0) {
                    break; /* flush the current block */
                }
            }

            /* Insert the string window[strstart .. strstart+2] in the
             * dictionary, and set hash_head to the head of the hash chain:
             */
            hash_head = 0/*NIL*/;
            if (s.lookahead >= MIN_MATCH) {
                /*** INSERT_STRING(s, s.strstart, hash_head); ***/
                s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
                hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
                s.head[s.ins_h] = s.strstart;
                /***/
            }

            /* Find the longest match, discarding those <= prev_length.
             * At this point we have always match_length < MIN_MATCH
             */
            if (hash_head !== 0/*NIL*/ && ((s.strstart - hash_head) <= (s.w_size - MIN_LOOKAHEAD))) {
                /* To simplify the code, we prevent matches with the string
                 * of window index 0 (in particular we have to avoid a match
                 * of the string with itself at the start of the input file).
                 */
                s.match_length = longest_match(s, hash_head);
                /* longest_match() sets match_start */
            }
            if (s.match_length >= MIN_MATCH) {
                // check_match(s, s.strstart, s.match_start, s.match_length); // for debug only

                /*** _tr_tally_dist(s, s.strstart - s.match_start,
                 s.match_length - MIN_MATCH, bflush); ***/
                bflush = trees._tr_tally(s, s.strstart - s.match_start, s.match_length - MIN_MATCH);

                s.lookahead -= s.match_length;

                /* Insert new strings in the hash table only if the match length
                 * is not too large. This saves time but degrades compression.
                 */
                if (s.match_length <= s.max_lazy_match/*max_insert_length*/ && s.lookahead >= MIN_MATCH) {
                    s.match_length--; /* string at strstart already in table */
                    do {
                        s.strstart++;
                        /*** INSERT_STRING(s, s.strstart, hash_head); ***/
                        s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
                        hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
                        s.head[s.ins_h] = s.strstart;
                        /***/
                        /* strstart never exceeds WSIZE-MAX_MATCH, so there are
                         * always MIN_MATCH bytes ahead.
                         */
                    } while (--s.match_length !== 0);
                    s.strstart++;
                } else
                {
                    s.strstart += s.match_length;
                    s.match_length = 0;
                    s.ins_h = s.window[s.strstart];
                    /* UPDATE_HASH(s, s.ins_h, s.window[s.strstart+1]); */
                    s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + 1]) & s.hash_mask;

//#if MIN_MATCH != 3
//                Call UPDATE_HASH() MIN_MATCH-3 more times
//#endif
                    /* If lookahead < MIN_MATCH, ins_h is garbage, but it does not
                     * matter since it will be recomputed at next deflate call.
                     */
                }
            } else {
                /* No match, output a literal byte */
                //Tracevv((stderr,"%c", s.window[s.strstart]));
                /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
                bflush = trees._tr_tally(s, 0, s.window[s.strstart]);

                s.lookahead--;
                s.strstart++;
            }
            if (bflush) {
                /*** FLUSH_BLOCK(s, 0); ***/
                flush_block_only(s, false);
                if (s.strm.avail_out === 0) {
                    return BS_NEED_MORE;
                }
                /***/
            }
        }
        s.insert = ((s.strstart < (MIN_MATCH-1)) ? s.strstart : MIN_MATCH-1);
        if (flush === Z_FINISH) {
            /*** FLUSH_BLOCK(s, 1); ***/
            flush_block_only(s, true);
            if (s.strm.avail_out === 0) {
                return BS_FINISH_STARTED;
            }
            /***/
            return BS_FINISH_DONE;
        }
        if (s.last_lit) {
            /*** FLUSH_BLOCK(s, 0); ***/
            flush_block_only(s, false);
            if (s.strm.avail_out === 0) {
                return BS_NEED_MORE;
            }
            /***/
        }
        return BS_BLOCK_DONE;
    }

    /* ===========================================================================
     * Same as above, but achieves better compression. We use a lazy
     * evaluation for matches: a match is finally adopted only if there is
     * no better match at the next window position.
     */
    function deflate_slow(s, flush) {
        var hash_head;          /* head of hash chain */
        var bflush;              /* set if current block must be flushed */

        var max_insert;

        /* Process the input block. */
        for (;;) {
            /* Make sure that we always have enough lookahead, except
             * at the end of the input file. We need MAX_MATCH bytes
             * for the next match, plus MIN_MATCH bytes to insert the
             * string following the next match.
             */
            if (s.lookahead < MIN_LOOKAHEAD) {
                fill_window(s);
                if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) {
                    return BS_NEED_MORE;
                }
                if (s.lookahead === 0) { break; } /* flush the current block */
            }

            /* Insert the string window[strstart .. strstart+2] in the
             * dictionary, and set hash_head to the head of the hash chain:
             */
            hash_head = 0/*NIL*/;
            if (s.lookahead >= MIN_MATCH) {
                /*** INSERT_STRING(s, s.strstart, hash_head); ***/
                s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
                hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
                s.head[s.ins_h] = s.strstart;
                /***/
            }

            /* Find the longest match, discarding those <= prev_length.
             */
            s.prev_length = s.match_length;
            s.prev_match = s.match_start;
            s.match_length = MIN_MATCH-1;

            if (hash_head !== 0/*NIL*/ && s.prev_length < s.max_lazy_match &&
                s.strstart - hash_head <= (s.w_size-MIN_LOOKAHEAD)/*MAX_DIST(s)*/) {
                /* To simplify the code, we prevent matches with the string
                 * of window index 0 (in particular we have to avoid a match
                 * of the string with itself at the start of the input file).
                 */
                s.match_length = longest_match(s, hash_head);
                /* longest_match() sets match_start */

                if (s.match_length <= 5 &&
                    (s.strategy === Z_FILTERED || (s.match_length === MIN_MATCH && s.strstart - s.match_start > 4096/*TOO_FAR*/))) {

                    /* If prev_match is also MIN_MATCH, match_start is garbage
                     * but we will ignore the current match anyway.
                     */
                    s.match_length = MIN_MATCH-1;
                }
            }
            /* If there was a match at the previous step and the current
             * match is not better, output the previous match:
             */
            if (s.prev_length >= MIN_MATCH && s.match_length <= s.prev_length) {
                max_insert = s.strstart + s.lookahead - MIN_MATCH;
                /* Do not insert strings in hash table beyond this. */

                //check_match(s, s.strstart-1, s.prev_match, s.prev_length);

                /***_tr_tally_dist(s, s.strstart - 1 - s.prev_match,
                 s.prev_length - MIN_MATCH, bflush);***/
                bflush = trees._tr_tally(s, s.strstart - 1- s.prev_match, s.prev_length - MIN_MATCH);
                /* Insert in hash table all strings up to the end of the match.
                 * strstart-1 and strstart are already inserted. If there is not
                 * enough lookahead, the last two strings are not inserted in
                 * the hash table.
                 */
                s.lookahead -= s.prev_length-1;
                s.prev_length -= 2;
                do {
                    if (++s.strstart <= max_insert) {
                        /*** INSERT_STRING(s, s.strstart, hash_head); ***/
                        s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
                        hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
                        s.head[s.ins_h] = s.strstart;
                        /***/
                    }
                } while (--s.prev_length !== 0);
                s.match_available = 0;
                s.match_length = MIN_MATCH-1;
                s.strstart++;

                if (bflush) {
                    /*** FLUSH_BLOCK(s, 0); ***/
                    flush_block_only(s, false);
                    if (s.strm.avail_out === 0) {
                        return BS_NEED_MORE;
                    }
                    /***/
                }

            } else if (s.match_available) {
                /* If there was no match at the previous position, output a
                 * single literal. If there was a match but the current match
                 * is longer, truncate the previous match to a single literal.
                 */
                //Tracevv((stderr,"%c", s->window[s->strstart-1]));
                /*** _tr_tally_lit(s, s.window[s.strstart-1], bflush); ***/
                bflush = trees._tr_tally(s, 0, s.window[s.strstart-1]);

                if (bflush) {
                    /*** FLUSH_BLOCK_ONLY(s, 0) ***/
                    flush_block_only(s, false);
                    /***/
                }
                s.strstart++;
                s.lookahead--;
                if (s.strm.avail_out === 0) {
                    return BS_NEED_MORE;
                }
            } else {
                /* There is no previous match to compare with, wait for
                 * the next step to decide.
                 */
                s.match_available = 1;
                s.strstart++;
                s.lookahead--;
            }
        }
        //Assert (flush != Z_NO_FLUSH, "no flush?");
        if (s.match_available) {
            //Tracevv((stderr,"%c", s->window[s->strstart-1]));
            /*** _tr_tally_lit(s, s.window[s.strstart-1], bflush); ***/
            bflush = trees._tr_tally(s, 0, s.window[s.strstart-1]);

            s.match_available = 0;
        }
        s.insert = s.strstart < MIN_MATCH-1 ? s.strstart : MIN_MATCH-1;
        if (flush === Z_FINISH) {
            /*** FLUSH_BLOCK(s, 1); ***/
            flush_block_only(s, true);
            if (s.strm.avail_out === 0) {
                return BS_FINISH_STARTED;
            }
            /***/
            return BS_FINISH_DONE;
        }
        if (s.last_lit) {
            /*** FLUSH_BLOCK(s, 0); ***/
            flush_block_only(s, false);
            if (s.strm.avail_out === 0) {
                return BS_NEED_MORE;
            }
            /***/
        }

        return BS_BLOCK_DONE;
    }


    /* ===========================================================================
     * For Z_RLE, simply look for runs of bytes, generate matches only of distance
     * one.  Do not maintain a hash table.  (It will be regenerated if this run of
     * deflate switches away from Z_RLE.)
     */
    function deflate_rle(s, flush) {
        var bflush;            /* set if current block must be flushed */
        var prev;              /* byte at distance one to match */
        var scan, strend;      /* scan goes up to strend for length of run */

        var _win = s.window;

        for (;;) {
            /* Make sure that we always have enough lookahead, except
             * at the end of the input file. We need MAX_MATCH bytes
             * for the longest run, plus one for the unrolled loop.
             */
            if (s.lookahead <= MAX_MATCH) {
                fill_window(s);
                if (s.lookahead <= MAX_MATCH && flush === Z_NO_FLUSH) {
                    return BS_NEED_MORE;
                }
                if (s.lookahead === 0) { break; } /* flush the current block */
            }

            /* See how many times the previous byte repeats */
            s.match_length = 0;
            if (s.lookahead >= MIN_MATCH && s.strstart > 0) {
                scan = s.strstart - 1;
                prev = _win[scan];
                if (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan]) {
                    strend = s.strstart + MAX_MATCH;
                    do {
                        /*jshint noempty:false*/
                    } while (prev === _win[++scan] && prev === _win[++scan] &&
                    prev === _win[++scan] && prev === _win[++scan] &&
                    prev === _win[++scan] && prev === _win[++scan] &&
                    prev === _win[++scan] && prev === _win[++scan] &&
                    scan < strend);
                    s.match_length = MAX_MATCH - (strend - scan);
                    if (s.match_length > s.lookahead) {
                        s.match_length = s.lookahead;
                    }
                }
                //Assert(scan <= s->window+(uInt)(s->window_size-1), "wild scan");
            }

            /* Emit match if have run of MIN_MATCH or longer, else emit literal */
            if (s.match_length >= MIN_MATCH) {
                //check_match(s, s.strstart, s.strstart - 1, s.match_length);

                /*** _tr_tally_dist(s, 1, s.match_length - MIN_MATCH, bflush); ***/
                bflush = trees._tr_tally(s, 1, s.match_length - MIN_MATCH);

                s.lookahead -= s.match_length;
                s.strstart += s.match_length;
                s.match_length = 0;
            } else {
                /* No match, output a literal byte */
                //Tracevv((stderr,"%c", s->window[s->strstart]));
                /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
                bflush = trees._tr_tally(s, 0, s.window[s.strstart]);

                s.lookahead--;
                s.strstart++;
            }
            if (bflush) {
                /*** FLUSH_BLOCK(s, 0); ***/
                flush_block_only(s, false);
                if (s.strm.avail_out === 0) {
                    return BS_NEED_MORE;
                }
                /***/
            }
        }
        s.insert = 0;
        if (flush === Z_FINISH) {
            /*** FLUSH_BLOCK(s, 1); ***/
            flush_block_only(s, true);
            if (s.strm.avail_out === 0) {
                return BS_FINISH_STARTED;
            }
            /***/
            return BS_FINISH_DONE;
        }
        if (s.last_lit) {
            /*** FLUSH_BLOCK(s, 0); ***/
            flush_block_only(s, false);
            if (s.strm.avail_out === 0) {
                return BS_NEED_MORE;
            }
            /***/
        }
        return BS_BLOCK_DONE;
    }

    /* ===========================================================================
     * For Z_HUFFMAN_ONLY, do not look for matches.  Do not maintain a hash table.
     * (It will be regenerated if this run of deflate switches away from Huffman.)
     */
    function deflate_huff(s, flush) {
        var bflush;             /* set if current block must be flushed */

        for (;;) {
            /* Make sure that we have a literal to write. */
            if (s.lookahead === 0) {
                fill_window(s);
                if (s.lookahead === 0) {
                    if (flush === Z_NO_FLUSH) {
                        return BS_NEED_MORE;
                    }
                    break;      /* flush the current block */
                }
            }

            /* Output a literal byte */
            s.match_length = 0;
            //Tracevv((stderr,"%c", s->window[s->strstart]));
            /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
            bflush = trees._tr_tally(s, 0, s.window[s.strstart]);
            s.lookahead--;
            s.strstart++;
            if (bflush) {
                /*** FLUSH_BLOCK(s, 0); ***/
                flush_block_only(s, false);
                if (s.strm.avail_out === 0) {
                    return BS_NEED_MORE;
                }
                /***/
            }
        }
        s.insert = 0;
        if (flush === Z_FINISH) {
            /*** FLUSH_BLOCK(s, 1); ***/
            flush_block_only(s, true);
            if (s.strm.avail_out === 0) {
                return BS_FINISH_STARTED;
            }
            /***/
            return BS_FINISH_DONE;
        }
        if (s.last_lit) {
            /*** FLUSH_BLOCK(s, 0); ***/
            flush_block_only(s, false);
            if (s.strm.avail_out === 0) {
                return BS_NEED_MORE;
            }
            /***/
        }
        return BS_BLOCK_DONE;
    }

    /* Values for max_lazy_match, good_match and max_chain_length, depending on
     * the desired pack level (0..9). The values given below have been tuned to
     * exclude worst case performance for pathological files. Better values may be
     * found for specific files.
     */
    var Config = function (good_length, max_lazy, nice_length, max_chain, func) {
        this.good_length = good_length;
        this.max_lazy = max_lazy;
        this.nice_length = nice_length;
        this.max_chain = max_chain;
        this.func = func;
    };

    var configuration_table;

    configuration_table = [
        /*      good lazy nice chain */
        new Config(0, 0, 0, 0, deflate_stored),          /* 0 store only */
        new Config(4, 4, 8, 4, deflate_fast),            /* 1 max speed, no lazy matches */
        new Config(4, 5, 16, 8, deflate_fast),           /* 2 */
        new Config(4, 6, 32, 32, deflate_fast),          /* 3 */

        new Config(4, 4, 16, 16, deflate_slow),          /* 4 lazy matches */
        new Config(8, 16, 32, 32, deflate_slow),         /* 5 */
        new Config(8, 16, 128, 128, deflate_slow),       /* 6 */
        new Config(8, 32, 128, 256, deflate_slow),       /* 7 */
        new Config(32, 128, 258, 1024, deflate_slow),    /* 8 */
        new Config(32, 258, 258, 4096, deflate_slow)     /* 9 max compression */
    ];


    /* ===========================================================================
     * Initialize the "longest match" routines for a new zlib stream
     */
    function lm_init(s) {
        s.window_size = 2 * s.w_size;

        /*** CLEAR_HASH(s); ***/
        zero(s.head); // Fill with NIL (= 0);

        /* Set the default configuration parameters:
         */
        s.max_lazy_match = configuration_table[s.level].max_lazy;
        s.good_match = configuration_table[s.level].good_length;
        s.nice_match = configuration_table[s.level].nice_length;
        s.max_chain_length = configuration_table[s.level].max_chain;

        s.strstart = 0;
        s.block_start = 0;
        s.lookahead = 0;
        s.insert = 0;
        s.match_length = s.prev_length = MIN_MATCH - 1;
        s.match_available = 0;
        s.ins_h = 0;
    }


    function DeflateState() {
        this.strm = null;            /* pointer back to this zlib stream */
        this.status = 0;            /* as the name implies */
        this.pending_buf = null;      /* output still pending */
        this.pending_buf_size = 0;  /* size of pending_buf */
        this.pending_out = 0;       /* next pending byte to output to the stream */
        this.pending = 0;           /* nb of bytes in the pending buffer */
        this.wrap = 0;              /* bit 0 true for zlib, bit 1 true for gzip */
        this.gzhead = null;         /* gzip header information to write */
        this.gzindex = 0;           /* where in extra, name, or comment */
        this.method = Z_DEFLATED; /* can only be DEFLATED */
        this.last_flush = -1;   /* value of flush param for previous deflate call */

        this.w_size = 0;  /* LZ77 window size (32K by default) */
        this.w_bits = 0;  /* log2(w_size)  (8..16) */
        this.w_mask = 0;  /* w_size - 1 */

        this.window = null;
        /* Sliding window. Input bytes are read into the second half of the window,
         * and move to the first half later to keep a dictionary of at least wSize
         * bytes. With this organization, matches are limited to a distance of
         * wSize-MAX_MATCH bytes, but this ensures that IO is always
         * performed with a length multiple of the block size.
         */

        this.window_size = 0;
        /* Actual size of window: 2*wSize, except when the user input buffer
         * is directly used as sliding window.
         */

        this.prev = null;
        /* Link to older string with same hash index. To limit the size of this
         * array to 64K, this link is maintained only for the last 32K strings.
         * An index in this array is thus a window index modulo 32K.
         */

        this.head = null;   /* Heads of the hash chains or NIL. */

        this.ins_h = 0;       /* hash index of string to be inserted */
        this.hash_size = 0;   /* number of elements in hash table */
        this.hash_bits = 0;   /* log2(hash_size) */
        this.hash_mask = 0;   /* hash_size-1 */

        this.hash_shift = 0;
        /* Number of bits by which ins_h must be shifted at each input
         * step. It must be such that after MIN_MATCH steps, the oldest
         * byte no longer takes part in the hash key, that is:
         *   hash_shift * MIN_MATCH >= hash_bits
         */

        this.block_start = 0;
        /* Window position at the beginning of the current output block. Gets
         * negative when the window is moved backwards.
         */

        this.match_length = 0;      /* length of best match */
        this.prev_match = 0;        /* previous match */
        this.match_available = 0;   /* set if previous match exists */
        this.strstart = 0;          /* start of string to insert */
        this.match_start = 0;       /* start of matching string */
        this.lookahead = 0;         /* number of valid bytes ahead in window */

        this.prev_length = 0;
        /* Length of the best match at previous step. Matches not greater than this
         * are discarded. This is used in the lazy match evaluation.
         */

        this.max_chain_length = 0;
        /* To speed up deflation, hash chains are never searched beyond this
         * length.  A higher limit improves compression ratio but degrades the
         * speed.
         */

        this.max_lazy_match = 0;
        /* Attempt to find a better match only when the current match is strictly
         * smaller than this value. This mechanism is used only for compression
         * levels >= 4.
         */
        // That's alias to max_lazy_match, don't use directly
        //this.max_insert_length = 0;
        /* Insert new strings in the hash table only if the match length is not
         * greater than this length. This saves time but degrades compression.
         * max_insert_length is used only for compression levels <= 3.
         */

        this.level = 0;     /* compression level (1..9) */
        this.strategy = 0;  /* favor or force Huffman coding*/

        this.good_match = 0;
        /* Use a faster search when the previous match is longer than this */

        this.nice_match = 0; /* Stop searching when current match exceeds this */

        /* used by trees.c: */

        /* Didn't use ct_data typedef below to suppress compiler warning */

        // struct ct_data_s dyn_ltree[HEAP_SIZE];   /* literal and length tree */
        // struct ct_data_s dyn_dtree[2*D_CODES+1]; /* distance tree */
        // struct ct_data_s bl_tree[2*BL_CODES+1];  /* Huffman tree for bit lengths */

        // Use flat array of DOUBLE size, with interleaved fata,
        // because JS does not support effective
        this.dyn_ltree  = new utils.Buf16(HEAP_SIZE * 2);
        this.dyn_dtree  = new utils.Buf16((2*D_CODES+1) * 2);
        this.bl_tree    = new utils.Buf16((2*BL_CODES+1) * 2);
        zero(this.dyn_ltree);
        zero(this.dyn_dtree);
        zero(this.bl_tree);

        this.l_desc   = null;         /* desc. for literal tree */
        this.d_desc   = null;         /* desc. for distance tree */
        this.bl_desc  = null;         /* desc. for bit length tree */

        //ush bl_count[MAX_BITS+1];
        this.bl_count = new utils.Buf16(MAX_BITS+1);
        /* number of codes at each bit length for an optimal tree */

        //int heap[2*L_CODES+1];      /* heap used to build the Huffman trees */
        this.heap = new utils.Buf16(2*L_CODES+1);  /* heap used to build the Huffman trees */
        zero(this.heap);

        this.heap_len = 0;               /* number of elements in the heap */
        this.heap_max = 0;               /* element of largest frequency */
        /* The sons of heap[n] are heap[2*n] and heap[2*n+1]. heap[0] is not used.
         * The same heap array is used to build all trees.
         */

        this.depth = new utils.Buf16(2*L_CODES+1); //uch depth[2*L_CODES+1];
        zero(this.depth);
        /* Depth of each subtree used as tie breaker for trees of equal frequency
         */

        this.l_buf = 0;          /* buffer index for literals or lengths */

        this.lit_bufsize = 0;
        /* Size of match buffer for literals/lengths.  There are 4 reasons for
         * limiting lit_bufsize to 64K:
         *   - frequencies can be kept in 16 bit counters
         *   - if compression is not successful for the first block, all input
         *     data is still in the window so we can still emit a stored block even
         *     when input comes from standard input.  (This can also be done for
         *     all blocks if lit_bufsize is not greater than 32K.)
         *   - if compression is not successful for a file smaller than 64K, we can
         *     even emit a stored file instead of a stored block (saving 5 bytes).
         *     This is applicable only for zip (not gzip or zlib).
         *   - creating new Huffman trees less frequently may not provide fast
         *     adaptation to changes in the input data statistics. (Take for
         *     example a binary file with poorly compressible code followed by
         *     a highly compressible string table.) Smaller buffer sizes give
         *     fast adaptation but have of course the overhead of transmitting
         *     trees more frequently.
         *   - I can't count above 4
         */

        this.last_lit = 0;      /* running index in l_buf */

        this.d_buf = 0;
        /* Buffer index for distances. To simplify the code, d_buf and l_buf have
         * the same number of elements. To use different lengths, an extra flag
         * array would be necessary.
         */

        this.opt_len = 0;       /* bit length of current block with optimal trees */
        this.static_len = 0;    /* bit length of current block with static trees */
        this.matches = 0;       /* number of string matches in current block */
        this.insert = 0;        /* bytes at end of window left to insert */


        this.bi_buf = 0;
        /* Output buffer. bits are inserted starting at the bottom (least
         * significant bits).
         */
        this.bi_valid = 0;
        /* Number of valid bits in bi_buf.  All bits above the last valid bit
         * are always zero.
         */

        // Used for window memory init. We safely ignore it for JS. That makes
        // sense only for pointers and memory check tools.
        //this.high_water = 0;
        /* High water mark offset in window for initialized bytes -- bytes above
         * this are set to zero in order to avoid memory check warnings when
         * longest match routines access bytes past the input.  This is then
         * updated to the new high water mark.
         */
    }


    function deflateResetKeep(strm) {
        var s;

        if (!strm || !strm.state) {
            return err(strm, Z_STREAM_ERROR);
        }

        strm.total_in = strm.total_out = 0;
        strm.data_type = Z_UNKNOWN;

        s = strm.state;
        s.pending = 0;
        s.pending_out = 0;

        if (s.wrap < 0) {
            s.wrap = -s.wrap;
            /* was made negative by deflate(..., Z_FINISH); */
        }
        s.status = (s.wrap ? INIT_STATE : BUSY_STATE);
        strm.adler = (s.wrap === 2) ?
            0  // crc32(0, Z_NULL, 0)
            :
            1; // adler32(0, Z_NULL, 0)
        s.last_flush = Z_NO_FLUSH;
        trees._tr_init(s);
        return Z_OK;
    }


    function deflateReset(strm) {
        var ret = deflateResetKeep(strm);
        if (ret === Z_OK) {
            lm_init(strm.state);
        }
        return ret;
    }


    function deflateSetHeader(strm, head) {
        if (!strm || !strm.state) { return Z_STREAM_ERROR; }
        if (strm.state.wrap !== 2) { return Z_STREAM_ERROR; }
        strm.state.gzhead = head;
        return Z_OK;
    }


    function deflateInit2(strm, level, method, windowBits, memLevel, strategy) {
        if (!strm) { // === Z_NULL
            return Z_STREAM_ERROR;
        }
        var wrap = 1;

        if (level === Z_DEFAULT_COMPRESSION) {
            level = 6;
        }

        if (windowBits < 0) { /* suppress zlib wrapper */
            wrap = 0;
            windowBits = -windowBits;
        }

        else if (windowBits > 15) {
            wrap = 2;           /* write gzip wrapper instead */
            windowBits -= 16;
        }


        if (memLevel < 1 || memLevel > MAX_MEM_LEVEL || method !== Z_DEFLATED ||
            windowBits < 8 || windowBits > 15 || level < 0 || level > 9 ||
            strategy < 0 || strategy > Z_FIXED) {
            return err(strm, Z_STREAM_ERROR);
        }


        if (windowBits === 8) {
            windowBits = 9;
        }
        /* until 256-byte window bug fixed */

        var s = new DeflateState();

        strm.state = s;
        s.strm = strm;

        s.wrap = wrap;
        s.gzhead = null;
        s.w_bits = windowBits;
        s.w_size = 1 << s.w_bits;
        s.w_mask = s.w_size - 1;

        s.hash_bits = memLevel + 7;
        s.hash_size = 1 << s.hash_bits;
        s.hash_mask = s.hash_size - 1;
        s.hash_shift = ~~((s.hash_bits + MIN_MATCH - 1) / MIN_MATCH);

        s.window = new utils.Buf8(s.w_size * 2);
        s.head = new utils.Buf16(s.hash_size);
        s.prev = new utils.Buf16(s.w_size);

        // Don't need mem init magic for JS.
        //s.high_water = 0;  /* nothing written to s->window yet */

        s.lit_bufsize = 1 << (memLevel + 6); /* 16K elements by default */

        s.pending_buf_size = s.lit_bufsize * 4;
        s.pending_buf = new utils.Buf8(s.pending_buf_size);

        s.d_buf = s.lit_bufsize >> 1;
        s.l_buf = (1 + 2) * s.lit_bufsize;

        s.level = level;
        s.strategy = strategy;
        s.method = method;

        return deflateReset(strm);
    }

    function deflateInit(strm, level) {
        return deflateInit2(strm, level, Z_DEFLATED, MAX_WBITS, DEF_MEM_LEVEL, Z_DEFAULT_STRATEGY);
    }


    function deflate(strm, flush) {
        var old_flush, s;
        var beg, val; // for gzip header write only

        if (!strm || !strm.state ||
            flush > Z_BLOCK || flush < 0) {
            return strm ? err(strm, Z_STREAM_ERROR) : Z_STREAM_ERROR;
        }

        s = strm.state;

        if (!strm.output ||
            (!strm.input && strm.avail_in !== 0) ||
            (s.status === FINISH_STATE && flush !== Z_FINISH)) {
            return err(strm, (strm.avail_out === 0) ? Z_BUF_ERROR : Z_STREAM_ERROR);
        }

        s.strm = strm; /* just in case */
        old_flush = s.last_flush;
        s.last_flush = flush;

        /* Write the header */
        if (s.status === INIT_STATE) {

            if (s.wrap === 2) { // GZIP header
                strm.adler = 0;  //crc32(0L, Z_NULL, 0);
                put_byte(s, 31);
                put_byte(s, 139);
                put_byte(s, 8);
                if (!s.gzhead) { // s->gzhead == Z_NULL
                    put_byte(s, 0);
                    put_byte(s, 0);
                    put_byte(s, 0);
                    put_byte(s, 0);
                    put_byte(s, 0);
                    put_byte(s, s.level === 9 ? 2 :
                        (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ?
                            4 : 0));
                    put_byte(s, OS_CODE);
                    s.status = BUSY_STATE;
                }
                else {
                    put_byte(s, (s.gzhead.text ? 1 : 0) +
                        (s.gzhead.hcrc ? 2 : 0) +
                        (!s.gzhead.extra ? 0 : 4) +
                        (!s.gzhead.name ? 0 : 8) +
                        (!s.gzhead.comment ? 0 : 16)
                    );
                    put_byte(s, s.gzhead.time & 0xff);
                    put_byte(s, (s.gzhead.time >> 8) & 0xff);
                    put_byte(s, (s.gzhead.time >> 16) & 0xff);
                    put_byte(s, (s.gzhead.time >> 24) & 0xff);
                    put_byte(s, s.level === 9 ? 2 :
                        (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ?
                            4 : 0));
                    put_byte(s, s.gzhead.os & 0xff);
                    if (s.gzhead.extra && s.gzhead.extra.length) {
                        put_byte(s, s.gzhead.extra.length & 0xff);
                        put_byte(s, (s.gzhead.extra.length >> 8) & 0xff);
                    }
                    if (s.gzhead.hcrc) {
                        strm.adler = crc32(strm.adler, s.pending_buf, s.pending, 0);
                    }
                    s.gzindex = 0;
                    s.status = EXTRA_STATE;
                }
            }
            else // DEFLATE header
            {
                var header = (Z_DEFLATED + ((s.w_bits - 8) << 4)) << 8;
                var level_flags = -1;

                if (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2) {
                    level_flags = 0;
                } else if (s.level < 6) {
                    level_flags = 1;
                } else if (s.level === 6) {
                    level_flags = 2;
                } else {
                    level_flags = 3;
                }
                header |= (level_flags << 6);
                if (s.strstart !== 0) { header |= PRESET_DICT; }
                header += 31 - (header % 31);

                s.status = BUSY_STATE;
                putShortMSB(s, header);

                /* Save the adler32 of the preset dictionary: */
                if (s.strstart !== 0) {
                    putShortMSB(s, strm.adler >>> 16);
                    putShortMSB(s, strm.adler & 0xffff);
                }
                strm.adler = 1; // adler32(0L, Z_NULL, 0);
            }
        }

//#ifdef GZIP
        if (s.status === EXTRA_STATE) {
            if (s.gzhead.extra/* != Z_NULL*/) {
                beg = s.pending;  /* start of bytes to update crc */

                while (s.gzindex < (s.gzhead.extra.length & 0xffff)) {
                    if (s.pending === s.pending_buf_size) {
                        if (s.gzhead.hcrc && s.pending > beg) {
                            strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
                        }
                        flush_pending(strm);
                        beg = s.pending;
                        if (s.pending === s.pending_buf_size) {
                            break;
                        }
                    }
                    put_byte(s, s.gzhead.extra[s.gzindex] & 0xff);
                    s.gzindex++;
                }
                if (s.gzhead.hcrc && s.pending > beg) {
                    strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
                }
                if (s.gzindex === s.gzhead.extra.length) {
                    s.gzindex = 0;
                    s.status = NAME_STATE;
                }
            }
            else {
                s.status = NAME_STATE;
            }
        }
        if (s.status === NAME_STATE) {
            if (s.gzhead.name/* != Z_NULL*/) {
                beg = s.pending;  /* start of bytes to update crc */
                //int val;

                do {
                    if (s.pending === s.pending_buf_size) {
                        if (s.gzhead.hcrc && s.pending > beg) {
                            strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
                        }
                        flush_pending(strm);
                        beg = s.pending;
                        if (s.pending === s.pending_buf_size) {
                            val = 1;
                            break;
                        }
                    }
                    // JS specific: little magic to add zero terminator to end of string
                    if (s.gzindex < s.gzhead.name.length) {
                        val = s.gzhead.name.charCodeAt(s.gzindex++) & 0xff;
                    } else {
                        val = 0;
                    }
                    put_byte(s, val);
                } while (val !== 0);

                if (s.gzhead.hcrc && s.pending > beg) {
                    strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
                }
                if (val === 0) {
                    s.gzindex = 0;
                    s.status = COMMENT_STATE;
                }
            }
            else {
                s.status = COMMENT_STATE;
            }
        }
        if (s.status === COMMENT_STATE) {
            if (s.gzhead.comment/* != Z_NULL*/) {
                beg = s.pending;  /* start of bytes to update crc */
                //int val;

                do {
                    if (s.pending === s.pending_buf_size) {
                        if (s.gzhead.hcrc && s.pending > beg) {
                            strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
                        }
                        flush_pending(strm);
                        beg = s.pending;
                        if (s.pending === s.pending_buf_size) {
                            val = 1;
                            break;
                        }
                    }
                    // JS specific: little magic to add zero terminator to end of string
                    if (s.gzindex < s.gzhead.comment.length) {
                        val = s.gzhead.comment.charCodeAt(s.gzindex++) & 0xff;
                    } else {
                        val = 0;
                    }
                    put_byte(s, val);
                } while (val !== 0);

                if (s.gzhead.hcrc && s.pending > beg) {
                    strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
                }
                if (val === 0) {
                    s.status = HCRC_STATE;
                }
            }
            else {
                s.status = HCRC_STATE;
            }
        }
        if (s.status === HCRC_STATE) {
            if (s.gzhead.hcrc) {
                if (s.pending + 2 > s.pending_buf_size) {
                    flush_pending(strm);
                }
                if (s.pending + 2 <= s.pending_buf_size) {
                    put_byte(s, strm.adler & 0xff);
                    put_byte(s, (strm.adler >> 8) & 0xff);
                    strm.adler = 0; //crc32(0L, Z_NULL, 0);
                    s.status = BUSY_STATE;
                }
            }
            else {
                s.status = BUSY_STATE;
            }
        }
//#endif

        /* Flush as much pending output as possible */
        if (s.pending !== 0) {
            flush_pending(strm);
            if (strm.avail_out === 0) {
                /* Since avail_out is 0, deflate will be called again with
                 * more output space, but possibly with both pending and
                 * avail_in equal to zero. There won't be anything to do,
                 * but this is not an error situation so make sure we
                 * return OK instead of BUF_ERROR at next call of deflate:
                 */
                s.last_flush = -1;
                return Z_OK;
            }

            /* Make sure there is something to do and avoid duplicate consecutive
             * flushes. For repeated and useless calls with Z_FINISH, we keep
             * returning Z_STREAM_END instead of Z_BUF_ERROR.
             */
        } else if (strm.avail_in === 0 && rank(flush) <= rank(old_flush) &&
            flush !== Z_FINISH) {
            return err(strm, Z_BUF_ERROR);
        }

        /* User must not provide more input after the first FINISH: */
        if (s.status === FINISH_STATE && strm.avail_in !== 0) {
            return err(strm, Z_BUF_ERROR);
        }

        /* Start a new block or continue the current one.
         */
        if (strm.avail_in !== 0 || s.lookahead !== 0 ||
            (flush !== Z_NO_FLUSH && s.status !== FINISH_STATE)) {
            var bstate = (s.strategy === Z_HUFFMAN_ONLY) ? deflate_huff(s, flush) :
                (s.strategy === Z_RLE ? deflate_rle(s, flush) :
                    configuration_table[s.level].func(s, flush));

            if (bstate === BS_FINISH_STARTED || bstate === BS_FINISH_DONE) {
                s.status = FINISH_STATE;
            }
            if (bstate === BS_NEED_MORE || bstate === BS_FINISH_STARTED) {
                if (strm.avail_out === 0) {
                    s.last_flush = -1;
                    /* avoid BUF_ERROR next call, see above */
                }
                return Z_OK;
                /* If flush != Z_NO_FLUSH && avail_out == 0, the next call
                 * of deflate should use the same flush parameter to make sure
                 * that the flush is complete. So we don't have to output an
                 * empty block here, this will be done at next call. This also
                 * ensures that for a very small output buffer, we emit at most
                 * one empty block.
                 */
            }
            if (bstate === BS_BLOCK_DONE) {
                if (flush === Z_PARTIAL_FLUSH) {
                    trees._tr_align(s);
                }
                else if (flush !== Z_BLOCK) { /* FULL_FLUSH or SYNC_FLUSH */

                    trees._tr_stored_block(s, 0, 0, false);
                    /* For a full flush, this empty block will be recognized
                     * as a special marker by inflate_sync().
                     */
                    if (flush === Z_FULL_FLUSH) {
                        /*** CLEAR_HASH(s); ***/             /* forget history */
                        zero(s.head); // Fill with NIL (= 0);

                        if (s.lookahead === 0) {
                            s.strstart = 0;
                            s.block_start = 0;
                            s.insert = 0;
                        }
                    }
                }
                flush_pending(strm);
                if (strm.avail_out === 0) {
                    s.last_flush = -1; /* avoid BUF_ERROR at next call, see above */
                    return Z_OK;
                }
            }
        }
        //Assert(strm->avail_out > 0, "bug2");
        //if (strm.avail_out <= 0) { throw new Error("bug2");}

        if (flush !== Z_FINISH) { return Z_OK; }
        if (s.wrap <= 0) { return Z_STREAM_END; }

        /* Write the trailer */
        if (s.wrap === 2) {
            put_byte(s, strm.adler & 0xff);
            put_byte(s, (strm.adler >> 8) & 0xff);
            put_byte(s, (strm.adler >> 16) & 0xff);
            put_byte(s, (strm.adler >> 24) & 0xff);
            put_byte(s, strm.total_in & 0xff);
            put_byte(s, (strm.total_in >> 8) & 0xff);
            put_byte(s, (strm.total_in >> 16) & 0xff);
            put_byte(s, (strm.total_in >> 24) & 0xff);
        }
        else
        {
            putShortMSB(s, strm.adler >>> 16);
            putShortMSB(s, strm.adler & 0xffff);
        }

        flush_pending(strm);
        /* If avail_out is zero, the application will call deflate again
         * to flush the rest.
         */
        if (s.wrap > 0) { s.wrap = -s.wrap; }
        /* write the trailer only once! */
        return s.pending !== 0 ? Z_OK : Z_STREAM_END;
    }

    function deflateEnd(strm) {
        var status;

        if (!strm/*== Z_NULL*/ || !strm.state/*== Z_NULL*/) {
            return Z_STREAM_ERROR;
        }

        status = strm.state.status;
        if (status !== INIT_STATE &&
            status !== EXTRA_STATE &&
            status !== NAME_STATE &&
            status !== COMMENT_STATE &&
            status !== HCRC_STATE &&
            status !== BUSY_STATE &&
            status !== FINISH_STATE
        ) {
            return err(strm, Z_STREAM_ERROR);
        }

        strm.state = null;

        return status === BUSY_STATE ? err(strm, Z_DATA_ERROR) : Z_OK;
    }

    /* =========================================================================
     * Copy the source state to the destination state
     */
//function deflateCopy(dest, source) {
//
//}

    exports.deflateInit = deflateInit;
    exports.deflateInit2 = deflateInit2;
    exports.deflateReset = deflateReset;
    exports.deflateResetKeep = deflateResetKeep;
    exports.deflateSetHeader = deflateSetHeader;
    exports.deflate = deflate;
    exports.deflateEnd = deflateEnd;
    exports.deflateInfo = 'pako deflate (from Nodeca project)';

    /* Not implemented
     exports.deflateBound = deflateBound;
     exports.deflateCopy = deflateCopy;
     exports.deflateSetDictionary = deflateSetDictionary;
     exports.deflateParams = deflateParams;
     exports.deflatePending = deflatePending;
     exports.deflatePrime = deflatePrime;
     exports.deflateTune = deflateTune;
     */

},{"../utils/common":16,"./adler32":18,"./crc32":20,"./messages":26,"./trees":27}],22:[function(require,module,exports){
    'use strict';


    function GZheader() {
        /* true if compressed data believed to be text */
        this.text       = 0;
        /* modification time */
        this.time       = 0;
        /* extra flags (not used when writing a gzip file) */
        this.xflags     = 0;
        /* operating system */
        this.os         = 0;
        /* pointer to extra field or Z_NULL if none */
        this.extra      = null;
        /* extra field length (valid if extra != Z_NULL) */
        this.extra_len  = 0; // Actually, we don't need it in JS,
                             // but leave for few code modifications

        //
        // Setup limits is not necessary because in js we should not preallocate memory
        // for inflate use constant limit in 65536 bytes
        //

        /* space at extra (only when reading header) */
        // this.extra_max  = 0;
        /* pointer to zero-terminated file name or Z_NULL */
        this.name       = '';
        /* space at name (only when reading header) */
        // this.name_max   = 0;
        /* pointer to zero-terminated comment or Z_NULL */
        this.comment    = '';
        /* space at comment (only when reading header) */
        // this.comm_max   = 0;
        /* true if there was or will be a header crc */
        this.hcrc       = 0;
        /* true when done reading gzip header (not used when writing a gzip file) */
        this.done       = false;
    }

    module.exports = GZheader;

},{}],23:[function(require,module,exports){
    'use strict';

// See state defs from inflate.js
    var BAD = 30;       /* got a data error -- remain here until reset */
    var TYPE = 12;      /* i: waiting for type bits, including last-flag bit */

    /*
     Decode literal, length, and distance codes and write out the resulting
     literal and match bytes until either not enough input or output is
     available, an end-of-block is encountered, or a data error is encountered.
     When large enough input and output buffers are supplied to inflate(), for
     example, a 16K input buffer and a 64K output buffer, more than 95% of the
     inflate execution time is spent in this routine.

     Entry assumptions:

     state.mode === LEN
     strm.avail_in >= 6
     strm.avail_out >= 258
     start >= strm.avail_out
     state.bits < 8

     On return, state.mode is one of:

     LEN -- ran out of enough output space or enough available input
     TYPE -- reached end of block code, inflate() to interpret next block
     BAD -- error in block data

     Notes:

     - The maximum input bits used by a length/distance pair is 15 bits for the
     length code, 5 bits for the length extra, 15 bits for the distance code,
     and 13 bits for the distance extra.  This totals 48 bits, or six bytes.
     Therefore if strm.avail_in >= 6, then there is enough input to avoid
     checking for available input while decoding.

     - The maximum bytes that a single length/distance pair can output is 258
     bytes, which is the maximum length that can be coded.  inflate_fast()
     requires strm.avail_out >= 258 for each loop to avoid checking for
     output space.
     */
    module.exports = function inflate_fast(strm, start) {
        var state;
        var _in;                    /* local strm.input */
        var last;                   /* have enough input while in < last */
        var _out;                   /* local strm.output */
        var beg;                    /* inflate()'s initial strm.output */
        var end;                    /* while out < end, enough space available */
//#ifdef INFLATE_STRICT
        var dmax;                   /* maximum distance from zlib header */
//#endif
        var wsize;                  /* window size or zero if not using window */
        var whave;                  /* valid bytes in the window */
        var wnext;                  /* window write index */
        // Use `s_window` instead `window`, avoid conflict with instrumentation tools
        var s_window;               /* allocated sliding window, if wsize != 0 */
        var hold;                   /* local strm.hold */
        var bits;                   /* local strm.bits */
        var lcode;                  /* local strm.lencode */
        var dcode;                  /* local strm.distcode */
        var lmask;                  /* mask for first level of length codes */
        var dmask;                  /* mask for first level of distance codes */
        var here;                   /* retrieved table entry */
        var op;                     /* code bits, operation, extra bits, or */
        /*  window position, window bytes to copy */
        var len;                    /* match length, unused bytes */
        var dist;                   /* match distance */
        var from;                   /* where to copy match from */
        var from_source;


        var input, output; // JS specific, because we have no pointers

        /* copy state to local variables */
        state = strm.state;
        //here = state.here;
        _in = strm.next_in;
        input = strm.input;
        last = _in + (strm.avail_in - 5);
        _out = strm.next_out;
        output = strm.output;
        beg = _out - (start - strm.avail_out);
        end = _out + (strm.avail_out - 257);
//#ifdef INFLATE_STRICT
        dmax = state.dmax;
//#endif
        wsize = state.wsize;
        whave = state.whave;
        wnext = state.wnext;
        s_window = state.window;
        hold = state.hold;
        bits = state.bits;
        lcode = state.lencode;
        dcode = state.distcode;
        lmask = (1 << state.lenbits) - 1;
        dmask = (1 << state.distbits) - 1;


        /* decode literals and length/distances until end-of-block or not enough
         input data or output space */

        top:
            do {
                if (bits < 15) {
                    hold += input[_in++] << bits;
                    bits += 8;
                    hold += input[_in++] << bits;
                    bits += 8;
                }

                here = lcode[hold & lmask];

                dolen:
                    for (;;) { // Goto emulation
                        op = here >>> 24/*here.bits*/;
                        hold >>>= op;
                        bits -= op;
                        op = (here >>> 16) & 0xff/*here.op*/;
                        if (op === 0) {                          /* literal */
                            //Tracevv((stderr, here.val >= 0x20 && here.val < 0x7f ?
                            //        "inflate:         literal '%c'\n" :
                            //        "inflate:         literal 0x%02x\n", here.val));
                            output[_out++] = here & 0xffff/*here.val*/;
                        }
                        else if (op & 16) {                     /* length base */
                            len = here & 0xffff/*here.val*/;
                            op &= 15;                           /* number of extra bits */
                            if (op) {
                                if (bits < op) {
                                    hold += input[_in++] << bits;
                                    bits += 8;
                                }
                                len += hold & ((1 << op) - 1);
                                hold >>>= op;
                                bits -= op;
                            }
                            //Tracevv((stderr, "inflate:         length %u\n", len));
                            if (bits < 15) {
                                hold += input[_in++] << bits;
                                bits += 8;
                                hold += input[_in++] << bits;
                                bits += 8;
                            }
                            here = dcode[hold & dmask];

                            dodist:
                                for (;;) { // goto emulation
                                    op = here >>> 24/*here.bits*/;
                                    hold >>>= op;
                                    bits -= op;
                                    op = (here >>> 16) & 0xff/*here.op*/;

                                    if (op & 16) {                      /* distance base */
                                        dist = here & 0xffff/*here.val*/;
                                        op &= 15;                       /* number of extra bits */
                                        if (bits < op) {
                                            hold += input[_in++] << bits;
                                            bits += 8;
                                            if (bits < op) {
                                                hold += input[_in++] << bits;
                                                bits += 8;
                                            }
                                        }
                                        dist += hold & ((1 << op) - 1);
//#ifdef INFLATE_STRICT
                                        if (dist > dmax) {
                                            strm.msg = 'invalid distance too far back';
                                            state.mode = BAD;
                                            break top;
                                        }
//#endif
                                        hold >>>= op;
                                        bits -= op;
                                        //Tracevv((stderr, "inflate:         distance %u\n", dist));
                                        op = _out - beg;                /* max distance in output */
                                        if (dist > op) {                /* see if copy from window */
                                            op = dist - op;               /* distance back in window */
                                            if (op > whave) {
                                                if (state.sane) {
                                                    strm.msg = 'invalid distance too far back';
                                                    state.mode = BAD;
                                                    break top;
                                                }

// (!) This block is disabled in zlib defailts,
// don't enable it for binary compatibility
//#ifdef INFLATE_ALLOW_INVALID_DISTANCE_TOOFAR_ARRR
//                if (len <= op - whave) {
//                  do {
//                    output[_out++] = 0;
//                  } while (--len);
//                  continue top;
//                }
//                len -= op - whave;
//                do {
//                  output[_out++] = 0;
//                } while (--op > whave);
//                if (op === 0) {
//                  from = _out - dist;
//                  do {
//                    output[_out++] = output[from++];
//                  } while (--len);
//                  continue top;
//                }
//#endif
                                            }
                                            from = 0; // window index
                                            from_source = s_window;
                                            if (wnext === 0) {           /* very common case */
                                                from += wsize - op;
                                                if (op < len) {         /* some from window */
                                                    len -= op;
                                                    do {
                                                        output[_out++] = s_window[from++];
                                                    } while (--op);
                                                    from = _out - dist;  /* rest from output */
                                                    from_source = output;
                                                }
                                            }
                                            else if (wnext < op) {      /* wrap around window */
                                                from += wsize + wnext - op;
                                                op -= wnext;
                                                if (op < len) {         /* some from end of window */
                                                    len -= op;
                                                    do {
                                                        output[_out++] = s_window[from++];
                                                    } while (--op);
                                                    from = 0;
                                                    if (wnext < len) {  /* some from start of window */
                                                        op = wnext;
                                                        len -= op;
                                                        do {
                                                            output[_out++] = s_window[from++];
                                                        } while (--op);
                                                        from = _out - dist;      /* rest from output */
                                                        from_source = output;
                                                    }
                                                }
                                            }
                                            else {                      /* contiguous in window */
                                                from += wnext - op;
                                                if (op < len) {         /* some from window */
                                                    len -= op;
                                                    do {
                                                        output[_out++] = s_window[from++];
                                                    } while (--op);
                                                    from = _out - dist;  /* rest from output */
                                                    from_source = output;
                                                }
                                            }
                                            while (len > 2) {
                                                output[_out++] = from_source[from++];
                                                output[_out++] = from_source[from++];
                                                output[_out++] = from_source[from++];
                                                len -= 3;
                                            }
                                            if (len) {
                                                output[_out++] = from_source[from++];
                                                if (len > 1) {
                                                    output[_out++] = from_source[from++];
                                                }
                                            }
                                        }
                                        else {
                                            from = _out - dist;          /* copy direct from output */
                                            do {                        /* minimum length is three */
                                                output[_out++] = output[from++];
                                                output[_out++] = output[from++];
                                                output[_out++] = output[from++];
                                                len -= 3;
                                            } while (len > 2);
                                            if (len) {
                                                output[_out++] = output[from++];
                                                if (len > 1) {
                                                    output[_out++] = output[from++];
                                                }
                                            }
                                        }
                                    }
                                    else if ((op & 64) === 0) {          /* 2nd level distance code */
                                        here = dcode[(here & 0xffff)/*here.val*/ + (hold & ((1 << op) - 1))];
                                        continue dodist;
                                    }
                                    else {
                                        strm.msg = 'invalid distance code';
                                        state.mode = BAD;
                                        break top;
                                    }

                                    break; // need to emulate goto via "continue"
                                }
                        }
                        else if ((op & 64) === 0) {              /* 2nd level length code */
                            here = lcode[(here & 0xffff)/*here.val*/ + (hold & ((1 << op) - 1))];
                            continue dolen;
                        }
                        else if (op & 32) {                     /* end-of-block */
                            //Tracevv((stderr, "inflate:         end of block\n"));
                            state.mode = TYPE;
                            break top;
                        }
                        else {
                            strm.msg = 'invalid literal/length code';
                            state.mode = BAD;
                            break top;
                        }

                        break; // need to emulate goto via "continue"
                    }
            } while (_in < last && _out < end);

        /* return unused bytes (on entry, bits < 8, so in won't go too far back) */
        len = bits >> 3;
        _in -= len;
        bits -= len << 3;
        hold &= (1 << bits) - 1;

        /* update state and return */
        strm.next_in = _in;
        strm.next_out = _out;
        strm.avail_in = (_in < last ? 5 + (last - _in) : 5 - (_in - last));
        strm.avail_out = (_out < end ? 257 + (end - _out) : 257 - (_out - end));
        state.hold = hold;
        state.bits = bits;
        return;
    };

},{}],24:[function(require,module,exports){
    'use strict';


    var utils = require('../utils/common');
    var adler32 = require('./adler32');
    var crc32   = require('./crc32');
    var inflate_fast = require('./inffast');
    var inflate_table = require('./inftrees');

    var CODES = 0;
    var LENS = 1;
    var DISTS = 2;

    /* Public constants ==========================================================*/
    /* ===========================================================================*/


    /* Allowed flush values; see deflate() and inflate() below for details */
//var Z_NO_FLUSH      = 0;
//var Z_PARTIAL_FLUSH = 1;
//var Z_SYNC_FLUSH    = 2;
//var Z_FULL_FLUSH    = 3;
    var Z_FINISH        = 4;
    var Z_BLOCK         = 5;
    var Z_TREES         = 6;


    /* Return codes for the compression/decompression functions. Negative values
     * are errors, positive values are used for special but normal events.
     */
    var Z_OK            = 0;
    var Z_STREAM_END    = 1;
    var Z_NEED_DICT     = 2;
//var Z_ERRNO         = -1;
    var Z_STREAM_ERROR  = -2;
    var Z_DATA_ERROR    = -3;
    var Z_MEM_ERROR     = -4;
    var Z_BUF_ERROR     = -5;
//var Z_VERSION_ERROR = -6;

    /* The deflate compression method */
    var Z_DEFLATED  = 8;


    /* STATES ====================================================================*/
    /* ===========================================================================*/


    var    HEAD = 1;       /* i: waiting for magic header */
    var    FLAGS = 2;      /* i: waiting for method and flags (gzip) */
    var    TIME = 3;       /* i: waiting for modification time (gzip) */
    var    OS = 4;         /* i: waiting for extra flags and operating system (gzip) */
    var    EXLEN = 5;      /* i: waiting for extra length (gzip) */
    var    EXTRA = 6;      /* i: waiting for extra bytes (gzip) */
    var    NAME = 7;       /* i: waiting for end of file name (gzip) */
    var    COMMENT = 8;    /* i: waiting for end of comment (gzip) */
    var    HCRC = 9;       /* i: waiting for header crc (gzip) */
    var    DICTID = 10;    /* i: waiting for dictionary check value */
    var    DICT = 11;      /* waiting for inflateSetDictionary() call */
    var        TYPE = 12;      /* i: waiting for type bits, including last-flag bit */
    var        TYPEDO = 13;    /* i: same, but skip check to exit inflate on new block */
    var        STORED = 14;    /* i: waiting for stored size (length and complement) */
    var        COPY_ = 15;     /* i/o: same as COPY below, but only first time in */
    var        COPY = 16;      /* i/o: waiting for input or output to copy stored block */
    var        TABLE = 17;     /* i: waiting for dynamic block table lengths */
    var        LENLENS = 18;   /* i: waiting for code length code lengths */
    var        CODELENS = 19;  /* i: waiting for length/lit and distance code lengths */
    var            LEN_ = 20;      /* i: same as LEN below, but only first time in */
    var            LEN = 21;       /* i: waiting for length/lit/eob code */
    var            LENEXT = 22;    /* i: waiting for length extra bits */
    var            DIST = 23;      /* i: waiting for distance code */
    var            DISTEXT = 24;   /* i: waiting for distance extra bits */
    var            MATCH = 25;     /* o: waiting for output space to copy string */
    var            LIT = 26;       /* o: waiting for output space to write literal */
    var    CHECK = 27;     /* i: waiting for 32-bit check value */
    var    LENGTH = 28;    /* i: waiting for 32-bit length (gzip) */
    var    DONE = 29;      /* finished check, done -- remain here until reset */
    var    BAD = 30;       /* got a data error -- remain here until reset */
    var    MEM = 31;       /* got an inflate() memory error -- remain here until reset */
    var    SYNC = 32;      /* looking for synchronization bytes to restart inflate() */

    /* ===========================================================================*/



    var ENOUGH_LENS = 852;
    var ENOUGH_DISTS = 592;
//var ENOUGH =  (ENOUGH_LENS+ENOUGH_DISTS);

    var MAX_WBITS = 15;
    /* 32K LZ77 window */
    var DEF_WBITS = MAX_WBITS;


    function ZSWAP32(q) {
        return  (((q >>> 24) & 0xff) +
        ((q >>> 8) & 0xff00) +
        ((q & 0xff00) << 8) +
        ((q & 0xff) << 24));
    }


    function InflateState() {
        this.mode = 0;             /* current inflate mode */
        this.last = false;          /* true if processing last block */
        this.wrap = 0;              /* bit 0 true for zlib, bit 1 true for gzip */
        this.havedict = false;      /* true if dictionary provided */
        this.flags = 0;             /* gzip header method and flags (0 if zlib) */
        this.dmax = 0;              /* zlib header max distance (INFLATE_STRICT) */
        this.check = 0;             /* protected copy of check value */
        this.total = 0;             /* protected copy of output count */
        // TODO: may be {}
        this.head = null;           /* where to save gzip header information */

        /* sliding window */
        this.wbits = 0;             /* log base 2 of requested window size */
        this.wsize = 0;             /* window size or zero if not using window */
        this.whave = 0;             /* valid bytes in the window */
        this.wnext = 0;             /* window write index */
        this.window = null;         /* allocated sliding window, if needed */

        /* bit accumulator */
        this.hold = 0;              /* input bit accumulator */
        this.bits = 0;              /* number of bits in "in" */

        /* for string and stored block copying */
        this.length = 0;            /* literal or length of data to copy */
        this.offset = 0;            /* distance back to copy string from */

        /* for table and code decoding */
        this.extra = 0;             /* extra bits needed */

        /* fixed and dynamic code tables */
        this.lencode = null;          /* starting table for length/literal codes */
        this.distcode = null;         /* starting table for distance codes */
        this.lenbits = 0;           /* index bits for lencode */
        this.distbits = 0;          /* index bits for distcode */

        /* dynamic table building */
        this.ncode = 0;             /* number of code length code lengths */
        this.nlen = 0;              /* number of length code lengths */
        this.ndist = 0;             /* number of distance code lengths */
        this.have = 0;              /* number of code lengths in lens[] */
        this.next = null;              /* next available space in codes[] */

        this.lens = new utils.Buf16(320); /* temporary storage for code lengths */
        this.work = new utils.Buf16(288); /* work area for code table building */

        /*
         because we don't have pointers in js, we use lencode and distcode directly
         as buffers so we don't need codes
         */
        //this.codes = new utils.Buf32(ENOUGH);       /* space for code tables */
        this.lendyn = null;              /* dynamic table for length/literal codes (JS specific) */
        this.distdyn = null;             /* dynamic table for distance codes (JS specific) */
        this.sane = 0;                   /* if false, allow invalid distance too far */
        this.back = 0;                   /* bits back of last unprocessed length/lit */
        this.was = 0;                    /* initial length of match */
    }

    function inflateResetKeep(strm) {
        var state;

        if (!strm || !strm.state) { return Z_STREAM_ERROR; }
        state = strm.state;
        strm.total_in = strm.total_out = state.total = 0;
        strm.msg = ''; /*Z_NULL*/
        if (state.wrap) {       /* to support ill-conceived Java test suite */
            strm.adler = state.wrap & 1;
        }
        state.mode = HEAD;
        state.last = 0;
        state.havedict = 0;
        state.dmax = 32768;
        state.head = null/*Z_NULL*/;
        state.hold = 0;
        state.bits = 0;
        //state.lencode = state.distcode = state.next = state.codes;
        state.lencode = state.lendyn = new utils.Buf32(ENOUGH_LENS);
        state.distcode = state.distdyn = new utils.Buf32(ENOUGH_DISTS);

        state.sane = 1;
        state.back = -1;
        //Tracev((stderr, "inflate: reset\n"));
        return Z_OK;
    }

    function inflateReset(strm) {
        var state;

        if (!strm || !strm.state) { return Z_STREAM_ERROR; }
        state = strm.state;
        state.wsize = 0;
        state.whave = 0;
        state.wnext = 0;
        return inflateResetKeep(strm);

    }

    function inflateReset2(strm, windowBits) {
        var wrap;
        var state;

        /* get the state */
        if (!strm || !strm.state) { return Z_STREAM_ERROR; }
        state = strm.state;

        /* extract wrap request from windowBits parameter */
        if (windowBits < 0) {
            wrap = 0;
            windowBits = -windowBits;
        }
        else {
            wrap = (windowBits >> 4) + 1;
            if (windowBits < 48) {
                windowBits &= 15;
            }
        }

        /* set number of window bits, free window if different */
        if (windowBits && (windowBits < 8 || windowBits > 15)) {
            return Z_STREAM_ERROR;
        }
        if (state.window !== null && state.wbits !== windowBits) {
            state.window = null;
        }

        /* update state and reset the rest of it */
        state.wrap = wrap;
        state.wbits = windowBits;
        return inflateReset(strm);
    }

    function inflateInit2(strm, windowBits) {
        var ret;
        var state;

        if (!strm) { return Z_STREAM_ERROR; }
        //strm.msg = Z_NULL;                 /* in case we return an error */

        state = new InflateState();

        //if (state === Z_NULL) return Z_MEM_ERROR;
        //Tracev((stderr, "inflate: allocated\n"));
        strm.state = state;
        state.window = null/*Z_NULL*/;
        ret = inflateReset2(strm, windowBits);
        if (ret !== Z_OK) {
            strm.state = null/*Z_NULL*/;
        }
        return ret;
    }

    function inflateInit(strm) {
        return inflateInit2(strm, DEF_WBITS);
    }


    /*
     Return state with length and distance decoding tables and index sizes set to
     fixed code decoding.  Normally this returns fixed tables from inffixed.h.
     If BUILDFIXED is defined, then instead this routine builds the tables the
     first time it's called, and returns those tables the first time and
     thereafter.  This reduces the size of the code by about 2K bytes, in
     exchange for a little execution time.  However, BUILDFIXED should not be
     used for threaded applications, since the rewriting of the tables and virgin
     may not be thread-safe.
     */
    var virgin = true;

    var lenfix, distfix; // We have no pointers in JS, so keep tables separate

    function fixedtables(state) {
        /* build fixed huffman tables if first call (may not be thread safe) */
        if (virgin) {
            var sym;

            lenfix = new utils.Buf32(512);
            distfix = new utils.Buf32(32);

            /* literal/length table */
            sym = 0;
            while (sym < 144) { state.lens[sym++] = 8; }
            while (sym < 256) { state.lens[sym++] = 9; }
            while (sym < 280) { state.lens[sym++] = 7; }
            while (sym < 288) { state.lens[sym++] = 8; }

            inflate_table(LENS,  state.lens, 0, 288, lenfix,   0, state.work, {bits: 9});

            /* distance table */
            sym = 0;
            while (sym < 32) { state.lens[sym++] = 5; }

            inflate_table(DISTS, state.lens, 0, 32,   distfix, 0, state.work, {bits: 5});

            /* do this just once */
            virgin = false;
        }

        state.lencode = lenfix;
        state.lenbits = 9;
        state.distcode = distfix;
        state.distbits = 5;
    }


    /*
     Update the window with the last wsize (normally 32K) bytes written before
     returning.  If window does not exist yet, create it.  This is only called
     when a window is already in use, or when output has been written during this
     inflate call, but the end of the deflate stream has not been reached yet.
     It is also called to create a window for dictionary data when a dictionary
     is loaded.

     Providing output buffers larger than 32K to inflate() should provide a speed
     advantage, since only the last 32K of output is copied to the sliding window
     upon return from inflate(), and since all distances after the first 32K of
     output will fall in the output data, making match copies simpler and faster.
     The advantage may be dependent on the size of the processor's data caches.
     */
    function updatewindow(strm, src, end, copy) {
        var dist;
        var state = strm.state;

        /* if it hasn't been done already, allocate space for the window */
        if (state.window === null) {
            state.wsize = 1 << state.wbits;
            state.wnext = 0;
            state.whave = 0;

            state.window = new utils.Buf8(state.wsize);
        }

        /* copy state->wsize or less output bytes into the circular window */
        if (copy >= state.wsize) {
            utils.arraySet(state.window,src, end - state.wsize, state.wsize, 0);
            state.wnext = 0;
            state.whave = state.wsize;
        }
        else {
            dist = state.wsize - state.wnext;
            if (dist > copy) {
                dist = copy;
            }
            //zmemcpy(state->window + state->wnext, end - copy, dist);
            utils.arraySet(state.window,src, end - copy, dist, state.wnext);
            copy -= dist;
            if (copy) {
                //zmemcpy(state->window, end - copy, copy);
                utils.arraySet(state.window,src, end - copy, copy, 0);
                state.wnext = copy;
                state.whave = state.wsize;
            }
            else {
                state.wnext += dist;
                if (state.wnext === state.wsize) { state.wnext = 0; }
                if (state.whave < state.wsize) { state.whave += dist; }
            }
        }
        return 0;
    }

    function inflate(strm, flush) {
        var state;
        var input, output;          // input/output buffers
        var next;                   /* next input INDEX */
        var put;                    /* next output INDEX */
        var have, left;             /* available input and output */
        var hold;                   /* bit buffer */
        var bits;                   /* bits in bit buffer */
        var _in, _out;              /* save starting available input and output */
        var copy;                   /* number of stored or match bytes to copy */
        var from;                   /* where to copy match bytes from */
        var from_source;
        var here = 0;               /* current decoding table entry */
        var here_bits, here_op, here_val; // paked "here" denormalized (JS specific)
        //var last;                   /* parent table entry */
        var last_bits, last_op, last_val; // paked "last" denormalized (JS specific)
        var len;                    /* length to copy for repeats, bits to drop */
        var ret;                    /* return code */
        var hbuf = new utils.Buf8(4);    /* buffer for gzip header crc calculation */
        var opts;

        var n; // temporary var for NEED_BITS

        var order = /* permutation of code lengths */
            [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];


        if (!strm || !strm.state || !strm.output ||
            (!strm.input && strm.avail_in !== 0)) {
            return Z_STREAM_ERROR;
        }

        state = strm.state;
        if (state.mode === TYPE) { state.mode = TYPEDO; }    /* skip check */


        //--- LOAD() ---
        put = strm.next_out;
        output = strm.output;
        left = strm.avail_out;
        next = strm.next_in;
        input = strm.input;
        have = strm.avail_in;
        hold = state.hold;
        bits = state.bits;
        //---

        _in = have;
        _out = left;
        ret = Z_OK;

        inf_leave: // goto emulation
            for (;;) {
                switch (state.mode) {
                    case HEAD:
                        if (state.wrap === 0) {
                            state.mode = TYPEDO;
                            break;
                        }
                        //=== NEEDBITS(16);
                        while (bits < 16) {
                            if (have === 0) { break inf_leave; }
                            have--;
                            hold += input[next++] << bits;
                            bits += 8;
                        }
                        //===//
                        if ((state.wrap & 2) && hold === 0x8b1f) {  /* gzip header */
                            state.check = 0/*crc32(0L, Z_NULL, 0)*/;
                            //=== CRC2(state.check, hold);
                            hbuf[0] = hold & 0xff;
                            hbuf[1] = (hold >>> 8) & 0xff;
                            state.check = crc32(state.check, hbuf, 2, 0);
                            //===//

                            //=== INITBITS();
                            hold = 0;
                            bits = 0;
                            //===//
                            state.mode = FLAGS;
                            break;
                        }
                        state.flags = 0;           /* expect zlib header */
                        if (state.head) {
                            state.head.done = false;
                        }
                        if (!(state.wrap & 1) ||   /* check if zlib header allowed */
                            (((hold & 0xff)/*BITS(8)*/ << 8) + (hold >> 8)) % 31) {
                            strm.msg = 'incorrect header check';
                            state.mode = BAD;
                            break;
                        }
                        if ((hold & 0x0f)/*BITS(4)*/ !== Z_DEFLATED) {
                            strm.msg = 'unknown compression method';
                            state.mode = BAD;
                            break;
                        }
                        //--- DROPBITS(4) ---//
                        hold >>>= 4;
                        bits -= 4;
                        //---//
                        len = (hold & 0x0f)/*BITS(4)*/ + 8;
                        if (state.wbits === 0) {
                            state.wbits = len;
                        }
                        else if (len > state.wbits) {
                            strm.msg = 'invalid window size';
                            state.mode = BAD;
                            break;
                        }
                        state.dmax = 1 << len;
                        //Tracev((stderr, "inflate:   zlib header ok\n"));
                        strm.adler = state.check = 1/*adler32(0L, Z_NULL, 0)*/;
                        state.mode = hold & 0x200 ? DICTID : TYPE;
                        //=== INITBITS();
                        hold = 0;
                        bits = 0;
                        //===//
                        break;
                    case FLAGS:
                        //=== NEEDBITS(16); */
                        while (bits < 16) {
                            if (have === 0) { break inf_leave; }
                            have--;
                            hold += input[next++] << bits;
                            bits += 8;
                        }
                        //===//
                        state.flags = hold;
                        if ((state.flags & 0xff) !== Z_DEFLATED) {
                            strm.msg = 'unknown compression method';
                            state.mode = BAD;
                            break;
                        }
                        if (state.flags & 0xe000) {
                            strm.msg = 'unknown header flags set';
                            state.mode = BAD;
                            break;
                        }
                        if (state.head) {
                            state.head.text = ((hold >> 8) & 1);
                        }
                        if (state.flags & 0x0200) {
                            //=== CRC2(state.check, hold);
                            hbuf[0] = hold & 0xff;
                            hbuf[1] = (hold >>> 8) & 0xff;
                            state.check = crc32(state.check, hbuf, 2, 0);
                            //===//
                        }
                        //=== INITBITS();
                        hold = 0;
                        bits = 0;
                        //===//
                        state.mode = TIME;
                    /* falls through */
                    case TIME:
                        //=== NEEDBITS(32); */
                        while (bits < 32) {
                            if (have === 0) { break inf_leave; }
                            have--;
                            hold += input[next++] << bits;
                            bits += 8;
                        }
                        //===//
                        if (state.head) {
                            state.head.time = hold;
                        }
                        if (state.flags & 0x0200) {
                            //=== CRC4(state.check, hold)
                            hbuf[0] = hold & 0xff;
                            hbuf[1] = (hold >>> 8) & 0xff;
                            hbuf[2] = (hold >>> 16) & 0xff;
                            hbuf[3] = (hold >>> 24) & 0xff;
                            state.check = crc32(state.check, hbuf, 4, 0);
                            //===
                        }
                        //=== INITBITS();
                        hold = 0;
                        bits = 0;
                        //===//
                        state.mode = OS;
                    /* falls through */
                    case OS:
                        //=== NEEDBITS(16); */
                        while (bits < 16) {
                            if (have === 0) { break inf_leave; }
                            have--;
                            hold += input[next++] << bits;
                            bits += 8;
                        }
                        //===//
                        if (state.head) {
                            state.head.xflags = (hold & 0xff);
                            state.head.os = (hold >> 8);
                        }
                        if (state.flags & 0x0200) {
                            //=== CRC2(state.check, hold);
                            hbuf[0] = hold & 0xff;
                            hbuf[1] = (hold >>> 8) & 0xff;
                            state.check = crc32(state.check, hbuf, 2, 0);
                            //===//
                        }
                        //=== INITBITS();
                        hold = 0;
                        bits = 0;
                        //===//
                        state.mode = EXLEN;
                    /* falls through */
                    case EXLEN:
                        if (state.flags & 0x0400) {
                            //=== NEEDBITS(16); */
                            while (bits < 16) {
                                if (have === 0) { break inf_leave; }
                                have--;
                                hold += input[next++] << bits;
                                bits += 8;
                            }
                            //===//
                            state.length = hold;
                            if (state.head) {
                                state.head.extra_len = hold;
                            }
                            if (state.flags & 0x0200) {
                                //=== CRC2(state.check, hold);
                                hbuf[0] = hold & 0xff;
                                hbuf[1] = (hold >>> 8) & 0xff;
                                state.check = crc32(state.check, hbuf, 2, 0);
                                //===//
                            }
                            //=== INITBITS();
                            hold = 0;
                            bits = 0;
                            //===//
                        }
                        else if (state.head) {
                            state.head.extra = null/*Z_NULL*/;
                        }
                        state.mode = EXTRA;
                    /* falls through */
                    case EXTRA:
                        if (state.flags & 0x0400) {
                            copy = state.length;
                            if (copy > have) { copy = have; }
                            if (copy) {
                                if (state.head) {
                                    len = state.head.extra_len - state.length;
                                    if (!state.head.extra) {
                                        // Use untyped array for more conveniend processing later
                                        state.head.extra = new Array(state.head.extra_len);
                                    }
                                    utils.arraySet(
                                        state.head.extra,
                                        input,
                                        next,
                                        // extra field is limited to 65536 bytes
                                        // - no need for additional size check
                                        copy,
                                        /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
                                        len
                                    );
                                    //zmemcpy(state.head.extra + len, next,
                                    //        len + copy > state.head.extra_max ?
                                    //        state.head.extra_max - len : copy);
                                }
                                if (state.flags & 0x0200) {
                                    state.check = crc32(state.check, input, copy, next);
                                }
                                have -= copy;
                                next += copy;
                                state.length -= copy;
                            }
                            if (state.length) { break inf_leave; }
                        }
                        state.length = 0;
                        state.mode = NAME;
                    /* falls through */
                    case NAME:
                        if (state.flags & 0x0800) {
                            if (have === 0) { break inf_leave; }
                            copy = 0;
                            do {
                                // TODO: 2 or 1 bytes?
                                len = input[next + copy++];
                                /* use constant limit because in js we should not preallocate memory */
                                if (state.head && len &&
                                    (state.length < 65536 /*state.head.name_max*/)) {
                                    state.head.name += String.fromCharCode(len);
                                }
                            } while (len && copy < have);

                            if (state.flags & 0x0200) {
                                state.check = crc32(state.check, input, copy, next);
                            }
                            have -= copy;
                            next += copy;
                            if (len) { break inf_leave; }
                        }
                        else if (state.head) {
                            state.head.name = null;
                        }
                        state.length = 0;
                        state.mode = COMMENT;
                    /* falls through */
                    case COMMENT:
                        if (state.flags & 0x1000) {
                            if (have === 0) { break inf_leave; }
                            copy = 0;
                            do {
                                len = input[next + copy++];
                                /* use constant limit because in js we should not preallocate memory */
                                if (state.head && len &&
                                    (state.length < 65536 /*state.head.comm_max*/)) {
                                    state.head.comment += String.fromCharCode(len);
                                }
                            } while (len && copy < have);
                            if (state.flags & 0x0200) {
                                state.check = crc32(state.check, input, copy, next);
                            }
                            have -= copy;
                            next += copy;
                            if (len) { break inf_leave; }
                        }
                        else if (state.head) {
                            state.head.comment = null;
                        }
                        state.mode = HCRC;
                    /* falls through */
                    case HCRC:
                        if (state.flags & 0x0200) {
                            //=== NEEDBITS(16); */
                            while (bits < 16) {
                                if (have === 0) { break inf_leave; }
                                have--;
                                hold += input[next++] << bits;
                                bits += 8;
                            }
                            //===//
                            if (hold !== (state.check & 0xffff)) {
                                strm.msg = 'header crc mismatch';
                                state.mode = BAD;
                                break;
                            }
                            //=== INITBITS();
                            hold = 0;
                            bits = 0;
                            //===//
                        }
                        if (state.head) {
                            state.head.hcrc = ((state.flags >> 9) & 1);
                            state.head.done = true;
                        }
                        strm.adler = state.check = 0 /*crc32(0L, Z_NULL, 0)*/;
                        state.mode = TYPE;
                        break;
                    case DICTID:
                        //=== NEEDBITS(32); */
                        while (bits < 32) {
                            if (have === 0) { break inf_leave; }
                            have--;
                            hold += input[next++] << bits;
                            bits += 8;
                        }
                        //===//
                        strm.adler = state.check = ZSWAP32(hold);
                        //=== INITBITS();
                        hold = 0;
                        bits = 0;
                        //===//
                        state.mode = DICT;
                    /* falls through */
                    case DICT:
                        if (state.havedict === 0) {
                            //--- RESTORE() ---
                            strm.next_out = put;
                            strm.avail_out = left;
                            strm.next_in = next;
                            strm.avail_in = have;
                            state.hold = hold;
                            state.bits = bits;
                            //---
                            return Z_NEED_DICT;
                        }
                        strm.adler = state.check = 1/*adler32(0L, Z_NULL, 0)*/;
                        state.mode = TYPE;
                    /* falls through */
                    case TYPE:
                        if (flush === Z_BLOCK || flush === Z_TREES) { break inf_leave; }
                    /* falls through */
                    case TYPEDO:
                        if (state.last) {
                            //--- BYTEBITS() ---//
                            hold >>>= bits & 7;
                            bits -= bits & 7;
                            //---//
                            state.mode = CHECK;
                            break;
                        }
                        //=== NEEDBITS(3); */
                        while (bits < 3) {
                            if (have === 0) { break inf_leave; }
                            have--;
                            hold += input[next++] << bits;
                            bits += 8;
                        }
                        //===//
                        state.last = (hold & 0x01)/*BITS(1)*/;
                        //--- DROPBITS(1) ---//
                        hold >>>= 1;
                        bits -= 1;
                        //---//

                        switch ((hold & 0x03)/*BITS(2)*/) {
                            case 0:                             /* stored block */
                                //Tracev((stderr, "inflate:     stored block%s\n",
                                //        state.last ? " (last)" : ""));
                                state.mode = STORED;
                                break;
                            case 1:                             /* fixed block */
                                fixedtables(state);
                                //Tracev((stderr, "inflate:     fixed codes block%s\n",
                                //        state.last ? " (last)" : ""));
                                state.mode = LEN_;             /* decode codes */
                                if (flush === Z_TREES) {
                                    //--- DROPBITS(2) ---//
                                    hold >>>= 2;
                                    bits -= 2;
                                    //---//
                                    break inf_leave;
                                }
                                break;
                            case 2:                             /* dynamic block */
                                //Tracev((stderr, "inflate:     dynamic codes block%s\n",
                                //        state.last ? " (last)" : ""));
                                state.mode = TABLE;
                                break;
                            case 3:
                                strm.msg = 'invalid block type';
                                state.mode = BAD;
                        }
                        //--- DROPBITS(2) ---//
                        hold >>>= 2;
                        bits -= 2;
                        //---//
                        break;
                    case STORED:
                        //--- BYTEBITS() ---// /* go to byte boundary */
                        hold >>>= bits & 7;
                        bits -= bits & 7;
                        //---//
                        //=== NEEDBITS(32); */
                        while (bits < 32) {
                            if (have === 0) { break inf_leave; }
                            have--;
                            hold += input[next++] << bits;
                            bits += 8;
                        }
                        //===//
                        if ((hold & 0xffff) !== ((hold >>> 16) ^ 0xffff)) {
                            strm.msg = 'invalid stored block lengths';
                            state.mode = BAD;
                            break;
                        }
                        state.length = hold & 0xffff;
                        //Tracev((stderr, "inflate:       stored length %u\n",
                        //        state.length));
                        //=== INITBITS();
                        hold = 0;
                        bits = 0;
                        //===//
                        state.mode = COPY_;
                        if (flush === Z_TREES) { break inf_leave; }
                    /* falls through */
                    case COPY_:
                        state.mode = COPY;
                    /* falls through */
                    case COPY:
                        copy = state.length;
                        if (copy) {
                            if (copy > have) { copy = have; }
                            if (copy > left) { copy = left; }
                            if (copy === 0) { break inf_leave; }
                            //--- zmemcpy(put, next, copy); ---
                            utils.arraySet(output, input, next, copy, put);
                            //---//
                            have -= copy;
                            next += copy;
                            left -= copy;
                            put += copy;
                            state.length -= copy;
                            break;
                        }
                        //Tracev((stderr, "inflate:       stored end\n"));
                        state.mode = TYPE;
                        break;
                    case TABLE:
                        //=== NEEDBITS(14); */
                        while (bits < 14) {
                            if (have === 0) { break inf_leave; }
                            have--;
                            hold += input[next++] << bits;
                            bits += 8;
                        }
                        //===//
                        state.nlen = (hold & 0x1f)/*BITS(5)*/ + 257;
                        //--- DROPBITS(5) ---//
                        hold >>>= 5;
                        bits -= 5;
                        //---//
                        state.ndist = (hold & 0x1f)/*BITS(5)*/ + 1;
                        //--- DROPBITS(5) ---//
                        hold >>>= 5;
                        bits -= 5;
                        //---//
                        state.ncode = (hold & 0x0f)/*BITS(4)*/ + 4;
                        //--- DROPBITS(4) ---//
                        hold >>>= 4;
                        bits -= 4;
                        //---//
//#ifndef PKZIP_BUG_WORKAROUND
                        if (state.nlen > 286 || state.ndist > 30) {
                            strm.msg = 'too many length or distance symbols';
                            state.mode = BAD;
                            break;
                        }
//#endif
                        //Tracev((stderr, "inflate:       table sizes ok\n"));
                        state.have = 0;
                        state.mode = LENLENS;
                    /* falls through */
                    case LENLENS:
                        while (state.have < state.ncode) {
                            //=== NEEDBITS(3);
                            while (bits < 3) {
                                if (have === 0) { break inf_leave; }
                                have--;
                                hold += input[next++] << bits;
                                bits += 8;
                            }
                            //===//
                            state.lens[order[state.have++]] = (hold & 0x07);//BITS(3);
                            //--- DROPBITS(3) ---//
                            hold >>>= 3;
                            bits -= 3;
                            //---//
                        }
                        while (state.have < 19) {
                            state.lens[order[state.have++]] = 0;
                        }
                        // We have separate tables & no pointers. 2 commented lines below not needed.
                        //state.next = state.codes;
                        //state.lencode = state.next;
                        // Switch to use dynamic table
                        state.lencode = state.lendyn;
                        state.lenbits = 7;

                        opts = {bits: state.lenbits};
                        ret = inflate_table(CODES, state.lens, 0, 19, state.lencode, 0, state.work, opts);
                        state.lenbits = opts.bits;

                        if (ret) {
                            strm.msg = 'invalid code lengths set';
                            state.mode = BAD;
                            break;
                        }
                        //Tracev((stderr, "inflate:       code lengths ok\n"));
                        state.have = 0;
                        state.mode = CODELENS;
                    /* falls through */
                    case CODELENS:
                        while (state.have < state.nlen + state.ndist) {
                            for (;;) {
                                here = state.lencode[hold & ((1 << state.lenbits) - 1)];/*BITS(state.lenbits)*/
                                here_bits = here >>> 24;
                                here_op = (here >>> 16) & 0xff;
                                here_val = here & 0xffff;

                                if ((here_bits) <= bits) { break; }
                                //--- PULLBYTE() ---//
                                if (have === 0) { break inf_leave; }
                                have--;
                                hold += input[next++] << bits;
                                bits += 8;
                                //---//
                            }
                            if (here_val < 16) {
                                //--- DROPBITS(here.bits) ---//
                                hold >>>= here_bits;
                                bits -= here_bits;
                                //---//
                                state.lens[state.have++] = here_val;
                            }
                            else {
                                if (here_val === 16) {
                                    //=== NEEDBITS(here.bits + 2);
                                    n = here_bits + 2;
                                    while (bits < n) {
                                        if (have === 0) { break inf_leave; }
                                        have--;
                                        hold += input[next++] << bits;
                                        bits += 8;
                                    }
                                    //===//
                                    //--- DROPBITS(here.bits) ---//
                                    hold >>>= here_bits;
                                    bits -= here_bits;
                                    //---//
                                    if (state.have === 0) {
                                        strm.msg = 'invalid bit length repeat';
                                        state.mode = BAD;
                                        break;
                                    }
                                    len = state.lens[state.have - 1];
                                    copy = 3 + (hold & 0x03);//BITS(2);
                                    //--- DROPBITS(2) ---//
                                    hold >>>= 2;
                                    bits -= 2;
                                    //---//
                                }
                                else if (here_val === 17) {
                                    //=== NEEDBITS(here.bits + 3);
                                    n = here_bits + 3;
                                    while (bits < n) {
                                        if (have === 0) { break inf_leave; }
                                        have--;
                                        hold += input[next++] << bits;
                                        bits += 8;
                                    }
                                    //===//
                                    //--- DROPBITS(here.bits) ---//
                                    hold >>>= here_bits;
                                    bits -= here_bits;
                                    //---//
                                    len = 0;
                                    copy = 3 + (hold & 0x07);//BITS(3);
                                    //--- DROPBITS(3) ---//
                                    hold >>>= 3;
                                    bits -= 3;
                                    //---//
                                }
                                else {
                                    //=== NEEDBITS(here.bits + 7);
                                    n = here_bits + 7;
                                    while (bits < n) {
                                        if (have === 0) { break inf_leave; }
                                        have--;
                                        hold += input[next++] << bits;
                                        bits += 8;
                                    }
                                    //===//
                                    //--- DROPBITS(here.bits) ---//
                                    hold >>>= here_bits;
                                    bits -= here_bits;
                                    //---//
                                    len = 0;
                                    copy = 11 + (hold & 0x7f);//BITS(7);
                                    //--- DROPBITS(7) ---//
                                    hold >>>= 7;
                                    bits -= 7;
                                    //---//
                                }
                                if (state.have + copy > state.nlen + state.ndist) {
                                    strm.msg = 'invalid bit length repeat';
                                    state.mode = BAD;
                                    break;
                                }
                                while (copy--) {
                                    state.lens[state.have++] = len;
                                }
                            }
                        }

                        /* handle error breaks in while */
                        if (state.mode === BAD) { break; }

                        /* check for end-of-block code (better have one) */
                        if (state.lens[256] === 0) {
                            strm.msg = 'invalid code -- missing end-of-block';
                            state.mode = BAD;
                            break;
                        }

                        /* build code tables -- note: do not change the lenbits or distbits
                         values here (9 and 6) without reading the comments in inftrees.h
                         concerning the ENOUGH constants, which depend on those values */
                        state.lenbits = 9;

                        opts = {bits: state.lenbits};
                        ret = inflate_table(LENS, state.lens, 0, state.nlen, state.lencode, 0, state.work, opts);
                        // We have separate tables & no pointers. 2 commented lines below not needed.
                        // state.next_index = opts.table_index;
                        state.lenbits = opts.bits;
                        // state.lencode = state.next;

                        if (ret) {
                            strm.msg = 'invalid literal/lengths set';
                            state.mode = BAD;
                            break;
                        }

                        state.distbits = 6;
                        //state.distcode.copy(state.codes);
                        // Switch to use dynamic table
                        state.distcode = state.distdyn;
                        opts = {bits: state.distbits};
                        ret = inflate_table(DISTS, state.lens, state.nlen, state.ndist, state.distcode, 0, state.work, opts);
                        // We have separate tables & no pointers. 2 commented lines below not needed.
                        // state.next_index = opts.table_index;
                        state.distbits = opts.bits;
                        // state.distcode = state.next;

                        if (ret) {
                            strm.msg = 'invalid distances set';
                            state.mode = BAD;
                            break;
                        }
                        //Tracev((stderr, 'inflate:       codes ok\n'));
                        state.mode = LEN_;
                        if (flush === Z_TREES) { break inf_leave; }
                    /* falls through */
                    case LEN_:
                        state.mode = LEN;
                    /* falls through */
                    case LEN:
                        if (have >= 6 && left >= 258) {
                            //--- RESTORE() ---
                            strm.next_out = put;
                            strm.avail_out = left;
                            strm.next_in = next;
                            strm.avail_in = have;
                            state.hold = hold;
                            state.bits = bits;
                            //---
                            inflate_fast(strm, _out);
                            //--- LOAD() ---
                            put = strm.next_out;
                            output = strm.output;
                            left = strm.avail_out;
                            next = strm.next_in;
                            input = strm.input;
                            have = strm.avail_in;
                            hold = state.hold;
                            bits = state.bits;
                            //---

                            if (state.mode === TYPE) {
                                state.back = -1;
                            }
                            break;
                        }
                        state.back = 0;
                        for (;;) {
                            here = state.lencode[hold & ((1 << state.lenbits) -1)];  /*BITS(state.lenbits)*/
                            here_bits = here >>> 24;
                            here_op = (here >>> 16) & 0xff;
                            here_val = here & 0xffff;

                            if (here_bits <= bits) { break; }
                            //--- PULLBYTE() ---//
                            if (have === 0) { break inf_leave; }
                            have--;
                            hold += input[next++] << bits;
                            bits += 8;
                            //---//
                        }
                        if (here_op && (here_op & 0xf0) === 0) {
                            last_bits = here_bits;
                            last_op = here_op;
                            last_val = here_val;
                            for (;;) {
                                here = state.lencode[last_val +
                                ((hold & ((1 << (last_bits + last_op)) -1))/*BITS(last.bits + last.op)*/ >> last_bits)];
                                here_bits = here >>> 24;
                                here_op = (here >>> 16) & 0xff;
                                here_val = here & 0xffff;

                                if ((last_bits + here_bits) <= bits) { break; }
                                //--- PULLBYTE() ---//
                                if (have === 0) { break inf_leave; }
                                have--;
                                hold += input[next++] << bits;
                                bits += 8;
                                //---//
                            }
                            //--- DROPBITS(last.bits) ---//
                            hold >>>= last_bits;
                            bits -= last_bits;
                            //---//
                            state.back += last_bits;
                        }
                        //--- DROPBITS(here.bits) ---//
                        hold >>>= here_bits;
                        bits -= here_bits;
                        //---//
                        state.back += here_bits;
                        state.length = here_val;
                        if (here_op === 0) {
                            //Tracevv((stderr, here.val >= 0x20 && here.val < 0x7f ?
                            //        "inflate:         literal '%c'\n" :
                            //        "inflate:         literal 0x%02x\n", here.val));
                            state.mode = LIT;
                            break;
                        }
                        if (here_op & 32) {
                            //Tracevv((stderr, "inflate:         end of block\n"));
                            state.back = -1;
                            state.mode = TYPE;
                            break;
                        }
                        if (here_op & 64) {
                            strm.msg = 'invalid literal/length code';
                            state.mode = BAD;
                            break;
                        }
                        state.extra = here_op & 15;
                        state.mode = LENEXT;
                    /* falls through */
                    case LENEXT:
                        if (state.extra) {
                            //=== NEEDBITS(state.extra);
                            n = state.extra;
                            while (bits < n) {
                                if (have === 0) { break inf_leave; }
                                have--;
                                hold += input[next++] << bits;
                                bits += 8;
                            }
                            //===//
                            state.length += hold & ((1 << state.extra) -1)/*BITS(state.extra)*/;
                            //--- DROPBITS(state.extra) ---//
                            hold >>>= state.extra;
                            bits -= state.extra;
                            //---//
                            state.back += state.extra;
                        }
                        //Tracevv((stderr, "inflate:         length %u\n", state.length));
                        state.was = state.length;
                        state.mode = DIST;
                    /* falls through */
                    case DIST:
                        for (;;) {
                            here = state.distcode[hold & ((1 << state.distbits) -1)];/*BITS(state.distbits)*/
                            here_bits = here >>> 24;
                            here_op = (here >>> 16) & 0xff;
                            here_val = here & 0xffff;

                            if ((here_bits) <= bits) { break; }
                            //--- PULLBYTE() ---//
                            if (have === 0) { break inf_leave; }
                            have--;
                            hold += input[next++] << bits;
                            bits += 8;
                            //---//
                        }
                        if ((here_op & 0xf0) === 0) {
                            last_bits = here_bits;
                            last_op = here_op;
                            last_val = here_val;
                            for (;;) {
                                here = state.distcode[last_val +
                                ((hold & ((1 << (last_bits + last_op)) -1))/*BITS(last.bits + last.op)*/ >> last_bits)];
                                here_bits = here >>> 24;
                                here_op = (here >>> 16) & 0xff;
                                here_val = here & 0xffff;

                                if ((last_bits + here_bits) <= bits) { break; }
                                //--- PULLBYTE() ---//
                                if (have === 0) { break inf_leave; }
                                have--;
                                hold += input[next++] << bits;
                                bits += 8;
                                //---//
                            }
                            //--- DROPBITS(last.bits) ---//
                            hold >>>= last_bits;
                            bits -= last_bits;
                            //---//
                            state.back += last_bits;
                        }
                        //--- DROPBITS(here.bits) ---//
                        hold >>>= here_bits;
                        bits -= here_bits;
                        //---//
                        state.back += here_bits;
                        if (here_op & 64) {
                            strm.msg = 'invalid distance code';
                            state.mode = BAD;
                            break;
                        }
                        state.offset = here_val;
                        state.extra = (here_op) & 15;
                        state.mode = DISTEXT;
                    /* falls through */
                    case DISTEXT:
                        if (state.extra) {
                            //=== NEEDBITS(state.extra);
                            n = state.extra;
                            while (bits < n) {
                                if (have === 0) { break inf_leave; }
                                have--;
                                hold += input[next++] << bits;
                                bits += 8;
                            }
                            //===//
                            state.offset += hold & ((1 << state.extra) -1)/*BITS(state.extra)*/;
                            //--- DROPBITS(state.extra) ---//
                            hold >>>= state.extra;
                            bits -= state.extra;
                            //---//
                            state.back += state.extra;
                        }
//#ifdef INFLATE_STRICT
                        if (state.offset > state.dmax) {
                            strm.msg = 'invalid distance too far back';
                            state.mode = BAD;
                            break;
                        }
//#endif
                        //Tracevv((stderr, "inflate:         distance %u\n", state.offset));
                        state.mode = MATCH;
                    /* falls through */
                    case MATCH:
                        if (left === 0) { break inf_leave; }
                        copy = _out - left;
                        if (state.offset > copy) {         /* copy from window */
                            copy = state.offset - copy;
                            if (copy > state.whave) {
                                if (state.sane) {
                                    strm.msg = 'invalid distance too far back';
                                    state.mode = BAD;
                                    break;
                                }
// (!) This block is disabled in zlib defailts,
// don't enable it for binary compatibility
//#ifdef INFLATE_ALLOW_INVALID_DISTANCE_TOOFAR_ARRR
//          Trace((stderr, "inflate.c too far\n"));
//          copy -= state.whave;
//          if (copy > state.length) { copy = state.length; }
//          if (copy > left) { copy = left; }
//          left -= copy;
//          state.length -= copy;
//          do {
//            output[put++] = 0;
//          } while (--copy);
//          if (state.length === 0) { state.mode = LEN; }
//          break;
//#endif
                            }
                            if (copy > state.wnext) {
                                copy -= state.wnext;
                                from = state.wsize - copy;
                            }
                            else {
                                from = state.wnext - copy;
                            }
                            if (copy > state.length) { copy = state.length; }
                            from_source = state.window;
                        }
                        else {                              /* copy from output */
                            from_source = output;
                            from = put - state.offset;
                            copy = state.length;
                        }
                        if (copy > left) { copy = left; }
                        left -= copy;
                        state.length -= copy;
                        do {
                            output[put++] = from_source[from++];
                        } while (--copy);
                        if (state.length === 0) { state.mode = LEN; }
                        break;
                    case LIT:
                        if (left === 0) { break inf_leave; }
                        output[put++] = state.length;
                        left--;
                        state.mode = LEN;
                        break;
                    case CHECK:
                        if (state.wrap) {
                            //=== NEEDBITS(32);
                            while (bits < 32) {
                                if (have === 0) { break inf_leave; }
                                have--;
                                // Use '|' insdead of '+' to make sure that result is signed
                                hold |= input[next++] << bits;
                                bits += 8;
                            }
                            //===//
                            _out -= left;
                            strm.total_out += _out;
                            state.total += _out;
                            if (_out) {
                                strm.adler = state.check =
                                    /*UPDATE(state.check, put - _out, _out);*/
                                    (state.flags ? crc32(state.check, output, _out, put - _out) : adler32(state.check, output, _out, put - _out));

                            }
                            _out = left;
                            // NB: crc32 stored as signed 32-bit int, ZSWAP32 returns signed too
                            if ((state.flags ? hold : ZSWAP32(hold)) !== state.check) {
                                strm.msg = 'incorrect data check';
                                state.mode = BAD;
                                break;
                            }
                            //=== INITBITS();
                            hold = 0;
                            bits = 0;
                            //===//
                            //Tracev((stderr, "inflate:   check matches trailer\n"));
                        }
                        state.mode = LENGTH;
                    /* falls through */
                    case LENGTH:
                        if (state.wrap && state.flags) {
                            //=== NEEDBITS(32);
                            while (bits < 32) {
                                if (have === 0) { break inf_leave; }
                                have--;
                                hold += input[next++] << bits;
                                bits += 8;
                            }
                            //===//
                            if (hold !== (state.total & 0xffffffff)) {
                                strm.msg = 'incorrect length check';
                                state.mode = BAD;
                                break;
                            }
                            //=== INITBITS();
                            hold = 0;
                            bits = 0;
                            //===//
                            //Tracev((stderr, "inflate:   length matches trailer\n"));
                        }
                        state.mode = DONE;
                    /* falls through */
                    case DONE:
                        ret = Z_STREAM_END;
                        break inf_leave;
                    case BAD:
                        ret = Z_DATA_ERROR;
                        break inf_leave;
                    case MEM:
                        return Z_MEM_ERROR;
                    case SYNC:
                    /* falls through */
                    default:
                        return Z_STREAM_ERROR;
                }
            }

        // inf_leave <- here is real place for "goto inf_leave", emulated via "break inf_leave"

        /*
         Return from inflate(), updating the total counts and the check value.
         If there was no progress during the inflate() call, return a buffer
         error.  Call updatewindow() to create and/or update the window state.
         Note: a memory error from inflate() is non-recoverable.
         */

        //--- RESTORE() ---
        strm.next_out = put;
        strm.avail_out = left;
        strm.next_in = next;
        strm.avail_in = have;
        state.hold = hold;
        state.bits = bits;
        //---

        if (state.wsize || (_out !== strm.avail_out && state.mode < BAD &&
            (state.mode < CHECK || flush !== Z_FINISH))) {
            if (updatewindow(strm, strm.output, strm.next_out, _out - strm.avail_out)) {
                state.mode = MEM;
                return Z_MEM_ERROR;
            }
        }
        _in -= strm.avail_in;
        _out -= strm.avail_out;
        strm.total_in += _in;
        strm.total_out += _out;
        state.total += _out;
        if (state.wrap && _out) {
            strm.adler = state.check = /*UPDATE(state.check, strm.next_out - _out, _out);*/
                (state.flags ? crc32(state.check, output, _out, strm.next_out - _out) : adler32(state.check, output, _out, strm.next_out - _out));
        }
        strm.data_type = state.bits + (state.last ? 64 : 0) +
            (state.mode === TYPE ? 128 : 0) +
            (state.mode === LEN_ || state.mode === COPY_ ? 256 : 0);
        if (((_in === 0 && _out === 0) || flush === Z_FINISH) && ret === Z_OK) {
            ret = Z_BUF_ERROR;
        }
        return ret;
    }

    function inflateEnd(strm) {

        if (!strm || !strm.state /*|| strm->zfree == (free_func)0*/) {
            return Z_STREAM_ERROR;
        }

        var state = strm.state;
        if (state.window) {
            state.window = null;
        }
        strm.state = null;
        return Z_OK;
    }

    function inflateGetHeader(strm, head) {
        var state;

        /* check state */
        if (!strm || !strm.state) { return Z_STREAM_ERROR; }
        state = strm.state;
        if ((state.wrap & 2) === 0) { return Z_STREAM_ERROR; }

        /* save header structure */
        state.head = head;
        head.done = false;
        return Z_OK;
    }


    exports.inflateReset = inflateReset;
    exports.inflateReset2 = inflateReset2;
    exports.inflateResetKeep = inflateResetKeep;
    exports.inflateInit = inflateInit;
    exports.inflateInit2 = inflateInit2;
    exports.inflate = inflate;
    exports.inflateEnd = inflateEnd;
    exports.inflateGetHeader = inflateGetHeader;
    exports.inflateInfo = 'pako inflate (from Nodeca project)';

    /* Not implemented
     exports.inflateCopy = inflateCopy;
     exports.inflateGetDictionary = inflateGetDictionary;
     exports.inflateMark = inflateMark;
     exports.inflatePrime = inflatePrime;
     exports.inflateSetDictionary = inflateSetDictionary;
     exports.inflateSync = inflateSync;
     exports.inflateSyncPoint = inflateSyncPoint;
     exports.inflateUndermine = inflateUndermine;
     */

},{"../utils/common":16,"./adler32":18,"./crc32":20,"./inffast":23,"./inftrees":25}],25:[function(require,module,exports){
    'use strict';


    var utils = require('../utils/common');

    var MAXBITS = 15;
    var ENOUGH_LENS = 852;
    var ENOUGH_DISTS = 592;
//var ENOUGH = (ENOUGH_LENS+ENOUGH_DISTS);

    var CODES = 0;
    var LENS = 1;
    var DISTS = 2;

    var lbase = [ /* Length codes 257..285 base */
        3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31,
        35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0
    ];

    var lext = [ /* Length codes 257..285 extra */
        16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18,
        19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 72, 78
    ];

    var dbase = [ /* Distance codes 0..29 base */
        1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193,
        257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145,
        8193, 12289, 16385, 24577, 0, 0
    ];

    var dext = [ /* Distance codes 0..29 extra */
        16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22,
        23, 23, 24, 24, 25, 25, 26, 26, 27, 27,
        28, 28, 29, 29, 64, 64
    ];

    module.exports = function inflate_table(type, lens, lens_index, codes, table, table_index, work, opts)
    {
        var bits = opts.bits;
        //here = opts.here; /* table entry for duplication */

        var len = 0;               /* a code's length in bits */
        var sym = 0;               /* index of code symbols */
        var min = 0, max = 0;          /* minimum and maximum code lengths */
        var root = 0;              /* number of index bits for root table */
        var curr = 0;              /* number of index bits for current table */
        var drop = 0;              /* code bits to drop for sub-table */
        var left = 0;                   /* number of prefix codes available */
        var used = 0;              /* code entries in table used */
        var huff = 0;              /* Huffman code */
        var incr;              /* for incrementing code, index */
        var fill;              /* index for replicating entries */
        var low;               /* low bits for current root entry */
        var mask;              /* mask for low root bits */
        var next;             /* next available space in table */
        var base = null;     /* base value table to use */
        var base_index = 0;
//  var shoextra;    /* extra bits table to use */
        var end;                    /* use base and extra for symbol > end */
        var count = new utils.Buf16(MAXBITS+1); //[MAXBITS+1];    /* number of codes of each length */
        var offs = new utils.Buf16(MAXBITS+1); //[MAXBITS+1];     /* offsets in table for each length */
        var extra = null;
        var extra_index = 0;

        var here_bits, here_op, here_val;

        /*
         Process a set of code lengths to create a canonical Huffman code.  The
         code lengths are lens[0..codes-1].  Each length corresponds to the
         symbols 0..codes-1.  The Huffman code is generated by first sorting the
         symbols by length from short to long, and retaining the symbol order
         for codes with equal lengths.  Then the code starts with all zero bits
         for the first code of the shortest length, and the codes are integer
         increments for the same length, and zeros are appended as the length
         increases.  For the deflate format, these bits are stored backwards
         from their more natural integer increment ordering, and so when the
         decoding tables are built in the large loop below, the integer codes
         are incremented backwards.

         This routine assumes, but does not check, that all of the entries in
         lens[] are in the range 0..MAXBITS.  The caller must assure this.
         1..MAXBITS is interpreted as that code length.  zero means that that
         symbol does not occur in this code.

         The codes are sorted by computing a count of codes for each length,
         creating from that a table of starting indices for each length in the
         sorted table, and then entering the symbols in order in the sorted
         table.  The sorted table is work[], with that space being provided by
         the caller.

         The length counts are used for other purposes as well, i.e. finding
         the minimum and maximum length codes, determining if there are any
         codes at all, checking for a valid set of lengths, and looking ahead
         at length counts to determine sub-table sizes when building the
         decoding tables.
         */

        /* accumulate lengths for codes (assumes lens[] all in 0..MAXBITS) */
        for (len = 0; len <= MAXBITS; len++) {
            count[len] = 0;
        }
        for (sym = 0; sym < codes; sym++) {
            count[lens[lens_index + sym]]++;
        }

        /* bound code lengths, force root to be within code lengths */
        root = bits;
        for (max = MAXBITS; max >= 1; max--) {
            if (count[max] !== 0) { break; }
        }
        if (root > max) {
            root = max;
        }
        if (max === 0) {                     /* no symbols to code at all */
            //table.op[opts.table_index] = 64;  //here.op = (var char)64;    /* invalid code marker */
            //table.bits[opts.table_index] = 1;   //here.bits = (var char)1;
            //table.val[opts.table_index++] = 0;   //here.val = (var short)0;
            table[table_index++] = (1 << 24) | (64 << 16) | 0;


            //table.op[opts.table_index] = 64;
            //table.bits[opts.table_index] = 1;
            //table.val[opts.table_index++] = 0;
            table[table_index++] = (1 << 24) | (64 << 16) | 0;

            opts.bits = 1;
            return 0;     /* no symbols, but wait for decoding to report error */
        }
        for (min = 1; min < max; min++) {
            if (count[min] !== 0) { break; }
        }
        if (root < min) {
            root = min;
        }

        /* check for an over-subscribed or incomplete set of lengths */
        left = 1;
        for (len = 1; len <= MAXBITS; len++) {
            left <<= 1;
            left -= count[len];
            if (left < 0) {
                return -1;
            }        /* over-subscribed */
        }
        if (left > 0 && (type === CODES || max !== 1)) {
            return -1;                      /* incomplete set */
        }

        /* generate offsets into symbol table for each length for sorting */
        offs[1] = 0;
        for (len = 1; len < MAXBITS; len++) {
            offs[len + 1] = offs[len] + count[len];
        }

        /* sort symbols by length, by symbol order within each length */
        for (sym = 0; sym < codes; sym++) {
            if (lens[lens_index + sym] !== 0) {
                work[offs[lens[lens_index + sym]]++] = sym;
            }
        }

        /*
         Create and fill in decoding tables.  In this loop, the table being
         filled is at next and has curr index bits.  The code being used is huff
         with length len.  That code is converted to an index by dropping drop
         bits off of the bottom.  For codes where len is less than drop + curr,
         those top drop + curr - len bits are incremented through all values to
         fill the table with replicated entries.

         root is the number of index bits for the root table.  When len exceeds
         root, sub-tables are created pointed to by the root entry with an index
         of the low root bits of huff.  This is saved in low to check for when a
         new sub-table should be started.  drop is zero when the root table is
         being filled, and drop is root when sub-tables are being filled.

         When a new sub-table is needed, it is necessary to look ahead in the
         code lengths to determine what size sub-table is needed.  The length
         counts are used for this, and so count[] is decremented as codes are
         entered in the tables.

         used keeps track of how many table entries have been allocated from the
         provided *table space.  It is checked for LENS and DIST tables against
         the constants ENOUGH_LENS and ENOUGH_DISTS to guard against changes in
         the initial root table size constants.  See the comments in inftrees.h
         for more information.

         sym increments through all symbols, and the loop terminates when
         all codes of length max, i.e. all codes, have been processed.  This
         routine permits incomplete codes, so another loop after this one fills
         in the rest of the decoding tables with invalid code markers.
         */

        /* set up for code type */
        // poor man optimization - use if-else instead of switch,
        // to avoid deopts in old v8
        if (type === CODES) {
            base = extra = work;    /* dummy value--not used */
            end = 19;

        } else if (type === LENS) {
            base = lbase;
            base_index -= 257;
            extra = lext;
            extra_index -= 257;
            end = 256;

        } else {                    /* DISTS */
            base = dbase;
            extra = dext;
            end = -1;
        }

        /* initialize opts for loop */
        huff = 0;                   /* starting code */
        sym = 0;                    /* starting code symbol */
        len = min;                  /* starting code length */
        next = table_index;              /* current table to fill in */
        curr = root;                /* current table index bits */
        drop = 0;                   /* current bits to drop from code for index */
        low = -1;                   /* trigger new sub-table when len > root */
        used = 1 << root;          /* use root table entries */
        mask = used - 1;            /* mask for comparing low */

        /* check available table space */
        if ((type === LENS && used > ENOUGH_LENS) ||
            (type === DISTS && used > ENOUGH_DISTS)) {
            return 1;
        }

        var i=0;
        /* process all codes and make table entries */
        for (;;) {
            i++;
            /* create table entry */
            here_bits = len - drop;
            if (work[sym] < end) {
                here_op = 0;
                here_val = work[sym];
            }
            else if (work[sym] > end) {
                here_op = extra[extra_index + work[sym]];
                here_val = base[base_index + work[sym]];
            }
            else {
                here_op = 32 + 64;         /* end of block */
                here_val = 0;
            }

            /* replicate for those indices with low len bits equal to huff */
            incr = 1 << (len - drop);
            fill = 1 << curr;
            min = fill;                 /* save offset to next table */
            do {
                fill -= incr;
                table[next + (huff >> drop) + fill] = (here_bits << 24) | (here_op << 16) | here_val |0;
            } while (fill !== 0);

            /* backwards increment the len-bit code huff */
            incr = 1 << (len - 1);
            while (huff & incr) {
                incr >>= 1;
            }
            if (incr !== 0) {
                huff &= incr - 1;
                huff += incr;
            } else {
                huff = 0;
            }

            /* go to next symbol, update count, len */
            sym++;
            if (--count[len] === 0) {
                if (len === max) { break; }
                len = lens[lens_index + work[sym]];
            }

            /* create new sub-table if needed */
            if (len > root && (huff & mask) !== low) {
                /* if first time, transition to sub-tables */
                if (drop === 0) {
                    drop = root;
                }

                /* increment past last table */
                next += min;            /* here min is 1 << curr */

                /* determine length of next table */
                curr = len - drop;
                left = 1 << curr;
                while (curr + drop < max) {
                    left -= count[curr + drop];
                    if (left <= 0) { break; }
                    curr++;
                    left <<= 1;
                }

                /* check for enough space */
                used += 1 << curr;
                if ((type === LENS && used > ENOUGH_LENS) ||
                    (type === DISTS && used > ENOUGH_DISTS)) {
                    return 1;
                }

                /* point entry in root table to sub-table */
                low = huff & mask;
                /*table.op[low] = curr;
                 table.bits[low] = root;
                 table.val[low] = next - opts.table_index;*/
                table[low] = (root << 24) | (curr << 16) | (next - table_index) |0;
            }
        }

        /* fill in remaining table entry if code is incomplete (guaranteed to have
         at most one remaining entry, since if the code is incomplete, the
         maximum code length that was allowed to get this far is one bit) */
        if (huff !== 0) {
            //table.op[next + huff] = 64;            /* invalid code marker */
            //table.bits[next + huff] = len - drop;
            //table.val[next + huff] = 0;
            table[next + huff] = ((len - drop) << 24) | (64 << 16) |0;
        }

        /* set return parameters */
        //opts.table_index += used;
        opts.bits = root;
        return 0;
    };

},{"../utils/common":16}],26:[function(require,module,exports){
    'use strict';

    module.exports = {
        '2':    'need dictionary',     /* Z_NEED_DICT       2  */
        '1':    'stream end',          /* Z_STREAM_END      1  */
        '0':    '',                    /* Z_OK              0  */
        '-1':   'file error',          /* Z_ERRNO         (-1) */
        '-2':   'stream error',        /* Z_STREAM_ERROR  (-2) */
        '-3':   'data error',          /* Z_DATA_ERROR    (-3) */
        '-4':   'insufficient memory', /* Z_MEM_ERROR     (-4) */
        '-5':   'buffer error',        /* Z_BUF_ERROR     (-5) */
        '-6':   'incompatible version' /* Z_VERSION_ERROR (-6) */
    };

},{}],27:[function(require,module,exports){
    'use strict';


    var utils = require('../utils/common');

    /* Public constants ==========================================================*/
    /* ===========================================================================*/


//var Z_FILTERED          = 1;
//var Z_HUFFMAN_ONLY      = 2;
//var Z_RLE               = 3;
    var Z_FIXED               = 4;
//var Z_DEFAULT_STRATEGY  = 0;

    /* Possible values of the data_type field (though see inflate()) */
    var Z_BINARY              = 0;
    var Z_TEXT                = 1;
//var Z_ASCII             = 1; // = Z_TEXT
    var Z_UNKNOWN             = 2;

    /*============================================================================*/


    function zero(buf) { var len = buf.length; while (--len >= 0) { buf[len] = 0; } }

// From zutil.h

    var STORED_BLOCK = 0;
    var STATIC_TREES = 1;
    var DYN_TREES    = 2;
    /* The three kinds of block type */

    var MIN_MATCH    = 3;
    var MAX_MATCH    = 258;
    /* The minimum and maximum match lengths */

// From deflate.h
    /* ===========================================================================
     * Internal compression state.
     */

    var LENGTH_CODES  = 29;
    /* number of length codes, not counting the special END_BLOCK code */

    var LITERALS      = 256;
    /* number of literal bytes 0..255 */

    var L_CODES       = LITERALS + 1 + LENGTH_CODES;
    /* number of Literal or Length codes, including the END_BLOCK code */

    var D_CODES       = 30;
    /* number of distance codes */

    var BL_CODES      = 19;
    /* number of codes used to transfer the bit lengths */

    var HEAP_SIZE     = 2*L_CODES + 1;
    /* maximum heap size */

    var MAX_BITS      = 15;
    /* All codes must not exceed MAX_BITS bits */

    var Buf_size      = 16;
    /* size of bit buffer in bi_buf */


    /* ===========================================================================
     * Constants
     */

    var MAX_BL_BITS = 7;
    /* Bit length codes must not exceed MAX_BL_BITS bits */

    var END_BLOCK   = 256;
    /* end of block literal code */

    var REP_3_6     = 16;
    /* repeat previous bit length 3-6 times (2 bits of repeat count) */

    var REPZ_3_10   = 17;
    /* repeat a zero length 3-10 times  (3 bits of repeat count) */

    var REPZ_11_138 = 18;
    /* repeat a zero length 11-138 times  (7 bits of repeat count) */

    var extra_lbits =   /* extra bits for each length code */
        [0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0];

    var extra_dbits =   /* extra bits for each distance code */
        [0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13];

    var extra_blbits =  /* extra bits for each bit length code */
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7];

    var bl_order =
        [16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];
    /* The lengths of the bit length codes are sent in order of decreasing
     * probability, to avoid transmitting the lengths for unused bit length codes.
     */

    /* ===========================================================================
     * Local data. These are initialized only once.
     */

// We pre-fill arrays with 0 to avoid uninitialized gaps

    var DIST_CODE_LEN = 512; /* see definition of array dist_code below */

// !!!! Use flat array insdead of structure, Freq = i*2, Len = i*2+1
    var static_ltree  = new Array((L_CODES+2) * 2);
    zero(static_ltree);
    /* The static literal tree. Since the bit lengths are imposed, there is no
     * need for the L_CODES extra codes used during heap construction. However
     * The codes 286 and 287 are needed to build a canonical tree (see _tr_init
     * below).
     */

    var static_dtree  = new Array(D_CODES * 2);
    zero(static_dtree);
    /* The static distance tree. (Actually a trivial tree since all codes use
     * 5 bits.)
     */

    var _dist_code    = new Array(DIST_CODE_LEN);
    zero(_dist_code);
    /* Distance codes. The first 256 values correspond to the distances
     * 3 .. 258, the last 256 values correspond to the top 8 bits of
     * the 15 bit distances.
     */

    var _length_code  = new Array(MAX_MATCH-MIN_MATCH+1);
    zero(_length_code);
    /* length code for each normalized match length (0 == MIN_MATCH) */

    var base_length   = new Array(LENGTH_CODES);
    zero(base_length);
    /* First normalized length for each code (0 = MIN_MATCH) */

    var base_dist     = new Array(D_CODES);
    zero(base_dist);
    /* First normalized distance for each code (0 = distance of 1) */


    var StaticTreeDesc = function (static_tree, extra_bits, extra_base, elems, max_length) {

        this.static_tree  = static_tree;  /* static tree or NULL */
        this.extra_bits   = extra_bits;   /* extra bits for each code or NULL */
        this.extra_base   = extra_base;   /* base index for extra_bits */
        this.elems        = elems;        /* max number of elements in the tree */
        this.max_length   = max_length;   /* max bit length for the codes */

        // show if `static_tree` has data or dummy - needed for monomorphic objects
        this.has_stree    = static_tree && static_tree.length;
    };


    var static_l_desc;
    var static_d_desc;
    var static_bl_desc;


    var TreeDesc = function(dyn_tree, stat_desc) {
        this.dyn_tree = dyn_tree;     /* the dynamic tree */
        this.max_code = 0;            /* largest code with non zero frequency */
        this.stat_desc = stat_desc;   /* the corresponding static tree */
    };



    function d_code(dist) {
        return dist < 256 ? _dist_code[dist] : _dist_code[256 + (dist >>> 7)];
    }


    /* ===========================================================================
     * Output a short LSB first on the stream.
     * IN assertion: there is enough room in pendingBuf.
     */
    function put_short (s, w) {
//    put_byte(s, (uch)((w) & 0xff));
//    put_byte(s, (uch)((ush)(w) >> 8));
        s.pending_buf[s.pending++] = (w) & 0xff;
        s.pending_buf[s.pending++] = (w >>> 8) & 0xff;
    }


    /* ===========================================================================
     * Send a value on a given number of bits.
     * IN assertion: length <= 16 and value fits in length bits.
     */
    function send_bits(s, value, length) {
        if (s.bi_valid > (Buf_size - length)) {
            s.bi_buf |= (value << s.bi_valid) & 0xffff;
            put_short(s, s.bi_buf);
            s.bi_buf = value >> (Buf_size - s.bi_valid);
            s.bi_valid += length - Buf_size;
        } else {
            s.bi_buf |= (value << s.bi_valid) & 0xffff;
            s.bi_valid += length;
        }
    }


    function send_code(s, c, tree) {
        send_bits(s, tree[c*2]/*.Code*/, tree[c*2 + 1]/*.Len*/);
    }


    /* ===========================================================================
     * Reverse the first len bits of a code, using straightforward code (a faster
     * method would use a table)
     * IN assertion: 1 <= len <= 15
     */
    function bi_reverse(code, len) {
        var res = 0;
        do {
            res |= code & 1;
            code >>>= 1;
            res <<= 1;
        } while (--len > 0);
        return res >>> 1;
    }


    /* ===========================================================================
     * Flush the bit buffer, keeping at most 7 bits in it.
     */
    function bi_flush(s) {
        if (s.bi_valid === 16) {
            put_short(s, s.bi_buf);
            s.bi_buf = 0;
            s.bi_valid = 0;

        } else if (s.bi_valid >= 8) {
            s.pending_buf[s.pending++] = s.bi_buf & 0xff;
            s.bi_buf >>= 8;
            s.bi_valid -= 8;
        }
    }


    /* ===========================================================================
     * Compute the optimal bit lengths for a tree and update the total bit length
     * for the current block.
     * IN assertion: the fields freq and dad are set, heap[heap_max] and
     *    above are the tree nodes sorted by increasing frequency.
     * OUT assertions: the field len is set to the optimal bit length, the
     *     array bl_count contains the frequencies for each bit length.
     *     The length opt_len is updated; static_len is also updated if stree is
     *     not null.
     */
    function gen_bitlen(s, desc)
//    deflate_state *s;
//    tree_desc *desc;    /* the tree descriptor */
    {
        var tree            = desc.dyn_tree;
        var max_code        = desc.max_code;
        var stree           = desc.stat_desc.static_tree;
        var has_stree       = desc.stat_desc.has_stree;
        var extra           = desc.stat_desc.extra_bits;
        var base            = desc.stat_desc.extra_base;
        var max_length      = desc.stat_desc.max_length;
        var h;              /* heap index */
        var n, m;           /* iterate over the tree elements */
        var bits;           /* bit length */
        var xbits;          /* extra bits */
        var f;              /* frequency */
        var overflow = 0;   /* number of elements with bit length too large */

        for (bits = 0; bits <= MAX_BITS; bits++) {
            s.bl_count[bits] = 0;
        }

        /* In a first pass, compute the optimal bit lengths (which may
         * overflow in the case of the bit length tree).
         */
        tree[s.heap[s.heap_max]*2 + 1]/*.Len*/ = 0; /* root of the heap */

        for (h = s.heap_max+1; h < HEAP_SIZE; h++) {
            n = s.heap[h];
            bits = tree[tree[n*2 +1]/*.Dad*/ * 2 + 1]/*.Len*/ + 1;
            if (bits > max_length) {
                bits = max_length;
                overflow++;
            }
            tree[n*2 + 1]/*.Len*/ = bits;
            /* We overwrite tree[n].Dad which is no longer needed */

            if (n > max_code) { continue; } /* not a leaf node */

            s.bl_count[bits]++;
            xbits = 0;
            if (n >= base) {
                xbits = extra[n-base];
            }
            f = tree[n * 2]/*.Freq*/;
            s.opt_len += f * (bits + xbits);
            if (has_stree) {
                s.static_len += f * (stree[n*2 + 1]/*.Len*/ + xbits);
            }
        }
        if (overflow === 0) { return; }

        // Trace((stderr,"\nbit length overflow\n"));
        /* This happens for example on obj2 and pic of the Calgary corpus */

        /* Find the first bit length which could increase: */
        do {
            bits = max_length-1;
            while (s.bl_count[bits] === 0) { bits--; }
            s.bl_count[bits]--;      /* move one leaf down the tree */
            s.bl_count[bits+1] += 2; /* move one overflow item as its brother */
            s.bl_count[max_length]--;
            /* The brother of the overflow item also moves one step up,
             * but this does not affect bl_count[max_length]
             */
            overflow -= 2;
        } while (overflow > 0);

        /* Now recompute all bit lengths, scanning in increasing frequency.
         * h is still equal to HEAP_SIZE. (It is simpler to reconstruct all
         * lengths instead of fixing only the wrong ones. This idea is taken
         * from 'ar' written by Haruhiko Okumura.)
         */
        for (bits = max_length; bits !== 0; bits--) {
            n = s.bl_count[bits];
            while (n !== 0) {
                m = s.heap[--h];
                if (m > max_code) { continue; }
                if (tree[m*2 + 1]/*.Len*/ !== bits) {
                    // Trace((stderr,"code %d bits %d->%d\n", m, tree[m].Len, bits));
                    s.opt_len += (bits - tree[m*2 + 1]/*.Len*/)*tree[m*2]/*.Freq*/;
                    tree[m*2 + 1]/*.Len*/ = bits;
                }
                n--;
            }
        }
    }


    /* ===========================================================================
     * Generate the codes for a given tree and bit counts (which need not be
     * optimal).
     * IN assertion: the array bl_count contains the bit length statistics for
     * the given tree and the field len is set for all tree elements.
     * OUT assertion: the field code is set for all tree elements of non
     *     zero code length.
     */
    function gen_codes(tree, max_code, bl_count)
//    ct_data *tree;             /* the tree to decorate */
//    int max_code;              /* largest code with non zero frequency */
//    ushf *bl_count;            /* number of codes at each bit length */
    {
        var next_code = new Array(MAX_BITS+1); /* next code value for each bit length */
        var code = 0;              /* running code value */
        var bits;                  /* bit index */
        var n;                     /* code index */

        /* The distribution counts are first used to generate the code values
         * without bit reversal.
         */
        for (bits = 1; bits <= MAX_BITS; bits++) {
            next_code[bits] = code = (code + bl_count[bits-1]) << 1;
        }
        /* Check that the bit counts in bl_count are consistent. The last code
         * must be all ones.
         */
        //Assert (code + bl_count[MAX_BITS]-1 == (1<<MAX_BITS)-1,
        //        "inconsistent bit counts");
        //Tracev((stderr,"\ngen_codes: max_code %d ", max_code));

        for (n = 0;  n <= max_code; n++) {
            var len = tree[n*2 + 1]/*.Len*/;
            if (len === 0) { continue; }
            /* Now reverse the bits */
            tree[n*2]/*.Code*/ = bi_reverse(next_code[len]++, len);

            //Tracecv(tree != static_ltree, (stderr,"\nn %3d %c l %2d c %4x (%x) ",
            //     n, (isgraph(n) ? n : ' '), len, tree[n].Code, next_code[len]-1));
        }
    }


    /* ===========================================================================
     * Initialize the various 'constant' tables.
     */
    function tr_static_init() {
        var n;        /* iterates over tree elements */
        var bits;     /* bit counter */
        var length;   /* length value */
        var code;     /* code value */
        var dist;     /* distance index */
        var bl_count = new Array(MAX_BITS+1);
        /* number of codes at each bit length for an optimal tree */

        // do check in _tr_init()
        //if (static_init_done) return;

        /* For some embedded targets, global variables are not initialized: */
        /*#ifdef NO_INIT_GLOBAL_POINTERS
         static_l_desc.static_tree = static_ltree;
         static_l_desc.extra_bits = extra_lbits;
         static_d_desc.static_tree = static_dtree;
         static_d_desc.extra_bits = extra_dbits;
         static_bl_desc.extra_bits = extra_blbits;
         #endif*/

        /* Initialize the mapping length (0..255) -> length code (0..28) */
        length = 0;
        for (code = 0; code < LENGTH_CODES-1; code++) {
            base_length[code] = length;
            for (n = 0; n < (1<<extra_lbits[code]); n++) {
                _length_code[length++] = code;
            }
        }
        //Assert (length == 256, "tr_static_init: length != 256");
        /* Note that the length 255 (match length 258) can be represented
         * in two different ways: code 284 + 5 bits or code 285, so we
         * overwrite length_code[255] to use the best encoding:
         */
        _length_code[length-1] = code;

        /* Initialize the mapping dist (0..32K) -> dist code (0..29) */
        dist = 0;
        for (code = 0 ; code < 16; code++) {
            base_dist[code] = dist;
            for (n = 0; n < (1<<extra_dbits[code]); n++) {
                _dist_code[dist++] = code;
            }
        }
        //Assert (dist == 256, "tr_static_init: dist != 256");
        dist >>= 7; /* from now on, all distances are divided by 128 */
        for (; code < D_CODES; code++) {
            base_dist[code] = dist << 7;
            for (n = 0; n < (1<<(extra_dbits[code]-7)); n++) {
                _dist_code[256 + dist++] = code;
            }
        }
        //Assert (dist == 256, "tr_static_init: 256+dist != 512");

        /* Construct the codes of the static literal tree */
        for (bits = 0; bits <= MAX_BITS; bits++) {
            bl_count[bits] = 0;
        }

        n = 0;
        while (n <= 143) {
            static_ltree[n*2 + 1]/*.Len*/ = 8;
            n++;
            bl_count[8]++;
        }
        while (n <= 255) {
            static_ltree[n*2 + 1]/*.Len*/ = 9;
            n++;
            bl_count[9]++;
        }
        while (n <= 279) {
            static_ltree[n*2 + 1]/*.Len*/ = 7;
            n++;
            bl_count[7]++;
        }
        while (n <= 287) {
            static_ltree[n*2 + 1]/*.Len*/ = 8;
            n++;
            bl_count[8]++;
        }
        /* Codes 286 and 287 do not exist, but we must include them in the
         * tree construction to get a canonical Huffman tree (longest code
         * all ones)
         */
        gen_codes(static_ltree, L_CODES+1, bl_count);

        /* The static distance tree is trivial: */
        for (n = 0; n < D_CODES; n++) {
            static_dtree[n*2 + 1]/*.Len*/ = 5;
            static_dtree[n*2]/*.Code*/ = bi_reverse(n, 5);
        }

        // Now data ready and we can init static trees
        static_l_desc = new StaticTreeDesc(static_ltree, extra_lbits, LITERALS+1, L_CODES, MAX_BITS);
        static_d_desc = new StaticTreeDesc(static_dtree, extra_dbits, 0,          D_CODES, MAX_BITS);
        static_bl_desc =new StaticTreeDesc(new Array(0), extra_blbits, 0,         BL_CODES, MAX_BL_BITS);

        //static_init_done = true;
    }


    /* ===========================================================================
     * Initialize a new block.
     */
    function init_block(s) {
        var n; /* iterates over tree elements */

        /* Initialize the trees. */
        for (n = 0; n < L_CODES;  n++) { s.dyn_ltree[n*2]/*.Freq*/ = 0; }
        for (n = 0; n < D_CODES;  n++) { s.dyn_dtree[n*2]/*.Freq*/ = 0; }
        for (n = 0; n < BL_CODES; n++) { s.bl_tree[n*2]/*.Freq*/ = 0; }

        s.dyn_ltree[END_BLOCK*2]/*.Freq*/ = 1;
        s.opt_len = s.static_len = 0;
        s.last_lit = s.matches = 0;
    }


    /* ===========================================================================
     * Flush the bit buffer and align the output on a byte boundary
     */
    function bi_windup(s)
    {
        if (s.bi_valid > 8) {
            put_short(s, s.bi_buf);
        } else if (s.bi_valid > 0) {
            //put_byte(s, (Byte)s->bi_buf);
            s.pending_buf[s.pending++] = s.bi_buf;
        }
        s.bi_buf = 0;
        s.bi_valid = 0;
    }

    /* ===========================================================================
     * Copy a stored block, storing first the length and its
     * one's complement if requested.
     */
    function copy_block(s, buf, len, header)
//DeflateState *s;
//charf    *buf;    /* the input data */
//unsigned len;     /* its length */
//int      header;  /* true if block header must be written */
    {
        bi_windup(s);        /* align on byte boundary */

        if (header) {
            put_short(s, len);
            put_short(s, ~len);
        }
//  while (len--) {
//    put_byte(s, *buf++);
//  }
        utils.arraySet(s.pending_buf, s.window, buf, len, s.pending);
        s.pending += len;
    }

    /* ===========================================================================
     * Compares to subtrees, using the tree depth as tie breaker when
     * the subtrees have equal frequency. This minimizes the worst case length.
     */
    function smaller(tree, n, m, depth) {
        var _n2 = n*2;
        var _m2 = m*2;
        return (tree[_n2]/*.Freq*/ < tree[_m2]/*.Freq*/ ||
        (tree[_n2]/*.Freq*/ === tree[_m2]/*.Freq*/ && depth[n] <= depth[m]));
    }

    /* ===========================================================================
     * Restore the heap property by moving down the tree starting at node k,
     * exchanging a node with the smallest of its two sons if necessary, stopping
     * when the heap property is re-established (each father smaller than its
     * two sons).
     */
    function pqdownheap(s, tree, k)
//    deflate_state *s;
//    ct_data *tree;  /* the tree to restore */
//    int k;               /* node to move down */
    {
        var v = s.heap[k];
        var j = k << 1;  /* left son of k */
        while (j <= s.heap_len) {
            /* Set j to the smallest of the two sons: */
            if (j < s.heap_len &&
                smaller(tree, s.heap[j+1], s.heap[j], s.depth)) {
                j++;
            }
            /* Exit if v is smaller than both sons */
            if (smaller(tree, v, s.heap[j], s.depth)) { break; }

            /* Exchange v with the smallest son */
            s.heap[k] = s.heap[j];
            k = j;

            /* And continue down the tree, setting j to the left son of k */
            j <<= 1;
        }
        s.heap[k] = v;
    }


// inlined manually
// var SMALLEST = 1;

    /* ===========================================================================
     * Send the block data compressed using the given Huffman trees
     */
    function compress_block(s, ltree, dtree)
//    deflate_state *s;
//    const ct_data *ltree; /* literal tree */
//    const ct_data *dtree; /* distance tree */
    {
        var dist;           /* distance of matched string */
        var lc;             /* match length or unmatched char (if dist == 0) */
        var lx = 0;         /* running index in l_buf */
        var code;           /* the code to send */
        var extra;          /* number of extra bits to send */

        if (s.last_lit !== 0) {
            do {
                dist = (s.pending_buf[s.d_buf + lx*2] << 8) | (s.pending_buf[s.d_buf + lx*2 + 1]);
                lc = s.pending_buf[s.l_buf + lx];
                lx++;

                if (dist === 0) {
                    send_code(s, lc, ltree); /* send a literal byte */
                    //Tracecv(isgraph(lc), (stderr," '%c' ", lc));
                } else {
                    /* Here, lc is the match length - MIN_MATCH */
                    code = _length_code[lc];
                    send_code(s, code+LITERALS+1, ltree); /* send the length code */
                    extra = extra_lbits[code];
                    if (extra !== 0) {
                        lc -= base_length[code];
                        send_bits(s, lc, extra);       /* send the extra length bits */
                    }
                    dist--; /* dist is now the match distance - 1 */
                    code = d_code(dist);
                    //Assert (code < D_CODES, "bad d_code");

                    send_code(s, code, dtree);       /* send the distance code */
                    extra = extra_dbits[code];
                    if (extra !== 0) {
                        dist -= base_dist[code];
                        send_bits(s, dist, extra);   /* send the extra distance bits */
                    }
                } /* literal or match pair ? */

                /* Check that the overlay between pending_buf and d_buf+l_buf is ok: */
                //Assert((uInt)(s->pending) < s->lit_bufsize + 2*lx,
                //       "pendingBuf overflow");

            } while (lx < s.last_lit);
        }

        send_code(s, END_BLOCK, ltree);
    }


    /* ===========================================================================
     * Construct one Huffman tree and assigns the code bit strings and lengths.
     * Update the total bit length for the current block.
     * IN assertion: the field freq is set for all tree elements.
     * OUT assertions: the fields len and code are set to the optimal bit length
     *     and corresponding code. The length opt_len is updated; static_len is
     *     also updated if stree is not null. The field max_code is set.
     */
    function build_tree(s, desc)
//    deflate_state *s;
//    tree_desc *desc; /* the tree descriptor */
    {
        var tree     = desc.dyn_tree;
        var stree    = desc.stat_desc.static_tree;
        var has_stree = desc.stat_desc.has_stree;
        var elems    = desc.stat_desc.elems;
        var n, m;          /* iterate over heap elements */
        var max_code = -1; /* largest code with non zero frequency */
        var node;          /* new node being created */

        /* Construct the initial heap, with least frequent element in
         * heap[SMALLEST]. The sons of heap[n] are heap[2*n] and heap[2*n+1].
         * heap[0] is not used.
         */
        s.heap_len = 0;
        s.heap_max = HEAP_SIZE;

        for (n = 0; n < elems; n++) {
            if (tree[n * 2]/*.Freq*/ !== 0) {
                s.heap[++s.heap_len] = max_code = n;
                s.depth[n] = 0;

            } else {
                tree[n*2 + 1]/*.Len*/ = 0;
            }
        }

        /* The pkzip format requires that at least one distance code exists,
         * and that at least one bit should be sent even if there is only one
         * possible code. So to avoid special checks later on we force at least
         * two codes of non zero frequency.
         */
        while (s.heap_len < 2) {
            node = s.heap[++s.heap_len] = (max_code < 2 ? ++max_code : 0);
            tree[node * 2]/*.Freq*/ = 1;
            s.depth[node] = 0;
            s.opt_len--;

            if (has_stree) {
                s.static_len -= stree[node*2 + 1]/*.Len*/;
            }
            /* node is 0 or 1 so it does not have extra bits */
        }
        desc.max_code = max_code;

        /* The elements heap[heap_len/2+1 .. heap_len] are leaves of the tree,
         * establish sub-heaps of increasing lengths:
         */
        for (n = (s.heap_len >> 1/*int /2*/); n >= 1; n--) { pqdownheap(s, tree, n); }

        /* Construct the Huffman tree by repeatedly combining the least two
         * frequent nodes.
         */
        node = elems;              /* next internal node of the tree */
        do {
            //pqremove(s, tree, n);  /* n = node of least frequency */
            /*** pqremove ***/
            n = s.heap[1/*SMALLEST*/];
            s.heap[1/*SMALLEST*/] = s.heap[s.heap_len--];
            pqdownheap(s, tree, 1/*SMALLEST*/);
            /***/

            m = s.heap[1/*SMALLEST*/]; /* m = node of next least frequency */

            s.heap[--s.heap_max] = n; /* keep the nodes sorted by frequency */
            s.heap[--s.heap_max] = m;

            /* Create a new node father of n and m */
            tree[node * 2]/*.Freq*/ = tree[n * 2]/*.Freq*/ + tree[m * 2]/*.Freq*/;
            s.depth[node] = (s.depth[n] >= s.depth[m] ? s.depth[n] : s.depth[m]) + 1;
            tree[n*2 + 1]/*.Dad*/ = tree[m*2 + 1]/*.Dad*/ = node;

            /* and insert the new node in the heap */
            s.heap[1/*SMALLEST*/] = node++;
            pqdownheap(s, tree, 1/*SMALLEST*/);

        } while (s.heap_len >= 2);

        s.heap[--s.heap_max] = s.heap[1/*SMALLEST*/];

        /* At this point, the fields freq and dad are set. We can now
         * generate the bit lengths.
         */
        gen_bitlen(s, desc);

        /* The field len is now set, we can generate the bit codes */
        gen_codes(tree, max_code, s.bl_count);
    }


    /* ===========================================================================
     * Scan a literal or distance tree to determine the frequencies of the codes
     * in the bit length tree.
     */
    function scan_tree(s, tree, max_code)
//    deflate_state *s;
//    ct_data *tree;   /* the tree to be scanned */
//    int max_code;    /* and its largest code of non zero frequency */
    {
        var n;                     /* iterates over all tree elements */
        var prevlen = -1;          /* last emitted length */
        var curlen;                /* length of current code */

        var nextlen = tree[0*2 + 1]/*.Len*/; /* length of next code */

        var count = 0;             /* repeat count of the current code */
        var max_count = 7;         /* max repeat count */
        var min_count = 4;         /* min repeat count */

        if (nextlen === 0) {
            max_count = 138;
            min_count = 3;
        }
        tree[(max_code+1)*2 + 1]/*.Len*/ = 0xffff; /* guard */

        for (n = 0; n <= max_code; n++) {
            curlen = nextlen;
            nextlen = tree[(n+1)*2 + 1]/*.Len*/;

            if (++count < max_count && curlen === nextlen) {
                continue;

            } else if (count < min_count) {
                s.bl_tree[curlen * 2]/*.Freq*/ += count;

            } else if (curlen !== 0) {

                if (curlen !== prevlen) { s.bl_tree[curlen * 2]/*.Freq*/++; }
                s.bl_tree[REP_3_6*2]/*.Freq*/++;

            } else if (count <= 10) {
                s.bl_tree[REPZ_3_10*2]/*.Freq*/++;

            } else {
                s.bl_tree[REPZ_11_138*2]/*.Freq*/++;
            }

            count = 0;
            prevlen = curlen;

            if (nextlen === 0) {
                max_count = 138;
                min_count = 3;

            } else if (curlen === nextlen) {
                max_count = 6;
                min_count = 3;

            } else {
                max_count = 7;
                min_count = 4;
            }
        }
    }


    /* ===========================================================================
     * Send a literal or distance tree in compressed form, using the codes in
     * bl_tree.
     */
    function send_tree(s, tree, max_code)
//    deflate_state *s;
//    ct_data *tree; /* the tree to be scanned */
//    int max_code;       /* and its largest code of non zero frequency */
    {
        var n;                     /* iterates over all tree elements */
        var prevlen = -1;          /* last emitted length */
        var curlen;                /* length of current code */

        var nextlen = tree[0*2 + 1]/*.Len*/; /* length of next code */

        var count = 0;             /* repeat count of the current code */
        var max_count = 7;         /* max repeat count */
        var min_count = 4;         /* min repeat count */

        /* tree[max_code+1].Len = -1; */  /* guard already set */
        if (nextlen === 0) {
            max_count = 138;
            min_count = 3;
        }

        for (n = 0; n <= max_code; n++) {
            curlen = nextlen;
            nextlen = tree[(n+1)*2 + 1]/*.Len*/;

            if (++count < max_count && curlen === nextlen) {
                continue;

            } else if (count < min_count) {
                do { send_code(s, curlen, s.bl_tree); } while (--count !== 0);

            } else if (curlen !== 0) {
                if (curlen !== prevlen) {
                    send_code(s, curlen, s.bl_tree);
                    count--;
                }
                //Assert(count >= 3 && count <= 6, " 3_6?");
                send_code(s, REP_3_6, s.bl_tree);
                send_bits(s, count-3, 2);

            } else if (count <= 10) {
                send_code(s, REPZ_3_10, s.bl_tree);
                send_bits(s, count-3, 3);

            } else {
                send_code(s, REPZ_11_138, s.bl_tree);
                send_bits(s, count-11, 7);
            }

            count = 0;
            prevlen = curlen;
            if (nextlen === 0) {
                max_count = 138;
                min_count = 3;

            } else if (curlen === nextlen) {
                max_count = 6;
                min_count = 3;

            } else {
                max_count = 7;
                min_count = 4;
            }
        }
    }


    /* ===========================================================================
     * Construct the Huffman tree for the bit lengths and return the index in
     * bl_order of the last bit length code to send.
     */
    function build_bl_tree(s) {
        var max_blindex;  /* index of last bit length code of non zero freq */

        /* Determine the bit length frequencies for literal and distance trees */
        scan_tree(s, s.dyn_ltree, s.l_desc.max_code);
        scan_tree(s, s.dyn_dtree, s.d_desc.max_code);

        /* Build the bit length tree: */
        build_tree(s, s.bl_desc);
        /* opt_len now includes the length of the tree representations, except
         * the lengths of the bit lengths codes and the 5+5+4 bits for the counts.
         */

        /* Determine the number of bit length codes to send. The pkzip format
         * requires that at least 4 bit length codes be sent. (appnote.txt says
         * 3 but the actual value used is 4.)
         */
        for (max_blindex = BL_CODES-1; max_blindex >= 3; max_blindex--) {
            if (s.bl_tree[bl_order[max_blindex]*2 + 1]/*.Len*/ !== 0) {
                break;
            }
        }
        /* Update opt_len to include the bit length tree and counts */
        s.opt_len += 3*(max_blindex+1) + 5+5+4;
        //Tracev((stderr, "\ndyn trees: dyn %ld, stat %ld",
        //        s->opt_len, s->static_len));

        return max_blindex;
    }


    /* ===========================================================================
     * Send the header for a block using dynamic Huffman trees: the counts, the
     * lengths of the bit length codes, the literal tree and the distance tree.
     * IN assertion: lcodes >= 257, dcodes >= 1, blcodes >= 4.
     */
    function send_all_trees(s, lcodes, dcodes, blcodes)
//    deflate_state *s;
//    int lcodes, dcodes, blcodes; /* number of codes for each tree */
    {
        var rank;                    /* index in bl_order */

        //Assert (lcodes >= 257 && dcodes >= 1 && blcodes >= 4, "not enough codes");
        //Assert (lcodes <= L_CODES && dcodes <= D_CODES && blcodes <= BL_CODES,
        //        "too many codes");
        //Tracev((stderr, "\nbl counts: "));
        send_bits(s, lcodes-257, 5); /* not +255 as stated in appnote.txt */
        send_bits(s, dcodes-1,   5);
        send_bits(s, blcodes-4,  4); /* not -3 as stated in appnote.txt */
        for (rank = 0; rank < blcodes; rank++) {
            //Tracev((stderr, "\nbl code %2d ", bl_order[rank]));
            send_bits(s, s.bl_tree[bl_order[rank]*2 + 1]/*.Len*/, 3);
        }
        //Tracev((stderr, "\nbl tree: sent %ld", s->bits_sent));

        send_tree(s, s.dyn_ltree, lcodes-1); /* literal tree */
        //Tracev((stderr, "\nlit tree: sent %ld", s->bits_sent));

        send_tree(s, s.dyn_dtree, dcodes-1); /* distance tree */
        //Tracev((stderr, "\ndist tree: sent %ld", s->bits_sent));
    }


    /* ===========================================================================
     * Check if the data type is TEXT or BINARY, using the following algorithm:
     * - TEXT if the two conditions below are satisfied:
     *    a) There are no non-portable control characters belonging to the
     *       "black list" (0..6, 14..25, 28..31).
     *    b) There is at least one printable character belonging to the
     *       "white list" (9 {TAB}, 10 {LF}, 13 {CR}, 32..255).
     * - BINARY otherwise.
     * - The following partially-portable control characters form a
     *   "gray list" that is ignored in this detection algorithm:
     *   (7 {BEL}, 8 {BS}, 11 {VT}, 12 {FF}, 26 {SUB}, 27 {ESC}).
     * IN assertion: the fields Freq of dyn_ltree are set.
     */
    function detect_data_type(s) {
        /* black_mask is the bit mask of black-listed bytes
         * set bits 0..6, 14..25, and 28..31
         * 0xf3ffc07f = binary 11110011111111111100000001111111
         */
        var black_mask = 0xf3ffc07f;
        var n;

        /* Check for non-textual ("black-listed") bytes. */
        for (n = 0; n <= 31; n++, black_mask >>>= 1) {
            if ((black_mask & 1) && (s.dyn_ltree[n*2]/*.Freq*/ !== 0)) {
                return Z_BINARY;
            }
        }

        /* Check for textual ("white-listed") bytes. */
        if (s.dyn_ltree[9 * 2]/*.Freq*/ !== 0 || s.dyn_ltree[10 * 2]/*.Freq*/ !== 0 ||
            s.dyn_ltree[13 * 2]/*.Freq*/ !== 0) {
            return Z_TEXT;
        }
        for (n = 32; n < LITERALS; n++) {
            if (s.dyn_ltree[n * 2]/*.Freq*/ !== 0) {
                return Z_TEXT;
            }
        }

        /* There are no "black-listed" or "white-listed" bytes:
         * this stream either is empty or has tolerated ("gray-listed") bytes only.
         */
        return Z_BINARY;
    }


    var static_init_done = false;

    /* ===========================================================================
     * Initialize the tree data structures for a new zlib stream.
     */
    function _tr_init(s)
    {

        if (!static_init_done) {
            tr_static_init();
            static_init_done = true;
        }

        s.l_desc  = new TreeDesc(s.dyn_ltree, static_l_desc);
        s.d_desc  = new TreeDesc(s.dyn_dtree, static_d_desc);
        s.bl_desc = new TreeDesc(s.bl_tree, static_bl_desc);

        s.bi_buf = 0;
        s.bi_valid = 0;

        /* Initialize the first block of the first file: */
        init_block(s);
    }


    /* ===========================================================================
     * Send a stored block
     */
    function _tr_stored_block(s, buf, stored_len, last)
//DeflateState *s;
//charf *buf;       /* input block */
//ulg stored_len;   /* length of input block */
//int last;         /* one if this is the last block for a file */
    {
        send_bits(s, (STORED_BLOCK<<1)+(last ? 1 : 0), 3);    /* send block type */
        copy_block(s, buf, stored_len, true); /* with header */
    }


    /* ===========================================================================
     * Send one empty static block to give enough lookahead for inflate.
     * This takes 10 bits, of which 7 may remain in the bit buffer.
     */
    function _tr_align(s) {
        send_bits(s, STATIC_TREES<<1, 3);
        send_code(s, END_BLOCK, static_ltree);
        bi_flush(s);
    }


    /* ===========================================================================
     * Determine the best encoding for the current block: dynamic trees, static
     * trees or store, and output the encoded block to the zip file.
     */
    function _tr_flush_block(s, buf, stored_len, last)
//DeflateState *s;
//charf *buf;       /* input block, or NULL if too old */
//ulg stored_len;   /* length of input block */
//int last;         /* one if this is the last block for a file */
    {
        var opt_lenb, static_lenb;  /* opt_len and static_len in bytes */
        var max_blindex = 0;        /* index of last bit length code of non zero freq */

        /* Build the Huffman trees unless a stored block is forced */
        if (s.level > 0) {

            /* Check if the file is binary or text */
            if (s.strm.data_type === Z_UNKNOWN) {
                s.strm.data_type = detect_data_type(s);
            }

            /* Construct the literal and distance trees */
            build_tree(s, s.l_desc);
            // Tracev((stderr, "\nlit data: dyn %ld, stat %ld", s->opt_len,
            //        s->static_len));

            build_tree(s, s.d_desc);
            // Tracev((stderr, "\ndist data: dyn %ld, stat %ld", s->opt_len,
            //        s->static_len));
            /* At this point, opt_len and static_len are the total bit lengths of
             * the compressed block data, excluding the tree representations.
             */

            /* Build the bit length tree for the above two trees, and get the index
             * in bl_order of the last bit length code to send.
             */
            max_blindex = build_bl_tree(s);

            /* Determine the best encoding. Compute the block lengths in bytes. */
            opt_lenb = (s.opt_len+3+7) >>> 3;
            static_lenb = (s.static_len+3+7) >>> 3;

            // Tracev((stderr, "\nopt %lu(%lu) stat %lu(%lu) stored %lu lit %u ",
            //        opt_lenb, s->opt_len, static_lenb, s->static_len, stored_len,
            //        s->last_lit));

            if (static_lenb <= opt_lenb) { opt_lenb = static_lenb; }

        } else {
            // Assert(buf != (char*)0, "lost buf");
            opt_lenb = static_lenb = stored_len + 5; /* force a stored block */
        }

        if ((stored_len+4 <= opt_lenb) && (buf !== -1)) {
            /* 4: two words for the lengths */

            /* The test buf != NULL is only necessary if LIT_BUFSIZE > WSIZE.
             * Otherwise we can't have processed more than WSIZE input bytes since
             * the last block flush, because compression would have been
             * successful. If LIT_BUFSIZE <= WSIZE, it is never too late to
             * transform a block into a stored block.
             */
            _tr_stored_block(s, buf, stored_len, last);

        } else if (s.strategy === Z_FIXED || static_lenb === opt_lenb) {

            send_bits(s, (STATIC_TREES<<1) + (last ? 1 : 0), 3);
            compress_block(s, static_ltree, static_dtree);

        } else {
            send_bits(s, (DYN_TREES<<1) + (last ? 1 : 0), 3);
            send_all_trees(s, s.l_desc.max_code+1, s.d_desc.max_code+1, max_blindex+1);
            compress_block(s, s.dyn_ltree, s.dyn_dtree);
        }
        // Assert (s->compressed_len == s->bits_sent, "bad compressed size");
        /* The above check is made mod 2^32, for files larger than 512 MB
         * and uLong implemented on 32 bits.
         */
        init_block(s);

        if (last) {
            bi_windup(s);
        }
        // Tracev((stderr,"\ncomprlen %lu(%lu) ", s->compressed_len>>3,
        //       s->compressed_len-7*last));
    }

    /* ===========================================================================
     * Save the match info and tally the frequency counts. Return true if
     * the current block must be flushed.
     */
    function _tr_tally(s, dist, lc)
//    deflate_state *s;
//    unsigned dist;  /* distance of matched string */
//    unsigned lc;    /* match length-MIN_MATCH or unmatched char (if dist==0) */
    {
        //var out_length, in_length, dcode;

        s.pending_buf[s.d_buf + s.last_lit * 2]     = (dist >>> 8) & 0xff;
        s.pending_buf[s.d_buf + s.last_lit * 2 + 1] = dist & 0xff;

        s.pending_buf[s.l_buf + s.last_lit] = lc & 0xff;
        s.last_lit++;

        if (dist === 0) {
            /* lc is the unmatched char */
            s.dyn_ltree[lc*2]/*.Freq*/++;
        } else {
            s.matches++;
            /* Here, lc is the match length - MIN_MATCH */
            dist--;             /* dist = match distance - 1 */
            //Assert((ush)dist < (ush)MAX_DIST(s) &&
            //       (ush)lc <= (ush)(MAX_MATCH-MIN_MATCH) &&
            //       (ush)d_code(dist) < (ush)D_CODES,  "_tr_tally: bad match");

            s.dyn_ltree[(_length_code[lc]+LITERALS+1) * 2]/*.Freq*/++;
            s.dyn_dtree[d_code(dist) * 2]/*.Freq*/++;
        }

// (!) This block is disabled in zlib defailts,
// don't enable it for binary compatibility

//#ifdef TRUNCATE_BLOCK
//  /* Try to guess if it is profitable to stop the current block here */
//  if ((s.last_lit & 0x1fff) === 0 && s.level > 2) {
//    /* Compute an upper bound for the compressed length */
//    out_length = s.last_lit*8;
//    in_length = s.strstart - s.block_start;
//
//    for (dcode = 0; dcode < D_CODES; dcode++) {
//      out_length += s.dyn_dtree[dcode*2]/*.Freq*/ * (5 + extra_dbits[dcode]);
//    }
//    out_length >>>= 3;
//    //Tracev((stderr,"\nlast_lit %u, in %ld, out ~%ld(%ld%%) ",
//    //       s->last_lit, in_length, out_length,
//    //       100L - out_length*100L/in_length));
//    if (s.matches < (s.last_lit>>1)/*int /2*/ && out_length < (in_length>>1)/*int /2*/) {
//      return true;
//    }
//  }
//#endif

        return (s.last_lit === s.lit_bufsize-1);
        /* We avoid equality with lit_bufsize because of wraparound at 64K
         * on 16 bit machines and because stored blocks are restricted to
         * 64K-1 bytes.
         */
    }

    exports._tr_init  = _tr_init;
    exports._tr_stored_block = _tr_stored_block;
    exports._tr_flush_block  = _tr_flush_block;
    exports._tr_tally = _tr_tally;
    exports._tr_align = _tr_align;

},{"../utils/common":16}],28:[function(require,module,exports){
    'use strict';


    function ZStream() {
        /* next input byte */
        this.input = null; // JS specific, because we have no pointers
        this.next_in = 0;
        /* number of bytes available at input */
        this.avail_in = 0;
        /* total number of input bytes read so far */
        this.total_in = 0;
        /* next output byte should be put there */
        this.output = null; // JS specific, because we have no pointers
        this.next_out = 0;
        /* remaining free space at output */
        this.avail_out = 0;
        /* total number of bytes output so far */
        this.total_out = 0;
        /* last error message, NULL if no error */
        this.msg = ''/*Z_NULL*/;
        /* not visible by applications */
        this.state = null;
        /* best guess about the data type: binary or text */
        this.data_type = 2/*Z_UNKNOWN*/;
        /* adler32 value of the uncompressed data */
        this.adler = 0;
    }

    module.exports = ZStream;

},{}],29:[function(require,module,exports){

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
},{}],30:[function(require,module,exports){

    /*jslint browser: true, node: true */
    /*global require, module */

    "use strict";

    /*** Imports ***/
    var daikon = daikon || {};

    /**
     * daikon.Dictionary
     * @type {{}|*}
     */
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

    /**
     * Returns the VR for the specified group and element.
     * @param {number} group
     * @param {number} element
     * @returns {string}
     */
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



    /**
     * Returns the description for the specified group and element.
     * @param {number} group
     * @param {number} element
     * @returns {string}
     */
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

},{"./utilities.js":40}],31:[function(require,module,exports){

    /*jslint browser: true, node: true */
    /*global require, module */

    "use strict";

    /*** Imports ***/
    var daikon = daikon || {};
    daikon.Tag = daikon.Tag || ((typeof require !== 'undefined') ? require('./tag.js') : null);
    daikon.CompressionUtils = daikon.CompressionUtils || ((typeof require !== 'undefined') ? require('./compression-utils.js') : null);
    daikon.Utils = daikon.Utils || ((typeof require !== 'undefined') ? require('./utilities.js') : null);
    daikon.RLE = daikon.RLE || ((typeof require !== 'undefined') ? require('./rle.js') : null);

    var jpeg = ((typeof require !== 'undefined') ? require('jpeg-lossless-decoder-js') : null);
    var JpegDecoder = JpegDecoder || ((typeof require !== 'undefined') ? require('../lib/jpeg-baseline.js').JpegImage : null);
    var JpxImage = JpxImage || ((typeof require !== 'undefined') ? require('../lib/jpx.js') : null);


    /*** Constructor ***/

    /**
     * The Image constructor.
     * @property {object} tags - a map of tag id to tag (see daikon.Tag.createId)
     * @property {object} tagsFlat - a flattened map of tags
     * @type {Function}
     */
    daikon.Image = daikon.Image || function () {
            this.tags = {};
            this.tagsFlat = {};
            this.littleEndian = false;
            this.index = -1;
            this.decompressed = false;
            this.privateDataAll = null;
            this.convertedPalette = false;
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

    /**
     * Returns the number of columns.
     * @returns {number}
     */
    daikon.Image.prototype.getCols = function () {
        return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_COLS[0], daikon.Tag.TAG_COLS[1]), 0);
    };



    /**
     * Returns the number of rows.
     * @returns {number}
     */
    daikon.Image.prototype.getRows = function () {
        return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_ROWS[0], daikon.Tag.TAG_ROWS[1]), 0);
    };



    /**
     * Returns the series description.
     * @returns {string}
     */
    daikon.Image.prototype.getSeriesDescription = function () {
        return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_SERIES_DESCRIPTION[0], daikon.Tag.TAG_SERIES_DESCRIPTION[1]), 0);
    };



    /**
     * Returns the series instance UID.
     * @returns {string}
     */
    daikon.Image.prototype.getSeriesInstanceUID = function () {
        return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_SERIES_INSTANCE_UID[0], daikon.Tag.TAG_SERIES_INSTANCE_UID[1]), 0);
    };



    /**
     * Returns the series number.
     * @returns {number}
     */
    daikon.Image.prototype.getSeriesNumber = function () {
        return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_SERIES_NUMBER[0], daikon.Tag.TAG_SERIES_NUMBER[1]), 0);
    };



    /**
     * Returns the echo number.
     * @returns {number}
     */
    daikon.Image.prototype.getEchoNumber = function () {
        return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_ECHO_NUMBER[0], daikon.Tag.TAG_ECHO_NUMBER[1]), 0);
    };



    /**
     * Returns the image position.
     * @return {number[]}
     */
    daikon.Image.prototype.getImagePosition = function () {
        return daikon.Image.getValueSafely(this.getTag(daikon.Tag.TAG_IMAGE_POSITION[0], daikon.Tag.TAG_IMAGE_POSITION[1]));
    };

    /**
     * Returns the image axis directions
     * @return {number[]}
     */
    daikon.Image.prototype.getImageDirections = function () {
        return daikon.Image.getValueSafely(this.getTag(daikon.Tag.TAG_IMAGE_ORIENTATION[0], daikon.Tag.TAG_IMAGE_ORIENTATION[1]))
    }


    /**
     * Returns the image position value by index.
     * @param {number} sliceDir - the index
     * @returns {number}
     */
    daikon.Image.prototype.getImagePositionSliceDir = function (sliceDir) {
        var imagePos = daikon.Image.getValueSafely(this.getTag(daikon.Tag.TAG_IMAGE_POSITION[0], daikon.Tag.TAG_IMAGE_POSITION[1]));
        if (imagePos) {
            if (sliceDir >= 0) {
                return imagePos[sliceDir];
            }
        }

        return 0;
    };



    /**
     * Returns the slice location.
     * @returns {number}
     */
    daikon.Image.prototype.getSliceLocation = function () {
        return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_SLICE_LOCATION[0], daikon.Tag.TAG_SLICE_LOCATION[1]), 0);
    };



    /**
     * Returns the slice location vector.
     * @returns {number[]}
     */
    daikon.Image.prototype.getSliceLocationVector = function () {
        return daikon.Image.getValueSafely(this.getTag(daikon.Tag.TAG_SLICE_LOCATION_VECTOR[0], daikon.Tag.TAG_SLICE_LOCATION_VECTOR[1]));
    };



    /**
     * Returns the image number.
     * @returns {number}
     */
    daikon.Image.prototype.getImageNumber = function () {
        return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_IMAGE_NUM[0], daikon.Tag.TAG_IMAGE_NUM[1]), 0);
    };


    /**
     * Returns the temporal position.
     * @returns {number}
     */
    daikon.Image.prototype.getTemporalPosition = function () {
        return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_TEMPORAL_POSITION[0], daikon.Tag.TAG_TEMPORAL_POSITION[1]), 0);
    };


    /**
     * Returns the temporal number.
     * @returns {number}
     */
    daikon.Image.prototype.getTemporalNumber = function () {
        return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_NUMBER_TEMPORAL_POSITIONS[0], daikon.Tag.TAG_NUMBER_TEMPORAL_POSITIONS[1]), 0);
    };


    /**
     * Returns the slice gap.
     * @returns {number}
     */
    daikon.Image.prototype.getSliceGap = function () {
        return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_SLICE_GAP[0], daikon.Tag.TAG_SLICE_GAP[1]), 0);
    };


    /**
     * Returns the slice thickness.
     * @returns {number}
     */
    daikon.Image.prototype.getSliceThickness = function () {
        return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_SLICE_THICKNESS[0], daikon.Tag.TAG_SLICE_THICKNESS[1]), 0);
    };


    /**
     * Returns the image maximum.
     * @returns {number}
     */
    daikon.Image.prototype.getImageMax = function () {
        return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_IMAGE_MAX[0], daikon.Tag.TAG_IMAGE_MAX[1]), 0);
    };


    /**
     * Returns the image minimum.
     * @returns {number}
     */
    daikon.Image.prototype.getImageMin = function () {
        return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_IMAGE_MIN[0], daikon.Tag.TAG_IMAGE_MIN[1]), 0);
    };


    /**
     * Returns the rescale slope.
     * @returns {number}
     */
    daikon.Image.prototype.getDataScaleSlope = function () {
        return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_DATA_SCALE_SLOPE[0], daikon.Tag.TAG_DATA_SCALE_SLOPE[1]), 0);
    };


    /**
     * Returns the rescale intercept.
     * @returns {number}
     */
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


    /**
     * Returns the window width.
     * @returns {number}
     */
    daikon.Image.prototype.getWindowWidth = function () {
        return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_WINDOW_WIDTH[0], daikon.Tag.TAG_WINDOW_WIDTH[1]), 0);
    };


    /**
     * Returns the window center.
     * @returns {number}
     */
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
        var cols = this.getCols();
        var rows = this.getRows();

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

        id += (" (" + cols + " x " + rows + ")");

        return id;
    };


    /**
     * Returns the pixel spacing.
     * @returns {number[]}
     */
    daikon.Image.prototype.getPixelSpacing = function () {
        return daikon.Image.getValueSafely(this.getTag(daikon.Tag.TAG_PIXEL_SPACING[0], daikon.Tag.TAG_PIXEL_SPACING[1]));
    };


    /**
     * Returns the image type.
     * @returns {string[]}
     */
    daikon.Image.prototype.getImageType = function () {
        return daikon.Image.getValueSafely(this.getTag(daikon.Tag.TAG_IMAGE_TYPE[0], daikon.Tag.TAG_IMAGE_TYPE[1]));
    };


    /**
     * Returns the number of bits stored.
     * @returns {number}
     */
    daikon.Image.prototype.getBitsStored = function () {
        return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_BITS_STORED[0], daikon.Tag.TAG_BITS_STORED[1]), 0);
    };


    /**
     * Returns the number of bits allocated.
     * @returns {number}
     */
    daikon.Image.prototype.getBitsAllocated = function () {
        return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_BITS_ALLOCATED[0], daikon.Tag.TAG_BITS_ALLOCATED[1]), 0);
    };


    /**
     * Returns the frame time.
     * @returns {number}
     */
    daikon.Image.prototype.getFrameTime = function () {
        return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_FRAME_TIME[0], daikon.Tag.TAG_FRAME_TIME[1]), 0);
    };


    /**
     * Returns the acquisition matrix (e.g., "mosaic" data).
     * @returns {number[]}
     */
    daikon.Image.prototype.getAcquisitionMatrix = function () {
        var mat, matPrivate, start, end, str;

        mat = [0, 0];
        mat[0] = daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_ACQUISITION_MATRIX[0], daikon.Tag.TAG_ACQUISITION_MATRIX[1]), 0);

        if (this.privateDataAll === null) {
            this.privateDataAll = this.getAllInterpretedPrivateData();
        }

        if ((this.privateDataAll !== null) && (this.privateDataAll.length > 0)) {
            start = this.privateDataAll.indexOf("AcquisitionMatrixText");
            if (start !== -1) {

                end = this.privateDataAll.indexOf('\n', start);

                if (end !== -1) {
                    str = this.privateDataAll.substring(start, end);
                    matPrivate = str.match(/\d+/g);

                    if ((matPrivate !== null) && (matPrivate.length === 2)) {
                        mat[0] = matPrivate[0];
                        mat[1] = matPrivate[1];
                    } else if ((matPrivate !== null) && (matPrivate.length === 1)) {
                        mat[0] = matPrivate[0];
                    }
                }
            }
        }

        if (mat[1] === 0) {
            mat[1] = mat[0];
        }

        return mat;
    };


    /**
     * Returns the TR.
     * @returns {number}
     */
    daikon.Image.prototype.getTR = function () {
        return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_TR, daikon.Tag.TAG_TR[1]), 0);
    };



    daikon.Image.prototype.putTag = function (tag) {
        this.tags[tag.id] = tag;
        this.putFlattenedTag(this.tagsFlat, tag);
    };



    daikon.Image.prototype.putFlattenedTag = function (tags, tag) {
        var ctr;

        if (tag.sublist) {
            for (ctr = 0; ctr < tag.value.length; ctr += 1) {
                this.putFlattenedTag(tags, tag.value[ctr]);
            }
        } else {
            if (!tags[tag.id]) {
                tags[tag.id] = tag;
            }
        }
    };


    /**
     * Returns a tag matching the specified group and element.
     * @param {number} group
     * @param {number} element
     * @returns {daikon.Tag}
     */
    daikon.Image.prototype.getTag = function (group, element) {
        var tagId = daikon.Tag.createId(group, element);

        if (this.tags[tagId]) {
            return this.tags[tagId];
        }

        return this.tagsFlat[tagId];
    };


    /**
     * Returns the pixel data tag.
     * @returns {daikon.Tag}
     */
    daikon.Image.prototype.getPixelData = function () {
        return this.tags[daikon.Tag.createId(daikon.Tag.TAG_PIXEL_DATA[0], daikon.Tag.TAG_PIXEL_DATA[1])];
    };



    daikon.Image.prototype.getPixelDataBytes = function () {
        if (this.isCompressed()) {
            this.decompress();
        }

        if (this.isPalette()) {
            this.convertPalette();
        }

        return this.tags[daikon.Tag.createId(daikon.Tag.TAG_PIXEL_DATA[0], daikon.Tag.TAG_PIXEL_DATA[1])].value.buffer;
    };


    /**
     * Returns the raw pixel data.
     * @returns {ArrayBuffer}
     */
    daikon.Image.prototype.getRawData = function () {
        return this.getPixelDataBytes();
    };


    /**
     * Returns interpreted pixel data (considers datatype, byte order, data scales).
     * @param {boolean} asArray - if true, the returned data is a JavaScript Array
     * @param {boolean} asObject - if true, an object is returned with properties: data, min, max, minIndex, maxIndex, numCols, numRows
     * @returns {Float32Array|Array|object}
     */
    daikon.Image.prototype.getInterpretedData = function (asArray, asObject) {
        var datatype, numBytes, numElements, dataView, data, ctr, mask, slope, intercept, min, max, value, minIndex,
            maxIndex, littleEndian, rawValue, rawData;
        mask = daikon.Utils.createBitMask(this.getBitsAllocated() / 8, this.getBitsStored(),
            this.getDataType() === daikon.Image.BYTE_TYPE_INTEGER_UNSIGNED);
        datatype = this.getDataType();
        numBytes = this.getBitsAllocated() / 8;
        rawData = this.getRawData();
        dataView = new DataView(rawData);
        numElements = rawData.byteLength / numBytes;
        slope = this.getDataScaleSlope() || 1;
        intercept = this.getDataScaleIntercept() || 0;
        min = daikon.Utils.MAX_VALUE;
        max = daikon.Utils.MIN_VALUE;
        minIndex = -1;
        maxIndex = -1;
        littleEndian = this.littleEndian;

        if (asArray) {
            data = [];
        } else {
            data = new Float32Array(numElements);
        }

        for (ctr = 0; ctr < numElements; ctr += 1) {
            if (datatype === daikon.Image.BYTE_TYPE_INTEGER) {
                if (numBytes === 1) {
                    rawValue = dataView.getInt8(ctr * numBytes);
                } else if (numBytes === 2) {
                    rawValue = dataView.getInt16(ctr * numBytes, littleEndian);
                }
            } else if (datatype === daikon.Image.BYTE_TYPE_INTEGER_UNSIGNED) {
                if (numBytes === 1) {
                    rawValue = dataView.getUint8(ctr * numBytes);
                } else if (numBytes === 2) {
                    rawValue = dataView.getUint16(ctr * numBytes, littleEndian);
                }
            }

            value = ((rawValue & mask) * slope) + intercept;
            data[ctr] = value;

            if (value < min) {
                min = value;
                minIndex = ctr;
            }

            if (value > max) {
                max = value;
                maxIndex = ctr;
            }
        }

        if (asObject) {
            return {data: data, min: min, minIndex: minIndex, max: max, maxIndex: maxIndex, numCols: this.getCols(),
                numRows: this.getRows()};
        }

        return data;
    };



    daikon.Image.prototype.convertPalette = function () {
        var data, reds, greens, blues, rgb, numBytes, numElements, ctr, index, rVal, gVal, bVal;

        data = this.tags[daikon.Tag.createId(daikon.Tag.TAG_PIXEL_DATA[0], daikon.Tag.TAG_PIXEL_DATA[1])].value;

        reds = this.getPalleteValues(daikon.Tag.TAG_PALETTE_RED);
        greens = this.getPalleteValues(daikon.Tag.TAG_PALETTE_GREEN);
        blues = this.getPalleteValues(daikon.Tag.TAG_PALETTE_BLUE);

        if ((reds !== null) && (reds.length > 0) && (greens !== null) && (greens.length > 0) && (blues !== null) &&
            (blues.length > 0) && !this.convertedPalette) {
            rgb = new DataView(new ArrayBuffer(this.getRows() * this.getCols() * this.getNumberOfFrames() * 3));
            numBytes = parseInt(Math.ceil(this.getBitsAllocated() / 8));
            numElements = data.byteLength / numBytes;

            if (numBytes === 1) {
                for (ctr = 0; ctr < numElements; ctr += 1) {
                    index = data.getUint8(ctr);
                    rVal = reds[index];
                    gVal = greens[index];
                    bVal = blues[index];
                    rgb.setUint8((ctr * 3), rVal);
                    rgb.setUint8((ctr * 3) + 1, gVal);
                    rgb.setUint8((ctr * 3) + 2, bVal);
                }
            } else if (numBytes === 2) {
                for (ctr = 0; ctr < numElements; ctr += 1) {
                    index = data.getUint16(ctr * 2);
                    rVal = reds[index];
                    gVal = greens[index];
                    bVal = blues[index];
                    rgb.setUint8((ctr * 3), rVal);
                    rgb.setUint8((ctr * 3) + 1, gVal);
                    rgb.setUint8((ctr * 3) + 2, bVal);
                }
            }

            data = rgb;
            this.convertedPalette = true;
        }

        this.tags[daikon.Tag.createId(daikon.Tag.TAG_PIXEL_DATA[0], daikon.Tag.TAG_PIXEL_DATA[1])].value = data;
    };




    daikon.Image.prototype.decompress = function () {
        var jpegs, rle, decoder, decompressed, numFrames, frameSize, temp, ctr, width, height, numComponents, decoded;

        decompressed = null;

        if (!this.decompressed) {
            this.decompressed = true;

            frameSize = this.getRows() * this.getCols() * parseInt(Math.ceil(this.getBitsAllocated() / 8));
            numFrames = this.getNumberOfFrames();

            if (this.isCompressedJPEGLossless()) {
                jpegs = this.getJpegs();

                for (ctr = 0; ctr < jpegs.length; ctr+=1) {
                    decoder = new jpeg.lossless.Decoder();
                    temp = decoder.decode(jpegs[ctr]);
                    numComponents = decoder.numComp;

                    if (decompressed === null) {
                        decompressed = new DataView(new ArrayBuffer(frameSize * numFrames * numComponents));
                    }

                    (new Uint8Array(decompressed.buffer)).set(new Uint8Array(temp.buffer), (ctr * frameSize * numComponents));
                    temp = null;
                }

                this.tags[daikon.Tag.createId(daikon.Tag.TAG_PIXEL_DATA[0], daikon.Tag.TAG_PIXEL_DATA[1])].value = decompressed;
            } else if (this.isCompressedJPEGBaseline()) {
                jpegs = this.getJpegs();

                for (ctr = 0; ctr < jpegs.length; ctr+=1) {
                    decoder = new JpegDecoder();
                    decoder.parse(new Uint8Array(jpegs[ctr]));
                    width = decoder.width;
                    height = decoder.height;
                    numComponents = decoder.components.length;

                    if (decompressed === null) {
                        decompressed = new DataView(new ArrayBuffer(frameSize * numFrames * numComponents));
                    }

                    if (this.getBitsAllocated() === 8) {
                        decoded = decoder.getData(width, height);
                    } else if (this.getBitsAllocated() === 16) {
                        decoded = decoder.getData16(width, height);
                    }

                    daikon.Utils.fillBuffer(decoded, decompressed, (ctr * frameSize * numComponents),
                        parseInt(Math.ceil(this.getBitsAllocated() / 8)));

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
                    numComponents = decoder.componentsCount;

                    if (decompressed === null) {
                        decompressed = new DataView(new ArrayBuffer(frameSize * numFrames * numComponents));
                    }

                    daikon.Utils.fillBuffer(decoded, decompressed, (ctr * frameSize * numComponents),
                        parseInt(Math.ceil(this.getBitsAllocated() / 8)));

                    decoded = null;
                }

                this.tags[daikon.Tag.createId(daikon.Tag.TAG_PIXEL_DATA[0], daikon.Tag.TAG_PIXEL_DATA[1])].value = decompressed;
            } else if (this.isCompressedRLE()) {
                rle = this.getRLE();

                for (ctr = 0; ctr < rle.length; ctr+=1) {
                    decoder = new daikon.RLE();
                    temp = decoder.decode(rle[ctr], this.littleEndian, this.getRows() * this.getCols());
                    numComponents = (decoder.numSegments === 3 ? 3 : 1);

                    if (decompressed === null) {
                        decompressed = new DataView(new ArrayBuffer(frameSize * numFrames * numComponents));
                    }

                    (new Uint8Array(decompressed.buffer)).set(new Uint8Array(temp.buffer), (ctr * frameSize * numComponents));
                    temp = null;
                }

                this.tags[daikon.Tag.createId(daikon.Tag.TAG_PIXEL_DATA[0], daikon.Tag.TAG_PIXEL_DATA[1])].value = decompressed;
            }
        }
    };


    /**
     * Returns true if pixel data is found.
     * @returns {boolean}
     */
    daikon.Image.prototype.hasPixelData = function () {
        return (this.tags[daikon.Tag.createId(daikon.Tag.TAG_PIXEL_DATA[0], daikon.Tag.TAG_PIXEL_DATA[1])] !== undefined);
    };



    daikon.Image.prototype.clearPixelData = function () {
        this.tags[daikon.Tag.createId(daikon.Tag.TAG_PIXEL_DATA[0], daikon.Tag.TAG_PIXEL_DATA[1])].value = null;
    };


    /**
     * Returns an orientation string (e.g., XYZ+--).
     * @returns {string}
     */
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


    /**
     * Returns true if this image is "mosaic".
     * @returns {boolean}
     */
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
        canReadAsMosaic = (matSize[0] > 0) && ((matSize[0] < this.getRows()) || (matSize[1] < this.getCols()));
        return labeledAsMosaic && canReadAsMosaic;
    };


    /**
     * Returns true if this image uses palette colors.
     * @returns {boolean}
     */
    daikon.Image.prototype.isPalette = function () {
        var value = daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_PHOTOMETRIC_INTERPRETATION[0], daikon.Tag.TAG_PHOTOMETRIC_INTERPRETATION[1]), 0);

        if (value !== null) {
            if (value.toLowerCase().indexOf("palette") !== -1) {
                return true;
            }
        }

        return false;
    };



    daikon.Image.prototype.getMosaicCols = function() {
        return this.getCols() / this.getAcquisitionMatrix()[1];
    };



    daikon.Image.prototype.getMosaicRows = function() {
        return this.getRows() / this.getAcquisitionMatrix()[0];
    };



    daikon.Image.prototype.isElscint = function() {
        var tag = this.getTag(daikon.Tag.TAG_DATA_SCALE_ELSCINT[0], daikon.Tag.TAG_DATA_SCALE_ELSCINT[1]);
        return (tag !== undefined);
    };


    /**
     * Returns true if this image stores compressed data.
     * @returns {boolean}
     */
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


    /**
     * Returns true if this image stores JPEG data.
     * @returns {boolean}
     */
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


    /**
     * Returns true of this image stores lossless JPEG data.
     * @returns {boolean}
     */
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


    /**
     * Returns true if this image stores baseline JPEG data.
     * @returns {boolean}
     */
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


    /**
     * Returns true if this image stores JPEG2000 data.
     * @returns {boolean}
     */
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


    /**
     * Returns true if this image stores RLE data.
     * @returns {boolean}
     */
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


    /**
     * Returns the number of frames.
     * @returns {number}
     */
    daikon.Image.prototype.getNumberOfFrames = function () {
        var value = daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_NUMBER_OF_FRAMES[0], daikon.Tag.TAG_NUMBER_OF_FRAMES[1]), 0);

        if (value !== null) {
            return value;
        }

        return 1;
    };


    /**
     * Returns the number of samples per pixel.
     * @returns {number}
     */
    daikon.Image.prototype.getNumberOfSamplesPerPixel = function () {
        var value = daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_SAMPLES_PER_PIXEL[0], daikon.Tag.TAG_SAMPLES_PER_PIXEL[1]), 0);

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


    /**
     * Returns the pixel representation.
     * @returns {number}
     */
    daikon.Image.prototype.getPixelRepresentation = function () {
        return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_PIXEL_REPRESENTATION[0], daikon.Tag.TAG_PIXEL_REPRESENTATION[1]), 0);
    };


    /**
     * Returns the photometric interpretation.
     * @returns {string}
     */
    daikon.Image.prototype.getPhotometricInterpretation = function () {
        return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_PHOTOMETRIC_INTERPRETATION[0], daikon.Tag.TAG_PHOTOMETRIC_INTERPRETATION[1]), 0);
    };


    /**
     * Returns the patient name.
     * @returns {string}
     */
    daikon.Image.prototype.getPatientName = function () {
        return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_PATIENT_NAME[0], daikon.Tag.TAG_PATIENT_NAME[1]), 0);
    };


    /**
     * Returns the patient ID.
     * @returns {string}
     */
    daikon.Image.prototype.getPatientID = function () {
        return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_PATIENT_ID[0], daikon.Tag.TAG_PATIENT_ID[1]), 0);
    };


    /**
     * Returns the study time.
     * @returns {string}
     */
    daikon.Image.prototype.getStudyTime = function () {
        return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_STUDY_TIME[0], daikon.Tag.TAG_STUDY_TIME[1]), 0);
    };


    /**
     * Returns the transfer syntax.
     * @returns {string}
     */
    daikon.Image.prototype.getTransferSyntax = function () {
        return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_TRANSFER_SYNTAX[0], daikon.Tag.TAG_TRANSFER_SYNTAX[1]), 0);
    };


    /**
     * Returns the study date.
     * @returns {string}
     */
    daikon.Image.prototype.getStudyDate = function () {
        return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_STUDY_DATE[0], daikon.Tag.TAG_STUDY_DATE[1]), 0);
    };


    /**
     * Returns the planar configuration.
     * @returns {number}
     */
    daikon.Image.prototype.getPlanarConfig = function () {
        return daikon.Image.getSingleValueSafely(this.getTag(daikon.Tag.TAG_PLANAR_CONFIG[0], daikon.Tag.TAG_PLANAR_CONFIG[1]), 0);
    };


    /**
     * Returns all descriptive info for this image.
     * @returns {string}
     */
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


    /**
     * Returns the datatype (e.g., daikon.Image.BYTE_TYPE_INTEGER_UNSIGNED).
     * @returns {number}
     */
    daikon.Image.prototype.getDataType = function () {
        var interp, dataType;

        dataType = this.getPixelRepresentation();

        if (dataType === null) {
            return daikon.Image.BYTE_TYPE_UNKNOWN;
        }

        interp = this.getPhotometricInterpretation();
        if (interp !== null) {
            if ((interp.trim().indexOf('RGB') !== -1) || (interp.trim().indexOf('YBR') !== -1) ||
                (interp.trim().toLowerCase().indexOf('palette') !== -1)) {
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
    /**
     * Returns encapsulated data tags.
     * @returns {daikon.Tag[]}
     */
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


    /**
     * Returns a string of interpreted private data.
     * @returns {string}
     */
    daikon.Image.prototype.getAllInterpretedPrivateData = function() {
        var ctr, key, tag, str = "";

        var sorted_keys = Object.keys(this.tags).sort();

        for (ctr = 0; ctr < sorted_keys.length; ctr+=1) {
            key = sorted_keys[ctr];
            if (this.tags.hasOwnProperty(key)) {
                tag = this.tags[key];
                if (tag.hasInterpretedPrivateData()) {
                    str += tag.value;
                }
            }
        }

        return str;
    };


    /**
     * Returns a string representation of this image.
     * @returns {string}
     */
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

        str = str.replace(/\n\s*\n/g, '\n');  // replace mutli-newlines with single newline
        str = str.replace(/(?:\r\n|\r|\n)/g, '<br />');  // replace newlines with <br>

        return str;
    };



    daikon.Image.prototype.getPalleteValues = function (tagID) {
        /*jslint bitwise: true */

        var valsBig, valsLittle, value, numVals, ctr, valsBigMax, valsBigMin, valsLittleMax, valsLittleMin, valsBigDiff,
            valsLittleDiff;

        valsBig = null;
        valsLittle = null;

        value = daikon.Image.getValueSafely(this.getTag(tagID[0], tagID[1]));

        if (value !== null) {
            numVals = value.buffer.byteLength / 2;
            valsBig = [];
            valsLittle = [];

            for (ctr = 0; ctr < numVals; ctr += 1) {
                valsBig[ctr] = (value.getUint16(ctr * 2, false) & 0xFFFF);
                valsLittle[ctr] = (value.getUint16(ctr * 2, true) & 0xFFFF);
            }

            valsBigMax = Math.max.apply(Math, valsBig);
            valsBigMin = Math.min.apply(Math, valsBig);
            valsLittleMax = Math.max.apply(Math, valsLittle);
            valsLittleMin = Math.min.apply(Math, valsLittle);
            valsBigDiff = Math.abs(valsBigMax - valsBigMin);
            valsLittleDiff = Math.abs(valsLittleMax - valsLittleMin);

            if (valsBigDiff < valsLittleDiff) {
                return this.scalePalette(valsBig);
            } else {
                return this.scalePalette(valsLittle);
            }
        }

        return null;
    };



    daikon.Image.prototype.scalePalette = function (pal) {
        var min, max, ctr, slope, intercept;

        max = Math.max.apply(Math, pal);
        min = Math.min.apply(Math, pal);

        if ((max > 255) || (min < 0)) {
            slope = 255.0 / (max - min);
            intercept = min;

            for (ctr = 0; ctr < pal.length; ctr += 1) {
                pal[ctr] = parseInt(Math.round((pal[ctr] - intercept) * slope));
            }
        }

        return pal;
    };



    /*** Exports ***/

    var moduleType = typeof module;
    if ((moduleType !== 'undefined') && module.exports) {
        module.exports = daikon.Image;
    }

},{"../lib/jpeg-baseline.js":1,"../lib/jpx.js":2,"./compression-utils.js":29,"./parser.js":35,"./rle.js":36,"./tag.js":39,"./utilities.js":40,"jpeg-lossless-decoder-js":8}],32:[function(require,module,exports){

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

},{}],33:[function(require,module,exports){

    /*jslint browser: true, node: true */
    /*global require, module */

    "use strict";

    /*** Imports ****/

    /**
     * daikon
     * @type {*|{}}
     */
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
    daikon.Siemens = daikon.Siemens || ((typeof require !== 'undefined') ? require('./siemens.js') : null);

    var jpeg = jpeg || {};
    jpeg.lossless = jpeg.lossless || {};
    jpeg.lossless.Decoder = ((typeof require !== 'undefined') ? require('jpeg-lossless-decoder-js') : null);

    var JpegDecoder = JpegDecoder || ((typeof require !== 'undefined') ? require('../lib/jpeg-baseline.js').JpegImage : null);

    var JpxImage = JpxImage || ((typeof require !== 'undefined') ? require('../lib/jpx.js') : null);

    var pako = pako || ((typeof require !== 'undefined') ? require('pako') : null);

    /*** Exports ***/

    var moduleType = typeof module;
    if ((moduleType !== 'undefined') && module.exports) {
        module.exports = daikon;
    }

},{"../lib/jpeg-baseline.js":1,"../lib/jpx.js":2,"./compression-utils.js":29,"./dictionary.js":30,"./image.js":31,"./iterator.js":32,"./orderedmap.js":34,"./parser.js":35,"./rle.js":36,"./series.js":37,"./siemens.js":38,"./tag.js":39,"./utilities.js":40,"jpeg-lossless-decoder-js":8,"pako":13}],34:[function(require,module,exports){

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

},{"./iterator.js":32}],35:[function(require,module,exports){

    /*jslint browser: true, node: true */
    /*global require, module */

    "use strict";

    /*** Imports ***/
    var daikon = daikon || {};
    daikon.Tag = daikon.Tag || ((typeof require !== 'undefined') ? require('./tag.js') : null);
    daikon.Utils = daikon.Utils || ((typeof require !== 'undefined') ? require('./utilities.js') : null);
    daikon.Dictionary = daikon.Dictionary || ((typeof require !== 'undefined') ? require('./dictionary.js') : null);
    daikon.Image = daikon.Image || ((typeof require !== 'undefined') ? require('./image.js') : null);

    var pako = pako || ((typeof require !== 'undefined') ? require('pako') : null);


    /*** Constructor ***/

    /**
     * The Parser constructor.
     * @property {boolean} explicit
     * @property {boolean} littleEndian
     * @type {Function}
     */
    daikon.Parser = daikon.Parser || function () {
            this.littleEndian = true;
            this.explicit = true;
            this.metaFound = false;
            this.metaFinished = false;
            this.metaFinishedOffset = -1;
            this.needsDeflate = false;
            this.error = null;
        };


    /*** Static Fields ***/

    /**
     * Global property to output string representation of tags as they are parsed.
     * @type {boolean}
     */
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
    daikon.Parser.TRANSFER_SYNTAX_COMPRESSION_DEFLATE = "1.2.840.10008.1.2.1.99";
    daikon.Parser.UNDEFINED_LENGTH = 0xFFFFFFFF;


    /*** Static Methods ***/

    /**
     * Returns true if the DICOM magic cookie is found.
     * @param {DataView} data
     * @returns {boolean}
     */
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

    /**
     * Parses this data and returns an image object.
     * @param {DataView} data
     * @returns {daikon.Image|null}
     */
    daikon.Parser.prototype.parse = function (data) {
        var image = null, offset, tag, copyMeta, copyDeflated;

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

                if (this.needsDeflate && (tag.offsetEnd >= this.metaFinishedOffset)) {
                    this.needsDeflate = false;
                    copyMeta = data.buffer.slice(0, tag.offsetEnd);
                    copyDeflated = data.buffer.slice(tag.offsetEnd);
                    data = new DataView(daikon.Utils.concatArrayBuffers(copyMeta, pako.inflateRaw(copyDeflated)));
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

        element = data.getUint16(offset, little);
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
            } else if (tag.value[0] === daikon.Parser.TRANSFER_SYNTAX_COMPRESSION_DEFLATE) {
                this.needsDeflate = true;
                this.explicit = true;
                this.littleEndian = true;
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

},{"./dictionary.js":30,"./image.js":31,"./tag.js":39,"./utilities.js":40,"pako":13}],36:[function(require,module,exports){

    /*jslint browser: true, node: true */
    /*global require, module */

    "use strict";

    /*** Imports ***/
    var daikon = daikon || {};


    /*** Constructor ***/

    /**
     * The RLE constructor.
     * @type {Function}
     */
    daikon.RLE = daikon.RLE || function () {
            this.rawData = null;
            this.bytesRead = 0;
            this.bytesPut = 0;
            this.segElemPut = 0;
            this.numSegments = 0;
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

    /**
     * Decodes the RLE data.
     * @param {ArrayBuffer} data
     * @param {boolean} littleEndian
     * @param {number} numElements
     * @returns {DataView}
     */
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
        } else if (this.numSegments === 3) {  // rgb
            outputProcessed = new DataView(new ArrayBuffer(this.size));
            offset = (2 * this.numElements);

            for (ctr = 0; ctr < this.numElements; ctr+=1) {
                outputProcessed.setInt8(ctr * 3, this.output.getInt8(ctr));
                outputProcessed.setInt8(ctr * 3 + 1, this.output.getInt8(ctr + this.numElements));
                outputProcessed.setInt8(ctr * 3 + 2, this.output.getInt8(ctr + offset));
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

},{}],37:[function(require,module,exports){

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

    /**
     * The Series constructor.
     * @property {daikon.Image[]} images
     * @type {Function}
     */
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

    /**
     * Parses the DICOM header and return an image object.
     * @param {DataView} data
     * @returns {daikon.Image|null}
     */
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

                    slice.put(ctr, images[ctr]);
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


    /**
     * Returns the series ID.
     * @returns {string}
     */
    daikon.Series.prototype.toString = function () {
        return this.images[0].getSeriesId();
    };


    /**
     * Returns a nice name for the series.
     * @returns {string|null}
     */
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


    /**
     * Adds an image to the series.
     * @param {daikon.Image} image
     */
    daikon.Series.prototype.addImage = function (image) {
        this.images.push(image);
    };


    /**
     * Returns true if the specified image is part of the series (or if no images are yet part of the series).
     * @param {daikon.Image} image
     * @returns {boolean}
     */
    daikon.Series.prototype.matchesSeries = function (image) {
        if (this.images.length === 0) {
            return true;
        }

        return (this.images[0].getSeriesId() === image.getSeriesId());
    };


    /**
     * Orders and organizes the images in this series.
     */
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


    /**
     * Concatenates image data (asynchronously).
     * @param {object} progressMeter -- the object must have a drawProgress(percent, label) function [e.g., drawProgress(.5, "Loading...")]
     * @param {Function} onFinishedImageRead -- callback
     */
    daikon.Series.prototype.concatenateImageData = function (progressMeter, onFinishedImageRead) {
        var buffer, data, length;

        if (this.isMosaic) {
            data = this.getMosaicData(this.images[0], this.images[0].getPixelDataBytes());
        } else {
            data = this.images[0].getPixelDataBytes();
        }

        length = this.validatePixelDataLength(this.images[0]);
        this.images[0].clearPixelData();
        buffer = new Uint8Array(new ArrayBuffer(length * this.images.length));
        buffer.set(new Uint8Array(data, 0, length), 0);

        setTimeout(this.concatenateNextImageData(buffer, length, progressMeter, 1, onFinishedImageRead), 0);
    };



    daikon.Series.prototype.concatenateNextImageData = function (buffer, frameSize, progressMeter, index,
                                                                 onFinishedImageRead) {
        var data, length;

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

            length = this.validatePixelDataLength(this.images[index]);
            this.images[index].clearPixelData();
            buffer.set(new Uint8Array(data, 0, length), (frameSize * index));

            setTimeout(daikon.Utils.bind(this, function() {this.concatenateNextImageData(buffer, frameSize, progressMeter,
                index + 1, onFinishedImageRead);}), 0);
        }
    };



    daikon.Series.prototype.validatePixelDataLength = function (image) {
        var length = image.getPixelDataBytes().byteLength,
            sliceLength = image.getCols() * image.getRows();

        // pixel data length should be divisible by slice size, if not, try to figure out correct pixel data length
        if ((length % sliceLength) === 0) {
            return length;
        }

        return sliceLength * image.getNumberOfFrames() * image.getNumberOfSamplesPerPixel() * (image.getBitsAllocated() / 8);
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

},{"./image.js":31,"./iterator.js":32,"./orderedmap.js":34,"./parser.js":35,"./utilities.js":40}],38:[function(require,module,exports){

    /*jslint browser: true, node: true */
    /*global require, module */

    "use strict";

    /*** Imports ***/
    var daikon = daikon || {};
    daikon.Utils = daikon.Utils || ((typeof require !== 'undefined') ? require('./utilities.js') : null);


    /*** Constructor ***/

    /**
     * The Siemens constructor.
     * @params {ArrayBuffer} buffer
     * @type {Function}
     */
    daikon.Siemens = daikon.Siemens || function (buffer) {
            this.output = "";
            this.data = new DataView(buffer, 0);
        };


    /*** Static Pseudo-constants ***/

    daikon.Siemens.CSA2_MAGIC_NUMBER = [83, 86, 49, 48];
    daikon.Siemens.NAME_LENGTH = 64;
    daikon.Siemens.ELEMENT_CSA1 = 0x1010;
    daikon.Siemens.ELEMENT_CSA2 = 0x1020;
    daikon.Siemens.GROUP_CSA = 0x029;


    /*** Prototype Methods ***/

    /**
     * Reads the Siemens header.  (See http://nipy.org/nibabel/dicom/siemens_csa.html)
     * @returns {string}
     */
    daikon.Siemens.prototype.readHeader = function () {
        /*jslint bitwise: true */

        var returnVal, ctr, match;

        this.output += "<pre>";

        try {
            match = true;
            for (ctr = 0; ctr < daikon.Siemens.CSA2_MAGIC_NUMBER.length; ctr += 1) {
                match &= (this.data.getUint8(ctr) === daikon.Siemens.CSA2_MAGIC_NUMBER[ctr]);
            }

            if (match) {
                returnVal = this.readHeaderAtOffset(daikon.Siemens.CSA2_MAGIC_NUMBER.length + 4);
            } else {
                returnVal = this.readHeaderAtOffset(0);
            }
        } catch (error) {
            console.log(error);
        }

        this.output += "</pre>";

        return returnVal;
    };



    daikon.Siemens.prototype.readHeaderAtOffset = function (offset) {
        var numTags, ctr;

        this.output += '\n';

        numTags = daikon.Utils.swap32(this.data.getUint32(offset));

        if ((numTags < 1) || (numTags > 128)) {
            return this.output;
        }

        offset += 4;

        offset += 4; // unused

        for (ctr = 0; ctr < numTags; ctr += 1) {
            offset = this.readTag(offset);

            if (offset === -1) {
                break;
            }
        }

        return this.output;
    };



    daikon.Siemens.prototype.readTag = function (offset) {
        var name, ctr, numItems;

        name = this.readString(offset, daikon.Siemens.NAME_LENGTH);

        offset += daikon.Siemens.NAME_LENGTH;

        offset += 4; // vm

        offset += 4;

        offset += 4; // syngodt

        numItems = daikon.Utils.swap32(this.data.getUint32(offset));
        offset += 4;

        offset += 4; // unused

        this.output += ("    " + name + "=");

        for (ctr = 0; ctr < numItems; ctr += 1) {
            offset = this.readItem(offset);

            if (offset === -1) {
                break;
            } else if ((offset % 4) !== 0) {
                offset += (4 - (offset % 4));
            }
        }

        this.output += ('\n');

        return offset;
    };



    daikon.Siemens.prototype.readString = function (offset, length) {
        var char2, ctr, str = "";

        for (ctr = 0; ctr < length; ctr += 1) {
            char2 = this.data.getUint8(offset + ctr);

            if (char2 === 0) {
                break;
            }

            str += String.fromCharCode(char2);
        }

        return str;
    };



    daikon.Siemens.prototype.readItem = function (offset) {
        var itemLength;

        itemLength = daikon.Utils.swap32(this.data.getUint32(offset));

        if ((offset + itemLength) > this.data.buffer.length) {
            return -1;
        }

        offset += 16;

        if (itemLength > 0) {
            this.output += (this.readString(offset, itemLength) + " ");
        }

        return offset + itemLength;
    };


    /**
     * Returns true if the specified group and element indicate this tag can be read.
     * @param {number} group
     * @param {number} element
     * @returns {boolean}
     */
    daikon.Siemens.prototype.canRead = function (group, element) {
        return (group === daikon.Siemens.GROUP_CSA) && ((element === daikon.Siemens.ELEMENT_CSA1) || (element === daikon.Siemens.ELEMENT_CSA2));
    };


    /*** Exports ***/

    var moduleType = typeof module;
    if ((moduleType !== 'undefined') && module.exports) {
        module.exports = daikon.Siemens;
    }

},{"./utilities.js":40}],39:[function(require,module,exports){

    /*jslint browser: true, node: true */
    /*global require */

    "use strict";

    /*** Imports ***/
    var daikon = daikon || {};
    daikon.Utils = daikon.Utils || ((typeof require !== 'undefined') ? require('./utilities.js') : null);
    daikon.Dictionary = daikon.Dictionary || ((typeof require !== 'undefined') ? require('./dictionary.js') : null);
    daikon.Siemens = daikon.Siemens || ((typeof require !== 'undefined') ? require('./siemens.js') : null);


    /*** Constructor ***/

    /**
     * The Tag constuctor.
     * @property {number} group
     * @property {number} element
     * @property {string} vr
     * @property {number} offsetStart
     * @property {number} offsetValue
     * @property {number} offsetEnd
     * @property {boolean} sublist - true if this tag is a sublist
     * @property {number|number[]|string|string[]|object} value
     * @type {Function}
     */
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
                var dv = new DataView(value);
                this.value = daikon.Tag.convertValue(vr, dv, littleEndian);

                if ((this.value === dv) && this.isPrivateData()) {
                    this.value = daikon.Tag.convertPrivateValue(group, element, dv);
                }
            } else {
                this.value = null;
            }
        };


    /*** Static Pseudo-constants ***/

    daikon.Tag.PRIVATE_DATA_READERS = [daikon.Siemens];

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
    daikon.Tag.TAG_PLANAR_CONFIG = [0x0028, 0x0006];
    daikon.Tag.TAG_PALETTE_RED = [0x0028, 0x1201];
    daikon.Tag.TAG_PALETTE_GREEN = [0x0028, 0x1202];
    daikon.Tag.TAG_PALETTE_BLUE = [0x0028, 0x1203];

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

    /**
     * Create an ID string based on the specified group and element
     * @param {number} group
     * @param {number} element
     * @returns {string}
     */
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
                if (parts.length === 3) {
                    data[ctr] = new Date(daikon.Utils.safeParseInt(parts[0]),
                        daikon.Utils.safeParseInt(parts[1]) - 1,
                        daikon.Utils.safeParseInt(parts[2]));
                } else {
                    data[ctr] = new Date();
                }
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



    daikon.Tag.convertPrivateValue = function (group, element, rawData) {
        var ctr, privReader;

        for (ctr = 0; ctr < daikon.Tag.PRIVATE_DATA_READERS.length; ctr += 1) {
            privReader = new daikon.Tag.PRIVATE_DATA_READERS[ctr](rawData.buffer);
            if (privReader.canRead(group, element)) {
                return privReader.readHeader();
            }
        }

        return rawData;
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

    /**
     * Returns a string representation of this tag.
     * @param {number} [level] - the indentation level
     * @param {boolean} [html]
     * @returns {string}
     */
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


    /**
     * Returns an HTML string representation of this tag.
     * @param {number} level - the indentation level
     * @returns {string}
     */
    daikon.Tag.prototype.toHTMLString = function (level) {
        return this.toString(level, true);
    };


    /**
     * Returns true if this is the transform syntax tag.
     * @returns {boolean}
     */
    daikon.Tag.prototype.isTransformSyntax = function () {
        return (this.group === daikon.Tag.TAG_TRANSFER_SYNTAX[0]) && (this.element === daikon.Tag.TAG_TRANSFER_SYNTAX[1]);
    };


    /**
     * Returns true if this is the pixel data tag.
     * @returns {boolean}
     */
    daikon.Tag.prototype.isPixelData = function () {
        return (this.group === daikon.Tag.TAG_PIXEL_DATA[0]) && (this.element === daikon.Tag.TAG_PIXEL_DATA[1]);
    };


    /**
     * Returns true if this tag contains private data.
     * @returns {boolean}
     */
    daikon.Tag.prototype.isPrivateData = function () {
        /*jslint bitwise: true */
        return ((this.group & 1) === 1);
    };


    /**
     * Returns true if this tag contains private data that can be read.
     * @returns {boolean}
     */
    daikon.Tag.prototype.hasInterpretedPrivateData = function () {
        return this.isPrivateData() && daikon.Utils.isString(this.value);
    };


    /**
     * Returns true if this tag is a sublist item.
     * @returns {boolean}
     */
    daikon.Tag.prototype.isSublistItem = function () {
        return (this.group === daikon.Tag.TAG_SUBLIST_ITEM[0]) && (this.element === daikon.Tag.TAG_SUBLIST_ITEM[1]);
    };


    /**
     * Returns true if this tag is a sublist item delimiter.
     * @returns {boolean}
     */
    daikon.Tag.prototype.isSublistItemDelim = function () {
        return (this.group === daikon.Tag.TAG_SUBLIST_ITEM_DELIM[0]) && (this.element === daikon.Tag.TAG_SUBLIST_ITEM_DELIM[1]);
    };


    /**
     * Returns true if this tag is a sequence delimiter.
     * @returns {boolean}
     */
    daikon.Tag.prototype.isSequenceDelim = function () {
        return (this.group === daikon.Tag.TAG_SUBLIST_SEQ_DELIM[0]) && (this.element === daikon.Tag.TAG_SUBLIST_SEQ_DELIM[1]);
    };


    /**
     * Returns true if this is a meta length tag.
     * @returns {boolean}
     */
    daikon.Tag.prototype.isMetaLength = function () {
        return (this.group === daikon.Tag.TAG_META_LENGTH[0]) && (this.element === daikon.Tag.TAG_META_LENGTH[1]);
    };


    /*** Exports ***/

    var moduleType = typeof module;
    if ((moduleType !== 'undefined') && module.exports) {
        module.exports = daikon.Tag;
    }

},{"./dictionary.js":30,"./siemens.js":38,"./utilities.js":40}],40:[function(require,module,exports){

    /*jslint browser: true, node: true */
    /*global require, module */

    "use strict";

    /*** Imports ***/
    var daikon = daikon || {};
    daikon.Utils = daikon.Utils || {};


    daikon.Utils.crcTable = null;


    /*** Static Pseudo-constants ***/

    daikon.Utils.MAX_VALUE = 9007199254740991;
    daikon.Utils.MIN_VALUE = -9007199254740991;



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
            data[6]*Math.pow(2,8)+
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



// http://stackoverflow.com/questions/203739/why-does-instanceof-return-false-for-some-literals
    daikon.Utils.isString = function (s) {
        return typeof(s) === 'string' || s instanceof String;
    };



    daikon.Utils.swap32 = function (val) {
        /*jslint bitwise: true */
        return ((val & 0xFF) << 24) | ((val & 0xFF00) << 8) | ((val >> 8) & 0xFF00) | ((val >> 24) & 0xFF);
    };



    daikon.Utils.swap16 = function (val) {
        /*jslint bitwise: true */
        return ((((val & 0xFF) << 8) | ((val >> 8) & 0xFF)) << 16) >> 16;  // since JS uses 32-bit when bit shifting
    };


// http://stackoverflow.com/questions/18638900/javascript-crc32
    daikon.Utils.makeCRCTable = function(){
        var c;
        var crcTable = [];
        for(var n =0; n < 256; n++){
            c = n;
            for(var k =0; k < 8; k++){
                c = ((c&1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
            }
            crcTable[n] = c;
        }
        return crcTable;
    };

    daikon.Utils.crc32 = function(dataView) {
        var crcTable = daikon.Utils.crcTable || (daikon.Utils.crcTable = daikon.Utils.makeCRCTable());
        var crc = 0 ^ (-1);

        for (var i = 0; i < dataView.byteLength; i++ ) {
            crc = (crc >>> 8) ^ crcTable[(crc ^ dataView.getUint8(i)) & 0xFF];
        }

        return (crc ^ (-1)) >>> 0;
    };



    daikon.Utils.createBitMask = function (numBytes, bitsStored, unsigned) {
        var mask = 0xFFFFFFFF;
        mask >>>= (((4 - numBytes) * 8) + ((numBytes * 8) - bitsStored));

        if (unsigned) {
            if (numBytes == 1) {
                mask &= 0x000000FF;
            } else if (numBytes == 2) {
                mask &= 0x0000FFFF;
            } else if (numBytes == 4) {
                mask &= 0xFFFFFFFF;
            } else if (numBytes == 8) {
                mask = 0xFFFFFFFF;
            }
        } else {
            mask = 0xFFFFFFFF;
        }

        return mask;
    };



    /*** Exports ***/

    var moduleType = typeof module;
    if ((moduleType !== 'undefined') && module.exports) {
        module.exports = daikon.Utils;
    }

},{}]},{},[33])(33)
});