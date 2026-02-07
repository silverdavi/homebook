# Claude Code CLI Reference

> Last updated: February 2026  
> Docs: https://docs.claude.com/docs/en/cli-reference

Claude Code is Anthropic's agentic CLI for working with Claude directly from your terminal. It provides an interactive REPL, subagent delegation, hooks, skills, and full codebase manipulation.

---

## Installation

```bash
npm install -g @anthropic-ai/claude-code
```

Requires **Node.js 18+**.

### Authentication

```bash
# Interactive login
claude auth login

# Or set environment variable
export ANTHROPIC_API_KEY="your-api-key-here"

# Long-lived token (requires Claude subscription)
claude setup-token
```

---

## Basic Usage

### Interactive Mode (REPL)

```bash
claude
```

### Start with a Prompt

```bash
claude "explain this project"
claude "find all TODO comments in this repo"
```

### Non-Interactive / Print Mode

```bash
claude -p "your prompt"
claude --print "summarize the main.py file"
```

Prints the response and exits. Useful for scripts, CI/CD, and piping.

### Pipe Input

```bash
cat file.py | claude "review this code"
git diff | claude "explain these changes"
echo "Hello" | claude -p "translate to French"
```

---

## Models

### Available Models

| Alias | Full Name | Use Case |
|-------|-----------|----------|
| `opus` | `claude-opus-4-6` | Complex debugging, architecture, security analysis |
| | `claude-opus-4-5-20251101` | Previous Opus |
| `sonnet` | `claude-sonnet-4-5-20250929` | **Default.** Daily coding, general development |
| | `claude-sonnet-4-20250514` | Previous Sonnet |
| `haiku` | `claude-haiku-4-5-20251001` | Fast/cheap tasks, exploration, lightweight analysis |
| | `claude-3-5-haiku-20241022` | Legacy Haiku |

### Switch Model

```bash
# Use alias (resolves to latest)
claude --model sonnet
claude --model opus
claude --model haiku

# Use full model name
claude --model claude-opus-4-6

# Fallback for overloaded models (print mode only)
claude -p "prompt" --fallback-model sonnet
```

---

## Session Management

```bash
claude -c                       # Continue most recent conversation
claude -c -p "follow-up"       # Continue via SDK (print mode)
claude -r                       # Interactive session picker
claude -r <session-id>          # Resume specific session
claude -r "auth-refactor"       # Resume by session name
claude --session-id <uuid>      # Use specific UUID
claude --resume <id> --fork-session  # Fork instead of reuse
claude --from-pr 123            # Resume sessions linked to a PR
```

---

## Subagents

Claude Code uses a **three-layer architecture**:
1. **Core** — main conversation (200K tokens, 1M with premium)
2. **Delegation** — up to 10 parallel subagents for focused work
3. **Extension** — MCP, hooks, skills, plugins

### Built-in Subagents

| Subagent | Model | Tools | Purpose |
|----------|-------|-------|---------|
| **Explore** | Haiku | Read-only | Fast codebase search & analysis |
| **Plan** | Inherits | Read-only | Research for plan mode |
| **General-purpose** | Inherits | All | Complex multi-step tasks |
| **Bash** | Inherits | Bash | Terminal commands in separate context |

Claude automatically delegates to subagents based on task type. Explore is used for codebase navigation, Plan for safe analysis, General-purpose for complex multi-file operations.

### Create Custom Subagents

#### Via `/agents` command (interactive)

```
/agents
```

Select **Create new agent** → choose scope (user or project) → configure.

#### Via Markdown files

Place `.md` files with YAML frontmatter:

| Location | Scope | Priority |
|----------|-------|----------|
| `--agents` CLI flag | Current session | 1 (highest) |
| `.claude/agents/` | Current project | 2 |
| `~/.claude/agents/` | All projects | 3 |
| Plugin `agents/` | Where plugin enabled | 4 (lowest) |

Example subagent file (`.claude/agents/code-reviewer.md`):

```markdown
---
name: code-reviewer
description: Reviews code for quality and best practices. Use proactively after code changes.
tools: Read, Glob, Grep, Bash
model: sonnet
permissionMode: plan
memory: project
---

You are a senior code reviewer. Analyze code for quality, security, and
best practices. Provide specific, actionable feedback.
```

#### Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Unique identifier (lowercase, hyphens) |
| `description` | Yes | When Claude should delegate to this subagent |
| `tools` | No | Tools allowed (inherits all if omitted) |
| `disallowedTools` | No | Tools to deny |
| `model` | No | `sonnet`, `opus`, `haiku`, or `inherit` (default) |
| `permissionMode` | No | `default`, `acceptEdits`, `dontAsk`, `bypassPermissions`, `plan` |
| `skills` | No | Skills to preload into context |
| `hooks` | No | Lifecycle hooks scoped to this subagent |
| `memory` | No | Persistent memory: `user`, `project`, or `local` |

