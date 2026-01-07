import React, { useContext } from 'react'
import { Toaster } from 'sonner'

import { logOut } from 'service/auth'

import { ACTION_TYPE } from 'Components/Context/actions'
import { StoreContext } from 'Components/Context/store'
import { Header } from 'Components/Header'

interface ILayoutProps {
  children?: React.ReactNode
}

const Layout = ({ children }: ILayoutProps) => {
  const { state, dispatch } = useContext(StoreContext)

  const onLogout = async (): Promise<void> => {
    await logOut()
    dispatch({ type: ACTION_TYPE.SET_USER, payload: { user: null } })
  }

  return (
    <div className="bg-background dark:bg-background-dark h-full min-h-screen">
      <Header user={state.user} onLogout={onLogout} />

      {children}

      <Toaster />
    </div>
  )
}

export { Layout }
