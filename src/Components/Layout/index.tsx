import { StoreContext } from 'Components/Context/store'
import { Header } from 'Components/Header'
import { ReactNode, useContext } from 'react'
import { logOut } from 'services/auth'
import { notify } from 'services/notify'
import { Toaster } from 'sonner'

interface LayoutProps {
  children?: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  const { state } = useContext(StoreContext)

  const onLogout = async (): Promise<void> => {
    await logOut()
    notify.info('Logged out')
    // Store update happens via onAuthStateChanged in Auth — single source of truth.
  }

  return (
    <div className="bg-background dark:bg-background-dark h-full min-h-screen">
      <Header user={state.user} onLogout={onLogout} />

      {children}

      <Toaster position="bottom-right" offset="16px" gap={10} />
    </div>
  )
}

export { Layout }
