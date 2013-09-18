
var papaya = papaya || {};
papaya.ui = papaya.ui || {};


papaya.ui.Menu = papaya.ui.Menu || function (label, icon, callback, isRight) {
    this.label = label;
    this.icon = icon;
    this.callback = callback;
    this.items = new Array();
    this.buttonId = this.label.replace(/ /g,"_");
    this.menuId = (this.label + "Menu").replace(/ /g,"_");
    this.isRight = isRight;
}



papaya.ui.Menu.prototype.buildMenuButton = function() {
    $("#"+this.buttonId).remove();

    var html = null;

    if (this.icon) {
        html = "<span id='" + this.buttonId + "' class='unselectable menuIcon imageButton' " + (this.isRight ? " style='float:right'" : "") + ">" +
                "<img style='width:" + papaya.viewer.ColorTable.ICON_SIZE + "px; height:" + papaya.viewer.ColorTable.ICON_SIZE + "px; vertical-align:bottom; border:2px outset;' src='" + this.icon + "' />" +
            "</span>";
    } else {
        html = "<span id='" + this.buttonId + "' class='unselectable menuLabel'>" +
                this.label +
            "</span>";
    }

    $("#"+PAPAYA_TOOLBAR_ID).append(html);
    $("#"+this.buttonId).click(bind(this, this.showMenu));

    if (this.icon) {
        $("#"+this.buttonId + " > img").mousedown(function() {
            $(this).css({ 'border': '2px solid gray' });
        });

        $("#"+this.buttonId + " > img").mouseup(function() {
            $(this).css({ 'border': '2px outset' });
        });
    }

    return this.buttonId;
}


papaya.ui.Menu.prototype.setMenuButton = function(buttonId) {
    this.buttonId = buttonId;
}



papaya.ui.Menu.prototype.buildMenu = function() {
    var html = "<ul id='" + this.menuId + "' class='menu'></ul>";
    $("#"+PAPAYA_TOOLBAR_ID).append(html);

    for (var ctr = 0; ctr < this.items.length; ctr++) {
        var buttonHtml = this.items[ctr].buildHTML(this.menuId);
    }
}



papaya.ui.Menu.prototype.addMenuItem = function(menuitem) {
    this.items.push(menuitem);
}



papaya.ui.Menu.prototype.showMenu = function() {
    this.callback();
    $("#"+this.menuId).remove();

    var button = $("#"+this.buttonId);

    this.buildMenu();
    $("#"+this.menuId).hide();
    $("#"+this.menuId).show().position({
        my: (this.isRight ? "right" : "left") + " top",
        at: (this.isRight ? "right" : "left") + " bottom",
        of: button
    });
}
