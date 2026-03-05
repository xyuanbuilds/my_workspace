---
name: agent-history
description: Discover and export AI coding assistant conversation history (Claude Code & GitHub Copilot) to readable Markdown files
context: fork
allowed-tools: Bash(node *)
---

# agent-history

CLI tool to discover and export AI coding conversation history from Claude Code and GitHub Copilot.

## Execution Pattern

```bash
cd $SKILL_DIR/scripts
node cli.js <command> [options]
```

## Commands

### List Sessions

Show all discovered sessions in a table:

```bash
node cli.js list
node cli.js list --source claude      # Only Claude Code sessions
node cli.js list --source copilot     # Only Copilot sessions
node cli.js list --project my-skill   # Filter by project name
```

### Export Sessions

Export one or more sessions to Markdown files:

```bash
# Export a specific session by ID (or ID prefix)
node cli.js export <sessionId>

# Export all sessions
node cli.js export --all

# Export with filters
node cli.js export --all --source claude
node cli.js export --all --project my-skill

# Custom output directory
node cli.js export --all --output ./exported
```

## Output Format

Each exported session produces a Markdown file named `ClaudeCode_<8chars>.md` or `Copilot_<8chars>.md` containing:

- Session metadata (source, project, branch, model, date)
- User and Assistant messages in chronological order
- Tool calls, thinking blocks, and system messages are filtered out

## Data Sources

- **Claude Code**: `~/.claude/projects/<encoded-path>/<session>.jsonl`
- **GitHub Copilot**: `~/Library/Application Support/Code/User/workspaceStorage/<hash>/chatSessions/<session>.jsonl`
