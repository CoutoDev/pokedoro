import { describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test'
import { timerReducer, type TimerAction } from './timerReducer'
import * as calculateRemainingModule from '@/client/features/timer/calculateRemaining'
import { initialTimerState } from '@/client/features/timer/TimerContext'
import type { PomodoroCycle } from '@/shared/types/pomodoro-cycle'

const FOCUS_SECONDS = 25 * 60
const SHORT_BREAK_SECONDS = 5 * 60
const LONG_BREAK_SECONDS = 15 * 60

function createState(overrides: Partial<PomodoroCycle> = {}): PomodoroCycle {
  return {
    ...initialTimerState,
    id: 'test-cycle-id',
    ...overrides,
  }
}

describe('timerReducer', () => {
  const fixedNow = new Date('2025-06-21T12:00:00.000Z')
  const generatedUuid = 'generated-uuid'
  let dateNowSpy: ReturnType<typeof spyOn>
  let calculateRemainingSpy: ReturnType<typeof spyOn>
  let cryptoRandomUUIDSpy: ReturnType<typeof spyOn>

  beforeEach(() => {
    dateNowSpy = spyOn(Date, 'now') as any
    dateNowSpy.mockImplementation(() => fixedNow.getTime())
    
    calculateRemainingSpy = spyOn(calculateRemainingModule, 'calculateRemaining')
    calculateRemainingSpy.mockImplementation((sessionTimeout: Date | null, focusDuration: number) => {
      if (!sessionTimeout) return focusDuration
      const diff = sessionTimeout.getTime() - fixedNow.getTime()
      return Math.max(0, Math.ceil(diff / 1000))
    })
    
    cryptoRandomUUIDSpy = spyOn(globalThis.crypto, 'randomUUID').mockReturnValue(
      generatedUuid as `${string}-${string}-${string}-${string}-${string}`,
    )
  })
  
  afterEach(() => {
    dateNowSpy.mockRestore()
    calculateRemainingSpy.mockRestore()
    cryptoRandomUUIDSpy.mockRestore()
  })

  describe('START_FOCUS', () => {
    it('starts focus with payload duration and sets session timeout', () => {
      const state = createState({ status: 'IDLE', id: '' })
      const focusDuration = 30 * 60
      const next = timerReducer(state, {
        type: 'START_FOCUS',
        payload: { focusDuration, remaining: focusDuration },
      })

      expect(next.focusDuration).toBe(focusDuration)
      expect(next.remaining).toBe(focusDuration)
      expect(next.status).toBe('RUNNING')
      expect(next.sessionTimeout).toEqual(
        new Date(fixedNow.getTime() + focusDuration * 1000),
      )
      expect(next.id).toBe(generatedUuid)
    })

    it('falls back to state focusDuration when payload focusDuration is falsy', () => {
      const state = createState({
        focusDuration: FOCUS_SECONDS,
        remaining: FOCUS_SECONDS,
      })
      const next = timerReducer(state, {
        type: 'START_FOCUS',
        payload: { focusDuration: 0, remaining: 0 },
      })

      expect(next.focusDuration).toBe(FOCUS_SECONDS)
      expect(next.remaining).toBe(FOCUS_SECONDS)
      expect(next.id).toBe(state.id)
    })

    it('preserves existing id when state already has one', () => {
      const state = createState({ id: 'existing-id' })
      const next = timerReducer(state, {
        type: 'START_FOCUS',
        payload: { focusDuration: 10 * 60, remaining: 10 * 60 },
      })

      expect(next.id).toBe('existing-id')
    })
  })

  describe('START_BREAK', () => {
    it('starts a short break using state shortBreakDuration', () => {
      const state = createState({ shortBreakDuration: SHORT_BREAK_SECONDS })
      const next = timerReducer(state, { type: 'START_BREAK' })

      expect(next.phase).toBe('SHORT_BREAK')
      expect(next.remaining).toBe(SHORT_BREAK_SECONDS)
      expect(next.status).toBe('RUNNING')
      expect(next.sessionTimeout).toEqual(
        new Date(fixedNow.getTime() + SHORT_BREAK_SECONDS * 1000),
      )
      expect(next.id).toBe(state.id)
    })

    it('generates id when state has no id', () => {
      const state = createState({ id: '' })
      const next = timerReducer(state, { type: 'START_BREAK' })

      expect(next.id).toBe(generatedUuid)
    })
  })

  describe('START_LONG_BREAK', () => {
    it('starts a long break using state longBreakDuration', () => {
      const state = createState({ longBreakDuration: LONG_BREAK_SECONDS })
      const next = timerReducer(state, { type: 'START_LONG_BREAK' })

      expect(next.phase).toBe('LONG_BREAK')
      expect(next.remaining).toBe(LONG_BREAK_SECONDS)
      expect(next.status).toBe('RUNNING')
      expect(next.sessionTimeout).toEqual(
        new Date(fixedNow.getTime() + LONG_BREAK_SECONDS * 1000),
      )
      expect(next.id).toBe(state.id)
    })

    it('generates id when state has no id', () => {
      const state = createState({ id: '' })
      const next = timerReducer(state, { type: 'START_LONG_BREAK' })

      expect(next.id).toBe(generatedUuid)
    })
  })

  describe('PAUSE', () => {
    it('pauses a running session and recalculates remaining', () => {
      const sessionTimeout = new Date(fixedNow.getTime() + 10 * 60 * 1000)
      const pausedAt = fixedNow
      const state = createState({
        status: 'RUNNING',
        sessionTimeout,
        focusDuration: FOCUS_SECONDS,
      })
      const next = timerReducer(state, {
        type: 'PAUSE',
        payload: { pausedAt },
      })

      expect(next.status).toBe('PAUSED')
      expect(next.pausedAt).toBe(pausedAt)
      expect(next.remaining).toBe(10 * 60)
    })

    it('returns state unchanged when not running', () => {
      const state = createState({ status: 'PAUSED' })
      const next = timerReducer(state, {
        type: 'PAUSE',
        payload: { pausedAt: fixedNow },
      })

      expect(next).toBe(state)
    })
  })

  describe('RESUME', () => {
    it('resumes a paused session and extends session timeout by paused duration', () => {
      const sessionTimeout = new Date(fixedNow.getTime() + 10 * 60 * 1000)
      const pausedAt = new Date(fixedNow.getTime() - 2 * 60 * 1000)
      const resumedAt = fixedNow
      const state = createState({
        status: 'PAUSED',
        sessionTimeout,
        pausedAt,
        focusDuration: FOCUS_SECONDS,
      })
      const next = timerReducer(state, {
        type: 'RESUME',
        payload: { resumedAt },
      })
      const pausedDuration = fixedNow.getTime() - pausedAt.getTime()
      const expectedTimeout = new Date(
        sessionTimeout.getTime() + pausedDuration,
      )

      expect(next.status).toBe('RUNNING')
      expect(next.resumedAt).toBe(resumedAt)
      expect(next.sessionTimeout).toEqual(expectedTimeout)
      expect(next.remaining).toBe(12 * 60)
    })

    it.each([
      ['status is not PAUSED', { status: 'RUNNING' as const }],
      ['pausedAt is missing', { pausedAt: null }],
      ['sessionTimeout is missing', { sessionTimeout: null }],
    ])('returns state unchanged when %s', (_label, overrides) => {
      const state = createState({
        status: 'PAUSED',
        pausedAt: fixedNow,
        sessionTimeout: new Date(fixedNow.getTime() + 60_000),
        ...overrides,
      })
      const next = timerReducer(state, {
        type: 'RESUME',
        payload: { resumedAt: fixedNow },
      })
      
      expect(next).toBe(state)
    })

    it('returns state unchanged when resumedAt is missing', () => {
      const state = createState({
        status: 'PAUSED',
        pausedAt: fixedNow,
        sessionTimeout: new Date(fixedNow.getTime() + 60_000),
      })
      const next = timerReducer(state, {
        type: 'RESUME',
        payload: { resumedAt: null as unknown as Date },
      })

      expect(next).toBe(state)
    })
  })

  describe('RESET', () => {
    it('returns initial timer state', () => {
      const state = createState({
        status: 'RUNNING',
        phase: 'SHORT_BREAK',
        remaining: 42,
      })
      const next = timerReducer(state, { type: 'RESET' })
      expect(next).toEqual({ ...initialTimerState })
    })
  })

  describe('HYDRATE', () => {
    it('replaces the entire state with the payload', () => {
      const state = createState({ status: 'IDLE' })
      const payload = createState({
        id: 'restored-id',
        status: 'PAUSED',
        phase: 'SHORT_BREAK',
        remaining: 99,
      })

      const next = timerReducer(state, { type: 'HYDRATE', payload })

      expect(next).toEqual(payload)
    })
  })

  describe('SET_DURATION', () => {
    it('converts minutes to seconds for focus duration and remaining', () => {
      const state = createState()
      const next = timerReducer(state, {
        type: 'SET_DURATION',
        payload: { focusDuration: 30 },
      })
      expect(next.focusDuration).toBe(30 * 60)
      expect(next.remaining).toBe(30 * 60)
    })
  })

  describe('SET_SHORT_BREAK_DURATION', () => {
    it('converts minutes to seconds for short break duration', () => {
      const state = createState()
      const next = timerReducer(state, {
        type: 'SET_SHORT_BREAK_DURATION',
        payload: { shortBreakDuration: 10 },
      })
      expect(next.shortBreakDuration).toBe(10 * 60)
    })
  })

  describe('SET_LONG_BREAK_DURATION', () => {
    it('converts minutes to seconds for long break duration', () => {
      const state = createState()
      const next = timerReducer(state, {
        type: 'SET_LONG_BREAK_DURATION',
        payload: { longBreakDuration: 20 },
      })
      expect(next.longBreakDuration).toBe(20 * 60)
    })
  })

  describe('TICK', () => {
    it('updates remaining time while session is active', () => {
      const state = createState({
        status: 'RUNNING',
        sessionTimeout: new Date(fixedNow.getTime() + 90_000),
      })
      const next = timerReducer(state, { type: 'TICK' })
      expect(next.remaining).toBe(90)
      expect(next.status).toBe('RUNNING')
    })

    it('sets status to IDLE when remaining reaches zero', () => {
      const state = createState({
        status: 'RUNNING',
        sessionTimeout: new Date(fixedNow.getTime()),
      })
      const next = timerReducer(state, { type: 'TICK' })
      expect(next.remaining).toBe(0)
      expect(next.status).toBe('IDLE')
    })

    it('treats elapsed session timeout as zero remaining', () => {
      const state = createState({
        status: 'RUNNING',
        sessionTimeout: new Date(fixedNow.getTime() - 1_000),
      })
      const next = timerReducer(state, { type: 'TICK' })
      expect(next.remaining).toBe(0)
      expect(next.status).toBe('IDLE')
    })

    it('returns state unchanged when status is not RUNNING', () => {
      const state = createState({
        status: 'PAUSED',
        sessionTimeout: new Date(fixedNow.getTime() + 90_000),
      })
      const next = timerReducer(state, { type: 'TICK' })
      expect(next).toBe(state)
    })

    it('returns state unchanged when there is no sessionTimeout', () => {
      const state = createState({
        status: 'RUNNING',
        sessionTimeout: null,
      })
      const next = timerReducer(state, { type: 'TICK' })
      expect(next).toBe(state)
    })
  })

  describe('default', () => {
    it('returns state unchanged for COMPLETE_SESSION (unhandled action)', () => {
      const state = createState()
      const next = timerReducer(state, { type: 'COMPLETE_SESSION' })
      expect(next).toBe(state)
    })
    
    it('returns state unchanged for unknown action types', () => {
      const state = createState()
      const next = timerReducer(state, {
        type: 'UNKNOWN_ACTION',
      } as unknown as TimerAction)
      expect(next).toBe(state)
    })
  })
})
