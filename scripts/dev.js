#!/usr/bin/env node
/**
 * Start TypeScript watch mode for a plugin
 *
 * Usage:
 *   node scripts/dev.js <name>
 *   pnpm dev ocr
 */

import { execSync } from "child_process";
import { existsSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const name = process.argv[2];
if (!name) {
  console.error("Usage: pnpm dev <name>");
  process.exit(1);
}

const tsconfig = path.join(rootDir, "dev", name, "tsconfig.json");
if (!existsSync(tsconfig)) {
  console.error(`❌ No tsconfig.json found in dev/${name}/`);
  process.exit(1);
}

console.log(`👀 Watching: dev/${name}/src/ ...\n`);
execSync(`npx tsc -p "${tsconfig}" --watch`, {
  stdio: "inherit",
  cwd: rootDir,
});
