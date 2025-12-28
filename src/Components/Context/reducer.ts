import { ACTION_TYPE, type AppActions } from './actions'
import type { IStore } from './store'

const reducer = (currentStore: IStore, action: AppActions): IStore => {
  switch (action.type) {
    case ACTION_TYPE.SET_USER:
      return { ...currentStore, user: action.payload.user }
    case ACTION_TYPE.SET_AUTH_MODAL:
      return { ...currentStore, isShowAuthModal: action.payload.isOpen }

    default:
      return currentStore
  }
}

export { reducer }
