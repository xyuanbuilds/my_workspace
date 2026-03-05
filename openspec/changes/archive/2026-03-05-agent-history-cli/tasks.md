## 1. Project Setup

- [x] 1.1 Update `dev/agent-history/src/package.json` with dependencies (`commander`) and build scripts
- [x] 1.2 Update `dev/agent-history/tsconfig.json` for ESM output
- [x] 1.3 Create `src/types.ts` with shared types (`Session`, `Message`, `Source`)

## 2. Session Discovery

- [x] 2.1 Implement `src/sources/claude-code.ts` — scan `~/.claude/projects/` for JSONL files, decode project path from directory name, extract session metadata
- [x] 2.2 Implement `src/sources/copilot.ts` — scan VS Code `workspaceStorage/*/chatSessions/` for JSONL files, resolve `workspace.json` to project path
- [x] 2.3 Implement unified discovery function in `src/index.ts` — merge results from both sources, support `--source` and `--project` filters

## 3. Conversation Extraction

- [x] 3.1 Implement Claude Code JSONL parser — extract user (skip isMeta) and assistant text blocks, skip tool_use/tool_result/thinking/file-history-snapshot
- [x] 3.2 Implement Copilot JSONL parser — extract kind=0 metadata, kind=1 title, kind=2 message.text and markdown response values, skip tool/thinking/progress items
- [x] 3.3 Add error handling for malformed JSONL lines (warn to stderr, skip line)

## 4. Markdown Formatter

- [x] 4.1 Implement `src/formatter.ts` — generate Markdown from `Session` object with header metadata and user/assistant sections separated by `---`
- [x] 4.2 Implement output file naming: `ClaudeCode_<8chars>.md` / `Copilot_<8chars>.md`
- [x] 4.3 Implement file write with output directory creation (`--output` or cwd)

## 5. CLI Interface

- [x] 5.1 Implement `list` subcommand — tabular output of sessions (id, source, project, date, title)
- [x] 5.2 Implement `export` subcommand — single session by ID, `--all`, `--source`, `--project`, `--output` options
- [x] 5.3 Update `src/cli.ts` entry point with commander program setup and subcommands
- [x] 5.4 Add completion message showing exported file count and output directory

## 6. Skill & Integration

- [x] 6.1 Create Skill file describing CLI usage (how to invoke `list` and `export` commands)
- [x] 6.2 Manual smoke test: `list` shows sessions from both sources, `export` produces readable Markdown files
