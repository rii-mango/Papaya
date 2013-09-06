#!/bin/bash
. ./build.properties
PAPAYA_BUILD_NUM=$((PAPAYA_BUILD_NUM + 1))

echo "PAPAYA_VERSION_ID="$PAPAYA_VERSION_ID > build.properties
echo "PAPAYA_BUILD_NUM="$PAPAYA_BUILD_NUM >> build.properties

cat build.properties classes/constants.js jquery/jquery.js jquery/jquery-ui.custom.js classes/platform.js \
classes/gunzip.js classes/header.js classes/orientation.js classes/colortable.js classes/utilities.js classes/point.js \
classes/nifti.js classes/volume.js classes/imagedimensions.js classes/voxeldimensions.js classes/imagetype.js \
classes/imagedata.js classes/header-nifti.js classes/screenslice.js classes/coordinate.js classes/imagerange.js \
classes/viewer.js classes/display.js classes/main.js | java -jar yuicompressor.jar --type js -o papaya.js

cat css/ui-darkness/jquery-ui.custom.css css/main.css | java -jar yuicompressor.jar --type css -o papaya.css