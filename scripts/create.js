#!/usr/bin/env node
/**
 * Scaffold a new Plugin from templates
 *
 * Usage:
 *   node scripts/create.js <name> --type skill|hooks|mcp [--description "..."]
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const devDir = path.join(rootDir, "dev");
const templatesDir = path.join(rootDir, "templates");

// ── Helpers ──────────────────────────────────────────────────────────────────

function log(msg) {
  console.log(msg);
}

function error(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

/**
 * Recursively copy directory, replacing {{placeholders}} in file contents
 */
function copyWithReplace(src, dest, replacements) {
  fs.mkdirSync(dest, { recursive: true });

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyWithReplace(srcPath, destPath, replacements);
    } else {
      let content = fs.readFileSync(srcPath, "utf-8");
      for (const [placeholder, value] of Object.entries(replacements)) {
        content = content.replaceAll(`{{${placeholder}}}`, value);
      }
      fs.writeFileSync(destPath, content);
    }
  }
}

// ── Parse Arguments ──────────────────────────────────────────────────────────

const args = process.argv.slice(2);
let name = null;
let type = null;
let description = "A Claude Code plugin";

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--type" && args[i + 1]) {
    type = args[i + 1];
    i++;
  } else if (args[i] === "--description" && args[i + 1]) {
    description = args[i + 1];
    i++;
  } else if (!args[i].startsWith("--")) {
    name = args[i];
  }
}

if (!name) {
  error(
    "Plugin name is required.\nUsage: pnpm create-plugin <name> --type skill|hooks|mcp",
  );
}

if (!type) {
  error(
    "Plugin type is required.\nUsage: pnpm create-plugin <name> --type skill|hooks|mcp",
  );
}

const validTypes = ["skill", "hooks", "mcp"];
if (!validTypes.includes(type)) {
  error(`Invalid type "${type}". Must be one of: ${validTypes.join(", ")}`);
}

// ── Conflict Detection ───────────────────────────────────────────────────────

const targetDir = path.join(devDir, name);
if (fs.existsSync(targetDir)) {
  error(
    `Directory dev/${name}/ already exists. Choose a different name or remove the existing directory.`,
  );
}

// ── Template Copy ────────────────────────────────────────────────────────────

const templateDir = path.join(templatesDir, type);
if (!fs.existsSync(templateDir)) {
  error(`Template directory templates/${type}/ not found.`);
}

log(`\n🚀 Creating ${type} plugin: ${name}`);
log(`   Template: templates/${type}/`);
log(`   Target:   dev/${name}/\n`);

const replacements = {
  name,
  description,
};

copyWithReplace(templateDir, targetDir, replacements);

// ── Success ──────────────────────────────────────────────────────────────────

log(`✅ Plugin "${name}" created successfully!\n`);
log(`📋 Next steps:`);
log(`   1. cd dev/${name}/`);
log(`   2. Edit the source files`);
log(`   3. pnpm build:plugin ${name}    — build the plugin`);
log(`   4. pnpm validate ${name}        — validate the structure`);
log(`   5. pnpm test:plugin ${name}     — test with Claude Code\n`);
