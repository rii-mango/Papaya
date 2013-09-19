
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
    this.tempCoord = new papaya.core.Coordinate(0, 0, 0);
    this.drawingError = false;
    this.progress = 0;
    this.progressTimeout = null;
    this.drawingProgress = false;

    this.drawUninitializedDisplay();
}


papaya.viewer.Display.PROTOTYPE_TEXT = "000.00";
papaya.viewer.Display.MINI_LABELS_THRESH = 500;
papaya.viewer.Display.TEXT_SPACING = 8;
papaya.viewer.Display.TEXT_LABEL_SIZE = 12;
papaya.viewer.Display.TEXT_CORRD_VALUE_SIZE = 16;
papaya.viewer.Display.TEXT_VALUE_SIZE = 18;
papaya.viewer.Display.TEXT_MINI_VALUE_SIZE = 13;


papaya.viewer.Display.prototype.drawUninitializedDisplay = function() {
    this.context.fillStyle = "#000000";
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
}


papaya.viewer.Display.prototype.drawEmptyDisplay = function() {
    if (this.drawingError || this.drawingProgress) {
        return;
    }

    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.fillStyle = "#000000";
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
}


papaya.viewer.Display.prototype.drawDisplay = function(xLoc, yLoc, zLoc, val) {
    if (this.drawingError || this.drawingProgress) {
        return;
    }

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

    var valLabel = parseFloat(val.toPrecision(7));

    this.context.fillText(valLabel, 5*sizeRatio*papaya.viewer.Display.TEXT_SPACING + 3*textWidth, valueLoc);


    // atlas labels
    var atlasLabelsStartPos = 7*sizeRatio*papaya.viewer.Display.TEXT_SPACING + 5*textWidth;
    var atlasLabelsTotalWidth = this.canvas.width - atlasLabelsStartPos;

    if (atlasLabelsTotalWidth < papaya.viewer.Display.MINI_LABELS_THRESH) {
        var atlasNumLabels = papayaMain.papayaViewer.atlas.numLabels;
        var atlasLabelWidth = atlasLabelsTotalWidth / 2;

        papayaMain.papayaViewer.getWorldCoordinateAtIndex(xLoc, yLoc, zLoc, this.tempCoord);
        var atlasLabel = papayaMain.papayaViewer.atlas.getLabelAtCoordinate(this.tempCoord.x, this.tempCoord.y, this.tempCoord.z);

        for (var ctr = 0; ctr < atlasNumLabels; ctr++) {
            if (ctr < 2) {
                this.context.fillStyle = "rgb(182, 59, 0)";
                this.context.font = papaya.viewer.Display.TEXT_MINI_VALUE_SIZE+"px Arial";
            } else {
                this.context.fillStyle = "white";
                this.context.font = papaya.viewer.Display.TEXT_MINI_VALUE_SIZE+"px Arial";
            }

            var metricsAtlas = this.context.measureText(atlasLabel[ctr]);
            if (metricsAtlas.width > atlasLabelWidth) {
                atlasLabel[ctr] = (atlasLabel[ctr].substr(0, Math.round(atlasLabel[ctr].length / 3)) + " ... " + atlasLabel[ctr].substr(atlasLabel[ctr].length - 3, 3));
            }

            if (ctr == 0) {
                this.context.fillText(atlasLabel[ctr], atlasLabelsStartPos, labelLoc);
            } else if (ctr == 1) {
                this.context.fillText(atlasLabel[ctr], atlasLabelsStartPos, coordValueLoc);
            } else if (ctr == 2) {
                this.context.fillText(atlasLabel[ctr], atlasLabelsStartPos + atlasLabelWidth, labelLoc);
            } else if (ctr == 3) {
                this.context.fillText(atlasLabel[ctr], atlasLabelsStartPos + atlasLabelWidth, coordValueLoc);
            }
        }
    } else {
        var atlasNumLabels = papayaMain.papayaViewer.atlas.numLabels;
        var atlasLabelWidth = atlasLabelsTotalWidth / atlasNumLabels - papaya.viewer.Display.TEXT_SPACING;

        papayaMain.papayaViewer.getWorldCoordinateAtIndex(xLoc, yLoc, zLoc, this.tempCoord);
        var atlasLabel = papayaMain.papayaViewer.atlas.getLabelAtCoordinate(this.tempCoord.x, this.tempCoord.y, this.tempCoord.z);

        for (var ctr = 0; ctr < atlasNumLabels; ctr++) {
            if (ctr < 2) {
                this.context.fillStyle = "rgb(182, 59, 0)";
                this.context.font = "bold " + papaya.viewer.Display.TEXT_VALUE_SIZE+"px Arial";
            } else {
                this.context.fillStyle = "white";
                this.context.font = "bold " + papaya.viewer.Display.TEXT_VALUE_SIZE+"px Arial";
            }

            var metricsAtlas = this.context.measureText(atlasLabel[ctr]);
            if (metricsAtlas.width > atlasLabelWidth) {
                atlasLabel[ctr] = (atlasLabel[ctr].substr(0, Math.round(atlasLabel[ctr].length / 3)) + " ... " + atlasLabel[ctr].substr(atlasLabel[ctr].length - 3, 3));
            }

            this.context.fillText(atlasLabel[ctr], atlasLabelsStartPos + (ctr * atlasLabelWidth), valueLoc);
        }
    }
}



papaya.viewer.Display.prototype.drawError = function(message) {
    this.drawingError = true;
    window.setTimeout(bind(this, function() {this.drawingError = false;}), 3000);

    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.fillStyle = "#000000";
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.fillStyle = "red";
    this.context.font = papaya.viewer.Display.TEXT_CORRD_VALUE_SIZE+"px Arial";

    var valueLoc = papaya.viewer.Display.TEXT_LABEL_SIZE + papaya.viewer.Display.TEXT_SPACING + 1.5*papaya.viewer.Display.TEXT_SPACING;
    var metrics = this.context.measureText(message);
    var textWidth = metrics.width;

    this.context.fillText(message, papaya.viewer.Display.TEXT_SPACING, valueLoc);
}




papaya.viewer.Display.prototype.drawProgress = function(progress) {
    var prog = Math.round(progress * 100);
    if (prog > this.progress) {
        this.progress = prog;

        if (this.progress >= 99) {
            this.drawingProgress = false;
            this.progress = 0;
            this.drawEmptyDisplay();
        } else {
            if (this.progressTimeout) {
                window.clearTimeout(this.progressTimeout);
            }
            this.progressTimeout = window.setTimeout(bind(this, function() {this.drawingProgress = false;}), 3000);

            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.context.fillStyle = "#000000";
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

            var rgbVal = Math.round(255 * progress);
            this.context.fillStyle = "rgb("+rgbVal+", "+rgbVal+", "+rgbVal+")";
            this.context.fillRect(0, 0, this.canvas.width * progress, this.canvas.height);
        }
    }
}