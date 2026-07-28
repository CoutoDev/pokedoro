import { describe, expect, it } from 'bun:test'
import { eq } from 'drizzle-orm'

import { db } from '@/server/db/client'
import { pomodoroCycles, pokemonCatches, users } from '@/server/db/schema'
import { createSession, SESSION_COOKIE_NAME } from '@/server/lib/session'
import { caughtPokemonSchema } from '@/shared/schemas/pokemonCatch'

import { createCycle } from './cycles'

async function createUserWithSession(email: string) {
  const id = crypto.randomUUID()
  const now = new Date()

  await db.insert(users).values({ id, email, createdAt: now, updatedAt: now })
  const token = await createSession(id)

  return { id, token }
}

/**
 * happy-dom's `Request` (registered globally for DOM tests) strips the
 * `cookie` header when it's passed via the constructor's `headers` init, as
 * it's a forbidden request-header name per the Fetch spec. Appending it to
 * `req.headers` after construction isn't guarded, so this is the only way to
 * simulate an authenticated request in this environment.
 */
function postRequest(body: unknown, token?: string) {
  const req = new Request('http://localhost/api/cycles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
  if (token) req.headers.append('cookie', `${SESSION_COOKIE_NAME}=${token}`)

  return req
}

describe('createCycle', () => {
  it('returns 403 when the request comes from an untrusted origin', async () => {
    const req = postRequest({})
    req.headers.append('origin', 'https://evil.example.com')

    const res = await createCycle(req)

    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'Forbidden' })
  })

  it('returns 401 when there is no session cookie', async () => {
    const res = await createCycle(postRequest({}))

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized' })
  })

  it('returns 400 when the request body fails validation', async () => {
    const { id, token } = await createUserWithSession('cycles-invalid@example.com')

    const res = await createCycle(postRequest({
      phase: 'NOT_A_PHASE',
      cycleId: 'test-cycle-1',
      focusDuration: 1500,
      shortBreakDuration: 300,
      longBreakDuration: 900,
    }, token))

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid request' })

    // Verify no cycles or catches were inserted (validation prevented any DB writes)
    const cycles = await db.select().from(pomodoroCycles).where(eq(pomodoroCycles.userId, id))
    const catches = await db.select().from(pokemonCatches).where(eq(pokemonCatches.userId, id))
    expect(cycles).toHaveLength(0)
    expect(catches).toHaveLength(0)
  })

  it('returns 400 when cycleId is missing', async () => {
    const { token } = await createUserWithSession('cycles-nocycleid@example.com')

    const res = await createCycle(postRequest({
      phase: 'FOCUS',
      focusDuration: 1500,
      shortBreakDuration: 300,
      longBreakDuration: 900,
    }, token))

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid request' })
  })

  it('returns 400 when the request body is not valid JSON', async () => {
    const { token } = await createUserWithSession('cycles-badjson@example.com')

    const res = await createCycle(postRequest('not json', token))

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid request' })
  })

  it('persists a completed cycle and catch for the authenticated user', async () => {
    const { id, token } = await createUserWithSession('cycles-user@example.com')
    const cycleId = crypto.randomUUID()

    const res = await createCycle(postRequest({
      cycleId,
      phase: 'FOCUS',
      focusDuration: 1500,
      shortBreakDuration: 300,
      longBreakDuration: 900,
    }, token))

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body).toEqual({
      ok: true,
      catch: expect.objectContaining({
        speciesId: expect.any(Number),
        caughtAt: expect.any(String),
      }),
    })

    // Verify cycle was inserted with client-supplied cycleId
    const [cycle] = await db
      .select()
      .from(pomodoroCycles)
      .where(eq(pomodoroCycles.userId, id))
    expect(cycle).toBeDefined()
    expect(cycle?.id).toBe(cycleId)
    expect(cycle).toMatchObject({
      userId: id,
      phase: 'FOCUS',
      focusDuration: 1500,
      shortBreakDuration: 300,
      longBreakDuration: 900,
    })

    // Verify catch was inserted with the same cycleId
    const [catchRecord] = await db
      .select()
      .from(pokemonCatches)
      .where(eq(pokemonCatches.cycleId, cycleId))
    expect(catchRecord).toBeDefined()
    expect(catchRecord?.userId).toBe(id)
    expect(catchRecord?.cycleId).toBe(cycleId)
    expect(catchRecord?.speciesId).toBeGreaterThanOrEqual(1)
    expect(catchRecord?.speciesId).toBeLessThanOrEqual(151)

    // Verify response catch data matches database
    const parsed = caughtPokemonSchema.parse(body.catch)
    expect(parsed.speciesId).toBe(catchRecord!.speciesId)
  })

  it('returns 200 with existing catch when duplicate cycleId is POSTed (idempotency)', async () => {
    const { id, token } = await createUserWithSession('cycles-idempotent@example.com')
    const cycleId = crypto.randomUUID()

    // First POST
    const res1 = await createCycle(postRequest({
      cycleId,
      phase: 'FOCUS',
      focusDuration: 1500,
      shortBreakDuration: 300,
      longBreakDuration: 900,
    }, token))

    expect(res1.status).toBe(201)
    const body1 = await res1.json()
    expect(body1.ok).toBe(true)
    const catch1 = body1.catch

    // Second POST with same cycleId (simulates network retry)
    const res2 = await createCycle(postRequest({
      cycleId,
      phase: 'FOCUS',
      focusDuration: 1500,
      shortBreakDuration: 300,
      longBreakDuration: 900,
    }, token))

    expect(res2.status).toBe(200) // Idempotent: returns 200, not 409
    const body2 = await res2.json()
    expect(body2.ok).toBe(true)
    // Same catch data (speciesId matches, timestamp may differ due to DB precision)
    expect(body2.catch.speciesId).toBe(catch1.speciesId)
    expect(body2.catch.caughtAt).toBeDefined()

    // Verify exactly one catch row exists (no duplicate)
    const catches = await db
      .select()
      .from(pokemonCatches)
      .where(eq(pokemonCatches.cycleId, cycleId))
    expect(catches).toHaveLength(1)
  })

  it('rolls back cycle and catch on constraint violation for duplicate cycleId on PRIMARY KEY', async () => {
    const { id, token } = await createUserWithSession('cycles-rollback@example.com')
    const cycleId = 'test-cycle-duplicate'

    // Insert a cycle directly
    const now = new Date()
    await db.insert(pomodoroCycles).values({
      id: cycleId,
      userId: id,
      phase: 'FOCUS',
      focusDuration: 1500,
      shortBreakDuration: 300,
      longBreakDuration: 900,
      completedAt: now,
      createdAt: now,
    })

    // Try to POST with same cycleId (should fail on cycle insert, trigger idempotency lookup)
    const res = await createCycle(postRequest({
      cycleId,
      phase: 'FOCUS',
      focusDuration: 1500,
      shortBreakDuration: 300,
      longBreakDuration: 900,
    }, token))

    // Should return 409 Conflict (no existing catch found for current user + cycleId)
    // This indicates a constraint violation that we couldn't recover from (no idempotent data found)
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.ok).toBe(false)
    expect(body.error).toBe('Couldn\'t catch it — try again')

    // Verify no duplicate cycles or catches were created
    const cycles = await db
      .select()
      .from(pomodoroCycles)
      .where(eq(pomodoroCycles.id, cycleId))
    expect(cycles).toHaveLength(1)

    const catches = await db
      .select()
      .from(pokemonCatches)
      .where(eq(pokemonCatches.cycleId, cycleId))
    expect(catches).toHaveLength(0)
  })

  it('verifies idempotency on duplicate POST: no duplicates created when catch recovery lookup succeeds', async () => {
    const { id, token } = await createUserWithSession('cycles-idempotent-both-tables@example.com')
    const cycleId = crypto.randomUUID()

    // Step 1: Successfully POST a cycle with cycleId, creating both cycle and catch
    const res1 = await createCycle(postRequest({
      cycleId,
      phase: 'FOCUS',
      focusDuration: 1500,
      shortBreakDuration: 300,
      longBreakDuration: 900,
    }, token))

    expect(res1.status).toBe(201)
    const cycles1 = await db
      .select()
      .from(pomodoroCycles)
      .where(eq(pomodoroCycles.userId, id))
    const catches1 = await db
      .select()
      .from(pokemonCatches)
      .where(eq(pokemonCatches.userId, id))

    expect(cycles1).toHaveLength(1)
    expect(catches1).toHaveLength(1)

    // Step 2: Try to POST again with same cycleId (network retry / duplicate request)
    // The cycle insert will fail (PRIMARY KEY on pomodoro_cycles.id)
    // Recovery lookup finds existing catch, returns 200 idempotent
    const res2 = await createCycle(postRequest({
      cycleId,
      phase: 'FOCUS',
      focusDuration: 1500,
      shortBreakDuration: 300,
      longBreakDuration: 900,
    }, token))

    // Should return 200 idempotent (not 500, because recovery lookup finds existing catch)
    expect(res2.status).toBe(200)
    const body2 = await res2.json()
    expect(body2.ok).toBe(true)

    // Verify NO new rows were created (idempotency: exactly same counts as before)
    const cycles2 = await db
      .select()
      .from(pomodoroCycles)
      .where(eq(pomodoroCycles.userId, id))
    const catches2 = await db
      .select()
      .from(pokemonCatches)
      .where(eq(pokemonCatches.userId, id))

    // Still only 1 cycle and 1 catch (no duplicates created on second POST)
    expect(cycles2).toHaveLength(1)
    expect(catches2).toHaveLength(1)
  })

  it('does not leak another user\'s catch data on cycleId collision', async () => {
    const { id: userId1, token: token1 } = await createUserWithSession('cycles-user1@example.com')
    const { token: token2 } = await createUserWithSession('cycles-user2@example.com')

    const cycleId = crypto.randomUUID()

    // User 1 successfully creates a cycle and catch with cycleId
    const res1 = await createCycle(postRequest({
      cycleId,
      phase: 'FOCUS',
      focusDuration: 1500,
      shortBreakDuration: 300,
      longBreakDuration: 900,
    }, token1))

    expect(res1.status).toBe(201)
    const body1 = await res1.json()
    const user1Catch = body1.catch
    expect(user1Catch).toBeDefined()

    // User 2 attempts to POST with the SAME cycleId (collision attack / race condition)
    // Recovery lookup should filter by userId and NOT return User 1's catch data
    const res2 = await createCycle(postRequest({
      cycleId,
      phase: 'FOCUS',
      focusDuration: 1500,
      shortBreakDuration: 300,
      longBreakDuration: 900,
    }, token2))

    // Should return 409 Conflict (no matching row for current user + cycleId)
    expect(res2.status).toBe(409)
    const body2 = await res2.json()
    expect(body2.ok).toBe(false)

    // CRITICAL: Verify User 1's catch data is NOT leaked to User 2
    // If the bug exists, body2.catch would equal user1Catch (data leak)
    expect(body2.catch).toBeUndefined()

    // Verify User 1 still has exactly 1 catch (no duplicates from User 2's attempt)
    const user1Catches = await db
      .select()
      .from(pokemonCatches)
      .where(eq(pokemonCatches.userId, userId1))
    expect(user1Catches).toHaveLength(1)
  })
})
