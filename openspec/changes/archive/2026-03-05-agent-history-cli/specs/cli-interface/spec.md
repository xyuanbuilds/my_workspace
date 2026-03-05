## ADDED Requirements

### Requirement: list command
The system SHALL provide a `list` subcommand that displays all discovered sessions in a tabular format, showing session ID (short), source, project name, date, and title (if available).

#### Scenario: List all sessions
- **WHEN** the user runs `agent-history list`
- **THEN** the system SHALL display all sessions from both Claude Code and Copilot, sorted by date descending

#### Scenario: List with source filter
- **WHEN** the user runs `agent-history list --source claude`
- **THEN** only Claude Code sessions SHALL be listed

#### Scenario: List with project filter
- **WHEN** the user runs `agent-history list --project my-skill`
- **THEN** only sessions whose project path contains `my-skill` SHALL be listed

#### Scenario: No sessions found
- **WHEN** no sessions match the filters
- **THEN** the system SHALL print a message indicating no sessions were found

### Requirement: export command
The system SHALL provide an `export` subcommand that exports one or more sessions to Markdown files.

#### Scenario: Export single session by ID
- **WHEN** the user runs `agent-history export <sessionId>`
- **THEN** the system SHALL export that session to a Markdown file in the output directory

#### Scenario: Export all sessions
- **WHEN** the user runs `agent-history export --all`
- **THEN** the system SHALL export all discovered sessions to the output directory

#### Scenario: Export with source filter
- **WHEN** the user runs `agent-history export --all --source copilot`
- **THEN** only Copilot sessions SHALL be exported

#### Scenario: Export with project filter
- **WHEN** the user runs `agent-history export --all --project my-skill`
- **THEN** only sessions matching the project filter SHALL be exported

#### Scenario: Custom output directory
- **WHEN** the user specifies `--output <dir>`
- **THEN** exported Markdown files SHALL be written to that directory, creating it if it does not exist

#### Scenario: Default output directory
- **WHEN** the user does not specify `--output`
- **THEN** exported files SHALL be written to the current working directory

#### Scenario: Export completion message
- **WHEN** export finishes
- **THEN** the system SHALL print the number of files exported and the output directory path

### Requirement: Global help
The system SHALL display usage information when invoked with `--help` or with no arguments.

#### Scenario: Display help
- **WHEN** the user runs `agent-history --help` or `agent-history`
- **THEN** the system SHALL display available commands and global options
