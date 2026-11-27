import { capitalizeName } from "@/client/features/pokemon/capitalizeName"
import { formatDuration } from "@/client/features/stats/formatDuration"
import { pokemonSpecies } from "@/shared/data/pokemonSpecies"
import type { PhaseRecord, PomodoroSet } from "@/shared/schemas/cycleStats"
import { FOCUSES_PER_SET } from "@/shared/stats/groupIntoSets"

interface StatsHistoryProps {
  sets: PomodoroSet[]
}

const PHASE_LABEL: Record<PhaseRecord["phase"], string> = {
  FOCUS: "Focus",
  SHORT_BREAK: "Break",
  LONG_BREAK: "Long break",
}

const PhaseRow = ({ record }: { record: PhaseRecord }) => {
  const species = record.speciesId === null ? null : pokemonSpecies.find((s) => s.id === record.speciesId)
  const stopped = record.outcome === "STOPPED"

  return (
    <li className="flex items-center gap-2 text-sm font-semibold">
      <span className={stopped ? "text-muted line-through" : "text-ink-soft"}>{PHASE_LABEL[record.phase]}</span>
      <span className="text-xs text-muted">
        {stopped
          ? `stopped at ${formatDuration(record.elapsedSeconds)} of ${formatDuration(record.plannedSeconds)}`
          : formatDuration(record.elapsedSeconds)}
      </span>
      {species && (
        <span className="ml-auto flex items-center gap-1 text-xs text-ink-soft">
          <img src={species.spriteUrl} alt="" aria-hidden="true" className="h-8 w-8 object-contain" />
          {capitalizeName(species.name)}
        </span>
      )}
    </li>
  )
}

const StatsHistory = ({ sets }: StatsHistoryProps) => {
  if (sets.length === 0) {
    return (
      <p className="p-6 text-center text-sm font-semibold text-muted">
        No cycles yet — finish a focus session to start your history.
      </p>
    )
  }

  return (
    <ol className="flex flex-col gap-3">
      {sets.map((set) => (
        <li key={set.index} className="rounded-lg border-[3px] border-ink-soft bg-card p-3">
          <div className="mb-2 flex items-baseline justify-between">
            <h3 className="font-heading text-xs text-ink-soft">Cycle {set.index}</h3>
            <span className="text-xs font-bold text-muted">
              {set.complete ? "Complete" : `In progress · ${set.focusCompleted}/${FOCUSES_PER_SET} focus`}
            </span>
          </div>
          <ul className="flex flex-col gap-1.5">
            {set.phases.map((record) => (
              <PhaseRow key={record.cycleId} record={record} />
            ))}
          </ul>
        </li>
      ))}
    </ol>
  )
}

export default StatsHistory
