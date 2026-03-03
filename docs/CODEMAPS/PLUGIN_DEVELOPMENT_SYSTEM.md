# Plugin Development System Codemap

**Last Updated:** 2026-03-03  
**Locations:** `dev/`, `templates/`, `plugins/` | **Entry Points:** Plugin source directories | **Audiences:** Plugin developers

## Overview

The Plugin Development System encompasses the entire pipeline from source code to distribution-ready plugins. It includes source directories, templates for scaffolding, and compiled output.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│           Plugin Development System (3 Layers)             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Layer 1: DEVELOPMENT (dev/)                               │
│  ────────────────────────                                  │
│  · TypeScript source code                                  │
│  · Full type safety                                        │
│  · Development dependencies                                │
│                                                             │
│  ┌─ dev/ocr/                                              │
│  │  ├─ src/                 (TypeScript)                  │
│  │  │  ├─ index.ts                                        │
│  │  │  ├─ cli.ts                                          │
│  │  │  └─ package.json      (runtime deps)               │
│  │  ├─ dist/                (compiled, generated)         │
│  │  │  └─ *.js                                            │
│  │  ├─ SKILL.md             (documentation)              │
│  │  ├─ plugin.json          (metadata)                   │
│  │  ├─ mcp.json             (MCP config, optional)       │
│  │  └─ tsconfig.json                                     │
│  └─ ...other plugins                                     │
│                                                            │
│  ⬇️  [build.js compilation]                                │
│                                                            │
│  Layer 2: SCAFFOLDING TEMPLATES (templates/)              │
│  ───────────────────────────────────                      │
│  · Reusable project skeletons                             │
│  · Placeholder substitution                               │
│  · Used by create.js                                      │
│                                                            │
│  ┌─ templates/skill/        (skill template)             │
│  │  ├─ src/index.ts         (with {{name}} placeholders) │
│  │  ├─ src/cli.ts                                        │
│  │  ├─ src/package.json     (dependencies template)      │
│  │  ├─ SKILL.md             (frontmatter template)       │
│  │  ├─ plugin.json          (metadata template)          │
│  │  └─ tsconfig.json                                     │
│  ├─ templates/hooks/        (hooks template)             │
│  │  ├─ hooks.json           (with ${CLAUDE_PLUGIN_ROOT})│
│  │  ├─ scripts/example.js                                │
│  │  └─ plugin.json                                       │
│  └─ templates/mcp/          (MCP template)               │
│     ├─ src/mcp-server.ts    (with {{name}})             │
│     ├─ mcp.json             (with ${CLAUDE_PLUGIN_ROOT})│
│     ├─ plugin.json                                       │
│     └─ tsconfig.json                                     │
│                                                            │
│  ⬇️  [build.js packaging]                                  │
│                                                            │
│  Layer 3: DISTRIBUTION (plugins/)                         │
│  ─────────────────────────────                            │
│  · Self-contained production plugins                      │
│  · No TypeScript source                                   │
│  · All dependencies bundled                               │
│  · Ready for Claude Code installation                    │
│                                                            │
│  ┌─ plugins/ocr/                                         │
│  │  ├─ .claude-plugin/plugin.json                       │
│  │  ├─ skills/ocr/                                      │
│  │  │  ├─ SKILL.md                                      │
│  │  │  └─ scripts/                                      │
│  │  │     ├─ cli.js                                     │
│  │  │     ├─ ocr.js                                     │
│  │  │     ├─ package.json                               │
│  │  │     └─ node_modules/            (pnpm install)   │
│  │  └─ .mcp.json            (${CLAUDE_PLUGIN_ROOT})    │
│  │                                                       │
│  └─ plugins/<name>/                                     │
│     (other built plugins follow same structure)         │
│                                                            │
└─────────────────────────────────────────────────────────────┘
```

## Plugin Types

### 1. Skill Plugin

**Purpose:** Provide tools/functions to Claude Code

**Source Structure:**

```
dev/<name>/
├── src/
│   ├── index.ts           Main module export
│   ├── cli.ts             CLI entry point
│   └── package.json       Runtime dependencies
├── SKILL.md               Documentation with frontmatter
├── plugin.json            Plugin metadata
├── mcp.json               (optional) MCP configuration
└── tsconfig.json
```

**Build Output:**

```
plugins/<name>/
├── .claude-plugin/plugin.json
├── skills/<name>/
│   ├── SKILL.md
│   └── scripts/
│       ├── *.js
│       ├── package.json
│       └── node_modules/
├── .mcp.json              (if mcp.json existed)
```

**SKILL.md Frontmatter:**

```yaml
---
name: ocr # Must match plugin name
description: "..." # One-liner description
context: fork # fork | inline (default: inline)
allowed-tools: "Bash(node *)" # Optional tool restrictions
---
```

### 2. Hooks Plugin

**Purpose:** Intercept Claude Code workflows

**Source Structure:**

```
dev/<name>/
├── hooks.json              Hook definitions
├── scripts/
│   └── *.js               Hook implementations
├── plugin.json            Plugin metadata
└── tsconfig.json
```

**hooks.json Format:**

```json
{
  "hooks": [
    {
      "matcher": "PreToolUse|PostToolUse|Stop",
      "hooks": [
        {
          "type": "command",
          "command": "${CLAUDE_PLUGIN_ROOT}/scripts/*.js"
        }
      ]
    }
  ]
}
```

**Build Output:**

```
plugins/<name>/
├── .claude-plugin/plugin.json
├── hooks/hooks.json
└── scripts/
    └── *.js
