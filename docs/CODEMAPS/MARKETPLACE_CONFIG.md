# Marketplace & Configuration Codemap

**Last Updated:** 2026-03-03  
**Location:** `.claude-plugin/` | **Key File:** `marketplace.json` | **Audience:** Distributors, users

## Overview

The Marketplace Configuration layer defines how the xy-plugins repository is registered as a Claude Code Plugin Marketplace and made discoverable by users.

## Architecture

```
┌──────────────────────────────────────────────────────┐
│        Marketplace Registration (Top Level)         │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Repository: xy/workspace (GitHub)                  │
│      │                                               │
│      └─→ .claude-plugin/marketplace.json            │
│          (Source of truth for marketplace metadata) │
│                                                      │
│          {                                           │
│            "name": "xy-plugins",                     │
│            "owner": { "name": "xyuanbuilds" },      │
│            "plugins": [                              │
│              { "name": "ocr", "source": "..." },    │
│              { "name": "...", "source": "..." }     │
│            ]                                         │
│          }                                           │
│          │                                           │
│          ├─→ Claude Code Marketplace Index           │
│          │   └─ Users can discover marketplace       │
│          │                                           │
│          ├─→ Plugin Registry                         │
│          │   └─ Each source points to plugins/       │
│          │                                           │
│          └─→ Installation Targets                    │
│              └─ claude plugin install ocr@xy-plugins │
│                                                      │
└──────────────────────────────────────────────────────┘
```

## Marketplace Configuration

### File: `.claude-plugin/marketplace.json`

```json
{
  "name": "xy-plugins",
  "owner": {
    "name": "xyuanbuilds"
  },
  "plugins": [
    {
      "name": "ocr",
      "description": "Extract text from images using OCR. Supports file and clipboard input with multiple languages.",
      "source": "./plugins/ocr"
    }
  ]
}
```

### Schema

| Field                   | Type   | Required | Description                                        |
| ----------------------- | ------ | -------- | -------------------------------------------------- |
| `name`                  | string | Yes      | Marketplace name (globally unique)                 |
| `owner.name`            | string | Yes      | Marketplace owner (usually GitHub username)        |
| `owner.email`           | string | No       | Contact email                                      |
| `plugins`               | array  | Yes      | Array of plugin references                         |
| `plugins[].name`        | string | Yes      | Plugin name (must match directory)                 |
| `plugins[].description` | string | No       | Short description (shown in marketplace)           |
| `plugins[].author`      | string | No       | Plugin author                                      |
| `plugins[].source`      | string | Yes      | Path to plugin directory (relative to repo root)   |
| `plugins[].version`     | string | No       | Current version (optional, taken from plugin.json) |

## Plugin Registration

### Single Plugin Entry

```json
{
  "name": "ocr",
  "description": "Extract text from images using OCR",
  "source": "./plugins/ocr",
  "version": "1.0.0"
}
```

Each entry must have:

1. **Unique name** — No two plugins with same name
2. **Valid source path** — Must point to built plugin directory
3. **Matching directory name** — `source: "./plugins/ocr"` implies plugin has `.claude-plugin/plugin.json`

## Distribution Workflow

### Step 1: Local Development & Build

```
Developer
    │
    ├─ Create plugin in dev/
    ├─ Build: pnpm build:plugin <name>
    ├─ Validate: pnpm validate <name>
    └─ Output: plugins/<name>/ ✓
```

### Step 2: Register Plugin

Edit `.claude-plugin/marketplace.json`:

```json
{
  "plugins": [
    { "name": "ocr", "source": "./plugins/ocr" }, // existing
    { "name": "new-plugin", "source": "./plugins/new-plugin" } // add this
  ]
}
```

### Step 3: Push to GitHub

```
git add -A
git commit -m "feat: add new-plugin; build: update ocr"
git push origin main
```

Marketplace.json and plugins/ are now in GitHub.

### Step 4: User Discovers Marketplace

User adds marketplace:

```bash
claude marketplace add xy/workspace
```

Claude Code:

1. Fetches `https://github.com/xy/workspace`
2. Reads `.claude-plugin/marketplace.json`
3. Discovers all plugins listed
4. Shows in Plugin Marketplace UI

### Step 5: User Installs Plugin

```bash
claude plugin install ocr@xy-plugins
```

Claude Code:

1. Looks up plugin "ocr" in "xy-plugins" marketplace
2. Finds: `source: "./plugins/ocr"`
3. Resolves to: `https://github.com/xy/workspace/plugins/ocr/`
4. Downloads and installs locally

## Plugin Listing in Marketplace

When visible to users, each plugin shows:

```
┌──────────────────────────────────────────┐
│ 🔍 OCR (v1.0.0)                          │
├──────────────────────────────────────────┤
│                                          │
│ Extract text from images using OCR.     │
│ Supports file and clipboard input.      │
│                                          │
│ By: xyuanbuilds                          │
│ Marketplace: xy-plugins                  │
│                                          │
│ Tags: ocr, image-to-text, tesseract      │
│                                          │
│ [Install] [View Source] [Documentation] │
│                                          │
└──────────────────────────────────────────┘
```

Metadata source:

- `name` → `.claude-plugin/plugin.json`
- `version` → `.claude-plugin/plugin.json`
- `description` → `.claude-plugin/plugin.json` or marketplace.json
- `author` → `.claude-plugin/plugin.json`
- `keywords` → `.claude-plugin/plugin.json`

## Marketplace Metadata

