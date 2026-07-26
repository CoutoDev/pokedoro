import { afterEach, describe, expect, it, mock, spyOn } from 'bun:test'

import { hmacSha256Hex } from './hash'
import { generateOtp, hashOtp, OTP_LENGTH, resetOtpSecretWarning } from './otp'

const originalOtpSecret = process.env.OTP_SECRET
const originalNodeEnv = process.env.NODE_ENV

afterEach(() => {
  mock.restore()
  process.env.OTP_SECRET = originalOtpSecret
  process.env.NODE_ENV = originalNodeEnv
  resetOtpSecretWarning()
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

  it('re-rolls a value in the rejection zone instead of using it', () => {
    let call = 0
    spyOn(globalThis.crypto, 'getRandomValues').mockImplementation((array: any) => {
      call += 1
      // 4294000000 is the first rejected draw (>= UINT32_SPACE - UINT32_SPACE
      // % 10^6); it must be re-rolled rather than mod'd into a biased code.
      array[0] = call === 1 ? 4294000000 : 42
      return array
    })

    expect(generateOtp()).toBe('000042')
    expect(call).toBe(2)
  })
})

describe('hashOtp', () => {
  it('is deterministic', () => {
    spyOn(console, 'warn').mockImplementation(() => {})

    expect(hashOtp('123456')).toBe(hashOtp('123456'))
  })

  it('uses OTP_SECRET as the HMAC key when set', () => {
    process.env.OTP_SECRET = 'test-secret'

    expect(hashOtp('123456')).toBe(hmacSha256Hex('test-secret', '123456'))
  })

  it('falls back to a fixed dev key when OTP_SECRET is unset outside production', () => {
    delete process.env.OTP_SECRET
    process.env.NODE_ENV = 'development'
    spyOn(console, 'warn').mockImplementation(() => {})

    expect(hashOtp('123456')).toBe(hmacSha256Hex('dev-only-insecure-otp-pepper', '123456'))
  })

  it('warns once (not on every call) when falling back to the dev key', () => {
    delete process.env.OTP_SECRET
    process.env.NODE_ENV = 'development'
    const warnSpy = spyOn(console, 'warn').mockImplementation(() => {})

    hashOtp('123456')
    hashOtp('654321')

    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('OTP_SECRET is unset'))
  })

  it('throws when OTP_SECRET is unset in production', () => {
    delete process.env.OTP_SECRET
    process.env.NODE_ENV = 'production'

    expect(() => hashOtp('123456')).toThrow('OTP_SECRET must be set in production')
  })
})
