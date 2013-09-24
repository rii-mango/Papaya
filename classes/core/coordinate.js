/**
 * @classDescription    A 3-D coordinate.
 */
var papaya = papaya || {};
papaya.core = papaya.core || {};


/**
 * Constructor.
 */
papaya.core.Coordinate = papaya.core.Coordinate || function (xLoc, yLoc, zLoc) {
    // Public properties
    this.x = xLoc;
    this.y = yLoc;
    this.z = zLoc;
}


/**
 *
 * @param xLoc
 * @param yLoc
 * @param zLoc
 */
papaya.core.Coordinate.prototype.setCoordinate = function (xLoc, yLoc, zLoc, round) {
    if (round) {
        this.x = Math.round(xLoc);
        this.y = Math.round(yLoc);
        this.z = Math.round(zLoc);
    } else {
        this.x = xLoc;
        this.y = yLoc;
        this.z = zLoc;
    }
}



papaya.core.Coordinate.prototype.isAllZeros = function () {
    return ((this.x == 0) && (this.y == 0) && (this.z == 0));
}