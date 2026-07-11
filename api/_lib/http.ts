import type { VercelRequest } from '@vercel/node'

export const getBaseUrl = (req: VercelRequest): string => {
  if (process.env.MCP_PUBLIC_URL) {
    return process.env.MCP_PUBLIC_URL.replace(/\/$/, '')
  }
  const host = req.headers.host
  const proto = (req.headers['x-forwarded-proto'] as string | undefined) || 'https'
  return `${proto}://${host}`
}

export const getBearerToken = (req: VercelRequest): string | undefined => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return undefined
  }
  return header.slice('Bearer '.length).trim()
}
