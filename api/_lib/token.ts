import { createHmac, timingSafeEqual } from 'node:crypto'

export type Session = {
  email: string
  exp: number
}

const getSecret = (): string => {
  const secret = process.env.MCP_TOKEN_SECRET
  if (!secret) {
    throw new Error('MCP_TOKEN_SECRET is not set')
  }
  return secret
}

const sign = (payload: string, secret: string): string =>
  createHmac('sha256', secret).update(payload).digest('hex')

export const signSession = (session: Session): string => {
  const encoded = Buffer.from(JSON.stringify(session)).toString('base64url')
  const signature = sign(encoded, getSecret())
  return `${encoded}.${signature}`
}

export const parseSession = (token: string): Session => {
  const [encoded, signature] = token.split('.')
  if (!encoded || !signature) {
    throw new Error('Invalid token')
  }

  const expected = sign(encoded, getSecret())
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error('Invalid signature')
  }

  const session = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as Session
  if (Date.now() > session.exp) {
    throw new Error('Session expired')
  }
  return session
}
