
/*jslint browser: true, node: true */
/*global $, bind, showMenu, PAPAYA_TOOLBAR_ID, PAPAYA_TITLEBAR_ID, PAPAYA_VIEWER_ID */

"use strict";

var papaya = papaya || {};
papaya.ui = papaya.ui || {};



papaya.ui.Menu = papaya.ui.Menu || function (viewer, menuData, callback, dataSource, modifier) {
    this.viewer = viewer;
    this.isTitleBar = menuData.titleBar;
    this.label = this.isTitleBar ? PAPAYA_TITLEBAR_ID : menuData.label;
    this.icons = menuData.icons;
    this.callback = callback;
    this.dataSource = dataSource;
    this.items = [];
    this.rangeItem = null;
    this.menuOnHover = menuData.menuOnHover;

    if ((modifier === undefined) || (modifier === null)) {
        this.modifier = "";
    } else {
        this.modifier = modifier;
    }

    this.buttonId = this.label.replace(/ /g, "_").replace("...", "_") + (modifier || "");
    this.menuId = (this.label + "Menu").replace(/ /g, "_").replace("...", "_") + (modifier || "");
    this.isRight = (menuData.icons !== null);
    this.isImageButton = menuData.imageButton;

    if (this.isTitleBar) {  // if titleBar, clear label after IDs are constructed
        this.label = "";
    }
};



papaya.ui.Menu.prototype.buildMenuButton = function () {
    var html, menu, buttonHtml, buttonHtmlId, buttonImgHtml, buttonImgHtmlId, toolbarId, toolbarHtml;

    buttonHtmlId = "#" + this.buttonId;
    buttonHtml = $(buttonHtmlId);
    buttonHtml.remove();

    toolbarId = "#" + PAPAYA_TOOLBAR_ID;
    toolbarHtml = $(toolbarId);

    html = null;

    if (this.icons) {
        html = "<span id='" + this.buttonId + "' class='unselectable menuIcon" + (this.isImageButton ? " imageButton'" : "'") + (this.isRight ? " style='float:right'" : "") + ">" +
                "<img style='width:" + papaya.viewer.ColorTable.ICON_SIZE + "px; height:" + papaya.viewer.ColorTable.ICON_SIZE + "px; vertical-align:bottom; ";

        if (this.dataSource.isSelected(parseInt(this.modifier, 10))) {
            html += "border:2px outset #FF5A3D;background-color:#eeeeee;padding:1px;";
        } else {
            html += "border:2px outset lightgray;background-color:#eeeeee;padding:1px;";
        }

        html += "' src='" + this.icons[this.dataSource.getIndex(this.label)] + "' /></span>";
    } else if (this.isTitleBar) {



        html = "<div id='" + this.buttonId + "' class='unselectable menuTitle' style='z-index:-1;position:absolute;top:" + ($("#" + PAPAYA_VIEWER_ID).position().top - 1.25 * papaya.ui.Toolbar.SIZE)
            + "px;width:" + toolbarHtml.width() + "px;text-align:center;'>" + this.label + "</div>";
    } else {
        html = "<span id='" + this.buttonId + "' class='unselectable menuLabel'>" + this.label + "</span>";
    }

    toolbarHtml.append(html);
    buttonHtml = $(buttonHtmlId);
    buttonImgHtmlId = "#" + this.buttonId + " > img";
    buttonImgHtml = $(buttonImgHtmlId);

    if (this.menuOnHover) {
        buttonImgHtml.mouseover(bind(this, this.showMenu));
    }

    buttonHtml.click(bind(this, this.doClick));

    menu = this;

    if (this.icons) {
        buttonImgHtml.hover(
            function () {
                if (menu.icons.length > 1) {
                    $(this).css({"border-color": "gray"});
                } else {
                    $(this).css({"border-color": "#FF5A3D"});
                }
            },
            bind(menu, function () {
                if (menu.dataSource.isSelected(parseInt(menu.modifier, 10)) && menu.dataSource.isSelectable()) {
                    $("#" + menu.buttonId + " > img").css({"border-color": "#FF5A3D"});
                } else {
                    $("#" + menu.buttonId + " > img").css({"border-color": "lightgray"});
                }
            })
        );

        buttonImgHtml.mousedown(function () {
            $(this).css({ 'border': '2px inset lightgray' });
        });

        buttonImgHtml.mouseup(function () {
            $(this).css({ 'border': '2px outset lightgray' });
        });
    } else if (!this.isTitleBar) {
        buttonHtml.hover(function () {$(this).toggleClass('menuButtonHover'); });
    }

    return this.buttonId;
};



papaya.ui.Menu.prototype.setMenuButton = function (buttonId) {
    this.buttonId = buttonId;
};



papaya.ui.Menu.prototype.buildMenu = function () {
    var ctr, html, buttonHtml;

    html = "<ul id='" + this.menuId + "' class='menu'></ul>";
    $("#" + PAPAYA_TOOLBAR_ID).append(html);

    for (ctr = 0; ctr < this.items.length; ctr += 1) {
        buttonHtml = this.items[ctr].buildHTML(this.menuId);
    }
};



papaya.ui.Menu.prototype.addMenuItem = function (menuitem) {
    if (menuitem instanceof papaya.ui.MenuItemRange) {
        this.rangeItem = menuitem;
    }

    this.items.push(menuitem);
};



papaya.ui.Menu.prototype.showMenu = function () {
    var isShowing, button, menuHtml, menuHtmlId;

    if (this.items.length > 0) {
        menuHtmlId = "#" + this.menuId;
        menuHtml = $(menuHtmlId);

        isShowing = menuHtml.is(":visible");

        menuHtml.remove();

        if (!isShowing) {
            button = $("#" + this.buttonId);
            this.buildMenu();
            menuHtml = $(menuHtmlId);
            menuHtml.hide();
            showMenu(this.viewer, button[0], menuHtml[0], this.isRight);
        }
    }
};



papaya.ui.Menu.prototype.doClick = function () {
    var isShowing, menuHtml, menuHtmlId;
    menuHtmlId = "#" + this.menuId;
    menuHtml = $(menuHtmlId);
    isShowing = menuHtml.is(":visible");

    this.callback(this.buttonId);

    if (this.icons) {
        $("#" + this.buttonId + " > img").attr("src", this.icons[this.dataSource.getIndex(this.label)]);
    }

    if (!this.menuOnHover && !isShowing) {
        this.showMenu();
    }
};


papaya.ui.Menu.prototype.updateRangeItem = function (min, max) {
    if (this.rangeItem) {
        $("#" + this.rangeItem.minId).val(min);
        $("#" + this.rangeItem.maxId).val(max);
    }
};
