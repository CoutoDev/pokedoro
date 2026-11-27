import { describe, expect, it, spyOn } from 'bun:test'
import { eq } from 'drizzle-orm'

import { db } from '@/server/db/client'
import { pokemonCatches, pomodoroCycles, users } from '@/server/db/schema'
import { createSession, SESSION_COOKIE_NAME } from '@/server/lib/session'

import { createStoppedCycle } from './stoppedCycles'

async function createUserWithSession(email: string) {
  const id = crypto.randomUUID()
  const now = new Date()
  await db.insert(users).values({ id, email, createdAt: now, updatedAt: now })
  return { id, token: await createSession(id) }
}

// See cycles.test.ts: the cookie must be appended after construction under happy-dom.
function postRequest(body: unknown, token?: string) {
  const req = new Request('http://localhost/api/cycles/stopped', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
  if (token) req.headers.append('cookie', `${SESSION_COOKIE_NAME}=${token}`)
  return req
}

const payload = (overrides = {}) => ({
  cycleId: crypto.randomUUID(),
  phase: 'FOCUS',
  focusDuration: 1500,
  shortBreakDuration: 300,
  longBreakDuration: 900,
  elapsedSeconds: 420,
  ...overrides,
})

describe('createStoppedCycle', () => {
  it('rejects untrusted origins', async () => {
    const req = postRequest({})
    req.headers.append('origin', 'https://evil.example.com')

    expect((await createStoppedCycle(req)).status).toBe(403)
  })

  it('requires a session', async () => {
    expect((await createStoppedCycle(postRequest(payload()))).status).toBe(401)
  })

  it('rejects an invalid body', async () => {
    const { token } = await createUserWithSession('stopped-invalid@example.com')

    expect((await createStoppedCycle(postRequest(payload({ elapsedSeconds: -1 }), token))).status).toBe(400)
    expect((await createStoppedCycle(postRequest('nope', token))).status).toBe(400)
  })

  it('stores a STOPPED row with no catch', async () => {
    const { id, token } = await createUserWithSession('stopped-ok@example.com')
    const body = payload()

    const res = await createStoppedCycle(postRequest(body, token))

    expect(res.status).toBe(201)
    const [row] = await db.select().from(pomodoroCycles).where(eq(pomodoroCycles.userId, id))
    expect(row).toMatchObject({ id: body.cycleId, outcome: 'STOPPED', elapsedSeconds: 420, phase: 'FOCUS' })
    expect(await db.select().from(pokemonCatches).where(eq(pokemonCatches.userId, id))).toHaveLength(0)
  })

  it('clamps elapsedSeconds to the phase duration', async () => {
    const { id, token } = await createUserWithSession('stopped-clamp@example.com')

    await createStoppedCycle(postRequest(payload({ phase: 'SHORT_BREAK', elapsedSeconds: 9999 }), token))

    const [row] = await db.select().from(pomodoroCycles).where(eq(pomodoroCycles.userId, id))
    expect(row!.elapsedSeconds).toBe(300)
  })

  it('is idempotent for the same user and cycleId', async () => {
    const { id, token } = await createUserWithSession('stopped-retry@example.com')
    const body = payload()

    await createStoppedCycle(postRequest(body, token))
    const retry = await createStoppedCycle(postRequest(body, token))

    expect(retry.status).toBe(200)
    expect(await db.select().from(pomodoroCycles).where(eq(pomodoroCycles.userId, id))).toHaveLength(1)
  })

  it('returns 409 without leaking when the cycleId belongs to another user', async () => {
    const a = await createUserWithSession('stopped-a@example.com')
    const b = await createUserWithSession('stopped-b@example.com')
    const body = payload()

    await createStoppedCycle(postRequest(body, a.token))
    const res = await createStoppedCycle(postRequest(body, b.token))

    expect(res.status).toBe(409)
  })

  it('returns 500 on unexpected database errors', async () => {
    const { token } = await createUserWithSession('stopped-500@example.com')
    const spy = spyOn(console, 'error').mockImplementation(() => {})
    const insert = spyOn(db, 'insert').mockImplementation(() => {
      throw Object.assign(new Error('disk full'), { code: 'SQLITE_FULL' })
    })

    const res = await createStoppedCycle(postRequest(payload(), token))

    insert.mockRestore()
    spy.mockRestore()
    expect(res.status).toBe(500)
  })
})
