import React from 'react'
import { SortableElement } from 'react-sortable-hoc'
import { StyledCheckbox, StyledDeleteButton, StyledTaskName, StyledTodo } from './style'
import { Delete } from '../Layout/delete'

export type TodoType = {
    task: string
    done: boolean
    id?: string
    createdAt: number
    note: string
    files?: string[]
}

interface TodoProps {
    todo: TodoType
    toggleDone: (todo: TodoType) => void
    deleteTodo: (todo: TodoType) => void
    onSelect: (todo: TodoType) => void
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
