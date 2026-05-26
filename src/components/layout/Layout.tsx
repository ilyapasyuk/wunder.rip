import { StoreContext } from 'store/store'
import { Header } from 'components/layout/Header'
import { ReactNode, useContext } from 'react'
import { logOut } from 'services/auth'
import { notify } from 'lib/notify'
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
    <div className="bg-background dark:bg-background-dark min-h-screen md:h-dvh md:flex md:flex-col md:overflow-hidden">
      <Header user={state.user} onLogout={onLogout} />

      <div className="md:flex-1 md:min-h-0 md:overflow-y-auto">{children}</div>

      <Toaster position="bottom-right" offset="16px" gap={10} />
    </div>
  )
}

export { Layout }
