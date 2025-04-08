import { z } from "zod";
import {
  finalizeEvent,
  nip19,
  SimplePool,
  type EventTemplate,
} from "nostr-tools";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function setupPublishNostrSnippet(server: McpServer, relays: string[]) {
  server.tool(
    "publishNostrCodeSnippet",
    {
      filename: z.string(),
      content: z.string(),
      language: z.string(),
      extension: z.string(),
      description: z.string(),
    },
    async ({ filename, content, language, extension, description }) => {
      try {
        const eventTemplate: EventTemplate = {
          kind: 1337,
          content: content,
          tags: [
            ["name", filename],
            ["l", language],
            ["extension", extension],
            ["description", description],
          ],
          created_at: Math.floor(Date.now() / 1000),
        };

        const nsec = process.env.NSEC;

        if (!nsec) {
          throw new Error("NSEC is not set");
        }

        const secretKey = nip19.decode(nsec)
          .data as Uint8Array<ArrayBufferLike>;

        const signedEvent = await finalizeEvent(eventTemplate, secretKey);

        const pool = new SimplePool();

        pool.publish(relays, signedEvent);

        pool.close(relays);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify("done", null, 2),
            },
          ],
        };
      } catch (error: unknown) {
        return {
          content: [
            {
              type: "text",
              text: `Error publishing snippet: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
  );
}
