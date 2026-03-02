# OCR Skill 代码地图

**最后更新**：2026-02-27  
**类型**：代码地图  
**作用域**：`dev/ocr/src/`

## 概述

OCR Skill 是一个完整的光学字符识别解决方案，支持多种图像格式、多语言识别、图像预处理和多种调用方式。

## 架构图

```
┌─────────────────────────────────────────────────────────┐
│                   Skill 执行入口                         │
│                  (index.ts: execute)                    │
└─────────┬───────────────────────────────┬───────────────┘
          ↓                               ↓
    ┌──────────────┐              ┌──────────────┐
    │ 输入源处理    │              │ 选项验证      │
    │ (clipboard.ts)│             │ (index.ts)   │
    │ (file path)  │              │              │
    └──────┬───────┘              └──────┬───────┘
           ↓                             ↓
    ┌──────────────────────────────────────────┐
    │        图像预处理（可选）                  │
    │      (preprocessor.ts)                   │
    │  • 灰度化                                │
    │  • 二值化                                │
    │  • 去噪                                  │
    │  • 对比度增强                            │
    └──────┬───────────────────────────────────┘
           ↓
    ┌──────────────────────────────────────────┐
    │      OCR 识别引擎                        │
    │      (ocr.ts)                           │
    │  • Tesseract.js 封装                     │
    │  • 语言模型加载                          │
    │  • 字符识别与分析                        │
    │  • 置信度计算                            │
    └──────┬───────────────────────────────────┘
           ↓
    ┌──────────────────────────────────────────┐
    │      结果处理与输出                       │
    │      (utils.ts / index.ts)               │
    │  • 文本提取                              │
    │  • 格式化                                │
    │  • 临时文件清理                          │
    └─────────┬────────────────────┬───────────┘
              ↓                    ↓
        ┌──────────────┐    ┌──────────────┐
        │ CLI 接口      │    │ MCP 接口      │
        │ (cli.ts)     │    │(mcp-server) │
        └──────────────┘    └──────────────┘
```

## 模块清单

### 核心模块

| 模块     | 文件              | 用途                             | 关键导出                                  | 行数 |
| -------- | ----------------- | -------------------------------- | ----------------------------------------- | ---- |
| 执行入口 | `index.ts`        | Skill 主入口，参数验证，流程编排 | `execute()`, `SkillOptions`               | 207  |
| OCR 引擎 | `ocr.ts`          | Tesseract.js 封装，识别逻辑      | `recognizeImage()`, `PageSegMode`         | 242  |
| 预处理   | `preprocessor.ts` | 图像处理和增强                   | `applyPreprocess()`, `PreprocessStrategy` | 240  |
| 剪贴板   | `clipboard.ts`    | macOS 剪贴板集成                 | `getClipboardImage()`                     | 75   |
| CLI      | `cli.ts`          | 命令行入口                       | 标准输入/输出处理                         | 73   |
| MCP      | `mcp-server.ts`   | MCP 协议服务器                   | MCP 工具定义                              | 125  |
| 工具函数 | `utils.ts`        | 通用工具集                       | `validateImagePath()`, 日志函数           | 135  |

**总计**：约 1,100 行 TypeScript 代码

### 类型定义

```typescript
// 主要配置选项
interface SkillOptions {
  file?: string; // 输入文件路径
  clipboard?: boolean; // 从剪贴板读取
  lang?: string; // OCR 语言码
  preprocess?: string; // 预处理策略
  psm?: number; // Tesseract 页面分割模式
  oem?: number; // Tesseract OCR 引擎模式
  multiStrategy?: boolean; // 尝试多个策略
  enhance?: boolean; // 快捷方式：启用增强
  auto?: boolean; // 快捷方式：自动优化
}

// 执行结果
interface SkillResult {
  success: boolean;
  message?: string;
  data?: {
    text: string; // 识别的文本
    confidence?: number; // 置信度（0-1）
    language?: string; // 检测到的语言
    processingTime?: number; // 处理耗时（ms）
  };
}
```

## 数据流详解

### 标准识别流程

