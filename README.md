# My Skills

用于开发和管理 Claude Code Skill 的工作区。

## 项目结构

```
my_skill/
├── dev/                          # 开发目录
│   └── {skill-name}/             # 单个 Skill 的开发目录
│       ├── src/                  # TypeScript 源代码
│       │   ├── index.ts          # 模块入口
│       │   ├── cli.ts            # CLI 入口
│       │   ├── mcp-server.ts     # MCP 服务器
│       │   ├── package.json      # scripts 依赖声明
│       │   └── ...               # 其他业务模块
│       ├── dist/                 # 编译输出（自动生成，勿手动修改）
│       ├── SKILL.md              # Skill 说明文档
│       ├── CLAUDE.md             # 开发指南
│       └── tsconfig.json         # TypeScript 编译配置
│
├── skills/                       # 打包输出目录（sync 产物）
│   └── {skill-name}/
│       ├── SKILL.md
│       └── scripts/              # 编译后的 JS 文件及依赖配置
│           ├── package.json
│           └── *.js
│
├── scripts/
│   └── sync-skills.js            # 构建产物同步脚本
├── package.json
└── tsconfig.json
```

sync 脚本会将产物同步至以下三个目录，结构相同：

- `skills/` — 本仓库的输出目录
- `.claude/skills/` — Claude Code 读取目录
- `.agents/skills/` — 其他 Agent 系统读取目录

## Skill 的基本组成

每个 Skill 由以下部分构成：

### `SKILL.md`
面向 Agent 的说明文档，描述该 Skill 的用途、调用方式和参数说明。Agent 通过读取此文件了解如何使用该 Skill。

### `scripts/`
运行时所需的编译产物目录，包含：

- 各业务逻辑模块（`*.js`）
- `cli.js` — 命令行入口，供 Agent 通过子进程调用
- `mcp-server.js` — （可选）MCP 服务器入口，供支持 MCP 协议的 Agent 调用
- `package.json` — 声明运行时依赖，安装后生成 `node_modules/`

## 常用命令

```bash
# 编译并同步所有 Skill
pnpm build

# 仅同步（不重新编译）
pnpm sync

# 同步指定 Skill
pnpm sync:ocr

# 监视模式开发
pnpm dev:ocr
```
