# 🤖 nostr-code-snippet-mcp

[video demo](https://v.nostr.build/RSMqDK9pwTIm6bxu.mp4)


Add this to your claude config file:

```json
{
  "mcpServers": {
    "notebin": {
      "command": "node",
      "args": ["/Users/<path to>/nostr-code-snippet-mcp/index.js"]
    }
  }
}
```

**NOTE**: be sure to replace `<path to>` with the path to wherever you cloned the repo

Your claude config file can be found at the following locations:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Linux: `~/.config/claude/claude_desktop_config.json`

