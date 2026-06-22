import { useEffect, useRef, useState } from "react"

import { formatTime } from "@/utils/formatTime"
import { useTimerContext } from "@/contexts/TimerContext"

const TimerSettings = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const { timer: { focusDuration, longBreakDuration, shortBreakDuration }, timerDispatch } = useTimerContext()
  const focusRef = useRef<HTMLInputElement>(null)
  const shortBreakRef = useRef<HTMLInputElement>(null)
  const longBreakRef = useRef<HTMLInputElement>(null)

  const handleCloseSettings = () => {
    setIsSettingsOpen(false)
  }

  const handleSaveSettings = () => {
    const safeParse = (input: string | undefined | null, fallbackSeconds: number) => {
      const fallbackMinutes = Math.floor(fallbackSeconds / 60)
      
      if (input == null || input.trim() === '') {
        return fallbackMinutes
      }
      const num = Number(input)
      const result = Number.isFinite(num) && num >= 0 ? num : fallbackMinutes
      
      return result
    }

    timerDispatch({
      type: 'SET_DURATION',
      payload: {
        focusDuration: safeParse(focusRef.current?.value, focusDuration),
      }
    })

    timerDispatch({
      type: 'SET_SHORT_BREAK_DURATION',
      payload: {
        shortBreakDuration: safeParse(shortBreakRef.current?.value, shortBreakDuration),
      }
    })

    timerDispatch({
      type: 'SET_LONG_BREAK_DURATION',
      payload: {
        longBreakDuration: safeParse(longBreakRef.current?.value, longBreakDuration),
      }
    })

    handleCloseSettings()
  }
  
  const handleOpenSettings = () => {
    setIsSettingsOpen(true)
  }

  useEffect(() => {
    if (!isSettingsOpen) return
    if (focusRef.current) focusRef.current.value = formatTime(focusDuration, false)
    if (shortBreakRef.current) shortBreakRef.current.value = formatTime(shortBreakDuration, false)
    if (longBreakRef.current) longBreakRef.current.value = formatTime(longBreakDuration, false)
  }, [isSettingsOpen, focusDuration, shortBreakDuration, longBreakDuration])
  
  return (
    <>
      <button onClick={handleOpenSettings}>Settings</button>
      {isSettingsOpen && (
      <dialog open id="settings-modal">
        <form onSubmit={(ev) => {ev.preventDefault()}}>
          <input name="focus" title="Focus time value" ref={focusRef} type="number" defaultValue={formatTime(focusDuration, false)} />
          <input name="short_brake" title="Short break time value" ref={shortBreakRef} type="number" defaultValue={formatTime(shortBreakDuration, false)} />
          <input name="long_break" title="Long break time value" ref={longBreakRef} type="number" defaultValue={formatTime(longBreakDuration, false)} />

          <button onClick={handleSaveSettings}>Save and apply</button>
          <button onClick={handleCloseSettings}>Cancel</button>
        </form>
      </dialog>
      )}
    </>
  )
}

export default TimerSettings
