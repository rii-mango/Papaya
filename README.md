Papaya 
======

Papaya is a pure JavaScript medical research image viewer, compatible across a range of popular web browsers.  The orthogonal viewer supports overlays and atlas labels.  See 
the [user guide](http://ric.uthscsa.edu/mango/papaya_userguide.html) for a full list of features or click [here](http://rii.uthscsa.edu/mango/papaya/) to run Papaya right now.

Supported Formats:
- NIFTI (.nii and .nii.gz)
- DICOM (compressed/uncompressed, big/little endian, implicit and explicit types)

[![ScreenShot](https://raw.github.com/rii-mango/Papaya/master/README-img.png)](http://ric.uthscsa.edu/mango/papaya/)

**Run the lastest release:** http://rii.uthscsa.edu/mango/papaya/

**User Guide:** http://rii.uthscsa.edu/mango/papaya_userguide.html

**Developer Guide:** http://rii.uthscsa.edu/mango/papaya_devguide.html

**Requirements:** Firefox (7), Chrome (7), Safari (6), MobileSafari (iOS 6), IE (10)

###Supported DICOM Transfer Syntax

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
Load `tests/debug.html` in your [favorite](http://www.jetbrains.com/webstorm/) JavaScript debugger.


###Running
See [here](https://github.com/rii-mango/Papaya/tree/master/release) for the latest release or see below for how to build Papaya yourself.


###Building
Run `papaya-builder.sh` to create the build files.  A typical usage might be `papaya-builder.sh -sample -atlas`

```shell
usage: papaya-builder [options]
 -atlas <file>     add atlas
 -help             print this message
 -images <files>   images to include
 -local            build for local usage
 -root <dir>       papaya project directory
 -sample           include sample image
```

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
- [jquery](http://jquery.com/) &mdash; DOM manipulation
- [numerics](http://numericjs.com/) &mdash; for matrix math
- [pako](https://github.com/nodeca/pako) &mdash; for GZIP inflating


