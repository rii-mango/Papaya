
var papaya = papaya || {};
papaya.viewer = papaya.viewer || {};



papaya.viewer.Atlas = papaya.viewer.Atlas || function (atlasData, atlasLabels) {
    this.name = null;
    this.atlasData = atlasData;
    this.atlasLabels = atlasLabels;
    this.volume = new papaya.volume.Volume();
    this.volume.readEncodedData(this.atlasData, bind(this, this.readFinished));
    this.displayColumns = new Array(4);
    this.labels = new Array(4);
    this.numLabels = 0;
}



papaya.viewer.Atlas.prototype.getLabelAt = function (xLoc, yLoc, zLoc) {
    var labelString = this.atlasLabels.atlas.data.label[this.volume.getVoxelAtIndex(xLoc, yLoc, zLoc)];
    var labelsCurrent = labelString.split(":");

    for (var ctr = 0; ctr < this.numLabels; ctr++) {
        this.labels[ctr] = labelsCurrent[this.displayColumns[ctr]];
    }

    return this.labels;
}



papaya.viewer.Atlas.prototype.readFinished = function () {
    var index = 0;
    var columns = this.atlasLabels.atlas.header.display.split(".");
    for (var ctr = 0; ctr < columns.length; ctr++) {
        if (columns[ctr] == "*") {
            this.displayColumns[index++] = ctr;
        }
    }

    this.numLabels = index;

    this.name = this.atlasLabels.atlas.header.name;
}

papaya.viewer.Atlas.MAX_LABELS = 4;



/*
 // Example Java code to base64 encode atlas image file
 import java.io.File;
 import java.io.IOException;

 import sun.misc.BASE64Encoder;


 public class Test {

    public static void main(String[] args) throws IOException {
        File file = new File("/path/to/my/input/file.nii.gz");
        byte[] bytes = org.apache.commons.io.FileUtils.readFileToByteArray(file);

        BASE64Encoder encoder = new BASE64Encoder();
        String encoded = encoder.encode(bytes);
        encoded = encoded.replace("\n", "");
        org.apache.commons.io.FileUtils.writeStringToFile(new File("/path/to/my/output/file.txt"), encoded);
    }
 }
 */