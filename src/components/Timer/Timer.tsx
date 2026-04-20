import TimerControls from "../TimerControls"
import TimerDisplay from "../TimerDisplay"
import { useTimer } from "@/hooks/useTimer"

const Timer = () => {
  const {
    remaining,
    status,
    handleTimerInputChange,
    handleStartClick,
    handleStartBreakClick,
    handleStartLongBreakClick,
    handlePauseClick,
    handleResetClick,
    handleResumeClick
  } = useTimer()

  return (
    <div className="pomodoro-timer">
      <TimerDisplay remaining={remaining} />
      <TimerControls status={status} handlers={{
        handleTimerInputChange,
        handleStartClick,
        handleStartBreakClick,
        handleStartLongBreakClick,
        handlePauseClick,
        handleResetClick,
        handleResumeClick
      }} />
    </div>
  )
}

export default Timer