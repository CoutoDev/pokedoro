import { createContext, useContext, useEffect, useReducer, useRef, type Dispatch, type PropsWithChildren } from "react"

import { useAuthContext } from "@/contexts/AuthContext"
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
  const { auth } = useAuthContext()
  const prevAuthStatusRef = useRef(auth.status)

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
      if (auth.status === 'authenticated') {
        fetch('/api/cycles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phase: timer.phase,
            focusDuration: timer.focusDuration,
            shortBreakDuration: timer.shortBreakDuration,
            longBreakDuration: timer.longBreakDuration,
          }),
        }).catch(() => {})
      }

      timerDispatch({ type: 'RESET' })
    }
  }, [
    timer.status,
    timer.remaining,
    timer.phase,
    timer.focusDuration,
    timer.shortBreakDuration,
    timer.longBreakDuration,
    auth.status,
  ])

  // Claims the current in-flight (or freshly logged-in) timer snapshot to the
  // account: fires the moment auth becomes 'authenticated' (login), and again
  // on every subsequent key transition (start/pause/resume/reset/complete).
  // `remaining` is deliberately excluded so a plain per-second TICK doesn't
  // trigger a write.
  useEffect(() => {
    if (auth.status !== 'authenticated') return

    fetch('/api/timer-state', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(timer),
    }).catch(() => {})
  }, [
    auth.status,
    timer.status,
    timer.phase,
    timer.focusDuration,
    timer.shortBreakDuration,
    timer.longBreakDuration,
    timer.pausedAt,
    timer.resumedAt,
  ])

  // Resets the local timer (and, via the save effect above, localStorage)
  // when the customer logs out, so the account's saved state is untouched
  // but this browser no longer shows their session.
  useEffect(() => {
    const prevAuthStatus = prevAuthStatusRef.current
    prevAuthStatusRef.current = auth.status

    if (prevAuthStatus === 'authenticated' && auth.status === 'unauthenticated') {
      timerDispatch({ type: 'RESET' })
    }
  }, [auth.status])

  return (
    <TimerContext.Provider value={{ timer, timerDispatch }}>
      {children}
    </TimerContext.Provider>
  )
}

export function useTimerContext() {
  return useContext(TimerContext) ?? defaultTimerContextValue
}