import { reducer } from 'Components/Context/reducer'
import React, { createContext, Dispatch, ReactNode, useReducer } from 'react'
import { IUser } from 'services/auth'

import { AppActions } from './actions'

export interface IStore {
  user: IUser | null
  isShowAuthModal: boolean
}

const DEFAULT_STORE: IStore = {
  user: null,
  isShowAuthModal: false,
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

export { StoreProvider, StoreContext }
