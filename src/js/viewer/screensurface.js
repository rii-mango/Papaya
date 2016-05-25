
/*jslint browser: true, node: true */
/*global papayaRoundFast */

"use strict";

/*** Imports ***/
var papaya = papaya || {};
papaya.viewer = papaya.viewer || {};


/*** Shaders ***/

var shaderVert = [
    "precision mediump float;",

    "attribute vec3 aVertexPosition;",
    "attribute vec3 aVertexNormal;",
    "attribute vec4 aVertexColor;",
    "attribute vec2 aTextureCoord;",

    "uniform mat4 uMVMatrix;",
    "uniform mat4 uPMatrix;",
    "uniform mat3 uNMatrix;",

    "uniform vec3 uAmbientColor;",
    "uniform vec3 uPointLightingLocation;",
    "uniform vec3 uPointLightingColor;",

    "uniform bool uActivePlane;",
    "uniform bool uActivePlaneEdge;",
    "uniform bool uCrosshairs;",
    "uniform bool uColors;",
    "uniform bool uColorPicking;",
    "uniform bool uTrianglePicking;",
    "uniform bool uColorSolid;",
    "uniform vec4 uSolidColor;",
    "uniform bool uOrientationText;",
    "uniform bool uRuler;",
    "uniform float uAlpha;",

    "varying vec3 vLightWeighting;",
    "varying lowp vec4 vColor;",
    "varying vec2 vTextureCoord;",

    "void main(void) {",
    "    vec4 mvPosition = uMVMatrix * vec4(aVertexPosition, 1.0);",
    "    gl_Position = uPMatrix * mvPosition;",
    "    if (!uActivePlane && !uActivePlaneEdge && !uCrosshairs && !uOrientationText && !uRuler) {",
    "       vec3 lightDirection = normalize(uPointLightingLocation - mvPosition.xyz);",
    "       vec3 transformedNormal = uNMatrix * aVertexNormal;",
    "       float directionalLightWeighting = max(dot(transformedNormal, lightDirection), 0.0);",
    "       vLightWeighting = uAmbientColor + uPointLightingColor * directionalLightWeighting;",
    "       if (uColors) {",
    "           vColor = aVertexColor;",
    "       }",
    "   }",

    "   if (uColorSolid) {",
    "       vColor = uSolidColor;",
    "   }",

    "   if (uOrientationText) {",
    "       vTextureCoord = aTextureCoord;",
    "   }",
    "}"
].join("\n");

var shaderFrag = [
    "precision mediump float;",

    "uniform bool uActivePlane;",
    "uniform bool uActivePlaneEdge;",
    "uniform bool uCrosshairs;",
    "uniform bool uColors;",
    "uniform bool uColorPicking;",
    "uniform bool uTrianglePicking;",
    "uniform bool uColorSolid;",
    "uniform vec4 uSolidColor;",
    "uniform bool uOrientationText;",
    "uniform bool uRuler;",
    "uniform sampler2D uSampler;",
    "uniform float uAlpha;",

    "varying vec3 vLightWeighting;",
    "varying lowp vec4 vColor;",
    "varying vec2 vTextureCoord;",

    "vec4 packFloatToVec4i(const float value) {",
    "   const vec4 bitSh = vec4(256.0*256.0*256.0, 256.0*256.0, 256.0, 1.0);",
    "   const vec4 bitMsk = vec4(0.0, 1.0/256.0, 1.0/256.0, 1.0/256.0);",
    "   vec4 res = fract(value * bitSh);",
    "   res -= res.xxyz * bitMsk;",
    "   return res;",
    "}",

    "void main(void) {",
    "    vec4 fragmentColor = vec4(1.0, 1.0, 1.0, 1.0);",

    "    if (uColors) {",
    "       fragmentColor = vColor;",
    "    } else if (uColorSolid) {",
    "       fragmentColor = vColor;",
    "    }",

    "    if (uActivePlane) {",
    "       gl_FragColor = vec4(0.10980392156863, 0.52549019607843, 0.93333333333333, 0.5);",
    "    } else if (uActivePlaneEdge) {",
    "       gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);",
    "    } else if (uRuler) {",
    "       gl_FragColor = vec4(1.0, 0.078, 0.576, 1.0);",
    "    } else if (uOrientationText) {",
    "        vec4 textureColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));",
    "        if (textureColor.a > 0.0) {",
    "           gl_FragColor = vec4(textureColor.rgb, textureColor.a);",
    "        } else {",
    "           gl_FragColor = vec4(textureColor.rgb, 0);",
    "        }",
    "    } else if (uCrosshairs) {",
    "       gl_FragColor = vec4(0.10980392156863, 0.52549019607843, 0.93333333333333, 1.0);",
    "    } else if (uColorPicking) {",
    "       gl_FragColor = vec4(fragmentColor.r, fragmentColor.g, fragmentColor.b, 1);",
    "    } else if (uTrianglePicking) {",
    "       gl_FragColor = packFloatToVec4i(gl_FragCoord.z);",
    "    } else {",
    "       gl_FragColor = vec4(fragmentColor.rgb * vLightWeighting, uAlpha);",
    "    }",
    "}"
].join("\n");



/*** Constructor ***/

papaya.viewer.ScreenSurface = papaya.viewer.ScreenSurface || function (baseVolume, surfaces, viewer, params) {
    this.shaderProgram = null;
    this.mvMatrix = mat4.create();
    this.pMatrix = mat4.create();
    this.pMatrix1 = mat4.create();
    this.centerMat = mat4.create();
    this.centerMatInv = mat4.create();
    this.tempMat = mat4.create();
    this.tempMat2 = mat4.create();
    this.pickingBuffer = null;
    this.initialized = false;
    this.screenOffsetX = 0;
    this.screenOffsetY = 0;
    this.screenDim = 0;
    this.screenTransform = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    this.volume = baseVolume;
    this.surfaces = surfaces;
    this.viewer = viewer;
    this.currentCoord = viewer.currentCoord;
    this.zoom = 0;
    this.sliceDirection = papaya.viewer.ScreenSlice.DIRECTION_SURFACE;
    this.dynamicStartX = -1;
    this.dynamicStartY = -1;
    this.activePlaneVertsAxial = new Float32Array(12);
    this.activePlaneVertsCoronal = new Float32Array(12);
    this.activePlaneVertsSagittal = new Float32Array(12);
    this.activePlaneVertsAxialEdges = new Float32Array(24);
    this.activePlaneVertsCoronalEdges = new Float32Array(24);
    this.activePlaneVertsSagittalEdges = new Float32Array(24);
    this.orientationVerts = new Float32Array(24);
    this.crosshairLineVertsX = new Float32Array(6);
    this.crosshairLineVertsY = new Float32Array(6);
    this.crosshairLineVertsZ = new Float32Array(6);
    this.mouseRotDragX = this.clearTransform([]);
    this.mouseRotDragY = this.clearTransform([]);
    this.mouseRotDrag = this.clearTransform([]);
    this.mouseTransDrag = this.clearTransform([]);
    this.mouseRotCurrent = this.clearTransform([]);
    this.mouseTransCurrent = this.clearTransform([]);
    this.mouseRotTemp = this.clearTransform([]);
    this.mouseTransTemp = this.clearTransform([]);
    this.activePlaneAxialBuffer = null;
    this.activePlaneCoronalBuffer = null;
    this.activePlaneSagittalBuffer = null;
    this.activePlaneAxialEdgesBuffer = null;
    this.activePlaneCoronalEdgesBuffer = null;
    this.activePlaneSagittalEdgesBuffer = null;
    this.orientationBuffer = null;
    this.crosshairLineXBuffer = null;
    this.crosshairLineYBuffer = null;
    this.crosshairLineZBuffer = null;
    this.crosshairLineZBuffer = null;
    this.xSize = this.volume.header.voxelDimensions.xSize;
    this.xDim = this.volume.header.imageDimensions.xDim;
    this.xHalf = (this.xDim * this.xSize) / 2.0;
    this.ySize = this.volume.header.voxelDimensions.ySize;
    this.yDim = this.volume.header.imageDimensions.yDim;
    this.yHalf = (this.yDim * this.ySize) / 2.0;
    this.zSize = this.volume.header.voxelDimensions.zSize;
    this.zDim = this.volume.header.imageDimensions.zDim;
    this.zHalf = (this.zDim * this.zSize) / 2.0;
    this.showSurfacePlanes = (viewer.container.preferences.showSurfacePlanes === "Yes");
    this.backgroundColor = papaya.viewer.ScreenSurface.DEFAULT_BACKGROUND;
    this.pickLocX = 0;
    this.pickLocY = 0;
    this.needsPickColor = false;
    this.pickedColor = null;
    this.needsPick = false;
    this.pickedCoordinate = null;
    this.scaleFactor = 1;
    this.orientationTexture = null;
    this.orientationTextureCoords = null;
    this.orientationTextureCoordBuffer = null;
    this.orientationCanvas = null;
    this.orientationContext = null;
    this.rulerPoints = null;
    this.grabbedRulerPoint = -1;

    this.processParams(params);
};



