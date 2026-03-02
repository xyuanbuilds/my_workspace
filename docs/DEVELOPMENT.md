# 开发指南

**最后更新**：2026-02-27  
**类型**：开发指南  
**难度**：初级 → 高级

## 快速开始

### 前置要求

- Node.js 18+
- pnpm 8+
- Git
- macOS/Linux (Windows 需要 WSL)

### 初始化项目

```bash
# 克隆仓库
git clone <repository-url>
cd my_skill

# 安装依赖
pnpm install

# 开启监视模式（开发时）
pnpm dev:ocr

# 在另一个终端，构建并同步
pnpm build
```

## 项目命令速览

```bash
# 核心命令
pnpm install          # 安装所有依赖
pnpm build            # 编译所有 Skill 并同步
pnpm sync             # 仅同步（不重新编译）

# OCR Skill 特定命令
pnpm dev:ocr          # 监视编译 OCR（开发模式）
pnpm build:ocr        # 仅编译 OCR
pnpm sync:ocr         # 仅同步 OCR
pnpm ocr:cli          # 运行 OCR CLI（快速测试）
pnpm ocr:mcp          # 启动 OCR MCP 服务器
```

## 创建新 Skill

### 步骤 1：目录结构

```bash
mkdir -p dev/my-skill/src
mkdir -p dev/my-skill/dist

cat > dev/my-skill/tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
EOF
```

### 步骤 2：实现核心模块

创建 `dev/my-skill/src/index.ts`：

```typescript
import type { SkillArgs, SkillContext, SkillResult } from "../types";

/**
 * Skill 执行入口
 *
 * @param args - 命令参数和选项
 * @param context - 执行上下文（输出、工作目录等）
 * @returns 执行结果
 */
export async function execute(
  args: SkillArgs,
  context: SkillContext,
): Promise<SkillResult> {
  const { options, args: commandArgs } = args;
  const { output } = context;

  try {
    // 你的处理逻辑
    output.write("执行中...\n");

    const result = "处理结果";

    return {
      success: true,
      message: "操作成功",
      data: {
        result: result,
      },
    };
  } catch (error) {
    output.error(`错误：${error.message}`);
    return {
      success: false,
      message: error.message,
    };
  }
}
```

### 步骤 3：创建 CLI 入口

创建 `dev/my-skill/src/cli.ts`：

```typescript
import { execute } from "./index.js";

// CLI 标准输入解析
const args = process.argv.slice(2);
const options = {};

// 简化的参数解析（根据需要扩展）
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith("--")) {
    const key = args[i].substring(2);
    options[key] = args[i + 1] || true;
    i++;
  }
}

const skillArgs = {
  command: "execute",
  options,
  args,
};

const context = {
  cwd: process.cwd(),
  output: {
    write: (text) => process.stdout.write(text),
    error: (text) => process.stderr.write(text),
    success: (text) => process.stdout.write(`✓ ${text}\n`),
  },
};

execute(skillArgs, context)
  .then((result) => {
    if (!result.success) {
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
```

### 步骤 4：创建 SKILL.md

创建 `dev/my-skill/SKILL.md`（后续复制到 `skills/my-skill/SKILL.md`）：

```markdown
---
name: my-skill
description: Your skill description
context: fork
allowed-tools: Bash(node *)
---

# My Skill

Brief description of what this skill does.

## Quick Start

\`\`\`bash
node cli.js [args]
\`\`\`

## Usage

Examples of how to use this skill.

## Parameters

- `--option1` - Description
- `--option2` - Description

## Examples

\`\`\`bash
node cli.js --option1 value
\`\`\`
```

### 步骤 5：注册同步规则

编辑 `scripts/sync-skills.js`，在 `SKILL_FILES` 中添加：

```javascript
const SKILL_FILES = {
  ocr: [...],
  'my-skill': [
    'index.js',
    'cli.js',
    'utils.js',
    // 列出所有需要同步的文件
  ]
};
```

### 步骤 6：编译并同步

```bash
# 编译 TypeScript
pnpm build

# 验证文件已到位
ls -la .claude/skills/my-skill/scripts/
ls -la skills/my-skill/scripts/
```

## OCR Skill 开发

### 当前结构

```
dev/ocr/src/
├── index.ts           # 主入口，导出 execute()
├── ocr.ts             # 核心 OCR 引擎
├── preprocessor.ts    # 图像预处理
├── clipboard.ts       # 剪贴板操作
├── cli.ts             # 命令行入口
├── mcp-server.ts      # MCP 服务器
└── utils.ts           # 工具函数
```

### 主要类型

```typescript
// SkillOptions 类型
interface SkillOptions {
  file?: string; // 图像文件路径
  clipboard?: boolean; // 从剪贴板读取
  lang?: string; // 识别语言（如 eng, chi_sim）
  preprocess?: string; // 预处理策略
  psm?: number; // 页面分割模式
  oem?: number; // OCR 引擎模式
  multiStrategy?: boolean; // 多策略识别
  enhance?: boolean; // 快捷方式：启用增强
  auto?: boolean; // 快捷方式：自动优化
}
```

