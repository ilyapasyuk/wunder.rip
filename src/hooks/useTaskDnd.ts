import { FOLDER_DROPPABLE_PREFIX, INBOX_DROPPABLE_ID } from 'pages/Workspace/droppable'
import {
  CollisionDetection,
  DragEndEvent,
  DragStartEvent,
  KeyboardSensor,
  MouseSensor,
  pointerWithin,
  rectIntersection,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { arrayMove } from '@dnd-kit/sortable'
import { Dispatch, SetStateAction, useState } from 'react'
import { trackTaskReordered } from 'lib/analytics'
import { moveTodoToFolder, Todo, updateAllTasks } from 'services/task'

type UseTaskDndArgs = {
  todos: Todo[]
  visibleTodos: Todo[]
  setTodos: Dispatch<SetStateAction<Todo[]>>
  userId: string | undefined
}

const useTaskDnd = ({ todos, visibleTodos, setTodos, userId }: UseTaskDndArgs) => {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overlaySize, setOverlaySize] = useState<{ width: number; height: number } | null>(null)

  const sensors = useSensors(
    // Mouse: keep distance-based activation — no delay for desktop users.
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    // Touch: long-press activates a drag. Without a delay the browser cannot
    // tell a drag from a scroll, so vertical scrolling fights with the drag
    // and feels broken. 200ms with 8px tolerance is the recommended baseline.
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    // Keyboard: Space starts the drag, arrows move, Enter drops. Needed for a11y.
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
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
      return
    }

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setOverlaySize(null)
    if (!over || !userId) return

    const overId = String(over.id)
    const activeIdStr = String(active.id)

    // Drop onto a folder (or Inbox) — reassign folderId.
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
      await moveTodoToFolder(activeIdStr, targetFolderId, userId)
      return
    }

    // Reorder within the current folder's visible list.
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
    await updateAllTasks(updated, userId)
    trackTaskReordered()
  }

  const handleDragCancel = () => {
    setActiveId(null)
    setOverlaySize(null)
  }

  const activeTodo = activeId ? (todos.find(t => t.id === activeId) ?? null) : null

  return {
    sensors,
    collisionDetection,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
    activeId,
    overlaySize,
    activeTodo,
  }
}

export { useTaskDnd }
