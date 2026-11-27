import { afterEach, describe, expect, it, mock, spyOn } from 'bun:test'
import { act, cleanup, render, screen } from '@testing-library/react'

import { AuthContext } from '@/client/features/auth/AuthContext/AuthContext'
import type { AuthState } from '@/client/features/auth/authReducer'
import type { CycleStatsResponse, PhaseRecord } from '@/shared/schemas/cycleStats'

import Stats from './Stats'
import StatsHistory from './StatsHistory'
import StatsSummary from './StatsSummary'

const flush = () => act(async () => { await Bun.sleep(0) })

const signedIn: AuthState = {
  user: { id: 'u1', email: 'a@b.com', createdAt: new Date(), updatedAt: new Date() },
  status: 'authenticated',
  error: null,
}

const renderStats = (auth: AuthState) =>
  render(<AuthContext.Provider value={{ auth, authDispatch: () => {} }}><Stats /></AuthContext.Provider>)

const phase = (overrides: Partial<PhaseRecord>): PhaseRecord => ({
  cycleId: crypto.randomUUID(), phase: 'FOCUS', outcome: 'COMPLETED',
  plannedSeconds: 1500, elapsedSeconds: 1500, endedAt: '2026-01-01T00:00:00.000Z', speciesId: 25, ...overrides,
})

const response: CycleStatsResponse = {
  stats: {
    completedSets: 2, focusTowardNextSet: 1,
    byPhase: { FOCUS: { completed: 9, stopped: 1 }, SHORT_BREAK: { completed: 6, stopped: 0 }, LONG_BREAK: { completed: 2, stopped: 1 } },
    focusCompletionRate: 0.9, focusSecondsCompleted: 13500, focusSecondsStopped: 120, totalCatches: 17, uniqueSpecies: 12,
  },
  sets: [
    {
      index: 1, complete: false, focusCompleted: 1,
      phases: [phase({}), phase({ outcome: 'STOPPED', speciesId: null, elapsedSeconds: 120 })],
    },
  ],
}

afterEach(() => {
  cleanup()
  mock.restore()
})

describe('Stats', () => {
  it('prompts signed-out users and does not fetch', () => {
    const fetchSpy = spyOn(globalThis, 'fetch')

    renderStats({ user: null, status: 'unauthenticated', error: null })

    expect(screen.getByText(/sign in to see your stats/i)).not.toBeNull()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('shows loading, then the summary and history', async () => {
    ;(spyOn(globalThis, 'fetch') as any).mockImplementation(async () => Response.json(response))

    renderStats(signedIn)
    expect(screen.getByText(/loading your stats/i)).not.toBeNull()
    await flush()

    expect(screen.getByText('Cycles completed')).not.toBeNull()
    expect(screen.getByText('Cycle 1')).not.toBeNull()
  })

  it('shows an error when the request fails', async () => {
    spyOn(console, 'error').mockImplementation(() => {})
    ;(spyOn(globalThis, 'fetch') as any).mockImplementation(async () => Response.json({}, { status: 500 }))

    renderStats(signedIn)
    await flush()

    expect(screen.getByText(/couldn't load your stats/i)).not.toBeNull()
  })
})

describe('StatsSummary', () => {
  it('renders the headline numbers', () => {
    render(<StatsSummary stats={response.stats} />)

    expect(screen.getByText('90% finished')).not.toBeNull()
    expect(screen.getByText('1/4 focus toward next')).not.toBeNull()
    expect(screen.getByText('3h 45m')).not.toBeNull()
    expect(screen.getByText('12 species')).not.toBeNull()
  })

  it('shows a dash when there is no focus history yet', () => {
    render(<StatsSummary stats={{ ...response.stats, focusCompletionRate: null }} />)

    expect(screen.getByText('— finished')).not.toBeNull()
  })
})

describe('StatsHistory', () => {
  it('shows an empty state', () => {
    render(<StatsHistory sets={[]} />)

    expect(screen.getByText(/no cycles yet/i)).not.toBeNull()
  })

  it('lists phases with their catch, and marks stopped ones', () => {
    render(<StatsHistory sets={[
      ...response.sets,
      { index: 2, complete: true, focusCompleted: 4, phases: [phase({ phase: 'LONG_BREAK', speciesId: null })] },
    ]} />)

    expect(screen.getByText('Pikachu')).not.toBeNull()
    expect(screen.getByText('stopped at 2m of 25m')).not.toBeNull()
    expect(screen.getByText('In progress · 1/4 focus')).not.toBeNull()
    expect(screen.getByText('Complete')).not.toBeNull()
  })
})