/*** Static Pseudo-constants ***/

papaya.viewer.ScreenSurface.DEFAULT_ORIENTATION = [ -0.015552218963737041, 0.09408106275544359, -0.9954430697501158, 0,
                                                    -0.9696501263313991, 0.24152923619118966, 0.03797658948646743, 0,
                                                    0.24400145970103732, 0.965822108594413, 0.0874693978960848, 0,
                                                    0, 0, 0, 1];
papaya.viewer.ScreenSurface.MOUSE_SENSITIVITY = 0.3;
papaya.viewer.ScreenSurface.DEFAULT_BACKGROUND = [0.5, 0.5, 0.5];
papaya.viewer.ScreenSurface.TEXT_SIZE = 50;
papaya.viewer.ScreenSurface.ORIENTATION_SIZE = 10;
papaya.viewer.ScreenSurface.RULER_COLOR = [1, 0.078, 0.576];
papaya.viewer.ScreenSurface.RULER_NUM_LINES = 25;
papaya.viewer.ScreenSurface.RULER_RADIUS = 1;


/*** Static Variables ***/

papaya.viewer.ScreenSurface.EXT_INT = null;



/*** Static Methods ***/

papaya.viewer.ScreenSurface.makeShader = function (gl, src, type) {
    var shader = gl.createShader(type);

    gl.shaderSource(shader, src);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.log(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
};



papaya.viewer.ScreenSurface.initShaders = function (gl) {
    var fragmentShader = papaya.viewer.ScreenSurface.makeShader(gl, shaderVert, gl.VERTEX_SHADER);
    var vertexShader = papaya.viewer.ScreenSurface.makeShader(gl, shaderFrag, gl.FRAGMENT_SHADER);
    var shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.log("Could not initialise shaders");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
    gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);
    shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
    shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
    shaderProgram.ambientColorUniform = gl.getUniformLocation(shaderProgram, "uAmbientColor");
    shaderProgram.pointLightingLocationUniform = gl.getUniformLocation(shaderProgram, "uPointLightingLocation");
    shaderProgram.pointLightingColorUniform = gl.getUniformLocation(shaderProgram, "uPointLightingColor");
    shaderProgram.activePlane = gl.getUniformLocation(shaderProgram, "uActivePlane");
    shaderProgram.activePlaneEdge = gl.getUniformLocation(shaderProgram, "uActivePlaneEdge");
    shaderProgram.colorPicking = gl.getUniformLocation(shaderProgram, "uColorPicking");
    shaderProgram.trianglePicking = gl.getUniformLocation(shaderProgram, "uTrianglePicking");
    shaderProgram.crosshairs = gl.getUniformLocation(shaderProgram, "uCrosshairs");
    shaderProgram.hasColors = gl.getUniformLocation(shaderProgram, "uColors");
    shaderProgram.hasSolidColor = gl.getUniformLocation(shaderProgram, "uColorSolid");
    shaderProgram.solidColor = gl.getUniformLocation(shaderProgram, "uSolidColor");
    shaderProgram.orientationText = gl.getUniformLocation(shaderProgram, "uOrientationText");
    shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
    shaderProgram.ruler = gl.getUniformLocation(shaderProgram, "uRuler");
    shaderProgram.alphaVal = gl.getUniformLocation(shaderProgram, "uAlpha");

    return shaderProgram;
};



/*** Prototype Methods ***/

papaya.viewer.ScreenSurface.prototype.initialize = function () {
    var ctr;

    this.initialized = true;

    this.canvas = document.createElement("canvas");
    this.canvas.width = this.screenDim;
    this.canvas.height = this.screenDim;
    this.context = this.canvas.getContext("webgl") || this.canvas.getContext("experimental-webgl");
    this.context.viewportWidth = this.canvas.width;
    this.context.viewportHeight = this.canvas.height;

    this.zoom = this.volume.header.imageDimensions.yDim * this.volume.header.voxelDimensions.ySize * 1.5;
    this.initPerspective();

    this.shaderProgram = papaya.viewer.ScreenSurface.initShaders(this.context);

    for (ctr = 0; ctr < this.surfaces.length; ctr += 1) {
        this.initBuffers(this.context, this.surfaces[ctr]);
    }

    this.calculateScaleFactor();
    this.initActivePlaneBuffers(this.context);
    this.initRulerBuffers(this.context);

    mat4.multiply(this.centerMat, papaya.viewer.ScreenSurface.DEFAULT_ORIENTATION, this.tempMat);
    mat4.multiply(this.tempMat, this.centerMatInv, this.mouseRotCurrent);

    papaya.viewer.ScreenSurface.EXT_INT = this.context.getExtension('OES_element_index_uint');
    if (!papaya.viewer.ScreenSurface.EXT_INT) {
        console.log("This browser does not support OES_element_index_uint extension!");
    }

    this.updateBackgroundColor();
};



papaya.viewer.ScreenSurface.prototype.calculateScaleFactor = function () {
    var xRange = (this.xSize * this.xDim),
        yRange = (this.ySize * this.yDim),
        zRange = (this.zSize * this.zDim),
        longestRange = xRange;

    if (yRange > longestRange) {
        longestRange = yRange;
    }

    if (zRange > longestRange) {
        longestRange = zRange;
    }

    this.scaleFactor = (longestRange / 256.0);
};



papaya.viewer.ScreenSurface.prototype.resize = function (screenDim) {
    if (!this.initialized) {
        this.initialize();
    }

    this.screenDim = screenDim;
    this.canvas.width = this.screenDim;
    this.canvas.height = this.screenDim;
    this.context.viewportWidth = this.canvas.width;
    this.context.viewportHeight = this.canvas.height;
};



papaya.viewer.ScreenSurface.prototype.applyMatrixUniforms = function(gl) {
    gl.uniformMatrix4fv(this.shaderProgram.pMatrixUniform, false, this.pMatrix);
    gl.uniformMatrix4fv(this.shaderProgram.mvMatrixUniform, false, this.mvMatrix);
    var normalMatrix = mat3.create();
    mat4.toInverseMat3(this.mvMatrix, normalMatrix);
    mat3.transpose(normalMatrix);
    gl.uniformMatrix3fv(this.shaderProgram.nMatrixUniform, false, normalMatrix);
};



papaya.viewer.ScreenSurface.prototype.draw = function () {
    if (this.surfaces.length > 0) {
        if (!this.initialized) {
            this.initialize();
        }

        this.drawScene(this.context);
    }
};



papaya.viewer.ScreenSurface.prototype.initBuffers = function (gl, surface) {
    surface.pointsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, surface.pointsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, surface.pointData, gl.STATIC_DRAW);
    surface.pointsBuffer.itemSize = 3;
    surface.pointsBuffer.numItems = surface.numPoints;

    surface.normalsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, surface.normalsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, surface.normalsData, gl.STATIC_DRAW);
    surface.normalsBuffer.itemSize = 3;
    surface.normalsBuffer.numItems = surface.numPoints;

    if (surface.colorsData) {
        surface.colorsBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, surface.colorsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, surface.colorsData, gl.STATIC_DRAW);
        surface.colorsBuffer.itemSize = 4;
        surface.colorsBuffer.numItems = surface.numPoints;
    }

    surface.trianglesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, surface.trianglesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, surface.triangleData, gl.STATIC_DRAW);
    surface.trianglesBuffer.itemSize = 1;
    surface.trianglesBuffer.numItems = surface.numTriangles * 3;
};



papaya.viewer.ScreenSurface.prototype.initOrientationBuffers = function (gl) {
    this.makeOrientedTextSquare();
    this.orientationBuffer = gl.createBuffer();
    this.orientationBuffer.itemSize = 3;
    this.orientationBuffer.numItems = 4;

    this.orientationTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.orientationTextureCoordBuffer);
    this.orientationTextureCoords = [
        0.0, 1.0,
        0.0, 0.0,
        1.0, 1.0,
        1.0, 0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.orientationTextureCoords), gl.STATIC_DRAW);
    this.orientationTextureCoordBuffer.itemSize = 2;
    this.orientationTextureCoordBuffer.numItems = 4;
};



