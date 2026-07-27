import { createContext, useContext, useReducer, type Dispatch, type PropsWithChildren } from "react"

import { useAuthContext } from "@/client/features/auth/AuthContext"
import { initialTimerState } from "@/client/features/timer/initialTimerState"
import { timerReducer, type TimerAction } from "@/client/features/timer/timerReducer"
import { loadTimerState } from "@/client/features/timer/timerStorage"
import type { PomodoroCycle } from "@/shared/types/pomodoro-cycle"

import { useAccountSync } from "./useAccountSync"
import { useCycleRecorder } from "./useCycleRecorder"
import { useLocalTimerPersistence } from "./useLocalTimerPersistence"
import { useTickInterval } from "./useTickInterval"

export { initialTimerState }

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

  useLocalTimerPersistence(timer)
  useTickInterval(timer.status, timerDispatch)
  useCycleRecorder(timer, auth, timerDispatch)
  useAccountSync(timer, auth, timerDispatch)

  return (
    <TimerContext.Provider value={{ timer, timerDispatch }}>
      {children}
    </TimerContext.Provider>
  )
}

export function useTimerContext() {
  return useContext(TimerContext) ?? defaultTimerContextValue
}
