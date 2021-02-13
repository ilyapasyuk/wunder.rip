import React from 'react'
import { Todo } from '../Todo'
import { StyledTaskPreview } from './style'
import LazyImage from 'react-lazy-image-loader'

import { getUpdateTaskRoute } from 'Service/routes'
import { databaseRef } from 'Service/firebase'
import { User } from '../Layout'
import { ImageUploader } from '../ImageUploader'

interface TaskPreviewProps {
    todo: Todo
    onClose: () => void
    user: User
}

const TaskPreview = ({ todo, onClose, user }: TaskPreviewProps) => {
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
            <button onClick={onClose}>Close</button> <h2>{todo.task}</h2>
            <p>
                <input
                    type="text"
                    placeholder="Name"
                    value={todo.task}
                    onChange={({ target }) => updateTask({ ...todo, task: target.value })}
                />
            </p>
            <p>
                <textarea
                    placeholder="Note"
                    value={todo.note}
                    onChange={({ target }) => updateTask({ ...todo, note: target.value })}
                />
            </p>
            {Boolean(todo.files?.length) &&
                todo.files?.map(file => (
                    <LazyImage
                        src={`${file}?alt=media`}
                        alt="avatar"
                        height={60}
                        width={60}
                        borderRadius={4}
                        key={`${file}?alt=media`}
                    />
                ))}
            {todo.id && (
                <ImageUploader
                    userId={user.id}
                    todoId={todo.id}
                    onFileUploaded={fileUrl => {
                        updateTask({
                            ...todo,
                            files: [...todo.files, fileUrl],
                        })
                    }}
                />
            )}
        </StyledTaskPreview>
    )
}

export { TaskPreview }
