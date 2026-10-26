#!/bin/bash
# Print today's sheets, and only today's: math, then World, then the extra.
# Safe to run more than once: a stamp file blocks a second print.
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
DATE="$(TZ=America/New_York date +%F)"
STAMP_DIR="$HOME/.daily-print"
mkdir -p "$STAMP_DIR"
[[ -f "$STAMP_DIR/$DATE" ]] && { echo "already printed $DATE"; exit 0; }

cd "$REPO/content/daily/print"
shopt -s nullglob
math=(); world=(); extra=()
for f in "$DATE"-*.pdf; do
  case "$f" in
    "$DATE"-world-*) world+=("$f") ;;
    "$DATE"-extra-*) extra+=("$f") ;;
    *) math+=("$f") ;;
  esac
done
files=(${math[@]+"${math[@]}"} ${world[@]+"${world[@]}"} ${extra[@]+"${extra[@]}"})
[[ ${#files[@]} -eq 0 ]] && { echo "nothing to print for $DATE"; exit 0; }

for f in "${files[@]}"; do
  lp -d HP_Color_LaserJet_Pro_MFP_4301__CC8F25_ -o InputSlot=tray-2 -o PageSize=Letter \
    -o Duplex=DuplexNoTumble -o ColorModel=RGB "$f"
done
touch "$STAMP_DIR/$DATE"
