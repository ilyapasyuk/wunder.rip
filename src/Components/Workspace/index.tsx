import { Checkbox } from 'Components/Checkbox'
import { StoreContext } from 'Components/Context/store'
import { Sidebar } from 'Components/Sidebar'
import { TodoList } from 'Components/TodoList'
import { DndContext, DragOverlay } from '@dnd-kit/core'
import { ListBulletIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/20/solid'
import { onValue, ref } from 'firebase/database'
import { useTaskDnd } from 'hooks/useTaskDnd'
import { useContext, useEffect, useMemo, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { db } from 'services/firebase'
import { getUserRoute } from 'services/routes'
import { Todo } from 'services/task'

const Workspace = () => {
  const { state } = useContext(StoreContext)
  const [todos, setTodos] = useState<Todo[]>([])

  useEffect(() => {
    if (!state?.user?.id) {
      setTodos([])
      return
    }
    const unsubscribe = onValue(ref(db, getUserRoute(state.user.id)), snapshot => {
      const items = snapshot.val() || {}
      const prepared: Todo[] = Object.keys(items)
        .map(i => ({
          id: i,
          createdAt: items[i].createdAt,
          task: items[i].task,
          done: items[i].done,
          note: items[i].note,
          files: items[i].files,
          order: items[i].order || 0,
          isPublic: items[i]?.isPublic || false,
          folderId: items[i]?.folderId ?? null,
        }))
        .sort((a, b) => (a.order || 0) - (b.order || 0))
      setTodos(prepared)
    })
    return () => unsubscribe()
  }, [state.user])

  const visibleTodos = useMemo(
    () => todos.filter(t => (t.folderId ?? null) === state.currentFolderId),
    [todos, state.currentFolderId],
  )

  const {
    sensors,
    collisionDetection,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
    overlaySize,
    activeTodo,
  } = useTaskDnd({ todos, visibleTodos, setTodos, userId: state.user?.id })

  return (
    <DndContext
      collisionDetection={collisionDetection}
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex flex-col md:flex-row">
        <Sidebar todos={todos} />
        <div className="flex-1 min-w-0">
          <TodoList todos={todos} visibleTodos={visibleTodos} />
        </div>
        <Outlet />
      </div>
      <DragOverlay adjustScale={false}>
        {activeTodo ? <DragPreview todo={activeTodo} size={overlaySize} /> : null}
      </DragOverlay>
    </DndContext>
  )
}

type DragPreviewProps = {
  todo: Todo
  size: { width: number; height: number } | null
}

const DragPreview = ({ todo, size }: DragPreviewProps) => {
  const hasFiles = todo.files && todo.files.length > 0
  const hasNote = todo.note && todo.note.length > 0
  const todoClassName = todo.done
    ? 'line-through text-text-secondary dark:text-text-dark-secondary'
    : 'text-text-primary dark:text-text-dark-primary'
  return (
    <div
      className="bg-surface dark:bg-surface-dark shadow-lg rounded-lg border border-border dark:border-border-dark"
      style={{
        width: size?.width ? `${size.width}px` : undefined,
        height: size?.height ? `${size.height}px` : undefined,
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
}

export { Workspace }
