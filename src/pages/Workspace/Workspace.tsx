import { DndContext, DragOverlay } from '@dnd-kit/core'
import { Sidebar } from 'components/layout/Sidebar'
import { TodoCard } from 'components/task/Todo'
import { TodoList } from 'components/task/TodoList'
import { Checkbox } from 'components/ui/Checkbox'
import { useFolders, useTodos } from 'hooks/useRealtimeData'
import { useTaskDnd } from 'hooks/useTaskDnd'
import { useToday } from 'hooks/useToday'
import { viewSections } from 'lib/views'
import { useContext, useMemo } from 'react'
import { Outlet } from 'react-router-dom'
import { Todo } from 'services/task'
import { StoreContext } from 'store/store'

const Workspace = () => {
  const { state } = useContext(StoreContext)
  const [todos, todosStatus, setTodos] = useTodos(state.user?.id)
  const [folders, foldersStatus] = useFolders(state.user?.id)

  const today = useToday()

  // The pane renders these sections in order, and drag-and-drop reorders against the same sequence.
  const sections = useMemo(() => viewSections(state.view, todos, today), [state.view, todos, today])
  const visibleTodos = useMemo(() => sections.flatMap(s => s.todos), [sections])

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
          today={today}
          todos={todos}
          todosStatus={todosStatus}
          folders={folders}
          foldersStatus={foldersStatus}
        />
        <div className="flex-1 min-w-0 md:min-h-0 md:overflow-y-auto">
          <TodoList
            sections={sections}
            today={today}
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
