import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { SimplePool } from "nostr-tools";

const server = new McpServer({
  name: "NostrSnippetsFetcher",
  version: "0.0.1",
});

server.tool(
  "fetchNostrSnippets",
  {
    limit: z.number().default(10),
  },
  async ({ limit }) => {
    try {
      const pool = new SimplePool();

      const relay = "wss://relay.damus.io";

      const filter = {
        kinds: [1337],
        limit: limit,
      };

      const events = await pool.querySync([relay], filter);

      const snippets = events.map((event) => {
        return {
          id: event.id,
          pubkey: event.pubkey,
          created_at: event.created_at,
          content: event.content,
          tags: event.tags,
        };
      });

      pool.close([relay]);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(snippets, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching snippets: ${error.message}`,
          },
        ],
      };
    }
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
