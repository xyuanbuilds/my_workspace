## Context

当前项目 `my_skill` 是一个 Claude Code Skills 开发工作区，核心资产：

- `dev/ocr/src/` — OCR Plugin 的 TypeScript 源码（cli.ts, mcp-server.ts, ocr.ts, preprocessor.ts 等）
- `scripts/sync-skills.js` — 自定义同步脚本，将编译产物复制到 `.claude/skills/`、`skills/`、`.agents/skills/` 三个目录
- `.mcp.json` — 配置了 OCR MCP 服务器（指向 `./dev/ocr/dist/mcp-server.js`）
- `scripts/hooks/` — 个人开发用的 hooks（git-confirmation、suggest-compact 等）
- `course/` — 学习笔记

需要重构为标准的 Claude Code Plugin Marketplace 仓库，仓库名改为 `workspace`，发布到 GitHub `xy/workspace`。

**约束**：
- 使用 pnpm 管理依赖
- 必须符合 Claude Code Plugin 官方规范
- Plugin 目录必须自包含（安装后复制到 `~/.claude/plugins/cache/`，不能引用外部文件）
- Plugin 内路径使用 `${CLAUDE_PLUGIN_ROOT}` 环境变量

## Goals / Non-Goals

**Goals:**

- 建立可复用的 Plugin Marketplace 仓库结构
- dev/ 与 plugins/ 分离：源码在 dev/，构建产物在 plugins/
- 提供脚手架工具自动化 Plugin 的创建、构建、验证
- OCR Plugin 作为首个完整迁移的 Plugin
- 支持 Skills、MCP、Hooks 三种 Plugin 类型

**Non-Goals:**

- 不做 esbuild 单文件打包（当前阶段用 node_modules 随 Plugin 发布，后续优化）
- 不构建 Web UI 或可视化管理界面
- 不做 CI/CD 自动发布流水线（后续可加）
- 不迁移个人开发 hooks 到 Plugin（个人 hooks 保留在 `.claude/settings.json`）

## Decisions

### 1. Marketplace 仓库模式（而非单 Plugin 仓库）

**选择**：一个仓库包含多个 Plugin，通过 marketplace.json 注册

**原因**：
- 用户已有多个 skill 的开发计划（OCR 只是第一个）
- 统一管理构建工具和模板，避免重复
- Anthropic 官方 `anthropics/claude-code` 也采用此模式

**替代方案**：每个 Plugin 独立仓库 —— 更标准但管理成本高，不适合个人开发者

### 2. 依赖处理策略：随 Plugin 发布 node_modules

**选择**：构建时在 Plugin 目录内运行 `pnpm install --prod`，将 node_modules 打包进 Plugin

**原因**：
- Claude Code 安装 Plugin 时只做文件复制，不运行 install
- OCR Plugin 依赖 `tesseract.js`（含 WASM worker）和 `canvas`（native addon），esbuild 打包复杂度高
- 先保证能用，后续再优化打包方式

**替代方案**：
- esbuild 单文件打包 —— `canvas` 的 native addon 无法打包，需要更复杂的处理
- 要求用户手动安装依赖 —— 体验差

**风险**：Plugin 体积较大（含 node_modules），但功能正确性优先

### 3. 构建脚本用纯 Node.js（不引入额外构建工具）

**选择**：`scripts/build.js` 用 Node.js 内置的 `fs`、`child_process` 实现

**原因**：
- 项目已有 TypeScript 编译链（tsc），构建脚本只需复制文件 + 安装依赖
- 避免引入 gulp/rollup 等额外依赖增加复杂度
- sync-skills.js 已经证明纯 Node.js 脚本足够胜任

**替代方案**：shell 脚本 —— 跨平台兼容性差

### 4. 开发态保留独立 .mcp.json 指向 dev/ 目录

**选择**：根目录 `.mcp.json` 继续指向 `./dev/ocr/dist/mcp-server.js`，Plugin 的 .mcp.json 使用 `${CLAUDE_PLUGIN_ROOT}`

**原因**：
- 开发时直接 `pnpm dev:ocr` watch 编译，MCP 服务器实时更新
- 测试 Plugin 时用 `claude --plugin-dir ./plugins/ocr` 加载完整 Plugin
- 两种模式互不干扰

### 5. Plugin 目录结构标准化

**选择**：每个 Plugin 输出到 `plugins/<name>/`，内部结构严格遵循官方规范

```
plugins/<name>/
├── .claude-plugin/
│   └── plugin.json              ← 从 dev/<name>/plugin.json 复制
├── skills/<name>/               ← 仅 skill 类型
│   ├── SKILL.md                 ← 从 dev/<name>/SKILL.md 复制
│   └── scripts/
│       ├── *.js                 ← 从 dev/<name>/dist/ 复制
│       ├── package.json         ← 运行时依赖声明
│       └── node_modules/        ← pnpm install --prod 生成
├── hooks/                       ← 仅 hooks 类型
│   └── hooks.json
├── scripts/                     ← hooks 类型的脚本
│   └── *.js
├── .mcp.json                    ← 仅 mcp 类型或含 MCP 的 skill
└── agents/                      ← 可选
```

### 6. 模板系统用目录复制 + 变量替换

**选择**：`templates/` 下放完整的 Plugin 骨架，`create.js` 复制并替换 `{{name}}`、`{{description}}` 等占位符

**原因**：简单直接，不需要模板引擎依赖

## Risks / Trade-offs

- **[node_modules 体积大]** → 当前阶段接受，后续迁移到 esbuild 打包。对于不含 native addon 的 Plugin 可以优先支持打包。
- **[native addon 跨平台]** → `canvas` 的 native binding 在 Plugin 安装端可能不兼容目标平台 → OCR Plugin 的 canvas 预处理功能可能在部分用户环境不可用，需在 SKILL.md 中说明系统要求。
- **[Marketplace 缓存机制]** → 修改 Plugin 后必须更新 plugin.json 的 version 字段，否则用户看不到更新 → build.js 在构建时自动校验版本号变更。
- **[旧结构移除]** → 移除 sync 系统是 breaking change → 一次性完成迁移，不维护兼容层。
