
/*jslint browser: true, node: true */
/*global $, bind, papayaMain, fullyQualifiedVariableExists, PAPAYA_CONTAINER_ID */

"use strict";

var papaya = papaya || {};
papaya.ui = papaya.ui || {};



papaya.ui.Toolbar = papaya.ui.Toolbar || function () {};



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
        {"label": "Coordinate display of:", "field": "atlasLocks", "options": ["Mouse", "Crosshairs"]},
        {"label": "Show crosshairs:", "field": "showCrosshairs", "options": ["All", "Main", "Lower", "None"]}

    ]
};

papaya.ui.Toolbar.IMAGE_INFO_DATA = {
    "items": [
        {"label": "Filename:", "field": "getFilename", "readonly": "true"},
        {"label": "File Length:", "field": "getFileLength", "readonly": "true"},
        {"spacer": "true"},
        {"label": "Image Dims:", "field": "getImageDimensionsDescription", "readonly": "true"},
        {"label": "Voxel Dims:", "field": "getVoxelDimensionsDescription", "readonly": "true"},
        {"spacer": "true"},
        {"label": "Byte Type:", "field": "getByteTypeDescription", "readonly": "true"},
        {"label": "Byte Order:", "field": "getByteOrderDescription", "readonly": "true"},
        {"label": "Compressed:", "field": "getCompressedDescription", "readonly": "true"},
        {"spacer": "true"},
        {"label": "Orientation:", "field": "getOrientationDescription", "readonly": "true"},
        {"spacer": "true"},
        {"label": "Notes:", "field": "getImageDescription", "readonly": "true"}
    ]
};



papaya.ui.Toolbar.prototype.buildToolbar = function () {
    var ctr;

    $(".menuIcon").remove();
    $(".menuLabel").remove();

    for (ctr = 0; ctr < papaya.ui.Toolbar.MENU_DATA.menus.length; ctr += 1) {
        this.buildMenu(papaya.ui.Toolbar.MENU_DATA.menus[ctr], null, null, null, false);
    }
};



papaya.ui.Toolbar.prototype.buildMenu = function (menuData, topLevelButtonId, dataSource, modifier, right) {
    var menu, items;

    menu = new papaya.ui.Menu(menuData.label, menuData.icon, bind(this, this.doAction), papayaMain.papayaViewer, modifier, right);

    if (topLevelButtonId) {
        menu.setMenuButton(topLevelButtonId);
    } else {
        topLevelButtonId = menu.buildMenuButton();
    }

    items = menuData.items;
    if (items) {
        this.buildMenuItems(menu, items, topLevelButtonId, dataSource, modifier, right);
    }

    return menu;
};



papaya.ui.Toolbar.prototype.buildMenuItems = function (menu, itemData, topLevelButtonId, dataSource, modifier, right) {
    var ctrItems, item, menu2;

    if (modifier === undefined) {
        modifier = "";
    }

    for (ctrItems = 0; ctrItems < itemData.length; ctrItems += 1) {
        item = null;

        if ((!itemData[ctrItems].uninitialized || !papayaMain.papayaViewer.initialized)
                && (!itemData[ctrItems].exists || fullyQualifiedVariableExists(itemData[ctrItems].exists))) {
            if (itemData[ctrItems].type === "checkbox") {
                item = new papaya.ui.MenuItemCheckBox(itemData[ctrItems].label, itemData[ctrItems].action, bind(this, this.doAction), dataSource, itemData[ctrItems].method, modifier);
            } else if (itemData[ctrItems].type === "button") {
                item = new papaya.ui.MenuItemFileChooser(itemData[ctrItems].label, itemData[ctrItems].action, bind(this, this.doAction));
            } else if (itemData[ctrItems].type === "range") {
                item = new papaya.ui.MenuItemRange(itemData[ctrItems].label, itemData[ctrItems].action, bind(this, this.doAction), dataSource, itemData[ctrItems].method, modifier);
            } else {
                item = new papaya.ui.MenuItem(itemData[ctrItems].label, itemData[ctrItems].action, bind(this, this.doAction), modifier);
            }

            menu.addMenuItem(item);

            if (itemData[ctrItems].items) {
                menu2 = this.buildMenu(itemData[ctrItems], topLevelButtonId, dataSource, modifier, right);
                item.callback = bind(menu2, menu2.showMenu);
            }
        }
    }
};



