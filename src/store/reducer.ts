import { encodeView } from 'lib/views'
import { AppAction } from './actions'
import { CURRENT_FOLDER_STORAGE_KEY, Store } from './store'

const reducer = (currentStore: Store, action: AppAction): Store => {
  switch (action.type) {
    case 'SET_USER':
      return { ...currentStore, user: action.payload.user }
    case 'SET_AUTH_MODAL':
      return { ...currentStore, isShowAuthModal: action.payload.isOpen }
    case 'SET_VIEW': {
      const stored = encodeView(action.payload.view)
      if (typeof window !== 'undefined') {
        try {
          if (stored) {
            window.localStorage.setItem(CURRENT_FOLDER_STORAGE_KEY, stored)
          } else {
            window.localStorage.removeItem(CURRENT_FOLDER_STORAGE_KEY)
          }
        } catch {
          // ignore quota / unavailable storage
        }
      }
      return { ...currentStore, view: action.payload.view }
    }

    default:
      return currentStore
  }
}

export { reducer }
