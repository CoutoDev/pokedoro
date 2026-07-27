import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/server/db/client'
import { timerStates } from '@/server/db/schema'
import { isTrustedOrigin } from '@/server/lib/csrf'
import { getSessionUser, parseSessionCookie } from '@/server/lib/session'

// 24h ceiling is far beyond any realistic focus/break length; it just keeps
// junk numeric input (negatives, non-integers, absurdly large values) out.
const durationSeconds = z.number().int().min(0).max(24 * 60 * 60)
// Client-sent ISO date strings are ~24-33 chars; 100 is a generous cap.
const isoDateString = z.string().max(100).nullable()

const bodySchema = z.object({
  id: z.string().min(1).max(200),
  phase: z.enum(['FOCUS', 'SHORT_BREAK', 'LONG_BREAK', 'DONE']),
  status: z.enum(['IDLE', 'RUNNING', 'PAUSED']),
  focusDuration: durationSeconds,
  shortBreakDuration: durationSeconds,
  longBreakDuration: durationSeconds,
  sessionTimeout: isoDateString,
  pausedAt: isoDateString,
  resumedAt: isoDateString,
  resetedAt: isoDateString,
  remaining: durationSeconds,
  interval: isoDateString,
})

export async function getTimerState(req: Request): Promise<Response> {
  const token = parseSessionCookie(req.headers.get('cookie'))
  const user = await getSessionUser(token)

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [row] = await db
    .select({ state: timerStates.state })
    .from(timerStates)
    .where(eq(timerStates.userId, user.id))
    .limit(1)

  return Response.json({ state: row ? JSON.parse(row.state) : null })
}

export async function saveTimerState(req: Request): Promise<Response> {
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
  const state = JSON.stringify(parsed.data)

  await db
    .insert(timerStates)
    .values({ userId: user.id, state, updatedAt: now })
    .onConflictDoUpdate({
      target: timerStates.userId,
      set: { state, updatedAt: now },
    })

  return Response.json({ ok: true })
}
