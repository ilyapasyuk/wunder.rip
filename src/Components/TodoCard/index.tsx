import React from 'react'
import { Todo } from '../Todo'

interface Props {
    todo: Todo
}

const TodoCard = ({ todo }: Props) => {
    return <div>{todo.task}</div>
}

export { TodoCard }
