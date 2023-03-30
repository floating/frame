#!/bin/bash

VERSION=$(echo "$GITHUB_REF" | sed -r 's/v([0-9]\.[0-9]\.[0-9][-canary\.[0-9]]?)/\1/g')
NEW_VERSION=$(echo "$VERSION" | awk -F. '{$NF = $NF + 1;} 1' OFS=.)

if [[ $VERSION == *'canary'* ]]; then
  echo "Updating Canary: $NEW_VERSION"
  sed -i "s/\"version\": \"[[:digit:]].[[:digit:]].[[:digit:]]-canary.[[:digit:]]\"/\"version\": \"$NEW_VERSION\"/" package.json
else
  echo "Updating Production: $NEW_VERSION"
  sed -i "s/\"version\": \"[[:digit:]].[[:digit:]].[[:digit:]]\"/\"version\": \"$NEW_VERSION\"/" package.json
fi
