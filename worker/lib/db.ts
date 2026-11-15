import {
  completeTask,
  type Day,
  parseTaskFields,
  type SmartList,
  serializeTaskFields,
  smartList,
  type TaskFields,
  uncompleteTask,
} from '../../shared/task-model.js'
import { rtdb } from './firebase.js'
import { pushId } from './push-id.js'
import { applyTaskFields, hasTaskFields, type TaskFieldsInput } from './task-input.js'

// Read per call, not at module load, so a missing binding can't silently pin the dev paths.
const taskDb = () => process.env.VITE_APP_DB_TASK_NAME || 'todos_dev'
const folderDb = () => process.env.VITE_APP_DB_FOLDER_NAME || 'folders_dev'

/** The stored, pre-v2 fields of a task node. */
type TodoBase = {
  task: string
  done: boolean
  createdAt: number
  note: string
  files?: string[]
  order?: number
  isPublic?: boolean
  folderId?: string | null
}

/** A task inside the worker: stored fields plus the normalized v2 model. */
type StoredTask = TodoBase & TaskFields & { id: string }

/** A task as tools return it: the node as stored, v2 fields in their stored shape. */
export type Todo = TodoBase & ReturnType<typeof serializeTaskFields> & { id: string }

export type Folder = {
  id?: string
  name: string
  createdAt: number
  order?: number
}

const tasksPath = (uid: string) => `${taskDb()}/${uid}`
const taskPath = (uid: string, taskId: string) => `${taskDb()}/${uid}/${taskId}`
const foldersPath = (uid: string) => `${folderDb()}/${uid}`
const folderPath = (uid: string, folderId: string) => `${folderDb()}/${uid}/${folderId}`

const send = async (...args: Parameters<typeof rtdb>): Promise<Response> => {
  const response = await rtdb(...args)
  if (!response.ok) {
    throw new Error(`Realtime Database ${args[0]} ${args[1]} failed: ${response.status}`)
  }
  return response
}

const read = async <T>(path: string): Promise<T | null> =>
  (await (await send('GET', path)).json()) as T | null

const push = async (path: string, value: unknown): Promise<string> => {
  const { name } = (await (await send('POST', path, value)).json()) as { name: string }
  return name
}

const update = async (path: string, changes: object): Promise<void> => {
  await send('PATCH', path, changes)
}

/** Optimistic read-modify-write on one path, retried while another writer races us (HTTP 412). */
const transaction = async <T>(path: string, apply: (current: T | null) => T): Promise<void> => {
  for (let attempt = 0; attempt < 5; attempt++) {
    const current = await send('GET', path, undefined, { 'X-Firebase-ETag': 'true' })
    const etag = current.headers.get('ETag') || ''
    const next = apply((await current.json()) as T | null)
    const written = await rtdb('PUT', path, next, { 'if-match': etag })
    if (written.status !== 412) {
      if (!written.ok) {
        throw new Error(`Realtime Database transaction on ${path} failed: ${written.status}`)
      }
      return
    }
  }
  throw new Error(`Realtime Database transaction on ${path} kept conflicting`)
}

const parseStored = (id: string, raw: unknown): StoredTask => ({
  ...(raw as TodoBase),
  id,
  done: Boolean((raw as Partial<TodoBase>).done),
  ...parseTaskFields(raw),
})

const output = ({ when, deadline, repeat, checklist, tags, completedAt, ...rest }: StoredTask) => ({
  ...rest,
  ...serializeTaskFields({ when, deadline, repeat, checklist, tags, completedAt }),
})

/** The node to store for `task`: everything but the id. */
const record = (task: StoredTask) => {
  const { id: _id, ...rest } = output(task)
  return rest
}

const readTasks = async (uid: string): Promise<StoredTask[]> => {
  const value = (await read<Record<string, unknown>>(tasksPath(uid))) || {}
  return Object.entries(value).map(([id, raw]) => parseStored(id, raw))
}

const readTask = async (uid: string, taskId: string): Promise<StoredTask> => {
  const raw = await read<unknown>(taskPath(uid, taskId))
  if (!raw) throw new Error(`Task ${taskId} not found`)
  return parseStored(taskId, raw)
}

/** One path per field, so fields this server does not know about are left alone. */
const fieldUpdates = (uid: string, task: StoredTask): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(record(task)).map(([field, value]) => [
      `${taskPath(uid, task.id)}/${field}`,
      value,
    ]),
  )

export const listTasks = async (uid: string): Promise<Todo[]> => (await readTasks(uid)).map(output)

/** One smart list for `today` (the client's local day), in the shared order. */
export const listSmart = async (uid: string, list: SmartList, today: Day): Promise<Todo[]> =>
  smartList(await readTasks(uid), list, today).map(output)

