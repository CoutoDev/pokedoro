import type { Phase } from '@/shared/types/pomodoro-cycle'

type PhaseDurations = {
  phase: Phase
  focusDuration: number
  shortBreakDuration: number
  longBreakDuration: number
}

/** The duration a phase was configured to run for, in seconds. */
export function plannedSeconds(row: PhaseDurations): number {
  switch (row.phase) {
    case 'FOCUS':
      return row.focusDuration
    case 'SHORT_BREAK':
      return row.shortBreakDuration
    case 'LONG_BREAK':
      return row.longBreakDuration
  }
}
