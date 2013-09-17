
var papaya = papaya || {};
papaya.viewer = papaya.viewer || {};

var papayaMain = null;


papaya.viewer.Main = papaya.viewer.Main || function() {
    this.buildViewer();
    this.buildDisplay();
    this.buildToolbar();
}



papaya.viewer.Main.CHECKBOX_UNSELECTED_CODE = "&#9744;";
papaya.viewer.Main.CHECKBOX_SELECTED_CODE = "&#9745;";


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
    var dims = getViewerDimensions();

    $("#"+PAPAYA_TOOLBAR_ID).css({paddingLeft: dims.widthPadding + "px"});
    $("#"+PAPAYA_TOOLBAR_ID).css({paddingBottom: PAPAYA_SPACING + "px"});
    $("#"+PAPAYA_TOOLBAR_ID).css({width: dims.width + "px"});

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
    if (isShowingToolbar()) {
        $("#"+PAPAYA_TOOLBAR_ID).append(
            '<button id="addImage">Open</button>\
            \
            <div id="dialog">\
                <input type="hidden" autofocus="autofocus" />\
                <input type="file" id="files1" name="files" />\
                <input type="file" id="files2" name="files" />\
                <input type="file" id="files3" name="files" />\
                <input type="file" id="files4" name="files" />\
                <div id="selectFilesWarning" class="hidden warning">Please select a file!</div>\
            </div>');

        $("#addImage").button().click(function() {
            return openAddImageMenu(this);
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
    }
}



papaya.viewer.Main.prototype.updateImageButtons = function() {
    $(".imageButtons").remove();

    for (var ctr =  papayaMain.papayaViewer.screenVolumes.length - 1; ctr >= 0; ctr--) {
        var screenVol = papayaMain.papayaViewer.screenVolumes[ctr];
        var dataUrl = screenVol.colorTable.icon;
        var imageId = "imageButtonImg" + ctr;
        var imageButtonId = "imageButton" + ctr;
        var imageButtonMenuId = "imageButtonMenu" + ctr;
        var imageButtonColorMenuId = "imageButtonColorMenu" + ctr;

        $("#"+PAPAYA_TOOLBAR_ID).append(
            "<span class='imageButtons' id='" + imageButtonId + "' style='float:right'>" +
                "<img id='" + imageId + "' style='margin:2px; padding:0; width:" + papaya.viewer.ColorTable.ICON_SIZE + "px; height:" + papaya.viewer.ColorTable.ICON_SIZE + "px; vertical-align:bottom; border:2px outset;' src='" + dataUrl + "' />" +
            "</span>" +
            "<ul class='menu' id='" + imageButtonMenuId +"'>" +
                "<li><span class='unselectable'>Image Info</span></li>" +
                "<li><span class='unselectable' onclick='openSubMenu(\"" + imageId + "\",\"" + imageButtonColorMenuId + "\")'>Color Table...</span></li>" +
            "</ul>" +
            "<ul class='menu checkboxmenu' id=" + imageButtonColorMenuId + ">" +
                "<li><span class='bullet'>"+papaya.viewer.Main.CHECKBOX_UNSELECTED_CODE+"</span><span class='unselectable'>Grayscale</span></li>" +
                "<li><span class='bullet'>"+papaya.viewer.Main.CHECKBOX_UNSELECTED_CODE+"</span><span class='unselectable'>Spectrum</span></li>" +
                "<li><span class='bullet'>"+papaya.viewer.Main.CHECKBOX_UNSELECTED_CODE+"</span><span class='unselectable'>Hot-and-Cold</span></li>" +
                "<li><span class='bullet'>"+papaya.viewer.Main.CHECKBOX_UNSELECTED_CODE+"</span><span class='unselectable'>Gold</span></li>" +
                "<li><span class='bullet'>"+papaya.viewer.Main.CHECKBOX_UNSELECTED_CODE+"</span><span class='unselectable'>Red-to-White</span></li>" +
                "<li><span class='bullet'>"+papaya.viewer.Main.CHECKBOX_UNSELECTED_CODE+"</span><span class='unselectable'>Green-to-White</span></li>" +
                "<li><span class='bullet'>"+papaya.viewer.Main.CHECKBOX_UNSELECTED_CODE+"</span><span class='unselectable'>Blue-to-White</span></li>" +
                "<li><span class='bullet'>"+papaya.viewer.Main.CHECKBOX_UNSELECTED_CODE+"</span><span class='unselectable'>Orange-to-White</span></li>" +
                "<li><span class='bullet'>"+papaya.viewer.Main.CHECKBOX_UNSELECTED_CODE+"</span><span class='unselectable'>Purple-to-White</span></li>" +
            "</ul>"
        );

        $("#"+imageButtonId + " > img").mousedown(function() {
            $(this).css({ 'border': '2px solid gray' });
        });

        $("#"+imageButtonId + " > img").mouseup(function() {
            $(this).css({ 'border': '2px outset' });
            openMenu(this, imageButtonMenuId, "right");
        });

        $('.checkboxmenu > li').click(function(){
            if ($(this).children(".bullet").html().charCodeAt() == 9744) {
                $(this).children(".bullet").html(papaya.viewer.Main.CHECKBOX_SELECTED_CODE);
            } else {
                $(this).children(".bullet").html(papaya.viewer.Main.CHECKBOX_UNSELECTED_CODE);
            }
        });

        $("#"+imageButtonMenuId).hide();
        $("#"+imageButtonColorMenuId).hide();
    }
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



function loadSampleImage() {
    papayaMain.papayaViewer.loadImage(papaya.data.SampleImage.data, false, true);
    $("#dialog").dialog("close");
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
