import { describe, expect, it } from 'bun:test'

import { hashesEqual, hmacSha256Hex, sha256Hex } from './hash'

describe('sha256Hex', () => {
  it('returns the known sha-256 hex digest for a given input', () => {
    expect(sha256Hex('hello')).toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
    )
  })

  it('is deterministic for the same input', () => {
    expect(sha256Hex('123456')).toBe(sha256Hex('123456'))
  })

  it('produces different digests for different inputs', () => {
    expect(sha256Hex('123456')).not.toBe(sha256Hex('654321'))
  })
})

describe('hmacSha256Hex', () => {
  it('returns the known hmac-sha256 hex digest for a given key and input', () => {
    expect(hmacSha256Hex('key', 'The quick brown fox jumps over the lazy dog')).toBe(
      'f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8',
    )
  })

  it('is deterministic for the same key and input', () => {
    expect(hmacSha256Hex('key', '123456')).toBe(hmacSha256Hex('key', '123456'))
  })

  it('produces different digests for different keys with the same input', () => {
    expect(hmacSha256Hex('key-a', '123456')).not.toBe(hmacSha256Hex('key-b', '123456'))
  })
})

describe('hashesEqual', () => {
  it('returns true for identical hex digests', () => {
    const digest = sha256Hex('123456')

    expect(hashesEqual(digest, digest)).toBe(true)
  })

  it('returns false for different digests of the same length', () => {
    expect(hashesEqual(sha256Hex('123456'), sha256Hex('654321'))).toBe(false)
  })

  it('returns false for digests of different lengths', () => {
    expect(hashesEqual(sha256Hex('123456'), 'abc')).toBe(false)
  })
})