### Plugin Manifest (in plugin.json)

```json
{
  "name": "ocr",
  "version": "1.0.0",
  "description": "Extract text from images using OCR",
  "author": {
    "name": "xyuanbuilds",
    "email": "user@example.com"
  },
  "keywords": ["ocr", "image-to-text", "tesseract", "clipboard"],
  "homepage": "https://github.com/xy/workspace",
  "repository": {
    "type": "git",
    "url": "https://github.com/xy/workspace.git"
  }
}
```

### Marketplace-Level Metadata

```json
{
  "name": "xy-plugins",
  "owner": {
    "name": "xyuanbuilds",
    "email": "user@example.com",
    "url": "https://github.com/xyuanbuilds"
  },
  "homepage": "https://github.com/xy/workspace",
  "description": "A collection of Claude Code plugins",
  "plugins": [...]
}
```

## Git Ignore Configuration

File: `.gitignore`

```
# Do NOT commit built plugins
plugins/

# Build artifacts
dev/*/dist
dev/*/*.tsbuildinfo

# Dependencies
node_modules
```

**Why?** Marketplace downloads and builds plugins on user installation. Committing large `plugins/` directory bloats repository.

## Version Management

### Version Updates

When publishing a plugin update:

1. **Increment version in source:**

   ```bash
   # vi dev/ocr/plugin.json
   "version": "1.1.0"
   ```

2. **Rebuild:**

   ```bash
   pnpm build:plugin ocr
   ```

3. **Commit & push:**
   ```bash
   git add dev/ocr/plugin.json
   git commit -m "release: ocr 1.1.0 (new features)"
   git push
   ```

### Version Numbering

Follow **Semantic Versioning (semver)**:

| Version | When                             | Example       |
| ------- | -------------------------------- | ------------- |
| Patch   | Bug fix, minor improvement       | 1.0.0 → 1.0.1 |
| Minor   | New feature, backward compatible | 1.0.0 → 1.1.0 |
| Major   | Breaking change                  | 1.0.0 → 2.0.0 |

## Publishing Checklist

Before each release:

- [ ] All changes tested locally
- [ ] `pnpm build:all` succeeds
- [ ] `pnpm validate` passes all checks
- [ ] Version numbers updated in `dev/*/plugin.json`
- [ ] `.claude-plugin/marketplace.json` reflects current plugins
- [ ] No absolute paths in plugin files
- [ ] Documentation updated (SKILL.md, README)
- [ ] Changelog updated (optional)
- [ ] Commit message is clear
- [ ] Pushed to GitHub `main` branch

## Marketplace Discovery

### How Users Find Your Marketplace

1. **Via direct URL**

   ```bash
   claude marketplace add https://github.com/xy/workspace
   claude marketplace add xy/workspace
   ```

2. **Via official Marketplace UI** (when registered)
   - Claude Code Plugin Marketplace listing
   - Search & browse UI

3. **Via documentation/blog**
   - Link in README
   - Share marketplace URL

### Metadata for Better Discoverability

In `marketplace.json`:

```json
{
  "name": "xy-plugins",
  "description": "Professional Claude Code plugins",
  "keywords": ["plugins", "marketplace"],
  "owner": { "name": "xyuanbuilds" }
}
```

## Private vs. Public Marketplace

### Public (Current Setup)

- GitHub repository is **public**
- Anyone can add marketplace
- Plugins visible in search
- Community contributions welcome

```bash
claude marketplace add xy/workspace
```

### Private (Optional)

- GitHub repository is **private**
- Requires authentication
- Only authorized users can install
- For organization use

```bash
claude marketplace add https://[token]@github.com/org/workspace
```

## Related Concepts

- **Marketplace Registry** — Global index of all marketplaces
- **Plugin Cache** — Local copy of installed plugins (`~/.claude/plugins/cache/`)
- **Plugin Marketplace UI** — Visual plugin browser in Claude Code
- **Installation Source** — Where Claude Code downloads plugins from

## Data Files

| File                              | Purpose                  | Committed         | Regenerated |
| --------------------------------- | ------------------------ | ----------------- | ----------- |
| `.claude-plugin/marketplace.json` | Marketplace registration | ✓ Yes             | No          |
| `plugins/<name>/...`              | Built plugins            | ✗ No (.gitignore) | Yes (build) |
| `dev/<name>/...`                  | Source code              | ✓ Yes             | No          |

## Error Handling

### Common Issues & Fixes

| Issue                       | Cause               | Fix                                        |
| --------------------------- | ------------------- | ------------------------------------------ |
| "Cannot fetch marketplace"  | GitHub URL wrong    | Check URL matches `xy/workspace`           |
| "Plugin not found"          | Name mismatch       | Ensure marketplace.json lists correct name |
| "Invalid plugin manifest"   | Bad plugin.json     | Run `pnpm validate`                        |
| "Source path doesn't exist" | Plugin not built    | Run `pnpm build:plugin <name>`             |
| "Old version showing"       | Cache not refreshed | User clears local cache                    |

## Related Documentation

- [Marketplace Setup Guide](../GUIDES/MARKETPLACE.md) — Publishing walkthrough
- [Plugin Development Guide](../GUIDES/PLUGIN_DEVELOPMENT.md) — Building plugins
- [Architecture Design](../ARCHITECTURE.md) — System overview

---

**Repository:** `https://github.com/xy/workspace`  
**Marketplace Name:** `xy-plugins`  
**Last Updated:** 2026-03-03
