# 项目架构文档

**最后更新**：2026-02-27  
**类型**：系统架构

## 项目概述

**My Skills** 是一个 Claude Code Skills 开发框架和管理系统，用于创建、测试和部署可在 Claude Code 环境中使用的技能模块。

```
┌─────────────────────────────────────────────────────────────┐
│                     Claude Code Skills                       │
│                     Development Framework                    │
└─────────────────────────────────────────────────────────────┘
         ↓        ↓        ↓         ↓         ↓
    ┌────────────────────────────────────────────────┐
    │  Skill Development Environment                  │
    ├────────────────────────────────────────────────┤
    │ • TypeScript 编写                              │
    │ • 原生 Node.js 运行时                          │
    │ • ESM 模块系统                                 │
    └────────────────────────────────────────────────┘
         ↓        ↓        ↓         ↓         ↓
    ┌──────┬──────┬──────┬──────┬──────────────┐
    │ CLI  │ MCP  │ Doc  │ Type │ Preprocess   │
    │Entry │Entry │ meta │ Def  │ & Utils      │
    └──────┴──────┴──────┴──────┴──────────────┘
         ↓        ↓        ↓         ↓         ↓
    ┌────────────────────────────────────────────────┐
    │  Build & Sync System                           │
    ├────────────────────────────────────────────────┤
    │ • TypeScript → JavaScript 编译                 │
    │ • 多目录智能同步                               │
    │ • 文件过滤和打包                               │
    └────────────────────────────────────────────────┘
         ↓        ↓        ↓         ↓         ↓
    ┌─────────────┬──────────────┬───────────────┐
    │  .claude/   │  .agents/    │   skills/     │
    │   skills    │   skills     │  (secondary)  │
    │  (Primary)  │  (Optional)  │               │
    └─────────────┴──────────────┴───────────────┘
```

## 核心组件

### 1. 开发层 (`dev/`)

开发层是 Skills 的源代码仓库。

```
dev/
├── ocr/                          # OCR Skill 源代码
│   ├── src/
│   │   ├── index.ts              # 模块入口，导出 execute() 函数
│   │   ├── ocr.ts                # 核心 OCR 引擎封装
│   │   ├── preprocessor.ts       # 图像预处理模块
│   │   ├── clipboard.ts          # 剪贴板操作
│   │   ├── cli.ts                # CLI 命令行入口
│   │   ├── mcp-server.ts         # MCP 服务器入口
│   │   └── utils.ts              # 工具函数
│   │
│   ├── dist/                     # TypeScript 编译输出
│   │   └── *.js                  # 编译后的 JavaScript
│   │
│   └── tsconfig.json             # TypeScript 编译配置
│
└── tsconfig.json                 # 工作区根配置
```

**关键文件说明**：

| 文件              | 用途         | 导出接口                                |
| ----------------- | ------------ | --------------------------------------- |
| `index.ts`        | 主入口       | `execute(args, context): SkillResult`   |
| `cli.ts`          | 命令行入口   | 标准输入解析和输出                      |
| `mcp-server.ts`   | MCP 协议入口 | MCP 工具定义和处理器                    |
| `ocr.ts`          | OCR 核心逻辑 | `recognizeImage(), PageSegMode`         |
| `preprocessor.ts` | 图像预处理   | `PreprocessStrategy, applyPreprocess()` |
| `clipboard.ts`    | 剪贴板集成   | `getClipboardImage()`                   |
| `utils.ts`        | 通用工具     | 路径处理、日志、错误处理                |

### 2. 构建层 (`scripts/`)

构建层负责编译和同步 Skills。

```
scripts/
├── sync-skills.js                # 核心同步脚本
│   • 读取任何编译的 Skill
│   • 应用文件过滤规则
│   • 同步到多个目标目录
│   • 支持指定 Skill 同步（增量）
│
├── codemaps/                     # 代码地图生成
│   └── generate.ts               # 从代码生成文档
│
├── hooks/                        # Git hooks
│   ├── pre-commit                # 提交前检查
│   └── commit-msg                # 提交消息验证
│
└── lib/                          # 共享工具库
    └── *.js                      # 构建辅助函数
```

