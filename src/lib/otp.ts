import { sha256Hex } from './hash'

export const OTP_LENGTH = 6
export const OTP_EXPIRY_MS = 10 * 60 * 1000
export const OTP_MAX_ATTEMPTS = 5

export function generateOtp(): string {
  const bytes = new Uint32Array(1)
  crypto.getRandomValues(bytes)
  const code = (bytes[0]! % 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, '0')

  return code
}

export function hashOtp(code: string): string {
  return sha256Hex(code)
}
