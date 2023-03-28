#!/bin/bash
echo "NEW_VERSION=$(grep -o '"version": "[[:digit:]].[[:digit:]].[[:digit:]]"' package.json | awk -F. '{$NF = $NF + 1;} 1' OFS=.)" >> $GITHUB_OUTPUT
sed -i "s/\"version\": \"[[:digit:]].[[:digit:]].[[:digit:]]\"/${{ steps.update-version.outputs.NEW_VERSION }}/" package.json