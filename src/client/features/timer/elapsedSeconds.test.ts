import { afterEach, describe, expect, it, setSystemTime } from 'bun:test'

import { initialTimerState } from '@/client/features/timer/initialTimerState'

import { elapsedSeconds } from './elapsedSeconds'

afterEach(() => setSystemTime())

describe('elapsedSeconds', () => {
  it('recomputes from the deadline while RUNNING', () => {
    setSystemTime(new Date('2026-01-01T00:10:00Z'))

    const elapsed = elapsedSeconds({
      ...initialTimerState,
      status: 'RUNNING',
      focusDuration: 1500,
      remaining: 1500, // stale: no tick yet
      sessionTimeout: new Date('2026-01-01T00:30:00Z'),
    })

    expect(elapsed).toBe(300)
  })

  it('uses the stored remaining while PAUSED', () => {
    expect(
      elapsedSeconds({ ...initialTimerState, status: 'PAUSED', phase: 'SHORT_BREAK', shortBreakDuration: 300, remaining: 100 }),
    ).toBe(200)
  })

  it('never exceeds the planned duration or goes negative', () => {
    expect(elapsedSeconds({ ...initialTimerState, status: 'PAUSED', phase: 'LONG_BREAK', longBreakDuration: 900, remaining: 5000 })).toBe(0)
    expect(elapsedSeconds({ ...initialTimerState, status: 'PAUSED', focusDuration: 60, remaining: 0 })).toBe(60)
  })
})