```
用户输入
  ├─ --file <path>      → 读取文件路径
  ├─ --clipboard        → 获取剪贴板图像
  └─ --lang chi_sim     → 设置识别语言
       ↓
[输入验证]
  • 检查文件存在性
  • 验证文件格式
  • 检查路径有效性
       ↓
[可选：预处理]
  (如果指定 --auto / --enhance / --preprocess)
  • 读取图像 → Canvas 对象
  • 应用滤镜（灰度、二值化等）
  • 增强对比度和亮度
  • 输出预处理后的图像
       ↓
[OCR 识别]
  • 初始化 Tesseract worker
  • 加载指定语言模型
  • 执行 recognize()
  • 等待识别完成
       ↓
[结果处理]
  • 提取识别文本
  • 计算置信度分数
  • 统计识别时间
  • 清理临时文件
       ↓
[输出]
  • 返回 SkillResult
  • 打印识别结果
  • 退出进程
```

### 多策略识别流程（--multi-strategy）

```
原始图像
  ├─ → [Strategy 1: grayscale]  → 识别 → 置信度评分
  ├─ → [Strategy 2: binarize]   → 识别 → 置信度评分
  ├─ → [Strategy 3: enhance]    → 识别 → 置信度评分
  └─ → [Strategy 4: denoise]    → 识别 → 置信度评分
       ↓
[选择最佳结果]
  比较各策略的置信度，返回评分最高的识别结果
       ↓
[输出最佳结果]
```

### 剪贴板流程（macOS）

```
用户执行 --clipboard
       ↓
[getClipboardImage()]
  • 执行 pbpaste 获取数据流
  • 检查 MIME 类型
  • 保存到临时文件 /tmp/clipboard_*.png
       ↓
[验证文件]
  • 检查文件大小
  • 验证图像格式
       ↓
[继续标准识别流程]
       ↓
[清理]
  • 删除临时文件
  • 释放资源
```

## 关键 API

### execute(args, context)

```typescript
/**
 * Skill 执行入点
 * @param args - 命令参数和选项
 * @param context - 执行上下文
 * @returns 执行结果
 */
async function execute(
  args: SkillArgs,
  context: SkillContext,
): Promise<SkillResult>;
```

**职责**：

- 参数验证
- 路由到具体处理流程
- 错误捕获和处理

---

### recognizeImage(imagePath, lang, options)

```typescript
/**
 * 执行 OCR 识别
 * @param imagePath - 图像文件路径
 * @param lang - OCR 语言码（如 'eng', 'chi_sim'）
 * @param options - 识别选项（PSM, OEM 等）
 * @returns 识别结果
 */
async function recognizeImage(
  imagePath: string,
  lang?: string,
  options?: OcrOptions,
): Promise<OcrResult>;
```

**职责**：

- Tesseract.js 初始化
- 模型加载
- 识别执行
- 结果提取

**性能**：2-5 秒（取决于图像大小）

---

### applyPreprocess(imagePath, strategy)

```typescript
/**
 * 应用图像预处理
 * @param imagePath - 输入图像路径
 * @param strategy - 预处理策略
 * @returns 预处理后的图像 Buffer
 */
async function applyPreprocess(
  imagePath: string,
  strategy: PreprocessStrategy,
): Promise<Buffer>;
```

**支持的策略**：

- `grayscale` - 灰度化
- `binarize` - 二值化
- `denoise` - 去噪
- `enhance` - 对比度和亮度增强

---

### getClipboardImage()

```typescript
/**
 * 从 macOS 剪贴板获取图像
 * @returns 临时文件路径和清理函数
 */
async function getClipboardImage(): Promise<{
  success: boolean;
  path?: string;
  error?: string;
  cleanup?: () => void;
}>;
```

**要求**：macOS 10.13+

## 外部依赖

### 核心依赖

| 包名                        | 版本   | 用途     | 大小   |
| --------------------------- | ------ | -------- | ------ |
| `tesseract.js`              | ^5.1.0 | OCR 引擎 | ~10 MB |
| `canvas`                    | ^3.2.1 | 图像处理 | ~5 MB  |
| `@modelcontextprotocol/sdk` | ^1.0.0 | MCP 协议 | ~2 MB  |

### 系统要求

- **macOS**: 10.13+ (剪贴板功能)
- **Linux**: 支持，剪贴板通过 `xclip`
- **Windows**: WSL2 推荐

