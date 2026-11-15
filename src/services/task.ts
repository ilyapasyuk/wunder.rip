import { parseTaskFields, type TaskFields, todayLocal } from '@shared/task-model'
import { push, ref, update } from 'firebase/database'
import { trackTaskCreated, trackTaskDeleted } from 'lib/analytics'
import { notify } from 'lib/notify'
import { getCreateTaskRoute, getUpdateTaskRoute } from 'services/db-paths'
import { db } from 'services/firebase'
import { type Todo, todoRecord, todoUpdates, toggleDoneUpdates } from 'services/task-record'

export type { Todo }

const createTodo = async (
  todo: string,
  userId: string,
  folderId?: string | null,
  fields: Partial<TaskFields> = {},
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
      ...parseTaskFields({}),
      ...fields,
    }

    const taskRef = await push(ref(db, getCreateTaskRoute(userId)), todoRecord(value))
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

const updateTask = (todo: Todo, userId: string) => {
  if (todo.id) {
    return update(ref(db), todoUpdates(userId, todo))
  }
}

const updateAllTasks = (todos: Todo[], userId: string) =>
  update(ref(db), Object.assign({}, ...todos.map(todo => todoUpdates(userId, todo))))

/** Done <-> not done; completing a repeating task creates its next task in the same write. */
const toggleTodoDone = (todo: Todo, userId: string) => {
  const newId = push(ref(db, getCreateTaskRoute(userId))).key
  if (!newId) throw new Error('Could not allocate a task id')
  return update(ref(db), toggleDoneUpdates(userId, todo, todayLocal(), Date.now(), newId))
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

export { createTodo, deleteTodo, moveTodoToFolder, toggleTodoDone, updateAllTasks, updateTask }
