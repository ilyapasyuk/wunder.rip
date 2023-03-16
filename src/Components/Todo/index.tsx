import { XMarkIcon } from '@heroicons/react/20/solid'
import React from 'react'

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

const TodoItem = ({ todo, toggleDone, deleteTodo, onSelect }: TodoProps) => {
    return (
        <div className="bg-white shadow rounded-lg mb-4">
            <div className="flex align-center justify-between">
                <div className="flex align-center flex-1">
                    <div className="px-3 py-3">
                        <input
                            type="checkbox"
                            checked={todo.done}
                            onChange={() => {
                                toggleDone(todo)
                            }}
                        />
                    </div>
                    <div onClick={() => onSelect(todo)} className="w-full px-2 py-3">
                        {todo.task}
                    </div>
                </div>
                <div className="px-3 py-3">
                    <XMarkIcon
                        className="h-6 w-6 cursor-pointer text-gray-700 hover:bg-gray-100 rounded-md"
                        aria-hidden="true"
                        onClick={() => deleteTodo(todo)}
                    />
                </div>
            </div>
        </div>
    )
}

export { TodoItem }
