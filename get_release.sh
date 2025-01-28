#! /bin/bash

RELEASE_VERSION=$1

RELEASE_ID=$(curl -L \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/repos/floating/frame/releases | jq '.[] | {(.name): .id}' | grep "\"$RELEASE_VERSION\"" | awk '{print $2}')

ASSET_ID=$(curl -L \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/repos/floating/frame/releases/$RELEASE_ID | jq -r '.assets[] | {(.id |tostring): .name}' | grep -i appimage | grep -v arm | cut -d '"' -f 2)

curl -L \
  -o frame.AppImage \
  -H "Accept: application/octet-stream" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/repos/floating/frame/releases/assets/$ASSET_ID

chmod +x frame.AppImage

echo "Successfully downloaded v$RELEASE_VERSION"
