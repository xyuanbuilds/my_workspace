/**
 * GitHub Copilot (VS Code) session discovery and JSONL parser
 *
 * Storage layout:
 *   ~/Library/Application Support/Code/User/workspaceStorage/<hash>/chatSessions/<sessionId>.jsonl
 *
 * workspace.json in each hash directory maps to the real project path.
 * JSONL uses `kind` field: 0=metadata, 1=key-path updates (k=key path, v=value), 2=append operations (k=key path, v=items).
 */

import { createReadStream } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import { createInterface } from "node:readline";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Message, Session, SessionMeta } from "../types.js";

const VSCODE_WORKSPACE_STORAGE = path.join(
  homedir(),
  "Library",
  "Application Support",
  "Code",
  "User",
  "workspaceStorage",
);

/**
 * Discover all Copilot sessions under VS Code workspaceStorage
 */
export async function discoverCopilotSessions(): Promise<SessionMeta[]> {
  const sessions: SessionMeta[] = [];

  let hashDirs: string[];
  try {
    hashDirs = await readdir(VSCODE_WORKSPACE_STORAGE);
  } catch {
    return sessions;
  }

  for (const hash of hashDirs) {
    const hashDir = path.join(VSCODE_WORKSPACE_STORAGE, hash);
    const chatDir = path.join(hashDir, "chatSessions");

    const chatStat = await stat(chatDir).catch(() => null);
    if (!chatStat?.isDirectory()) continue;

    // Resolve project path from workspace.json
    const projectPath = await resolveWorkspacePath(hashDir, hash);

    let files: string[];
    try {
      files = await readdir(chatDir);
    } catch {
      continue;
    }

    for (const file of files) {
      if (!file.endsWith(".jsonl")) continue;
      const sessionId = file.replace(/\.jsonl$/, "");
      const filePath = path.join(chatDir, file);

      const fileStat = await stat(filePath).catch(() => null);
      if (!fileStat) continue;

      sessions.push({
        id: sessionId,
        source: "copilot",
        project: projectPath,
        startedAt: fileStat.mtime,
        filePath,
      });
    }
  }

  return sessions;
}

/**
 * Read workspace.json to resolve workspace hash → real project path.
 * Falls back to the hash if workspace.json is missing or unreadable.
 */
async function resolveWorkspacePath(
  hashDir: string,
  hash: string,
): Promise<string> {
  try {
    const wsFile = path.join(hashDir, "workspace.json");
    const raw = await readFile(wsFile, "utf-8");
    const ws = JSON.parse(raw) as { folder?: string };
    if (ws.folder) {
      // folder is a URI like "file:///Users/xy/Dev/my_skill"
      try {
        return fileURLToPath(ws.folder);
      } catch {
        return ws.folder;
      }
    }
  } catch {
    // Fall through to fallback
  }
  return hash;
}

// ─── JSONL Parser ───────────────────────────────────────────────────────────

/**
 * Copilot JSONL uses an incremental patch model:
 *
 *   kind=0  → session metadata (creationDate, model, etc.)
 *   kind=1  → key-value updates (title, model changes, etc.)
 *   kind=2  → request/response data, identified by `k` path:
 *     k=["requests"]                → appends new request objects (contains user message.text + initial response[])
 *     k=["requests",N,"response"]   → appends response items to request N (contains markdown, thinking, tool calls, etc.)
 *
 * Response items with `value` (string) + `supportThemeIcons` field are markdown text from the assistant.
 * Items with `kind` of "thinking", "toolInvocationSerialized", etc. are skipped.
 */

interface CopilotRequest {
  userText: string;
  responseParts: string[];
}

/**
 * Parse a Copilot JSONL file into a Session.
 * Reconstructs conversations from the incremental patch model,
 * extracting only user↔assistant text content.
 */
