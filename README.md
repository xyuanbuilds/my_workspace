# OCR Skill for Claude Code

A ready-to-use OCR (Optical Character Recognition) skill for Claude Code, powered by Tesseract.js. Extract text from images and screenshots with a simple command.

[中文说明](#中文说明) | [English](#english)

---

## English

### ✨ Out-of-the-Box Ready

This skill is **pre-configured** and ready to use immediately. The `.claude/` directory contains all necessary configurations:

- **`.claude/settings.local.json`**: Pre-configured permissions and MCP server settings
- **`.claude/skills/ocr/`**: Skill definition with metadata and usage instructions
- **`.mcp.json`**: MCP server configuration for seamless integration

**No additional Claude Code configuration needed** - just build and use!

### 🚀 Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Build the project**
   ```bash
   npm run build
   ```
   This automatically copies compiled files to `.claude/skills/ocr/scripts/`

3. **Use in Claude Code**
   ```bash
   /ocr --file ./path/to/image.png
   /ocr --clipboard
   /ocr --file ./image.png --lang chi_tra
   ```

### 📦 What's Inside `.claude/`?

#### `.claude/settings.local.json`
Pre-configured project settings:
```json
{
  "permissions": {
    "allow": [
      "Bash(node:*)",
      "mcp__ocr__*"
    ]
  },
  "enableAllProjectMcpServers": true,
  "enabledMcpjsonServers": ["ocr"]
}
```

- **Pre-approved permissions** for OCR operations
- **Automatic MCP server enablement** from `.mcp.json`
- **No manual permission prompts** during usage

#### `.claude/skills/ocr/SKILL.md`
Skill metadata and instructions:
```yaml
---
name: ocr
description: Extract text from images using OCR
context: fork
allowed-tools: Bash(node *)
---
```

This file tells Claude Code:
- **What** the skill does
- **When** to suggest it (when user needs OCR)
- **How** to execute it (via Node.js)

### 🎯 Usage Examples

```bash
# English text
/ocr --file ./document.png

# Chinese text (Simplified)
/ocr --file ./screenshot.png --lang chi_sim

# Multiple languages
/ocr --file ./mixed.png --lang eng+chi_sim

# From clipboard (macOS)
/ocr --clipboard

# Japanese text from clipboard
/ocr --clipboard --lang jpn
```

### 🌍 Supported Languages

- `eng` - English
- `chi_sim` - Simplified Chinese (简体中文)
- `chi_tra` - Traditional Chinese (繁體中文)
- `jpn` - Japanese (日本語)
- `kor` - Korean (한국어)
- Multiple: `eng+chi_sim+jpn`

### 📄 Supported Image Formats

PNG, JPG/JPEG, GIF, BMP, WebP, TIFF

### 🛠️ Development

```bash
# Watch mode for development
npm run dev

# Build for production
npm run build

# Test OCR directly (without Claude Code)
npm run ocr -- ./test.png
```

### 📁 Project Structure

```
.
├── .claude/                          # Claude Code configuration
│   ├── settings.local.json           # Project settings & permissions
│   └── skills/ocr/
│       ├── SKILL.md                  # Skill definition
│       └── scripts/                  # Built skill scripts (auto-generated)
├── .mcp.json                         # MCP server configuration
├── src/                              # TypeScript source code
│   ├── cli.ts                        # CLI interface
│   ├── ocr.ts                        # OCR logic
│   └── mcp-server.ts                 # MCP server implementation
├── dist/                             # Compiled JavaScript
└── package.json
```

### 🔧 How It Works

1. **Build Process**:
   - TypeScript compiles to `dist/`
   - `npm run build` copies scripts to `.claude/skills/ocr/scripts/`

2. **Claude Code Integration**:
   - Reads skill definition from `.claude/skills/ocr/SKILL.md`
   - Applies permissions from `.claude/settings.local.json`
   - Enables MCP server from `.mcp.json`

3. **Execution**:
   - User runs `/ocr` command
   - Claude Code invokes the skill with proper context
   - Skill executes OCR and returns text

### 🎁 Why "Out-of-the-Box"?

Traditional Claude Code skills require users to:
1. ❌ Manually configure `.claude/settings.local.json`
2. ❌ Set up permissions
3. ❌ Enable MCP servers

**This skill includes everything pre-configured**:
- ✅ Permissions already defined
- ✅ MCP server already configured
- ✅ Skill metadata already written
- ✅ Build script handles file placement

Just `npm install && npm run build` and you're ready!

### 📝 License

MIT

---

## 中文说明

### ✨ 开箱即用

这个技能已经**预先配置好**，可以立即使用。`.claude/` 目录包含所有必要的配置：

- **`.claude/settings.local.json`**：预配置的权限和 MCP 服务器设置
- **`.claude/skills/ocr/`**：技能定义，包含元数据和使用说明
- **`.mcp.json`**：MCP 服务器配置，实现无缝集成

**无需额外的 Claude Code 配置** - 只需构建并使用！

### 🚀 快速开始

1. **安装依赖**
   ```bash
   npm install
   ```

2. **构建项目**
   ```bash
   npm run build
   ```
   自动将编译后的文件复制到 `.claude/skills/ocr/scripts/`

3. **在 Claude Code 中使用**
   ```bash
   /ocr --file ./path/to/image.png
   /ocr --clipboard
   /ocr --file ./image.png --lang chi_tra
   ```

### 📦 `.claude/` 目录包含什么？

#### `.claude/settings.local.json`
预配置的项目设置：
```json
{
  "permissions": {
    "allow": [
      "Bash(node:*)",
      "mcp__ocr__*"
    ]
  },
  "enableAllProjectMcpServers": true,
  "enabledMcpjsonServers": ["ocr"]
}
```

- **预批准的权限**，用于 OCR 操作
- **自动启用 MCP 服务器**（来自 `.mcp.json`）
- **使用时无需手动确认权限**

#### `.claude/skills/ocr/SKILL.md`
技能元数据和说明：
```yaml
---
name: ocr
description: Extract text from images using OCR
context: fork
allowed-tools: Bash(node *)
---
```

这个文件告诉 Claude Code：
- **功能**：技能的作用
- **时机**：何时建议使用（当用户需要 OCR 时）
- **方式**：如何执行（通过 Node.js）

### 🎯 使用示例

```bash
# 英文文本
/ocr --file ./document.png

# 中文文本（简体）
/ocr --file ./screenshot.png --lang chi_sim

# 多语言
/ocr --file ./mixed.png --lang eng+chi_sim

# 从剪贴板读取（macOS）
/ocr --clipboard

# 从剪贴板读取日文
/ocr --clipboard --lang jpn
```

### 🌍 支持的语言

- `eng` - 英语
- `chi_sim` - 简体中文
- `chi_tra` - 繁体中文
- `jpn` - 日语
- `kor` - 韩语
- 多语言：`eng+chi_sim+jpn`

### 📄 支持的图片格式

PNG, JPG/JPEG, GIF, BMP, WebP, TIFF

### 🛠️ 开发

```bash
# 开发模式（监听文件变化）
npm run dev

# 生产构建
npm run build

# 直接测试 OCR（不通过 Claude Code）
npm run ocr -- ./test.png
```

### 📁 项目结构

```
.
├── .claude/                          # Claude Code 配置
│   ├── settings.local.json           # 项目设置和权限
│   └── skills/ocr/
│       ├── SKILL.md                  # 技能定义
│       └── scripts/                  # 构建后的技能脚本（自动生成）
├── .mcp.json                         # MCP 服务器配置
├── src/                              # TypeScript 源代码
│   ├── cli.ts                        # 命令行接口
│   ├── ocr.ts                        # OCR 逻辑
│   └── mcp-server.ts                 # MCP 服务器实现
├── dist/                             # 编译后的 JavaScript
└── package.json
```

### 🔧 工作原理

1. **构建过程**：
   - TypeScript 编译到 `dist/`
   - `npm run build` 复制脚本到 `.claude/skills/ocr/scripts/`

2. **Claude Code 集成**：
   - 从 `.claude/skills/ocr/SKILL.md` 读取技能定义
   - 从 `.claude/settings.local.json` 应用权限
   - 从 `.mcp.json` 启用 MCP 服务器

3. **执行流程**：
   - 用户运行 `/ocr` 命令
   - Claude Code 调用技能并传递上下文
   - 技能执行 OCR 并返回文本

### 🎁 为什么"开箱即用"？

传统的 Claude Code 技能需要用户：
1. ❌ 手动配置 `.claude/settings.local.json`
2. ❌ 设置权限
3. ❌ 启用 MCP 服务器

**这个技能包含所有预配置**：
- ✅ 权限已定义
- ✅ MCP 服务器已配置
- ✅ 技能元数据已编写
- ✅ 构建脚本自动处理文件放置

只需 `npm install && npm run build` 即可使用！

### 📝 许可证

MIT
