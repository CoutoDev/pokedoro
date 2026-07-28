import { useEffect, useRef, type Dispatch } from "react"

import { postCycle } from "@/client/api"
import type { AuthState } from "@/client/features/auth/authReducer"
import type { TimerAction } from "@/client/features/timer/timerReducer"
import type { CaughtPokemon } from "@/shared/types/pokemon"
import type { PomodoroCycle } from "@/shared/types/pomodoro-cycle"

export interface CatchRecorder {
  setCaughtPokemon: (pokemon: CaughtPokemon) => void
  setShowLoginNudge: (show: boolean) => void
  setError: (error: string | null) => void
}

/**
 * Records a completed cycle (if signed in) and resets the timer once it
 * reaches IDLE with no time remaining — the "session finished" transition.
 *
 * NOTE: cycleId is cached via useRef to preserve idempotency key across effect
 * re-runs (e.g., React StrictMode double-invocation). It's only cleared once
 * the timer state moves past this same completion event (status leaves IDLE
 * or remaining leaves 0) — clearing it within the same completion pass would
 * let a StrictMode double-invoke mint a second cycleId and double-POST for
 * what the user experiences as a single phase completion.
 *
 * `catchRecorder`'s setters come from useState (Step 7's useCatchReveal) and
 * are individually stable across renders, so they're destructured into the
 * effect deps rather than depended on as a single object — a fresh object
 * literal each render would otherwise re-fire the effect every render.
 */
export function useCycleRecorder(
  timer: PomodoroCycle,
  auth: AuthState,
  dispatch: Dispatch<TimerAction>,
  catchRecorder: CatchRecorder,
) {
  const cycleIdRef = useRef<string | null>(null)
  const { setCaughtPokemon, setShowLoginNudge, setError } = catchRecorder

  useEffect(() => {
    if (timer.status !== 'IDLE' || timer.remaining !== 0) {
      // A new cycle has started; clear the cached id so the next completion
      // mints a fresh one instead of reusing a stale cycleId.
      cycleIdRef.current = null
      return
    }

    // Generate cycleId once per cycle completion (guard condition became true)
    if (!cycleIdRef.current) {
      cycleIdRef.current = crypto.randomUUID()
    }
    const cycleId = cycleIdRef.current

    if (auth.status === 'authenticated') {
      postCycle({
        cycleId,
        phase: timer.phase,
        focusDuration: timer.focusDuration,
        shortBreakDuration: timer.shortBreakDuration,
        longBreakDuration: timer.longBreakDuration,
      }).then((caught) => {
        if (caught) {
          setCaughtPokemon(caught)
        } else {
          setError("Couldn't catch it — try again")
        }
      })
    } else {
      setShowLoginNudge(true)
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
    setCaughtPokemon,
    setShowLoginNudge,
    setError,
  ])
}
