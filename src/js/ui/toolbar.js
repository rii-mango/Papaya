
/*jslint browser: true, node: true */
/*global $, PAPAYA_MENU_ICON_CSS, PAPAYA_MENU_LABEL_CSS, PAPAYA_TITLEBAR_CSS, PAPAYA_MENU_BUTTON_CSS, PAPAYA_MENU_CSS,
 PAPAYA_CUSTOM_PROTOCOL, PAPAYA_DIALOG_CSS, PAPAYA_DIALOG_BACKGROUND, alert, confirm */

"use strict";

var papaya = papaya || {};
papaya.ui = papaya.ui || {};

var papayaLoadableImages = papayaLoadableImages || [];

papaya.ui.Toolbar = papaya.ui.Toolbar || function (container) {
    this.container = container;
    this.viewer = container.viewer;
    this.imageMenus = null;
    this.surfaceMenus = null;
    this.spaceMenu = null;
};


/*** Static Fields ***/

papaya.ui.Toolbar.SIZE = 22;


// http://dataurl.net/#dataurlmaker
papaya.ui.Toolbar.ICON_IMAGESPACE = "data:image/gif;base64,R0lGODlhFAAUAPcAMf//////GP////////////////////////////////" +
    "////////////////////////////////////////////////////////////////////////////////////////////////////////////////" +
    "///////////////2f/ZNbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1t" +
    "bW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1qWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpa" +
    "WlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpa" +
    "WlpaWlpaWlpaWlpaWlpVpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWl" +
    "paWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQk" +
    "JCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQk" +
    "JCQkJCQkJCQkJCQkJCQkJCQgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEAACoALAAAAAAUABQAAA" +
    "ipAFUIHEiwoMB/A1coXLiwisOHVf4hVLFCosWLGC9SzMgR48Z/VEJSUVjFj0mTESdWBCmS5EmU/6oIXCly5IqSLx/OlFjT5Us/DneybIkzp8yPDE" +
    "lChCjwj8Q/UKOqmkqVatOnUaGqmsaVq1UVTv+lGjv2z9SuXlVdFUs2ldmtaKeubev2bFy1YCXSfYt2mty8/6CS5XtXRcasVRMftJj1beK/hicanK" +
    "wiIAA7";

papaya.ui.Toolbar.ICON_WORLDSPACE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAVCAYAAACpF6WWAAAAGXRFWHRTb2" +
    "Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAplJREFUeNqM1H1ozVEcx/Hr3p+7O08jQzbzMErznEItK0+Fv0Ye/tki20ia//wn+YMSaXkoEi" +
    "KkkCVKZhOipsnDstnFagzlrmGMNfeO6/Nd71unu2s59bq7O517ft/z/X7Pz+dLPUbLJrkqX+SbdEubfJZK2cC6PiOQYm61HJcpkintEpcmCcpryZ" +
    "V5spaHhvvbdJ9slsPyU67wgPlEli0X5aiMkMeyXSbKnVRRVxDRRtkm5czbZrv5vkgu8z1P9stWfleRHGkhT3xCLu1YzZIjpfKWnA6VEn43mwcWEa" +
    "Wlo1Ve2YZj5Jms53iP5BjFsFz9lg/yDj0U7JbslFpZQyBP2a83khoiLiWPA/h/OVGOk+GwnJ5y1iyRS5Im1VLm18cKOc+CYrlGjnxUuZPIOlAn0y" +
    "WdNXdlrMyRE7LM00eBjBT7niFVTvHsKJ8k6sw1yC4ZIl0EUMOcRT/X44v14xEZSBWfk+d8NpzKujgPGiYrOXI+XTGeGtjpewtjm16Qh3JT3sgvic" +
    "kfNo4yF6V4PVyE2wQUZvP7FmmIa/iDIpwkHRPkrC2iEIlhEZ2mtarIsz3sOoX0PPrP7nAWPRYjj51E85JiJEYO0VsfR5hL5wZal3T7aZl10kLiEy" +
    "NEHtOSbt4g/gaduRjzC+S9RwtZ332XBxQpzGZ+p72SR5BumUYHLaaDSiySUXKPig6Wj+SmjX5s4BQB0pFBQVo4dhenspfKC1kaYLKVa9pOAW5Q2W" +
    "w2qeU92kHbzZRDvK2sBSfLDLtNUp/82rOj7nDm9tJi7lhoeWNzG7Pkqxz8R5p8ByhcGVd0CzkOOWv28KBJvNGa+V2/Y5U08vQm8mgvmTNyjpxHSF" +
    "Uj6/9rZPKerGSTuCPCi7qIdX3GXwEGAPFYt+/OgAXDAAAAAElFTkSuQmCC";

