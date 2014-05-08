#!/bin/bash

echo "Testing args: (none)"
../../papaya-builder.sh
mv ../../build minimal
echo

echo "Testing args:" "$(< default.txt)"
../../papaya-builder.sh "$(< default.txt)"
mv ../../build default
echo

echo "Testing args:" "$(< defaultlocal.txt)"
../../papaya-builder.sh "$(< defaultlocal.txt)"
mv ../../build defaultlocal
echo
