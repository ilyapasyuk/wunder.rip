import { getBaseUrl, html, redirect } from '../lib/http.js'
import { getClient } from '../lib/oauth-client.js'
import { renderMessage } from '../lib/page.js'
import { sign } from '../lib/token.js'

const BUNDLE_TTL_MS = 10 * 60 * 1000

export type AuthorizeBundle = {
  clientId: string
  redirectUri: string
  codeChallenge: string
  state: string | null
}

export default function handler(req: Request): Response {
  const query = Object.fromEntries(new URL(req.url).searchParams) as Record<
    string,
    string | undefined
  >
  const { client_id: clientId, redirect_uri: redirectUri, response_type: responseType } = query
  const codeChallenge = query.code_challenge
  const codeChallengeMethod = query.code_challenge_method
  const state = query.state ?? null

  if (!clientId || !redirectUri) {
    return html(renderMessage('Invalid request', 'Missing client_id or redirect_uri.'), 400)
  }

  const client = getClient(clientId)
  if (!client || !client.redirectUris.includes(redirectUri)) {
    return html(
      renderMessage('Invalid client', 'Unknown client_id or unregistered redirect_uri.'),
      400,
    )
  }

  const redirectWithError = (error: string, description: string) => {
    const target = new URL(redirectUri)
    target.searchParams.set('error', error)
    target.searchParams.set('error_description', description)
    if (state) target.searchParams.set('state', state)
    return redirect(target.toString())
  }

  if (responseType !== 'code') {
    return redirectWithError('unsupported_response_type', 'Only response_type=code is supported')
  }
  if (!codeChallenge || codeChallengeMethod !== 'S256') {
    return redirectWithError('invalid_request', 'PKCE with S256 is required')
  }

  // The web app's /connect page signs the user in (Google or Apple, via Firebase), asks for consent
  // and hands the request back to /api/oauth/complete together with a Firebase ID token.
  const bundle: AuthorizeBundle = { clientId, redirectUri, codeChallenge, state }
  const connect = new URL('/connect', getBaseUrl(req))
  connect.searchParams.set('request', sign<AuthorizeBundle>(bundle, BUNDLE_TTL_MS))
  return redirect(connect.toString())
}
