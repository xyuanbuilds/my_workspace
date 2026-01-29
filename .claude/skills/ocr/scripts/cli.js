#!/usr/bin/env node
import { recognizeImage } from "./ocr.js";
import { getClipboardImage, cleanupTempFile } from "./clipboard.js";
async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
        console.log(`
OCR Tool - Extract text from images using Tesseract

Usage:
  npx ts-node src/cli.ts <image-path>     OCR from file
  npx ts-node src/cli.ts --clipboard      OCR from clipboard
  npx ts-node src/cli.ts --help           Show this help

Options:
  --lang <lang>    Language code (default: eng+chi_sim)
                   Examples: eng, chi_sim, chi_tra, jpn, kor

Examples:
  npx ts-node src/cli.ts ./screenshot.png
  npx ts-node src/cli.ts --clipboard --lang chi_sim
`);
        process.exit(0);
    }
    const isClipboard = args.includes("--clipboard");
    const langIndex = args.indexOf("--lang");
    const lang = langIndex !== -1 ? args[langIndex + 1] : undefined;
    let imagePath;
    let tempFile;
    try {
        if (isClipboard) {
            console.log("Reading image from clipboard...");
            const result = await getClipboardImage();
            if (!result.success) {
                console.error("Error:", result.error);
                process.exit(1);
            }
            imagePath = result.imagePath;
            tempFile = imagePath;
        }
        else {
            // Find file path (first argument that's not a flag)
            imagePath = args.find((arg) => !arg.startsWith("--") && args[args.indexOf(arg) - 1] !== "--lang");
        }
        if (!imagePath) {
            console.error("Error: No image path provided");
            process.exit(1);
        }
        console.log(`Processing: ${isClipboard ? "(clipboard)" : imagePath}`);
        console.log(`Language: ${lang || "eng+chi_sim (default)"}\n`);
        const result = await recognizeImage(imagePath, { lang });
        if (!result.success) {
            console.error("OCR Error:", result.error);
            process.exit(1);
        }
        console.log("\n--- OCR Result ---\n");
        console.log(result.text || "(No text detected)");
        console.log("\n--- End ---");
        if (result.confidence !== undefined) {
            console.log(`\nConfidence: ${result.confidence.toFixed(1)}%`);
        }
    }
    finally {
        if (tempFile) {
            cleanupTempFile(tempFile);
        }
    }
}
main().catch(console.error);
//# sourceMappingURL=cli.js.map