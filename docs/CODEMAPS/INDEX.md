# Codemaps Index

**Last Updated:** 2026-03-03

## Overview

Codemaps are structured guides to understanding different areas of the codebase. Each map includes architecture diagrams, key modules, data flow, and related documentation.

## Available Codemaps

### 📋 [Scaffolding Tools](SCAFFOLDING_TOOLS.md)

- Location: `scripts/`
- Purpose: Build pipeline, plugin creation, validation, testing
- Key Files: `build.js`, `create.js`, `validate.js`, `dev.js`, `test-plugin.js`
- Entry Points: CLI commands in `package.json`

### 🏗️ [Plugin Development System](PLUGIN_DEVELOPMENT_SYSTEM.md)

- Location: `dev/`, `templates/`, `plugins/`
- Purpose: Plugin source, templates, and compiled output
- Key Modules: Plugin types (skill, hooks, mcp)
- Data Flow: Development → Building → Distribution

### 🛍️ [OCR Plugin (Deep Dive)](OCR_PLUGIN.md)

- Location: `dev/ocr/`, `plugins/ocr/`
- Purpose: Text extraction from images
- Dependencies: tesseract.js, canvas
- Capabilities: File input, clipboard input, multi-language

### 🎛️ [Marketplace & Configuration](MARKETPLACE_CONFIG.md)

- Location: `.claude-plugin/`
- Purpose: Plugin registration and distribution
- Key: `marketplace.json` structure
- Audience: Users installing via Claude Code

---

## Quick Navigation

**New to the project?**
→ Start with [Plugin Development System](PLUGIN_DEVELOPMENT_SYSTEM.md)

**Building plugins?**
→ See [Scaffolding Tools](SCAFFOLDING_TOOLS.md)

**Want to understand OCR?**
→ Check [OCR Plugin (Deep Dive)](OCR_PLUGIN.md)

**Publishing plugins?**
→ Read [Marketplace & Configuration](MARKETPLACE_CONFIG.md)

---

## Architecture at a Glance

```
┌─────────────────────────────────────────────────────────┐
│            xy-plugins Monorepo Structure               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Source Layer       Build Layer        Output Layer    │
│  ─────────────      ──────────         ────────────    │
│                                                         │
│  dev/            scripts/            plugins/         │
│  ├─ ocr/         ├─ build.js          ├─ ocr/        │
│  │ ├─ src/       ├─ create.js         ├─ */**        │
│  │ ├─ dist/      ├─ validate.js       └─ ...         │
│  │ ├─ SKILL.md   ├─ dev.js                            │
│  │ └─ plugin.json└─ test-plugin.js    template/      │
│  └─ ...                                ├─ skill/     │
│                                        ├─ hooks/     │
│  .claude-plugin/                       └─ mcp/       │
│  └─ marketplace.json                                  │
│                                                       │
└─────────────────────────────────────────────────────────┘
```

## Key Concepts

### Plugin Types

1. **Skill** — Tools for Claude Code
2. **Hooks** — Workflow intercepts
3. **MCP** — Model Context Protocol servers

### Build Workflow

```
dev/<name>/        TypeScript source
    ↓ (tsc)
dev/<name>/dist/   JavaScript output
    ↓ (build.js)
plugins/<name>/    Production plugin
    ↓ (validate)
✓ Ready to ship
```

### Validation Chain

```
plugin.json              Metadata validation
    ↓
SKILL.md / hooks.json    Format checking
    ↓
node_modules/            Dependency verification
    ↓
Path security            No absolute paths
    ↓
✓ Publication ready
```

---

## Related Documentation

- **[Architecture Design](../ARCHITECTURE.md)** — System design, decisions, data flows
- **[Plugin Development Guide](../GUIDES/PLUGIN_DEVELOPMENT.md)** — Step-by-step plugin creation
- **[Marketplace Setup](../GUIDES/MARKETPLACE.md)** — Publishing to Claude Code Plugin Marketplace

---

## File Organization

```
docs/
├── ARCHITECTURE.md          ← System design & decisions
├── GUIDES/
│   ├── PLUGIN_DEVELOPMENT.md  ← How to build plugins
│   └── MARKETPLACE.md         ← Publishing guide
└── CODEMAPS/
    ├── INDEX.md (this file)
    ├── SCAFFOLDING_TOOLS.md
    ├── PLUGIN_DEVELOPMENT_SYSTEM.md
    ├── OCR_PLUGIN.md
    └── MARKETPLACE_CONFIG.md
```

**Note:** Generated from actual codebase structure. Last synced: 2026-03-03.
