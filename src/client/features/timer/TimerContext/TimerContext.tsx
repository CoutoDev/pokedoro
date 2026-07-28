import { createContext, useContext, useReducer, type Dispatch, type PropsWithChildren } from "react"

import { useAuthContext } from "@/client/features/auth/AuthContext"
import { initialTimerState } from "@/client/features/timer/initialTimerState"
import { timerReducer, type TimerAction } from "@/client/features/timer/timerReducer"
import { loadTimerState } from "@/client/features/timer/timerStorage"
import type { CaughtPokemon } from "@/shared/types/pokemon"
import type { PomodoroCycle } from "@/shared/types/pomodoro-cycle"

import { useAccountSync } from "./useAccountSync"
import { useCatchReveal } from "./useCatchReveal"
import { useCycleRecorder } from "./useCycleRecorder"
import { useLocalTimerPersistence } from "./useLocalTimerPersistence"
import { useTickInterval } from "./useTickInterval"

export { initialTimerState }

type TimerContextValue = {
  timer: PomodoroCycle
  timerDispatch: Dispatch<TimerAction>
  caughtPokemon: CaughtPokemon | null
  showLoginNudge: boolean
  catchError: string | null
  dismissCatchReveal: () => void
}

const defaultTimerContextValue: TimerContextValue = {
  timer: initialTimerState,
  timerDispatch: () => {},
  caughtPokemon: null,
  showLoginNudge: false,
  catchError: null,
  dismissCatchReveal: () => {},
}

export const TimerContext = createContext<TimerContextValue>(defaultTimerContextValue)

export function TimerContextProvider({ children }: PropsWithChildren) {
  const [timer, timerDispatch] = useReducer(timerReducer, initialTimerState, loadTimerState)
  const { auth } = useAuthContext()
  const { caughtPokemon, showLoginNudge, error, setCaughtPokemon, setShowLoginNudge, setError, dismiss } =
    useCatchReveal()

  useLocalTimerPersistence(timer)
  useTickInterval(timer.status, timerDispatch)
  useCycleRecorder(timer, auth, timerDispatch, { setCaughtPokemon, setShowLoginNudge, setError })
  useAccountSync(timer, auth, timerDispatch)

  return (
    <TimerContext.Provider
      value={{
        timer,
        timerDispatch,
        caughtPokemon,
        showLoginNudge,
        catchError: error,
        dismissCatchReveal: dismiss,
      }}
    >
      {children}
    </TimerContext.Provider>
  )
}

export function useTimerContext() {
  return useContext(TimerContext) ?? defaultTimerContextValue
}
