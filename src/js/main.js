
/*jslint browser: true, node: true */
/*global $, PAPAYA_VIEWER_CSS, PAPAYA_DEFAULT_TOOLBAR_ID, PAPAYA_DEFAULT_VIEWER_ID, PAPAYA_DEFAULT_DISPLAY_ID,
 PAPAYA_TOOLBAR_CSS, PAPAYA_DISPLAY_CSS, PAPAYA_DEFAULT_SLIDER_ID, PAPAYA_DEFAULT_CONTAINER_ID, PAPAYA_SLIDER_CSS,
 PAPAYA_UTILS_UNSUPPORTED_CSS, PAPAYA_UTILS_UNSUPPORTED_MESSAGE_CSS, PAPAYA_CONTAINER_CLASS_NAME,
 PAPAYA_CONTAINER_FULLSCREEN, PAPAYA_CONTAINER_CLASS_NAME, PAPAYA_UTILS_CHECKFORJS_CSS, PAPAYA_SPACING,
 papayaRoundFast, PAPAYA_PADDING, PAPAYA_CONTAINER_PADDING_TOP, PAPAYA_CONTAINER_COLLAPSABLE_EXEMPT,
 PAPAYA_CONTAINER_COLLAPSABLE, PAPAYA_MANGO_INSTALLED, PAPAYA_KIOSK_CONTROLS_CSS, PAPAYA_CONTROL_INCREMENT_BUTTON_CSS,
 PAPAYA_CONTROL_SLIDER_CSS, PAPAYA_CONTROL_GOTO_CENTER_BUTTON_CSS, PAPAYA_CONTROL_GOTO_ORIGIN_BUTTON_CSS,
 PAPAYA_CONTROL_SWAP_BUTTON_CSS, PAPAYA_CONTROL_DIRECTION_SLIDER, PAPAYA_CONTROL_MAIN_SLIDER,
 PAPAYA_CONTROL_MAIN_INCREMENT_BUTTON_CSS, PAPAYA_CONTROL_MAIN_INCREMENT_BUTTON_CSS,
 PAPAYA_CONTROL_MAIN_DECREMENT_BUTTON_CSS, PAPAYA_CONTROL_MAIN_SWAP_BUTTON_CSS, PAPAYA_CONTROL_BAR_LABELS_CSS,
 PAPAYA_CONTROL_MAIN_GOTO_CENTER_BUTTON_CSS, PAPAYA_CONTROL_MAIN_GOTO_ORIGIN_BUTTON_CSS
 */

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
    this.loadingSurfaceIndex = 0;
    this.nestedViewer = false;
    this.collapsable = false;
    this.orthogonal = true;
    this.orthogonalTall = false;
    this.orthogonalDynamic = false;
    this.kioskMode = false;
    this.showControls = true;
    this.showControlBar = false;
    this.showImageButtons = true;
    this.fullScreenPadding = true;
    this.combineParametric = false;
    this.dropTimeout = null;
    this.showRuler = false;
    this.syncOverlaySeries = true;
    this.surfaceParams = {};
    this.contextManager = null;
    this.allowScroll = true;
    this.loadingComplete = null;
    this.resetComponents();
};


/*** Static Pseudo-constants ***/

papaya.Container.LICENSE_TEXT = "<p>THIS PRODUCT IS NOT FOR CLINICAL USE.<br /><br />" +
    "This software is available for use, as is, free of charge.  The software and data derived from this software " +
    "may not be used for clinical purposes.<br /><br />" +
    "The authors of this software make no representations or warranties about the suitability of the software, " +
    "either express or implied, including but not limited to the implied warranties of merchantability, fitness for a " +
    "particular purpose, non-infringement, or conformance to a specification or standard. The authors of this software " +
    "shall not be liable for any damages suffered by licensee as a result of using or modifying this software or its " +
    "derivatives.<br /><br />" +
    "By using this software, you agree to be bounded by the terms of this license.  If you do not agree to the terms " +
    "of this license, do not use this software.</p>";

papaya.Container.KEYBOARD_REF_TEXT = "<span style='color:#B5CBD3'>[Spacebar]</span> Cycle the main slice view in a clockwise rotation.<br /><br />" +
    "<span style='color:#B5CBD3'>[Page Up]</span> or <span style='color:#B5CBD3'>[']</span> Increment the axial slice.<br /><br />" +
    "<span style='color:#B5CBD3'>[Page Down]</span> or <span style='color:#B5CBD3'>[/]</span> Decrement the axial slice.<br /><br />" +
    "<span style='color:#B5CBD3'>[Arrow Up]</span> and <span style='color:#B5CBD3'>[Arrow Down]</span> Increment/decrement the coronal slice.<br /><br />" +
    "<span style='color:#B5CBD3'>[Arrow Right]</span> and <span style='color:#B5CBD3'>[Arrow Left]</span> Increment/decrement the sagittal slice.<br /><br />" +
    "<span style='color:#B5CBD3'>[g]</span> and <span style='color:#B5CBD3'>[v]</span> Increment/decrement main slice.<br /><br />" +
    "<span style='color:#B5CBD3'>[<]</span> or <span style='color:#B5CBD3'>[,]</span> Decrement the series point.<br /><br />" +
    "<span style='color:#B5CBD3'>[>]</span> or <span style='color:#B5CBD3'>[.]</span> Increment the series point.<br /><br />" +
    "<span style='color:#B5CBD3'>[o]</span> Navigate viewer to the image origin.<br /><br />" +
    "<span style='color:#B5CBD3'>[c]</span> Navigate viewer to the center of the image.<br /><br />" +
    "<span style='color:#B5CBD3'>[a]</span> Toggle main crosshairs on/off.";

