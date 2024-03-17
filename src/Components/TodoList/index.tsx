import React from 'react'

import { ITodo } from 'service/task'

import { TodoItem } from 'Components/Todo'

interface TodoListProps {
  todos: ITodo[]
  toggleDone: (todo: ITodo) => void
  deleteTodo: (todo: ITodo) => void
  moveItem: (dragIndex: number, hoverIndex: number) => void
  onSelect: (id: string) => void
}

const TodoList = ({ todos, toggleDone, deleteTodo, moveItem, onSelect }: TodoListProps) => {
  return (
    <div className="flex flex-col gap-4">
      {todos.map((todo, index) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          toggleDone={toggleDone}
          deleteTodo={deleteTodo}
          onSelect={todo => {
            if (todo.id) {
              onSelect(todo.id)
            }
          }}
          moveItem={moveItem}
          index={index}
        />
      ))}
    </div>
  )
}

export { TodoList }
