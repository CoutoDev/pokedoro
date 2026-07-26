import { memo } from "react"
import { Coffee, Moon, Pause, Play, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/Button"

type TimerControlsProps = {
  status: string
  handlers: {
    handleTimerInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    handleStartClick: () => void
    handleStartBreakClick: () => void
    handleStartLongBreakClick: () => void
    handlePauseClick: () => void
    handleResetClick: () => void
    handleResumeClick: () => void
  }
}

const TimerControls = memo(function TimerControls({status, handlers}: TimerControlsProps) {
  const { handleStartClick, handleStartBreakClick, handleStartLongBreakClick, handlePauseClick, handleResetClick, handleResumeClick } = handlers

  return (
    <div className="controls flex flex-col items-center gap-4">
      {status === "IDLE" && (
        <>
          <Button variant="primary" size="circle" onClick={handleStartClick} aria-label="Start">
            <Play className="h-7 w-7 fill-current" aria-hidden="true" />
          </Button>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleStartBreakClick}>
              <Coffee className="h-4 w-4" aria-hidden="true" />
              Break
            </Button>
            <Button variant="secondary" onClick={handleStartLongBreakClick}>
              <Moon className="h-4 w-4" aria-hidden="true" />
              Long Break
            </Button>
          </div>
        </>
      )}

      {status === "RUNNING" && (
        <>
          <Button variant="primary" size="circle" onClick={handlePauseClick} aria-label="Pause">
            <Pause className="h-7 w-7 fill-current" aria-hidden="true" />
          </Button>
          <Button variant="secondary" onClick={handleResetClick}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reset
          </Button>
        </>
      )}

      {status === "PAUSED" && (
        <>
          <Button variant="primary" size="circle" onClick={handleResumeClick} aria-label="Resume">
            <Play className="h-7 w-7 fill-current" aria-hidden="true" />
          </Button>
          <Button variant="secondary" onClick={handleResetClick}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reset
          </Button>
        </>
      )}
    </div>
  )
})

export default TimerControls
