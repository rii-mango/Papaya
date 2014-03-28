
/*jslint browser: true, node: true */
/*global $, PAPAYA_SPACING, PAPAYA_CONTAINER_PADDING_TOP, roundFast, PAPAYA_PADDING,
 PAPAYA_CONTAINER_CLASS_NAME, PAPAYA_UTILS_CHECKFORJS_CSS, PAPAYA_VIEWER_CSS, PAPAYA_DISPLAY_CSS,
 PAPAYA_TOOLBAR_CSS, PAPAYA_DEFAULT_TOOLBAR_ID, PAPAYA_DEFAULT_VIEWER_ID, PAPAYA_DEFAULT_DISPLAY_ID,
 PAPAYA_DEFAULT_CONTAINER_ID, checkForBrowserCompatibility, getQueryParams, bind, PAPAYA_UTILS_UNSUPPORTED_CSS,
 PAPAYA_UTILS_UNSUPPORTED_MESSAGE_CSS, PAPAYA_CONTAINER_COLLAPSABLE, PAPAYA_CONTAINER_COLLAPSABLE_EXEMPT,
 PAPAYA_CONTAINER_FULLSCREEN, PAPAYA_SLIDER_CSS, PAPAYA_DEFAULT_SLIDER_ID, isInputRangeSupported, PAPAYA_BROWSER */

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
    this.sliderControlHtml = null;
    this.viewer = null;
    this.display = null;
    this.toolbar = null;
    this.preferences = null;
    this.params = [];
    this.loadingImageIndex = 0;
    this.nestedViewer = false;
    this.collapsable = false;
    this.orthogonal = true;
    this.kioskMode = false;
    this.fullScreenPadding = true;

    this.resetComponents();
};



papaya.Container.prototype.resetComponents = function () {
    this.containerHtml.css({height: "auto"});
    this.containerHtml.css({width: "auto"});
    this.containerHtml.css({margin: "auto"});
    $('head').append("<style>div#papayaViewer:before{ content:'' }</style>");
};



papaya.Container.prototype.getViewerDimensions = function () {
    var parentWidth, height, width, ratio, maxHeight;

    parentWidth = this.containerHtml.parent().width() - (this.fullScreenPadding ? (2 * PAPAYA_PADDING) : 0);
    ratio = (this.orthogonal ? 1.5 : 1);
    width = parentWidth;
    height = roundFast(width / ratio);

    if (!this.nestedViewer || this.collapsable) {
        maxHeight = window.innerHeight - (papaya.viewer.Display.SIZE + (this.kioskMode ? 0 : (papaya.ui.Toolbar.SIZE + PAPAYA_SPACING)) + PAPAYA_SPACING + (this.fullScreenPadding ? (2 * PAPAYA_CONTAINER_PADDING_TOP) : 0));
        if (height > maxHeight) {
            height = maxHeight;
            width = roundFast(height * ratio);
        }
    }

    return [width, height];
};



papaya.Container.prototype.getViewerPadding = function () {
    var parentWidth, viewerDims, padding;

    parentWidth = this.containerHtml.parent().width() - (this.fullScreenPadding ? (2 * PAPAYA_PADDING) : 0);
    viewerDims = this.getViewerDimensions();
    padding = ((parentWidth - viewerDims[0]) / 2);

    return padding;
};



papaya.Container.prototype.resizeViewerComponents = function (resize) {
    var dims, padding;

    this.toolbar.closeAllMenus();

    dims = this.getViewerDimensions();
    padding = this.getViewerPadding();

    this.toolbarHtml.css({width: dims[0] + "px"});
    this.toolbarHtml.css({height: papaya.ui.Toolbar.SIZE + "px"});
    this.toolbarHtml.css({paddingLeft: padding + "px"});
    this.toolbarHtml.css({paddingBottom: PAPAYA_SPACING + "px"});

    this.viewerHtml.css({width: dims[0] + "px"});
    this.viewerHtml.css({height: dims[1] + "px"});
    this.viewerHtml.css({paddingLeft: padding + "px"});

    if (resize) {
        this.viewer.resizeViewer(dims);
    }

    this.displayHtml.css({height: papaya.viewer.Display.SIZE + "px"});
    this.displayHtml.css({paddingLeft: padding + "px"});
    this.displayHtml.css({paddingTop: PAPAYA_SPACING + "px"});
    this.display.canvas.width = dims[0];

    if (this.sliderControlHtml) {
        this.sliderControlHtml.css({width: dims[0] + "px"});
    }

    if ((!this.nestedViewer || this.collapsable) && this.fullScreenPadding) {
        this.containerHtml.css({paddingTop: PAPAYA_CONTAINER_PADDING_TOP + "px"});
    } else {
        this.containerHtml.css({paddingTop: "0"});
    }

    if (this.fullScreenPadding) {
        this.containerHtml.css({paddingLeft: PAPAYA_PADDING + "px"});
        this.containerHtml.css({paddingRight: PAPAYA_PADDING + "px"});
    }

    if (this.viewer.initialized) {
        this.viewer.drawViewer(false, true);
    } else {
        this.viewer.drawEmptyViewer();
        this.display.drawEmptyDisplay();
    }

    this.titlebarHtml.css({width: dims[0] + "px", top: (this.viewerHtml.position().top - 1.25 * papaya.ui.Toolbar.SIZE)});
};



