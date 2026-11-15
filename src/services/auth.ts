import {
  type AuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth'

import { trackLogin } from 'lib/analytics'
import { auth } from 'services/firebase'
import { notify } from 'lib/notify'

export type User = {
  id: string
  avatar: string
  email: string
  fullName: string
}

export enum PROVIDER {
  GOOGLE = 'google',
  APPLE = 'apple',
}

const getProvider = (provider: PROVIDER): AuthProvider => {
  switch (provider) {
    case PROVIDER.GOOGLE:
      return new GoogleAuthProvider()
    case PROVIDER.APPLE: {
      const apple = new OAuthProvider('apple.com')
      apple.addScope('email')
      apple.addScope('name')
      return apple
    }
  }
}

/** The provider the user signed up with (Firebase "one account per email": there is exactly one). */
const getUserProvider = (user: FirebaseUser): PROVIDER =>
  user.providerData.some(p => p.providerId === 'apple.com') ? PROVIDER.APPLE : PROVIDER.GOOGLE

const signIn = async (
  provider: PROVIDER,
): Promise<{
  user?: User
  error?: Error
}> => {
  try {
    const result = await signInWithPopup(auth, getProvider(provider))

    const id: string = result.user?.uid || ''
    const email: string = result.user?.email || ''
    const avatar: string = result.user?.photoURL || ''
    const fullName: string = result.user?.displayName || ''

    const preparedUser: User = { id, avatar, email, fullName }
    trackLogin(provider)
    return {
      user: preparedUser,
    }
  } catch (error) {
    const code = (error as { code?: string })?.code
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return { error: error as Error }
    }
    if (code === 'auth/account-exists-with-different-credential') {
      notify.error(
        'This email is already registered with another sign-in method. Use the one you signed up with.',
      )
      return { error: error as Error }
    }
    const errorMessage = `Login error: ${error}`
    console.error(errorMessage)
    notify.error(errorMessage)
    return {
      error: new Error(errorMessage),
    }
  }
}

const logOut = async (): Promise<void> => {
  return signOut(auth)
}

export { getProvider, getUserProvider, logOut, signIn }
