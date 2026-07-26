import { describe, expect, it } from 'bun:test'
import { eq } from 'drizzle-orm'

import { db } from '@/db/client'
import { otpCodes, sessions, users } from '@/db/schema'

import { purgeExpiredAuthRecords } from './cleanup'

async function createUser(email: string) {
  const id = crypto.randomUUID()
  const now = new Date()

  await db.insert(users).values({ id, email, createdAt: now, updatedAt: now })

  return id
}

describe('purgeExpiredAuthRecords', () => {
  it('deletes expired sessions but keeps unexpired ones', async () => {
    const userId = await createUser('cleanup-sessions@example.com')
    const now = new Date()

    await db.insert(sessions).values([
      {
        id: crypto.randomUUID(),
        tokenHash: 'expired-token-hash',
        userId,
        expiresAt: new Date(now.getTime() - 1000),
        createdAt: now,
      },
      {
        id: crypto.randomUUID(),
        tokenHash: 'live-token-hash',
        userId,
        expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
        createdAt: now,
      },
    ])

    await purgeExpiredAuthRecords()

    const remaining = await db.select().from(sessions).where(eq(sessions.userId, userId))
    expect(remaining.map((r) => r.tokenHash)).toEqual(['live-token-hash'])
  })

  it('deletes expired OTP codes but keeps unexpired ones', async () => {
    const email = 'cleanup-otp@example.com'
    const now = new Date()

    await db.insert(otpCodes).values([
      {
        id: crypto.randomUUID(),
        email,
        codeHash: 'expired-code-hash',
        attempts: 0,
        consumedAt: null,
        expiresAt: new Date(now.getTime() - 1000),
        createdAt: now,
      },
      {
        id: crypto.randomUUID(),
        email,
        codeHash: 'live-code-hash',
        attempts: 0,
        consumedAt: null,
        expiresAt: new Date(now.getTime() + 10 * 60 * 1000),
        createdAt: now,
      },
    ])

    await purgeExpiredAuthRecords()

    const remaining = await db.select().from(otpCodes).where(eq(otpCodes.email, email))
    expect(remaining.map((r) => r.codeHash)).toEqual(['live-code-hash'])
  })
})
