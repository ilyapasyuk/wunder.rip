import {
  completeTask,
  type Day,
  parseTaskFields,
  serializeTaskFields,
  type TaskFields,
  uncompleteTask,
} from '@shared/task-model'
import { getUpdateTaskRoute } from 'services/db-paths'

/** A task as the web app holds it: the stored fields plus the normalized v2 model fields. */
export type Todo = {
  id?: string
  task: string
  done: boolean
  createdAt: number
  note: string
  files?: string[]
  order?: number
  isPublic?: boolean
  folderId?: string | null
} & TaskFields

type Raw = Record<string, unknown>

const str = (value: unknown, fallback: string) => (typeof value === 'string' ? value : fallback)
const num = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback

/** Parses one database node. The only place raw task data enters the web app. */
export const parseTodo = (id: string, raw: unknown): Todo => {
  const item: Raw = typeof raw === 'object' && raw !== null ? (raw as Raw) : {}
  return {
    id,
    createdAt: num(item.createdAt, 0),
    task: str(item.task, ''),
    done: Boolean(item.done),
    note: str(item.note, ''),
    files: Array.isArray(item.files) ? (item.files as string[]) : undefined,
    order: num(item.order, 0),
    isPublic: item.isPublic === true,
    folderId: typeof item.folderId === 'string' ? item.folderId : null,
    ...parseTaskFields(item),
  }
}

/** What the database stores for `todo` (no id; undefined fields are left out). */
export const todoRecord = ({
  id: _id,
  when,
  deadline,
  repeat,
  checklist,
  tags,
  completedAt,
  ...rest
}: Todo) => {
  const base = Object.fromEntries(Object.entries(rest).filter(([, value]) => value !== undefined))
  return {
    ...base,
    ...serializeTaskFields({ when, deadline, repeat, checklist, tags, completedAt }),
  }
}

/**
 * Multi-path update for `todo`, one path per field, so fields this client does not know about
 * (written by a newer client) are left alone.
 */
export const todoUpdates = (userId: string, todo: Todo): Record<string, unknown> => {
  if (!todo.id) return {}
  const route = getUpdateTaskRoute(userId, todo.id)
  return Object.fromEntries(
    Object.entries(todoRecord(todo)).map(([field, value]) => [`${route}/${field}`, value]),
  )
}

/** Toggles done. Completing a repeating task also creates its next task under `newId`. */
export const toggleDoneUpdates = (
  userId: string,
  todo: Todo,
  today: Day,
  nowMs: number,
  newId: string,
): Record<string, unknown> => {
  if (todo.done) return todoUpdates(userId, uncompleteTask(todo))
  const { completed, next } = completeTask(todo, today, nowMs, newId)
  return {
    ...todoUpdates(userId, completed),
    ...(next ? { [getUpdateTaskRoute(userId, newId)]: todoRecord(next) } : {}),
  }
}
