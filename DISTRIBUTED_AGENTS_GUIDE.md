# Distributed Claude Code Agents Guide

> **Definitive booklet for running non-interactive Claude Code agents for parallel development**
> 
> Version: 1.0 | January 2026

---

## Table of Contents

1. [Core Concepts](#1-core-concepts)
2. [Essential Commands](#2-essential-commands)
3. [Agent Isolation Strategy](#3-agent-isolation-strategy)
4. [Status File Protocol](#4-status-file-protocol)
5. [Spawning Agents](#5-spawning-agents)
6. [Monitoring Techniques](#6-monitoring-techniques)
7. [Conflict Prevention](#7-conflict-prevention)
8. [Troubleshooting](#8-troubleshooting)
9. [Quick Reference Card](#9-quick-reference-card)

---

## 1. Core Concepts

### What is Non-Interactive Mode?

Claude Code's `--print` (`-p`) flag runs a single prompt and exits, making it perfect for:
- Background automation
- Parallel agent execution
- CI/CD pipelines
- Headless development

### The Agent Model

```
┌─────────────────────────────────────────────────────────────────┐
│                        YOUR CODEBASE                            │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │ Agent 1 │  │ Agent 2 │  │ Agent 3 │  │ Agent N │            │
│  │ Backend │  │Frontend │  │ Engine  │  │ Venues  │            │
│  │   API   │  │   UI    │  │ Worker  │  │  Data   │            │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘            │
│       │            │            │            │                  │
│       ▼            ▼            ▼            ▼                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              STATUS FILES (Coordination Layer)           │   │
│  │  backend-status.md | frontend-status.md | engine-status.md  │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Key Principle:** Each agent owns specific directories and coordinates via status files.

---

## 2. Essential Commands

### The Canonical Non-Interactive Command

```bash
claude --print \
  --allowedTools "Edit,Write,Bash,Read,Grep" \
  --dangerously-skip-permissions \
  --max-budget-usd 50.00 \
  -p "$(cat prompt.md)" \
  > agent.log 2>&1 &
```

### Command Breakdown

| Flag | Purpose | Required? |
|------|---------|-----------|
| `--print` / `-p` | Non-interactive mode, prints output and exits | ✅ Yes |
| `--allowedTools "..."` | Restrict to safe tools (no web, no MCP) | ⚠️ Recommended |
| `--dangerously-skip-permissions` | No prompts for file edits | ⚠️ Use in sandboxed env only |
| `--max-budget-usd N` | Cost cap for safety | ⚠️ Recommended |
| `> file.log 2>&1` | Capture all output | ✅ Yes |
| `&` | Run in background | ✅ Yes for parallel |

### Alternative: Pipe-Based Prompt

```bash
cat scripts/agents/my-prompt.md | claude -p - \
  --dangerously-skip-permissions \
  --max-budget-usd 25.00 \
  > logs/my-agent.log 2>&1 &
```

### Session-Based (Resumable)

```bash
# First run - creates session
claude --session-id my-backend-agent \
  --permission-mode acceptEdits \
  -p "$(cat backend-prompt.md)"

# Resume later
claude --resume my-backend-agent \
  -p "Continue from where you left off"
```

---

## 3. Agent Isolation Strategy

### Directory Ownership Model

**CRITICAL: Each agent owns specific directories. No overlap.**

```markdown
| Agent     | Owns                                           |
|-----------|------------------------------------------------|
| Backend   | `apps/web/app/api/`, `packages/db/`            |
| Frontend  | `apps/web/app/(pages)/`, `apps/web/components/`|
| Engine    | `packages/engine/`, `packages/workers/`        |
| Venues    | `packages/venue-data/data/`                    |
| Infra     | `infra/`, `.github/`, `Dockerfile`, root configs|
```

### Prompt Template with Ownership

Every agent prompt should include:

```markdown
# [Agent Name] Agent

## YOUR OWNERSHIP
You own these directories (you can freely edit):
- `packages/my-package/`
- `apps/web/app/my-routes/`

## OFF LIMITS (DO NOT TOUCH)
These are owned by other agents:
- `packages/other-package/` (owned by Engine Agent)
- `apps/web/components/` (owned by Frontend Agent)

## If You Need Changes in Other Directories
1. Update HUMAN_TASKS.md with the request
2. Or update your status file with "BLOCKED: need X in Y"
3. DO NOT edit files you don't own
```

### Tool Restriction

Limit tools to prevent cross-agent interference:

```bash
# Safe tool set for code-focused agents
--allowedTools "Edit,Write,Bash,Read,Grep"

# Even safer (no shell)
--allowedTools "Edit,Write,Read,Grep"

# With web search for research agents
--allowedTools "Edit,Write,Bash,Read,Grep,WebSearch"
```

---

## 4. Status File Protocol

### Purpose

Status files are the **communication layer** between agents. They answer:
- What has this agent completed?
- What is it working on?
- Is it blocked?

### Status File Structure

Create `scripts/agents/<agent-name>-status.md`:

```markdown
# [Agent Name] Status

## Current Task
Working on: [brief description]
Started: [timestamp]

## Completed This Session
- [x] Task 1 description
- [x] Task 2 description
- [ ] Task 3 (in progress)

## Progress Metrics
| Metric | Current | Target | % |
|--------|---------|--------|---|
| API Routes | 12 | 25 | 48% |
| Tests | 45 | 100 | 45% |

## Blockers
- BLOCKED: Waiting for [what] from [who/what]
- NEEDS: [requirement]

## Files Modified This Session
- `path/to/file.ts`
- `path/to/other.ts`

## Next Up
1. Next task
2. Following task

## Last Updated
[ISO timestamp]
```

### Prompt Instructions for Status Updates

Include in every agent prompt:

```markdown
## STATUS FILE REQUIREMENTS

After each major task:
1. Update `scripts/agents/YOUR-NAME-status.md`
2. Include what you completed
3. Include what you're doing next
4. Include any blockers

Example update command:
\`\`\`bash
cat > scripts/agents/my-status.md << 'EOF'
# My Agent Status
## Last Updated: $(date -Iseconds)
...
EOF
\`\`\`
```

### Global Status File

For project-wide coordination, use a central file:

```markdown
# PROJECT STATUS.md

## Active Agents
| Agent | Status | Last Update | Current Task |
|-------|--------|-------------|--------------|
| Backend | 🟢 Running | 10:30 | API routes |
| Frontend | 🟢 Running | 10:28 | Components |
| Venues | 🟡 Slow | 10:15 | Medicine |

## Merge Queue
- [ ] Backend: auth routes ready
- [ ] Frontend: components refactor

## Blockers
- Backend blocked on: environment vars
```

---

## 5. Spawning Agents

### Single Agent Spawn

```bash
#!/bin/bash
# spawn-single.sh

PROJECT_DIR="$(pwd)"
LOG_DIR="$PROJECT_DIR/logs/agents"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$LOG_DIR"

claude --print \
  --allowedTools "Edit,Write,Bash,Read,Grep" \
  --dangerously-skip-permissions \
  --max-budget-usd 50.00 \
  -p "$(cat scripts/agents/backend-prompt.md)" \
  > "$LOG_DIR/backend-$TIMESTAMP.log" 2>&1 &

echo "Agent PID: $!"
echo $! > "$LOG_DIR/backend.pid"
```

### Multi-Agent Spawner

```bash
#!/bin/bash
# spawn-all-agents.sh

PROJECT_DIR="$(pwd)"
LOG_DIR="$PROJECT_DIR/logs/agents"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$LOG_DIR"

echo "🚀 Spawning agents at $TIMESTAMP"

# Define agents: name, budget, tools
declare -A AGENTS=(
  ["backend"]="50|Edit,Write,Bash,Read,Grep"
  ["frontend"]="40|Edit,Write,Bash,Read,Grep"
  ["venues"]="100|Edit,Write,Bash,Read,Grep,WebSearch"
)

PIDS=()

for AGENT in "${!AGENTS[@]}"; do
  IFS='|' read -r BUDGET TOOLS <<< "${AGENTS[$AGENT]}"
  
  echo "Starting $AGENT (budget: \$$BUDGET)..."
  
  claude --print \
    --allowedTools "$TOOLS" \
    --dangerously-skip-permissions \
    --max-budget-usd "$BUDGET" \
    -p "$(cat scripts/agents/${AGENT}-prompt.md)" \
    > "$LOG_DIR/${AGENT}-$TIMESTAMP.log" 2>&1 &
  
  PID=$!
  PIDS+=("$AGENT:$PID")
  echo "  PID: $PID"
  
  sleep 2  # Stagger starts
done

# Save PIDs
echo "${PIDS[@]}" > "$LOG_DIR/all-pids-$TIMESTAMP.txt"

echo ""
echo "✅ All agents spawned!"
echo "Monitor: tail -f $LOG_DIR/*-$TIMESTAMP.log"
```

### Staggered Start (Prevent Race Conditions)

```bash
# Start with delays to prevent initial git conflicts
for agent in backend frontend venues; do
  spawn_agent "$agent"
  sleep 5  # 5 second delay between starts
done
```

---

## 6. Monitoring Techniques

### Real-Time Log Watching

```bash
# Watch all agent logs
tail -f logs/agents/*.log

# Watch specific agent
tail -f logs/agents/backend-*.log

# Watch with highlighting (requires multitail)
multitail logs/agents/*.log
```

### Process Monitoring

```bash
# Check running agents
pgrep -af 'claude.*dangerously-skip-permissions'

# With resource usage
ps aux | grep 'claude.*print'

# Count active agents
pgrep -c -f 'claude.*print'
```

### Comprehensive Monitor Script

```bash
#!/bin/bash
# monitor-agents.sh

LOG_DIR="logs/agents"

clear
echo "═══════════════════════════════════════════"
echo "        AGENT MONITOR - $(date '+%H:%M:%S')"
echo "═══════════════════════════════════════════"

# Running processes
echo ""
echo "🟢 RUNNING AGENTS:"
ps aux | grep 'claude.*print' | grep -v grep | \
  awk '{printf "  PID: %-8s CPU: %s%%  MEM: %s%%\n", $2, $3, $4}'

# Status file updates
echo ""
echo "📊 STATUS FILES (last modified):"
for f in scripts/agents/*-status.md; do
  [ -f "$f" ] && echo "  $(basename $f): $(stat -f '%Sm' -t '%H:%M' "$f")"
done

# Recent git activity
echo ""
echo "📝 RECENT COMMITS:"
git log --oneline -5 --format="  %h %s (%ar)"

# Modified files
echo ""
echo "🔧 UNCOMMITTED CHANGES:"
git status --porcelain | head -10

# Log sizes (activity indicator)
echo ""
echo "📁 LOG ACTIVITY:"
for f in "$LOG_DIR"/*.log; do
  [ -f "$f" ] && echo "  $(basename $f): $(wc -l < "$f") lines"
done | tail -5
```

### Automated Monitor (Runs Every 30s)

```bash
watch -n 30 './scripts/monitor-agents.sh'
```

### Slack/Discord Notifications (Optional)

```bash
# In agent prompt, add:
## On Completion
When you complete all tasks, run:
\`\`\`bash
curl -X POST "$SLACK_WEBHOOK" \
  -H 'Content-Type: application/json' \
  -d '{"text": "✅ Backend Agent completed all tasks"}'
\`\`\`
```

---

## 7. Conflict Prevention

### Git Strategy

Each agent should commit atomically:

```markdown
## GIT RULES (include in every prompt)

After completing each logical unit of work:
1. Stage only YOUR files: `git add packages/your-package/`
2. Commit with prefix: `git commit -m "agent/backend: add user routes"`
3. Push immediately: `git push origin main`

Before editing files:
1. Always `git pull` first
2. Check if file was recently modified by another agent

If conflicts occur:
1. Pull and merge: `git pull --rebase`
2. Resolve conflicts favoring YOUR owned directories
3. Push immediately
```

### Commit Message Convention

```
<agent>/<scope>: <description>

Examples:
  agent/backend: implement auth routes
  agent/frontend: add dashboard components
  agent/venues: add 50 biology journals
  agent/infra: configure CI pipeline
```

### Locking Files (Advanced)

For critical shared files:

```bash
# Create a simple lock file mechanism
LOCK_FILE=".locks/package.json.lock"

acquire_lock() {
  while [ -f "$LOCK_FILE" ]; do
    echo "Waiting for lock..."
    sleep 5
  done
  echo $$ > "$LOCK_FILE"
}

release_lock() {
  rm -f "$LOCK_FILE"
}
```

### Shared File Protocol

For files multiple agents might touch (like `package.json`):

```markdown
## SHARED FILES

If you need to modify a shared file like `package.json`:
1. Check HUMAN_TASKS.md - maybe someone already requested
2. Add your request to HUMAN_TASKS.md:
   - "DEPENDENCY: Add lodash ^4.17.21 to packages/engine"
3. Wait for human to handle, OR coordinate via status file
```

---

## 8. Troubleshooting

### Agent Died / Stopped

```bash
# Check if process exists
ps -p $(cat logs/agents/backend.pid)

# Check exit in log
tail -50 logs/agents/backend-*.log

# Restart with same session
claude --resume backend-session-id \
  --dangerously-skip-permissions \
  -p "Continue from where you left off"
```

### Agent Stuck / Looping

```bash
# Kill the specific agent
kill $(cat logs/agents/backend.pid)

# Or kill all agents
pkill -f 'claude.*dangerously-skip-permissions'

# Analyze what happened
grep -i "error\|failed\|stuck" logs/agents/backend-*.log
```

### Budget Exhausted

```bash
# Check budget status in log
grep -i "budget\|cost\|spent" logs/agents/*.log

# Restart with new budget
claude --print --max-budget-usd 25.00 \
  -p "Continue from checkpoint, budget was exhausted"
```

### Git Conflicts

```bash
# If agent left uncommitted changes
cd /path/to/project
git stash
git pull
git stash pop
# Manually resolve, then commit

# Prevent: Always include in prompt:
"Before editing, run: git pull"
```

### Rate Limits

```bash
# Add delay in spawner
sleep 5  # between agent spawns

# Or use fallback model
--fallback-model sonnet
```

---

## 9. Quick Reference Card

### Start Agent (Copy-Paste Ready)

```bash
claude --print \
  --allowedTools "Edit,Write,Bash,Read,Grep" \
  --dangerously-skip-permissions \
  --max-budget-usd 50.00 \
  -p "$(cat scripts/agents/AGENT-prompt.md)" \
  > logs/agents/AGENT-$(date +%Y%m%d_%H%M%S).log 2>&1 &
echo "PID: $!"
```

### Monitor All

```bash
tail -f logs/agents/*.log
```

### Check Status

```bash
cat scripts/agents/*-status.md
```

### Kill All Agents

```bash
pkill -f 'claude.*dangerously-skip-permissions'
```

### Git Sync After Agents

```bash
git pull && git status && git log --oneline -10
```

### Essential Flags Cheatsheet

| Flag | Short | What it does |
|------|-------|--------------|
| `--print "prompt"` | `-p` | Non-interactive, exit after |
| `--allowedTools "..."` | | Restrict available tools |
| `--dangerously-skip-permissions` | | No prompts (sandbox only!) |
| `--max-budget-usd N` | | Cost limit |
| `--session-id X` | | Named session for resume |
| `--resume X` | `-r` | Resume session X |
| `--output-format json` | | Machine-readable output |
| `--permission-mode acceptEdits` | | Auto-accept file edits |

---

## Appendix: Example Agent Prompt Template

```markdown
# [Agent Name] Agent

> Session: [unique-session-id]
> Budget: $[X]
> Started: [timestamp]

## YOUR OWNERSHIP
You exclusively own and can edit:
- `path/to/your/directory/`
- `path/to/another/`

## DO NOT TOUCH
These directories are owned by other agents:
- `path/to/other/` (Frontend Agent)

## YOUR MISSION
[Clear description of what this agent should accomplish]

## IMMEDIATE TASKS (in order)
1. Task 1 with specific details
2. Task 2 with specific details
3. Task 3 with specific details

## OUTPUT FORMAT / CONVENTIONS
[Specific formatting, naming, or code style requirements]

## GIT RULES
- Pull before editing: `git pull`
- Commit after each task: `git add YOUR_DIRS && git commit -m "agent/name: desc"`
- Push immediately: `git push`

## STATUS UPDATES
After each major task, update `scripts/agents/YOUR-status.md`:
- What you completed
- What you're doing next
- Any blockers

## ON COMPLETION
1. Update your status file with COMPLETE
2. Commit all changes
3. Push to remote

## REMEMBER
- Stay in your directories
- Commit frequently
- Update status after each task
- Never mock or use fallbacks
```

---

## Summary

| Step | Action |
|------|--------|
| 1. Define | Create prompts with clear ownership |
| 2. Spawn | Run with `--print --dangerously-skip-permissions` |
| 3. Log | Capture to timestamped log files |
| 4. Monitor | `tail -f` logs + check status files |
| 5. Coordinate | Status files + git commits |
| 6. Prevent Conflicts | Directory ownership + immediate commits |

**The Golden Rules:**
1. ✅ One agent = one directory scope
2. ✅ Status files for coordination
3. ✅ Commit immediately after changes
4. ✅ Pull before editing
5. ✅ Log everything
6. ✅ Set budget limits
7. ✅ Use `--dangerously-skip-permissions` only in safe environments

---

*Generated: January 2026 | Claude Code CLI v2.x*
