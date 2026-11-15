/**
 * The task data model shared by the web app (`src/`) and the MCP server (`worker/`).
 * Spec: `shared/DATA_MODEL.md`; test vectors: `shared/model-vectors.json`.
 *
 * Raw database / tool input is parsed once with `parseTaskFields`; everything else here trusts
 * the normalized shape. `serializeTaskFields` turns it back into what the database stores.
 */

declare const dayBrand: unique symbol
declare const timeBrand: unique symbol

/** Local calendar date `YYYY-MM-DD`, no time zone. Only `parseDay` and day arithmetic make one. */
export type Day = string & { readonly [dayBrand]: true }
/** Local wall-clock time `HH:mm`. Only `parseTime` makes one. */
export type Time = string & { readonly [timeBrand]: true }

export type When =
  | { kind: 'anytime' }
  | { kind: 'someday' }
  | { kind: 'day'; day: Day; evening: boolean; reminder: Time | null }

export const REPEAT_UNITS = ['day', 'week', 'month', 'year'] as const
export type RepeatUnit = (typeof REPEAT_UNITS)[number]
export const REPEAT_FROM = ['schedule', 'completion'] as const
export type RepeatFrom = (typeof REPEAT_FROM)[number]
export type Repeat = { unit: RepeatUnit; every: number; from: RepeatFrom }

export type ChecklistItem = { id: string; title: string; done: boolean }

export type TaskFields = {
  when: When
  deadline: Day | null
  repeat: Repeat | null
  checklist: ChecklistItem[]
  tags: string[]
  completedAt: number | null
}

/** What the database stores for the model fields. `null` clears a field. */
export type TaskFieldsRecord = {
  when: Day | 'someday' | null
  evening: boolean
  reminder: Time | null
  deadline: Day | null
  repeat: Repeat | null
  checklist: ChecklistItem[]
  tags: string[]
  completedAt: number | null
}

export const SMART_LISTS = ['today', 'upcoming', 'anytime', 'someday', 'logbook'] as const
export type SmartList = (typeof SMART_LISTS)[number]

/** The least a task needs for the smart-list and completion rules. */
export type ModelTask = TaskFields & { done: boolean }

// ---------- days ----------

const pad = (n: number, width = 2) => String(n).padStart(width, '0')

const DAY_RE = /^(\d{4})-(\d{2})-(\d{2})$/
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

const toDay = (date: Date): Day =>
  `${pad(date.getUTCFullYear(), 4)}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}` as Day

const fromDay = (day: Day): Date => new Date(`${day}T00:00:00Z`)

export const parseDay = (value: unknown): Day | null => {
  if (typeof value !== 'string') return null
  const match = DAY_RE.exec(value)
  if (!match) return null
  const [, y, m, d] = match.map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  const real =
    date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
  return real ? (value as Day) : null
}

export const parseTime = (value: unknown): Time | null =>
  typeof value === 'string' && TIME_RE.test(value) ? (value as Time) : null

/** The local calendar date of `now` (defaults to the current moment). */
export const todayLocal = (now: Date = new Date()): Day =>
  `${pad(now.getFullYear(), 4)}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` as Day

export const addDays = (day: Day, days: number): Day => {
  const date = fromDay(day)
  date.setUTCDate(date.getUTCDate() + days)
  return toDay(date)
}

/** Whole days from `from` to `to` (negative if `to` is earlier). */
export const daysBetween = (from: Day, to: Day): number =>
  Math.round((fromDay(to).getTime() - fromDay(from).getTime()) / 86_400_000)

const addMonths = (day: Day, months: number): Day => {
  const date = fromDay(day)
  const target = date.getUTCMonth() + months
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), target + 1, 0)).getUTCDate()
  return toDay(
    new Date(Date.UTC(date.getUTCFullYear(), target, Math.min(date.getUTCDate(), lastDay))),
  )
}

/** Moves `day` forward by one repeat step; months and years clamp to the end of the month. */
export const advance = (day: Day, { unit, every }: Pick<Repeat, 'unit' | 'every'>): Day => {
  switch (unit) {
    case 'day':
      return addDays(day, every)
    case 'week':
      return addDays(day, every * 7)
    case 'month':
      return addMonths(day, every)
    case 'year':
      return addMonths(day, every * 12)
  }
}

// ---------- parse / serialize ----------

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** The database returns arrays as objects when their keys are sparse; read both in key order. */
const listValues = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value
  if (!isRecord(value)) return []
  return Object.keys(value)
    .sort((a, b) => Number(a) - Number(b))
    .map(key => value[key])
}

const oneOf = <T extends string>(options: readonly T[], value: unknown): T | undefined =>
  options.find(option => option === value)

const parseWhen = (raw: Record<string, unknown>): When => {
  if (raw.when === 'someday') return { kind: 'someday' }
  const day = parseDay(raw.when)
  if (!day) return { kind: 'anytime' }
  return { kind: 'day', day, evening: raw.evening === true, reminder: parseTime(raw.reminder) }
}

export const parseRepeat = (value: unknown): Repeat | null => {
  if (!isRecord(value)) return null
  const unit = oneOf(REPEAT_UNITS, value.unit)
  if (!unit) return null
  const every =
    typeof value.every === 'number' && Number.isFinite(value.every) ? Math.floor(value.every) : 1
  return {
    unit,
    every: Math.max(1, every),
    from: oneOf(REPEAT_FROM, value.from) ?? 'schedule',
  }
}

