import { afterEach, beforeAll, beforeEach, describe, expect, test } from 'bun:test'
import { generateKeyPairSync } from 'node:crypto'
import { parseDay } from '../../shared/task-model.js'
import * as data from '../lib/db.js'
import { signSession } from '../lib/token.js'
import mcp from '../routes/mcp.js'

const DATABASE = 'https://wundertodo-app.firebaseio.com/'
const UID = 'u1'
const TODAY = parseDay('2026-11-15') as NonNullable<ReturnType<typeof parseDay>>

type Tree = Record<string, unknown>

// A tiny in-memory Realtime Database behind the REST API the worker talks to.
let tree: Tree = {}

const segments = (path: string) => path.split('/').filter(Boolean)

const getAt = (path: string): unknown =>
  segments(path).reduce<unknown>(
    (node, key) => (node && typeof node === 'object' ? (node as Tree)[key] : undefined),
    tree,
  ) ?? null

const setAt = (path: string, value: unknown) => {
  const keys = segments(path)
  const last = keys.pop() as string
  let node = tree
  for (const key of keys) {
    node[key] = (node[key] as Tree | undefined) ?? {}
    node = node[key] as Tree
  }
  if (value === null) delete node[last]
  else node[last] = structuredClone(value)
}

const realFetch = globalThis.fetch

beforeAll(() => {
  process.env.MCP_TOKEN_SECRET = 'test-secret'
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
  process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({
    client_email: 'sa@test',
    private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }),
  })
})

beforeEach(() => {
  tree = {}
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    if (url.startsWith('https://oauth2.googleapis.com/token')) {
      return Response.json({ access_token: 'sa-token', expires_in: 3600 })
    }
    if (!url.startsWith(DATABASE)) throw new Error(`unexpected fetch ${url}`)
    const path = url.slice(DATABASE.length).replace(/\.json$/, '')
    const body = init?.body ? JSON.parse(String(init.body)) : undefined
    switch (init?.method ?? 'GET') {
      case 'GET':
        return Response.json(getAt(path), { headers: { ETag: 'e' } })
      case 'PUT':
        setAt(path, body)
        return Response.json(body)
      case 'POST': {
        const name = `-N${Object.keys((getAt(path) as Tree | null) ?? {}).length}`
        setAt(`${path}/${name}`, body)
        return Response.json({ name })
      }
      case 'PATCH':
        for (const [key, value] of Object.entries(body as Tree)) setAt(`${path}/${key}`, value)
        return Response.json(body)
      case 'DELETE':
        setAt(path, null)
        return Response.json(null)
    }
    throw new Error(`unexpected method ${init?.method}`)
  }) as typeof fetch
})

afterEach(() => {
  globalThis.fetch = realFetch
})

const tasks = () => (tree.todos_dev as Tree)[UID] as Record<string, Tree>

const seed = (id: string, node: Tree) =>
  setAt(`todos_dev/${UID}/${id}`, { task: id, done: false, createdAt: 1, note: '', ...node })

describe('completing a task through the MCP data layer', () => {
  test('a repeating task is completed and its next task is created', async () => {
    seed('t1', {
      task: 'water plants',
      when: '2026-11-15',
      deadline: '2026-11-16',
      checklist: [{ id: 'c', title: 'kitchen', done: true }],
      repeat: { unit: 'week', every: 1, from: 'schedule' },
      folderId: 'f1',
    })

    const { next } = await data.setTaskDone(UID, 't1', true, TODAY)

    const stored = tasks()
    expect(stored.t1).toMatchObject({ done: true, task: 'water plants' })
    expect(typeof stored.t1.completedAt).toBe('number')
    expect(stored.t1.repeat).toBeUndefined()
    const nextIds = Object.keys(stored).filter(id => id !== 't1')
    expect(nextIds).toEqual([next?.id as string])
    expect(stored[nextIds[0]]).toMatchObject({
      task: 'water plants',
      done: false,
      when: '2026-11-22',
      deadline: '2026-11-23',
      folderId: 'f1',
      checklist: [{ id: 'c', title: 'kitchen', done: false }],
      repeat: { unit: 'week', every: 1, from: 'schedule' },
    })
    expect(stored[nextIds[0]].completedAt ?? null).toBeNull()
  })

  test('completing it again does not create another task', async () => {
    seed('t1', { when: '2026-11-15', repeat: { unit: 'day', every: 1, from: 'schedule' } })
    await data.setTaskDone(UID, 't1', true, TODAY)
    await data.setTaskDone(UID, 't1', true, TODAY)
    expect(Object.keys(tasks())).toHaveLength(2)
  })

  test('reopening clears completedAt', async () => {
    seed('t1', { done: true, completedAt: 5 })
    await data.setTaskDone(UID, 't1', false, TODAY)
    expect(tasks().t1.done).toBe(false)
    expect(tasks().t1.completedAt).toBeUndefined()
  })

  test('an unknown task is an error', async () => {
    await expect(data.setTaskDone(UID, 'nope', true, TODAY)).rejects.toThrow('not found')
  })
})

