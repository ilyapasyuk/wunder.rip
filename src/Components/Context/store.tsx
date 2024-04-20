import React, { Dispatch, ReactNode, createContext, useReducer } from 'react'

import { reducer } from 'Components/Context/reducer'

import { INITIAL_USER, IUser } from '../../service/auth'
import { AppActions } from './actions'

export interface IStore {
  user: IUser | null
  isShowAuthModal: boolean
}

const DEFAULT_STORE: IStore = {
  user: INITIAL_USER,
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
