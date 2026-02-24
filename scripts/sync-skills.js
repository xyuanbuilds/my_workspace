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
const skillsDir = path.join(rootDir, "dev");
const claudeSkillsDir = path.join(rootDir, ".claude", "skills");
const localSkillsDir = path.join(rootDir, "skills");
const agentsSkillsDir = path.join(rootDir, ".agents", "skills");

// Files to sync for each skill (only these files will be copied)
// If a skill is not listed here, all .js files will be synced
const SKILL_FILES = {
  ocr: ["ocr.js", "preprocessor.js", "clipboard.js", "cli.js", "utils.js"],
};

function syncFiles(skillName, skillDistDir, targetDir) {
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

  return syncedCount;
}

function syncSkill(skillName) {
  const skillDistDir = path.join(skillsDir, skillName, "dist");

  // Check if skill dist exists
  if (!fs.existsSync(skillDistDir)) {
    console.error(`❌ Skill "${skillName}" dist not found at: ${skillDistDir}`);
    console.error(`   Run "npm run build:${skillName}" first.`);
    return false;
  }

  const targets = [
    { root: claudeSkillsDir, label: ".claude/skills" },
    { root: localSkillsDir, label: "skills" },
    { root: agentsSkillsDir, label: ".agents/skills" },
  ];

  for (const { root, label } of targets) {
    const skillRootDir = path.join(root, skillName);
    const scriptsDir = path.join(skillRootDir, "scripts");
    const count = syncFiles(skillName, skillDistDir, scriptsDir);

    // Sync SKILL.md to skill root
    const skillMdSrc = path.join(skillsDir, skillName, "SKILL.md");
    if (fs.existsSync(skillMdSrc)) {
      if (!fs.existsSync(skillRootDir)) {
        fs.mkdirSync(skillRootDir, { recursive: true });
      }
      fs.copyFileSync(skillMdSrc, path.join(skillRootDir, "SKILL.md"));
    }

    // Sync src/package.json to scripts/
    const pkgJsonSrc = path.join(skillsDir, skillName, "src", "package.json");
    if (fs.existsSync(pkgJsonSrc)) {
      fs.copyFileSync(pkgJsonSrc, path.join(scriptsDir, "package.json"));
    }

    console.log(`✅ Synced "${skillName}": ${count} files + SKILL.md + package.json → ${label}/${skillName}/`);
  }

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

console.log("🔄 Syncing skills to .claude/skills/, skills/, .agents/skills/...\n");

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
