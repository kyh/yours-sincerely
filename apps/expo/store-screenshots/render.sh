#!/bin/bash
# Renders the full 7920x2868 story stage from real app captures, then slices
# it into six 1320x2868 App Store frames (iPhone 6.9").
set -euo pipefail
cd "$(dirname "$0")"

B=/private/tmp/claude-501/-Users-kyh-Documents-Projects-yours-sincerely/a4f9756e-7af0-4bd1-897b-1c01f22db3fa/scratchpad
ICON="file:///Users/kyh/Documents/Projects/yours-sincerely/apps/expo/assets/icon-light.png"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# Story slot -> real capture
COMPOSE="file://$B/rel-compose.png"   # p0  "say the thing you never sent"
FEED="file://$B/rel-feed.png"         # p1  "written in disappearing ink"
DETAIL2="file://$B/rel-detail2.png"   # p2  "to anyone. to no one. to the one." (mother letter)
DETAIL="file://$B/rel-detail.png"     # p3  "no names here. only what's true."
# p4 "someone out there needed it too" -> feed

URL="file://$PWD/frame.html?full=1&icon=$ICON&feed=$COMPOSE&timer=$FEED&detail=$DETAIL2&swipe=$DETAIL&hearts=$FEED"

"$CHROME" --headless=new --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=1 --window-size=7920,2868 \
  --screenshot="$PWD/stage.png" "$URL" >/dev/null 2>&1

mkdir -p out
for i in 0 1 2 3 4 5; do
  x=$(( i * 1320 ))
  magick stage.png -crop 1320x2868+${x}+0 +repage "out/frame-$((i+1)).png"
done
echo "wrote out/frame-1..6.png"
