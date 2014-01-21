
/*jslint browser: true, node: true */
/*global $, bind, showMenu, papayaMain, PAPAYA_TOOLBAR_ID, PAPAYA_TITLEBAR_ID */

"use strict";

var papaya = papaya || {};
papaya.ui = papaya.ui || {};



papaya.ui.Menu = papaya.ui.Menu || function (label, icons, callback, dataSource, modifier, isImageButton, isTitleBar) {
    this.label = isTitleBar ? PAPAYA_TITLEBAR_ID : label;
    this.icons = icons;
    this.callback = callback;
    this.dataSource = dataSource;
    this.items = [];

    if ((modifier === undefined) || (modifier === null)) {
        this.modifier = "";
    } else {
        this.modifier = modifier;
    }

    this.buttonId = this.label.replace(/ /g, "_").replace("...", "_") + (modifier || "");
    this.menuId = (this.label + "Menu").replace(/ /g, "_").replace("...", "_") + (modifier || "");
    this.isRight = (icons !== null);
    this.isImageButton = isImageButton;
    this.isTitleBar = isTitleBar;

    if (this.isTitleBar) {
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
        html = "<div id='" + this.buttonId + "' class='unselectable menuTitle' style='position:absolute;top:20px;width:" + toolbarHtml.width() + "px;text-align:center;'>" + this.label + "</div>";
    } else {
        html = "<span id='" + this.buttonId + "' class='unselectable menuLabel'>" + this.label + "</span>";
    }

    toolbarHtml.append(html);
    buttonHtml = $(buttonHtmlId);
    buttonHtml.click(bind(this, this.showMenu));

    menu = this;

    if (this.icons) {
        buttonImgHtmlId = "#" + this.buttonId + " > img";
        buttonImgHtml = $(buttonImgHtmlId);

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
            this.callback(this.buttonId);

            if (this.icons) {
                $("#" + this.buttonId + " > img").attr("src", this.icons[this.dataSource.getIndex(this.label)]);
            }

            button = $("#" + this.buttonId);
            this.buildMenu();
            menuHtml = $(menuHtmlId);
            menuHtml.hide();
            showMenu(papayaMain.papayaViewer, button[0], menuHtml[0], this.isRight);
        }
    } else {
        this.callback(this.buttonId);
        $("#" + this.buttonId + " > img").attr("src", this.icons[this.dataSource.getIndex(this.label)]);
    }
};
