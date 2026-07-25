import { and, desc, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/db/client'
import { otpCodes, users } from '@/db/schema'
import { hashOtp, OTP_LENGTH, OTP_MAX_ATTEMPTS } from '@/lib/otp'
import { buildSessionCookie, createSession } from '@/lib/session'

const bodySchema = z.object({
  email: z.email(),
  code: z.string().length(OTP_LENGTH),
})

export async function verifyOtp(req: Request): Promise<Response> {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
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

  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    return Response.json({ error: 'Too many attempts' }, { status: 429 })
  }

  if (hashOtp(code) !== otp.codeHash) {
    await db
      .update(otpCodes)
      .set({ attempts: otp.attempts + 1 })
      .where(eq(otpCodes.id, otp.id))

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
