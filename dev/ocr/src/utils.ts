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

import { recognizeImage, recognizeBuffer, OcrResult, OcrOptions } from "./ocr.js";
import { PreprocessStrategy } from "./preprocessor.js";

export interface OcrUtilOptions {
  /** Language code (default: "eng+chi_sim") */
  lang?: string;
  /** Use auto preprocessing (recommended for most images) */
  auto?: boolean;
  /** Try multiple strategies and return best result */
  multiStrategy?: boolean;
  /** Preprocessing strategy: "none" | "grayscale" | "binarize" | "enhance" | "denoise" | "auto" */
  preprocess?: "none" | "grayscale" | "binarize" | "enhance" | "denoise" | "auto";
  /** Page segmentation mode (0-13) */
  psm?: number;
  /** Minimum confidence threshold (0-100) */
  minConfidence?: number;
  /** Silent mode - suppress console output */
  silent?: boolean;
}

export interface OcrUtilResult {
  /** Whether OCR was successful */
  success: boolean;
  /** Recognized text */
  text: string;
  /** Confidence score (0-100) */
  confidence: number;
  /** Preprocessing strategy used */
  strategy?: string;
  /** Error message if failed */
  error?: string;
}

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
export async function ocr(
  image: string | Buffer,
  options: OcrUtilOptions = {}
): Promise<OcrUtilResult> {
  // Build OCR options
  const ocrOptions: OcrOptions = {
    lang: options.lang,
    multiStrategy: options.multiStrategy,
    psm: options.psm,
    minConfidence: options.minConfidence,
    preserveInterwordSpaces: true,
  };

  // Handle preprocessing
  if (options.auto) {
    ocrOptions.preprocess = PreprocessStrategy.AUTO;
  } else if (options.preprocess) {
    ocrOptions.preprocess = options.preprocess as PreprocessStrategy;
  }

  // Silent mode: suppress stdout
  const originalWrite = process.stdout.write.bind(process.stdout);
  if (options.silent) {
    process.stdout.write = () => true;
  }

  let result: OcrResult;

  try {
    if (typeof image === "string") {
      result = await recognizeImage(image, ocrOptions);
    } else if (Buffer.isBuffer(image)) {
      result = await recognizeBuffer(image, ocrOptions);
    } else {
      return {
        success: false,
        text: "",
        confidence: 0,
        error: "Invalid image input. Expected file path (string) or Buffer.",
      };
    }
  } finally {
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
export async function ocrText(
  image: string | Buffer,
  options: OcrUtilOptions = {}
): Promise<string> {
  const result = await ocr(image, { ...options, silent: true });

  if (!result.success) {
    throw new Error(result.error || "OCR failed");
  }

  return result.text;
}

// Re-export types and enums for convenience
export { PreprocessStrategy } from "./preprocessor.js";
export { PageSegMode, OcrOptions, OcrResult } from "./ocr.js";
