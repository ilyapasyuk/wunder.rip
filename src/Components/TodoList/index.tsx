import React, { useState } from 'react'
import { TodoItem, TodoType } from '../Todo'
import { TaskPreview } from '../TaskPreview'
import { User } from '../Layout'

interface Props {
    todos: TodoType[]
    toggleDone: (todo: TodoType) => void
    deleteTodo: (todo: TodoType) => void
    user: User
}

const TodoList = ({ todos, toggleDone, deleteTodo, user }: Props) => {
    const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(undefined)

    const selectedTask = todos.find(todo => todo.id === selectedTaskId)

    return (
        <div>
            {todos.map(todo => (
                <TodoItem
                    key={todo.id}
                    todo={todo}
                    toggleDone={toggleDone}
                    deleteTodo={deleteTodo}
                    onSelect={todo => setSelectedTaskId(todo.id)}
                />
            ))}

            <TaskPreview
                isShow={!!selectedTaskId}
                todo={selectedTask}
                onClose={() => setSelectedTaskId(undefined)}
                user={user}
            />
        </div>
    )
}

export { TodoList }
