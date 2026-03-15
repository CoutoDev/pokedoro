import { createContext, useCallback, useEffect, useReducer, useRef } from "react";
import { timerReducer, type TimerAction } from "@/reducers/timerReducer"
import type { PomodoroCycle } from "@/types/pomodoro-cycle";

export const initialTimerState: PomodoroCycle = {
  phase: 'FOCUS',
  status: 'IDLE',
  focusDuration: 25 * 60,
  shortBreakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  sessionTimeout: null,
  pausedAt: null,
  resumedAt: null,
  resetedAt: null,
  remaining: 25 * 60,
  intervalRef: null,
  pausedAtRef: null,
}

export const TimerContext = createContext<{
  timer: PomodoroCycle,
  timerDispatch: React.Dispatch<TimerAction>,
  calculateRemaining: (sessionTimeout: Date | null, focusDuration: number) => number
}>({
  timer: initialTimerState,
  timerDispatch: () => {},
  calculateRemaining: () => 0
});


export function TimerContextProvider({ children }: { children: React.ReactNode }) {
  const [timer, timerDispatch] = useReducer(timerReducer, initialTimerState);

  const calculateRemaining = (sessionTimeout: Date | null, focusDuration: number) => {
    if (!sessionTimeout) return focusDuration;
    
    const now = new Date();
    const diff = sessionTimeout.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / 1000));
  }; 

  useEffect(() => {
    if (timer.status !== 'RUNNING') return;

    const interval = setInterval(() => timerDispatch({
      type: 'TICK',
      payload: {
        intervalRef: timer.intervalRef
      }
    }), 1000);

    return () => {
      clearInterval(interval);
    }
  }, [timer.status, timer.intervalRef]);

  useEffect(() => {
    if (timer.status === 'IDLE' && timer.remaining === 0) {
      timerDispatch({ type: 'RESET' });
    }
  }, [timer.status, timer.remaining]);

  return (
    <TimerContext value={{ timer, timerDispatch, calculateRemaining }}>
      {children}
    </TimerContext>
  );
}