
/*jslint browser: true, node: true */
/*global $, PAPAYA_MINIMUM_SIZE, PAPAYA_SECTION_HEIGHT, PAPAYA_SPACING, PAPAYA_CONTAINER_PADDING_TOP,
PAPAYA_CONTAINER_CLASS_NAME, PAPAYA_CHECK_FOR_JS_CLASS_NAME, PAPAYA_VIEWER_CLASS_NAME, PAPAYA_DISPLAY_CLASS_NAME,
PAPAYA_TOOLBAR_CLASS_NAME, PAPAYA_DEFAULT_TOOLBAR_ID, PAPAYA_DEFAULT_VIEWER_ID, PAPAYA_DEFAULT_DISPLAY_ID,
PAPAYA_DEFAULT_CONTAINER_ID, checkForBrowserCompatibility, getQueryParams, bind */

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
    this.collapsable = false;
    this.resetComponents();
};



papaya.Container.prototype.resetComponents = function () {
    this.containerHtml.css({height: "auto"});
    this.containerHtml.css({width: "auto"});
    this.containerHtml.css({margin: "auto"});
    $('head').append("<style>div#papayaViewer:before{ content:'' }</style>");
};



papaya.Container.prototype.getViewerDimensions = function () {
    var numAdditionalSections = 2,
        parentHeight = PAPAYA_MINIMUM_SIZE,
        parentWidth = PAPAYA_MINIMUM_SIZE,
        height,
        width,
        widthPadding,
        dims;

    if (!this.kioskMode) {
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

        if (this.kioskMode) {
            this.containerHtml.parent().height(PAPAYA_MINIMUM_SIZE * 0.8);
        } else {
            this.containerHtml.parent().height(PAPAYA_MINIMUM_SIZE * 0.9);
        }
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

    this.displayHtml.css({height: PAPAYA_SECTION_HEIGHT + "px"});
    this.displayHtml.css({paddingLeft: dims.widthPadding + "px"});
    this.display.canvas.width = dims.width;

    this.containerHtml.css({paddingTop: dims.heightPadding + "px"});

    if (this.viewer.initialized) {
        this.viewer.drawViewer(true);
    } else {
        this.viewer.drawEmptyViewer();
        this.display.drawEmptyDisplay();
    }
};




papaya.Container.prototype.updateViewerSize = function () {
    this.toolbar.closeAllMenus();
    this.viewer.resizeViewer(this.getViewerDimensions());
    this.viewer.updateOffsetRect();
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



papaya.Container.prototype.clearParams = function () {
    this.params = [];
};



papaya.Container.prototype.loadNext = function () {
    var loadingNext = false;

    this.loadingImageIndex += 1;

    if (this.params.images) {
        if (this.loadingImageIndex < this.params.images.length) {
            loadingNext = true;
            this.viewer.loadImage(this.params.images[this.loadingImageIndex], true, false);
        }
    } else if (this.params.encodedImages) {
        if (this.loadingImageIndex < this.params.encodedImages.length) {
            loadingNext = true;
            this.viewer.loadImage(this.params.encodedImages[this.loadingImageIndex], false, true);
        }
    }

    return loadingNext;
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



papaya.Container.prototype.expandViewer = function () {
    if (this.nestedViewer) {
        this.nestedViewer = false;
        this.collapsable = true;

        $(document.body).children().hide();
        this.containerHtml.show();

        this.originalStyle = {};
        this.originalStyle.width = document.body.style.width;
        this.originalStyle.height = document.body.style.height;
        this.originalStyle.marginTop = document.body.style.marginTop;
        this.originalStyle.marginRight = document.body.style.marginRight;
        this.originalStyle.marginBottom = document.body.style.marginBottom;
        this.originalStyle.marginLeft = document.body.style.marginLeft;
        this.originalStyle.paddingTop = document.body.style.paddingTop;
        this.originalStyle.paddingRight = document.body.style.paddingRight;
        this.originalStyle.paddingBottom = document.body.style.paddingBottom;
        this.originalStyle.paddingLeft = document.body.style.paddingLeft;

        document.body.style.marginTop = 0;
        document.body.style.marginBottom = 0;
        document.body.style.marginLeft = 'auto';
        document.body.style.marginRight = 'auto';
        document.body.style.padding = 0;

        document.body.style.width = "100%";
        document.body.style.height = "100%";

        this.containerHtml.after('<div style="display:none" class="collapsable"></div>');
        $(document.body).prepend(this.containerHtml);

        setTimeout(bind(this, function () {
            window.scrollTo(0, 0);
            this.viewer.addScroll();
        }), 0);

        this.resizeViewerComponents(true);
    }
};



papaya.Container.prototype.collapseViewer = function () {
    var ctr;

    if (this.collapsable) {
        this.nestedViewer = true;
        this.collapsable = false;

        document.body.style.width = this.originalStyle.width;
        document.body.style.height = this.originalStyle.height;
        document.body.style.marginTop = this.originalStyle.marginTop;
        document.body.style.marginRight = this.originalStyle.marginRight;
        document.body.style.marginBottom = this.originalStyle.marginBottom;
        document.body.style.marginLeft = this.originalStyle.marginLeft;
        document.body.style.paddingTop = this.originalStyle.paddingTop;
        document.body.style.paddingRight = this.originalStyle.paddingRight;
        document.body.style.paddingBottom = this.originalStyle.paddingBottom;
        document.body.style.paddingLeft = this.originalStyle.paddingLeft;

        $(".collapsable").replaceWith(this.containerHtml);
        $(document.body).children().show();

        setTimeout(bind(this, function () {
            window.scrollTo(0, 0);
            this.viewer.removeScroll();
        }), 0);

        this.resizeViewerComponents(true);

        for (ctr = 0; ctr < papayaContainers.length; ctr += 1) {
            papayaContainers[ctr].updateViewerSize();
        }
    }
};



function findParameters(containerHTML) {
    var viewerHTML, paramsName, loadedParams = null;

    paramsName = containerHTML.data("params");

    if (!paramsName) {
        viewerHTML = containerHTML.find("." + PAPAYA_VIEWER_CLASS_NAME);

        if (viewerHTML) {
            paramsName = viewerHTML.data("params");
        }
    }

    if (paramsName) {
        loadedParams = window[paramsName];
    }

    getQueryParams(loadedParams);

    return loadedParams;
}



function fillContainerHTML(containerHTML, isDefault, params) {
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

        if (!params || (params.kioskMode === undefined) || !params.kioskMode) {
            containerHTML.append("<div id='" + (PAPAYA_DEFAULT_TOOLBAR_ID + papayaContainers.length) + "' class='" + PAPAYA_TOOLBAR_CLASS_NAME + "'></div>");
        }

        containerHTML.append("<div id='" + (PAPAYA_DEFAULT_VIEWER_ID + papayaContainers.length) + "' class='" + PAPAYA_VIEWER_CLASS_NAME + "'></div>");
        containerHTML.append("<div id='" + (PAPAYA_DEFAULT_DISPLAY_ID + papayaContainers.length) + "' class='" + PAPAYA_DISPLAY_CLASS_NAME + "'></div>");
    }

    return viewerHTML;
}



function buildContainer(containerHTML, params) {
    var container, message, viewerHtml, loadUrl;

    message = checkForBrowserCompatibility();
    viewerHtml = containerHTML.find("." + PAPAYA_VIEWER_CLASS_NAME);

    if (message !== null) {
        removeCheckForJSClasses(containerHTML, viewerHtml);
        containerHTML.addClass("checkBrowser");
        viewerHtml.addClass("checkBrowserMessage");
        viewerHtml.html(message);
    } else {
        container = new papaya.Container(containerHTML);
        container.containerIndex = papayaContainers.length;
        container.preferences = new papaya.viewer.Preferences();
        removeCheckForJSClasses(containerHTML, viewerHtml);

        if (params) {
            container.params = $.extend(container.params, params);
        }

        container.nestedViewer = (containerHTML.parent()[0].tagName.toUpperCase() !== 'BODY');
        container.kioskMode = (container.params.kioskMode === true);

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
    var defaultContainer, params;

    defaultContainer = $("#" + PAPAYA_DEFAULT_CONTAINER_ID);

    if (defaultContainer.length > 0) {
        fillContainerHTML(defaultContainer, true);
        params = findParameters(defaultContainer);
        buildContainer(defaultContainer, params);
    } else {
        $("." + PAPAYA_CONTAINER_CLASS_NAME).each(function () {
            params = findParameters($(this));
            fillContainerHTML($(this), false, params);
            buildContainer($(this), params);
        });
    }
}



function addViewer(parentName, params, callback) {
    var container, parent;

    parent = $("#" + parentName);
    container = $('<div class="papaya"></div>');

    parent.html(container);

    // remove parent click handler
    parent[0].onclick = '';
    parent.off("click");

    fillContainerHTML(container, false, params);
    buildContainer(container, params);

    if (callback) {
        callback();
    }
}



function main() {
    setTimeout(function () {  // setTimeout necessary in Chrome
        window.scrollTo(0, 0);
    }, 0);

    buildAllContainers();
}



window.onload = main;



window.onresize = function () {
    if ((papayaContainers.length === 1) && !papayaContainers[0].nestedViewer) {
        papayaContainers[0].resizeViewerComponents(true);
    } else {
        var ctr;

        for (ctr = 0; ctr < papayaContainers.length; ctr += 1) {
            if (papayaContainers[ctr].collapsable) {
                papayaContainers[ctr].resizeViewerComponents(true);
            } else {
                papayaContainers[ctr].updateViewerSize();
            }
        }
    }
};
