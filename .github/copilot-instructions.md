---
description: AI rules derived by SpecStory from the project AI interaction history
applyTo: *
---

## PROJECT OVERVIEW

**xy-plugins** 是一个 Claude Code Plugin Marketplace Monorepo，用于开发、构建和分发 Claude Code 插件。仓库包含插件源码（`dev/`）、构建工具（`scripts/`）、插件模板（`templates/`）以及规范驱动的开发工作流（`openspec/`）。

当前已有插件：

- **OCR Plugin** — 基于 Tesseract.js 的图像文字识别插件

## TECH STACK

- **运行时**: Node.js (ESM, `"type": "module"`)
- **语言**: TypeScript 5.x（源码在 `dev/` 下，编译产物在 `dist/`）
- **包管理器**: **pnpm**（项目强制使用，禁止使用 npm 或 yarn）
- **核心依赖**: `@modelcontextprotocol/sdk`、`tesseract.js`、`canvas`
- **开发依赖**: `typescript`、`@types/node`
- **提交规范**: Conventional Commits（`feat:`、`fix:`、`chore:` 等）

## FOLDER ORGANIZATION

```
dev/<name>/           # 插件 TypeScript 源码（开发层）
  src/                # TS 源文件
  dist/               # 编译产物（不提交）
  plugin.json         # 插件元数据
  SKILL.md            # 技能文档（skill 类型）
  mcp.json            # MCP 配置模板（mcp 类型）
  tsconfig.json
  package.json

plugins/<name>/       # 构建产物（gitignored，不手动编辑）
  .claude-plugin/plugin.json
  skills/<name>/SKILL.md
  skills/<name>/scripts/*.js
  .mcp.json

templates/            # 新插件脚手架模板
  skill/              # Skill 类型模板
  hooks/              # Hooks 类型模板
  mcp/                # MCP 类型模板

scripts/              # 构建与脚手架工具
  create.js           # 创建新插件骨架
  build.js            # 编译 + 打包插件
  validate.js         # 校验插件结构
  dev.js              # Watch 模式编译
  test-plugin.js      # 本地测试加载插件

openspec/             # 规范驱动开发工作流
  config.yaml
  specs/              # 功能规格文档
  changes/            # 进行中 / 已归档的变更

.github/
  skills/             # Copilot Agent Skills
  copilot-instructions.md
```

## CODE STYLE

- 所有新代码使用 **TypeScript**，放在 `dev/<name>/src/` 下
- 使用 ESM 模块语法（`import`/`export`），不使用 `require`
- 模板占位符统一使用 `{{name}}`、`{{description}}` 格式
- MCP 配置中路径使用 `${CLAUDE_PLUGIN_ROOT}` 变量，禁止绝对路径
- 插件 `plugin.json` 必须包含 `name`、`version`、`description` 字段
- 构建产物路径（`plugins/`、`dev/*/dist/`）不纳入版本控制

## PROJECT-SPECIFIC STANDARDS

### 插件类型规范

| 类型    | 必需文件                                 | 说明             |
| ------- | ---------------------------------------- | ---------------- |
| `skill` | `SKILL.md`、`src/index.ts`、`src/cli.ts` | 提供 AI 技能     |
| `hooks` | `hooks.json`、`scripts/example.js`       | Claude Code 钩子 |
| `mcp`   | `src/mcp-server.ts`、`mcp.json`          | MCP 服务器       |

### 构建流程

1. `tsc` 编译 `dev/<name>/src/` → `dev/<name>/dist/`
2. 清理旧 `plugins/<name>/`
3. 按类型打包到 `plugins/<name>/`
4. 在 `scripts/` 目录运行 `pnpm install --prod` 安装生产依赖
5. 处理 MCP 路径替换

**插件必须自包含**：所有运行时依赖（`node_modules`）必须打包在插件目录内。

### OpenSpec 开发工作流

新功能开发遵循规范驱动流程：

1. **Propose** — `openspec new change "<name>"` 生成 proposal/design/tasks
2. **Apply** — 按 tasks.md 逐步实现
3. **Archive** — 实现完成后归档变更到 `openspec/changes/archive/`

规格文档存放在 `openspec/specs/<feature>/spec.md`，使用 BDD 格式（`WHEN`/`THEN`）描述需求。

## WORKFLOW & RELEASE RULES

- **包管理**: 始终使用 `pnpm`，不使用 `npm install` 或 `yarn`
- **依赖安装**: `pnpm install`（开发）/ `pnpm install --prod`（插件打包）
- **提交**: 遵循 Conventional Commits 规范
- **构建验证**: 提交前运行 `pnpm validate` 检查插件结构
- **新插件**: 使用 `pnpm create-plugin <name> --type <type>` 创建，不手动复制模板

## PROJECT DOCUMENTATION & CONTEXT SYSTEM

- **库/API 文档**、代码生成、配置步骤：**必须使用 Context7 MCP**，无需用户明确要求
- 架构文档：[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- 插件开发指南：[docs/GUIDES/PLUGIN_DEVELOPMENT.md](docs/GUIDES/PLUGIN_DEVELOPMENT.md)
- Marketplace 指南：[docs/GUIDES/MARKETPLACE.md](docs/GUIDES/MARKETPLACE.md)
- 代码地图：[docs/CODEMAPS/INDEX.md](docs/CODEMAPS/INDEX.md)

## DEBUGGING

- 构建失败先检查 `dev/<name>/tsconfig.json` 配置
- 路径错误检查 MCP 配置中是否使用了绝对路径（应用 `${CLAUDE_PLUGIN_ROOT}`）
- 插件结构问题运行 `pnpm validate <name>` 获取详细错误
- 依赖缺失检查 `plugins/<name>/skills/<name>/scripts/node_modules/` 是否存在

## FINAL DOs AND DON'Ts

**DO:**

- 使用 `pnpm` 管理所有依赖
- 在 `dev/<name>/src/` 中编写 TypeScript 源码
- MCP 路径使用 `${CLAUDE_PLUGIN_ROOT}` 变量
- 需要库文档时主动调用 Context7 MCP
- 新功能通过 openspec 工作流提案
- 提交时使用 Conventional Commits 格式

**DON'T:**

- 不直接编辑 `plugins/` 下的构建产物
- 不在插件配置中使用绝对路径
- 不使用 `npm` 或 `yarn`
- 不手动复制模板文件（使用 `pnpm create-plugin`）
- 不将 `dev/*/dist/` 或 `plugins/` 提交到版本控制
