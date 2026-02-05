#!/usr/bin/env node
/**
 * Sync script for copying skill build outputs to .claude/skills directory
 *
 * Usage:
 *   node scripts/sync-skills.js          # Sync all skills
 *   node scripts/sync-skills.js ocr      # Sync specific skill
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const skillsDir = path.join(rootDir, "skills");
const claudeSkillsDir = path.join(rootDir, ".claude", "skills");

// Files to sync for each skill (only these files will be copied)
// If a skill is not listed here, all .js files will be synced
const SKILL_FILES = {
  ocr: ["ocr.js", "preprocessor.js", "clipboard.js", "cli.js", "utils.js"],
};

function syncSkill(skillName) {
  const skillDistDir = path.join(skillsDir, skillName, "dist");
  const targetDir = path.join(claudeSkillsDir, skillName, "scripts");

  // Check if skill dist exists
  if (!fs.existsSync(skillDistDir)) {
    console.error(`❌ Skill "${skillName}" dist not found at: ${skillDistDir}`);
    console.error(`   Run "npm run build:${skillName}" first.`);
    return false;
  }

  // Ensure target directory exists
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log(`📁 Created: ${targetDir}`);
  }

  // Get files to sync (use skill-specific list or all .js files)
  const allowedFiles = SKILL_FILES[skillName];
  const distFiles = fs.readdirSync(skillDistDir);

  // Copy files
  let syncedCount = 0;
  for (const file of distFiles) {
    // Only sync .js files (skip .d.ts, .map, etc.)
    if (!file.endsWith(".js")) continue;

    // If skill has specific file list, check if this file is in the list
    if (allowedFiles && !allowedFiles.includes(file)) continue;

    const srcPath = path.join(skillDistDir, file);
    const destPath = path.join(targetDir, file);

    // Check if it's a file (not directory)
    if (!fs.statSync(srcPath).isFile()) continue;

    fs.copyFileSync(srcPath, destPath);
    syncedCount++;
  }

  console.log(
    `✅ Synced "${skillName}": ${syncedCount} files → .claude/skills/${skillName}/scripts/`,
  );
  return true;
}

function getAllSkills() {
  if (!fs.existsSync(skillsDir)) {
    return [];
  }

  return fs.readdirSync(skillsDir).filter((name) => {
    const skillPath = path.join(skillsDir, name);
    return (
      fs.statSync(skillPath).isDirectory() &&
      fs.existsSync(path.join(skillPath, "src"))
    );
  });
}

// Main
const args = process.argv.slice(2);
const specificSkill = args[0];

console.log("🔄 Syncing skills to .claude/skills/...\n");

if (specificSkill) {
  // Sync specific skill
  syncSkill(specificSkill);
} else {
  // Sync all skills
  const skills = getAllSkills();

  if (skills.length === 0) {
    console.log("No skills found in skills/ directory.");
    process.exit(0);
  }

  console.log(`Found ${skills.length} skill(s): ${skills.join(", ")}\n`);

  for (const skill of skills) {
    syncSkill(skill);
  }
}

console.log("\n✨ Done!");
