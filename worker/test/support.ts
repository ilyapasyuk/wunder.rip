import { afterEach, beforeAll, beforeEach } from 'bun:test'
import { generateKeyPairSync } from 'node:crypto'

/**
 * A tiny in-memory Realtime Database (+ Google token endpoint, + Identity Toolkit ID-token lookup)
 * behind the REST APIs the worker talks to. Call once per test file.
 */
export const ID_TOKENS: Record<string, string> = { 'good-id-token': 'u1' }

export const DATABASE = 'https://wundertodo-app.firebaseio.com/'

export type Tree = Record<string, unknown>

// A tiny in-memory Realtime Database behind the REST API the worker talks to.
export let tree: Tree = {}

const segments = (path: string) => path.split('/').filter(Boolean)

export const getAt = (path: string): unknown =>
  segments(path).reduce<unknown>(
    (node, key) => (node && typeof node === 'object' ? (node as Tree)[key] : undefined),
    tree,
  ) ?? null

export const setAt = (path: string, value: unknown) => {
  const keys = segments(path)
  const last = keys.pop() as string
  let node = tree
  for (const key of keys) {
    node[key] = (node[key] as Tree | undefined) ?? {}
    node = node[key] as Tree
  }
  if (value === null) delete node[last]
  else node[last] = structuredClone(value)
}

const realFetch = globalThis.fetch

export const installFakeFirebase = () => {
  beforeAll(() => {
    process.env.MCP_TOKEN_SECRET = 'test-secret'
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
    process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({
      client_email: 'sa@test',
      private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }),
    })
  })

  beforeEach(() => {
    tree = {}
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.startsWith('https://oauth2.googleapis.com/token')) {
        return Response.json({ access_token: 'sa-token', expires_in: 3600 })
      }
      if (url.startsWith('https://identitytoolkit.googleapis.com/v1/accounts:lookup')) {
        const { idToken } = JSON.parse(String(init?.body)) as { idToken?: string }
        const uid = idToken ? ID_TOKENS[idToken] : undefined
        return uid
          ? Response.json({ users: [{ localId: uid }] })
          : Response.json({ error: { message: 'INVALID_ID_TOKEN' } }, { status: 400 })
      }
      if (!url.startsWith(DATABASE)) throw new Error(`unexpected fetch ${url}`)
      const path = url.slice(DATABASE.length).replace(/\.json$/, '')
      const body = init?.body ? JSON.parse(String(init.body)) : undefined
      switch (init?.method ?? 'GET') {
        case 'GET':
          return Response.json(getAt(path), { headers: { ETag: 'e' } })
        case 'PUT':
          setAt(path, body)
          return Response.json(body)
        case 'POST': {
          const name = `-N${Object.keys((getAt(path) as Tree | null) ?? {}).length}`
          setAt(`${path}/${name}`, body)
          return Response.json({ name })
        }
        case 'PATCH':
          for (const [key, value] of Object.entries(body as Tree)) setAt(`${path}/${key}`, value)
          return Response.json(body)
        case 'DELETE':
          setAt(path, null)
          return Response.json(null)
      }
      throw new Error(`unexpected method ${init?.method}`)
    }) as typeof fetch
  })

  afterEach(() => {
    globalThis.fetch = realFetch
  })
}