papaya.ui.Toolbar.prototype.updateImageButtons = function () {
    var ctr, screenVol, dataUrl, data;

    $(".imageButton").remove();

    for (ctr = papayaMain.papayaViewer.screenVolumes.length - 1; ctr >= 0; ctr -= 1) {
        screenVol = papayaMain.papayaViewer.screenVolumes[ctr];
        dataUrl = screenVol.colorTable.icon;

        data = {
            "menus" : [
                {"label": "ImageButton", "icon": dataUrl, "items": null}
            ]
        };
        data.menus[0].items = papaya.ui.Toolbar.IMAGE_MENU_DATA.items;

        this.buildMenu(data.menus[0], null, screenVol, ctr.toString(), true);
    }
};



papaya.ui.Toolbar.prototype.closeAllMenus = function () {
    var menuHtml, modalDialogHtml;

    menuHtml = $(".menu");
    menuHtml.hide(100);
    menuHtml.remove();

    modalDialogHtml = $(".modalDialog");
    modalDialogHtml.hide(100);
    modalDialogHtml.remove();

    $("#" + PAPAYA_CONTAINER_ID).removeClass("modalBackground");
};



papaya.ui.Toolbar.prototype.doAction = function (action, file, keepopen) {
    var imageIndex, colorTableName, dialog, papayaDataSampleImageDataType, papayaDataSampleImageImageType;

    if (!keepopen) {
        this.closeAllMenus();
    }

    papayaDataSampleImageDataType = (typeof papaya.data.SampleImage.data);
    papayaDataSampleImageImageType = (typeof papaya.data.SampleImage.image);

    if (action) {
        if (action.startsWith("ImageButton")) {
            imageIndex = parseInt(action.substring(action.length - 1), 10);
            papayaMain.papayaViewer.setCurrentScreenVol(imageIndex);
            this.updateImageButtons();
        } else if (action === "OpenSampleImage") {
            if (papayaDataSampleImageDataType !== 'undefined') {
                papayaMain.papayaViewer.loadImage(papaya.data.SampleImage.data, false, true, papaya.data.SampleImage.name);
            } else if (papayaDataSampleImageImageType !== 'undefined') {
                papayaMain.papayaViewer.loadImage(papaya.data.SampleImage.image, true, false);
            }
        } else if (action === "OpenImage") {
            papayaMain.papayaViewer.loadImage(file);
        } else if (action.startsWith("ColorTable")) {
            colorTableName = action.substring(action.indexOf("-") + 1, action.lastIndexOf("-"));
            imageIndex = action.substring(action.lastIndexOf("-") + 1);
            papayaMain.papayaViewer.screenVolumes[imageIndex].changeColorTable(colorTableName);
            this.updateImageButtons();
        } else if (action.startsWith("CloseAllImages")) {
            papayaMain.papayaViewer.resetViewer();
            this.updateImageButtons();
        } else if (action === "Preferences") {
            dialog = new papaya.ui.Dialog("Preferences", papaya.ui.Toolbar.PREFERENCES_DATA, papayaMain.preferences, bind(papayaMain.preferences, papayaMain.preferences.updatePreference));
            dialog.showDialog();
        } else if (action.startsWith("ImageInfo")) {
            imageIndex = action.substring(action.lastIndexOf("-") + 1);
            dialog = new papaya.ui.Dialog("Image Info", papaya.ui.Toolbar.IMAGE_INFO_DATA, papayaMain.papayaViewer, null, imageIndex.toString());
            dialog.showDialog();
        }
    }
};
