import { TimerContext } from "@/contexts/TimerContext"
import { calculateRemaining } from "@/utils/calculateRemaining"
import { formatTime } from "@/utils/formatTime"
import { useContext } from "react"

const Timer = () => {
  const { timer: { remaining, status, focusDuration }, timerDispatch } = useContext(TimerContext)

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
    <div>
      <h1>Timer</h1>
      <div className="pomodoro-timer">
        <div className="display">
          {formatTime(remaining)}
        </div>

        <div className="controls">
          <input
            hidden={status !== "IDLE"}
            disabled={status !== "IDLE"}
            name="timer"
            type="text"
            pattern="^\d{0,120}$"
            value={focusDuration / 60}
            onChange={handleTimerInputChange}
            placeholder="Minutos"
            title="Tempo em minutos, até 120 minutos"
          />

          {status === "IDLE" && (
            <>
              <button onClick={handleStartClick}>▶️ Iniciar</button>
              <button onClick={handleStartBreakClick}>▶️ Iniciar Pausa</button>
              <button onClick={handleStartLongBreakClick}>▶️ Iniciar Pausa Longa</button>
            </>
          )}

          {status === "RUNNING" && (
            <>
              <button onClick={handlePauseClick}>⏸️ Pausar</button>
              <button onClick={handleResetClick}>🔄 Reset</button>
            </>
          )}

          {status === "PAUSED" && (
            <>
              <button onClick={handleResumeClick}>▶️ Continuar</button>
              <button onClick={handleResetClick}>🔄 Reset</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Timer