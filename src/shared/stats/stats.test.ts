import { describe, expect, it } from 'bun:test'

import type { PhaseRecord } from '@/shared/schemas/cycleStats'

import { computeStats } from './computeStats'
import { FOCUSES_PER_SET, groupIntoSets } from './groupIntoSets'

let n = 0
function rec(phase: PhaseRecord['phase'], outcome: PhaseRecord['outcome'] = 'COMPLETED', speciesId: number | null = null): PhaseRecord {
  n += 1
  const planned = phase === 'FOCUS' ? 1500 : phase === 'SHORT_BREAK' ? 300 : 900
  return {
    cycleId: `c${n}`,
    phase,
    outcome,
    plannedSeconds: planned,
    elapsedSeconds: outcome === 'COMPLETED' ? planned : 100,
    endedAt: new Date(2026, 0, 1, 0, n).toISOString(),
    speciesId: outcome === 'COMPLETED' ? (speciesId ?? 25) : null,
  }
}

const classicSet = () => [
  rec('FOCUS'), rec('SHORT_BREAK'),
  rec('FOCUS'), rec('SHORT_BREAK'),
  rec('FOCUS'), rec('SHORT_BREAK'),
  rec('FOCUS'), rec('LONG_BREAK'),
]

describe('groupIntoSets', () => {
  it('returns no sets for no records', () => {
    expect(groupIntoSets([])).toEqual([])
  })

  it('closes a set after FOCUSES_PER_SET completed focus sessions and keeps its long break', () => {
    const sets = groupIntoSets(classicSet())

    expect(FOCUSES_PER_SET).toBe(4)
    expect(sets).toHaveLength(1)
    expect(sets[0]).toMatchObject({ index: 1, complete: true, focusCompleted: 4 })
    expect(sets[0]!.phases).toHaveLength(8)
  })

  it('starts the next set after a closed one and leaves it in progress', () => {
    const sets = groupIntoSets([...classicSet(), rec('FOCUS')])

    expect(sets.map((s) => [s.index, s.complete, s.focusCompleted])).toEqual([[1, true, 4], [2, false, 1]])
  })

  it('does not count stopped focus sessions toward the set', () => {
    const sets = groupIntoSets([rec('FOCUS', 'STOPPED'), rec('FOCUS'), rec('FOCUS'), rec('FOCUS'), rec('FOCUS')])

    expect(sets[0]).toMatchObject({ complete: true, focusCompleted: 4 })
    expect(sets[0]!.phases).toHaveLength(5)
  })

  it('only attaches one long break to a closed set; a second starts a new set', () => {
    const sets = groupIntoSets([...classicSet(), rec('LONG_BREAK')])

    expect(sets).toHaveLength(2)
  })

  it('starts a new set when a short break follows a closed set', () => {
    const sets = groupIntoSets([rec('FOCUS'), rec('FOCUS'), rec('FOCUS'), rec('FOCUS'), rec('SHORT_BREAK')])

    expect(sets).toHaveLength(2)
  })

  it('sorts unsorted input chronologically', () => {
    const sets = groupIntoSets(classicSet().reverse())

    expect(sets).toHaveLength(1)
    expect(sets[0]!.phases[0]!.phase).toBe('FOCUS')
  })
})

describe('computeStats', () => {
  it('returns zeros and a null rate for no records', () => {
    expect(computeStats([])).toMatchObject({
      completedSets: 0,
      focusTowardNextSet: 0,
      focusCompletionRate: null,
      totalCatches: 0,
      uniqueSpecies: 0,
    })
  })

  it('aggregates completions, stops, time, and catches', () => {
    const stats = computeStats([
      ...classicSet(), // 4 focus, 3 short, 1 long, all caught species 25
      rec('FOCUS'),
      rec('FOCUS', 'STOPPED'),
      rec('SHORT_BREAK', 'STOPPED'),
      rec('FOCUS', 'COMPLETED', 7),
    ])

    expect(stats.completedSets).toBe(1)
    expect(stats.focusTowardNextSet).toBe(2) // 6 completed focus % 4
    expect(stats.byPhase.FOCUS).toEqual({ completed: 6, stopped: 1 })
    expect(stats.byPhase.SHORT_BREAK).toEqual({ completed: 3, stopped: 1 })
    expect(stats.byPhase.LONG_BREAK).toEqual({ completed: 1, stopped: 0 })
    expect(stats.focusCompletionRate).toBeCloseTo(6 / 7)
    expect(stats.focusSecondsCompleted).toBe(6 * 1500)
    expect(stats.focusSecondsStopped).toBe(100)
    expect(stats.totalCatches).toBe(10)
    expect(stats.uniqueSpecies).toBe(2)
  })
})
