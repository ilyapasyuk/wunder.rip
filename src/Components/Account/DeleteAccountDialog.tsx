import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { TrashIcon, XMarkIcon } from '@heroicons/react/20/solid'
import { useEffect, useState } from 'react'

import { User } from 'services/auth'

const CONFIRM_PHRASE = 'DELETE'

interface DeleteAccountDialogProps {
  open: boolean
  user: User
  deleting: boolean
  onClose: () => void
  onConfirm: () => void
}

const DeleteAccountDialog = ({
  open,
  user,
  deleting,
  onClose,
  onConfirm,
}: DeleteAccountDialogProps) => {
  const [confirmValue, setConfirmValue] = useState('')

  useEffect(() => {
    if (!open) setConfirmValue('')
  }, [open])

  const canConfirm = confirmValue.trim() === CONFIRM_PHRASE && !deleting

  return (
    <Dialog
      open={open}
      onClose={deleting ? () => {} : onClose}
      transition
      className="relative z-[100] transition duration-200 ease-out data-[closed]:opacity-0"
    >
      <DialogBackdrop className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          transition
          className="relative w-full max-w-lg rounded-2xl bg-surface dark:bg-surface-dark shadow-2xl ring-1 ring-border dark:ring-border-dark p-6 sm:p-8 transition duration-200 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
        >
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="absolute top-4 right-4 p-1.5 rounded-md text-text-secondary dark:text-text-dark-secondary hover:text-text-primary dark:hover:text-text-dark-primary hover:bg-overlay-hover focus:outline-none focus:ring-2 focus:ring-primary transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <XMarkIcon className="size-5 shrink-0" />
          </button>

          <DialogTitle className="text-xl font-semibold text-text-primary dark:text-text-dark-primary">
            Delete account
          </DialogTitle>
          <p className="mt-1 text-sm text-text-secondary dark:text-text-dark-secondary">
            Are you sure you want to delete your account?
          </p>

          <div className="mt-5 rounded-lg border border-danger/50 bg-danger/10 dark:bg-danger/15 px-4 py-3 flex gap-3">
            <div className="w-0.5 shrink-0 bg-danger rounded-full" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-text-primary dark:text-text-dark-primary">
              <span className="font-medium">Warning:</span> This action{' '}
              <span className="font-medium">cannot be undone</span>. Your tasks, notes, and lists
              will be permanently deleted from the database, and your Firebase identity will be
              removed. Images uploaded to Cloudinary live on public URLs and are{' '}
              <span className="font-medium">not</span> removed by this action.
            </p>
          </div>

          <div className="mt-5 rounded-lg border border-border dark:border-border-dark p-4 flex items-center gap-3">
            {user.avatar && (
              <img
                src={user.avatar}
                alt=""
                className="size-10 rounded-full shrink-0 ring-1 ring-border dark:ring-border-dark"
              />
            )}
            <div className="min-w-0">
              <div className="text-sm font-medium text-text-primary dark:text-text-dark-primary truncate">
                {user.fullName || 'Account'}
              </div>
              <div className="text-xs text-text-secondary dark:text-text-dark-secondary truncate">
                {user.email}
              </div>
            </div>
          </div>

          <div className="mt-5">
            <label
              htmlFor="delete-confirm"
              className="block text-sm text-text-secondary dark:text-text-dark-secondary"
            >
              To delete, type{' '}
              <span className="font-mono font-medium text-text-primary dark:text-text-dark-primary">
                {CONFIRM_PHRASE}
              </span>{' '}
              below
            </label>
            <div className="mt-2 flex items-center gap-2 rounded-md border border-border dark:border-border-dark bg-background dark:bg-background-dark px-3 py-2 focus-within:ring-2 focus-within:ring-danger focus-within:border-danger transition-colors">
              <TrashIcon
                className="size-4 shrink-0 text-danger"
                aria-hidden="true"
              />
              <input
                id="delete-confirm"
                type="text"
                value={confirmValue}
                onChange={e => setConfirmValue(e.target.value)}
                disabled={deleting}
                placeholder={`Enter ${CONFIRM_PHRASE}`}
                autoComplete="off"
                spellCheck={false}
                className="flex-1 min-w-0 bg-transparent border-0 outline-none focus:ring-0 p-0 text-sm text-text-primary dark:text-text-dark-primary placeholder:text-text-secondary/70 dark:placeholder:text-text-dark-secondary/70"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={deleting}
              className="px-4 py-2 rounded-md text-sm font-medium text-text-primary dark:text-text-dark-primary hover:bg-overlay-hover focus:outline-none focus:ring-2 focus:ring-primary transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={!canConfirm}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-danger text-white hover:bg-danger/90 disabled:bg-danger/40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-danger transition-colors"
            >
              {deleting && (
                <span
                  aria-hidden="true"
                  className="size-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin"
                />
              )}
              {deleting ? 'Deleting...' : 'Yes, Delete Account'}
            </button>
          </div>

        </DialogPanel>
      </div>
    </Dialog>
  )
}

export { DeleteAccountDialog }
