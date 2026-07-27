import { useEffect, type Dispatch } from "react"

import type { TimerAction } from "@/client/features/timer/timerReducer"
import type { Status } from "@/shared/types/pomodoro-cycle"

/** Drives the 1-second countdown while the timer is RUNNING. */
export function useTickInterval(status: Status, dispatch: Dispatch<TimerAction>) {
  useEffect(() => {
    if (status !== 'RUNNING') return

    const interval = setInterval(() => dispatch({ type: 'TICK' }), 1000)

    return () => {
      clearInterval(interval)
    }
  }, [status, dispatch])
}
