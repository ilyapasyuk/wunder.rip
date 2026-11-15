#!/bin/zsh
# App Preview for iPhone 6.9"/6.5": title cards (tools/make_preview_card.swift, texts from appstore/captions.json "preview")
# cut together with the raw take from tools/record_preview.sh. 886×1920 portrait, H.264 High@4.0 ~11 Mbps, 30 fps,
# silent stereo AAC 256 kbps 48 kHz (Apple wants an audio track), 15–30 s.
# Output: appstore/preview/<store-locale>/iphone_67.mp4
#   zsh tools/make_preview.sh [en ru]          (run from ios/)
set -eu
LANGS=($@); (( $#LANGS )) || LANGS=(en ru)
typeset -A STORE=(en en-US ru ru)
X264=(-c:v libx264 -preset slow -profile:v high -level:v 4.0 -pix_fmt yuv420p -r 30 -b:v 11M -maxrate 12M -bufsize 24M)
SCALE="fps=30,scale=886:-2:flags=lanczos,crop=886:1920:0:(ih-1920)/2,setsar=1"

for lang in $LANGS; do
  loc=${STORE[$lang]}
  raw=appstore/preview/raw/$lang.mp4; marks=appstore/preview/raw/$lang.marks
  work=appstore/preview/work/$lang; rm -rf $work; mkdir -p $work appstore/preview/$loc
  texts=("${(@f)$(python3 -c "import json,sys; print('\n'.join(json.load(open('appstore/captions.json'))[sys.argv[1]]['preview']))" $loc)}")
  m() { awk -v n=$1 -v k=$2 '$1==n {print (k=="s" ? $2 : $3)}' $marks }

  card() {  # index seconds text
    swift tools/make_preview_card.swift title $work/card$1 $2 "$3" >/dev/null
    ffmpeg -loglevel error -y -framerate 30 -i $work/card$1/%04d.png -vf "setsar=1" $X264 $work/seg_$1.mp4
  }
  clip() {  # index from to speed
    # the recording is variable frame rate (no frames while the screen is still): make it constant before trimming
    ffmpeg -loglevel error -y -i $raw -an -vf "fps=60,trim=start=${2}:end=${3},setpts=(PTS-STARTPTS)/${4},$SCALE" $X264 $work/seg_$1.mp4
  }
  card 1 1.6 "${texts[1]}"
  clip 2 $(m today s) $(m today e) 1.0
  card 3 1.3 "${texts[2]}"
  clip 4 $(m compose s) $(m compose e) 2.8
  card 5 1.3 "${texts[3]}"
  clip 6 $(m detail s) $(m detail e) 1.6
  card 7 1.3 "${texts[4]}"
  clip 8 $(( $(m lists s) + 0.6 )) $(m upcoming e) 1.25
  card 9 1.7 "${texts[5]}"
  swift tools/make_preview_card.swift end $work/card10 2.4 "wunder.rip" "${texts[6]}" >/dev/null
  ffmpeg -loglevel error -y -framerate 30 -i $work/card10/%04d.png -vf "setsar=1" $X264 $work/seg_10.mp4

  inputs=(); filter=""
  for i in {1..10}; do inputs+=(-i $work/seg_$i.mp4); filter+="[$((i-1)):v]"; done
  out=appstore/preview/$loc/iphone_67.mp4
  ffmpeg -loglevel error -y $inputs -f lavfi -i "anullsrc=r=48000:cl=stereo" \
    -filter_complex "${filter}concat=n=10:v=1:a=0[v]" -map "[v]" -map 10:a -shortest \
    $X264 -c:a aac -b:a 256k -ar 48000 -ac 2 -movflags +faststart $out
  ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate,channels,sample_rate -of compact $out
  echo "✓ $out"
done
