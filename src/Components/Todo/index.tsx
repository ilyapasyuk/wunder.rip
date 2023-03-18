import { Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/20/solid'
import React, { useRef } from 'react'
import { useDrag, useDrop } from 'react-dnd'

export type ITodo = {
  task: string
  done: boolean
  id?: string
  createdAt: number
  note: string
  files?: string[]
  order?: number
}

interface TodoProps {
  todo: ITodo
  toggleDone: (todo: ITodo) => void
  deleteTodo: (todo: ITodo) => void
  onSelect: (todo: ITodo) => void
  moveItem: (dragIndex: number, hoverIndex: number) => void
  index: number
}

const TodoItem = ({ todo, toggleDone, deleteTodo, onSelect, moveItem, index }: TodoProps) => {
  const ref = useRef(null)

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'list-item',
    drop(hoveredItem) {
      // @ts-ignore
      const dragIndex = hoveredItem.index
      const hoverIndex = index

      if (dragIndex === hoverIndex) return
      moveItem(dragIndex, hoverIndex)
      // @ts-ignore
      hoveredItem.index = hoverIndex
    },
    collect: monitor => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  })

  // @ts-ignore
  const [{ isDragging }, drag] = useDrag({
    type: 'list-item',
    item: { type: 'list-item', id: todo.id, index },
    collect: monitor => ({
      isDragging: monitor.isDragging(),
    }),
  })

  drag(drop(ref))

  const opacity = isDragging ? 0.4 : 1

  const isActive = isOver && canDrop
  let backgroundColor = ''
  if (isActive) {
    backgroundColor = ''
  } else if (canDrop) {
    backgroundColor = ''
  }

  const todoClassName = todo.done ? 'line-through text-gray-500' : 'text-gray-900'

  return (
    <div ref={ref}>
      <Transition
        show={isActive && index === 0}
        enter="transition-opacity duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-30"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="relative my-4 bg-gray-200 shadow rounded-lg h-10"></div>
      </Transition>
      {/*<Transition*/}
      {/*    show={!isDragging}*/}
      {/*    enter="transition-opacity duration-300"*/}
      {/*    enterFrom="opacity-0"*/}
      {/*    enterTo="opacity-100"*/}
      {/*    leave="transition-opacity transition-all duration-300"*/}
      {/*    leaveFrom="opacity-100"*/}
      {/*    leaveTo="opacity-0"*/}
      {/*>*/}
      {!isDragging && (
        <div className="py-2">
          <div
            className="bg-white shadow rounded-lg"
            style={{ opacity, cursor: 'grab', backgroundColor }}
          >
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
                <div onClick={() => onSelect(todo)} className={`w-full px-2 py-3 ${todoClassName}`}>
                  {todo.task}
                </div>
              </div>
              <div className="px-3 py-3">
                <XMarkIcon
                  className="h-6 w-6 cursor-pointer text-gray-500 hover:bg-gray-100 rounded-md"
                  aria-hidden="true"
                  onClick={() => deleteTodo(todo)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/*</Transition>*/}
      <Transition
        show={isActive && index !== 0}
        enter="transition-opacity duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-30"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="relative my-4 bg-gray-200 shadow rounded-lg h-10"></div>
      </Transition>
    </div>
  )
}

export { TodoItem }
