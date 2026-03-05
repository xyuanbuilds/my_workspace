# conversation-export Specification

## Purpose
TBD - created by archiving change agent-history-cli. Update Purpose after archive.
## Requirements
### Requirement: Extract Claude Code conversation text

The system SHALL parse Claude Code JSONL files and extract only the textual user↔assistant conversation content. Tool calls, tool results, thinking blocks, and file-history-snapshot entries SHALL be skipped.

#### Scenario: Extract user messages

- **WHEN** a JSONL line has `type == "user"` and `isMeta` is not `true`
- **THEN** the system SHALL extract `message.content` as user text (string directly, or concatenation of `type=="text"` blocks if content is an array)

#### Scenario: Extract assistant text responses

- **WHEN** a JSONL line has `type == "assistant"`
- **THEN** the system SHALL extract only `type=="text"` blocks from `message.content` array, concatenating them in order

#### Scenario: Skip tool-related messages

- **WHEN** a JSONL line has `type == "tool_result"` or `type == "file-history-snapshot"`
- **THEN** the system SHALL skip it entirely

#### Scenario: Skip meta user messages

- **WHEN** a JSONL line has `type == "user"` and `isMeta == true`
- **THEN** the system SHALL skip it

#### Scenario: Skip tool_use and thinking blocks in assistant content

- **WHEN** an assistant message content array contains items with `type == "tool_use"` or `type == "thinking"`
- **THEN** those items SHALL be skipped, only `type == "text"` items are kept

### Requirement: Extract Copilot conversation text

The system SHALL parse Copilot JSONL files using the incremental patch model and extract only the textual user↔assistant conversation content. Tool invocations, thinking blocks, progress tasks, text edit groups, inline references, undo stops, and confirmations SHALL be skipped.

#### Scenario: Extract Copilot session metadata

- **WHEN** a JSONL line has `kind == 0`
- **THEN** the system SHALL extract creationDate from the `v` object as session start time

#### Scenario: Extract Copilot custom title

- **WHEN** a JSONL line has `kind == 1` and `k == ["customTitle"]`
- **THEN** the system SHALL use `v` as the session title

#### Scenario: Extract Copilot model identifier

- **WHEN** a JSONL line has `kind == 1` and `k == ["inputState", "selectedModel"]`
- **THEN** the system SHALL extract the `identifier` field from the JSON value as the model name (e.g., "copilot/claude-opus-4.6")

#### Scenario: Extract Copilot user messages from new requests

- **WHEN** a JSONL line has `kind == 2` and `k == ["requests"]`
- **THEN** for each request in `v[]`, the system SHALL extract `message.text` as user text and any initial `response[]` items as assistant content

#### Scenario: Accumulate Copilot assistant response items

- **WHEN** a JSONL line has `kind == 2` and `k == ["requests", N, "response"]` (where N is a request index)
- **THEN** the system SHALL append the response items in `v[]` to the corresponding request's response parts

#### Scenario: Extract Copilot assistant text from response items

- **WHEN** a response item has a `value` field (string) and a `supportThemeIcons` field (markdown content object)
- **THEN** the system SHALL extract the `value` string as assistant text

#### Scenario: Skip Copilot non-text response items

- **WHEN** a response item has `kind == "thinking"`, `kind == "toolInvocationSerialized"`, `kind == "progressTaskSerialized"`, `kind == "textEditGroup"`, `kind == "mcpServersStarting"`, `kind == "inlineReference"`, `kind == "undoStop"`, or `kind == "confirmation"`
- **THEN** the system SHALL skip it

#### Scenario: Deduplicate progressive markdown updates

- **WHEN** consecutive Copilot response items contain overlapping markdown content (where a later item is a superset of an earlier one)
- **THEN** the system SHALL keep only the longest version and discard shorter prefixes

#### Scenario: Ignore non-content kind=1 updates

- **WHEN** a JSONL line has `kind == 1` and `k` is NOT `["customTitle"]` or `["inputState", "selectedModel"]`
- **THEN** the system SHALL ignore it (e.g., inputState, modelState, result timings, responderUsername)

### Requirement: Generate Markdown output

The system SHALL generate a Markdown file for each exported session with a header section containing metadata and a body with alternating User/Assistant sections.

#### Scenario: Markdown header format

- **WHEN** generating a Markdown file
- **THEN** the file SHALL start with a level-1 heading `# Session: <short-id>` followed by metadata fields (Source, Project, Branch, Model, Date) as a bullet list

#### Scenario: Markdown message format

- **WHEN** rendering a message
- **THEN** the system SHALL output a level-2 heading (`## User` or `## Assistant`) with an HTML comment containing the timestamp, followed by the full message content, separated by `---` dividers

#### Scenario: Output file naming

- **WHEN** writing an exported session to disk
- **THEN** the file SHALL be placed under a source subdirectory (`ClaudeCode/` or `Copilot/`) and named `YYYY-MM-DD_HH-mm-ss_<sessionId-first-8-chars>.md` using the session's creation timestamp

### Requirement: Graceful error handling on parse failures

The system SHALL handle malformed JSONL lines without crashing. A warning SHALL be printed to stderr and the line SHALL be skipped.

#### Scenario: Malformed JSON line

- **WHEN** a line in the JSONL file is not valid JSON
- **THEN** the system SHALL print a warning to stderr with the line number and continue processing

