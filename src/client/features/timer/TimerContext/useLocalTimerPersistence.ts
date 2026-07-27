import { useEffect } from "react"

import { saveTimerState } from "@/client/features/timer/timerStorage"
import type { PomodoroCycle } from "@/shared/types/pomodoro-cycle"

/** Persists the timer to localStorage on every change (including each tick). */
export function useLocalTimerPersistence(timer: PomodoroCycle) {
  useEffect(() => {
    saveTimerState(timer)
  }, [timer])
}
