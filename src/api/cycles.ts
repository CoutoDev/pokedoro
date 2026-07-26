import { z } from 'zod'

import { db } from '@/db/client'
import { pomodoroCycles } from '@/db/schema'
import { isTrustedOrigin } from '@/lib/csrf'
import { getSessionUser, parseSessionCookie } from '@/lib/session'

// 24h ceiling is far beyond any realistic focus/break length; it just keeps
// junk numeric input (negatives, non-integers, absurdly large values) out.
const durationSeconds = z.number().int().min(0).max(24 * 60 * 60)

const bodySchema = z.object({
  phase: z.enum(['FOCUS', 'SHORT_BREAK', 'LONG_BREAK', 'DONE']),
  focusDuration: durationSeconds,
  shortBreakDuration: durationSeconds,
  longBreakDuration: durationSeconds,
})

export async function createCycle(req: Request): Promise<Response> {
  if (!isTrustedOrigin(req)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const token = parseSessionCookie(req.headers.get('cookie'))
  const user = await getSessionUser(token)

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }

  const now = new Date()

  await db.insert(pomodoroCycles).values({
    id: crypto.randomUUID(),
    userId: user.id,
    ...parsed.data,
    completedAt: now,
    createdAt: now,
  })

  return Response.json({ ok: true }, { status: 201 })
}
