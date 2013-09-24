
var papaya = papaya || {};
papaya.ui = papaya.ui || {};


papaya.ui.Toolbar = papaya.ui.Toolbar || function () { }

papaya.ui.Toolbar.SIZE = 22;

papaya.ui.Toolbar.MENU_DATA = {
    "menus": [
        {"label": "File", "icon": null,
            "items": [
                {"label": "Add Image...", "action": "OpenImage", "type": "button"},
                {"label": "Add Sample Image", "action": "OpenSampleImage", "exists": ["papaya", "data", "SampleImage"], "uninitialized": "true"},
                {"label": "Close All", "action": "CloseAllImages"}
            ]
        },
        {"label": "Options", "icon": null,
            "items": [
                {"label": "Preferences", "action": "Preferences"}
            ]
        }
    ]
};

papaya.ui.Toolbar.IMAGE_MENU_DATA = {
    "items": [
        {"label": "Image Info", "action": "ImageInfo"},
        {"label": "Range", "action": "ChangeRange", "type": "range", "method": "getRange"},
        {"label": "Color Table...", "action": "ColorTable",
            "items": [
                {"label": "Grayscale", "action": "ColorTable-Grayscale", "type": "checkbox", "method": "isUsingColorTable"},
                {"label": "Spectrum", "action": "ColorTable-Spectrum", "type": "checkbox", "method": "isUsingColorTable"},
                {"label": "Hot-and-Cold", "action": "ColorTable-Hot-and-Cold", "type": "checkbox", "method": "isUsingColorTable"},
                {"label": "Gold", "action": "ColorTable-Gold", "type": "checkbox", "method": "isUsingColorTable"},
                {"label": "Red-to-White", "action": "ColorTable-Red-to-White", "type": "checkbox", "method": "isUsingColorTable"},
                {"label": "Green-to-White", "action": "ColorTable-Green-to-White", "type": "checkbox", "method": "isUsingColorTable"},
                {"label": "Blue-to-White", "action": "ColorTable-Blue-to-White", "type": "checkbox", "method": "isUsingColorTable"},
                {"label": "Orange-to-White", "action": "ColorTable-Orange-to-White", "type": "checkbox", "method": "isUsingColorTable"},
                {"label": "Purple-to-White", "action": "ColorTable-Purple-to-White", "type": "checkbox", "method": "isUsingColorTable"}
            ]
        }
    ]
};

papaya.ui.Toolbar.PREFERENCES_DATA = {
    "items": [
        {"label": "Coordinate display of:", "field": "atlasLocks", "options":["Mouse", "Crosshairs"]},
        {"label": "Show crosshairs:", "field": "showCrosshairs", "options":["All", "Main", "Lower", "None"]}

    ]
};

papaya.ui.Toolbar.IMAGE_INFO_DATA = {
    "items": [
        {"label": "Filename:", "field": "getFilename", "readonly":"true"},
        {"label": "File Length:", "field": "getFileLength", "readonly":"true"},
        {"spacer": "true"},
        {"label": "Image Dims:", "field": "getImageDimensionsDescription", "readonly":"true"},
        {"label": "Voxel Dims:", "field": "getVoxelDimensionsDescription", "readonly":"true"},
        {"spacer": "true"},
        {"label": "Byte Type:", "field": "getByteTypeDescription", "readonly":"true"},
        {"label": "Byte Order:", "field": "getByteOrderDescription", "readonly":"true"},
        {"label": "Compressed:", "field": "getCompressedDescription", "readonly":"true"},
        {"spacer": "true"},
        {"label": "Orientation:", "field": "getOrientationDescription", "readonly":"true"},
        {"spacer": "true"},
        {"label": "Notes:", "field": "getImageDescription", "readonly":"true"}
    ]
};


papaya.ui.Toolbar.prototype.buildToolbar = function() {
    $(".menuIcon").remove();
    $(".menuLabel").remove();

    for (var ctr = 0; ctr < papaya.ui.Toolbar.MENU_DATA.menus.length; ctr++) {
        this.buildMenu(papaya.ui.Toolbar.MENU_DATA.menus[ctr], null, null, null, false);
    }
}


papaya.ui.Toolbar.prototype.buildMenu = function(menuData, topLevelButtonId, dataSource, modifier, right) {
    var menu = new papaya.ui.Menu(menuData.label, menuData.icon, bind(this, this.doAction), papayaMain.papayaViewer, modifier, right);

    if (topLevelButtonId) {
        menu.setMenuButton(topLevelButtonId)
    } else {
        topLevelButtonId = menu.buildMenuButton();
    }

    var items = menuData.items;
    if (items) {
        this.buildMenuItems(menu, items, topLevelButtonId, dataSource, modifier, right);
    }

    return menu;
}


