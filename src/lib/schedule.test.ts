import { describe, expect, test } from 'bun:test'
import { parseDay, parseTime, type When } from '../../shared/task-model.ts'
import { planWhen, setReminder } from './schedule.ts'

const day = (value: string) => {
  const parsed = parseDay(value)
  if (!parsed) throw new Error(value)
  return parsed
}
const TODAY = day('2026-11-15')
const NINE = parseTime('09:00')
const dated: When = { kind: 'day', day: day('2026-11-20'), evening: false, reminder: NINE }

describe('planWhen', () => {
  test('Today, This Evening and Tomorrow keep an existing reminder', () => {
    expect(planWhen(dated, 'today', TODAY)).toEqual({ ...dated, day: TODAY })
    expect(planWhen(dated, 'evening', TODAY)).toEqual({ ...dated, day: TODAY, evening: true })
    expect(planWhen(dated, 'tomorrow', TODAY)).toEqual({ ...dated, day: day('2026-11-16') })
  })

  test('picking a date from Anytime starts with no reminder and not evening', () => {
    expect(planWhen({ kind: 'anytime' }, { day: day('2026-12-01') }, TODAY)).toEqual({
      kind: 'day',
      day: day('2026-12-01'),
      evening: false,
      reminder: null,
    })
  })

  test('picking a date keeps the evening flag of an already dated task', () => {
    const evening: When = { ...dated, evening: true }
    expect(planWhen(evening, { day: TODAY }, TODAY)).toMatchObject({ day: TODAY, evening: true })
  })

  test('Someday and Clear drop the day and its reminder', () => {
    expect(planWhen(dated, 'someday', TODAY)).toEqual({ kind: 'someday' })
    expect(planWhen(dated, 'clear', TODAY)).toEqual({ kind: 'anytime' })
  })
})

describe('setReminder', () => {
  test('sets or clears the reminder of a dated task', () => {
    expect(setReminder(dated, '18:30')).toMatchObject({ reminder: '18:30' })
    expect(setReminder(dated, '')).toMatchObject({ reminder: null })
  })

  test('a task without a day cannot get a reminder', () => {
    expect(setReminder({ kind: 'someday' }, '18:30')).toEqual({ kind: 'someday' })
  })
})