### 常见任务

#### 添加新语言支持

编辑 `dev/ocr/src/ocr.ts`：

```typescript
// 在语言支持列表中添加
const supportedLanguages = {
  // 现有语言...
  jpn: "Japanese", // 添加日语
  kor: "Korean", // 添加韩语
};
```

更新 `SKILL.md` 中的支持语言列表。

#### 优化预处理

编辑 `dev/ocr/src/preprocessor.ts`：

```typescript
export async function applyPreprocess(
  imagePath: string,
  strategy: PreprocessStrategy,
): Promise<Buffer> {
  // 实现新的预处理策略
  // 返回处理后的图像 Buffer
}
```

#### 改进置信度计算

编辑 `dev/ocr/src/ocr.ts`：

```typescript
function calculateConfidence(result: TesseractResult): number {
  // 实现更好的置信度计算算法
  // 考虑单词置信度的加权平均
}
```

### 测试 OCR 功能

```bash
# 开发模式监视编译
pnpm dev:ocr

# 在另一个终端测试
pnpm ocr:cli ./test.png
pnpm ocr:cli ./test.png --auto
pnpm ocr:cli --clipboard --lang chi_sim

# 测试 MCP 服务器
pnpm ocr:mcp
```

### 调试技巧

```bash
# 启用 Node.js 调试器
node --inspect-brk dev/ocr/dist/cli.js ./image.png

# 检查编译产物
cat dev/ocr/dist/cli.js | head -50

# 查看源码映射
head -5 dev/ocr/dist/cli.js.map
```

## 代码规范

### TypeScript 风格

```typescript
// ✓ 好的例子
export interface UserOptions {
  name: string;
  age?: number; // 可选属性用 ?
}

export async function processUser(
  options: UserOptions,
  context: ExecutionContext,
): Promise<Result> {
  // 函数体
  return { success: true };
}

// ✗ 避免
function someFunc(opts): any {
  // 缺少类型注解
  // 不清晰的逻辑
}
```

### 命名约定

- **文件名**：kebab-case（`ocr.ts`, `preprocessor.ts`）
- **导出常量**：UPPER_SNAKE_CASE（`MAX_IMAGE_SIZE`）
- **导出函数**：camelCase（`recognizeImage()`, `applyPreprocess()`)
- **导出接口**：PascalCase（`SkillOptions`, `SkillResult`）
- **私有函数**：前缀 `_` 或在同一文件内（`_extractText()`)

### 错误处理

```typescript
// ✓ 好的例子
try {
  const result = await recognizeImage(imagePath);
  return { success: true, data: result };
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown error";
  output.error(`OCR failed: ${message}`);
  return { success: false, message };
}

// ✗ 避免
try {
  // 处理
} catch (e) {
  console.log(e); // 没有正确错误处理
}
```

### 日志输出

```typescript
// 使用 context.output
context.output.write("进度消息\n");
context.output.success("完成！\n");
context.output.error("错误信息\n");

// ✗ 避免直接使用 console
console.log(); // 不一致的输出处理
```

## 依赖管理

### 添加新依赖

```bash
# 添加到项目根
pnpm add package-name

# 或指定版本
pnpm add package-name@latest
```

然后在 `dev/{skill}/src/package.json` 中声明运行时依赖：

```json
{
  "dependencies": {
    "package-name": "^1.0.0"
  }
}
```

### 依赖最佳实践

1. **最小化依赖**：只添加必要的包
2. **检查大小**：使用 `npm ls` 检查依赖树
3. **定期更新**：`pnpm update` 保持依赖最新
4. **安全审计**：`pnpm audit` 检查已知漏洞

## 构建流程

### 完整构建

```bash
pnpm build
# 执行步骤：
# 1. 编译 TypeScript → JavaScript
# 2. 生成类型定义 (.d.ts)
# 3. 应用文件过滤
# 4. 同步到三个目录
```

### 增量开发

```bash
# 终端 1：监视编译
pnpm dev:ocr

# 终端 2：同步（之后编译完成时自动更新）
pnpm sync:ocr
```

### 清理和重建

```bash
# 清理编译产物
rm -rf dev/ocr/dist

# 重新构建
pnpm build:ocr

# 验证
ls -la dev/ocr/dist/
```

## 文档更新

### SKILL.md 结构

```markdown
---
name: skill-name # 必须小写
description: description # 50-100 字符最佳
context: fork # 执行上下文
allowed-tools: Bash(node *) # 允许的工具
---

# Skill Name

一句话描述。

## Quick Start

最常见的使用方式。

## Usage

详细的使用说明。

## Parameters

所有命令行参数的说明。

## Examples

实际使用示例。

## Supported Languages/Formats

支持什么语言或格式（如适用）。

## Troubleshooting

常见问题和解决方案。
```

