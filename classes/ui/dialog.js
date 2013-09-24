
var papaya = papaya || {};
papaya.ui = papaya.ui || {};


papaya.ui.Dialog = papaya.ui.Dialog || function (title, content, dataSource, callback, modifier) {
    this.title = title;
    this.modifier = "";
    if (!isStringBlank(modifier)) {
        this.modifier = modifier;
    }
    this.id = this.title.replace(/ /g,"_");
    this.content = content;
    this.dataSource = dataSource;
    this.callback = callback;
}


papaya.ui.Dialog.prototype.showDialog = function() {
    $("#"+this.id).remove();

    var html = "<div id='" + this.id + "' class='modalDialog'><span class='modalTitle'>" + this.title + "</span>";

    if (this.content) {
        html += "<div class='modalDialogContent'><table>";

        for (var ctr = 0; ctr < this.content.items.length; ctr++) {
            if (this.content.items[ctr].spacer) {
                html += "<tr><td class='modalDialogContentLabel'>&nbsp;</td><td class='modalDialogContentControl'>&nbsp;</td></tr>";
            } else if (this.content.items[ctr].readonly) {
                html += "<tr><td class='modalDialogContentLabel'>" + this.content.items[ctr].label + "</td><td class='modalDialogContentControl' id='" + this.content.items[ctr].field + "'></td></tr>";
            } else {
                html += "<tr><td class='modalDialogContentLabel'>" + this.content.items[ctr].label + "</td><td class='modalDialogContentControl'><select id='" + this.content.items[ctr].field + "'>";
                for (var ctrOpt = 0; ctrOpt < this.content.items[ctr].options.length; ctrOpt++) {
                    html += "<option value='" + this.content.items[ctr].options[ctrOpt] + "'>" + this.content.items[ctr].options[ctrOpt] + "</option>"
                }

                html += "</select></td></tr>"
            }
        }

        html += "</table></div>";
    }

    html += "<div class='modalDialogButtonToolbar'><button type='button' id='" + this.id + "-Ok" + "'>Ok</button></div></div>";

    $("body").append(html);

    for (var ctr = 0; ctr < this.content.items.length; ctr++) {
        if (this.content.items[ctr].spacer) {
            // do nothing
        } else if (this.content.items[ctr].readonly) {
            var val = this.dataSource[this.content.items[ctr].field](this.modifier);
            if (val != null) {
                $("#"+this.content.items[ctr].field).html(val);
            } else {
                $("#"+this.content.items[ctr].field).parent().remove();
            }
        } else {
            $("#"+this.content.items[ctr].field).val(this.dataSource[this.content.items[ctr].field]);
            $("#"+this.content.items[ctr].field).change(bind(this, this.doAction, [this.content.items[ctr].field]));
        }
    }

    $("#"+this.id + "-Ok").click(bind(this, this.doOk));
    $("#"+PAPAYA_CONTAINER_ID).addClass("modalBackground");

    showModalDialog(papayaMain.papayaViewer, $("#"+this.id)[0]);
}


papaya.ui.Dialog.prototype.doOk = function() {
    $(".modalDialog").hide(100);
    $(".modalDialog").remove();
    $("#"+PAPAYA_CONTAINER_ID).removeClass("modalBackground");
}



papaya.ui.Dialog.prototype.doAction = function(action) {
    this.callback(action, $("#"+action).val());
}