papaya.Container.MOUSE_REF_TEXT = "<span style='color:#B5CBD3'>(Left-click and drag)</span> Change current coordinate.<br /><br />" +
    "<span style='color:#B5CBD3'>[Alt](Left-click and drag)</span> Zoom in and out.<br /><br />" +
    "<span style='color:#B5CBD3'>[Alt](Double left-click)</span> Reset zoom.<br /><br />" +
    "<span style='color:#B5CBD3'>[Alt][Shift](Left-click and drag)</span> Pan zoomed image.<br /><br />" +
    "<span style='color:#B5CBD3'>(Right-click and drag)</span> Window level controls.<br /><br />" +
    "<span style='color:#B5CBD3'>(Scroll wheel)</span> See Preferences.<br /><br />";

papaya.Container.DICOM_SUPPORT = true;


/*** Static Fields ***/

papaya.Container.syncViewers = false;
papaya.Container.syncViewersWorld = false;
papaya.Container.allowPropagation = false;
papaya.Container.papayaLastHoveredViewer = null;


/*** Static Methods ***/

papaya.Container.restartViewer = function (index, refs, forceUrl, forceEncode) {
    papayaContainers[index].viewer.restart(refs, forceUrl, forceEncode);
};



papaya.Container.resetViewer = function (index, params) {
    if (!params) {
        params = papayaContainers[index].params;

        if (params.loadedImages) {
            params.images = params.loadedImages;
        }

        if (params.loadedEncodedImages) {
            params.encodedImages = params.loadedEncodedImages;
        }

        if (params.loadedSurfaces) {
            params.surfaces = params.loadedSurfaces;
        }

        if (params.loadedEncodedSurfaces) {
            params.encodedSurfaces = params.loadedEncodedSurfaces;
        }

        if (params.loadedFiles) {
            params.files = params.loadedFiles;
        }
    }

    papayaContainers[index].viewer.resetViewer();
    papayaContainers[index].toolbar.updateImageButtons();
    papayaContainers[index].reset();
    papayaContainers[index].params = params;
    papayaContainers[index].readGlobalParams();
    papayaContainers[index].rebuildContainer(params, index);
    papayaContainers[index].viewer.processParams(params);
};



papaya.Container.removeImage = function (index, imageIndex) {
    if (imageIndex < 1) {
        console.log("Cannot remove the base image.  Try papaya.Container.resetViewer() instead.");
    }

    papayaContainers[index].viewer.removeOverlay(imageIndex);
};



papaya.Container.hideImage = function (index, imageIndex) {
    papayaContainers[index].viewer.screenVolumes[imageIndex].hidden = true;
    papayaContainers[index].viewer.drawViewer(true, false);
};



papaya.Container.showImage = function (index, imageIndex) {
    papayaContainers[index].viewer.screenVolumes[imageIndex].hidden = false;
    papayaContainers[index].viewer.drawViewer(true, false);
};



papaya.Container.addImage = function (index, imageRef, imageParams) {
    var imageRefs;

    if (imageParams) {
        papayaContainers[index].params = $.extend({}, papayaContainers[index].params, imageParams);
    }

    if (!(imageRef instanceof Array)) {
        imageRefs = [];
        imageRefs[0] = imageRef;
    } else {
        imageRefs = imageRef;
    }

    if (papayaContainers[index].params.images) {
        papayaContainers[index].viewer.loadImage(imageRefs, true, false);
    } else if (papayaContainers[index].params.encodedImages) {
        papayaContainers[index].viewer.loadImage(imageRefs, false, true);
    }
};



papaya.Container.findParameters = function (containerHTML) {
    var viewerHTML, paramsName, loadedParams = null;

    paramsName = containerHTML.data("params");

    if (!paramsName) {
        viewerHTML = containerHTML.find("." + PAPAYA_VIEWER_CSS);

        if (viewerHTML) {
            paramsName = viewerHTML.data("params");
        }
    }

    /*
     if (paramsName) {
     loadedParams = window[paramsName];
     }
     */

    if (paramsName) {
        if (typeof paramsName === 'object') {
            loadedParams = paramsName;
        }
        else if (window[paramsName]) {
            loadedParams = window[paramsName];
        }
    }

    if (loadedParams) {
        papaya.utilities.UrlUtils.getQueryParams(loadedParams);
    }

    return loadedParams;
};



