import { useEffect, useRef, useState } from "react"
import { Check, Settings, X } from "lucide-react"

import { formatTime } from "@/client/features/timer/formatTime"
import { useTimerContext } from "@/client/features/timer/TimerContext"
import { Button } from "@/client/ui/Button"
import { Input } from "@/client/ui/Input"
import { Label } from "@/client/ui/Label"

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
      const result = Number.isFinite(num) && num > 0 ? num : fallbackMinutes

      return result
    }

    timerDispatch({
      type: 'SET_DURATION',
      payload: {
        minutes: safeParse(focusRef.current?.value, focusDuration),
      }
    })

    timerDispatch({
      type: 'SET_SHORT_BREAK_DURATION',
      payload: {
        minutes: safeParse(shortBreakRef.current?.value, shortBreakDuration),
      }
    })

    timerDispatch({
      type: 'SET_LONG_BREAK_DURATION',
      payload: {
        minutes: safeParse(longBreakRef.current?.value, longBreakDuration),
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
    focusRef.current?.focus()
  }, [isSettingsOpen, focusDuration, shortBreakDuration, longBreakDuration])

  return (
    <>
      <Button variant="ghost" size="sm" onClick={handleOpenSettings}>
        <Settings className="h-4 w-4" aria-hidden="true" />
        Settings
      </Button>
      {isSettingsOpen && (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 sm:items-center">
        <dialog
          open
          id="settings-modal"
          className="relative m-0 max-h-[86vh] w-full max-w-md overflow-y-auto rounded-t-2xl border-4 border-b-0 border-ink bg-card p-6 shadow-none sm:rounded-2xl sm:border-b-4"
        >
          <form className="flex flex-col gap-4" onSubmit={(ev) => {ev.preventDefault()}}>
            <h2 className="font-heading text-base font-normal text-ink-soft">Settings</h2>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="focus-duration">Focus length (minutes)</Label>
              <Input id="focus-duration" name="focus" title="Focus time value" ref={focusRef} type="number" defaultValue={formatTime(focusDuration, false)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="short-break-duration">Short break length (minutes)</Label>
              <Input id="short-break-duration" name="short_brake" title="Short break time value" ref={shortBreakRef} type="number" defaultValue={formatTime(shortBreakDuration, false)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="long-break-duration">Long break length (minutes)</Label>
              <Input id="long-break-duration" name="long_break" title="Long break time value" ref={longBreakRef} type="number" defaultValue={formatTime(longBreakDuration, false)} />
            </div>

            <div className="mt-2 flex gap-3">
              <Button type="submit" variant="primary" className="flex-1" onClick={handleSaveSettings}>
                <Check className="h-4 w-4" aria-hidden="true" />
                Save and apply
              </Button>
              <Button type="button" variant="ghost" onClick={handleCloseSettings}>
                <X className="h-4 w-4" aria-hidden="true" />
                Cancel
              </Button>
            </div>
          </form>
        </dialog>
      </div>
      )}
    </>
  )
}

export default TimerSettings
