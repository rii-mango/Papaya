
/*jslint browser: true, node: true */
/*global $, alert, PAPAYA_DEFAULT_CONTAINER_ID, PAPAYA_DEFAULT_VIEWER_ID, PAPAYA_DEFAULT_TOOLBAR_ID, PAPAYA_DEFAULT_DISPLAY_ID, PAPAYA_MINIMUM_SIZE,
PAPAYA_SECTION_HEIGHT, PAPAYA_SPACING, PAPAYA_CONTAINER_PADDING_TOP, checkForBrowserCompatibility, getQueryParams,
deref, resetComponents, PAPAYA_DEFAULT_TITLEBAR_ID */

"use strict";

var papaya = papaya || {};
var papayaContainers = [];
var papayaLoadableImages = papayaLoadableImages || [];



papaya.Container = papaya.Container || function () {
    this.viewer = null;
    this.display = null;
    this.toolbar = null;
    this.preferences = null;
    this.params = [];
    this.loadingImageIndex = 0;
    this.nestedViewer = false;
    this.resetComponents();
};



papaya.Container.prototype.resetComponents = function() {
    var containerHtml = $("#" + PAPAYA_DEFAULT_CONTAINER_ID);

    containerHtml.css({height: "auto"});
    containerHtml.css({width: "auto"});
    containerHtml.css({margin: "auto"});

    $("#" + PAPAYA_DEFAULT_VIEWER_ID).removeClass("checkForJS");
    $('head').append("<style>div#papayaViewer:before{ content:'' }</style>");
};



papaya.Container.prototype.isKioskMode = function() {
    return $("#" + PAPAYA_DEFAULT_TOOLBAR_ID).length === 0;
};



papaya.Container.prototype.getViewerDimensions = function() {
    var numAdditionalSections = 2,
        parentHeight = PAPAYA_MINIMUM_SIZE,
        parentWidth = PAPAYA_MINIMUM_SIZE,
        containerHtml = $("#" + PAPAYA_DEFAULT_CONTAINER_ID),
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
    this.toolbar.closeAllMenus();

    var dims = this.getViewerDimensions(),
        toolbarHtml = $("#" + PAPAYA_DEFAULT_TOOLBAR_ID),
        viewerHtml = $("#" + PAPAYA_DEFAULT_VIEWER_ID),
        displayHtml = $("#" + PAPAYA_DEFAULT_DISPLAY_ID),
        titlebarHtml = $("#" + PAPAYA_DEFAULT_TITLEBAR_ID);

    toolbarHtml.css({paddingLeft: dims.widthPadding + "px"});
    toolbarHtml.css({paddingBottom: PAPAYA_SPACING + "px"});
    toolbarHtml.css({width: dims.width + "px"});
    toolbarHtml.css({height: papaya.ui.Toolbar.SIZE + "px"});
    titlebarHtml.css({width: dims.width + "px"});

    viewerHtml.css({height: "100%"});
    viewerHtml.css({width: dims.width + "px"});
    viewerHtml.css({paddingLeft: dims.widthPadding + "px"});

    if (resize) {
        this.viewer.resizeViewer(dims);
    }

    if (this.display) {
        displayHtml.css({height: PAPAYA_SECTION_HEIGHT + "px"});
        displayHtml.css({paddingLeft: dims.widthPadding + "px"});
        this.display.canvas.width = dims.width;
    }

    $("#" + PAPAYA_DEFAULT_CONTAINER_ID).css({paddingTop: dims.heightPadding + "px"});

    if (this.viewer.initialized) {
        this.viewer.drawViewer(true);
    } else {
        this.viewer.drawEmptyViewer();

        if (this.display) {
            this.display.drawEmptyDisplay();
        }
    }
};



papaya.Container.prototype.buildViewer = function (params) {
    var viewerHtml, dims;

    viewerHtml = $("#" + PAPAYA_DEFAULT_VIEWER_ID);
    viewerHtml.html("");  // remove noscript message
    dims = this.getViewerDimensions();
    this.viewer= new papaya.viewer.Viewer(this, dims.width, dims.height, params);
    viewerHtml.append($(this.viewer.canvas));
    this.preferences.viewer = this.viewer;
};



