# Architecture Design

**Last Updated:** 2026-03-03  
**Status:** Production

## System Overview

xy-plugins is a **Plugin Marketplace Monorepo** for Claude Code. It manages plugin development, building, and distribution.

```
┌─────────────────────────────────────────────────────────────┐
│                    xy-plugins Repository                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐      ┌──────────────┐  ┌────────────┐   │
│  │   dev/       │      │  templates/  │  │ scripts/   │   │
│  │ (sources)    │      │ (scaffolds)  │  │ (tools)    │   │
│  │              │      │              │  │            │   │
│  │ ├─ ocr/      │      │ ├─ skill/    │  │ ├─ create  │   │
│  │ │ ├─ src/    │      │ ├─ hooks/    │  │ ├─ build   │   │
│  │ │ ├─ dist/   │◄─┐   │ └─ mcp/      │  │ ├─ validate│   │
│  │ │ └─ SKILL.md│  │   └──────────────┘  │ ├─ dev    │   │
│  │ └─ plugin.json   │                    │ └─ test   │   │
│  └──────────────┘  │                    └────────────┘   │
│         │          │                                      │
│         ├──────────┘                                      │
│         │ (tsc compile)                                   │
│         ▼                                                  │
│  ┌──────────────────────────────────────────────────┐    │
│  │            Build Process (build.js)              │    │
│  │                                                  │    │
│  │  1. TypeScript Compilation (tsc -p dev/X)      │    │
│  │  2. Clean Build (remove old plugins/X)         │    │
│  │  3. Type Detection (skill/hooks/mcp)           │    │
│  │  4. Package Files (copy to plugins/X)          │    │
│  │  5. Install Dependencies (pnpm install --prod) │    │
│  └──────────────────────────────────────────────────┘    │
│         │                                                 │
│         ▼                                                 │
│  ┌──────────────────────────────────────────────────┐    │
│  │         plugins/ (Build Output)                  │    │
│  │                                                  │    │
│  │  plugins/ocr/                                   │    │
│  │  ├─ .claude-plugin/plugin.json                 │    │
│  │  ├─ skills/ocr/                                │    │
│  │  │  ├─ SKILL.md                                │    │
│  │  │  └─ scripts/ (*.js + node_modules)          │    │
│  │  └─ .mcp.json                                  │    │
│  └──────────────────────────────────────────────────┘    │
│         │                                                 │
│         ├─────────┬─────────┬──────────────┐             │
│         │         │         │              │             │
│    validate()   test:plugin publish()  .gitignore        │
│         │         │         │              │             │
│         ▼         ▼         ▼              ▼             │
│   Check JSON  Load in   Push to         ✓Excluded       │
│   Structure   Claude   Marketplace                       │
└─────────────────────────────────────────────────────────────┘
```

## Layered Architecture

### Layer 1: Development (dev/)

Source code for each plugin in isolation:

```
dev/<name>/
├── src/                  TypeScript source files
├── dist/                 Compiled JavaScript (generated)
├── SKILL.md              Plugin documentation
├── plugin.json           Metadata
├── mcp.json              MCP config template (optional)
├── package.json          Root dev dependencies
└── tsconfig.json         TypeScript configuration
```

**Characteristics:**

- Full TypeScript with types
- Development dependencies available
- Can reference monorepo packages
- Not meant to be used directly by users

### Layer 2: Build Pipeline (scripts/)

Automated tools to package plugins:

| Script           | Purpose                                 |
| ---------------- | --------------------------------------- |
| `build.js`       | Compile TS → Package → Install deps     |
| `create.js`      | Generate plugin scaffold from templates |
| `validate.js`    | Check plugin structure compliance       |
| `dev.js`         | Watch mode TypeScript compilation       |
| `test-plugin.js` | Load plugin in Claude Code              |

### Layer 3: Distribution (plugins/)

Production-ready plugins for end users:

```
plugins/<name>/
├── .claude-plugin/plugin.json     Plugin manifest
├── skills/<name>/                 Skill plugin files
├── hooks/                         Hooks plugin files
├── scripts/                       Compiled scripts
├── node_modules/                  Runtime dependencies
└── .mcp.json                      MCP configuration
```

**Characteristics:**

- Self-contained (no external references)
- All dependencies bundled
- No TypeScript source
- Ready for Claude Code to load

### Layer 4: Marketplace (.claude-plugin/)

Marketplace registration and distribution:

```
.claude-plugin/marketplace.json
{
  "name": "xy-plugins",
  "owner": { "name": "xyuanbuilds" },
  "plugins": [
    { "name": "ocr", "source": "./plugins/ocr" }
  ]
}
```

## Plugin Type Support

### 1. Skill Plugin

**Purpose:** Provide tools and functions to Claude

**Structure:**