#### Via CLI flag (ephemeral)

```bash
claude --agents '{
  "code-reviewer": {
    "description": "Expert code reviewer. Use proactively after code changes.",
    "prompt": "You are a senior code reviewer. Focus on code quality, security, and best practices.",
    "tools": ["Read", "Grep", "Glob", "Bash"],
    "model": "sonnet"
  },
  "debugger": {
    "description": "Debugging specialist for errors and test failures.",
    "prompt": "You are an expert debugger. Analyze errors, identify root causes, and provide fixes."
  }
}'
```

### Subagent Patterns

```bash
# Explicit delegation
"Use the code-reviewer subagent to review my changes"

# Parallel research
"Research auth, database, and API modules in parallel using separate subagents"

# Chaining
"Use code-reviewer to find performance issues, then use optimizer to fix them"

# Backgrounding: press Ctrl+B to send a running task to background
# Or ask: "run this in the background"
```

### Persistent Memory

Subagents with `memory` enabled maintain a `MEMORY.md` across sessions:

| Scope | Location | Use when |
|-------|----------|----------|
| `user` | `~/.claude/agent-memory/<name>/` | Learnings across all projects |
| `project` | `.claude/agent-memory/<name>/` | Project-specific, shareable via git |
| `local` | `.claude/agent-memory-local/<name>/` | Project-specific, not in git |

### Disable Subagents

```bash
# Via CLI
claude --disallowedTools "Task(Explore)"

# Via settings.json
{ "permissions": { "deny": ["Task(Explore)", "Task(my-custom-agent)"] } }
```

---

## Agent Teams

For multiple agents working **in parallel and communicating with each other** (beyond subagents):

```bash
claude --teammate-mode auto      # Default
claude --teammate-mode in-process
claude --teammate-mode tmux
```

Subagents work within a single session; agent teams coordinate across separate sessions.

---

## Skills

Reusable prompts/workflows that run in the **main conversation context** (not isolated like subagents):

```bash
/skills           # Manage skills
```

Skills can be preloaded into subagents via the `skills` frontmatter field.

---

## Hooks

Deterministic automation at lifecycle stages. Define in `settings.json` or subagent frontmatter.

### Hook Events

| Event | Fires when | Matcher |
|-------|-----------|---------|
| `PreToolUse` | Before a tool runs | Tool name |
| `PostToolUse` | After a tool runs | Tool name |
| `Stop` | Agent finishes | — |
| `SubagentStart` | Subagent begins | Agent type name |
| `SubagentStop` | Subagent completes | — |

### Example: Project-level hooks

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Edit|Write",
      "hooks": [{ "type": "command", "command": "./scripts/run-linter.sh" }]
    }],
    "SubagentStart": [{
      "matcher": "db-agent",
      "hooks": [{ "type": "command", "command": "./scripts/setup-db-connection.sh" }]
    }]
  }
}
```

---

## Tool Control

### Allow / Deny

```bash
claude --allowedTools "Bash(git:*) Read"     # Auto-approve these
claude --disallowedTools "Write Edit"         # Block these entirely
```

### Restrict Available Tools

```bash
claude --tools "Bash,Edit,Read"   # Only these tools
claude --tools ""                  # Disable all tools
claude --tools "default"           # Use all tools
```

---

## Permission Modes

```bash
claude --permission-mode default            # Normal prompting
claude --permission-mode plan               # Read-only analysis
claude --permission-mode acceptEdits        # Auto-accept file edits
claude --permission-mode dontAsk            # Auto-deny prompts (allowed tools still work)
claude --permission-mode bypassPermissions  # Skip all checks
```

### Skip Permissions (sandboxed environments only)

```bash
claude --allow-dangerously-skip-permissions
claude --dangerously-skip-permissions
```

---

## System Prompts

| Flag | Behavior | Modes |
|------|----------|-------|
| `--system-prompt` | **Replace** entire prompt | Interactive + Print |
| `--system-prompt-file` | **Replace** with file contents | Print only |
| `--append-system-prompt` | **Append** to default | Interactive + Print |
| `--append-system-prompt-file` | **Append** file contents | Print only |

```bash
# Replace entirely
claude --system-prompt "You are a Python expert. Be concise."

# Add constraints while keeping defaults (recommended)
claude --append-system-prompt "Always use TypeScript and include JSDoc"
```

---

## Output & Structured Data

```bash
# Text output (default)
claude -p "prompt"

# JSON output
claude -p "prompt" --output-format json

# Streaming JSON (realtime)
claude -p "prompt" --output-format stream-json

# Structured output with JSON Schema validation
claude -p "prompt" --json-schema '{"type":"object","properties":{...}}'

