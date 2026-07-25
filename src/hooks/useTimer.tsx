import { useCallback } from "react"

import { calculateRemaining } from "@/utils/calculateRemaining"
import { useTimerContext } from "@/contexts/TimerContext"

export const useTimer = () => {
  const { timer: { remaining, status, focusDuration }, timerDispatch } = useTimerContext();
  
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
    handleTimerInputChange,
    handleStartClick,
    handleStartBreakClick,
    handleStartLongBreakClick,
    handlePauseClick,
    handleResumeClick,
    handleResetClick,
  }
}