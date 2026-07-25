import { afterEach, describe, expect, it } from 'bun:test'

import {
  buildClearedSessionCookie,
  buildSessionCookie,
  parseSessionCookie,
  SESSION_COOKIE_NAME,
} from './session'

const originalNodeEnv = process.env.NODE_ENV

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv
})

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
