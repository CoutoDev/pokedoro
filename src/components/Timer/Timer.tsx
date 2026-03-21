import { useTimer } from "@/contexts/TimerContext"
import { calculateRemaining } from "@/utils/calculateRemaining"
import TimerControls from "../TimerControls"
import TimerDisplay from "../TimerDisplay"

const Timer = () => {
  const { timer: { remaining, status, focusDuration }, timerDispatch } = useTimer();

  const handleTimerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  }

  const handleStartClick = () => {
    timerDispatch({
      type: "START_FOCUS",
      payload: {
        focusDuration,
        remaining: calculateRemaining(new Date(), focusDuration),
      }
    })
  }

  const handleStartBreakClick = () => {
    timerDispatch({
      type: "START_BREAK",
    })
  }

  const handleStartLongBreakClick = () => {
    timerDispatch({
      type: "START_LONG_BREAK",
    })
  }

  const handlePauseClick = () => {
    timerDispatch({
      type: "PAUSE",
      payload: {
        pausedAt: new Date(),
      }
    })
  }

  const handleResumeClick = () => {
    timerDispatch({
      type: "RESUME",
      payload: {
        resumedAt: new Date(),
      }
    })
  }

  const handleResetClick = () => {
    timerDispatch({
      type: "RESET"
    })
  }

  return (
    <div className="pomodoro-timer">
      <TimerDisplay remaining={remaining} />
      <TimerControls status={status} handlers={{ handleTimerInputChange, handleStartClick, handleStartBreakClick, handleStartLongBreakClick, handlePauseClick, handleResetClick, handleResumeClick }} />
    </div>
  )
}

export default Timer