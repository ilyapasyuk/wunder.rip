import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { z } from 'zod'
import { getImageUrls, uploadImageFromBase64, uploadImageFromUrl } from '../lib/cloudinary.js'
import * as data from '../lib/db.js'
import { getUidByEmail } from '../lib/firebase.js'
import { getBaseUrl, getBearerToken, html } from '../lib/http.js'
import { escapeHtml, renderPage } from '../lib/page.js'
import { parseSession } from '../lib/token.js'

const jsonRpcError = (code: number, message: string) => ({
  jsonrpc: '2.0' as const,
  error: { code, message },
  id: null,
})

const copyRow = (id: string, code: string): string => `
  <div class="row">
    <code id="${id}">${escapeHtml(code)}</code>
    <button type="button" class="copy" data-target="${id}">Copy</button>
  </div>`

const renderInfoPage = (baseUrl: string): string =>
  renderPage(
    'Connect via MCP',
    `<h1>Connect via MCP</h1>
    <p class="lead">Let Claude read and update your tasks. Sign in with Google once, and you're connected.</p>

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
        <p class="step">Edit <code class="path">claude_desktop_config.json</code>, add a <code class="path">wunder-rip</code> entry under <code class="path">mcpServers</code> (create that key if it's not there yet), then restart Claude Desktop.</p>
        <p class="step">
          macOS: <code class="path">~/Library/Application Support/Claude/claude_desktop_config.json</code><br />
          Windows: <code class="path">%APPDATA%\\Claude\\claude_desktop_config.json</code>
        </p>
        <div style="margin-top:12px">
        ${copyRow(
          'cd-json',
          `{
  "mcpServers": {
    "wunder-rip": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "${baseUrl}/api/mcp"]
    }
  }
}`,
        )}
        </div>
        <p class="step">If the file already has other servers, merge just the <code class="path">"wunder-rip": {...}</code> entry into the existing <code class="path">mcpServers</code> object instead of replacing the whole file.</p>
      </div>
    </details>

    <script>
      document.querySelectorAll('.copy').forEach(function (button) {
        button.addEventListener('click', function () {
          var target = document.getElementById(button.dataset.target)
          navigator.clipboard.writeText(target.textContent).then(function () {
            var original = button.textContent
            button.textContent = 'Copied'
            setTimeout(function () { button.textContent = original }, 1200)
          })
        })
      })
    </script>`,
  )

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
    'list_task_images',
    {
      description: "List a task's attached images, with viewable URLs",
      inputSchema: { id: z.string() },
    },
    async ({ id }) => {
      const task = await data.getTask(uid, id)
      const images = (task?.files || []).map(fileId => ({ id: fileId, ...getImageUrls(fileId) }))
      return { content: [{ type: 'text', text: JSON.stringify(images, null, 2) }] }
    },
  )

  server.registerTool(
    'upload_task_image',
    {
      description:
        'Attach an image to a task, either from a URL or from base64-encoded image data. Provide exactly one of imageUrl or imageBase64.',
      inputSchema: {
        id: z.string().describe('Task id'),
        imageUrl: z.string().optional().describe('Publicly reachable URL of the image to attach'),
        imageBase64: z.string().optional().describe('Base64-encoded image data (no data: prefix)'),
        mimeType: z
          .string()
          .optional()
          .describe('Required with imageBase64, e.g. image/png or image/jpeg'),
      },
    },
    async ({ id, imageUrl, imageBase64, mimeType }) => {
      if (!imageUrl && !imageBase64) {
        throw new Error('Provide either imageUrl or imageBase64')
      }
      if (imageBase64 && !mimeType) {
        throw new Error('mimeType is required when using imageBase64')
      }

      const fileId = imageUrl
        ? await uploadImageFromUrl(imageUrl)
        : await uploadImageFromBase64(imageBase64!, mimeType!)

      await data.addTaskFile(uid, id, fileId)
      return {
        content: [
          { type: 'text', text: JSON.stringify({ id: fileId, ...getImageUrls(fileId) }, null, 2) },
        ],
      }
    },
  )

  server.registerTool(
    'delete_task_image',
    {
      description: 'Remove an attached image from a task',
      inputSchema: { id: z.string().describe('Task id'), imageId: z.string() },
    },
    async ({ id, imageId }) => {
      await data.removeTaskFile(uid, id, imageId)
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

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'GET') {
    const accept = req.headers.get('accept') || ''
    if (accept.includes('text/html')) {
      return html(renderInfoPage(getBaseUrl(req)))
    }
    return Response.json(jsonRpcError(-32000, 'Method not allowed.'), { status: 405 })
  }

  if (req.method !== 'POST') {
    return Response.json(jsonRpcError(-32000, 'Method not allowed.'), { status: 405 })
  }

  const unauthorized = (message: string) =>
    Response.json(jsonRpcError(-32001, message), {
      status: 401,
      headers: {
        'WWW-Authenticate': `Bearer resource_metadata="${getBaseUrl(req)}/.well-known/oauth-protected-resource"`,
      },
    })

  const token = getBearerToken(req)
  if (!token) {
    return unauthorized('Missing bearer token')
  }

  let email: string
  try {
    email = parseSession(token).email
  } catch {
    return unauthorized('Invalid or expired token')
  }

  let uid: string | undefined
  try {
    uid = await getUidByEmail(email)
  } catch (error) {
    console.error('Error resolving uid:', error)
    return Response.json(jsonRpcError(-32603, 'Internal server error'), { status: 500 })
  }
  if (!uid) {
    return Response.json(jsonRpcError(-32001, 'No wunder.rip account for this Google account'), {
      status: 403,
    })
  }

  try {
    const server = buildServer(uid)
    // Stateless and JSON-only: each POST gets one complete response, nothing outlives the request.
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    })
    await server.connect(transport)
    return await transport.handleRequest(req)
  } catch (error) {
    console.error('Error handling MCP request:', error)
    return Response.json(jsonRpcError(-32603, 'Internal server error'), { status: 500 })
  }
}