# Include partial streaming events
claude -p "prompt" --output-format stream-json --include-partial-messages
```

---

## Budget & Limits

```bash
claude -p "prompt" --max-budget-usd 5.00   # Max spend (print mode)
claude -p "prompt" --max-turns 10           # Max agentic turns (print mode)
```

---

## Directory Access

```bash
claude --add-dir /path/to/other/project
claude --add-dir ~/docs ~/data ../shared-lib
```

---

## MCP (Model Context Protocol)

```bash
claude --mcp-config mcp-servers.json
claude --mcp-config '{"server": {...}}'
claude --strict-mcp-config --mcp-config my-config.json   # Only use specified servers
claude mcp                                                # Manage MCP servers
```

---

## Plugins

```bash
claude --plugin-dir /path/to/plugins    # Load plugins for session
claude plugin                            # Manage plugins
```

---

## IDE & Browser Integration

```bash
claude --ide          # Auto-connect to IDE on startup
claude --chrome       # Enable Chrome browser integration
claude --no-chrome    # Disable Chrome integration
```

---

## Remote & Web Sessions

```bash
claude --remote "Fix the login bug"    # Create web session on claude.ai
claude --teleport                       # Resume web session locally
```

---

## Initialization & Maintenance

```bash
claude --init          # Run init hooks, then start interactive mode
claude --init-only     # Run init hooks and exit
claude --maintenance   # Run maintenance hooks and exit
```

---

## Debugging

```bash
claude --debug                    # Enable debug mode
claude --debug "api,hooks"        # Filter by category
claude --debug "!statsig,!file"   # Exclude categories
claude --verbose                  # Verbose output
```

---

## Commands

| Command | Description |
|---------|-------------|
| `claude` | Start interactive session |
| `claude "prompt"` | Start with initial prompt |
| `claude -p "prompt"` | Non-interactive, print & exit |
| `claude -c` | Continue last conversation |
| `claude -r` | Resume session picker |
| `claude -r "name"` | Resume by session name |
| `claude --model opus` | Use specific model |
| `claude -v` | Show version |
| `claude --help` | Show all options |
| `claude doctor` | Health check |
| `claude update` | Update CLI |
| `claude install stable` | Install stable version |
| `claude mcp` | Manage MCP servers |
| `claude plugin` | Manage plugins |
| `/agents` | Manage subagents (in REPL) |
| `/skills` | Manage skills (in REPL) |
| `/statusline` | Configure status line (in REPL) |

---

## CI/CD & Automation Examples

### Code Review Pipeline

```bash
git diff HEAD~1 | claude -p \
  "review these changes for bugs and suggest improvements" \
  --output-format json
```

### Automated Refactoring with Budget

```bash
claude -p "refactor all Python files to use type hints" \
  --permission-mode acceptEdits \
  --max-budget-usd 10.00 \
  --max-turns 50
```

### Structured Output

```bash
claude -p "list all API endpoints" \
  --json-schema '{"type":"array","items":{"type":"object","properties":{"method":{"type":"string"},"path":{"type":"string"},"description":{"type":"string"}}}}' \
  --output-format json
```

### PR-Linked Sessions

```bash
# Sessions auto-link when created via gh pr create
# Resume later:
claude --from-pr 123
```

### Custom Subagent for CI

```bash
claude -p "run tests and fix failures" \
  --agents '{"test-fixer": {"description": "Runs tests and fixes failures", "prompt": "Run the test suite. For each failure, analyze the error and fix the code.", "model": "sonnet"}}' \
  --permission-mode acceptEdits \
  --max-budget-usd 5.00
```

### Headless with No Persistence

```bash
claude -p "analyze codebase" \
  --no-session-persistence \
  --output-format json
```

---

## Parallel Development with Multiple Agents

> **Note:** The old `DISTRIBUTED_AGENTS_GUIDE.md` pattern of manually spawning `claude -p` processes, PID tracking, status files, and bash spawner scripts is **superseded** by the native subagent and agent team systems above. Use those instead.

### When to use what

| Approach | Use when |
|----------|----------|
| **Subagents** (built-in) | Parallel tasks within a single session — Claude auto-delegates |
| **Agent teams** (`--teammate-mode`) | Sustained parallel work with inter-agent communication |
| **`claude -p` in background** | CI/CD pipelines, cron jobs, or fully headless automation |

### Directory Ownership Convention

When running multiple agents on the same codebase, prevent conflicts with clear ownership:

```markdown
# In each subagent's .claude/agents/<name>.md:
---
name: backend-agent
description: Handles API routes and database logic
tools: Edit, Write, Bash, Read, Grep
model: sonnet
---

## YOUR OWNERSHIP
You exclusively own and can edit:
- `apps/web/app/api/`
- `packages/db/`

## DO NOT TOUCH
- `apps/web/components/` (owned by frontend-agent)
- `packages/engine/` (owned by engine-agent)
```

### Git Rules for Parallel Agents

Include in every agent's prompt:
- Pull before editing: `git pull`
- Stage only YOUR files: `git add your/owned/dirs/`
- Commit with prefix: `git commit -m "agent/<name>: description"`
- Push immediately: `git push`
