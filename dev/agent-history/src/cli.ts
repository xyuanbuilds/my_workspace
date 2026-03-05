#!/usr/bin/env node
/**
 * agent-history CLI entry point
 *
 * Commands:
 *   list   — List discovered AI coding sessions
 *   export — Export sessions to Markdown files
 */

import { Command } from "commander";
import { discoverSessions, parseSession } from "./index.js";
import { writeSession } from "./formatter.js";
import path from "node:path";
import type { Source } from "./types.js";

const program = new Command();

program
  .name("agent-history")
  .description(
    "Discover and export AI coding assistant conversation history (Claude Code & GitHub Copilot)",
  )
  .version("1.0.0");

// ─── list command ───────────────────────────────────────────────────────────

program
  .command("list")
  .description("List all discovered sessions")
  .option("-s, --source <source>", "Filter by source (claude or copilot)")
  .option("-p, --project <name>", "Filter by project name (substring match)")
  .action(async (opts: { source?: string; project?: string }) => {
    const source = normalizeSource(opts.source);
    const sessions = await discoverSessions({ source, project: opts.project });

    if (sessions.length === 0) {
      console.log("No sessions found.");
      return;
    }

    // Table header
    const header = [
      padEnd("ID", 10),
      padEnd("Source", 12),
      padEnd("Project", 30),
      padEnd("Date", 20),
      "Title",
    ].join("  ");

    console.log(header);
    console.log("-".repeat(header.length));

    for (const s of sessions) {
      const row = [
        padEnd(s.id.slice(0, 8), 10),
        padEnd(s.source, 12),
        padEnd(truncate(s.project, 30), 30),
        padEnd(s.startedAt.toISOString().slice(0, 19).replace("T", " "), 20),
        s.title ?? "",
      ].join("  ");
      console.log(row);
    }

    console.log(`\n${sessions.length} session(s) found.`);
  });

// ─── export command ─────────────────────────────────────────────────────────

program
  .command("export [sessionId]")
  .description("Export sessions to Markdown files")
  .option("-a, --all", "Export all sessions")
  .option("-s, --source <source>", "Filter by source (claude or copilot)")
  .option("-p, --project <name>", "Filter by project name (substring match)")
  .option("-o, --output <dir>", "Output directory (default: current directory)")
  .action(
    async (
      sessionId: string | undefined,
      opts: {
        all?: boolean;
        source?: string;
        project?: string;
        output?: string;
      },
    ) => {
      const source = normalizeSource(opts.source);
      const outputDir = opts.output ? path.resolve(opts.output) : process.cwd();

      if (!sessionId && !opts.all) {
        console.error(
          "Error: Specify a session ID or use --all to export all sessions.",
        );
        process.exit(1);
      }

      const allSessions = await discoverSessions({
        source,
        project: opts.project,
      });

      let toExport = allSessions;
      if (sessionId) {
        toExport = allSessions.filter(
          (s) => s.id === sessionId || s.id.startsWith(sessionId),
        );
        if (toExport.length === 0) {
          console.error(`Error: No session found matching "${sessionId}".`);
          process.exit(1);
        }
      }

      let exportedCount = 0;
      for (const meta of toExport) {
        try {
          const session = await parseSession(meta);
          if (session.messages.length === 0) {
            console.log(
              `Skipping ${meta.id.slice(0, 8)} (no conversation content)`,
            );
            continue;
          }
          const filePath = await writeSession(session, outputDir);
          exportedCount++;
          console.log(`Exported: ${path.basename(filePath)}`);
        } catch (err) {
          console.error(
            `Error exporting ${meta.id.slice(0, 8)}: ${err instanceof Error ? err.message : err}`,
          );
        }
      }

      console.log(`\nDone! ${exportedCount} file(s) exported to ${outputDir}`);
    },
  );

// ─── Helpers ────────────────────────────────────────────────────────────────

function normalizeSource(source?: string): Source | undefined {
  if (!source) return undefined;
  const s = source.toLowerCase();
  if (s === "claude" || s === "claude-code") return "claude-code";
  if (s === "copilot") return "copilot";
  console.error(`Unknown source: ${source}. Use "claude" or "copilot".`);
  process.exit(1);
}

function padEnd(str: string, len: number): string {
  return str.length >= len
    ? str.slice(0, len)
    : str + " ".repeat(len - str.length);
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return "…" + str.slice(str.length - maxLen + 1);
}

// Run
program.parse();
