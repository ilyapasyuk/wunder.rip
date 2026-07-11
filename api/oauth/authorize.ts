import type { VercelRequest, VercelResponse } from '@vercel/node'
import { buildGoogleAuthUrl } from '../_lib/google-oauth.js'
import { getBaseUrl } from '../_lib/http.js'
import { getClient } from '../_lib/oauth-client.js'
import { sign } from '../_lib/token.js'

const BUNDLE_TTL_MS = 10 * 60 * 1000

export type AuthorizeBundle = {
  clientId: string
  redirectUri: string
  codeChallenge: string
  state: string | null
}

const renderError = (title: string, description: string): string => `<!doctype html>
<html>
  <head><meta charset="utf-8" /><title>${title}</title></head>
  <body style="font-family: -apple-system, system-ui, sans-serif; max-width: 640px; margin: 10vh auto; padding: 0 24px;">
    <h1>${title}</h1>
    <p>${description}</p>
  </body>
</html>`

export default function handler(req: VercelRequest, res: VercelResponse) {
  const query = req.query as Record<string, string | undefined>
  const { client_id: clientId, redirect_uri: redirectUri, response_type: responseType } = query
  const codeChallenge = query.code_challenge
  const codeChallengeMethod = query.code_challenge_method
  const state = query.state ?? null

  if (!clientId || !redirectUri) {
    res.status(400).send(renderError('Invalid request', 'Missing client_id or redirect_uri.'))
    return
  }

  const client = getClient(clientId)
  if (!client || !client.redirectUris.includes(redirectUri)) {
    res
      .status(400)
      .send(renderError('Invalid client', 'Unknown client_id or unregistered redirect_uri.'))
    return
  }

  const redirectWithError = (error: string, description: string) => {
    const target = new URL(redirectUri)
    target.searchParams.set('error', error)
    target.searchParams.set('error_description', description)
    if (state) target.searchParams.set('state', state)
    res.writeHead(302, { Location: target.toString() })
    res.end()
  }

  if (responseType !== 'code') {
    redirectWithError('unsupported_response_type', 'Only response_type=code is supported')
    return
  }
  if (!codeChallenge || codeChallengeMethod !== 'S256') {
    redirectWithError('invalid_request', 'PKCE with S256 is required')
    return
  }

  const bundle: AuthorizeBundle = { clientId, redirectUri, codeChallenge, state }
  const googleState = sign<AuthorizeBundle>(bundle, BUNDLE_TTL_MS)
  const googleRedirectUri = `${getBaseUrl(req)}/api/auth/google/callback`

  res.writeHead(302, { Location: buildGoogleAuthUrl(googleRedirectUri, googleState) })
  res.end()
}
