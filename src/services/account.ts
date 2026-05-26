import { deleteUser, GoogleAuthProvider, reauthenticateWithPopup } from 'firebase/auth'
import { ref, remove } from 'firebase/database'

import { auth, db } from 'services/firebase'
import { getFoldersRoute, getUserRoute } from 'services/routes'

const deleteAccount = async (userId: string): Promise<void> => {
  const current = auth.currentUser
  if (!current) {
    throw new Error('Not signed in')
  }

  // Re-confirm with the identity provider. The Google popup doubles as the
  // final "are you sure" gate; cancelling it aborts the whole flow before any
  // data is removed.
  await reauthenticateWithPopup(current, new GoogleAuthProvider())

  await Promise.all([
    remove(ref(db, getUserRoute(userId))),
    remove(ref(db, getFoldersRoute(userId))),
  ])

  await deleteUser(current)
}

export { deleteAccount }
