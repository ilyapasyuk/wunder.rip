import { databaseRef } from 'service/firebase'
import { getUpdateTaskRoute } from 'service/routes'

import { ITodo } from 'Components/Todo'

const prepareTaskForUpdate = (todo: ITodo) => {
  let newTask = {}

  for (const key in todo) {
    // @ts-ignore
    if (todo[key] !== undefined) {
      // @ts-ignore
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

const updateAllTask = (todos: ITodo[], userId: string) => {
  const updates = {}
  todos.forEach(todo => {
    const newTask = prepareTaskForUpdate(todo)
    if (todo.id) {
      // @ts-ignore
      updates[getUpdateTaskRoute(userId, todo.id)] = newTask
    }
  })

  return databaseRef.update(updates)
}

export { prepareTaskForUpdate, updateTask, updateAllTask }
