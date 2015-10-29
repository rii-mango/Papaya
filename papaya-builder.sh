#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR

if [ -d build ]
then
    rm -r build
fi

JAVA_VER=$(java -version 2>&1 | sed 's/java version "\(.*\)\.\(.*\)\..*"/\1\2/; 1q')
if [[ "$JAVA_VER" < "17" ]]; then
    echo "Java 7 or higher is required!  Your version is..."
    java -version
    exit 1
fi

java -Xmx512M -jar lib/papaya-builder.jar "$@"

if [ -f build/papaya.js ]
then
    echo Further compressing...
    java -jar lib/compiler.jar --warning_level QUIET --compilation_level SIMPLE_OPTIMIZATIONS --language_in=ECMASCRIPT5 --js build/papaya.js --js_output_file build/papaya-out.js
    rm build/papaya.js
    mv build/papaya-out.js build/papaya.js
fi

if [ -d build ]
then
    echo Done!  See build folder for output...
fi