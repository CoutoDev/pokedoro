import type { Phase } from "@/shared/types/pomodoro-cycle"
import { formatTime } from "@/client/features/timer/formatTime"
import { getRingMetrics } from "@/client/features/timer/progressRing"

const RADIUS = 104

const PHASE_COLOR: Record<Phase, string> = {
  FOCUS: "var(--color-focus)",
  SHORT_BREAK: "var(--color-short)",
  LONG_BREAK: "var(--color-long)",
}

const PHASE_CAPTION: Record<Phase, string> = {
  FOCUS: "Focus session",
  SHORT_BREAK: "Short break",
  LONG_BREAK: "Long break",
}

type TimerDisplayProps = {
  remaining: number
  total?: number
  phase?: Phase
}

const TimerDisplay = ({ remaining, total = 25 * 60, phase = "FOCUS" }: TimerDisplayProps) => {
  const { circumference, offset } = getRingMetrics(remaining, total, RADIUS)
  const color = PHASE_COLOR[phase]

  return (
    <div className="rounded-2xl border-4 border-ink-soft bg-card p-5 shadow-[5px_5px_0_0_var(--color-ink-soft)]">
      <div className="display relative flex h-56 w-56 items-center justify-center lg:h-64 lg:w-64">
        <svg width="100%" height="100%" viewBox="0 0 240 240" className="-rotate-90">
          <circle cx="120" cy="120" r={RADIUS} fill="none" stroke="var(--color-ring-track)" strokeWidth="16" />
          <circle
            cx="120"
            cy="120"
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth="16"
            strokeLinecap="butt"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-900 ease-linear"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="font-heading text-3xl font-normal tabular-nums text-ink-soft lg:text-4xl">
            {formatTime(remaining)}
          </span>
          <span className="mt-2.5 text-sm font-bold text-muted">{PHASE_CAPTION[phase]}</span>
        </div>
      </div>
    </div>
  )
}

export default TimerDisplay
