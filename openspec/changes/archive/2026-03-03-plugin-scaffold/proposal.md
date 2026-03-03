## Why

当前项目（my_skill）是一个 Claude Code Skills 开发工作区，使用自定义的 sync 脚本将编译产物同步到 `.claude/skills/` 等多个目录。这种方式只能本地使用，无法让其他用户通过 Claude Code 的 Plugin Marketplace 安装。需要重构为标准的 Plugin Marketplace 仓库结构，使开发的插件可以被社区发现和安装。

## What Changes

- **新增** `.claude-plugin/marketplace.json`，将仓库注册为 Marketplace（名称 `xy-plugins`）
- **新增** `plugins/` 目录作为构建输出，每个子目录是一个完整的、自包含的、可安装的 Plugin
- **新增** 脚手架工具：`scripts/build.js`（构建打包）、`scripts/create.js`（创建新 Plugin）、`scripts/validate.js`（验证结构）
- **新增** `templates/` 目录，提供 skill、hooks、mcp 三种类型的 Plugin 模板
- **适配** `dev/ocr/` 现有源码，增加 `plugin.json` 和 `mcp.json` 模板文件，MCP 路径改用 `${CLAUDE_PLUGIN_ROOT}`
- **移除** `scripts/sync-skills.js` 旧同步系统 **BREAKING**
- **移除** `.claude/skills/`、`.agents/skills/`、`skills/` 旧同步目标目录 **BREAKING**
- **更新** `package.json` 中的 scripts 命令，替换为新的脚手架命令
- **更新** `.gitignore`，排除 `plugins/` 构建产物
- **更新** 根目录 `.mcp.json`，开发时使用 `dev/ocr/dist/` 路径（保持开发体验）

## Capabilities

### New Capabilities

- `marketplace-structure`: Marketplace 仓库结构定义，包括 marketplace.json 配置、plugins/ 输出目录规范、Plugin 目录标准结构
- `build-pipeline`: 构建流水线，将 dev/ 下的源码编译、打包为 plugins/ 下完整可安装的 Plugin，支持 Skills、MCP、Hooks 三种类型
- `scaffold-tools`: 脚手架工具集，包括创建新 Plugin（create）、构建打包（build）、验证结构（validate）、本地测试（test）
- `plugin-templates`: Plugin 模板系统，提供 skill、hooks、mcp 三种类型的项目模板

### Modified Capabilities

（无现有 specs 需要修改）

## Impact

- **代码**：移除 `scripts/sync-skills.js`、`skills/` 目录、`.claude/skills/`、`.agents/skills/`；新增 `plugins/`、`templates/`、脚手架脚本
- **依赖**：`package.json` scripts 全面更新；可能新增开发依赖（如 `fs-extra`）
- **开发流程**：本地开发改用 `claude --plugin-dir ./plugins/<name>` 加载插件
- **分发**：支持 `claude plugin install ocr@xy-plugins` 安装，需要将仓库推送到 GitHub（`xy/workspace`）
- **向后兼容**：旧的 sync 体系完全移除，不兼容
