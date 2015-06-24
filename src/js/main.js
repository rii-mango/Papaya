
/*jslint browser: true, node: true */
/*global $, PAPAYA_VIEWER_CSS, PAPAYA_DEFAULT_TOOLBAR_ID, PAPAYA_DEFAULT_VIEWER_ID, PAPAYA_DEFAULT_DISPLAY_ID,
 PAPAYA_TOOLBAR_CSS, PAPAYA_DISPLAY_CSS, PAPAYA_DEFAULT_SLIDER_ID, PAPAYA_DEFAULT_CONTAINER_ID, PAPAYA_SLIDER_CSS,
 PAPAYA_UTILS_UNSUPPORTED_CSS, PAPAYA_UTILS_UNSUPPORTED_MESSAGE_CSS, PAPAYA_CONTAINER_CLASS_NAME,
 PAPAYA_CONTAINER_FULLSCREEN, PAPAYA_CONTAINER_CLASS_NAME, PAPAYA_UTILS_CHECKFORJS_CSS, PAPAYA_SPACING,
 papayaRoundFast, PAPAYA_PADDING, PAPAYA_CONTAINER_PADDING_TOP, PAPAYA_CONTAINER_COLLAPSABLE_EXEMPT,
 PAPAYA_CONTAINER_COLLAPSABLE, PAPAYA_MANGO_INSTALLED */

"use strict";

/*** Imports ***/
var papaya = papaya || {};


/*** Global Fields ***/
var papayaContainers = [];
var papayaLoadableImages = papayaLoadableImages || [];
var papayaDroppedFiles = [];


/*** Constructor ***/
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
    this.dropTimeout = null;
    this.resetComponents();
};


/*** Static Fields ***/
papaya.Container.papayaLastHoveredViewer = null;
papaya.Container.papayaLicenseText = "THIS PRODUCT IS NOT FOR CLINICAL USE.<br /><br />" +
    "This software is available for use, as is, free of charge.  The software and data derived from this software " +
    "may not be used for clinical purposes.<br /><br />" +
    "The authors of this software make no representations or warranties about the suitability of the software, " +
    "either express or implied, including but not limited to the implied warranties of merchantability, fitness for a " +
    "particular purpose, non-infringement, or conformance to a specification or standard. The authors of this software " +
    "shall not be liable for any damages suffered by licensee as a result of using or modifying this software or its " +
    "derivatives.<br /><br />" +
    "By using this software, you agree to be bounded by the terms of this license.  If you do not agree to the terms " +
    "of this license, do not use this software.";


/*** Static Methods ***/

papaya.Container.findParameters = function (containerHTML) {
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

    papaya.utilities.UrlUtils.getQueryParams(loadedParams);

    return loadedParams;
};



papaya.Container.fillContainerHTML = function (containerHTML, isDefault, params) {
    var toolbarHTML, viewerHTML, displayHTML;

    if (isDefault) {
        toolbarHTML = containerHTML.find("#" + PAPAYA_DEFAULT_TOOLBAR_ID);
        viewerHTML = containerHTML.find("#" + PAPAYA_DEFAULT_VIEWER_ID);
        displayHTML = containerHTML.find("#" + PAPAYA_DEFAULT_DISPLAY_ID);

        if (toolbarHTML) {
            toolbarHTML.addClass(PAPAYA_TOOLBAR_CSS);
        } else {
            containerHTML.prepend("<div class='" + PAPAYA_TOOLBAR_CSS + "' id='" +
                PAPAYA_DEFAULT_TOOLBAR_ID + "'></div>");
        }

        if (viewerHTML) {
            viewerHTML.addClass(PAPAYA_VIEWER_CSS);
        } else {
            $("<div class='" + PAPAYA_VIEWER_CSS + "' id='" +
                PAPAYA_DEFAULT_VIEWER_ID + "'></div>").insertAfter($("#" + PAPAYA_DEFAULT_TOOLBAR_ID));
        }

        if (displayHTML) {
            displayHTML.addClass(PAPAYA_DISPLAY_CSS);
        } else {
            $("<div class='" + PAPAYA_DISPLAY_CSS + "' id='" +
                PAPAYA_DEFAULT_DISPLAY_ID + "'></div>").insertAfter($("#" + PAPAYA_DEFAULT_VIEWER_ID));
        }

        console.log("This method of adding a Papaya container is deprecated.  " +
            "Try simply <div class='papaya' data-params='params'></div> instead...");
    } else {
        containerHTML.attr("id", PAPAYA_DEFAULT_CONTAINER_ID + papayaContainers.length);

        if (!params || (params.kioskMode === undefined) || !params.kioskMode) {
            containerHTML.append("<div id='" + (PAPAYA_DEFAULT_TOOLBAR_ID + papayaContainers.length) +
            "' class='" + PAPAYA_TOOLBAR_CSS + "'></div>");
        }

        containerHTML.append("<div id='" + (PAPAYA_DEFAULT_VIEWER_ID + papayaContainers.length) +
            "' class='" + PAPAYA_VIEWER_CSS + "'></div>");
        containerHTML.append("<div id='" + (PAPAYA_DEFAULT_DISPLAY_ID + papayaContainers.length) +
            "' class='" + PAPAYA_DISPLAY_CSS + "'></div>");

        if (params && (params.orthogonal !== undefined) && !params.orthogonal) {
            if (papaya.utilities.PlatformUtils.isInputRangeSupported()) {
                containerHTML.append("<div id='" + (PAPAYA_DEFAULT_SLIDER_ID + papayaContainers.length) +
                    "' class='" + PAPAYA_SLIDER_CSS + "'><input type='range' /></div>");
            }
        }
    }

    return viewerHTML;
};



