import { Checkbox } from 'Components/Checkbox'
import { StoreContext } from 'Components/Context/store'
import { Sidebar } from 'Components/Sidebar'
import { TodoList } from 'Components/TodoList'
import {
  CollisionDetection,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { ListBulletIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/20/solid'
import type { DataSnapshot } from 'firebase/database'
import { useContext, useEffect, useMemo, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { trackTaskReordered } from 'services/analytics'
import { databaseRef } from 'services/firebase'
import { getUserRoute } from 'services/routes'
import { ITodo, moveTodoToFolder, updateAllTasks } from 'services/task'

import { FOLDER_DROPPABLE_PREFIX, INBOX_DROPPABLE_ID } from './droppable'

const Workspace = () => {
  const { state } = useContext(StoreContext)
  const [todos, setTodos] = useState<ITodo[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overlaySize, setOverlaySize] = useState<{ width: number; height: number } | null>(null)

  useEffect(() => {
    if (!state?.user?.id) {
      setTodos([])
      return
    }
    const unsubscribe = databaseRef
      .child(getUserRoute(state.user.id))
      .on('value', (snapshot: DataSnapshot) => {
        const items = snapshot.val() || {}
        const prepared: ITodo[] = Object.keys(items)
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  )

  const collisionDetection: CollisionDetection = args => {
    const pointer = pointerWithin(args)
    if (pointer.length > 0) return pointer
    return rectIntersection(args)
  }

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active?.id ?? '')
    setActiveId(id)

    const activeElement = event.active?.data?.current?.node as HTMLElement | undefined
    if (activeElement) {
      const rect = activeElement.getBoundingClientRect()
      setOverlaySize({ width: rect.width, height: rect.height })
    } else {
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setOverlaySize(null)
    if (!over || !state?.user?.id) return

    const overId = String(over.id)
    const activeIdStr = String(active.id)

    if (overId.startsWith(FOLDER_DROPPABLE_PREFIX)) {
      const targetFolderId =
        overId === INBOX_DROPPABLE_ID ? null : overId.slice(FOLDER_DROPPABLE_PREFIX.length)
      const task = todos.find(t => t.id === activeIdStr)
      if (!task) return
      const currentFolderId = task.folderId ?? null
      if (currentFolderId === targetFolderId) return
      setTodos(prev =>
        prev.map(t =>
          t.id === activeIdStr ? { ...t, folderId: targetFolderId, order: -Date.now() } : t,
        ),
      )
      await moveTodoToFolder(activeIdStr, targetFolderId, state.user.id)
      return
    }

    if (activeIdStr === overId) return
    const ids = visibleTodos.map(t => t.id || '')
    const oldIndex = ids.indexOf(activeIdStr)
    const newIndex = ids.indexOf(overId)
    if (oldIndex === -1 || newIndex === -1) return
    const reordered = arrayMove(visibleTodos, oldIndex, newIndex)
    const updated = reordered.map((item, idx) => ({ ...item, order: idx }))
    const updatedIds = new Set(updated.map(t => t.id))
    setTodos(prev => {
      const others = prev.filter(t => !updatedIds.has(t.id))
      return [...others, ...updated].sort((a, b) => (a.order || 0) - (b.order || 0))
    })
    await updateAllTasks(updated, state.user.id)
    trackTaskReordered()
  }

  const activeTodo = activeId ? todos.find(t => t.id === activeId) : null

  return (
    <DndContext
      collisionDetection={collisionDetection}
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setActiveId(null)
        setOverlaySize(null)
      }}
    >
      <div className="flex flex-col md:flex-row">
        <Sidebar todos={todos} />
        <div className="flex-1 min-w-0">
          <TodoList todos={todos} visibleTodos={visibleTodos} />
        </div>
        <Outlet />
      </div>
      <DragOverlay adjustScale={false}>
        {activeTodo
          ? (() => {
              const hasFiles = activeTodo.files && activeTodo.files.length > 0
              const hasNote = activeTodo.note && activeTodo.note.length > 0
              const todoClassName = activeTodo.done
                ? 'line-through text-text-secondary dark:text-text-dark-secondary'
                : 'text-text-primary dark:text-text-dark-primary'
              return (
                <div
                  className="bg-surface dark:bg-surface-dark shadow-lg rounded-lg border border-border dark:border-border-dark"
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
                        <Checkbox checked={activeTodo.done} onChange={() => {}} />
                      </div>
                      <div className={`w-full py-2 ${todoClassName}`}>{activeTodo.task}</div>
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
  )
}

export { Workspace }
