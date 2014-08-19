
/*jslint browser: true, node: true */
/*global $, bind, PAPAYA_TITLEBAR_CSS, derefIn, PAPAYA_DIALOG_CSS, PAPAYA_MENU_ICON_CSS, PAPAYA_MENU_LABEL_CSS,
 PAPAYA_MENU_BUTTON_CSS, PAPAYA_MENU_CSS, PAPAYA_DIALOG_BACKGROUND, PAPAYA_MENU_TITLEBAR_CSS, isInputRangeSupported,
 launchCustomProtocol, PAPAYA_BROWSER, alert, confirm, getAbsoluteUrl, PAPAYA_CUSTOM_PROTOCOL */

"use strict";

var papaya = papaya || {};
papaya.ui = papaya.ui || {};

var papayaLoadableImages = papayaLoadableImages || [];

papaya.ui.Toolbar = papaya.ui.Toolbar || function (container) {
    this.container = container;
    this.viewer = container.viewer;
    this.imageMenus = null;
    this.spaceMenu = null;
};



papaya.ui.Toolbar.SIZE = 22;

// http://dataurl.net/#dataurlmaker
papaya.ui.Toolbar.ICON_IMAGESPACE = "data:image/gif;base64,R0lGODlhFAAUAPcAMf//////GP///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////2f/ZNbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1qWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpVpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEAACoALAAAAAAUABQAAAipAFUIHEiwoMB/A1coXLiwisOHVf4hVLFCosWLGC9SzMgR48Z/VEJSUVjFj0mTESdWBCmS5EmU/6oIXCly5IqSLx/OlFjT5Us/DneybIkzp8yPDElChCjwj8Q/UKOqmkqVatOnUaGqmsaVq1UVTv+lGjv2z9SuXlVdFUs2ldmtaKeubev2bFy1YCXSfYt2mty8/6CS5XtXRcasVRMftJj1beK/hicanKwiIAA7";
papaya.ui.Toolbar.ICON_WORLDSPACE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAVCAYAAACpF6WWAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAplJREFUeNqM1H1ozVEcx/Hr3p+7O08jQzbzMErznEItK0+Fv0Ye/tki20ia//wn+YMSaXkoEiKkkCVKZhOipsnDstnFagzlrmGMNfeO6/Nd71unu2s59bq7O517ft/z/X7Pz+dLPUbLJrkqX+SbdEubfJZK2cC6PiOQYm61HJcpkintEpcmCcpryZV5spaHhvvbdJ9slsPyU67wgPlEli0X5aiMkMeyXSbKnVRRVxDRRtkm5czbZrv5vkgu8z1P9stWfleRHGkhT3xCLu1YzZIjpfKWnA6VEn43mwcWEaWlo1Ve2YZj5Jms53iP5BjFsFz9lg/yDj0U7JbslFpZQyBP2a83khoiLiWPA/h/OVGOk+GwnJ5y1iyRS5Im1VLm18cKOc+CYrlGjnxUuZPIOlAn0yWdNXdlrMyRE7LM00eBjBT7niFVTvHsKJ8k6sw1yC4ZIl0EUMOcRT/X44v14xEZSBWfk+d8NpzKujgPGiYrOXI+XTGeGtjpewtjm16Qh3JT3sgvickfNo4yF6V4PVyE2wQUZvP7FmmIa/iDIpwkHRPkrC2iEIlhEZ2mtarIsz3sOoX0PPrP7nAWPRYjj51E85JiJEYO0VsfR5hL5wZal3T7aZl10kLiEyNEHtOSbt4g/gaduRjzC+S9RwtZ332XBxQpzGZ+p72SR5BumUYHLaaDSiySUXKPig6Wj+SmjX5s4BQB0pFBQVo4dhenspfKC1kaYLKVa9pOAW5Q2Ww2qeU92kHbzZRDvK2sBSfLDLtNUp/82rOj7nDm9tJi7lhoeWNzG7Pkqxz8R5p8ByhcGVd0CzkOOWv28KBJvNGa+V2/Y5U08vQm8mgvmTNyjpxHSFUj6/9rZPKerGSTuCPCi7qIdX3GXwEGAPFYt+/OgAXDAAAAAElFTkSuQmCC";

