/**
 * Claude Code session discovery and JSONL parser
 *
 * Storage layout: ~/.claude/projects/<encoded-path>/<sessionId>.jsonl
 * Each line is a JSON object with a `type` field.
 */

import { createReadStream } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import { createInterface } from "node:readline";
import { homedir } from "node:os";
import path from "node:path";
import type { Message, Session, SessionMeta } from "../types.js";

const CLAUDE_PROJECTS_DIR = path.join(homedir(), ".claude", "projects");

/**
 * Discover all Claude Code sessions under ~/.claude/projects/
 */
export async function discoverClaudeCodeSessions(): Promise<SessionMeta[]> {
  const sessions: SessionMeta[] = [];

  let projectDirs: string[];
  try {
    projectDirs = await readdir(CLAUDE_PROJECTS_DIR);
  } catch {
    // Directory doesn't exist — return empty
    return sessions;
  }

  for (const encoded of projectDirs) {
    const projectDir = path.join(CLAUDE_PROJECTS_DIR, encoded);
    const st = await stat(projectDir).catch(() => null);
    if (!st?.isDirectory()) continue;

    let files: string[];
    try {
      files = await readdir(projectDir);
    } catch {
      continue;
    }

    for (const file of files) {
      if (!file.endsWith(".jsonl")) continue;
      const sessionId = file.replace(/\.jsonl$/, "");
      const filePath = path.join(projectDir, file);

      const fileStat = await stat(filePath).catch(() => null);
      if (!fileStat) continue;

      // Quick-scan first few lines to extract cwd for accurate project path
      const projectPath = (await extractCwd(filePath)) ?? encoded;

      sessions.push({
        id: sessionId,
        source: "claude-code",
        project: projectPath,
        startedAt: fileStat.mtime,
        filePath,
      });
    }
  }

  return sessions;
}

/**
 * Extract the `cwd` field from the first user-type message in a JSONL file.
 * Reads only the first few lines for efficiency.
 */
async function extractCwd(filePath: string): Promise<string | null> {
  const rl = createInterface({
    input: createReadStream(filePath, "utf-8"),
    crlfDelay: Infinity,
  });

  let linesRead = 0;
  for await (const line of rl) {
    linesRead++;
    if (linesRead > 10) break; // Only scan first 10 lines

    if (!line.trim()) continue;
    try {
      const entry = JSON.parse(line) as Record<string, unknown>;
      if (typeof entry.cwd === "string") {
        rl.close();
        return entry.cwd;
      }
    } catch {
      continue;
    }
  }

  return null;
}

// ─── JSONL Parser (Task 3.1 + 3.3) ─────────────────────────────────────────

/**
 * Parse a Claude Code JSONL file into a Session.
 * Extracts only user↔assistant text, skipping tool_use, tool_result,
 * thinking, file-history-snapshot, and isMeta messages.
 */
export async function parseClaudeCodeSession(
  meta: SessionMeta,
): Promise<Session> {
  const messages: Message[] = [];
  let branch: string | undefined;
  let model: string | undefined;
  let earliestTimestamp: Date | undefined;

  const rl = createInterface({
    input: createReadStream(meta.filePath, "utf-8"),
    crlfDelay: Infinity,
  });

  let lineNum = 0;
  for await (const line of rl) {
    lineNum++;
    if (!line.trim()) continue;

    let entry: Record<string, unknown>;
    try {
      entry = JSON.parse(line);
    } catch {
      console.error(
        `[warn] claude-code: malformed JSON at ${meta.filePath}:${lineNum}, skipping`,
      );
      continue;
    }

    const type = entry.type as string | undefined;
    if (!type) continue;

    // Extract metadata from early entries
    if (entry.cwd && !branch) {
      // Some entries carry git branch info
    }
    if (typeof entry.model === "string" && !model) {
      model = entry.model as string;
    }

    // Track timestamps
    const ts = parseTimestamp(entry.timestamp);
    if (ts && (!earliestTimestamp || ts < earliestTimestamp)) {
      earliestTimestamp = ts;
    }

    // Skip non-conversation types
    if (
      type === "tool_result" ||
      type === "file-history-snapshot" ||
      type === "summary"
    ) {
      continue;
    }

    const msg = entry.message as Record<string, unknown> | undefined;
    if (!msg) continue;

    if (type === "user") {
      // Skip meta user messages
      if (entry.isMeta === true) continue;

      const text = extractTextContent(msg.content);
      if (text) {
        messages.push({ role: "user", content: text, timestamp: ts });
      }
    } else if (type === "assistant") {
      // Extract model from assistant messages
      if (typeof msg.model === "string" && !model) {
        model = msg.model as string;
      }

      const text = extractTextContent(msg.content);
      if (text) {
        messages.push({ role: "assistant", content: text, timestamp: ts });
      }
    }
  }

  return {
    ...meta,
    branch,
    model,
    startedAt: earliestTimestamp ?? meta.startedAt,
    messages,
  };
}

/**
 * Extract text from Claude Code message content.
 * Content can be a plain string or an array of content blocks.
 * Only type=="text" blocks are kept; tool_use, thinking, etc. are skipped.
 */
function extractTextContent(content: unknown): string | null {
  if (typeof content === "string") {
    return content.trim() || null;
  }

  if (Array.isArray(content)) {
    const texts: string[] = [];
    for (const block of content) {
      if (
        typeof block === "object" &&
        block !== null &&
        (block as Record<string, unknown>).type === "text"
      ) {
        const text = (block as Record<string, unknown>).text;
        if (typeof text === "string" && text.trim()) {
          texts.push(text.trim());
        }
      }
    }
    return texts.length > 0 ? texts.join("\n\n") : null;
  }

  return null;
}

function parseTimestamp(value: unknown): Date | undefined {
  if (!value) return undefined;
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
}
