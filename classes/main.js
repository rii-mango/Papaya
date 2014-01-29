
/*jslint browser: true, node: true */
/*global $, alert, PAPAYA_CONTAINER_ID, PAPAYA_VIEWER_ID, PAPAYA_TOOLBAR_ID, PAPAYA_DISPLAY_ID, PAPAYA_MINIMUM_SIZE,
PAPAYA_SECTION_HEIGHT, PAPAYA_SPACING, PAPAYA_CONTAINER_PADDING_TOP, checkForBrowserCompatibility, getQueryParams,
deref, resetComponents, PAPAYA_TITLEBAR_ID */

"use strict";

var papaya = papaya || {};
var papayaContainer = null;
var papayaParams = papayaParams || {};

papaya.viewer = papaya.viewer || {};

var papayaLoadableImages = papayaLoadableImages || [];



papaya.Container = papaya.Container || function () {
    this.papayaViewer = null;
    this.papayaDisplay = null;
    this.papayaToolbar = null;
    this.preferences = null;
    this.loadingImageIndex = 0;
    this.nestedViewer = false;
    this.resetComponents();
};



papaya.Container.prototype.resetComponents = function() {
    var containerHtml = $("#" + PAPAYA_CONTAINER_ID);

    containerHtml.css({height: "auto"});
    containerHtml.css({width: "auto"});
    containerHtml.css({margin: "auto"});

    $("#" + PAPAYA_VIEWER_ID).removeClass("checkForJS");
    $('head').append("<style>div#papayaViewer:before{ content:'' }</style>");
};



papaya.Container.prototype.isKioskMode = function() {
    return $("#" + PAPAYA_TOOLBAR_ID).length === 0;
};



