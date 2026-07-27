import { and, desc, eq, isNull, lt, sql } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/server/db/client'
import { otpCodes, users } from '@/server/db/schema'
import { hashesEqual } from '@/server/lib/hash'
import { hashOtp, OTP_LENGTH, OTP_MAX_ATTEMPTS } from '@/server/lib/otp'
import { consumeRateLimit, getClientIp, type IpSource } from '@/server/lib/rateLimit'
import { buildSessionCookie, createSession } from '@/server/lib/session'

const bodySchema = z.object({
  email: z.email().max(254),
  code: z.string().length(OTP_LENGTH),
})

// Per-OTP attempts are already capped (see the atomic claim below); this
// per-IP cap additionally stops one client from grinding through many
// different emails/fresh codes to route around that per-row limit.
const IP_RATE_LIMIT = { max: 30, windowMs: 10 * 60 * 1000 }

export async function verifyOtp(req: Request, server?: IpSource): Promise<Response> {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }

  const ip = getClientIp(req, server)
  const ipLimit = consumeRateLimit(`otp-verify:ip:${ip}`, IP_RATE_LIMIT.max, IP_RATE_LIMIT.windowMs)
  if (!ipLimit.allowed) {
    return Response.json({ error: 'Too many requests, please try again later' }, { status: 429 })
  }

  const email = parsed.data.email.toLowerCase().trim()
  const { code } = parsed.data

  const [otp] = await db
    .select()
    .from(otpCodes)
    .where(and(eq(otpCodes.email, email), isNull(otpCodes.consumedAt)))
    .orderBy(desc(otpCodes.createdAt))
    .limit(1)

  if (!otp || otp.expiresAt.getTime() < Date.now()) {
    return Response.json({ error: 'Code expired or not found' }, { status: 400 })
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
    return Response.json({ error: 'Too many attempts' }, { status: 429 })
  }

  if (!hashesEqual(hashOtp(code), claimed.codeHash)) {
    return Response.json({ error: 'Invalid code' }, { status: 400 })
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
      return Response.json({ error: 'Could not create user' }, { status: 500 })
    }

    user = createdUser
  }

  const token = await createSession(user.id)

  return Response.json({ user }, { headers: { 'Set-Cookie': buildSessionCookie(token) } })
}
