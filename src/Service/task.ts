import { Todo } from 'Components/Todo'
import { getUpdateTaskRoute } from './routes'
import { databaseRef } from './firebase'

const prepareTaskForUpdate = (todo: Todo) => {
    let newTask = {}

    for (const key in todo) {
        // @ts-ignore
        if (todo[key] != undefined) {
            // @ts-ignore
            newTask[key] = todo[key]
        }
    }

    return newTask
}

const updateTask = (todo: Todo, userId: string) => {
    const newTask = prepareTaskForUpdate(todo)
    if (todo.id) {
        const updates = {
            [getUpdateTaskRoute(userId, todo.id)]: newTask,
        }

        return databaseRef.update(updates)
    }
}

export { prepareTaskForUpdate, updateTask }