papaya.Container.fillContainerHTML = function (containerHTML, isDefault, params, replaceIndex) {
    var toolbarHTML, viewerHTML, displayHTML, index;

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
        if (replaceIndex !== undefined) {
            index = replaceIndex;
        } else {
            index = papayaContainers.length;
        }

        containerHTML.attr("id", PAPAYA_DEFAULT_CONTAINER_ID + index);

        if (!params || (params.kioskMode === undefined) || !params.kioskMode) {
            containerHTML.append("<div id='" + (PAPAYA_DEFAULT_TOOLBAR_ID + index) +
            "' class='" + PAPAYA_TOOLBAR_CSS + "'></div>");
        }

        containerHTML.append("<div id='" + (PAPAYA_DEFAULT_VIEWER_ID + index) +
            "' class='" + PAPAYA_VIEWER_CSS + "'></div>");
        containerHTML.append("<div id='" + (PAPAYA_DEFAULT_DISPLAY_ID + index) +
            "' class='" + PAPAYA_DISPLAY_CSS + "'></div>");

        if (params && params.showControlBar && ((params.showControls === undefined) || params.showControls)) {
            containerHTML.append(
                "<div id='" + PAPAYA_KIOSK_CONTROLS_CSS + index + "' class='" + PAPAYA_KIOSK_CONTROLS_CSS + "'>" +
                "<div id='" + (PAPAYA_DEFAULT_SLIDER_ID + index) + "main" + "' class='" + PAPAYA_SLIDER_CSS + " " + PAPAYA_CONTROL_MAIN_SLIDER + "'>" +
                "<span class='" + PAPAYA_CONTROL_BAR_LABELS_CSS+ "'>Slice: </span>" + " <button type='button' class='" + PAPAYA_CONTROL_INCREMENT_BUTTON_CSS + "'>+</button>" + " <button type='button' class='" + PAPAYA_CONTROL_INCREMENT_BUTTON_CSS + "'>-</button> "  +
                "</div>" +

                "<div id='" + (PAPAYA_DEFAULT_SLIDER_ID + index) + "axial" + "' class='" + PAPAYA_SLIDER_CSS + " " + PAPAYA_CONTROL_DIRECTION_SLIDER + "'>" +
                "<span class='" + PAPAYA_CONTROL_BAR_LABELS_CSS+ "'>Axial: </span>" + " <button type='button' class='" + PAPAYA_CONTROL_INCREMENT_BUTTON_CSS + "'>+</button>" + " <button type='button' class='" + PAPAYA_CONTROL_INCREMENT_BUTTON_CSS + "'>-</button> " +
                "</div>" +

                "<div id='" + (PAPAYA_DEFAULT_SLIDER_ID + index) + "coronal" + "' class='" + PAPAYA_SLIDER_CSS + " " + PAPAYA_CONTROL_DIRECTION_SLIDER + "'>" +
                "<span class='" + PAPAYA_CONTROL_BAR_LABELS_CSS+ "'>Coronal: </span>" + " <button type='button' class='" + PAPAYA_CONTROL_INCREMENT_BUTTON_CSS + "'>+</button>"+ " <button type='button' class='" + PAPAYA_CONTROL_INCREMENT_BUTTON_CSS + "'>-</button> "  +
                "</div>" +

                "<div id='" + (PAPAYA_DEFAULT_SLIDER_ID + index) + "sagittal" + "' class='" + PAPAYA_SLIDER_CSS + " " + PAPAYA_CONTROL_DIRECTION_SLIDER + "'>" +
                "<span class='" + PAPAYA_CONTROL_BAR_LABELS_CSS+ "'>Sagittal: </span>" + " <button type='button' class='" + PAPAYA_CONTROL_INCREMENT_BUTTON_CSS + "'>+</button>"+ " <button type='button' class='" + PAPAYA_CONTROL_INCREMENT_BUTTON_CSS + "'>-</button> "  +
                "</div>" +

                "<div id='" + (PAPAYA_DEFAULT_SLIDER_ID + index) + "series" + "' class='" + PAPAYA_SLIDER_CSS + " " + PAPAYA_CONTROL_DIRECTION_SLIDER + "'>" +
                "<span class='" + PAPAYA_CONTROL_BAR_LABELS_CSS+ "'>Series: </span>" + " <button type='button' class='" + PAPAYA_CONTROL_INCREMENT_BUTTON_CSS + "'>&lt;</button>"+ " <button type='button' class='" + PAPAYA_CONTROL_INCREMENT_BUTTON_CSS + "'>&gt;</button> "  +
                "</div>" +
                "&nbsp;&nbsp;&nbsp;" +
                "<button type='button' " + ((params.kioskMode && ((params.showImageButtons === undefined) || params.showImageButtons)) ? "" : "style='float:right;margin-left:5px;' ") + "class='" + PAPAYA_CONTROL_SWAP_BUTTON_CSS + "'>Swap View</button> " +
                "<button type='button' " + ((params.kioskMode && ((params.showImageButtons === undefined) || params.showImageButtons)) ? "" : "style='float:right;margin-left:5px;' ") + "class='" + PAPAYA_CONTROL_GOTO_CENTER_BUTTON_CSS + "'>Go To Center</button> " +
                "<button type='button' " + ((params.kioskMode && ((params.showImageButtons === undefined) || params.showImageButtons)) ? "" : "style='float:right;margin-left:5px;' ") + "class='" + PAPAYA_CONTROL_GOTO_ORIGIN_BUTTON_CSS + "'>Go To Origin</button> " +
                "</div>");

            $("." + PAPAYA_CONTROL_INCREMENT_BUTTON_CSS).prop('disabled', true);
            $("." + PAPAYA_CONTROL_SWAP_BUTTON_CSS).prop('disabled', true);
            $("." + PAPAYA_CONTROL_GOTO_CENTER_BUTTON_CSS).prop('disabled', true);
            $("." + PAPAYA_CONTROL_GOTO_ORIGIN_BUTTON_CSS).prop('disabled', true);
        } else if (params && ((params.showControls === undefined ) || params.showControls)) {
            containerHTML.append("<button type='button' id='"+ (PAPAYA_CONTROL_MAIN_INCREMENT_BUTTON_CSS + index) + "' class='" + PAPAYA_CONTROL_MAIN_INCREMENT_BUTTON_CSS + "'>+</button> ");
            containerHTML.append("<button type='button' id='"+ (PAPAYA_CONTROL_MAIN_DECREMENT_BUTTON_CSS + index) + "' class='" + PAPAYA_CONTROL_MAIN_DECREMENT_BUTTON_CSS + "'>-</button> ");
            containerHTML.append("<button type='button' id='"+ (PAPAYA_CONTROL_MAIN_SWAP_BUTTON_CSS + index) + "' class='" + PAPAYA_CONTROL_MAIN_SWAP_BUTTON_CSS + "'>Swap View</button> ");
            containerHTML.append("<button type='button' id='"+ (PAPAYA_CONTROL_MAIN_GOTO_CENTER_BUTTON_CSS + index) + "' class='" + PAPAYA_CONTROL_MAIN_GOTO_CENTER_BUTTON_CSS + "'>Go To Center</button> ");
            containerHTML.append("<button type='button' id='"+ (PAPAYA_CONTROL_MAIN_GOTO_ORIGIN_BUTTON_CSS + index) + "' class='" + PAPAYA_CONTROL_MAIN_GOTO_ORIGIN_BUTTON_CSS + "'>Go To Origin</button> ");

            $("#" + PAPAYA_CONTROL_MAIN_INCREMENT_BUTTON_CSS + index).css({display: "none"});
            $("#" + PAPAYA_CONTROL_MAIN_DECREMENT_BUTTON_CSS + index).css({display: "none"});
            $("#" + PAPAYA_CONTROL_MAIN_SWAP_BUTTON_CSS + index).css({display: "none"});
            $("#" + PAPAYA_CONTROL_MAIN_GOTO_CENTER_BUTTON_CSS + index).css({display: "none"});
            $("#" + PAPAYA_CONTROL_MAIN_GOTO_ORIGIN_BUTTON_CSS + index).css({display: "none"});
        }
    }

    return viewerHTML;
};



