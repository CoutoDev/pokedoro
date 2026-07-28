import { and, eq } from 'drizzle-orm'

import { db } from '@/server/db/client'
import { pomodoroCycles, pokemonCatches } from '@/server/db/schema'
import { isTrustedOrigin } from '@/server/lib/csrf'
import { getSessionUser, parseSessionCookie } from '@/server/lib/session'
import { rollCatch } from '@/server/pokemon/rollCatch'
import { caughtPokemonSchema } from '@/shared/schemas/pokemonCatch'
import { cyclePayloadSchema } from '@/shared/schemas/pomodoroCycle'

export async function createCycle(req: Request): Promise<Response> {
  if (!isTrustedOrigin(req)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const token = parseSessionCookie(req.headers.get('cookie'))
  const user = await getSessionUser(token)

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = cyclePayloadSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }

  const now = new Date()
  const { cycleId, phase, ...cycleData } = parsed.data

  try {
    // Atomic transaction: insert cycle and catch together, or rollback both
    const result = await db.transaction(async (tx) => {
      // Insert the completed cycle using client-supplied cycleId
      await tx.insert(pomodoroCycles).values({
        id: cycleId,
        userId: user.id,
        phase,
        ...cycleData,
        completedAt: now,
        createdAt: now,
      })

      // Roll for a species based on the phase type
      const species = rollCatch(phase)

      // Insert the caught Pokemon, linking to the cycle via cycleId (UNIQUE constraint)
      await tx.insert(pokemonCatches).values({
        id: crypto.randomUUID(),
        userId: user.id,
        cycleId,
        speciesId: species.id,
        caughtAt: now,
      })

      return { speciesId: species.id, caughtAt: now.toISOString() }
    })

    return Response.json({ ok: true, catch: result }, { status: 201 })
  } catch (error) {
    // Detect UNIQUE/PRIMARY KEY constraint violations (idempotency)
    // This can occur if the same cycleId is POSTed twice (network retry)
    const err = error as { code?: string; message?: string; errno?: number }

    if (
      err.code === 'SQLITE_CONSTRAINT_UNIQUE' ||
      err.code === 'SQLITE_CONSTRAINT_PRIMARYKEY'
    ) {
      // Query for the existing catch record by cycleId AND userId
      // This ensures we only return data for the current user's cycle, preventing cross-user data leaks
      const existing = await db
        .select()
        .from(pokemonCatches)
        .where(and(eq(pokemonCatches.cycleId, cycleId), eq(pokemonCatches.userId, user.id)))
        .then((rows) => rows[0])

      if (existing) {
        // Return 200 OK with existing catch data (idempotent behavior)
        const catchData = caughtPokemonSchema.parse({
          speciesId: existing.speciesId,
          caughtAt: existing.caughtAt.toISOString(),
        })
        return Response.json({ ok: true, catch: catchData }, { status: 200 })
      }

      // cycleId collision against another user's data, or genuine constraint violation without recovery
      // Do NOT leak the other user's data; treat as a conflict that user should retry on next phase
      console.error('Constraint violation: cycleId collision or data integrity anomaly', {
        userId: user.id,
        cycleId,
        phase: parsed.data.phase,
        error: err,
      })
      return Response.json(
        { ok: false, error: 'Couldn\'t catch it — try again' },
        { status: 409 }
      )
    }

    // Any other database error
    console.error('Failed to record cycle and catch', {
      userId: user.id,
      cycleId,
      phase: parsed.data.phase,
      error: err,
    })
    return Response.json(
      { ok: false, error: 'Couldn\'t catch it — try again' },
      { status: 500 }
    )
  }
}
