import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { AuthCode } from '../_lib/oauth-code.js'
import { verifyPkce } from '../_lib/pkce.js'
import { signSession, verify } from '../_lib/token.js'

const TOKEN_TTL_DAYS = Number(process.env.MCP_TOKEN_TTL_DAYS || 180)

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }

  const body = req.body as Record<string, string | undefined>
  if (body.grant_type !== 'authorization_code') {
    res.status(400).json({ error: 'unsupported_grant_type' })
    return
  }

  const { code, code_verifier: codeVerifier } = body
  if (!code || !codeVerifier) {
    res
      .status(400)
      .json({ error: 'invalid_request', error_description: 'code and code_verifier are required' })
    return
  }

  let authCode: AuthCode
  try {
    authCode = verify<AuthCode>(code)
  } catch {
    res.status(400).json({
      error: 'invalid_grant',
      error_description: 'Authorization code is invalid or expired',
    })
    return
  }

  if (!verifyPkce(codeVerifier, authCode.codeChallenge)) {
    res
      .status(400)
      .json({ error: 'invalid_grant', error_description: 'code_verifier does not match' })
    return
  }

  const allowedEmail = process.env.ALLOWED_EMAIL
  if (!allowedEmail || authCode.email.toLowerCase() !== allowedEmail.toLowerCase()) {
    res.status(403).json({ error: 'access_denied' })
    return
  }

  const accessToken = signSession(authCode.email, TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000)
  res.status(200).json({
    access_token: accessToken,
    token_type: 'bearer',
    expires_in: TOKEN_TTL_DAYS * 24 * 60 * 60,
  })
}
