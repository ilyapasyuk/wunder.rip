const DATABASE_URL = 'https://wundertodo-app.firebaseio.com'
const IDENTITY_TOOLKIT_LOOKUP_URL = 'https://identitytoolkit.googleapis.com/v1/accounts:lookup'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
// Same scope set firebase-admin requests for a service-account credential.
const SCOPES = [
  'https://www.googleapis.com/auth/cloud-platform',
  'https://www.googleapis.com/auth/firebase.database',
  'https://www.googleapis.com/auth/identitytoolkit',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ')

type ServiceAccount = { client_email: string; private_key: string }

let cachedToken: { value: string; expiresAt: number } | undefined

const getServiceAccount = (): ServiceAccount => {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!raw) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is not set')
  }
  return JSON.parse(raw) as ServiceAccount
}

const base64url = (input: ArrayBuffer | string): string =>
  Buffer.from(typeof input === 'string' ? input : new Uint8Array(input)).toString('base64url')

const signJwt = async ({ client_email, private_key }: ServiceAccount): Promise<string> => {
  const now = Math.floor(Date.now() / 1000)
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = base64url(
    JSON.stringify({
      iss: client_email,
      scope: SCOPES,
      aud: GOOGLE_TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  )

  const pem = private_key.replace(/-----[^-]+-----|\s/g, '')
  const key = await crypto.subtle.importKey(
    'pkcs8',
    Buffer.from(pem, 'base64'),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(`${header}.${claims}`),
  )
  return `${header}.${claims}.${base64url(signature)}`
}

/**
 * OAuth access token for the service account, via the JWT bearer grant. firebase-admin
 * doesn't run on Workers (its Realtime Database client needs Node sockets), so the
 * service account talks to Google's REST APIs directly.
 */
const getAccessToken = async (): Promise<string> => {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: await signJwt(getServiceAccount()),
    }),
  })
  if (!response.ok) {
    throw new Error(`Service account token exchange failed: ${response.status}`)
  }

  const { access_token: value, expires_in: expiresIn } = (await response.json()) as {
    access_token: string
    expires_in: number
  }
  cachedToken = { value, expiresAt: Date.now() + expiresIn * 1000 }
  return value
}

/** Raw Realtime Database REST call; `path` has no leading slash, '' is the root. */
export const rtdb = async (
  method: 'GET' | 'PUT' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
  headers: Record<string, string> = {},
): Promise<Response> =>
  fetch(`${DATABASE_URL}/${path}.json`, {
    method,
    headers: {
      Authorization: `Bearer ${await getAccessToken()}`,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

/** Resolves a Firebase Auth uid for an email via the Identity Toolkit REST API. */
export const getUidByEmail = async (email: string): Promise<string | undefined> => {
  const response = await fetch(IDENTITY_TOOLKIT_LOOKUP_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${await getAccessToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: [email] }),
  })

  if (!response.ok) {
    throw new Error(`Identity Toolkit lookup failed: ${response.status}`)
  }

  const body = (await response.json()) as { users?: { localId: string }[] }
  return body.users?.[0]?.localId
}
