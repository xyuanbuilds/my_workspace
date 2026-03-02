# Claude Code Skills 定义指南

## 概述

Claude Code Skills 是 Claude Code 插件系统的核心组件，用于为 Claude 分配特定任务和功能的能力。Skills 可以包含可执行脚本、命令、工作流和专业文档。

## 核心定义

**Skill** 是一个自包含的功能单元，包含：

- 一个 `SKILL.md` 文件（必需）- 定义 Skill 的元数据和说明
- 可选的 `scripts/` 目录 - 包含可执行脚本（Python/Bash）
- 可选的 `reference.md` - 详细文档和资源链接
- 可选的 `templates/` 目录 - 配置模板和示例文件

## 目录结构

Skills 遵循标准的目录结构：

```
skills/
├── ocr/
│   ├── SKILL.md              # 必需：Skill 的核心定义
│   ├── scripts/              # 可选：可执行脚本
│   │   ├── cli.js
│   │   └── preprocessing.js
│   └── reference.md          # 可选：详细文档
├── pdf-processor/
│   └── SKILL.md
└── code-reviewer/
    └── SKILL.md
```

## SKILL.md 文件格式

SKILL.md 文件使用 YAML frontmatter 和 Markdown 内容的组合：

### Frontmatter（必需）

```yaml
---
name: skill-name-in-lowercase
description: Detailed description
---
```

### 内容结构（推荐）

SKILL.md 应包含以下主要部分：

**Frontmatter 部分：**

```yaml
---
name: my-skill
description: What this skill does and when Claude should use it
---
```

**核心内容：**

```markdown
# Skill 名称

Skill 功能的简要概述。

## Quick Start

提供最常见的使用模式

## Workflows

### 主工作流

1. 第一步
2. 第二步
3. 第三步

## Resources

- **Scripts**: 请查看 scripts/ 来查看自动化工具
- **References**: 请查看 references/ 来查看详细文档

## Supported Languages

列出支持的语言和格式。

## Examples

提供真实的使用示例。
```

## 主要特性

### 1. **元数据定义**

- `name` - Skill 的唯一标识符（必须与目录名匹配）
  - 规则：小写字母、数字、hyphens
  - 最大长度：64 字符
- `description` - 说明 Skill 的功能和使用场景
  - 必须包含：**做什么** AND **何时使用**
  - 最大长度：1024 字符

### 2. **可执行脚本支持**

- 支持 Python 和 Bash 脚本
- 存放在 `scripts/` 目录中
- 可以包含命令行工具和自动化流程

### 3. **文档支持**

- 主文档在 SKILL.md
- 详细文档可在 `reference.md` 中定义
- 支持 Markdown 格式

### 4. **资源管理**

- 模板文件：`templates/` 目录
- 快速参考：`reference.md`
- 示例配置：可在 docs 中提供

## 在 plugin.json 中的配置

如果 Skill 是插件的一部分，在 `plugin.json` 中注册：

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "skills": "./skills/",
  "description": "插件描述"
}
```

或指定多个位置：

```json
{
  "skills": ["./skills/ocr/", "./skills/pdf-processor/"]
}
```

## 最佳实践

### 1. **清晰的命名**

- 使用 kebab-case（小写 + hyphens）
- Skill 目录名必须与 `name` 字段一致
- 名称要简洁明了

### 2. **完整的描述**

- 说明 Skill 解决什么问题
- 指出使用场景和触发条件
- 包含关键词帮助 Claude 识别何时调用

### 3. **易用的文档**

- 提供 Quick Start 示例
- 包含实际可运行的命令
- 为 scripts/ 提供清晰的说明

### 4. **资源组织**

```
skill-name/
├── SKILL.md              # 核心定义和快速开始
├── scripts/              # 可执行工具
│   ├── cli.js           # 命令行接口
│   └── utils.js         # 工具函数
└── reference.md         # 详细文档（可选）
```

## 示例：OCR Skill 参考

以下是 OCR Skill 的 SKILL.md 结构示例：

**Frontmatter：**

```yaml
---
name: ocr
description: Extract text from images using OCR. Supports English, Chinese, Japanese, Korean
---
```

**核心内容示例：**

```markdown
# OCR

Run OCR CLI directly via Node.js to extract text from images.

## Quick Start

cd skills/ocr/scripts
node cli.js ./screenshot.png
node cli.js --clipboard --lang chi_sim

## Workflows

### Image Text Extraction

1. Prepare image file (PNG, JPG, etc)
2. Run OCR CLI with language option
3. Get text output

## Supported Languages

- eng - English
- chi_sim - Simplified Chinese
- chi_tra - Traditional Chinese
- jpn - Japanese
- kor - Korean

## Resources

See scripts/ for CLI implementation.
```

## Skill 加载和验证

Claude Code 会自动：

1. 发现 `skills/` 目录中的所有 Skill
2. 读取每个 Skill 的 SKILL.md frontmatter
3. 根据 `name` 和 `description` 决定何时调用该 Skill
4. 执行相关的 scripts（如果需要）

确保你的 Skill 定义清晰准确，以便 Claude 在正确的场景下调用它。

---

**参考资源**：Claude Code 官方插件参考文档  
**最后更新**：2026年2月25日
