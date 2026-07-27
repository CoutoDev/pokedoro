import { z } from 'zod'

// 24h ceiling is far beyond any realistic focus/break length; it just keeps
// junk numeric input (negatives, non-integers, absurdly large values) out.
const durationSeconds = z.number().int().min(0).max(24 * 60 * 60)
// Client-sent ISO date strings are ~24-33 chars; 100 is a generous cap.
const isoDateString = z.string().max(100).nullable()

export const phaseSchema = z.enum(['FOCUS', 'SHORT_BREAK', 'LONG_BREAK'])
export const statusSchema = z.enum(['IDLE', 'RUNNING', 'PAUSED'])

/**
 * Wire format for the timer state synced to `/api/timer-state` and persisted
 * verbatim as JSON in `timer_states.state`: the single source of truth for
 * that shape, shared by the server's validation and the client's
 * `reviveTimerState`, so the two can no longer drift apart.
 */
export const timerStateWireSchema = z.object({
  id: z.string().min(1).max(200),
  phase: phaseSchema,
  status: statusSchema,
  focusDuration: durationSeconds,
  shortBreakDuration: durationSeconds,
  longBreakDuration: durationSeconds,
  sessionTimeout: isoDateString,
  pausedAt: isoDateString,
  resumedAt: isoDateString,
  resetAt: isoDateString,
  remaining: durationSeconds,
})

export type TimerStateWire = z.infer<typeof timerStateWireSchema>

/** Payload for `POST /api/cycles`: the phase and durations a completed cycle ran with. */
export const cyclePayloadSchema = z.object({
  phase: phaseSchema,
  focusDuration: durationSeconds,
  shortBreakDuration: durationSeconds,
  longBreakDuration: durationSeconds,
})

export type CyclePayload = z.infer<typeof cyclePayloadSchema>