papaya.viewer.ScreenSurface.prototype.initActivePlaneBuffers = function (gl) {
    this.updateActivePlanes();

    this.activePlaneAxialBuffer = gl.createBuffer();
    this.activePlaneAxialBuffer.itemSize = 3;
    this.activePlaneAxialBuffer.numItems = 4;

    this.activePlaneCoronalBuffer = gl.createBuffer();
    this.activePlaneCoronalBuffer.itemSize = 3;
    this.activePlaneCoronalBuffer.numItems = 4;

    this.activePlaneSagittalBuffer = gl.createBuffer();
    this.activePlaneSagittalBuffer.itemSize = 3;
    this.activePlaneSagittalBuffer.numItems = 4;

    this.activePlaneAxialEdgesBuffer = gl.createBuffer();
    this.activePlaneAxialEdgesBuffer.itemSize = 3;
    this.activePlaneAxialEdgesBuffer.numItems = 8;

    this.activePlaneCoronalEdgesBuffer = gl.createBuffer();
    this.activePlaneCoronalEdgesBuffer.itemSize = 3;
    this.activePlaneCoronalEdgesBuffer.numItems = 8;

    this.activePlaneSagittalEdgesBuffer = gl.createBuffer();
    this.activePlaneSagittalEdgesBuffer.itemSize = 3;
    this.activePlaneSagittalEdgesBuffer.numItems = 8;

    this.crosshairLineXBuffer = gl.createBuffer();
    this.crosshairLineXBuffer.itemSize = 3;
    this.crosshairLineXBuffer.numItems = 2;

    this.crosshairLineYBuffer = gl.createBuffer();
    this.crosshairLineYBuffer.itemSize = 3;
    this.crosshairLineYBuffer.numItems = 2;

    this.crosshairLineZBuffer = gl.createBuffer();
    this.crosshairLineZBuffer.itemSize = 3;
    this.crosshairLineZBuffer.numItems = 2;
};



papaya.viewer.ScreenSurface.prototype.initRulerBuffers = function (gl) {
    this.rulerPointData = this.makeSphere(papaya.viewer.ScreenSurface.RULER_NUM_LINES,
        papaya.viewer.ScreenSurface.RULER_NUM_LINES, papaya.viewer.ScreenSurface.RULER_RADIUS * this.scaleFactor);

    this.sphereVertexPositionBuffer = gl.createBuffer();
    this.sphereVertexPositionBuffer.itemSize = 3;
    this.sphereVertexPositionBuffer.numItems = this.rulerPointData.vertices.length / 3;

    this.sphereNormalsPositionBuffer = gl.createBuffer();
    this.sphereNormalsPositionBuffer.itemSize = 3;
    this.sphereNormalsPositionBuffer.numItems = this.rulerPointData.normals.length / 3;

    this.sphereVertexIndexBuffer = gl.createBuffer();
    this.sphereVertexIndexBuffer.itemSize = 1;
    this.sphereVertexIndexBuffer.numItems = this.rulerPointData.indices.length;

    this.rulerLineBuffer = gl.createBuffer();
    this.rulerLineBuffer.itemSize = 3;
    this.rulerLineBuffer.numItems = 2;
};



papaya.viewer.ScreenSurface.prototype.initPerspective = function () {
    mat4.perspective(45, 1, 10, 100000, this.pMatrix1);

    this.eye = new vec3.create();
    this.eye[0] = 0;
    this.eye[1] = 0;

    this.center = new vec3.create();
    this.centerWorld = new papaya.core.Coordinate();
    this.viewer.getWorldCoordinateAtIndex(parseInt(this.xDim / 2, 10), parseInt(this.yDim / 2, 10), parseInt(this.zDim / 2, 10), this.centerWorld);
    this.center[0] = this.centerWorld.x;
    this.center[1] = this.centerWorld.y;
    this.center[2] = this.centerWorld.z;

    mat4.identity(this.centerMat);
    mat4.translate(this.centerMat, [this.center[0], this.center[1], this.center[2]]);

    mat4.identity(this.centerMatInv);
    mat4.translate(this.centerMatInv, [-this.center[0], -this.center[1], -this.center[2]]);

    this.up = new vec3.create();
    this.up[0] = 0;
    this.up[1] = 1;
    this.up[2] = 0;
};



papaya.viewer.ScreenSurface.prototype.updatePerspective = function () {
    var mat;

    this.eye[2] = this.zoom;
    mat = mat4.lookAt(this.eye, this.center, this.up);
    mat4.multiply(this.pMatrix1, mat, this.pMatrix);
};



papaya.viewer.ScreenSurface.prototype.unpackFloatFromVec4i = function (val) {
    var bitSh = [1.0/(256.0*256.0*256.0), 1.0/(256.0*256.0), 1.0/256.0, 1.0];
    return ((val[0] * bitSh[0]) + (val[1] * bitSh[1]) + (val[2] * bitSh[2]) + (val[3] * bitSh[3]));
};




papaya.viewer.ScreenSurface.prototype.hasTranslucentSurfaces = function () {
    var ctr;
    for (ctr = 0; ctr < this.surfaces.length; ctr += 1) {
        if (this.surfaces[ctr].alpha < 1) {
            return true;
        }
    }

    return false;
};



