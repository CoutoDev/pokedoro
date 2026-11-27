import { and, eq } from 'drizzle-orm'

import { db } from '@/server/db/client'
import { pomodoroCycles } from '@/server/db/schema'
import { isTrustedOrigin } from '@/server/lib/csrf'
import { plannedSeconds } from '@/server/lib/plannedSeconds'
import { getSessionUser, parseSessionCookie } from '@/server/lib/session'
import { stoppedCyclePayloadSchema } from '@/shared/schemas/pomodoroCycle'

/**
 * Records a phase the user reset before it finished. Stopped phases earn no
 * Pokémon catch. Idempotent on `cycleId`: a retried POST by the same user
 * returns 200 instead of failing on the primary key.
 */
export async function createStoppedCycle(req: Request): Promise<Response> {
  if (!isTrustedOrigin(req)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const user = await getSessionUser(parseSessionCookie(req.headers.get('cookie')))
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = stoppedCyclePayloadSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { cycleId, phase, elapsedSeconds, ...durations } = parsed.data
  const now = new Date()

  try {
    await db.insert(pomodoroCycles).values({
      id: cycleId,
      userId: user.id,
      phase,
      ...durations,
      completedAt: now,
      createdAt: now,
      outcome: 'STOPPED',
      // A phase that ran to its full length is a completion, not a stop.
      elapsedSeconds: Math.min(elapsedSeconds, plannedSeconds({ phase, ...durations })),
    })
    return Response.json({ ok: true }, { status: 201 })
  } catch (error) {
    const err = error as { code?: string }
    if (err.code === 'SQLITE_CONSTRAINT_PRIMARYKEY' || err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      const existing = await db
        .select({ id: pomodoroCycles.id })
        .from(pomodoroCycles)
        .where(and(eq(pomodoroCycles.id, cycleId), eq(pomodoroCycles.userId, user.id)))
        .then((rows) => rows[0])

      if (existing) return Response.json({ ok: true }, { status: 200 })
      return Response.json({ ok: false, error: 'Conflict' }, { status: 409 })
    }

    console.error('Failed to record stopped cycle', { userId: user.id, cycleId, error: err })
    return Response.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
