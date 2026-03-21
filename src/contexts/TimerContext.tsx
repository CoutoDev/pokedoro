import { createContext, useContext, useEffect, useReducer } from "react"
import { timerReducer, type TimerAction } from "@/reducers/timerReducer"
import type { PomodoroCycle } from "@/types/pomodoro-cycle"

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

export const TimerContext = createContext<{
  timer: PomodoroCycle,
  timerDispatch: React.Dispatch<TimerAction>,
}>({
  timer: initialTimerState,
  timerDispatch: () => { },
})


export function TimerContextProvider({ children }: { children: React.ReactNode }) {
  const [timer, timerDispatch] = useReducer(timerReducer, initialTimerState)

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
    <TimerContext value={{ timer, timerDispatch }}>
      {children}
    </TimerContext>
  )
}

export function useTimer() {
  return useContext(TimerContext)
}