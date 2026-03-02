# 《Claude Code 完整指南》总结

这是一篇由 Anthropic 黑客马拉松获胜者撰写的 Claude Code 深度使用指南，基于 10 个月的实战经验。

## 核心概念

### 1. **Skills（技能）和 Commands（命令）**
- Skills 是工作流的快捷方式，存储在 `~/.claude/skills/`
- Commands 通过斜杠命令执行，如 `/refactor-clean`、`/tdd`、`/e2e`
- 可以包含 codemaps 帮助 Claude 快速导航代码库

### 2. **Hooks（钩子）**
基于事件触发的自动化，包括：
- **PreToolUse**: 工具执行前（验证、提醒）
- **PostToolUse**: 工具执行后（格式化、反馈）
- **UserPromptSubmit**: 发送消息时
- **Stop**: Claude 响应结束时
- **PreCompact**: 上下文压缩前

💡 使用 `/hookify` 插件可以对话式创建钩子

### 3. **Subagents（子代理）**
- 主 Claude 可以将任务委托给有限作用域的子代理
- 可以后台或前台运行，释放主代理的上下文
- 可以配置特定的工具权限和沙箱隔离

### 4. **Rules（规则）**
存储在 `~/.claude/rules/` 的 Markdown 文件：
- security.md - 安全检查规则
- coding-style.md - 代码风格规范
- testing.md - 测试工作流
- git-workflow.md - Git 提交规范
- agents.md - 子代理委托规则

### 5. **MCPs (Model Context Protocol)**
- 将 Claude 连接到外部服务（如 Supabase、GitHub）
- **关键警告**：上下文窗口管理至关重要
- 建议：配置 20-30 个 MCP，但只启用 < 10 个 / < 80 个工具
- 否则 200k 上下文可能只剩 70k

### 6. **Plugins（插件）**
打包工具便于安装，可以是 skill + MCP 组合
- LSP 插件提供实时类型检查
- 同样需要注意上下文窗口占用

## 实用技巧

### 键盘快捷键
- `Ctrl+U` - 删除整行
- `!` - 快速 bash 命令
- `@` - 搜索文件
- `/` - 斜杠命令
- `Tab` - 切换思考显示
- `Esc Esc` - 中断 Claude

### 并行工作流
- `/fork` - 分叉对话做并行任务
- Git Worktrees - 多个 Claude 实例无冲突工作

### 其他工具
- **tmux** - 流式查看 Claude 运行的长进程
- **mgrep** - 比 ripgrep/grep 更强大的搜索（支持本地和 Web）
- `/rewind` - 回退到之前状态
- `/checkpoints` - 文件级撤销点
- `/compact` - 手动触发上下文压缩

## 编辑器推荐

作者使用 **Zed**（Rust 编写）：
- 极快的性能
- 集成 Agent Panel
- 最小资源占用
- 支持 Vim 模式

也可使用 **VSCode/Cursor**，有原生扩展支持。

## 关键要点

1. **不要过度复杂化** - 配置像微调，不是架构设计
2. **上下文窗口宝贵** - 禁用未使用的 MCP 和插件
3. **并行执行** - 使用 fork 和 git worktrees
4. **自动化重复工作** - 使用 hooks 处理格式化、linting
5. **限定子代理范围** - 有限工具 = 专注执行

## 作者配置示例

- **Plugins**: 安装 14 个，但每次只启用 4-5 个
- **MCPs**: 配置 14 个，每个项目只启用 5-6 个
- **Hooks**: PreToolUse、PostToolUse、Stop 等自动化检查
- **9 个 Subagents**: planner、architect、tdd-guide、code-reviewer 等

---

这篇指南强调了**上下文管理**是使用 Claude Code 的核心，需要在功能丰富和性能之间找到平衡。