papaya.ui.Toolbar.ICON_EXPAND =   "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAE00lEQVR42u2djW3UQBCFJx3QAemAdJBQAVABTgekAqCC0EGOCoAKWDqADkIHKQGPfKdEh3Nr7493Z977pJWQwtk7+77ETs6zdyYEmrPWEyBtoQDgUABwKAA4FAAcCgAOBQCHAoBDAcChAOBQAHAoADgUABwKAE6uALfjuGg094dx7Mbxo9H5D7wZxzCOF43O/3scN6kvzhXg5ziuGhV+4K20k0DD/964/jCO16kv9iCABvCu0bm/ySRgS4KAC7Abx3Wjc9/J9OO/JUGABXjYn/9Po/O/kimAVtd/EQMC6E1Krevkbhx/Kx17KSpBrcuAHjd2kx2kcwGUYRxfy60LBO9lEjxGEAMCKINQgqUsDV8JYkQAZRBKEGNN+EqQzgTQa/6p69YglOA5YuHPrW2QzgT4NI77SCGDUIJjYuEP4ziXaX2fEqRDAT4vLIgSTCxdq49iSIA1hSGzZo3MCbC2QDTWro1JAVIKRSBlTcwKkFqwV1LXwrQAOYV7ImcNzAuQuwDWya3dhQAlFsIiJWp2I0CpBbFCqVpdCVByYXqmZI3uBCi9QL1RujaXAigeJahRk1sBFE8S1KrFtQCKBwlq1uBeAMWyBLXnDiGAYlGCLeYMI4BiSYKt5golgGJBgi3nCCeA0rMEW88NUgClRwlazKk7AeaaI3WCpQVQepKg1VzmBMhqjs0V4Lg9unavXg8StJzDS5keDX/ai5jVHl9ih5DDBgka/hep36jZMoAeBNRexA8ySaBzydobweoWMS2C6CH84lgVQNkyEJfhK5YFULYIxm34inUBlFhA55K+h8DcTddTBjEcvuJBAOWUBIOkh3Qp0+/ZpY/bDV4EUJ6T4GocvxKP+ZwAgzgIX/EkgKIS6K+ihx/ZQTL+Srbn+K+dgzgJX/EmgKLX7fP9v1O/84+53B8zSPs9iYriUQCyAgoADgUAhwKAQwHAoQDgUABwKAA4FAAcCgAOBQCHAoBDAcChAOB4FEDfDr6Sacfykm8Hy/6YfDu4Y46fCgpS9oEQ7X3QZ/L5QEiH8JGwBLwIcOqh0CtJF6DWw6bd4EGAUyHpj2z9iJWcx8LvT3x9EOMSWBeAjSGZWBaArWEFsCoAm0MLwfZwO+c+0FV7+NwGETk3XTF6CKDlHOY+rLrpBhHcImbbuXS3RQw3idp2Tt1tEsVt4rhNHDeK3HCOUAJYCH/rucIIYCn8LecMIYDF8Leau3sBLIe/RQ2uBfAQfu1a3ArgKfyaNbkUwGP4tWpzJ4Dn8GvU6EoAhPBL1+pGAKTwS9bsQgDE8EvVbl4A5PBLrIFpARj+I6lrYVYAhv8/KWtiUgCG/zxr18acAAw/zpo1MiUAw1/O0rUyI8D9woLII0skOBcDAuhHrFxECmH488QkmFvbIJ0JcIpBGH6MmATHBDEiwCAMfylrJAhiQIBBGP5alkoQpHMB9Lr1PX6oJPS4tXsRY+geAkOlY2vX1UXk/wTpXICa1P6w6hhzvXpbo+eHFUDZjeO60bnvpN53/1KCgAuQ1RyZyVxz7NYEARcgqz06k+P2+BYEaSjArcRvUmqh1/+dtAv/wGGDjFb3AXqTfZP6YqtbxJBCUABwKAA4FAAcCgAOBQCHAoBDAcChAOBQAHAoADgUABwKAA4FAIcCgPMPvdAfn3qMP2kAAAAASUVORK5CYII=";
papaya.ui.Toolbar.ICON_COLLAPSE = "data:image/png;base64,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";


