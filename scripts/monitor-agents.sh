#!/bin/bash
# monitor-agents.sh - Monitor all running Homebook agents
# Usage: ./scripts/monitor-agents.sh
#        watch -n 30 ./scripts/monitor-agents.sh

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$PROJECT_DIR/logs/agents"
STATUS_DIR="$PROJECT_DIR/scripts/agents"

clear
echo "═══════════════════════════════════════════════════════════════"
echo "         HOMEBOOK AGENT MONITOR - $(date '+%Y-%m-%d %H:%M:%S')"
echo "═══════════════════════════════════════════════════════════════"

# Check running processes
echo ""
echo "🟢 RUNNING AGENTS:"
RUNNING=$(pgrep -af 'claude.*dangerously-skip-permissions' 2>/dev/null || true)
if [ -z "$RUNNING" ]; then
    echo "   No agents currently running"
else
    echo "$RUNNING" | while read -r line; do
        PID=$(echo "$line" | awk '{print $1}')
        # Try to identify which agent
        for agent in generator frontend backend templates infra dns; do
            if [ -f "$LOG_DIR/${agent}.pid" ]; then
                SAVED_PID=$(cat "$LOG_DIR/${agent}.pid" 2>/dev/null)
                if [ "$PID" = "$SAVED_PID" ]; then
                    CPU=$(ps -p "$PID" -o %cpu= 2>/dev/null || echo "?")
                    MEM=$(ps -p "$PID" -o %mem= 2>/dev/null || echo "?")
                    echo "   $agent: PID $PID (CPU: ${CPU}%, MEM: ${MEM}%)"
                    break
                fi
            fi
        done
    done
fi

# Status files
echo ""
echo "📊 STATUS FILES (last updated):"
for agent in generator frontend backend templates infra dns; do
    STATUS_FILE="$STATUS_DIR/${agent}-status.md"
    if [ -f "$STATUS_FILE" ]; then
        MODIFIED=$(stat -f '%Sm' -t '%H:%M' "$STATUS_FILE" 2>/dev/null || stat -c '%y' "$STATUS_FILE" 2>/dev/null | cut -d' ' -f2 | cut -d'.' -f1)
        # Get current task from status file
        TASK=$(grep -m1 "^## Current" "$STATUS_FILE" 2>/dev/null | sed 's/## Current[^:]*: //' || echo "unknown")
        echo "   $agent: $MODIFIED - $TASK"
    else
        echo "   $agent: (no status file)"
    fi
done

# Recent git activity
echo ""
echo "📝 RECENT COMMITS:"
cd "$PROJECT_DIR"
git log --oneline -5 --format="   %h %s (%ar)" 2>/dev/null || echo "   (no git history)"

# Log sizes
echo ""
echo "📁 LOG ACTIVITY (lines):"
LATEST_SESSION=$(ls -t "$LOG_DIR"/session-*.json 2>/dev/null | head -1)
if [ -f "$LATEST_SESSION" ]; then
    TIMESTAMP=$(basename "$LATEST_SESSION" | sed 's/session-//' | sed 's/.json//')
    for agent in generator frontend backend templates infra dns; do
        LOG="$LOG_DIR/${agent}-${TIMESTAMP}.log"
        if [ -f "$LOG" ]; then
            LINES=$(wc -l < "$LOG" | tr -d ' ')
            SIZE=$(du -h "$LOG" | cut -f1)
            echo "   $agent: $LINES lines ($SIZE)"
        fi
    done
else
    echo "   (no active session)"
fi

# Uncommitted changes
echo ""
echo "🔧 UNCOMMITTED CHANGES:"
CHANGES=$(git status --porcelain 2>/dev/null | head -10)
if [ -z "$CHANGES" ]; then
    echo "   (working tree clean)"
else
    echo "$CHANGES" | sed 's/^/   /'
    TOTAL=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
    if [ "$TOTAL" -gt 10 ]; then
        echo "   ... and $((TOTAL - 10)) more files"
    fi
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
