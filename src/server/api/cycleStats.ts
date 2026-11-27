import { eq } from 'drizzle-orm'

import { db } from '@/server/db/client'
import { pokemonCatches, pomodoroCycles } from '@/server/db/schema'
import { plannedSeconds } from '@/server/lib/plannedSeconds'
import { getSessionUser, parseSessionCookie } from '@/server/lib/session'
import { cycleStatsResponseSchema, outcomeSchema, type PhaseRecord } from '@/shared/schemas/cycleStats'
import { computeStats } from '@/shared/stats/computeStats'
import { groupIntoSets } from '@/shared/stats/groupIntoSets'

/** How many of the most recent sets are returned with the aggregates. */
const RECENT_SETS = 20

export async function getCycleStats(req: Request): Promise<Response> {
  const user = await getSessionUser(parseSessionCookie(req.headers.get('cookie')))
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // LEFT JOIN: stopped phases have no catch row.
  const rows = await db
    .select({
      cycle: pomodoroCycles,
      speciesId: pokemonCatches.speciesId,
    })
    .from(pomodoroCycles)
    .leftJoin(pokemonCatches, eq(pokemonCatches.cycleId, pomodoroCycles.id))
    .where(eq(pomodoroCycles.userId, user.id))

  const records: PhaseRecord[] = rows.map(({ cycle, speciesId }) => ({
    cycleId: cycle.id,
    phase: cycle.phase as PhaseRecord['phase'],
    outcome: outcomeSchema.catch('COMPLETED').parse(cycle.outcome),
    plannedSeconds: plannedSeconds(cycle as Parameters<typeof plannedSeconds>[0]),
    elapsedSeconds: cycle.elapsedSeconds,
    endedAt: cycle.completedAt.toISOString(),
    speciesId,
  }))

  const parsed = cycleStatsResponseSchema.safeParse({
    stats: computeStats(records),
    sets: groupIntoSets(records).slice(-RECENT_SETS).reverse(),
  })

  if (!parsed.success) {
    console.error('Failed to validate cycle stats response:', parsed.error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }

  return Response.json(parsed.data)
}
