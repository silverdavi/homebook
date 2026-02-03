# Claude Code CLI Reference

> Version: 2.1.6  
> Tested: January 2026

Claude Code is Anthropic's CLI tool for interacting with Claude directly from your terminal. It provides an interactive REPL for chatting with Claude and having it work on your codebase.

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
```

---

## Basic Usage

### Interactive Mode (REPL)

```bash
claude
```

Opens an interactive session where you can chat with Claude and have it work on your codebase.

### Start with a Prompt

```bash
claude "explain this project"
claude "find all TODO comments in this repo"
```

### Non-Interactive Mode (Print & Exit)

```bash
claude -p "your prompt"
claude --print "summarize the main.py file"
```

Useful for scripts and pipes. Prints the response and exits.

### Pipe Input

```bash
cat file.py | claude "review this code"
git diff | claude "explain these changes"
echo "Hello" | claude "translate to French"
```

---

## Session Management

### Continue Last Conversation

```bash
claude --continue
claude -c
```

Resumes the most recent conversation in the current directory.

### Resume Specific Session

```bash
claude --resume              # Opens interactive session picker
claude --resume <session-id> # Resume by specific ID
claude -r <session-id>
```

### Fork a Session

```bash
claude --resume <session-id> --fork-session
```

Creates a new session ID instead of reusing the original.

### Custom Session ID

```bash
claude --session-id <uuid>
```

Use a specific UUID for the conversation.

---

## Model Selection

```bash
# Use model aliases
claude --model sonnet
claude --model opus

# Use full model name
claude --model claude-sonnet-4-5-20250929

# With fallback for overloaded models (print mode only)
claude -p "prompt" --fallback-model sonnet
```

---

## Tool Control

### Allow Specific Tools

```bash
claude --allowedTools "Bash Edit Read"
claude --allowed-tools "Bash(git:*) Edit"
```

### Deny Specific Tools

```bash
claude --disallowedTools "Bash"
claude --disallowed-tools "Edit Write"
```

### Specify Available Tools

```bash
claude --tools "Bash,Edit,Read"   # Only these tools
claude --tools ""                  # Disable all tools
claude --tools "default"           # Use all tools
```

---

## System Prompts

### Override System Prompt

```bash
claude --system-prompt "You are a Python expert. Be concise."
```

### Append to Default System Prompt

```bash
claude --append-system-prompt "Always include code examples."
```

---

## Output Formats

```bash
# Default text output
claude -p "prompt"

# JSON output (single result)
claude -p "prompt" --output-format json

# Streaming JSON (realtime)
claude -p "prompt" --output-format stream-json
```

### Input Formats

```bash
# Default text input
claude -p "prompt" --input-format text

# Streaming JSON input
claude -p "prompt" --input-format stream-json
```

---

## Permission Modes

```bash
claude --permission-mode default         # Normal permissions
claude --permission-mode plan             # Planning mode
claude --permission-mode acceptEdits      # Auto-accept edits
claude --permission-mode dontAsk          # Don't ask for permissions
claude --permission-mode delegate         # Delegate decisions
claude --permission-mode bypassPermissions # Bypass all checks
```

### Skip Permissions (Sandboxes Only)

```bash
# Enable as option
claude --allow-dangerously-skip-permissions

# Bypass all permission checks
claude --dangerously-skip-permissions
```

⚠️ **Warning:** Only use these in sandboxed environments with no internet access.

---

## Budget Control

```bash
claude -p "prompt" --max-budget-usd 5.00
```

Sets maximum dollar amount to spend on API calls (print mode only).

---

## Directory Access

```bash
claude --add-dir /path/to/other/project
claude --add-dir ~/docs ~/data
```

Grant tool access to additional directories beyond the current workspace.

---

## MCP (Model Context Protocol)

### Load MCP Config

```bash
claude --mcp-config mcp-servers.json
claude --mcp-config '{"server": {...}}'
```

### Strict MCP Mode

```bash
claude --strict-mcp-config --mcp-config my-config.json
```

Only uses MCP servers from the specified config, ignoring others.

---

## Custom Agents

```bash
claude --agent reviewer

# Define custom agents inline
claude --agents '{"reviewer": {"description": "Reviews code", "prompt": "You are a code reviewer"}}'
```

---

## Plugins

```bash
# Load plugins from directory
claude --plugin-dir /path/to/plugins
```

---

## IDE Integration

```bash
claude --ide      # Auto-connect to IDE on startup
claude --chrome   # Enable Chrome integration
claude --no-chrome # Disable Chrome integration
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

## CI/CD & Automation

### Headless Mode

```bash
claude -p "analyze this codebase" --output-format json
```

### With Budget Limit

```bash
claude -p "refactor main.py" --max-budget-usd 2.00 --output-format json
```

### Disable Session Persistence

```bash
claude -p "prompt" --no-session-persistence
```

Sessions won't be saved to disk (print mode only).

### Stream with Partial Messages

```bash
claude -p "prompt" --output-format stream-json --include-partial-messages
```

---

## Commands

### Health Check

```bash
claude doctor
```

Check the health of your Claude Code auto-updater.

### Update

```bash
claude update
```

Check for updates and install if available.

### Install Specific Version

```bash
claude install stable    # Stable version
claude install latest    # Latest version
claude install 2.1.0     # Specific version
```

### Manage MCP Servers

```bash
claude mcp
```

### Manage Plugins

```bash
claude plugin
```

### Setup Auth Token

```bash
claude setup-token
```

Set up a long-lived authentication token (requires Claude subscription).

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `claude` | Start interactive session |
| `claude "prompt"` | Start with initial prompt |
| `claude -p "prompt"` | Non-interactive, print & exit |
| `claude -c` | Continue last conversation |
| `claude -r` | Resume session picker |
| `claude --model opus` | Use specific model |
| `claude -v` | Show version |
| `claude --help` | Show all options |
| `claude doctor` | Health check |
| `claude update` | Update CLI |

---

## Examples

### Code Review Pipeline

```bash
git diff HEAD~1 | claude -p "review these changes for bugs and suggest improvements" --output-format json
```

### Project Summary

```bash
claude "give me a high-level overview of this project's architecture"
```

### Automated Refactoring

```bash
claude -p "refactor all Python files to use type hints" \
  --permission-mode acceptEdits \
  --max-budget-usd 10.00
```

### Custom Code Reviewer Agent

```bash
claude --agents '{"reviewer": {"description": "Security-focused reviewer", "prompt": "You are a security expert. Review code for vulnerabilities."}}' \
  --agent reviewer \
  "review src/"
```
