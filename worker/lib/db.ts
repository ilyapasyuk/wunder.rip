import { rtdb } from './firebase.js'

// Read per call, not at module load, so a missing binding can't silently pin the dev paths.
const taskDb = () => process.env.VITE_APP_DB_TASK_NAME || 'todos_dev'
const folderDb = () => process.env.VITE_APP_DB_FOLDER_NAME || 'folders_dev'

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
}

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

export const listTasks = async (uid: string): Promise<Todo[]> => {
  const value = (await read<Record<string, Omit<Todo, 'id'>>>(tasksPath(uid))) || {}
  return Object.entries(value).map(([id, task]) => ({ id, ...task }))
}

export const createTask = async (
  uid: string,
  task: string,
  folderId?: string | null,
): Promise<Todo> => {
  const timestamp = Date.now()
  const value: Omit<Todo, 'id'> = {
    task: task.slice(0, 100).trim(),
    done: false,
    createdAt: timestamp,
    note: '',
    files: [],
    order: -timestamp,
    isPublic: false,
    folderId: folderId || null,
  }
  const id = await push(tasksPath(uid), value)
  return { id, ...value }
}

export const updateTask = async (
  uid: string,
  taskId: string,
  changes: Partial<Omit<Todo, 'id'>>,
): Promise<void> => {
  await update(taskPath(uid, taskId), changes)
}

export const setTaskDone = async (uid: string, taskId: string, done: boolean): Promise<void> => {
  await update(taskPath(uid, taskId), { done })
}

export const deleteTask = async (uid: string, taskId: string): Promise<void> => {
  await send('DELETE', taskPath(uid, taskId))
}

export const getTask = async (uid: string, taskId: string): Promise<Todo | undefined> => {
  const value = await read<Omit<Todo, 'id'>>(taskPath(uid, taskId))
  return value ? { id: taskId, ...value } : undefined
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
