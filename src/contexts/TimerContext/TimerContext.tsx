import { createContext, useContext, useEffect, useReducer, useRef, type Dispatch, type PropsWithChildren } from "react"

import { useAuthContext } from "@/contexts/AuthContext"
import { timerReducer, type TimerAction } from "@/reducers/timerReducer"
import type { PomodoroCycle } from "@/types/pomodoro-cycle"
import { loadTimerState, reviveTimerState, saveTimerState } from "@/utils/timerStorage"

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

  // Links the local timer to the account on every auth transition and key
  // state change:
  //  - login (auth becomes 'authenticated') with an in-flight local session
  //    (status !== 'IDLE') — that session wins, claim/overwrite it onto the
  //    account.
  //  - login with no local session (status === 'IDLE', e.g. a fresh browser
  //    or right after a previous logout) — restore whatever was last saved
  //    to the account instead.
  //  - any subsequent key transition while already authenticated
  //    (start/pause/resume/reset/complete) — keep the account in sync.
  //  - logout (auth becomes 'unauthenticated') — reset the local timer, which
  //    the save effect above then persists back to localStorage, while the
  //    account's saved state is left untouched.
  // `remaining` is deliberately excluded from the deps so a plain per-second
  // TICK doesn't trigger a write.
  useEffect(() => {
    const prevAuthStatus = prevAuthStatusRef.current
    prevAuthStatusRef.current = auth.status

    if (auth.status === 'unauthenticated' && prevAuthStatus === 'authenticated') {
      timerDispatch({ type: 'RESET' })
      return
    }

    if (auth.status !== 'authenticated') return

    const justLoggedIn = prevAuthStatus !== 'authenticated'

    if (justLoggedIn && timer.status === 'IDLE') {
      let cancelled = false

      fetch('/api/timer-state')
        .then(async (res) => {
          if (cancelled || !res.ok) return

          const { state } = await res.json()
          if (cancelled || !state) return

          timerDispatch({ type: 'HYDRATE', payload: reviveTimerState(state, initialTimerState) })
        })
        .catch(() => {})

      return () => {
        cancelled = true
      }
    }

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

  return (
    <TimerContext.Provider value={{ timer, timerDispatch }}>
      {children}
    </TimerContext.Provider>
  )
}

export function useTimerContext() {
  return useContext(TimerContext) ?? defaultTimerContextValue
}