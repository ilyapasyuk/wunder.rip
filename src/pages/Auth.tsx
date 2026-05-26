import { StoreContext } from 'store/store'
import { LoginForm } from 'pages/LoginForm/LoginForm'
import { onAuthStateChanged } from 'firebase/auth'
import { ReactNode, useContext, useEffect, useState } from 'react'
import { PROVIDER, signIn, User } from 'services/auth'
import { auth } from 'services/firebase'
import { notify } from 'lib/notify'

interface AuthProps {
  children: ReactNode
}

const Auth = ({ children }: AuthProps) => {
  const { state, dispatch } = useContext(StoreContext)
  const { user } = state
  const [isReady, setIsReady] = useState(false)
  const isAuthorized = Boolean(user?.id)
  const login = async (provider: PROVIDER): Promise<void> => {
    const { user } = await signIn(provider)

    if (user) {
      notify.success('Login success')
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
      setIsReady(true)
    })

    return () => unsubscribe()
  }, [])

  if (!isReady) {
    return (
      <div className="min-h-full flex items-center justify-center py-12">
        <div
          aria-label="Loading"
          className="size-8 rounded-full border-2 border-border dark:border-border-dark border-t-primary animate-spin"
        />
      </div>
    )
  }

  return (
    <>
      {isAuthorized && <>{children}</>}
      {!isAuthorized && <LoginForm onLogin={login} />}
    </>
  )
}

export { Auth }
