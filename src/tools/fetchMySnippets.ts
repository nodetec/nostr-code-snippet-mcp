import { z } from "zod";
import { type Filter, getPublicKey, nip19, SimplePool } from "nostr-tools";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function setupFetchMyNostrCodeSnippets(
  server: McpServer,
  relays: string[]
) {
  server.tool(
    "fetchMyNostrCodeSnippets",
    {
      language: z.string().optional(),
      tags: z.array(z.string()).optional(),
      limit: z.number().default(100),
    },
    async ({ limit, language, tags }) => {
      try {
        const nsec = process.env.NSEC;

        if (!nsec) {
          throw new Error("NSEC is not set");
        }

        const secretKey = nip19.decode(nsec)
          .data as Uint8Array<ArrayBufferLike>;

        const publicKey = getPublicKey(secretKey);

        const pool = new SimplePool();

        const filter: Filter = {
          kinds: [1337],
          limit: limit,
          authors: [publicKey],
        };

        if (language) {
          filter["#l"] = [language];
        }

        if (tags) {
          filter["#t"] = tags;
        }

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
