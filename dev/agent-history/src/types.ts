/**
 * Shared types for agent-history CLI
 */

export type Source = "claude-code" | "copilot";

export interface SessionMeta {
  id: string;
  source: Source;
  project: string;
  branch?: string;
  model?: string;
  title?: string;
  startedAt: Date;
  filePath: string;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

export interface Session extends SessionMeta {
  messages: Message[];
}

export interface DiscoverOptions {
  source?: Source;
  project?: string;
}

export interface ExportOptions {
  output?: string;
}
