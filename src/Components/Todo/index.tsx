import { ListBulletIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/20/solid'
import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { ITodo } from 'service/task'

import { Checkbox } from 'Components/Checkbox'

interface TodoProps {
  todo: ITodo
  toggleDone: (todo: ITodo) => void
  deleteTodo: (todo: ITodo) => void
  onSelect: (todo: ITodo) => void
}

const TodoItem = ({ todo, toggleDone, deleteTodo, onSelect }: TodoProps) => {
  const hasFiles = todo.files && todo.files.length > 0
  const hasNote = todo.note && todo.note.length > 0

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: todo.id || '',
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  }

  const todoClassName = todo.done ? 'line-through text-gray-500' : 'text-gray-900'

  return (
    <div ref={setNodeRef} style={style} className="bg-white shadow rounded-lg">
      <div className="flex align-center justify-between">
        <div className="flex flex-1 items-center">
          <button
            className="px-3 py-3 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
            aria-label="Drag"
            {...attributes}
            {...listeners}
          >
            <ListBulletIcon className="h-5 w-5" />
          </button>
          <div className="px-1">
            <Checkbox
              checked={todo.done}
              onChange={() => {
                toggleDone(todo)
              }}
            />
          </div>
          <div onClick={() => onSelect(todo)} className={`w-full py-2 ${todoClassName}`}>
            {todo.task}
          </div>
        </div>
        <div className="px-3 py-3 inline-flex items-center">
          {hasNote && <ListBulletIcon className="h-4 w-4 text-black rounded-md" />}
          {hasFiles && <PhotoIcon className="h-4 w-4 text-emerald-600 rounded-md ml-1" />}
          <XMarkIcon
            className="h-6 w-6 cursor-pointer text-gray-500 hover:bg-gray-100 rounded-md ml-3"
            aria-hidden="true"
            onClick={() => deleteTodo(todo)}
          />
        </div>
      </div>
    </div>
  )
}

export { TodoItem }
