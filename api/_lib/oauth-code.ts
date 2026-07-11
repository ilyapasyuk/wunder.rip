export type AuthCode = { email: string; codeChallenge: string }

export const AUTH_CODE_TTL_MS = 2 * 60 * 1000
