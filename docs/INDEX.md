# 项目文档索引

**最后更新**：2026-02-27

欢迎来到 My Skills 项目的文档中心。这里包含了项目的完整文档和开发指南。

## 快速导航

### 核心文档

- [README.md](../README.md) - 项目概览和快速开始
- [ARCHITECTURE.md](ARCHITECTURE.md) - 项目架构和模块设计
- [DEVELOPMENT.md](DEVELOPMENT.md) - 开发指南和工作流程

### Skill 相关

- [skill.md](skill.md) - Claude Code Skills 定义指南
- [mcp.md](mcp.md) - Model Context Protocol 集成指南

### Claude Code 指南

- [basic.md](basic.md) - Claude Code 完整指南
- [items.md](items.md) - Claude Code 功能详解

### 项目规范

- [rule.md](rule.md) - 项目开发规则

## 主要 Skills

### OCR (光学字符识别)

**描述**：从截图、照片或图像文件中提取文本

**位置**：

- 源码：`dev/ocr/src/`
- 打包：`skills/ocr/scripts/`
- 说明：`skills/ocr/SKILL.md`

**主要功能**：

- 支持多种图像格式（PNG, JPG, BMP 等）
- 支持多语言识别（中文、英文、日文等）
- 支持从剪贴板读取图像（macOS）
- 内建图像预处理和增强
- 多策略识别（提升准确度）

**快速使用**：

```bash
# 从文件识别
node cli.js ./screenshot.png

# 从剪贴板识别（macOS）
node cli.js --clipboard

# 指定语言
node cli.js ./image.jpg --lang chi_sim
```

## 项目结构速览

```
my_skill/
├── dev/                          # 开发目录
│   └── ocr/                      # OCR Skill 开发
│       ├── src/                  # TypeScript 源代码
│       ├── dist/                 # 编译输出
│       └── tsconfig.json         # TS 配置
│
├── skills/                       # 打包输出目录
│   └── ocr/                      # 已打包的 OCR Skill
│
├── .claude/                      # Claude Code 读取目录
│   ├── skills/                   # Skills 副本
│   ├── agents/                   # Agent 配置
│   └── commands/                 # 自定义命令
│
├── .agents/                      # 其他 Agent 系统读取目录
│   └── skills/                   # Skills 副本
│
├── scripts/                      # 构建脚本
│   ├── sync-skills.js            # 同步脚本
│   ├── codemaps/                 # 代码地图生成
│   ├── hooks/                    # Git hooks
│   └── lib/                      # 共享库
│
└── docs/                         # 文档目录
    ├── tools/                    # 工具文档
    └── *.md                      # 各类指南
```

## 常用命令

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev:ocr              # 监视编译 OCR

# 构建
pnpm build                # 编译并同步所有 Skills
pnpm sync:ocr             # 仅同步 OCR Skill

# 运行 OCR
pnpm ocr:cli ./image.png  # CLI 模式
pnpm ocr:mcp              # MCP 服务器模式
```

## 开发工作流

1. **开发** - 在 `dev/{skill-name}/src/` 中编写 TypeScript
2. **测试** - 使用 CLI 入口进行本地测试
3. **构建** - 运行 `pnpm build` 编译并同步
4. **文档** - 更新 `SKILL.md` 和 `reference.md`
5. **提交** - Git 提交时 hooks 会自动验证

## 关键特性

### 多目录同步

构建脚本自动将 Skills 同步到三个位置：

- `skills/` - 本仓库输出目录
- `.claude/skills/` - Claude Code 读取目录
- `.agents/skills/` - 其他 Agent 系统读取目录

### TypeScript + JavaScript

- 源码用 TypeScript 编写（在 `dev/` 中）
- 编译为 JavaScript（在 `skills//scripts/` 中）
- 支持 ESM 模块格式

### 灵活的 CLI 和 MCP 入口

- **CLI 模式**：通过 Node.js 子进程调用
- **MCP 模式**：通过 Model Context Protocol 集成

## 性能指标

- 编译速度：~1-2 秒
- OCR 识别速度：~2-5 秒（取决于图像大小和内容）
- 内存占用：~200-500 MB（运行时）

## 依赖管理

本项目使用 **pnpm** 进行依赖管理。

主要依赖：

- `@modelcontextprotocol/sdk` - MCP 协议实现
- `tesseract.js` - OCR 引擎
- `canvas` - 图像处理
- `typescript` - 类型系统

## 贡献指南

参考 [DEVELOPMENT.md](DEVELOPMENT.md) 了解：

- 如何创建新 Skill
- 代码规范和最佳实践
- 测试和文档要求
- Git 工作流程

## 常见问题

**Q: 如何添加新 Skill？**
A: 参考 [DEVELOPMENT.md](DEVELOPMENT.md) 中的"创建新 Skill"部分。

**Q: 如何更新现有 Skill？**
A: 编辑 `dev/{skill-name}/src/` 中的代码，运行 `pnpm build` 重新构建。

**Q: Skills 同步后如何在 Claude Code 中使用？**
A: 在 Claude Code 中，Skills 会自动从 `.claude/skills/` 加载，无需额外配置。

## 相关链接

- [Claude Code 官方文档](https://www.anthropic.com/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [TypeScript 文档](https://www.typescriptlang.org/)

---

**需要帮助？**查看对应的文档文件或 [DEVELOPMENT.md](DEVELOPMENT.md) 中的故障排除部分。
