import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { setupFetchNostrRecentCodeSnippets } from "./tools/fetchRecentSnippets.js";
import { setupPublishNostrSnippet } from "./tools/publishSnippet.js";

const server = new McpServer({
  name: "NostrCodeSnippetMcp",
  version: "0.0.1",
});

const defaultRelay = "wss://relay.damus.io";

const envRelays = process.env.RELAYS;

const relays = envRelays ? envRelays.split(",") : [defaultRelay];

setupFetchNostrRecentCodeSnippets(server, relays);
setupPublishNostrSnippet(server, relays);

const transport = new StdioServerTransport();
await server.connect(transport);
