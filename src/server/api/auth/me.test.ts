import { describe, expect, it } from 'bun:test'

import { db } from '@/server/db/client'
import { users } from '@/server/db/schema'
import { createSession, SESSION_COOKIE_NAME } from '@/server/lib/session'

import { me } from './me'

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
function requestWithCookie(url: string, token: string) {
  const req = new Request(url)
  req.headers.append('cookie', `${SESSION_COOKIE_NAME}=${token}`)

  return req
}

describe('me', () => {
  it('returns the authenticated user for a valid session cookie', async () => {
    const { id, token } = await createUserWithSession('me-user@example.com')
    const req = requestWithCookie('http://localhost/api/auth/me', token)

    const res = await me(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.user.id).toBe(id)
    expect(body.user.email).toBe('me-user@example.com')
  })

  it('returns 401 when there is no session cookie', async () => {
    const req = new Request('http://localhost/api/auth/me')

    const res = await me(req)

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized' })
  })

  it('returns 401 when the session token does not match any session', async () => {
    const req = requestWithCookie('http://localhost/api/auth/me', 'does-not-exist')

    const res = await me(req)

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized' })
  })
})
