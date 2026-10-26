import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CheckCircleIcon, ListBulletIcon, PlusIcon, StopIcon } from '@heroicons/react/24/outline'
import { TodoItem } from 'components/task/Todo'
import { Skeleton } from 'components/ui/Skeleton'
import { LoadStatus } from 'hooks/useRealtimeData'
import { trackTaskCompleted } from 'lib/analytics'
import { FormEvent, ReactNode, useContext, useMemo, useState } from 'react'
import { useMatch, useNavigate } from 'react-router-dom'
import { ROUTE } from 'routes'
import { Folder } from 'services/folder'
import { createTodo, deleteTodo, Todo, updateTask } from 'services/task'
import { StoreContext } from 'store/store'

interface TodoListProps {
  visibleTodos: Todo[]
  todosStatus: LoadStatus
  folders: Folder[]
  foldersStatus: LoadStatus
}

const TodoList = ({ visibleTodos, todosStatus, folders, foldersStatus }: TodoListProps) => {
  const { state } = useContext(StoreContext)
  const [currentTodo, setCurrentTodo] = useState<string>('')
  const navigate = useNavigate()
  const openTaskId = useMatch(ROUTE.TASK_PAGE)?.params.id

  const handleAddTodo = async (todo: string): Promise<void> => {
    if (state?.user?.id) {
      await createTodo(todo, state?.user?.id, state.currentFolderId)
      setCurrentTodo('')
    }
  }

  const handleToggleDone = async (todo: Todo) => {
    const value: Todo = {
      ...todo,
      done: !todo.done,
    }

    if (todo.id && state?.user?.id) {
      await updateTask(value, state?.user?.id)
      trackTaskCompleted(!todo.done)
    }
  }

  const ids = useMemo(() => visibleTodos.map(t => t.id || ''), [visibleTodos])

  // null while the folder list is still loading — rendering 'Inbox' there would flash a wrong title.
  const currentFolderName = useMemo(() => {
    if (!state.currentFolderId) return 'Inbox'
    if (foldersStatus === 'loading') return null
    return folders.find(f => f.id === state.currentFolderId)?.name || 'Inbox'
  }, [state.currentFolderId, folders, foldersStatus])
  const isLoading = todosStatus === 'loading'

  const openTodos = visibleTodos.filter(t => !t.done)
  const doneTodos = visibleTodos.filter(t => t.done)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const text = currentTodo.trim()
    if (!text) return
    setCurrentTodo('')
    await handleAddTodo(text)
  }

  const renderItem = (todo: Todo) => (
    <TodoItem
      key={todo.id}
      todo={todo}
      selected={todo.id === openTaskId}
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
  )

  return (
    <div className="bg-background h-full min-h-screen md:min-h-0">
      <div className="mx-auto max-w-2xl px-4 sm:px-8 pt-6 sm:pt-10 pb-24">
        <header className="flex items-start justify-between gap-4">
          {currentFolderName === null ? (
            <Skeleton className="mt-2 h-11 w-48 rounded-xl" />
          ) : (
            <h1
              key={currentFolderName}
              className="min-w-0 font-display text-[2.75rem] sm:text-5xl font-bold tracking-[-0.03em] leading-[1.05] text-text-primary break-words motion-safe:animate-fade-in"
            >
              {currentFolderName}
            </h1>
          )}
          {isLoading && <Skeleton className="mt-1 h-12 w-32 shrink-0 rounded-full" />}
          {todosStatus === 'ready' && (
            <div className="mt-1 flex shrink-0 items-center gap-4 h-12 rounded-full bg-muted px-4 text-xl font-medium tabular-nums text-text-primary motion-safe:animate-fade-in">
              <span className="inline-flex items-center gap-1.5" title="Open tasks">
                <StopIcon className="size-5 text-text-tertiary" aria-hidden="true" />
                {openTodos.length}
                <span className="sr-only">open</span>
              </span>
              <span className="inline-flex items-center gap-1.5" title="Completed tasks">
                <CheckCircleIcon className="size-5 text-text-tertiary" aria-hidden="true" />
                {doneTodos.length}
                <span className="sr-only">completed</span>
              </span>
            </div>
          )}
        </header>
        <p className="mt-6 text-lg font-medium text-text-secondary">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-4 mb-10 flex items-center gap-3 rounded-2xl bg-muted shadow-card pl-5 pr-2 h-[4.25rem] focus-within:bg-surface focus-within:shadow-tile transition-[background-color,box-shadow]"
        >
          <PlusIcon className="size-6 shrink-0 text-text-tertiary" aria-hidden="true" />
          <input
            type="text"
            value={currentTodo}
            onChange={e => setCurrentTodo(e.target.value)}
            placeholder="Add a task"
            aria-label="New task"
            className="flex-1 min-w-0 bg-transparent border-0 p-0 text-[17px] sm:text-lg font-medium text-text-primary placeholder:text-text-secondary focus:ring-0"
          />
          <button
            type="submit"
            aria-label="Add task"
            disabled={!currentTodo.trim()}
            className="h-11 shrink-0 rounded-xl bg-accent px-4 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-0 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2"
          >
            Add
          </button>
        </form>

        {isLoading && <ListSkeleton />}

        {todosStatus === 'error' && (
          <div
            role="alert"
            className="rounded-2xl bg-muted shadow-card px-6 py-8 motion-safe:animate-fade-up"
          >
            <div className="text-lg font-semibold text-text-primary">Couldn't load your tasks</div>
            <p className="mt-1 text-text-secondary">Check your connection and try again.</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 h-11 rounded-xl bg-surface px-4 text-sm font-semibold text-text-primary shadow-tile ring-1 ring-border active:scale-95 transition-transform"
            >
              Reload
            </button>
          </div>
        )}

        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {openTodos.length > 0 && (
            <section>
              <SectionTitle icon={<ListBulletIcon className="size-5" aria-hidden="true" />}>
                To do
              </SectionTitle>
              <div className="flex flex-col gap-2.5">{openTodos.map(renderItem)}</div>
            </section>
          )}
          {doneTodos.length > 0 && (
            <section className={openTodos.length > 0 ? 'mt-10' : ''}>
              <SectionTitle icon={<CheckCircleIcon className="size-5" aria-hidden="true" />}>
                Completed
              </SectionTitle>
              <div className="flex flex-col gap-2.5">{doneTodos.map(renderItem)}</div>
            </section>
          )}
        </SortableContext>

        {todosStatus === 'ready' && visibleTodos.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-border px-6 py-12 text-center motion-safe:animate-fade-up">
            <div className="text-lg font-semibold text-text-primary">No tasks yet</div>
            <p className="mt-1 text-text-secondary">Type one above and press Enter.</p>
          </div>
        )}
      </div>
    </div>
  )
}

const SKELETON_WIDTHS = ['w-3/5', 'w-2/5', 'w-1/2', 'w-1/3']

/** Same rhythm as the real list: a section title, then cards of the same height. */
const ListSkeleton = () => (
  <div role="status" aria-label="Loading tasks">
    <Skeleton className="mb-5 ml-1 h-5 w-20 rounded-md" />
    <div className="flex flex-col gap-2.5">
      {SKELETON_WIDTHS.map((width, i) => (
        <div
          key={width}
          className="flex items-center gap-4 rounded-2xl bg-muted shadow-card pl-5 pr-4 min-h-[4.25rem]"
          style={{ opacity: 1 - i * 0.2 }}
        >
          <Skeleton className="size-6 rounded-[7px]" />
          <Skeleton className={`h-4 rounded-md ${width}`} />
        </div>
      ))}
    </div>
  </div>
)

const SectionTitle = ({ icon, children }: { icon: ReactNode; children: ReactNode }) => (
  <h2 className="mb-4 flex items-center gap-2.5 pl-1 text-lg font-semibold text-text-secondary">
    <span className="text-text-secondary/80">{icon}</span>
    {children}
  </h2>
)

export { TodoList }