export async function parseCopilotSession(meta: SessionMeta): Promise<Session> {
  const requests: CopilotRequest[] = [];
  let title: string | undefined;
  let model: string | undefined;
  let creationDate: Date | undefined;

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
        `[warn] copilot: malformed JSON at ${meta.filePath}:${lineNum}, skipping`,
      );
      continue;
    }

    const kind = entry.kind as number | undefined;
    if (kind === undefined) continue;

    if (kind === 0) {
      // Metadata entry
      const v = entry.v as Record<string, unknown> | undefined;
      if (v) {
        if (typeof v.creationDate === "string") {
          const d = new Date(v.creationDate);
          if (!isNaN(d.getTime())) creationDate = d;
        }
        if (typeof v.model === "string") {
          model = v.model;
        }
      }
    } else if (kind === 1) {
      // Update entry — k is the key path, v is the new value.
      // k=["customTitle"] → session title
      // k=["inputState","selectedModel"] → model identifier
      const k = entry.k as unknown[];
      const v = entry.v;

      if (Array.isArray(k) && k.length === 1 && k[0] === "customTitle") {
        if (typeof v === "string" && v.trim()) {
          title = v.trim();
        }
      } else if (
        Array.isArray(k) &&
        k.length === 2 &&
        k[0] === "inputState" &&
        k[1] === "selectedModel"
      ) {
        // Extract model identifier from JSON like {"identifier":"copilot/claude-opus-4.6",...}
        if (typeof v === "string") {
          try {
            const parsed = JSON.parse(v) as Record<string, unknown>;
            if (typeof parsed.identifier === "string") {
              model = parsed.identifier;
            }
          } catch {
            // Not valid JSON, ignore
          }
        } else if (typeof v === "object" && v !== null) {
          const obj = v as Record<string, unknown>;
          if (typeof obj.identifier === "string") {
            model = obj.identifier;
          }
        }
      }
    } else if (kind === 2) {
      const k = entry.k as unknown[];
      const vArray = entry.v as unknown[];
      if (!Array.isArray(k) || !Array.isArray(vArray)) continue;

      if (k.length === 1 && k[0] === "requests") {
        // k=["requests"] → new request objects appended
        for (const item of vArray) {
          if (typeof item !== "object" || item === null) continue;
          const req = item as Record<string, unknown>;

          const userText = extractUserText(req);
          const responseParts = extractMarkdownFromResponse(req.response);

          requests.push({
            userText: userText ?? "",
            responseParts,
          });
        }
      } else if (
        k.length === 3 &&
        k[0] === "requests" &&
        typeof k[1] === "number" &&
        k[2] === "response"
      ) {
        // k=["requests",N,"response"] → append response items to request N
        const reqIndex = k[1] as number;

        // Ensure the request exists (it should from prior k=["requests"] line)
        while (requests.length <= reqIndex) {
          requests.push({ userText: "", responseParts: [] });
        }

        const markdownParts = extractMarkdownFromItems(vArray);
        requests[reqIndex].responseParts.push(...markdownParts);
      }
    }
  }

  // Assemble messages from collected requests
  const messages: Message[] = [];
  for (const req of requests) {
    if (req.userText) {
      messages.push({ role: "user", content: req.userText });
    }

    // Deduplicate and take the longest version of progressive markdown appends
    const assistantText = deduplicateMarkdown(req.responseParts);
    if (assistantText) {
      messages.push({ role: "assistant", content: assistantText });
    }
  }

  return {
    ...meta,
    title,
    model,
    startedAt: creationDate ?? meta.startedAt,
    messages,
  };
}

/**
 * Extract user message text from a request object.
 */
function extractUserText(req: Record<string, unknown>): string | null {
  const message = req.message as Record<string, unknown> | undefined;
  if (message && typeof message.text === "string" && message.text.trim()) {
    return message.text.trim();
  }
  return null;
}

/**
 * Extract markdown text items from a response array within an initial request.
 */
function extractMarkdownFromResponse(response: unknown): string[] {
  if (!Array.isArray(response)) return [];
  return extractMarkdownFromItems(response);
}

/**
 * Extract markdown text from an array of response items.
 * Only items with `value` (string) + `supportThemeIcons` are markdown content.
 * Skips thinking, tool invocations, text edits, etc.
 */
function extractMarkdownFromItems(items: unknown[]): string[] {
  const parts: string[] = [];

  for (const item of items) {
    if (typeof item !== "object" || item === null) continue;
    const resp = item as Record<string, unknown>;

    // Skip known non-text response kinds
    const respKind = resp.kind as string | undefined;
    if (
      respKind === "thinking" ||
      respKind === "toolInvocationSerialized" ||
      respKind === "progressTaskSerialized" ||
      respKind === "textEditGroup" ||
      respKind === "mcpServersStarting" ||
      respKind === "inlineReference" ||
      respKind === "undoStop" ||
      respKind === "confirmation"
    ) {
      continue;
    }

    // Markdown content has `value` (string) + `supportThemeIcons`
    if (
      typeof resp.value === "string" &&
      "supportThemeIcons" in resp &&
      resp.value.trim()
    ) {
      parts.push(resp.value.trim());
    }
  }

  return parts;
}

/**
 * Deduplicate progressive markdown appends.
 *
 * Copilot JSONL often sends the same markdown content multiple times
 * in progressive updates — each subsequent version includes the previous
 * content plus new content. We keep only the longest non-overlapping parts.
 */
function deduplicateMarkdown(parts: string[]): string | null {
  if (parts.length === 0) return null;

  // Group consecutive parts — if a later part starts with an earlier part's text,
  // it's a progressive update and we should keep only the longer version.
  const deduplicated: string[] = [];

  for (const part of parts) {
    if (deduplicated.length === 0) {
      deduplicated.push(part);
      continue;
    }

    const last = deduplicated[deduplicated.length - 1];

    if (part.startsWith(last)) {
      // This is a progressive update — replace with longer version
      deduplicated[deduplicated.length - 1] = part;
    } else if (last.startsWith(part)) {
      // Previous version was already longer — skip
      continue;
    } else {
      // Different content — append
      deduplicated.push(part);
    }
  }

  const result = deduplicated.join("\n\n").trim();
  return result || null;
}
