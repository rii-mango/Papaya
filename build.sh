#!/bin/bash

# increment build number
. ./build.properties
PAPAYA_BUILD_NUM=$((PAPAYA_BUILD_NUM + 1))
echo "PAPAYA_VERSION_ID="\"$PAPAYA_VERSION_ID\"";" > build.properties
echo "PAPAYA_BUILD_NUM="\"$PAPAYA_BUILD_NUM\"";" >> build.properties

sed -i "" "1s/.*/Papaya (v$PAPAYA_VERSION_ID build $PAPAYA_BUILD_NUM)/" README.md

java -jar lib/papaya-builder.jar $*