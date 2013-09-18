
var papaya = papaya || {};
papaya.ui = papaya.ui || {};


papaya.ui.MenuItem = papaya.ui.MenuItem || function (label, action, callback) {
    this.label = label;
    this.action = action;
    this.id = this.action.replace(/ /g,"_");
    this.callback = callback;
}



papaya.ui.MenuItem.prototype.buildHTML = function (parentId) {
    var html = "<li id='" + this.id + "'><span class='unselectable'>" + this.label +"</span></li>";
    $("#"+parentId).append(html);
    $("#"+this.id).click(bind(this, this.doAction));
}



papaya.ui.MenuItem.prototype.doAction = function () {
    this.callback(this.action);
}