papaya.Container.prototype.getViewerDimensions = function() {
    var numAdditionalSections = 2,
        parentHeight = PAPAYA_MINIMUM_SIZE,
        parentWidth = PAPAYA_MINIMUM_SIZE,
        containerHtml = $("#" + PAPAYA_CONTAINER_ID),
        height,
        width,
        widthPadding,
        dims;

    if (!this.isKioskMode()) {
        numAdditionalSections += 1;
    }

    if (this.nestedViewer) {
        parentHeight = containerHtml.parent().height();
        parentWidth = containerHtml.parent().width();
    } else {
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
};



papaya.Container.prototype.resizeViewerComponents = function(resize) {
    this.papayaToolbar.closeAllMenus();

    var dims = this.getViewerDimensions(),
        toolbarHtml = $("#" + PAPAYA_TOOLBAR_ID),
        viewerHtml = $("#" + PAPAYA_VIEWER_ID),
        displayHtml = $("#" + PAPAYA_DISPLAY_ID),
        titlebarHtml = $("#" + PAPAYA_TITLEBAR_ID);

    toolbarHtml.css({paddingLeft: dims.widthPadding + "px"});
    toolbarHtml.css({paddingBottom: PAPAYA_SPACING + "px"});
    toolbarHtml.css({width: dims.width + "px"});
    toolbarHtml.css({height: papaya.ui.Toolbar.SIZE + "px"});
    titlebarHtml.css({width: dims.width + "px"});

    viewerHtml.css({height: "100%"});
    viewerHtml.css({width: dims.width + "px"});
    viewerHtml.css({paddingLeft: dims.widthPadding + "px"});

    if (resize) {
        this.papayaViewer.resizeViewer(dims);
    }

    if (this.papayaDisplay) {
        displayHtml.css({height: PAPAYA_SECTION_HEIGHT + "px"});
        displayHtml.css({paddingLeft: dims.widthPadding + "px"});
        this.papayaDisplay.canvas.width = dims.width;
    }

    $("#" + PAPAYA_CONTAINER_ID).css({paddingTop: dims.heightPadding + "px"});

    if (this.papayaViewer.initialized) {
        this.papayaViewer.drawViewer(true);
    } else {
        this.papayaViewer.drawEmptyViewer();

        if (this.papayaDisplay) {
            this.papayaDisplay.drawEmptyDisplay();
        }
    }
};



papaya.Container.prototype.buildViewer = function (params) {
    var viewerHtml, dims;

    viewerHtml = $("#" + PAPAYA_VIEWER_ID);
    viewerHtml.html("");  // remove noscript message
    dims = this.getViewerDimensions();
    this.papayaViewer = new papaya.viewer.Viewer(this, dims.width, dims.height, params);
    viewerHtml.append($(this.papayaViewer.canvas));
    this.preferences.viewer = this.papayaViewer;
};



papaya.Container.prototype.buildDisplay = function () {
    var dims = this.getViewerDimensions();
    this.papayaDisplay = new papaya.viewer.Display(this, dims.width);
    $("#" + PAPAYA_DISPLAY_ID).append($(this.papayaDisplay.canvas));
};



papaya.Container.prototype.buildToolbar = function () {
    this.papayaToolbar = new papaya.ui.Toolbar(this);
    this.papayaToolbar.buildToolbar();
};



papaya.Container.prototype.setUpDnD = function () {
    var container = this;
    var containerHtml = $("#" + PAPAYA_CONTAINER_ID);

    containerHtml[0].ondragover = function () {
        container.papayaViewer.draggingOver = true;
        if (!container.papayaViewer.initialized) {
            container.papayaViewer.drawEmptyViewer();
        }

        return false;
    };

    containerHtml[0].ondragleave = function () {
        container.papayaViewer.draggingOver = false;
        if (!container.papayaViewer.initialized) {
            container.papayaViewer.drawEmptyViewer();
        }
        return false;
    };

    containerHtml[0].ondragend = function () {
        container.papayaViewer.draggingOver = false;
        if (!container.papayaViewer.initialized) {
            container.papayaViewer.drawEmptyViewer();
        }
        return false;
    };

    containerHtml[0].ondrop = function (e) {
        e.preventDefault();

        if (e.dataTransfer.files.length > 1) {
            container.papayaDisplay.drawError("Please drop one file at a time.");
        } else {
            container.papayaViewer.loadImage(e.dataTransfer.files[0]);
        }

        return false;
    };
};



papaya.Container.prototype.loadNext = function () {
    this.loadingImageIndex += 1;

    if (papayaParams.images) {
        if (this.loadingImageIndex < papayaParams.images.length) {
            this.papayaViewer.loadImage(papayaParams.images[this.loadingImageIndex], true, false);
        }
    } else if (papayaParams.encodedImages) {
        if (this.loadingImageIndex < papayaParams.encodedImages.length) {
            this.papayaViewer.loadImage(papayaParams.encodedImages[this.loadingImageIndex], false, true);
        }
    }
};



papaya.Container.prototype.findLoadableImage = function (name) {
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
        papayaContainer = new papaya.Container();
        papayaContainer.preferences = new papaya.viewer.Preferences();

        loadParams = viewerHtml.data("params");

        if (loadParams) {
            papayaParams = $.extend(papayaParams, window[loadParams]);
        }

        getQueryParams(papayaParams);

        papayaContainer.nestedViewer = ($("#" + PAPAYA_CONTAINER_ID).parent()[0].tagName.toUpperCase() !== 'BODY');

        papayaContainer.buildViewer(papayaParams);
        papayaContainer.buildDisplay();
        papayaContainer.buildToolbar();
        papayaContainer.setUpDnD();

        loadUrl = viewerHtml.data("load-url");

        if (loadUrl) {
            papayaContainer.papayaViewer.loadImage(loadUrl, true, false);
        } else if (papayaParams.images) {
            papayaContainer.papayaViewer.loadImage(papayaParams.images[0], true, false);
        } else if (papayaParams.encodedImages) {
            papayaContainer.papayaViewer.loadImage(papayaParams.encodedImages[0], false, true);
        }

        papayaContainer.resizeViewerComponents(false);
    }
}



window.onload = main;



window.onresize = function () {
    papayaContainer.resizeViewerComponents(true);
};
