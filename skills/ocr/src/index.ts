import { recognizeImage, PageSegMode } from "./ocr.js";
import { getClipboardImage, cleanupTempFile } from "./clipboard.js";
import { PreprocessStrategy } from "./preprocessor.js";
import { OEM } from "tesseract.js";

interface SkillOptions {
  file?: string;
  clipboard?: boolean;
  lang?: string;
  preprocess?: string; // Preprocessing strategy
  psm?: number; // Page segmentation mode
  oem?: number; // OCR engine mode
  multiStrategy?: boolean; // Try multiple strategies
  enhance?: boolean; // Shortcut for enhance strategy
  auto?: boolean; // Shortcut for auto strategy
}

interface SkillArgs {
  command: string;
  options: SkillOptions;
  args: string[];
}

interface SkillContext {
  cwd: string;
  output: {
    write: (text: string) => void;
    error: (text: string) => void;
    success: (text: string) => void;
  };
}

interface SkillResult {
  success: boolean;
  message?: string;
  data?: {
    text: string;
    confidence?: number;
  };
}

/**
 * OCR Skill entry point
 */
export async function execute(
  args: SkillArgs,
  context: SkillContext
): Promise<SkillResult> {
  const { options } = args;
  const { output } = context;

  // Validate input - must provide either file or clipboard flag
  if (!options.file && !options.clipboard) {
    output.error(
      "Please provide an image source:\n\n" +
        "Basic usage:\n" +
        "  --file <path>      : Path to an image file\n" +
        "  --clipboard        : Use image from clipboard\n" +
        "  --lang <code>      : Language code (default: eng+chi_sim)\n\n" +
        "Preprocessing options (improve accuracy):\n" +
        "  --auto             : Auto preprocessing (recommended)\n" +
        "  --enhance          : Enhance contrast and brightness\n" +
        "  --preprocess <type>: Manual strategy (grayscale, binarize, denoise)\n" +
        "  --multi-strategy   : Try multiple strategies, use best result\n\n" +
        "Advanced options:\n" +
        "  --psm <mode>       : Page segmentation mode (0-13)\n" +
        "  --oem <mode>       : OCR engine mode (0-3)\n\n" +
        "Examples:\n" +
        "  /ocr --file ./screenshot.png\n" +
        "  /ocr --clipboard --auto\n" +
        "  /ocr --file ./image.png --lang chi_sim --enhance\n" +
        "  /ocr --file ./document.png --multi-strategy\n" +
        "  /ocr --file ./receipt.jpg --preprocess binarize --psm 6"
    );
    return {
      success: false,
      message: "No image source specified",
    };
  }

  // Cannot use both file and clipboard
  if (options.file && options.clipboard) {
    output.error("Please specify either --file or --clipboard, not both.");
    return {
      success: false,
      message: "Conflicting options",
    };
  }

  let imagePath: string | undefined;
  let tempFile: string | undefined;

  try {
    // Get image path from file or clipboard
    if (options.clipboard) {
      output.write("Reading image from clipboard...\n");
      const clipboardResult = await getClipboardImage();

      if (!clipboardResult.success) {
        output.error(clipboardResult.error || "Failed to read clipboard");
        return {
          success: false,
          message: clipboardResult.error,
        };
      }

      imagePath = clipboardResult.imagePath;
      tempFile = imagePath; // Mark for cleanup
    } else {
      imagePath = options.file;
    }

    if (!imagePath) {
      output.error("No image path available");
      return {
        success: false,
        message: "No image path",
      };
    }

    // Determine preprocessing strategy
    let preprocessStrategy: PreprocessStrategy = PreprocessStrategy.NONE;

    if (options.multiStrategy) {
      // Multi-strategy mode will be handled by recognizeImage
    } else if (options.auto) {
      preprocessStrategy = PreprocessStrategy.AUTO;
    } else if (options.enhance) {
      preprocessStrategy = PreprocessStrategy.ENHANCE;
    } else if (options.preprocess) {
      // Validate and convert preprocess option
      const validStrategies = Object.values(PreprocessStrategy);
      if (validStrategies.includes(options.preprocess as PreprocessStrategy)) {
        preprocessStrategy = options.preprocess as PreprocessStrategy;
      } else {
        output.error(
          `Invalid preprocessing strategy: ${options.preprocess}\n` +
          `Valid options: ${validStrategies.join(", ")}`
        );
        return {
          success: false,
          message: "Invalid preprocessing strategy",
        };
      }
    }

    // Perform OCR
    output.write(`Processing image: ${options.clipboard ? "(clipboard)" : imagePath}\n`);
    output.write(`Language: ${options.lang || "eng+chi_sim (default)"}\n`);

    if (options.multiStrategy) {
      output.write(`Mode: Multi-strategy (trying multiple preprocessing techniques)\n\n`);
    } else if (preprocessStrategy !== PreprocessStrategy.NONE) {
      output.write(`Preprocessing: ${preprocessStrategy}\n\n`);
    } else {
      output.write(`Preprocessing: none\n\n`);
    }

    const result = await recognizeImage(imagePath, {
      lang: options.lang,
      preprocess: preprocessStrategy,
      psm: options.psm as PageSegMode | undefined,
      oem: options.oem as OEM | undefined,
      multiStrategy: options.multiStrategy,
      preserveInterwordSpaces: true,
    });

    if (!result.success) {
      output.error(`OCR failed: ${result.error}`);
      return {
        success: false,
        message: result.error,
      };
    }

    // Output results
    output.write("\n--- OCR Result ---\n\n");
    output.write(result.text || "(No text detected)");
    output.write("\n\n--- End of OCR Result ---\n");

    if (result.confidence !== undefined) {
      output.write(`\nConfidence: ${result.confidence.toFixed(1)}%\n`);
    }

    if (result.strategy) {
      output.write(`Strategy used: ${result.strategy}\n`);
    }

    return {
      success: true,
      message: "OCR completed successfully",
      data: {
        text: result.text || "",
        confidence: result.confidence,
      },
    };
  } finally {
    // Cleanup temporary file if created
    if (tempFile) {
      cleanupTempFile(tempFile);
    }
  }
}

// Export for CommonJS compatibility
export default { execute };