**同步流程**：

```
dev/ocr/dist/
    ↓
[文件过滤] → 仅同步 SKILL_FILES 中定义的文件
    ↓
[mkdir -p]
    ↓
┌────────────────────────────────────┐
├ skills/ocr/scripts/                │
├ .claude/skills/ocr/scripts/        │
├ .agents/skills/ocr/scripts/        │
└────────────────────────────────────┘
```

### 3. 打包层 (`skills/`)

打包层是 Skill 的最终分发形式，与 Claude Code 集成。

```
skills/
├── ocr/
│   ├── SKILL.md                  # Skill 元数据和文档
│   └── scripts/
│       ├── package.json          # 运行时依赖声明
│       ├── cli.js                # 编译后的 CLI 入口
│       ├── ocr.js                # 核心模块
│       ├── preprocessor.js       # 预处理模块
│       ├── utils.js              # 工具模块
│       ├── clipboard.js          # 剪贴板模块
│       └── node_modules/         # 运行时依赖（首次运行安装）
│
└── {future-skills}/
```

## 关键设计模式

### 1. 双目录同步

| 目录              | 用途                    | 优先级 |
| ----------------- | ----------------------- | ------ |
| `.claude/skills/` | Claude Code 主读取目录  | 主要   |
| `.agents/skills/` | 其他 Agent 系统读取目录 | 辅助   |
| `skills/`         | 本仓库副本（版本控制）  | 备份   |

**优势**：

- Claude Code 读取专属目录，避免污染其他系统
- 多系统兼容性
- 版本历史保留

### 2. 三入口模式

每个 Skill 提供三种调用方式：

```
┌──────────────────────────┐
│   Skill 核心模块          │
│   (index.ts)             │
└──────────────────────────┘
    ↓      ↓       ↓
┌────┐ ┌────┐  ┌────────┐
│CLI │ │MCP │  │Library │
└────┘ └────┘  └────────┘
```

- **CLI 模式** (`cli.ts`)：通过 `node scripts/cli.js` 调用
- **MCP 模式** (`mcp-server.ts`)：通过 MCP 协议调用
- **Library 模式** (`index.ts`)：直接 import 使用

### 3. 配置驱动的同步

```javascript
// scripts/sync-skills.js
const SKILL_FILES = {
  ocr: ["ocr.js", "preprocessor.js", "clipboard.js", "cli.js", "utils.js"],
  // 其他 Skill 可在此添加
};
```

**优势**：

- 精确控制打包内容
- 减少文件大小
- 避免编译产物污染

## 数据流

### OCR Skill 执行流程

```
输入源
  ├─ 文件路径
  └─ 剪贴板 (macOS)
      ↓
  [getClipboardImage() / readFile()]
      ↓
  [转为临时文件]
      ↓
  [验证文件格式]
      ↓
  [预处理] (可选)
      ├─ 灰度化
      ├─ 二值化
      ├─ 去噪
      └─ 对比度增强
      ↓
  [OCR 识别]
      ├─ Tesseract.js 引擎
      ├─ 语言模型加载
      └─ 字符识别
      ↓
  [结果处理]
      ├─ 文本提取
      ├─ 置信度计算
      └─ 清理和格式化
      ↓
输出结果
  ├─ 识别文本
  ├─ 置信度分数
  └─ 元数据
```

## 接口定义

### Skill 执行接口

```typescript
// 在 dev/ocr/src/index.ts 中定义
interface SkillArgs {
  command: string;
  options: SkillOptions;
  args: string[];
}

interface SkillContext {
  cwd: string;
  output: {
    write: (text: string) => void;
    error: (text: string) => void;
    success: (text: string) => void;
  };
}

interface SkillResult {
  success: boolean;
  message?: string;
  data?: {
    text: string;
    confidence?: number;
  };
}

export async function execute(
  args: SkillArgs,
  context: SkillContext,
): Promise<SkillResult>;
```

