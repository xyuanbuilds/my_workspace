# Scaffolding Tools Codemap

**Last Updated:** 2026-03-03  
**Entry Points:** `package.json` scripts | **Key Files:** `scripts/build.js`, `scripts/create.js`, `scripts/validate.js`, `scripts/dev.js`, `scripts/test-plugin.js`

## Overview

The scaffolding tools system automates plugin development workflows. These are CLI tools that handle building, creating, validating, and testing plugins.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Scaffolding Tools Layer                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  CLI Commands (package.json)                           │
│  ├─ pnpm build:plugin <name>  ─┐                       │
│  ├─ pnpm build:all            ─├─→  build.js         │
│  │                            ─┘    (orchestrator)    │
│  │                                                     │
│  ├─ pnpm create-plugin        ─────→  create.js       │
│  │    <name> --type skill|hooks|mcp   (scaffolder)    │
│  │                                                     │
│  ├─ pnpm validate [name]      ─────→  validate.js     │
│  │                                    (checker)        │
│  │                                                     │
│  ├─ pnpm dev <name>           ─────→  dev.js          │
│  │                                    (watcher)        │
│  │                                                     │
│  └─ pnpm test:plugin <name>   ─────→  test-plugin.js  │
│                                       (loader)         │
│                                                        │
└─────────────────────────────────────────────────────────┘
         │                            │
         │                            ▼
    Input: CLI args            Output: Compiled plugins
    (name, type, etc)          plugins/<name>/ ✓
```

## Key Modules

| Module                  | File             | Purpose                             | Exports                           |
| ----------------------- | ---------------- | ----------------------------------- | --------------------------------- |
| **Build Orchestrator**  | `build.js`       | Compile TS → Package → Install deps | `buildPlugin(name)`, `buildAll()` |
| **Plugin Generator**    | `create.js`      | Scaffold new plugins from templates | `createPlugin(name, type)`        |
| **Structure Validator** | `validate.js`    | Check plugin compliance             | `validatePlugin(name)`            |
| **Watcher**             | `dev.js`         | Watch TS for changes                | `startWatch(name)`                |
| **Plugin Loader**       | `test-plugin.js` | Load plugin in Claude Code          | `loadPlugin(name)`                |

## Data Flow

### Build Flow: `pnpm build:plugin ocr`

```
package.json script
    │ "build:plugin": "node scripts/build.js --name"
    ▼
build.js
    │
    ├─→ 1. Validate Input
    │   └─ Check: dev/ocr/ exists?
    │   └─ Check: dev/ocr/plugin.json exists?
    │
    ├─→ 2. Clean Build
    │   └─ Remove: plugins/ocr/ (if exists)
    │
    ├─→ 3. Detect Type
    │   └─ SKILL.md? → skill
    │   └─ hooks.json? → hooks
    │   └─ mcp.json? → mcp
    │
    ├─→ 4. Compile TypeScript
    │   └─ execSync("tsc -p dev/ocr/tsconfig.json")
    │   └─ Creates: dev/ocr/dist/*.js
    │
    ├─→ 5. Package (by type)
    │   │
    │   ├─ Skill:
    │   │  ├─ Create: plugins/ocr/.claude-plugin/
    │   │  ├─ Copy: plugin.json
    │   │  ├─ Create: plugins/ocr/skills/ocr/
    │   │  ├─ Copy: SKILL.md
    │   │  ├─ Deploy: dist/*.js → scripts/
    │   │  ├─ Copy: src/package.json
    │   │  └─ Copy: .mcp.json (if exists)
    │   │
    │   ├─ Hooks:
    │   │  ├─ Create: plugins/ocr/.claude-plugin/
    │   │  ├─ Copy: plugin.json
    │   │  ├─ Create: plugins/ocr/hooks/
    │   │  ├─ Copy: hooks.json
    │   │  └─ Copy: scripts/
    │   │
    │   └─ MCP:
    │      ├─ Create: plugins/ocr/.claude-plugin/
    │      ├─ Copy: plugin.json
    │      ├─ Copy: .mcp.json
    │      └─ Deploy: scripts/
    │
    ├─→ 6. Install Dependencies
    │   └─ chdir: plugins/ocr/skills/ocr/scripts/
    │   └─ execSync("pnpm install --prod")
    │   └─ Creates: node_modules/
    │
    └─→ Output: ✅ Plugin "ocr" built successfully → plugins/ocr/
```

### Create Flow: `pnpm create-plugin my-tool --type skill`

```
create.js
    │
    ├─→ 1. Parse Arguments
    │   ├─ name: "my-tool"
    │   └─ type: "skill"
    │
    ├─→ 2. Validate Inputs
    │   └─ Check: dev/my-tool/ doesn't exist
    │
    ├─→ 3. Load Template
    │   └─ Read: templates/skill/
    │   └─ List files: plugin.json, SKILL.md, src/**, etc.
    │
    ├─→ 4. Copy & Replace Placeholders
    │   └─ For each file:
    │      ├─ Read content
    │      ├─ Replace {{name}} → "my-tool"
    │      ├─ Replace {{description}} → "A Claude Code plugin"
    │      └─ Write to: dev/my-tool/
    │
    └─→ Output: ✅ Plugin "my-tool" created successfully!
                  📋 Next steps: [instructions]
```

### Validate Flow: `pnpm validate ocr`

```
validate.js
    │
    ├─→ 1. Check Plugin Exists
    │   └─ plugins/ocr/ exists? ✓
    │
    ├─→ 2. Check Manifest
    │   ├─ .claude-plugin/plugin.json exists? ✓
    │   ├─ JSON parses valid? ✓
    │   ├─ Has "name" field? ✓
    │
    ├─→ 3. Type-Specific Checks
    │   ├─ Skill: skills/ocr/SKILL.md exists? ✓
    │   ├─ Hooks: hooks/hooks.json exists? ✓
    │   └─ MCP: .mcp.json exists? ✓
    │
    ├─→ 4. Security Checks
    │   └─ Scan all .json files:
    │      ├─ No /Users/ paths? ✓
    │      ├─ No /home/ paths? ✓
    │      └─ No C:\ paths? ✓
    │
    └─→ Output: ✅ All validations passed!
                  ✅ .claude-plugin/plugin.json exists and is valid JSON
                  ✅ plugin.json has name: "ocr"
                  ✅ skills/ocr/SKILL.md exists
                  ✅ No absolute paths detected in JSON files
```

## Dependencies

**Runtime Dependencies:**

- Node.js built-ins: `fs`, `path`, `child_process`, `url`
- No external npm packages required

**Note:** Scaffolding tools are intentionally lightweight and dependency-free to keep setup simple.

## Related Areas

- [Plugin Development System](PLUGIN_DEVELOPMENT_SYSTEM.md) — The dev/ → plugins/ pipeline
- [OCR Plugin](OCR_PLUGIN.md) — Example built plugin
- **File:** [Architecture Design](../ARCHITECTURE.md) — Full system overview

---

**Commands Quick Reference:**

```bash
pnpm build:plugin ocr           # Build single plugin
pnpm build:all                  # Build all plugins
pnpm create-plugin my-x --type skill|hooks|mcp
pnpm dev ocr                    # Watch mode
pnpm validate ocr               # Check structure
pnpm test:plugin ocr            # Load in Claude Code
```

---

**Last Updated:** 2026-03-03 | Auto-generated from source
