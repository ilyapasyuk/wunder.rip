import { z } from 'zod'
import { parseDay } from '../../shared/task-model.js'
import * as data from '../lib/db.js'
import { getUidByIdToken } from '../lib/firebase.js'
import { readBody } from '../lib/http.js'
import { taskFieldsInput } from '../lib/task-input.js'
import { resolveToday } from '../lib/today.js'
import { parseSession, resolveSessionUid, signSession } from '../lib/token.js'

// Device API (shared/DEVICE_API.md): iOS widgets, Siri, the Share Extension and the watch.
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000

const createBody = z.object({
  task: z.string().trim().min(1).max(100),
  folderId: z.string().nullable().optional(),
  ...taskFieldsInput,
})
const planBody = z.object({
  when: taskFieldsInput.when,
  evening: taskFieldsInput.evening,
  reminder: taskFieldsInput.reminder,
  deadline: taskFieldsInput.deadline,
})
const completeBody = z.object({ today: z.string() })

const error = (status: number, message: string) => Response.json({ error: message }, { status })

const bearerUid = async (req: Request): Promise<string | undefined> => {
  const header = req.headers.get('Authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) return undefined
  try {
    return await resolveSessionUid(parseSession(token))
  } catch {
    return undefined
  }
}

const createSession = async (req: Request): Promise<Response> => {
  const { idToken } = (await readBody(req)) as { idToken?: string }
  const uid = idToken ? await getUidByIdToken(idToken) : undefined
  if (!uid) return error(401, 'invalid_id_token')
  const expiresAt = Date.now() + SESSION_TTL_MS
  return Response.json({ token: signSession({ uid }, SESSION_TTL_MS), expiresAt })
}

export default async function handler(req: Request): Promise<Response> {
  const path = new URL(req.url).pathname.replace(/^\/api\/device\/?/, '').replace(/\/$/, '')
  const method = req.method

  if (method === 'POST' && path === 'session') return createSession(req)

  const uid = await bearerUid(req)
  if (!uid) return error(401, 'unauthorized')

  try {
    if (method === 'GET' && path === 'snapshot') {
      return Response.json(await data.readSnapshot(uid))
    }

    const match = /^tasks\/([^/.#$[\]]+)(?:\/(complete|reopen))?$/.exec(path)
    if (!match) return error(404, 'not_found')
    const [, taskId, action] = match

    if (method === 'PUT' && !action) {
      const body = createBody.safeParse(await readBody(req))
      if (!body.success) return error(400, body.error.issues[0]?.message ?? 'invalid_body')
      const { task, folderId, ...fields } = body.data
      await data.createTask(uid, task, folderId, fields, taskId)
      return Response.json({ id: taskId })
    }
    if (method === 'POST' && action === 'complete') {
      const body = completeBody.safeParse(await readBody(req))
      const today = body.success ? parseDay(body.data.today) : null
      if (!today) return error(400, 'today must be YYYY-MM-DD')
      const { next } = await data.setTaskDone(uid, taskId, true, today)
      return Response.json({ nextId: next?.id ?? null })
    }
    if (method === 'POST' && action === 'reopen') {
      // Reopening doesn't depend on the day; any day satisfies the signature.
      await data.setTaskDone(uid, taskId, false, resolveToday())
      return Response.json({})
    }
    if (method === 'PATCH' && !action) {
      const body = planBody.safeParse(await readBody(req))
      if (!body.success) return error(400, body.error.issues[0]?.message ?? 'invalid_body')
      await data.updateTask(uid, taskId, body.data)
      return Response.json({})
    }
    return error(404, 'not_found')
  } catch (cause) {
    const message = String(cause)
    if (message.includes('not found')) return error(404, 'task_not_found')
    if (message.includes('needs a day')) return error(400, message)
    console.error('Device API error:', cause)
    return error(500, 'server_error')
  }
}
