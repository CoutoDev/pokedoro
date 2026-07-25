import { afterEach, describe, expect, it, mock } from 'bun:test'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

import { TimerContext, initialTimerState } from '@/contexts/TimerContext/TimerContext'
import type { TimerAction } from '@/reducers/timerReducer'

import Timer from './Timer'

const renderTimer = (
  timer = initialTimerState,
  timerDispatch = mock((_action: TimerAction) => {}),
) => render(
  <TimerContext.Provider value={{ timer, timerDispatch }}>
    <Timer />
  </TimerContext.Provider>,
)

afterEach(() => {
  cleanup()
  mock.restore()
})

describe('Timer', () => {
  it('renders the timer container, display, and controls', () => {
    const { container } = renderTimer()

    expect(container.querySelector('.pomodoro-timer')).not.toBeNull()
    expect(container.querySelector('.display')).not.toBeNull()
    expect(container.querySelector('.controls')).not.toBeNull()
  })

  it('renders remaining time from context', () => {
    renderTimer({ ...initialTimerState, remaining: 300 })

    expect(screen.queryByText('05:00')).not.toBeNull()
  })

  it('renders IDLE controls', () => {
    renderTimer({ ...initialTimerState, status: 'IDLE' })

    expect(screen.queryByRole('button', { name: 'Start' })).not.toBeNull()
    expect(screen.queryByRole('button', { name: 'Break' })).not.toBeNull()
    expect(screen.queryByRole('button', { name: 'Long Break' })).not.toBeNull()
  })

  it('renders RUNNING controls', () => {
    renderTimer({ ...initialTimerState, status: 'RUNNING' })

    expect(screen.queryByRole('button', { name: 'Pause' })).not.toBeNull()
    expect(screen.queryByRole('button', { name: 'Reset' })).not.toBeNull()
  })

  it('renders PAUSED controls', () => {
    renderTimer({ ...initialTimerState, status: 'PAUSED' })

    expect(screen.queryByRole('button', { name: 'Resume' })).not.toBeNull()
    expect(screen.queryByRole('button', { name: 'Reset' })).not.toBeNull()
  })

  it('dispatches START_FOCUS when Start is clicked', () => {
    const timerDispatch = mock((_action: TimerAction) => {})

    renderTimer(initialTimerState, timerDispatch)

    fireEvent.click(screen.getByRole('button', { name: 'Start' }))

    expect(timerDispatch).toHaveBeenCalledWith({
      type: 'START_FOCUS',
      payload: {
        focusDuration: initialTimerState.focusDuration,
        remaining: initialTimerState.focusDuration,
      },
    })
  })

  it('dispatches break actions', () => {
    const timerDispatch = mock((_action: TimerAction) => {})

    renderTimer(initialTimerState, timerDispatch)

    fireEvent.click(screen.getByRole('button', { name: 'Break' }))
    fireEvent.click(screen.getByRole('button', { name: 'Long Break' }))

    expect(timerDispatch).toHaveBeenCalledWith({ type: 'START_BREAK' })
    expect(timerDispatch).toHaveBeenCalledWith({ type: 'START_LONG_BREAK' })
  })

  it('dispatches PAUSE and RESET from RUNNING controls', () => {
    const timerDispatch = mock((_action: TimerAction) => {})

    renderTimer({ ...initialTimerState, status: 'RUNNING' }, timerDispatch)

    fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))

    expect(timerDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'PAUSE' }))
    expect(timerDispatch).toHaveBeenCalledWith({ type: 'RESET' })
  })

  it('dispatches RESUME from PAUSED controls', () => {
    const timerDispatch = mock((_action: TimerAction) => {})

    renderTimer({ ...initialTimerState, status: 'PAUSED' }, timerDispatch)

    fireEvent.click(screen.getByRole('button', { name: 'Resume' }))

    expect(timerDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'RESUME' }))
  })

  it('renders with the default context outside a provider', () => {
    const { container } = render(<Timer />)

    expect(container.querySelector('.pomodoro-timer')).not.toBeNull()
  })
})
