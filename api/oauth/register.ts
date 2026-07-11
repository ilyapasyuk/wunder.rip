import type { VercelRequest, VercelResponse } from '@vercel/node'
import { issueClientId } from '../_lib/oauth-client.js'

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }

  const body = req.body as { redirect_uris?: unknown; token_endpoint_auth_method?: string }
  const redirectUris = body.redirect_uris
  if (!Array.isArray(redirectUris) || redirectUris.some(uri => typeof uri !== 'string')) {
    res
      .status(400)
      .json({ error: 'invalid_client_metadata', error_description: 'redirect_uris is required' })
    return
  }

  const clientId = issueClientId(redirectUris as string[])

  res.status(201).json({
    client_id: clientId,
    redirect_uris: redirectUris,
    token_endpoint_auth_method: 'none',
    grant_types: ['authorization_code'],
    response_types: ['code'],
    client_id_issued_at: Math.floor(Date.now() / 1000),
  })
}
