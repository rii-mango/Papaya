
/*jslint browser: true, node: true */
/*global $, alert, PAPAYA_CONTAINER_ID, PAPAYA_VIEWER_ID, PAPAYA_TOOLBAR_ID, PAPAYA_DISPLAY_ID, PAPAYA_MINIMUM_SIZE,
PAPAYA_SECTION_HEIGHT, PAPAYA_SPACING, PAPAYA_CONTAINER_PADDING_TOP, checkForBrowserCompatibility, getQueryParams,
deref, resetComponents */

"use strict";

var papaya = papaya || {};
var papayaMain = null;
var papayaParams = papayaParams || {};

papaya.viewer = papaya.viewer || {};

var papayaLoadableImages = papayaLoadableImages || [];



papaya.Main = papaya.Main || function () {
    this.loadingImageIndex = 0;
    resetComponents();
};



function resetComponents() {
    var containerHtml = $("#" + PAPAYA_CONTAINER_ID);

    containerHtml.css({height: "auto"});
    containerHtml.css({width: "auto"});
    containerHtml.css({margin: "auto"});

    $("#" + PAPAYA_VIEWER_ID).removeClass("checkForJS");
    $('head').append("<style>div#papayaViewer:before{ content:'' }</style>");
}



function isShowingToolbar() {
    return $("#" + PAPAYA_TOOLBAR_ID).length;
}



function isShowingDisplay() {
    return $("#" + PAPAYA_DISPLAY_ID).length;
}



function isShowingViewer() {
    return $("#" + PAPAYA_VIEWER_ID).length;
}



function getViewerDimensions() {
    var numAdditionalSections = 1,
        parentHeight = PAPAYA_MINIMUM_SIZE,
        parentWidth = PAPAYA_MINIMUM_SIZE,
        containerHtml = $("#" + PAPAYA_CONTAINER_ID),
        height,
        width,
        widthPadding,
        dims;

    if (isShowingDisplay()) {
        numAdditionalSections += 1;
    }

    if (isShowingToolbar()) {
        numAdditionalSections += 1;
    }

    if (containerHtml.parent().get(0).tagName.toLowerCase() === "div") {
        parentHeight = containerHtml.parent().height();
        parentWidth = containerHtml.parent().width();
    } else if (containerHtml.parent().get(0).tagName.toLowerCase() === "body") {
        parentHeight = window.innerHeight;
        parentWidth = window.innerWidth;
    }

    if (parentHeight < PAPAYA_MINIMUM_SIZE) {
        parentHeight = PAPAYA_MINIMUM_SIZE;
        containerHtml.parent().height(PAPAYA_MINIMUM_SIZE);
    }

    if (parentWidth < PAPAYA_MINIMUM_SIZE) {
        parentWidth = PAPAYA_MINIMUM_SIZE;
        containerHtml.parent().width(PAPAYA_MINIMUM_SIZE);
    }

    height = parentHeight - PAPAYA_SECTION_HEIGHT * numAdditionalSections;
    width = height * 1.5;

    if (width > parentWidth) {
        width = parentWidth - PAPAYA_SPACING * 2;
        height = Math.ceil(width / 1.5);
    }

    widthPadding = (parentWidth - width) / 2;
    dims = new papaya.core.Dimensions(width, height);
    dims.widthPadding = widthPadding;
    dims.heightPadding = PAPAYA_CONTAINER_PADDING_TOP;

    return dims;
}



function resizeViewerComponents(resize) {
    papayaMain.papayaToolbar.closeAllMenus();

    var dims = getViewerDimensions(),
        toolbarHtml = $("#" + PAPAYA_TOOLBAR_ID),
        viewerHtml = $("#" + PAPAYA_VIEWER_ID),
        displayHtml = $("#" + PAPAYA_DISPLAY_ID);

    toolbarHtml.css({paddingLeft: dims.widthPadding + "px"});
    toolbarHtml.css({paddingBottom: PAPAYA_SPACING + "px"});
    toolbarHtml.css({width: dims.width + "px"});
    toolbarHtml.css({height: papaya.ui.Toolbar.SIZE + "px"});

    viewerHtml.css({height: "100%"});
    viewerHtml.css({width: dims.width + "px"});
    viewerHtml.css({paddingLeft: dims.widthPadding + "px"});

    if (resize) {
        papayaMain.papayaViewer.resizeViewer(dims);
    }

    if (papayaMain.papayaDisplay) {
        displayHtml.css({height: PAPAYA_SECTION_HEIGHT + "px"});
        displayHtml.css({paddingLeft: dims.widthPadding + "px"});
        papayaMain.papayaDisplay.canvas.width = dims.width;
    }

    $("#" + PAPAYA_CONTAINER_ID).css({paddingTop: dims.heightPadding + "px"});

    if (papayaMain.papayaViewer.initialized) {
        papayaMain.papayaViewer.drawViewer(true);
    } else {
        papayaMain.papayaViewer.drawEmptyViewer();

        if (papayaMain.papayaDisplay) {
            papayaMain.papayaDisplay.drawEmptyDisplay();
        }
    }
}



