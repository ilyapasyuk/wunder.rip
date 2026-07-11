import { type Credential, cert, getApps, initializeApp } from 'firebase-admin/app'
import { getDatabase } from 'firebase-admin/database'

const DATABASE_URL = 'https://wundertodo-app.firebaseio.com'
const IDENTITY_TOOLKIT_LOOKUP_URL = 'https://identitytoolkit.googleapis.com/v1/accounts:lookup'

let cachedCredential: Credential | undefined

const getApp = () => {
  const existing = getApps()[0]
  if (existing) {
    return existing
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!raw) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is not set')
  }

  cachedCredential = cert(JSON.parse(raw))
  return initializeApp({
    credential: cachedCredential,
    databaseURL: DATABASE_URL,
  })
}

export const db = () => getDatabase(getApp())

/**
 * Resolves a Firebase Auth uid for an email via the Identity Toolkit REST API,
 * authenticated as the service account. Deliberately avoids firebase-admin/auth:
 * it pulls in jwks-rsa, which currently crashes under Vercel's Node runtime
 * (ERR_REQUIRE_ESM — jwks-rsa's own `require('jose')` against an ESM-only jose).
 */
export const getUidByEmail = async (email: string): Promise<string | undefined> => {
  getApp()
  const { access_token: accessToken } = await cachedCredential!.getAccessToken()

  const response = await fetch(IDENTITY_TOOLKIT_LOOKUP_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
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
