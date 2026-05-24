import { useRef, useState } from "react"

import { formatTime } from "@/utils/formatTime"
import { useTimerContext } from "@/contexts/TimerContext"

const TimerSettings = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const { timer: { focusDuration, longBreakDuration, shortBreakDuration }, timerDispatch } = useTimerContext()
  const focusRef = useRef<HTMLInputElement>(null)
  const shortBreakRef = useRef<HTMLInputElement>(null)
  const longBreakRef = useRef<HTMLInputElement>(null)

  const handleSaveSettings = () => {
    timerDispatch({
      type: 'SET_DURATION',
      payload: {
        focusDuration: Number(focusRef.current?.value) ?? focusDuration
      }
    })

    timerDispatch({
      type: 'SET_SHORT_BREAK_DURATION',
      payload: {
        shortBreakDuration: Number(shortBreakRef.current?.value) ?? shortBreakDuration
      }
    })

    timerDispatch({
      type: 'SET_LONG_BREAK_DURATION',
      payload: {
        longBreakDuration: Number(longBreakRef.current?.value) ?? longBreakDuration
      }
    })

    setIsSettingsOpen(false)
  }

  const handleCloseSettings = () => {
    focusRef.current!.value = formatTime(focusDuration, false)
    shortBreakRef.current!.value = formatTime(shortBreakDuration, false)
    longBreakRef.current!.value = formatTime(longBreakDuration, false)

    setIsSettingsOpen(false)
  }
  const handleOpenSettings = () => {
    setIsSettingsOpen(true)
  }
  
  return (
    <>
      <button onClick={handleOpenSettings}>Settings</button>
      <dialog open={ isSettingsOpen } id="settings-modal">
        <form onSubmit={(ev) => {ev.preventDefault()}}>
          <input name="focus" title="Focus time value" ref={focusRef} type="number" defaultValue={formatTime(focusDuration, false)} />
          <input name="short_brake" title="Short break time value"  ref={shortBreakRef} type="number" defaultValue={formatTime(shortBreakDuration, false)} />
          <input name="long_break" title="Long break time value"  ref={longBreakRef} type="number" defaultValue={formatTime(longBreakDuration, false)} />

          <button onClick={handleSaveSettings}>Save and apply</button>
          <button onClick={handleCloseSettings}>Cancel</button>
        </form>
      </dialog>
    </>
  )
}

export default TimerSettings
