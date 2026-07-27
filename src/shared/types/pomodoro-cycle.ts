export type Phase = 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK'
export type Status = 'IDLE' | 'RUNNING' | 'PAUSED'

export type PomodoroCycle = {
  id: string
  phase: Phase
  status: Status
  focusDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  sessionTimeout: Date | null
  pausedAt: Date | null
  resumedAt: Date | null
  resetAt: Date | null
  remaining: number
}
