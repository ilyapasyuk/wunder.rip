import { DndContext, DragOverlay } from '@dnd-kit/core'
import { Sidebar } from 'components/layout/Sidebar'
import { TodoCard } from 'components/task/Todo'
import { TodoList } from 'components/task/TodoList'
import { Checkbox } from 'components/ui/Checkbox'
import { useFolders, useTodos } from 'hooks/useRealtimeData'
import { useTaskDnd } from 'hooks/useTaskDnd'
import { useContext, useMemo } from 'react'
import { Outlet } from 'react-router-dom'
import { Todo } from 'services/task'
import { StoreContext } from 'store/store'

const Workspace = () => {
  const { state } = useContext(StoreContext)
  const [todos, todosStatus, setTodos] = useTodos(state.user?.id)
  const [folders, foldersStatus] = useFolders(state.user?.id)

  // Open tasks first, then completed — the list renders them as two sections, and
  // drag-and-drop reorders against this same sequence.
  const visibleTodos = useMemo(() => {
    const inFolder = todos.filter(t => (t.folderId ?? null) === state.currentFolderId)
    return [...inFolder.filter(t => !t.done), ...inFolder.filter(t => t.done)]
  }, [todos, state.currentFolderId])

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
      <div className="flex flex-col md:flex-row md:h-full">
        <Sidebar
          todos={todos}
          todosStatus={todosStatus}
          folders={folders}
          foldersStatus={foldersStatus}
        />
        <div className="flex-1 min-w-0 md:min-h-0 md:overflow-y-auto">
          <TodoList
            visibleTodos={visibleTodos}
            todosStatus={todosStatus}
            folders={folders}
            foldersStatus={foldersStatus}
          />
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

const DragPreview = ({ todo, size }: DragPreviewProps) => (
  <div
    className="cursor-grabbing"
    style={{
      width: size?.width ? `${size.width}px` : undefined,
      boxSizing: 'border-box',
    }}
  >
    <TodoCard todo={todo} lifted check={<Checkbox checked={todo.done} onChange={() => {}} />} />
  </div>
)

export { Workspace }
