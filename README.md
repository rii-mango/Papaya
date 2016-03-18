Papaya 
======

Papaya is a pure JavaScript medical research image viewer, supporting DICOM and NIFTI formats, compatible across a range of web browsers.  This orthogonal viewer supports overlays and atlases. 

![ScreenShot](https://raw.github.com/rii-mango/Papaya/master/docs/images/splash1.png)![ScreenShot](https://raw.github.com/rii-mango/Papaya/master/docs/images/splash2.png)

###[Documentation](https://github.com/rii-mango/Papaya/wiki)
* [Requirements](https://github.com/rii-mango/Papaya/wiki/Requirements): Firefox (7+), Chrome (7+), Safari (6+), iOS (6+), IE (10+), Edge (12+)
* [Supported Formats](https://github.com/rii-mango/Papaya/wiki/Supported-Formats): NIFTI (.nii, .nii.gz, DICOM (compressed/uncompressed), GIFTI (.surf.gii)
* [Usage](https://github.com/rii-mango/Papaya/wiki/Usage)
* [Configuration](https://github.com/rii-mango/Papaya/wiki/Configuration)

###Demo
Click [here](http://rii.uthscsa.edu/mango/papayabeta/) to try Papaya right now...

Quickstart Guide
------

###Development
Load `tests/debug_local.html` or `tests/debug_server.html` in your [favorite](http://www.jetbrains.com/webstorm/) JavaScript debugger.


###[Building](https://github.com/rii-mango/Papaya/wiki/How-To-Build-Papaya)
See [here](https://github.com/rii-mango/Papaya/tree/master/release) for the latest release or run `papaya-builder.sh` to create your own build.  See the [Papaya-Builder](https://github.com/rii-mango/Papaya-Builder) project for more information.  A few typical uses:
- papaya-builder.sh -nojquery -nodicom (smallest build, ~252Kb)
- papaya-builder.sh -nojquery (includes DICOM support, ~517Kb) 
- papaya-builder.sh (standard build, includes Jquery lib and DICOM support, ~610Kb) 
- papaya-builder.sh -atlas (includes atlas)
- papaya-builder.sh -atlas -local (builds for local usage -- i.e., encodes image data)
- papaya-builder.sh -singlefile -local (combine all JS, CSS, and image data into single HTML file)

###[Usage](https://github.com/rii-mango/Papaya/wiki/Usage) & [Configuration](https://github.com/rii-mango/Papaya/wiki/Configuration)

####Basic usage (loads a blank viewer)
```html
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
    <head>
        <link rel="stylesheet" type="text/css" href="papaya.css" />
        <script type="text/javascript" src="papaya.js"></script>
        <title>Papaya Viewer</title>
    </head>

    <body>
        <div class="papaya"></div>
    </body>
</html>
```

####To automatically load images and specify other options
```html
<head>
    ...
    <script type="text/javascript">
        var params = [];
        params["worldSpace"] = true;
        params["images"] = ["data/myBaseImage.nii.gz", "data/myOverlayImage.nii.gz"];
        params["myOverlayImage.nii.gz"] = {"min": 4, "max": 10};
    </script>
</head>

...

<div class="papaya" data-params="params"></div>

```

Acknowledgments
-----
Papaya uses [Daikon](https://github.com/rii-mango/Daikon) for DICOM support, [NIFTI-Reader-JS](https://github.com/rii-mango/NIFTI-Reader-JS) for NIFTI support as well as the following third-party libraries:
- [bowser](https://github.com/ded/bowser) &mdash; for browser detection
- [Closure Compiler](https://developers.google.com/closure/compiler/) &mdash; JavaScript compression
- [jquery](http://jquery.com/) &mdash; DOM manipulation
- [numerics](http://numericjs.com/) &mdash; for matrix math
- [pako](https://github.com/nodeca/pako) &mdash; for GZIP inflating


