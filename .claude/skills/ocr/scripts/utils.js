/**
 * OCR Utils - Simple API for programmatic usage
 *
 * Usage:
 *   import { ocr } from './utils.js';
 *
 *   // Simple usage
 *   const text = await ocr('./image.png');
 *
 *   // With options
 *   const result = await ocr('./image.png', { lang: 'chi_sim', auto: true });
 *
 *   // With Buffer
 *   const text = await ocr(imageBuffer);
 */
import { recognizeImage, recognizeBuffer } from "./ocr.js";
import { PreprocessStrategy } from "./preprocessor.js";
/**
 * Perform OCR on an image
 *
 * @param image - File path (string) or image buffer (Buffer)
 * @param options - OCR options
 * @returns OCR result with text and confidence
 *
 * @example
 * ```typescript
 * // Basic usage
 * const result = await ocr('./screenshot.png');
 * console.log(result.text);
 *
 * // With auto preprocessing
 * const result = await ocr('./document.jpg', { auto: true });
 *
 * // With specific language
 * const result = await ocr('./chinese.png', { lang: 'chi_sim' });
 *
 * // Multi-strategy mode (best accuracy)
 * const result = await ocr('./image.png', { multiStrategy: true });
 *
 * // Silent mode (no console output)
 * const result = await ocr('./image.png', { silent: true });
 * ```
 */
export async function ocr(image, options = {}) {
    // Build OCR options
    const ocrOptions = {
        lang: options.lang,
        multiStrategy: options.multiStrategy,
        psm: options.psm,
        minConfidence: options.minConfidence,
        preserveInterwordSpaces: true,
    };
    // Handle preprocessing
    if (options.auto) {
        ocrOptions.preprocess = PreprocessStrategy.AUTO;
    }
    else if (options.preprocess) {
        ocrOptions.preprocess = options.preprocess;
    }
    // Silent mode: suppress stdout
    const originalWrite = process.stdout.write.bind(process.stdout);
    if (options.silent) {
        process.stdout.write = () => true;
    }
    let result;
    try {
        if (typeof image === "string") {
            result = await recognizeImage(image, ocrOptions);
        }
        else if (Buffer.isBuffer(image)) {
            result = await recognizeBuffer(image, ocrOptions);
        }
        else {
            return {
                success: false,
                text: "",
                confidence: 0,
                error: "Invalid image input. Expected file path (string) or Buffer.",
            };
        }
    }
    finally {
        // Restore stdout
        if (options.silent) {
            process.stdout.write = originalWrite;
        }
    }
    return {
        success: result.success,
        text: result.text || "",
        confidence: result.confidence || 0,
        strategy: result.strategy,
        error: result.error,
    };
}
/**
 * Quick OCR - returns text only (throws on error)
 *
 * @param image - File path or Buffer
 * @param options - OCR options
 * @returns Recognized text
 * @throws Error if OCR fails
 *
 * @example
 * ```typescript
 * const text = await ocrText('./image.png');
 * ```
 */
export async function ocrText(image, options = {}) {
    const result = await ocr(image, { ...options, silent: true });
    if (!result.success) {
        throw new Error(result.error || "OCR failed");
    }
    return result.text;
}
// Re-export types and enums for convenience
export { PreprocessStrategy } from "./preprocessor.js";
export { PageSegMode } from "./ocr.js";
//# sourceMappingURL=utils.js.map