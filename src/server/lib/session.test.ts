import { afterEach, describe, expect, it } from 'bun:test'
import { eq } from 'drizzle-orm'

import { db } from '@/server/db/client'
import { sessions, users } from '@/server/db/schema'

import {
  buildClearedSessionCookie,
  buildSessionCookie,
  createSession,
  destroySession,
  getSessionUser,
  parseSessionCookie,
  SESSION_COOKIE_NAME,
} from './session'

const originalNodeEnv = process.env.NODE_ENV

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv
})

async function createUser(email: string) {
  const id = crypto.randomUUID()
  const now = new Date()

  await db.insert(users).values({ id, email, createdAt: now, updatedAt: now })

  return id
}

describe('parseSessionCookie', () => {
  it('returns null when the header is null', () => {
    expect(parseSessionCookie(null)).toBeNull()
  })

  it('returns null when the cookie is not present', () => {
    expect(parseSessionCookie('other=value')).toBeNull()
  })

  it('extracts the session token from a single cookie', () => {
    expect(parseSessionCookie(`${SESSION_COOKIE_NAME}=abc123`)).toBe('abc123')
  })

  it('extracts the session token among multiple cookies', () => {
    expect(parseSessionCookie(`foo=bar; ${SESSION_COOKIE_NAME}=abc123; baz=qux`)).toBe('abc123')
  })
})

describe('buildSessionCookie', () => {
  it('includes the token, HttpOnly, SameSite=Lax, and a Max-Age', () => {
    process.env.NODE_ENV = 'development'
    const cookie = buildSessionCookie('token-value')

    expect(cookie).toContain(`${SESSION_COOKIE_NAME}=token-value`)
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('SameSite=Lax')
    expect(cookie).toContain('Max-Age=')
    expect(cookie).not.toContain('Secure')
  })

  it('adds the Secure flag in production', () => {
    process.env.NODE_ENV = 'production'

    expect(buildSessionCookie('token-value')).toContain('Secure')
  })
})

describe('buildClearedSessionCookie', () => {
  it('clears the cookie with Max-Age=0', () => {
    const cookie = buildClearedSessionCookie()

    expect(cookie).toContain(`${SESSION_COOKIE_NAME}=;`)
    expect(cookie).toContain('Max-Age=0')
  })
})

describe('createSession / getSessionUser / destroySession', () => {
  it('creates a session and resolves the owning user from its token', async () => {
    const userId = await createUser('session-user@example.com')

    const token = await createSession(userId)
    const user = await getSessionUser(token)

    expect(user?.id).toBe(userId)
    expect(user?.email).toBe('session-user@example.com')
  })

  it('returns null for getSessionUser when the token is null', async () => {
    expect(await getSessionUser(null)).toBeNull()
  })

  it('returns null for getSessionUser when the token does not match any session', async () => {
    expect(await getSessionUser('does-not-exist')).toBeNull()
  })

  it('returns null for getSessionUser when the session has expired, and deletes the row', async () => {
    const userId = await createUser('expired-user@example.com')
    const token = await createSession(userId)

    await db
      .update(sessions)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(sessions.userId, userId))

    expect(await getSessionUser(token)).toBeNull()

    const rows = await db.select().from(sessions).where(eq(sessions.userId, userId))
    expect(rows).toHaveLength(0)
  })

  it('destroySession removes the session so the token no longer resolves', async () => {
    const userId = await createUser('destroy-user@example.com')
    const token = await createSession(userId)

    await destroySession(token)

    expect(await getSessionUser(token)).toBeNull()
  })

  it('destroySession is a no-op when the token is null', async () => {
    await expect(destroySession(null)).resolves.toBeUndefined()
  })
})
