import { IUser } from 'services/auth'

export enum ACTION_TYPE {
  SET_USER = 'SET_USER',
  SET_AUTH_MODAL = 'SET_AUTH_MODAL',
  SET_CURRENT_FOLDER = 'SET_CURRENT_FOLDER',
}

export enum LOADING {
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  IDLE = 'IDLE',
}

export interface ISetUser {
  type: ACTION_TYPE.SET_USER
  payload: {
    user: IUser | null
  }
}

export interface IAuthModal {
  type: ACTION_TYPE.SET_AUTH_MODAL
  payload: {
    isOpen: boolean
  }
}

export interface ISetCurrentFolder {
  type: ACTION_TYPE.SET_CURRENT_FOLDER
  payload: {
    folderId: string | null
  }
}

export type AppActions = ISetUser | IAuthModal | ISetCurrentFolder
