import { IUser } from 'Service/auth'

export enum ACTION_TYPE {
  SET_USER = 'SET_USER',
  SET_AUTH_MODAL = 'SET_AUTH_MODAL',
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

export type AppActions = ISetUser | IAuthModal
