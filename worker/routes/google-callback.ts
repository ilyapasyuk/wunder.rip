import { getUidByEmail } from '../lib/firebase.js'
import { exchangeCodeForUserInfo } from '../lib/google-oauth.js'
import { getBaseUrl, html, redirect } from '../lib/http.js'
import { AUTH_CODE_TTL_MS, type AuthCode } from '../lib/oauth-code.js'
import { escapeHtml, renderMessage } from '../lib/page.js'
import { sign, verify } from '../lib/token.js'
import type { AuthorizeBundle } from './oauth-authorize.js'

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
      renderMessage(
        'Not part of a sign-in',
        'This link only works as part of connecting an MCP client. Visit <a href="/api/mcp">/api/mcp</a> for instructions.',
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
    return html(renderMessage('Sign-in failed', escapeHtml(String(error))), 500)
  }
}