```

### 3. MCP Plugin

**Purpose:** Model Context Protocol server

**Source Structure:**

```
dev/<name>/
├── src/
│   ├── mcp-server.ts      MCP server implementation
│   └── package.json       Runtime dependencies
├── mcp.json               MCP configuration
├── plugin.json            Plugin metadata
└── tsconfig.json
```

**mcp.json Format:**

```json
{
  "mcpServers": {
    "<name>": {
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/scripts/mcp-server.js"]
    }
  }
}
```

**Build Output:**

```
plugins/<name>/
├── .claude-plugin/plugin.json
├── .mcp.json              (with ${CLAUDE_PLUGIN_ROOT})
├── scripts/
│   ├── mcp-server.js
│   ├── package.json
│   └── node_modules/
```

## Key Modules

| Component              | File/Dir           | Purpose                                 |
| ---------------------- | ------------------ | --------------------------------------- |
| **Skill Template**     | `templates/skill/` | Scaffold for skill plugins              |
| **Hooks Template**     | `templates/hooks/` | Scaffold for hooks plugins              |
| **MCP Template**       | `templates/mcp/`   | Scaffold for MCP plugins                |
| **OCR Plugin (Skill)** | `dev/ocr/`         | Example skill plugin implementation     |
| **Built OCR**          | `plugins/ocr/`     | Compiled OCR plugin ready to distribute |

## Data Flow

### Development Workflow

```
Developer edits Source
(dev/ocr/src/)
        │
        ▼
pnpm dev ocr          (watch mode)
        │
        ├─→ tsc --watch
        │   └─ Continuously compiles to dev/ocr/dist/
        │
        └─→ Developer tests changes

When ready to release:
        │
        ▼
pnpm build:plugin ocr  (full build)
        │
        ├─→ tsc             (compile once)
        ├─→ Clean output    (remove plugins/ocr)
        ├─→ Package files   (copy to plugins/ocr)
        ├─→ Install deps    (pnpm install --prod)
        │
        └─→ Output: plugins/ocr/ ✓

pnpm validate ocr      (check structure)
        │
        └─→ ✅ All checks pass

pnpm test:plugin ocr   (test in Claude Code)
        │
        ├─→ claude --plugin-dir ./plugins/ocr
        │
        └─→ Plugin loads successfully ✓

Ready to publish!
```

### Template Scaffolding Flow

```
Developer requests:
pnpm create-plugin my-tool --type skill
        │
        ▼
Load Template
templates/skill/**/*
        │
        ▼
For each file:
  ├─ Read file
  ├─ Replace {{name}} → "my-tool"
  ├─ Replace {{description}} → "A Claude Code plugin"
  └─ Write to dev/my-tool/
        │
        ▼
Output: dev/my-tool/ with scaffolded structure
        │
        └─→ Ready for editing!
```

### Path Variable Replacement

During build, paths containing relative references are converted to use `${CLAUDE_PLUGIN_ROOT}`:

**Before (dev/ocr/mcp.json):**

```json
{
  "mcpServers": {
    "ocr": {
      "args": ["${CLAUDE_PLUGIN_ROOT}/skills/ocr/scripts/mcp-server.js"]
    }
  }
}
```

**After (plugins/ocr/.mcp.json):**

```json
{
  "mcpServers": {
    "ocr": {
      "args": ["${CLAUDE_PLUGIN_ROOT}/skills/ocr/scripts/mcp-server.js"]
    }
  }
}
```

Environment variable ensures portability — plugin can be installed anywhere.

## Dependency Management

### Source (dev/)

```
dev/ocr/package.json       Root dependencies
                          ├─ @types/node (dev only)
                          └─ typescript (dev only)

dev/ocr/src/package.json   Runtime dependencies
                          ├─ tesseract.js
                          └─ canvas
```

### Built (plugins/)

```
plugins/ocr/skills/ocr/scripts/package.json
                          └─ node_modules/          (pnpm install --prod)
                             ├─ tesseract.js
                             ├─ canvas
                             └─ [all deps recursively]
```

**Note:** TypeScript and @types/\* are NOT included in plugin distribution (dev only).

## Related Areas

- [Scaffolding Tools](SCAFFOLDING_TOOLS.md) — build.js, create.js, validate.js
- [OCR Plugin (Deep Dive)](OCR_PLUGIN.md) — Detailed example
- [Marketplace & Configuration](MARKETPLACE_CONFIG.md) — Distribution config

---

**Last Updated:** 2026-03-03 | Auto-generated from source
