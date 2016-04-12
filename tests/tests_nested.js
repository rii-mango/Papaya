var tests = [];

function initTest() {
    var params = [];
    tests[tests.length] = params;
    return params;
}

var params, params2;

// UI Parameters
params = initTest();
params["images"] = ["data/sample_image.nii.gz"];
params["kioskMode"] = true;
params["loadingComplete"] = function() {
    params2 = [];
    params2["images"] = ["data/sample_image.nii.gz"];
    params2["kioskMode"] = true;
    papaya.Container.resetViewer(1, params2);

};
params["message"] = "Test: two kiosk.";

params = initTest();
params["images"] = ["data/sample_image.nii.gz"];
params["kioskMode"] = true;
params["loadingComplete"] = function() {
    params2 = [];
    params2["images"] = ["data/sample_image.nii.gz"];
    params2["kioskMode"] = false;
    papaya.Container.resetViewer(1, params2);

};
params["message"] = "Test: one kiosk, one desktop.";

params = initTest();
params["images"] = ["data/sample_image.nii.gz"];
params["kioskMode"] = false;
params["loadingComplete"] = function() {
    params2 = [];
    params2["images"] = ["data/sample_image.nii.gz"];
    params2["kioskMode"] = false;
    papaya.Container.resetViewer(1, params2);

};
params["message"] = "Test: two desktop.";

params = initTest();
params["images"] = ["data/sample_image.nii.gz"];
params["showControlBar"] = true;
params["loadingComplete"] = function() {
    params2 = [];
    params2["images"] = ["data/sample_image.nii.gz"];
    papaya.Container.resetViewer(1, params2);

};
params["message"] = "Test: showControlBar (top).";

params = initTest();
params["images"] = ["data/sample_image.nii.gz"];
params["loadingComplete"] = function() {
    params2 = [];
    params2["kioskMode"] = true;
    params2["showControlBar"] = true;
    params2["images"] = ["data/sample_image.nii.gz"];
    papaya.Container.resetViewer(1, params2);

};
params["message"] = "Test: showControlBar (bottom), kioskMode (bottom).";

params = initTest();
params["images"] = ["data/sample_image.nii.gz"];
params["expandable"] = true;
params["kioskMode"] = true;
params["showControlBar"] = true;
params["loadingComplete"] = function() {
    params2 = [];
    params2["images"] = ["data/sample_image.nii.gz"];
    params2["expandable"] = true;
    params2["kioskMode"] = true;
    params2["showControlBar"] = true;
    papaya.Container.resetViewer(1, params2);

};
params["message"] = "Test: showControlBar, kioskMode, expandable.";

params = initTest();
params["images"] = ["data/sample_image.nii.gz"];
params["loadingComplete"] = function() {
    params2 = [];
    params2["kioskMode"] = true;
    params2["showControlBar"] = true;
    params2["showImageButtons"] = false;
    params2["images"] = ["data/sample_image.nii.gz"];
    papaya.Container.resetViewer(1, params2);

};
params["message"] = "Test: showControlBar (bottom), kioskMode (bottom), showImageButtons (false, bottom).";

params = initTest();
params["images"] = ["data/sample_image.nii.gz"];
params["orthogonal"] = false;
params["loadingComplete"] = function() {
    params2 = [];
    params2["images"] = ["data/sample_image.nii.gz"];
    papaya.Container.resetViewer(1, params2);

};
params["message"] = "Test: orthogonal (false, top).";

params = initTest();
params["images"] = ["data/sample_image.nii.gz"];
params["orthogonal"] = false;
params["loadingComplete"] = function() {
    params2 = [];
    params2["orthogonal"] = false;
    params2["images"] = ["data/sample_image.nii.gz"];
    papaya.Container.resetViewer(1, params2);

};
params["message"] = "Test: orthogonal (false).";

params = initTest();
params["images"] = ["data/sample_image.nii.gz"];
params["orthogonalTall"] = true;
params["loadingComplete"] = function() {
    params2 = [];
    params2["images"] = ["data/sample_image.nii.gz"];
    papaya.Container.resetViewer(1, params2);

};
params["message"] = "Test: orthogonalTall (top).";

params = initTest();
params["images"] = ["data/sample_image.nii.gz"];
params["orthogonalTall"] = true;
params["loadingComplete"] = function() {
    params2 = [];
    params2["orthogonalTall"] = true;
    params2["images"] = ["data/sample_image.nii.gz"];
    papaya.Container.resetViewer(1, params2);

};
params["message"] = "Test: orthogonalTall.";

params = initTest();
params["images"] = ["data/sample_image.nii.gz"];
params["loadingComplete"] = function() {
    params2 = [];
    params2["images"] = ["data/sample_image.nii.gz"];
    papaya.Container.resetViewer(1, params2);
    papaya.Container.syncViewers = true;
};
params["message"] = "Test: papaya.Container.syncViewers.";

params = initTest();
params["images"] = ["data/sample_image.nii.gz"];
params["worldSpace"] = true;
params["loadingComplete"] = function() {
    params2 = [];
    params2["images"] = ["data/sample_image.nii.gz"];
    params2["worldSpace"] = true;
    papaya.Container.resetViewer(1, params2);
    papaya.Container.syncViewers = false;
    papaya.Container.syncViewersWorld = true;
};
params["message"] = "Test: papaya.Container.syncViewersWorld.";

// Clean up
params = initTest();
params["loadingComplete"] = function() {
    params2 = [];
    papaya.Container.resetViewer(1, params2);
    papaya.Container.syncViewers = false;
    papaya.Container.syncViewersWorld = false;
};
params["message"] = "Tests complete!";


