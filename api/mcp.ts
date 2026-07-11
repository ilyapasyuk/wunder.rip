import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import * as data from './_lib/db.js'
import { getUidByEmail } from './_lib/firebase-admin.js'
import { getBaseUrl, getBearerToken } from './_lib/http.js'
import { parseSession } from './_lib/token.js'

const jsonRpcError = (code: number, message: string) => ({
  jsonrpc: '2.0' as const,
  error: { code, message },
  id: null,
})

const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, char => {
    switch (char) {
      case '&':
        return '&amp;'
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '"':
        return '&quot;'
      default:
        return '&#39;'
    }
  })

const copyRow = (id: string, code: string): string => `
  <div class="row">
    <code id="${id}">${escapeHtml(code)}</code>
    <button type="button" class="copy" data-target="${id}">Copy</button>
  </div>`

const renderInfoPage = (baseUrl: string): string => `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>wunder.rip MCP</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      :root { color-scheme: light dark; }
      * { box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        max-width: 480px;
        margin: 10vh auto;
        padding: 0 24px;
        color: #323338;
        background: #f6f7fb;
      }
      @media (prefers-color-scheme: dark) {
        body { color: #fff; background: #1a1b23; }
        .card { background: #2d2e3a !important; border-color: #3d3e4a !important; }
        code { background: #1a1b2333 !important; color: #fff !important; }
        .step { color: #a0a0b0 !important; }
        a { color: #cce5ff !important; }
      }
      .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; }
      .logo {
        width: 32px; height: 32px; border-radius: 8px;
        background: linear-gradient(to bottom right, #0073ea, #0060b9);
        color: #fff; display: flex; align-items: center; justify-content: center;
        font-weight: 700; font-size: 0.9rem;
      }
      .brand span.name { font-weight: 600; font-size: 1.1rem; }
      .brand span.accent { color: #0073ea; }
      .card {
        border: 1px solid #d0d4e4;
        border-radius: 12px;
        padding: 18px 20px;
        margin: 12px 0;
        background: #fff;
      }
      .card h2 { font-size: 0.95rem; margin: 0 0 10px; }
      .row { display: flex; align-items: center; gap: 8px; }
      code {
        flex: 1;
        background: #f6f7fb;
        border-radius: 8px;
        padding: 10px 12px;
        overflow-x: auto;
        white-space: pre-wrap;
        word-break: break-all;
        font-size: 0.8rem;
      }
      .copy {
        border: none;
        border-radius: 8px;
        padding: 10px 14px;
        font-size: 0.8rem;
        font-weight: 500;
        cursor: pointer;
        background: #0073ea;
        color: #fff;
        white-space: nowrap;
      }
      .copy:hover { background: #0060b9; }
      .step { color: #676879; font-size: 0.85rem; margin: 8px 0 0; }
      details { margin-top: 16px; }
      summary { cursor: pointer; font-size: 0.85rem; color: #676879; }
      details .card { margin-top: 10px; }
      ol { padding-left: 1.1em; margin: 8px 0 0; font-size: 0.85rem; }
      li { margin: 6px 0; }
    </style>
  </head>
  <body>
    <div class="brand">
      <span class="logo">W</span>
      <span class="name">Wunder<span class="accent">.rip</span> MCP</span>
    </div>

    <div class="card">
      <h2>Claude Code</h2>
      ${copyRow('cc-cmd', `claude mcp add --transport http wunder-rip ${baseUrl}/api/mcp`)}
      <p class="step">Run this, then sign in with Google when the browser opens.</p>
    </div>

    <div class="card">
      <h2>Claude Desktop</h2>
      ${copyRow('cd-url', `${baseUrl}/api/mcp`)}
      <p class="step">Settings → Connectors → Add custom connector → paste this URL.</p>
    </div>

    <details>
      <summary>Other ways to connect</summary>
      <div class="card">
        <h2>Claude Desktop via config file</h2>
        ${copyRow(
          'cd-json',
          `{"mcpServers":{"wunder-rip":{"command":"npx","args":["-y","mcp-remote","${baseUrl}/api/mcp"]}}}`,
        )}
      </div>
      <div class="card">
        <h2>No OAuth support</h2>
        <ol>
          <li>Sign in at <a href="/api/auth/google">/api/auth/google</a></li>
          <li>Copy the token shown there</li>
          <li>${copyRow(
            'manual-cmd',
            `claude mcp add --transport http wunder-rip ${baseUrl}/api/mcp --header "Authorization: Bearer <token>"`,
          )}</li>
        </ol>
      </div>
    </details>

    <script>
      document.querySelectorAll('.copy').forEach(function (button) {
        button.addEventListener('click', function () {
          var target = document.getElementById(button.dataset.target)
          navigator.clipboard.writeText(target.textContent).then(function () {
            var original = button.textContent
            button.textContent = 'Copied!'
            setTimeout(function () { button.textContent = original }, 1200)
          })
        })
      })
    </script>
  </body>
</html>`