papaya.Container.buildContainer = function (containerHTML, params) {
    var container, message, viewerHtml, loadUrl, imageRefs = null;

    message = papaya.utilities.PlatformUtils.checkForBrowserCompatibility();
    viewerHtml = containerHTML.find("." + PAPAYA_VIEWER_CSS);

    if (message !== null) {
        papaya.Container.removeCheckForJSClasses(containerHTML, viewerHtml);
        containerHTML.addClass(PAPAYA_UTILS_UNSUPPORTED_CSS);
        viewerHtml.addClass(PAPAYA_UTILS_UNSUPPORTED_MESSAGE_CSS);
        viewerHtml.html(message);
    } else {
        container = new papaya.Container(containerHTML);
        container.containerIndex = papayaContainers.length;
        container.preferences = new papaya.viewer.Preferences();
        papaya.Container.removeCheckForJSClasses(containerHTML, viewerHtml);

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
            imageRefs = loadUrl;
            if (!(imageRefs instanceof Array)) {
                imageRefs = [];
                imageRefs[0] = loadUrl;
            }

            container.viewer.loadImage(imageRefs, true, false);
        } else if (container.params.images) {
            imageRefs = container.params.images[0];
            if (!(imageRefs instanceof Array)) {
                imageRefs = [];
                imageRefs[0] = container.params.images[0];
            }

            container.viewer.loadImage(imageRefs, true, false);
        } else if (container.params.encodedImages) {
            imageRefs = container.params.encodedImages[0];
            if (!(imageRefs instanceof Array)) {
                imageRefs = [];
                imageRefs[0] = container.params.encodedImages[0];
            }

            container.viewer.loadImage(container.params.encodedImages[0], false, true);
        }

        container.resizeViewerComponents(false);

        if (!container.nestedViewer) {
            containerHTML.parent().height("100%");
            containerHTML.parent().width("100%");
        }

        papayaContainers.push(container);
    }
};



papaya.Container.buildAllContainers = function () {
    var defaultContainer, params;

    defaultContainer = $("#" + PAPAYA_DEFAULT_CONTAINER_ID);

    if (defaultContainer.length > 0) {
        papaya.Container.fillContainerHTML(defaultContainer, true);
        params = papaya.Container.findParameters(defaultContainer);
        papaya.Container.buildContainer(defaultContainer, params);
    } else {
        $("." + PAPAYA_CONTAINER_CLASS_NAME).each(function () {
            params = papaya.Container.findParameters($(this));
            papaya.Container.fillContainerHTML($(this), false, params);
            papaya.Container.buildContainer($(this), params);
        });
    }

    if ((papayaContainers.length === 1) && !papayaContainers[0].nestedViewer) {
        $("html").addClass(PAPAYA_CONTAINER_FULLSCREEN);
        $("body").addClass(PAPAYA_CONTAINER_FULLSCREEN);
        papaya.Container.setToFullPage();

        papayaContainers[0].resizeViewerComponents(true);
    }

    papaya.Container.showLicense(params);
};