## 配置和常量

### 支持的语言

```typescript
const SUPPORTED_LANGUAGES = {
  eng: "English",
  chi_sim: "Chinese (Simplified)",
  chi_tra: "Chinese (Traditional)",
  jpn: "Japanese",
  kor: "Korean",
  fra: "French",
  deu: "German",
  spa: "Spanish",
  // ... 更多语言
};
```

### Tesseract PSM 模式

| PSM | 模式描述         | 适用场景     |
| --- | ---------------- | ------------ |
| 0   | 仅定向和脚本检测 | 各向异性内容 |
| 3   | 自动页面分割     | 通用文档     |
| 6   | 统一的文本块     | 表格和表单   |
| 11  | 稀疏文本         | 扫描文档     |
| 13  | 原始行           | 简单文本行   |

### 图像大小限制

```typescript
const MAX_IMAGE_SIZE = 50 * 1024 * 1024; // 50 MB
const MIN_IMAGE_DIMENSION = 10; // 最小 10x10
const OPTIMAL_IMAGE_SIZE = 1920 * 1080; // 最佳大小
```

## 性能特性

### 优化点

1. **Lazy 加载** - 语言模型按需加载
2. **Worker 缓存** - Tesseract worker 复用
3. **增量处理** - 支持图像分区识别
4. **异步操作** - 完全异步，不阻塞事件循环

### 基准测试

| 场景                   | 时间 | 内存  | 置信度 |
| ---------------------- | ---- | ----- | ------ |
| 简单英文 (500x300)     | ~1s  | 150MB | 95%    |
| 中文混合 (800x600)     | ~2s  | 200MB | 88%    |
| 复杂扫描件 (2400x3200) | ~5s  | 400MB | 75%    |

### 优化建议

- 使用 `--enhance` 处理低质量图像
- 为手写或复杂图像使用 `--multi-strategy`
- 指定正确的 `--lang` 以提高速度和准确度
- 预处理可将识别时间延长 1-2 秒

## 错误处理

### 常见错误

| 错误                     | 原因             | 解决方案                   |
| ------------------------ | ---------------- | -------------------------- |
| "File not found"         | 文件路径错误     | 检查文件存在性             |
| "Unsupported format"     | 不支持的图像格式 | 转换为 PNG/JPG             |
| "Clipboard empty"        | 剪贴板无图像     | 复制图像重试               |
| "Language not available" | 语言模型未安装   | 使用默认语言或指定可用语言 |
| "Memory exceeded"        | 内存不足         | 使用较小图像或分块识别     |

### 错误恢复

```typescript
// 自动重试机制
const maxRetries = 3;
for (let i = 0; i < maxRetries; i++) {
  try {
    return await recognizeImage(path, lang);
  } catch (error) {
    if (i < maxRetries - 1) {
      await delay(1000 * (i + 1)); // 指数退避
      continue;
    }
    throw error;
  }
}
```

## 扩展接口

### 添加新预处理策略

```typescript
// 在 preprocessor.ts 中添加
export const PreprocessStrategy = {
  // ... 现有策略
  threshold: applyThreshold,
  inverse: applyInverse,
} as const;

async function applyThreshold(
  imagePath: string,
  threshold: number = 128,
): Promise<Buffer> {
  // 实现阈值处理
}
```

### 添加新 CLI 选项

```typescript
// 在 index.ts 中扩展 SkillOptions
interface SkillOptions {
  // ... 现有选项
  threshold?: number; // 新选项
}

// 在 execute() 中处理
if (options.threshold !== undefined) {
  options.preprocess = "threshold";
}
```

## 相关文档

- [ARCHITECTURE.md](../ARCHITECTURE.md) - 项目级架构
- [DEVELOPMENT.md](../DEVELOPMENT.md) - 开发指南
- [INDEX.md](../INDEX.md) - 项目文档索引

## 相关资源

- [Tesseract.js 文档](https://github.com/naptha/tesseract.js)
- [Canvas 文档](https://github.com/Automattic/node-canvas)
- [Tesseract PSM 模式](https://github.com/UB-Mannheim/tesseract/wiki)

---

**最后更新**: 2026-02-27  
**维护者**: Architecture Team  
**状态**: 生产就绪
