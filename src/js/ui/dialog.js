
/*jslint browser: true, node: true */
/*global $, isStringBlank, derefIn, bind, PAPAYA_DEFAULT_CONTAINER_ID, showModalDialog, PAPAYA_DIALOG_CSS,
  PAPAYA_DIALOG_CONTENT_CSS, PAPAYA_DIALOG_CONTENT_LABEL_CSS, PAPAYA_DIALOG_CONTENT_CONTROL_CSS,
  PAPAYA_DIALOG_TITLE_CSS, PAPAYA_DIALOG_BUTTON_CSS, PAPAYA_DIALOG_BACKGROUND, PAPAYA_DIALOG_STOPSCROLL */

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
    var ctr, ctrOpt, html, val, itemsHtml, thisHtml, thisHtmlId, disabled, bodyHtml;

    thisHtmlId = "#" + this.id;
    thisHtml = $(thisHtmlId);
    thisHtml.remove();

    bodyHtml = $("body");

    html = "<div id='" + this.id + "' class='" + PAPAYA_DIALOG_CSS + "'><span class='" + PAPAYA_DIALOG_TITLE_CSS + "'>" + this.title + "</span>";

    if (this.content) {
        html += "<div class='" + PAPAYA_DIALOG_CONTENT_CSS + "'><table>";

        for (ctr = 0; ctr < this.content.items.length; ctr += 1) {
            if (this.content.items[ctr].spacer) {
                html += "<tr><td class='" + PAPAYA_DIALOG_CONTENT_LABEL_CSS + "'>&nbsp;</td><td class='" + PAPAYA_DIALOG_CONTENT_CONTROL_CSS + "'>&nbsp;</td></tr>";
            } else if (this.content.items[ctr].readonly) {
                html += "<tr><td class='" + PAPAYA_DIALOG_CONTENT_LABEL_CSS + "'>" + this.content.items[ctr].label + "</td><td class='" + PAPAYA_DIALOG_CONTENT_CONTROL_CSS + "' id='" + this.content.items[ctr].field + "'></td></tr>";
            } else {
                if (this.content.items[ctr].disabled && (bind(this.container, derefIn(this, this.content.items[ctr].disabled)))() === true) {
                    disabled = "disabled='disabled'";
                } else {
                    disabled = "";
                }

                html += "<tr><td class='" + PAPAYA_DIALOG_CONTENT_LABEL_CSS + "'>" + this.content.items[ctr].label + "</td><td class='" + PAPAYA_DIALOG_CONTENT_CONTROL_CSS + "'><select " + disabled
                    + " id='" + this.content.items[ctr].field + "'>";
                for (ctrOpt = 0; ctrOpt < this.content.items[ctr].options.length; ctrOpt += 1) {
                    html += "<option value='" + this.content.items[ctr].options[ctrOpt] + "'>" + this.content.items[ctr].options[ctrOpt] + "</option>";
                }

                html += "</select></td></tr>";
            }
        }

        html += "</table></div>";
    }

    html += "<div class='" + PAPAYA_DIALOG_BUTTON_CSS + "'><button type='button' id='" + this.id + "-Ok" + "'>Ok</button></div></div>";

    bodyHtml.append('<div class="' + PAPAYA_DIALOG_BACKGROUND + '"></div>');
    bodyHtml.append(html);

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

    thisHtml = $(thisHtmlId);
    showModalDialog(this.viewer, thisHtml[0]);
    bodyHtml.addClass(PAPAYA_DIALOG_STOPSCROLL);
};



papaya.ui.Dialog.prototype.doOk = function () {
    var modalDialogHtml, modelDialogBackgroundHtml;

    modalDialogHtml = $("." + PAPAYA_DIALOG_CSS);
    modelDialogBackgroundHtml = $("." + PAPAYA_DIALOG_BACKGROUND);

    modalDialogHtml.hide(100);
    modelDialogBackgroundHtml.hide(100);

    modalDialogHtml.remove();
    modelDialogBackgroundHtml.remove();

    $("body").removeClass(PAPAYA_DIALOG_STOPSCROLL);
};



papaya.ui.Dialog.prototype.doAction = function (action) {
    this.callback(action, $("#" + action).val());
};
