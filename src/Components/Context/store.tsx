import { reducer } from 'Components/Context/reducer'
import { createContext, Dispatch, ReactNode, useReducer } from 'react'
import { User } from 'services/auth'

import { AppAction } from './actions'

const CURRENT_FOLDER_STORAGE_KEY = 'wunder.currentFolderId'

export type Store = {
  user: User | null
  isShowAuthModal: boolean
  currentFolderId: string | null
}

const readInitialFolderId = (): string | null => {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(CURRENT_FOLDER_STORAGE_KEY)
    return raw && raw !== 'null' ? raw : null
  } catch {
    return null
  }
}

const DEFAULT_STORE: Store = {
  user: null,
  isShowAuthModal: false,
  currentFolderId: readInitialFolderId(),
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