### 保持文档同步

1. 每次更改功能时更新 SKILL.md
2. 更新参数列表和示例
3. 添加新的支持语言/格式
4. 运行 `pnpm build` 同步文档

## 测试策略

### 单元测试（推荐）

创建 `dev/ocr/src/__tests__/ocr.test.ts`：

```typescript
import { recognizeImage } from "../ocr.js";

describe("OCR", () => {
  it("should recognize text from image", async () => {
    const result = await recognizeImage("./test.png");
    expect(result.text).toContain("expected text");
  });
});
```

### 集成测试

```bash
# 手动测试各种场景
pnpm ocr:cli ./screenshot.png
pnpm ocr:cli --clipboard
pnpm ocr:cli ./chinese.jpg --lang chi_sim
```

### 性能测试

```typescript
// 在代码中添加计时
const start = performance.now();
const result = await recognizeImage(imagePath);
const elapsed = performance.now() - start;
console.log(`OCR took ${elapsed}ms`);
```

## Git 工作流

### 提交前检查

项目配置了 Git hooks（自动运行）：

```bash
git commit -m "feat: add feature description"
# hooks 会自动验证：
# - 提交消息格式
# - TypeScript 类型检查
# - 代码样式（可选）
```

### 提交消息格式

```
feat: 新功能描述
fix: 修复 bug 描述
docs: 文档更新
refactor: 代码重构
test: 测试相关
chore: 依赖或配置更新
```

### 分支策略

```bash
# 创建特性分支
git checkout -b feature/my-feature

# 开发完成后推送
git push origin feature/my-feature

# 创建 Pull Request
# 等待审查和合并
```

## 故障排除

### 编译失败

**症状**：`tsc` 报错

```bash
# 解决步骤
1. 检查 TypeScript 版本：pnpm list typescript
2. 检查 tsconfig.json
3. 清理 dist：rm -rf dev/*/dist
4. 重新编译：pnpm build
```

### 同步失败

**症状**：文件未出现在 `.claude/skills/`

```bash
# 解决步骤
1. 检查文件已编译：ls dev/ocr/dist/
2. 检查 sync-skills.js 中的文件列表
3. 强制重新同步：pnpm sync
4. 验证目录：ls -la .claude/skills/ocr/scripts/
```

### OCR 识别不准

**症状**：识别的文本错误率高

```typescript
// 尝试以下方案
1. 使用预处理：--auto 或 --enhance
2. 调整语言：--lang chi_sim（中文）
3. 尝试多策略：--multi-strategy
4. 调整 PSM：--psm 6（适合单列文本）
```

### 依赖问题

**症状**：`node_modules` 污染或不一致

```bash
# 清理和重新安装
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## 高级话题

### 自定义预处理

在 `preprocessor.ts` 中实现新策略：

```typescript
export async function customPreprocess(imagePath: string): Promise<Buffer> {
  // 读取图像
  const image = await canvas.loadImage(imagePath);
  const ctx = image.getContext("2d");

  // 自定义处理
  // ...

  return ctx.getImageData(0, 0, width, height);
}
```

### MCP 服务器扩展

在 `mcp-server.ts` 中添加新工具：

```typescript
// 定义新工具
const tools = [
  {
    name: "ocr-extract",
    description: "Extract text from image",
    inputSchema: {
      /* ... */
    },
  },
  // 添加更多工具
];

// 实现工具处理器
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "ocr-extract") {
    // 处理逻辑
  }
});
```

### 性能优化

```typescript
// 缓存语言模型（避免重复加载）
let cachedWorker = null;

export async function getOCRWorker() {
  if (!cachedWorker) {
    cachedWorker = await Tesseract.createWorker();
  }
  return cachedWorker;
}
```

## 常见问题

**Q: 如何添加新 Skill？**
A: 参考本文档的"创建新 Skill"部分。

**Q: Skill 之间能共享代码吗？**
A: 建议放在 `scripts/lib/` 中，或创建共享 package。

**Q: 如何在本地测试 MCP 服务器？**
A: 运行 `pnpm ocr:mcp`，然后在另一个终端连接测试。

**Q: 如何更新已安装的 Skill？**
A: 编辑源代码后运行 `pnpm build`，自动同步到 `.claude/skills/`。

**Q: 支持 Windows 吗？**
A: 建议使用 WSL2。Windows 原生支持有限制（特别是剪贴板功能）。

## 相关资源

- [TypeScript 文档](https://www.typescriptlang.org/docs/)
- [Node.js 文档](https://nodejs.org/docs/)
- [Tesseract.js](https://github.com/naptha/tesseract.js)
- [Model Context Protocol](https://modelcontextprotocol.io/)

---

**需要帮助？** 查看项目根目录的 README.md 或相关文档。
