import { z } from "zod";
import { SimplePool } from "nostr-tools";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function setupFetchNostrRecentCodeSnippets(
  server: McpServer,
  relays: string[]
) {
  server.tool(
    "fetchRecentNostrCodeSnippets",
    {
      limit: z.number().default(10),
    },
    async ({ limit }) => {
      try {
        const pool = new SimplePool();

        const filter = {
          kinds: [1337],
          limit: limit,
        };

        const events = await pool.querySync(relays, filter);

        pool.close(relays);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(events, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching snippets: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
  );
}
