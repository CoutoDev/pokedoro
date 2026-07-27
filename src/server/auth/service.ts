import { and, desc, eq, isNull, lt, sql } from 'drizzle-orm'

import { db } from '@/server/db/client'
import { otpCodes, users } from '@/server/db/schema'
import { hashesEqual } from '@/server/lib/hash'
import { generateOtp, hashOtp, OTP_EXPIRY_MS, OTP_MAX_ATTEMPTS } from '@/server/lib/otp'
import { sendOtpEmail } from '@/server/lib/resend'
import { buildSessionCookie, createSession } from '@/server/lib/session'
import type { User } from '@/shared/types/user'

/**
 * Sign-in-with-OTP use case (request half): generates and stores a hashed
 * one-time code for `email` — invalidating any previous unconsumed code —
 * and emails it. Transport parsing, rate limiting, and CSRF are the
 * caller's (HTTP handler's) responsibility.
 */
export async function requestOtpForEmail(email: string): Promise<void> {
  const code = generateOtp()
  const now = new Date()

  await db
    .update(otpCodes)
    .set({ consumedAt: now })
    .where(and(eq(otpCodes.email, email), isNull(otpCodes.consumedAt)))

  await db.insert(otpCodes).values({
    id: crypto.randomUUID(),
    email,
    codeHash: hashOtp(code),
    attempts: 0,
    consumedAt: null,
    expiresAt: new Date(now.getTime() + OTP_EXPIRY_MS),
    createdAt: now,
  })

  await sendOtpEmail(email, code)
}

export type VerifyOtpOutcome =
  | { status: 'expired_or_not_found' }
  | { status: 'too_many_attempts' }
  | { status: 'invalid_code' }
  | { status: 'user_creation_failed' }
  | { status: 'success'; user: User; cookie: string }

/**
 * Sign-in-with-OTP use case (verify half): checks `code` against the most
 * recent unconsumed OTP row for `email`, registering a new user on first
 * sign-in, and issuing a session cookie on success. Transport parsing, rate
 * limiting, and CSRF are the caller's responsibility.
 */
export async function verifyOtpAndSignIn(email: string, code: string): Promise<VerifyOtpOutcome> {
  const [otp] = await db
    .select()
    .from(otpCodes)
    .where(and(eq(otpCodes.email, email), isNull(otpCodes.consumedAt)))
    .orderBy(desc(otpCodes.createdAt))
    .limit(1)

  if (!otp || otp.expiresAt.getTime() < Date.now()) {
    return { status: 'expired_or_not_found' }
  }

  // Claiming an attempt (increment + cap check) must be a single atomic
  // statement — reading `attempts` and writing `attempts + 1` as separate
  // steps lets concurrent requests all read the same stale count and all
  // pass the cap check, defeating OTP_MAX_ATTEMPTS entirely.
  const [claimed] = await db
    .update(otpCodes)
    .set({ attempts: sql`${otpCodes.attempts} + 1` })
    .where(and(eq(otpCodes.id, otp.id), lt(otpCodes.attempts, OTP_MAX_ATTEMPTS)))
    .returning()

  if (!claimed) {
    return { status: 'too_many_attempts' }
  }

  if (!hashesEqual(hashOtp(code), claimed.codeHash)) {
    return { status: 'invalid_code' }
  }

  await db.update(otpCodes).set({ consumedAt: new Date() }).where(eq(otpCodes.id, otp.id))

  const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1)

  let user = existingUser
  if (!user) {
    const now = new Date()
    const [createdUser] = await db
      .insert(users)
      .values({ id: crypto.randomUUID(), email, createdAt: now, updatedAt: now })
      .returning()

    if (!createdUser) {
      return { status: 'user_creation_failed' }
    }

    user = createdUser
  }

  const token = await createSession(user.id)

  return { status: 'success', user, cookie: buildSessionCookie(token) }
}
