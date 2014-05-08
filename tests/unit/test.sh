#!/bin/bash

if ! hash npm 2>/dev/null; then
    echo "Node.js not installed.  Please install Node.js to continue."
    exit 1
fi

if ! hash mocha 2>/dev/null; then
    echo "Mocha not installed.  Try: npm install -g mocha"
    exit 1
fi

mocha volume/
