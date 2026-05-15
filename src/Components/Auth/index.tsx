import { ACTION_TYPE } from 'Components/Context/actions'
import { StoreContext } from 'Components/Context/store'
import { LoginForm } from 'Components/LoginForm'
import { onAuthStateChanged } from 'firebase/auth'
import { ReactNode, useContext, useEffect } from 'react'
import { IUser, PROVIDER, signIn } from 'services/auth'
import { auth } from 'services/firebase'
import { toast } from 'sonner'

interface IAuthProps {
  children: ReactNode
}

const Auth = ({ children }: IAuthProps) => {
  const { state, dispatch } = useContext(StoreContext)
  const { user } = state
  const isAuthorized = Boolean(user?.id)
  const login = async (provider: PROVIDER): Promise<void> => {
    const { user } = await signIn(provider)

    if (user) {
      toast.success('Login success')
      dispatch({ type: ACTION_TYPE.SET_USER, payload: { user } })
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, firebaseUser => {
      if (firebaseUser) {
        const user: IUser = {
          id: firebaseUser.uid,
          avatar: firebaseUser.photoURL || '',
          email: firebaseUser.email || '',
          fullName: firebaseUser.displayName || '',
        }
        window.localStorage.setItem('user', JSON.stringify(user))
        dispatch({ type: ACTION_TYPE.SET_USER, payload: { user } })
      } else {
        window.localStorage.removeItem('user')
        dispatch({ type: ACTION_TYPE.SET_USER, payload: { user: null } })
      }
    })

    return () => unsubscribe()
  }, [])

  return (
    <>
      {isAuthorized && <>{children}</>}
      {!isAuthorized && <LoginForm onLogin={login} />}
    </>
  )
}

export { Auth }
