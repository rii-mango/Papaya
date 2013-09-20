
var papaya = papaya || {};
papaya.ui = papaya.ui || {};


papaya.ui.MenuItemCheckBox = papaya.ui.MenuItemCheckBox || function (label, action, callback, dataSource, modifier) {
    this.label = label;

    this.modifier = "";
    if (modifier != undefined) {
        this.modifier = "-"+modifier;
    }

    this.action = action+this.modifier;
    this.id = this.action.replace(/ /g,"_");
    this.callback = callback;
    this.dataSource = dataSource;
}


papaya.ui.MenuItemCheckBox.CHECKBOX_UNSELECTED_CODE = "&#9744;";
papaya.ui.MenuItemCheckBox.CHECKBOX_SELECTED_CODE = "&#9745;";


papaya.ui.MenuItemCheckBox.prototype.buildHTML = function (parentId) {
    var selected = this.dataSource(this.label);

    var bulletSymbol = null;
    if (selected) {
        bulletSymbol = papaya.ui.MenuItemCheckBox.CHECKBOX_SELECTED_CODE;
    } else {
        bulletSymbol = papaya.ui.MenuItemCheckBox.CHECKBOX_UNSELECTED_CODE;
    }

    var html = "<li id='" + this.id + "'><span class='bullet'>"+bulletSymbol+"</span><span class='unselectable'>" + this.label + "</span></li>";
    $("#"+parentId).append(html);
    $("#"+this.id).click(bind(this, this.doAction));
    $("#"+this.id).hover(function(){$(this).toggleClass('menuHover');});
}



papaya.ui.MenuItemCheckBox.prototype.doAction = function () {
    this.callback(this.action);
}
