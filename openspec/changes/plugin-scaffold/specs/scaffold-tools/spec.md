## ADDED Requirements

### Requirement: 创建新 Plugin 命令

`pnpm create-plugin <name> --type <type>` SHALL 在 `dev/<name>/` 下生成指定类型的 Plugin 开发骨架。

#### Scenario: 创建 skill 类型 Plugin

- **WHEN** 执行 `pnpm create-plugin my-tool --type skill`
- **THEN** 在 `dev/my-tool/` 下生成：`src/index.ts`、`src/cli.ts`、`SKILL.md`（含 frontmatter 模板）、`plugin.json`（含 name、version、description）、`tsconfig.json`、`package.json`

#### Scenario: 创建 hooks 类型 Plugin

- **WHEN** 执行 `pnpm create-plugin my-hooks --type hooks`
- **THEN** 在 `dev/my-hooks/` 下生成：`hooks.json`（含 `${CLAUDE_PLUGIN_ROOT}` 路径模板）、`scripts/` 目录（含示例脚本）、`plugin.json`

#### Scenario: 创建 mcp 类型 Plugin

- **WHEN** 执行 `pnpm create-plugin my-mcp --type mcp`
- **THEN** 在 `dev/my-mcp/` 下生成：`src/mcp-server.ts`、`mcp.json`（含 `${CLAUDE_PLUGIN_ROOT}` 路径模板）、`plugin.json`、`tsconfig.json`、`package.json`

#### Scenario: 名称冲突检测

- **WHEN** `dev/<name>/` 已存在时执行 create-plugin
- **THEN** 脚本报错并退出，不覆盖现有目录

### Requirement: 构建 Plugin 命令

`pnpm build:plugin <name>` SHALL 编译并打包指定 Plugin 到 `plugins/<name>/`。

#### Scenario: 构建单个 Plugin

- **WHEN** 执行 `pnpm build:plugin ocr`
- **THEN** 编译 `dev/ocr/src/` 并打包为 `plugins/ocr/`，输出构建摘要

#### Scenario: 构建全部 Plugin

- **WHEN** 执行 `pnpm build:all`
- **THEN** 遍历 `dev/` 下所有包含 `plugin.json` 的子目录，依次构建

#### Scenario: 构建不存在的 Plugin

- **WHEN** 执行 `pnpm build:plugin nonexistent`
- **THEN** 脚本报错提示 Plugin 不存在

### Requirement: 验证 Plugin 结构命令

`pnpm validate <name>` SHALL 验证 `plugins/<name>/` 的目录结构是否符合 Claude Code Plugin 规范。

#### Scenario: 验证通过

- **WHEN** 对正确构建的 Plugin 执行 validate
- **THEN** 输出验证通过信息，检查项包括：.claude-plugin/plugin.json 存在且 JSON 合法、plugin.json 包含 name 字段、skill 类型有 SKILL.md、hooks 类型有 hooks.json、路径中不含绝对路径

#### Scenario: 验证失败

- **WHEN** Plugin 目录缺少 .claude-plugin/plugin.json
- **THEN** 输出错误信息，列出所有不合规项

### Requirement: 本地测试命令

`pnpm test:plugin <name>` SHALL 使用 `claude --plugin-dir ./plugins/<name>` 启动 Claude Code 加载该 Plugin。

#### Scenario: 启动本地测试

- **WHEN** 执行 `pnpm test:plugin ocr`
- **THEN** 启动 `claude --plugin-dir ./plugins/ocr`

#### Scenario: Plugin 未构建

- **WHEN** `plugins/<name>/` 不存在时执行 test:plugin
- **THEN** 提示用户先执行 `pnpm build:plugin <name>`

### Requirement: 开发监视模式

`pnpm dev <name>` SHALL 以 watch 模式编译 TypeScript，文件变更时自动重新编译。

#### Scenario: 启动监视编译

- **WHEN** 执行 `pnpm dev ocr`
- **THEN** 以 `tsc -p dev/ocr/tsconfig.json --watch` 模式运行

### Requirement: package.json scripts 更新

根目录 `package.json` 的 scripts SHALL 替换为新的脚手架命令，移除旧的 sync 相关命令。

#### Scenario: 新命令可用

- **WHEN** 查看 package.json 的 scripts
- **THEN** 包含 `create-plugin`、`build:plugin`、`build:all`、`validate`、`test:plugin`、`dev` 命令

#### Scenario: 旧命令移除

- **WHEN** 查看 package.json 的 scripts
- **THEN** 不包含 `sync`、`sync:ocr`、`build`（旧的 build 含 sync）命令
