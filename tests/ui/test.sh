#!/bin/bash
java -jar ../../lib/papaya-tester.jar $*
STATUS=$?

if [ "$STATUS" -gt 0 ]
then
    echo -e "\033[0;91m" $STATUS " tests failed.\033[0m"
else
    echo -e "\033[0;92mAll tests passed!\033[0m"
fi