papaya.viewer.ScreenSurface.prototype.drawScene = function (gl) {
    var ctr, xSlice, ySlice, zSlice, hasTranslucent = this.hasTranslucentSurfaces();

    // initialize
    gl.clearColor(this.backgroundColor[0], this.backgroundColor[1], this.backgroundColor[2], 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    mat4.identity(this.mvMatrix);
    mat4.multiply(this.mouseRotDrag, this.mouseRotCurrent, this.mouseRotTemp);
    mat4.multiply(this.mouseTransDrag, this.mouseTransCurrent, this.mouseTransTemp);
    mat4.multiply(this.mouseTransTemp, this.mouseRotTemp, this.tempMat);
    mat4.set(this.tempMat, this.mvMatrix);
    this.updatePerspective();
    this.applyMatrixUniforms(gl);

    gl.uniform3f(this.shaderProgram.ambientColorUniform, 0.2, 0.2, 0.2);
    gl.uniform3f(this.shaderProgram.pointLightingLocationUniform, 0, 0, 300 * this.scaleFactor);
    gl.uniform3f(this.shaderProgram.pointLightingColorUniform, 0.8, 0.8, 0.8);

    gl.uniform1i(this.shaderProgram.orientationText, 0);
    gl.uniform1i(this.shaderProgram.activePlane, 0);
    gl.uniform1i(this.shaderProgram.activePlaneEdge, 0);
    gl.uniform1i(this.shaderProgram.crosshairs, 0);
    gl.uniform1i(this.shaderProgram.hasColors, 0);
    gl.uniform1i(this.shaderProgram.colorPicking, 0);
    gl.uniform1i(this.shaderProgram.trianglePicking, 0);

    if (this.needsPick) {
        gl.uniform1i(this.shaderProgram.trianglePicking, 1);

        if ((this.pickingBuffer === null) || (this.pickingBuffer.length !== (gl.viewportWidth * gl.viewportHeight * 4))) {
            this.pickingBuffer = new Uint8Array(gl.viewportWidth * gl.viewportHeight * 4);
        }
    } else if (this.needsPickColor) {
        gl.uniform1i(this.shaderProgram.colorPicking, 1);

        if ((this.pickingBuffer === null) || (this.pickingBuffer.length !== (gl.viewportWidth * gl.viewportHeight * 4))) {
            this.pickingBuffer = new Uint8Array(gl.viewportWidth * gl.viewportHeight * 4);
        }
    }

    // draw surfaces (first pass)
    gl.enable(gl.DEPTH_TEST);

    for (ctr = 0; ctr < this.surfaces.length; ctr += 1) {
        this.renderSurface(gl, ctr, this.surfaces[ctr].alpha < 1, true, false);
    }

    gl.uniform1i(this.shaderProgram.hasSolidColor, 0);
    gl.uniform1i(this.shaderProgram.hasColors, 0);

    // do picking if necessary
    if (this.needsPick) {
        this.needsPick = false;
        this.pickedCoordinate = this.findPickedCoordinate(gl, this.pickLocX, this.pickLocY);
        gl.uniform1i(this.shaderProgram.trianglePicking, 0);
    } else if (this.needsPickColor) {
        this.needsPickColor = false;
        this.pickedColor = this.findPickedColor(gl);
        gl.uniform1i(this.shaderProgram.colorPicking, 0);
    } else {
        if (this.showSurfacePlanes) {
            // draw active planes
            if (this.needsUpdateActivePlanes) {
                this.needsUpdateActivePlanes = false;
                this.bindActivePlanes(gl);
            }

            gl.depthMask(false);
            gl.uniform1i(this.shaderProgram.activePlane, 1);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.activePlaneAxialBuffer);
            gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, this.activePlaneAxialBuffer.itemSize, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.activePlaneCoronalBuffer);
            gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, this.activePlaneCoronalBuffer.itemSize, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.activePlaneSagittalBuffer);
            gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, this.activePlaneSagittalBuffer.itemSize, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

            gl.depthMask(true);
            gl.disable(gl.BLEND);
            gl.uniform1i(this.shaderProgram.activePlane, 0);

            // draw active plane edges
            gl.uniform1i(this.shaderProgram.activePlaneEdge, 1);
            gl.lineWidth(this.isMainView() ? 3.0 : 2.0);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.activePlaneAxialEdgesBuffer);
            gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, this.activePlaneAxialEdgesBuffer.itemSize, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.LINES, 0, 8);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.activePlaneCoronalEdgesBuffer);
            gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, this.activePlaneCoronalEdgesBuffer.itemSize, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.LINES, 0, 8);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.activePlaneSagittalEdgesBuffer);
            gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, this.activePlaneSagittalEdgesBuffer.itemSize, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.LINES, 0, 8);

            gl.uniform1i(this.shaderProgram.activePlaneEdge, 0);
        }

        if (this.viewer.isShowingCrosshairs() && ((this.viewer.mainImage !== this) || this.viewer.toggleMainCrosshairs)) {
            if (this.needsUpdateActivePlanes) {
                this.needsUpdateActivePlanes = false;
                this.bindActivePlanes(gl);
            }

            // draw crosshairs
            gl.uniform1i(this.shaderProgram.crosshairs, 1);
            gl.lineWidth(this.isMainView() ? 3.0 : 2.0);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.crosshairLineXBuffer);
            gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, this.crosshairLineXBuffer.itemSize, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.LINES, 0, 2);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.crosshairLineYBuffer);
            gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, this.crosshairLineYBuffer.itemSize, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.LINES, 0, 2);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.crosshairLineZBuffer);
            gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, this.crosshairLineZBuffer.itemSize, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.LINES, 0, 2);

            gl.uniform1i(this.shaderProgram.crosshairs, 0);
        }

        // draw surface (secondpass)
        gl.enable(gl.DEPTH_TEST);

        for (ctr = 0; ctr < this.surfaces.length; ctr += 1) {
            if (hasTranslucent) {
                this.renderSurface(gl, ctr, this.surfaces[ctr].alpha < 1, false, true);
            }
        }

        // draw orientation
        if ((this.viewer.mainImage === this.viewer.surfaceView) &&
            (this.viewer.container.preferences.showOrientation === "Yes")) {
            xSlice = this.currentCoord.x + ((this.xDim / 2) - this.volume.header.origin.x);
            ySlice = this.yDim - this.currentCoord.y - ((this.yDim / 2) - this.volume.header.origin.y);
            zSlice = this.zDim - this.currentCoord.z - ((this.zDim / 2) - this.volume.header.origin.z);

            this.drawOrientedText(gl, "S", papaya.viewer.ScreenSurface.TEXT_SIZE, [(xSlice * this.xSize) - this.xHalf, (ySlice * this.ySize) - this.yHalf,
                this.zHalf + papaya.viewer.ScreenSurface.ORIENTATION_SIZE * this.scaleFactor - ((this.zDim / 2) -
                this.volume.header.origin.z) * this.zSize]);
            this.drawOrientedText(gl, "I", papaya.viewer.ScreenSurface.TEXT_SIZE,[(xSlice * this.xSize) - this.xHalf, (ySlice * this.ySize) - this.yHalf,
                -this.zHalf - papaya.viewer.ScreenSurface.ORIENTATION_SIZE * this.scaleFactor - ((this.zDim / 2) -
                this.volume.header.origin.z) * this.zSize]);
            this.drawOrientedText(gl, "P", papaya.viewer.ScreenSurface.TEXT_SIZE, [(xSlice * this.xSize) - this.xHalf, -this.yHalf -
            papaya.viewer.ScreenSurface.ORIENTATION_SIZE * this.scaleFactor - ((this.yDim / 2) -
            this.volume.header.origin.y) * this.ySize, (zSlice * this.zSize) - this.zHalf]);
            this.drawOrientedText(gl, "A", papaya.viewer.ScreenSurface.TEXT_SIZE, [(xSlice * this.xSize) - this.xHalf, this.yHalf +
            papaya.viewer.ScreenSurface.ORIENTATION_SIZE * this.scaleFactor - ((this.yDim / 2) -
            this.volume.header.origin.y) * this.ySize, (zSlice * this.zSize) - this.zHalf]);
            this.drawOrientedText(gl, "L", papaya.viewer.ScreenSurface.TEXT_SIZE, [-this.xHalf - papaya.viewer.ScreenSurface.ORIENTATION_SIZE *
            this.scaleFactor + ((this.xDim / 2) - this.volume.header.origin.x) * this.xSize,
                (ySlice * this.ySize) - this.yHalf, (zSlice * this.zSize) - this.zHalf]);
            this.drawOrientedText(gl, "R", papaya.viewer.ScreenSurface.TEXT_SIZE, [this.xHalf + papaya.viewer.ScreenSurface.ORIENTATION_SIZE *
            this.scaleFactor + ((this.xDim / 2) - this.volume.header.origin.x) * this.xSize,
                (ySlice * this.ySize) - this.yHalf, (zSlice * this.zSize) - this.zHalf]);
        }

        if (this.viewer.container.preferences.showRuler === "Yes") {
            if (this.isMainView()) {
                this.drawRuler(gl);
            }
        } else {
            this.rulerPoints = null;
        }
    }

    // clean up
    gl.disable(gl.DEPTH_TEST);
};



papaya.viewer.ScreenSurface.prototype.renderSurface = function (gl, index, isTranslucent, translucentFirstPass, translucentSecondPass) {
    gl.uniform1f(this.shaderProgram.alphaVal, this.surfaces[index].alpha);

    if (isTranslucent) {
        if (translucentFirstPass) {
            gl.enable(gl.BLEND);
            gl.enable(gl.CULL_FACE);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.frontFace(gl.CCW);
            gl.cullFace(gl.FRONT);
            gl.uniform3f(this.shaderProgram.ambientColorUniform, 0, 0, 0);
            gl.uniform3f(this.shaderProgram.pointLightingLocationUniform, 0, 0, -300 * this.scaleFactor);
        } else if (translucentSecondPass) {
            gl.enable(gl.BLEND);
            gl.enable(gl.CULL_FACE);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.frontFace(gl.CCW);
            gl.cullFace(gl.BACK);
            gl.uniform3f(this.shaderProgram.ambientColorUniform, 0.2, 0.2, 0.2);
            gl.uniform3f(this.shaderProgram.pointLightingLocationUniform, 0, 0, 300 * this.scaleFactor);
        }
    } else {
        gl.uniform3f(this.shaderProgram.ambientColorUniform, 0.2, 0.2, 0.2);
        gl.uniform3f(this.shaderProgram.pointLightingLocationUniform, 0, 0, 300 * this.scaleFactor);
    }

    gl.uniform1i(this.shaderProgram.hasSolidColor, 0);
    gl.uniform1i(this.shaderProgram.hasColors, 0);

    if (this.surfaces[index].solidColor) {
        gl.uniform1i(this.shaderProgram.hasSolidColor, 1);
        gl.uniform4f(this.shaderProgram.solidColor, this.surfaces[index].solidColor[0],
            this.surfaces[index].solidColor[1], this.surfaces[index].solidColor[2], 1.0);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.surfaces[index].pointsBuffer);
    gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, this.surfaces[index].pointsBuffer.itemSize,
        gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.surfaces[index].normalsBuffer);
    gl.vertexAttribPointer(this.shaderProgram.vertexNormalAttribute, this.surfaces[index].normalsBuffer.itemSize,
        gl.FLOAT, false, 0, 0);

    if (this.surfaces[index].colorsData) {
        gl.uniform1i(this.shaderProgram.hasColors, 1);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.surfaces[index].colorsBuffer);
        gl.enableVertexAttribArray(this.shaderProgram.vertexColorAttribute);
        gl.vertexAttribPointer(this.shaderProgram.vertexColorAttribute, this.surfaces[index].colorsBuffer.itemSize,
            gl.FLOAT, false, 0, 0);
    } else {
        gl.disableVertexAttribArray(this.shaderProgram.vertexColorAttribute);
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.surfaces[index].trianglesBuffer);
    gl.drawElements(gl.TRIANGLES, this.surfaces[index].trianglesBuffer.numItems, gl.UNSIGNED_INT, 0);

    if (isTranslucent && (translucentFirstPass || translucentSecondPass)) {
        gl.disable(gl.BLEND);
        gl.disable(gl.CULL_FACE);
    }
};



