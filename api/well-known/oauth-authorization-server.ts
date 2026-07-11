import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getBaseUrl } from '../_lib/http.js'

export default function handler(req: VercelRequest, res: VercelResponse) {
  const issuer = getBaseUrl(req)
  res.status(200).json({
    issuer,
    authorization_endpoint: `${issuer}/api/oauth/authorize`,
    token_endpoint: `${issuer}/api/oauth/token`,
    registration_endpoint: `${issuer}/api/oauth/register`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none'],
  })
}
