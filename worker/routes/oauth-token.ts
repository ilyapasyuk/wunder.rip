import { getUidByEmail } from '../lib/firebase.js'
import { readBody } from '../lib/http.js'
import type { AuthCode } from '../lib/oauth-code.js'
import { verifyPkce } from '../lib/pkce.js'
import { signSession, verify } from '../lib/token.js'

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return Response.json({ error: 'method_not_allowed' }, { status: 405 })
  }

  const TOKEN_TTL_DAYS = Number(process.env.MCP_TOKEN_TTL_DAYS || 180)
  const body = (await readBody(req)) as Record<string, string | undefined>
  if (body.grant_type !== 'authorization_code') {
    return Response.json({ error: 'unsupported_grant_type' }, { status: 400 })
  }

  const { code, code_verifier: codeVerifier } = body
  if (!code || !codeVerifier) {
    return Response.json(
      { error: 'invalid_request', error_description: 'code and code_verifier are required' },
      { status: 400 },
    )
  }

  let authCode: AuthCode
  try {
    authCode = verify<AuthCode>(code)
  } catch {
    return Response.json(
      { error: 'invalid_grant', error_description: 'Authorization code is invalid or expired' },
      { status: 400 },
    )
  }

  if (!verifyPkce(codeVerifier, authCode.codeChallenge)) {
    return Response.json(
      { error: 'invalid_grant', error_description: 'code_verifier does not match' },
      { status: 400 },
    )
  }

  let uid: string | undefined
  try {
    uid = await getUidByEmail(authCode.email)
  } catch (error) {
    console.error('Error resolving uid:', error)
    return Response.json({ error: 'server_error' }, { status: 500 })
  }
  if (!uid) {
    return Response.json(
      {
        error: 'access_denied',
        error_description: 'No wunder.rip account for this Google account',
      },
      { status: 403 },
    )
  }

  const accessToken = signSession(authCode.email, TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000)
  return Response.json({
    access_token: accessToken,
    token_type: 'bearer',
    expires_in: TOKEN_TTL_DAYS * 24 * 60 * 60,
  })
}
