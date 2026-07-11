import { db } from './firebase-admin.js'

const TASK_DB = process.env.VITE_APP_DB_TASK_NAME || 'todos_dev'
const FOLDER_DB = process.env.VITE_APP_DB_FOLDER_NAME || 'folders_dev'

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

const tasksRef = (uid: string) => db().ref(`${TASK_DB}/${uid}`)
const taskRef = (uid: string, taskId: string) => db().ref(`${TASK_DB}/${uid}/${taskId}`)
const foldersRef = (uid: string) => db().ref(`${FOLDER_DB}/${uid}`)
const folderRef = (uid: string, folderId: string) => db().ref(`${FOLDER_DB}/${uid}/${folderId}`)

export const listTasks = async (uid: string): Promise<Todo[]> => {
  const snapshot = await tasksRef(uid).get()
  const value = (snapshot.val() || {}) as Record<string, Omit<Todo, 'id'>>
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
  const ref = await tasksRef(uid).push(value)
  if (!ref.key) {
    throw new Error('Failed to create task')
  }
  return { id: ref.key, ...value }
}

export const updateTask = async (
  uid: string,
  taskId: string,
  changes: Partial<Omit<Todo, 'id'>>,
): Promise<void> => {
  await taskRef(uid, taskId).update(changes)
}

export const setTaskDone = async (uid: string, taskId: string, done: boolean): Promise<void> => {
  await taskRef(uid, taskId).update({ done })
}

export const deleteTask = async (uid: string, taskId: string): Promise<void> => {
  await taskRef(uid, taskId).remove()
}

export const moveTaskToFolder = async (
  uid: string,
  taskId: string,
  folderId: string | null,
): Promise<void> => {
  await taskRef(uid, taskId).update({ folderId, order: -Date.now() })
}

export const listFolders = async (uid: string): Promise<Folder[]> => {
  const snapshot = await foldersRef(uid).get()
  const value = (snapshot.val() || {}) as Record<string, Omit<Folder, 'id'>>
  return Object.entries(value).map(([id, folder]) => ({ id, ...folder }))
}

export const createFolder = async (uid: string, name: string): Promise<Folder> => {
  const timestamp = Date.now()
  const value: Omit<Folder, 'id'> = {
    name: name.slice(0, 60).trim(),
    createdAt: timestamp,
    order: -timestamp,
  }
  const ref = await foldersRef(uid).push(value)
  if (!ref.key) {
    throw new Error('Failed to create folder')
  }
  return { id: ref.key, ...value }
}

export const renameFolder = async (uid: string, folderId: string, name: string): Promise<void> => {
  const trimmed = name.slice(0, 60).trim()
  if (!trimmed) {
    throw new Error('Folder name cannot be empty')
  }
  await folderRef(uid, folderId).update({ name: trimmed })
}

export const deleteFolder = async (uid: string, folderId: string): Promise<void> => {
  const tasks = await listTasks(uid)
  const updates: Record<string, unknown> = {
    [`${FOLDER_DB}/${uid}/${folderId}`]: null,
  }
  for (const task of tasks) {
    if (task.folderId === folderId && task.id) {
      updates[`${TASK_DB}/${uid}/${task.id}/folderId`] = null
    }
  }
  await db().ref().update(updates)
}
