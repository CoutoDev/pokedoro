export type Pomodoro = {
  phase: 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK' | 'DONE'
  status: 'RUNNING' | 'PAUSED' | 'IDLE'
  completedSessions: number
  totalSessions: number
  focusDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  sectionTimeout: Date | null
  pausedAt: Date | null
  remaining: number
}
