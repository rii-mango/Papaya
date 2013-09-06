
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



papaya.viewer.Main.prototype.buildViewer = function() {
    if ($("#"+PAPAYA_VIEWER_ID).length) {
        var width = PAPAYA_DEFAULT_HEIGHT * 1.5;
        this.papayaViewer = new papaya.viewer.Viewer(width, PAPAYA_DEFAULT_HEIGHT);
        $("#"+PAPAYA_VIEWER_ID).append($(this.papayaViewer.canvas));
        $("#"+PAPAYA_VIEWER_ID).css({height: PAPAYA_DEFAULT_HEIGHT+"px"});
    } else {
        alert("You are missing a viewer div!")
    }
}



papaya.viewer.Main.prototype.buildDisplay = function() {
    if ($("#"+PAPAYA_DISPLAY_ID).length) {
        var width = PAPAYA_DEFAULT_HEIGHT * 1.5;
        this.papayaDisplay = new papaya.viewer.Display(width, PAPAYA_DISPLAY_HEIGHT);
        $("#"+PAPAYA_DISPLAY_ID).append($(this.papayaDisplay.canvas));
        $("#"+PAPAYA_DISPLAY_ID).css({height: PAPAYA_DISPLAY_HEIGHT+"px"});
    }
}



papaya.viewer.Main.prototype.buildWarnings = function() {
    if ($("#"+PAPAYA_WARNINGS_ID).length) {
        $("#"+PAPAYA_WARNINGS_ID).addClass("warning").addClass("center");
        $("#"+PAPAYA_WARNINGS_ID).css({fontFamily: "sans-serif", fontSize: "14px", padding: "5px"});
    }
}



papaya.viewer.Main.prototype.buildToolbar = function() {
    if ($("#"+PAPAYA_TOOLBAR_ID).length) {
        $("#"+PAPAYA_TOOLBAR_ID).append(
            '<button id="addImage">Add Images</button>\
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
            </ul>');

        $("#addImage").button().click(function() {
            return openAddImageMenu(this);
        });

        $("#colorTable").button().click(function() {
            return openColorTableMenu(this);
        });

        $("#dialog").dialog({
            autoOpen: false,
            position: {my: "left top", at: "left top", of: "#papayaViewer"},
            dialogClass: 'noTitle',
            width: "400px",
            buttons: {
                Cancel: function() {
                    $("#selectFilesWarning").css({"visibility": "hidden"});
                    $(this).dialog("close");
                },
                Load: function() {
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



function main() {
    papayaMain = new papaya.viewer.Main();
};

window.onload = main;
