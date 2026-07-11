import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getDatabase } from 'firebase-admin/database'

const DATABASE_URL = 'https://wundertodo-app.firebaseio.com'

const getApp = () => {
  const existing = getApps()[0]
  if (existing) {
    return existing
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!raw) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is not set')
  }

  return initializeApp({
    credential: cert(JSON.parse(raw)),
    databaseURL: DATABASE_URL,
  })
}

export const db = () => getDatabase(getApp())

export const getUidByEmail = async (email: string): Promise<string> => {
  const user = await getAuth(getApp()).getUserByEmail(email)
  return user.uid
}
