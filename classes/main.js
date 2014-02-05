
/*jslint browser: true, node: true */
/*global $, PAPAYA_MINIMUM_SIZE, PAPAYA_SECTION_HEIGHT, PAPAYA_SPACING, PAPAYA_CONTAINER_PADDING_TOP,
PAPAYA_CONTAINER_CLASS_NAME, PAPAYA_CHECK_FOR_JS_CLASS_NAME, PAPAYA_VIEWER_CLASS_NAME, PAPAYA_DISPLAY_CLASS_NAME,
PAPAYA_TOOLBAR_CLASS_NAME, PAPAYA_DEFAULT_TOOLBAR_ID, PAPAYA_DEFAULT_VIEWER_ID, PAPAYA_DEFAULT_DISPLAY_ID,
PAPAYA_DEFAULT_CONTAINER_ID, checkForBrowserCompatibility, getQueryParams */

"use strict";

var papaya = papaya || {};
var papayaContainers = [];
var papayaLoadableImages = papayaLoadableImages || [];
var papayaLastHoveredViewer = null;


papaya.Container = papaya.Container || function (containerHtml) {
    this.containerHtml = containerHtml;
    this.containerIndex = null;
    this.toolbarHtml = null;
    this.viewerHtml = null;
    this.displayHtml = null;
    this.titlebarHtml = null;
    this.viewer = null;
    this.display = null;
    this.toolbar = null;
    this.preferences = null;
    this.params = [];
    this.loadingImageIndex = 0;
    this.nestedViewer = false;
    this.resetComponents();
};



papaya.Container.prototype.resetComponents = function () {
    this.containerHtml.css({height: "auto"});
    this.containerHtml.css({width: "auto"});
    this.containerHtml.css({margin: "auto"});
    $('head').append("<style>div#papayaViewer:before{ content:'' }</style>");
};



papaya.Container.prototype.isKioskMode = function () {
    return false;
};