papaya.Container.prototype.updateViewerSize = function () {
    this.toolbar.closeAllMenus();
    this.viewer.resizeViewer(this.getViewerDimensions());
    this.viewer.updateOffsetRect();
};




function removeCheckForJSClasses(containerHtml, viewerHtml) {
    // old way, here for backwards compatibility
    viewerHtml.removeClass(PAPAYA_CONTAINER_CLASS_NAME);
    viewerHtml.removeClass(PAPAYA_UTILS_CHECKFORJS_CSS);

    // new way
    containerHtml.removeClass(PAPAYA_CONTAINER_CLASS_NAME);
    containerHtml.removeClass(PAPAYA_UTILS_CHECKFORJS_CSS);
}



papaya.Container.prototype.buildViewer = function (params) {
    var dims;

    this.viewerHtml = this.containerHtml.find("." + PAPAYA_VIEWER_CSS);
    removeCheckForJSClasses(this.containerHtml, this.viewerHtml);
    this.viewerHtml.html("");  // remove noscript message
    dims = this.getViewerDimensions();
    this.viewer = new papaya.viewer.Viewer(this, dims[0], dims[1], params);
    this.viewerHtml.append($(this.viewer.canvas));
    this.preferences.viewer = this.viewer;
};



papaya.Container.prototype.buildDisplay = function () {
    var dims;

    this.displayHtml = this.containerHtml.find("." + PAPAYA_DISPLAY_CSS);
    dims = this.getViewerDimensions();
    this.display = new papaya.viewer.Display(this, dims[0]);
    this.displayHtml.append($(this.display.canvas));
};



papaya.Container.prototype.buildSliderControl = function () {
    this.sliderControlHtml = this.containerHtml.find("." + PAPAYA_SLIDER_CSS);
};



papaya.Container.prototype.buildToolbar = function () {
    this.toolbarHtml = this.containerHtml.find("." + PAPAYA_TOOLBAR_CSS);
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



papaya.Container.prototype.readyForDnD = function () {
    return !this.kioskMode && ((this.params.images === undefined) || (this.params.images.length === this.loadingImageIndex)) &&
        ((this.params.encodedImages === undefined) || (this.params.encodedImages.length === this.loadingImageIndex));
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



function setToFullPage() {
    document.body.style.marginTop = 0;
    document.body.style.marginBottom = 0;
    document.body.style.marginLeft = 'auto';
    document.body.style.marginRight = 'auto';
    document.body.style.padding = 0;
    document.body.style.overflow = 'hidden';
    document.body.style.width = "100%";
    document.body.style.height = "100%";
}



papaya.Container.prototype.expandViewer = function () {
    var container = this;

    if (this.nestedViewer) {
        this.nestedViewer = false;
        this.collapsable = true;
        this.tempScrollTop = $(window).scrollTop();

        $(":hidden").addClass(PAPAYA_CONTAINER_COLLAPSABLE_EXEMPT);
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
        this.originalStyle.overflow = document.body.style.overflow;

        setToFullPage();

        this.containerHtml.after('<div style="display:none" class="' + PAPAYA_CONTAINER_COLLAPSABLE + '"></div>');
        $(document.body).prepend(this.containerHtml);

        this.resizeViewerComponents(true);
        this.viewer.updateOffsetRect();

        setTimeout(function () {
            window.scrollTo(0, 0);
            container.viewer.addScroll();
        }, 0);
    }
};


papaya.Container.prototype.collapseViewer = function () {
    var ctr, container;

    container = this;

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
        document.body.style.overflow = this.originalStyle.overflow;

        $("." + PAPAYA_CONTAINER_COLLAPSABLE).replaceWith(this.containerHtml);
        $(document.body).children(":not(." + PAPAYA_CONTAINER_COLLAPSABLE_EXEMPT + ")").show();
        $("." + PAPAYA_CONTAINER_COLLAPSABLE_EXEMPT).removeClass(PAPAYA_CONTAINER_COLLAPSABLE_EXEMPT);

        this.resizeViewerComponents(true);

        for (ctr = 0; ctr < papayaContainers.length; ctr += 1) {
            papayaContainers[ctr].updateViewerSize();
            papayaContainers[ctr].viewer.drawViewer(true);
        }

        setTimeout(function () {
            $(window).scrollTop(container.tempScrollTop);
            container.viewer.removeScroll();
        }, 0);
    }
};



papaya.Container.prototype.isNestedViewer = function () {
    return (this.nestedViewer || this.collapsable);
};



papaya.Container.prototype.disableScrollWheel = function () {
    return (this.isNestedViewer() || PAPAYA_BROWSER.ios);
};



papaya.Container.prototype.canOpenInMango = function () {
    return this.params.canOpenInMango;
};



papaya.Container.prototype.isExpandable = function () {
    return this.params.expandable && this.isNestedViewer();
};



function findParameters(containerHTML) {
    var viewerHTML, paramsName, loadedParams = null;

    paramsName = containerHTML.data("params");

    if (!paramsName) {
        viewerHTML = containerHTML.find("." + PAPAYA_VIEWER_CSS);

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
            toolbarHTML.addClass(PAPAYA_TOOLBAR_CSS);
        } else {
            containerHTML.prepend("<div class='" + PAPAYA_TOOLBAR_CSS + "' id='" + PAPAYA_DEFAULT_TOOLBAR_ID + "'></div>");
        }

        if (viewerHTML) {
            viewerHTML.addClass(PAPAYA_VIEWER_CSS);
        } else {
            $("<div class='" + PAPAYA_VIEWER_CSS + "' id='" + PAPAYA_DEFAULT_VIEWER_ID + "'></div>").insertAfter($("#" + PAPAYA_DEFAULT_TOOLBAR_ID));
        }

        if (displayHTML) {
            displayHTML.addClass(PAPAYA_DISPLAY_CSS);
        } else {
            $("<div class='" + PAPAYA_DISPLAY_CSS + "' id='" + PAPAYA_DEFAULT_DISPLAY_ID + "'></div>").insertAfter($("#" + PAPAYA_DEFAULT_VIEWER_ID));
        }

        console.log("This method of adding a Papaya container is deprecated.  Try simply <div class='papaya' data-params='params'></div> instead...");
    } else {
        containerHTML.attr("id", PAPAYA_DEFAULT_CONTAINER_ID + papayaContainers.length);

        if (!params || (params.kioskMode === undefined) || !params.kioskMode) {
            containerHTML.append("<div id='" + (PAPAYA_DEFAULT_TOOLBAR_ID + papayaContainers.length) + "' class='" + PAPAYA_TOOLBAR_CSS + "'></div>");
        }

        containerHTML.append("<div id='" + (PAPAYA_DEFAULT_VIEWER_ID + papayaContainers.length) + "' class='" + PAPAYA_VIEWER_CSS + "'></div>");
        containerHTML.append("<div id='" + (PAPAYA_DEFAULT_DISPLAY_ID + papayaContainers.length) + "' class='" + PAPAYA_DISPLAY_CSS + "'></div>");

        if (params && (params.orthogonal !== undefined) && !params.orthogonal) {
            if (isInputRangeSupported()) {
                containerHTML.append("<div id='" + (PAPAYA_DEFAULT_SLIDER_ID + papayaContainers.length) + "' class='" + PAPAYA_SLIDER_CSS + "'><input type='range' /></div>");
            }
        }
    }

    return viewerHTML;
}



