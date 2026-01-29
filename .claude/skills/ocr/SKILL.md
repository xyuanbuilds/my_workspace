---
name: ocr
description: Extract text from images using OCR. Use when the user needs to read text from screenshots, photos, or image files.
context: fork
allowed-tools: Bash(node *)
---

**IMPORTANT - Path Resolution:**
This skill can be installed in different locations (plugin system, manual installation, global, or project-specific). Before executing any commands, determine the skill directory based on where you loaded this SKILL.md file, and use that path in all commands below. Replace `$SKILL_DIR` with the actual discovered path.

# OCR

Run the OCR CLI directly via Node.js:

## Setup (First Time)

```bash
cd $SKILL_DIR/scripts
npm run setup
```

## Execution Pattern

```bash
cd $SKILL_DIR/scripts
# OCR from file
node cli.js <image-path>

# OCR from file with language
node cli.js <image-path> --lang <lang>

# OCR from clipboard (macOS)
node cli.js --clipboard

# OCR from clipboard with language
node cli.js --clipboard --lang <lang>
```

## Examples

```bash
cd $SKILL_DIR

node cli.js ./screenshot.png
node cli.js /path/to/image.jpg --lang chi_tra
node cli.js --clipboard --lang jpn
```

## Supported Languages

- `eng` - English
- `chi_sim` - Simplified Chinese
- `chi_tra` - Traditional Chinese
- `jpn` - Japanese
- `kor` - Korean
- Combine with `+`: `eng+chi_sim+jpn`

## Supported Formats

PNG, JPG, JPEG, GIF, BMP, WebP, TIFF
