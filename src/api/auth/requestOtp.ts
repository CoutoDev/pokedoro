import { and, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/db/client'
import { otpCodes } from '@/db/schema'
import { generateOtp, hashOtp, OTP_EXPIRY_MS } from '@/lib/otp'
import { sendOtpEmail } from '@/lib/resend'

const bodySchema = z.object({ email: z.email() })

export async function requestOtp(req: Request): Promise<Response> {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return Response.json({ error: 'Invalid email' }, { status: 400 })
  }

  const email = parsed.data.email.toLowerCase().trim()
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
