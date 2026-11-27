import { describe, expect, it, spyOn } from 'bun:test'

import { db } from '@/server/db/client'
import { pokemonCatches, pomodoroCycles, users } from '@/server/db/schema'
import { createSession, SESSION_COOKIE_NAME } from '@/server/lib/session'
import * as sets from '@/shared/stats/computeStats'

import { getCycleStats } from './cycleStats'

async function createUserWithSession(email: string) {
  const id = crypto.randomUUID()
  const now = new Date()
  await db.insert(users).values({ id, email, createdAt: now, updatedAt: now })
  return { id, token: await createSession(id) }
}

function getRequest(token?: string) {
  const req = new Request('http://localhost/api/cycle-stats')
  if (token) req.headers.append('cookie', `${SESSION_COOKIE_NAME}=${token}`)
  return req
}

let minute = 0
async function insertPhase(userId: string, phase: string, outcome: 'COMPLETED' | 'STOPPED', speciesId?: number) {
  const id = crypto.randomUUID()
  const at = new Date(Date.UTC(2026, 0, 1, 0, ++minute))
  await db.insert(pomodoroCycles).values({
    id, userId, phase,
    focusDuration: 1500, shortBreakDuration: 300, longBreakDuration: 900,
    completedAt: at, createdAt: at, outcome,
    elapsedSeconds: outcome === 'COMPLETED' ? 1500 : 200,
  })
  if (speciesId) {
    await db.insert(pokemonCatches).values({ id: crypto.randomUUID(), userId, cycleId: id, speciesId, caughtAt: at })
  }
}

describe('getCycleStats', () => {
  it('returns 401 without a session', async () => {
    expect((await getCycleStats(getRequest())).status).toBe(401)
  })

  it('returns zeroed stats for a user with no history', async () => {
    const { token } = await createUserWithSession('stats-empty@example.com')

    const body = await (await getCycleStats(getRequest(token))).json()

    expect(body.sets).toEqual([])
    expect(body.stats).toMatchObject({ completedSets: 0, focusCompletionRate: null, totalCatches: 0 })
  })

  it('aggregates completed and stopped phases and pairs catches with phases', async () => {
    const { id, token } = await createUserWithSession('stats-data@example.com')
    for (let i = 0; i < 4; i++) await insertPhase(id, 'FOCUS', 'COMPLETED', 25)
    await insertPhase(id, 'LONG_BREAK', 'COMPLETED', 7)
    await insertPhase(id, 'FOCUS', 'STOPPED')

    const res = await getCycleStats(getRequest(token))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.stats.completedSets).toBe(1)
    expect(body.stats.byPhase.FOCUS).toEqual({ completed: 4, stopped: 1 })
    expect(body.stats.uniqueSpecies).toBe(2)
    // Most recent set first: the open set holds only the stopped focus.
    expect(body.sets[0].complete).toBe(false)
    expect(body.sets[0].phases[0]).toMatchObject({ outcome: 'STOPPED', speciesId: null, elapsedSeconds: 200 })
    expect(body.sets[1].phases.map((p: { speciesId: number }) => p.speciesId)).toEqual([25, 25, 25, 25, 7])
  })

  it("does not include other users' phases", async () => {
    const a = await createUserWithSession('stats-iso-a@example.com')
    const b = await createUserWithSession('stats-iso-b@example.com')
    await insertPhase(a.id, 'FOCUS', 'COMPLETED', 1)

    const body = await (await getCycleStats(getRequest(b.token))).json()

    expect(body.stats.byPhase.FOCUS.completed).toBe(0)
  })

  it('returns 500 when the response fails validation', async () => {
    const { token } = await createUserWithSession('stats-bad@example.com')
    const err = spyOn(console, 'error').mockImplementation(() => {})
    const compute = spyOn(sets, 'computeStats').mockReturnValue({} as never)

    const res = await getCycleStats(getRequest(token))

    compute.mockRestore()
    err.mockRestore()
    expect(res.status).toBe(500)
  })
})
