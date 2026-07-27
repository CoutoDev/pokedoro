import { lt } from 'drizzle-orm'

import { db } from '@/server/db/client'
import { otpCodes, sessions } from '@/server/db/schema'

/**
 * Deletes rows that are no longer useful for anything (auth or debugging)
 * so `sessions`/`otp_codes` don't grow without bound. Session expiry is also
 * enforced on read (see `getSessionUser`) — this just clears rows nothing
 * ever reads again, e.g. abandoned sessions.
 */
export async function purgeExpiredAuthRecords(): Promise<void> {
  const now = new Date()

  await db.delete(sessions).where(lt(sessions.expiresAt, now))
  await db.delete(otpCodes).where(lt(otpCodes.expiresAt, now))
}
