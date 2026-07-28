import { count, eq, max } from 'drizzle-orm'

import { db } from '@/server/db/client'
import { pokemonCatches } from '@/server/db/schema'
import { getSessionUser, parseSessionCookie } from '@/server/lib/session'
import { pokemonCatchesSummarySchema } from '@/shared/schemas/pokemonCatch'

export async function getPokemonCatches(req: Request): Promise<Response> {
  const token = parseSessionCookie(req.headers.get('cookie'))
  const user = await getSessionUser(token)

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rows = await db
    .select({
      speciesId: pokemonCatches.speciesId,
      count: count(pokemonCatches.id),
      lastCaughtAt: max(pokemonCatches.caughtAt),
    })
    .from(pokemonCatches)
    .where(eq(pokemonCatches.userId, user.id))
    .groupBy(pokemonCatches.speciesId)
    .orderBy(pokemonCatches.speciesId)

  // groupBy only ever emits groups with at least one row, so MAX(caughtAt)
  // can't actually be NULL here — but drizzle's aggregate return type is
  // `Date | null` (a bare SQL MAX over zero rows would be NULL), so this
  // guard exists to satisfy that type honestly rather than asserting past it.
  const withCaughtAt = rows.filter(
    (row): row is typeof row & { lastCaughtAt: Date } => row.lastCaughtAt !== null
  )

  const parsed = pokemonCatchesSummarySchema.safeParse(
    withCaughtAt.map((row) => ({
      speciesId: row.speciesId,
      count: row.count,
      lastCaughtAt: row.lastCaughtAt.toISOString(),
    }))
  )

  if (!parsed.success) {
    console.error('Failed to validate pokemon-catches response:', parsed.error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }

  return Response.json(parsed.data)
}
