import { afterEach, describe, expect, it, mock, spyOn } from 'bun:test'

import { loadTimerState, saveTimerState } from './timerStorage'
import * as calculateRemainingModule from './calculateRemaining'
import { initialTimerState } from '@/client/features/timer/TimerContext'
import type { PomodoroCycle } from '@/shared/types/pomodoro-cycle'

const STORAGE_KEY = 'pokedoro-timer-state'

const createState = (overrides: Partial<PomodoroCycle> = {}): PomodoroCycle => ({
  ...initialTimerState,
  id: 'test-cycle-id',
  ...overrides,
})

afterEach(() => {
  localStorage.clear()
  mock.restore()
})

describe('loadTimerState', () => {
  it('returns the fallback when nothing is stored', () => {
    expect(loadTimerState(initialTimerState)).toEqual(initialTimerState)
  })

  it('revives Date fields and preserves remaining for a PAUSED session', () => {
    const pausedAt = new Date('2025-06-21T12:00:00.000Z')
    const sessionTimeout = new Date('2025-06-21T12:25:00.000Z')

    const stored = createState({
      status: 'PAUSED',
      pausedAt,
      sessionTimeout,
      remaining: 600,
    })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))

    const result = loadTimerState(initialTimerState)

    expect(result.status).toBe('PAUSED')
    expect(result.remaining).toBe(600)
    expect(result.pausedAt).toBeInstanceOf(Date)
    expect(result.pausedAt?.getTime()).toBe(pausedAt.getTime())
    expect(result.sessionTimeout).toBeInstanceOf(Date)
    expect(result.sessionTimeout?.getTime()).toBe(sessionTimeout.getTime())
  })

  it('recomputes remaining from the revived sessionTimeout for a RUNNING session', () => {
    const sessionTimeout = new Date('2025-06-21T12:25:00.000Z')
    const stored = createState({
      status: 'RUNNING',
      sessionTimeout,
      remaining: 999,
    })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))

    const calculateRemainingSpy = spyOn(calculateRemainingModule, 'calculateRemaining')
    calculateRemainingSpy.mockReturnValue(120)

    const result = loadTimerState(initialTimerState)

    expect(calculateRemainingSpy).toHaveBeenCalledWith(expect.any(Date))
    expect(result.status).toBe('RUNNING')
    expect(result.remaining).toBe(120)

    calculateRemainingSpy.mockRestore()
  })

  it('moves a RUNNING session with no persisted sessionTimeout to IDLE', () => {
    const stored = createState({ status: 'RUNNING', sessionTimeout: null })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))

    const result = loadTimerState(initialTimerState)

    expect(result.status).toBe('IDLE')
  })

  it('moves an expired RUNNING session to IDLE when recomputed remaining is 0', () => {
    const stored = createState({
      status: 'RUNNING',
      sessionTimeout: new Date('2025-06-21T12:25:00.000Z'),
      remaining: 999,
    })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))

    const calculateRemainingSpy = spyOn(calculateRemainingModule, 'calculateRemaining')
    calculateRemainingSpy.mockReturnValue(0)

    const result = loadTimerState(initialTimerState)

    expect(result.status).toBe('IDLE')
    expect(result.remaining).toBe(0)

    calculateRemainingSpy.mockRestore()
  })

  it('falls back to the given state when stored JSON is corrupt', () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json')

    expect(loadTimerState(initialTimerState)).toEqual(initialTimerState)
  })

  it('falls back to the given state when stored JSON is not an object', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify('just a string'))

    expect(loadTimerState(initialTimerState)).toEqual(initialTimerState)
  })

  it('falls back to the given state when localStorage.getItem throws', () => {
    const getItemSpy = spyOn(Storage.prototype, 'getItem')
    getItemSpy.mockImplementation(() => {
      throw new Error('storage disabled')
    })

    expect(loadTimerState(initialTimerState)).toEqual(initialTimerState)

    getItemSpy.mockRestore()
  })

  it('treats an unparseable stored date as null', () => {
    const stored = createState({ status: 'PAUSED', pausedAt: 'not-a-date' as unknown as Date })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))

    const result = loadTimerState(initialTimerState)

    expect(result.pausedAt).toBeNull()
  })
})

describe('saveTimerState', () => {
  it('persists the timer state as JSON under the storage key', () => {
    const state = createState({ status: 'PAUSED', remaining: 42 })

    saveTimerState(state)

    const raw = localStorage.getItem(STORAGE_KEY)
    expect(raw).not.toBeNull()
    expect(JSON.parse(raw!)).toMatchObject({ status: 'PAUSED', remaining: 42 })
  })

  it('does not throw when localStorage.setItem fails', () => {
    const setItemSpy = spyOn(Storage.prototype, 'setItem')
    setItemSpy.mockImplementation(() => {
      throw new Error('quota exceeded')
    })

    expect(() => saveTimerState(createState())).not.toThrow()

    setItemSpy.mockRestore()
  })
})
