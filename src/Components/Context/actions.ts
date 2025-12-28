import type { IUser } from 'service/auth'

export enum ACTION_TYPE {
  SET_USER = 'SET_USER',
  SET_AUTH_MODAL = 'SET_AUTH_MODAL',
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
