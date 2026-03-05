/**
 * Markdown formatter and file writer for exported sessions
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Session } from "./types.js";

/**
 * Get the source subdirectory name.
 */
export function getSourceDir(session: Session): string {
  return session.source === "claude-code" ? "ClaudeCode" : "Copilot";
}

/**
 * Generate the output filename for a session.
 * Format: YYYY-MM-DD_HH-mm-ss_<first8chars>.md
 * Timestamp-based naming enables chronological sorting by filename.
 */
export function getOutputFilename(session: Session): string {
  const shortId = session.id.slice(0, 8);
  const ts = session.startedAt
    .toISOString()
    .replace(/T/, "_")
    .replace(/:/g, "-")
    .slice(0, 19); // YYYY-MM-DD_HH-mm-ss
  return `${ts}_${shortId}.md`;
}

/**
 * Format a Session into a Markdown string.
 */
export function formatSession(session: Session): string {
  const lines: string[] = [];

  // Header
  const shortId = session.id.slice(0, 8);
  lines.push(`# Session: ${shortId}`);
  lines.push("");

  // Metadata
  const sourceName =
    session.source === "claude-code" ? "Claude Code" : "GitHub Copilot";
  lines.push(`- **Source**: ${sourceName}`);
  lines.push(`- **Session ID**: ${session.id}`);
  lines.push(`- **Project**: ${session.project}`);
  if (session.branch) {
    lines.push(`- **Branch**: ${session.branch}`);
  }
  if (session.model) {
    lines.push(`- **Model**: ${session.model}`);
  }
  if (session.title) {
    lines.push(`- **Title**: ${session.title}`);
  }
  lines.push(
    `- **Date**: ${session.startedAt.toISOString().replace("T", " ").slice(0, 19)}`,
  );
  lines.push("");
  lines.push("---");
  lines.push("");

  // Messages
  for (const msg of session.messages) {
    const heading = msg.role === "user" ? "## User" : "## Assistant";
    const tsComment = msg.timestamp
      ? ` <!-- ${msg.timestamp.toISOString()} -->`
      : "";
    lines.push(`${heading}${tsComment}`);
    lines.push("");
    lines.push(msg.content);
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Write a session to a Markdown file in the output directory.
 * Creates the output directory if it doesn't exist.
 * Returns the written file path.
 */
export async function writeSession(
  session: Session,
  outputDir: string,
): Promise<string> {
  const sourceDir = path.join(outputDir, getSourceDir(session));
  await mkdir(sourceDir, { recursive: true });
  const filename = getOutputFilename(session);
  const filePath = path.join(sourceDir, filename);
  const content = formatSession(session);
  await writeFile(filePath, content, "utf-8");
  return filePath;
}
