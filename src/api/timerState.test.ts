import { describe, expect, it } from 'bun:test'
import { eq } from 'drizzle-orm'

import { db } from '@/db/client'
import { timerStates, users } from '@/db/schema'
import { createSession, SESSION_COOKIE_NAME } from '@/lib/session'

import { getTimerState, saveTimerState } from './timerState'

async function createUserWithSession(email: string) {
  const id = crypto.randomUUID()
  const now = new Date()

  await db.insert(users).values({ id, email, createdAt: now, updatedAt: now })
  const token = await createSession(id)

  return { id, token }
}

const validPayload = {
  id: 'timer-1',
  phase: 'FOCUS' as const,
  status: 'IDLE' as const,
  focusDuration: 1500,
  shortBreakDuration: 300,
  longBreakDuration: 900,
  sessionTimeout: null,
  pausedAt: null,
  resumedAt: null,
  resetedAt: null,
  remaining: 1500,
  interval: null,
}

/**
 * happy-dom's `Request` (registered globally for DOM tests) strips the
 * `cookie` header when it's passed via the constructor's `headers` init, as
 * it's a forbidden request-header name per the Fetch spec. Appending it to
 * `req.headers` after construction isn't guarded, so this is the only way to
 * simulate an authenticated request in this environment.
 */
function getRequest(token?: string) {
  const req = new Request('http://localhost/api/timer-state')
  if (token) req.headers.append('cookie', `${SESSION_COOKIE_NAME}=${token}`)

  return req
}

function putRequest(body: unknown, token?: string) {
  const req = new Request('http://localhost/api/timer-state', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
  if (token) req.headers.append('cookie', `${SESSION_COOKIE_NAME}=${token}`)

  return req
}

describe('getTimerState', () => {
  it('returns 401 when there is no session cookie', async () => {
    const res = await getTimerState(getRequest())

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized' })
  })

  it('returns a null state when nothing has been saved for the user', async () => {
    const { token } = await createUserWithSession('timerstate-empty@example.com')

    const res = await getTimerState(getRequest(token))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ state: null })
  })

  it('returns the parsed saved state for the user', async () => {
    const { id, token } = await createUserWithSession('timerstate-saved@example.com')
    await db.insert(timerStates).values({
      userId: id,
      state: JSON.stringify(validPayload),
      updatedAt: new Date(),
    })

    const res = await getTimerState(getRequest(token))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ state: validPayload })
  })
})

describe('saveTimerState', () => {
  it('returns 403 when the request comes from an untrusted origin', async () => {
    const req = putRequest(validPayload)
    req.headers.append('origin', 'https://evil.example.com')

    const res = await saveTimerState(req)

    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'Forbidden' })
  })

  it('returns 401 when there is no session cookie', async () => {
    const res = await saveTimerState(putRequest(validPayload))

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized' })
  })

  it('returns 400 when the request body fails validation', async () => {
    const { token } = await createUserWithSession('timerstate-invalid@example.com')

    const res = await saveTimerState(putRequest({ ...validPayload, phase: 'NOT_A_PHASE' }, token))

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid request' })
  })

  it('returns 400 when the request body is not valid JSON', async () => {
    const { token } = await createUserWithSession('timerstate-badjson@example.com')

    const res = await saveTimerState(putRequest('not json', token))

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid request' })
  })

  it('creates the state row on first save', async () => {
    const { id, token } = await createUserWithSession('timerstate-create@example.com')

    const res = await saveTimerState(putRequest(validPayload, token))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })

    const [row] = await db.select().from(timerStates).where(eq(timerStates.userId, id))
    expect(JSON.parse(row!.state)).toEqual(validPayload)
  })

  it('upserts (updates) the existing state row on a subsequent save', async () => {
    const { id, token } = await createUserWithSession('timerstate-update@example.com')
    await saveTimerState(putRequest(validPayload, token))

    const updatedPayload = { ...validPayload, status: 'RUNNING' as const, remaining: 42 }
    const res = await saveTimerState(putRequest(updatedPayload, token))

    expect(res.status).toBe(200)

    const rows = await db.select().from(timerStates).where(eq(timerStates.userId, id))
    expect(rows).toHaveLength(1)
    expect(JSON.parse(rows[0]!.state)).toEqual(updatedPayload)
  })
})
