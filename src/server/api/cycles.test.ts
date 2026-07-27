import { describe, expect, it } from 'bun:test'
import { eq } from 'drizzle-orm'

import { db } from '@/server/db/client'
import { pomodoroCycles, users } from '@/server/db/schema'
import { createSession, SESSION_COOKIE_NAME } from '@/server/lib/session'

import { createCycle } from './cycles'

async function createUserWithSession(email: string) {
  const id = crypto.randomUUID()
  const now = new Date()

  await db.insert(users).values({ id, email, createdAt: now, updatedAt: now })
  const token = await createSession(id)

  return { id, token }
}

/**
 * happy-dom's `Request` (registered globally for DOM tests) strips the
 * `cookie` header when it's passed via the constructor's `headers` init, as
 * it's a forbidden request-header name per the Fetch spec. Appending it to
 * `req.headers` after construction isn't guarded, so this is the only way to
 * simulate an authenticated request in this environment.
 */
function postRequest(body: unknown, token?: string) {
  const req = new Request('http://localhost/api/cycles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
  if (token) req.headers.append('cookie', `${SESSION_COOKIE_NAME}=${token}`)

  return req
}

describe('createCycle', () => {
  it('returns 403 when the request comes from an untrusted origin', async () => {
    const req = postRequest({})
    req.headers.append('origin', 'https://evil.example.com')

    const res = await createCycle(req)

    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'Forbidden' })
  })

  it('returns 401 when there is no session cookie', async () => {
    const res = await createCycle(postRequest({}))

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized' })
  })

  it('returns 400 when the request body fails validation', async () => {
    const { token } = await createUserWithSession('cycles-invalid@example.com')

    const res = await createCycle(postRequest({ phase: 'NOT_A_PHASE' }, token))

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid request' })
  })

  it('returns 400 when the request body is not valid JSON', async () => {
    const { token } = await createUserWithSession('cycles-badjson@example.com')

    const res = await createCycle(postRequest('not json', token))

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid request' })
  })

  it('persists a completed cycle for the authenticated user', async () => {
    const { id, token } = await createUserWithSession('cycles-user@example.com')

    const res = await createCycle(postRequest({
      phase: 'FOCUS',
      focusDuration: 1500,
      shortBreakDuration: 300,
      longBreakDuration: 900,
    }, token))

    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({ ok: true })

    const [row] = await db.select().from(pomodoroCycles).where(eq(pomodoroCycles.userId, id))
    expect(row).toMatchObject({
      userId: id,
      phase: 'FOCUS',
      focusDuration: 1500,
      shortBreakDuration: 300,
      longBreakDuration: 900,
    })
  })
})
