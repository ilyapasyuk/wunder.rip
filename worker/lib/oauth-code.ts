export type AuthCode = { uid: string; codeChallenge: string }

export const AUTH_CODE_TTL_MS = 2 * 60 * 1000
