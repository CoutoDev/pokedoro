import { afterEach, describe, expect, it, mock, spyOn } from 'bun:test'
import { useContext } from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'

import { TimerContext, TimerContextProvider, initialTimerState, useTimerContext } from './TimerContext'
import * as calculateRemainingModule from '@/utils/calculateRemaining'

const STORAGE_KEY = 'pokedoro-timer-state'

/**
 * Minimal consumer that surfaces the raw context value as text and exposes
 * the two dispatches needed to drive the provider's effects: START_FOCUS
 * (enters RUNNING, so the tick-interval effect activates) and PAUSE (leaves
 * RUNNING, so the interval-cleanup effect activates).
 */
function StateProbe() {
  const { timer, timerDispatch } = useContext(TimerContext)

  return (
    <div>
      <span data-testid="status">{timer.status}</span>
      <span data-testid="remaining">{timer.remaining}</span>
      <button
        onClick={() => timerDispatch({
          type: 'START_FOCUS',
          payload: { focusDuration: 3, remaining: 3 },
        })}
      >
        Start
      </button>
      <button onClick={() => timerDispatch({ type: 'PAUSE', payload: { pausedAt: new Date() } })}>
        Pause
      </button>
    </div>
  )
}

function HookProbe() {
  const { timer, timerDispatch } = useTimerContext()

  return (
    <div>
      <span data-testid="hook-status">{timer.status}</span>
      <button onClick={() => timerDispatch({ type: 'RESET' })}>Dispatch</button>
    </div>
  )
}

const renderWithProvider = (child: React.ReactElement) => render(
  <TimerContextProvider>
    {child}
  </TimerContextProvider>,
)

/**
 * The provider ticks via a real `setInterval`, which would make tests either
 * slow (real waits) or flaky (fake timers racing React's effect flush).
 * Mocking `setInterval`/`clearInterval` lets the test capture the scheduled
 * callback and invoke it synchronously inside `act`, making each tick
 * deterministic while still exercising the provider's real effect code.
 */
function mockIntervalTimers() {
  let nextIntervalId = 0
  let lastIntervalId: number | null = null
  let intervalCallback: (() => void) | null = null

  const setIntervalSpy = spyOn(globalThis, 'setInterval') as any
  setIntervalSpy.mockImplementation((callback: () => void) => {
    intervalCallback = callback
    nextIntervalId += 1
    lastIntervalId = nextIntervalId
    return nextIntervalId
  })

  const clearIntervalSpy = spyOn(globalThis, 'clearInterval') as any
  clearIntervalSpy.mockImplementation(() => {})

  return {
    setIntervalSpy,
    clearIntervalSpy,
    getLastIntervalId: () => lastIntervalId,
    tick: () => act(() => {
      intervalCallback?.()
    }),
  }
}

afterEach(() => {
  cleanup()
  mock.restore()
  localStorage.clear()
})

describe('TimerContextProvider', () => {
  it('provides the initial timer state to consumers', () => {
    renderWithProvider(<StateProbe />)

    expect(screen.getByTestId('status').textContent).toBe(initialTimerState.status)
    expect(screen.getByTestId('remaining').textContent).toBe(String(initialTimerState.remaining))
  })

  it('does not schedule a tick interval while status is IDLE', () => {
    const { setIntervalSpy } = mockIntervalTimers()

    renderWithProvider(<StateProbe />)

    expect(setIntervalSpy).not.toHaveBeenCalled()
  })

  it('schedules a 1s tick interval on entering RUNNING and dispatches TICK on each tick', () => {
    const { setIntervalSpy, tick } = mockIntervalTimers()
    const calculateRemainingSpy = spyOn(calculateRemainingModule, 'calculateRemaining')
    calculateRemainingSpy.mockReturnValueOnce(2).mockReturnValueOnce(1)

    renderWithProvider(<StateProbe />)
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))

    expect(screen.getByTestId('status').textContent).toBe('RUNNING')
    expect(setIntervalSpy).toHaveBeenCalledTimes(1)
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 1000)

    tick()
    expect(screen.getByTestId('remaining').textContent).toBe('2')

    tick()
    expect(screen.getByTestId('remaining').textContent).toBe('1')

    calculateRemainingSpy.mockRestore()
  })

  it('clears the interval (effect cleanup) when status leaves RUNNING', () => {
    const { setIntervalSpy, clearIntervalSpy, getLastIntervalId } = mockIntervalTimers()

    renderWithProvider(<StateProbe />)
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    expect(setIntervalSpy).toHaveBeenCalledTimes(1)

    const scheduledIntervalId = getLastIntervalId()
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }))

    expect(screen.getByTestId('status').textContent).toBe('PAUSED')
    expect(clearIntervalSpy).toHaveBeenCalledTimes(1)
    expect(clearIntervalSpy).toHaveBeenCalledWith(scheduledIntervalId)
    // No new interval is scheduled once the timer is no longer RUNNING.
    expect(setIntervalSpy).toHaveBeenCalledTimes(1)
  })

  it('dispatches RESET once the timer reaches IDLE with 0 remaining', () => {
    const { tick } = mockIntervalTimers()
    const calculateRemainingSpy = spyOn(calculateRemainingModule, 'calculateRemaining')
    calculateRemainingSpy.mockReturnValue(0)

    renderWithProvider(<StateProbe />)
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    tick()

    expect(screen.getByTestId('status').textContent).toBe('IDLE')
    expect(screen.getByTestId('remaining').textContent).toBe(String(initialTimerState.remaining))

    calculateRemainingSpy.mockRestore()
  })

  it('does not dispatch RESET while IDLE with non-zero remaining', () => {
    renderWithProvider(<StateProbe />)

    expect(screen.getByTestId('status').textContent).toBe('IDLE')
    expect(screen.getByTestId('remaining').textContent).toBe(String(initialTimerState.remaining))
  })

  it('hydrates from a persisted PAUSED state in localStorage on mount', () => {
    const persisted = {
      ...initialTimerState,
      status: 'PAUSED',
      remaining: 42,
      pausedAt: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))

    renderWithProvider(<StateProbe />)

    expect(screen.getByTestId('status').textContent).toBe('PAUSED')
    expect(screen.getByTestId('remaining').textContent).toBe('42')
  })

  it('persists timer state to localStorage whenever it changes', () => {
    renderWithProvider(<StateProbe />)

    fireEvent.click(screen.getByRole('button', { name: 'Start' }))

    const raw = localStorage.getItem(STORAGE_KEY)
    expect(raw).not.toBeNull()
    expect(JSON.parse(raw!)).toMatchObject({ status: 'RUNNING' })
  })
})

describe('useTimerContext', () => {
  it('returns the provider value when used inside TimerContextProvider', () => {
    renderWithProvider(<HookProbe />)

    expect(screen.getByTestId('hook-status').textContent).toBe('IDLE')
  })

  it('returns the default context value when used outside a provider', () => {
    render(<HookProbe />)

    expect(screen.getByTestId('hook-status').textContent).toBe('IDLE')
  })

  it('the default context dispatch outside a provider is a callable no-op', () => {
    render(<HookProbe />)

    // No TimerContextProvider wraps this render, so `timerDispatch` here is
    // `defaultTimerContextValue.timerDispatch` — a no-op. Calling it should
    // not throw and should leave the (static) default state unaffected.
    expect(() => fireEvent.click(screen.getByRole('button', { name: 'Dispatch' }))).not.toThrow()
    expect(screen.getByTestId('hook-status').textContent).toBe('IDLE')
  })
})
