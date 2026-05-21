import { User } from 'services/auth'

export type ActionType = 'SET_USER' | 'SET_AUTH_MODAL' | 'SET_CURRENT_FOLDER'

export type LoadingState = 'LOADING' | 'SUCCESS' | 'ERROR' | 'IDLE'

export type SetUserAction = {
  type: 'SET_USER'
  payload: { user: User | null }
}

export type SetAuthModalAction = {
  type: 'SET_AUTH_MODAL'
  payload: { isOpen: boolean }
}

export type SetCurrentFolderAction = {
  type: 'SET_CURRENT_FOLDER'
  payload: { folderId: string | null }
}

export type AppAction = SetUserAction | SetAuthModalAction | SetCurrentFolderAction
