import { calculateRemaining } from '@/client/features/timer/calculateRemaining'
import type { PomodoroCycle } from '@/shared/types/pomodoro-cycle'

const PHASE_DURATION_KEY = {
  FOCUS: 'focusDuration',
  SHORT_BREAK: 'shortBreakDuration',
  LONG_BREAK: 'longBreakDuration',
} as const

/**
 * Seconds of the current phase already spent. While RUNNING the stored
 * `remaining` is only as fresh as the last tick, so it's recomputed from the
 * deadline; while PAUSED the stored value is exact.
 */
export function elapsedSeconds(timer: PomodoroCycle): number {
  const planned = timer[PHASE_DURATION_KEY[timer.phase]]
  const remaining =
    timer.status === 'RUNNING' && timer.sessionTimeout
      ? calculateRemaining(timer.sessionTimeout)
      : timer.remaining

  return Math.min(planned, Math.max(0, planned - remaining))
}
