#!/bin/bash

if [[ "$GITHUB_REF" =~ ^(.*)v[0-9]\.[0-9]\.[0-9](-canary\.[0-9])?$ ]]; then
  VERSION=$(echo "$GITHUB_REF" | sed -r 's/(.*)v([0-9]\.[0-9]\.[0-9](-canary\.[0-9])?)/\2/g')
  NEW_VERSION=$(echo "$VERSION" | awk -F. '{$NF = $NF + 1;} 1' OFS=.)

  if [[ $VERSION == *'canary'* ]]; then
    echo "Updating Canary to \"$NEW_VERSION\""
    sed -i "s/\"version\": \"[[:digit:]].[[:digit:]].[[:digit:]]-canary.[[:digit:]]\"/\"version\": \"$NEW_VERSION\"/" package.json
  else
    echo "Updating Production to \"$NEW_VERSION\""
    sed -i "s/\"version\": \"[[:digit:]].[[:digit:]].[[:digit:]]\"/\"version\": \"$NEW_VERSION\"/" package.json
  fi
else
  echo "Could not update version for release tag \"$GITHUB_REF\""
fi
