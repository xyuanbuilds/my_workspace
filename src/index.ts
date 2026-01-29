import { recognizeImage } from "./ocr.js";
import { getClipboardImage, cleanupTempFile } from "./clipboard.js";

interface SkillOptions {
  file?: string;
  clipboard?: boolean;
  lang?: string;
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
      "Please provide an image source:\n" +
        "  --file <path>    : Path to an image file\n" +
        "  --clipboard      : Use image from clipboard\n\n" +
        "Example:\n" +
        "  /ocr --file ./screenshot.png\n" +
        "  /ocr --clipboard\n" +
        "  /ocr --file ./image.png --lang chi_sim"
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

    // Perform OCR
    output.write(`Processing image: ${options.clipboard ? "(clipboard)" : imagePath}\n`);
    output.write(`Language: ${options.lang || "eng+chi_sim (default)"}\n\n`);

    const result = await recognizeImage(imagePath, {
      lang: options.lang,
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
