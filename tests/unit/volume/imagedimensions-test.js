/*jslint browser: true, node: true */

var classes = require('../../../src/js/volume/imagedimensions.js');

var assert = require("assert");

describe('papaya.volume.ImageDimensions', function () {
    describe('#isValid()', function () {
        it('should return return false with negative cols', function () {
            var id = new classes.ImageDimensions(-1, 10, 10, 10);
            assert.equal(false, id.isValid());
        });
    });
});
