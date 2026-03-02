# My Skills

用于开发和管理 Claude Code Skill 的工作区。这是一个完整的 Claude Code Skills 开发框架，用于创建、测试和部署可在 Claude Code 环境中使用的技能模块。

**快速链接**：[项目文档](docs/INDEX.md) | [架构](docs/ARCHITECTURE.md) | [开发指南](docs/DEVELOPMENT.md) | [代码地图](docs/CODEMAPS/INDEX.md)

## 功能亮点

✨ **现已实现**：

- ✅ OCR Skill - 支持图像文字识别（多语言、预处理、剪贴板）
- ✅ 三入口模式 - CLI / MCP / Library 调用
- ✅ 自动同步系统 - 支持多目录同步到 Claude Code
- ✅ TypeScript 开发 - 完整的类型系统和构建工具链
- ✅ Git Hooks - 自动化提交前检查
- ✅ 完整文档 - 架构、开发指南、代码地图

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

## 当前 Skills

### OCR - 光学字符识别

从截图、照片或图像文件中提取文本。

**功能**：

- 多种图像格式支持（PNG, JPG, BMP 等）
- 多语言识别（中文、英文、日文、韩文等）
- 从剪贴板读取图像（macOS）
- 图像预处理和增强（灰度化、二值化、去噪、对比度增强）
- 多策略识别（提升准确度）

**位置**：`dev/ocr/src/` (源码) | `skills/ocr/scripts/` (打包)

**使用示例**：

```bash
node scripts/cli.js ./screenshot.png --lang chi_sim
node scripts/cli.js --clipboard --auto
```

详见 [OCR 代码地图](docs/CODEMAPS/ocr.md)

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

### 核心命令

```bash
# 安装依赖
pnpm install

# 编译并同步所有 Skill
pnpm build

# 仅同步（不重新编译）
pnpm sync

# 监视模式开发（自动重新编译）
pnpm dev:ocr
```

### OCR Skill 特定命令

```bash
# 构建 OCR Skill
pnpm build:ocr

# 同步 OCR Skill
pnpm sync:ocr

# CLI 快速测试
pnpm ocr:cli ./image.png
pnpm ocr:cli --clipboard --lang chi_sim

# MCP 服务器（用于集成测试）
pnpm ocr:mcp
```

### 示例用法

```bash
# 从文件识别文本
pnpm ocr:cli ./screenshot.png

# 从剪贴板识别（macOS）
pnpm ocr:cli --clipboard

# 指定语言识别
pnpm ocr:cli ./image.jpg --lang chi_sim

# 启用自动预处理
pnpm ocr:cli ./document.png --auto

# 多策略识别（提升准确度）
pnpm ocr:cli ./complex.png --multi-strategy
```
