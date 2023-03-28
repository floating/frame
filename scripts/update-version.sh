#!/bin/bash
NEW_VERSION="$(grep -o '\"version\": \"[[:digit:]].[[:digit:]].[[:digit:]]\"' package.json | awk -F. '{$NF = $NF + 1;} 1' OFS=.)\""
sed -i "s/\"version\": \"[[:digit:]].[[:digit:]].[[:digit:]]\"/$NEW_VERSION/" package.json
