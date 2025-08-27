import React, { useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { DataSnapshot } from 'firebase/database'
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'

import { databaseRef } from 'service/firebase'
import { getUserRoute } from 'service/routes'
import { ITodo, createTodo, deleteTodo, updateAllTask, updateTask } from 'service/task'

import { StoreContext } from 'Components/Context/store'
import { TodoItem } from 'Components/Todo'

const TodoList = () => {
  const { state, dispatch } = useContext(StoreContext)
  const [todos, setTodos] = useState<ITodo[]>([])
  const [currentTodo, setCurrentTodo] = useState<string>('')
  const navigate = useNavigate()

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

  useEffect(() => {
    if (state?.user?.id) {
      databaseRef.child(getUserRoute(state?.user?.id)).on('value', (snapshot: DataSnapshot) => {
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  )

  const ids = useMemo(() => todos.map(t => t.id || ''), [todos])

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = ids.indexOf(String(active.id))
    const newIndex = ids.indexOf(String(over.id))
    if (oldIndex === -1 || newIndex === -1) return
    const newItems = arrayMove(todos, oldIndex, newIndex)
    setTodos(newItems)
    if (!state?.user?.id) return
    const updated = newItems.map((item, idx) => ({ ...item, order: idx }))
    await updateAllTask(updated, state.user.id)
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

          <DndContext
            collisionDetection={closestCenter}
            sensors={sensors}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-4">
                {todos.map(todo => (
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
                        navigate(`/t/${todo.id}`)
                      }
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </>
    </div>
  )
}

export { TodoList }
