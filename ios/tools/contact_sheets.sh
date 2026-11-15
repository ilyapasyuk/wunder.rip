#!/bin/zsh
# Contact sheets of the framed screenshots for review: appstore/contact_sheets/<device>.jpg
# (one row per locale; iPhone/iPad/Duo), watch.jpg (en + ru). Run from ios/ after tools/make_screenshots.swift.
set -eu
out=appstore/contact_sheets; mkdir -p $out
locales=(${(f)"$(ls appstore/screenshots)"})
for dev in iphone ipad duo; do
  rows=()
  for loc in $locales; do
    files=(appstore/screenshots/$loc/${dev}_*.png(N)); (( $#files )) || continue
    row=$out/.row_$loc.png; inputs=(); f=""
    for i in {1..$#files}; do inputs+=(-i $files[$i]); f+="[$((i-1))]scale=-2:520[s$i];"; done
    ff=""; for i in {1..$#files}; do ff+="[s$i]"; done
    ffmpeg -loglevel error -y $inputs -filter_complex "${f}${ff}hstack=$#files,pad=iw+200:ih:200:0:white,drawtext=text=$loc:x=20:y=20:fontsize=36:fontcolor=black" $row 2>/dev/null \
      || ffmpeg -loglevel error -y $inputs -filter_complex "${f}${ff}hstack=$#files" $row
    rows+=($row)
  done
  (( $#rows )) || continue
  inputs=(); for r in $rows; do inputs+=(-i $r); done
  if (( $#rows > 1 )); then ffmpeg -loglevel error -y $inputs -filter_complex "vstack=$#rows" -q:v 4 $out/$dev.jpg
  else ffmpeg -loglevel error -y $inputs -q:v 4 $out/$dev.jpg; fi
  rm -f $rows; echo "✓ $out/$dev.jpg"
done
ffmpeg -loglevel error -y -i appstore/screenshots/en-US/watch_1.png -i appstore/screenshots/ru/watch_1.png -filter_complex hstack=2 -q:v 3 $out/watch.jpg
echo "✓ $out/watch.jpg"
