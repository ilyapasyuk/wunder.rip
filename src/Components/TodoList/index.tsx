import { Checkbox } from 'Components/Checkbox'
import { StoreContext } from 'Components/Context/store'
import { TodoItem } from 'Components/Todo'
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ListBulletIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/20/solid'
import type { DataSnapshot } from 'firebase/database'
import { KeyboardEvent, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { databaseRef } from 'services/firebase'
import { getUserRoute } from 'services/routes'
import { createTodo, deleteTodo, ITodo, updateAllTasks, updateTask } from 'services/task'

const TodoList = () => {
  const { state } = useContext(StoreContext)
  const [todos, setTodos] = useState<ITodo[]>([])
  const [currentTodo, setCurrentTodo] = useState<string>('')
  const navigate = useNavigate()

  const handleAddTodo = async (todo: string): Promise<void> => {
    if (state?.user?.id) {
      await createTodo(todo, state?.user?.id)
      setCurrentTodo('')
    }
  }

  const handleKeyPress = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.charCode === 13 && Boolean((e.target as HTMLInputElement).value.length)) {
      const text = (e.target as HTMLInputElement).value
      setCurrentTodo('')
      await handleAddTodo(text)
    }
  }

  const handleToggleDone = async (todo: ITodo) => {
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
        const items = snapshot.val() || []
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
    const updatedTasks = newItems.map((item, idx) => ({ ...item, order: idx }))
    await updateAllTasks(updatedTasks, state.user.id)
  }

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active?.id ?? '')
    setActiveId(id)

    // Get element from event data (setNodeRef from useSortable)
    const activeElement = event.active?.data?.current?.node as HTMLElement | undefined
    if (activeElement) {
      const rect = activeElement.getBoundingClientRect()
      // Use exact dimensions including borders
      setOverlaySize({ width: rect.width, height: rect.height })
    } else {
      // Fallback: use rect from event (may be less accurate)
      const elementRect = (event.active?.rect?.current?.initial || event.active?.rect?.current) as
        | { width: number; height: number }
        | undefined
      if (
        elementRect &&
        typeof elementRect.width === 'number' &&
        typeof elementRect.height === 'number'
      ) {
        setOverlaySize({ width: elementRect.width, height: elementRect.height })
      }
    }
  }

  return (
    <div className="bg-background dark:bg-background-dark h-full min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <input
          type="text"
          value={currentTodo}
          onChange={e => setCurrentTodo(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="New task..."
          className="block w-full rounded-lg border-0 px-4 py-4 text-text-primary dark:text-text-dark-primary bg-surface dark:bg-surface-dark shadow-sm ring-1 ring-inset ring-border dark:ring-border-dark placeholder:text-text-secondary dark:placeholder:text-text-dark-secondary focus:ring-2 focus:ring-inset focus:ring-primary sm:text-base leading-6 mb-6 transition-all"
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
                  toggleDone={handleToggleDone}
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
            {activeId
              ? (() => {
                  const todo = todos.find(t => String(t.id) === String(activeId))
                  if (!todo) return null
                  const hasFiles = todo.files && todo.files.length > 0
                  const hasNote = todo.note && todo.note.length > 0
                  const todoClassName = todo.done
                    ? 'line-through text-text-secondary dark:text-text-dark-secondary'
                    : 'text-text-primary dark:text-text-dark-primary'
                  return (
                    <div
                      className="bg-surface dark:bg-surface-dark shadow-sm rounded-lg border border-border dark:border-border-dark"
                      style={{
                        width: overlaySize?.width ? `${overlaySize.width}px` : undefined,
                        height: overlaySize?.height ? `${overlaySize.height}px` : undefined,
                        boxSizing: 'border-box',
                      }}
                    >
                      <div className="flex align-center justify-between">
                        <div className="flex flex-1 items-center gap-1">
                          <button
                            className="p-2 text-text-secondary dark:text-text-dark-secondary cursor-grabbing"
                            aria-label="Drag"
                            tabIndex={-1}
                            type="button"
                          >
                            <ListBulletIcon className="size-5 shrink-0" />
                          </button>
                          <div className="px-1">
                            <Checkbox checked={todo.done} onChange={() => {}} />
                          </div>
                          <div className={`w-full py-2 ${todoClassName}`}>{todo.task}</div>
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
                            className="p-1.5 rounded-md text-text-secondary dark:text-text-dark-secondary opacity-50"
                            aria-label="Delete task"
                            tabIndex={-1}
                            type="button"
                          >
                            <XMarkIcon className="size-5 shrink-0" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })()
              : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}

export { TodoList }
