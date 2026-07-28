import { describe, expect, it, spyOn } from 'bun:test'

import { db } from '@/server/db/client'
import { pokemonCatches, pomodoroCycles, users } from '@/server/db/schema'
import { createSession, SESSION_COOKIE_NAME } from '@/server/lib/session'

import { getPokemonCatches } from './pokemonCatches'

async function createUserWithSession(email: string) {
  const id = crypto.randomUUID()
  const now = new Date()

  await db.insert(users).values({ id, email, createdAt: now, updatedAt: now })
  const token = await createSession(id)

  return { id, token }
}

/**
 * happy-dom's `Request` strips the `cookie` header when passed via the
 * constructor's `headers` init (a forbidden request-header name per the
 * Fetch spec); appending it after construction is the only way to simulate
 * an authenticated request here — see cycles.test.ts's postRequest helper.
 */
function getRequest(token?: string) {
  const req = new Request('http://localhost/api/pokemon-catches')
  if (token) req.headers.append('cookie', `${SESSION_COOKIE_NAME}=${token}`)

  return req
}

async function insertCatch(userId: string, speciesId: number, caughtAt: Date) {
  const cycleId = crypto.randomUUID()
  await db.insert(pomodoroCycles).values({
    id: cycleId,
    userId,
    phase: 'FOCUS',
    focusDuration: 1500,
    shortBreakDuration: 300,
    longBreakDuration: 900,
    completedAt: caughtAt,
    createdAt: caughtAt,
  })
  await db.insert(pokemonCatches).values({
    id: crypto.randomUUID(),
    userId,
    cycleId,
    speciesId,
    caughtAt,
  })
}

describe('getPokemonCatches', () => {
  it('returns 401 when there is no session cookie', async () => {
    const res = await getPokemonCatches(getRequest())

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized' })
  })

  it('returns an empty array for a user with no catches', async () => {
    const { token } = await createUserWithSession('catches-empty@example.com')

    const res = await getPokemonCatches(getRequest(token))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })

  it('groups multiple catches of the same species with count and most recent timestamp', async () => {
    const { id, token } = await createUserWithSession('catches-grouped@example.com')

    await insertCatch(id, 1, new Date('2026-01-01T00:00:00Z'))
    await insertCatch(id, 1, new Date('2026-01-02T00:00:00Z'))
    await insertCatch(id, 1, new Date('2026-01-03T00:00:00Z'))

    const res = await getPokemonCatches(getRequest(token))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual([
      { speciesId: 1, count: 3, lastCaughtAt: '2026-01-03T00:00:00.000Z' },
    ])
  })

  it('returns results sorted by speciesId ascending', async () => {
    const { id, token } = await createUserWithSession('catches-sorted@example.com')

    await insertCatch(id, 3, new Date('2026-01-01T00:00:00Z'))
    await insertCatch(id, 1, new Date('2026-01-01T00:00:00Z'))
    await insertCatch(id, 2, new Date('2026-01-01T00:00:00Z'))

    const res = await getPokemonCatches(getRequest(token))
    const body = await res.json()

    expect(body.map((row: { speciesId: number }) => row.speciesId)).toEqual([1, 2, 3])
  })

  it('isolates catches per user', async () => {
    const { id: userA, token: tokenA } = await createUserWithSession('catches-user-a@example.com')
    const { id: userB, token: tokenB } = await createUserWithSession('catches-user-b@example.com')

    await insertCatch(userA, 1, new Date('2026-01-01T00:00:00Z'))
    await insertCatch(userA, 2, new Date('2026-01-01T00:00:00Z'))
    await insertCatch(userB, 1, new Date('2026-01-01T00:00:00Z'))

    const resA = await getPokemonCatches(getRequest(tokenA))
    const resB = await getPokemonCatches(getRequest(tokenB))

    const bodyA = await resA.json()
    const bodyB = await resB.json()

    expect(bodyA).toHaveLength(2)
    expect(bodyB).toHaveLength(1)
    expect(bodyB[0].speciesId).toBe(1)
  })

  it('returns 500 when a stored row fails schema validation (e.g. an out-of-range speciesId)', async () => {
    const { id, token } = await createUserWithSession('catches-invalid-species@example.com')
    // speciesId 999 is outside the valid Gen 1 range (1-151); rollCatch never
    // produces this, but a corrupted/manually-inserted row should surface as
    // a 500, not an unhandled schema-parse throw.
    await insertCatch(id, 999, new Date('2026-01-01T00:00:00Z'))

    const consoleError = spyOn(console, 'error').mockImplementation(() => {})
    const res = await getPokemonCatches(getRequest(token))
    consoleError.mockRestore()

    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'Internal server error' })
  })
})
