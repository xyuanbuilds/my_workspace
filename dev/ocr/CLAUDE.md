# OCR Skill

This is a Claude Code Skill that provides OCR (Optical Character Recognition) capabilities using Tesseract.js with advanced image preprocessing for improved accuracy.

## Features

- Multiple preprocessing strategies to improve OCR accuracy
- Multi-strategy mode: automatically tries different techniques and returns the best result
- Browser-compatible image processing (using Canvas API)
- Support for various languages and image formats
- Advanced Tesseract configuration options

## Basic Usage

```bash
# OCR from a local file
/ocr --file ./path/to/image.png

# OCR from clipboard (screenshot)
/ocr --clipboard

# Specify language (default: eng+chi_sim)
/ocr --file ./image.png --lang chi_tra
```

## Advanced Usage - Improve Accuracy

### Automatic Preprocessing (Recommended)

```bash
# Use auto preprocessing - applies best combination of techniques
/ocr --file ./image.png --auto

# Try multiple strategies and use the best result
/ocr --file ./image.png --multi-strategy
```

### Manual Preprocessing Strategies

```bash
# Enhance contrast and brightness (good for low contrast images)
/ocr --file ./image.png --enhance

# Binarization (convert to black and white)
/ocr --file ./image.png --preprocess binarize

# Grayscale only
/ocr --file ./image.png --preprocess grayscale

# Denoise + binarize (good for noisy images)
/ocr --file ./image.png --preprocess denoise
```

### Advanced Tesseract Options

```bash
# Specify page segmentation mode (PSM)
# PSM 6: Single uniform block of text (default)
# PSM 7: Single text line
# PSM 11: Sparse text
/ocr --file ./image.png --psm 7

# Combine preprocessing with PSM
/ocr --file ./screenshot.png --auto --psm 11
```

## Supported Languages

- `eng` - English
- `chi_sim` - Simplified Chinese
- `chi_tra` - Traditional Chinese
- `jpn` - Japanese
- `kor` - Korean
- Multiple languages: `eng+chi_sim+jpn`

## Supported Image Formats

- PNG, JPG/JPEG, GIF, BMP, WebP, TIFF

## Preprocessing Strategies Explained

- **none**: No preprocessing (default)
- **grayscale**: Convert to grayscale
- **binarize**: Convert to black and white using adaptive thresholding (Otsu's method)
- **enhance**: Improve contrast and brightness
- **denoise**: Apply median filter to reduce noise, then binarize
- **auto**: Automatic combination (grayscale + enhance + denoise + binarize)

## Page Segmentation Modes (PSM)

- `0`: Orientation and script detection only
- `3`: Fully automatic page segmentation (default)
- `6`: Assume a single uniform block of text
- `7`: Treat the image as a single text line
- `8`: Treat the image as a single word
- `11`: Sparse text. Find as much text as possible in no particular order
- `13`: Raw line. Treat the image as a single text line, bypassing hacks

## Tips for Better Accuracy

1. **For screenshots with sparse text**: Use `--multi-strategy` or `--auto --psm 11`
2. **For scanned documents**: Use `--enhance` or `--auto`
3. **For receipts/invoices**: Use `--preprocess binarize --psm 6`
4. **For single line text**: Use `--psm 7`
5. **For noisy images**: Use `--preprocess denoise`

## Browser Compatibility

This skill uses Canvas API for image preprocessing, which is fully compatible with browsers. The preprocessing logic can be easily ported to browser environments.

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev
```
