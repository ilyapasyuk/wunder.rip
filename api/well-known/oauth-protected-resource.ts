import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getBaseUrl } from '../_lib/http.js'

export default function handler(req: VercelRequest, res: VercelResponse) {
  const issuer = getBaseUrl(req)
  res.status(200).json({
    resource: `${issuer}/api/mcp`,
    authorization_servers: [issuer],
  })
}
