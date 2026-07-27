import { useEffect, type Dispatch } from "react"

import { postCycle } from "@/client/api"
import type { AuthState } from "@/client/features/auth/authReducer"
import type { TimerAction } from "@/client/features/timer/timerReducer"
import type { PomodoroCycle } from "@/shared/types/pomodoro-cycle"

/**
 * Records a completed cycle (if signed in) and resets the timer once it
 * reaches IDLE with no time remaining — the "session finished" transition.
 */
export function useCycleRecorder(
  timer: PomodoroCycle,
  auth: AuthState,
  dispatch: Dispatch<TimerAction>,
) {
  useEffect(() => {
    if (timer.status !== 'IDLE' || timer.remaining !== 0) return

    if (auth.status === 'authenticated') {
      postCycle({
        phase: timer.phase,
        focusDuration: timer.focusDuration,
        shortBreakDuration: timer.shortBreakDuration,
        longBreakDuration: timer.longBreakDuration,
      }).catch(() => {})
    }

    dispatch({ type: 'RESET' })
  }, [
    timer.status,
    timer.remaining,
    timer.phase,
    timer.focusDuration,
    timer.shortBreakDuration,
    timer.longBreakDuration,
    auth.status,
    dispatch,
  ])
}
