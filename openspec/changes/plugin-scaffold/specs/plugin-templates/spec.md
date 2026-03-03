## ADDED Requirements

### Requirement: Skill 类型模板

`templates/skill/` SHALL 包含 skill 类型 Plugin 的完整项目骨架。

#### Scenario: 模板文件清单

- **WHEN** 查看 `templates/skill/` 目录
- **THEN** 包含以下文件：`src/index.ts`（模块入口模板）、`src/cli.ts`（CLI 入口模板）、`SKILL.md`（含 frontmatter 的 Skill 定义模板）、`plugin.json`（含占位符的元数据模板）、`tsconfig.json`、`package.json`

#### Scenario: 模板占位符

- **WHEN** 读取模板文件内容
- **THEN** 使用 `{{name}}` 和 `{{description}}` 作为占位符，create.js 脚本在创建时替换为实际值

### Requirement: Hooks 类型模板

`templates/hooks/` SHALL 包含 hooks 类型 Plugin 的完整项目骨架。

#### Scenario: 模板文件清单

- **WHEN** 查看 `templates/hooks/` 目录
- **THEN** 包含以下文件：`hooks.json`（含示例 hook 配置，路径使用 `${CLAUDE_PLUGIN_ROOT}`）、`scripts/example.js`（示例 hook 脚本）、`plugin.json`

### Requirement: MCP 类型模板

`templates/mcp/` SHALL 包含 mcp 类型 Plugin 的完整项目骨架。

#### Scenario: 模板文件清单

- **WHEN** 查看 `templates/mcp/` 目录
- **THEN** 包含以下文件：`src/mcp-server.ts`（MCP 服务器模板）、`mcp.json`（MCP 配置模板，路径使用 `${CLAUDE_PLUGIN_ROOT}`）、`plugin.json`、`tsconfig.json`、`package.json`

### Requirement: 模板变量替换

create.js 脚本 SHALL 在复制模板文件时将所有占位符替换为用户提供的实际值。

#### Scenario: 替换 name 占位符

- **WHEN** 模板文件中包含 `{{name}}`
- **THEN** 替换为用户指定的 Plugin 名称（如 `my-tool`）

#### Scenario: 替换 description 占位符

- **WHEN** 模板文件中包含 `{{description}}`
- **THEN** 替换为用户指定的描述，如未指定则使用默认值 `A Claude Code plugin`
