import type { PhaseRecord, PomodoroSet } from '@/shared/schemas/cycleStats'

/** A classic Pomodoro cycle is this many completed focus sessions. */
export const FOCUSES_PER_SET = 4

/**
 * Groups phase records into classic Pomodoro cycles ("sets").
 *
 * Rule: walking records in chronological order, a set closes (`complete`)
 * when it reaches FOCUSES_PER_SET *completed* focus sessions. Breaks and
 * stopped phases attach to the set that is open at that moment. The long
 * break that traditionally ends a set belongs to it when it directly follows
 * the closing focus session; anything else starts the next set.
 *
 * Input need not be sorted. Returned sets are chronological.
 */
export function groupIntoSets(records: PhaseRecord[]): PomodoroSet[] {
  const sorted = [...records].sort((a, b) => a.endedAt.localeCompare(b.endedAt))
  const sets: PomodoroSet[] = []

  for (const record of sorted) {
    let current = sets[sets.length - 1]
    const closedAwaitingLongBreak =
      current?.complete &&
      record.phase === 'LONG_BREAK' &&
      !current.phases.some((p) => p.phase === 'LONG_BREAK')

    if (!current || (current.complete && !closedAwaitingLongBreak)) {
      current = { index: sets.length + 1, complete: false, focusCompleted: 0, phases: [] }
      sets.push(current)
    }

    current.phases.push(record)
    if (record.phase === 'FOCUS' && record.outcome === 'COMPLETED') {
      current.focusCompleted += 1
      if (current.focusCompleted === FOCUSES_PER_SET) current.complete = true
    }
  }

  return sets
}
