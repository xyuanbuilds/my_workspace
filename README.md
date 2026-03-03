# xy-plugins Workspace

**A Claude Code Plugin Marketplace repository** for developing, building, and sharing Claude Code plugins.

**Status:** Production-ready | **Last Updated:** 2026-03-03

## 🎯 Overview

xy-plugins is a monorepo that manages multiple Claude Code plugins:

- **OCR Plugin** — Extract text from images using Tesseract.js
- Plugin scaffolding tools for rapid development
- Plugin marketplace registration system

## 🚀 Quick Start

### Build All Plugins

```bash
pnpm build:all
```

### Build Specific Plugin

```bash
pnpm build:plugin ocr
```

### Test Plugin Locally

```bash
pnpm test:plugin ocr
```

### Create New Plugin

```bash
pnpm create-plugin my-skill --type skill
```

### Watch & Develop

```bash
pnpm dev ocr
```

## 📁 Directory Structure

```
xy-plugins/
├── .claude-plugin/
│   └── marketplace.json          # Marketplace registration
├── dev/
│   └── ocr/                      # OCR plugin source
│       ├── src/                  # TypeScript source
│       ├── SKILL.md              # Skill documentation
│       ├── plugin.json           # Plugin metadata
│       ├── mcp.json              # MCP server config (template)
│       └── tsconfig.json         # TypeScript config
├── plugins/                      # Built plugins (output)
│   └── ocr/                      # Compiled OCR plugin
├── templates/
│   ├── skill/                    # Skill plugin template
│   ├── hooks/                    # Hooks plugin template
│   └── mcp/                      # MCP plugin template
├── scripts/                      # Scaffolding tools
│   ├── build.js                  # Build & package plugins
│   ├── create.js                 # Create new plugins
│   ├── validate.js               # Validate plugin structure
│   ├── dev.js                    # Watch mode compilation
│   └── test-plugin.js            # Load plugin in Claude Code
├── package.json
├── tsconfig.json
└── README.md
```

## 📦 Plugins

### OCR Plugin

- **Type:** Skill
- **Location:** `dev/ocr/` (source) → `plugins/ocr/` (built)
- **Features:** Text extraction from images, clipboard support, multi-language
- **Dependencies:** tesseract.js, canvas
- **Status:** ✅ Built & validated

## 🛠️ Commands Reference

| Command         | Usage                                                | Description                       |
| --------------- | ---------------------------------------------------- | --------------------------------- |
| `build:all`     | `pnpm build:all`                                     | Build all plugins                 |
| `build:plugin`  | `pnpm build:plugin <name>`                           | Build specific plugin             |
| `create-plugin` | `pnpm create-plugin <name> --type skill\|hooks\|mcp` | Create new plugin scaffold        |
| `dev`           | `pnpm dev <name>`                                    | Watch mode TypeScript compilation |
| `test:plugin`   | `pnpm test:plugin <name>`                            | Load plugin in Claude Code        |
| `validate`      | `pnpm validate [name]`                               | Validate plugin structure         |

## 🏗️ Architecture

### Plugin Development Workflow

```
dev/<name>/src/          (TypeScript source)
    ↓ (tsc compile)
dev/<name>/dist/         (JavaScript output)
    ↓ (build.js package)
plugins/<name>/          (Production plugin)
    ├── .claude-plugin/plugin.json
    ├── skills/<name>/     (skill type)
    ├── hooks/             (hooks type)
    ├── scripts/           (compiled JS)
    └── node_modules/      (production deps)
    ↓ (test:plugin)
Claude Code (--plugin-dir)
```

### Plugin Types

1. **Skill** — Claude Code skill/tool integration
   - Requires: `SKILL.md`, `plugin.json`, `src/index.ts`
   - Output: `skills/<name>/scripts/` + SKILL.md

2. **Hooks** — Pre/post action hooks for Claude Code workflows
   - Requires: `hooks.json`, `plugin.json`
   - Output: `hooks/hooks.json` + scripts

3. **MCP** — Model Context Protocol server
   - Requires: `mcp.json`, `plugin.json`, `src/mcp-server.ts`
   - Output: `.mcp.json` + scripts

## 📖 Plugin Manifest (plugin.json)

Every plugin must include `plugin.json`:

```json
{
  "name": "ocr",
  "version": "1.0.0",
  "description": "Extract text from images using OCR",
  "author": { "name": "xyuanbuilds" },
  "keywords": ["ocr", "image-to-text"]
}
```

## 🔧 Plugin Installation

### Option 1: Temporary Load (Development)

```bash
# Load plugin for current Claude Code session
claude --plugin-dir ./plugins/ocr
```

### Option 2: Persistent (Project-Level)

Edit `.claude/settings.json`:

```json
{
  "plugins": [{ "name": "ocr", "local": "./plugins/ocr" }]
}
```

### Option 3: From Marketplace (When Published)

```bash
claude plugin install ocr@xy-plugins
```

## ✅ Validation

Before shipping, always validate:

```bash
# Validate OCR plugin
pnpm validate ocr

# Validate all built plugins
pnpm validate
```

Checks:

- ✓ `plugin.json` exists and is valid JSON
- ✓ `plugin.json` contains required fields
- ✓ Correct structure for plugin type (SKILL.md, hooks.json, etc.)
- ✓ No absolute paths in JSON files

## 📚 Documentation

- [Plugin Development Guide](docs/GUIDES/PLUGIN_DEVELOPMENT.md) — Create and build plugins
- [Architecture Design](docs/ARCHITECTURE.md) — System design and decisions
- [Marketplace Setup](docs/GUIDES/MARKETPLACE.md) — Publishing plugins to marketplace
- [Codemaps](docs/CODEMAPS/INDEX.md) — Codebase exploration guides

## 🔄 Dependencies

**Production:**

- `@modelcontextprotocol/sdk` — MCP server SDK
- `tesseract.js` — OCR engine
- `canvas` — Image processing

**Development:**

- `typescript` — TypeScript compiler
- `@types/node` — Node.js type definitions

Install all: `pnpm install`

## 📝 License

MIT

---

**Repository:** [xyuanbuilds/my_skills](https://github.com/xyuanbuilds/my_skills)  
**Maintained by:** xyuanbuilds
