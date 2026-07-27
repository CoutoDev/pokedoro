import { and, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/server/db/client'
import { otpCodes } from '@/server/db/schema'
import { generateOtp, hashOtp, OTP_EXPIRY_MS } from '@/server/lib/otp'
import { consumeRateLimit, getClientIp, type IpSource } from '@/server/lib/rateLimit'
import { sendOtpEmail } from '@/server/lib/resend'

const bodySchema = z.object({ email: z.email().max(254) })

// A resend cooldown plus a per-email cap stops one address from being
// email-bombed; the per-IP cap stops one client from doing it to many
// addresses at once.
const EMAIL_RATE_LIMIT = { max: 3, windowMs: 10 * 60 * 1000 }
const IP_RATE_LIMIT = { max: 20, windowMs: 10 * 60 * 1000 }

export async function requestOtp(req: Request, server?: IpSource): Promise<Response> {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return Response.json({ error: 'Invalid email' }, { status: 400 })
  }

  const email = parsed.data.email.toLowerCase().trim()

  const ip = getClientIp(req, server)
  const emailLimit = consumeRateLimit(`otp-request:email:${email}`, EMAIL_RATE_LIMIT.max, EMAIL_RATE_LIMIT.windowMs)
  const ipLimit = consumeRateLimit(`otp-request:ip:${ip}`, IP_RATE_LIMIT.max, IP_RATE_LIMIT.windowMs)

  if (!emailLimit.allowed || !ipLimit.allowed) {
    return Response.json({ error: 'Too many requests, please try again later' }, { status: 429 })
  }

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

  return Response.json({ ok: true })
}
