import type { VercelRequest, VercelResponse } from '@vercel/node'
import { exchangeCodeForUserInfo } from '../../_lib/google-oauth.js'
import { getBaseUrl } from '../../_lib/http.js'
import { signSession } from '../../_lib/token.js'

const TOKEN_TTL_DAYS = Number(process.env.MCP_TOKEN_TTL_DAYS || 180)

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

const renderPage = (title: string, body: string): string => `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font-family: -apple-system, system-ui, sans-serif; max-width: 640px; margin: 10vh auto; padding: 0 24px; color: #1a1a1a; }
      code, pre { background: #f4f4f5; border-radius: 8px; padding: 12px; display: block; overflow-x: auto; word-break: break-all; white-space: pre-wrap; }
      h1 { font-size: 1.25rem; }
    </style>
  </head>
  <body>${body}</body>
</html>`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const code = typeof req.query.code === 'string' ? req.query.code : undefined
  if (!code) {
    res.status(400).send(renderPage('Sign-in failed', '<h1>Missing authorization code</h1>'))
    return
  }

  try {
    const redirectUri = `${getBaseUrl(req)}/api/auth/google/callback`
    const userInfo = await exchangeCodeForUserInfo(code, redirectUri)

    const allowedEmail = process.env.ALLOWED_EMAIL
    if (!allowedEmail || userInfo.email.toLowerCase() !== allowedEmail.toLowerCase()) {
      res
        .status(403)
        .send(
          renderPage(
            'Access denied',
            `<h1>Access denied</h1><p>${escapeHtml(userInfo.email)} is not allowed to use this MCP server.</p>`,
          ),
        )
      return
    }

    const exp = Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
    const token = signSession({ email: userInfo.email, exp })

    res.status(200).send(
      renderPage(
        'wunder.rip MCP token',
        `
        <h1>Signed in as ${escapeHtml(userInfo.email)}</h1>
        <p>Use this bearer token to connect your MCP client to <code>${escapeHtml(getBaseUrl(req))}/api/mcp</code>. It expires in ${TOKEN_TTL_DAYS} days — revisit <code>/api/auth/google</code> to mint a new one.</p>
        <pre>${token}</pre>
        <p>Example (Claude Code):</p>
        <pre>claude mcp add --transport http wunder-rip ${escapeHtml(getBaseUrl(req))}/api/mcp --header "Authorization: Bearer ${token}"</pre>
        `,
      ),
    )
  } catch (error) {
    res
      .status(500)
      .send(
        renderPage('Sign-in failed', `<h1>Sign-in failed</h1><p>${escapeHtml(String(error))}</p>`),
      )
  }
}
