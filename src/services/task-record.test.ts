import { describe, expect, test } from 'bun:test'
import { parseDay } from '../../shared/task-model.ts'
import { parseTodo, todoUpdates, toggleDoneUpdates } from './task-record.ts'

const TODAY = parseDay('2026-11-15') as NonNullable<ReturnType<typeof parseDay>>
const ROUTE = 'todos_dev/u1'

describe('parseTodo', () => {
  test('an old task reads exactly as before, with no schedule', () => {
    const todo = parseTodo('t1', { task: 'milk', done: true, createdAt: 5, note: 'n', order: 3 })
    expect(todo).toMatchObject({
      id: 't1',
      task: 'milk',
      done: true,
      createdAt: 5,
      note: 'n',
      order: 3,
      isPublic: false,
      folderId: null,
      when: { kind: 'anytime' },
      deadline: null,
      repeat: null,
      checklist: [],
      tags: [],
      completedAt: null,
    })
  })

  test('missing fields get the old defaults', () => {
    expect(parseTodo('t1', {})).toMatchObject({ task: '', done: false, createdAt: 0, note: '' })
  })
})

describe('todoUpdates', () => {
  test('writes each field at its own path so fields from newer clients survive', () => {
    const todo = parseTodo('t1', { task: 'a', when: '2026-11-16', tags: ['Home'] })
    const updates = todoUpdates('u1', todo)
    expect(updates[`${ROUTE}/t1/task`]).toBe('a')
    expect(updates[`${ROUTE}/t1/when`]).toBe('2026-11-16')
    expect(updates[`${ROUTE}/t1/tags`]).toEqual(['Home'])
    expect(updates[`${ROUTE}/t1/reminder`]).toBeNull()
    expect(updates).not.toHaveProperty(`${ROUTE}/t1`)
    expect(updates).not.toHaveProperty(`${ROUTE}/t1/id`)
    expect(Object.values(updates)).not.toContain(undefined)
  })
})

describe('toggleDoneUpdates', () => {
  test('completing a repeating task writes it done and creates the next one', () => {
    const todo = parseTodo('t1', {
      task: 'water plants',
      createdAt: 1,
      when: '2026-11-15',
      repeat: { unit: 'week', every: 1, from: 'schedule' },
    })
    const updates = toggleDoneUpdates('u1', todo, TODAY, 99, 'n1')
    expect(updates[`${ROUTE}/t1/done`]).toBe(true)
    expect(updates[`${ROUTE}/t1/completedAt`]).toBe(99)
    expect(updates[`${ROUTE}/t1/repeat`]).toBeNull()
    expect(updates[`${ROUTE}/n1`]).toMatchObject({
      task: 'water plants',
      done: false,
      when: '2026-11-22',
      completedAt: null,
      repeat: { unit: 'week', every: 1, from: 'schedule' },
    })
    expect(updates[`${ROUTE}/n1`]).not.toHaveProperty('id')
  })

  test('reopening a done task clears completedAt and creates nothing', () => {
    const todo = parseTodo('t1', { task: 'a', done: true, completedAt: 7 })
    const updates = toggleDoneUpdates('u1', todo, TODAY, 99, 'n1')
    expect(updates[`${ROUTE}/t1/done`]).toBe(false)
    expect(updates[`${ROUTE}/t1/completedAt`]).toBeNull()
    expect(updates).not.toHaveProperty(`${ROUTE}/n1`)
  })
})
