var tests = [];

function initTest() {
    var params = [];
    tests[tests.length] = params;
    return params;
}

var params;


// Image Parameters
params = initTest();
params["images"] = ["data/sample_image.nii.gz"];
params["message"] = "Test: basic.";

params = initTest();
params["images"] = ["data/sample_image.nii.gz"];
params["sample_image.nii.gz"] = {lut: "Gold"};
params["message"] = "Test: lut.";

params = initTest();
params["images"] = ["data/sample_image.nii.gz"];
params["sample_image.nii.gz"] = {min: 75.0, max: 255.0};
params["message"] = "Test: min, max.";

params = initTest();
params["images"] = ["data/sample_image.nii.gz"];
params["sample_image.nii.gz"] = {minPercent: 0.5, maxPercent: 0.75};
params["message"] = "Test: minPercent, maxPercent.";

params = initTest();
params["images"] = ["data/sample_image.nii.gz"];
params["worldSpace"] = true;
params["luts"] = [{"name": "Custom", "data":[[0, 1, 0, 0], [0.5, 0, 1, 0], [1, 1, 1, 1]]}];
params["sample_image.nii.gz"] = {lut: "Custom"};
params["message"] = "Test: luts (custom color table knots).";

params = initTest();
params["images"] = ["data/sample_image.nii.gz"];
params["sample_image.nii.gz"] = {rotation: [0, 0, 45]};
params["message"] = "Test: rotation.";

params = initTest();
params["images"] = ["data/sample_image.nii.gz"];
params["coordinate"] = [10, 20, 30];
params["sample_image.nii.gz"] = {rotation: [0, 0, 45], rotationPoint: "crosshairs"};
params["message"] = "Test: rotation, rotationPoint.";

params = initTest();
params["images"] = ["data/sample_image.nii.gz", "data/zstat1.nii.gz"];
params["message"] = "Test: overlay.";

params = initTest();
params["images"] = ["data/sample_image.nii.gz", "data/zstat1.nii.gz"];
params["worldSpace"] = true;
params["message"] = "Test: overlay, worldSpace.";

params = initTest();
params["images"] = ["data/sample_image.nii.gz", "data/zstat1.nii.gz", "data/zstat2.nii.gz"];
params["worldSpace"] = true;
params["message"] = "Test: overlay (two).";

params = initTest();
params["images"] = ["data/sample_image.nii.gz", "data/zstat1.nii.gz"];
params["worldSpace"] = true;
params["zstat1.nii.gz"] = {alpha: 0.5};
params["message"] = "Test: overlay, alpha.";

params = initTest();
params["images"] = ["data/sample_image.nii.gz", "data/zstat1.nii.gz"];
params["worldSpace"] = true;
params["zstat1.nii.gz"] = {interpolation: false};
params["message"] = "Test: overlay, interpolation (false).";

params = initTest();
params["images"] = ["data/sample_image.nii.gz", "data/zstat1.nii.gz"];
params["worldSpace"] = true;
params["zstat1.nii.gz"] = {lut: "Gold"};
params["message"] = "Test: overlay, lut.";

params = initTest();
params["images"] = ["data/sample_image.nii.gz", "data/zstat1.nii.gz"];
params["worldSpace"] = true;
params["zstat1.nii.gz"] = {min: 2.0, max: 5.0};
params["message"] = "Test: overlay, min, max.";

params = initTest();
params["images"] = ["data/sample_image.nii.gz", "data/zstat1.nii.gz"];
params["worldSpace"] = true;
params["zstat1.nii.gz"] = {minPercent: 0.5, maxPercent: 0.75};
params["message"] = "Test: overlay, minPercent, maxPercent.";

params = initTest();
params["images"] = ["data/sample_image.nii.gz", "data/zstat1.nii.gz"];
params["worldSpace"] = true;
params["zstat1.nii.gz"] = {parametric: true};
params["message"] = "Test: overlay, parametric.";

params = initTest();
params["images"] = ["data/sample_image.nii.gz", "data/zstat1.nii.gz"];
params["worldSpace"] = true;
params["zstat1.nii.gz"] = {parametric: true, symmetric: true};
params["message"] = "Test: overlay, parametric, symmetric.";

