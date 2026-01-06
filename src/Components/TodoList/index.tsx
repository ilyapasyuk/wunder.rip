import React, { useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { DataSnapshot } from 'firebase/database'
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { ListBulletIcon, PhotoIcon } from '@heroicons/react/20/solid'

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
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overlaySize, setOverlaySize] = useState<{ width: number; height: number } | null>(null)

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setOverlaySize(null)
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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active?.id ?? ''))
    const rectAny: any = (event as any).active?.rect?.current?.initial || (event as any).active?.rect?.current
    if (rectAny && typeof rectAny.width === 'number' && typeof rectAny.height === 'number') {
      setOverlaySize({ width: rectAny.width, height: rectAny.height })
    }
  }

  return (
    <div className="bg-[#f6f7fb] h-full min-h-screen">
      <>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <input
            type="text"
            value={currentTodo}
            autoFocus
            onChange={e => setCurrentTodo(e.target.value)}
            onKeyPress={keyHandle}
            placeholder="New task..."
            className="block w-full rounded-lg border-0 px-4 py-4 text-[#323338] bg-white shadow-sm ring-1 ring-inset ring-[#c3c6d4] placeholder:text-[#676879] focus:ring-2 focus:ring-inset focus:ring-[#0073ea] sm:text-base leading-6 mb-6 transition-all"
          />

          <DndContext
            collisionDetection={closestCenter}
            sensors={sensors}
            modifiers={[restrictToVerticalAxis]}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-3">
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
            <DragOverlay adjustScale={false}>
              {activeId ? (
                (() => {
                  const todo = todos.find(t => String(t.id) === String(activeId))
                  if (!todo) return null
                  return (
                    <div
                      className="bg-white shadow-lg rounded-lg border border-[#c3c6d4]"
                      style={{ width: overlaySize?.width, height: overlaySize?.height }}
                    >
                      <div className="flex align-center justify-between">
                        <div className="flex flex-1 items-center">
                          <button className="px-3 py-3 text-[#676879]">
                            <ListBulletIcon className="h-5 w-5" />
                          </button>
                          <div className="px-1 w-full py-2 text-[#323338] truncate">
                            {todo.task}
                          </div>
                        </div>
                        <div className="px-3 py-3 inline-flex items-center">
                          {Boolean(todo.note) && (
                            <ListBulletIcon className="h-4 w-4 text-[#323338] rounded-md" />
                          )}
                          {Boolean(todo.files?.length) && (
                            <PhotoIcon className="h-4 w-4 text-[#00854d] rounded-md ml-1" />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })()
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </>
    </div>
  )
}

export { TodoList }
