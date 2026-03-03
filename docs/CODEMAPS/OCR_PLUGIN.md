# OCR Plugin (Deep Dive) Codemap

**Last Updated:** 2026-03-03  
**Type:** Skill Plugin | **Status:** ✅ Built & Validated | **Dependencies:** tesseract.js, canvas

## Overview

The OCR (Optical Character Recognition) plugin extracts text from images. It's the primary reference implementation for skill-type plugins in the xy-plugins workspace.

## Plugin Structure

### Source Location: `dev/ocr/`

```
dev/ocr/
├── src/
│   ├── index.ts              Main module
│   ├── cli.ts                CLI entry
│   ├── ocr.ts                OCR logic
│   ├── preprocessor.ts       Image preprocessing
│   ├── clipboard.ts          Clipboard handling
│   ├── utils.ts              Utilities
│   └── package.json          Runtime deps
├── dist/                     (generated)
│   └── *.js                  Compiled output
├── SKILL.md                  Plugin documentation
├── plugin.json               Plugin metadata
├── mcp.json                  MCP server config
├── tsconfig.json             TypeScript config
└── tsconfig.tsbuildinfo
```

### Built Location: `plugins/ocr/`

```
plugins/ocr/
├── .claude-plugin/
│   └── plugin.json
├── skills/ocr/
│   ├── SKILL.md
│   └── scripts/
│       ├── index.js          (from src/index.ts)
│       ├── cli.js            (from src/cli.ts)
│       ├── ocr.js            (from src/ocr.ts)
│       ├── preprocessor.js   (from src/preprocessor.ts)
│       ├── clipboard.js      (from src/clipboard.ts)
│       ├── mcp-server.js     (from src/mcp-server.ts)
│       ├── utils.js          (from src/utils.ts)
│       ├── package.json
│       └── node_modules/
│           ├── tesseract.js
│           ├── canvas
│           └── [transitive deps]
└── .mcp.json
```

## Plugin Metadata

### plugin.json

```json
{
  "name": "ocr",
  "version": "1.0.0",
  "description": "Extract text from images using OCR. Supports file and clipboard input with multiple languages.",
  "author": {
    "name": "xyuanbuilds"
  },
  "keywords": ["ocr", "tesseract", "image-to-text", "clipboard"]
}
```

### SKILL.md (Frontmatter + Usage)

```yaml
---
name: ocr
description: Extract text from images using OCR. Use when the user needs to read text from screenshots, photos, or image files.
context: fork
allowed-tools: Bash(node *)
---
```

### mcp.json (MCP Server Config)

```json
{
  "mcpServers": {
    "ocr": {
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/skills/ocr/scripts/mcp-server.js"]
    }
  }
}
```

## Key Modules

| Module                 | File              | Purpose                     | Inputs                   | Outputs                   |
| ---------------------- | ----------------- | --------------------------- | ------------------------ | ------------------------- |
| **OCR Engine**         | `ocr.ts`          | Core Tesseract integration  | Image path or data       | Extracted text + metadata |
| **Image Preprocessor** | `preprocessor.ts` | Quality enhancement         | Image + options          | Processed image buffer    |
| **Clipboard Handler**  | `clipboard.ts`    | macOS clipboard integration | -                        | Image from clipboard      |
| **CLI Interface**      | `cli.ts`          | Command-line interface      | Args: image-path, --lang | Stdout: extracted text    |
| **Utilities**          | `utils.ts`        | Helper functions            | Various                  | Various                   |

## Data Flow

### OCR Processing Pipeline

```
Input Image
    │
    ├─→ [File] → fs.readFile()
    └─→ [Clipboard] → clipboard.ts → getClipboardImage()
            │
            ▼
    Image Buffer (PNG/JPG/etc)
            │
            ▼
    preprocessor.ts
    ├─ Resize (if needed)
    ├─ Grayscale conversion
    ├─ Contrast enhancement
    └─ Output: Enhanced bitmap
            │
            ▼
    ocr.ts (Tesseract)
    ├─ Initialize engine
    ├─ Load language data (*.traineddata)
    ├─ Recognize text
    └─ Output: Structured text {
         text: string
         confidence: number
         language: string
       }
            │
            ▼
    Output
    ├─ CLI: Print to stdout
    ├─ Programmatic: Return object
    └─ Logging: Confidence, language, timing
```

### CLI Execution

```
$ node scripts/cli.js --clipboard --lang eng

    ▼
cli.ts
    ├─ Parse args: --clipboard, --lang eng
    ├─ Detect input source
    ├─ Call clipboard.ts → getClipboardImage()
    │
    └─→ Call ocr.ts → ocrImage()
        ├─ Initialize Tesseract engine
        ├─ Load eng.traineddata
        ├─ Process image
        └─ Return { text, confidence, language }
            │
            ▼
        Output:
        ├─ Print text to stdout
        ├─ Log timing to stderr
        └─ Exit code: 0 (success) | 1 (error)
```