papaya.ui.Toolbar.ICON_EXPAND =   "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAE00lEQVR42u2d" +
    "jW3UQBCFJx3QAemAdJBQAVABTgekAqCC0EGOCoAKWDqADkIHKQGPfKdEh3Nr7493Z977pJWQwtk7+77ETs6zdyYEmrPWEyBtoQDgUABwKAA4FAAc" +
    "CgAOBQCHAoBDAcChAOBQAHAoADgUABwKAE6uALfjuGg094dx7Mbxo9H5D7wZxzCOF43O/3scN6kvzhXg5ziuGhV+4K20k0DD/964/jCO16kv9iCA" +
    "BvCu0bm/ySRgS4KAC7Abx3Wjc9/J9OO/JUGABXjYn/9Po/O/kimAVtd/EQMC6E1Krevkbhx/Kx17KSpBrcuAHjd2kx2kcwGUYRxfy60LBO9lEjxG" +
    "EAMCKINQgqUsDV8JYkQAZRBKEGNN+EqQzgTQa/6p69YglOA5YuHPrW2QzgT4NI77SCGDUIJjYuEP4ziXaX2fEqRDAT4vLIgSTCxdq49iSIA1hSGz" +
    "Zo3MCbC2QDTWro1JAVIKRSBlTcwKkFqwV1LXwrQAOYV7ImcNzAuQuwDWya3dhQAlFsIiJWp2I0CpBbFCqVpdCVByYXqmZI3uBCi9QL1RujaXAige" +
    "JahRk1sBFE8S1KrFtQCKBwlq1uBeAMWyBLXnDiGAYlGCLeYMI4BiSYKt5golgGJBgi3nCCeA0rMEW88NUgClRwlazKk7AeaaI3WCpQVQepKg1Vzm" +
    "BMhqjs0V4Lg9unavXg8StJzDS5keDX/ai5jVHl9ih5DDBgka/hep36jZMoAeBNRexA8ySaBzydobweoWMS2C6CH84lgVQNkyEJfhK5YFULYIxm34" +
    "inUBlFhA55K+h8DcTddTBjEcvuJBAOWUBIOkh3Qp0+/ZpY/bDV4EUJ6T4GocvxKP+ZwAgzgIX/EkgKIS6K+ihx/ZQTL+Srbn+K+dgzgJX/EmgKLX" +
    "7fP9v1O/84+53B8zSPs9iYriUQCyAgoADgUAhwKAQwHAoQDgUABwKAA4FAAcCgAOBQCHAoBDAcChAOB4FEDfDr6Sacfykm8Hy/6YfDu4Y46fCgpS" +
    "9oEQ7X3QZ/L5QEiH8JGwBLwIcOqh0CtJF6DWw6bd4EGAUyHpj2z9iJWcx8LvT3x9EOMSWBeAjSGZWBaArWEFsCoAm0MLwfZwO+c+0FV7+NwGETk3" +
    "XTF6CKDlHOY+rLrpBhHcImbbuXS3RQw3idp2Tt1tEsVt4rhNHDeK3HCOUAJYCH/rucIIYCn8LecMIYDF8Leau3sBLIe/RQ2uBfAQfu1a3ArgKfya" +
    "NbkUwGP4tWpzJ4Dn8GvU6EoAhPBL1+pGAKTwS9bsQgDE8EvVbl4A5PBLrIFpARj+I6lrYVYAhv8/KWtiUgCG/zxr18acAAw/zpo1MiUAw1/O0rUy" +
    "I8D9woLII0skOBcDAuhHrFxECmH488QkmFvbIJ0JcIpBGH6MmATHBDEiwCAMfylrJAhiQIBBGP5alkoQpHMB9Lr1PX6oJPS4tXsRY+geAkOlY2vX" +
    "1UXk/wTpXICa1P6w6hhzvXpbo+eHFUDZjeO60bnvpN53/1KCgAuQ1RyZyVxz7NYEARcgqz06k+P2+BYEaSjArcRvUmqh1/+dtAv/wGGDjFb3AXqT" +
    "fZP6YqtbxJBCUABwKAA4FAAcCgAOBQCHAoBDAcChAOBQAHAoADgUABwKAA4FAIcCgPMPvdAfn3qMP2kAAAAASUVORK5CYII=";

papaya.ui.Toolbar.ICON_COLLAPSE = "data:image/png;base64,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";

papaya.ui.Toolbar.FILE_MENU_DATA = {"label": "File", "icons": null,
    "items": [
        {"label": "Add Image...", "action": "OpenImage", "type": "file", "hide": papaya.utilities.PlatformUtils.ios},
        {"label": "Add Surface...", "action": "OpenSurface", "type": "file", "hide": papaya.utilities.PlatformUtils.ios},
        {"label": "Add DICOM Folder...", "action": "OpenFolder", "type": "folder",
            "hide": ((papaya.utilities.PlatformUtils.browser !== "Chrome") || ((typeof(daikon) === "undefined"))) },
        {"label": "Add DTI Vector Series...", "action": "OpenDTI", "type": "file"},
        {"type": "spacer"},
        {"label": "Close All", "action": "CloseAllImages"}
    ]
};

papaya.ui.Toolbar.RGB_FILE_MENU_DATA = {"label": "File", "icons": null,
    "items": [
        {"label": "Close All", "action": "CloseAllImages"}
    ]
};

papaya.ui.Toolbar.MENU_DATA = {
    "menus": [
        papaya.ui.Toolbar.FILE_MENU_DATA,
        {"label": "View", "icons": null,
            "items": [
                {"label": "Orientation", "action": "ShowOrientation", "type": "checkbox", "method": "isShowingOrientation"},
                {"label": "Crosshairs", "action": "ShowCrosshairs", "type": "checkbox", "method": "isShowingCrosshairs"},
                {"label": "Ruler", "action": "ShowRuler", "type": "checkbox", "method": "isShowingRuler"},
                {"type": "spacer", "required": "hasSurface"},
                {"label": "Surface Planes", "action": "ShowSurfacePlanes", "type": "checkbox", "method": "isShowingSurfacePlanes", "required" : "hasSurface"}
            ]
        },
        {"label": "Settings", "icons": null,
            "items": [
                {"label": "Viewer Preferences", "action": "Preferences"},
                {"label": "Surface Preferences", "action": "SurfacePreferences", "required" : "hasSurface"}
            ]
        },
        {"label": "Help", "icons": null,
            "items": [
                {"label": "Show Keyboard Reference", "action": "KeyboardRef"},
                {"label": "Show Mouse Reference", "action": "MouseRef"},
                {"label": "Show License", "action": "License"}
            ]
        },
        {"label": "", "icons": null, "titleBar": "true" },
        {"label": "EXPAND", "icons": [papaya.ui.Toolbar.ICON_EXPAND, papaya.ui.Toolbar.ICON_COLLAPSE], "items": [],
            "method": "isCollapsable", "required": "isExpandable" },
        {"label": "SPACE", "icons": [papaya.ui.Toolbar.ICON_IMAGESPACE, papaya.ui.Toolbar.ICON_WORLDSPACE],
            "items": [], "method": "isWorldMode", "menuOnHover": true }
    ]
};

