
/*jslint browser: true, node: true */
/*global $, bind, PAPAYA_TITLEBAR_CLASS_NAME */

"use strict";

var papaya = papaya || {};
papaya.ui = papaya.ui || {};

var papayaLoadableImages = papayaLoadableImages || [];

papaya.ui.Toolbar = papaya.ui.Toolbar || function (container) {
    this.container = container;
    this.viewer = container.viewer;
    this.imageMenus = null;
};



papaya.ui.Toolbar.SIZE = 22;

// http://dataurl.net/#dataurlmaker
papaya.ui.Toolbar.ICON_IMAGESPACE = "data:image/gif;base64,R0lGODlhFAAUAPcAMf//////GP///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////2f/ZNbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1qWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpVpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEAACoALAAAAAAUABQAAAipAFUIHEiwoMB/A1coXLiwisOHVf4hVLFCosWLGC9SzMgR48Z/VEJSUVjFj0mTESdWBCmS5EmU/6oIXCly5IqSLx/OlFjT5Us/DneybIkzp8yPDElChCjwj8Q/UKOqmkqVatOnUaGqmsaVq1UVTv+lGjv2z9SuXlVdFUs2ldmtaKeubev2bFy1YCXSfYt2mty8/6CS5XtXRcasVRMftJj1beK/hicanKwiIAA7";
papaya.ui.Toolbar.ICON_WORLDSPACE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAVCAYAAACpF6WWAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAplJREFUeNqM1H1ozVEcx/Hr3p+7O08jQzbzMErznEItK0+Fv0Ye/tki20ia//wn+YMSaXkoEiKkkCVKZhOipsnDstnFagzlrmGMNfeO6/Nd71unu2s59bq7O517ft/z/X7Pz+dLPUbLJrkqX+SbdEubfJZK2cC6PiOQYm61HJcpkintEpcmCcpryZV5spaHhvvbdJ9slsPyU67wgPlEli0X5aiMkMeyXSbKnVRRVxDRRtkm5czbZrv5vkgu8z1P9stWfleRHGkhT3xCLu1YzZIjpfKWnA6VEn43mwcWEaWlo1Ve2YZj5Jms53iP5BjFsFz9lg/yDj0U7JbslFpZQyBP2a83khoiLiWPA/h/OVGOk+GwnJ5y1iyRS5Im1VLm18cKOc+CYrlGjnxUuZPIOlAn0yWdNXdlrMyRE7LM00eBjBT7niFVTvHsKJ8k6sw1yC4ZIl0EUMOcRT/X44v14xEZSBWfk+d8NpzKujgPGiYrOXI+XTGeGtjpewtjm16Qh3JT3sgvickfNo4yF6V4PVyE2wQUZvP7FmmIa/iDIpwkHRPkrC2iEIlhEZ2mtarIsz3sOoX0PPrP7nAWPRYjj51E85JiJEYO0VsfR5hL5wZal3T7aZl10kLiEyNEHtOSbt4g/gaduRjzC+S9RwtZ332XBxQpzGZ+p72SR5BumUYHLaaDSiySUXKPig6Wj+SmjX5s4BQB0pFBQVo4dhenspfKC1kaYLKVa9pOAW5Q2Ww2qeU92kHbzZRDvK2sBSfLDLtNUp/82rOj7nDm9tJi7lhoeWNzG7Pkqxz8R5p8ByhcGVd0CzkOOWv28KBJvNGa+V2/Y5U08vQm8mgvmTNyjpxHSFUj6/9rZPKerGSTuCPCi7qIdX3GXwEGAPFYt+/OgAXDAAAAAElFTkSuQmCC";

