import type { CycleStats, PhaseRecord } from '@/shared/schemas/cycleStats'
import { FOCUSES_PER_SET, groupIntoSets } from '@/shared/stats/groupIntoSets'

/** Aggregates a user's phase records into the numbers shown on the stats view. */
export function computeStats(records: PhaseRecord[]): CycleStats {
  const byPhase: CycleStats['byPhase'] = {
    FOCUS: { completed: 0, stopped: 0 },
    SHORT_BREAK: { completed: 0, stopped: 0 },
    LONG_BREAK: { completed: 0, stopped: 0 },
  }
  let focusSecondsCompleted = 0
  let focusSecondsStopped = 0
  const species = new Set<number>()
  let totalCatches = 0

  for (const r of records) {
    byPhase[r.phase][r.outcome === 'COMPLETED' ? 'completed' : 'stopped'] += 1

    if (r.phase === 'FOCUS') {
      if (r.outcome === 'COMPLETED') focusSecondsCompleted += r.elapsedSeconds
      else focusSecondsStopped += r.elapsedSeconds
    }
    if (r.speciesId !== null) {
      totalCatches += 1
      species.add(r.speciesId)
    }
  }

  const focusTotal = byPhase.FOCUS.completed + byPhase.FOCUS.stopped

  return {
    completedSets: groupIntoSets(records).filter((s) => s.complete).length,
    focusTowardNextSet: byPhase.FOCUS.completed % FOCUSES_PER_SET,
    byPhase,
    focusCompletionRate: focusTotal === 0 ? null : byPhase.FOCUS.completed / focusTotal,
    focusSecondsCompleted,
    focusSecondsStopped,
    totalCatches,
    uniqueSpecies: species.size,
  }
}
