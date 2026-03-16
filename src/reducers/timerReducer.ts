import { calculateRemaining } from '@/utils/calculateRemaining'
import type { PomodoroCycle } from '../types/pomodoro-cycle'

export type TimerAction =
  | {
      type: 'START_FOCUS'
      payload: Pick<PomodoroCycle, 'focusDuration' | 'remaining'>
    }
  | { type: 'TICK' }
  | { type: 'PAUSE'; payload: Pick<PomodoroCycle, 'pausedAt'> }
  | { type: 'RESUME'; payload: Pick<PomodoroCycle, 'resumedAt'> }
  | { type: 'COMPLETE_SESSION' }
  | { type: 'RESET' }
  | { type: 'SET_DURATION'; payload: Pick<PomodoroCycle, 'focusDuration'> }
  | { type: 'START_BREAK' }
  | { type: 'START_LONG_BREAK' }


export function timerReducer(
  state: PomodoroCycle,
  action: TimerAction,
): PomodoroCycle {
  switch (action.type) {
    case 'START_FOCUS':
      const focusDuration = action.payload.focusDuration
        ? action.payload.focusDuration
        : state.focusDuration
      const timeout = new Date(Date.now() + focusDuration * 1000)

      return {
        ...state,
        focusDuration: focusDuration,
        remaining: focusDuration,
        sessionTimeout: timeout,
        status: 'RUNNING',
        id: state.id || crypto.randomUUID(),
      }

    case 'START_BREAK':
      const shortBreakDuration = state.shortBreakDuration
      const shortBreakTimeout = new Date(Date.now() + shortBreakDuration * 1000)

      return {
        ...state,
        phase: 'SHORT_BREAK',
        remaining: shortBreakDuration,
        sessionTimeout: shortBreakTimeout,
        status: 'RUNNING',
        id: state.id || crypto.randomUUID(),
      }

    case 'START_LONG_BREAK':
      const longBreakDuration = state.longBreakDuration
      const longBreakTimeout = new Date(Date.now() + longBreakDuration * 1000)

      return {
        ...state,
        phase: 'LONG_BREAK',
        remaining: longBreakDuration,
        sessionTimeout: longBreakTimeout,
        status: 'RUNNING',
        id: state.id || crypto.randomUUID(),
      }

    case 'PAUSE':
      if (state.status !== 'RUNNING') return state

      return {
        ...state,
        pausedAt: action.payload.pausedAt,
        remaining: calculateRemaining(
          state.sessionTimeout,
          state.focusDuration,
        ),
        status: 'PAUSED',
      }

    case 'RESUME':
      if (
        state.status !== 'PAUSED' ||
        !state.pausedAt ||
        !action.payload.resumedAt ||
        !state.sessionTimeout
      )
        return state

      const pausedDuration = Date.now() - state.pausedAt.getTime()
      const adjustedTimeout = new Date(
        state.sessionTimeout.getTime() + pausedDuration,
      )

      return {
        ...state,
        resumedAt: action.payload.resumedAt,
        remaining: calculateRemaining(adjustedTimeout, state.focusDuration),
        sessionTimeout: adjustedTimeout,
        status: 'RUNNING',
      }

    case 'RESET':
      return {
        ...state,
        pausedAt: null,
        resumedAt: null,
        status: 'IDLE',
        resetedAt: new Date(),
        remaining: state.focusDuration,
        id: crypto.randomUUID(),
      }

    case 'SET_DURATION':
      const duration = action.payload.focusDuration * 60

      return {
        ...state,
        focusDuration: duration,
        remaining: duration,
      }

    case 'TICK':
      const now = new Date()
      const diff = state.sessionTimeout!.getTime() - now.getTime()
      const remaining = Math.max(0, Math.ceil(diff / 1000))

      if (remaining === 0) {
        return {
          ...state,
          remaining: 0,
          status: 'IDLE',
        }
      }

      return {
        ...state,
        remaining: remaining,
      }

    default:
      return state
  }
}
