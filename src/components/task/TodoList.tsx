import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import {
  ArchiveBoxIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ListBulletIcon,
  MoonIcon,
  PlusIcon,
  Square3Stack3DIcon,
  StarIcon,
  StopIcon,
} from '@heroicons/react/24/outline'
import type { Day, SmartList, TaskFields } from '@shared/task-model'
import { TodoItem } from 'components/task/Todo'
import { Skeleton } from 'components/ui/Skeleton'
import { LoadStatus } from 'hooks/useRealtimeData'
import { trackTaskCompleted } from 'lib/analytics'
import { Section, SectionIcon, SMART_LIST_TITLES, View } from 'lib/views'
import { ComponentType, FormEvent, ReactNode, useContext, useMemo, useState } from 'react'
import { useMatch, useNavigate } from 'react-router-dom'
import { ROUTE } from 'routes'
import { Folder } from 'services/folder'
import { createTodo, deleteTodo, Todo, toggleTodoDone } from 'services/task'
import { StoreContext } from 'store/store'

interface TodoListProps {
  sections: Section[]
  today: Day
  todosStatus: LoadStatus
  folders: Folder[]
  foldersStatus: LoadStatus
}

const SECTION_ICONS: Record<SectionIcon, ComponentType<{ className?: string }>> = {
  todo: ListBulletIcon,
  done: CheckCircleIcon,
  today: StarIcon,
  evening: MoonIcon,
  day: CalendarDaysIcon,
  anytime: Square3Stack3DIcon,
  someday: ArchiveBoxIcon,
}

/** Where a task typed into this view lands, and what it is scheduled for; null = no add box. */
const newTaskTarget = (
  view: View,
  today: Day,
): { folderId: string | null; fields: Partial<TaskFields> } | null => {
  if (view.kind === 'list') return { folderId: view.folderId, fields: {} }
  switch (view.list) {
    case 'today':
      return {
        folderId: null,
        fields: { when: { kind: 'day', day: today, evening: false, reminder: null } },
      }
    case 'someday':
      return { folderId: null, fields: { when: { kind: 'someday' } } }
    case 'anytime':
      return { folderId: null, fields: {} }
    default:
      return null
  }
}

const EMPTY_TEXT: Record<SmartList, string> = {
  today: 'Nothing planned for today.',
  upcoming: 'Nothing scheduled. Give a task a date to see it here.',
  anytime: 'No open tasks without a date.',
  someday: 'Nothing put off for someday.',
  logbook: 'Completed tasks show up here.',
}

const TodoList = ({ sections, today, todosStatus, folders, foldersStatus }: TodoListProps) => {
  const { state } = useContext(StoreContext)
  const [currentTodo, setCurrentTodo] = useState<string>('')
  const navigate = useNavigate()
  const openTaskId = useMatch(ROUTE.TASK_PAGE)?.params.id

  const addTarget = newTaskTarget(state.view, today)

  const handleAddTodo = async (todo: string): Promise<void> => {
    if (state?.user?.id && addTarget) {
      await createTodo(todo, state?.user?.id, addTarget.folderId, addTarget.fields)
      setCurrentTodo('')
    }
  }

  const handleToggleDone = async (todo: Todo) => {
    if (todo.id && state?.user?.id) {
      await toggleTodoDone(todo, state.user.id)
      trackTaskCompleted(!todo.done)
    }
  }

  const visibleTodos = useMemo(() => sections.flatMap(s => s.todos), [sections])
  const ids = useMemo(() => visibleTodos.map(t => t.id || ''), [visibleTodos])

  // null while the folder list is still loading — rendering 'Inbox' there would flash a wrong title.
  const currentFolderName = useMemo(() => {
    const { view } = state
    if (view.kind === 'smart') return SMART_LIST_TITLES[view.list]
    if (!view.folderId) return 'Inbox'
    if (foldersStatus === 'loading') return null
    return folders.find(f => f.id === view.folderId)?.name || 'Inbox'
  }, [state.view, folders, foldersStatus])
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

        {addTarget ? (
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
        ) : (
          <div className="mb-10" />
        )}

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
          {sections.map((section, index) => {
            const Icon = SECTION_ICONS[section.icon]
            return (
              <section key={section.key} className={index > 0 ? 'mt-10' : ''}>
                <SectionTitle icon={<Icon className="size-5" aria-hidden="true" />}>
                  {section.title}
                </SectionTitle>
                <div className="flex flex-col gap-2.5">{section.todos.map(renderItem)}</div>
              </section>
            )
          })}
        </SortableContext>

        {todosStatus === 'ready' && visibleTodos.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-border px-6 py-12 text-center motion-safe:animate-fade-up">
            <div className="text-lg font-semibold text-text-primary">No tasks yet</div>
            <p className="mt-1 text-text-secondary">
              {state.view.kind === 'smart'
                ? EMPTY_TEXT[state.view.list]
                : 'Type one above and press Enter.'}
            </p>
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
