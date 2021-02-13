import React from 'react'
import { SortableElement } from 'react-sortable-hoc'
import { StyledCheckbox, StyledDeleteButton, StyledTaskName, StyledTodo } from './style'
import { Delete } from '../Layout/delete'

export type Todo = {
    task: string
    done: boolean
    useruid: string
    id?: string
    createdAt?: number
    note: string
    files: string[]
}

interface TodoProps {
    todo: Todo
    toggleDone: (todo: Todo) => void
    deleteTodo: (todo: Todo) => void
    onSelect: (todo: Todo) => void
}

const TodoItem = SortableElement(({ todo, toggleDone, deleteTodo, onSelect }: TodoProps) => {
    return (
        <StyledTodo>
            <StyledCheckbox isCompleted={todo.done} onClick={() => toggleDone(todo)} />
            <StyledTaskName isCompleted={todo.done} onClick={() => onSelect(todo)}>
                {todo.task}
            </StyledTaskName>
            <StyledDeleteButton onClick={() => deleteTodo(todo)}>
                <Delete />
            </StyledDeleteButton>
        </StyledTodo>
    )
})

export { TodoItem }
