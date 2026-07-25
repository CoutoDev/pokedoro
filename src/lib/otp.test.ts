import { afterEach, describe, expect, it, spyOn } from 'bun:test'

import { sha256Hex } from './hash'
import { generateOtp, hashOtp, OTP_LENGTH } from './otp'

afterEach(() => {
  spyOn(globalThis.crypto, 'getRandomValues').mockRestore()
})

describe('generateOtp', () => {
  it('returns a zero-padded 6-digit numeric string', () => {
    const code = generateOtp()

    expect(code).toHaveLength(OTP_LENGTH)
    expect(code).toMatch(/^\d{6}$/)
  })

  it('zero-pads small values so the length is always 6', () => {
    spyOn(globalThis.crypto, 'getRandomValues').mockImplementation((array: any) => {
      array[0] = 42
      return array
    })

    expect(generateOtp()).toBe('000042')
  })
})

describe('hashOtp', () => {
  it('delegates to sha256Hex', () => {
    expect(hashOtp('123456')).toBe(sha256Hex('123456'))
  })

  it('is deterministic', () => {
    expect(hashOtp('123456')).toBe(hashOtp('123456'))
  })
})
