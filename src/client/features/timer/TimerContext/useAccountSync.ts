import { useEffect, useRef, type Dispatch } from "react"

import { getTimerState, putTimerState } from "@/client/api"
import type { AuthState } from "@/client/features/auth/authReducer"
import { initialTimerState } from "@/client/features/timer/initialTimerState"
import type { TimerAction } from "@/client/features/timer/timerReducer"
import { reviveTimerState } from "@/client/features/timer/timerStorage"
import type { PomodoroCycle } from "@/shared/types/pomodoro-cycle"

/**
 * Links the local timer to the account on every auth transition and key
 * state change:
 *  - login (auth becomes 'authenticated') with an in-flight local session
 *    (status !== 'IDLE') — that session wins, claim/overwrite it onto the
 *    account.
 *  - login with no local session (status === 'IDLE', e.g. a fresh browser
 *    or right after a previous logout) — restore whatever was last saved
 *    to the account instead.
 *  - any subsequent key transition while already authenticated
 *    (start/pause/resume/reset/complete) — keep the account in sync.
 *  - logout (auth becomes 'unauthenticated') — reset the local timer, which
 *    `useLocalTimerPersistence` then saves back to localStorage, while the
 *    account's saved state is left untouched.
 * `remaining` is deliberately excluded from the deps so a plain per-second
 * TICK doesn't trigger a write.
 */
export function useAccountSync(
  timer: PomodoroCycle,
  auth: AuthState,
  dispatch: Dispatch<TimerAction>,
) {
  const prevAuthStatusRef = useRef(auth.status)

  useEffect(() => {
    const prevAuthStatus = prevAuthStatusRef.current
    prevAuthStatusRef.current = auth.status

    if (auth.status === 'unauthenticated' && prevAuthStatus === 'authenticated') {
      dispatch({ type: 'RESET' })
      return
    }

    if (auth.status !== 'authenticated') return

    const justLoggedIn = prevAuthStatus !== 'authenticated'

    if (justLoggedIn && timer.status === 'IDLE') {
      let cancelled = false

      getTimerState()
        .then((state) => {
          if (cancelled || !state) return

          dispatch({ type: 'HYDRATE', payload: reviveTimerState(state, initialTimerState) })
        })
        .catch(() => {})

      return () => {
        cancelled = true
      }
    }

    putTimerState(timer).catch(() => {})
  }, [
    auth.status,
    timer.status,
    timer.phase,
    timer.focusDuration,
    timer.shortBreakDuration,
    timer.longBreakDuration,
    timer.pausedAt,
    timer.resumedAt,
    dispatch,
  ])
}
