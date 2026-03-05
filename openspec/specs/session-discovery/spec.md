# session-discovery Specification

## Purpose
TBD - created by archiving change agent-history-cli. Update Purpose after archive.
## Requirements
### Requirement: Discover Claude Code sessions
The system SHALL scan `~/.claude/projects/` to find all session JSONL files. Each `<encoded-path>/` subdirectory represents a project, and each `*.jsonl` file within it represents a session. The system SHALL extract session metadata including sessionId, project path, git branch, timestamp, and Claude Code version from the JSONL content.

#### Scenario: Scan Claude Code sessions
- **WHEN** the system scans `~/.claude/projects/`
- **THEN** it SHALL return a list of sessions with id, project path (decoded from directory name), and file path for each `*.jsonl` file found

#### Scenario: Extract Claude Code session metadata
- **WHEN** parsing a Claude Code JSONL file
- **THEN** the system SHALL extract sessionId, project path, gitBranch, version, and earliest timestamp from the first user-type message

#### Scenario: Claude Code directory does not exist
- **WHEN** `~/.claude/projects/` does not exist
- **THEN** the system SHALL return an empty list for Claude Code sessions without error

### Requirement: Discover Copilot sessions
The system SHALL scan `~/Library/Application Support/Code/User/workspaceStorage/*/chatSessions/` to find all Copilot session JSONL files. The system SHALL resolve the workspace hash to a real project path by reading the `workspace.json` file in the parent directory.

#### Scenario: Scan Copilot sessions
- **WHEN** the system scans VS Code workspaceStorage
- **THEN** it SHALL return a list of sessions with id, resolved project path, and file path for each `*.jsonl` file found under `chatSessions/`

#### Scenario: Resolve workspace to project path
- **WHEN** a `workspace.json` exists in the workspace hash directory
- **THEN** the system SHALL parse the `folder` field (URI format) to extract the real project path

#### Scenario: workspace.json missing or unreadable
- **WHEN** `workspace.json` does not exist or cannot be parsed
- **THEN** the system SHALL fallback to using the workspace hash as the project identifier

#### Scenario: Copilot storage directory does not exist
- **WHEN** VS Code workspaceStorage directory does not exist
- **THEN** the system SHALL return an empty list for Copilot sessions without error

### Requirement: Filter sessions by source
The system SHALL support filtering discovered sessions by source type: `claude` or `copilot`.

#### Scenario: Filter by Claude Code source
- **WHEN** the user specifies `--source claude`
- **THEN** only sessions from `~/.claude/projects/` SHALL be returned

#### Scenario: Filter by Copilot source
- **WHEN** the user specifies `--source copilot`
- **THEN** only sessions from VS Code workspaceStorage SHALL be returned

### Requirement: Filter sessions by project
The system SHALL support filtering discovered sessions by project path substring match.

#### Scenario: Filter by project name
- **WHEN** the user specifies `--project my-skill`
- **THEN** only sessions whose resolved project path contains `my-skill` SHALL be returned

