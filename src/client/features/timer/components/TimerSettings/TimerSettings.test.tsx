import { afterEach, describe, expect, it, mock } from 'bun:test'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'

import { TimerContext, initialTimerState } from '@/client/features/timer/TimerContext/TimerContext'
import type { TimerAction } from '@/client/features/timer/timerReducer'

import TimerSettings from './TimerSettings'

const renderSettings = (
  timer = initialTimerState,
  timerDispatch = mock((_action: TimerAction) => {}),
) => render(
  <TimerContext.Provider
    value={{
      timer,
      timerDispatch,
      caughtPokemon: null,
      showLoginNudge: false,
      catchError: null,
      dismissCatchReveal: () => {},
    }}
  >
    <TimerSettings />
  </TimerContext.Provider>,
)

const getInputs = () => Array.from(document.querySelectorAll('input')) as HTMLInputElement[]

const getInputTriple = () =>
  getInputs() as [focus: HTMLInputElement, shortBreak: HTMLInputElement, longBreak: HTMLInputElement]

const openSettings = async () => {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
    await Bun.sleep(0)
  })
}

afterEach(() => {
  cleanup()
  mock.restore()
})

describe('TimerSettings', () => {
  it('renders Settings button and keeps dialog closed initially', () => {
    renderSettings()

    expect(screen.queryByRole('button', { name: 'Settings' })).not.toBeNull()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(getInputs()).toHaveLength(0)
  })

  it('opens the dialog with inputs and action buttons', async () => {
    renderSettings()

    await openSettings()

    expect(screen.queryByRole('dialog')).not.toBeNull()
    expect(getInputs()).toHaveLength(3)
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeNull()
    expect(screen.queryByRole('button', { name: 'Save and apply' })).not.toBeNull()
  })

  it('uses context durations as input values', async () => {
    renderSettings({
      ...initialTimerState,
      focusDuration: 30 * 60,
      shortBreakDuration: 10 * 60,
      longBreakDuration: 20 * 60,
    })

    await openSettings()

    expect(getInputs().map(input => input.value)).toEqual(['30', '10', '20'])
  })

  it('focuses the first input when opened', async () => {
    renderSettings()

    await openSettings()

    expect(document.activeElement).toBe(getInputs()[0]!)
  })

  it('resets edited values when Cancel is clicked', async () => {
    renderSettings()

    await openSettings()

    fireEvent.change(getInputs()[0]!, { target: { value: '99' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('dialog')).toBeNull()

    await openSettings()

    expect(getInputs()[0]!.value).toBe('25')
  })

  it('closes dialog on Cancel', async () => {
    renderSettings()

    await openSettings()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('dispatches SET actions and closes on Save and apply', async () => {
    const timerDispatch = mock((_action: TimerAction) => {})

    renderSettings(initialTimerState, timerDispatch)

    await openSettings()

    const [focusInput, shortInput, longInput] = getInputTriple()

    fireEvent.change(focusInput, { target: { value: '40' } })
    fireEvent.change(shortInput, { target: { value: '8' } })
    fireEvent.change(longInput, { target: { value: '25' } })

    fireEvent.click(screen.getByRole('button', { name: 'Save and apply' }))

    expect(timerDispatch).toHaveBeenCalledWith({
      type: 'SET_DURATION',
      payload: { minutes: 40 },
    })
    expect(timerDispatch).toHaveBeenCalledWith({
      type: 'SET_SHORT_BREAK_DURATION',
      payload: { minutes: 8 },
    })
    expect(timerDispatch).toHaveBeenCalledWith({
      type: 'SET_LONG_BREAK_DURATION',
      payload: { minutes: 25 },
    })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('falls back to current durations for empty, invalid, or zero inputs', async () => {
    const timerDispatch = mock((_action: TimerAction) => {})

    renderSettings(initialTimerState, timerDispatch)

    await openSettings()

    const [focusInput, shortInput, longInput] = getInputTriple()

    fireEvent.change(focusInput, { target: { value: '' } })
    fireEvent.change(shortInput, { target: { value: 'abc' } })
    fireEvent.change(longInput, { target: { value: '0' } })

    fireEvent.click(screen.getByRole('button', { name: 'Save and apply' }))

    expect(timerDispatch).toHaveBeenCalledWith({
      type: 'SET_DURATION',
      payload: { minutes: 25 },
    })
    expect(timerDispatch).toHaveBeenCalledWith({
      type: 'SET_SHORT_BREAK_DURATION',
      payload: { minutes: 5 },
    })
    expect(timerDispatch).toHaveBeenCalledWith({
      type: 'SET_LONG_BREAK_DURATION',
      payload: { minutes: 15 },
    })
  })

  it('can open, cancel, and reopen without broken refs', async () => {
    renderSettings()

    await openSettings()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    await openSettings()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
