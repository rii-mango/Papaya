
#!/bin/bash

# handle arguments
DATA_INCLUDES=""
WEB_BUILD=true;

for var in "$@"
do
    if [ $var = "-sample" ]
    then
        DATA_INCLUDES="$DATA_INCLUDES build/data/sample-image.js"
        echo "Including sample image..."
    elif [ $var = "-atlas" ]
    then
        DATA_INCLUDES="$DATA_INCLUDES build/data/talairach-atlas.js"
        echo "Including atlas image..."
    elif [ $var = "-local" ]
    then
        WEB_BUILD=false;
        echo "Building for local usage..."
    fi
done


# increment build number
. ./build.properties
PAPAYA_BUILD_NUM=$((PAPAYA_BUILD_NUM + 1))
echo "PAPAYA_VERSION_ID="$PAPAYA_VERSION_ID > build.properties
echo "PAPAYA_BUILD_NUM="$PAPAYA_BUILD_NUM >> build.properties


# clean build directory
rm -rf build
mkdir build
mkdir build/data


# build local usage
if $WEB_BUILD
then
    sed '/papaya.data.SampleImage.data/d' ./classes/data/sample-image.js > build/data/sample-image.js
    echo "papaya.data.SampleImage.image='data/sample_image.nii.gz';" >> build/data/sample-image.js
    cp resources/data/sample_image.nii.gz build/data/.

    sed '/papaya.data.TalairachAtlas.data/d' ./classes/data/talairach-atlas.js > build/data/talairach-atlas.js
    echo "papaya.data.TalairachAtlas.image='data/Talairach-labels-1mm.nii.gz';" >> build/data/talairach-atlas.js
    cp resources/data/Talairach-labels-1mm.nii.gz build/data/.
else
    cp classes/data/sample-image.js build/data/.
    cp classes/data/talairach-atlas.js build/data/.
fi


# build JavaScript
echo "Minifying JavaScript..."
cat build.properties jquery/jquery.js classes/constants.js $DATA_INCLUDES classes/core/*.js classes/volume/*.js classes/volume/nifti/*.js classes/viewer/*.js classes/ui/*.js classes/main.js classes/utilities/*.js | java -jar lib/yuicompressor.jar --type js -o build/papaya.js


# build CSS
echo "Minifying CSS..."
cat css/main.css | java -jar lib/yuicompressor.jar --type css -o build/papaya.css


# build example HTML
cp examples/index.html build/.
sed -i '.bak' "s/papaya.js/papaya.js?version=${PAPAYA_VERSION_ID}\&build=${PAPAYA_BUILD_NUM}/g" build/index.html
sed -i '.bak' "s/papaya.css/papaya.css?version=${PAPAYA_VERSION_ID}\&build=${PAPAYA_BUILD_NUM}/g" build/index.html
rm build/index.html.bak


# clean up
rm  build/data/*.js
find build -depth -empty -delete


# finished
echo "Done! See build/."
