#!/bin/bash
# Send today's homeschool kickoff if a script exists for the New York date.
# Safe to run more than once: a stamp file blocks a second send.
# No script for today (weekend, holiday, day not written yet) exits 0.
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
DATE="$(TZ=America/New_York date +%F)"
STAMP_DIR="${DAILY_STAMP_DIR:-$HOME/.daily-kickoff}"
mkdir -p "$STAMP_DIR"
STAMP="$STAMP_DIR/$DATE"

if [[ -f "$STAMP" ]]; then
  echo "already sent $DATE ($STAMP)"
  exit 0
fi

cd "$REPO/apps/web"
matches=$(grep -l "$DATE" __tests__/smoke/send-day*-kickoff.mjs 2>/dev/null || true)
if [[ -z "$matches" ]]; then
  echo "no kickoff script for $DATE"
  exit 0
fi

script=$(printf '%s\n' "$matches" | head -1)
echo "sending $DATE via $script"
node "$script" --send
date -u +"sent $DATE at %Y-%m-%dT%H:%M:%SZ via $script" > "$STAMP"
echo "stamped $STAMP"
