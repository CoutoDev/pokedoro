import TimerControls from "../TimerControls"
import TimerDisplay from "../TimerDisplay"
import { useTimer } from "@/client/features/timer/useTimer"
import { cn } from "@/client/lib/cn"

const PHASE_TABS = [
  { phase: "FOCUS", label: "Focus Time", color: "bg-focus text-white" },
  { phase: "SHORT_BREAK", label: "Short Break", color: "bg-short text-white" },
  { phase: "LONG_BREAK", label: "Long Break", color: "bg-long text-white" },
] as const

const Timer = () => {
  const {
    remaining,
    status,
    phase,
    totalDuration,
    handleTimerInputChange,
    handleStartClick,
    handleStartBreakClick,
    handleStartLongBreakClick,
    handlePauseClick,
    handleResetClick,
    handleResumeClick
  } = useTimer()

  return (
    <div className="pomodoro-timer flex flex-col items-center gap-6">
      <div aria-hidden="true" className="flex items-center justify-center gap-2 rounded-full bg-white/70 p-1.5 shadow-sm shadow-ink/5">
        {PHASE_TABS.map((tab) => (
          <span
            key={tab.phase}
            className={cn(
              "rounded-full px-3.5 py-1.5 font-heading text-xs font-extrabold text-center",
              phase === tab.phase ? tab.color : "text-muted",
            )}
          >
            {tab.label}
          </span>
        ))}
      </div>

      <TimerDisplay remaining={remaining} total={totalDuration} phase={phase} />

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
