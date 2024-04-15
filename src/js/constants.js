
// Minimum supported browsers
var PAPAYA_BROWSER_MIN_FIREFOX = 7,
    PAPAYA_BROWSER_MIN_CHROME = 7,
    PAPAYA_BROWSER_MIN_SAFARI = 6,
    PAPAYA_BROWSER_MIN_IE = 10,
    PAPAYA_BROWSER_MIN_OPERA = 12;

var PAPAYA_SURFACE_BROWSER_MIN_FIREFOX = 7,
    PAPAYA_SURFACE_BROWSER_MIN_CHROME = 8,
    PAPAYA_SURFACE_BROWSER_MIN_SAFARI = 6,
    PAPAYA_SURFACE_BROWSER_MIN_IE = 11,
    PAPAYA_SURFACE_BROWSER_MIN_OPERA = 12;

// Base CSS classes
var PAPAYA_CONTAINER_CLASS_NAME = "papaya",
    PAPAYA_CONTAINER_COLLAPSABLE = "papaya-collapsable",
    PAPAYA_CONTAINER_COLLAPSABLE_EXEMPT = "papaya-collapsable-exempt",
    PAPAYA_CONTAINER_FULLSCREEN = "papaya-fullscreen";


// Viewer CSS classes
var PAPAYA_VIEWER_CSS = "papaya-viewer";


// Toolbar CSS classes
var PAPAYA_TOOLBAR_CSS = "papaya-toolbar",
    PAPAYA_TITLEBAR_CSS = "papaya-titlebar",
    PAPAYA_SLIDER_CSS = "papaya-slider-slice",
    PAPAYA_KIOSK_CONTROLS_CSS = "papaya-kiosk-controls",
    PAPAYA_SIDENAVIGATION_CSS = "side-navbar",
    PAPAYA_SIDENAVPANEL_CSS = "side-navpanel",
    PAPAYA_SIDEDESCRIPTION_CSS = "side-description",
    PAPAYA_SIDETOOL_CONFIGURATION_CSS = "side-nav-tools-config";
// Display CSS classes
var PAPAYA_DISPLAY_CSS = "papaya-display";


// Dialog CSS classes
var PAPAYA_DIALOG_CSS = "papaya-dialog",
    PAPAYA_DIALOG_CONTENT_CSS = "papaya-dialog-content",
    PAPAYA_DIALOG_CONTENT_NOWRAP_CSS = "papaya-dialog-content-nowrap",
    PAPAYA_DIALOG_CONTENT_LABEL_CSS = "papaya-dialog-content-label",
    PAPAYA_DIALOG_CONTENT_CONTROL_CSS = "papaya-dialog-content-control",
    PAPAYA_DIALOG_TITLE_CSS = "papaya-dialog-title",
    PAPAYA_DIALOG_BUTTON_CSS = "papaya-dialog-button",
    PAPAYA_DIALOG_BACKGROUND = "papaya-dialog-background",
    PAPAYA_DIALOG_STOPSCROLL = "papaya-dialog-stopscroll",
    PAPAYA_DIALOG_CONTENT_HELP = "papaya-dialog-content-help";


// Menu CSS classes
var PAPAYA_MENU_CSS = "papaya-menu",
    PAPAYA_MENU_LABEL_CSS = "papaya-menu-label",
    PAPAYA_MENU_TITLEBAR_CSS = "papaya-menu-titlebar",
    PAPAYA_MENU_ICON_CSS = "papaya-menu-icon",
    PAPAYA_MENU_HOVERING_CSS = "papaya-menu-hovering",
    PAPAYA_MENU_SPACER_CSS = "papaya-menu-spacer",
    PAPAYA_MENU_UNSELECTABLE = "papaya-menu-unselectable",
    PAPAYA_MENU_FILECHOOSER = "papaya-menu-filechooser",
    PAPAYA_MENU_BUTTON_CSS = "papaya-menu-button",
    PAPAYA_MENU_BUTTON_HOVERING_CSS = "papaya-menu-button-hovering",
    PAPAYA_MENU_COLORTABLE_CSS = "papaya-menu-colortable",
    PAPAYA_MENU_INPUT_FIELD = "papaya-menu-input",
    PAPAYA_MENU_SLIDER = "papaya-menu-slider";


// Control CSS classes
var PAPAYA_CONTROL_INCREMENT_BUTTON_CSS = "papaya-control-increment",
    PAPAYA_CONTROL_GOTO_CENTER_BUTTON_CSS = "papaya-control-goto-center",
    PAPAYA_CONTROL_GOTO_ORIGIN_BUTTON_CSS = "papaya-control-goto-origin",
    PAPAYA_CONTROL_SWAP_BUTTON_CSS = "papaya-control-swap",
    PAPAYA_CONTROL_DIRECTION_SLIDER = "papaya-direction-slider",
    PAPAYA_CONTROL_MAIN_SLIDER = "papaya-main-slider",
    PAPAYA_CONTROL_MAIN_INCREMENT_BUTTON_CSS = "papaya-main-increment",
    PAPAYA_CONTROL_MAIN_DECREMENT_BUTTON_CSS = "papaya-main-decrement",
    PAPAYA_CONTROL_MAIN_SWAP_BUTTON_CSS = "papaya-main-swap",
    PAPAYA_CONTROL_MAIN_GOTO_CENTER_BUTTON_CSS = "papaya-main-goto-center",
    PAPAYA_CONTROL_MAIN_GOTO_ORIGIN_BUTTON_CSS = "papaya-main-goto-origin",
    PAPAYA_CONTROL_BAR_LABELS_CSS = "papaya-controlbar-label";



