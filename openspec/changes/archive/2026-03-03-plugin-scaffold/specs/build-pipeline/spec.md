## ADDED Requirements

### Requirement: TypeScript 编译

构建流水线 SHALL 对 `dev/<name>/src/` 下的 TypeScript 源码调用 `tsc` 编译，输出到 `dev/<name>/dist/`。

#### Scenario: 编译 OCR Plugin

- **WHEN** 执行 OCR Plugin 的构建
- **THEN** `dev/ocr/src/*.ts` 被编译为 `dev/ocr/dist/*.js`，使用 `dev/ocr/tsconfig.json` 配置

### Requirement: Plugin 打包

构建脚本 SHALL 将编译产物和配置文件组装为完整的 Plugin 目录。

#### Scenario: Skill 类型 Plugin 打包

- **WHEN** 打包 skill 类型 Plugin（如 ocr）
- **THEN** 构建脚本执行以下操作：
  1. 创建 `plugins/<name>/.claude-plugin/` 并复制 `plugin.json`
  2. 创建 `plugins/<name>/skills/<name>/` 并复制 `SKILL.md`
  3. 将 `dist/*.js` 复制到 `plugins/<name>/skills/<name>/scripts/`
  4. 将 `src/package.json` 复制到 `scripts/` 并执行 `pnpm install --prod`
  5. 如有 `mcp.json` 模板，处理后复制为 `plugins/<name>/.mcp.json`

#### Scenario: Hooks 类型 Plugin 打包

- **WHEN** 打包 hooks 类型 Plugin
- **THEN** 构建脚本执行以下操作：
  1. 创建 `plugins/<name>/.claude-plugin/` 并复制 `plugin.json`
  2. 创建 `plugins/<name>/hooks/` 并复制 `hooks.json`
  3. 将脚本文件复制到 `plugins/<name>/scripts/`

#### Scenario: MCP 类型 Plugin 打包

- **WHEN** 打包 mcp 类型 Plugin
- **THEN** 构建脚本执行以下操作：
  1. 创建 `plugins/<name>/.claude-plugin/` 并复制 `plugin.json`
  2. 处理 `mcp.json` 模板并复制为 `plugins/<name>/.mcp.json`
  3. 将相关脚本和依赖复制到 Plugin 目录

### Requirement: MCP 路径替换

构建脚本 SHALL 将 MCP 配置模板中的相对路径替换为使用 `${CLAUDE_PLUGIN_ROOT}` 的路径。

#### Scenario: OCR Plugin 的 MCP 路径替换

- **WHEN** dev/ocr/mcp.json 中 command 为 `node` 且 args 包含 `./scripts/mcp-server.js`
- **THEN** 输出的 `plugins/ocr/.mcp.json` 中 args 变为 `${CLAUDE_PLUGIN_ROOT}/skills/ocr/scripts/mcp-server.js`

### Requirement: 依赖安装

构建脚本 SHALL 在 Plugin 的 scripts 目录中执行 `pnpm install --prod`，将运行时依赖安装到 Plugin 内部。

#### Scenario: 安装生产依赖

- **WHEN** 打包含有 package.json 的 Plugin
- **THEN** `plugins/<name>/skills/<name>/scripts/node_modules/` 包含所有生产依赖，不包含 devDependencies

### Requirement: 清洁构建

构建脚本 SHALL 在打包前清除旧的 Plugin 输出目录，确保每次构建产物干净。

#### Scenario: 重新构建时清除旧产物

- **WHEN** `plugins/<name>/` 目录已存在时执行构建
- **THEN** 该目录被完全删除后重新生成

### Requirement: Plugin 类型自动检测

构建脚本 SHALL 根据 dev/<name>/ 目录中的文件自动检测 Plugin 类型。

#### Scenario: 检测 skill 类型

- **WHEN** `dev/<name>/` 包含 `SKILL.md`
- **THEN** 识别为 skill 类型

#### Scenario: 检测 hooks 类型

- **WHEN** `dev/<name>/` 包含 `hooks.json` 且不包含 `SKILL.md`
- **THEN** 识别为 hooks 类型

#### Scenario: 检测 mcp 类型

- **WHEN** `dev/<name>/` 包含 `mcp.json` 且不包含 `SKILL.md` 和 `hooks.json`
- **THEN** 识别为 mcp 类型
