
/*jslint browser: true, node: true */
/*global $, isStringBlank, bind, PAPAYA_DEFAULT_CONTAINER_ID, showModalDialog */

"use strict";

var papaya = papaya || {};
papaya.ui = papaya.ui || {};



papaya.ui.Dialog = papaya.ui.Dialog || function (container, title, content, dataSource, callback, modifier) {
    this.container = container;
    this.viewer = container.viewer;
    this.title = title;
    this.modifier = "";
    if (!isStringBlank(modifier)) {
        this.modifier = modifier;
    }
    this.id = this.title.replace(/ /g, "_");
    this.content = content;
    this.dataSource = dataSource;
    this.callback = callback;
};



papaya.ui.Dialog.prototype.showDialog = function () {
    var ctr, ctrOpt, html, val, itemsHtml, thisHtml, thisHtmlId, disabled;

    thisHtmlId = "#" + this.id;
    thisHtml = $(thisHtmlId);
    thisHtml.remove();

    html = "<div id='" + this.id + "' class='modalDialog'><span class='modalTitle'>" + this.title + "</span>";

    if (this.content) {
        html += "<div class='modalDialogContent'><table>";

        for (ctr = 0; ctr < this.content.items.length; ctr += 1) {
            if (this.content.items[ctr].spacer) {
                html += "<tr><td class='modalDialogContentLabel'>&nbsp;</td><td class='modalDialogContentControl'>&nbsp;</td></tr>";
            } else if (this.content.items[ctr].readonly) {
                html += "<tr><td class='modalDialogContentLabel'>" + this.content.items[ctr].label + "</td><td class='modalDialogContentControl' id='" + this.content.items[ctr].field + "'></td></tr>";
            } else {
                if (this.content.items[ctr].disabled && (deref(this.content.items[ctr].disabled) === true)) {
                    disabled = "disabled='disabled'";
                } else {
                    disabled = "";
                }

                html += "<tr><td class='modalDialogContentLabel'>" + this.content.items[ctr].label + "</td><td class='modalDialogContentControl'><select " + disabled
                    + " id='" + this.content.items[ctr].field + "'>";
                for (ctrOpt = 0; ctrOpt < this.content.items[ctr].options.length; ctrOpt += 1) {
                    html += "<option value='" + this.content.items[ctr].options[ctrOpt] + "'>" + this.content.items[ctr].options[ctrOpt] + "</option>";
                }

                html += "</select></td></tr>";
            }
        }

        html += "</table></div>";
    }

    html += "<div class='modalDialogButtonToolbar'><button type='button' id='" + this.id + "-Ok" + "'>Ok</button></div></div>";

    $("body").append(html);

    for (ctr = 0; ctr < this.content.items.length; ctr += 1) {
        if (this.content.items[ctr].readonly) {
            val = this.dataSource[this.content.items[ctr].field](this.modifier);
            if (val !== null) {
                $("#" + this.content.items[ctr].field).html(val);
            } else {
                $("#" + this.content.items[ctr].field).parent().remove();
            }
        } else if (!this.content.items[ctr].spacer) {
            itemsHtml = $("#" + this.content.items[ctr].field);
            itemsHtml.val(this.dataSource[this.content.items[ctr].field]);
            itemsHtml.change(bind(this, this.doAction, [this.content.items[ctr].field]));
        }
    }

    $("#" + this.id + "-Ok").click(bind(this, this.doOk));
    $("#" + PAPAYA_DEFAULT_CONTAINER_ID).addClass("modalBackground");

    thisHtml = $(thisHtmlId);
    showModalDialog(this.viewer, thisHtml[0]);
};



papaya.ui.Dialog.prototype.doOk = function () {
    var modalDialogHtml = $(".modalDialog");

    modalDialogHtml.hide(100);
    modalDialogHtml.remove();
    $("#" + PAPAYA_DEFAULT_CONTAINER_ID).removeClass("modalBackground");
};



papaya.ui.Dialog.prototype.doAction = function (action) {
    this.callback(action, $("#" + action).val());
};
