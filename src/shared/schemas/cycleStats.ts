import { z } from 'zod'

import { phaseSchema } from '@/shared/schemas/pomodoroCycle'

export const outcomeSchema = z.enum(['COMPLETED', 'STOPPED'])
export type Outcome = z.infer<typeof outcomeSchema>

/** One recorded phase: a FOCUS/SHORT_BREAK/LONG_BREAK that ran to zero or was reset early. */
export const phaseRecordSchema = z.object({
  cycleId: z.string(),
  phase: phaseSchema,
  outcome: outcomeSchema,
  plannedSeconds: z.number().int().min(0),
  elapsedSeconds: z.number().int().min(0),
  endedAt: z.iso.datetime(),
  /** Species caught for this phase; null for STOPPED phases (they earn no catch). */
  speciesId: z.number().int().min(1).max(151).nullable(),
})
export type PhaseRecord = z.infer<typeof phaseRecordSchema>

/** A classic Pomodoro cycle ("set"): see `groupIntoSets` for the grouping rule. */
export const pomodoroSetSchema = z.object({
  /** 1-based, in chronological order. */
  index: z.number().int().min(1),
  complete: z.boolean(),
  focusCompleted: z.number().int().min(0),
  phases: z.array(phaseRecordSchema),
})
export type PomodoroSet = z.infer<typeof pomodoroSetSchema>

const outcomeCounts = z.object({
  completed: z.number().int().min(0),
  stopped: z.number().int().min(0),
})

export const cycleStatsSchema = z.object({
  completedSets: z.number().int().min(0),
  /** Completed focus sessions since the last finished set (0 .. FOCUSES_PER_SET - 1). */
  focusTowardNextSet: z.number().int().min(0),
  byPhase: z.object({
    FOCUS: outcomeCounts,
    SHORT_BREAK: outcomeCounts,
    LONG_BREAK: outcomeCounts,
  }),
  /** Completed / (completed + stopped) focus sessions, 0..1; null when there are none yet. */
  focusCompletionRate: z.number().min(0).max(1).nullable(),
  focusSecondsCompleted: z.number().int().min(0),
  /** Time spent in focus sessions that were reset before finishing. */
  focusSecondsStopped: z.number().int().min(0),
  totalCatches: z.number().int().min(0),
  uniqueSpecies: z.number().int().min(0),
})
export type CycleStats = z.infer<typeof cycleStatsSchema>

export const cycleStatsResponseSchema = z.object({
  stats: cycleStatsSchema,
  /** Most recent sets first. */
  sets: z.array(pomodoroSetSchema),
})
export type CycleStatsResponse = z.infer<typeof cycleStatsResponseSchema>