papaya.viewer.ScreenSurface.prototype.drawRuler = function (gl) {
    var found = true;

    if (this.rulerPoints === null) {
        this.rulerPoints = new Float32Array(6);
        found = this.findInitialRulerPoints(gl);
        this.drawScene(gl);  // need to redraw since pick
    }

    if (found) {
        gl.uniform1i(this.shaderProgram.ruler, 1);

        // draw endpoints
        this.drawRulerPoint(gl, this.rulerPoints[0], this.rulerPoints[1], this.rulerPoints[2]);
        this.drawRulerPoint(gl, this.rulerPoints[3], this.rulerPoints[4], this.rulerPoints[5]);

        // draw line
        gl.bindBuffer(gl.ARRAY_BUFFER, this.rulerLineBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.rulerPoints, gl.DYNAMIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.rulerLineBuffer);
        gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, this.rulerLineBuffer.itemSize, gl.FLOAT,
            false, 0, 0);
        gl.drawArrays(gl.LINES, 0, 2);
        gl.uniform1i(this.shaderProgram.ruler, 0);
    }
};



papaya.viewer.ScreenSurface.prototype.drawRulerPoint = function (gl, xLoc, yLoc, zLoc) {
    this.sphereVertexPositionBuffer.numItems = this.rulerPointData.vertices.length / 3;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.sphereVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.rulerPointData.vertices), gl.STATIC_DRAW);

    this.sphereNormalsPositionBuffer.numItems = this.rulerPointData.normals.length / 3;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.sphereNormalsPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.rulerPointData.normals), gl.STATIC_DRAW);

    this.sphereVertexIndexBuffer.numItems = this.rulerPointData.indices.length;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.sphereVertexIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.rulerPointData.indices), gl.STATIC_DRAW);

    gl.uniform1i(this.shaderProgram.hasSolidColor, 1);
    gl.uniform4f(this.shaderProgram.solidColor, papaya.viewer.ScreenSurface.RULER_COLOR[0],
        papaya.viewer.ScreenSurface.RULER_COLOR[1], papaya.viewer.ScreenSurface.RULER_COLOR[2], 1.0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.sphereVertexPositionBuffer);
    gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, this.sphereVertexPositionBuffer.itemSize,
        gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.sphereNormalsPositionBuffer);
    gl.vertexAttribPointer(this.shaderProgram.vertexNormalAttribute, this.sphereNormalsPositionBuffer.itemSize,
        gl.FLOAT, false, 0, 0);

    mat4.set(this.mvMatrix, this.tempMat);
    mat4.translate(this.mvMatrix, [xLoc, yLoc, zLoc]);
    this.applyMatrixUniforms(gl);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.sphereVertexIndexBuffer);
    gl.drawElements(gl.TRIANGLES, this.sphereVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    mat4.set(this.tempMat, this.mvMatrix);
    this.applyMatrixUniforms(gl);
};



papaya.viewer.ScreenSurface.prototype.drawOrientedText = function (gl, str, fontSize, coord) {
    if (this.orientationCanvas === null) {
        this.initOrientationBuffers(this.context);
    }

    this.updateOrientedTextSquare(fontSize, str);

    if (this.orientationTexture === null) {
        this.orientationTexture = gl.createTexture();
    }

    this.bindOrientation(gl);
    gl.enableVertexAttribArray(this.shaderProgram.textureCoordAttribute);
    gl.uniform1i(this.shaderProgram.orientationText, 1);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    this.orientationContext.imageSmoothingEnabled = true;
    this.orientationContext.webkitImageSmoothingEnabled = true;
    this.orientationContext.mozImageSmoothingEnabled = true;
    this.orientationContext.msImageSmoothingEnabled = true;
    this.orientationContext.textAlign = "center";
    this.orientationContext.textBaseline = "middle";
    this.orientationContext.font = fontSize + "px sans-serif";
    this.orientationContext.clearRect(0, 0, this.orientationCanvas.width, this.orientationCanvas.height);
    this.orientationContext.fillStyle = "#FFFFFF";
    this.orientationContext.fillText(str, this.orientationCanvas.width/2, this.orientationCanvas.height/2);

    mat4.set(this.mvMatrix, this.tempMat);
    mat4.multiplyVec3(this.mvMatrix, coord);
    mat4.identity(this.mvMatrix);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.orientationBuffer);
    gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, this.orientationBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.bindTexture(gl.TEXTURE_2D, this.orientationTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.orientationCanvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.orientationTextureCoordBuffer);
    gl.vertexAttribPointer(this.shaderProgram.textureCoordAttribute, this.orientationTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.orientationTexture);
    gl.uniform1i(this.shaderProgram.samplerUniform, 0);

    mat4.translate(this.mvMatrix, coord);
    this.applyMatrixUniforms(gl);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    mat4.set(this.tempMat, this.mvMatrix);
    this.applyMatrixUniforms(gl);

    gl.disable(gl.BLEND);

    gl.uniform1i(this.shaderProgram.orientationText, 0);
    gl.disableVertexAttribArray(this.shaderProgram.textureCoordAttribute);
};



papaya.viewer.ScreenSurface.prototype.bindOrientation = function (gl) {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.orientationBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.orientationVerts, gl.DYNAMIC_DRAW);
};



papaya.viewer.ScreenSurface.prototype.bindActivePlanes = function (gl) {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.activePlaneAxialBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.activePlaneVertsAxial, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.activePlaneCoronalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.activePlaneVertsCoronal, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.activePlaneSagittalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.activePlaneVertsSagittal, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.activePlaneAxialEdgesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.activePlaneVertsAxialEdges, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.activePlaneCoronalEdgesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.activePlaneVertsCoronalEdges, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.activePlaneSagittalEdgesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.activePlaneVertsSagittalEdges, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.crosshairLineXBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.crosshairLineVertsX, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.crosshairLineYBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.crosshairLineVertsY, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.crosshairLineZBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.crosshairLineVertsZ, gl.DYNAMIC_DRAW);
};



papaya.viewer.ScreenSurface.prototype.clearDTILinesImage = function () {
    // just here to satisfy interface
};



papaya.viewer.ScreenSurface.prototype.findProximalRulerHandle = function (xLoc, yLoc) {
    this.pick(xLoc, yLoc, true);
    this.grabbedRulerPoint = -1;

    if (this.pickedCoordinate && this.rulerPoints) {
        if (papaya.utilities.MathUtils.lineDistance3d(this.rulerPoints[0], this.rulerPoints[1],
                this.rulerPoints[2], this.pickedCoordinate.coordinate[0], this.pickedCoordinate.coordinate[1], this.pickedCoordinate.coordinate[2]) <
                (papaya.viewer.ScreenSlice.GRAB_RADIUS * this.scaleFactor)) {
            this.grabbedRulerPoint = 0;
        } else if (papaya.utilities.MathUtils.lineDistance3d(this.rulerPoints[3], this.rulerPoints[4],
                this.rulerPoints[5], this.pickedCoordinate.coordinate[0], this.pickedCoordinate.coordinate[1], this.pickedCoordinate.coordinate[2]) <
                (papaya.viewer.ScreenSlice.GRAB_RADIUS * this.scaleFactor)) {
            this.grabbedRulerPoint = 1;
        }
    }

    return (this.grabbedRulerPoint !== -1);
};



papaya.viewer.ScreenSurface.prototype.setStartDynamic = function (xLoc, yLoc) {
    this.dynamicStartX = xLoc;
    this.dynamicStartY = yLoc;
};



papaya.viewer.ScreenSurface.prototype.updateDynamic = function (xLoc, yLoc, factor) {
    var rotX = (yLoc - this.dynamicStartY) * papaya.viewer.ScreenSurface.MOUSE_SENSITIVITY * factor;
    var rotY = (xLoc - this.dynamicStartX) * papaya.viewer.ScreenSurface.MOUSE_SENSITIVITY * factor;

    var theta = (rotY * Math.PI) / 180.0;
    mat4.identity(this.mouseRotDragX);
    mat4.rotateY(this.mouseRotDragX, theta);

    theta = (rotX * Math.PI) / 180.0;
    mat4.identity(this.mouseRotDragY);
    mat4.rotateX(this.mouseRotDragY, theta);

    mat4.multiply(this.centerMat, this.mouseRotDragY, this.tempMat);
    mat4.multiply(this.tempMat, this.mouseRotDragX, this.tempMat2);
    mat4.multiply(this.tempMat2, this.centerMatInv, this.mouseRotDrag);
};



