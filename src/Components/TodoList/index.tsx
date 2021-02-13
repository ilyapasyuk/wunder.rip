import React, { useState } from 'react'
import { SortableContainer } from 'react-sortable-hoc'
import { TodoItem, Todo } from '../Todo'
import { TaskPreview } from '../TaskPreview'
import { StyledTodoList } from './style'
import { User } from '../Layout'

interface Props {
    todos: Todo[]
    toggleDone: (todo: Todo) => void
    deleteTodo: (todo: Todo) => void
    user: User
}

const TodoList = SortableContainer(({ todos, toggleDone, deleteTodo, user }: Props) => {
    const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(undefined)

    const selectedTask = todos.find(todo => todo.id === selectedTaskId)

    return (
        <StyledTodoList>
            {todos.map((todo, index) => (
                <TodoItem
                    key={todo.id}
                    todo={todo}
                    toggleDone={toggleDone}
                    deleteTodo={deleteTodo}
                    index={index}
                    onSelect={todo => setSelectedTaskId(todo.id)}
                />
            ))}

            {selectedTask?.id && (
                <TaskPreview
                    todo={selectedTask}
                    onClose={() => setSelectedTaskId(undefined)}
                    user={user}
                />
            )}
        </StyledTodoList>
    )
})

export { TodoList }
