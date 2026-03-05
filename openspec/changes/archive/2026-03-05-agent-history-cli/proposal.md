## Why

AI 编码助手（Claude Code、GitHub Copilot）的对话记录散落在各自的本地存储中，格式各异（JSONL），且包含大量工具调用噪声，无法直接阅读。需要一个 CLI 工具从这些源文件中提取纯粹的问答对话，生成可阅读的 Markdown 文件，方便回顾和检索历史交互内容。

## What Changes

- 新增 `agent-history` CLI 工具，支持：
  - `list` — 列出本地可用的对话 sessions，按来源（Claude Code / Copilot）和项目分组
  - `export` — 将指定 session 或批量 sessions 导出为 Markdown 文件
- 仅提取 user↔assistant 的文本问答内容，跳过 tool_use、tool_result、thinking、file-history-snapshot 等非对话内容
- 解析 Copilot 的 `workspace.json` 映射项目名称
- 输出文件命名规则：`ClaudeCode_<sessionId>.md`、`Copilot_<sessionId>.md`
- 配套 Skill 文件描述 CLI 用法

## Capabilities

### New Capabilities
- `session-discovery`: 扫描本地文件系统，发现 Claude Code 和 Copilot 的对话 session 文件，解析 metadata（项目、日期、模型、分支等）
- `conversation-export`: 从 JSONL 源文件中提取纯问答内容，按时间顺序生成结构化 Markdown 文件
- `cli-interface`: 提供 list / export 命令行接口，支持按来源和项目过滤

### Modified Capabilities

（无需修改现有 capabilities）

## Impact

- 新增 `dev/agent-history/` 下的 CLI 源码（Node.js / TypeScript）
- 读取 `~/.claude/projects/` 和 `~/Library/Application Support/Code/User/workspaceStorage/` 下的只读文件
- 新增 `.claude/skills/` 下的 Skill 描述文件
- 无破坏性变更，不影响现有代码
