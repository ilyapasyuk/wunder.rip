import { z } from 'zod'
import {
  parseDay,
  parseTaskFields,
  parseTime,
  REPEAT_FROM,
  REPEAT_UNITS,
  type TaskFields,
} from '../../shared/task-model.js'

const day = z
  .string()
  .refine(value => parseDay(value) !== null, 'Expected a real calendar day, YYYY-MM-DD')
const time = z.string().refine(value => parseTime(value) !== null, 'Expected HH:mm (24-hour)')

/** Tool input for the v2 task fields, in the stored shape (DATA_MODEL.md). */
export const taskFieldsInput = {
  when: z
    .union([z.literal('someday'), day, z.null()])
    .optional()
    .describe('Planned day: YYYY-MM-DD, "someday", or null for Anytime'),
  evening: z.boolean().optional().describe('Plan for the evening of the `when` day'),
  reminder: time.nullable().optional().describe('Reminder time HH:mm on the `when` day'),
  deadline: day.nullable().optional().describe('Due day YYYY-MM-DD, or null to clear'),
  repeat: z
    .object({
      unit: z.enum(REPEAT_UNITS),
      every: z.number().int().min(1).optional(),
      from: z.enum(REPEAT_FROM).optional(),
    })
    .nullable()
    .optional()
    .describe('Create the next task on completion; null stops repeating'),
  checklist: z
    .array(z.object({ id: z.string().optional(), title: z.string(), done: z.boolean().optional() }))
    .optional()
    .describe('Replaces the whole checklist; items without an id get a new one'),
  tags: z.array(z.string()).optional().describe('Replaces all tags'),
}

export type TaskFieldsInput = {
  [K in keyof typeof taskFieldsInput]?: z.infer<(typeof taskFieldsInput)[K]>
}

const MODEL_KEYS = Object.keys(taskFieldsInput) as (keyof TaskFieldsInput)[]

export const hasTaskFields = (input: TaskFieldsInput): boolean =>
  MODEL_KEYS.some(key => input[key] !== undefined)

/**
 * Applies tool input on top of a stored task node and parses the result with the shared model.
 * Fails instead of silently dropping a reminder or evening that has no day to belong to.
 */
export const applyTaskFields = (
  current: unknown,
  input: TaskFieldsInput,
  newId: () => string,
): TaskFields => {
  const changes = Object.fromEntries(
    MODEL_KEYS.filter(key => input[key] !== undefined).map(key => [key, input[key]]),
  )
  if (input.checklist) {
    changes.checklist = input.checklist.map(item => ({ ...item, id: item.id || newId() }))
  }
  const base = typeof current === 'object' && current !== null ? current : {}
  const fields = parseTaskFields({ ...base, ...changes })
  const needsDay = (input.reminder ?? null) !== null || input.evening === true
  if (needsDay && fields.when.kind !== 'day') {
    throw new Error('A reminder or evening needs a day: set `when` to a YYYY-MM-DD date')
  }
  return fields
}
