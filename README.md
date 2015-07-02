Papaya 
======

Papaya is a pure JavaScript medical research image viewer, supporting DICOM and NIFTI formats, compatible across a range of web browsers.  This orthogonal viewer supports overlays and atlases. 

[![ScreenShot](https://raw.github.com/rii-mango/Papaya/master/README-img.png)](http://rii.uthscsa.edu/mango/papayabeta/)

Requirements: Firefox (7+), Chrome (7+), Safari (6+), MobileSafari (iOS 6+), IE (10+)<br />
User Guide: http://ric.uthscsa.edu/mango/papaya_userguide.html<br />
Developer Guide: http://rii.uthscsa.edu/mango/papaya_devguide.html

###Demo
Click [here](http://rii.uthscsa.edu/mango/papayabeta/) to try Papaya right now...

###Supported Formats
- NIFTI (.nii and .nii.gz)
- DICOM (compressed/uncompressed, big/little endian, implicit/explicit types)

####Supported DICOM Transfer Syntax

Uncompressed:
- 1.2.840.10008.1.2 (Implicit VR Little Endian)
- 1.2.840.10008.1.2.1 (Explicit VR Little Endian)
- 1.2.840.10008.1.2.2 (Explicit VR Big Endian)
 
Compressed:
- 1.2.840.10008.1.2.4.50 (JPEG Baseline (Process 1) Lossy JPEG 8-bit)
- 1.2.840.10008.1.2.4.57 (JPEG Lossless, Nonhierarchical (Processes 14))
- 1.2.840.10008.1.2.4.70 (JPEG Lossless, Nonhierarchical (Processes 14 [Selection 1]))
- 1.2.840.10008.1.2.4.90 (JPEG 2000 Image Compression (Lossless Only))
- 1.2.840.10008.1.2.4.91 (JPEG 2000 Image Compression)
- 1.2.840.10008.1.2.5 (RLE Lossless)

Quickstart Guide
------

###Development
Load `tests/debug_local.html` or `tests/debug_server.html` in your [favorite](http://www.jetbrains.com/webstorm/) JavaScript debugger.


###Building
See [here](https://github.com/rii-mango/Papaya/tree/master/release) for the latest release or run `papaya-builder.sh` to create your own build.  See the [Papaya-Builder](https://github.com/rii-mango/Papaya-Builder) project for more information.  A few typical uses:
- papaya-builder.sh -nojquery -nodicom (smallest build, ~252Kb)
- papaya-builder.sh -nojquery (includes DICOM support, ~517Kb) 
- papaya-builder.sh (standard build, includes Jquery lib and DICOM support, ~610Kb) 
- papaya-builder.sh -atlas (includes atlas)
- papaya-builder.sh -atlas -local (builds for local usage -- i.e., encodes image data)
- papaya-builder.sh -singlefile -local (combine all JS, CSS, and image data into single HTML file)

###Usage
See the [developer guide](http://ric.uthscsa.edu/mango/papaya_devguide.html) for a full list of configurable parameters.  

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
        // for more options, see http://ric.uthscsa.edu/mango/papaya_devguide.html
    </script>
<head>

...

<div class="papaya" data-params="params"></div>

```

Acknowledgments
-----
Papaya uses [Daikon](https://github.com/rii-mango/Daikon) for DICOM support, as well as the following third-party libraries:
- [bowser](https://github.com/ded/bowser) &mdash; for browser detection
- [Closure Compiler](https://developers.google.com/closure/compiler/) &mdash; JavaScript compression
- [jquery](http://jquery.com/) &mdash; DOM manipulation
- [numerics](http://numericjs.com/) &mdash; for matrix math
- [pako](https://github.com/nodeca/pako) &mdash; for GZIP inflating


