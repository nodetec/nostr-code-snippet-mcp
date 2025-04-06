// nostr-client.ts
import { connect } from "node:net";

import { SimplePool } from "nostr-tools";

// Path to the Unix domain socket
const SOCKET_PATH = "/tmp/nostr-signer.sock";

/**
 * Sign a Nostr event using the socket service
 * @param event The event to sign
 * @returns A promise that resolves to the signed event
 */
async function signEvent(event: any): Promise<any> {
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

// Example usage
async function main() {
  try {
    // Create a simple note event
    const event = {
      kind: 1,
      content: "Testing the Nostr signer via Unix domain socket!",
      tags: [
        ["t", "nostr"],
        ["t", "bun"],
        ["t", "typescript"],
      ],
    };

    console.log("Sending event for signing:", event);

    // Sign the event
    const signedEvent = await signEvent(event);

    const pool = new SimplePool();

    pool.publish(["wss://relay.damus.io"], signedEvent);

    console.log("Received signed event:");
    console.log(JSON.stringify(signedEvent, null, 2));

    // Verify the event has the required fields
    if (signedEvent.id && signedEvent.pubkey && signedEvent.sig) {
      console.log("Event successfully signed!");
    } else {
      console.error("Event signing failed or incomplete");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run the example
main();
