import { ACTION_TYPE, AppActions } from './actions'
import { CURRENT_FOLDER_STORAGE_KEY, IStore } from './store'

const reducer = (currentStore: IStore, action: AppActions): IStore => {
  switch (action.type) {
    case ACTION_TYPE.SET_USER:
      return { ...currentStore, user: action.payload.user }
    case ACTION_TYPE.SET_AUTH_MODAL:
      return { ...currentStore, isShowAuthModal: action.payload.isOpen }
    case ACTION_TYPE.SET_CURRENT_FOLDER:
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
