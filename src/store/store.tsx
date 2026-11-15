import { decodeView, INBOX_VIEW, View } from 'lib/views'
import { createContext, Dispatch, ReactNode, useReducer } from 'react'
import { User } from 'services/auth'
import { reducer } from 'store/reducer'

import { AppAction } from './actions'

const CURRENT_FOLDER_STORAGE_KEY = 'wunder.currentFolderId'

export type Store = {
  user: User | null
  isShowAuthModal: boolean
  view: View
}

const readInitialView = (): View => {
  if (typeof window === 'undefined') return INBOX_VIEW
  try {
    return decodeView(window.localStorage.getItem(CURRENT_FOLDER_STORAGE_KEY))
  } catch {
    return INBOX_VIEW
  }
}

const DEFAULT_STORE: Store = {
  user: null,
  isShowAuthModal: false,
  view: readInitialView(),
}

type AppContext = {
  state: Store
  dispatch: Dispatch<AppAction>
}

const StoreContext = createContext<AppContext>({} as AppContext)

type StoreProviderProps = {
  children: ReactNode
}

const StoreProvider = ({ children }: StoreProviderProps) => {
  const [state, dispatch] = useReducer(reducer, DEFAULT_STORE)

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>
}

export { CURRENT_FOLDER_STORAGE_KEY, StoreContext, StoreProvider }
