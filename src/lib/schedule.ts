import { addDays, type Day, parseTime, type When } from '@shared/task-model'

export type WhenChoice = 'today' | 'evening' | 'tomorrow' | 'someday' | 'clear' | { day: Day }

const onDay = (current: When, day: Day, evening: boolean): When => ({
  kind: 'day',
  day,
  evening,
  reminder: current.kind === 'day' ? current.reminder : null,
})

/** The When after the user picks `choice` in the task panel; a dated task keeps its reminder. */
export const planWhen = (current: When, choice: WhenChoice, today: Day): When => {
  if (choice === 'someday') return { kind: 'someday' }
  if (choice === 'clear') return { kind: 'anytime' }
  if (choice === 'today') return onDay(current, today, false)
  if (choice === 'evening') return onDay(current, today, true)
  if (choice === 'tomorrow') return onDay(current, addDays(today, 1), false)
  return onDay(current, choice.day, current.kind === 'day' && current.evening)
}

/** Sets the reminder from an `<input type="time">` value ('' clears). Only a dated task has one. */
export const setReminder = (current: When, value: string): When =>
  current.kind === 'day' ? { ...current, reminder: parseTime(value) } : current
