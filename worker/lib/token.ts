import { createHmac, timingSafeEqual } from 'node:crypto'

const getSecret = (): string => {
  const secret = process.env.MCP_TOKEN_SECRET
  if (!secret) {
    throw new Error('MCP_TOKEN_SECRET is not set')
  }
  return secret
}

const hmac = (payload: string, secret: string): string =>
  createHmac('sha256', secret).update(payload).digest('hex')

export type Signed<T> = T & { exp: number }

/** Signs an arbitrary JSON-serializable payload with an expiry, HMAC'd — no server-side state needed to verify it later. */
export const sign = <T extends object>(payload: T, ttlMs: number): string => {
  const withExp: Signed<T> = { ...payload, exp: Date.now() + ttlMs }
  const encoded = Buffer.from(JSON.stringify(withExp)).toString('base64url')
  return `${encoded}.${hmac(encoded, getSecret())}`
}

export const verify = <T>(token: string): Signed<T> => {
  const [encoded, signature] = token.split('.')
  if (!encoded || !signature) {
    throw new Error('Invalid token')
  }

  const expected = hmac(encoded, getSecret())
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error('Invalid signature')
  }

  const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as Signed<T>
  if (Date.now() > parsed.exp) {
    throw new Error('Token expired')
  }
  return parsed
}

export type Session = { email: string }

export const signSession = (email: string, ttlMs: number): string => sign<Session>({ email }, ttlMs)

export const parseSession = (token: string): Signed<Session> => verify<Session>(token)
