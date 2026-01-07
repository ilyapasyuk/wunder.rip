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
}

const createTodo = async (
  todo: string,
  userId: string,
): Promise<{
  id?: string | null
  error?: Error
}> => {
  try {
    const timestamp = +new Date()

    const value: ITodo = {
      task: todo.slice(0, 100).trim(),
      done: false,
      createdAt: timestamp,
      files: [],
      note: '',
      order: -timestamp,
      isPublic: false,
    }

    const taskRef = await databaseRef.child(getCreateTaskRoute(userId)).push(value)
    toast.success('Task created')
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

export { createTodo, prepareTaskForUpdate, updateTask, updateAllTasks, deleteTodo }
