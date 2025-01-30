#!/bin/bash

git fetch --tags

version=$(git tag --sort=-creatordate | head -n1 || echo '0.0.0')
echo "version: $version"

# Check if the version starts with 'v' and remove it
if [[ $version == v* ]]; then
    version=${version:1}
fi

IFS='.' read -r -a versions <<< "$version"

major=${versions[0]}
minor=${versions[1]}
patch=${versions[2]}

# Increment the patch version
patch=$((patch + 1))

# Create the new tag
new_tag="${major}.${minor}.${patch}"
echo "new tag: $new_tag"

git tag $new_tag
git push origin $new_tag

echo "new_tag=$new_tag" >> $GITHUB_OUTPUT
