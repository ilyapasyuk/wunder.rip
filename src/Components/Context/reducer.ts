import { ACTION_TYPE, AppActions } from './actions'
import { IStore } from './store'

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
