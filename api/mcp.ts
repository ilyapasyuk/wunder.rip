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

const renderInfoPage = (baseUrl: string): string => `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>wunder.rip MCP server</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font-family: -apple-system, system-ui, sans-serif; max-width: 640px; margin: 10vh auto; padding: 0 24px; color: #1a1a1a; line-height: 1.5; }
      code, pre { background: #f4f4f5; border-radius: 8px; padding: 12px; display: block; overflow-x: auto; word-break: break-all; white-space: pre-wrap; }
      code.inline { display: inline; padding: 2px 6px; }
      h1 { font-size: 1.35rem; }
      ol { padding-left: 1.2em; }
    </style>
  </head>
  <body>
    <h1>wunder.rip MCP server</h1>
    <p>Lets an MCP client (Claude Code, Claude Desktop, etc.) create and manage your wunder.rip tasks and lists, authorized as you via Google sign-in.</p>
    <ol>
      <li>Open <a href="/api/auth/google">/api/auth/google</a> and sign in with your Google account.</li>
      <li>Copy the bearer token shown on the resulting page.</li>
      <li>Add this server to your MCP client, for example:
        <pre>claude mcp add --transport http wunder-rip ${baseUrl}/api/mcp --header "Authorization: Bearer &lt;token&gt;"</pre>
      </li>
    </ol>
    <p>Endpoint: <code class="inline">POST ${baseUrl}/api/mcp</code> (Streamable HTTP, requires the bearer token above).</p>
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

  const token = getBearerToken(req)
  if (!token) {
    res.status(401).json(jsonRpcError(-32001, 'Missing bearer token'))
    return
  }

  let email: string
  try {
    email = parseSession(token).email
  } catch {
    res.status(401).json(jsonRpcError(-32001, 'Invalid or expired token'))
    return
  }

  const allowedEmail = process.env.ALLOWED_EMAIL
  if (!allowedEmail || email.toLowerCase() !== allowedEmail.toLowerCase()) {
    res.status(403).json(jsonRpcError(-32001, 'Not authorized'))
    return
  }

  try {
    const uid = await getUidByEmail(email)
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
