import { use, useCallback, useRef } from 'react'
import type { PomodoroCycle } from '../types/pomodoro-cycle';

export type TimerAction =
  | { type: 'START_FOCUS'; payload: Pick<PomodoroCycle, 'focusDuration' | 'remaining'> & { calculateRemaining: (sessionTimeout: Date | null, focusDuration: number) => number} }
  | { type: 'TICK', payload: Pick<PomodoroCycle, 'intervalRef'>}
  | { type: 'PAUSE'; payload: Pick<PomodoroCycle, 'pausedAt'> & { calculateRemaining: (sessionTimeout: Date | null, focusDuration: number) => number} }
  | { type: 'RESUME'; payload: Pick<PomodoroCycle, 'resumedAt'> & { calculateRemaining: (sessionTimeout: Date | null, focusDuration: number) => number} }
  | { type: 'COMPLETE_SESSION' }
  | { type: 'RESET' }
  | { type: 'SET_DURATION'; payload: Pick<PomodoroCycle, 'focusDuration'> };

export function timerReducer(state: PomodoroCycle, action: TimerAction): PomodoroCycle {
  switch (action.type) {
    case 'START_FOCUS':
      const focusDuration = action.payload.focusDuration ? action.payload.focusDuration : state.focusDuration;
      const timeout = new Date(Date.now() + focusDuration * 1000);

      return {
        ...state,
        focusDuration: focusDuration,
        remaining: focusDuration,
        sessionTimeout: timeout,
        status: 'RUNNING',
      };

    case 'PAUSE':
      if (state.status !== 'RUNNING') return state;

      state.pausedAtRef = useRef<Date | null>(null);
      state.pausedAtRef.current = new Date();

      return {
        ...state,
        pausedAt: action.payload.pausedAt,
        remaining: action.payload.calculateRemaining(state.sessionTimeout, state.focusDuration),
        status: 'PAUSED',
      };

    case 'RESUME':
      if (state.status !== 'PAUSED' || !state.pausedAtRef?.current || !action.payload.resumedAt || !state.sessionTimeout) return state;

      const pausedDuration = Date.now() - state.pausedAtRef.current.getTime();
      const adjustedTimeout = new Date(
        state.sessionTimeout.getTime() + pausedDuration
      );

      state.pausedAtRef.current = null;

      return {
        ...state,
        resumedAt: action.payload.resumedAt,
        remaining: action.payload.calculateRemaining(adjustedTimeout, state.focusDuration),
        status: 'RUNNING',
      };

    case 'RESET':
      return {
        ...state,
        pausedAt: null,
        resumedAt: null,
        status: 'IDLE',
        resetedAt: new Date(),
      };

    case 'SET_DURATION':
      const duration = action.payload.focusDuration * 60;

      return {
        ...state,
        focusDuration: duration,
        remaining: duration,
      };

    case 'TICK':
      const now = new Date();
      const diff = state.sessionTimeout!.getTime() - now.getTime();
      const remaining = Math.max(0, Math.ceil(diff / 1000));

      if (remaining === 0) {
        return {
          ...state,
          remaining: 0,
          status: 'IDLE',
        };
      }

      return {
        ...state,
        remaining: remaining,
      };

    default:
      return state;
  }
}