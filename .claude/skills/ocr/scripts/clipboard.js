import { execSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
/**
 * Get image from macOS clipboard and save to a temporary file
 */
export async function getClipboardImage() {
    const platform = os.platform();
    if (platform !== "darwin") {
        return {
            success: false,
            error: `Clipboard image extraction is currently only supported on macOS. Current platform: ${platform}`,
        };
    }
    // Create a temporary file path
    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, `clipboard_${Date.now()}.png`);
    try {
        // Use AppleScript to check if clipboard contains an image
        const checkScript = `
      osascript -e 'clipboard info' 2>/dev/null | grep -q "TIFF\\|PNG\\|JPEG\\|GIF"
    `;
        try {
            execSync(checkScript, { stdio: "pipe" });
        }
        catch {
            return {
                success: false,
                error: "Clipboard does not contain an image. Please copy an image first.",
            };
        }
        // Use AppleScript to save clipboard image to file
        const saveScript = `
      osascript -e '
        set theFile to POSIX file "${tempFile}"
        set pngData to the clipboard as «class PNGf»
        set fileRef to open for access theFile with write permission
        write pngData to fileRef
        close access fileRef
      '
    `;
        execSync(saveScript, { stdio: "pipe" });
        // Verify file was created
        if (!fs.existsSync(tempFile)) {
            return {
                success: false,
                error: "Failed to save clipboard image to temporary file",
            };
        }
        return {
            success: true,
            imagePath: tempFile,
        };
    }
    catch (error) {
        // Cleanup if file was partially created
        if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
/**
 * Clean up temporary clipboard image file
 */
export function cleanupTempFile(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
    catch {
        // Ignore cleanup errors
    }
}
//# sourceMappingURL=clipboard.js.map