#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { recognizeImage } from "./ocr.js";
import { getClipboardImage, cleanupTempFile } from "./clipboard.js";

const server = new Server(
  {
    name: "ocr-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "ocr_file",
        description:
          "Extract text from an image file using OCR (Tesseract). Supports PNG, JPG, GIF, BMP, WebP, TIFF formats.",
        inputSchema: {
          type: "object",
          properties: {
            file_path: {
              type: "string",
              description: "Absolute or relative path to the image file",
            },
            lang: {
              type: "string",
              description:
                "OCR language code (default: eng+chi_sim). Examples: eng, chi_sim, chi_tra, jpn, kor. Can combine: eng+chi_sim",
            },
          },
          required: ["file_path"],
        },
      },
      {
        name: "ocr_clipboard",
        description:
          "Extract text from clipboard image using OCR. Works with screenshots copied to clipboard (macOS only).",
        inputSchema: {
          type: "object",
          properties: {
            lang: {
              type: "string",
              description:
                "OCR language code (default: eng+chi_sim). Examples: eng, chi_sim, chi_tra, jpn, kor",
            },
          },
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "ocr_file") {
    const filePath = args?.file_path as string;
    const lang = args?.lang as string | undefined;

    if (!filePath) {
      return {
        content: [
          {
            type: "text",
            text: "Error: file_path is required",
          },
        ],
      };
    }

    const result = await recognizeImage(filePath, { lang });

    if (!result.success) {
      return {
        content: [
          {
            type: "text",
            text: `OCR Error: ${result.error}`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: result.text || "(No text detected)",
        },
      ],
    };
  }

  if (name === "ocr_clipboard") {
    const lang = args?.lang as string | undefined;

    const clipboardResult = await getClipboardImage();

    if (!clipboardResult.success) {
      return {
        content: [
          {
            type: "text",
            text: `Clipboard Error: ${clipboardResult.error}`,
          },
        ],
      };
    }

    const imagePath = clipboardResult.imagePath!;

    try {
      const result = await recognizeImage(imagePath, { lang });

      if (!result.success) {
        return {
          content: [
            {
              type: "text",
              text: `OCR Error: ${result.error}`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: result.text || "(No text detected)",
          },
        ],
      };
    } finally {
      cleanupTempFile(imagePath);
    }
  }

  return {
    content: [
      {
        type: "text",
        text: `Unknown tool: ${name}`,
      },
    ],
  };
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("OCR MCP Server running on stdio");
}

main().catch(console.error);