papaya.Container.startPapaya = function () {
    setTimeout(function () {  // setTimeout necessary in Chrome
        window.scrollTo(0, 0);
    }, 0);

    papaya.Container.buildAllContainers();
};



papaya.Container.resizePapaya = function () {
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
};



papaya.Container.addViewer = function (parentName, params, callback) {
    var container, parent;

    parent = $("#" + parentName);
    container = $('<div class="papaya"></div>');

    parent.html(container);

    // remove parent click handler
    parent[0].onclick = '';
    parent.off("click");

    papaya.Container.fillContainerHTML(container, false, params);
    papaya.Container.buildContainer(container, params);

    if (callback) {
        callback();
    }
};



papaya.Container.removeCheckForJSClasses = function (containerHtml, viewerHtml) {
    // old way, here for backwards compatibility
    viewerHtml.removeClass(PAPAYA_CONTAINER_CLASS_NAME);
    viewerHtml.removeClass(PAPAYA_UTILS_CHECKFORJS_CSS);

    // new way
    containerHtml.removeClass(PAPAYA_CONTAINER_CLASS_NAME);
    containerHtml.removeClass(PAPAYA_UTILS_CHECKFORJS_CSS);
};



papaya.Container.setToFullPage = function () {
    document.body.style.marginTop = 0;
    document.body.style.marginBottom = 0;
    document.body.style.marginLeft = 'auto';
    document.body.style.marginRight = 'auto';
    document.body.style.padding = 0;
    document.body.style.overflow = 'hidden';
    document.body.style.width = "100%";
    document.body.style.height = "100%";
};



papaya.Container.getLicense = function () {
    return papaya.Container.papayaLicenseText;
};



papaya.Container.setLicenseRead = function () {
    papaya.utilities.UrlUtils.createCookie(papaya.viewer.Preferences.COOKIE_PREFIX + "eula", "Yes", papaya.viewer.Preferences.COOKIE_EXPIRY_DAYS);
};



papaya.Container.isLicenseRead = function () {
    var value = papaya.utilities.UrlUtils.readCookie(papaya.viewer.Preferences.COOKIE_PREFIX + "eula");
    return (value && (value === 'Yes'));
};



papaya.Container.showLicense = function (params) {
    var showEula = (params.showEULA !== undefined) && params.showEULA;

    if (showEula && !papaya.Container.isLicenseRead()) {
        var dialog = new papaya.ui.Dialog(this, "License", papaya.ui.Toolbar.LICENSE_DATA,
            papaya.Container, null, papaya.Container.setLicenseRead);
        dialog.showDialog();
    }
};


