import Tesseract from "tesseract.js";
import * as fs from "fs";
import * as path from "path";

export interface OcrResult {
  success: boolean;
  text?: string;
  confidence?: number;
  error?: string;
}

export interface OcrOptions {
  lang?: string;
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
    const result = await Tesseract.recognize(absolutePath, lang, {
      logger: (m) => {
        // Optional: log progress
        if (m.status === "recognizing text") {
          process.stdout.write(`\rOCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    process.stdout.write("\n");

    return {
      success: true,
      text: result.data.text.trim(),
      confidence: result.data.confidence,
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
    const result = await Tesseract.recognize(buffer, lang, {
      logger: (m) => {
        if (m.status === "recognizing text") {
          process.stdout.write(`\rOCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    process.stdout.write("\n");

    return {
      success: true,
      text: result.data.text.trim(),
      confidence: result.data.confidence,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
