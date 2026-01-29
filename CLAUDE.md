# OCR Skill

This is a Claude Code Skill that provides OCR (Optical Character Recognition) capabilities using Tesseract.js.

## Usage

```bash
# OCR from a local file
/ocr --file ./path/to/image.png

# OCR from clipboard (screenshot)
/ocr --clipboard

# Specify language (default: eng+chi_sim)
/ocr --file ./image.png --lang chi_tra
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

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev
```
