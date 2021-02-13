import React from 'react'
import { Todo } from '../Todo'
import { StyledTaskPreview } from './style'

import { getUpdateTaskRoute } from 'Service/routes'
import { databaseRef } from 'Service/firebase'
import { User } from '../Layout'

interface TaskPreviewProps extends Todo {
    onClose: () => void
    user: User
}

const TaskPreview = ({
    id,
    createdAt,
    done,
    task,
    useruid,
    onClose,
    user,
    note,
}: TaskPreviewProps) => {
    const updateTask = (todo: Todo) => {
        if (todo.id) {
            const updates = {
                [getUpdateTaskRoute(user.id, todo.id)]: todo,
            }

            return databaseRef.update(updates)
        }
    }

    return (
        <StyledTaskPreview>
            <button onClick={onClose}>Close</button> <h2>{task}</h2>
            <p>
                <input
                    type="text"
                    placeholder="Name"
                    value={task}
                    onChange={({ target }) =>
                        updateTask({ id, task: target.value, useruid, done, createdAt })
                    }
                />
            </p>
            <p>
                <textarea
                    placeholder="Note"
                    value={note}
                    onChange={({ target }) =>
                        updateTask({ id, task, note: target.value, useruid, done, createdAt })
                    }
                />
            </p>
        </StyledTaskPreview>
    )
}

export { TaskPreview }
