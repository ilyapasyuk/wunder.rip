import { describe, expect, test } from 'bun:test'
import { parseDay } from '../../shared/task-model.ts'
import { parseTodo } from '../services/task-record.ts'
import { dayLabel, decodeView, encodeView, isOverdue, viewSections, whenLabel } from './views.ts'

const day = (value: string) => {
  const parsed = parseDay(value)
  if (!parsed) throw new Error(value)
  return parsed
}
const TODAY = day('2026-11-15') // a Sunday

const todos = [
  parseTodo('inbox-open', { task: 'a' }),
  parseTodo('inbox-done', { task: 'b', done: true, completedAt: 10 }),
  parseTodo('folder-open', { task: 'c', folderId: 'f1' }),
  parseTodo('today', { task: 'd', when: '2026-11-15', folderId: 'f1' }),
  parseTodo('evening', { task: 'e', when: '2026-11-14', evening: true }),
  parseTodo('mon', { task: 'f', when: '2026-11-16' }),
  parseTodo('mon2', { task: 'g', when: '2026-11-16' }),
  parseTodo('dec', { task: 'h', when: '2026-12-01' }),
  parseTodo('someday', { task: 'i', when: 'someday' }),
  parseTodo('done-later', { task: 'j', done: true, completedAt: 20, when: '2026-11-15' }),
]

const shape = (sections: ReturnType<typeof viewSections>) =>
  sections.map(s => [s.title, s.todos.map(t => t.id)])

describe('viewSections', () => {
  test('Inbox shows every task without a list, open first, as before', () => {
    expect(shape(viewSections({ kind: 'list', folderId: null }, todos, TODAY))).toEqual([
      ['To do', ['inbox-open', 'evening', 'mon', 'mon2', 'dec', 'someday']],
      ['Completed', ['inbox-done', 'done-later']],
    ])
  })

  test('a folder shows every task in it', () => {
    expect(shape(viewSections({ kind: 'list', folderId: 'f1' }, todos, TODAY))).toEqual([
      ['To do', ['folder-open', 'today']],
    ])
  })

  test('Today has a This Evening section', () => {
    expect(shape(viewSections({ kind: 'smart', list: 'today' }, todos, TODAY))).toEqual([
      ['Today', ['today']],
      ['This Evening', ['evening']],
    ])
  })

  test('Upcoming is grouped by day', () => {
    expect(shape(viewSections({ kind: 'smart', list: 'upcoming' }, todos, TODAY))).toEqual([
      ['Tomorrow', ['mon', 'mon2']],
      ['Dec 1', ['dec']],
    ])
  })

  test('Logbook is newest first', () => {
    expect(shape(viewSections({ kind: 'smart', list: 'logbook' }, todos, TODAY))).toEqual([
      ['Completed', ['done-later', 'inbox-done']],
    ])
  })

  test('empty sections are left out', () => {
    expect(viewSections({ kind: 'smart', list: 'someday' }, [], TODAY)).toEqual([])
  })
})

describe('dayLabel', () => {
  test('relative names near today, weekday within a week, date after that', () => {
    expect(dayLabel(day('2026-11-15'), TODAY)).toBe('Today')
    expect(dayLabel(day('2026-11-16'), TODAY)).toBe('Tomorrow')
    expect(dayLabel(day('2026-11-14'), TODAY)).toBe('Yesterday')
    expect(dayLabel(day('2026-11-18'), TODAY)).toBe('Wednesday')
    expect(dayLabel(day('2026-11-22'), TODAY)).toBe('Nov 22')
    expect(dayLabel(day('2027-01-02'), TODAY)).toBe('Jan 2, 2027')
  })
})

describe('view encoding', () => {
  test('round-trips folders, Inbox and smart lists; legacy folder ids still read', () => {
    for (const view of [
      { kind: 'list', folderId: null },
      { kind: 'list', folderId: '-Nabc' },
      { kind: 'smart', list: 'upcoming' },
    ] as const) {
      expect(decodeView(encodeView(view))).toEqual(view)
    }
    expect(decodeView('-Nlegacy')).toEqual({ kind: 'list', folderId: '-Nlegacy' })
    expect(decodeView('smart:bogus')).toEqual({ kind: 'list', folderId: null })
  })
})

describe('isOverdue', () => {
  test('an open task whose deadline has passed', () => {
    expect(isOverdue(parseTodo('a', { deadline: '2026-11-14' }), TODAY)).toBe(true)
    expect(isOverdue(parseTodo('a', { deadline: '2026-11-15' }), TODAY)).toBe(false)
    expect(isOverdue(parseTodo('a', { deadline: '2026-11-14', done: true }), TODAY)).toBe(false)
    expect(isOverdue(parseTodo('a', {}), TODAY)).toBe(false)
  })
})

describe('whenLabel', () => {
  test('names the planned day, the evening of today, Someday, or nothing', () => {
    const label = (raw: Record<string, unknown>) => whenLabel(parseTodo('a', raw).when, TODAY)
    expect(label({ when: '2026-11-15', evening: true })).toBe('This Evening')
    expect(label({ when: '2026-11-16', evening: true })).toBe('Tomorrow evening')
    expect(label({ when: '2026-11-16' })).toBe('Tomorrow')
    expect(label({ when: 'someday' })).toBe('Someday')
    expect(label({})).toBeNull()
  })
})
