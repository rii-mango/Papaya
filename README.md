Papaya
======

A pure JavaScript medical image viewer.  Current list of features:
- Requires no browser plugin.  Runs in desktop and mobile browsers (iPhone and iPad supported).
- Orthogonal viewer controlled with mouse and keyboard controls.
- Reads NIFTI (.nii and .nii.gz) files.
- Supports overlays and atlas labels.  (Includes sample image and atlas.)
- Supported browsers (min version requirement): Firefox (7), Chrome (7), Safari (6), MobileSafari (iOS 6), IE (10).
- Demo: http://ric.uthscsa.edu/mango/papaya/

![ScreenShot](https://raw.github.com/rii-mango/Papaya/master/README-img.png)

Installation
------
Development: See examples/debug.html.
Production: Run build.sh to create minified JavaScript and CSS, output to build/.


Usage
------
Basic usage:
```html
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">

<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
        <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta http-equiv="Pragma" content="no-cache" />
        <meta http-equiv="Expires" content="0" />
        <link rel="stylesheet" type="text/css" href="papaya.css?version=0.6&build=48" />
        <script type="text/javascript" src="papaya.js?version=0.6&build=48"></script>
        <title>Papaya Viewer</title>
    </head>

    <body>
        <div id="papayaContainer">
            <div id="papayaToolbar"></div>
            <div id="papayaViewer"></div>
            <div id="papayaDisplay"></div>
        </div>
    </body>
</html>
```

To automatically load an image by URL:
```html
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">

<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
        <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta http-equiv="Pragma" content="no-cache" />
        <meta http-equiv="Expires" content="0" />
        <link rel="stylesheet" type="text/css" href="papaya.css?version=0.6&build=48" />
        <script type="text/javascript" src="papaya.js?version=0.6&build=48"></script>
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

To automatically load an encoded image:
```html
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">

<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
        <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta http-equiv="Pragma" content="no-cache" />
        <meta http-equiv="Expires" content="0" />
        <link rel="stylesheet" type="text/css" href="papaya.css?version=0.6&build=48" />
        <script type="text/javascript" src="papaya.js?version=0.6&build=48"></script>
        <title>Papaya Viewer</title>
    </head>

    <body>
        <div id="papayaContainer">
            <div id="papayaToolbar"></div>
            <div id="papayaViewer" data-load-encoded="my.encoded.data.var"></div>
            <div id="papayaDisplay"></div>
        </div>
    </body>
</html>
```
