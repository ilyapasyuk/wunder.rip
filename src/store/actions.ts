import { View } from 'lib/views'
import { User } from 'services/auth'

export type ActionType = 'SET_USER' | 'SET_AUTH_MODAL' | 'SET_VIEW'

export type LoadingState = 'LOADING' | 'SUCCESS' | 'ERROR' | 'IDLE'

export type SetUserAction = {
  type: 'SET_USER'
  payload: { user: User | null }
}

export type SetAuthModalAction = {
  type: 'SET_AUTH_MODAL'
  payload: { isOpen: boolean }
}

export type SetViewAction = {
  type: 'SET_VIEW'
  payload: { view: View }
}

export type AppAction = SetUserAction | SetAuthModalAction | SetViewAction
