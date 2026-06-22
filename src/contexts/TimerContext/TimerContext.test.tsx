import { act, render, renderHook, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'

import type { TimerAction } from '@/reducers/timerReducer'
import {
  TimerContext,
  TimerContextProvider,
  initialTimerState,
  useTimerContext,
} from './TimerContext'

describe('initialTimerState', () => {
  it('should have the correct initial values', () => {
    expect(initialTimerState.phase).toBe('FOCUS')
    expect(initialTimerState.status).toBe('IDLE')
    expect(initialTimerState.focusDuration).toBe(25 * 60)
    expect(initialTimerState.shortBreakDuration).toBe(5 * 60)
    expect(initialTimerState.longBreakDuration).toBe(15 * 60)
    expect(initialTimerState.remaining).toBe(25 * 60)
    expect(initialTimerState.sessionTimeout).toBeNull()
    expect(initialTimerState.pausedAt).toBeNull()
    expect(initialTimerState.resumedAt).toBeNull()
    expect(initialTimerState.resetedAt).toBeNull()
    expect(initialTimerState.interval).toBeNull()
    expect(typeof initialTimerState.id).toBe('string')
  })
})

describe('TimerContextProvider', () => {
  beforeEach(() => {
    mock.restore()
  })

  afterEach(() => {
    mock.restore()
  })

  it('should render children', () => {
    render(
      <TimerContextProvider>
        <span>child</span>
      </TimerContextProvider>
    )

    expect(screen.getByText('child')).not.toBeNull()
  })

  it('should provide initial timer state', () => {
    const { result } = renderHook(() => useTimerContext(), {
      wrapper: TimerContextProvider,
    })

    expect(result.current.timer.status).toBe('IDLE')
    expect(result.current.timer.phase).toBe('FOCUS')
    expect(result.current.timer.remaining).toBe(25 * 60)
  })

  it('should provide a timerDispatch function', () => {
    const { result } = renderHook(() => useTimerContext(), {
      wrapper: TimerContextProvider,
    })

    expect(typeof result.current.timerDispatch).toBe('function')
  })

  it('should dispatch TICK every second when status is RUNNING', async () => {
    const { result } = renderHook(() => useTimerContext(), {
      wrapper: TimerContextProvider,
    })

    act(() => {
      result.current.timerDispatch({ type: 'START_FOCUS', payload: { focusDuration: initialTimerState.focusDuration, remaining: initialTimerState.focusDuration } })
    })

    const remainingAfterStart = result.current.timer.remaining

    await act(async () => {
      await Bun.sleep(1000)
    })

    expect(result.current.timer.remaining).toBe(remainingAfterStart - 1)

    await act(async () => {
      await Bun.sleep(4000)
    })

    expect(result.current.timer.remaining).toBe(remainingAfterStart - 5)
  })

  it('should clear interval when status changes from RUNNING to PAUSED', () => {
    const clearIntervalSpy = spyOn(globalThis, 'clearInterval')

    const { result } = renderHook(() => useTimerContext(), {
      wrapper: TimerContextProvider,
    })

    act(() => {
      result.current.timerDispatch({ type: 'START_FOCUS', payload: { focusDuration: initialTimerState.focusDuration, remaining: initialTimerState.focusDuration } })
    })

    act(() => {
      result.current.timerDispatch({ type: 'PAUSE', payload: { pausedAt: new Date() } })
    })

    expect(clearIntervalSpy).toHaveBeenCalled()
  })

  it('should dispatch RESET and advance phase when remaining reaches 0', async () => {
    const { result } = renderHook(() => useTimerContext(), {
      wrapper: TimerContextProvider,
    })

    act(() => {
      result.current.timerDispatch({ type: 'START_FOCUS', payload: { focusDuration: initialTimerState.focusDuration, remaining: initialTimerState.focusDuration } })
    })

    await act(async () => {
      await Bun.sleep(initialTimerState.focusDuration * 1000)
    })

    expect(result.current.timer.status).toBe('IDLE')
    expect(result.current.timer.remaining).toBe(initialTimerState.shortBreakDuration)
    expect(result.current.timer.phase).toBe('SHORT_BREAK')
  })

  it('should not reset when status is IDLE and remaining is greater than 0', () => {
    const { result } = renderHook(() => useTimerContext(), {
      wrapper: TimerContextProvider,
    })

    expect(result.current.timer.status).toBe('IDLE')
    expect(result.current.timer.remaining).toBeGreaterThan(0)
    expect(result.current.timer.phase).toBe('FOCUS')
  })

  it('should not tick when status is IDLE', async () => {
    const { result } = renderHook(() => useTimerContext(), {
      wrapper: TimerContextProvider,
    })

    const remainingBefore = result.current.timer.remaining

    await act(async () => {
      await Bun.sleep(3000)
    })

    expect(result.current.timer.remaining).toBe(remainingBefore)
  })

  it('should not tick when status is PAUSED', async () => {
    const { result } = renderHook(() => useTimerContext(), {
      wrapper: TimerContextProvider,
    })

    act(() => {
      result.current.timerDispatch({ type: 'START_FOCUS', payload: { focusDuration: initialTimerState.focusDuration, remaining: initialTimerState.focusDuration } })
    })

    act(() => {
      result.current.timerDispatch({ type: 'PAUSE', payload: { pausedAt: new Date() } })
    })

    const remainingAfterPause = result.current.timer.remaining

    await act(async () => {
      await Bun.sleep(3000)
    })

    expect(result.current.timer.remaining).toBe(remainingAfterPause)
  })

  it('should resume correctly after being paused', async () => {
    const { result } = renderHook(() => useTimerContext(), {
      wrapper: TimerContextProvider,
    })

    act(() => {
      result.current.timerDispatch({ type: 'START_FOCUS', payload: { focusDuration: initialTimerState.focusDuration, remaining: initialTimerState.focusDuration } })
    })

    await act(async () => {
      await Bun.sleep(2000)
    })

    act(() => {
      result.current.timerDispatch({ type: 'PAUSE', payload: { pausedAt: new Date() } })
    })

    const remainingAfterPause = result.current.timer.remaining

    act(() => {
      result.current.timerDispatch({ type: 'START_FOCUS', payload: { focusDuration: initialTimerState.focusDuration, remaining: initialTimerState.focusDuration } })
    })

    await act(async () => {
      await Bun.sleep(2000)
    })

    expect(result.current.timer.remaining).toBeLessThan(remainingAfterPause)
    expect(result.current.timer.status).toBe('RUNNING')
  })
})

describe('useTimerContext', () => {
  it('should return default context values when used outside provider', () => {
    const { result } = renderHook(() => useTimerContext())

    expect(result.current.timer).toEqual(initialTimerState)
    expect(typeof result.current.timerDispatch).toBe('function')
  })

  it('should return timer and timerDispatch when used inside provider', () => {
    const { result } = renderHook(() => useTimerContext(), {
      wrapper: TimerContextProvider,
    })

    expect(result.current).toHaveProperty('timer')
    expect(result.current).toHaveProperty('timerDispatch')
  })
})

describe('TimerContext default value', () => {
  it('should have a no-op timerDispatch that does not throw for all action types', () => {
    const { result } = renderHook(() => useTimerContext())

    const actions: TimerAction[] = [
      { type: 'START_FOCUS', payload: { focusDuration: 25 * 60, remaining: 25 * 60 } },
      { type: 'PAUSE', payload: { pausedAt: new Date() } },
      { type: 'RESET' },
      { type: 'TICK' },
    ]

    actions.forEach((action) => {
      expect(() => result.current.timerDispatch(action)).not.toThrow()
    })
  })

  it('should expose the TimerContext object for direct consumers', () => {
    expect(TimerContext).toBeDefined()
  })
})