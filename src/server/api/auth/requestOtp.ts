import { z } from 'zod'

import { requestOtpForEmail } from '@/server/auth/service'
import { consumeRateLimit, getClientIp, type IpSource } from '@/server/lib/rateLimit'

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

  await requestOtpForEmail(email)

  return Response.json({ ok: true })
}