export const createTask = async (
  uid: string,
  task: string,
  folderId?: string | null,
  fields: TaskFieldsInput = {},
): Promise<Todo> => {
  const timestamp = Date.now()
  const value: TodoBase = {
    task: task.slice(0, 100).trim(),
    done: false,
    createdAt: timestamp,
    note: '',
    files: [],
    order: -timestamp,
    isPublic: false,
    folderId: folderId || null,
  }
  const stored = hasTaskFields(fields)
    ? { ...value, ...serializeTaskFields(applyTaskFields({}, fields, pushId)) }
    : value
  const id = await push(tasksPath(uid), stored)
  return output(parseStored(id, stored))
}

export const updateTask = async (
  uid: string,
  taskId: string,
  changes: Partial<Pick<TodoBase, 'task' | 'note'>> & TaskFieldsInput,
): Promise<void> => {
  const { task, note, ...fields } = changes
  const text = Object.fromEntries(
    Object.entries({ task, note }).filter(([, value]) => value !== undefined),
  )
  if (!hasTaskFields(fields)) {
    await update(taskPath(uid, taskId), text)
    return
  }
  const current = await read<unknown>(taskPath(uid, taskId))
  if (!current) throw new Error(`Task ${taskId} not found`)
  await update(taskPath(uid, taskId), {
    ...text,
    ...serializeTaskFields(applyTaskFields(current, fields, pushId)),
  })
}

/**
 * Marks a task done or not done. Completing a repeating task creates its next task in the same
 * atomic multi-path write; completing an already done task changes nothing.
 */
export const setTaskDone = async (
  uid: string,
  taskId: string,
  done: boolean,
  today: Day,
): Promise<{ task: Todo; next?: Todo }> => {
  const current = await readTask(uid, taskId)
  if (!done) {
    const reopened = uncompleteTask(current)
    await update('', fieldUpdates(uid, reopened))
    return { task: output(reopened) }
  }
  if (current.done) return { task: output(current) }
  const { completed, next } = completeTask(current, today, Date.now(), pushId())
  await update('', {
    ...fieldUpdates(uid, completed),
    ...(next ? { [taskPath(uid, next.id)]: record(next) } : {}),
  })
  return { task: output(completed), ...(next ? { next: output(next) } : {}) }
}

export const deleteTask = async (uid: string, taskId: string): Promise<void> => {
  await send('DELETE', taskPath(uid, taskId))
}

export const getTask = async (uid: string, taskId: string): Promise<Todo | undefined> => {
  const raw = await read<unknown>(taskPath(uid, taskId))
  return raw ? output(parseStored(taskId, raw)) : undefined
}

export const addTaskFile = async (uid: string, taskId: string, fileId: string): Promise<void> => {
  await transaction<string[]>(`${taskPath(uid, taskId)}/files`, files => [...(files || []), fileId])
}

export const removeTaskFile = async (
  uid: string,
  taskId: string,
  fileId: string,
): Promise<void> => {
  await transaction<string[]>(`${taskPath(uid, taskId)}/files`, files =>
    (files || []).filter(id => id !== fileId),
  )
}

export const moveTaskToFolder = async (
  uid: string,
  taskId: string,
  folderId: string | null,
): Promise<void> => {
  await update(taskPath(uid, taskId), { folderId, order: -Date.now() })
}

export const listFolders = async (uid: string): Promise<Folder[]> => {
  const value = (await read<Record<string, Omit<Folder, 'id'>>>(foldersPath(uid))) || {}
  return Object.entries(value).map(([id, folder]) => ({ id, ...folder }))
}

export const createFolder = async (uid: string, name: string): Promise<Folder> => {
  const timestamp = Date.now()
  const value: Omit<Folder, 'id'> = {
    name: name.slice(0, 60).trim(),
    createdAt: timestamp,
    order: -timestamp,
  }
  const id = await push(foldersPath(uid), value)
  return { id, ...value }
}

export const renameFolder = async (uid: string, folderId: string, name: string): Promise<void> => {
  const trimmed = name.slice(0, 60).trim()
  if (!trimmed) {
    throw new Error('Folder name cannot be empty')
  }
  await update(folderPath(uid, folderId), { name: trimmed })
}

export const deleteFolder = async (uid: string, folderId: string): Promise<void> => {
  const tasks = await listTasks(uid)
  const updates: Record<string, unknown> = {
    [`${folderDb()}/${uid}/${folderId}`]: null,
  }
  for (const task of tasks) {
    if (task.folderId === folderId && task.id) {
      updates[`${taskDb()}/${uid}/${task.id}/folderId`] = null
    }
  }
  // A PATCH at the root with slash-separated keys is an atomic multi-path update.
  await update('', updates)
}
