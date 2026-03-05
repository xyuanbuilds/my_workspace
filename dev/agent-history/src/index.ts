/**
 * agent-history — unified session discovery and export
 */

import {
  discoverClaudeCodeSessions,
  parseClaudeCodeSession,
} from "./sources/claude-code.js";
import {
  discoverCopilotSessions,
  parseCopilotSession,
} from "./sources/copilot.js";
import type { DiscoverOptions, Session, SessionMeta } from "./types.js";

/**
 * Discover sessions from all sources, applying optional filters.
 */
export async function discoverSessions(
  options: DiscoverOptions = {},
): Promise<SessionMeta[]> {
  const results: SessionMeta[] = [];

  if (!options.source || options.source === "claude-code") {
    const claudeSessions = await discoverClaudeCodeSessions();
    results.push(...claudeSessions);
  }

  if (!options.source || options.source === "copilot") {
    const copilotSessions = await discoverCopilotSessions();
    results.push(...copilotSessions);
  }

  let filtered = results;

  // Filter by project substring
  if (options.project) {
    const projectFilter = options.project.toLowerCase();
    filtered = filtered.filter((s) =>
      s.project.toLowerCase().includes(projectFilter),
    );
  }

  // Sort by date descending
  filtered.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());

  return filtered;
}

/**
 * Parse a session JSONL file into a full Session with messages.
 * Dispatches to the appropriate source parser.
 */
export async function parseSession(meta: SessionMeta): Promise<Session> {
  switch (meta.source) {
    case "claude-code":
      return parseClaudeCodeSession(meta);
    case "copilot":
      return parseCopilotSession(meta);
    default:
      throw new Error(`Unknown source: ${meta.source}`);
  }
}