papaya.Main.prototype.buildViewer = function (params) {
    var viewerHtml,
        dims;

    if (isShowingViewer()) {
        viewerHtml = $("#" + PAPAYA_VIEWER_ID);
        viewerHtml.html("");  // remove noscript message
        dims = getViewerDimensions();
        this.papayaViewer = new papaya.viewer.Viewer(dims.width, dims.height, params);
        viewerHtml.append($(this.papayaViewer.canvas));
    } else {
        alert("You are missing a viewer div!");
    }
};



papaya.Main.prototype.buildDisplay = function () {
    if (isShowingDisplay()) {
        var dims = getViewerDimensions();
        this.papayaDisplay = new papaya.viewer.Display(dims.width, PAPAYA_SECTION_HEIGHT);
        $("#" + PAPAYA_DISPLAY_ID).append($(this.papayaDisplay.canvas));
    }
};



papaya.Main.prototype.buildToolbar = function () {
    this.papayaToolbar = new papaya.ui.Toolbar();
    this.papayaToolbar.buildToolbar();
};



papaya.Main.prototype.setUpDnD = function () {
    var containerHtml = $("#" + PAPAYA_CONTAINER_ID);

    containerHtml[0].ondragover = function () {
        papayaMain.papayaViewer.draggingOver = true;
        if (!papayaMain.papayaViewer.initialized) {
            papayaMain.papayaViewer.drawEmptyViewer();
        }

        return false;
    };

    containerHtml[0].ondragleave = function () {
        papayaMain.papayaViewer.draggingOver = false;
        if (!papayaMain.papayaViewer.initialized) {
            papayaMain.papayaViewer.drawEmptyViewer();
        }
        return false;
    };

    containerHtml[0].ondragend = function () {
        papayaMain.papayaViewer.draggingOver = false;
        if (!papayaMain.papayaViewer.initialized) {
            papayaMain.papayaViewer.drawEmptyViewer();
        }
        return false;
    };

    containerHtml[0].ondrop = function (e) {
        e.preventDefault();

        if (e.dataTransfer.files.length > 1) {
            papayaMain.papayaDisplay.drawError("Please drop one file at a time.");
        } else {
            papayaMain.papayaViewer.loadImage(e.dataTransfer.files[0]);
        }

        return false;
    };
};



papaya.Main.prototype.loadNext = function () {
    this.loadingImageIndex += 1;

    if (papayaParams.images) {
        if (this.loadingImageIndex < papayaParams.images.length) {
            papayaMain.papayaViewer.loadImage(papayaParams.images[this.loadingImageIndex], true, false);
        }
    } else if (papayaParams.encodedImages) {
        if (this.loadingImageIndex < papayaParams.encodedImages.length) {
            papayaMain.papayaViewer.loadImage(papayaParams.encodedImages[this.loadingImageIndex], false, true);
        }
    }
};



papaya.Main.prototype.findLoadableImage = function (name) {
    var ctr;

    for (ctr = 0; ctr < papayaLoadableImages.length; ctr += 1) {
        if (papayaLoadableImages[ctr].name === name) {
            return papayaLoadableImages[ctr];
        }
    }

    return null;
};



function main() {
    var message, viewerHtml, loadParams, loadUrl;

    message = checkForBrowserCompatibility();
    viewerHtml = $("#" + PAPAYA_VIEWER_ID);

    if (message !== null) {
        viewerHtml.removeClass("checkForJS");
        viewerHtml.addClass("checkBrowser");
        viewerHtml.html("<div class='checkBrowserMessage'>" + message + "</div>");
    } else {
        papayaMain = new papaya.Main();
        papayaMain.preferences = new papaya.viewer.Preferences();

        loadParams = viewerHtml.data("params");

        if (loadParams) {
            papayaParams = $.extend(papayaParams, window[loadParams]);
        }

        getQueryParams(papayaParams);

        papayaMain.buildViewer(papayaParams);
        papayaMain.buildDisplay();
        papayaMain.buildToolbar();
        papayaMain.setUpDnD();

        loadUrl = viewerHtml.data("load-url");

        if (loadUrl) {
            papayaMain.papayaViewer.loadImage(loadUrl, true, false);
        } else if (papayaParams.images) {
            papayaMain.papayaViewer.loadImage(papayaParams.images[0], true, false);
        } else if (papayaParams.encodedImages) {
            papayaMain.papayaViewer.loadImage(papayaParams.encodedImages[0], false, true);
        }

        resizeViewerComponents(false);
    }
}



window.onload = main;



window.onresize = function () {
    resizeViewerComponents(true);
};