```
plugins/ocr/
├── .claude-plugin/plugin.json
├── skills/ocr/
│   ├── SKILL.md
│   └── scripts/
│       ├── *.js
│       ├── package.json
│       └── node_modules/
├── .mcp.json (optional)
```

**Execution:** Loaded as Claude skill via SKILL.md

### 2. Hooks Plugin

**Purpose:** Intercept and modify Claude workflows

**Structure:**

```
plugins/my-hooks/
├── .claude-plugin/plugin.json
├── hooks/hooks.json
└── scripts/
    └── *.js
```

**Execution:** Hooks triggered by matcher conditions

### 3. MCP Plugin

**Purpose:** Model Context Protocol server for tools/resources

**Structure:**

```
plugins/my-mcp/
├── .claude-plugin/plugin.json
├── .mcp.json
├── scripts/
│   ├── mcp-server.js
│   ├── package.json
│   └── node_modules/
```

**Execution:** Spawned as child process, communicates via stdio

## Build Flow Details

### Workflow: `pnpm build:plugin ocr`

```
1. Validate Inputs
   └─ Check: dev/ocr/ exists
   └─ Check: dev/ocr/plugin.json exists

2. Clean Build
   └─ Remove: plugins/ocr/ (if exists)
   └─ Log: "🧹 Cleaned plugins/ocr/"

3. Detect Type
   └─ Has SKILL.md? → "skill"
   └─ Has hooks.json? → "hooks"
   └─ Has mcp.json? → "mcp"

4. Compile TypeScript
   └─ Command: tsc -p dev/ocr/tsconfig.json
   └─ Output: dev/ocr/dist/*.js

5. Package (skill example)
   └─ Create: plugins/ocr/.claude-plugin/
   └─ Copy: plugin.json
   └─ Create: plugins/ocr/skills/ocr/
   └─ Copy: SKILL.md
   └─ Deploy: dist/*.js → scripts/
   └─ Deploy: src/package.json → scripts/
   └─ Process: mcp.json template (path replacement)
   └─ Copy: .mcp.json → plugins/ocr/

6. Install Dependencies
   └─ chdir: plugins/ocr/skills/ocr/scripts/
   └─ Command: pnpm install --prod
   └─ Create: node_modules/ with production deps

7. Summary
   └─ ✅ Plugin "ocr" built successfully → plugins/ocr/
```

## Validation Pipeline

### `pnpm validate ocr`

Checks structured in `validate.js`:

```
1. Plugin Exists?
   └─ plugins/ocr/ present? ✓

2. Manifest Valid?
   └─ .claude-plugin/plugin.json exists? ✓
   └─ JSON parses without error? ✓
   └─ "name" field present? ✓

3. Type-Specific Requirements
   └─ Skill: skills/ocr/SKILL.md ✓
   └─ Hooks: hooks/hooks.json ✓
   └─ MCP: .mcp.json ✓

4. Path Security
   └─ No /Users/ in *.json files? ✓
   └─ No /home/ in *.json files? ✓
   └─ No C:\ in *.json files? ✓

Summary
└─ ✅ All validations passed!
```

## Key Design Decisions

| Decision                       | Rationale                              | Alternative                              |
| ------------------------------ | -------------------------------------- | ---------------------------------------- |
| **Dev ↔ Plugins separation**   | Source isolation + clean build output  | Single directory (less clean)            |
| **Template-based scaffolding** | Simple, no template engine dependency  | Code generation (more complex)           |
| **Bundle node_modules**        | Canvas & native addons hard to esbuild | esbuild bundling (limited compatibility) |
| **pnpm for deps**              | Faster, stricter, monorepo-friendly    | npm or yarn (slower/less strict)         |
| **No CI auto-publish**         | Manual control + quality gates         | Auto-publish (risky)                     |

## Data Flow: Plugin Loading

```
User: pnpm test:plugin ocr
     │
     ├─→ scripts/test-plugin.js
     │
     ├─→ Check: plugins/ocr/ exists? ✓
     │
     ├─→ Execute: claude --plugin-dir "$(pwd)/plugins/ocr"
     │
     └─→ Claude Code
         ├─ Reads: .claude-plugin/plugin.json
         ├─ Validates: manifest structure
         ├─ Loads: skills/ocr/SKILL.md (skill type)
         ├─ Runs: skills/ocr/scripts/cli.js via Node.js
         └─ Registers: .mcp.json services (if present)
```

## Marketplace Integration

When published to GitHub (`xy/workspace`), users can install via:

```bash
claude plugin install ocr@xy-plugins
```

This requires:

1. Repository pushed to GitHub
2. `.claude-plugin/marketplace.json` present with correct structure
3. All `plugins/<name>/` directories built and valid
4. Plugin versions match semantic versioning

---

**Related Documents:**

- [Plugin Development Guide](../GUIDES/PLUGIN_DEVELOPMENT.md)
- [Codemaps](../CODEMAPS/INDEX.md)
