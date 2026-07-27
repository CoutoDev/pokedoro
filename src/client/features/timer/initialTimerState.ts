import type { PomodoroCycle } from "@/shared/types/pomodoro-cycle"

export const initialTimerState: PomodoroCycle = {
  id: crypto.randomUUID(),
  phase: 'FOCUS',
  status: 'IDLE',
  focusDuration: 25 * 60,
  shortBreakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  sessionTimeout: null,
  pausedAt: null,
  resumedAt: null,
  resetAt: null,
  remaining: 25 * 60,
}
