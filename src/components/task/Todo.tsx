import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  ArchiveBoxIcon,
  ArrowPathIcon,
  Bars3BottomLeftIcon,
  CalendarIcon,
  CheckCircleIcon,
  FlagIcon,
  MoonIcon,
  PhotoIcon,
  XMarkIcon,
} from '@heroicons/react/20/solid'
import { todayLocal } from '@shared/task-model'
import { Checkbox } from 'components/ui/Checkbox'
import { dayLabel, isOverdue, whenLabel } from 'lib/views'
import { CSSProperties, ReactNode } from 'react'
import { Todo } from 'services/task'

const DAY_MS = 24 * 60 * 60 * 1000

const formatDay = (timestamp: number): string => {
  const startOfToday = new Date().setHours(0, 0, 0, 0)
  if (timestamp >= startOfToday) return 'Today'
  if (timestamp >= startOfToday - DAY_MS) return 'Yesterday'
  const date = new Date(timestamp)
  const sameYear = date.getFullYear() === new Date().getFullYear()
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  })
}

const Chip = ({ children, danger }: { children: ReactNode; danger?: boolean }) => (
  <span
    className={`inline-flex h-8 items-center gap-1.5 rounded-full bg-surface px-3 text-sm font-medium tabular-nums transition-colors group-data-[selected=true]:bg-muted ${
      danger ? 'text-danger' : 'text-text-primary'
    }`}
  >
    {children}
  </span>
)

const ICON = 'size-4 shrink-0 text-text-tertiary'

/** Schedule badges: when, deadline (red once overdue), repeat, checklist progress, tags. */
const ScheduleChips = ({ todo }: { todo: Todo }) => {
  const today = todayLocal()
  const when = whenLabel(todo.when, today)
  const WhenIcon =
    todo.when.kind === 'someday'
      ? ArchiveBoxIcon
      : todo.when.kind === 'day' && todo.when.evening
        ? MoonIcon
        : CalendarIcon
  const checked = todo.checklist.filter(item => item.done).length
  const overdue = isOverdue(todo, today)
  return (
    <>
      {todo.tags.map(tag => (
        <span key={tag} className="hidden sm:inline-flex">
          <Chip>#{tag}</Chip>
        </span>
      ))}
      {todo.checklist.length > 0 && (
        <Chip>
          <CheckCircleIcon className={ICON} aria-hidden="true" />
          {checked}/{todo.checklist.length}
          <span className="sr-only">checklist items done</span>
        </Chip>
      )}
      {todo.repeat && (
        <Chip>
          <ArrowPathIcon className={ICON} aria-hidden="true" />
          <span className="sr-only">Repeats</span>
        </Chip>
      )}
      {when && !todo.done && (
        <Chip>
          <WhenIcon className={ICON} aria-hidden="true" />
          {when}
        </Chip>
      )}
      {todo.deadline && !todo.done && (
        <Chip danger={overdue}>
          <FlagIcon
            className={`size-4 shrink-0 ${overdue ? 'text-danger' : 'text-text-tertiary'}`}
            aria-hidden="true"
          />
          <span className="sr-only">{overdue ? 'Overdue, deadline' : 'Deadline'}</span>
          {dayLabel(todo.deadline, today)}
        </Chip>
      )}
    </>
  )
}

interface TodoCardProps {
  todo: Todo
  check: ReactNode
  onSelect?: () => void
  onDelete?: () => void
  lifted?: boolean
  /** The task currently open in the side panel. */
  selected?: boolean
}

/** Presentational card shared by the sortable list item and the drag overlay. */
const TodoCard = ({ todo, check, onSelect, onDelete, lifted, selected }: TodoCardProps) => {
  const fileCount = todo.files?.length ?? 0
  const hasNote = Boolean(todo.note?.length)

  return (
    <div
      data-selected={selected}
      className={`group relative flex items-center gap-4 rounded-2xl pl-5 pr-3 min-h-[4.25rem] py-3 transition-[background-color,box-shadow,transform] duration-150 active:scale-[0.99] has-[.task-title:focus-visible]:ring-2 has-[.task-title:focus-visible]:ring-accent/50 ${
        selected ? 'bg-surface shadow-tile ring-1 ring-border' : 'bg-muted hover:bg-muted-strong/70'
      } ${lifted ? 'shadow-lift' : selected ? '' : 'shadow-card'} ${
        lifted ? '' : 'motion-safe:animate-fade-up'
      }`}
    >
      {check}
      <button
        type="button"
        onClick={onSelect}
        className="task-title flex-1 min-w-0 self-stretch flex items-center text-left cursor-pointer outline-none"
        aria-current={selected || undefined}
      >
        <span
          className={`text-[17px] sm:text-lg font-medium leading-snug break-words ${
            todo.done ? 'text-text-secondary line-through decoration-1' : 'text-text-primary'
          }`}
        >
          {todo.task}
        </span>
      </button>
      <div className="flex shrink-0 items-center gap-1.5">
        {hasNote && (
          <Chip>
            <Bars3BottomLeftIcon
              className="size-4 shrink-0 text-text-tertiary"
              aria-hidden="true"
            />
            <span className="sr-only">Has note</span>
          </Chip>
        )}
        {fileCount > 0 && (
          <Chip>
            <PhotoIcon className="size-4 shrink-0 text-text-tertiary" aria-hidden="true" />
            {fileCount}
          </Chip>
        )}
        <ScheduleChips todo={todo} />
        {/* A planned task shows its When instead; tasks without one look as they always did. */}
        {!todo.done && todo.createdAt && todo.when.kind === 'anytime' ? (
          <span className="hidden sm:inline-flex">
            <Chip>
              <CalendarIcon className="size-4 shrink-0 text-text-tertiary" aria-hidden="true" />
              {formatDay(todo.createdAt)}
            </Chip>
          </span>
        ) : null}
        {onDelete && (
          <button
            onClick={onDelete}
            className="size-8 inline-flex items-center justify-center rounded-full text-text-secondary opacity-0 transition-all hover:bg-surface group-data-[selected=true]:hover:bg-muted hover:text-text-primary focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 group-hover:opacity-100"
            aria-label="Delete task"
            type="button"
          >
            <XMarkIcon className="size-5 shrink-0" />
          </button>
        )}
      </div>
    </div>
  )
}

interface TodoItemProps {
  todo: Todo
  selected: boolean
  toggleDone: (todo: Todo) => void
  deleteTodo: (todo: Todo) => void
  onSelect: (todo: Todo) => void
}

const TodoItem = ({ todo, selected, toggleDone, deleteTodo, onSelect }: TodoItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: todo.id || '',
  })

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Hide original while dragging; DragOverlay will render the preview
    opacity: isDragging ? 0 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  }

  return (
    // dnd-kit makes this wrapper focusable for keyboard dragging; show our ring, not the browser's.
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      {...attributes}
      {...listeners}
    >
      <TodoCard
        todo={todo}
        selected={selected}
        onSelect={() => onSelect(todo)}
        onDelete={() => deleteTodo(todo)}
        check={<Checkbox checked={todo.done} onChange={() => toggleDone(todo)} />}
      />
    </div>
  )
}

export { TodoCard, TodoItem }
