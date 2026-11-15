import {
  classify,
  type Day,
  daysBetween,
  SMART_LISTS,
  type SmartList,
  smartList,
  type When,
} from '@shared/task-model'
import type { Todo } from 'services/task-record'

/** What the main pane shows: a list (Inbox when `folderId` is null) or a smart list. */
export type View = { kind: 'list'; folderId: string | null } | { kind: 'smart'; list: SmartList }

export const INBOX_VIEW: View = { kind: 'list', folderId: null }

export const SMART_LIST_TITLES: Record<SmartList, string> = {
  today: 'Today',
  upcoming: 'Upcoming',
  anytime: 'Anytime',
  someday: 'Someday',
  logbook: 'Logbook',
}

export type SectionIcon = 'todo' | 'done' | 'today' | 'evening' | 'day' | 'anytime' | 'someday'

export type Section = { key: string; title: string; icon: SectionIcon; todos: Todo[] }

const SMART_PREFIX = 'smart:'

/** Storage form of a view; null for Inbox. Folder ids are stored bare, as before. */
export const encodeView = (view: View): string | null =>
  view.kind === 'smart' ? `${SMART_PREFIX}${view.list}` : view.folderId

export const decodeView = (raw: string | null): View => {
  if (!raw || raw === 'null') return INBOX_VIEW
  if (!raw.startsWith(SMART_PREFIX)) return { kind: 'list', folderId: raw }
  const list = SMART_LISTS.find(name => `${SMART_PREFIX}${name}` === raw)
  return list ? { kind: 'smart', list } : INBOX_VIEW
}

const dayFormat = (day: Day, withYear: boolean) =>
  new Date(`${day}T00:00:00Z`).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    ...(withYear ? { year: 'numeric' } : {}),
  })

/** "Today", "Tomorrow", "Yesterday", a weekday within the coming week, else "Nov 22". */
export const dayLabel = (day: Day, today: Day): string => {
  const diff = daysBetween(today, day)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  if (diff > 1 && diff < 7) {
    return new Date(`${day}T00:00:00Z`).toLocaleDateString('en-US', {
      timeZone: 'UTC',
      weekday: 'long',
    })
  }
  return dayFormat(day, day.slice(0, 4) !== today.slice(0, 4))
}

const section = (key: string, title: string, icon: SectionIcon, todos: Todo[]): Section[] =>
  todos.length ? [{ key, title, icon, todos }] : []

const groupByDay = (todos: Todo[], today: Day): Section[] => {
  const groups = new Map<Day, Todo[]>()
  for (const todo of todos) {
    if (todo.when.kind !== 'day') continue
    groups.set(todo.when.day, [...(groups.get(todo.when.day) ?? []), todo])
  }
  return [...groups].map(([day, items]) => ({
    key: day,
    title: dayLabel(day, today),
    icon: 'day' as const,
    todos: items,
  }))
}

const smartSections = (list: SmartList, todos: Todo[], today: Day): Section[] => {
  const members = smartList(todos, list, today)
  switch (list) {
    case 'today': {
      const evening = members.filter(t => classify(t, today).evening)
      return [
        ...section(
          'today',
          'Today',
          'today',
          members.filter(t => !evening.includes(t)),
        ),
        ...section('evening', 'This Evening', 'evening', evening),
      ]
    }
    case 'upcoming':
      return groupByDay(members, today)
    case 'anytime':
      return section('anytime', 'Anytime', 'anytime', members)
    case 'someday':
      return section('someday', 'Someday', 'someday', members)
    case 'logbook':
      return section('done', 'Completed', 'done', members)
  }
}

/** The sections of the main pane, in display order (drag-and-drop works on the same order). */
export const viewSections = (view: View, todos: Todo[], today: Day): Section[] => {
  if (view.kind === 'smart') return smartSections(view.list, todos, today)
  const inList = todos.filter(t => (t.folderId ?? null) === view.folderId)
  return [
    ...section(
      'todo',
      'To do',
      'todo',
      inList.filter(t => !t.done),
    ),
    ...section(
      'done',
      'Completed',
      'done',
      inList.filter(t => t.done),
    ),
  ]
}

/** An open task whose deadline is already behind us. */
export const isOverdue = (todo: Todo, today: Day): boolean =>
  !todo.done && todo.deadline !== null && todo.deadline < today

/** Badge text for a task's When; null for Anytime. */
export const whenLabel = (when: When, today: Day): string | null => {
  if (when.kind === 'anytime') return null
  if (when.kind === 'someday') return 'Someday'
  if (!when.evening) return dayLabel(when.day, today)
  return when.day === today ? 'This Evening' : `${dayLabel(when.day, today)} evening`
}
