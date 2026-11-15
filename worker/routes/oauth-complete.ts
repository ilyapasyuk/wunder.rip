import { getUidByIdToken } from '../lib/firebase.js'
import { readBody } from '../lib/http.js'
import { getClient } from '../lib/oauth-client.js'
import { AUTH_CODE_TTL_MS, type AuthCode } from '../lib/oauth-code.js'
import { sign, verify } from '../lib/token.js'
import type { AuthorizeBundle } from './oauth-authorize.js'

const parseRequest = (request: string | undefined): AuthorizeBundle | undefined => {
  if (!request) return undefined
  try {
    const bundle = verify<AuthorizeBundle>(request)
    const client = getClient(bundle.clientId)
    return client?.redirectUris.includes(bundle.redirectUri) ? bundle : undefined
  } catch {
    return undefined
  }
}

/**
 * Back end of the web app's /connect page.
 * GET  ?request=…                → { redirectHost } so the page can show who is asking.
 * POST { request, idToken }      → { redirect } to the MCP client, carrying an auth code for that Firebase user.
 */
export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'GET') {
    const bundle = parseRequest(new URL(req.url).searchParams.get('request') ?? undefined)
    if (!bundle) {
      return Response.json({ error: 'invalid_request' }, { status: 400 })
    }
    return Response.json({ redirectHost: new URL(bundle.redirectUri).host })
  }
  if (req.method !== 'POST') {
    return Response.json({ error: 'method_not_allowed' }, { status: 405 })
  }

  const body = (await readBody(req)) as Record<string, string | undefined>
  const bundle = parseRequest(body.request)
  if (!bundle) {
    return Response.json(
      {
        error: 'invalid_request',
        error_description:
          'Sign-in request is invalid or expired. Start again from your MCP client.',
      },
      { status: 400 },
    )
  }
  if (!body.idToken) {
    return Response.json(
      { error: 'invalid_request', error_description: 'idToken is required' },
      { status: 400 },
    )
  }

  let uid: string | undefined
  try {
    uid = await getUidByIdToken(body.idToken)
  } catch (error) {
    console.error('Error verifying ID token:', error)
    return Response.json({ error: 'server_error' }, { status: 500 })
  }
  if (!uid) {
    return Response.json(
      { error: 'access_denied', error_description: 'Sign-in expired. Reload the page.' },
      { status: 401 },
    )
  }

  const target = new URL(bundle.redirectUri)
  target.searchParams.set(
    'code',
    sign<AuthCode>({ uid, codeChallenge: bundle.codeChallenge }, AUTH_CODE_TTL_MS),
  )
  if (bundle.state) target.searchParams.set('state', bundle.state)
  return Response.json({ redirect: target.toString() })
}