const parseChecklistItem = (value: unknown): ChecklistItem | null => {
  if (!isRecord(value)) return null
  if (typeof value.id !== 'string' || !value.id || typeof value.title !== 'string') return null
  return { id: value.id, title: value.title, done: value.done === true }
}

export const parseChecklist = (value: unknown): ChecklistItem[] =>
  listValues(value)
    .map(parseChecklistItem)
    .filter((item): item is ChecklistItem => item !== null)

/** Adds `tag` (trimmed) unless it is blank or already present in any letter case. */
export const addTag = (tags: string[], tag: string): string[] => {
  const trimmed = tag.trim()
  if (!trimmed || tags.some(t => t.toLowerCase() === trimmed.toLowerCase())) return tags
  return [...tags, trimmed]
}

export const parseTags = (value: unknown): string[] =>
  listValues(value)
    .filter((tag): tag is string => typeof tag === 'string')
    .reduce(addTag, [] as string[])

export const parseTaskFields = (raw: unknown): TaskFields => {
  const record = isRecord(raw) ? raw : {}
  const completedAt = record.completedAt
  return {
    when: parseWhen(record),
    deadline: parseDay(record.deadline),
    repeat: parseRepeat(record.repeat),
    checklist: parseChecklist(record.checklist),
    tags: parseTags(record.tags),
    completedAt:
      typeof completedAt === 'number' && Number.isFinite(completedAt) ? completedAt : null,
  }
}

const serializeWhen = (when: When): Pick<TaskFieldsRecord, 'when' | 'evening' | 'reminder'> => {
  switch (when.kind) {
    case 'anytime':
      return { when: null, evening: false, reminder: null }
    case 'someday':
      return { when: 'someday', evening: false, reminder: null }
    case 'day':
      return { when: when.day, evening: when.evening, reminder: when.reminder }
  }
}

export const serializeTaskFields = (fields: TaskFields): TaskFieldsRecord => ({
  ...serializeWhen(fields.when),
  deadline: fields.deadline,
  repeat: fields.repeat,
  checklist: fields.checklist,
  tags: fields.tags,
  completedAt: fields.completedAt,
})

// ---------- smart lists ----------

export const classify = (task: ModelTask, today: Day): { list: SmartList; evening: boolean } => {
  if (task.done) return { list: 'logbook', evening: false }
  const { when, deadline } = task
  if (when.kind === 'day' && when.day <= today) return { list: 'today', evening: when.evening }
  // Due by deadline only: evening belongs to the planned day, which is later.
  if (deadline !== null && deadline <= today) return { list: 'today', evening: false }
  if (when.kind === 'day') return { list: 'upcoming', evening: false }
  if (when.kind === 'someday') return { list: 'someday', evening: false }
  return { list: 'anytime', evening: false }
}

const dayOf = (task: ModelTask): string => (task.when.kind === 'day' ? task.when.day : '')

const SORTS: Partial<Record<SmartList, (a: ModelTask, b: ModelTask) => number>> = {
  upcoming: (a, b) => dayOf(a).localeCompare(dayOf(b)),
  logbook: (a, b) => (b.completedAt ?? -Infinity) - (a.completedAt ?? -Infinity),
}

/**
 * The tasks of one smart list. Today, Anytime and Someday keep the incoming order; Upcoming is
 * sorted by day and Logbook by newest completion (stable, so ties keep the incoming order).
 */
export const smartList = <T extends ModelTask>(tasks: T[], list: SmartList, today: Day): T[] => {
  const members = tasks.filter(task => classify(task, today).list === list)
  const sort = SORTS[list]
  return sort ? [...members].sort(sort) : members
}

// ---------- completion ----------

const nextDay = (task: ModelTask, repeat: Repeat, today: Day): Day => {
  if (repeat.from === 'completion') return advance(today, repeat)
  let day = advance(task.when.kind === 'day' ? task.when.day : today, repeat)
  while (day <= today) day = advance(day, repeat)
  return day
}

const nextTask = <T extends ModelTask & { id?: string }>(
  task: T,
  repeat: Repeat,
  today: Day,
  newId: string,
): T => {
  const day = nextDay(task, repeat, today)
  const when: When =
    task.when.kind === 'day'
      ? { ...task.when, day }
      : { kind: 'day', day, evening: false, reminder: null }
  // With no day the series starts from today, so the deadline moves by the distance from today.
  const shift = daysBetween(task.when.kind === 'day' ? task.when.day : today, day)
  return {
    ...task,
    id: newId,
    done: false,
    completedAt: null,
    when,
    deadline: task.deadline && addDays(task.deadline, shift),
    checklist: task.checklist.map(item => ({ ...item, done: false })),
    repeat,
  }
}

/**
 * Marks `task` done at `nowMs`. A repeating task hands its repeat to a `next` task (id `newId`)
 * scheduled per the spec. Completing a task that is already done changes nothing.
 */
export const completeTask = <T extends ModelTask & { id?: string }>(
  task: T,
  today: Day,
  nowMs: number,
  newId: string,
): { completed: T; next?: T } => {
  if (task.done) return { completed: task }
  const completed: T = { ...task, done: true, completedAt: nowMs, repeat: null }
  if (!task.repeat) return { completed }
  return { completed, next: nextTask(task, task.repeat, today, newId) }
}

export const uncompleteTask = <T extends ModelTask>(task: T): T => ({
  ...task,
  done: false,
  completedAt: null,
})