papaya.viewer.ScreenSurface.prototype.updateTranslateDynamic = function (xLoc, yLoc, factor) {
    var transX = (xLoc - this.dynamicStartX) * papaya.viewer.ScreenSurface.MOUSE_SENSITIVITY * factor;
    var transY = (yLoc - this.dynamicStartY) * papaya.viewer.ScreenSurface.MOUSE_SENSITIVITY * factor * -1;
    mat4.identity(this.mouseTransDrag);
    mat4.translate(this.mouseTransDrag, [transX, transY, 0]);
};



papaya.viewer.ScreenSurface.prototype.updateCurrent = function () {
    var temp = mat4.multiply(this.mouseRotDrag, this.mouseRotCurrent);
    mat4.set(temp, this.mouseRotCurrent);

    temp = mat4.multiply(this.mouseTransDrag, this.mouseTransCurrent);
    mat4.set(temp, this.mouseTransCurrent);

    mat4.identity(this.mouseTransDrag);
    mat4.identity(this.mouseRotDragX);
    mat4.identity(this.mouseRotDragY);
    mat4.identity(this.mouseRotDrag);
};



papaya.viewer.ScreenSurface.prototype.clearTransform = function (xform) {
    mat4.identity(xform);
    return xform;
};



papaya.viewer.ScreenSurface.prototype.makeOrientedTextSquare = function () {
    var half = papaya.viewer.ScreenSurface.ORIENTATION_SIZE * this.scaleFactor;

    this.orientationVerts[0] = -half;
    this.orientationVerts[1] = half;
    this.orientationVerts[2] = 0;

    this.orientationVerts[3] = -half;
    this.orientationVerts[4] = -half;
    this.orientationVerts[5] = 0;

    this.orientationVerts[6] = half;
    this.orientationVerts[7] = half;
    this.orientationVerts[8] = 0;

    this.orientationVerts[9] = half;
    this.orientationVerts[10] = -half;
    this.orientationVerts[11] = 0;

    this.orientationCanvas = document.createElement("canvas");
    this.orientationContext = this.orientationCanvas.getContext('2d');
    this.orientationContext.imageSmoothingEnabled = true;
    this.orientationContext.webkitImageSmoothingEnabled = true;
    this.orientationContext.mozImageSmoothingEnabled = true;
    this.orientationContext.msImageSmoothingEnabled = true;
    this.orientationContext.fillStyle = "#FFFFFF";
    this.orientationContext.textAlign = "center";
    this.orientationContext.textBaseline = "middle";
};



papaya.viewer.ScreenSurface.prototype.updateOrientedTextSquare = function (fontSize, text) {
    var textWidth, textHeight, textSize;

    this.orientationContext.imageSmoothingEnabled = true;
    this.orientationContext.webkitImageSmoothingEnabled = true;
    this.orientationContext.mozImageSmoothingEnabled = true;
    this.orientationContext.msImageSmoothingEnabled = true;
    this.orientationContext.fillStyle = "#FFFFFF";
    this.orientationContext.textAlign = "center";
    this.orientationContext.textBaseline = "middle";
    this.orientationContext.font = fontSize + "px sans-serif";
    textWidth = this.orientationContext.measureText(text).width;
    textHeight = fontSize;
    textSize = Math.max(textWidth, textHeight);

    this.orientationCanvas.width = papaya.utilities.MathUtils.getPowerOfTwo(textSize);
    this.orientationCanvas.height = papaya.utilities.MathUtils.getPowerOfTwo(textSize);
};



