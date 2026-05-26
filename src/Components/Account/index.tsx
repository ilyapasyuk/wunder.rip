import { StoreContext } from 'Components/Context/store'
import { ExclamationTriangleIcon, TrashIcon } from '@heroicons/react/20/solid'
import { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { deleteAccount } from 'services/account'
import { logOut } from 'services/auth'
import { notify } from 'services/notify'

import { DeleteAccountDialog } from './DeleteAccountDialog'

const Account = () => {
  const { state } = useContext(StoreContext)
  const navigate = useNavigate()
  const user = state.user

  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  if (!user) {
    return null
  }

  const handleLogout = async () => {
    await logOut()
    notify.info('Logged out')
    navigate('/')
  }

  const handleDelete = async () => {
    if (deleting) return
    setDeleting(true)
    try {
      await deleteAccount(user.id)
      notify.success('Account deleted')
      navigate('/')
    } catch (error) {
      const code = (error as { code?: string })?.code
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        // User aborted reauth — silent, nothing was deleted.
        setDeleting(false)
        return
      }
      console.error(error)
      notify.error('Failed to delete account')
      setDeleting(false)
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-10 text-text-primary dark:text-text-dark-primary">
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-8">Account</h1>

      <section className="mb-10">
        <div className="flex items-center gap-4">
          {user.avatar && (
            <img
              src={user.avatar}
              alt=""
              className="size-16 rounded-full ring-2 ring-border dark:ring-border-dark"
            />
          )}
          <div className="min-w-0">
            <div className="text-lg font-medium truncate">{user.fullName}</div>
            <div className="text-sm text-text-secondary dark:text-text-dark-secondary truncate">
              {user.email}
            </div>
            <div className="text-xs text-text-secondary/80 dark:text-text-dark-secondary/80 mt-1">
              Signed in with Google
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={handleLogout}
            className="px-4 py-2 rounded-md text-sm font-medium border border-border dark:border-border-dark text-text-primary dark:text-text-dark-primary hover:bg-overlay-hover focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
          >
            Log out
          </button>
        </div>
      </section>

      <section className="rounded-lg border-2 border-danger bg-danger/15 dark:bg-danger/25 ring-1 ring-danger/30 shadow-[0_0_0_4px_rgba(216,58,82,0.08)] p-5">
        <div className="flex items-start gap-3">
          <ExclamationTriangleIcon
            className="size-6 shrink-0 text-danger mt-0.5"
            aria-hidden="true"
          />
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-danger">Danger zone</h2>
            <p className="mt-1 text-sm text-text-primary dark:text-text-dark-primary">
              Permanently delete your account and all associated data. This action cannot be
              undone. Images uploaded to Cloudinary live on public URLs and are not removed.
            </p>

            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold bg-danger text-white shadow-sm hover:bg-danger/90 focus:outline-none focus:ring-2 focus:ring-danger focus:ring-offset-2 focus:ring-offset-surface dark:focus:ring-offset-surface-dark transition-colors"
            >
              <TrashIcon className="size-4 shrink-0" aria-hidden="true" />
              Delete account
            </button>
          </div>
        </div>
      </section>

      <DeleteAccountDialog
        open={dialogOpen}
        user={user}
        deleting={deleting}
        onClose={() => setDialogOpen(false)}
        onConfirm={handleDelete}
      />
    </main>
  )
}

export { Account }
