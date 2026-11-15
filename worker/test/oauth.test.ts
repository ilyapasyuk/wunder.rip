import { afterEach, beforeAll, beforeEach, describe, expect, test } from 'bun:test'
import { createHash, generateKeyPairSync } from 'node:crypto'
import { issueClientId } from '../lib/oauth-client.js'
import { parseSession, resolveSessionUid, signSession } from '../lib/token.js'
import authorize from '../routes/oauth-authorize.js'
import complete from '../routes/oauth-complete.js'
import token from '../routes/oauth-token.js'

const BASE = 'https://notes.example'
const REDIRECT = 'http://localhost:5555/callback'
const VERIFIER = 'a'.repeat(50)
const CHALLENGE = createHash('sha256').update(VERIFIER).digest('base64url')

// Identity Toolkit, as the fake Firebase answers it: idToken -> uid, email -> uid.
const ID_TOKENS: Record<string, string> = { 'good-id-token': 'uid-apple-user' }
const EMAILS: Record<string, string> = { 'old@example.com': 'uid-legacy' }

const realFetch = globalThis.fetch
let lookups: unknown[] = []

beforeAll(() => {
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
  process.env.MCP_TOKEN_SECRET = 'test-secret'
  process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({
    client_email: 'sa@test',
    private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }),
  })
})

beforeEach(() => {
  lookups = []
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    if (url.startsWith('https://oauth2.googleapis.com/token')) {
      return Response.json({ access_token: 'sa-token', expires_in: 3600 })
    }
    if (url.startsWith('https://identitytoolkit.googleapis.com/v1/accounts:lookup')) {
      const body = JSON.parse(String(init?.body)) as { idToken?: string; email?: string[] }
      lookups.push(body)
      if (body.idToken !== undefined) {
        const uid = ID_TOKENS[body.idToken]
        return uid
          ? Response.json({ users: [{ localId: uid }] })
          : Response.json({ error: { message: 'INVALID_ID_TOKEN' } }, { status: 400 })
      }
      const uid = EMAILS[body.email?.[0] ?? '']
      return Response.json(uid ? { users: [{ localId: uid }] } : {})
    }
    throw new Error(`unexpected fetch ${url}`)
  }) as typeof fetch
})

afterEach(() => {
  globalThis.fetch = realFetch
})

const authorizeUrl = (overrides: Record<string, string> = {}) => {
  const params = new URLSearchParams({
    client_id: issueClientId([REDIRECT]),
    redirect_uri: REDIRECT,
    response_type: 'code',
    code_challenge: CHALLENGE,
    code_challenge_method: 'S256',
    state: 'xyz',
    ...overrides,
  })
  return `${BASE}/api/oauth/authorize?${params}`
}

/** Follows authorize -> the /connect page's request token. */
const startAuthorization = () => {
  const response = authorize(new Request(authorizeUrl()))
  expect(response.status).toBe(302)
  const location = new URL(response.headers.get('Location') ?? '')
  expect(location.origin + location.pathname).toBe(`${BASE}/connect`)
  const request = location.searchParams.get('request')
  expect(request).toBeTruthy()
  return request as string
}

const postComplete = (body: Record<string, string>) =>
  complete(
    new Request(`${BASE}/api/oauth/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  )

const exchange = (code: string, verifier = VERIFIER) =>
  token(
    new Request(`${BASE}/api/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        code_verifier: verifier,
      }),
    }),
  )

describe('MCP sign-in through the web app (any Firebase provider)', () => {
  test('authorize sends the browser to the /connect consent page', () => {
    startAuthorization()
  })

  test('/connect can show which app is asking', async () => {
    const response = await complete(
      new Request(`${BASE}/api/oauth/complete?request=${startAuthorization()}`),
    )
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ redirectHost: 'localhost:5555' })
  })

  test('a signed-in user approving gets a code that exchanges for a token bound to their uid', async () => {
    const response = await postComplete({ request: startAuthorization(), idToken: 'good-id-token' })
    expect(response.status).toBe(200)
    const { redirect } = (await response.json()) as { redirect: string }
    const target = new URL(redirect)
    expect(target.origin + target.pathname).toBe(REDIRECT)
    expect(target.searchParams.get('state')).toBe('xyz')

    const tokenResponse = await exchange(target.searchParams.get('code') as string)
    expect(tokenResponse.status).toBe(200)
    const { access_token: accessToken } = (await tokenResponse.json()) as { access_token: string }
    expect(await resolveSessionUid(parseSession(accessToken))).toBe('uid-apple-user')
  })

  test('an invalid Firebase ID token is rejected and no code is issued', async () => {
    const response = await postComplete({ request: startAuthorization(), idToken: 'forged' })
    expect(response.status).toBe(401)
  })

  test('a tampered request is rejected before Firebase is asked', async () => {
    const response = await postComplete({
      request: `${startAuthorization()}x`,
      idToken: 'good-id-token',
    })
    expect(response.status).toBe(400)
    expect(lookups).toEqual([])
  })

  test('the code only works with the matching PKCE verifier', async () => {
    const response = await postComplete({ request: startAuthorization(), idToken: 'good-id-token' })
    const { redirect } = (await response.json()) as { redirect: string }
    const code = new URL(redirect).searchParams.get('code') as string
    expect((await exchange(code, 'b'.repeat(50))).status).toBe(400)
  })
})

describe('sessions issued before this change', () => {
  test('email-based tokens keep working', async () => {
    const legacy = signSession({ email: 'old@example.com' }, 60_000)
    expect(await resolveSessionUid(parseSession(legacy))).toBe('uid-legacy')
  })

  test('an email with no account resolves to nothing', async () => {
    const legacy = signSession({ email: 'nobody@example.com' }, 60_000)
    expect(await resolveSessionUid(parseSession(legacy))).toBeUndefined()
  })
})
