const CHARS = '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz'

/**
 * A Firebase-style push id (8 time characters + 12 random), so a node we create inside a
 * multi-path update sorts like one the database's POST would have named.
 */
export const pushId = (now: number = Date.now()): string => {
  let time = ''
  for (let i = 0, t = now; i < 8; i++, t = Math.floor(t / 64)) time = CHARS[t % 64] + time
  const random = crypto.getRandomValues(new Uint8Array(12))
  return time + Array.from(random, byte => CHARS[byte % 64]).join('')
}
