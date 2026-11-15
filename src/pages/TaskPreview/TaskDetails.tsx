import {
  ArrowPathIcon,
  BellIcon,
  ClockIcon,
  FlagIcon,
  ForwardIcon,
  PauseCircleIcon,
  PlusIcon,
  SunIcon,
  XMarkIcon,
} from '@heroicons/react/20/solid'
import {
  addDays,
  addTag,
  type Day,
  parseDay,
  parseRepeat,
  REPEAT_UNITS,
  type Repeat,
  type RepeatUnit,
  type When,
} from '@shared/task-model'
import { Checkbox } from 'components/ui/Checkbox'
import { useToday } from 'hooks/useToday'
import { planWhen, setReminder, type WhenChoice } from 'lib/schedule'
import { dayLabel, isOverdue, whenLabel } from 'lib/views'
import { ComponentType, FormEvent, ReactNode, useState } from 'react'
import { Todo } from 'services/task'

interface DetailsProps {
  todo: Todo
  onChange: (todo: Todo) => void
}

const PILL =
  'inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40'
const PILL_IDLE = 'bg-muted text-text-primary hover:bg-muted-strong'
const PILL_ACTIVE = 'bg-accent text-white'
const FIELD =
  'h-10 rounded-full border-0 bg-muted px-4 text-sm font-semibold text-text-primary focus:ring-2 focus:ring-accent/40'
const ICON = 'size-4 shrink-0'

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="mb-6">
    <div className="mb-2.5 pl-1 text-sm font-semibold text-text-secondary">{label}</div>
    {children}
  </div>
)

const Pill = ({
  active,
  onClick,
  Icon,
  children,
}: {
  active?: boolean
  onClick: () => void
  Icon?: ComponentType<{ className?: string }>
  children: ReactNode
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`${PILL} ${active ? PILL_ACTIVE : PILL_IDLE}`}
  >
    {Icon && <Icon className={ICON} aria-hidden="true" />}
    {children}
  </button>
)

const isOn = (when: When, day: Day, evening: boolean) =>
  when.kind === 'day' && when.day === day && when.evening === evening

const WhenField = ({ todo, onChange, today }: DetailsProps & { today: Day }) => {
  const { when } = todo
  const plan = (choice: WhenChoice) => onChange({ ...todo, when: planWhen(when, choice, today) })
  const label = whenLabel(when, today)
  return (
    <Field label={label ? `When · ${label}` : 'When'}>
      <div className="flex flex-wrap items-center gap-2">
        <Pill Icon={SunIcon} active={isOn(when, today, false)} onClick={() => plan('today')}>
          Today
        </Pill>
        <Pill Icon={ClockIcon} active={isOn(when, today, true)} onClick={() => plan('evening')}>
          This Evening
        </Pill>
        <Pill
          Icon={ForwardIcon}
          active={isOn(when, addDays(today, 1), false)}
          onClick={() => plan('tomorrow')}
        >
          Tomorrow
        </Pill>
        <input
          type="date"
          aria-label="Pick a day"
          className={FIELD}
          value={when.kind === 'day' ? when.day : ''}
          onChange={({ target }) => {
            const day = parseDay(target.value)
            plan(day ? { day } : 'clear')
          }}
        />
        <Pill
          Icon={PauseCircleIcon}
          active={when.kind === 'someday'}
          onClick={() => plan('someday')}
        >
          Someday
        </Pill>
        {when.kind !== 'anytime' && (
          <Pill Icon={XMarkIcon} onClick={() => plan('clear')}>
            Clear
          </Pill>
        )}
      </div>
      {when.kind === 'day' && (
        <label className="mt-3 flex items-center gap-2 pl-1 text-sm font-medium text-text-secondary">
          <BellIcon className={`${ICON} text-text-tertiary`} aria-hidden="true" />
          Reminder
          <input
            type="time"
            className={FIELD}
            value={when.reminder ?? ''}
            onChange={({ target }) => onChange({ ...todo, when: setReminder(when, target.value) })}
          />
          <span className="text-xs">Shown in the iOS app</span>
        </label>
      )}
    </Field>
  )
}

const DeadlineField = ({ todo, onChange, today }: DetailsProps & { today: Day }) => {
  const overdue = isOverdue(todo, today)
  return (
    <Field label={todo.deadline ? `Deadline · ${dayLabel(todo.deadline, today)}` : 'Deadline'}>
      <div className="flex flex-wrap items-center gap-2">
        <FlagIcon
          className={`${ICON} ${overdue ? 'text-danger' : 'text-text-tertiary'}`}
          aria-hidden="true"
        />
        <input
          type="date"
          aria-label="Deadline"
          className={`${FIELD} ${overdue ? 'text-danger' : ''}`}
          value={todo.deadline ?? ''}
          onChange={({ target }) => onChange({ ...todo, deadline: parseDay(target.value) })}
        />
        {todo.deadline && (
          <Pill Icon={XMarkIcon} onClick={() => onChange({ ...todo, deadline: null })}>
            Clear
          </Pill>
        )}
        {overdue && <span className="text-sm font-semibold text-danger">Overdue</span>}
      </div>
    </Field>
  )
}

const UNIT_LABELS: Record<RepeatUnit, string> = {
  day: 'days',
  week: 'weeks',
  month: 'months',
  year: 'years',
}

