import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { SimplePool } from "nostr-tools";
import { connect } from "node:net";

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
  },
);

async function signEvent(event) {
  return new Promise((resolve, reject) => {
    const client = connect(SOCKET_PATH);

    let data = "";

    client.on("data", (chunk) => {
      data += chunk.toString();
    });

    client.on("end", () => {
      try {
        const signedEvent = JSON.parse(data);
        resolve(signedEvent);
      } catch (error) {
        reject(new Error(`Failed to parse response: ${error}`));
      }
    });

    client.on("error", (error) => {
      reject(new Error(`Socket error: ${error}`));
    });

    // Send the event to be signed
    client.write(JSON.stringify(event));
  });
}

server.tool(
  "publishNostrSnippet",
  {
    filename: z.string(),
    content: z.string(),
    language: z.string(),
    extension: z.string(),
  },
  async ({ filename, content, language, extension }) => {
    try {
      const event = {
        kind: 1337,
        content: content,
        tags: [
          ["name", filename],
          ["l", language],
          ["extension", extension],
        ],
      };

      // const event = {
      //   kind: 1,
      //   content: "Testing the Nostr signer via Unix domain socket!",
      //   tags: [
      //     ["t", "nostr"],
      //     ["t", "bun"],
      //     ["t", "typescript"],
      //   ],
      // };

      const signedEvent = await signEvent(event);

      const pool = new SimplePool();

      pool.publish(["wss://relay.damus.io"], signedEvent);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify("done", null, 2),
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
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
