import { calculateRemaining } from "@/utils/calculateRemaining"
import type { PomodoroCycle } from "@/types/pomodoro-cycle"

const STORAGE_KEY = "pokedoro-timer-state"

const DATE_FIELDS = ["sessionTimeout", "pausedAt", "resumedAt", "resetedAt", "interval"] as const

const reviveDate = (value: unknown): Date | null => {
  if (typeof value !== "string") return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export const reviveTimerState = (parsed: unknown, fallback: PomodoroCycle): PomodoroCycle => {
  if (typeof parsed !== "object" || parsed === null) return fallback

  const revived: PomodoroCycle = { ...fallback, ...parsed }
  for (const field of DATE_FIELDS) {
    revived[field] = reviveDate((parsed as Record<string, unknown>)[field])
  }

  // `remaining` is only a snapshot for a RUNNING session — recompute it from
  // the revived deadline so the timer reflects time elapsed while the page
  // was closed, instead of showing stale time from the moment it was saved.
  if (revived.status === "RUNNING") {
    const remaining = calculateRemaining(revived.sessionTimeout, revived.focusDuration)

    return {
      ...revived,
      remaining,
      status: remaining === 0 ? "IDLE" : "RUNNING",
    }
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
