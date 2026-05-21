import { AppAction } from './actions'
import { CURRENT_FOLDER_STORAGE_KEY, Store } from './store'

const reducer = (currentStore: Store, action: AppAction): Store => {
  switch (action.type) {
    case 'SET_USER':
      return { ...currentStore, user: action.payload.user }
    case 'SET_AUTH_MODAL':
      return { ...currentStore, isShowAuthModal: action.payload.isOpen }
    case 'SET_CURRENT_FOLDER':
      if (typeof window !== 'undefined') {
        try {
          if (action.payload.folderId) {
            window.localStorage.setItem(CURRENT_FOLDER_STORAGE_KEY, action.payload.folderId)
          } else {
            window.localStorage.removeItem(CURRENT_FOLDER_STORAGE_KEY)
          }
        } catch {
          // ignore quota / unavailable storage
        }
      }
      return { ...currentStore, currentFolderId: action.payload.folderId }

    default:
      return currentStore
  }
}

export { reducer }
