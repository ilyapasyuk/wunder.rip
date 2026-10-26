import { getUidByEmail } from '../lib/firebase.js'
import { exchangeCodeForUserInfo } from '../lib/google-oauth.js'
import { getBaseUrl, html, redirect } from '../lib/http.js'
import { AUTH_CODE_TTL_MS, type AuthCode } from '../lib/oauth-code.js'
import { sign, verify } from '../lib/token.js'
import type { AuthorizeBundle } from './oauth-authorize.js'

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
      code { background: #f4f4f5; border-radius: 6px; padding: 2px 6px; }
      h1 { font-size: 1.25rem; }
      a { color: #0073ea; }
    </style>
  </head>
  <body>${body}</body>
</html>`

// This route only ever runs as the redirect target of /api/oauth/authorize (registered as
// the Google OAuth client's redirect_uri) — `state` always carries our signed bundle then.
export default async function handler(req: Request): Promise<Response> {
  const params = new URL(req.url).searchParams
  const code = params.get('code') ?? undefined
  const stateParam = params.get('state') ?? undefined

  let bundle: AuthorizeBundle | undefined
  if (stateParam) {
    try {
      bundle = verify<AuthorizeBundle>(stateParam)
    } catch {
      bundle = undefined
    }
  }

  if (!code || !bundle) {
    return html(
      renderPage(
        'Not part of a sign-in',
        `<h1>Not part of a sign-in</h1><p>This link only works as part of connecting an MCP client. Visit <a href="/api/mcp">/api/mcp</a> for instructions.</p>`,
      ),
      400,
    )
  }

  try {
    const redirectUri = `${getBaseUrl(req)}/api/auth/google/callback`
    const userInfo = await exchangeCodeForUserInfo(code, redirectUri)
    const uid = await getUidByEmail(userInfo.email)

    const target = new URL(bundle.redirectUri)
    if (bundle.state) target.searchParams.set('state', bundle.state)

    if (!uid) {
      target.searchParams.set('error', 'access_denied')
      target.searchParams.set('error_description', 'No wunder.rip account for this Google account')
    } else {
      const authCode = sign<AuthCode>(
        { email: userInfo.email, codeChallenge: bundle.codeChallenge },
        AUTH_CODE_TTL_MS,
      )
      target.searchParams.set('code', authCode)
    }

    return redirect(target.toString())
  } catch (error) {
    return html(
      renderPage('Sign-in failed', `<h1>Sign-in failed</h1><p>${escapeHtml(String(error))}</p>`),
      500,
    )
  }
}
