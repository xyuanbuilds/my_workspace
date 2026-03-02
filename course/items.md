# AI 工作流术语表

## 核心概念

### Skills（技能）

- **定义**：工作流的快捷方式，类似于规则但限定在特定范围
- **位置**：`~/.claude/skills/`
- **用途**：执行特定工作流，如 `/refactor-clean`、`/tdd`、`/test-coverage`
- **特性**：可包含 codemaps 帮助快速导航代码库

### Commands（命令）

- **定义**：通过斜杠命令执行的快速可执行提示
- **位置**：`~/.claude/commands/`
- **与 Skills 的区别**：存储方式不同，命令更轻量

### Hooks（钩子）

- **定义**：基于事件触发的自动化，限定在工具调用和生命周期事件
- **类型**：
  - **PreToolUse**：工具执行前触发（验证、提醒）
  - **PostToolUse**：工具执行后触发（格式化、反馈循环）
  - **UserPromptSubmit**：发送消息时触发
  - **Stop**：Claude 完成响应时触发
  - **PreCompact**：上下文压缩前触发
  - **Notification**：权限请求时触发
- **创建方式**：使用 `/hookify` 插件对话式创建

### Subagents（子代理）

- **定义**：主协调器（主 Claude）可以委托的有限作用域进程
- **运行模式**：后台或前台运行
- **优势**：释放主代理的上下文，可沙箱化并配置特定工具权限
- **配置位置**：`~/.claude/agents/`

### Rules（规则）

- **定义**：Claude 应始终遵循的最佳实践
- **位置**：`~/.claude/rules/` 或单一 `CLAUDE.md` 文件
- **常见规则类型**：
  - `security.md` - 安全检查
  - `coding-style.md` - 代码风格
  - `testing.md` - 测试工作流
  - `git-workflow.md` - Git 提交规范
  - `agents.md` - 子代理委托规则
  - `performance.md` - 模型选择

### MCPs (Model Context Protocol)

- **定义**：将 Claude 连接到外部服务的提示驱动包装器
- **用途**：直接访问数据库、部署平台等外部服务
- **示例**：Supabase MCP、GitHub MCP、Vercel MCP
- **关键警告**：严重影响上下文窗口大小

### Plugins（插件）

- **定义**：打包工具以便轻松安装，避免繁琐的手动设置
- **组成**：可以是 skill + MCP 组合，或 hooks/tools 捆绑
- **特殊类型**：LSP 插件（Language Server Protocol）提供实时类型检查

## 性能管理

### Context Window（上下文窗口）

- **定义**：Claude 可用的总令牌空间
- **大小**：约 200k 令牌
- **关键指标**：启用过多 MCP/插件可能将可用空间从 200k 降至 70k
- **最佳实践**：配置 20-30 个 MCP，但只启用 < 10 个 / < 80 个工具

### Compact / Compaction（压缩）

- **定义**：上下文窗口满时自动或手动压缩历史对话
- **命令**：`/compact` - 手动触发压缩
- **钩子**：PreCompact - 在压缩前触发

## 辅助工具

### Codemaps（代码地图）

- **定义**：帮助 Claude 快速导航代码库的结构化信息
- **优势**：不消耗大量上下文进行探索

### LSP (Language Server Protocol)

- **定义**：为 Claude 提供实时类型检查、跳转定义、智能补全
- **用途**：在非 IDE 环境中频繁运行 Claude Code 时特别有用
- **示例插件**：typescript-lsp、pyright-lsp

### Fork（分叉）

- **定义**：分叉对话以并行执行不重叠的任务
- **命令**：`/fork`
- **优势**：避免排队等待多个任务

### Git Worktrees（Git 工作树）

- **定义**：独立的 Git 检出，允许多个 Claude 实例无冲突工作
- **用法**：`git worktree add ../feature-branch feature-branch`
- **优势**：处理重叠的并行任务

### Checkpoints（检查点）

- **定义**：文件级撤销点
- **命令**：`/checkpoints`
- **优势**：精细的版本控制

### Rewind（回退）

- **定义**：返回到对话的先前状态
- **命令**：`/rewind`

### Sandbox / Sandboxing（沙箱）

- **定义**：在受限环境中运行 Claude，不影响实际系统
- **用途**：执行风险操作时使用

### Statusline（状态栏）

- **定义**：自定义状态栏显示信息
- **命令**：`/statusline`
- **常见显示**：分支、上下文百分比、待办事项、当前模型、时间

## 外部工具集成

### tmux

- **定义**：终端复用器，用于持久化会话
- **用途**：流式查看和监控 Claude 运行的长进程/日志
- **操作**：`tmux new -s dev`、`tmux attach -t dev`

### mgrep

- **定义**：改进的搜索工具，优于 ripgrep/grep
- **安装**：通过插件市场
- **功能**：本地搜索 + Web 搜索
- **用法**：`/mgrep "function handleSubmit"`、`mgrep --web "Next.js 15"`

## 工作流模式

### TDD (Test-Driven Development)

- **命令**：`/tdd`
- **相关**：tdd-workflow skill、tdd-guide subagent

### E2E Testing（端到端测试）

- **命令**：`/e2e`
- **相关**：e2e-runner subagent

### Code Review（代码审查）

- **工具**：GitHub Actions CI/CD 集成
- **相关**：code-reviewer subagent、pr-review-toolkit plugin

### Refactoring（重构）

- **命令**：`/refactor-clean`
- **相关**：refactor-cleaner subagent
- **用途**：清理死代码和松散的 .md 文件

## 配置结构

### User Level（用户级）

- **位置**：`~/.claude/`
- **包含**：全局 skills、rules、agents、commands

### Project Level（项目级）

- **位置**：项目根目录或 `.claude/`
- **包含**：项目特定的配置
- **配置文件**：`~/.claude.json`
- **禁用 MCP**：`projects.disabledMcpServers`

### Marketplace（市场）

- **定义**：插件和工具的分发平台
- **添加**：`claude plugin marketplace add <url>`
- **访问**：通过 `/plugins` 命令

## 键盘快捷键

- `Ctrl+U` - 删除整行
- `!` - 快速 bash 命令前缀
- `@` - 搜索文件
- `/` - 启动斜杠命令
- `Shift+Enter` - 多行输入
- `Tab` - 切换思考显示
- `Esc Esc` - 中断 Claude / 恢复代码

## 最佳实践原则

1. **不要过度复杂化** - 配置是微调，不是架构设计
2. **上下文窗口管理** - 禁用未使用的 MCP 和插件
3. **并行执行** - 使用 fork 和 git worktrees
4. **自动化重复工作** - 使用 hooks 处理格式化、linting
5. **限定子代理范围** - 有限工具 = 专注执行
6. **选择性启用** - 只启用当前任务需要的工具
