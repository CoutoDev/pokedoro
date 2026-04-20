import { memo } from "react"

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
  const { handleTimerInputChange, handleStartClick, handleStartBreakClick, handleStartLongBreakClick, handlePauseClick, handleResetClick, handleResumeClick } = handlers
  return (
    <div className="controls">
      {/* <input
        hidden={status !== "IDLE"}
        disabled={status !== "IDLE"}
        name="timer"
        type="text"
        pattern="^\d{0,120}$"
        value={focusDuration / 60}
        onChange={handleTimerInputChange}
        placeholder="Minutos"
        title="Tempo em minutos, até 120 minutos"
      /> */}

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
  )
})

export default TimerControls