import { formatTime } from "@/utils/formatTime"

type TimerDisplayProps = {
  remaining: number
}

const TimerDisplay = ({ remaining }: TimerDisplayProps) => {
  return (
    <div className="display">
      {formatTime(remaining)}
    </div>
  )
}

export default TimerDisplay