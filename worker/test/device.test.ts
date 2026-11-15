import { describe, expect, test } from 'bun:test'
import { signSession } from '../lib/token.js'
import device from '../routes/device.js'
import { installFakeFirebase, setAt, type Tree, tree } from './support.js'

installFakeFirebase()

const BASE = 'https://notes.example/api/device'
const token = () => signSession({ uid: 'u1' }, 60_000)

const call = (method: string, path: string, body?: unknown, auth: string | null = token()) =>
  device(
    new Request(`${BASE}/${path}`, {
      method,
      headers: {
        ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  )

const stored = () => ((tree.todos_dev as Tree | undefined)?.u1 ?? {}) as Record<string, Tree>

describe('Device API', () => {
  test('a Firebase ID token is exchanged for a device token that works on the other calls', async () => {
    const response = await call('POST', 'session', { idToken: 'good-id-token' }, null)
    expect(response.status).toBe(200)
    const { token: deviceToken, expiresAt } = (await response.json()) as {
      token: string
      expiresAt: number
    }
    expect(expiresAt).toBeGreaterThan(Date.now() + 29 * 86_400_000)
    expect((await call('GET', 'snapshot', undefined, deviceToken)).status).toBe(200)
  })

  test('a bad ID token gets no session', async () => {
    expect((await call('POST', 'session', { idToken: 'forged' }, null)).status).toBe(401)
  })

  test('calls without a valid token are rejected', async () => {
    expect((await call('GET', 'snapshot', undefined, null)).status).toBe(401)
    expect((await call('GET', 'snapshot', undefined, 'garbage')).status).toBe(401)
  })

  test('snapshot returns the raw tasks and lists', async () => {
    setAt('todos_dev/u1/a', { task: 'A', when: 'someday' })
    setAt('folders_dev/u1/f', { name: 'Home' })
    const body = (await (await call('GET', 'snapshot')).json()) as { todos: Tree; folders: Tree }
    expect(body.todos).toEqual({ a: { task: 'A', when: 'someday' } })
    expect(body.folders).toEqual({ f: { name: 'Home' } })
  })

  test('creating with the same client id twice leaves one task', async () => {
    const body = { task: 'Milk', when: '2026-11-16', evening: true }
    expect((await call('PUT', 'tasks/w-1', body)).status).toBe(200)
    expect((await call('PUT', 'tasks/w-1', body)).status).toBe(200)
    expect(Object.keys(stored())).toEqual(['w-1'])
    expect(stored()['w-1']).toMatchObject({
      task: 'Milk',
      when: '2026-11-16',
      evening: true,
      done: false,
    })
  })

  test('an invalid planning field is rejected instead of stored', async () => {
    expect((await call('PUT', 'tasks/w-2', { task: 'x', when: 'tomorrow' })).status).toBe(400)
    expect(stored()['w-2']).toBeUndefined()
  })

  test('completing a repeating task returns the next task, and completing again is a no-op', async () => {
    setAt('todos_dev/u1/t', {
      task: 'Run',
      done: false,
      when: '2026-11-15',
      repeat: { unit: 'day', every: 1, from: 'schedule' },
    })
    const first = (await (
      await call('POST', 'tasks/t/complete', { today: '2026-11-15' })
    ).json()) as { nextId: string | null }
    expect(first.nextId).toBeTruthy()
    expect(stored()[first.nextId as string]).toMatchObject({
      task: 'Run',
      when: '2026-11-16',
      done: false,
    })
    expect(stored().t).toMatchObject({ done: true })

    const again = (await (
      await call('POST', 'tasks/t/complete', { today: '2026-11-15' })
    ).json()) as { nextId: string | null }
    expect(again.nextId).toBeNull()
    expect(Object.keys(stored())).toHaveLength(2)
  })

  test('complete needs a valid today', async () => {
    setAt('todos_dev/u1/t', { task: 'Run', done: false })
    expect((await call('POST', 'tasks/t/complete', { today: 'soon' })).status).toBe(400)
  })

  test('reopen and plan', async () => {
    setAt('todos_dev/u1/t', { task: 'Read', done: true, completedAt: 5 })
    expect((await call('POST', 'tasks/t/reopen', {})).status).toBe(200)
    expect(stored().t).toMatchObject({ done: false })
    expect(stored().t.completedAt ?? null).toBeNull()

    expect(
      (await call('PATCH', 'tasks/t', { when: '2026-11-20', evening: false, reminder: '09:00' }))
        .status,
    ).toBe(200)
    expect(stored().t).toMatchObject({ when: '2026-11-20', reminder: '09:00', task: 'Read' })
  })

  test('unknown routes are 404', async () => {
    expect((await call('GET', 'nope')).status).toBe(404)
  })
})
