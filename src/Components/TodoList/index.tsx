import React from 'react'
import { SortableContainer } from 'react-sortable-hoc'
import { TodoItem, Todo } from '../Todo'

interface Props {
    todos: Todo[]
    toggleDone: (todo: Todo) => void
    deleteTodo: (todo: Todo) => void
}

const TodoList = SortableContainer(({ todos, toggleDone, deleteTodo }: Props) => {
    return (
        <div>
            {todos.map((todo, index) => (
                <TodoItem
                    key={todo.id}
                    todo={todo}
                    toggleDone={toggleDone}
                    deleteTodo={deleteTodo}
                    index={index}
                />
            ))}
        </div>
    )
})

export { TodoList }
