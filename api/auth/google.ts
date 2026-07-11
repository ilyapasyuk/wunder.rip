import type { VercelRequest, VercelResponse } from '@vercel/node'
import { buildGoogleAuthUrl } from '../_lib/google-oauth.js'
import { getBaseUrl } from '../_lib/http.js'

export default function handler(req: VercelRequest, res: VercelResponse) {
  const redirectUri = `${getBaseUrl(req)}/api/auth/google/callback`
  res.writeHead(302, { Location: buildGoogleAuthUrl(redirectUri) })
  res.end()
}
