#!/bin/bash

STATUS=0

for file in *-test.txt
do
    echo "Testing args:" "$(< $file)"
    ../../papaya-builder.sh "$(< $file)"
    java -jar ../../lib/papaya-tester.jar -build $*
    STATUS=$(($? + $STATUS))
    echo
done

if [ "$STATUS" -gt 0 ]
then
    echo -e "\033[0;91m" $STATUS " tests failed.\033[0m"
else
    echo -e "\033[0;92mAll tests passed!\033[0m"
fi