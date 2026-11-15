#!/bin/zsh
# Records the raw App Preview take on the iPhone 6.9" simulator: XCUITest (tools/promo, testPreview) drives the DEBUG
# demo build while simctl records the screen. Output: appstore/preview/raw/<lang>.mp4 + <lang>.marks (scene name, start/end
# in seconds from the start of the video), cut and titled by tools/make_preview.sh.
#   PHONE=<udid> zsh tools/record_preview.sh [en ru]     (run from ios/; app built into build/dd, promo tests into build/promo)
set -eu
: ${PHONE:?simulator udid (an iPhone 18 Pro Max of your own, booted)}
APP=build/dd/Build/Products/Debug-iphonesimulator/wunderrip.app
BID=com.ilyapasyuk.wunderrip
LANGS=($@); (( $#LANGS )) || LANGS=(en ru)
OUT=appstore/preview/raw; mkdir -p $OUT
xcrun simctl status_bar $PHONE override --time 9:41 --batteryState charged --batteryLevel 100 --cellularBars 4 --wifiBars 3
xcrun simctl ui $PHONE appearance light
for lang in $LANGS; do
  xcrun simctl uninstall $PHONE $BID 2>/dev/null || true; xcrun simctl install $PHONE $APP
  marks=$PWD/$OUT/$lang.abs; rm -f $marks $OUT/$lang.mp4
  log=$(mktemp)
  xcrun simctl io $PHONE recordVideo --codec=h264 --force $OUT/$lang.mp4 2>$log &
  rec=$!
  until grep -q "Recording started" $log; do sleep 0.05; done
  t0=$(python3 -c 'import time; print(time.time())')
  TEST_RUNNER_PROMO_LANG=$lang xcodebuild -project tools/promo/WRPromo.xcodeproj -scheme WRPromo -destination "id=$PHONE" -derivedDataPath build/promo \
    test-without-building -only-testing:WRPromoUITests/PromoUITests/testPreview \
    2>&1 | tee $log.test | grep -E "Test Case|error:|failed" || true
  grep -o "PROMO_MARK .*" $log.test | sed 's/PROMO_MARK //' > $marks
  sleep 0.5; kill -INT $rec; wait $rec || true
  # simctl only writes frames when the screen changes, so the video starts later than t0. Sync on the "tap" mark:
  # the third Today row's check (x 72…112, y 1005…1045 px) fills right after it.
  green=$(ffmpeg -loglevel error -t 25 -i $OUT/$lang.mp4 -vf "fps=30,crop=40:40:72:1005" -f rawvideo -pix_fmt rgb24 - | python3 -c '
import sys
d = sys.stdin.buffer.read(); n = 40 * 40 * 3
dark = [sum(1 for i in range(k * n, (k + 1) * n, 3) if max(d[i:i + 3]) < 225) for k in range(len(d) // n)]
for k in range(10, len(dark)):   # an empty ring (a few gray pixels) for 10 frames, then a filled circle
    if dark[k] > 500 and all(40 < x < 400 for x in dark[k - 10:k]): print(k / 30); break')
  python3 - $marks $t0 $green > $OUT/$lang.marks <<'PY'
import sys
t0 = float(sys.argv[2]); s = {}
for line in open(sys.argv[1]):
    name, edge, t = line.split(); s.setdefault(name, {})[edge] = float(t) - t0
shift = float(sys.argv[3]) - s["tap"]["end"] - 0.05
for name, d in s.items(): print(name, round(d["start"] + shift, 3), round(d["end"] + shift, 3))
PY
  rm -f $marks $log $log.test
  echo "✓ $lang: $OUT/$lang.mp4"; cat $OUT/$lang.marks
done
