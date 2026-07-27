import { useCallback } from "react"

import { calculateRemaining } from "@/client/features/timer/calculateRemaining"
import { useTimerContext } from "@/client/features/timer/TimerContext"

const PHASE_DURATION_KEY = {
  FOCUS: 'focusDuration',
  SHORT_BREAK: 'shortBreakDuration',
  LONG_BREAK: 'longBreakDuration',
  DONE: 'focusDuration',
} as const

export const useTimer = () => {
  const { timer, timerDispatch } = useTimerContext();
  const { remaining, status, phase, focusDuration } = timer
  const totalDuration = timer[PHASE_DURATION_KEY[phase]]
  
  const handleTimerInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const parsedValue = parseInt(value)

    if (!isNaN(parsedValue)) {
      timerDispatch({
        type: "SET_DURATION",
        payload: {
          focusDuration: parsedValue
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
        remaining: calculateRemaining(null, focusDuration),
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
    timerDispatch({
      type: "RESET"
    })
  }, [timerDispatch])

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