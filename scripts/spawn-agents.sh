#!/bin/bash
# spawn-agents.sh - Spawn all Homebook development agents
# Usage: ./scripts/spawn-agents.sh

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$PROJECT_DIR/logs/agents"
PROMPT_DIR="$PROJECT_DIR/scripts/agents"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$LOG_DIR"

echo "🏠 HOMEBOOK - Spawning Agents"
echo "=============================="
echo "Domain: teacher.ninja"
echo "Time: $TIMESTAMP"
echo ""

# Define agents: name|budget|priority
declare -a AGENTS=(
    "generator|60|1"    # Highest priority - core product
    "frontend|40|2"     # UI
    "backend|30|3"      # API routes
    "templates|25|4"    # HTML/CSS templates
    "infra|20|5"        # Docker/deployment
    "dns|25|6"          # DNS/SSL
)

PIDS=()

for AGENT_DEF in "${AGENTS[@]}"; do
    IFS='|' read -r AGENT BUDGET PRIORITY <<< "$AGENT_DEF"
    
    PROMPT_FILE="$PROMPT_DIR/${AGENT}-prompt.md"
    
    if [ ! -f "$PROMPT_FILE" ]; then
        echo "⚠️  Missing prompt: $PROMPT_FILE"
        continue
    fi
    
    echo "🚀 [$PRIORITY] Starting $AGENT agent (budget: \$$BUDGET)..."
    
    claude --print \
        --allowedTools "Edit,Write,Bash,Read,Grep" \
        --dangerously-skip-permissions \
        --max-budget-usd "$BUDGET" \
        -p "$(cat "$PROMPT_FILE")" \
        > "$LOG_DIR/${AGENT}-$TIMESTAMP.log" 2>&1 &
    
    PID=$!
    PIDS+=("$AGENT:$PID")
    echo "   PID: $PID → $LOG_DIR/${AGENT}-$TIMESTAMP.log"
    echo $PID > "$LOG_DIR/${AGENT}.pid"
    
    sleep 3  # Stagger starts to avoid rate limits
done

echo ""
echo "✅ All agents spawned!"
echo ""
echo "Monitor with:"
echo "  tail -f $LOG_DIR/*-$TIMESTAMP.log"
echo ""
echo "Monitor single agent:"
echo "  tail -f $LOG_DIR/generator-$TIMESTAMP.log"
echo ""
echo "Kill all agents:"
echo "  pkill -f 'claude.*dangerously-skip-permissions'"
echo ""
echo "Agent PIDs:"
for entry in "${PIDS[@]}"; do
    echo "  $entry"
done

# Save session info
cat > "$LOG_DIR/session-$TIMESTAMP.json" << EOF
{
  "timestamp": "$TIMESTAMP",
  "agents": [
    $(printf '"%s",' "${AGENTS[@]}" | sed 's/,$//')
  ],
  "pids": {
    $(for entry in "${PIDS[@]}"; do
        IFS=':' read -r name pid <<< "$entry"
        echo "\"$name\": $pid,"
    done | sed 's/,$//')
  }
}
EOF

echo ""
echo "Session saved: $LOG_DIR/session-$TIMESTAMP.json"
