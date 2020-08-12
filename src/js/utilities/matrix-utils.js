/*jslint browser: true, node: true */
/*global */

"use strict";

/*** Imports ***/
var papaya = papaya || {};
papaya.utilities = papaya.utilities || {};
papaya.utilities.MatrixUtils = papaya.utilities.MatrixUtils || {};

/*** Static Methods ***/
papaya.utilities.MatrixUtils.multiplyMatrices = function (m1, m2) {
    var result = [];
    for (var i = 0; i < m1.length; i++) {
        result[i] = [];
        for (var j = 0; j < m2[0].length; j++) {
            var sum = 0;
            for (var k = 0; k < m1[0].length; k++) {
                sum += m1[i][k] * m2[k][j];
            }
            result[i][j] = sum;
        }
    }
    return result;
};

// Modified 13/01/2020: add functions to support localizer rotation
papaya.utilities.MatrixUtils.rotateOnAxis = function (axis, angle) {
    var rotationMatrix = papaya.volume.Transform.IDENTITY;
    var theta = (angle * Math.PI) / 180;
    var cosTheta = Math.cos(theta);
    var sinTheta = Math.sin(theta);
//  https://en.wikipedia.org/wiki/Rotation_matrix#Rotation_matrix_from_axis_and_angle
    rotationMatrix[0][0] = cosTheta + axis[0]*axis[0]*(1 - cosTheta);
    rotationMatrix[1][0] = axis[1] * axis[0] * (1 - cosTheta) + axis[2] * sinTheta;
    rotationMatrix[2][0] = axis[2] * axis[0] * (1 - cosTheta) - axis[1] * sinTheta;

    rotationMatrix[0][1] = axis[0] * axis[1] * (1 - cosTheta) - axis[2] * sinTheta;
    rotationMatrix[1][1] = cosTheta + axis[1] * axis[1] * (1 - cosTheta);
    rotationMatrix[2][1] = axis[2] * axis[1] * (1 - cosTheta) + axis[0] * sinTheta;

    rotationMatrix[0][2] = axis[0] * axis[2] * (1 - cosTheta) + axis[1] * sinTheta;
    rotationMatrix[1][2] = axis[1] * axis[2] * (1 - cosTheta) - axis[0] * sinTheta;
    rotationMatrix[2][2] = cosTheta + axis[2] * axis[2] * (1 - cosTheta);

    return rotationMatrix;
}