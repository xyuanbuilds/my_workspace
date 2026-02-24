import Tesseract from "tesseract.js";
import * as fs from "fs";
import * as path from "path";
import { ImagePreprocessor, PreprocessStrategy } from "./preprocessor.js";
export var PageSegMode;
(function (PageSegMode) {
    PageSegMode[PageSegMode["OSD_ONLY"] = 0] = "OSD_ONLY";
    PageSegMode[PageSegMode["AUTO_OSD"] = 1] = "AUTO_OSD";
    PageSegMode[PageSegMode["AUTO_ONLY"] = 2] = "AUTO_ONLY";
    PageSegMode[PageSegMode["AUTO"] = 3] = "AUTO";
    PageSegMode[PageSegMode["SINGLE_COLUMN"] = 4] = "SINGLE_COLUMN";
    PageSegMode[PageSegMode["SINGLE_BLOCK_VERT_TEXT"] = 5] = "SINGLE_BLOCK_VERT_TEXT";
    PageSegMode[PageSegMode["SINGLE_BLOCK"] = 6] = "SINGLE_BLOCK";
    PageSegMode[PageSegMode["SINGLE_LINE"] = 7] = "SINGLE_LINE";
    PageSegMode[PageSegMode["SINGLE_WORD"] = 8] = "SINGLE_WORD";
    PageSegMode[PageSegMode["CIRCLE_WORD"] = 9] = "CIRCLE_WORD";
    PageSegMode[PageSegMode["SINGLE_CHAR"] = 10] = "SINGLE_CHAR";
    PageSegMode[PageSegMode["SPARSE_TEXT"] = 11] = "SPARSE_TEXT";
    PageSegMode[PageSegMode["SPARSE_TEXT_OSD"] = 12] = "SPARSE_TEXT_OSD";
    PageSegMode[PageSegMode["RAW_LINE"] = 13] = "RAW_LINE";
})(PageSegMode || (PageSegMode = {}));
const DEFAULT_LANG = "eng+chi_sim";
/**
 * Perform OCR on an image file
 */