papaya.ui.Toolbar.MENU_DATA = {
    "menus": [
        {"label": "File", "icons": null,
            "items": [
                {"label": "Add Image...", "action": "OpenImage", "type": "button"},
                {"type": "spacer"},
                {"type": "spacer"},
                {"label": "Close All", "action": "CloseAllImages"}
            ]
            },
        {"label": "Options", "icons": null,
            "items": [
                {"label": "Preferences", "action": "Preferences"}
            ]
            },
        {"label": "", "icons": null, "titleBar": "true" },
        {"label": "SPACE", "icons": [papaya.ui.Toolbar.ICON_IMAGESPACE, papaya.ui.Toolbar.ICON_WORLDSPACE], "items": [], "menuOnHover": true }
    ]
};

papaya.ui.Toolbar.IMAGE_MENU_DATA = {
    "items": [
        {"label": "Image Info", "action": "ImageInfo"},
        {"label": "Range", "action": "ChangeRange", "type": "range", "method": "getRange"},
        {"label": "Color Table...", "action": "ColorTable", "items": [] }
    ]
};

papaya.ui.Toolbar.PREFERENCES_DATA = {
    "items": [
        {"label": "Coordinate display of:", "field": "atlasLocks", "options": ["Mouse", "Crosshairs"]},
        {"label": "Show crosshairs:", "field": "showCrosshairs", "options": ["All", "Main", "Lower", "None"]},
        {"label": "Show orientation:", "field": "showOrientation", "options": ["Yes", "No"]},
        {"label": "Scroll wheel behavior:", "field": "scrollBehavior", "options": ["Zoom", "Increment Slice"], "disabled": "container.nestedViewer"}
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

    this.container.toolbarHtml.find(".menuIcon").remove();
    this.container.toolbarHtml.find(".menuLabel").remove();
    this.container.toolbarHtml.find(".menuTitle").remove();

    this.buildOpenMenuItems();

    for (ctr = 0; ctr < papaya.ui.Toolbar.MENU_DATA.menus.length; ctr += 1) {
        this.buildMenu(papaya.ui.Toolbar.MENU_DATA.menus[ctr], null, this.viewer, null);
    }

    this.buildAtlasMenu();
    this.buildColorMenuItems();

    this.container.titlebarHtml = this.container.containerHtml.find("." + PAPAYA_TITLEBAR_CLASS_NAME);
};



papaya.ui.Toolbar.prototype.buildAtlasMenu = function () {
    if (papaya.data) {
        if (papaya.data.Atlas) {
            var items = papaya.ui.Toolbar.MENU_DATA.menus[papaya.ui.Toolbar.MENU_DATA.menus.length - 1].items;

            items[0] = {"label": papaya.data.Atlas.labels.atlas.header.name, "action": "AtlasChanged-" + papaya.data.Atlas.labels.atlas.header.name, "type": "checkbox", "method": "isUsingAtlas"};

            if (papaya.data.Atlas.labels.atlas.header.transformedname) {
                items[1] = {"label": papaya.data.Atlas.labels.atlas.header.transformedname, "action": "AtlasChanged-" + papaya.data.Atlas.labels.atlas.header.transformedname, "type": "checkbox", "method": "isUsingAtlas"};
            }
        }
    }
};


papaya.ui.Toolbar.prototype.buildColorMenuItems = function () {
    var items, ctr, allColorTables, item, screenParams;

    screenParams = this.container.params.luts;
    if (screenParams) {
        for (ctr = 0; ctr < screenParams.length; ctr += 1) {
            papaya.viewer.ColorTable.addCustomLUT(screenParams[ctr]);
        }
    }

    allColorTables = papaya.viewer.ColorTable.TABLE_ALL;
    items = papaya.ui.Toolbar.IMAGE_MENU_DATA.items;

    for (ctr = 0; ctr < items.length; ctr += 1) {
        if (items[ctr].label === "Color Table...") {
            items = items[ctr].items;
            break;
        }
    }

    for (ctr = 0; ctr < allColorTables.length; ctr += 1) {
        item = {"label": allColorTables[ctr].name, "action": "ColorTable-" + allColorTables[ctr].name, "type": "checkbox", "method": "isUsingColorTable"};
        items[ctr] = item;
    }
};



papaya.ui.Toolbar.prototype.buildOpenMenuItems = function () {
    var ctr, items, menuItemName;

    for (ctr = 0; ctr < papaya.ui.Toolbar.MENU_DATA.menus.length; ctr += 1) {
        if (papaya.ui.Toolbar.MENU_DATA.menus[ctr].label === "File") {
            items = papaya.ui.Toolbar.MENU_DATA.menus[ctr].items;
            break;
        }
    }

    for (ctr = 0; ctr < papayaLoadableImages.length; ctr += 1) {
        if (!papayaLoadableImages[ctr].hide) {
            menuItemName = "Add " + papayaLoadableImages[ctr].nicename;
            if (!this.menuContains(items, menuItemName)) {
                items.splice(2, 0, {"label": menuItemName, "action": "Open-" + papayaLoadableImages[ctr].name});
            }
        }
    }
};



papaya.ui.Toolbar.prototype.menuContains = function (menuItems, name) {
    var ctr;

    for (ctr = 0; ctr < menuItems.length; ctr += 1) {
        if (menuItems[ctr].label === name) {
            return true;
        }
    }

    return false;
};



papaya.ui.Toolbar.prototype.buildMenu = function (menuData, topLevelButtonId, dataSource, modifier) {
    var menu, items;

    menu = new papaya.ui.Menu(this.viewer, menuData, bind(this, this.doAction), this.viewer, modifier);

    if (topLevelButtonId) {
        menu.setMenuButton(topLevelButtonId);
    } else {
        topLevelButtonId = menu.buildMenuButton();
    }

    items = menuData.items;
    if (items) {
        this.buildMenuItems(menu, items, topLevelButtonId, dataSource, modifier);
    }

    return menu;
};



papaya.ui.Toolbar.prototype.buildMenuItems = function (menu, itemData, topLevelButtonId, dataSource, modifier) {
    var ctrItems, item, menu2;

    if (modifier === undefined) {
        modifier = "";
    }

    for (ctrItems = 0; ctrItems < itemData.length; ctrItems += 1) {
        item = null;

        if (itemData[ctrItems].type === "spacer") {
            item = new papaya.ui.MenuItemSpacer();
        } else if (itemData[ctrItems].type === "checkbox") {
            item = new papaya.ui.MenuItemCheckBox(this.viewer, itemData[ctrItems].label, itemData[ctrItems].action, bind(this, this.doAction), dataSource, itemData[ctrItems].method, modifier);
        } else if (itemData[ctrItems].type === "button") {
            item = new papaya.ui.MenuItemFileChooser(this.viewer, itemData[ctrItems].label, itemData[ctrItems].action, bind(this, this.doAction));
        } else if (itemData[ctrItems].type === "range") {
            item = new papaya.ui.MenuItemRange(this.viewer, itemData[ctrItems].label, itemData[ctrItems].action, bind(this, this.doAction), dataSource, itemData[ctrItems].method, modifier);
        } else {
            item = new papaya.ui.MenuItem(this.viewer, itemData[ctrItems].label, itemData[ctrItems].action, bind(this, this.doAction), modifier);
        }

        menu.addMenuItem(item);

        if (itemData[ctrItems].items) {
            menu2 = this.buildMenu(itemData[ctrItems], topLevelButtonId, dataSource, modifier);
            item.callback = bind(menu2, menu2.showMenu);
        }
    }
};



papaya.ui.Toolbar.prototype.updateImageButtons = function () {
    var ctr, screenVol, dataUrl, data;

    this.container.toolbarHtml.find(".imageButton").remove();

    this.imageMenus = [];

    for (ctr = this.viewer.screenVolumes.length - 1; ctr >= 0; ctr -= 1) {
        screenVol = this.viewer.screenVolumes[ctr];
        dataUrl = screenVol.colorTable.icon;

        data = {
            "menus" : [
                {"label": "ImageButton", "icons": [dataUrl], "items": null, "imageButton": true}
            ]
        };
        data.menus[0].items = papaya.ui.Toolbar.IMAGE_MENU_DATA.items;

        this.imageMenus[ctr] = (this.buildMenu(data.menus[0], null, screenVol, ctr.toString()));
    }
};



papaya.ui.Toolbar.prototype.closeAllMenus = function () {
    var menuHtml, modalDialogHtml;

    menuHtml = this.container.toolbarHtml.find(".menu");
    menuHtml.hide(100);
    menuHtml.remove();

    modalDialogHtml = this.container.toolbarHtml.find(".modalDialog");
    modalDialogHtml.hide(100);
    modalDialogHtml.remove();

    this.container.containerHtml.removeClass("modalBackground");
};



papaya.ui.Toolbar.prototype.isShowingMenus = function () {
    var menuVisible, dialogVisible;

    menuVisible = this.container.toolbarHtml.find(".menu").is(":visible");
    dialogVisible = this.container.toolbarHtml.find(".modalDialog").is(":visible");

    return (menuVisible || dialogVisible);
};



papaya.ui.Toolbar.prototype.doAction = function (action, file, keepopen) {
    var imageIndex, colorTableName, dialog, atlasName, imageName;

    if (!keepopen) {
        this.closeAllMenus();
    }

    if (action) {
        if (action.startsWith("ImageButton")) {
            imageIndex = parseInt(action.substr(action.length - 2, 1), 10);
            this.viewer.setCurrentScreenVol(imageIndex);
            this.updateImageButtons();
        } else if (action.startsWith("Open-")) {
            imageName = action.substring(action.indexOf("-") + 1);
            this.viewer.loadImage(imageName);
        } else if (action === "OpenImage") {
            this.viewer.loadImage(file);
        } else if (action.startsWith("ColorTable")) {
            colorTableName = action.substring(action.indexOf("-") + 1, action.lastIndexOf("-"));
            imageIndex = action.substring(action.lastIndexOf("-") + 1);
            this.viewer.screenVolumes[imageIndex].changeColorTable(this.viewer, colorTableName);
            this.updateImageButtons();
        } else if (action.startsWith("CloseAllImages")) {
            this.viewer.resetViewer();
            this.updateImageButtons();
        } else if (action === "Preferences") {
            dialog = new papaya.ui.Dialog(this.container, "Preferences", papaya.ui.Toolbar.PREFERENCES_DATA, this.container.preferences, bind(this.container.preferences, this.container.preferences.updatePreference));
            dialog.showDialog();
        } else if (action.startsWith("ImageInfo")) {
            imageIndex = action.substring(action.lastIndexOf("-") + 1);
            dialog = new papaya.ui.Dialog(this.container, "Image Info", papaya.ui.Toolbar.IMAGE_INFO_DATA, this.viewer, null, imageIndex.toString());
            dialog.showDialog();
        } else if (action.startsWith("SPACE")) {
            this.viewer.toggleWorldSpace();
            this.viewer.drawViewer(true);
        } else if (action.startsWith("AtlasChanged")) {
            atlasName = action.substring(action.lastIndexOf("-") + 1);
            this.viewer.atlas.currentAtlas = atlasName;
            this.viewer.drawViewer(true);
        }
    }
};



papaya.ui.Toolbar.prototype.updateTitleBar = function (title) {
    var elem = this.container.titlebarHtml[0];

    if (elem) {
        elem.innerHTML = title;
    }
};



papaya.ui.Toolbar.prototype.showImageMenu = function (index) {
    this.imageMenus[index].showMenu();
};



papaya.ui.Toolbar.prototype.updateImageMenuRange = function (index, min, max) {
    this.imageMenus[index].updateRangeItem(min, max);
};
