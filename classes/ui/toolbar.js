
var papaya = papaya || {};
papaya.ui = papaya.ui || {};


papaya.ui.Toolbar = papaya.ui.Toolbar || function () {

}

papaya.ui.Toolbar.SIZE = 22;
papaya.ui.Toolbar.MENU_DATA = {
    "menus": [
        {"label": "Open", "icon": null,
            "items": [
                {"label": "Open Sample Image", "action": "OpenSampleImage"}
            ]
        },
        {"label": "Options", "icon": null,
            "items": [
                {"label": "Test Item", "action": "TestItem"},
                {"label": "Test Item 2", "action": "TestItem2",
                    "items": [
                        {"label": "Test Sub Menu 1", "action": "TestSubMenu1"},
                        {"label": "Test Sub Menu 2", "action": "TestSubMenu2"}
                    ]
                }
            ]
        }
    ]
};

papaya.ui.Toolbar.IMAGE_MENU_DATA = {
    "items": [
        {"label": "Image Info", "action": "ImageInfo"},
        {"label": "Color Table", "action": "ColorTable",
            "items": [
                {"label": "Grayscale", "action": "ColorTable-Grayscale", "type": "checkbox"},
                {"label": "Spectrum", "action": "ColorTable-Spectrum", "type": "checkbox"},
                {"label": "Hot-and-Cold", "action": "ColorTable-Hot-and-Cold", "type": "checkbox"},
                {"label": "Gold", "action": "ColorTable-Gold", "type": "checkbox"},
                {"label": "Red-to-White", "action": "ColorTable-Red-to-White", "type": "checkbox"},
                {"label": "Green-to-White", "action": "ColorTable-Green-to-White", "type": "checkbox"},
                {"label": "Blue-to-White", "action": "ColorTable-Blue-to-White", "type": "checkbox"},
                {"label": "Orange-to-White", "action": "ColorTable-Orange-to-White", "type": "checkbox"},
                {"label": "Purple-to-White", "action": "ColorTable-Purple-to-White", "type": "checkbox"}
            ]
        }
    ]
};


papaya.ui.Toolbar.prototype.buildToolbar = function() {
    for (var ctr = 0; ctr < papaya.ui.Toolbar.MENU_DATA.menus.length; ctr++) {
        this.buildMenu(papaya.ui.Toolbar.MENU_DATA.menus[ctr]);
    }
}




papaya.ui.Toolbar.prototype.buildMenu = function(menuData, topLevelButtonId, dataSource, modifier) {
    var menu = new papaya.ui.Menu(menuData.label, menuData.icon, bind(this, this.closeAllMenus));

    if (topLevelButtonId) {
        menu.setMenuButton(topLevelButtonId)
    } else {
        topLevelButtonId = menu.buildMenuButton();
    }

    var items = menuData.items;
    if (items) {
        this.buildMenuItems(menu, items, topLevelButtonId, dataSource, modifier);
    }

    return menu;
}



papaya.ui.Toolbar.prototype.buildMenuItems = function(menu, itemData, topLevelButtonId, dataSource, modifier) {
    if (modifier == undefined) {
        modifier = "";
    }

    for (var ctrItems = 0; ctrItems < itemData.length; ctrItems++) {
        var item = null;

        if (itemData[ctrItems].type == "checkbox") {
            item = new papaya.ui.MenuItemCheckBox(itemData[ctrItems].label, itemData[ctrItems].action, bind(this, this.doAction), dataSource, modifier);
        } else {
            item = new papaya.ui.MenuItem(itemData[ctrItems].label, itemData[ctrItems].action, bind(this, this.doAction));
        }

        menu.addMenuItem(item);

        if (itemData[ctrItems].items) {
            var menu = this.buildMenu(itemData[ctrItems], topLevelButtonId, dataSource, modifier);
            item.callback = bind(menu, menu.showMenu);
        }
    }
}



papaya.ui.Toolbar.prototype.updateImageButtons = function() {
    $(".imageButton").remove();

    for (var ctr = papayaMain.papayaViewer.screenVolumes.length - 1; ctr >= 0; ctr--) {
        var screenVol = papayaMain.papayaViewer.screenVolumes[ctr];
        var dataUrl = screenVol.colorTable.icon;
        var imageId = "imageButtonImg" + ctr;

        var data = {
            "menus" : [
                {"label": imageId, "icon": dataUrl, "items": null}
            ]
        };
        data.menus[0].items = papaya.ui.Toolbar.IMAGE_MENU_DATA.items;

        this.buildMenu(data.menus[0], null, bind(screenVol, screenVol.isUsingColorTable), ctr);
    }
}



papaya.ui.Toolbar.prototype.closeAllMenus = function() {
    $(".menu").hide();
}



papaya.ui.Toolbar.prototype.doAction = function(action) {
    this.closeAllMenus();

    if (action == "OpenSampleImage") {
        papayaMain.papayaViewer.loadImage(papaya.data.SampleImage.data, false, true);
    } else if (action.startsWith("ColorTable")) {
        var colorTableName = action.substring(action.indexOf("-")+1, action.lastIndexOf("-"));
        var imageIndex = action.substring(action.lastIndexOf("-")+1);

        papayaMain.papayaViewer.screenVolumes[imageIndex].changeColorTable(colorTableName);
    }
}
