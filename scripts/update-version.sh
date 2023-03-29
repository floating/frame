#!/bin/bash

NEW_CANARY_VERSION="$(grep -o '\"version\": \"[[:digit:]].[[:digit:]].[[:digit:]]-canary.[[:digit:]]\"' package.json | awk -F. '{$NF = $NF + 1;} 1' OFS=.)\""
if [ "$NEW_CANARY_VERSION" != '' ]; then
  sed -i "s/\"version\": \"[[:digit:]].[[:digit:]].[[:digit:]]-canary.[[:digit:]]\"/$NEW_CANARY_VERSION/" package.json
else
  NEW_VERSION="$(grep -o '\"version\": \"[[:digit:]].[[:digit:]].[[:digit:]]\"' package.json | awk -F. '{$NF = $NF + 1;} 1' OFS=.)\""
  sed -i "s/\"version\": \"[[:digit:]].[[:digit:]].[[:digit:]]\"/$NEW_VERSION/" package.json
fi
