The killed ~Kenny~ Wunderlist

<img width="1563" height="1061" alt="Screenshot 2026-05-22 at 00 55 49" src="https://github.com/user-attachments/assets/90ec398c-b34a-48d9-b761-df04fedbfdb9" />
<img width="1563" height="1061" alt="Screenshot 2026-05-22 at 00 56 38" src="https://github.com/user-attachments/assets/b96e0c94-bf74-4e48-bfbf-dcdaabbe4f66" />

## Repository

| Folder | What |
| --- | --- |
| `/` (root) | Web app + Cloudflare Worker (API, MCP server) on notes.pasyuk.com |
| [`ios/`](ios/) | iOS app (SwiftUI, Share Extension), merged from the archived `wunder.rip-apple` repo with full history |

## MCP server

wunder.rip has an MCP server, so an MCP client (Claude Code, Claude Desktop, etc.) can create, read, update, and delete your tasks and lists for you — authorized as you, with the same Google or Apple sign-in as the web app.

Visit [notes.pasyuk.com/api/mcp](https://notes.pasyuk.com/api/mcp) for live, copy-pasteable instructions, or use the commands below.

**Claude Code:**
```
claude mcp add --transport http wunder-rip https://notes.pasyuk.com/api/mcp
```

**Claude Desktop:** add via Settings → Connectors → Add custom connector, pasting `https://notes.pasyuk.com/api/mcp` — or edit `claude_desktop_config.json` directly:
```json
{
  "mcpServers": {
    "wunder-rip": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://notes.pasyuk.com/api/mcp"]
    }
  }
}
```

Either way, the client opens notes.pasyuk.com the first time: sign in (Google or Apple), click **Allow**, and it's connected.
