import { sign, verify } from './token.js'

const TEN_YEARS_MS = 10 * 365 * 24 * 60 * 60 * 1000

export type ClientRegistration = { redirectUris: string[] }

/** The "client_id" issued at registration IS the signed payload — no store needed to look it up later. */
export const issueClientId = (redirectUris: string[]): string =>
  sign<ClientRegistration>({ redirectUris }, TEN_YEARS_MS)

export const getClient = (clientId: string): ClientRegistration | undefined => {
  try {
    return verify<ClientRegistration>(clientId)
  } catch {
    return undefined
  }
}
