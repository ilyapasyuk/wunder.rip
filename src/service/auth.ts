export type IUser = {
  id: string
  avatar: string
  email: string
  fullName: string
}

export enum PROVIDER {
  FACEBOOK = 'facebook',
  GOOGLE = 'google',
}
