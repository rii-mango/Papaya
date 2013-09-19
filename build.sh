
#!/bin/bash
. ./build.properties
PAPAYA_BUILD_NUM=$((PAPAYA_BUILD_NUM + 1))

echo "PAPAYA_VERSION_ID="$PAPAYA_VERSION_ID > build.properties
echo "PAPAYA_BUILD_NUM="$PAPAYA_BUILD_NUM >> build.properties

rm -rf build
mkdir build

cat build.properties jquery/jquery.js classes/constants.js classes/data/*.js classes/core/*.js classes/volume/*.js classes/volume/nifti/*.js classes/viewer/*.js classes/ui/*.js classes/main.js classes/utilities/*.js  | java -jar lib/yuicompressor.jar --type js -o build/papaya.js
cat css/main.css | java -jar lib/yuicompressor.jar --type css -o build/papaya.css
cp examples/index.html build/.

echo "Done!"