papaya.viewer.ScreenSurface.prototype.updateActivePlanes = function () {
    var xSlice, ySlice, zSlice;

    if (!this.showSurfacePlanes && !this.viewer.isShowingCrosshairs()) {
        return;
    }

    xSlice = this.currentCoord.x + ((this.xDim / 2) - this.volume.header.origin.x);
    ySlice = this.yDim - this.currentCoord.y - ((this.yDim / 2) - this.volume.header.origin.y);
    zSlice = this.zDim - this.currentCoord.z - ((this.zDim / 2) - this.volume.header.origin.z);

    // axial plane
    this.activePlaneVertsAxial[0] = -this.xHalf + this.centerWorld.x;
    this.activePlaneVertsAxial[1] = this.yHalf + this.centerWorld.y;
    this.activePlaneVertsAxial[2] = (zSlice * this.zSize) - this.zHalf;

    this.activePlaneVertsAxial[3] = -this.xHalf + this.centerWorld.x;
    this.activePlaneVertsAxial[4] = -this.yHalf + this.centerWorld.y;
    this.activePlaneVertsAxial[5] = (zSlice * this.zSize) - this.zHalf;

    this.activePlaneVertsAxial[6] = this.xHalf + this.centerWorld.x;
    this.activePlaneVertsAxial[7] = this.yHalf + this.centerWorld.y;
    this.activePlaneVertsAxial[8] = (zSlice * this.zSize) - this.zHalf;

    this.activePlaneVertsAxial[9] = this.xHalf + this.centerWorld.x;
    this.activePlaneVertsAxial[10] = -this.yHalf + this.centerWorld.y;
    this.activePlaneVertsAxial[11] = (zSlice * this.zSize) - this.zHalf;

    // axial plane edges
    this.activePlaneVertsAxialEdges[0] = -this.xHalf + this.centerWorld.x;
    this.activePlaneVertsAxialEdges[1] = this.yHalf + this.centerWorld.y;
    this.activePlaneVertsAxialEdges[2] = (zSlice * this.zSize) - this.zHalf;

    this.activePlaneVertsAxialEdges[3] = -this.xHalf + this.centerWorld.x;
    this.activePlaneVertsAxialEdges[4] = -this.yHalf + this.centerWorld.y;
    this.activePlaneVertsAxialEdges[5] = (zSlice * this.zSize) - this.zHalf;

    this.activePlaneVertsAxialEdges[6] = -this.xHalf + this.centerWorld.x;
    this.activePlaneVertsAxialEdges[7] = -this.yHalf + this.centerWorld.y;
    this.activePlaneVertsAxialEdges[8] = (zSlice * this.zSize) - this.zHalf;

    this.activePlaneVertsAxialEdges[9] = this.xHalf + this.centerWorld.x;
    this.activePlaneVertsAxialEdges[10] = -this.yHalf + this.centerWorld.y;
    this.activePlaneVertsAxialEdges[11] = (zSlice * this.zSize) - this.zHalf;

    this.activePlaneVertsAxialEdges[12] = this.xHalf + this.centerWorld.x;
    this.activePlaneVertsAxialEdges[13] = -this.yHalf + this.centerWorld.y;
    this.activePlaneVertsAxialEdges[14] = (zSlice * this.zSize) - this.zHalf;

    this.activePlaneVertsAxialEdges[15] = this.xHalf + this.centerWorld.x;
    this.activePlaneVertsAxialEdges[16] = this.yHalf + this.centerWorld.y;
    this.activePlaneVertsAxialEdges[17] = (zSlice * this.zSize) - this.zHalf;

    this.activePlaneVertsAxialEdges[18] = this.xHalf + this.centerWorld.x;
    this.activePlaneVertsAxialEdges[19] = this.yHalf + this.centerWorld.y;
    this.activePlaneVertsAxialEdges[20] = (zSlice * this.zSize) - this.zHalf;

    this.activePlaneVertsAxialEdges[21] = -this.xHalf + this.centerWorld.x;
    this.activePlaneVertsAxialEdges[22] = this.yHalf + this.centerWorld.y;
    this.activePlaneVertsAxialEdges[23] = (zSlice * this.zSize) - this.zHalf;

    // coronal plane
    this.activePlaneVertsCoronal[0] = -this.xHalf + this.centerWorld.x;
    this.activePlaneVertsCoronal[1] = ((ySlice * this.ySize) - this.yHalf);
    this.activePlaneVertsCoronal[2] = this.zHalf + this.centerWorld.z;

    this.activePlaneVertsCoronal[3] = -this.xHalf + this.centerWorld.x;
    this.activePlaneVertsCoronal[4] = ((ySlice * this.ySize) - this.yHalf);
    this.activePlaneVertsCoronal[5] = -this.zHalf + this.centerWorld.z;

    this.activePlaneVertsCoronal[6] = this.xHalf + this.centerWorld.x;
    this.activePlaneVertsCoronal[7] = ((ySlice * this.ySize) - this.yHalf);
    this.activePlaneVertsCoronal[8] = this.zHalf + this.centerWorld.z;

    this.activePlaneVertsCoronal[9] = this.xHalf + this.centerWorld.x;
    this.activePlaneVertsCoronal[10] = ((ySlice * this.ySize) - this.yHalf);
    this.activePlaneVertsCoronal[11] = -this.zHalf + this.centerWorld.z;

    // coronal plane edges
    this.activePlaneVertsCoronalEdges[0] = -this.xHalf + this.centerWorld.x;
    this.activePlaneVertsCoronalEdges[1] = ((ySlice * this.ySize) - this.yHalf);
    this.activePlaneVertsCoronalEdges[2] = this.zHalf + this.centerWorld.z;

    this.activePlaneVertsCoronalEdges[3] = -this.xHalf + this.centerWorld.x;
    this.activePlaneVertsCoronalEdges[4] = ((ySlice * this.ySize) - this.yHalf);
    this.activePlaneVertsCoronalEdges[5] = -this.zHalf + this.centerWorld.z;

    this.activePlaneVertsCoronalEdges[6] = -this.xHalf + this.centerWorld.x;
    this.activePlaneVertsCoronalEdges[7] = ((ySlice * this.ySize) - this.yHalf);
    this.activePlaneVertsCoronalEdges[8] = -this.zHalf + this.centerWorld.z;

    this.activePlaneVertsCoronalEdges[9] = this.xHalf + this.centerWorld.x;
    this.activePlaneVertsCoronalEdges[10] = ((ySlice * this.ySize) - this.yHalf);
    this.activePlaneVertsCoronalEdges[11] = -this.zHalf + this.centerWorld.z;

    this.activePlaneVertsCoronalEdges[12] = this.xHalf + this.centerWorld.x;
    this.activePlaneVertsCoronalEdges[13] = ((ySlice * this.ySize) - this.yHalf);
    this.activePlaneVertsCoronalEdges[14] = -this.zHalf + this.centerWorld.z;

    this.activePlaneVertsCoronalEdges[15] = this.xHalf + this.centerWorld.x;
    this.activePlaneVertsCoronalEdges[16] = ((ySlice * this.ySize) - this.yHalf);
    this.activePlaneVertsCoronalEdges[17] = this.zHalf + this.centerWorld.z;

    this.activePlaneVertsCoronalEdges[18] = this.xHalf + this.centerWorld.x;
    this.activePlaneVertsCoronalEdges[19] = ((ySlice * this.ySize) - this.yHalf);
    this.activePlaneVertsCoronalEdges[20] = this.zHalf + this.centerWorld.z;

    this.activePlaneVertsCoronalEdges[21] = -this.xHalf + this.centerWorld.x;
    this.activePlaneVertsCoronalEdges[22] = ((ySlice * this.ySize) - this.yHalf);
    this.activePlaneVertsCoronalEdges[23] = this.zHalf + this.centerWorld.z;

    // sagittal plane
    this.activePlaneVertsSagittal[0] = (xSlice * this.xSize) - this.xHalf;
    this.activePlaneVertsSagittal[1] = -this.yHalf + this.centerWorld.y;
    this.activePlaneVertsSagittal[2] = this.zHalf + this.centerWorld.z;

    this.activePlaneVertsSagittal[3] = (xSlice * this.xSize) - this.xHalf;
    this.activePlaneVertsSagittal[4] = -this.yHalf + this.centerWorld.y;
    this.activePlaneVertsSagittal[5] = -this.zHalf + this.centerWorld.z;

    this.activePlaneVertsSagittal[6] = (xSlice * this.xSize) - this.xHalf;
    this.activePlaneVertsSagittal[7] = this.yHalf + this.centerWorld.y;
    this.activePlaneVertsSagittal[8] = this.zHalf + this.centerWorld.z;

    this.activePlaneVertsSagittal[9] = (xSlice * this.xSize) - this.xHalf;
    this.activePlaneVertsSagittal[10] = this.yHalf + this.centerWorld.y;
    this.activePlaneVertsSagittal[11] = -this.zHalf + this.centerWorld.z;

    // sagittal plane edges
    this.activePlaneVertsSagittalEdges[0] = (xSlice * this.xSize) - this.xHalf;
    this.activePlaneVertsSagittalEdges[1] = -this.yHalf + this.centerWorld.y;
    this.activePlaneVertsSagittalEdges[2] = this.zHalf + this.centerWorld.z;

    this.activePlaneVertsSagittalEdges[3] = (xSlice * this.xSize) - this.xHalf;
    this.activePlaneVertsSagittalEdges[4] = -this.yHalf + this.centerWorld.y;
    this.activePlaneVertsSagittalEdges[5] = -this.zHalf + this.centerWorld.z;

    this.activePlaneVertsSagittalEdges[6] = (xSlice * this.xSize) - this.xHalf;
    this.activePlaneVertsSagittalEdges[7] = -this.yHalf + this.centerWorld.y;
    this.activePlaneVertsSagittalEdges[8] = -this.zHalf + this.centerWorld.z;

    this.activePlaneVertsSagittalEdges[9] = (xSlice * this.xSize) - this.xHalf;
    this.activePlaneVertsSagittalEdges[10] = this.yHalf + this.centerWorld.y;
    this.activePlaneVertsSagittalEdges[11] = -this.zHalf + this.centerWorld.z;

    this.activePlaneVertsSagittalEdges[12] = (xSlice * this.xSize) - this.xHalf;
    this.activePlaneVertsSagittalEdges[13] = this.yHalf + this.centerWorld.y;
    this.activePlaneVertsSagittalEdges[14] = -this.zHalf + this.centerWorld.z;

    this.activePlaneVertsSagittalEdges[15] = (xSlice * this.xSize) - this.xHalf;
    this.activePlaneVertsSagittalEdges[16] = this.yHalf + this.centerWorld.y;
    this.activePlaneVertsSagittalEdges[17] = this.zHalf + this.centerWorld.z;

    this.activePlaneVertsSagittalEdges[18] = (xSlice * this.xSize) - this.xHalf;
    this.activePlaneVertsSagittalEdges[19] = this.yHalf + this.centerWorld.y;
    this.activePlaneVertsSagittalEdges[20] = this.zHalf + this.centerWorld.z;

    this.activePlaneVertsSagittalEdges[21] = (xSlice * this.xSize) - this.xHalf;
    this.activePlaneVertsSagittalEdges[22] = -this.yHalf + this.centerWorld.y;
    this.activePlaneVertsSagittalEdges[23] = this.zHalf + this.centerWorld.z;

    // crosshairs X
    this.crosshairLineVertsZ[0] = ((xSlice * this.xSize) - this.xHalf);
    this.crosshairLineVertsZ[1] = ((ySlice * this.ySize) - this.yHalf);
    this.crosshairLineVertsZ[2] = -this.zHalf + this.centerWorld.z;

    this.crosshairLineVertsZ[3] = ((xSlice * this.xSize) - this.xHalf);
    this.crosshairLineVertsZ[4] = ((ySlice * this.ySize) - this.yHalf);
    this.crosshairLineVertsZ[5] = this.zHalf + this.centerWorld.z;

    // crosshair Y
    this.crosshairLineVertsY[0] = ((xSlice * this.xSize) - this.xHalf);
    this.crosshairLineVertsY[1] = -this.yHalf + this.centerWorld.y;
    this.crosshairLineVertsY[2] = ((zSlice * this.zSize) - this.zHalf);

    this.crosshairLineVertsY[3] = ((xSlice * this.xSize) - this.xHalf);
    this.crosshairLineVertsY[4] = this.yHalf + this.centerWorld.y;
    this.crosshairLineVertsY[5] = ((zSlice * this.zSize) - this.zHalf);

    // crosshair X
    this.crosshairLineVertsX[0] = -this.xHalf + this.centerWorld.x;
    this.crosshairLineVertsX[1] = ((ySlice * this.ySize) - this.yHalf);
    this.crosshairLineVertsX[2] = ((zSlice * this.zSize) - this.zHalf);

    this.crosshairLineVertsX[3] = this.xHalf + this.centerWorld.x;
    this.crosshairLineVertsX[4] = ((ySlice * this.ySize) - this.yHalf);
    this.crosshairLineVertsX[5] = ((zSlice * this.zSize) - this.zHalf);

    this.needsUpdateActivePlanes = true;
};



