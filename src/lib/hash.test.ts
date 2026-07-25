import { describe, expect, it } from 'bun:test'

import { sha256Hex } from './hash'

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
