
var papaya = papaya || {};
papaya.viewer = papaya.viewer || {};

var papayaMain = null;


papaya.Main = papaya.Main || function() {
    resetComponents();
    this.buildViewer();
    this.buildDisplay();
    this.buildToolbar();
}


function isShowingToolbar() {
    return $("#"+PAPAYA_TOOLBAR_ID).length;
}



function isShowingDisplay() {
    return $("#"+PAPAYA_DISPLAY_ID).length;
}


function isShowingViewer() {
    return $("#"+PAPAYA_VIEWER_ID).length;
}



function getViewerDimensions() {
    var numAdditionalSections = 1;
    if (isShowingDisplay()) {
        numAdditionalSections++;
    }

    if (isShowingToolbar()) {
        numAdditionalSections++;
    }

    var parentHeight = PAPAYA_MINIMUM_SIZE;
    var parentWidth = PAPAYA_MINIMUM_SIZE;

    if ($("#"+PAPAYA_CONTAINER_ID).parent().get(0).tagName.toLowerCase() == "div") {
        parentHeight = $("#"+PAPAYA_CONTAINER_ID).parent().height();
        parentWidth = $("#"+PAPAYA_CONTAINER_ID).parent().width();
    } else if ($("#"+PAPAYA_CONTAINER_ID).parent().get(0).tagName.toLowerCase() == "body") {
        parentHeight = window.innerHeight;
        parentWidth = window.innerWidth;
    }

    if (parentHeight < PAPAYA_MINIMUM_SIZE) {
        parentHeight = PAPAYA_MINIMUM_SIZE;
        $("#"+PAPAYA_CONTAINER_ID).parent().height(PAPAYA_MINIMUM_SIZE);
    }

    if (parentWidth < PAPAYA_MINIMUM_SIZE) {
        parentWidth = PAPAYA_MINIMUM_SIZE;
        $("#"+PAPAYA_CONTAINER_ID).parent().width(PAPAYA_MINIMUM_SIZE);
    }

    var height = parentHeight - PAPAYA_SECTION_HEIGHT*numAdditionalSections;
    var width = height * 1.5;

    if (width > parentWidth) {
        width = parentWidth - PAPAYA_SPACING*2;
        height = Math.ceil(width / 1.5);
    }

    var widthPadding = (parentWidth - width) / 2;
    var dims = new papaya.core.Dimensions(width, height);
    dims.widthPadding = widthPadding;
    dims.heightPadding = PAPAYA_CONTAINER_PADDING_TOP;

    return dims;
}


function resetComponents() {
    $("#"+PAPAYA_CONTAINER_ID).css({height: "auto"});
    $("#"+PAPAYA_CONTAINER_ID).css({width: "auto"});
    $("#"+PAPAYA_CONTAINER_ID).css({margin: "auto"});

    $("#"+PAPAYA_VIEWER_ID).removeClass("checkForJS");
    $('head').append("<style>div#papayaViewer:before{ content:'' }</style>");
}



function resizeViewerComponents(resize) {
    papayaMain.papayaToolbar.closeAllMenus();

    var dims = getViewerDimensions();

    $("#"+PAPAYA_TOOLBAR_ID).css({paddingLeft: dims.widthPadding + "px"});
    $("#"+PAPAYA_TOOLBAR_ID).css({paddingBottom: PAPAYA_SPACING + "px"});
    $("#"+PAPAYA_TOOLBAR_ID).css({width: dims.width + "px"});
    $("#"+PAPAYA_TOOLBAR_ID).css({height: papaya.ui.Toolbar.SIZE+"px"});

    $("#"+PAPAYA_VIEWER_ID).css({height: "100%"});
    $("#"+PAPAYA_VIEWER_ID).css({width: dims.width + "px"});
    $("#"+PAPAYA_VIEWER_ID).css({paddingLeft: dims.widthPadding + "px"});

    if (resize) {
        papayaMain.papayaViewer.resizeViewer(dims);
    }

    $("#"+PAPAYA_DISPLAY_ID).css({height: PAPAYA_SECTION_HEIGHT+"px"});
    $("#"+PAPAYA_DISPLAY_ID).css({paddingLeft: dims.widthPadding + "px"});
    papayaMain.papayaDisplay.canvas.width = dims.width;

    $("#"+PAPAYA_CONTAINER_ID).css({paddingTop: dims.heightPadding+"px"});

    if (papayaMain.papayaViewer.initialized) {
        papayaMain.papayaViewer.drawViewer(true);
    } else {
        papayaMain.papayaViewer.drawEmptyViewer();
        papayaMain.papayaDisplay.drawEmptyDisplay();
    }
}



papaya.Main.prototype.buildViewer = function() {
    if (isShowingViewer()) {
        $("#"+PAPAYA_VIEWER_ID).html("");  // remove noscript message
        var dims = getViewerDimensions();
        this.papayaViewer = new papaya.viewer.Viewer(dims.width, dims.height);
        $("#"+PAPAYA_VIEWER_ID).append($(this.papayaViewer.canvas));
    } else {
        alert("You are missing a viewer div!")
    }
}



papaya.Main.prototype.buildDisplay = function() {
    if (isShowingDisplay()) {
        var dims = getViewerDimensions();
        this.papayaDisplay = new papaya.viewer.Display(dims.width, PAPAYA_SECTION_HEIGHT);
        $("#"+PAPAYA_DISPLAY_ID).append($(this.papayaDisplay.canvas));
    }
}



papaya.Main.prototype.buildToolbar = function() {
    this.papayaToolbar = new papaya.ui.Toolbar();
    this.papayaToolbar.buildToolbar();
}



function main() {
    papayaMain = new papaya.Main();

    var message = checkForBrowserCompatibility();
    if (message != null) {
        resizeViewerComponents(false);
        papayaMain.papayaDisplay.drawError(message);
    } else {
        var loadUrl = $("#"+PAPAYA_VIEWER_ID).data("load-url");
        var loadEncoded = $("#"+PAPAYA_VIEWER_ID).data("load-encoded");

        if (loadUrl) {
            papayaMain.papayaViewer.loadImage(loadUrl, true, false);
        } else if (loadEncoded) {
            papayaMain.papayaViewer.loadImage(window[loadEncoded], false, true);
        }

        resizeViewerComponents(false);
    }
}

window.onload = main;
window.onresize = function() { resizeViewerComponents(true) };
