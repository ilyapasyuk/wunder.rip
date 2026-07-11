import { createHash } from 'node:crypto'

export const verifyPkce = (verifier: string, challenge: string): boolean =>
  createHash('sha256').update(verifier).digest('base64url') === challenge