papaya.Container.prototype.getViewerDimensions = function () {
    var numAdditionalSections = 2,
        parentHeight = PAPAYA_MINIMUM_SIZE,
        parentWidth = PAPAYA_MINIMUM_SIZE,
        height,
        width,
        widthPadding,
        dims;

    if (!this.isKioskMode()) {
        numAdditionalSections += 1;
    }

    if (this.nestedViewer) {
        parentHeight = this.containerHtml.parent().height();
        parentWidth = this.containerHtml.parent().width();
    } else {
        parentHeight = window.innerHeight;
        parentWidth = window.innerWidth;
    }

    if (parentHeight < PAPAYA_MINIMUM_SIZE) {
        parentHeight = PAPAYA_MINIMUM_SIZE;
        this.containerHtml.parent().height(PAPAYA_MINIMUM_SIZE);
    }

    if (parentWidth < PAPAYA_MINIMUM_SIZE) {
        parentWidth = PAPAYA_MINIMUM_SIZE;
        this.containerHtml.parent().width(PAPAYA_MINIMUM_SIZE);
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



papaya.Container.prototype.resizeViewerComponents = function (resize) {
    this.toolbar.closeAllMenus();

    var dims = this.getViewerDimensions();

    this.toolbarHtml.css({paddingLeft: dims.widthPadding + "px"});
    this.toolbarHtml.css({paddingBottom: PAPAYA_SPACING + "px"});
    this.toolbarHtml.css({width: dims.width + "px"});
    this.toolbarHtml.css({height: papaya.ui.Toolbar.SIZE + "px"});

    this.titlebarHtml.css({width: dims.width + "px"});

    this.viewerHtml.css({height: "100%"});
    this.viewerHtml.css({width: dims.width + "px"});
    this.viewerHtml.css({paddingLeft: dims.widthPadding + "px"});

    if (resize) {
        this.viewer.resizeViewer(dims);
    }

    if (this.display) {
        this.displayHtml.css({height: PAPAYA_SECTION_HEIGHT + "px"});
        this.displayHtml.css({paddingLeft: dims.widthPadding + "px"});
        this.display.canvas.width = dims.width;
    }

    this.containerHtml.css({paddingTop: dims.heightPadding + "px"});

    if (this.viewer.initialized) {
        this.viewer.drawViewer(true);
    } else {
        this.viewer.drawEmptyViewer();

        if (this.display) {
            this.display.drawEmptyDisplay();
        }
    }
};



function removeCheckForJSClasses(containerHtml, viewerHtml) {
    // old way, here for backwards compatibility
    viewerHtml.removeClass(PAPAYA_CONTAINER_CLASS_NAME);
    viewerHtml.removeClass(PAPAYA_CHECK_FOR_JS_CLASS_NAME);

    // new way
    containerHtml.removeClass(PAPAYA_CONTAINER_CLASS_NAME);
    containerHtml.removeClass(PAPAYA_CHECK_FOR_JS_CLASS_NAME);
}



papaya.Container.prototype.buildViewer = function (params) {
    var dims;

    this.viewerHtml = this.containerHtml.find("." + PAPAYA_VIEWER_CLASS_NAME);
    removeCheckForJSClasses(this.containerHtml, this.viewerHtml);
    this.viewerHtml.html("");  // remove noscript message
    dims = this.getViewerDimensions();
    this.viewer = new papaya.viewer.Viewer(this, dims.width, dims.height, params);
    this.viewerHtml.append($(this.viewer.canvas));
    this.preferences.viewer = this.viewer;
};



papaya.Container.prototype.buildDisplay = function () {
    var dims;

    this.displayHtml = this.containerHtml.find("." + PAPAYA_DISPLAY_CLASS_NAME);
    dims = this.getViewerDimensions();
    this.display = new papaya.viewer.Display(this, dims.width);
    this.displayHtml.append($(this.display.canvas));
};



papaya.Container.prototype.buildToolbar = function () {
    this.toolbarHtml = this.containerHtml.find("." + PAPAYA_TOOLBAR_CLASS_NAME);
    this.toolbar = new papaya.ui.Toolbar(this);
    this.toolbar.buildToolbar();
    this.toolbar.updateImageButtons();
};



papaya.Container.prototype.setUpDnD = function () {
    var container = this;

    this.containerHtml[0].ondragover = function () {
        container.viewer.draggingOver = true;
        if (!container.viewer.initialized) {
            container.viewer.drawEmptyViewer();
        }

        return false;
    };

    this.containerHtml[0].ondragleave = function () {
        container.viewer.draggingOver = false;
        if (!container.viewer.initialized) {
            container.viewer.drawEmptyViewer();
        }
        return false;
    };

    this.containerHtml[0].ondragend = function () {
        container.viewer.draggingOver = false;
        if (!container.viewer.initialized) {
            container.viewer.drawEmptyViewer();
        }
        return false;
    };

    this.containerHtml[0].ondrop = function (e) {
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



function fillContainerHTML(containerHTML, isDefault) {
    var toolbarHTML, viewerHTML, displayHTML;

    if (isDefault) {
        toolbarHTML = containerHTML.find("#" + PAPAYA_DEFAULT_TOOLBAR_ID);
        viewerHTML = containerHTML.find("#" + PAPAYA_DEFAULT_VIEWER_ID);
        displayHTML = containerHTML.find("#" + PAPAYA_DEFAULT_DISPLAY_ID);

        if (toolbarHTML) {
            toolbarHTML.addClass(PAPAYA_TOOLBAR_CLASS_NAME);
        } else {
            containerHTML.prepend("<div class='" + PAPAYA_TOOLBAR_CLASS_NAME + "' id='" + PAPAYA_DEFAULT_TOOLBAR_ID + "'></div>");
        }

        if (viewerHTML) {
            viewerHTML.addClass(PAPAYA_VIEWER_CLASS_NAME);
        } else {
            $("<div class='" + PAPAYA_VIEWER_CLASS_NAME + "' id='" + PAPAYA_DEFAULT_VIEWER_ID + "'></div>").insertAfter($("#" + PAPAYA_DEFAULT_TOOLBAR_ID));
        }

        if (displayHTML) {
            displayHTML.addClass(PAPAYA_DISPLAY_CLASS_NAME);
        } else {
            $("<div class='" + PAPAYA_DISPLAY_CLASS_NAME + "' id='" + PAPAYA_DEFAULT_DISPLAY_ID + "'></div>").insertAfter($("#" + PAPAYA_DEFAULT_VIEWER_ID));
        }

        console.log("This method of adding a Papaya container is deprecated.  Try simply <div class='papaya' data-params='params'></div> instead...");
    } else {
        containerHTML.attr("id", PAPAYA_DEFAULT_CONTAINER_ID + papayaContainers.length);

        containerHTML.append("<div id='" + (PAPAYA_DEFAULT_TOOLBAR_ID + papayaContainers.length) + "' class='" + PAPAYA_TOOLBAR_CLASS_NAME + "'></div>");
        containerHTML.append("<div id='" + (PAPAYA_DEFAULT_VIEWER_ID + papayaContainers.length) + "' class='" + PAPAYA_VIEWER_CLASS_NAME + "'></div>");
        containerHTML.append("<div id='" + (PAPAYA_DEFAULT_DISPLAY_ID + papayaContainers.length) + "' class='" + PAPAYA_DISPLAY_CLASS_NAME + "'></div>");
    }

    return viewerHTML;
}




function findParameters(containerHTML) {
    var viewerHTML, params;

    params = containerHTML.data("params");

    if (!params) {
        viewerHTML = containerHTML.find("." + PAPAYA_VIEWER_CLASS_NAME);

        if (viewerHTML) {
            params = viewerHTML.data("params");
        }
    }

    return params;
}



function buildContainer(containerHTML) {
    var container, message, viewerHtml, loadParams, loadUrl;

    message = checkForBrowserCompatibility();
    viewerHtml = containerHTML.find("." + PAPAYA_VIEWER_CLASS_NAME);

    if (message !== null) {
        removeCheckForJSClasses(containerHTML, viewerHtml);
        containerHTML.addClass("checkBrowser");
        viewerHtml.addClass("checkBrowserMessage");
        viewerHtml.html(message);
    } else {
        loadParams = findParameters(containerHTML);

        container = new papaya.Container(containerHTML);
        container.containerIndex = papayaContainers.length;
        container.preferences = new papaya.viewer.Preferences();
        removeCheckForJSClasses(containerHTML, viewerHtml);

        if (loadParams) {
            container.params = $.extend(container.params, window[loadParams]);
        }

        getQueryParams(container.params);

        container.nestedViewer = (containerHTML.parent()[0].tagName.toUpperCase() !== 'BODY');

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

        papayaContainers.push(container);
    }
}



function buildAllContainers() {
    var defaultContainer = $("#" + PAPAYA_DEFAULT_CONTAINER_ID);

    if (defaultContainer.length > 0) {
        fillContainerHTML(defaultContainer, true);
        buildContainer(defaultContainer);
    } else {
        $("." + PAPAYA_CONTAINER_CLASS_NAME).each(function () {
            fillContainerHTML($(this), false);
            buildContainer($(this));
        });
    }
}



function main() {
    buildAllContainers();
}



window.onload = main;



window.onresize = function () {
    if ((papayaContainers.length === 1) && !papayaContainers[0].nestedViewer) {
        papayaContainers[0].resizeViewerComponents(true);
    }
};
