import { calculateRemaining } from "@/client/features/timer/calculateRemaining"
import { timerStateWireSchema, type TimerStateWire } from "@/shared/schemas/pomodoroCycle"
import type { PomodoroCycle } from "@/shared/types/pomodoro-cycle"

const STORAGE_KEY = "pokedoro-timer-state"

const reviveDate = (value: string | null): Date | null => {
  if (value === null) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const reviveWire = (wire: TimerStateWire): PomodoroCycle => ({
  ...wire,
  sessionTimeout: reviveDate(wire.sessionTimeout),
  pausedAt: reviveDate(wire.pausedAt),
  resumedAt: reviveDate(wire.resumedAt),
  resetAt: reviveDate(wire.resetAt),
})

/**
 * Validates `parsed` against the same wire schema the server enforces on
 * `/api/timer-state` (see shared/schemas/pomodoroCycle.ts), so a shape that
 * doesn't match — e.g. localStorage still holding a pre-rename field name —
 * falls back to `fallback` instead of silently merging in whatever keys
 * happened to be present.
 */
export const reviveTimerState = (parsed: unknown, fallback: PomodoroCycle): PomodoroCycle => {
  const result = timerStateWireSchema.safeParse(parsed)
  if (!result.success) return fallback

  const revived = reviveWire(result.data)

  // `remaining` is only a snapshot for a RUNNING session — recompute it from
  // the revived deadline so the timer reflects time elapsed while the page
  // was closed, instead of showing stale time from the moment it was saved.
  if (revived.status === "RUNNING" && revived.sessionTimeout) {
    const remaining = calculateRemaining(revived.sessionTimeout)

    return {
      ...revived,
      remaining,
      status: remaining === 0 ? "IDLE" : "RUNNING",
    }
  }

  // A RUNNING status with no deadline is corrupt persisted state (should be
  // unreachable in practice); fall back to IDLE rather than trusting a
  // remaining value with nothing to recompute it from.
  if (revived.status === "RUNNING") {
    return { ...revived, status: "IDLE" }
  }

  return revived
}

export const loadTimerState = (fallback: PomodoroCycle): PomodoroCycle => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback

    return reviveTimerState(JSON.parse(raw), fallback)
  } catch {
    return fallback
  }
}

export const saveTimerState = (timer: PomodoroCycle): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timer))
  } catch {
    // Ignore write failures (e.g. Safari private mode, storage quota exceeded).
  }
}
