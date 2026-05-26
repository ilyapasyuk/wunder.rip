import { push, ref, update } from 'firebase/database'

import { trackTaskCreated, trackTaskDeleted } from 'lib/analytics'
import { db } from 'services/firebase'
import { notify } from 'lib/notify'
import { getCreateTaskRoute, getUpdateTaskRoute } from 'services/db-paths'

export type Todo = {
  task: string
  done: boolean
  id?: string
  createdAt: number
  note: string
  files?: string[]
  order?: number
  isPublic?: boolean
  folderId?: string | null
}

const createTodo = async (
  todo: string,
  userId: string,
  folderId?: string | null,
): Promise<{
  id?: string | null
  error?: Error
}> => {
  try {
    const timestamp = Date.now()

    const value: Todo = {
      task: todo.slice(0, 100).trim(),
      done: false,
      createdAt: timestamp,
      files: [],
      note: '',
      order: -timestamp,
      isPublic: false,
      folderId: folderId || null,
    }

    const taskRef = await push(ref(db, getCreateTaskRoute(userId)), value)
    notify.success('Task created')
    trackTaskCreated()
    return {
      id: taskRef.key,
    }
  } catch (error) {
    const message = `Error creating task: ${error}`
    console.error(message)
    notify.error(message)
    return {
      error: new Error(message),
    }
  }
}

const prepareTaskForUpdate = (todo: Todo): Partial<Todo> =>
  Object.fromEntries(Object.entries(todo).filter(([, value]) => value !== undefined))

const updateTask = (todo: Todo, userId: string) => {
  const newTask = prepareTaskForUpdate(todo)
  if (todo.id) {
    return update(ref(db), { [getUpdateTaskRoute(userId, todo.id)]: newTask })
  }
}

const updateAllTasks = (todos: Todo[], userId: string) => {
  const updates: Record<string, Partial<Todo>> = {}
  todos.forEach(todo => {
    if (todo.id) {
      updates[getUpdateTaskRoute(userId, todo.id)] = prepareTaskForUpdate(todo)
    }
  })

  return update(ref(db), updates)
}

const deleteTodo = async (todo: Todo, userId: string) => {
  if (todo.id) {
    try {
      await update(ref(db), { [getUpdateTaskRoute(userId, todo.id)]: null })
      notify.success('Task deleted')
      trackTaskDeleted()
    } catch (error) {
      const message = `Error deleting task: ${error}`
      console.error(message)
      notify.error(message)
      return {
        error: new Error(message),
      }
    }
  } else {
    const message = `Error deleting task: no id`
    console.error(message)
    notify.error(message)
    return {
      error: new Error(message),
    }
  }
}

const moveTodoToFolder = async (taskId: string, folderId: string | null, userId: string) => {
  await update(ref(db), {
    [`${getUpdateTaskRoute(userId, taskId)}/folderId`]: folderId,
    [`${getUpdateTaskRoute(userId, taskId)}/order`]: -Date.now(),
  })
}

export {
  createTodo,
  deleteTodo,
  moveTodoToFolder,
  prepareTaskForUpdate,
  updateAllTasks,
  updateTask,
}