papaya.Container.prototype.buildDisplay = function () {
    var dims = this.getViewerDimensions();
    this.display = new papaya.viewer.Display(this, dims.width);
    $("#" + PAPAYA_DEFAULT_DISPLAY_ID).append($(this.display.canvas));
};



papaya.Container.prototype.buildToolbar = function () {
    this.toolbar = new papaya.ui.Toolbar(this);
    this.toolbar.buildToolbar();
};



papaya.Container.prototype.setUpDnD = function () {
    var container = this;
    var containerHtml = $("#" + PAPAYA_DEFAULT_CONTAINER_ID);

    containerHtml[0].ondragover = function () {
        container.viewer.draggingOver = true;
        if (!container.viewer.initialized) {
            container.viewer.drawEmptyViewer();
        }

        return false;
    };

    containerHtml[0].ondragleave = function () {
        container.viewer.draggingOver = false;
        if (!container.viewer.initialized) {
            container.viewer.drawEmptyViewer();
        }
        return false;
    };

    containerHtml[0].ondragend = function () {
        container.viewer.draggingOver = false;
        if (!container.viewer.initialized) {
            container.viewer.drawEmptyViewer();
        }
        return false;
    };

    containerHtml[0].ondrop = function (e) {
        e.preventDefault();

        if (e.dataTransfer.files.length > 1) {
            container.display.drawError("Please drop one file at a time.");
        } else {
            container.viewer.loadImage(e.dataTransfer.files[0]);
        }

        return false;
    };
};



papaya.Container.prototype.loadNext = function () {
    this.loadingImageIndex += 1;

    if (this.params.images) {
        if (this.loadingImageIndex < this.params.images.length) {
            this.viewer.loadImage(this.params.images[this.loadingImageIndex], true, false);
        }
    } else if (this.params.encodedImages) {
        if (this.loadingImageIndex < this.params.encodedImages.length) {
            this.viewer.loadImage(this.params.encodedImages[this.loadingImageIndex], false, true);
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



function buildContainerHTML(containerHTML) {
    var viewerHTML = containerHTML.find("#" + PAPAYA_DEFAULT_VIEWER_ID);

}



function findPapayaContainersHTML() {
    var defaultContainer, containers;

    defaultContainer = $("#" + PAPAYA_DEFAULT_CONTAINER_ID);
    containers = $("." + PAPAYA_CLASS_NAME);

    if (defaultContainer) {
    } else if (containers && (containers.length > 0)) {

    }
}



function main() {
    var container, message, viewerHtml, loadParams, loadUrl;

    //findPapayaContainers();

    message = checkForBrowserCompatibility();
    viewerHtml = $("#" + PAPAYA_DEFAULT_VIEWER_ID);

    if (message !== null) {
        viewerHtml.removeClass("checkForJS");
        viewerHtml.addClass("checkBrowser");
        viewerHtml.html("<div class='checkBrowserMessage'>" + message + "</div>");
    } else {
        container = new papaya.Container();
        papayaContainers.push(container);
        container.preferences = new papaya.viewer.Preferences();

        loadParams = viewerHtml.data("params");

        if (loadParams) {
            container.params = $.extend(container.params, window[loadParams]);
        }

        getQueryParams(container.params);

        container.nestedViewer = ($("#" + PAPAYA_DEFAULT_CONTAINER_ID).parent()[0].tagName.toUpperCase() !== 'BODY');

        container.buildViewer(container.params);
        container.buildDisplay();
        container.buildToolbar();
        container.setUpDnD();

        loadUrl = viewerHtml.data("load-url");

        if (loadUrl) {
            container.viewer.loadImage(loadUrl, true, false);
        } else if (container.params.images) {
            container.viewer.loadImage(container.params.images[0], true, false);
        } else if (container.params.encodedImages) {
            container.viewer.loadImage(container.params.encodedImages[0], false, true);
        }

        container.resizeViewerComponents(false);
    }
}



window.onload = main;



window.onresize = function () {
    papayaContainers[0].resizeViewerComponents(true);  // TODO
};
