## ADDED Requirements

### Requirement: Marketplace 注册文件

仓库根目录 SHALL 包含 `.claude-plugin/marketplace.json` 文件，定义 Marketplace 元数据和 Plugin 列表。marketplace name 为 `xy-plugins`。

#### Scenario: marketplace.json 包含必要字段

- **WHEN** 读取 `.claude-plugin/marketplace.json`
- **THEN** 文件包含 `name`（"xy-plugins"）、`owner`（含 name 字段）、`plugins` 数组

#### Scenario: 用户添加 marketplace

- **WHEN** 用户执行 `/plugin marketplace add xy/workspace`
- **THEN** Claude Code 成功识别并加载 marketplace 中列出的所有 Plugin

### Requirement: Plugin 输出目录结构

每个 Plugin 的构建产物 SHALL 输出到 `plugins/<plugin-name>/` 目录，内部结构符合 Claude Code Plugin 官方规范。

#### Scenario: Skill 类型 Plugin 目录结构

- **WHEN** 构建一个 skill 类型的 Plugin（如 ocr）
- **THEN** `plugins/ocr/` 目录包含：`.claude-plugin/plugin.json`、`skills/ocr/SKILL.md`、`skills/ocr/scripts/`（含 JS 文件和 package.json）

#### Scenario: Hooks 类型 Plugin 目录结构

- **WHEN** 构建一个 hooks 类型的 Plugin
- **THEN** `plugins/<name>/` 目录包含：`.claude-plugin/plugin.json`、`hooks/hooks.json`，hooks.json 内路径使用 `${CLAUDE_PLUGIN_ROOT}`

#### Scenario: MCP 类型 Plugin 目录结构

- **WHEN** 构建一个 mcp 类型的 Plugin
- **THEN** `plugins/<name>/` 目录包含：`.claude-plugin/plugin.json`、`.mcp.json`，mcp.json 内 command/args 路径使用 `${CLAUDE_PLUGIN_ROOT}`

### Requirement: Plugin 自包含

Plugin 输出目录 SHALL 自包含，不引用目录外的任何文件。所有运行时依赖（node_modules）MUST 包含在 Plugin 目录内。

#### Scenario: Plugin 安装后可独立运行

- **WHEN** Claude Code 将 Plugin 复制到 `~/.claude/plugins/cache/` 后
- **THEN** Plugin 的所有功能正常工作，无需额外安装步骤

### Requirement: marketplace.json 中的 Plugin 引用

marketplace.json 的 plugins 数组中每个条目 SHALL 通过 `source` 字段指向 `plugins/` 下对应的 Plugin 目录。

#### Scenario: Plugin source 路径正确

- **WHEN** 读取 marketplace.json 中某个 plugin 条目
- **THEN** `source` 字段值为 `./plugins/<plugin-name>`，且该路径存在并包含完整的 Plugin 结构

### Requirement: 构建产物排除版本控制

`plugins/` 目录 SHALL 被添加到 `.gitignore`，因为它是构建产物。marketplace.json 中引用的 Plugin 在 CI 或发布时构建生成。

#### Scenario: gitignore 排除 plugins 目录

- **WHEN** 查看 `.gitignore` 文件
- **THEN** 包含 `plugins/` 条目

#### Scenario: 发布前需要构建

- **WHEN** 用户克隆仓库后想要发布
- **THEN** 需要先执行 `pnpm build:all` 生成 `plugins/` 下的构建产物
