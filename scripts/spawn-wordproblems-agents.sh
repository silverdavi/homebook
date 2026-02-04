#!/usr/bin/env bash
# Spawn all word problem implementation agents
# Usage: ./scripts/spawn-wordproblems-agents.sh

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$PROJECT_DIR/logs/agents"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$LOG_DIR"

echo "═══════════════════════════════════════════════════════════════"
echo "  HOMEBOOK - Word Problems Implementation"
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

# Spawn all agents
spawn_agent "wordproblems-generator" "50"
spawn_agent "caching" "30"
spawn_agent "wordproblems-frontend" "30"
spawn_agent "wordproblems-templates" "25"
spawn_agent "wordproblems-api" "25"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  ✅ All agents spawned!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "📊 Monitor commands:"
echo "  tail -f $LOG_DIR/*-$TIMESTAMP.log"
echo "  watch -n 30 'cat scripts/agents/*-status.md'"
echo ""
echo "🛑 Kill all agents:"
echo "  pkill -f 'claude.*dangerously-skip-permissions'"
echo ""
echo "📝 Check status files:"
echo "  cat scripts/agents/*-status.md"
echo ""
