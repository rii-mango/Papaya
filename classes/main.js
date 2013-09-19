
var papaya = papaya || {};
papaya.viewer = papaya.viewer || {};

var papayaMain = null;


papaya.viewer.Main = papaya.viewer.Main || function() {
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



papaya.viewer.Main.prototype.buildToolbar = function() {
    this.papayaToolbar = new papaya.ui.Toolbar();
    this.papayaToolbar.buildToolbar();
}



function closeAllMenus() {
    $("#dialog").dialog("close");
    $(".menu").hide();
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


function openSubMenu(buttonId, id) {
    var button = $("#"+buttonId);
    openMenu(button, id, "right");

}



function openMenu(button, id, direction) {
    var menu = $("#"+id);

    if (menu.is(":visible")) {
        menu.hide();
    } else {
        closeAllMenus();

        menu.show().position({
            my: direction + " top",
            at: direction + "+1 bottom+3",
            of: button
        });
    }

    return false;
}



function menuSelected(action) {
    if (action == "Grayscale") {
        papayaMain.papayaViewer.colorTableChanged("Grayscale");
    } else if (action == "Spectrum") {
        papayaMain.papayaViewer.colorTableChanged("Spectrum");
    } else if (action == "Hot-and-Cold") {
        papayaMain.papayaViewer.colorTableChanged("Hot-and-Cold");
    } else if (action == "Gold") {
        papayaMain.papayaViewer.colorTableChanged("Gold");
    } else if (action == "Red-to-White") {
        papayaMain.papayaViewer.colorTableChanged("Red-to-White");
    } else if (action == "Green-to-White") {
        papayaMain.papayaViewer.colorTableChanged("Green-to-White");
    } else if (action == "Blue-to-White") {
        papayaMain.papayaViewer.colorTableChanged("Blue-to-White");
    } else if (action == "Orange-to-White") {
        papayaMain.papayaViewer.colorTableChanged("Orange-to-White");
    } else if (action == "Purple-to-White") {
        papayaMain.papayaViewer.colorTableChanged("Purple-to-White");
    }
}




function hasSelectedFiles() {
    var hasFiles = (document.getElementById('files1').files.length > 0);
    hasFiles |= (document.getElementById('files2').files.length > 0);
    hasFiles |= (document.getElementById('files3').files.length > 0);
    hasFiles |= (document.getElementById('files4').files.length > 0);
    return hasFiles;
}







function main() {
    papayaMain = new papaya.viewer.Main();

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
