import { ACTION_TYPE } from 'Components/Context/actions'
import { StoreContext } from 'Components/Context/store'
import { Header } from 'Components/Header'
import { ReactNode, useContext } from 'react'
import { logOut } from 'services/auth'
import { Toaster } from 'sonner'

interface ILayoutProps {
  children?: ReactNode
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

      <Toaster
        position="bottom-right"
        offset="16px"
        toastOptions={{
          duration: 4000,
          classNames: {
            toast:
              'bg-surface dark:bg-surface-dark border border-border dark:border-border-dark text-text-primary dark:text-text-dark-primary shadow-lg',
            title: 'text-text-primary dark:text-text-dark-primary font-medium text-sm',
            description: 'text-text-secondary dark:text-text-dark-secondary text-sm',
            success: 'border-success/30 dark:border-success-dark/30',
            error: 'border-red-500/30 dark:border-red-500/30',
            info: 'border-primary/30 dark:border-primary/30',
            warning: 'border-yellow-500/30 dark:border-yellow-500/30',
            actionButton:
              'bg-primary hover:bg-primary-hover text-white rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            cancelButton:
              'bg-overlay-hover hover:bg-overlay-hover/80 text-text-primary dark:text-text-dark-primary rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            closeButton:
              'text-text-secondary dark:text-text-dark-secondary hover:text-text-primary dark:hover:text-text-dark-primary hover:bg-overlay-hover rounded-md transition-colors',
          },
        }}
      />
    </div>
  )
}

export { Layout }
