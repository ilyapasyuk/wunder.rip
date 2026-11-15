import { describe, expect, test } from 'bun:test'
import vectors from '../model-vectors.json'
import {
  addDays,
  addTag,
  classify,
  completeTask,
  parseDay,
  parseTaskFields,
  serializeTaskFields,
  smartList,
  type TaskFields,
  todayLocal,
  uncompleteTask,
} from '../task-model.ts'

type Raw = Record<string, unknown>

const must = <T>(value: T | null | undefined): T => {
  if (value === null || value === undefined) throw new Error('expected a value')
  return value
}
const day = (value: string) => must(parseDay(value))

const task = (raw: Raw) => ({ id: 't1', done: raw.done === true, ...parseTaskFields(raw) })

describe('model-vectors.json: parse', () => {
  for (const v of vectors.parse) {
    test(v.name, () => {
      expect(serializeTaskFields(parseTaskFields(v.raw as Raw))).toEqual(v.normalized)
    })
  }
})

describe('model-vectors.json: classify', () => {
  for (const v of vectors.classify) {
    test(`${JSON.stringify(v.raw)} on ${v.today}`, () => {
      expect(classify(task(v.raw as Raw), day(v.today))).toEqual({
        list: v.list,
        evening: v.evening,
      })
    })
  }
})

describe('model-vectors.json: nextRepeat', () => {
  for (const v of vectors.nextRepeat) {
    test(v.name, () => {
      const { next } = completeTask(task(v.raw as Raw), day(v.today), 1, 'n1')
      const { when, deadline } = serializeTaskFields(must(next))
      expect({ when, deadline }).toEqual(v.next)
    })
  }
})

describe('serialize round-trips', () => {
  test('a parsed task serializes and parses back to the same value', () => {
    const raw = {
      when: '2026-11-16',
      evening: true,
      reminder: '18:30',
      deadline: '2026-11-20',
      repeat: { unit: 'month', every: 2, from: 'completion' },
      checklist: [{ id: 'a', title: 'one', done: true }],
      tags: ['Home'],
      completedAt: 5,
    }
    const fields = parseTaskFields(raw)
    expect(parseTaskFields(serializeTaskFields(fields))).toEqual(fields)
    expect(serializeTaskFields(fields)).toEqual(raw)
  })

  test('a checklist stored by the database as an object is read in key order', () => {
    const fields = parseTaskFields({
      checklist: { 0: { id: 'a', title: 'x', done: false }, 1: { id: 'b', title: 'y' } },
    })
    expect(fields.checklist).toEqual([
      { id: 'a', title: 'x', done: false },
      { id: 'b', title: 'y', done: false },
    ])
  })

  test('tags drop blanks and case-insensitive duplicates, keeping the first spelling', () => {
    expect(parseTaskFields({ tags: ['Home', 'home', ' ', 'Work'] }).tags).toEqual(['Home', 'Work'])
  })
})

describe('completeTask', () => {
  const today = day('2026-11-15')

  test('a task without repeat becomes done with completedAt and spawns nothing', () => {
    const result = completeTask(
      { ...task({ when: '2026-11-15' }), task: 'buy milk' },
      today,
      42,
      'n',
    )
    expect(result.next).toBeUndefined()
    expect(result.completed).toMatchObject({
      id: 't1',
      task: 'buy milk',
      done: true,
      completedAt: 42,
    })
  })

  test('a repeating task loses its repeat; the next one keeps it, is open and unchecked', () => {
    const raw = {
      when: '2026-11-15',
      evening: true,
      reminder: '08:00',
      repeat: { unit: 'day', every: 1, from: 'schedule' },
      checklist: [{ id: 'c', title: 'step', done: true }],
      tags: ['Home'],
    }
    const { completed, next } = completeTask({ ...task(raw), task: 'water' }, today, 42, 'n')
    expect(completed.repeat).toBeNull()
    expect(completed.done).toBe(true)
    expect(completed.checklist).toEqual([{ id: 'c', title: 'step', done: true }])
    expect(next).toMatchObject({
      id: 'n',
      task: 'water',
      done: false,
      completedAt: null,
      repeat: { unit: 'day', every: 1, from: 'schedule' },
      checklist: [{ id: 'c', title: 'step', done: false }],
      tags: ['Home'],
    })
    expect(serializeTaskFields(must(next))).toMatchObject({
      when: '2026-11-16',
      evening: true,
      reminder: '08:00',
    })
  })

  test('a task with no day starts its series from today, and its deadline moves along', () => {
    const raw = { deadline: '2026-11-20', repeat: { unit: 'week', every: 1, from: 'schedule' } }
    const { next } = completeTask(task(raw), today, 42, 'n')
    expect(serializeTaskFields(must(next))).toMatchObject({
      when: '2026-11-22',
      deadline: '2026-11-27',
    })
  })

  test('completing an already done task changes nothing and spawns nothing', () => {
    const done = { ...task({ done: true, completedAt: 7, repeat: { unit: 'day' } }) }
    const result = completeTask(done, today, 42, 'n')
    expect(result).toEqual({ completed: done })
  })

  test('uncompleting clears completedAt', () => {
    const done = task({ done: true, completedAt: 7 })
    expect(uncompleteTask(done)).toMatchObject({ done: false, completedAt: null })
  })
})

describe('smartList', () => {
  const today = day('2026-11-15')
  const tasks = [
    { id: 'later', done: false, ...parseTaskFields({ when: '2026-11-20' }) },
    { id: 'soon', done: false, ...parseTaskFields({ when: '2026-11-16' }) },
    { id: 'now', done: false, ...parseTaskFields({ when: '2026-11-15' }) },
    { id: 'old-done', done: true, ...parseTaskFields({}) },
    { id: 'done-1', done: true, ...parseTaskFields({ completedAt: 1 }) },
    { id: 'done-2', done: true, ...parseTaskFields({ completedAt: 2 }) },
    { id: 'free', done: false, ...parseTaskFields({}) },
  ]
  const ids = (list: Parameters<typeof smartList>[1]) =>
    smartList(tasks, list, today).map(t => t.id)

  test('upcoming is sorted by day', () => expect(ids('upcoming')).toEqual(['soon', 'later']))
  test('today keeps the incoming order', () => expect(ids('today')).toEqual(['now']))
  test('anytime', () => expect(ids('anytime')).toEqual(['free']))
  test('logbook is newest completedAt first, unknown completion last', () =>
    expect(ids('logbook')).toEqual(['done-2', 'done-1', 'old-done']))
})

describe('days', () => {
  test('addDays crosses months and years', () => {
    expect(addDays(day('2026-12-31'), 1)).toBe(day('2027-01-01'))
    expect(addDays(day('2026-03-01'), -1)).toBe(day('2026-02-28'))
  })

  test('todayLocal is the local calendar date', () => {
    const now = new Date(2026, 0, 5, 23, 59)
    expect(todayLocal(now)).toBe(day('2026-01-05'))
  })

  test('parseDay rejects impossible days', () => {
    expect(parseDay('2026-02-29')).toBeNull()
    expect(parseDay('2028-02-29')).toBe('2028-02-29' as never)
  })
})

describe('addTag', () => {
  test('adds a trimmed tag unless it is already there in any case', () => {
    const fields: Pick<TaskFields, 'tags'> = { tags: ['Home'] }
    expect(addTag(fields.tags, ' Work ')).toEqual(['Home', 'Work'])
    expect(addTag(fields.tags, 'HOME')).toEqual(['Home'])
    expect(addTag(fields.tags, '  ')).toEqual(['Home'])
  })
})