papaya.ui.Toolbar.MENU_DATA = {
    "menus": [
        {"label": "File", "icons": null,
            "items": [
                {"label": "Add Image...", "action": "OpenImage", "type": "button"},
                {"type": "spacer"},
                {"label": "Load JSON...", "action": "OpenJSON", "type": "button"},
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
        {"label": "EXPAND", "icons": [papaya.ui.Toolbar.ICON_EXPAND, papaya.ui.Toolbar.ICON_COLLAPSE], "items": [], "method": "isCollapsable", "required": "isExpandable" },
        {"label": "SPACE", "icons": [papaya.ui.Toolbar.ICON_IMAGESPACE, papaya.ui.Toolbar.ICON_WORLDSPACE], "items": [], "method": "isWorldMode", "menuOnHover": true }
    ]
};

papaya.ui.Toolbar.OVERLAY_IMAGE_MENU_DATA = {
    "items": [
        {"label": "Image Info", "action": "ImageInfo"},
        {"label": "DisplayRange", "action": "ChangeRange", "type": "displayrange", "method": "getRange"},
        {"label": "Transparency", "action": "ChangeAlpha", "type": "range", "method": "getAlpha"},
        {"label": "Color Table...", "action": "ColorTable", "items": [] },
        {"label": "Open in Mango", "action": "OpenInMango", "required" : "canOpenInMango" }
    ]
};

papaya.ui.Toolbar.BASE_IMAGE_MENU_DATA = {
    "items": [
        {"label": "Image Info", "action": "ImageInfo"},
        {"label": "DisplayRange", "action": "ChangeRange", "type": "displayrange", "method": "getRange"},
        papaya.ui.Toolbar.OVERLAY_IMAGE_MENU_DATA.items[3],
        {"label": "Open in Mango", "action": "OpenInMango", "required" : "canOpenInMango"  }
    ]
};

papaya.ui.Toolbar.PREFERENCES_DATA = {
    "items": [
        {"label": "Coordinate display of:", "field": "atlasLocks", "options": ["Mouse", "Crosshairs"]},
        {"label": "Show crosshairs:", "field": "showCrosshairs", "options": ["All", "Main", "Lower", "None"]},
        {"label": "Show orientation:", "field": "showOrientation", "options": ["Yes", "No"]},
        {"label": "Scroll wheel behavior:", "field": "scrollBehavior", "options": ["Zoom", "Increment Slice"], "disabled": "container.disableScrollWheel"},
        {"label": "Smooth display:", "field": "smoothDisplay", "options": ["Yes", "No"]}

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



papaya.ui.Toolbar.SERIES_INFO_DATA = {
    "items": [
        {"label": "Filename:", "field": "getFilename", "readonly": "true"},
        {"label": "File Length:", "field": "getFileLength", "readonly": "true"},
        {"spacer": "true"},
        {"label": "Image Dims:", "field": "getImageDimensionsDescription", "readonly": "true"},
        {"label": "Voxel Dims:", "field": "getVoxelDimensionsDescription", "readonly": "true"},
        {"label": "Series Points:", "field": "getSeriesDimensionsDescription", "readonly": "true"},
        {"label": "Series Point Size:", "field": "getSeriesSizeDescription", "readonly": "true"},
        {"spacer": "true"},
        {"label": "Byte Type:", "field": "getByteTypeDescription", "readonly": "true"},
        {"label": "Byte Order:", "field": "getByteOrderDescription", "readonly": "true"},
        {"label": "Compressed:", "field": "getCompressedDescription", "readonly": "true"},
        {"spacer": "true"},
        {"label": "Orientation:", "field": "getOrientationDescription", "readonly": "true"},
        {"label": "Notes:", "field": "getImageDescription", "readonly": "true"}
    ]
};


papaya.ui.Toolbar.prototype.buildToolbar = function () {
    var ctr;

    this.imageMenus = null;
    this.spaceMenu = null;

    this.container.toolbarHtml.find("." + PAPAYA_MENU_ICON_CSS).remove();
    this.container.toolbarHtml.find("." + PAPAYA_MENU_LABEL_CSS).remove();
    this.container.toolbarHtml.find("." + PAPAYA_TITLEBAR_CSS).remove();

    this.buildOpenMenuItems();

    for (ctr = 0; ctr < papaya.ui.Toolbar.MENU_DATA.menus.length; ctr += 1) {
        this.buildMenu(papaya.ui.Toolbar.MENU_DATA.menus[ctr], null, this.viewer, null);
    }

    this.buildAtlasMenu();
    this.buildColorMenuItems();

    this.container.titlebarHtml = this.container.containerHtml.find("." + PAPAYA_TITLEBAR_CSS);
};



papaya.ui.Toolbar.prototype.buildAtlasMenu = function () {
    if (papaya.data) {
        if (papaya.data.Atlas) {
            var items = this.spaceMenu.items;

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
    items = papaya.ui.Toolbar.OVERLAY_IMAGE_MENU_DATA.items;

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
    var menu = null, items;

    if (!menuData.required || ((bind(this.container, derefIn(this.container, menuData.required)))() === true)) {
        menu = new papaya.ui.Menu(this.viewer, menuData, bind(this, this.doAction), this.viewer, modifier);

        if (menuData.label === "SPACE") {
            this.spaceMenu = menuData;
        }

        if (topLevelButtonId) {
            menu.setMenuButton(topLevelButtonId);
        } else {
            topLevelButtonId = menu.buildMenuButton();
        }

        items = menuData.items;
        if (items) {
            this.buildMenuItems(menu, items, topLevelButtonId, dataSource, modifier);
        }
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

        if (!itemData[ctrItems].required || ((bind(this.container, derefIn(this.container, itemData[ctrItems].required)))() === true)) {
            if (itemData[ctrItems].type === "spacer") {
                item = new papaya.ui.MenuItemSpacer();
            } else if (itemData[ctrItems].type === "checkbox") {
                item = new papaya.ui.MenuItemCheckBox(this.viewer, itemData[ctrItems].label, itemData[ctrItems].action, bind(this, this.doAction), dataSource, itemData[ctrItems].method, modifier);
            } else if (itemData[ctrItems].type === "button") {
                item = new papaya.ui.MenuItemFileChooser(this.viewer, itemData[ctrItems].label, itemData[ctrItems].action, bind(this, this.doAction));
            } else if (itemData[ctrItems].type === "displayrange") {
                item = new papaya.ui.MenuItemRange(this.viewer, itemData[ctrItems].label, itemData[ctrItems].action, bind(this, this.doAction), dataSource, itemData[ctrItems].method, modifier);
            } else if (itemData[ctrItems].type === "range") {
                if (isInputRangeSupported()) {
                    item = new papaya.ui.MenuItemSlider(this.viewer, itemData[ctrItems].label, itemData[ctrItems].action, bind(this, this.doAction), dataSource, itemData[ctrItems].method, modifier);
                }
            } else {
                item = new papaya.ui.MenuItem(this.viewer, itemData[ctrItems].label, itemData[ctrItems].action, bind(this, this.doAction), modifier);
            }
        }

        if (item) {
            menu.addMenuItem(item);

            if (itemData[ctrItems].items) {
                menu2 = this.buildMenu(itemData[ctrItems], topLevelButtonId, dataSource, modifier);
                item.callback = bind(menu2, menu2.showMenu);
            }
        }
    }
};



papaya.ui.Toolbar.prototype.updateImageButtons = function () {
    var ctr, screenVol, dataUrl, data;

    this.container.toolbarHtml.find("." + PAPAYA_MENU_BUTTON_CSS).remove();

    this.imageMenus = [];

    for (ctr = this.viewer.screenVolumes.length - 1; ctr >= 0; ctr -= 1) {
        screenVol = this.viewer.screenVolumes[ctr];
        dataUrl = screenVol.colorTable.icon;

        data = {
            "menus" : [
                {"label": "ImageButton", "icons": [dataUrl], "items": null, "imageButton": true}
            ]
        };

        if (ctr === 0) {
            data.menus[0].items = papaya.ui.Toolbar.BASE_IMAGE_MENU_DATA.items;
        } else {
            data.menus[0].items = papaya.ui.Toolbar.OVERLAY_IMAGE_MENU_DATA.items;
        }

        this.imageMenus[ctr] = (this.buildMenu(data.menus[0], null, screenVol, ctr.toString()));
    }
};



papaya.ui.Toolbar.prototype.closeAllMenus = function () {
    var menuHtml, modalDialogHtml, modalDialogBackgroundHtml;

    menuHtml = this.container.toolbarHtml.find("." + PAPAYA_MENU_CSS);
    menuHtml.hide(100);
    menuHtml.remove();

    modalDialogHtml = this.container.toolbarHtml.find("." + PAPAYA_DIALOG_CSS);
    modalDialogHtml.hide(100);
    modalDialogHtml.remove();

    modalDialogBackgroundHtml = this.container.toolbarHtml.find("." + PAPAYA_DIALOG_BACKGROUND);
    modalDialogBackgroundHtml.hide(100);
    modalDialogBackgroundHtml.remove();
};



papaya.ui.Toolbar.prototype.isShowingMenus = function () {
    var menuVisible, dialogVisible;

    menuVisible = this.container.toolbarHtml.find("." + PAPAYA_MENU_CSS).is(":visible");
    dialogVisible = this.container.toolbarHtml.find("." + PAPAYA_DIALOG_CSS).is(":visible");

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
        } else if (action === "OpenJSON") {
            console.log('openjson called');
            this.viewer.loadJSON(file);
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

            if (this.viewer.screenVolumes[imageIndex].volume.numTimepoints > 1) {
                dialog = new papaya.ui.Dialog(this.container, "Image Info", papaya.ui.Toolbar.SERIES_INFO_DATA, this.viewer, null, imageIndex.toString());
            } else {
                dialog = new papaya.ui.Dialog(this.container, "Image Info", papaya.ui.Toolbar.IMAGE_INFO_DATA, this.viewer, null, imageIndex.toString());
            }

            dialog.showDialog();
        } else if (action.startsWith("SPACE")) {
            this.viewer.toggleWorldSpace();
            this.viewer.drawViewer(true);
        } else if (action.startsWith("AtlasChanged")) {
            atlasName = action.substring(action.lastIndexOf("-") + 1);
            this.viewer.atlas.currentAtlas = atlasName;
            this.viewer.drawViewer(true);
        } else if (action.startsWith("EXPAND")) {
            if (this.container.collapsable) {
                this.container.collapseViewer();
            } else {
                this.container.expandViewer();
            }
        } else if (action.startsWith("OpenInMango")) {
            imageIndex = parseInt(action.substring(action.lastIndexOf("-") + 1), 10);

            if (imageIndex === 0) {
                if (this.container.viewer.volume.url) {
                    launchCustomProtocol(this.container, getAbsoluteUrl(PAPAYA_CUSTOM_PROTOCOL, this.container.viewer.volume.url), this.customProtocolResult);
                }
            } else {
                if (this.container.viewer.screenVolumes[imageIndex].volume.url) {
                    launchCustomProtocol(this.container, getAbsoluteUrl(PAPAYA_CUSTOM_PROTOCOL, this.container.viewer.screenVolumes[imageIndex].volume.url) + "?" + encodeURIComponent("baseimage=" + this.container.viewer.volume.fileName + "&params=o"), this.customProtocolResult);
                }
            }
        }
    }
};



papaya.ui.Toolbar.prototype.customProtocolResult = function (success) {
    if (success === false) {
        if ((PAPAYA_BROWSER.name === "Chrome") || (PAPAYA_BROWSER.name === "Internet Explorer")) {  // initiated by a setTimeout, so popup blocker will interfere with window.open
            alert("Mango does not appear to be installed.  You can download Mango at:\n\nhttp://ric.uthscsa.edu/mango");
        } else {
            if (PAPAYA_BROWSER.ios) {
                if (confirm("iMango does not appear to be installed.  Would you like to download it now?")) {
                    window.open("http://itunes.apple.com/us/app/imango/id423626092");
                }
            } else {
                if (confirm("Mango does not appear to be installed.  Would you like to download it now?")) {
                    window.open("http://ric.uthscsa.edu/mango/mango.html");
                }
            }
        }
    }
};



papaya.ui.Toolbar.prototype.updateTitleBar = function (title) {
    var elem = this.container.titlebarHtml[0];

    if (elem) {
        elem.innerHTML = title;
    }

    this.container.titlebarHtml.css({top: (this.container.viewerHtml.position().top - 1.25 * papaya.ui.Toolbar.SIZE)});
};



papaya.ui.Toolbar.prototype.showImageMenu = function (index) {
    this.viewer.screenVolumes[index].resetDynamicRange();
    this.imageMenus[index].showMenu();
};



papaya.ui.Toolbar.prototype.updateImageMenuRange = function (index, min, max) {
    this.imageMenus[index].updateRangeItem(min, max);
};