function buildContainer(containerHTML, params) {
    var container, message, viewerHtml, loadUrl;

    message = checkForBrowserCompatibility();
    viewerHtml = containerHTML.find("." + PAPAYA_VIEWER_CSS);

    if (message !== null) {
        removeCheckForJSClasses(containerHTML, viewerHtml);
        containerHTML.addClass(PAPAYA_UTILS_UNSUPPORTED_CSS);
        viewerHtml.addClass(PAPAYA_UTILS_UNSUPPORTED_MESSAGE_CSS);
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

        if (container.params.fullScreenPadding !== undefined) {  // default is true
            container.fullScreenPadding = container.params.fullScreenPadding;
        }

        if (container.params.orthogonal !== undefined) {  // default is true
            container.orthogonal = container.params.orthogonal;
        }

        container.buildViewer(container.params);
        container.buildDisplay();
        container.buildToolbar();

        if (!container.orthogonal) {
            container.buildSliderControl();
        }

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

        if (!container.nestedViewer) {
            containerHTML.parent().height("100%");
            containerHTML.parent().width("100%");
        }

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

    if ((papayaContainers.length === 1) && !papayaContainers[0].nestedViewer) {
        $("html").addClass(PAPAYA_CONTAINER_FULLSCREEN);
        $("body").addClass(PAPAYA_CONTAINER_FULLSCREEN);
        setToFullPage();

        papayaContainers[0].resizeViewerComponents(true);
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



function startPapaya() {
    setTimeout(function () {  // setTimeout necessary in Chrome
        window.scrollTo(0, 0);
    }, 0);

    buildAllContainers();
}


function resizePapaya() {
    var ctr;

    if ((papayaContainers.length === 1) && !papayaContainers[0].nestedViewer) {
        papayaContainers[0].resizeViewerComponents(true);
    } else {
        for (ctr = 0; ctr < papayaContainers.length; ctr += 1) {
            papayaContainers[ctr].resizeViewerComponents(true);
        }
    }

    setTimeout(function () {  // setTimeout necessary in Chrome
        window.scrollTo(0, 0);
    }, 0);
}


window.onload = startPapaya;


window.onresize = resizePapaya;


window.onorientationchange = function () {
    var ctr;

    for (ctr = 0; ctr < papayaContainers.length; ctr += 1) {
        papayaContainers[ctr].toolbar.closeAllMenus();
    }

    resizePapaya();
};
