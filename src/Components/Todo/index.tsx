import { ListBulletIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/20/solid'
import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { ITodo } from 'services/task'

import { Checkbox } from 'Components/Checkbox'

interface ITodoProps {
  todo: ITodo
  toggleDone: (todo: ITodo) => void
  deleteTodo: (todo: ITodo) => void
  onSelect: (todo: ITodo) => void
}

const TodoItem = ({ todo, toggleDone, deleteTodo, onSelect }: ITodoProps) => {
  const hasFiles = todo.files && todo.files.length > 0
  const hasNote = todo.note && todo.note.length > 0

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: todo.id || '',
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Hide original while dragging; DragOverlay will render the preview
    opacity: isDragging ? 0 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  }

  const todoClassName = todo.done
    ? 'line-through text-text-secondary dark:text-text-dark-secondary'
    : 'text-text-primary dark:text-text-dark-primary'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-surface dark:bg-surface-dark shadow-sm rounded-lg border border-border dark:border-border-dark hover:shadow-md transition-shadow"
    >
      <div className="flex align-center justify-between">
        <div className="flex flex-1 items-center gap-1">
          <button
            className="p-2 text-text-secondary dark:text-text-dark-secondary hover:text-text-primary dark:hover:text-text-dark-primary cursor-grab active:cursor-grabbing transition-colors"
            aria-label="Drag"
            {...attributes}
            {...listeners}
          >
            <ListBulletIcon className="size-5 shrink-0" />
          </button>
          <div className="px-1">
            <Checkbox
              checked={todo.done}
              onChange={() => {
                toggleDone(todo)
              }}
            />
          </div>
          <div
            onClick={() => onSelect(todo)}
            className={`w-full py-2 cursor-pointer ${todoClassName}`}
          >
            {todo.task}
          </div>
        </div>
        <div className="px-2 py-2 inline-flex items-center gap-2">
          {hasNote && (
            <ListBulletIcon
              className="size-4 shrink-0 text-text-secondary dark:text-text-dark-secondary"
              aria-label="Has note"
            />
          )}
          {hasFiles && (
            <PhotoIcon
              className="size-4 shrink-0 text-success dark:text-success-dark"
              aria-label="Has files"
            />
          )}
          <button
            onClick={() => deleteTodo(todo)}
            className="p-1.5 rounded-md text-text-secondary dark:text-text-dark-secondary hover:bg-overlay-hover hover:text-text-primary dark:hover:text-text-dark-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
            aria-label="Delete task"
          >
            <XMarkIcon className="size-5 shrink-0" />
          </button>
        </div>
      </div>
    </div>
  )
}

export { TodoItem }
