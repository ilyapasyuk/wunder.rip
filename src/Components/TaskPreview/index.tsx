import React, { useRef } from 'react'
import LazyImage from 'react-lazy-image-loader'
import { DeleteForever, Visibility } from '@material-ui/icons'

import { updateTask } from 'Service/task'
import { useOnClickOutside } from 'Service/useClickOutside'

import { User } from 'Components/Layout'
import { TodoType } from 'Components/Todo'
import { ImageUploader } from 'Components/ImageUploader'

import {
    StyledTaskPreview,
    StyledTodoListFiles,
    StyledTodoListFile,
    StyledTodoListFileDelete,
    StyledTodoListFilePreview,
    StyledTodoListTaskName,
} from './style'

interface TaskPreviewProps {
    todo: TodoType
    onClose: () => void
    user: User
}

const TaskPreview = ({ todo, onClose, user }: TaskPreviewProps) => {
    const taskPreviewRef = useRef(null)

    const deleteFile = async (file: any, todo: TodoType) => {
        const newTodo: TodoType = {
            ...todo,
            files: todo?.files?.filter(todoFileUrl => todoFileUrl !== file),
        }

        await updateTask(newTodo, user.id)
    }

    useOnClickOutside(taskPreviewRef, onClose)

    return (
        <StyledTaskPreview ref={taskPreviewRef}>
            <button onClick={onClose}>Close</button>
            <StyledTodoListTaskName>
                <input
                    type="text"
                    placeholder="Name"
                    value={todo.task}
                    onChange={({ target }) => updateTask({ ...todo, task: target.value }, user.id)}
                />
            </StyledTodoListTaskName>
            <StyledTodoListTaskName>
                <textarea
                    placeholder="Note"
                    value={todo.note}
                    onChange={({ target }) => updateTask({ ...todo, note: target.value }, user.id)}
                />
            </StyledTodoListTaskName>
            {Boolean(todo.files?.length) && (
                <StyledTodoListFiles>
                    {todo.files?.map(file => (
                        <StyledTodoListFile key={`${file}?alt=media`}>
                            <StyledTodoListFileDelete onClick={() => deleteFile(file, todo)}>
                                <DeleteForever />
                            </StyledTodoListFileDelete>
                            <StyledTodoListFilePreview
                                onClick={() => {
                                    window.open(`${file}?alt=media`, '_blank')
                                }}
                            >
                                <Visibility />
                            </StyledTodoListFilePreview>
                            <LazyImage
                                src={`${file}?alt=media`}
                                alt="avatar"
                                height={100}
                                borderRadius={4}
                            />
                        </StyledTodoListFile>
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
