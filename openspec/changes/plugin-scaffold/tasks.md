## 1. 仓库结构重组

- [ ] 1.1 创建 `.claude-plugin/` 目录和 `marketplace.json` 文件（name: xy-plugins, plugins 数组先包含 ocr）
- [ ] 1.2 创建 `plugins/` 目录，添加 `plugins/` 到 `.gitignore`
- [ ] 1.3 创建 `templates/` 目录结构（skill/、hooks/、mcp/）
- [ ] 1.4 移除 `scripts/sync-skills.js`
- [ ] 1.5 移除旧同步目标目录 `skills/`、`.claude/skills/`、`.agents/skills/`

## 2. OCR Plugin 开发目录适配

- [ ] 2.1 在 `dev/ocr/` 下创建 `plugin.json`（name: ocr, version, description, author, keywords）
- [ ] 2.2 在 `dev/ocr/` 下创建 `mcp.json` 模板，command args 使用 `${CLAUDE_PLUGIN_ROOT}/skills/ocr/scripts/mcp-server.js`
- [ ] 2.3 确认 `dev/ocr/SKILL.md` 存在且 frontmatter 格式正确（name, description）；不存在则从旧 `skills/ocr/SKILL.md` 复制
- [ ] 2.4 确认 `dev/ocr/src/package.json` 包含正确的生产依赖声明

## 3. 构建脚本（scripts/build.js）

- [ ] 3.1 实现 Plugin 类型自动检测逻辑（根据 SKILL.md / hooks.json / mcp.json 判断）
- [ ] 3.2 实现清洁构建：删除旧的 `plugins/<name>/` 目录
- [ ] 3.3 实现 TypeScript 编译：调用 `tsc -p dev/<name>/tsconfig.json`
- [ ] 3.4 实现 skill 类型打包：创建标准目录结构，复制 plugin.json、SKILL.md、JS 文件
- [ ] 3.5 实现 hooks 类型打包：复制 plugin.json、hooks.json、scripts/
- [ ] 3.6 实现 mcp 类型打包：复制 plugin.json、处理 mcp.json 路径替换
- [ ] 3.7 实现依赖安装：在 scripts/ 目录中执行 `pnpm install --prod`
- [ ] 3.8 支持 `--name <name>` 参数构建单个 Plugin，无参数时构建全部

## 4. 创建脚本（scripts/create.js）

- [ ] 4.1 实现参数解析：`<name>` 和 `--type skill|hooks|mcp`
- [ ] 4.2 实现名称冲突检测：`dev/<name>/` 已存在时报错退出
- [ ] 4.3 实现模板复制和占位符替换（`{{name}}`、`{{description}}`）
- [ ] 4.4 创建完成后输出下一步提示信息

## 5. 验证脚本（scripts/validate.js）

- [ ] 5.1 检查 `.claude-plugin/plugin.json` 存在且 JSON 合法
- [ ] 5.2 检查 plugin.json 包含 name 字段
- [ ] 5.3 检查 skill 类型有 `skills/<name>/SKILL.md`
- [ ] 5.4 检查 hooks 类型有 `hooks/hooks.json`
- [ ] 5.5 检查路径中不含绝对路径（扫描 JSON 文件中的 `/Users/` 等模式）
- [ ] 5.6 输出验证结果摘要（通过/失败 + 详情）

## 6. Plugin 模板文件

- [ ] 6.1 创建 `templates/skill/` 模板：src/index.ts、src/cli.ts、SKILL.md、plugin.json、tsconfig.json、package.json
- [ ] 6.2 创建 `templates/hooks/` 模板：hooks.json、scripts/example.js、plugin.json
- [ ] 6.3 创建 `templates/mcp/` 模板：src/mcp-server.ts、mcp.json、plugin.json、tsconfig.json、package.json

## 7. package.json 和配置更新

- [ ] 7.1 更新根目录 `package.json` 的 scripts：添加 create-plugin、build:plugin、build:all、validate、test:plugin、dev 命令
- [ ] 7.2 移除旧的 sync、sync:ocr、build（含 sync 的旧版）命令
- [ ] 7.3 保留 build:ocr（改为仅 tsc 编译）和 dev:ocr（watch 模式）
- [ ] 7.4 更新 `.gitignore` 添加 `plugins/`

## 8. 验证与测试

- [ ] 8.1 执行 `pnpm build:plugin ocr` 验证 OCR Plugin 构建成功
- [ ] 8.2 执行 `pnpm validate ocr` 验证 Plugin 结构合规
- [ ] 8.3 用 `claude --plugin-dir ./plugins/ocr` 验证 Plugin 可加载
- [ ] 8.4 执行 `pnpm create-plugin test-skill --type skill` 验证脚手架创建功能，然后删除测试产物
