## Context

Claude Code 将对话存储在 `~/.claude/projects/<encoded-path>/<sessionId>.jsonl`，每行一个 JSON 对象，通过 `type` 字段区分消息类型（user / assistant / tool_result / file-history-snapshot）。

GitHub Copilot (VS Code) 将对话存储在 `~/Library/Application Support/Code/User/workspaceStorage/<hash>/chatSessions/<sessionId>.jsonl`，使用增量补丁模型：`kind` 字段标识操作类型（0=初始 metadata, 1=key-value 更新, 2=数组追加），`k` 字段为 key path 数组标识目标属性。每个 workspace hash 目录下有 `workspace.json` 记录实际项目路径。

现有 `dev/agent-history/` 目录已有脚手架代码（空实现），在此基础上构建。

## Goals / Non-Goals

**Goals:**

- 提供可独立运行的 CLI 工具，扫描和导出本地 AI 对话记录
- 输出干净的 Markdown 文件，仅包含 user↔assistant 文本问答
- 支持按来源（claude / copilot）和项目路径过滤
- 解析 workspace.json 获取 Copilot 的真实项目名

**Non-Goals:**

- 不做对话内容的摘要或语义分析
- 不将对话内容加载到 AI 上下文中
- 不支持 macOS 以外的平台
- 不支持 Cursor、Windsurf 等其他工具（未来可扩展）
- 不处理 thinking blocks 和 tool calls（直接跳过）

## Decisions

### 1. 项目结构：保持 `dev/agent-history/` 目录

已有脚手架代码，继续使用。结构：

```
dev/agent-history/
├── src/
│   ├── cli.ts              # CLI 入口，参数解析
│   ├── index.ts            # 主逻辑编排
│   ├── sources/
│   │   ├── claude-code.ts  # Claude Code JSONL 解析器
│   │   └── copilot.ts      # Copilot JSONL 解析器
│   ├── formatter.ts        # Markdown 生成器
│   └── types.ts            # 共享类型定义
├── package.json
├── tsconfig.json
└── SKILL.md
```

**Why**: 按数据源分离解析逻辑，新增来源只需加一个 source 文件。formatter 独立以便未来支持其他输出格式。

### 2. 参数解析：使用 `commander`

Node.js 生态标准 CLI 框架，零配置生成 help 信息。

**Alternatives considered**: `yargs`（更重）、手写 `process.argv`（维护成本高）。

### 3. JSONL 解析：逐行流式读取

使用 `readline` 模块逐行处理 JSONL，避免大文件（5MB+）一次性加载到内存。

**Why**: 实际发现 Copilot 单个 session 文件可达 5MB+。

### 4. 统一消息模型

两个来源的 JSONL 格式完全不同，先解析为统一的内部模型再生成 Markdown：

```typescript
interface Session {
  id: string;
  source: "claude-code" | "copilot";
  project: string; // 解析后的项目路径
  branch?: string; // git branch (Claude Code only)
  model?: string; // 使用的模型
  startedAt: Date;
  messages: Message[];
}

interface Message {
  role: "user" | "assistant";
  content: string; // 纯文本内容
  timestamp?: Date;
}
```

**Why**: 解耦解析与渲染，新增来源不影响 formatter。

### 5. Claude Code 消息提取规则

```
type == "user"       → message.content (string 或 ContentBlock[] 中 type=="text")
type == "assistant"  → message.content 中 type=="text" 的块拼接
其他 type            → 跳过
```

特殊处理：

- `isMeta: true` 的 user 消息跳过（系统级消息）
- `content` 为 array 时只取 `type=="text"` 的项

### 6. Copilot 消息提取规则

Copilot JSONL 使用**增量补丁模型**，通过 `kind` 和 `k`（key path）字段标识数据类型：

```
kind == 0  → 初始 metadata（creationDate, responderUsername, 空 requests[] 等）
kind == 1  → key-value 更新，k 为 key path 数组:
             k=["customTitle"]              → 自定义会话标题
             k=["responderUsername"]         → 系统名称（如 "GitHub Copilot"）
             k=["inputState","selectedModel"] → 模型标识（JSON，含 identifier 字段）
             k=["requests",N,"modelState"]  → 请求状态变更
             k=["requests",N,"result"]      → 计时/统计元数据
             k=["inputState","inputText"]   → 用户输入草稿（跳过）
             k=["inputState","attachments"] → 附件引用（跳过）
kind == 2  → 数组追加操作，k 为 key path:
             k=["requests"]                 → 追加新请求对象（含 message.text + 初始 response[]）
             k=["requests",N,"response"]    → 向第 N 个请求追加响应项
```

**响应项提取规则：**

- 有 `value`（string）+ `supportThemeIcons` 字段的项 → assistant 文本（Markdown）
- `kind == "thinking"` / `"toolInvocationSerialized"` / `"progressTaskSerialized"` / `"textEditGroup"` / `"mcpServersStarting"` / `"inlineReference"` / `"undoStop"` / `"confirmation"` → 跳过

**去重策略：** Copilot 使用渐进式更新，后续 Markdown 项可能是前序内容的超集。解析器保留最长版本，避免重复输出。

### 7. 输出文件命名

```
<outputDir>/ClaudeCode/YYYY-MM-DD_HH-mm-ss_<sessionId-8chars>.md
<outputDir>/Copilot/YYYY-MM-DD_HH-mm-ss_<sessionId-8chars>.md
```

按来源分子目录，文件名使用会话创建时间戳 + 短 ID，便于按时间排序。文件内保留完整 ID。

### 8. Skill 文件：仅描述 CLI 用法

Skill 不包含业务逻辑，只作为 Claude Code Skill 的使用说明，指导如何调用 CLI。

## Risks / Trade-offs

- **[格式变更]** Claude Code 和 Copilot 的 JSONL 格式未有公开规范，版本升级可能破坏解析 → 在解析时对未知字段做容错处理（warn + skip），不 throw
- **[大文件]** 单个 session 可能非常大，导出的 Markdown 也会很大 → 流式读取 + 流式写入，不在内存中持有完整 session
- **[Workspace 映射]** Copilot 的 workspaceStorage hash 与项目的映射依赖 `workspace.json` → 如果文件不存在则 fallback 到 hash 值
