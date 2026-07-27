import { afterEach, describe, expect, it, spyOn } from 'bun:test'

import { consumeRateLimit, getClientIp, resetRateLimits } from './rateLimit'

afterEach(() => {
  resetRateLimits()
  spyOn(Date, 'now').mockRestore()
})

describe('consumeRateLimit', () => {
  it('allows requests up to the max within the window', () => {
    expect(consumeRateLimit('key-a', 3, 1000).allowed).toBe(true)
    expect(consumeRateLimit('key-a', 3, 1000).allowed).toBe(true)
    expect(consumeRateLimit('key-a', 3, 1000).allowed).toBe(true)
  })

  it('denies the request once the max is exceeded within the window', () => {
    consumeRateLimit('key-b', 2, 1000)
    consumeRateLimit('key-b', 2, 1000)

    const result = consumeRateLimit('key-b', 2, 1000)

    expect(result.allowed).toBe(false)
    expect(result.retryAfterMs).toBeGreaterThan(0)
  })

  it('tracks separate keys independently', () => {
    consumeRateLimit('key-c', 1, 1000)

    expect(consumeRateLimit('key-d', 1, 1000).allowed).toBe(true)
  })

  it('resets the count once the window elapses', () => {
    const dateNowSpy = spyOn(Date, 'now')
    dateNowSpy.mockImplementation(() => 0)

    consumeRateLimit('key-e', 1, 1000)
    expect(consumeRateLimit('key-e', 1, 1000).allowed).toBe(false)

    dateNowSpy.mockImplementation(() => 1001)
    expect(consumeRateLimit('key-e', 1, 1000).allowed).toBe(true)
  })
})

describe('resetRateLimits', () => {
  it('clears all tracked windows', () => {
    consumeRateLimit('key-f', 1, 1000)
    resetRateLimits()

    expect(consumeRateLimit('key-f', 1, 1000).allowed).toBe(true)
  })
})

describe('getClientIp', () => {
  it('returns "unknown" when no server is provided', () => {
    expect(getClientIp(new Request('http://localhost/'))).toBe('unknown')
  })

  it('returns "unknown" when the server cannot resolve an IP for the request', () => {
    const server = { requestIP: () => null }

    expect(getClientIp(new Request('http://localhost/'), server)).toBe('unknown')
  })

  it('returns the address resolved by the server', () => {
    const server = { requestIP: () => ({ address: '203.0.113.5' }) }

    expect(getClientIp(new Request('http://localhost/'), server)).toBe('203.0.113.5')
  })
})