papaya.ui.Toolbar.MENU_DATA_KIOSK = {
    "menus": [
        {"label": "EXPAND", "icons": [papaya.ui.Toolbar.ICON_EXPAND, papaya.ui.Toolbar.ICON_COLLAPSE], "items": [],
            "method": "isCollapsable", "required": "isExpandable" }
    ]
};

papaya.ui.Toolbar.OVERLAY_IMAGE_MENU_DATA = {
    "items": [
        {"label": "Show Header", "action": "ShowHeader"},
        {"label": "Show Image Info", "action": "ImageInfo"},
        {"type": "spacer", "required": "isParametricCombined"},
        {"label": "DisplayRange", "action": "ChangeRange", "type": "displayrange", "method": "getRange"},
        {"label": "Load Negatives", "action": "LoadNegatives", "required" : "canCurrentOverlayLoadNegatives" },
        {"label": "Transparency", "action": "alpha", "type": "range", "method": "getAlpha"},
        {"label": "Color Table", "action": "ColorTable", "items": [], "required": "isNonParametricCombined" },
        {"type": "spacer", "required": "isParametricCombined"},
        {"label": "DisplayRange", "action": "ChangeRangeNeg", "type": "displayrange", "method": "getRangeNegative", "required": "isParametricCombined"},
        {"label": "Transparency", "action": "alphaneg", "type": "range", "method": "getAlpha", "required": "isParametricCombined"},
        {"type": "spacer", "required": "isParametricCombined"},
        {"label": "Hide Overlay", "action": "ToggleOverlay", "method": "getHiddenLabel" },
        {"label": "Close Overlay", "action": "CloseOverlay", "required": "isDesktopMode" },
        {"label": "Open in Mango", "action": "OpenInMango", "required" : "canOpenInMango" }
    ]
};

papaya.ui.Toolbar.BASE_IMAGE_MENU_DATA = {
    "items": [
        {"label": "Show Header", "action": "ShowHeader"},
        {"label": "Show Image Info", "action": "ImageInfo"},
        {"label": "DisplayRange", "action": "ChangeRange", "type": "displayrange", "method": "getRange"},
            papaya.ui.Toolbar.OVERLAY_IMAGE_MENU_DATA.items[6],
        {"label": "Rotation", "action": "Rotation", "items": [
            {"label": "About X Axis", "action": "rotationX", "type": "range", "method": "getRotationX"},
            {"label": "About Y Axis", "action": "rotationY", "type": "range", "method": "getRotationY"},
            {"label": "About Z Axis", "action": "rotationZ", "type": "range", "method": "getRotationZ"},
            {"label": "Reset Transform", "action": "ResetTransform"},
            {"label": "Rotate About Center", "action": "Rotate About Center", "type": "radiobutton", "method": "isRotatingAbout"},
            {"label": "Rotate About Origin", "action": "Rotate About Origin", "type": "radiobutton", "method": "isRotatingAbout"},
            {"label": "Rotate About Crosshairs", "action": "Rotate About Crosshairs", "type": "radiobutton", "method": "isRotatingAbout"}
        ]},
        {"label": "Open in Mango", "action": "OpenInMango", "required" : "canOpenInMango"  }
    ]
};

papaya.ui.Toolbar.RGB_IMAGE_MENU_DATA = {
    "items": [
        {"label": "Show Header", "action": "ShowHeader"},
        {"label": "Show Image Info", "action": "ImageInfo"},
        {"label": "Open in Mango", "action": "OpenInMango", "required" : "canOpenInMango"  }
    ]
};

papaya.ui.Toolbar.SURFACE_MENU_DATA = {
    "items": [
        {"label": "Show Surface Info", "action": "SurfaceInfo"},
        {"label": "Transparency", "action": "alpha", "type": "range", "method": "getAlpha"}
    ]
};

papaya.ui.Toolbar.DTI_IMAGE_MENU_DATA = {
    "items": [
        {"label": "Show Header", "action": "ShowHeader"},
        {"label": "Show Image Info", "action": "ImageInfo"},
        {"label": "Display Colors", "action": "DTI-RGB", "type": "checkbox", "method": "isDTIRGB"},
        {"label": "Display Lines", "action": "DTI-Lines", "type": "checkbox", "method": "isDTILines"},
        {"label": "Display Lines &amp; Colors", "action": "DTI-LinesColors", "type": "checkbox", "method": "isDTILinesAndRGB"},
        {"label": "Transparency", "action": "alpha", "type": "range", "method": "getAlpha", "required": "canCurrentOverlayLoadMod"},
        {"label": "Modulate with...", "action": "DTI-Mod", "type": "file", "hide": papaya.utilities.PlatformUtils.ios, "required": "canCurrentOverlayLoadMod"},
        {"label": "Modulation", "action": "dtiAlphaFactor", "type": "range", "method": "getDtiAlphaFactor", "required": "canCurrentOverlayModulate"},
        {"label": "Open in Mango", "action": "OpenInMango", "required" : "canOpenInMango"}
    ]
};

papaya.ui.Toolbar.PREFERENCES_DATA = {
    "items": [
        {"label": "Coordinate display of:", "field": "atlasLocks", "options": ["Mouse", "Crosshairs"]},
        {"label": "Scroll wheel behavior:", "field": "scrollBehavior", "options": ["Zoom", "Increment Slice"],
            "disabled": "container.disableScrollWheel"},
        {"spacer": "true"},
        {"label": "Smooth display:", "field": "smoothDisplay", "options": ["Yes", "No"]},
        {"label": "Radiological display:", "field": "radiological", "options": ["Yes", "No"]}
    ]
};

