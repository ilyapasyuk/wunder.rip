import { GithubAuthProvider, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'

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
  FACEBOOK = 'facebook',
  GOOGLE = 'google',
}

const getProvider = (provider: PROVIDER): GoogleAuthProvider | GithubAuthProvider => {
  switch (provider) {
    case PROVIDER.GOOGLE:
      return new GoogleAuthProvider()
    case PROVIDER.FACEBOOK:
      return new GithubAuthProvider()
  }
}

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

export { logOut, signIn }