### MCP 工具接口

MCP 服务器暴露的工具定义：

```typescript
{
  name: "ocr",
  description: "Extract text from images",
  inputSchema: {
    type: "object",
    properties: {
      file: { type: "string" },
      clipboard: { type: "boolean" },
      lang: { type: "string" }
    }
  }
}
```

## 依赖管理

### 顶级依赖（项目根）

```json
{
  "@modelcontextprotocol/sdk": "^1.0.0", // MCP 协议
  "canvas": "^3.2.1", // 图像处理
  "tesseract.js": "^5.1.0" // OCR 引擎
}
```

### 运行时依赖（Skill/scripts/package.json）

```json
// skills/ocr/scripts/package.json
{
  "dependencies": {
    // 从根 package.json 复制关键依赖
    // 首次运行时自动安装
  }
}
```

## 编译流程

```
dev/ocr/src/*.ts
    ↓
[TypeScript 编译器]
    ↓ (tsconfig.json 配置)
    ├─ 目标: ES2020
    ├─ 模块: ESM
    ├─ 输出: dev/ocr/dist/
    └─ 生成: *.js + *.d.ts + *.js.map
    ↓
dev/ocr/dist/*.js
    ↓ [同步脚本]
    ├─ 应用 SKILL_FILES 过滤
    ├─ 创建目标目录
    └─ 复制文件
    ↓
skills/ocr/scripts/
.claude/skills/ocr/scripts/
.agents/skills/ocr/scripts/
```

## 文件组织原则

| 文件/目录    | 位置                | 目的   | 版本控制 |
| ------------ | ------------------- | ------ | -------- |
| 源代码       | `dev/*/src/`        | 开发   | ✓ 追踪   |
| 编译产物     | `dev/*/dist/`       | 中间体 | ✗ 忽略   |
| 打包文件     | `skills/*/scripts/` | 分发   | ✓ 追踪   |
| SKILL.md     | `skills/*/`         | 文档   | ✓ 追踪   |
| node_modules | 各层                | 依赖   | ✗ 忽略   |
| 测试文件     | `dev/*/`            | 测试   | ✓ 追踪   |

## 扩展性设计

### 添加新 Skill

步骤：

1. 在 `dev/` 创建新目录
2. 实现 `execute()` 函数
3. 在 `scripts/sync-skills.js` 中注册文件列表
4. 编写 `SKILL.md` 文档
5. 运行 `pnpm build` 同步

### 多入口支持

Skill 可同时提供多种调用方式：

```
skill-name/scripts/
├── cli.js          ← 命令行入口
├── mcp-server.js   ← MCP 协议入口
├── index.js        ← 库调用入口
└── package.json    ← 依赖声明
```

## 性能特性

### 编译优化

- 增量编译支持（`tsc --watch`）
- TypeScript 5.3+ 快速编译
- 内联 Source Maps 便于调试

### 同步优化

- 文件级增量同步
- 只同步必要文件（减少空间占用）
- 并行目录同步

### 运行时优化

- ESM 模块懒加载
- 按需加载语言模型（OCR）
- 内存管理和临时文件清理

## 故障恢复

### 构建失败

```bash
# 清理和重建
rm -rf dev/*/dist
pnpm build
```

### 同步失败

```bash
# 强制重新同步
pnpm sync
```

### 依赖冲突

```bash
# 重新安装
rm -rf node_modules
pnpm install
```

## 安全性考虑

1. **代码审查**：所有 Skill 在打包前必须审查
2. **依赖审计**：定期检查依赖的安全更新
3. **权限控制**：Skill 的权限在 SKILL.md 中声明
4. **沙箱隔离**：每个 Skill 独立的 node_modules

---

**相关文档**：

- [DEVELOPMENT.md](DEVELOPMENT.md) - 开发指南
- [README.md](../README.md) - 项目概览
