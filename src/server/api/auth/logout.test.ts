import { afterEach, describe, expect, it, mock, spyOn } from 'bun:test'

import { db } from '@/server/db/client'
import { users } from '@/server/db/schema'
import { createSession, getSessionUser, SESSION_COOKIE_NAME } from '@/server/lib/session'

import { logout } from './logout'

async function createUserWithSession(email: string) {
  const id = crypto.randomUUID()
  const now = new Date()

  await db.insert(users).values({ id, email, createdAt: now, updatedAt: now })
  const token = await createSession(id)

  return token
}

/**
 * happy-dom's `Request` (registered globally for DOM tests) strips the
 * `cookie` header when it's passed via the constructor's `headers` init, as
 * it's a forbidden request-header name per the Fetch spec. Appending it to
 * `req.headers` after construction isn't guarded, so this is the only way to
 * simulate an authenticated request in this environment.
 */
function requestWithCookie(url: string, init: RequestInit, token: string) {
  const req = new Request(url, init)
  req.headers.append('cookie', `${SESSION_COOKIE_NAME}=${token}`)

  return req
}

afterEach(() => {
  mock.restore()
})

describe('logout', () => {
  it('destroys the session and clears the cookie', async () => {
    const token = await createUserWithSession('logout-user@example.com')
    const req = requestWithCookie('http://localhost/api/auth/logout', { method: 'POST' }, token)
    // happy-dom drops Set-Cookie from the constructed Response entirely (see
    // requestWithCookie's comment for the same restriction on the request
    // side), so this spy captures the init object Response.json() was
    // actually called with, before that stripping happens.
    const jsonSpy = spyOn(Response, 'json')

    const res = await logout(req)

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(jsonSpy).toHaveBeenCalledWith(
      { ok: true },
      { headers: { 'Set-Cookie': expect.stringContaining('Max-Age=0') } },
    )
    expect(await getSessionUser(token)).toBeNull()
  })

  it('is a no-op (still returns ok) when there is no session cookie', async () => {
    const req = new Request('http://localhost/api/auth/logout', { method: 'POST' })

    const res = await logout(req)

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })

  it('returns 403 when the request comes from an untrusted origin', async () => {
    const req = new Request('http://localhost/api/auth/logout', { method: 'POST' })
    req.headers.append('origin', 'https://evil.example.com')

    const res = await logout(req)

    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'Forbidden' })
  })
})
