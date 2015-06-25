#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR
java -Xmx512M -jar lib/papaya-builder.jar $*

if [ -f build/papaya.js ]
then
    echo Further compressing...
    java -jar lib/compiler.jar --warning_level QUIET --compilation_level SIMPLE_OPTIMIZATIONS --language_in=ECMASCRIPT5 --js build/papaya.js --js_output_file build/papaya-out.js
    rm build/papaya.js
    mv build/papaya-out.js build/papaya.js
fi

echo Done!  See build folder for output...