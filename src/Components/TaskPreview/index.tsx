import React from 'react'
import LazyImage from 'react-lazy-image-loader'

import { getUpdateTaskRoute } from 'Service/routes'
import { databaseRef } from 'Service/firebase'
import { User } from 'Components/Layout'
import { Todo } from 'Components/Todo'
import { ImageUploader } from 'Components/ImageUploader'

import { StyledTaskPreview, StyledTodoListFiles } from './style'

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

    const isShowFiles = Boolean(todo.files?.length) && todo.files[0] !== ''

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
            {isShowFiles && (
                <StyledTodoListFiles>
                    {todo.files?.map(file => (
                        <LazyImage
                            src={`${file}?alt=media`}
                            alt="avatar"
                            height={100}
                            borderRadius={4}
                            key={`${file}?alt=media`}
                        />
                    ))}
                </StyledTodoListFiles>
            )}
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