papaya.ui.Toolbar.prototype.buildMenuItems = function(menu, itemData, topLevelButtonId, dataSource, modifier, right) {
    if (modifier == undefined) {
        modifier = "";
    }

    for (var ctrItems = 0; ctrItems < itemData.length; ctrItems++) {
        var item = null;

        if ((!itemData[ctrItems].uninitialized || !papayaMain.papayaViewer.initialized)
                && (!itemData[ctrItems].exists || fullyQualifiedVariableExists(itemData[ctrItems].exists))) {
            if (itemData[ctrItems].type == "checkbox") {
                item = new papaya.ui.MenuItemCheckBox(itemData[ctrItems].label, itemData[ctrItems].action, bind(this, this.doAction), dataSource, itemData[ctrItems].method, modifier);
            } else if (itemData[ctrItems].type == "button") {
                item = new papaya.ui.MenuItemFileChooser(itemData[ctrItems].label, itemData[ctrItems].action, bind(this, this.doAction));
            } else if (itemData[ctrItems].type == "range") {
                item = new papaya.ui.MenuItemRange(itemData[ctrItems].label, itemData[ctrItems].action, bind(this, this.doAction), dataSource, itemData[ctrItems].method, modifier);
            } else {
                item = new papaya.ui.MenuItem(itemData[ctrItems].label, itemData[ctrItems].action, bind(this, this.doAction), modifier);
            }

            menu.addMenuItem(item);

            if (itemData[ctrItems].items) {
                var menu = this.buildMenu(itemData[ctrItems], topLevelButtonId, dataSource, modifier, right);
                item.callback = bind(menu, menu.showMenu);
            }
        }
    }
}


papaya.ui.Toolbar.prototype.updateImageButtons = function() {
    $(".imageButton").remove();

    for (var ctr = papayaMain.papayaViewer.screenVolumes.length - 1; ctr >= 0; ctr--) {
        var screenVol = papayaMain.papayaViewer.screenVolumes[ctr];
        var dataUrl = screenVol.colorTable.icon;

        var data = {
            "menus" : [
                {"label": "ImageButton", "icon": dataUrl, "items": null}
            ]
        };
        data.menus[0].items = papaya.ui.Toolbar.IMAGE_MENU_DATA.items;

        this.buildMenu(data.menus[0], null, screenVol, ""+ctr, true);
    }
}


papaya.ui.Toolbar.prototype.closeAllMenus = function() {
    $(".menu").hide(100);
    $(".menu").remove();

    $(".modalDialog").hide(100);
    $(".modalDialog").remove();
    $("#"+PAPAYA_CONTAINER_ID).removeClass("modalBackground");
}


papaya.ui.Toolbar.prototype.doAction = function(action, file, keepopen) {
    if (!keepopen) {
        this.closeAllMenus();
    }

    if (action) {
        if (action.startsWith("ImageButton")) {
            var imageIndex = parseInt(action.substring(action.length - 1));
            papayaMain.papayaViewer.setCurrentScreenVol(imageIndex);
            this.updateImageButtons();
        } else  if (action == "OpenSampleImage") {
            if (typeof papaya.data.SampleImage['data'] != 'undefined') {
                papayaMain.papayaViewer.loadImage(papaya.data.SampleImage.data, false, true, papaya.data.SampleImage.name);
            } else if (typeof papaya.data.SampleImage['image'] != 'undefined') {
                papayaMain.papayaViewer.loadImage(papaya.data.SampleImage.image, true, false);
            }
        } else if (action == "OpenImage") {
            papayaMain.papayaViewer.loadImage(file);
        } else if (action.startsWith("ColorTable")) {
            var colorTableName = action.substring(action.indexOf("-")+1, action.lastIndexOf("-"));
            var imageIndex = action.substring(action.lastIndexOf("-")+1);
            papayaMain.papayaViewer.screenVolumes[imageIndex].changeColorTable(colorTableName);
            this.updateImageButtons();
        } else if (action.startsWith("CloseAllImages")) {
            papayaMain.papayaViewer.resetViewer();
            this.updateImageButtons();
        } else if (action == "Preferences") {
            var dialog = new papaya.ui.Dialog("Preferences", papaya.ui.Toolbar.PREFERENCES_DATA, papayaMain.preferences, bind(papayaMain.preferences, papayaMain.preferences.updatePreference));
            dialog.showDialog();
        } else if (action.startsWith("ImageInfo")) {
            var imageIndex = action.substring(action.lastIndexOf("-")+1);
            var dialog = new papaya.ui.Dialog("Image Info", papaya.ui.Toolbar.IMAGE_INFO_DATA, papayaMain.papayaViewer, null, ""+imageIndex);
            dialog.showDialog();
        }
    }
}
