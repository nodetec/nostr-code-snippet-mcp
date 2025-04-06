import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { SimplePool } from "nostr-tools";
import { createConnection } from "node:net";

const server = new McpServer({
  name: "NostrSnippetsFetcher",
  version: "0.0.1",
});

const SOCKET_PATH = "/tmp/nostr-signer.sock";

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

      pool.close([relay]);

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
            text: `Error fetching snippets: ${error.message}`,
          },
        ],
      };
    }
  }
);

server.tool(
  "publishNostrSnippet",
  {
    content: z.string(),
  },
  async ({ content }) => {
    try {
      const pool = new SimplePool();

      const relay = "wss://relay.damus.io";

      const event = {
        kind: 1337,
        content: content,
        tags: [],
      };

      const client = createConnection(SOCKET_PATH);

      const signedEvent = await new Promise((resolve, reject) => {
        let responseData = "";

        client.on("data", (data) => {
          responseData += data.toString();
          try {
            const signedEvent = JSON.parse(responseData);
            resolve(signedEvent);
          } catch (error) {
            if (!(error instanceof SyntaxError)) {
              reject(error);
            }
          }
        });

        client.on("error", (error) => {
          reject(error);
        });

        client.write(JSON.stringify(event));
      });

      client.end();

      const publishedEvent = pool.publish(relay, signedEvent);

      pool.close([relay]);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(publishedEvent, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error publishing snippet: ${error.message}`,
          },
        ],
      };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
