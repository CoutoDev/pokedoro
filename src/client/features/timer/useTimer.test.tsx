import { afterEach, describe, expect, it, mock, spyOn } from 'bun:test'
import { act, cleanup, renderHook } from '@testing-library/react'
import type { PropsWithChildren } from 'react'

import * as api from '@/client/api'
import { AuthContext, initialAuthState } from '@/client/features/auth/AuthContext'
import { TimerContext, initialTimerState } from '@/client/features/timer/TimerContext/TimerContext'
import type { TimerAction } from '@/client/features/timer/timerReducer'

import { useTimer } from './useTimer'

/** Renders useTimer inside a TimerContext.Provider, mirroring the component test setup. */
const renderUseTimer = (
  timer = initialTimerState,
  timerDispatch = mock((_action: TimerAction) => {}),
  authStatus: 'authenticated' | 'unauthenticated' = 'unauthenticated',
) => {
  const wrapper = ({ children }: PropsWithChildren) => (
    <AuthContext.Provider value={{ auth: { ...initialAuthState, status: authStatus }, authDispatch: () => {} }}>
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
      {children}
    </TimerContext.Provider>
    </AuthContext.Provider>
  )

  return { ...renderHook(() => useTimer(), { wrapper }), timerDispatch }
}

const changeEvent = (value: string) =>
  ({ target: { value } }) as React.ChangeEvent<HTMLInputElement>

afterEach(() => {
  cleanup()
  mock.restore()
})

describe('useTimer', () => {
  it('exposes remaining and status from context', () => {
    const { result } = renderUseTimer({
      ...initialTimerState,
      remaining: 42,
      status: 'RUNNING',
    })

    expect(result.current.remaining).toBe(42)
    expect(result.current.status).toBe('RUNNING')
  })

  describe('handleTimerInputChange', () => {
    it('dispatches SET_DURATION with the parsed number for a valid input', () => {
      const { result, timerDispatch } = renderUseTimer()

      act(() => {
        result.current.handleTimerInputChange(changeEvent('40'))
      })

      expect(timerDispatch).toHaveBeenCalledWith({
        type: 'SET_DURATION',
        payload: { minutes: 40 },
      })
    })

    it('does not dispatch for a non-numeric input', () => {
      const { result, timerDispatch } = renderUseTimer()

      act(() => {
        result.current.handleTimerInputChange(changeEvent('abc'))
      })

      expect(timerDispatch).not.toHaveBeenCalled()
    })
  })

  it('dispatches START_FOCUS using the context focusDuration as remaining', () => {
    const { result, timerDispatch } = renderUseTimer()

    act(() => {
      result.current.handleStartClick()
    })

    // No existing session timeout in this context, so calculateRemaining
    // resolves to the full focusDuration.
    expect(timerDispatch).toHaveBeenCalledWith({
      type: 'START_FOCUS',
      payload: {
        focusDuration: initialTimerState.focusDuration,
        remaining: initialTimerState.focusDuration,
      },
    })
  })

  it('dispatches START_BREAK', () => {
    const { result, timerDispatch } = renderUseTimer()

    act(() => {
      result.current.handleStartBreakClick()
    })

    expect(timerDispatch).toHaveBeenCalledWith({ type: 'START_BREAK' })
  })

  it('dispatches START_LONG_BREAK', () => {
    const { result, timerDispatch } = renderUseTimer()

    act(() => {
      result.current.handleStartLongBreakClick()
    })

    expect(timerDispatch).toHaveBeenCalledWith({ type: 'START_LONG_BREAK' })
  })

  it('dispatches PAUSE with a pausedAt Date', () => {
    const { result, timerDispatch } = renderUseTimer()

    act(() => {
      result.current.handlePauseClick()
    })

    expect(timerDispatch).toHaveBeenCalledWith({
      type: 'PAUSE',
      payload: { pausedAt: expect.any(Date) },
    })
  })

  it('dispatches RESUME with a resumedAt Date', () => {
    const { result, timerDispatch } = renderUseTimer()

    act(() => {
      result.current.handleResumeClick()
    })

    expect(timerDispatch).toHaveBeenCalledWith({
      type: 'RESUME',
      payload: { resumedAt: expect.any(Date) },
    })
  })

  it('dispatches RESET', () => {
    const { result, timerDispatch } = renderUseTimer()

    act(() => {
      result.current.handleResetClick()
    })

    expect(timerDispatch).toHaveBeenCalledWith({ type: 'RESET' })
  })

  describe('stopped phases', () => {
    const running = {
      ...initialTimerState,
      status: 'RUNNING' as const,
      focusDuration: 1500,
      remaining: 1500,
      sessionTimeout: new Date(Date.now() + 1200 * 1000),
    }

    it('records a stopped phase when a signed-in user resets a running timer', () => {
      const post = spyOn(api, 'postStoppedCycle').mockResolvedValue(true)
      const { result, timerDispatch } = renderUseTimer(running, undefined, 'authenticated')

      act(() => {
        result.current.handleResetClick()
      })

      expect(post).toHaveBeenCalledTimes(1)
      expect(post.mock.calls[0]![0]).toMatchObject({
        phase: 'FOCUS',
        focusDuration: 1500,
        elapsedSeconds: expect.any(Number),
        cycleId: expect.any(String),
      })
      expect(timerDispatch).toHaveBeenCalledWith({ type: 'RESET' })
    })

    it('does not record when signed out', () => {
      const post = spyOn(api, 'postStoppedCycle').mockResolvedValue(true)
      const { result } = renderUseTimer(running)

      act(() => {
        result.current.handleResetClick()
      })

      expect(post).not.toHaveBeenCalled()
    })

    it('does not record when the timer is idle', () => {
      const post = spyOn(api, 'postStoppedCycle').mockResolvedValue(true)
      const { result } = renderUseTimer(initialTimerState, undefined, 'authenticated')

      act(() => {
        result.current.handleResetClick()
      })

      expect(post).not.toHaveBeenCalled()
    })
  })
})
