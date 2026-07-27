import { describe, expect, it } from 'bun:test'

import { isTrustedOrigin } from './csrf'

/**
 * happy-dom's `Request` (registered globally for DOM tests) strips `Origin`
 * and `Sec-Fetch-Site` when passed via the constructor's `headers` init, as
 * both are forbidden request-header names per the Fetch spec. Appending them
 * to `req.headers` after construction isn't guarded, so this is the only way
 * to simulate a browser-set header in this environment.
 */
function request(headers: Record<string, string> = {}) {
  const req = new Request('http://localhost/api/whatever', { method: 'POST' })
  for (const [key, value] of Object.entries(headers)) {
    req.headers.append(key, value)
  }

  return req
}

describe('isTrustedOrigin', () => {
  it('returns true when the Origin header matches the request origin', () => {
    expect(isTrustedOrigin(request({ origin: 'http://localhost' }))).toBe(true)
  })

  it('returns false when the Origin header does not match the request origin', () => {
    expect(isTrustedOrigin(request({ origin: 'https://evil.example.com' }))).toBe(false)
  })

  it('returns true when Origin is absent and Sec-Fetch-Site is same-origin', () => {
    expect(isTrustedOrigin(request({ 'sec-fetch-site': 'same-origin' }))).toBe(true)
  })

  it('returns true when Origin is absent and Sec-Fetch-Site is none', () => {
    expect(isTrustedOrigin(request({ 'sec-fetch-site': 'none' }))).toBe(true)
  })

  it('returns false when Origin is absent and Sec-Fetch-Site is cross-site', () => {
    expect(isTrustedOrigin(request({ 'sec-fetch-site': 'cross-site' }))).toBe(false)
  })

  it('returns true when neither header is present', () => {
    expect(isTrustedOrigin(request())).toBe(true)
  })
})
