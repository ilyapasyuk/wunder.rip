import { type Day, parseDay } from '../../shared/task-model.js'

/** The client's local day if it sent a valid one, else the server's UTC date. */
export const resolveToday = (today?: string): Day =>
  parseDay(today) ?? (parseDay(new Date().toISOString().slice(0, 10)) as Day)
