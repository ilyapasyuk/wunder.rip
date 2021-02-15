import React from 'react'
import LazyImage from 'react-lazy-image-loader'

import { updateTask } from 'Service/task'

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
    const deleteFile = async (file: any, todo: Todo) => {
        const newTodo: Todo = {
            ...todo,
            files: todo?.files?.filter(todoFileUrl => todoFileUrl !== file),
        }

        await updateTask(newTodo, user.id)
    }

    return (
        <StyledTaskPreview>
            <button onClick={onClose}>Close</button> <h2>{todo.task}</h2>
            <p>
                <input
                    type="text"
                    placeholder="Name"
                    value={todo.task}
                    onChange={({ target }) => updateTask({ ...todo, task: target.value }, user.id)}
                />
            </p>
            <p>
                <textarea
                    placeholder="Note"
                    value={todo.note}
                    onChange={({ target }) => updateTask({ ...todo, note: target.value }, user.id)}
                />
            </p>
            {Boolean(todo.files?.length) && (
                <StyledTodoListFiles>
                    {todo.files?.map(file => (
                        <div key={`${file}?alt=media`}>
                            <button onClick={() => deleteFile(file, todo)}>delete</button>
                            <div
                                onClick={() => {
                                    window.open(`${file}?alt=media`, '_blank')
                                }}
                            >
                                <LazyImage
                                    src={`${file}?alt=media`}
                                    alt="avatar"
                                    height={100}
                                    borderRadius={4}
                                />
                            </div>
                        </div>
                    ))}
                </StyledTodoListFiles>
            )}
            {todo.id && (
                <ImageUploader
                    userId={user.id}
                    todoId={todo.id}
                    onFileUploaded={fileUrl => {
                        const files = todo.files ? [...todo.files, fileUrl] : [fileUrl]

                        updateTask(
                            {
                                ...todo,
                                files,
                            },
                            user.id,
                        )
                    }}
                />
            )}
        </StyledTaskPreview>
    )
}

export { TaskPreview }
