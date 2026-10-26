import { onAuthStateChanged } from 'firebase/auth'
import { notify } from 'lib/notify'
import { LoginForm } from 'pages/LoginForm/LoginForm'
import { ReactNode, useContext, useEffect, useState } from 'react'
import { PROVIDER, signIn, User } from 'services/auth'
import { auth } from 'services/firebase'
import { StoreContext } from 'store/store'

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
    // Firebase usually restores the session in well under a second; the spinner only
    // fades in after 400ms so fast loads don't flash it.
    return (
      <div className="min-h-full flex items-center justify-center py-24">
        <div
          role="status"
          aria-label="Loading"
          className="size-7 rounded-full border-[2.5px] border-muted-strong border-t-accent animate-spin opacity-0 motion-reduce:opacity-100 motion-safe:animate-[spin_0.8s_linear_infinite,fade-in_200ms_ease-out_400ms_forwards]"
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
