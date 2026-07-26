import { hmacSha256Hex } from './hash'

export const OTP_LENGTH = 6
export const OTP_EXPIRY_MS = 10 * 60 * 1000
export const OTP_MAX_ATTEMPTS = 5

// Dev/test fallback only — a 6-digit code has just 10^6 possible values, so
// hashing it unsalted/unkeyed lets anyone with read access to the database
// reverse every live code from a precomputed table. Production must set a
// real OTP_SECRET.
const DEV_OTP_SECRET = 'dev-only-insecure-otp-pepper'

// The throw below only fires when NODE_ENV is exactly 'production'; a server
// started without NODE_ENV set at all (e.g. a bare `bun src/index.ts` in a
// container that doesn't set it) would otherwise silently fall back to the
// dev key with no signal anywhere. Warn once per process so that's visible.
let warnedAboutDevSecret = false

function otpSecret(): string {
  const secret = process.env.OTP_SECRET
  if (secret) return secret

  if (process.env.NODE_ENV === 'production') {
    throw new Error('OTP_SECRET must be set in production')
  }

  if (!warnedAboutDevSecret) {
    warnedAboutDevSecret = true
    console.warn('OTP_SECRET is unset — using an insecure fixed dev key to hash OTP codes.')
  }

  return DEV_OTP_SECRET
}

/** Test-only: resets the one-time dev-secret warning so tests can assert on it. */
export function resetOtpSecretWarning(): void {
  warnedAboutDevSecret = false
}

const OTP_SPACE = 10 ** OTP_LENGTH
const UINT32_SPACE = 2 ** 32
// Values at or above this are rejected and re-rolled so every code in
// OTP_SPACE has exactly the same probability — `uint32 % OTP_SPACE` alone
// would slightly favor the low end of the range (values below UINT32_SPACE %
// OTP_SPACE get one extra chance).
const REJECTION_THRESHOLD = UINT32_SPACE - (UINT32_SPACE % OTP_SPACE)

export function generateOtp(): string {
  const bytes = new Uint32Array(1)
  let value: number

  do {
    crypto.getRandomValues(bytes)
    value = bytes[0]!
  } while (value >= REJECTION_THRESHOLD)

  return (value % OTP_SPACE).toString().padStart(OTP_LENGTH, '0')
}

export function hashOtp(code: string): string {
  return hmacSha256Hex(otpSecret(), code)
}
