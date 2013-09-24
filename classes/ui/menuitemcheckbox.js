
var papaya = papaya || {};
papaya.ui = papaya.ui || {};


papaya.ui.MenuItemCheckBox = papaya.ui.MenuItemCheckBox || function (label, action, callback, dataSource, method, modifier) {
    this.label = label;

    this.modifier = "";
    if (modifier != undefined) {
        this.modifier = "-"+modifier;
    }

    this.action = action+this.modifier;
    this.method = method;
    this.id = this.action.replace(/ /g,"_");
    this.callback = callback;
    this.dataSource = dataSource;
}


papaya.ui.MenuItemCheckBox.CHECKBOX_UNSELECTED_CODE = "&#9744;";
papaya.ui.MenuItemCheckBox.CHECKBOX_SELECTED_CODE = "&#9745;";


papaya.ui.MenuItemCheckBox.prototype.buildHTML = function (parentId) {
    var selected = this.dataSource[this.method](this.label);

    var checked = "";
    if (selected) {
        checked = "checked='checked'";
    }

    var html = "<li id='" + this.id + "'><input type='radio' class='ColorTableGroup' name='ColorTableGroup' id='" + this.id + "' value='" + this.id  + "' " + checked + "><span class='unselectable'>&nbsp;" + this.label + "</span></li>";
    $("#"+parentId).append(html);
    $("#"+this.id).click(bind(this, this.doAction));
    $("#"+this.id).hover(function(){$(this).toggleClass('menuHover');});
}


papaya.ui.MenuItemCheckBox.prototype.doAction = function () {
    $(".ColorTableGroup").removeAttr('checked');
    $("#"+this.id+" > input")[0].checked = true;

    this.callback(this.action, null, true);
}
