
var papaya = papaya || {};
papaya.volume = papaya.volume || {};


/**
 * Constructor.
 */
papaya.volume.VoxelValue = papaya.volume.VoxelValue || function (imageData, imageType, orientation) {
    this.imageData = imageData;
    this.imageType = imageType;
    this.orientation = orientation;
    this.swap16 = ((this.imageType.numBytes == 2) && this.imageType.swapped);
    this.swap32 = ((this.imageType.numBytes == 4) && this.imageType.swapped);
}



papaya.volume.VoxelValue.prototype.getVoxelAtIndex = function(ctrX, ctrY, ctrZ) {
    return this.getVoxelAtOffset(this.orientation.convertIndexToOffset(ctrX, ctrY, ctrZ));
}



papaya.volume.VoxelValue.prototype.getVoxelAtOffset = function(offset) {
    var val = this.imageData.data[offset];

    if (this.swap16) {
        return ((val & 0xFF) << 8) | ((val >> 8) & 0xFF);
    } else if (this.swap32) {
        return ((val & 0xFF) << 24) | ((val & 0xFF00) << 8) | ((val >> 8) & 0xFF00) | ((val >> 24) & 0xFF);
    } else {
        return val;
    }
}
