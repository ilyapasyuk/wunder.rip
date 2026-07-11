The killed ~Kenny~ Wunderlist

<img width="1563" height="1061" alt="Screenshot 2026-05-22 at 00 55 49" src="https://github.com/user-attachments/assets/90ec398c-b34a-48d9-b761-df04fedbfdb9" />
<img width="1563" height="1061" alt="Screenshot 2026-05-22 at 00 56 38" src="https://github.com/user-attachments/assets/b96e0c94-bf74-4e48-bfbf-dcdaabbe4f66" />

## MCP server

wunder.rip has an MCP server, so an MCP client (Claude Code, Claude Desktop, etc.) can create, read, update, and delete your tasks and lists for you — authorized as you, via Google sign-in. Works with any Google account that already has a wunder.rip account.

Visit [wunderrip.vercel.app/api/mcp](https://wunderrip.vercel.app/api/mcp) for live, copy-pasteable instructions, or use the commands below.

**Claude Code:**
```
claude mcp add --transport http wunder-rip https://wunderrip.vercel.app/api/mcp
```

**Claude Desktop:** add via Settings → Connectors → Add custom connector, pasting `https://wunderrip.vercel.app/api/mcp` — or edit `claude_desktop_config.json` directly:
```json
{
  "mcpServers": {
    "wunder-rip": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://wunderrip.vercel.app/api/mcp"]
    }
  }
}
```

Either way, the client opens a browser to sign in with Google the first time, then it's connected.