// Utils CSS classes
var PAPAYA_UTILS_CHECKFORJS_CSS = "checkForJS",
    PAPAYA_UTILS_UNSUPPORTED_CSS = "papaya-utils-unsupported",
    PAPAYA_UTILS_UNSUPPORTED_MESSAGE_CSS = "papaya-utils-unsupported-message";


// Deprecated IDs
var PAPAYA_DEFAULT_VIEWER_ID = "papayaViewer",
    PAPAYA_DEFAULT_DISPLAY_ID = "papayaDisplay",
    PAPAYA_DEFAULT_TOOLBAR_ID = "papayaToolbar",
    PAPAYA_DEFAULT_CONTAINER_ID = "papayaContainer",
    PAPAYA_DEFAULT_SLIDER_ID = "papayaSliceSlider";


// Misc constants
var PAPAYA_SPACING = 3,
    PAPAYA_PADDING = 8,
    PAPAYA_MENU_SPACING = 25,
    PAPAYA_CONTAINER_PADDING = 20,
    PAPAYA_CONTAINER_PADDING_TOP = PAPAYA_CONTAINER_PADDING,
    PAPAYA_MANGO_INSTALLED = "mangoinstalled",
    PAPAYA_CUSTOM_PROTOCOL = "mango";

// GZIP constants
var GUNZIP_MAGIC_COOKIE1 = 31,
    GUNZIP_MAGIC_COOKIE2 = 139;

// RULER constants
var PAPAYA_RULER_FONT_SIZE = "rulerFontSize",
    PAPAYA_RULER_LINE_WIDTH = "rulerLineWidth",
    PAPAYA_RULER_COLOR = "rulerColor",
    PAPAYA_RULER_LENGTH_UNIT = "rulerLengthUnit",
    PAPAYA_RULER_ACTIVE_COLOR = "activeRulerColor";

//Crosshair div constant
var PAPAYA_CROSSHAIR_DIV_AXIAL_RED = "crossHairAxialRed",
    PAPAYA_CROSSHAIR_DIV_CORONAL_GREEN = "crossHairCoronalGreen",
    PAPAYA_CROSSHAIR_DIV_SAGITTAL_BLUE = "crossHairSagitalBlue",
    PAPAYA_CROSSHAIR_DIV_SURFACE_YELLOW = "crossHairSurfaceYellow";

//Selected Slice DIV
var PAPAYA_SELECTED_SLICE_DIV_AXIAL_RED = "selectedSliceAxialRed",
    PAPAYA_SELECTED_SLICE_DIV_CORONAL_GREEN = "selectedSliceCoronalGreen",
    PAPAYA_SELECTED_SLICE_DIV_SAGITTAL_BLUE = "selectedSliceSagitalBlue",
    PAPAYA_SELECTED_SLICE_DIV_SURFACE_YELLOW = "selectedSliceSurfaceYellow";

//MainImage Overlays
var PAPAYA_MAIN_IMAGE_OVERLAYS_TOP_LEFT = "mainImageOverlaysTopLeft",
    PAPAYA_MAIN_IMAGE_OVERLAYS_TOP_RIGHT = "mainImageOverlaysTopRight",
    PAPAYA_MAIN_IMAGE_OVERLAYS_BOTTOM_LEFT = "mainImageOverlaysBottomLeft",
    PAPAYA_MAIN_IMAGE_OVERLAYS_BOTTOM_RIGHT = "mainImageOverlaysBottomRight";

//Buttons Side Nav
var PAPAYA_SIDENAV_BUTTON_CROSSHAIR = "drawCrossHairImages",
    PAPAYA_SIDENAV_BUTTON_STACK = "stackImages",
    PAPAYA_SIDENAV_BUTTON_WINDOWLEVEL = "windowLevelImages",
    PAPAYA_SIDENAV_BUTTON_ZOOM = "zoomImages",
    PAPAYA_SIDENAV_BUTTON_PAN = "panImages",
    PAPAYA_SIDENAV_BUTTON_MAGNIFY = "magnifyImages",
    PAPAYA_SIDENAV_BUTTON_INVERT = "invertImageTool",
    PAPAYA_SIDENAV_BUTTON_PLAYCENE = "playClipImages",
    PAPAYA_SIDENAV_BUTTON_RULER = "drawRulerOnImages",
    PAPAYA_SIDENAV_BUTTON_ANGLE = "drawAngleOnImages",
    PAPAYA_SIDENAV_BUTTON_COBSANGLE = "drawCobsAngleOnImages",
    PAPAYA_SIDENAV_BUTTON_REACTANGLE = "drawReactangleOnImages",
    PAPAYA_SIDENAV_BUTTON_ELLIPSE = "drawEllipseOnImages",
    PAPAYA_SIDENAV_BUTTON_PROBE = "drawProbeOnImages",
    PAPAYA_SIDENAV_BUTTON_RESET = "resetImages";

//Button Side Nav Panel
var PAPAYA_NAVPANEL_BUTTON_REVERSE = "reverseCene",
    PAPAYA_NAVPANEL_BUTTON_REPEAT = "repeatCene";

