#!/usr/bin/env bash
# Spawn Phase 2 agents: Expanded math topics, standards, and tests
# Usage: ./scripts/spawn-phase2-agents.sh

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$PROJECT_DIR/logs/agents"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$LOG_DIR"

echo "═══════════════════════════════════════════════════════════════"
echo "  HOMEBOOK - Phase 2: Expanded Math + Standards + Tests"
echo "  Spawning 5 parallel agents at $TIMESTAMP"
echo "═══════════════════════════════════════════════════════════════"
echo ""

cd "$PROJECT_DIR"

# Pull latest changes first
echo "📥 Pulling latest changes..."
git pull || true
echo ""

# Function to spawn an agent
spawn_agent() {
  local AGENT="$1"
  local BUDGET="$2"
  local PROMPT_FILE="$PROJECT_DIR/scripts/agents/${AGENT}-prompt.md"
  
  if [ ! -f "$PROMPT_FILE" ]; then
    echo "❌ Prompt file not found: $PROMPT_FILE"
    return 1
  fi
  
  echo "🚀 Starting $AGENT (budget: \$$BUDGET)..."
  
  claude --print \
    --allowedTools "Edit,Write,Bash,Read,Grep" \
    --dangerously-skip-permissions \
    --max-budget-usd "$BUDGET" \
    -p "$(cat "$PROMPT_FILE")" \
    > "$LOG_DIR/${AGENT}-$TIMESTAMP.log" 2>&1 &
  
  local PID=$!
  echo "  PID: $PID"
  echo "  Log: $LOG_DIR/${AGENT}-$TIMESTAMP.log"
  echo "$PID" > "$LOG_DIR/${AGENT}.pid"
  
  sleep 3  # Stagger starts
}

# Spawn all Phase 2 agents
spawn_agent "arithmetic-generator" "50"
spawn_agent "decimals-generator" "50"
spawn_agent "standards" "40"
spawn_agent "frontend-topics" "30"
spawn_agent "tests" "50"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  ✅ All Phase 2 agents spawned!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "📊 Monitor commands:"
echo "  tail -f $LOG_DIR/*-$TIMESTAMP.log"
echo "  watch -n 30 'cat scripts/agents/*-status.md | grep -A5 \"Current Task\"'"
echo ""
echo "🛑 Kill all agents:"
echo "  pkill -f 'claude.*dangerously-skip-permissions'"
echo ""
