
var papaya = papaya || {};
papaya.ui = papaya.ui || {};


papaya.ui.MenuItemRange = papaya.ui.MenuItemRange || function (label, action, callback, dataSource, method, modifier) {
    this.label = label;

    this.modifier = "";
    if (modifier != undefined) {
        this.modifier = "-"+modifier;
    }

    this.action = action+this.modifier;
    this.minId = this.action.replace(/ /g,"_") + "Min";
    this.maxId = this.action.replace(/ /g,"_") + "Max";
    this.callback = callback;
    this.dataSource = dataSource;
    this.method = method;
}



papaya.ui.MenuItemRange.prototype.buildHTML = function (parentId) {
    var range = this.dataSource[this.method]();
    var html = "<li id='" + this.id + "'><span class='unselectable'>" + this.label + ": &nbsp;<input type='text' size='7' id='" + this.minId + "' value='" + range[0] + "' /> to <input type='text' size='7' id='" + this.maxId + "' value='" + range[1] + "' /></span></li>";
    $("#"+parentId).append(html);
    $("#"+this.id).hover(function(){$(this).toggleClass('menuHover');});

    $("#"+this.minId).change(bind(this, function() {
        this.dataSource.setScreenRange(parseFloat($("#"+this.minId).val()), parseFloat($("#"+this.maxId).val()));
        papayaMain.papayaViewer.drawViewer(true);
    }));

    $("#"+this.maxId).change(bind(this, function() {
        this.dataSource.setScreenRange(parseFloat($("#"+this.minId).val()), parseFloat($("#"+this.maxId).val()));
        papayaMain.papayaViewer.drawViewer(true);
    }));
}
