import { toast } from 'sonner'

import firebase from './firebase'

export type IUser = {
  id: string
  avatar: string
  email: string
  fullName: string
}

export enum PROVIDER {
  FACEBOOK = 'facebook',
  GOOGLE = 'google',
}

const INITIAL_USER: IUser = { id: '', email: '', avatar: '', fullName: '' }

const getProvider = (provider: PROVIDER) => {
  switch (provider) {
    case PROVIDER.GOOGLE:
      return new firebase.auth.GoogleAuthProvider()
    case PROVIDER.FACEBOOK:
      return new firebase.auth.GithubAuthProvider()
  }
}

const signIn = async (
  provider: PROVIDER,
): Promise<{
  user?: IUser
  error?: Error
}> => {
  try {
    const result = await firebase.auth().signInWithPopup(getProvider(provider))

    const id: string = result.user?.uid || ''
    const email: string = result.user?.email || ''
    const avatar: string = result.user?.photoURL || ''
    const fullName: string = result.user?.displayName || ''

    const preparedUser: IUser = { id, avatar, email, fullName }
    window.localStorage.setItem('user', JSON.stringify(preparedUser))
    return {
      user: preparedUser,
    }
  } catch (error) {
    const errorMessage = `Login error: ${error}`
    console.error(errorMessage)
    toast.error(errorMessage)
    return {
      error: new Error(errorMessage),
    }
  }
}

const logOut = async (): Promise<void> => {
  return window.localStorage.removeItem('user')
}

export { INITIAL_USER, signIn, logOut }
