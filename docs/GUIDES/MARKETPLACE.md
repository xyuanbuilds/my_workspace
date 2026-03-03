# Marketplace Setup Guide

**Last Updated:** 2026-03-03

## Overview

This guide explains how to publish xy-plugins to Claude Code Plugin Marketplace so others can install your plugins.

## Prerequisites

- ✅ GitHub account
- ✅ All plugins built: `pnpm build:all`
- ✅ All plugins validated: `pnpm validate`
- ✅ Repository pushed to GitHub as `xy/workspace`

## Publishing Steps

### Step 1: Verify Marketplace Configuration

The marketplace is already configured at `.claude-plugin/marketplace.json`:

```json
{
  "name": "xy-plugins",
  "owner": {
    "name": "xyuanbuilds"
  },
  "plugins": [
    {
      "name": "ocr",
      "description": "Extract text from images using OCR",
      "source": "./plugins/ocr"
    }
  ]
}
```

**Required fields:**

- `name` — Marketplace name (must be globally unique)
- `owner.name` — Your username/org
- `plugins[].name` — Plugin name (must match directory)
- `plugins[].source` — Relative path to plugin directory

### Step 2: Verify Plugin.json Versions

Before publishing, ensure all `plugin.json` files have correct versions. Update if you've made changes:

```bash
# Check OCR plugin version
cat plugins/ocr/.claude-plugin/plugin.json | grep version
```

Use semantic versioning:

- `1.0.0` — Major.Minor.Patch
- Increment version when publishing updates

### Step 3: Build & Validate for Publishing

```bash
# Clean build all plugins
pnpm build:all

# Validate all plugins
pnpm validate
```

Expected output:

```
✅ All validations passed!
```

### Step 4: Commit & Push to GitHub

Before pushing, ensure `.gitignore` can rebuild plugins:

```bash
# Verify plugins/ is in .gitignore
grep "plugins/" .gitignore
```

Then commit and push:

```bash
git add -A
git commit -m "chore: build plugins for release"
git push origin main
```

**Important:** Do NOT commit `plugins/` directory to git (it's in .gitignore). Marketplace will rebuild on installation.

### Step 5: Register with Claude Code Plugin Marketplace

Once your repository is public on GitHub:

1. User adds your marketplace:

```bash
claude marketplace add xy/workspace
```

2. Claude Code discovers plugins from `.claude-plugin/marketplace.json`

3. Users can install individual plugins:

```bash
claude plugin install ocr@xy-plugins
```

## Adding New Plugins to Marketplace

When you create a new plugin and want to publish it:

### 1. Create & Build Plugin

```bash
pnpm create-plugin my-new-plugin --type skill
pnpm build:plugin my-new-plugin
pnpm validate my-new-plugin
```

### 2. Update Marketplace Configuration

Add to `.claude-plugin/marketplace.json`:

```json
{
  "plugins": [
    {
      "name": "ocr",
      "description": "...",
      "source": "./plugins/ocr"
    },
    {
      "name": "my-new-plugin", // ADD THIS
      "description": "What it does",
      "source": "./plugins/my-new-plugin"
    }
  ]
}
```

### 3. Commit & Push

```bash
git add -A
git commit -m "feat: add my-new-plugin to marketplace"
git push origin main
```

### 4. Update Version & Publish

Increment version in `dev/my-new-plugin/plugin.json`:

```json
{
  "name": "my-new-plugin",
  "version": "1.0.0" // New release
}
```

Build and push again:

```bash
pnpm build:plugin my-new-plugin
git add plugins/
git commit -m "release: my-new-plugin 1.0.0"
git push
```

## Versioning Strategy

### Semantic Versioning (Recommended)

```
MAJOR.MINOR.PATCH

1.0.0  Initial release
1.1.0  New feature
1.0.1  Bug fix
2.0.0  Breaking change
```

### Version Bumping Checklist

- [ ] Update version in `dev/<name>/plugin.json`
- [ ] Build: `pnpm build:plugin <name>`
- [ ] Validate: `pnpm validate <name>`
- [ ] Update changelog (optional)
- [ ] Commit & push

## Marketplace Listing

When users browse Claude Code Plugin Marketplace, they see:

| Field         | Source      | Shown As              |
| ------------- | ----------- | --------------------- |
| `name`        | plugin.json | Plugin title          |
| `description` | plugin.json | One-liner description |
| `author`      | plugin.json | Author name           |
| `keywords`    | plugin.json | Search tags           |
| `version`     | plugin.json | Current version       |

Example listing:

```
🔍 OCR (v1.0.0)
   Extract text from images using OCR. Supports file and clipboard input with multiple languages.

   By: xyuanbuilds
   Tags: ocr, image-to-text, tesseract
```

## Updating Published Plugins

To release an update:

```bash
# 1. Make changes to source
# Edit dev/ocr/src/...

# 2. Increment version
# Edit dev/ocr/plugin.json → "1.1.0"

# 3. Build & validate
pnpm build:plugin ocr
pnpm validate ocr

# 4. Commit & push
git add dev/ocr/plugin.json plugins/ocr/
git commit -m "release: ocr 1.1.0 (new feature)"
git push
```

Users will see the update available in Claude Code Plugin Marketplace and can reinstall.

## Troubleshooting

### "Plugin manifest is invalid"

Check `plugin.json`:

- [ ] All required fields present
- [ ] JSON syntax valid
- [ ] `author` is object, not string: `{ "name": "..." }`
- [ ] No trailing commas

Fix: `pnpm validate ocr` shows all errors

### "Plugin cannot load"

After user installs:

- [ ] Check if `plugins/<name>/` directory is self-contained
- [ ] Verify `node_modules/` includes all production deps
- [ ] Check paths use `${CLAUDE_PLUGIN_ROOT}` (not absolute)

### User sees old version

Claude Code caches marketplace metadata:

- [ ] Ensure you pushed to GitHub
- [ ] Increment `plugin.json` version
- [ ] Clear user's local cache: `~/.claude/plugins/cache/`

## Marketplace Best Practices

### Do ✓

- ✓ Write clear, concise descriptions
- ✓ Use meaningful keywords
- ✓ Test plugins locally before publishing
- ✓ Keep SKILL.md and docs updated
- ✓ Follow semantic versioning
- ✓ Validate all plugins before release

### Don't ✗

- ✗ Use generic names (e.g., "tool", "plugin")
- ✗ Commit `plugins/` directory to git
- ✗ Use hardcoded absolute paths
- ✗ Include unnecessary dependencies
- ✗ Break backward compatibility without major version bump
- ✗ Publish without validating

## Environment Variables

### During Development

Use direct paths in `dev/ocr/mcp.json`:

```json
{
  "command": "node",
  "args": ["./scripts/mcp-server.js"]
}
```

### After Build

Build process converts to `${CLAUDE_PLUGIN_ROOT}`:

```json
{
  "command": "node",
  "args": ["${CLAUDE_PLUGIN_ROOT}/skills/ocr/scripts/mcp-server.js"]
}
```

This ensures portability when users install the plugin.

---

**Next:** [Plugin Development Guide](PLUGIN_DEVELOPMENT.md)
