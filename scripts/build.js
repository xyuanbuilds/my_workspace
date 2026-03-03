#!/usr/bin/env node
/**
 * Build script for packaging Plugins from dev/ to plugins/
 *
 * Usage:
 *   node scripts/build.js                  # Build all plugins
 *   node scripts/build.js --name ocr       # Build specific plugin
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const devDir = path.join(rootDir, "dev");
const pluginsDir = path.join(rootDir, "plugins");

// ── Helpers ──────────────────────────────────────────────────────────────────

function log(msg) {
  console.log(msg);
}

function error(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

/**
 * Detect plugin type based on files in dev/<name>/
 *   - SKILL.md present → skill (may also have mcp.json)
 *   - hooks.json present (no SKILL.md) → hooks
 *   - mcp.json present (no SKILL.md, no hooks.json) → mcp
 */
function detectType(pluginDir) {
  const hasSkill = fs.existsSync(path.join(pluginDir, "SKILL.md"));
  const hasHooks = fs.existsSync(path.join(pluginDir, "hooks.json"));
  const hasMcp = fs.existsSync(path.join(pluginDir, "mcp.json"));

  if (hasSkill) return "skill";
  if (hasHooks) return "hooks";
  if (hasMcp) return "mcp";
  error(
    `Cannot detect plugin type in ${pluginDir}. Need SKILL.md, hooks.json, or mcp.json`,
  );
}

/**
 * Recursively copy a directory
 */
function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// ── Clean Build ──────────────────────────────────────────────────────────────

function cleanBuild(name) {
  const outputDir = path.join(pluginsDir, name);
  if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true, force: true });
    log(`🧹 Cleaned plugins/${name}/`);
  }
}

// ── TypeScript Compile ───────────────────────────────────────────────────────

function compileTypeScript(name) {
  const tsconfig = path.join(devDir, name, "tsconfig.json");
  if (!fs.existsSync(tsconfig)) {
    log(`⏭️  No tsconfig.json for ${name}, skipping TypeScript compilation`);
    return;
  }
  log(`🔨 Compiling TypeScript for ${name}...`);
  execSync(`npx tsc -p ${tsconfig}`, { stdio: "inherit", cwd: rootDir });
}

// ── Package: skill type ──────────────────────────────────────────────────────

function packageSkill(name) {
  const devPluginDir = path.join(devDir, name);
  const outputDir = path.join(pluginsDir, name);

  // 1. .claude-plugin/plugin.json
  const pluginJsonDir = path.join(outputDir, ".claude-plugin");
  fs.mkdirSync(pluginJsonDir, { recursive: true });
  fs.copyFileSync(
    path.join(devPluginDir, "plugin.json"),
    path.join(pluginJsonDir, "plugin.json"),
  );

  // 2. skills/<name>/SKILL.md
  const skillDir = path.join(outputDir, "skills", name);
  fs.mkdirSync(skillDir, { recursive: true });
  fs.copyFileSync(
    path.join(devPluginDir, "SKILL.md"),
    path.join(skillDir, "SKILL.md"),
  );

  // 3. Copy dist/*.js to skills/<name>/scripts/
  const scriptsDir = path.join(skillDir, "scripts");
  fs.mkdirSync(scriptsDir, { recursive: true });
  const distDir = path.join(devPluginDir, "dist");
  if (fs.existsSync(distDir)) {
    for (const file of fs.readdirSync(distDir)) {
      if (file.endsWith(".js")) {
        fs.copyFileSync(path.join(distDir, file), path.join(scriptsDir, file));
      }
    }
  }

  // 4. Copy src/package.json to scripts/ and install prod deps
  const pkgSrc = path.join(devPluginDir, "src", "package.json");
  if (fs.existsSync(pkgSrc)) {
    fs.copyFileSync(pkgSrc, path.join(scriptsDir, "package.json"));
    installDeps(scriptsDir);
  }

  // 5. If mcp.json exists, process and copy as .mcp.json
  const mcpSrc = path.join(devPluginDir, "mcp.json");
  if (fs.existsSync(mcpSrc)) {
    const mcpContent = fs.readFileSync(mcpSrc, "utf-8");
    fs.writeFileSync(path.join(outputDir, ".mcp.json"), mcpContent);
    log(`📡 Added .mcp.json for ${name}`);
  }

  log(`📦 Packaged skill plugin: ${name}`);
}

// ── Package: hooks type ──────────────────────────────────────────────────────

