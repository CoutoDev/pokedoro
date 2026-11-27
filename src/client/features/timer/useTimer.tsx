import { useCallback } from "react"

import { postStoppedCycle } from "@/client/api"
import { useAuthContext } from "@/client/features/auth/AuthContext"
import { elapsedSeconds } from "@/client/features/timer/elapsedSeconds"
import { useTimerContext } from "@/client/features/timer/TimerContext"

const PHASE_DURATION_KEY = {
  FOCUS: 'focusDuration',
  SHORT_BREAK: 'shortBreakDuration',
  LONG_BREAK: 'longBreakDuration',
} as const

export const useTimer = () => {
  const { timer, timerDispatch } = useTimerContext();
  const { auth } = useAuthContext()
  const { remaining, status, phase, focusDuration } = timer
  const totalDuration = timer[PHASE_DURATION_KEY[phase]]

  const handleTimerInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const parsedValue = parseInt(value)

    if (!isNaN(parsedValue)) {
      timerDispatch({
        type: "SET_DURATION",
        payload: {
          minutes: parsedValue
        }
      })
    }
  }, [timerDispatch])

  const handleStartClick = useCallback(() => {
    timerDispatch({
      type: "START_FOCUS",
      payload: {
        focusDuration,
        // No existing session timeout yet, so remaining is simply the full duration.
        remaining: focusDuration,
      }
    })
  }, [timerDispatch, focusDuration])

  const handleStartBreakClick = useCallback(() => {
    timerDispatch({
      type: "START_BREAK",
    })
  }, [timerDispatch])

  const handleStartLongBreakClick = useCallback(() => {
    timerDispatch({
      type: "START_LONG_BREAK",
    })
  }, [timerDispatch])

  const handlePauseClick = useCallback(() => {
    timerDispatch({
      type: "PAUSE",
      payload: {
        pausedAt: new Date(),
      }
    })
  }, [timerDispatch])

  const handleResumeClick = useCallback(() => {
    timerDispatch({
      type: "RESUME",
      payload: {
        resumedAt: new Date(),
      }
    })
  }, [timerDispatch])

  const handleResetClick = useCallback(() => {
    // Only a user-initiated reset of an in-flight phase counts as "stopped";
    // the other RESET dispatches (post-completion, login/logout sync) don't.
    if (auth.status === 'authenticated' && timer.status !== 'IDLE') {
      void postStoppedCycle({
        cycleId: crypto.randomUUID(),
        phase: timer.phase,
        focusDuration: timer.focusDuration,
        shortBreakDuration: timer.shortBreakDuration,
        longBreakDuration: timer.longBreakDuration,
        elapsedSeconds: elapsedSeconds(timer),
      })
    }

    timerDispatch({
      type: "RESET"
    })
  }, [timerDispatch, auth.status, timer])

  return {
    remaining,
    status,
    phase,
    totalDuration,
    handleTimerInputChange,
    handleStartClick,
    handleStartBreakClick,
    handleStartLongBreakClick,
    handlePauseClick,
    handleResumeClick,
    handleResetClick,
  }
}