const RepeatField = ({ todo, onChange }: DetailsProps) => {
  const { repeat } = todo
  const set = (changes: Partial<Repeat> | null) =>
    onChange({ ...todo, repeat: changes && parseRepeat({ ...repeat, ...changes }) })
  return (
    <Field label="Repeat">
      <div className="flex flex-wrap items-center gap-2">
        <ArrowPathIcon className={`${ICON} text-text-tertiary`} aria-hidden="true" />
        {repeat && (
          <>
            <span className="text-sm font-medium text-text-secondary">Every</span>
            <input
              type="number"
              min={1}
              aria-label="Repeat every"
              className={`${FIELD} w-20`}
              value={repeat.every}
              onChange={({ target }) => set({ every: Number(target.value) })}
            />
          </>
        )}
        <select
          aria-label="Repeat unit"
          className={`${FIELD} pr-9`}
          value={repeat?.unit ?? ''}
          onChange={({ target }) => {
            const unit = REPEAT_UNITS.find(u => u === target.value)
            set(unit ? { unit, every: repeat?.every ?? 1, from: repeat?.from ?? 'schedule' } : null)
          }}
        >
          <option value="">Never</option>
          {REPEAT_UNITS.map(unit => (
            <option key={unit} value={unit}>
              {UNIT_LABELS[unit]}
            </option>
          ))}
        </select>
        {repeat && (
          <select
            aria-label="Count the next one from"
            className={`${FIELD} pr-9`}
            value={repeat.from}
            onChange={({ target }) =>
              set({ from: target.value === 'completion' ? 'completion' : 'schedule' })
            }
          >
            <option value="schedule">after the planned day</option>
            <option value="completion">after completion</option>
          </select>
        )}
      </div>
    </Field>
  )
}

const newItemId = () => crypto.randomUUID()

const ChecklistField = ({ todo, onChange }: DetailsProps) => {
  const [draft, setDraft] = useState('')
  const setChecklist = (checklist: Todo['checklist']) => onChange({ ...todo, checklist })
  const add = (e: FormEvent) => {
    e.preventDefault()
    const title = draft.trim()
    if (!title) return
    setChecklist([...todo.checklist, { id: newItemId(), title, done: false }])
    setDraft('')
  }
  const done = todo.checklist.filter(item => item.done).length
  return (
    <Field
      label={todo.checklist.length ? `Checklist · ${done}/${todo.checklist.length}` : 'Checklist'}
    >
      <div className="flex flex-col gap-1.5">
        {todo.checklist.map(item => (
          <div
            key={item.id}
            className="group flex items-center gap-3 rounded-xl bg-muted pl-4 pr-1.5 min-h-11"
          >
            <Checkbox
              checked={item.done}
              onChange={value =>
                setChecklist(
                  todo.checklist.map(i => (i.id === item.id ? { ...i, done: value } : i)),
                )
              }
            />
            <input
              type="text"
              aria-label="Checklist item"
              value={item.title}
              onChange={({ target }) =>
                setChecklist(
                  todo.checklist.map(i => (i.id === item.id ? { ...i, title: target.value } : i)),
                )
              }
              className={`flex-1 min-w-0 bg-transparent border-0 p-0 text-[15px] font-medium focus:ring-0 ${
                item.done ? 'text-text-secondary line-through' : 'text-text-primary'
              }`}
            />
            <button
              type="button"
              aria-label="Delete checklist item"
              onClick={() => setChecklist(todo.checklist.filter(i => i.id !== item.id))}
              className="size-8 inline-flex items-center justify-center rounded-full text-text-secondary opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-surface hover:text-text-primary transition-opacity"
            >
              <XMarkIcon className={ICON} />
            </button>
          </div>
        ))}
        <form
          onSubmit={add}
          className="flex items-center gap-3 rounded-xl bg-muted pl-4 pr-1.5 min-h-11 focus-within:bg-surface focus-within:shadow-tile transition-[background-color,box-shadow]"
        >
          <PlusIcon className={`${ICON} text-text-tertiary`} aria-hidden="true" />
          <input
            type="text"
            value={draft}
            onChange={({ target }) => setDraft(target.value)}
            placeholder="Add a step"
            aria-label="New checklist item"
            className="flex-1 min-w-0 bg-transparent border-0 p-0 text-[15px] font-medium text-text-primary placeholder:text-text-secondary focus:ring-0"
          />
        </form>
      </div>
    </Field>
  )
}

const TagsField = ({ todo, onChange }: DetailsProps) => {
  const [draft, setDraft] = useState('')
  const add = (e: FormEvent) => {
    e.preventDefault()
    onChange({ ...todo, tags: addTag(todo.tags, draft) })
    setDraft('')
  }
  return (
    <Field label="Tags">
      <form onSubmit={add} className="flex flex-wrap items-center gap-2">
        {todo.tags.map(tag => (
          <span
            key={tag}
            className="inline-flex h-10 items-center gap-1 rounded-full bg-muted pl-4 pr-1.5 text-sm font-semibold text-text-primary"
          >
            #{tag}
            <button
              type="button"
              aria-label={`Remove tag ${tag}`}
              onClick={() => onChange({ ...todo, tags: todo.tags.filter(t => t !== tag) })}
              className="size-7 inline-flex items-center justify-center rounded-full text-text-secondary hover:bg-surface hover:text-text-primary"
            >
              <XMarkIcon className={ICON} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={draft}
          onChange={({ target }) => setDraft(target.value)}
          placeholder="Add tag"
          aria-label="New tag"
          maxLength={40}
          className={`${FIELD} w-32 placeholder:text-text-secondary`}
        />
      </form>
    </Field>
  )
}

/** The v2 fields of a task: when + reminder, deadline, repeat, checklist and tags. */
const TaskDetails = ({ todo, onChange }: DetailsProps) => {
  const today = useToday()
  return (
    <div className="mb-2">
      <WhenField todo={todo} onChange={onChange} today={today} />
      <DeadlineField todo={todo} onChange={onChange} today={today} />
      <RepeatField todo={todo} onChange={onChange} />
      <ChecklistField todo={todo} onChange={onChange} />
      <TagsField todo={todo} onChange={onChange} />
    </div>
  )
}

export { TaskDetails }
