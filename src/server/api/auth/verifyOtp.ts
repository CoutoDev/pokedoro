import { z } from 'zod'

import { verifyOtpAndSignIn } from '@/server/auth/service'
import { OTP_LENGTH } from '@/server/lib/otp'
import { consumeRateLimit, getClientIp, type IpSource } from '@/server/lib/rateLimit'

const bodySchema = z.object({
  email: z.email().max(254),
  code: z.string().length(OTP_LENGTH),
})

// Per-OTP attempts are already capped (see the atomic claim in
// server/auth/service.ts); this per-IP cap additionally stops one client
// from grinding through many different emails/fresh codes to route around
// that per-row limit.
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
  const outcome = await verifyOtpAndSignIn(email, parsed.data.code)

  switch (outcome.status) {
    case 'expired_or_not_found':
      return Response.json({ error: 'Code expired or not found' }, { status: 400 })
    case 'too_many_attempts':
      return Response.json({ error: 'Too many attempts' }, { status: 429 })
    case 'invalid_code':
      return Response.json({ error: 'Invalid code' }, { status: 400 })
    case 'user_creation_failed':
      return Response.json({ error: 'Could not create user' }, { status: 500 })
    case 'success':
      return Response.json({ user: outcome.user }, { headers: { 'Set-Cookie': outcome.cookie } })
  }
}