papaya.Container.buildContainer = function (containerHTML, params, replaceIndex) {
    var container, message, viewerHtml, loadUrl, index, imageRefs = null;

    message = papaya.utilities.PlatformUtils.checkForBrowserCompatibility();
    viewerHtml = containerHTML.find("." + PAPAYA_VIEWER_CSS);

    if (message !== null) {
        papaya.Container.removeCheckForJSClasses(containerHTML, viewerHtml);
        containerHTML.addClass(PAPAYA_UTILS_UNSUPPORTED_CSS);
        viewerHtml.addClass(PAPAYA_UTILS_UNSUPPORTED_MESSAGE_CSS);
        viewerHtml.html(message);
    } else {
        if (replaceIndex !== undefined) {
            index = replaceIndex;
        } else {
            index = papayaContainers.length;
        }

        container = new papaya.Container(containerHTML);
        container.containerIndex = index;
        container.preferences = new papaya.viewer.Preferences();
        papaya.Container.removeCheckForJSClasses(containerHTML, viewerHtml);

        if (params) {
            container.params = $.extend(container.params, params);
        }

        container.nestedViewer = (containerHTML.parent()[0].tagName.toUpperCase() !== 'BODY');
        container.readGlobalParams();

        if (container.isDesktopMode()) {
            container.preferences.readPreferences();
        }

        container.buildViewer(container.params);
        container.buildDisplay();

        if (container.showControlBar) {
            container.buildSliderControl();
        }

        container.buildToolbar();

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

            container.viewer.loadImage(imageRefs, false, true);
        } else if (container.params.files) {
            imageRefs = container.params.files[0];
            if (!(imageRefs instanceof Array)) {
                imageRefs = [];
                imageRefs[0] = container.params.files[0];
            }

            container.viewer.loadImage(imageRefs, false, false);
        } else {
            container.viewer.finishedLoading();
        }

        container.resizeViewerComponents(false);

        if (!container.nestedViewer) {
            containerHTML.parent().height("100%");
            containerHTML.parent().width("100%");
        }

        papayaContainers[index] = container;

        papaya.Container.showLicense(container, params);
    }
};



