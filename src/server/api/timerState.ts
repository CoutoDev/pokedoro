import { eq } from 'drizzle-orm'

import { db } from '@/server/db/client'
import { timerStates } from '@/server/db/schema'
import { isTrustedOrigin } from '@/server/lib/csrf'
import { getSessionUser, parseSessionCookie } from '@/server/lib/session'
import { timerStateWireSchema } from '@/shared/schemas/pomodoroCycle'

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

  const parsed = timerStateWireSchema.safeParse(await req.json().catch(() => null))
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
