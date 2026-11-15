#!/bin/sh
# Xcode Cloud: runs after the repo is cloned. Fails fast if ios/project.yml changed without regenerating the project.
set -eu
cd "$CI_PRIMARY_REPOSITORY_PATH/ios"
brew install xcodegen >/dev/null
cp WunderRip.xcodeproj/project.pbxproj /tmp/committed.pbxproj
xcodegen generate --quiet
if ! cmp -s /tmp/committed.pbxproj WunderRip.xcodeproj/project.pbxproj; then
  echo "error: WunderRip.xcodeproj is out of date with project.yml — run 'xcodegen generate' in ios/ and commit."
  exit 1
fi
