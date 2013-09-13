
var papaya = papaya || {};
papaya.viewer = papaya.viewer || {};


papaya.viewer.Display = papaya.viewer.Display || function(width, height) {
    // Public properties
    this.canvas = document.createElement("canvas");
    this.canvas.width = width;
    this.canvas.height = PAPAYA_SECTION_HEIGHT;
    this.context = this.canvas.getContext("2d");

    this.canvas.style.padding = 0;
    this.canvas.style.margin = 0;
    this.canvas.style.border = "none";
    this.canvas.style.cursor = "default";

    this.drawUninitializedDisplay();
}


papaya.viewer.Display.PROTOTYPE_TEXT = "000.00";
papaya.viewer.Display.PROTOTYPE_ATLAS_TEXT = "XXXXXXXXXXXX";
papaya.viewer.Display.TEXT_SPACING = 8;
papaya.viewer.Display.TEXT_LABEL_SIZE = 12;
papaya.viewer.Display.TEXT_CORRD_VALUE_SIZE = 16;
papaya.viewer.Display.TEXT_VALUE_SIZE = 18;


papaya.viewer.Display.prototype.drawUninitializedDisplay = function() {
    this.context.fillStyle = "#000000";
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
}


papaya.viewer.Display.prototype.drawEmptyDisplay = function() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.fillStyle = "#000000";
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
}


papaya.viewer.Display.prototype.drawDisplay = function(xLoc, yLoc, zLoc, val) {
    // initialize
    var sizeRatio = papayaMain.papayaViewer.canvas.width / 400.0;
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.fillStyle = "#000000";
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);


    // coordinate labels
    this.context.fillStyle = "white";
    this.context.font = papaya.viewer.Display.TEXT_CORRD_VALUE_SIZE+"px Arial";

    var metrics = this.context.measureText(papaya.viewer.Display.PROTOTYPE_TEXT);
    var textWidth = metrics.width;
    var labelLoc = papaya.viewer.Display.TEXT_LABEL_SIZE + papaya.viewer.Display.TEXT_SPACING;

    this.context.font = papaya.viewer.Display.TEXT_LABEL_SIZE+"px Arial";

    this.context.fillText("x", 2*sizeRatio*papaya.viewer.Display.TEXT_SPACING, labelLoc);
    this.context.fillText("y", 3*sizeRatio*papaya.viewer.Display.TEXT_SPACING + textWidth, labelLoc);
    this.context.fillText("z", 4*sizeRatio*papaya.viewer.Display.TEXT_SPACING + 2*textWidth, labelLoc);


    // coordinate values
    var coordValueLoc = labelLoc + papaya.viewer.Display.TEXT_CORRD_VALUE_SIZE + papaya.viewer.Display.TEXT_SPACING/2;

    this.context.fillStyle = "rgb(182, 59, 0)";
    this.context.font = "bold " + papaya.viewer.Display.TEXT_CORRD_VALUE_SIZE+"px Arial";

    this.context.fillText(Math.round(xLoc), 2*sizeRatio*papaya.viewer.Display.TEXT_SPACING, coordValueLoc);
    this.context.fillText(Math.round(yLoc), 3*sizeRatio*papaya.viewer.Display.TEXT_SPACING + textWidth, coordValueLoc);
    this.context.fillText(Math.round(zLoc), 4*sizeRatio*papaya.viewer.Display.TEXT_SPACING + 2*textWidth, coordValueLoc);


    // image value
    var valueLoc = labelLoc + 1.5*papaya.viewer.Display.TEXT_SPACING;
    this.context.fillStyle = "white";
    this.context.font = papaya.viewer.Display.TEXT_VALUE_SIZE+"px Arial";

    this.context.fillText(val, 5*sizeRatio*papaya.viewer.Display.TEXT_SPACING + 3*textWidth, valueLoc);


    // atlas labels
    var metricsAtlas = this.context.measureText(papaya.viewer.Display.PROTOTYPE_ATLAS_TEXT);
    var textWidthAtlas = metricsAtlas.width;
    var atlasStartX = this.canvas.width / 2;
    var atlasLabel = papayaMain.papayaViewer.atlas.getLabelAt(xLoc, yLoc, zLoc);

    this.context.fillStyle = "rgb(182, 59, 0)";
    this.context.font = "bold " + papaya.viewer.Display.TEXT_VALUE_SIZE+"px Arial";
    this.context.fillText(atlasLabel[0], atlasStartX+1*sizeRatio*papaya.viewer.Display.TEXT_SPACING, valueLoc);
    this.context.fillText(atlasLabel[1], atlasStartX+2*sizeRatio*papaya.viewer.Display.TEXT_SPACING + textWidthAtlas, valueLoc);

    this.context.fillStyle = "white";
    this.context.font = "bold " + papaya.viewer.Display.TEXT_VALUE_SIZE+"px Arial";
    this.context.fillText(atlasLabel[2], atlasStartX+3*sizeRatio*papaya.viewer.Display.TEXT_SPACING + 2*textWidthAtlas, valueLoc);
    this.context.fillText(atlasLabel[3], atlasStartX+4*sizeRatio*papaya.viewer.Display.TEXT_SPACING + 3*textWidthAtlas, valueLoc);
}
