Papaya
======

A pure JavaScript medical research image viewer.  Current list of features:
- Requires no browser plugin.  Runs in desktop and mobile browsers (iPhone and iPad supported).
- Orthogonal viewer controlled with mouse and keyboard controls.
- Reads NIFTI (.nii and .nii.gz) files.
- Supports overlays and atlas labels.  (Includes sample image and atlas.)
- Supported browsers (min version): Firefox (7), Chrome (7), Safari (6), MobileSafari (iOS 6), IE (10).
- Demo: http://ric.uthscsa.edu/mango/papaya/

![ScreenShot](https://raw.github.com/rii-mango/Papaya/master/README-img.png)

Installation
------
Development: See examples/debug.html.

Production: Run build.sh to create minified JavaScript and CSS.
````shell
Usage: build.sh [-sample -image]
Options:
-sample includes the sample image
-atlas includes the atlas data
-local build for local deployment (encodes image data)
````

Usage
------
Basic usage:
```html
<!DOCTYPE html>

<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no"/>
        <meta name="apple-mobile-web-app-capable" content="yes">
        <link rel="stylesheet" type="text/css" href="papaya.css" />
        <script type="text/javascript" src="papaya.js"></script>
        <title>Papaya Viewer</title>
    </head>

    <body>
        <div id="papayaContainer">
            <div id="papayaToolbar"></div>
            <div id="papayaViewer" class="checkForJS"></div>
            <div id="papayaDisplay"></div>
        </div>
    </body>
</html>
```

To automatically load an image by URL:
```html
<!DOCTYPE html>

<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no"/>
        <meta name="apple-mobile-web-app-capable" content="yes">
        <link rel="stylesheet" type="text/css" href="papaya.css" />
        <script type="text/javascript" src="papaya.js"></script>
        <title>Papaya Viewer</title>
    </head>

    <body>
        <div id="papayaContainer">
            <div id="papayaToolbar"></div>
            <div id="papayaViewer" data-load-url="http://www.mysite.com/myimages/myimage.nii.gz"></div>
            <div id="papayaDisplay"></div>
        </div>
    </body>
</html>
```