papaya.ui.Toolbar.PREFERENCES_SURFACE_DATA = {
    "items": [
        {"label": "Background color:", "field": "surfaceBackgroundColor", "options": ["Black", "Dark Gray", "Gray", "Light Gray", "White"]}
    ]
};

papaya.ui.Toolbar.IMAGE_INFO_DATA = {
    "items": [
        {"label": "Filename:", "field": "getFilename", "readonly": "true"},
        {"spacer": "true"},
        {"label": "Image Dims:", "field": "getImageDimensionsDescription", "readonly": "true"},
        {"label": "Voxel Dims:", "field": "getVoxelDimensionsDescription", "readonly": "true"},
        {"spacer": "true"},
        {"label": "Byte Type:", "field": "getByteTypeDescription", "readonly": "true"},
        {"label": "Byte Order:", "field": "getByteOrderDescription", "readonly": "true"},
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

papaya.ui.Toolbar.SURFACE_INFO_DATA = {
    "items": [
        {"label": "Filename:", "field": "getSurfaceFilename", "readonly": "true"},
        {"spacer": "true"},
        {"label": "Points:", "field": "getSurfaceNumPoints", "readonly": "true"},
        {"label": "Triangles:", "field": "getSurfaceNumTriangles", "readonly": "true"}
    ]
};

papaya.ui.Toolbar.HEADER_DATA = {
    "items": [
        {"label": "", "field": "getHeaderDescription", "readonly": "true"}
    ]
};

papaya.ui.Toolbar.LICENSE_DATA = {
    "items": [
        {"label": "", "field": "getLicense", "readonly": "true"}
    ]
};

papaya.ui.Toolbar.KEYBOARD_REF_DATA = {
    "items": [
        {"label": "", "field": "getKeyboardReference", "readonly": "true"}
    ]
};

papaya.ui.Toolbar.MOUSE_REF_DATA = {
    "items": [
        {"label": "", "field": "getMouseReference", "readonly": "true"}
    ]
};


/*** Static Methods ***/

papaya.ui.Toolbar.applyContextState = function (menu) {
    var ctr;

    menu.contextMenu = true;

    if (menu.items) {
        for (ctr = 0; ctr < menu.items.length; ctr += 1) {
            if (menu.items[ctr].menu) {
                papaya.ui.Toolbar.applyContextState(menu.items[ctr].menu);
            } else {
                menu.items[ctr].isContext = true;
            }
        }
    }
};



/*** Prototype Methods ***/

papaya.ui.Toolbar.prototype.buildToolbar = function () {
    var ctr;

    this.imageMenus = null;
    this.surfaceMenus = null;
    this.spaceMenu = null;

    this.container.toolbarHtml.find("." + PAPAYA_MENU_ICON_CSS).remove();
    this.container.toolbarHtml.find("." + PAPAYA_MENU_LABEL_CSS).remove();
    this.container.toolbarHtml.find("." + PAPAYA_TITLEBAR_CSS).remove();

    if (this.container.kioskMode) {
        for (ctr = 0; ctr < papaya.ui.Toolbar.MENU_DATA_KIOSK.menus.length; ctr += 1) {
            this.buildMenu(papaya.ui.Toolbar.MENU_DATA_KIOSK.menus[ctr], null, this.viewer, null);
        }
    } else {
        if ((this.container.viewer.screenVolumes.length > 0) && this.container.viewer.screenVolumes[0].rgb) {
            papaya.ui.Toolbar.MENU_DATA.menus[0] = papaya.ui.Toolbar.RGB_FILE_MENU_DATA;
        } else {
            papaya.ui.Toolbar.MENU_DATA.menus[0] = papaya.ui.Toolbar.FILE_MENU_DATA;
            this.buildOpenMenuItems(papaya.ui.Toolbar.MENU_DATA);
        }

        for (ctr = 0; ctr < papaya.ui.Toolbar.MENU_DATA.menus.length; ctr += 1) {
            this.buildMenu(papaya.ui.Toolbar.MENU_DATA.menus[ctr], null, this.viewer, null);
        }

        this.buildAtlasMenu();
    }

    this.buildColorMenuItems();

    this.container.titlebarHtml = this.container.containerHtml.find("." + PAPAYA_TITLEBAR_CSS);
    if (this.container.getViewerDimensions()[0] < 600) {
        this.container.titlebarHtml.css({visibility: "hidden"});
    } else {
        this.container.titlebarHtml.css({visibility: "visible"});
    }
};



papaya.ui.Toolbar.prototype.buildAtlasMenu = function () {
    if (papaya.data) {
        if (papaya.data.Atlas) {
            var items = this.spaceMenu.items;

            items[0] = {"label": papaya.data.Atlas.labels.atlas.header.name, "action": "AtlasChanged-" +
                papaya.data.Atlas.labels.atlas.header.name, "type": "radiobutton", "method": "isUsingAtlas"};

            if (papaya.data.Atlas.labels.atlas.header.transformedname) {
                items[1] = {"label": papaya.data.Atlas.labels.atlas.header.transformedname, "action": "AtlasChanged-" +
                    papaya.data.Atlas.labels.atlas.header.transformedname, "type": "radiobutton",
                        "method": "isUsingAtlas"};
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
        if (items[ctr].label === "Color Table") {
            items = items[ctr].items;
            break;
        }
    }

    for (ctr = 0; ctr < allColorTables.length; ctr += 1) {
        item = {"label": allColorTables[ctr].name, "action": "ColorTable-" + allColorTables[ctr].name,
            "type": "radiobutton", "method": "isUsingColorTable"};
        items[ctr] = item;
    }
};



papaya.ui.Toolbar.prototype.buildOpenMenuItems = function (menuData) {
    var ctr, items, menuItemName;

    for (ctr = 0; ctr < menuData.menus.length; ctr += 1) {
        if (menuData.menus[ctr].label === "File") {
            items = menuData.menus[ctr].items;
            break;
        }
    }

    if (items) {
        for (ctr = 0; ctr < papayaLoadableImages.length; ctr += 1) {
            if (!papayaLoadableImages[ctr].hide) {
                if (papayaLoadableImages[ctr].surface) {
                    menuItemName = "Add Surface " + papayaLoadableImages[ctr].nicename;
                    if (!this.menuContains(items, menuItemName)) {
                        items.splice(2, 0, {"label": menuItemName, "action": "OpenSurface-" + papayaLoadableImages[ctr].name});
                    }
                } else {
                    menuItemName = "Add " + papayaLoadableImages[ctr].nicename;
                    if (!this.menuContains(items, menuItemName)) {
                        items.splice(2, 0, {"label": menuItemName, "action": "Open-" + papayaLoadableImages[ctr].name});
                    }
                }
            }
        }
    }
};



papaya.ui.Toolbar.prototype.menuContains = function (menuItems, name) {
    var ctr;

    if (menuItems) {
        for (ctr = 0; ctr < menuItems.length; ctr += 1) {
            if (menuItems[ctr].label === name) {
                return true;
            }
        }
    }

    return false;
};



papaya.ui.Toolbar.prototype.buildMenu = function (menuData, topLevelButtonId, dataSource, modifier, context) {
    var menu = null, items;

    if (context === undefined) {
        context = false;
    }

    if (!menuData.required || ((papaya.utilities.ObjectUtils.bind(this.container, papaya.utilities.ObjectUtils.dereferenceIn(this.container, menuData.required)))() === true)) {
        menu = new papaya.ui.Menu(this.viewer, menuData, papaya.utilities.ObjectUtils.bind(this, this.doAction), this.viewer, modifier);

        if (menuData.label === "SPACE") {
            this.spaceMenu = menuData;
        }

        if (!context) {
            if (topLevelButtonId) {
                menu.setMenuButton(topLevelButtonId);
            } else {
                topLevelButtonId = menu.buildMenuButton();
            }
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
        if (!itemData[ctrItems].required || ((papaya.utilities.ObjectUtils.bind(this.container,
                papaya.utilities.ObjectUtils.dereferenceIn(this.container,
                itemData[ctrItems].required)))(parseInt(modifier)) === true)) {
            if (itemData[ctrItems].type === "spacer") {
                item = new papaya.ui.MenuItemSpacer();
            } else if (itemData[ctrItems].type === "radiobutton") {
                item = new papaya.ui.MenuItemRadioButton(this.viewer, itemData[ctrItems].label, itemData[ctrItems].action,
                    papaya.utilities.ObjectUtils.bind(this, this.doAction), dataSource, itemData[ctrItems].method, modifier);
            } else if (itemData[ctrItems].type === "checkbox") {
                item = new papaya.ui.MenuItemCheckBox(this.viewer, itemData[ctrItems].label, itemData[ctrItems].action,
                    papaya.utilities.ObjectUtils.bind(this, this.doAction), dataSource, itemData[ctrItems].method, modifier);
            } else if (itemData[ctrItems].type === "file") {
                if ((!itemData[ctrItems].hide) && (!itemData[ctrItems].required || ((papaya.utilities.ObjectUtils.bind(this.container,
                    papaya.utilities.ObjectUtils.dereferenceIn(this.container,
                        itemData[ctrItems].required)))(parseInt(modifier)) === true))) {
                    item = new papaya.ui.MenuItemFileChooser(this.viewer, itemData[ctrItems].label,
                        itemData[ctrItems].action, papaya.utilities.ObjectUtils.bind(this, this.doAction), false, modifier);
                }
            } else if (itemData[ctrItems].type === "folder") {
                if ((!itemData[ctrItems].hide) && (!itemData[ctrItems].required || ((papaya.utilities.ObjectUtils.bind(this.container,
                        papaya.utilities.ObjectUtils.dereferenceIn(this.container,
                            itemData[ctrItems].required)))(parseInt(modifier)) === true))) {
                    item = new papaya.ui.MenuItemFileChooser(this.viewer, itemData[ctrItems].label,
                        itemData[ctrItems].action, papaya.utilities.ObjectUtils.bind(this, this.doAction), true, modifier);
                } else {
                    item = null;
                }
            } else if (itemData[ctrItems].type === "displayrange") {
                if (this.viewer.screenVolumes[modifier].supportsDynamicColorTable()) {
                    item = new papaya.ui.MenuItemRange(this.viewer, itemData[ctrItems].label, itemData[ctrItems].action,
                        papaya.utilities.ObjectUtils.bind(this, this.doAction), dataSource, itemData[ctrItems].method, modifier);
                } else {
                    item = null;
                }
            } else if (itemData[ctrItems].type === "range") {
                if (papaya.utilities.PlatformUtils.isInputRangeSupported()) {
                    item = new papaya.ui.MenuItemSlider(this.viewer, itemData[ctrItems].label,
                        itemData[ctrItems].action, papaya.utilities.ObjectUtils.bind(this, this.doAction), dataSource,
                        itemData[ctrItems].method, modifier);
                }
            } else {
                item = new papaya.ui.MenuItem(this.viewer, itemData[ctrItems].label, itemData[ctrItems].action,
                    papaya.utilities.ObjectUtils.bind(this, this.doAction), dataSource, itemData[ctrItems].method, modifier);
            }
        } else {
            item = null;
        }

        if (item) {
            menu.addMenuItem(item);

            if (itemData[ctrItems].items) {
                menu2 = this.buildMenu(itemData[ctrItems], topLevelButtonId, dataSource, modifier);
                item.menu = menu2;
                item.callback = papaya.utilities.ObjectUtils.bind(menu2, menu2.showMenu);
            }
        }
    }
};



papaya.ui.Toolbar.prototype.updateImageButtons = function () {
    this.container.toolbarHtml.find("." + PAPAYA_MENU_BUTTON_CSS).remove();
    this.doUpdateImageButtons();
    this.updateSurfaceButtons();
};



papaya.ui.Toolbar.prototype.doUpdateImageButtons = function () {
    var ctr, screenVol, dataUrl, data;

    this.imageMenus = [];

    if (this.container.showImageButtons) {
        for (ctr = this.viewer.screenVolumes.length - 1; ctr >= 0; ctr -= 1) {
            screenVol = this.viewer.screenVolumes[ctr];
            dataUrl = screenVol.icon;

            data = {
                "menus" : [
                    {"label": "ImageButton", "icons": [dataUrl], "items": null, "imageButton": true}
                ]
            };

            if (ctr === 0) {
                if (screenVol.rgb) {
                    data.menus[0].items = papaya.ui.Toolbar.RGB_IMAGE_MENU_DATA.items;
                } else if (screenVol.dti) {
                    data.menus[0].items = papaya.ui.Toolbar.DTI_IMAGE_MENU_DATA.items;
                } else {
                    data.menus[0].items = papaya.ui.Toolbar.BASE_IMAGE_MENU_DATA.items;
                }
            } else {
                if (screenVol.dti) {
                    data.menus[0].items = papaya.ui.Toolbar.DTI_IMAGE_MENU_DATA.items;
                } else {
                    data.menus[0].items = papaya.ui.Toolbar.OVERLAY_IMAGE_MENU_DATA.items;
                }
            }

            if (!this.container.combineParametric || !screenVol.parametric) {
                this.imageMenus.push((this.buildMenu(data.menus[0], null, screenVol, ctr.toString())));
            }
        }
    }
};



papaya.ui.Toolbar.prototype.updateSurfaceButtons = function () {
    var ctr, dataUrl, data, solidColor;

    this.surfaceMenus = [];

    if (this.container.showImageButtons) {
        for (ctr = this.viewer.surfaces.length - 1; ctr >= 0; ctr -= 1) {
            solidColor = this.viewer.surfaces[ctr].solidColor;

            if (solidColor === null) {
                solidColor = [.5,.5,.5];
            }

            dataUrl = papaya.viewer.ScreenVolume.makeSolidIcon(solidColor[0], solidColor[1], solidColor[2]);

            data = {
                "menus" : [
                    {"label": "SurfaceButton", "icons": [dataUrl], "items": papaya.ui.Toolbar.SURFACE_MENU_DATA.items, "imageButton": true, "surfaceButton": true}
                ]
            };

            this.surfaceMenus.push((this.buildMenu(data.menus[0], null, this.viewer.surfaces[ctr], ctr.toString())));
        }
    }
};



papaya.ui.Toolbar.prototype.closeAllMenus = function (skipContext) {
    var menuHtml, modalDialogHtml, modalDialogBackgroundHtml, contextMenuHtml;

    menuHtml = this.container.toolbarHtml.find("." + PAPAYA_MENU_CSS);
    menuHtml.hide(100);
    menuHtml.remove();

    if (this.container.showControlBar) {
        menuHtml = this.container.sliderControlHtml.find("." + PAPAYA_MENU_CSS);
        menuHtml.hide(100);
        menuHtml.remove();
    }

    modalDialogHtml = this.container.toolbarHtml.find("." + PAPAYA_DIALOG_CSS);
    modalDialogHtml.hide(100);
    modalDialogHtml.remove();

    modalDialogBackgroundHtml = this.container.toolbarHtml.find("." + PAPAYA_DIALOG_BACKGROUND);
    modalDialogBackgroundHtml.hide(100);
    modalDialogBackgroundHtml.remove();

    // context menu
    if (!skipContext) {
        contextMenuHtml = this.container.viewerHtml.find("." + PAPAYA_MENU_CSS);
        if (contextMenuHtml) {
            contextMenuHtml.hide(100);
            contextMenuHtml.remove();
        }
    }
};



papaya.ui.Toolbar.prototype.isShowingMenus = function () {
    var menuVisible, dialogVisible;

    menuVisible = this.container.toolbarHtml.find("." + PAPAYA_MENU_CSS).is(":visible");
    dialogVisible = this.container.toolbarHtml.find("." + PAPAYA_DIALOG_CSS).is(":visible");

    return (menuVisible || dialogVisible);
};



papaya.ui.Toolbar.prototype.doAction = function (action, file, keepopen) {
    var imageIndex, colorTableName, dialog, atlasName, imageName, folder, ctr;

    if (!keepopen) {
        this.closeAllMenus();
    }

    if (action) {
        if (action.startsWith("ImageButton")) {
            imageIndex = parseInt(action.substr(action.length - 2, 1), 10);
            this.viewer.setCurrentScreenVol(imageIndex);
            this.updateImageButtons();
        } else if (action.startsWith("OpenSurface-")) {
            imageName = action.substring(action.indexOf("-") + 1);
            this.viewer.loadSurface(imageName);
        } else if (action.startsWith("Open-")) {
            imageName = action.substring(action.indexOf("-") + 1);
            this.viewer.loadImage(imageName);
        } else if (action === "OpenImage") {
            this.container.display.drawProgress(0.1, "Loading");
            this.viewer.loadImage(file);
        } else if (action === "OpenDTI") {
            this.container.display.drawProgress(0.1, "Loading");
            this.viewer.loadingDTI = true;
            this.viewer.loadImage(file);
        } else if (action === "OpenSurface") {
            this.container.display.drawProgress(0.1, "Loading");
            this.viewer.loadSurface(file);
        } else if (action === "OpenFolder") {
            folder = [];
            for (ctr = 0; ctr < file.length; ctr += 1) {
                if (file[ctr].name.startsWith('.')) {
                    console.log("Ignoring file " + file[ctr].name);
                } else {
                    folder.push(file[ctr]);
                }
            }

            this.container.display.drawProgress(0.1, "Loading");
            this.viewer.loadImage(folder);
        } else if (action.startsWith("ColorTable")) {
            colorTableName = action.substring(action.indexOf("-") + 1, action.lastIndexOf("-"));
            imageIndex = action.substring(action.lastIndexOf("-") + 1);
            this.viewer.screenVolumes[imageIndex].changeColorTable(this.viewer, colorTableName);
            this.updateImageButtons();
        } else if (action.startsWith("CloseAllImages")) {
            papaya.Container.resetViewer(this.container.containerIndex, {});
        } else if (action === "Preferences") {
            dialog = new papaya.ui.Dialog(this.container, "Viewer Preferences", papaya.ui.Toolbar.PREFERENCES_DATA,
                this.container.preferences, papaya.utilities.ObjectUtils.bind(this.container.preferences,
                    this.container.preferences.updatePreference),
                    papaya.utilities.ObjectUtils.bind(this,
                        function() {
                            this.viewer.updateScreenSliceTransforms();
                            this.viewer.drawViewer(false, true);
                        }
                    )
            );
            dialog.showDialog();
        } else if (action === "SurfacePreferences") {
            dialog = new papaya.ui.Dialog(this.container, "Surface Preferences", papaya.ui.Toolbar.PREFERENCES_SURFACE_DATA,
                this.container.preferences, papaya.utilities.ObjectUtils.bind(this.container.preferences,
                    this.container.preferences.updatePreference),
                papaya.utilities.ObjectUtils.bind(this,
                    function() {
                        this.viewer.updateScreenSliceTransforms();
                        this.viewer.surfaceView.updatePreferences();
                        this.viewer.drawViewer(false, true);
                    }
                )
            );
            dialog.showDialog();
        } else if (action === "License") {
            dialog = new papaya.ui.Dialog(this.container, "License", papaya.ui.Toolbar.LICENSE_DATA,
                papaya.Container, null, null, null, true);
            dialog.showDialog();
        } else if (action === "KeyboardRef") {
            dialog = new papaya.ui.Dialog(this.container, "Keyboard Reference", papaya.ui.Toolbar.KEYBOARD_REF_DATA,
                papaya.Container, null, null, null, true);
            dialog.showDialog();
        } else if (action === "MouseRef") {
            dialog = new papaya.ui.Dialog(this.container, "Mouse Reference", papaya.ui.Toolbar.MOUSE_REF_DATA,
                papaya.Container, null, null, null, true);
            dialog.showDialog();
        } else if (action.startsWith("ImageInfo")) {
            imageIndex = action.substring(action.lastIndexOf("-") + 1);

            if (this.viewer.screenVolumes[imageIndex].volume.numTimepoints > 1) {
                dialog = new papaya.ui.Dialog(this.container, "Image Info", papaya.ui.Toolbar.SERIES_INFO_DATA,
                    this.viewer, null, null, imageIndex.toString());
            } else {
                dialog = new papaya.ui.Dialog(this.container, "Image Info", papaya.ui.Toolbar.IMAGE_INFO_DATA,
                    this.viewer, null, null, imageIndex.toString());
            }

            dialog.showDialog();
        } else if (action.startsWith("SurfaceInfo")) {
            imageIndex = action.substring(action.lastIndexOf("-") + 1);

            dialog = new papaya.ui.Dialog(this.container, "Surface Info", papaya.ui.Toolbar.SURFACE_INFO_DATA,
                this.viewer, null, null, imageIndex.toString());
            dialog.showDialog();
        } else if (action.startsWith("ShowHeader")) {
            imageIndex = action.substring(action.lastIndexOf("-") + 1);

            dialog = new papaya.ui.Dialog(this.container, "Header", papaya.ui.Toolbar.HEADER_DATA,
                this.viewer, null, null, imageIndex.toString());

            dialog.showDialog();
        } else if (action.startsWith("SPACE")) {
            this.viewer.toggleWorldSpace();
            this.viewer.drawViewer(true);
        } else if (action.startsWith("AtlasChanged")) {
            atlasName = action.substring(action.lastIndexOf("-") + 1);
            this.viewer.atlas.currentAtlas = atlasName;
            this.viewer.drawViewer(true);
        } else if (action.startsWith("ShowRuler")) {
            if (this.container.preferences.showRuler === "Yes") {
                this.container.preferences.updatePreference("showRuler", "No");
            } else {
                this.container.preferences.updatePreference("showRuler", "Yes");
            }
            this.viewer.drawViewer();
            this.closeAllMenus();
        } else if (action.startsWith("ShowOrientation")) {
            if (this.container.preferences.showOrientation === "Yes") {
                this.container.preferences.updatePreference("showOrientation", "No");
            } else {
                this.container.preferences.updatePreference("showOrientation", "Yes");
            }
            this.viewer.drawViewer();
            this.closeAllMenus();
        } else if (action.startsWith("ShowCrosshairs")) {
            if (this.container.preferences.showCrosshairs === "Yes") {
                this.container.preferences.updatePreference("showCrosshairs", "No");
            } else {
                this.container.preferences.updatePreference("showCrosshairs", "Yes");
            }

            this.viewer.drawViewer();
            this.closeAllMenus();
        } else if (action.startsWith("EXPAND")) {
            if (this.container.collapsable) {
                this.container.collapseViewer();
            } else {
                this.container.expandViewer();
            }
        } else if (action.startsWith("OpenInMango")) {
            imageIndex = parseInt(action.substring(action.lastIndexOf("-") + 1), 10);

            if (imageIndex === 0) {
                if (this.container.viewer.volume.urls[0]) {
                    papaya.utilities.PlatformUtils.launchCustomProtocol(this.container, papaya.utilities.UrlUtils.getAbsoluteUrl(PAPAYA_CUSTOM_PROTOCOL,
                        this.container.viewer.volume.urls[0]), this.customProtocolResult);
                }
            } else {
                if (this.container.viewer.screenVolumes[imageIndex].volume.urls[0]) {
                    papaya.utilities.PlatformUtils.launchCustomProtocol(this.container, papaya.utilities.UrlUtils.getAbsoluteUrl(PAPAYA_CUSTOM_PROTOCOL,
                        this.container.viewer.screenVolumes[imageIndex].volume.urls[0]) + "?" +
                    encodeURIComponent("baseimage=" + this.container.viewer.volume.fileName + "&params=o"),
                        this.customProtocolResult);
                }
            }
        } else if (action.startsWith("CloseOverlay")) {
            imageIndex = parseInt(action.substring(action.lastIndexOf("-") + 1), 10);
            this.container.viewer.removeOverlay(imageIndex);
        } else if (action.startsWith("ToggleOverlay")) {
            imageIndex = parseInt(action.substring(action.lastIndexOf("-") + 1), 10);
            this.container.viewer.toggleOverlay(imageIndex);
        } else if (action.startsWith("Context-")) {
            this.container.contextManager.actionPerformed(action.substring(8));
        } else if (action.startsWith("DTI-RGB")) {
            imageIndex = action.substring(action.lastIndexOf("-") + 1);
            this.viewer.screenVolumes[imageIndex].dtiLines = false;
            this.viewer.screenVolumes[imageIndex].dtiColors = true;
            this.viewer.screenVolumes[imageIndex].initDTI();
            this.viewer.drawViewer(true, false);
        } else if (action.startsWith("DTI-LinesColors")) {
            imageIndex = action.substring(action.lastIndexOf("-") + 1);
            this.viewer.screenVolumes[imageIndex].dtiLines = true;
            this.viewer.screenVolumes[imageIndex].dtiColors = true;
            this.viewer.screenVolumes[imageIndex].initDTI();
            this.viewer.drawViewer(true, false);
        } else if (action.startsWith("DTI-Lines")) {
            imageIndex = action.substring(action.lastIndexOf("-") + 1);
            this.viewer.screenVolumes[imageIndex].dtiLines = true;
            this.viewer.screenVolumes[imageIndex].dtiColors = false;
            this.viewer.screenVolumes[imageIndex].initDTI();
            this.viewer.drawViewer(true, false);
        } else if (action.startsWith("DTI-Mod")) {
            imageIndex = action.substring(action.lastIndexOf("-") + 1);
            this.container.display.drawProgress(0.1, "Loading");
            this.viewer.loadingDTIModRef = this.viewer.screenVolumes[imageIndex];
            this.viewer.loadImage(file);
        } else if (action.startsWith("LoadNegatives")) {
            imageIndex = action.substring(action.lastIndexOf("-") + 1);
            this.viewer.addParametric(imageIndex);
        } else if (action.startsWith("ShowSurfacePlanes")) {
            this.viewer.surfaceView.showSurfacePlanes = !this.viewer.surfaceView.showSurfacePlanes;
            this.viewer.surfaceView.updateActivePlanes();

            if (this.container.preferences.showSurfacePlanes === "Yes") {
                this.container.preferences.updatePreference("showSurfacePlanes", "No");
            } else {
                this.container.preferences.updatePreference("showSurfacePlanes", "Yes");
            }
            this.viewer.drawViewer(false, true);
            this.closeAllMenus();
        } else if (action.startsWith("ShowSurfaceCrosshairs")) {
            this.viewer.surfaceView.showSurfaceCrosshairs = !this.viewer.surfaceView.showSurfaceCrosshairs;
            this.viewer.surfaceView.updateActivePlanes();

            if (this.container.preferences.showSurfaceCrosshairs === "Yes") {
                this.container.preferences.updatePreference("showSurfaceCrosshairs", "No");
            } else {
                this.container.preferences.updatePreference("showSurfaceCrosshairs", "Yes");
            }
            this.viewer.drawViewer(false, true);
            this.closeAllMenus();
        } else if (action.startsWith("rotation")) {
            this.viewer.screenVolumes[0].updateTransform();
        } else if (action.startsWith("Rotate About")) {
            this.viewer.screenVolumes[0].rotationAbout = action.substring(0, action.indexOf("-"));
            this.viewer.screenVolumes[0].updateTransform();
            this.viewer.drawViewer(true, false);
        } else if (action.startsWith("ResetTransform")) {
            this.viewer.screenVolumes[0].resetTransform();
            this.viewer.screenVolumes[0].updateTransform();
            this.viewer.drawViewer(true, false);
        }
    }
};



papaya.ui.Toolbar.prototype.customProtocolResult = function (success) {
    if (success === false) { // initiated by a setTimeout, so popup blocker will interfere with window.open
        if ((papaya.utilities.PlatformUtils.browser === "Chrome") || (papaya.utilities.PlatformUtils.browser === "Internet Explorer")) {
            alert("Mango does not appear to be installed.  You can download Mango at:\n\nhttp://ric.uthscsa.edu/mango");
        } else {
            if (papaya.utilities.PlatformUtils.ios) {
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
