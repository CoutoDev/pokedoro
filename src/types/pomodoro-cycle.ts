import type { RefObject } from "react"

export type Phase = 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK' | 'DONE';
export type Status = 'IDLE' | 'RUNNING' | 'PAUSED';


export type PomodoroCycle = {
  phase: Phase
  status: Status
  focusDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  sessionTimeout: Date | null
  pausedAt: Date | null
  resumedAt: Date | null
  resetedAt: Date | null
  remaining: number
  interval: Date | null
}

export type TimerAction =
  | { type: 'START_FOCUS'; payload: Pick<PomodoroCycle, 'focusDuration' | 'remaining'|'sessionTimeout'> }
  | { type: 'TICK'; payload: { now: Date } }
  | { type: 'PAUSE'; payload: Pick<PomodoroCycle, 'pausedAt'>}
  | { type: 'RESUME'; payload: Pick<PomodoroCycle, 'resumedAt'> }
  | { type: 'COMPLETE_SESSION' }
  | { type: 'RESET' }
  | { type: 'SET_DURATION'; payload: Pick<PomodoroCycle, 'focusDuration'> };