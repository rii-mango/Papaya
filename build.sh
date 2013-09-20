
#!/bin/bash

# increment build number
. ./build.properties
PAPAYA_BUILD_NUM=$((PAPAYA_BUILD_NUM + 1))
echo "PAPAYA_VERSION_ID="$PAPAYA_VERSION_ID > build.properties
echo "PAPAYA_BUILD_NUM="$PAPAYA_BUILD_NUM >> build.properties

# clean build directory
rm -rf build
mkdir build

# build JavaScript
cat build.properties jquery/jquery.js classes/constants.js classes/data/*.js classes/core/*.js classes/volume/*.js classes/volume/nifti/*.js classes/viewer/*.js classes/ui/*.js classes/main.js classes/utilities/*.js  | java -jar lib/yuicompressor.jar --type js -o build/papaya.js

# build CSS
cat css/main.css | java -jar lib/yuicompressor.jar --type css -o build/papaya.css

# build example HTML
cp examples/index.html build/.
sed -i '.bak' "s/papaya.js/papaya.js?version=${PAPAYA_VERSION_ID}\&build=${PAPAYA_BUILD_NUM}/g" build/index.html
sed -i '.bak' "s/papaya.css/papaya.css?version=${PAPAYA_VERSION_ID}\&build=${PAPAYA_BUILD_NUM}/g" build/index.html
rm build/index.html.bak

# finished
echo "Done!"
