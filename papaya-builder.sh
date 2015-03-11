#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR
java -Xmx512M -jar lib/papaya-builder.jar $*