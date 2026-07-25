import { createContext, useContext, useEffect, useReducer, type Dispatch, type PropsWithChildren } from "react"

import { timerReducer, type TimerAction } from "@/reducers/timerReducer"
import type { PomodoroCycle } from "@/types/pomodoro-cycle"
import { loadTimerState, saveTimerState } from "@/utils/timerStorage"

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
  resetedAt: null,
  remaining: 25 * 60,
  interval: null,
}

type TimerContextValue = {
  timer: PomodoroCycle
  timerDispatch: Dispatch<TimerAction>
}

const defaultTimerContextValue: TimerContextValue = {
  timer: initialTimerState,
  timerDispatch: () => {},
}

export const TimerContext = createContext<TimerContextValue>(defaultTimerContextValue)

export function TimerContextProvider({ children }: PropsWithChildren) {
  const [timer, timerDispatch] = useReducer(timerReducer, initialTimerState, loadTimerState)

  useEffect(() => {
    saveTimerState(timer)
  }, [timer])

  useEffect(() => {
    if (timer.status === 'RUNNING') {
      const interval = setInterval(() => timerDispatch({
        type: 'TICK',
      }), 1000)

      return () => {
        clearInterval(interval)
      }
    }
  }, [timer.status])

  useEffect(() => {
    if (timer.status === 'IDLE' && timer.remaining === 0) {
      timerDispatch({ type: 'RESET' })
    }
  }, [timer.status, timer.remaining])

  return (
    <TimerContext.Provider value={{ timer, timerDispatch }}>
      {children}
    </TimerContext.Provider>
  )
}

export function useTimerContext() {
  return useContext(TimerContext) ?? defaultTimerContextValue
}