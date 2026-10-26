import { getBaseUrl } from '../lib/http.js'

export const authorizationServer = (req: Request): Response => {
  const issuer = getBaseUrl(req)
  return Response.json({
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

export const protectedResource = (req: Request): Response => {
  const issuer = getBaseUrl(req)
  return Response.json({
    resource: `${issuer}/api/mcp`,
    authorization_servers: [issuer],
  })
}