export async function recognizeImage(imagePath, options = {}) {
    const lang = options.lang || DEFAULT_LANG;
    // Resolve absolute path
    const absolutePath = path.isAbsolute(imagePath)
        ? imagePath
        : path.resolve(process.cwd(), imagePath);
    // Check if file exists
    if (!fs.existsSync(absolutePath)) {
        return {
            success: false,
            error: `File not found: ${absolutePath}`,
        };
    }
    // Check if file is a valid image format
    const ext = path.extname(absolutePath).toLowerCase();
    const validExtensions = [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp", ".tiff", ".tif"];
    if (!validExtensions.includes(ext)) {
        return {
            success: false,
            error: `Unsupported image format: ${ext}. Supported formats: ${validExtensions.join(", ")}`,
        };
    }
    try {
        // Multi-strategy mode: try multiple preprocessing strategies
        if (options.multiStrategy) {
            return await recognizeWithMultipleStrategies(absolutePath, lang, options);
        }
        // Single strategy mode
        let imageToProcess = absolutePath;
        // Apply preprocessing if specified
        if (options.preprocess && options.preprocess !== PreprocessStrategy.NONE) {
            process.stdout.write(`Preprocessing image with strategy: ${options.preprocess}...\n`);
            imageToProcess = await ImagePreprocessor.preprocess(absolutePath, {
                strategy: options.preprocess,
                ...options.preprocessOptions,
            });
        }
        const result = await performOcr(imageToProcess, lang, options);
        return {
            success: true,
            text: result.text.trim(),
            confidence: result.confidence,
            strategy: options.preprocess || PreprocessStrategy.NONE,
        };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
/**
 * Perform OCR on image buffer (for clipboard images)
 */
export async function recognizeBuffer(buffer, options = {}) {
    const lang = options.lang || DEFAULT_LANG;
    try {
        // Multi-strategy mode: try multiple preprocessing strategies
        if (options.multiStrategy) {
            return await recognizeWithMultipleStrategies(buffer, lang, options);
        }
        // Single strategy mode
        let imageToProcess = buffer;
        // Apply preprocessing if specified
        if (options.preprocess && options.preprocess !== PreprocessStrategy.NONE) {
            process.stdout.write(`Preprocessing image with strategy: ${options.preprocess}...\n`);
            imageToProcess = await ImagePreprocessor.preprocess(buffer, {
                strategy: options.preprocess,
                ...options.preprocessOptions,
            });
        }
        const result = await performOcr(imageToProcess, lang, options);
        return {
            success: true,
            text: result.text.trim(),
            confidence: result.confidence,
            strategy: options.preprocess || PreprocessStrategy.NONE,
        };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
/**
 * Helper function to perform OCR with Tesseract
 */
async function performOcr(image, lang, options) {
    const tesseractConfig = {
        logger: (m) => {
            if (m.status === "recognizing text") {
                process.stdout.write(`\rOCR Progress: ${Math.round(m.progress * 100)}%`);
            }
        },
    };
    // Add Tesseract parameters
    if (options.psm !== undefined) {
        tesseractConfig.tessedit_pageseg_mode = options.psm;
    }
    if (options.oem !== undefined) {
        tesseractConfig.tessedit_ocr_engine_mode = options.oem;
    }
    if (options.preserveInterwordSpaces) {
        tesseractConfig.preserve_interword_spaces = "1";
    }
    const result = await Tesseract.recognize(image, lang, tesseractConfig);
    process.stdout.write("\n");
    return {
        text: result.data.text,
        confidence: result.data.confidence,
    };
}
/**
 * Try multiple preprocessing strategies and return the best result
 */
async function recognizeWithMultipleStrategies(image, lang, options) {
    process.stdout.write("Running multi-strategy OCR (trying multiple preprocessing techniques)...\n\n");
    const strategies = [
        PreprocessStrategy.NONE,
        PreprocessStrategy.AUTO,
        PreprocessStrategy.BINARIZE,
        PreprocessStrategy.ENHANCE,
    ];
    const results = [];
    for (const strategy of strategies) {
        try {
            process.stdout.write(`Trying strategy: ${strategy}... `);
            let imageToProcess = image;
            if (strategy !== PreprocessStrategy.NONE) {
                imageToProcess = await ImagePreprocessor.preprocess(image, {
                    strategy,
                    ...options.preprocessOptions,
                });
            }
            const result = await performOcr(imageToProcess, lang, options);
            results.push({
                strategy,
                text: result.text,
                confidence: result.confidence,
            });
            process.stdout.write(`Confidence: ${result.confidence.toFixed(1)}%\n`);
        }
        catch (error) {
            process.stdout.write(`Failed\n`);
            console.error(`Strategy ${strategy} failed:`, error);
        }
    }
    if (results.length === 0) {
        return {
            success: false,
            error: "All preprocessing strategies failed",
        };
    }
    // Sort by confidence and get the best result
    results.sort((a, b) => b.confidence - a.confidence);
    const bestResult = results[0];
    process.stdout.write(`\nBest strategy: ${bestResult.strategy} (${bestResult.confidence.toFixed(1)}%)\n\n`);
    // Apply minimum confidence threshold if specified
    if (options.minConfidence && bestResult.confidence < options.minConfidence) {
        return {
            success: false,
            error: `OCR confidence (${bestResult.confidence.toFixed(1)}%) below minimum threshold (${options.minConfidence}%)`,
            confidence: bestResult.confidence,
            strategy: bestResult.strategy,
        };
    }
    return {
        success: true,
        text: bestResult.text.trim(),
        confidence: bestResult.confidence,
        strategy: bestResult.strategy,
    };
}
//# sourceMappingURL=ocr.js.map