
var papaya = papaya || {};
papaya.viewer = papaya.viewer || {};

var papayaMain = null;


papaya.viewer.Main = papaya.viewer.Main || function() {
    this.buildWarnings();
    this.buildViewer();
    checkForBrowserCompatibility();
    this.buildDisplay();
    this.buildToolbar();
}



function isShowingToolbar() {
    return $("#"+PAPAYA_TOOLBAR_ID).length;
}



function isShowingDisplay() {
    return $("#"+PAPAYA_DISPLAY_ID).length;
}



function isShowingWarnings() {
    return $("#"+PAPAYA_WARNINGS_ID).length;
}



function isShowingViewer() {
    return $("#"+PAPAYA_VIEWER_ID).length;
}



function getViewerDimensions() {
    var numAdditionalSections = 0;
    if (isShowingDisplay()) {
        numAdditionalSections++;
    }

    if (isShowingToolbar()) {
        numAdditionalSections++;
    }

    if (isShowingWarnings()) {
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



function resizeViewerComponents(resize) {
    var dims = getViewerDimensions();

    $("#"+PAPAYA_TOOLBAR_ID).css({paddingLeft: dims.widthPadding + "px"});
    $("#"+PAPAYA_TOOLBAR_ID).css({paddingBottom: PAPAYA_SPACING + "px"});

    $("#"+PAPAYA_VIEWER_ID).css({height: "100%"});
    $("#"+PAPAYA_VIEWER_ID).css({width: dims.width + "px"});
    $("#"+PAPAYA_VIEWER_ID).css({paddingLeft: dims.widthPadding + "px"});

    if (resize) {
        papayaMain.papayaViewer.resizeViewer(dims);
    }

    $("#"+PAPAYA_DISPLAY_ID).css({height: PAPAYA_SECTION_HEIGHT+"px"});
    $("#"+PAPAYA_DISPLAY_ID).css({paddingLeft: dims.widthPadding + "px"});
    papayaMain.papayaDisplay.canvas.width = dims.width;

    $("#"+PAPAYA_WARNINGS_ID).css({paddingLeft: dims.widthPadding + "px"});

    $("#"+PAPAYA_CONTAINER_ID).css({paddingTop: dims.heightPadding+"px"});

    if (papayaMain.papayaViewer.initialized) {
        papayaMain.papayaViewer.drawViewer(true);
    } else {
        papayaMain.papayaViewer.drawEmptyViewer();
        papayaMain.papayaDisplay.drawEmptyDisplay();
    }
}



papaya.viewer.Main.prototype.buildViewer = function() {
    if (isShowingViewer()) {
        var dims = getViewerDimensions();
        this.papayaViewer = new papaya.viewer.Viewer(dims.width, dims.height);
        $("#"+PAPAYA_VIEWER_ID).append($(this.papayaViewer.canvas));
    } else {
        alert("You are missing a viewer div!")
    }
}



papaya.viewer.Main.prototype.buildDisplay = function() {
    if (isShowingDisplay()) {
        var dims = getViewerDimensions();
        this.papayaDisplay = new papaya.viewer.Display(dims.width, PAPAYA_SECTION_HEIGHT);
        $("#"+PAPAYA_DISPLAY_ID).append($(this.papayaDisplay.canvas));
    }
}



papaya.viewer.Main.prototype.buildWarnings = function() {
    if (isShowingWarnings()) {
        $("#"+PAPAYA_WARNINGS_ID).addClass("warning").addClass("center");
        $("#"+PAPAYA_WARNINGS_ID).css({fontFamily: "sans-serif", fontSize: "14px", padding: "5px"});
    }
}



papaya.viewer.Main.prototype.buildToolbar = function() {
    if (isShowingToolbar()) {
        $("#"+PAPAYA_TOOLBAR_ID).append(
            '<button id="addImage">Open Image</button>\
            <button id="colorTable">Color Table</button>\
            \
            <div id="dialog">\
                <input type="hidden" autofocus="autofocus" />\
                <input type="file" id="files1" name="files" />\
                <input type="file" id="files2" name="files" />\
                <input type="file" id="files3" name="files" />\
                <input type="file" id="files4" name="files" />\
                <div id="selectFilesWarning" class="hidden warning">Please select a file!</div>\
            </div>\
            \
            <ul id="menu">\
                <li><a href="#">Grayscale</a></li>\
                <li><a href="#">Spectrum</a></li>\
                <li><a href="#">Hot-and-Cold</a></li>\
                <li><a href="#">Gold</a></li>\
                <li><a href="#">Red-to-White</a></li>\
            </ul>');

        $("#addImage").button().click(function() {
            return openAddImageMenu(this);
        });

        $("#colorTable").button().click(function() {
            return openColorTableMenu(this);
        });

        $("#dialog").dialog({
            autoOpen: false,
            position: {my: "left top", at: "left bottom", of: "#addImage"},
            dialogClass: 'noTitle',
            width: "400px",
            buttons: {
                Cancel: function() {
                    $("#selectFilesWarning").css({"visibility": "hidden"});
                    $(this).dialog("close");
                },
                "Open Sample Image": function() {
                    loadSampleImage();
                    $(this).dialog("close");
                },
                "Open Images": function() {
                    if (hasSelectedFiles()) {
                        papayaMain.papayaViewer.loadImage(document.getElementById('files1').files[0]);
                        $(this).dialog("close");
                    } else {
                        $("#selectFilesWarning").css({"visibility": "visible"});
                    }
                }
            }
        });

        $("#menu").css({
            zIndex : "100",
            width : "150px",
            position : "absolute"
        });

        $("#menu").menu({
            position: {
                my : "left top",
                at : "left bottom",
                of : "#colorTable" }
        });

        $("#menu").menu({
            select: function(event, ui) {
                papayaMain.papayaViewer.colorTableChanged(ui.item.children().html());
                $("#menu").hide();
            }
        });

        $("#menu").hide();
    }
}



function closeAllMenus() {
    $("#dialog").dialog("close");
    $("#menu").hide();
}



function openAddImageMenu(obj) {
    var dialog = $("#dialog");

    if (dialog.dialog("isOpen")) {
        dialog.dialog("close");
    } else {
        closeAllMenus();
        dialog.dialog("open");
    }

    return false;
}


function openColorTableMenu(obj) {
    var menu = $("#menu");

    if (menu.is(":visible")) {
        menu.hide();
    } else {
        closeAllMenus();

        menu.show().position({
            my: "left top",
            at: "left bottom",
            of: obj
        });
    }

    return false;
}



function hasSelectedFiles() {
    var hasFiles = (document.getElementById('files1').files.length > 0);
    hasFiles |= (document.getElementById('files2').files.length > 0);
    hasFiles |= (document.getElementById('files3').files.length > 0);
    hasFiles |= (document.getElementById('files4').files.length > 0);
    return hasFiles;
}



function loadSampleImage() {
    papayaMain.papayaViewer.loadImage(papaya.data.SampleImage.data, false, true);
    $("#dialog").dialog("close");
}



function main() {
    papayaMain = new papaya.viewer.Main();

    var loadUrl = $("#"+PAPAYA_VIEWER_ID).data("load-url");
    var loadEncoded = $("#"+PAPAYA_VIEWER_ID).data("load-encoded");

    if (loadUrl) {
        papayaMain.papayaViewer.loadImage(loadUrl, true, false);
    } else if (loadEncoded) {
        papayaMain.papayaViewer.loadImage(window[loadEncoded], false, true);
    }

    resizeViewerComponents(false);
}

window.onload = main;
window.onresize = function() { resizeViewerComponents(true) };