params = initTest();
params["images"] = ["data/sample_image.nii.gz", "data/zstat1.nii.gz"];
params["worldSpace"] = true;
params["zstat1.nii.gz"] = {parametric: true, lut: "Gold", negative_lut: "Spectrum"};
params["message"] = "Test: overlay, parametric, negative_lut.";

params = initTest();
params["images"] = ["data/sample_image.nii.gz", "data/zstat1.nii.gz"];
params["worldSpace"] = true;
params["zstat1.nii.gz"] = {parametric: true};
params["combineParametric"] = true;
params["message"] = "Test: overlay, parametric, combineParametric.";

params = initTest();
params["images"] = ["data/sample_image.nii.gz", "data/zstat1.nii.gz"];
params["worldSpace"] = true;
params["luts"] = [{"name": "Custom2", "data":[[0, 1, 0, 0], [0.5, 0, 0, 1], [1, 1, 1, 1]]}];
params["zstat1.nii.gz"] = {lut: "Custom2"};
params["message"] = "Test: overlay, luts (custom color table knots).";

params = initTest();
params["images"] = ["data/dti_V1.nii.gz"];
params["dti_V1.nii.gz"] = {dti: true};
params["message"] = "Test: dti.";

params = initTest();
params["images"] = ["data/dti_V1.nii.gz", "data/dti_FA.nii.gz"];
params["dti_V1.nii.gz"] = {dti: true};
params["dti_FA.nii.gz"] = {dtiMod:true, dtiRef:"dti_V1.nii.gz", dtiModAlphaFactor:0.75};
params["message"] = "Test: dti, dtiMod.";

params = initTest();
params["images"] = ["data/dti_V1.nii.gz"];
params["dti_V1.nii.gz"] = {dti: true, dtiLines: true};
params["message"] = "Test: dti, dtiLines.";

params = initTest();
params["images"] = ["data/dti_V1.nii.gz"];
params["dti_V1.nii.gz"] = {dti: true, dtiLines: true, dtiColors: true};
params["message"] = "Test: dti, dtiLines, dtiColors.";

params = initTest();
params["images"] = ["data/sample_image.nii.gz", "data/dti_V1.nii.gz"];
params["dti_V1.nii.gz"] = {dti: true, alpha:0.5};
params["worldSpace"] = true;
params["message"] = "Test: overlay, dti.";

params = initTest();
params["images"] = ["data/sample_image.nii.gz", "data/dti_V1.nii.gz"];
params["dti_V1.nii.gz"] = {dti: true, dtiLines: true};
params["worldSpace"] = true;
params["message"] = "Test: overlay, dti, dtiLines.";

params = initTest();
params["images"] = ["data/sample_image.nii.gz", "data/dti_V1.nii.gz"];
params["dti_V1.nii.gz"] = {dti: true, dtiLines: true, dtiColors: true};
params["worldSpace"] = true;
params["message"] = "Test: overlay, dti, dtiLines, dtiColors.";

params = initTest();
params["images"] = ["data/sample_image.nii.gz", "data/dti_V1.nii.gz", "data/dti_FA.nii.gz"];
params["dti_V1.nii.gz"] = {dti: true};
params["dti_FA.nii.gz"] = {dtiMod:true, dtiRef:"dti_V1.nii.gz", dtiModAlphaFactor:0.75};
params["worldSpace"] = true;
params["message"] = "Test: overlay, dti, dtiMod.";

params = initTest();
params["images"] = ["data/series.nii.gz"];
params["showControlBar"] = true;
params["message"] = "Test: series.";

params = initTest();
params["images"] = ["data/sample_image.nii.gz", "data/series.nii.gz"];
params["showControlBar"] = true;
params["message"] = "Test: series overlay.";

params = initTest();
params["images"] = ["data/series.nii.gz", "data/series.nii.gz"];
params["showControlBar"] = true;
params["message"] = "Test: series, series overlay.";

params = initTest();
params["images"] = ["data/sample_image.nii.gz", "data/series.nii.gz", "data/series.nii.gz"];
params["showControlBar"] = true;
params["message"] = "Test: two series overlay.";

params = initTest();
params["images"] = ["data/sample_image.nii.gz", "data/series.nii.gz", "data/series.nii.gz"];
params["showControlBar"] = true;
params["syncOverlaySeries"] = false;
params["message"] = "Test: two series overlay, syncOverlaySeries (false).";


