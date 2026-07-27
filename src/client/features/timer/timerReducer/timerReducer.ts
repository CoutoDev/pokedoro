import { calculateRemaining } from '@/client/features/timer/calculateRemaining'
import type { PomodoroCycle } from '@/shared/types/pomodoro-cycle'
import { initialTimerState } from '@/client/features/timer/TimerContext'

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
  | { type: 'SET_LONG_BREAK_DURATION'; payload: Pick<PomodoroCycle, 'longBreakDuration'> }
  | { type: 'SET_SHORT_BREAK_DURATION'; payload: Pick<PomodoroCycle, 'shortBreakDuration'> }
  | { type: 'START_BREAK' }
  | { type: 'START_LONG_BREAK' }
  | { type: 'HYDRATE'; payload: PomodoroCycle }


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
        ...initialTimerState,
      }

    case 'HYDRATE':
      return action.payload

    case 'SET_DURATION':
      const duration = action.payload.focusDuration * 60

      return {
        ...state,
        focusDuration: duration,
        remaining: duration,
      }

    case 'SET_SHORT_BREAK_DURATION':
      return {
        ...state,
        shortBreakDuration: action.payload.shortBreakDuration * 60,
      }

    case 'SET_LONG_BREAK_DURATION':
      return {
        ...state,
        longBreakDuration: action.payload.longBreakDuration * 60,
      }

    case 'TICK':
      if (state.status !== 'RUNNING' || !state.sessionTimeout) {
        return state
      }
      
      const remaining = calculateRemaining(state.sessionTimeout, state.focusDuration)
      
      return {
        ...state,
        remaining,
        status: remaining === 0 ? 'IDLE' : 'RUNNING',
      }

    default:
      return state
  }
}
