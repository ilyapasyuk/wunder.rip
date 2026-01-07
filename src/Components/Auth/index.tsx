import { ACTION_TYPE } from 'Components/Context/actions'
import { StoreContext } from 'Components/Context/store'
import { LoginForm } from 'Components/LoginForm'
import React, { useContext, useEffect } from 'react'
import { IUser, PROVIDER, signIn } from 'services/auth'
import { toast } from 'sonner'

interface IAuthProps {
  children: React.ReactNode
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
    const userFromLocalStorage: string = window.localStorage.getItem('user') || ''
    const user: IUser = userFromLocalStorage ? JSON.parse(userFromLocalStorage) : null

    if (user) {
      dispatch({ type: ACTION_TYPE.SET_USER, payload: { user } })
    }
  }, [])

  return (
    <>
      {isAuthorized && <>{children}</>}
      {!isAuthorized && <LoginForm onLogin={login} />}
    </>
  )
}

export { Auth }