## Dependencies

### Runtime Dependencies (src/package.json)

```json
{
  "dependencies": {
    "tesseract.js": "^5.1.0",
    "canvas": "^3.2.1"
  }
}
```

| Package          | Version | Purpose          | Notes                               |
| ---------------- | ------- | ---------------- | ----------------------------------- |
| **tesseract.js** | ^5.1.0  | OCR engine       | JavaScript binding to Tesseract     |
| **canvas**       | ^3.2.1  | Image processing | Native module, requires build tools |

### Language Files

Located in `scripts/`:

- `eng.traineddata` — English
- `chi_sim.traineddata` — Simplified Chinese

These are binary data files (not in node_modules) used by Tesseract at runtime.

## Capabilities

### Input Sources

1. **File Path**

   ```bash
   node scripts/cli.js /path/to/image.png
   ```

2. **macOS Clipboard**
   ```bash
   node scripts/cli.js --clipboard
   ```

### Language Support

Controlled by `--lang` parameter:

- `eng` — English (default)
- `chi_sim` — Simplified Chinese
- Extensible: Add more .traineddata files from Tesseract project

### Output

Text extracted from image with:

- Full text
- Confidence scores
- Language detected
- Timing information

## Build & Distribution

### Build Process

```
pnpm build:plugin ocr
    │
    ├─ tsc -p dev/ocr/tsconfig.json
    │  └─ Outputs: dev/ocr/dist/*.js
    │
    ├─ Clean: rm -rf plugins/ocr/
    │
    ├─ Package:
    │  ├─ Create plugins/ocr/.claude-plugin/
    │  ├─ Copy plugin.json
    │  ├─ Create plugins/ocr/skills/ocr/
    │  ├─ Copy SKILL.md
    │  ├─ Deploy dist/*.js → scripts/
    │  ├─ Copy src/package.json → scripts/
    │  └─ Copy .mcp.json → plugins/ocr/
    │
    └─ Install: pnpm install --prod
       └─ Creates: plugins/ocr/skills/ocr/scripts/node_modules/
          ├─ tesseract.js
          ├─ canvas (with native bindings)
          └─ transitive dependencies
```

### Validation

```
pnpm validate ocr

Checks:
✅ .claude-plugin/plugin.json exists and is valid JSON
✅ plugin.json has name: "ocr"
✅ skills/ocr/SKILL.md exists
✅ No absolute paths detected in JSON files

Result: ✅ All validations passed!
```

### Testing

```
pnpm test:plugin ocr
    │
    └─→ claude --plugin-dir ./plugins/ocr
        │
        └─→ Launches Claude Code with OCR plugin loaded
            └─→ Can test skill execution in Claude
```

## Performance Characteristics

### Speed

- **Cold start:** ~2-3s (Tesseract init + language load)
- **Per image:** 1-5s depending on size/quality
- **Memory:** ~100-300MB

### Image Constraints

- **Max size:** Limited by available memory
- **Formats:** PNG, JPG, TIFF, WebP (via canvas)
- **Quality:** Better for high-contrast, clean text

## Platform Support

| Platform    | Status     | Notes                                              |
| ----------- | ---------- | -------------------------------------------------- |
| **macOS**   | ✅ Full    | Clipboard support, native canvas                   |
| **Linux**   | ⚠️ Limited | Clipboard requires xclip; canvas needs build tools |
| **Windows** | ⚠️ Limited | No clipboard support; canvas requires MSVC         |

## Known Limitations

- **Native dependencies:** `canvas` requires C++ build tools
- **Platform-specific:** Clipboard only on macOS
- **Memory usage:** Large images may consume significant RAM
- **Language support:** Currently only eng + chi_sim installed

## Extension Points

To add features:

1. **New language:** Add corresponding .traineddata file
2. **Image processing:** Extend preprocessor.ts
3. **Output formats:** Modify cli.ts
4. **Clipboard:** Extend clipboard.ts for Linux/Windows

## Related Documentation

- [Plugin Development Guide](../GUIDES/PLUGIN_DEVELOPMENT.md) — How to build similar plugins
- [Scaffolding Tools](SCAFFOLDING_TOOLS.md) — How OCR was built
- [Architecture Design](../ARCHITECTURE.md) — System design decisions

---

**Source:** `/Users/xy/Dev/my_skill/dev/ocr/`  
**Built to:** `/Users/xy/Dev/my_skill/plugins/ocr/`  
**Last Updated:** 2026-03-03
