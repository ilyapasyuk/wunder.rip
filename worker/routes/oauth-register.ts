import { readBody } from '../lib/http.js'
import { issueClientId } from '../lib/oauth-client.js'

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return Response.json({ error: 'method_not_allowed' }, { status: 405 })
  }

  const body = (await readBody(req)) as {
    redirect_uris?: unknown
    token_endpoint_auth_method?: string
  }
  const redirectUris = body.redirect_uris
  if (!Array.isArray(redirectUris) || redirectUris.some(uri => typeof uri !== 'string')) {
    return Response.json(
      { error: 'invalid_client_metadata', error_description: 'redirect_uris is required' },
      { status: 400 },
    )
  }

  const clientId = issueClientId(redirectUris as string[])

  return Response.json(
    {
      client_id: clientId,
      redirect_uris: redirectUris,
      token_endpoint_auth_method: 'none',
      grant_types: ['authorization_code'],
      response_types: ['code'],
      client_id_issued_at: Math.floor(Date.now() / 1000),
    },
    { status: 201 },
  )
}
