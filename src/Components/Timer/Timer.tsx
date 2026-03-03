import { usePomodoroTimer } from "@/hooks/usePomodoroTimer"
import { useEffect, useRef } from "react"

const Timer = () => {
  const {
    remaining,
    status,
    duration,
    start,
    pause,
    resume,
    reset,
    setDuration,
    formatTime,
  } = usePomodoroTimer(25 * 60); // 25min default
  
  const timerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (timerRef.current) {
      timerRef.current.value = Math.floor(duration / 60).toString();
    }
  }, [duration]);

  return (
    <div>
      <h1>Timer</h1>
      <div className="pomodoro-timer">
        <div className="display">
          {formatTime(remaining)}
        </div>
        
        <div className="controls">
          <input
            type="number"
            min="1"
            max="120"
            ref={timerRef}
            onChange={(e) => setDuration(Number(timerRef?.current?.value) * 60)}
            placeholder="minutos"
          />
          
          {status === "IDLE" && (
            <button onClick={() => start()}>▶️ Iniciar</button>
          )}
          
          {status === "RUNNING" && (
            <>
              <button onClick={pause}>⏸️ Pausar</button>
              <button onClick={reset}>🔄 Reset</button>
            </>
          )}
          
          {status === "PAUSED" && (
            <>
              <button onClick={resume}>▶️ Continuar</button>
              <button onClick={reset}>🔄 Reset</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Timer;