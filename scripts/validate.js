#!/usr/bin/env node
/**
 * Validate a built Plugin's directory structure
 *
 * Usage:
 *   node scripts/validate.js <name>       # Validate specific plugin
 *   node scripts/validate.js              # Validate all built plugins
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const pluginsDir = path.join(rootDir, "plugins");

// ── Helpers ──────────────────────────────────────────────────────────────────

function log(msg) {
  console.log(msg);
}

/**
 * Recursively find all files matching a pattern
 */
function findFiles(dir, ext) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findFiles(fullPath, ext));
    } else if (entry.name.endsWith(ext)) {
      results.push(fullPath);
    }
  }
  return results;
}

// ── Validation Checks ───────────────────────────────────────────────────────

function validatePlugin(name) {
  const pluginDir = path.join(pluginsDir, name);
  const errors = [];
  const passed = [];

  if (!fs.existsSync(pluginDir)) {
    log(
      `❌ Plugin "${name}" not found at plugins/${name}/. Build it first with: pnpm build:plugin ${name}`,
    );
    return { name, errors: [`plugins/${name}/ does not exist`], passed: [] };
  }

  // 5.1 Check .claude-plugin/plugin.json exists and is valid JSON
  const pluginJsonPath = path.join(pluginDir, ".claude-plugin", "plugin.json");
  if (!fs.existsSync(pluginJsonPath)) {
    errors.push(".claude-plugin/plugin.json is missing");
  } else {
    try {
      const content = fs.readFileSync(pluginJsonPath, "utf-8");
      const json = JSON.parse(content);

      passed.push(".claude-plugin/plugin.json exists and is valid JSON");

      // 5.2 Check plugin.json contains name field
      if (!json.name) {
        errors.push("plugin.json is missing 'name' field");
      } else {
        passed.push(`plugin.json has name: "${json.name}"`);
      }
    } catch (e) {
      errors.push(`.claude-plugin/plugin.json is not valid JSON: ${e.message}`);
    }
  }

  // Detect type from built plugin structure
  const hasSkillDir = fs.existsSync(path.join(pluginDir, "skills"));
  const hasHooksDir = fs.existsSync(path.join(pluginDir, "hooks"));
  const hasMcpJson = fs.existsSync(path.join(pluginDir, ".mcp.json"));

  // 5.3 Check skill type has SKILL.md
  if (hasSkillDir) {
    const skillMd = path.join(pluginDir, "skills", name, "SKILL.md");
    if (!fs.existsSync(skillMd)) {
      errors.push(
        `skills/${name}/SKILL.md is missing (required for skill type)`,
      );
    } else {
      passed.push(`skills/${name}/SKILL.md exists`);
    }
  }

  // 5.4 Check hooks type has hooks.json
  if (hasHooksDir) {
    const hooksJson = path.join(pluginDir, "hooks", "hooks.json");
    if (!fs.existsSync(hooksJson)) {
      errors.push("hooks/hooks.json is missing (required for hooks type)");
    } else {
      passed.push("hooks/hooks.json exists");
    }
  }

  // 5.5 Check no absolute paths in JSON files
  const jsonFiles = findFiles(pluginDir, ".json");
  const absolutePathPatterns = [
    /\/Users\//,
    /\/home\//,
    /\/tmp\//,
    /C:\\/,
    /D:\\/,
  ];

  for (const jsonFile of jsonFiles) {
    const content = fs.readFileSync(jsonFile, "utf-8");
    for (const pattern of absolutePathPatterns) {
      if (pattern.test(content)) {
        const relPath = path.relative(pluginDir, jsonFile);
        errors.push(
          `Absolute path detected in ${relPath} (matches ${pattern})`,
        );
      }
    }
  }
  if (errors.filter((e) => e.includes("Absolute path")).length === 0) {
    passed.push("No absolute paths detected in JSON files");
  }

  return { name, errors, passed };
}

// ── Output Results ───────────────────────────────────────────────────────────

function printResults(results) {
  let allPassed = true;

  for (const { name, errors, passed } of results) {
    log(`\n📋 Validation: ${name}`);
    log("─".repeat(40));

    for (const p of passed) {
      log(`  ✅ ${p}`);
    }
    for (const e of errors) {
      log(`  ❌ ${e}`);
      allPassed = false;
    }
  }

  log("\n" + "═".repeat(40));
  if (allPassed) {
    log("✅ All validations passed!");
  } else {
    log("❌ Some validations failed. See details above.");
    process.exit(1);
  }
}

// ── CLI Entry ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const pluginName = args[0];

if (pluginName) {
  printResults([validatePlugin(pluginName)]);
} else {
  // Validate all built plugins
  if (!fs.existsSync(pluginsDir)) {
    log("No plugins/ directory found. Build plugins first.");
    process.exit(1);
  }

  const entries = fs.readdirSync(pluginsDir, { withFileTypes: true });
  const plugins = entries.filter((e) => e.isDirectory());

  if (plugins.length === 0) {
    log("No built plugins found in plugins/.");
    process.exit(1);
  }

  const results = plugins.map((p) => validatePlugin(p.name));
  printResults(results);
}
