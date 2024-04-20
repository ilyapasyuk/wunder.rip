import React, { lazy, useContext, useEffect, useState } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

import { databaseRef } from 'service/firebase'
import { getUserRoute } from 'service/routes'
import { ITodo, createTodo, deleteTodo, updateAllTask, updateTask } from 'service/task'

import { StoreContext } from 'Components/Context/store'
import { TodoItem } from 'Components/Todo'

const TaskPreview = lazy(() => import('Components/TaskPreview'))

const TodoList = () => {
  const { state, dispatch } = useContext(StoreContext)
  const [todos, setTodos] = useState<ITodo[]>([])
  const [currentTodo, setCurrentTodo] = useState<string>('')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const selectedTask = todos.find(todo => todo.id === selectedTaskId)

  const addTodo = async (todo: string): Promise<void> => {
    if (state?.user?.id) {
      await createTodo(todo, state?.user?.id)
      setCurrentTodo('')
    }
  }

  const keyHandle = async (e: any) => {
    if (e.charCode === 13 && Boolean(e.target.value.length)) {
      const text = e.target.value
      setCurrentTodo('')
      await addTodo(text)
    }
  }

  const toggleDone = async (todo: ITodo) => {
    const value: ITodo = {
      ...todo,
      done: !todo.done,
    }

    if (todo.id && state?.user?.id) {
      await updateTask(value, state?.user?.id)
    }
  }

  const deleteTodoHandler = async (todo: ITodo) => {
    if (state?.user?.id) {
      await deleteTodo(todo, state?.user?.id)
    }
  }

  useEffect(() => {
    if (state?.user?.id) {
      databaseRef.child(getUserRoute(state?.user?.id)).on('value', snapshot => {
        let items = snapshot.val() || []
        const prepareTodos: ITodo[] = Object.keys(items)
          .map(i => {
            return {
              id: i,
              createdAt: items[i].createdAt,
              task: items[i].task,
              done: items[i].done,
              useruid: items[i].useruid,
              note: items[i].note,
              files: items[i].files,
              order: items[i].order || 0,
              isPublic: items[i]?.isPublic || false,
            }
          })
          .sort((a, b) => a.order - b.order)
        setTodos(prepareTodos)
      })
    }
  }, [state.user])

  const reorderTasks = async (dragIndex: number, hoverIndex: number) => {
    const dragItem = todos[dragIndex]
    const newItems = [...todos]
    newItems.splice(dragIndex, 1)
    newItems.splice(hoverIndex, 0, dragItem)

    newItems.forEach((item, index) => {
      item.order = index
    })
    if (state?.user?.id) {
      await updateAllTask(newItems, state?.user?.id)
    }
  }

  return (
    <div className="bg-gray-100 h-full">
      <>
        <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8 py-8">
          <input
            type="text"
            value={currentTodo}
            autoFocus
            onChange={e => setCurrentTodo(e.target.value)}
            onKeyPress={keyHandle}
            placeholder="New task..."
            className="block w-full rounded-md border-0 px-4 py-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 mb-6"
          />

          <DndProvider backend={HTML5Backend}>
            <div className="flex flex-col gap-4">
              {todos.map((todo, index) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  toggleDone={toggleDone}
                  deleteTodo={() => {
                    if (state?.user?.id) {
                      deleteTodo(todo, state?.user?.id)
                    }
                  }}
                  onSelect={todo => {
                    if (todo.id) {
                      setSelectedTaskId(todo.id)
                    }
                  }}
                  moveItem={reorderTasks}
                  index={index}
                />
              ))}
            </div>
          </DndProvider>
        </div>

        <TaskPreview
          isShow={!!selectedTaskId}
          todo={selectedTask}
          onClose={() => setSelectedTaskId(null)}
          onEdit={todo => {
            if (state?.user?.id) {
              updateTask(todo, state?.user?.id)
            }
          }}
        />
      </>
    </div>
  )
}

export { TodoList }
