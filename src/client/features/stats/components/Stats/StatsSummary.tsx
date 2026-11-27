import { formatDuration } from "@/client/features/stats/formatDuration"
import type { CycleStats } from "@/shared/schemas/cycleStats"
import { FOCUSES_PER_SET } from "@/shared/stats/groupIntoSets"

interface StatsSummaryProps {
  stats: CycleStats
}

const Tile = ({ label, value, hint }: { label: string; value: string | number; hint?: string }) => (
  <div className="flex flex-col gap-1 rounded-lg border-[3px] border-ink-soft bg-card p-3 shadow-[3px_3px_0_0_var(--color-ink-soft)]">
    <dt className="text-[11px] font-semibold uppercase text-muted">{label}</dt>
    <dd className="font-heading text-lg leading-tight text-ink-soft">{value}</dd>
    {hint && <p className="text-[11px] font-semibold text-muted">{hint}</p>}
  </div>
)

const StatsSummary = ({ stats }: StatsSummaryProps) => {
  const { byPhase } = stats
  const rate = stats.focusCompletionRate === null ? "—" : `${Math.round(stats.focusCompletionRate * 100)}%`
  const stopped = byPhase.FOCUS.stopped + byPhase.SHORT_BREAK.stopped + byPhase.LONG_BREAK.stopped

  return (
    <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
      <Tile
        label="Cycles completed"
        value={stats.completedSets}
        hint={`${stats.focusTowardNextSet}/${FOCUSES_PER_SET} focus toward next`}
      />
      <Tile label="Focus sessions" value={byPhase.FOCUS.completed} hint={`${rate} finished`} />
      <Tile label="Stopped early" value={stopped} hint={`${byPhase.FOCUS.stopped} focus`} />
      <Tile label="Focus time" value={formatDuration(stats.focusSecondsCompleted)} hint={`${formatDuration(stats.focusSecondsStopped)} in stopped`} />
      <Tile label="Breaks taken" value={byPhase.SHORT_BREAK.completed + byPhase.LONG_BREAK.completed} hint={`${byPhase.LONG_BREAK.completed} long`} />
      <Tile label="Pokémon caught" value={stats.totalCatches} hint={`${stats.uniqueSpecies} species`} />
    </dl>
  )
}

export default StatsSummary
