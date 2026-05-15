import { reducer } from 'Components/Context/reducer'
import { createContext, Dispatch, ReactNode, useReducer } from 'react'
import { IUser } from 'services/auth'

import { AppActions } from './actions'

const CURRENT_FOLDER_STORAGE_KEY = 'wunder.currentFolderId'

export interface IStore {
  user: IUser | null
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

const DEFAULT_STORE: IStore = {
  user: null,
  isShowAuthModal: false,
  currentFolderId: readInitialFolderId(),
}

interface AppContext {
  state: IStore
  dispatch: Dispatch<AppActions>
}

const StoreContext = createContext<AppContext>({} as AppContext)

interface StoreProviderProps {
  children: ReactNode
}

const StoreProvider = ({ children }: StoreProviderProps) => {
  const [state, dispatch] = useReducer(reducer, DEFAULT_STORE)

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>
}

export { StoreProvider, StoreContext, CURRENT_FOLDER_STORAGE_KEY }