/*** Prototype Methods ***/

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
    height = papayaRoundFast(width / ratio);

    if (!this.nestedViewer || this.collapsable) {
        maxHeight = window.innerHeight - (papaya.viewer.Display.SIZE + (this.kioskMode ? 0 : (papaya.ui.Toolbar.SIZE +
            PAPAYA_SPACING)) + PAPAYA_SPACING + (this.fullScreenPadding ? (2 * PAPAYA_CONTAINER_PADDING_TOP) : 0));
        if (height > maxHeight) {
            height = maxHeight;
            width = papayaRoundFast(height * ratio);
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

    this.titlebarHtml.css({width: dims[0] + "px", top: (this.viewerHtml.position().top - 1.25 *
        papaya.ui.Toolbar.SIZE)});
};



papaya.Container.prototype.updateViewerSize = function () {
    this.toolbar.closeAllMenus();
    this.viewer.resizeViewer(this.getViewerDimensions());
    this.viewer.updateOffsetRect();
};



papaya.Container.prototype.buildViewer = function (params) {
    var dims;

    this.viewerHtml = this.containerHtml.find("." + PAPAYA_VIEWER_CSS);
    papaya.Container.removeCheckForJSClasses(this.containerHtml, this.viewerHtml);
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



papaya.Container.prototype.readFile = function(fileEntry, callback) {
    fileEntry.file(function(callback, file){
        if (callback) {
            if (file.name.charAt(0) !== '.') {
                callback(file);
            }
        }
    }.bind(this, callback));
};



papaya.Container.prototype.readDir = function(itemEntry) {
    this.readDirNextEntries(itemEntry.createReader());
};



papaya.Container.prototype.readDirNextEntries = function(dirReader) {
    var container = this;

    dirReader.readEntries(function(entries) {
        var len = entries.length,
            ctr, entry;

        if (len > 0) {
            for (ctr = 0; ctr < len; ctr += 1) {
                entry = entries[ctr];
                if (entry.isFile) {
                    container.readFile(entry, papaya.utilities.ObjectUtils.bind(container, container.addDroppedFile));
                }
            }

            container.readDirNextEntries(dirReader);
        }
    });
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

    this.containerHtml[0].ondrop = function (evt) {
        evt.preventDefault();

        var dataTransfer = evt.dataTransfer;

        container.display.drawProgress(0.1, "Loading");

        if (dataTransfer) {
            if (dataTransfer.items && (dataTransfer.items.length > 0)) {
                var items = dataTransfer.items,
                    len = items.length,
                    ctr, entry;

                for (ctr = 0; ctr<len; ctr += 1) {
                    entry = items[ctr];

                    if (entry.getAsEntry) {
                        entry = entry.getAsEntry();
                    } else if(entry.webkitGetAsEntry) {
                        entry = entry.webkitGetAsEntry();
                    }

                    if (entry.isFile) {
                        container.readFile(entry, papaya.utilities.ObjectUtils.bind(container,
                            container.addDroppedFile));
                    } else if (entry.isDirectory) {
                        container.readDir(entry);
                    }
                }
            }

            //else if (dataTransfer.mozGetDataAt) {  // permission denied :-(
            //    console.log(dataTransfer.mozGetDataAt('application/x-moz-file', 0));
            //}

            else if (dataTransfer.files && (dataTransfer.files.length > 0)) {
                container.viewer.loadImage(evt.dataTransfer.files);
            }
        }

        return false;
    };
};



papaya.Container.prototype.addDroppedFile = function (file) {
    clearTimeout(this.dropTimeout);
    papayaDroppedFiles.push(file);
    this.dropTimeout = setTimeout(papaya.utilities.ObjectUtils.bind(this, this.droppedFilesFinishedLoading), 100);
};



papaya.Container.prototype.droppedFilesFinishedLoading = function () {
    this.viewer.loadImage(papayaDroppedFiles);
    papayaDroppedFiles = null;
};



papaya.Container.prototype.clearParams = function () {
    this.params = [];
};



papaya.Container.prototype.loadNext = function () {
    var loadingNext = false, imageRefs;

    this.loadingImageIndex += 1;

    if (this.params.images) {
        if (this.loadingImageIndex < this.params.images.length) {
            loadingNext = true;
            imageRefs = this.params.images[this.loadingImageIndex];

            if (!(imageRefs instanceof Array)) {
                imageRefs = [];
                imageRefs[0] = this.params.images[this.loadingImageIndex];
            }

            this.viewer.loadImage(imageRefs, true, false);
        }
    } else if (this.params.encodedImages) {
        if (this.loadingImageIndex < this.params.encodedImages.length) {
            loadingNext = true;
            imageRefs = this.params.encodedImages[this.loadingImageIndex];

            if (!(imageRefs instanceof Array)) {
                imageRefs = [];
                imageRefs[0] = this.params.encodedImages[this.loadingImageIndex];
            }

            this.viewer.loadImage(this.params.encodedImages[this.loadingImageIndex], false, true);
        }
    }

    return loadingNext;
};



papaya.Container.prototype.readyForDnD = function () {
    return !this.kioskMode && ((this.params.images === undefined) ||
        (this.params.images.length === this.loadingImageIndex)) &&
        ((this.params.encodedImages === undefined) ||
        (this.params.encodedImages.length === this.loadingImageIndex));
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

        papaya.Container.setToFullPage();

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
    return (this.isNestedViewer() || papaya.utilities.PlatformUtils.ios);
};



papaya.Container.prototype.canOpenInMango = function () {
    return this.params.canOpenInMango;
};



papaya.Container.prototype.isExpandable = function () {
    return this.params.expandable && this.isNestedViewer();
};



/*** Window Events ***/

window.onload = papaya.Container.startPapaya;



window.onresize = papaya.Container.resizePapaya;



window.onorientationchange = function () {
    var ctr;

    for (ctr = 0; ctr < papayaContainers.length; ctr += 1) {
        papayaContainers[ctr].toolbar.closeAllMenus();
    }

    papaya.Container.resizePapaya();
};



window.addEventListener('message', function (msg) {
    if (msg.data === PAPAYA_MANGO_INSTALLED) {
        papaya.mangoinstalled = true;
    }
}, false);
