export const getBaseUrl = (req: Request): string => {
  if (process.env.MCP_PUBLIC_URL) {
    return process.env.MCP_PUBLIC_URL.replace(/\/$/, '')
  }
  return new URL(req.url).origin
}

export const getBearerToken = (req: Request): string | undefined => {
  const header = req.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) {
    return undefined
  }
  return header.slice('Bearer '.length).trim()
}

export const html = (body: string, status = 200): Response =>
  new Response(body, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } })

export const redirect = (location: string): Response =>
  new Response(null, { status: 302, headers: { Location: location } })

/** Parses a JSON or form-encoded body; OAuth token requests are form-encoded per RFC 6749. */
export const readBody = async (req: Request): Promise<Record<string, unknown>> => {
  const contentType = req.headers.get('content-type') || ''
  if (contentType.includes('application/x-www-form-urlencoded')) {
    return Object.fromEntries(new URLSearchParams(await req.text()))
  }
  try {
    return (await req.json()) as Record<string, unknown>
  } catch {
    return {}
  }
}