papaya.viewer.ScreenSurface.prototype.pick = function (xLoc, yLoc, skipRedraw) {
    this.needsPick = true;
    this.pickLocX = xLoc;
    this.pickLocY = yLoc;
    this.draw(); // do picking

    if (skipRedraw) {
        return this.pickedCoordinate;
    }

    this.draw(); // redraw scene
    return this.pickedCoordinate;
};



papaya.viewer.ScreenSurface.prototype.pickRuler = function (xLoc, yLoc) {
    this.needsPick = true;
    this.pickLocX = xLoc;
    this.pickLocY = yLoc;
    this.draw(); // do picking

    if (this.pickedCoordinate) {
        this.rulerPoints[(this.grabbedRulerPoint * 3)] = this.pickedCoordinate.coordinate[0];
        this.rulerPoints[(this.grabbedRulerPoint * 3) + 1] = this.pickedCoordinate.coordinate[1];
        this.rulerPoints[(this.grabbedRulerPoint * 3) + 2] = this.pickedCoordinate.coordinate[2];

        this.draw(); // redraw scene
    }

    return this.pickedCoordinate;
};



papaya.viewer.ScreenSurface.prototype.pickColor = function (xLoc, yLoc) {
    this.needsPickColor = true;
    this.pickLocX = xLoc;
    this.pickLocY = yLoc;
    this.draw(); // do picking
    this.draw(); // redraw scene
    return this.pickedColor;
};



papaya.viewer.ScreenSurface.prototype.findPickedCoordinate = function (gl, xLoc, yLoc) {
    var winX = xLoc,
        winY = (gl.viewportHeight - 1 - yLoc),
        winZ, viewportArray, success, modelPointArrayResults = [];

    gl.readPixels(winX, winY, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, this.pickingBuffer);
    winZ = (this.unpackFloatFromVec4i(this.pickingBuffer) / 255.0);

    if (winZ >= 1) {
        return null;
    }

    viewportArray = [0, 0, gl.viewportWidth, gl.viewportHeight];

    success = GLU.unProject(
        winX, winY, winZ,
        this.mvMatrix, this.pMatrix,
        viewportArray, modelPointArrayResults);

    if (success) {
        return {coordinate: modelPointArrayResults, depth: winZ};
    }

    return null;
};



papaya.viewer.ScreenSurface.prototype.findInitialRulerPoints = function (gl) {
    var xDim = gl.viewportWidth,
        yDim = gl.viewportHeight,
        coord, points = [], finalPoints = [], xLoc, yLoc, ctr, index;

    for (ctr = 1; ctr < 5; ctr += 1) {
        xLoc = parseInt(xDim * .1 * ctr, 10);
        yLoc = parseInt(yDim * .1 * ctr, 10);
        coord = this.pick(xLoc, yLoc, true);
        if (coord) {
            points.push(coord);
        }

        xLoc = parseInt(xDim - (xDim * .1) * ctr, 10);
        yLoc = parseInt(yDim * .1 * ctr, 10);
        coord = this.pick(xLoc, yLoc, true);
        if (coord) {
            points.push(coord);
        }

        xLoc = parseInt(xDim - (xDim * .1) * ctr, 10);
        yLoc = parseInt(yDim - (yDim * .1) * ctr, 10);
        coord = this.pick(xLoc, yLoc, true);
        if (coord) {
            points.push(coord);
        }

        xLoc = parseInt(xDim * .1 * ctr, 10);
        yLoc = parseInt(yDim - (yDim * .1) * ctr, 10);
        coord = this.pick(xLoc, yLoc, true);
        if (coord) {
            points.push(coord);
        }
    }

    if (points < 2) {
        return false;
    }

    index = 0;
    for (ctr = 0; ctr < points.length; ctr += 1) {
        if (points[ctr].depth < points[index].depth) {
            index = ctr;
        }
    }

    finalPoints.push(points[index].coordinate);
    points.splice(index, 1);

    index = 0;
    for (ctr = 0; ctr < points.length; ctr += 1) {
        if (points[ctr].depth < points[index].depth) {
            index = ctr;
        }
    }

    finalPoints.push(points[index].coordinate);

    this.rulerPoints[0] = finalPoints[0][0];
    this.rulerPoints[1] = finalPoints[0][1];
    this.rulerPoints[2] = finalPoints[0][2];
    this.rulerPoints[3] = finalPoints[1][0];
    this.rulerPoints[4] = finalPoints[1][1];
    this.rulerPoints[5] = finalPoints[1][2];

    return true;
};



papaya.viewer.ScreenSurface.prototype.findPickedColor = function (gl) {
    var index;
    gl.readPixels(0, 0, gl.viewportWidth, gl.viewportHeight, gl.RGBA, gl.UNSIGNED_BYTE, this.pickingBuffer);
    index = (gl.viewportHeight - 1 - this.pickLocY) * gl.viewportWidth * 4 + this.pickLocX * 4;
    return [this.pickingBuffer[index], this.pickingBuffer[index + 1], this.pickingBuffer[index + 2]];
};



papaya.viewer.ScreenSurface.prototype.getBackgroundColor = function () {
    return ("rgba(" + parseInt((this.backgroundColor[0] * 255) + 0.5) + ',' +
        parseInt((this.backgroundColor[1] * 255) + 0.5) + ',' +
        parseInt((this.backgroundColor[2] * 255) + 0.5) + ',255)');
};



papaya.viewer.ScreenSurface.prototype.updatePreferences = function () {
    this.updateBackgroundColor();
};



papaya.viewer.ScreenSurface.prototype.updateBackgroundColor = function () {
    var colorName = this.viewer.container.preferences.surfaceBackgroundColor;

    if (colorName === "Black") {
        this.backgroundColor = [0, 0, 0];
    } else if (colorName === "Dark Gray") {
        this.backgroundColor = [0.25, 0.25, 0.25];
    } else if (colorName === "Gray") {
        this.backgroundColor = [0.5, 0.5, 0.5];
    } else if (colorName === "Light Gray") {
        this.backgroundColor = [0.75, 0.75, 0.75];
    } else if (colorName === "White") {
        this.backgroundColor = [1, 1, 1];
    } else {
        this.backgroundColor = papaya.viewer.ScreenSurface.DEFAULT_BACKGROUND;
    }
};



papaya.viewer.ScreenSurface.prototype.isMainView = function () {
    return (this.viewer.mainImage === this.viewer.surfaceView);
};



papaya.viewer.ScreenSurface.prototype.processParams = function (params) {
    if (!this.viewer.container.isDesktopMode()) {
        if (params.surfaceBackground !== undefined) {
            this.viewer.container.preferences.surfaceBackgroundColor = params.surfaceBackground;
        }
    }
};



// adapted from: http://learningwebgl.com/blog/?p=1253
papaya.viewer.ScreenSurface.prototype.makeSphere = function (latitudeBands, longitudeBands, radius) {
    var latNumber, longNumber;
    var vertexPositionData = [];
    var normalData = [];

    for (latNumber = 0; latNumber <= latitudeBands; latNumber++) {
        var theta = latNumber * Math.PI / latitudeBands;
        var sinTheta = Math.sin(theta);
        var cosTheta = Math.cos(theta);

        for (longNumber = 0; longNumber <= longitudeBands; longNumber++) {
            var phi = longNumber * 2 * Math.PI / longitudeBands;
            var sinPhi = Math.sin(phi);
            var cosPhi = Math.cos(phi);

            var x = cosPhi * sinTheta;
            var y = cosTheta;
            var z = sinPhi * sinTheta;
            //var u = 1 - (longNumber / longitudeBands);
            //var v = 1 - (latNumber / latitudeBands);

            normalData.push(x);
            normalData.push(y);
            normalData.push(z);
            vertexPositionData.push(radius * x);
            vertexPositionData.push(radius * y);
            vertexPositionData.push(radius * z);
        }
    }

    var indexData = [];
    for (latNumber = 0; latNumber < latitudeBands; latNumber++) {
        for (longNumber = 0; longNumber < longitudeBands; longNumber++) {
            var first = (latNumber * (longitudeBands + 1)) + longNumber;
            var second = first + longitudeBands + 1;
            indexData.push(first);
            indexData.push(second);
            indexData.push(first + 1);

            indexData.push(second);
            indexData.push(second + 1);
            indexData.push(first + 1);
        }
    }

    return {vertices:vertexPositionData, normals:normalData, indices:indexData};
};



papaya.viewer.ScreenSurface.prototype.getRulerLength = function () {
    return papaya.utilities.MathUtils.lineDistance3d(this.rulerPoints[0], this.rulerPoints[1],
        this.rulerPoints[2], this.rulerPoints[3], this.rulerPoints[4], this.rulerPoints[5]);
};
