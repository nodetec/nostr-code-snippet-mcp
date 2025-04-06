import { createServer } from "node:net";
import * as fs from "node:fs";
import {
  finalizeEvent,
  getPublicKey,
  generateSecretKey,
  type Event,
} from "nostr-tools";

const SOCKET_PATH = "/tmp/nostr-signer.sock";

const PRIVATE_KEY = generateSecretKey();

if (fs.existsSync(SOCKET_PATH)) {
  fs.unlinkSync(SOCKET_PATH);
}

const server = createServer((socket) => {
  console.log("Client connected");

  let data = "";

  socket.on("data", (chunk) => {
    data += chunk.toString();

    try {
      const eventData = JSON.parse(data);
      data = "";

      let event: Event;

      if (!eventData.id) {
        event = {
          kind: eventData.kind || 1,
          created_at: Math.floor(Date.now() / 1000),
          tags: eventData.tags || [],
          content: eventData.content || "",
          pubkey: getPublicKey(PRIVATE_KEY),
          id: "",
          sig: "",
        };
      } else {
        event = eventData;
      }

      const signedEvent = finalizeEvent(event, PRIVATE_KEY);

      socket.write(JSON.stringify(signedEvent));
      socket.end();
    } catch (error) {
      if (!(error instanceof SyntaxError)) {
        console.error("Error processing event:", error);
        socket.write(JSON.stringify({ error: "Failed to process event" }));
        socket.end();
        data = "";
      }
    }
  });

  socket.on("error", (err) => {
    console.error("Socket error:", err);
  });
});

server.listen(SOCKET_PATH, () => {
  console.log(`Server listening on ${SOCKET_PATH}`);
});

server.on("error", (err) => {
  console.error("Server error:", err);
});

process.on("SIGINT", () => {
  server.close();
  if (fs.existsSync(SOCKET_PATH)) {
    fs.unlinkSync(SOCKET_PATH);
  }
  process.exit(0);
});