function packageHooks(name) {
  const devPluginDir = path.join(devDir, name);
  const outputDir = path.join(pluginsDir, name);

  // 1. .claude-plugin/plugin.json
  const pluginJsonDir = path.join(outputDir, ".claude-plugin");
  fs.mkdirSync(pluginJsonDir, { recursive: true });
  fs.copyFileSync(
    path.join(devPluginDir, "plugin.json"),
    path.join(pluginJsonDir, "plugin.json"),
  );

  // 2. hooks/hooks.json
  const hooksDir = path.join(outputDir, "hooks");
  fs.mkdirSync(hooksDir, { recursive: true });
  fs.copyFileSync(
    path.join(devPluginDir, "hooks.json"),
    path.join(hooksDir, "hooks.json"),
  );

  // 3. Copy scripts/
  const scriptsSrc = path.join(devPluginDir, "scripts");
  if (fs.existsSync(scriptsSrc)) {
    const scriptsDest = path.join(outputDir, "scripts");
    copyDirSync(scriptsSrc, scriptsDest);
  }

  log(`📦 Packaged hooks plugin: ${name}`);
}

// ── Package: mcp type ────────────────────────────────────────────────────────

function packageMcp(name) {
  const devPluginDir = path.join(devDir, name);
  const outputDir = path.join(pluginsDir, name);

  // 1. .claude-plugin/plugin.json
  const pluginJsonDir = path.join(outputDir, ".claude-plugin");
  fs.mkdirSync(pluginJsonDir, { recursive: true });
  fs.copyFileSync(
    path.join(devPluginDir, "plugin.json"),
    path.join(pluginJsonDir, "plugin.json"),
  );

  // 2. Process mcp.json → .mcp.json
  const mcpSrc = path.join(devPluginDir, "mcp.json");
  const mcpContent = fs.readFileSync(mcpSrc, "utf-8");
  fs.writeFileSync(path.join(outputDir, ".mcp.json"), mcpContent);

  // 3. Copy dist/*.js to scripts/
  const distDir = path.join(devPluginDir, "dist");
  if (fs.existsSync(distDir)) {
    const scriptsDir = path.join(outputDir, "scripts");
    fs.mkdirSync(scriptsDir, { recursive: true });
    for (const file of fs.readdirSync(distDir)) {
      if (file.endsWith(".js")) {
        fs.copyFileSync(path.join(distDir, file), path.join(scriptsDir, file));
      }
    }

    // Install deps if package.json exists
    const pkgSrc = path.join(devPluginDir, "src", "package.json");
    if (fs.existsSync(pkgSrc)) {
      fs.copyFileSync(pkgSrc, path.join(scriptsDir, "package.json"));
      installDeps(scriptsDir);
    }
  }

  log(`📦 Packaged mcp plugin: ${name}`);
}

// ── Dependency Installation ──────────────────────────────────────────────────

function installDeps(targetDir) {
  const pkgPath = path.join(targetDir, "package.json");
  if (!fs.existsSync(pkgPath)) return;

  log(`📥 Installing production dependencies...`);
  execSync("pnpm install --prod", {
    stdio: "inherit",
    cwd: targetDir,
  });
}

// ── Build Single Plugin ──────────────────────────────────────────────────────

function buildPlugin(name) {
  const devPluginDir = path.join(devDir, name);
  if (!fs.existsSync(devPluginDir)) {
    error(`Plugin "${name}" not found in dev/${name}/`);
  }

  const pluginJsonPath = path.join(devPluginDir, "plugin.json");
  if (!fs.existsSync(pluginJsonPath)) {
    error(`No plugin.json found in dev/${name}/. Is this a plugin?`);
  }

  const type = detectType(devPluginDir);
  log(`\n🔧 Building plugin: ${name} (type: ${type})`);

  // 1. Clean
  cleanBuild(name);

  // 2. Compile TypeScript
  compileTypeScript(name);

  // 3. Package by type
  switch (type) {
    case "skill":
      packageSkill(name);
      break;
    case "hooks":
      packageHooks(name);
      break;
    case "mcp":
      packageMcp(name);
      break;
  }

  log(`✅ Plugin "${name}" built successfully → plugins/${name}/\n`);
}

// ── Build All Plugins ────────────────────────────────────────────────────────

function buildAll() {
  const entries = fs.readdirSync(devDir, { withFileTypes: true });
  const plugins = entries.filter(
    (e) =>
      e.isDirectory() &&
      fs.existsSync(path.join(devDir, e.name, "plugin.json")),
  );

  if (plugins.length === 0) {
    log("No plugins found in dev/. Nothing to build.");
    return;
  }

  log(
    `📋 Found ${plugins.length} plugin(s) to build: ${plugins.map((p) => p.name).join(", ")}`,
  );

  for (const plugin of plugins) {
    buildPlugin(plugin.name);
  }

  log(`\n🎉 All plugins built successfully!`);
}

// ── CLI Entry ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
let pluginName = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--name" && args[i + 1]) {
    pluginName = args[i + 1];
    i++;
  } else if (!args[i].startsWith("--")) {
    // Also support positional: node scripts/build.js ocr
    pluginName = args[i];
  }
}

if (pluginName) {
  buildPlugin(pluginName);
} else {
  buildAll();
}
