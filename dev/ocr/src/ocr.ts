import Tesseract, { PSM, OEM } from "tesseract.js";
import * as fs from "fs";
import * as path from "path";
import { ImagePreprocessor, PreprocessStrategy, PreprocessOptions } from "./preprocessor.js";

export interface OcrResult {
  success: boolean;
  text?: string;
  confidence?: number;
  error?: string;
  strategy?: string; // Which preprocessing strategy was used
}

export enum PageSegMode {
  OSD_ONLY = 0,
  AUTO_OSD = 1,
  AUTO_ONLY = 2,
  AUTO = 3,
  SINGLE_COLUMN = 4,
  SINGLE_BLOCK_VERT_TEXT = 5,
  SINGLE_BLOCK = 6,
  SINGLE_LINE = 7,
  SINGLE_WORD = 8,
  CIRCLE_WORD = 9,
  SINGLE_CHAR = 10,
  SPARSE_TEXT = 11,
  SPARSE_TEXT_OSD = 12,
  RAW_LINE = 13,
}

export interface OcrOptions {
  lang?: string;
  preprocess?: PreprocessStrategy; // Preprocessing strategy
  preprocessOptions?: PreprocessOptions; // Detailed preprocessing options
  psm?: PageSegMode; // Page segmentation mode
  oem?: OEM; // OCR engine mode
  preserveInterwordSpaces?: boolean;
  multiStrategy?: boolean; // Try multiple strategies and return best result
  minConfidence?: number; // Minimum confidence threshold (0-100)
}

const DEFAULT_LANG = "eng+chi_sim";

/**
 * Perform OCR on an image file
 */
export async function recognizeImage(
  imagePath: string,
  options: OcrOptions = {}
): Promise<OcrResult> {
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
    let imageToProcess: string | Buffer = absolutePath;

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
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Perform OCR on image buffer (for clipboard images)
 */
export async function recognizeBuffer(
  buffer: Buffer,
  options: OcrOptions = {}
): Promise<OcrResult> {
  const lang = options.lang || DEFAULT_LANG;

  try {
    // Multi-strategy mode: try multiple preprocessing strategies
    if (options.multiStrategy) {
      return await recognizeWithMultipleStrategies(buffer, lang, options);
    }

    // Single strategy mode
    let imageToProcess: Buffer = buffer;

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
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Helper function to perform OCR with Tesseract
 */
async function performOcr(
  image: string | Buffer,
  lang: string,
  options: OcrOptions
): Promise<{ text: string; confidence: number }> {
  const tesseractConfig: any = {
    logger: (m: any) => {
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
async function recognizeWithMultipleStrategies(
  image: string | Buffer,
  lang: string,
  options: OcrOptions
): Promise<OcrResult> {
  process.stdout.write("Running multi-strategy OCR (trying multiple preprocessing techniques)...\n\n");

  const strategies = [
    PreprocessStrategy.NONE,
    PreprocessStrategy.AUTO,
    PreprocessStrategy.BINARIZE,
    PreprocessStrategy.ENHANCE,
  ];

  const results: Array<{
    strategy: PreprocessStrategy;
    text: string;
    confidence: number;
  }> = [];

  for (const strategy of strategies) {
    try {
      process.stdout.write(`Trying strategy: ${strategy}... `);

      let imageToProcess: string | Buffer = image;

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
    } catch (error) {
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
