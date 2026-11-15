# wunder.rip

Tasks, notes and images in one place — web, iPhone, iPad and Apple Watch, free.

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

**Tools:** `list_tasks`, `create_task`, `update_task`, `set_task_done`, `delete_task`, `move_task_to_folder`, `list_task_images`, `upload_task_image`, `delete_task_image`, `list_folders`, `create_folder`, `rename_folder`, `delete_folder`, and `list_smart`.

- Tasks carry the fields from [`shared/DATA_MODEL.md`](shared/DATA_MODEL.md): `when` (`YYYY-MM-DD`, `"someday"` or `null`), `evening`, `reminder` (`HH:mm`, only with a day), `deadline`, `repeat` (`{ unit, every, from }`), `checklist`, `tags`, `completedAt`.
- `create_task` and `update_task` accept those fields; in `update_task`, fields you leave out stay as they are and `null` clears one. A reminder or evening needs a day.
- `set_task_done` on a repeating task creates the next task and returns it as `next`.
- `list_smart` returns one smart list — `today`, `upcoming`, `anytime`, `someday` or `logbook`. Pass `today` (your local `YYYY-MM-DD`); without it the server uses the UTC date. `set_task_done` takes the same `today` for scheduling the next repeat.
