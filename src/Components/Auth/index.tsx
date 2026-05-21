import { StoreContext } from 'Components/Context/store'
import { LoginForm } from 'Components/LoginForm'
import { onAuthStateChanged } from 'firebase/auth'
import { ReactNode, useContext, useEffect } from 'react'
import { PROVIDER, signIn, User } from 'services/auth'
import { auth } from 'services/firebase'
import { toast } from 'sonner'

interface AuthProps {
  children: ReactNode
}

const Auth = ({ children }: AuthProps) => {
  const { state, dispatch } = useContext(StoreContext)
  const { user } = state
  const isAuthorized = Boolean(user?.id)
  const login = async (provider: PROVIDER): Promise<void> => {
    const { user } = await signIn(provider)

    if (user) {
      toast.success('Login success')
      // Store update happens via onAuthStateChanged below — single source of truth.
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, firebaseUser => {
      if (firebaseUser) {
        const user: User = {
          id: firebaseUser.uid,
          avatar: firebaseUser.photoURL || '',
          email: firebaseUser.email || '',
          fullName: firebaseUser.displayName || '',
        }
        dispatch({ type: 'SET_USER', payload: { user } })
      } else {
        dispatch({ type: 'SET_USER', payload: { user: null } })
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
