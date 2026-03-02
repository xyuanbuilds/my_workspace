# Vercel Skills CLI 使用手册

## 快速开始

### 安装技能

#### 基础安装

安装 Vercel 官方技能：

```bash
npx skills add vercel-labs/agent-skills
```

#### 其他源格式

```bash
# GitHub 简写
npx skills add vercel-labs/agent-skills

# 完整 GitHub URL
npx skills add https://github.com/vercel-labs/agent-skills

# 仓库中特定技能
npx skills add https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines

# 本地路径
npx skills add ./my-local-skills
```

### 常见安装命令

```bash
# 列出可用技能（不安装）
npx skills add vercel-labs/agent-skills --list

# 安装特定技能
npx skills add vercel-labs/agent-skills --skill frontend-design

# 安装到特定代理（如 Claude Code）
npx skills add vercel-labs/agent-skills -a claude-code

# 全局安装（所有项目可用）
npx skills add vercel-labs/agent-skills --global

# 非交互模式（CI/CD 友好）
npx skills add vercel-labs/agent-skills --skill frontend-design -g -a claude-code -y

# 安装所有技能
npx skills add vercel-labs/agent-skills --all
```

### 管理已安装技能

```bash
# 列出已安装技能
npx skills list

# 搜索技能
npx skills find typescript

# 检查可用更新
npx skills check

# 更新所有技能
npx skills update

# 移除技能
npx skills remove frontend-design

# 创建新技能
npx skills init my-skill
```

---

## 拓展阅读

### Vercel Skills CLI 简介

**Vercel Skills CLI** 是一个开放的代理技能生态系统的命令行工具。它支持 40+ 的编程代理，包括：

- Claude Code
- Cursor
- OpenCode
- Codex
- 以及 37+ 其他代理

核心功能：

- **统一的技能安装** - 一键为多个代理安装技能
- **跨平台兼容** - 支持 GitHub、GitLab 及本地技能源
- **灵活的安装方式** - 符号链接或复制两种方式
- **技能发现** - 交互式搜索和浏览技能

### 安装选项详解

| 选项       | 简写 | 说明                            |
| ---------- | ---- | ------------------------------- |
| `--global` | `-g` | 安装到用户目录而非项目          |
| `--agent`  | `-a` | 指定目标代理（可指定多个）      |
| `--skill`  | `-s` | 指定技能名称（支持 `*` 通配符） |
| `--list`   | `-l` | 列出可用技能（不安装）          |
| `--copy`   | -    | 复制文件而非创建符号链接        |
| `--yes`    | `-y` | 跳过所有确认提示                |
| `--all`    | -    | 安装所有技能到所有代理          |

### 安装范围

| 范围         | 默认 | 路径                | 说明                       |
| ------------ | ---- | ------------------- | -------------------------- |
| **项目级别** | 是   | `./<agent>/skills/` | 随项目共享，可提交版本控制 |
| **全局**     | 否   | `~/<agent>/skills/` | 跨所有项目可用             |

### 安装方式

安装时可选择两种方式：

| 方式                 | 优点                       | 场景       |
| -------------------- | -------------------------- | ---------- |
| **符号链接**（推荐） | 单一来源、易于更新         | 大多数场景 |
| **复制**             | 独立副本、符号链接不支持时 | 特殊环境   |

### 支持的代理

Vercel Skills 支持 40+ 代理，包括：

**主流代理：**

- Claude Code (`.claude/skills/`)
- Cursor (`.agents/skills/`)
- Cline (`.cline/skills/`)
- OpenCode (`.agents/skills/`)
- Codex (`.agents/skills/`)
- Windsurf (`.windsurf/skills/`)

**其他代理：**

- Roo Code、OpenHands、Continue、GitHub Copilot
- Gemini CLI、Kimi Code CLI、Qwen Code
- Trae、iFlow CLI、Kiro CLI、Amp
- 以及更多...

### 命令详解

#### npx skills list

列出所有已安装技能：

```bash
# 列出所有已安装技能
npx skills list

# 仅列出全局技能
npx skills ls -g

# 按代理过滤
npx skills ls -a claude-code -a cursor
```

#### npx skills find

搜索技能：

```bash
# 交互式搜索（fzf 风格）
npx skills find

# 按关键词搜索
npx skills find typescript
```

#### npx skills remove

移除安装的技能：

```bash
# 交互式移除
npx skills remove

# 按名称移除
npx skills remove web-design-guidelines

# 移除多个技能
npx skills remove frontend-design web-design-guidelines

# 从全局移除
npx skills remove --global web-design-guidelines

# 从特定代理移除
npx skills remove --agent claude-code cursor my-skill

# 移除所有技能
npx skills remove --all

# 从特定代理移除所有技能
npx skills remove --skill '*' -a cursor
```