const buildServer = (uid: string): McpServer => {
  const server = new McpServer({ name: 'wunder-rip', version: '1.0.0' })

  server.registerTool(
    'list_tasks',
    {
      description: 'List your wunder.rip tasks, optionally filtered by list (folder) id',
      inputSchema: { folderId: z.string().optional().describe('Filter by list id') },
    },
    async ({ folderId }) => {
      const tasks = await data.listTasks(uid)
      const filtered = folderId ? tasks.filter(t => t.folderId === folderId) : tasks
      return { content: [{ type: 'text', text: JSON.stringify(filtered, null, 2) }] }
    },
  )

  server.registerTool(
    'create_task',
    {
      description: 'Create a new task, optionally inside a list (folder)',
      inputSchema: {
        task: z.string().min(1).describe('Task text'),
        folderId: z.string().optional().describe('List id to place the task in'),
      },
    },
    async ({ task, folderId }) => {
      const created = await data.createTask(uid, task, folderId)
      return { content: [{ type: 'text', text: JSON.stringify(created, null, 2) }] }
    },
  )

  server.registerTool(
    'update_task',
    {
      description: 'Update a task text and/or note',
      inputSchema: {
        id: z.string(),
        task: z.string().optional(),
        note: z.string().optional(),
      },
    },
    async ({ id, task, note }) => {
      const changes: Record<string, string> = {}
      if (task !== undefined) changes.task = task
      if (note !== undefined) changes.note = note
      await data.updateTask(uid, id, changes)
      return { content: [{ type: 'text', text: 'ok' }] }
    },
  )

  server.registerTool(
    'set_task_done',
    {
      description: 'Mark a task as done or not done',
      inputSchema: { id: z.string(), done: z.boolean() },
    },
    async ({ id, done }) => {
      await data.setTaskDone(uid, id, done)
      return { content: [{ type: 'text', text: 'ok' }] }
    },
  )

  server.registerTool(
    'delete_task',
    {
      description: 'Delete a task',
      inputSchema: { id: z.string() },
    },
    async ({ id }) => {
      await data.deleteTask(uid, id)
      return { content: [{ type: 'text', text: 'ok' }] }
    },
  )

  server.registerTool(
    'move_task_to_folder',
    {
      description: 'Move a task to a different list (folder), or remove it from any list',
      inputSchema: { id: z.string(), folderId: z.string().nullable() },
    },
    async ({ id, folderId }) => {
      await data.moveTaskToFolder(uid, id, folderId)
      return { content: [{ type: 'text', text: 'ok' }] }
    },
  )

  server.registerTool(
    'list_folders',
    { description: 'List your wunder.rip lists (folders)' },
    async () => {
      const folders = await data.listFolders(uid)
      return { content: [{ type: 'text', text: JSON.stringify(folders, null, 2) }] }
    },
  )

  server.registerTool(
    'create_folder',
    {
      description: 'Create a new list (folder)',
      inputSchema: { name: z.string().min(1) },
    },
    async ({ name }) => {
      const created = await data.createFolder(uid, name)
      return { content: [{ type: 'text', text: JSON.stringify(created, null, 2) }] }
    },
  )

  server.registerTool(
    'rename_folder',
    {
      description: 'Rename a list (folder)',
      inputSchema: { id: z.string(), name: z.string().min(1) },
    },
    async ({ id, name }) => {
      await data.renameFolder(uid, id, name)
      return { content: [{ type: 'text', text: 'ok' }] }
    },
  )

  server.registerTool(
    'delete_folder',
    {
      description: 'Delete a list (folder). Tasks inside it are kept but unassigned from the list.',
      inputSchema: { id: z.string() },
    },
    async ({ id }) => {
      await data.deleteFolder(uid, id)
      return { content: [{ type: 'text', text: 'ok' }] }
    },
  )

  return server
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const accept = req.headers.accept || ''
    if (accept.includes('text/html')) {
      res.status(200).send(renderInfoPage(getBaseUrl(req)))
      return
    }
    res.status(405).json(jsonRpcError(-32000, 'Method not allowed.'))
    return
  }

  if (req.method === 'DELETE') {
    res.status(405).json(jsonRpcError(-32000, 'Method not allowed.'))
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json(jsonRpcError(-32000, 'Method not allowed.'))
    return
  }

  const wwwAuthenticate = `Bearer resource_metadata="${getBaseUrl(req)}/.well-known/oauth-protected-resource"`

  const token = getBearerToken(req)
  if (!token) {
    res.setHeader('WWW-Authenticate', wwwAuthenticate)
    res.status(401).json(jsonRpcError(-32001, 'Missing bearer token'))
    return
  }

  let email: string
  try {
    email = parseSession(token).email
  } catch {
    res.setHeader('WWW-Authenticate', wwwAuthenticate)
    res.status(401).json(jsonRpcError(-32001, 'Invalid or expired token'))
    return
  }

  let uid: string | undefined
  try {
    uid = await getUidByEmail(email)
  } catch (error) {
    console.error('Error resolving uid:', error)
    res.status(500).json(jsonRpcError(-32603, 'Internal server error'))
    return
  }
  if (!uid) {
    res.status(403).json(jsonRpcError(-32001, 'No wunder.rip account for this Google account'))
    return
  }

  try {
    const server = buildServer(uid)
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })
    res.on('close', () => {
      transport.close()
      server.close()
    })
    await server.connect(transport)
    await transport.handleRequest(req, res, req.body)
  } catch (error) {
    console.error('Error handling MCP request:', error)
    if (!res.headersSent) {
      res.status(500).json(jsonRpcError(-32603, 'Internal server error'))
    }
  }
}