// Display Parameters
params = initTest();
params["images"] = ["data/sample_image.nii.gz"];
params["kioskMode"] = true;
params["radiological"] = true;
params["message"] = "Test: radiological.";

params = initTest();
params["images"] = ["data/sample_image.nii.gz"];
params["kioskMode"] = true;
params["showOrientation"] = true;
params["message"] = "Test: showOrientation.";

params = initTest();
params["images"] = ["data/sample_image.nii.gz"];
params["kioskMode"] = true;
params["showRuler"] = true;
params["message"] = "Test: showRuler.";

params = initTest();
params["images"] = ["data/sample_image.nii.gz", "data/zstat1.nii.gz"];
params["kioskMode"] = true;
params["worldSpace"] = true;
params["smoothDisplay"] = false;
params["message"] = "Test: overlay, smoothDisplay (false).";

// UI Parameters
params = initTest();
params["images"] = ["data/sample_image.nii.gz"];
params["allowScroll"] = false;
params["message"] = "Test: allowScroll (false).";

params = initTest();
params["images"] = ["data/sample_image.nii.gz"];
params["kioskMode"] = true;
params["message"] = "Test: kioskMode.";

params = initTest();
params["images"] = ["data/sample_image.nii.gz"];
params["kioskMode"] = true;
params["fullScreenPadding"] = false;
params["message"] = "Test: fullScreenPadding (false).";

params = initTest();
params["images"] = ["data/sample_image.nii.gz"];
params["mainView"] = "sagittal";
params["message"] = "Test: mainView.";

params = initTest();
params["images"] = ["data/sample_image.nii.gz"];
params["orthogonal"] = false;
params["message"] = "Test: orthogonal (false).";

params = initTest();
params["images"] = ["data/sample_image.nii.gz"];
params["orthogonalTall"] = true;
params["message"] = "Test: orthogonalTall.";

params = initTest();
params["images"] = ["data/sample_image.nii.gz"];
params["showControls"] = false;
params["message"] = "Test: showControls (false).";

params = initTest();
params["images"] = ["data/sample_image.nii.gz"];
params["showControlBar"] = true;
params["message"] = "Test: showControlBar.";

params = initTest();
params["images"] = ["data/sample_image.nii.gz"];
params["showImageButtons"] = false;
params["message"] = "Test: showImageButtons (false).";

params = initTest();
params["images"] = ["data/sample_image.nii.gz"];
params["showControlBar"] = true;
params["showImageButtons"] = false;
params["kioskMode"] = true;
params["message"] = "Test: kioskMode, showControlBar, showImageButtons (false).";


// Misc Parameters
params = initTest();
params["images"] = ["data/sample_image.nii.gz"];
params["canOpenInMango"] = true;
params["message"] = "Test: canOpenInMango.";

params = initTest();
params["images"] = ["data/sample_image.nii.gz"];
params["coordinate"] = [10, 20, 30];
params["message"] = "Test: coordinate.";

params = initTest();
params["images"] = ["data/sample_image.nii.gz"];
params["worldSpace"] = true;
params["coordinate"] = [0, 0, 0];
params["message"] = "Test: coordinate, worldSpace.";

papaya.utilities.UrlUtils.eraseCookie(papaya.viewer.Preferences.COOKIE_PREFIX + "eula");
params = initTest();
params["images"] = ["data/sample_image.nii.gz"];
params["showEULA"] = true;
params["message"] = "Test: showEULA.";

params = initTest();
params["images"] = ["data/sample_image.nii.gz"];
params["showEULA"] = true;
params["message"] = "Test: showEULA (should not appear).";

params = initTest();
params["images"] = ["data/sample_image.nii.gz"];
params["padAllImages"] = true;
params["message"] = "Test: padAllImages.";


// Surfaces
params = initTest();
params["images"] = ["data/sample_image.nii.gz"];
params["surfaces"] = ["data/sample_image.surf.gii"];
params["message"] = "Test: surfaces.";

params = initTest();
params["images"] = ["data/sample_image.nii.gz"];
params["surfaces"] = ["data/sample_image.surf"];
params["message"] = "Test: mango surface.";

params = initTest();
params["images"] = ["data/sample_image.nii.gz"];
params["surfaces"] = ["data/sample_image.surf.gii"];
params["surfaceLink"] = true;
params["message"] = "Test: surfaces, surfaceLink.";

var myCustomColorTable = function() { };

