#!/bin/zsh
# Raw App Store screenshots from the DEBUG demo build (-demo 1, see WunderRip/Store/DemoData.swift):
#   iPhone 6.9" (1320×2868) iphone_1…6, iPad 13" (2064×2752) ipad_1…3, Apple Watch Ultra (422×514) watch_1.
# Output: appstore/raw/<lang>/. Only en and ru: the app UI exists in those two; other store locales reuse en (captions
# are localized in tools/make_screenshots.swift).
# iphone_5 is the Home Screen widget: the iPhone simulator is ERASED, set to the language and the widget is added by the
# XCUITest in tools/promo (testAddWidget). Use simulators of your own, never shared ones.
#   xcodebuild -project WunderRip.xcodeproj -scheme WunderRip -destination 'generic/platform=iOS Simulator' -derivedDataPath build/dd build
#   (cd tools/promo && xcodegen generate) && xcodebuild -project tools/promo/WRPromo.xcodeproj -scheme WRPromo \
#       -destination "id=$PHONE" -derivedDataPath build/promo build-for-testing
#   PHONE=<udid> PAD=<udid> WATCH=<udid> zsh tools/capture_screenshots.sh [en ru]     (from ios/; ONLY="iphone_3 ipad_2" retakes those)
set -u
: ${PHONE:?} ${PAD:?} ${WATCH:?}
APP=build/dd/Build/Products/Debug-iphonesimulator/wunderrip.app
WAPP=build/dd/Build/Products/Debug-watchsimulator/wunderrip.app
BID=com.ilyapasyuk.wunderrip
LANGS=($@); (( $#LANGS )) || LANGS=(en ru)
typeset -A LOCALE=(en en_US ru ru_RU)
typeset -A COMPOSE=(en "Call mom tomorrow at 6pm #family" ru "Позвонить маме в 18 #семья")

want() { [[ -z ${ONLY:-} || " $ONLY " == *" $1 "* ]]; }

prepare() {  # device
  xcrun simctl boot $1 2>/dev/null; xcrun simctl bootstatus $1 -b >/dev/null
  xcrun simctl status_bar $1 override --time 9:41 --batteryState charged --batteryLevel 100 --cellularBars 4 --wifiBars 3 2>/dev/null
  xcrun simctl ui $1 appearance light 2>/dev/null
}

shot() {  # device bundle out args...
  local dev=$1 bid=$2 out=$3; shift 3
  want ${out:t:r} || return 0
  xcrun simctl launch --terminate-running-process $dev $bid "$@" >/dev/null
  sleep 6
  xcrun simctl io $dev screenshot $out >/dev/null 2>&1
}

widget() {  # lang out — erase the phone, system language = lang, add the widget, photograph the Home Screen
  local lang=$1 out=$2
  want ${out:t:r} || return 0
  xcrun simctl shutdown $PHONE 2>/dev/null; xcrun simctl erase $PHONE
  xcrun simctl boot $PHONE; xcrun simctl bootstatus $PHONE -b >/dev/null
  xcrun simctl spawn $PHONE defaults write -g AppleLanguages -array $lang
  xcrun simctl spawn $PHONE defaults write -g AppleLocale ${LOCALE[$lang]}
  xcrun simctl shutdown $PHONE; prepare $PHONE
  sleep 5
  xcrun simctl install $PHONE $APP
  TEST_RUNNER_PROMO_LANG=$lang xcodebuild -project tools/promo/WRPromo.xcodeproj -scheme WRPromo -destination "id=$PHONE" \
    -derivedDataPath build/promo test-without-building -only-testing:WRPromoUITests/PromoUITests/testAddWidget 2>&1 \
    | grep -E "Test Case .*(passed|failed)|error:" | cut -c1-300
  xcrun simctl uninstall $PHONE com.ilyapasyuk.wrpromo.WRPromoUITests.xctrunner 2>/dev/null
  xcrun simctl uninstall $PHONE com.ilyapasyuk.wrpromo.WRPromoHost 2>/dev/null
  sleep 3
  xcrun simctl io $PHONE screenshot $out >/dev/null 2>&1
}

for d in $PHONE $PAD $WATCH; do prepare $d; done
for d in $PHONE $PAD; do xcrun simctl uninstall $d $BID 2>/dev/null; xcrun simctl install $d $APP; done
xcrun simctl uninstall $WATCH $BID.watchkitapp 2>/dev/null; xcrun simctl install $WATCH $WAPP

for lang in $LANGS; do
  dir=appstore/raw/$lang; mkdir -p $dir
  c=(-AppleLanguages "($lang)" -AppleLocale ${LOCALE[$lang]} -demo 1)
  shot $PHONE $BID $dir/iphone_1.png $c
  shot $PHONE $BID $dir/iphone_2.png $c -demoCompose "${COMPOSE[$lang]}"
  shot $PHONE $BID $dir/iphone_3.png $c -demoTask review
  shot $PHONE $BID $dir/iphone_4.png $c -demoDestination upcoming
  shot $PHONE $BID $dir/iphone_6.png $c -demoDestination sidebar
  shot $PAD $BID $dir/ipad_1.png $c -demoTask review
  shot $PAD $BID $dir/ipad_2.png $c -demoDestination upcoming -demoTask gift -demoCompose "${COMPOSE[$lang]}"
  shot $PAD $BID $dir/ipad_3.png $c -demoDestination anytime -demoTask mike
  shot $WATCH $BID.watchkitapp $dir/watch_1.png $c
  echo "✓ $lang"
done
# Widget last: it erases the phone.
for lang in $LANGS; do widget $lang appstore/raw/$lang/iphone_5.png; echo "✓ $lang widget"; done
