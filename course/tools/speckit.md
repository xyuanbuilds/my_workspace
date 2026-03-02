# Spec-Kit 使用指南

> 基于 GitHub [spec-kit](https://github.com/github/spec-kit) 官方文档整理

## 什么是 Spec-Kit

Spec-Kit 是 GitHub 推出的 **规格驱动开发（Spec-Driven Development, SDD）** 工具框架，配合 AI 编程助手使用。核心理念：**先写规格（What & Why），再写代码（How）**，通过一组结构化的斜杠命令将产品规格转化为可执行代码。

支持多种 AI 代理：Claude、Gemini、Copilot、Cursor Agent、Codex、Windsurf、Qwen、OpenCode 等。

---

## 安装

### 前置要求

- Python `uv` 工具

### 持久安装（推荐）

```bash
# 安装
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git

# 升级到最新版
uv tool install specify-cli --force --from git+https://github.com/github/spec-kit.git
```

### 一次性使用（无需安装）

```bash
uvx --from git+https://github.com/github/spec-kit.git specify init <PROJECT_NAME>
```

### 项目初始化

```bash
# 新建项目目录并初始化
specify init <project_name> --ai claude

# 在当前目录初始化
specify init . --ai claude
# 或
specify init --here --ai claude

# 强制在非空目录初始化（跳过确认）
specify init . --force --ai claude

# 指定脚本类型（sh / ps）
specify init <project_name> --ai claude --script sh   # POSIX shell
specify init <project_name> --ai claude --script ps   # PowerShell

# 跳过 AI 代理工具检查
specify init <project_name> --ai claude --ignore-agent-tools

# 跳过 git 初始化（仅阻止 git init 和首次提交）
specify init <project_name> --ai gemini --no-git
```

### 实用命令

```bash
# 检查已安装的工具状态
specify check

# 查看版本信息
specify version
```

初始化后会在项目中生成 `.specify/` 目录，并为对应 AI 代理注册斜杠命令（如 `.claude/commands/`、`.gemini/commands/` 等）。

---

## 核心工作流（6 步）

```
constitution → specify → (clarify) → plan → tasks → (analyze) → implement
```

| 步骤 | 命令                    | 类型 | 说明                                  |
| ---- | ----------------------- | ---- | ------------------------------------- |
| 1    | `/speckit.constitution` | 核心 | 设置项目原则、技术规范和团队约定      |
| 2    | `/speckit.specify`      | 核心 | 描述要构建的功能（What & Why）        |
| 3    | `/speckit.clarify`      | 可选 | 澄清规格中不明确的部分                |
| 4    | `/speckit.plan`         | 核心 | 指定技术栈，生成技术实现方案          |
| 5    | `/speckit.tasks`        | 核心 | 将实现方案拆解为可执行任务列表        |
| 6    | `/speckit.analyze`      | 可选 | 校验 spec / plan / tasks 三者的一致性 |
| 7    | `/speckit.implement`    | 核心 | 按任务列表逐步执行代码实现            |

此外还有 `/speckit.checklist` 可选命令用于生成自定义质量验证清单。

---

## 命令详解

### `/speckit.constitution`

设置项目 **宪法**：编码规范、架构原则、质量要求等，是后续所有命令的基准约束。

```
/speckit.constitution This project follows a "Library-First" approach.
All features must be implemented as standalone libraries first.
We use TDD strictly. We prefer functional programming patterns.
```

生成产物：`.specify/memory/constitution.md`

---

### `/speckit.specify`

描述需求，聚焦 **What（是什么）** 和 **Why（为什么）**，不要涉及具体技术实现。

```
/speckit.specify Build an application that can help me organize my photos
in separate photo albums. Albums are grouped by date and can be
re-organized by dragging and dropping on the main page. Albums are never
in other nested albums. Within each album, photos are previewed in a
tile-like interface.
```

**生成产物：**

- `specs/{branch}/spec.md` — 包含用户场景、功能需求（可测试）、成功标准（可衡量、技术无关）、关键实体
- `specs/{branch}/checklists/requirements.md` — 需求检查清单
- 分支名自动编号，如 `001-photo-albums`
- 存在歧义的地方会标记 `[NEEDS CLARIFICATION]`（最多 3 处）

---

### `/speckit.clarify`（可选）

在 `/speckit.plan` 之前使用，交互式地解决规格中的模糊点。

```
/speckit.clarify Focus on security and performance requirements.
```

以结构化表格呈现澄清问题：

| Option | Answer       | Implications     |
| ------ | ------------ | ---------------- |
| A      | [第一个选项] | [选择此项的影响] |
| B      | [第二个选项] | [选择此项的影响] |

---

### `/speckit.plan`

提供技术栈和架构选型，AI 生成完整的技术实现方案。

```
/speckit.plan The application uses Vite with minimal number of libraries.
Use vanilla HTML, CSS, and JavaScript as much as possible. Images are not
uploaded anywhere and metadata is stored in a local SQLite database.
```

**生成产物：**

| 文件                           | 内容         |
| ------------------------------ | ------------ |
| `specs/{branch}/plan.md`       | 技术实现方案 |
| `specs/{branch}/data-model.md` | 数据模型     |
| `specs/{branch}/contracts/`    | API 契约     |
| `specs/{branch}/research.md`   | 技术调研     |

---

### `/speckit.tasks`

读取 `plan.md` 等设计产物，生成带依赖顺序的任务清单。

```
/speckit.tasks
```

**生成产物：** `specs/{branch}/tasks.md`

任务格式示例：

```
- [ ] T001 Create project structure per implementation plan
- [ ] T005 [P] Implement authentication middleware in src/middleware/auth.py
- [ ] T012 [P] [US1] Create User model in src/models/user.py
```

**任务标记：**

| 标记    | 含义                             |
| ------- | -------------------------------- |
| `[P]`   | 可并行执行的任务                 |
| `[US1]` | 对应用户故事编号（映射 spec.md） |

**阶段结构：**

1. **Phase 1: Setup** — 项目初始化
2. **Phase 2: Foundational** — 基础前置依赖
3. **Phase 3+: User Stories** — 按优先级 P1、P2、P3… 执行用户故事
4. **Final: Polish** — 收尾与横切关注点

---

### `/speckit.analyze`（可选）

验证 spec / plan / tasks 三者的交叉一致性：

```
/speckit.analyze
```

- spec 中的需求是否被 plan 覆盖
- plan 中的内容是否反映在 tasks 中
- 任务依赖是否合法
- 是否存在孤立组件

---

### `/speckit.implement`

按 `tasks.md` 的顺序执行所有任务：

```
/speckit.implement
```

执行流程：

1. 检查 checklist 状态（未完成则警告）
2. 加载 `plan.md`、`data-model.md`、`contracts/`、`research.md`
3. 创建/验证忽略文件（`.gitignore`、`.dockerignore` 等）
4. 按阶段逐步执行任务
5. 每完成一个任务在 `tasks.md` 中标记 `[X]`
6. 验证功能是否符合规格

**规则：**

- 并行任务（`[P]`）并发执行
- 非并行任务失败时停止并报告
- 每个任务完成后报告进度

---

### `/speckit.checklist`（可选）

为特定领域生成自定义质量验证清单。

```
/speckit.checklist Create a checklist for UX requirements validation
```

生成结构化检查项：

```
- [ ] All user flows have been documented
- [ ] Error states are defined for each interaction
- [ ] Accessibility requirements are specified
```

---

## 扩展系统

Spec-Kit 支持通过模块化扩展添加新命令和功能：

```bash
# 搜索扩展
specify extension search jira
specify extension search --tag "issue-tracking" --verified

# 查看详情
specify extension info jira

# 安装扩展（从目录）
specify extension add jira

# 从本地目录安装（开发模式）
specify extension add ./my-extension --dev

# 从 URL 安装
specify extension add my-ext --from https://example.com/my-extension.zip

# 列出已安装扩展
specify extension list

# 查看可用扩展
specify extension list --available

# 查看全部（已安装 + 可用）
specify extension list --all

# 启用 / 禁用扩展
specify extension enable jira
specify extension disable jira

# 移除扩展
specify extension remove jira
specify extension remove jira --keep-config   # 保留配置
specify extension remove jira --force         # 强制移除，无确认

# 更新扩展
specify extension update          # 更新全部
specify extension update jira     # 更新指定
```

安装后根据提示编辑配置文件：

```bash
vim .specify/extensions/jira/jira-config.yml
```

扩展命令通过斜杠调用，如：`/speckit.jira.specstoissues`

---

## 生成产物结构

```
.specify/
  memory/
    constitution.md      # 项目宪法
  extensions/            # 已安装的扩展

specs/
  {branch}/              # 分支名自动编号，如 001-photo-albums
    spec.md              # 需求规格（用户场景 + 功能需求 + 成功标准）
    plan.md              # 技术实现方案
    data-model.md        # 数据模型
    contracts/           # API 契约
    research.md          # 技术调研
    tasks.md             # 可执行任务清单（含依赖 & 并行标记）
    checklists/
      requirements.md    # 需求检查清单
```

---

## 与 AI 代理集成

`specify init --ai <agent>` 后，斜杠命令会注册到对应代理的命令目录：

| 代理         | 命令目录            |
| ------------ | ------------------- |
| Claude       | `.claude/commands/` |
| Gemini       | `.gemini/commands/` |
| Copilot      | `.github/copilot/`  |
| Cursor Agent | `.cursor/commands/` |

在对话框中直接输入命令即可触发工作流。AI 代理会自动读取项目产物、执行本地 CLI 工具（如 `npm`、`dotnet`）并更新任务状态。

> **提示**：如果升级后斜杠命令未出现，请完全重启 IDE（不仅是重新加载窗口），并运行 `specify init --here --force --ai <your-agent>` 更新命令文件。

---

## 参考资料

- 官方仓库：https://github.com/github/spec-kit
- 快速入门：https://github.com/github/spec-kit/blob/main/docs/quickstart.md
- 安装指南：https://github.com/github/spec-kit/blob/main/docs/installation.md
- 升级指南：https://github.com/github/spec-kit/blob/main/docs/upgrade.md
- 扩展用户指南：https://github.com/github/spec-kit/blob/main/extensions/EXTENSION-USER-GUIDE.md
- 扩展开发指南：https://github.com/github/spec-kit/blob/main/extensions/EXTENSION-DEVELOPMENT-GUIDE.md