myCustomColorTable.prototype.lookupRed = function (index) {
    if (index > 128) return 255; else return 0;
};

myCustomColorTable.prototype.lookupGreen = function (index) {
    return 0;
};

myCustomColorTable.prototype.lookupBlue = function (index) {
    return 0;
};

params = initTest();
params["images"] = ["data/sample_image.nii.gz"];
params["sample_image.nii.gz"]  = {lut: new myCustomColorTable()};
params["message"] = "Test: lut (object).";

var ctxManager = function() {
    this.loggedPoints = [];
};

ctxManager.prototype.getContextAtImagePosition = function(x, y, z) {
    return ctxManager.menudata;
};

ctxManager.prototype.actionPerformed = function(action) {
    if (action === "Log") {
        var currentCoor = papayaContainers[0].viewer.cursorPosition;
        var coor = new papaya.core.Coordinate(currentCoor.x, currentCoor.y, currentCoor.z);
        this.loggedPoints.push(coor);
    } else if (action === "Clear") {
        this.loggedPoints = [];
    }

    papayaContainers[0].viewer.drawViewer();
};

ctxManager.prototype.drawToViewer = function(ctx) {
    var ctr;
    var slice = papayaContainers[0].viewer.mainImage;
    for (ctr = 0; ctr < this.loggedPoints.length; ctr += 1) {
        if (slice.sliceDirection === papaya.viewer.ScreenSlice.DIRECTION_AXIAL) {
            if (this.loggedPoints[ctr].z === slice.currentSlice) {
                var screenCoor = papayaContainers[0].viewer.convertCoordinateToScreen(this.loggedPoints[ctr], slice);
                ctx.fillStyle = "rgb(255, 0, 0)";
                ctx.fillRect(screenCoor.x, screenCoor.y, 5, 5);
            }
        }
    }
};

ctxManager.prototype.clearContext = function() {
    // do nothing
};

ctxManager.menudata = {"label": "Test",
    "items": [
        {"label": "Log Point", "action": "Context-Log"},
        {"label": "Clear Points", "action": "Context-Clear"}
    ]
};

params = initTest();
params["images"] = ["data/sample_image.nii.gz"];
params["contextManager"]  = new ctxManager();
params["message"] = "Test: contextManager.";

params = initTest();
params["images"] = [["data/dicom/brain_001.dcm", "data/dicom/brain_002.dcm", "data/dicom/brain_003.dcm",
    "data/dicom/brain_004.dcm", "data/dicom/brain_005.dcm", "data/dicom/brain_006.dcm",
    "data/dicom/brain_007.dcm", "data/dicom/brain_008.dcm", "data/dicom/brain_009.dcm",
    "data/dicom/brain_010.dcm", "data/dicom/brain_011.dcm", "data/dicom/brain_012.dcm",
    "data/dicom/brain_013.dcm", "data/dicom/brain_014.dcm", "data/dicom/brain_015.dcm",
    "data/dicom/brain_016.dcm", "data/dicom/brain_017.dcm", "data/dicom/brain_018.dcm",
    "data/dicom/brain_019.dcm", "data/dicom/brain_020.dcm"]];
params["message"] = "Test: dicom.";


// API
params = initTest();
params["images"] = ["data/sample_image.nii.gz", "data/zstat1.nii.gz"];
params["loadingComplete"] = function() {
    setTimeout(function() { papaya.Container.hideImage(0, 1);}, 4000);
    setTimeout(function() { papaya.Container.showImage(0, 1);}, 8000);
};
params["message"] = "Test: papaya.Container.hideImage, papaya.Container.showImage.";

params = initTest();
params["images"] = ["data/sample_image.nii.gz", "data/zstat1.nii.gz"];
params["loadingComplete"] = function() {
    setTimeout(function() { papaya.Container.removeImage(0, 1);}, 5000);
};
params["message"] = "Test: papaya.Container.removeImage.";

params = initTest();
params["images"] = ["data/sample_image.nii.gz"];
params["loadingComplete"] = function() {
    setTimeout(function() {
        var addImageParams = [];
        addImageParams["zstat1.nii.gz"] = {lut: "Gold"};
        papaya.Container.addImage(0, "data/zstat1.nii.gz", addImageParams);
    }, 5000);
};
params["message"] = "Test: papaya.Container.addImage.";

// Clean up
params = initTest();
params["message"] = "Tests complete!";