#### npx skills init

创建新技能：

```bash
# 在当前目录创建 SKILL.md
npx skills init

# 创建到子目录
npx skills init my-skill
```

### 技能文件结构

每个技能是一个包含 `SKILL.md` 的目录：

```markdown
---
name: my-skill
description: 技能的简短描述和使用场景
---

# 我的技能

## When to Use

描述此技能应用的场景。

## Steps

1. 第一步
2. 第二步
```

**必需字段：**

- `name` - 唯一标识（小写字母、支持连字符）
- `description` - 简短说明

**可选字段：**

- `metadata.internal` - 设置为 `true` 隐藏技能（工作进行中或仅供内部使用）

### 技能发现机制

CLI 自动搜索以下位置的技能：

- 根目录（如包含 `SKILL.md`）
- `skills/`
- `skills/.curated/`
- `skills/.experimental/`
- `skills/.system/`
- 各代理的特定目录（`.claude/skills/`、`.cline/skills/` 等）

### 插件清单发现

如果存在 `.claude-plugin/marketplace.json` 或 `.claude-plugin/plugin.json`，CLI 也会发现其中声明的技能：

```json
{
  "metadata": { "pluginRoot": "./plugins" },
  "plugins": [
    {
      "name": "my-plugin",
      "source": "my-plugin",
      "skills": ["./skills/review", "./skills/test"]
    }
  ]
}
```

### 安装示例

```bash
# 列出仓库中可用技能
npx skills add vercel-labs/agent-skills --list

# 安装特定技能到 Claude Code
npx skills add vercel-labs/agent-skills --skill frontend-design -a claude-code

# 安装多个技能到多个代理
npx skills add vercel-labs/agent-skills --skill frontend-design --skill web-design-guidelines -a claude-code -a cursor

# 名称含空格需要引号
npx skills add owner/repo --skill "Convex Best Practices"

# CI/CD 环境非交互安装
npx skills add vercel-labs/agent-skills --skill frontend-design -g -a claude-code -y

# 安装所有技能到所有代理
npx skills add vercel-labs/agent-skills --all
```

### 环境变量

| 变量                      | 说明                                              |
| ------------------------- | ------------------------------------------------- |
| `INSTALL_INTERNAL_SKILLS` | 设置为 1 或 true 显示并安装标记为 internal 的技能 |
| `DISABLE_TELEMETRY`       | 禁用匿名使用数据收集                              |
| `DO_NOT_TRACK`            | 禁用遥测的另一种方式                              |

```bash
# 安装内部技能
INSTALL_INTERNAL_SKILLS=1 npx skills add vercel-labs/agent-skills --list
```

### 兼容性

技能通常跨代理兼容（遵循共享的 Agent Skills 规范），但某些功能可能是代理特定的：

- **基础技能** - 所有代理支持
- **allowed-tools** - 大多数代理支持
- **context: fork** - 仅 Windsurf 等部分代理支持
- **Hooks** - 仅支持的代理支持

### 故障排查

#### "找不到技能"

检查清单：

- 确保仓库包含有效的 `SKILL.md`
- 验证 frontmatter 中有 `name` 和 `description`

#### 技能在代理中不加载

排查步骤：

- 验证技能已安装到正确路径
- 检查代理的技能加载要求
- 确保 `SKILL.md` 有效 YAML

#### 权限错误

解决方案：

- 确保有目标目录的写入权限
- 全局安装时使用 `--global` 选项

### 常用工作流

#### 1. 为单个项目添加技能

```bash
# 进入项目目录
cd my-project

# 安装特定技能
npx skills add vercel-labs/agent-skills --skill frontend-design

# 在你的代理中使用
```

#### 2. 全局安装推荐技能

```bash
# 全局安装关键技能
npx skills add vercel-labs/agent-skills --skill '*' --global

# 现在所有项目都可用
```

#### 3. 创建团队技能

```bash
# 初始化技能
npx skills init team-conventions

# 编辑 ./.team-conventions/SKILL.md
# 在项目版本控制中共享
git add .team-conventions/SKILL.md
```

#### 4. 探索可用技能

```bash
# 交互式浏览
npx skills find

# 或按关键词搜索
npx skills find react
```

### 命令速查

```bash
# 安装
npx skills add <source> [options]

# 列表
npx skills list                    # 已安装技能
npx skills find [query]            # 搜索技能

# 维护
npx skills check                   # 检查更新
npx skills update                  # 更新所有技能
npx skills remove [skills]         # 移除技能
npx skills init [name]             # 创建新技能
```

---

**参考资源**：https://github.com/vercel-labs/skills  
**技能目录**：https://skills.sh/  
**最后更新**：2026年2月25日
