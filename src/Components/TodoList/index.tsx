import React, { useState } from 'react'

import { IUser } from 'service/auth'

import { TaskPreview } from 'Components/TaskPreview'
import { ITodo, TodoItem } from 'Components/Todo'

interface TodoListProps {
  todos: ITodo[]
  toggleDone: (todo: ITodo) => void
  deleteTodo: (todo: ITodo) => void
  user: IUser
  moveItem: (dragIndex: number, hoverIndex: number) => void
}

const TodoList = ({ todos, toggleDone, deleteTodo, user, moveItem }: TodoListProps) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(undefined)

  const selectedTask = todos.find(todo => todo.id === selectedTaskId)

  return (
    <div>
      {todos.map((todo, index) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          toggleDone={toggleDone}
          deleteTodo={deleteTodo}
          onSelect={todo => setSelectedTaskId(todo.id)}
          moveItem={moveItem}
          index={index}
        />
      ))}

      <TaskPreview
        isShow={!!selectedTaskId}
        todo={selectedTask}
        onClose={() => setSelectedTaskId(undefined)}
        user={user}
      />
    </div>
  )
}

export { TodoList }