describe('updating v2 fields', () => {
  test('setting only a reminder keeps the planned day', async () => {
    seed('t1', { when: '2026-11-20', evening: true })
    await data.updateTask(UID, 't1', { reminder: '18:30' })
    expect(tasks().t1).toMatchObject({ when: '2026-11-20', evening: true, reminder: '18:30' })
  })

  test('a reminder without a day is rejected', async () => {
    seed('t1', {})
    await expect(data.updateTask(UID, 't1', { reminder: '18:30' })).rejects.toThrow('day')
  })

  test('moving to someday drops the reminder', async () => {
    seed('t1', { when: '2026-11-20', reminder: '09:00' })
    await data.updateTask(UID, 't1', { when: 'someday' })
    expect(tasks().t1.when).toBe('someday')
    expect(tasks().t1.reminder).toBeUndefined()
  })

  test('checklist items without an id get one; tags are de-duplicated', async () => {
    seed('t1', {})
    await data.updateTask(UID, 't1', {
      checklist: [{ title: 'step' }],
      tags: ['Home', 'home'],
    })
    const checklist = tasks().t1.checklist as { id: string; title: string; done: boolean }[]
    expect(checklist).toHaveLength(1)
    expect(checklist[0]).toMatchObject({ title: 'step', done: false })
    expect(checklist[0].id).toBeTruthy()
    expect(tasks().t1.tags).toEqual(['Home'])
  })

  test('text-only updates leave old tasks without v2 fields', async () => {
    seed('t1', {})
    await data.updateTask(UID, 't1', { note: 'hi' })
    expect(tasks().t1).toEqual({ task: 't1', done: false, createdAt: 1, note: 'hi' })
  })

  test('create accepts v2 fields', async () => {
    const created = await data.createTask(UID, 'plan', null, { when: '2026-11-15', tags: ['x'] })
    expect(tasks()[created.id as string]).toMatchObject({
      task: 'plan',
      when: '2026-11-15',
      tags: ['x'],
    })
  })
})

describe('smart lists', () => {
  test('lists one smart list for the given day, in the shared order', async () => {
    seed('a', { when: '2026-11-20' })
    seed('b', { when: '2026-11-16' })
    seed('c', { when: '2026-11-15', evening: true })
    seed('d', { done: true, completedAt: 3 })
    const ids = async (list: Parameters<typeof data.listSmart>[1]) =>
      (await data.listSmart(UID, list, TODAY)).map(t => t.id)
    expect(await ids('upcoming')).toEqual(['b', 'a'])
    expect(await ids('today')).toEqual(['c'])
    expect(await ids('logbook')).toEqual(['d'])
    expect(await ids('anytime')).toEqual([])
  })

  test('task output carries the v2 fields in their stored shape', async () => {
    seed('a', { when: '2026-11-20', evening: true })
    const [task] = await data.listTasks(UID)
    expect(task).toMatchObject({ id: 'a', when: '2026-11-20', evening: true, tags: [] })
  })
})

describe('MCP tools', () => {
  const call = async (method: string, params: Record<string, unknown>) => {
    const response = await mcp(
      new Request('https://notes.example/api/mcp', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${signSession({ uid: UID }, 60_000)}`,
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
        },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      }),
    )
    return (await response.json()) as {
      result?: { tools?: { name: string }[]; content?: { text: string }[]; isError?: boolean }
    }
  }

  test('list_smart is offered', async () => {
    const { result } = await call('tools/list', {})
    expect(result?.tools?.map(t => t.name)).toContain('list_smart')
  })

  test('set_task_done on a repeating task returns and stores the next task', async () => {
    seed('t1', { when: '2026-11-15', repeat: { unit: 'day', every: 2, from: 'completion' } })
    const { result } = await call('tools/call', {
      name: 'set_task_done',
      arguments: { id: 't1', done: true, today: '2026-11-15' },
    })
    const body = JSON.parse(result?.content?.[0]?.text ?? '{}')
    expect(body.task).toMatchObject({ id: 't1', done: true })
    expect(body.next).toMatchObject({ done: false, when: '2026-11-17' })
    expect(tasks()[body.next.id]).toMatchObject({ when: '2026-11-17' })
  })

  test('an impossible date is rejected before anything is written', async () => {
    seed('t1', {})
    const { result } = await call('tools/call', {
      name: 'update_task',
      arguments: { id: 't1', when: '2026-02-30' },
    })
    expect(result?.isError).toBe(true)
    expect(tasks().t1.when).toBeUndefined()
  })
})
