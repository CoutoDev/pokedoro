import type { z } from 'zod'

import type { phaseSchema, statusSchema } from '@/shared/schemas/pomodoroCycle'

export type Phase = z.infer<typeof phaseSchema>
export type Status = z.infer<typeof statusSchema>

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
