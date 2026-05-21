import { trackTaskCreated, trackTaskDeleted } from 'services/analytics'
import { databaseRef } from 'services/firebase'
import { getCreateTaskRoute, getUpdateTaskRoute } from 'services/routes'
import { toast } from 'sonner'

export type ITodo = {
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

    const value: ITodo = {
      task: todo.slice(0, 100).trim(),
      done: false,
      createdAt: timestamp,
      files: [],
      note: '',
      order: -timestamp,
      isPublic: false,
      folderId: folderId || null,
    }

    const taskRef = await databaseRef.child(getCreateTaskRoute(userId)).push(value)
    toast.success('Task created')
    trackTaskCreated()
    return {
      id: taskRef.key,
    }
  } catch (error) {
    const message = `Error creating task: ${error}`
    console.error(message)
    toast.error(message)
    return {
      error: new Error(message),
    }
  }
}

const prepareTaskForUpdate = (todo: ITodo) => {
  const newTask = {}

  for (const key in todo) {
    // @ts-expect-error
    if (todo[key] !== undefined) {
      // @ts-expect-error
      newTask[key] = todo[key]
    }
  }

  return newTask
}

const updateTask = (todo: ITodo, userId: string) => {
  const newTask = prepareTaskForUpdate(todo)
  if (todo.id) {
    const updates = {
      [getUpdateTaskRoute(userId, todo.id)]: newTask,
    }

    return databaseRef.update(updates)
  }
}

const updateAllTasks = (todos: ITodo[], userId: string) => {
  const updates = {}
  todos.forEach(todo => {
    const newTask = prepareTaskForUpdate(todo)
    if (todo.id) {
      // @ts-expect-error
      updates[getUpdateTaskRoute(userId, todo.id)] = newTask
    }
  })

  return databaseRef.update(updates)
}

const deleteTodo = async (todo: ITodo, userId: string) => {
  if (todo.id) {
    try {
      await databaseRef.update({ [getUpdateTaskRoute(userId, todo.id)]: null })
      toast.success('Task deleted')
      trackTaskDeleted()
    } catch (error) {
      const message = `Error deleting task: ${error}`
      console.error(message)
      toast.error(message)
      return {
        error: new Error(message),
      }
    }
  } else {
    const message = `Error deleting task: no id`
    console.error(message)
    toast.error(message)
    return {
      error: new Error(message),
    }
  }
}

const moveTodoToFolder = async (taskId: string, folderId: string | null, userId: string) => {
  await databaseRef.update({
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
