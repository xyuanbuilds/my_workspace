#!/usr/bin/env node
/**
 * Test a plugin by loading it with claude --plugin-dir
 *
 * Usage:
 *   node scripts/test-plugin.js <name>
 *   pnpm test:plugin ocr
 */

import { execSync } from "child_process";
import { existsSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const name = process.argv[2];
if (!name) {
  console.error("Usage: pnpm test:plugin <name>");
  process.exit(1);
}

const pluginDir = path.join(rootDir, "plugins", name);
if (!existsSync(pluginDir)) {
  console.error(`❌ Plugin "${name}" not found. Build it first: pnpm build:plugin ${name}`);
  process.exit(1);
}

console.log(`🚀 Loading plugin: ${name}`);
console.log(`   Plugin dir: ${pluginDir}\n`);
execSync(`claude --plugin-dir "${pluginDir}"`, { stdio: "inherit", cwd: rootDir });
