/**
 * {{name}} MCP Server
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({
  name: "{{name}}",
  version: "1.0.0",
});

// TODO: Register tools
server.tool("hello", "A hello world tool", {}, async () => {
  return {
    content: [{ type: "text", text: "Hello from {{name}}!" }],
  };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("{{name}} MCP server running on stdio");
}

main().catch(console.error);