papaya.Container.prototype.rebuildContainer = function (params, index) {
    this.containerHtml.empty();
    papaya.Container.fillContainerHTML(this.containerHtml, false, params, index);
    papaya.Container.buildContainer(this.containerHtml, params, index);

    if ((papayaContainers.length === 1) && !papayaContainers[0].nestedViewer) {
        $("html").addClass(PAPAYA_CONTAINER_FULLSCREEN);
        $("body").addClass(PAPAYA_CONTAINER_FULLSCREEN);
        papaya.Container.setToFullPage();
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

            if (params === null) {
                params = [];
            }

            if (params.fullScreen === true) {
                params.fullScreenPadding = false;
                params.kioskMode = true;
                params.showControlBar = false;
                $('body').css({"background-color":"black"});
            }

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
};



papaya.Container.startPapaya = function () {
    setTimeout(function () {  // setTimeout necessary in Chrome
        window.scrollTo(0, 0);
    }, 0);

    papaya.Container.DICOM_SUPPORT = (typeof(daikon) !== "undefined");

    papaya.Container.buildAllContainers();
};



papaya.Container.resizePapaya = function (ev, force) {
    var ctr;

    papaya.Container.updateOrthogonalState();

    if ((papayaContainers.length === 1) && !papayaContainers[0].nestedViewer) {
        if (!papaya.utilities.PlatformUtils.smallScreen || force) {
            papayaContainers[0].resizeViewerComponents(true);
        }
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
    return papaya.Container.LICENSE_TEXT;
};



papaya.Container.getKeyboardReference = function () {
    return papaya.Container.KEYBOARD_REF_TEXT;
};



papaya.Container.getMouseReference = function () {
    return papaya.Container.MOUSE_REF_TEXT;
};



papaya.Container.setLicenseRead = function () {
    papaya.utilities.UrlUtils.createCookie(papaya.viewer.Preferences.COOKIE_PREFIX + "eula", "Yes",
        papaya.viewer.Preferences.COOKIE_EXPIRY_DAYS);
};



papaya.Container.isLicenseRead = function () {
    var value = papaya.utilities.UrlUtils.readCookie(papaya.viewer.Preferences.COOKIE_PREFIX + "eula");
    return (value && (value === 'Yes'));
};



papaya.Container.showLicense = function (container, params) {
    var showEula = (params && params.showEULA !== undefined) && params.showEULA;

    if (showEula && !papaya.Container.isLicenseRead()) {
        var dialog = new papaya.ui.Dialog(container, "License", papaya.ui.Toolbar.LICENSE_DATA,
            papaya.Container, null, papaya.Container.setLicenseRead, null, true);
        dialog.showDialog();
    }
};



papaya.Container.updateOrthogonalState = function () {
    var ctr;

    for (ctr = 0; ctr < papayaContainers.length; ctr += 1) {
        if (papayaContainers[ctr].orthogonal &&
            ((papaya.utilities.PlatformUtils.mobile || papayaContainers[ctr].orthogonalDynamic))) {
            if ($(window).height() > $(window).width()) {
                papayaContainers[ctr].orthogonalTall = true;
            } else {
                papayaContainers[ctr].orthogonalTall = false;
            }
        }
    }
};



papaya.Container.reorientPapaya = function () {
    var ctr;

    for (ctr = 0; ctr < papayaContainers.length; ctr += 1) {
        papayaContainers[ctr].toolbar.closeAllMenus();
    }

    papaya.Container.updateOrthogonalState();
    papaya.Container.resizePapaya(null, true);
};



/*** Prototype Methods ***/

papaya.Container.prototype.resetComponents = function () {
    this.containerHtml.css({height: "auto"});
    this.containerHtml.css({width: "auto"});
    this.containerHtml.css({margin: "auto"});
    $('head').append("<style>div#papayaViewer:before{ content:'' }</style>");
};



papaya.Container.prototype.hasSurface = function () {
    return (this.viewer && (this.viewer.surfaces.length > 0));
};




papaya.Container.prototype.getViewerDimensions = function () {
    var parentWidth, height, width, ratio, maxHeight, maxWidth;

    parentWidth = this.containerHtml.parent().width() - (this.fullScreenPadding ? (2 * PAPAYA_PADDING) : 0);
    ratio = (this.orthogonal ? (this.hasSurface() ? 1.333 : 1.5) : 1);

    if (this.orthogonalTall || !this.orthogonal) {
        height = (this.collapsable ? window.innerHeight : this.containerHtml.parent().height()) - (papaya.viewer.Display.SIZE + (this.kioskMode ? 0 : (papaya.ui.Toolbar.SIZE +
            PAPAYA_SPACING)) + PAPAYA_SPACING + (this.fullScreenPadding && !this.nestedViewer ? (2 * PAPAYA_CONTAINER_PADDING_TOP) : 0)) -
            (this.showControlBar ? 2*papaya.ui.Toolbar.SIZE : 0);

        width = papayaRoundFast(height / ratio);
    } else {
        width = parentWidth;
        height = papayaRoundFast(width / ratio);
    }

    if (!this.nestedViewer || this.collapsable) {
        if (this.orthogonalTall) {
            maxWidth = window.innerWidth - (this.fullScreenPadding ? (2 * PAPAYA_PADDING) : 0);
            if (width > maxWidth) {
                width = maxWidth;
                height = papayaRoundFast(width * ratio);
            }
        } else {
            maxHeight = window.innerHeight - (papaya.viewer.Display.SIZE + (this.kioskMode ? 0 : (papaya.ui.Toolbar.SIZE +
                PAPAYA_SPACING)) + PAPAYA_SPACING + (this.fullScreenPadding ? (2 * PAPAYA_CONTAINER_PADDING_TOP) : 0)) -
                (this.showControlBar ? 2*papaya.ui.Toolbar.SIZE : 0);
            if (height > maxHeight) {
                height = maxHeight;
                width = papayaRoundFast(height * ratio);
            }
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



papaya.Container.prototype.readGlobalParams = function() {
    this.kioskMode = (this.params.kioskMode === true) || papaya.utilities.PlatformUtils.smallScreen;
    this.combineParametric = (this.params.combineParametric === true);

    if (this.params.loadingComplete) {
        this.loadingComplete = this.params.loadingComplete;
    }

    if (this.params.showControls !== undefined) {  // default is true
        this.showControls = this.params.showControls;
    }

    if (this.params.showImageButtons !== undefined) {  // default is true
        this.showImageButtons = this.params.showImageButtons;
    }

    if (papaya.utilities.PlatformUtils.smallScreen) {
        this.showImageButtons = false;
    }

    if (this.params.fullScreenPadding !== undefined) {  // default is true
        this.fullScreenPadding = this.params.fullScreenPadding;
    }

    if (this.params.orthogonal !== undefined) {  // default is true
        this.orthogonal = this.params.orthogonal;
    }

    this.surfaceParams.showSurfacePlanes = (this.params.showSurfacePlanes === true);
    this.surfaceParams.showSurfaceCrosshairs = (this.params.showSurfaceCrosshairs === true);
    this.surfaceParams.surfaceBackground = this.params.surfaceBackground;

    this.orthogonalTall = this.orthogonal && (this.params.orthogonalTall === true);
    this.orthogonalDynamic = this.orthogonal && (this.params.orthogonalDynamic === true);

    if (this.params.allowScroll !== undefined) {  // default is true
        this.allowScroll = this.params.allowScroll;
    }

    if (papaya.utilities.PlatformUtils.mobile || this.orthogonalDynamic) {
        if (this.orthogonal) {
            if ($(window).height() > $(window).width()) {
                this.orthogonalTall = true;
            } else {
                this.orthogonalTall = false;
            }
        }
    }

    if (this.params.syncOverlaySeries !== undefined) {  // default is true
        this.syncOverlaySeries = this.params.syncOverlaySeries;
    }

    if (this.params.showControlBar !== undefined) {  // default is true
        this.showControlBar = this.showControls && this.params.showControlBar;
    }

    if (this.params.contextManager !== undefined) {
        this.contextManager = this.params.contextManager;
    }

    if (this.params.fullScreen === true) {
        this.fullScreenPadding = this.params.fullScreenPadding = false;
        this.kioskMode = this.params.kioskMode = true;
        this.showControlBar = this.params.showControlBar = false;
        $('body').css("background-color:'black'");
    }
};



papaya.Container.prototype.reset = function () {
    this.loadingImageIndex = 0;
    this.loadingSurfaceIndex = 0;
    this.nestedViewer = false;
    this.collapsable = false;
    this.orthogonal = true;
    this.orthogonalTall = false;
    this.orthogonalDynamic = false;
    this.kioskMode = false;
    this.showControls = true;
    this.showControlBar = false;
    this.fullScreenPadding = true;
    this.combineParametric = false;
    this.showRuler = false;
};



papaya.Container.prototype.resizeViewerComponents = function (resize) {
    var dims, padding, diff = 0;

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

    if (this.showControls && this.showControlBar) {
        this.sliderControlHtml.css({width: dims[0] + "px"});
        this.sliderControlHtml.css({height: papaya.viewer.Display.SIZE + "px"});

        if (this.kioskMode) {
            diff += 0;
        } else {
            diff += -50;
        }

        if (this.viewer.hasSeries) {
            diff += 200;
        } else {
            diff += 0;
        }

        if (dims[0] < (775 + diff)) {
            $("." + PAPAYA_CONTROL_GOTO_CENTER_BUTTON_CSS).css({display: "none"});
            $("." + PAPAYA_CONTROL_GOTO_ORIGIN_BUTTON_CSS).css({display: "none"});
        } else {
            $("." + PAPAYA_CONTROL_GOTO_CENTER_BUTTON_CSS).css({display: "inline"});
            $("." + PAPAYA_CONTROL_GOTO_ORIGIN_BUTTON_CSS).css({display: "inline"});
        }

        if (dims[0] < (600 + diff)) {
            $("." + PAPAYA_CONTROL_DIRECTION_SLIDER).css({display: "none"});
            $("." + PAPAYA_CONTROL_MAIN_SLIDER).css({display: "inline"});
        } else {
            $("." + PAPAYA_CONTROL_DIRECTION_SLIDER).css({display: "inline"});
            $("." + PAPAYA_CONTROL_MAIN_SLIDER).css({display: "none"});
        }

        if (this.viewer.hasSeries && (dims[0] < (450 + diff))) {
            $("." + PAPAYA_CONTROL_MAIN_SLIDER).css({display: "none"});
        }

        if (dims[0] < 200) {
            $("." + PAPAYA_CONTROL_SWAP_BUTTON_CSS).css({display: "none"});
        } else {
            $("." + PAPAYA_CONTROL_SWAP_BUTTON_CSS).css({display: "inline"});
        }

        if (this.viewer.hasSeries) {
            $("." + PAPAYA_CONTROL_DIRECTION_SLIDER).eq(3).css({display: "inline"});
        } else {
            $("." + PAPAYA_CONTROL_DIRECTION_SLIDER).eq(3).css({display: "none"});
        }
    } else if (this.showControls && this.viewer.initialized) {
        if (dims[0] < 600) {
            $("#" + PAPAYA_CONTROL_MAIN_GOTO_CENTER_BUTTON_CSS + this.containerIndex).css({display: "none"});
            $("#" + PAPAYA_CONTROL_MAIN_GOTO_ORIGIN_BUTTON_CSS + this.containerIndex).css({display: "none"});
        } else if (!this.viewer.controlsHidden) {
            $("#" + PAPAYA_CONTROL_MAIN_GOTO_CENTER_BUTTON_CSS + this.containerIndex).css({display: "inline"});
            $("#" + PAPAYA_CONTROL_MAIN_GOTO_ORIGIN_BUTTON_CSS + this.containerIndex).css({display: "inline"});
        }
    }

    if (this.isDesktopMode()) {
        if (dims[0] < 600) {
            this.titlebarHtml.css({visibility: "hidden"});
        } else {
            this.titlebarHtml.css({visibility: "visible"});
        }
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
    this.sliderControlHtml = this.containerHtml.find("." + PAPAYA_KIOSK_CONTROLS_CSS);
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
    if (papaya.surface.Surface.findSurfaceType(papayaDroppedFiles[0].name) !== papaya.surface.Surface.SURFACE_TYPE_UNKNOWN) {
        this.viewer.loadSurface(papayaDroppedFiles);
    } else {
        this.viewer.loadImage(papayaDroppedFiles);
    }

    papayaDroppedFiles = [];
};



papaya.Container.prototype.clearParams = function () {
    this.params = [];
};



papaya.Container.prototype.loadNext = function () {
    if (this.hasImageToLoad()) {
        this.loadNextImage();
    } else if (this.hasSurfaceToLoad()) {
        this.loadNextSurface();
    } else if (this.hasAtlasToLoad()) {
        this.viewer.loadAtlas();
    }
};



papaya.Container.prototype.hasMoreToLoad = function () {
    return (this.hasImageToLoad() || this.hasSurfaceToLoad() || this.hasAtlasToLoad());
};



papaya.Container.prototype.hasImageToLoad = function () {
    if (this.params.images) {
        return (this.loadingImageIndex < this.params.images.length);
    } else if (this.params.encodedImages) {
        return (this.loadingImageIndex < this.params.encodedImages.length);
    } else if (this.params.files) {
        return (this.loadingImageIndex < this.params.files.length);
    }

    return false;
};



papaya.Container.prototype.hasAtlasToLoad = function () {
    return this.viewer.hasDefinedAtlas();
};


papaya.Container.prototype.hasSurfaceToLoad = function () {
    if (!papaya.utilities.PlatformUtils.isWebGLSupported()) {
        console.log("Warning: This browser version is not able to load surfaces.");
        return false;
    }

    if (this.params.surfaces) {
        return (this.loadingSurfaceIndex < this.params.surfaces.length);
    } else if (this.params.encodedSurfaces) {
        return (this.loadingSurfaceIndex < this.params.encodedSurfaces.length);
    }

    return false;
};



papaya.Container.prototype.loadNextSurface = function () {
    var loadingNext = false, imageRefs;

    if (this.params.surfaces) {
        if (this.loadingSurfaceIndex < this.params.surfaces.length) {
            loadingNext = true;
            imageRefs = this.params.surfaces[this.loadingSurfaceIndex];
            this.loadingSurfaceIndex += 1;
            this.viewer.loadSurface(imageRefs, true, false);
        } else {
            this.params.loadedSurfaces = this.params.surfaces;
            this.params.surfaces = [];
        }
    } else if (this.params.encodedSurfaces) {
        if (this.loadingSurfaceIndex < this.params.encodedSurfaces.length) {
            loadingNext = true;
            imageRefs = this.params.encodedSurfaces[this.loadingSurfaceIndex];

            if (!(imageRefs instanceof Array)) {
                imageRefs = [];
                imageRefs[0] = this.params.encodedSurfaces[this.loadingSurfaceIndex];
            }

            this.viewer.loadSurface(imageRefs, false, true);
            this.loadingSurfaceIndex += 1;
        } else {
            this.params.loadedEncodedSurfaces = this.params.encodedSurfaces;
            this.params.encodedSurfaces = [];
        }
    }

    return loadingNext;
};



papaya.Container.prototype.loadNextImage = function () {
    var loadingNext = false, imageRefs;

    if (this.params.images) {
        if (this.loadingImageIndex < this.params.images.length) {
            loadingNext = true;
            imageRefs = this.params.images[this.loadingImageIndex];

            if (!(imageRefs instanceof Array)) {
                imageRefs = [];
                imageRefs[0] = this.params.images[this.loadingImageIndex];
            }

            this.viewer.loadImage(imageRefs, true, false);
            this.loadingImageIndex += 1;
        } else {
            this.params.loadedImages = this.params.images;
            this.params.images = [];
        }
    } else if (this.params.encodedImages) {
        if (this.loadingImageIndex < this.params.encodedImages.length) {
            loadingNext = true;
            imageRefs = this.params.encodedImages[this.loadingImageIndex];

            if (!(imageRefs instanceof Array)) {
                imageRefs = [];
                imageRefs[0] = this.params.encodedImages[this.loadingImageIndex];
            }

            this.viewer.loadImage(imageRefs, false, true);
            this.loadingImageIndex += 1;
        } else {
            this.params.loadedEncodedImages = this.params.encodedImages;
            this.params.encodedImages = [];
        }
    } else if (this.params.files) {
        if (this.loadingImageIndex < this.params.files.length) {
            loadingNext = true;
            imageRefs = this.params.files[this.loadingImageIndex];

            if (!(imageRefs instanceof Array)) {
                imageRefs = [];
                imageRefs[0] = this.params.files[this.loadingImageIndex];
            }

            this.viewer.loadImage(imageRefs, false, false);
            this.loadingImageIndex += 1;
        } else {
            this.params.loadedFiles = this.params.files;
            this.params.files = [];
        }
    }

    return loadingNext;
};



papaya.Container.prototype.readyForDnD = function () {
    return !this.kioskMode && ((this.params.images === undefined) ||
        (this.loadingImageIndex >= this.params.images.length)) &&
        ((this.params.encodedImages === undefined) ||
        (this.loadingImageIndex >= this.params.encodedImages.length)) &&
        ((this.params.encodedSurfaces === undefined) ||
        (this.loadingSurfaceIndex >= this.params.encodedSurfaces.length));
};



papaya.Container.prototype.findLoadableImage = function (name, surface) {
    var ctr;

    for (ctr = 0; ctr < papayaLoadableImages.length; ctr += 1) {
        if (surface) {
            if (papayaLoadableImages[ctr].surface) {
                if (papayaLoadableImages[ctr].name == name) {  // needs to be ==, not ===
                    return papayaLoadableImages[ctr];
                }
            }
        } else {
            if (papayaLoadableImages[ctr].name == name) {  // needs to be ==, not ===
                return papayaLoadableImages[ctr];
            }
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
        this.updateViewerSize();

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



papaya.Container.prototype.isDesktopMode = function () {
    return !this.kioskMode;
};



papaya.Container.prototype.hasLoadedDTI = function () {
    return this.viewer.hasLoadedDTI();
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



papaya.Container.prototype.isParametricCombined = function (index) {
    return this.combineParametric && this.viewer.hasParametricPair(index);
};



papaya.Container.prototype.isNonParametricCombined = function (index) {
    return !this.isParametricCombined(index);
};



papaya.Container.prototype.coordinateChanged = function (viewer) {
    var ctr, coorWorld,
        coor = viewer.currentCoord;

    if (papaya.Container.syncViewersWorld) {
        for (ctr = 0; ctr < papayaContainers.length; ctr += 1) {
            if (papayaContainers[ctr].viewer !== viewer) {
                coorWorld = new papaya.core.Coordinate();
                papayaContainers[ctr].viewer.gotoWorldCoordinate(viewer.getWorldCoordinateAtIndex(coor.x, coor.y, coor.z, coorWorld), true);
            }
        }
    } else if (papaya.Container.syncViewers) {
        for (ctr = 0; ctr < papayaContainers.length; ctr += 1) {
            if (papayaContainers[ctr].viewer !== viewer) {
                papayaContainers[ctr].viewer.gotoCoordinate(coor, true);
            }
        }
    }

    if (viewer.surfaceView) {
        viewer.surfaceView.updateActivePlanes();
    }

    if (this.contextManager && this.contextManager.clearContext) {
        this.contextManager.clearContext();
    }
};



papaya.Container.prototype.canCurrentOverlayLoadNegatives = function () {
    var overlay = this.viewer.currentScreenVolume;
    return (!overlay.negative && (overlay.negativeScreenVol === null));
};



papaya.Container.prototype.canCurrentOverlayLoadMod = function () {
    var overlay = this.viewer.currentScreenVolume;
    return (overlay.dti && (overlay.dtiVolumeMod === null));
};



papaya.Container.prototype.canCurrentOverlayModulate = function () {
    var overlay = this.viewer.currentScreenVolume;
    return (overlay.dti && (overlay.dtiVolumeMod !== null));
};



/*** Window Events ***/

window.addEventListener('resize', papaya.Container.resizePapaya, false);
window.addEventListener("orientationchange", papaya.Container.reorientPapaya, false);
window.addEventListener("load", papaya.Container.startPapaya, false);
window.addEventListener('message', function (msg) {
    if (msg.data === PAPAYA_MANGO_INSTALLED) {
        papaya.mangoinstalled = true;
    }
}, false);
