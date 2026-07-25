import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/db/client'
import { timerStates } from '@/db/schema'
import { getSessionUser, parseSessionCookie } from '@/lib/session'

const bodySchema = z.object({
  id: z.string(),
  phase: z.enum(['FOCUS', 'SHORT_BREAK', 'LONG_BREAK', 'DONE']),
  status: z.enum(['IDLE', 'RUNNING', 'PAUSED']),
  focusDuration: z.number(),
  shortBreakDuration: z.number(),
  longBreakDuration: z.number(),
  sessionTimeout: z.string().nullable(),
  pausedAt: z.string().nullable(),
  resumedAt: z.string().nullable(),
  resetedAt: z.string().nullable(),
  remaining: z.number(),
  interval: z.string().nullable(),
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
