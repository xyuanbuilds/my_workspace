import { createCanvas, loadImage, Canvas, Image, CanvasRenderingContext2D } from "canvas";

export enum PreprocessStrategy {
  NONE = "none",
  GRAYSCALE = "grayscale",
  BINARIZE = "binarize",
  ENHANCE = "enhance",
  DENOISE = "denoise",
  AUTO = "auto",
}

export interface PreprocessOptions {
  strategy?: PreprocessStrategy;
  threshold?: number; // For binarization (0-255)
  contrast?: number; // Contrast multiplier (default: 1.0)
  brightness?: number; // Brightness adjustment (-255 to 255)
  denoise?: boolean; // Apply denoising
}

/**
 * Image preprocessor for improving OCR accuracy
 * Uses Canvas API for browser compatibility
 */
export class ImagePreprocessor {
  /**
   * Preprocess image to improve OCR accuracy
   */
  static async preprocess(
    imagePath: string | Buffer,
    options: PreprocessOptions = {}
  ): Promise<Buffer> {
    const strategy = options.strategy || PreprocessStrategy.AUTO;

    // Load image
    const img = await loadImage(imagePath);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext("2d");

    // Draw original image
    ctx.drawImage(img, 0, 0);

    // Apply preprocessing based on strategy
    switch (strategy) {
      case PreprocessStrategy.NONE:
        // No preprocessing
        break;

      case PreprocessStrategy.GRAYSCALE:
        this.applyGrayscale(ctx, canvas);
        break;

      case PreprocessStrategy.BINARIZE:
        this.applyGrayscale(ctx, canvas);
        this.applyBinarization(ctx, canvas, options.threshold || 128);
        break;

      case PreprocessStrategy.ENHANCE:
        this.applyEnhancement(ctx, canvas, options);
        break;

      case PreprocessStrategy.DENOISE:
        this.applyGrayscale(ctx, canvas);
        this.applyDenoising(ctx, canvas);
        this.applyBinarization(ctx, canvas, options.threshold || 128);
        break;

      case PreprocessStrategy.AUTO:
        // Auto strategy: apply a combination of techniques
        this.applyGrayscale(ctx, canvas);
        this.applyEnhancement(ctx, canvas, {
          contrast: options.contrast || 1.5,
          brightness: options.brightness || 10,
        });
        this.applyDenoising(ctx, canvas);
        this.applyBinarization(ctx, canvas, options.threshold || 128);
        break;
    }

    // Convert canvas to buffer
    return canvas.toBuffer("image/png");
  }

  /**
   * Convert image to grayscale
   */
  private static applyGrayscale(
    ctx: CanvasRenderingContext2D,
    canvas: Canvas
  ): void {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      data[i] = gray; // R
      data[i + 1] = gray; // G
      data[i + 2] = gray; // B
      // Alpha channel (i + 3) remains unchanged
    }

    ctx.putImageData(imageData, 0, 0);
  }

  /**
   * Apply adaptive or fixed threshold binarization
   */
  private static applyBinarization(
    ctx: CanvasRenderingContext2D,
    canvas: Canvas,
    threshold: number = 128
  ): void {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Calculate adaptive threshold if using default
    if (threshold === 128) {
      // Use Otsu's method to find optimal threshold
      threshold = this.calculateOtsuThreshold(data);
    }

    for (let i = 0; i < data.length; i += 4) {
      const value = data[i] > threshold ? 255 : 0;
      data[i] = value; // R
      data[i + 1] = value; // G
      data[i + 2] = value; // B
    }

    ctx.putImageData(imageData, 0, 0);
  }

  /**
   * Calculate optimal threshold using Otsu's method
   */
  private static calculateOtsuThreshold(data: Uint8ClampedArray): number {
    const histogram = new Array(256).fill(0);
    const total = data.length / 4;

    // Build histogram
    for (let i = 0; i < data.length; i += 4) {
      histogram[data[i]]++;
    }

    let sum = 0;
    for (let i = 0; i < 256; i++) {
      sum += i * histogram[i];
    }

    let sumB = 0;
    let wB = 0;
    let wF = 0;
    let maxVariance = 0;
    let threshold = 0;

    for (let i = 0; i < 256; i++) {
      wB += histogram[i];
      if (wB === 0) continue;

      wF = total - wB;
      if (wF === 0) break;

      sumB += i * histogram[i];

      const mB = sumB / wB;
      const mF = (sum - sumB) / wF;

      const variance = wB * wF * (mB - mF) * (mB - mF);

      if (variance > maxVariance) {
        maxVariance = variance;
        threshold = i;
      }
    }

    return threshold;
  }

  /**
   * Enhance contrast and brightness
   */
  private static applyEnhancement(
    ctx: CanvasRenderingContext2D,
    canvas: Canvas,
    options: PreprocessOptions
  ): void {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const contrast = options.contrast || 1.0;
    const brightness = options.brightness || 0;

    // Contrast factor
    const factor = (259 * (contrast * 100 + 255)) / (255 * (259 - contrast * 100));

    for (let i = 0; i < data.length; i += 4) {
      // Apply contrast
      data[i] = factor * (data[i] - 128) + 128;
      data[i + 1] = factor * (data[i + 1] - 128) + 128;
      data[i + 2] = factor * (data[i + 2] - 128) + 128;

      // Apply brightness
      data[i] = Math.min(255, Math.max(0, data[i] + brightness));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + brightness));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + brightness));
    }

    ctx.putImageData(imageData, 0, 0);
  }

  /**
   * Apply simple denoising using median filter
   */
  private static applyDenoising(
    ctx: CanvasRenderingContext2D,
    canvas: Canvas
  ): void {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    // Create a copy of the original data
    const original = new Uint8ClampedArray(data);

    // Apply 3x3 median filter
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;

        // Get 3x3 neighborhood
        const neighborhood: number[] = [];
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nIdx = ((y + dy) * width + (x + dx)) * 4;
            neighborhood.push(original[nIdx]);
          }
        }

        // Sort and get median
        neighborhood.sort((a, b) => a - b);
        const median = neighborhood[4]; // Middle value of 9 elements

        // Apply median to all channels
        data[idx] = median;
        data[idx + 1] = median;
        data[idx + 2] = median;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  /**
   * Get browser-compatible version of the preprocessor
   * This method demonstrates how to use the same logic in browser
   */
  static getBrowserImplementation(): string {
    return `
// Browser-compatible image preprocessor
class ImagePreprocessor {
  static async preprocess(imageElement, options = {}) {
    const canvas = document.createElement('canvas');
    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(imageElement, 0, 0);

    // Apply preprocessing strategies...
    // (Same logic as above but using browser Canvas API)

    return canvas.toDataURL('image/png');
  }
}
    `.trim();
  }
}
