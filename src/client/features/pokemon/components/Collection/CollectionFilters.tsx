import { Button } from "@/client/ui/Button"
import { Input } from "@/client/ui/Input"
import { Label } from "@/client/ui/Label"
import { pokemonRaritySchema, pokemonTypeSchema } from "@/shared/schemas/pokemonCatch"

import { capitalizeName } from "../../capitalizeName"
import {
  hasActiveFilters,
  initialCollectionFilters,
  type CatchStatusFilter,
  type CollectionFilterState,
} from "../../filterCollection"

export type { CollectionFilterState }

export interface CollectionFiltersProps {
  filters: CollectionFilterState
  onChange: (filters: CollectionFilterState) => void
  resultCount: number
}

const STATUSES: { value: CatchStatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'caught', label: 'Caught' },
  { value: 'uncaught', label: 'Uncaught' },
]

const selectClass =
  "h-10 w-full rounded-lg border-[3px] border-ink-soft bg-card px-2 font-body text-sm text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/50"

const CollectionFilters = ({ filters, onChange, resultCount }: CollectionFiltersProps) => {
  const set = <K extends keyof CollectionFilterState>(key: K, value: CollectionFilterState[K]) =>
    onChange({ ...filters, [key]: value })

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <Label htmlFor="collection-search">Search</Label>
        <Input
          id="collection-search"
          type="search"
          placeholder="Name, #number or type"
          value={filters.search}
          onChange={(e) => set('search', e.target.value)}
        />
      </div>

      <div role="group" aria-label="Filter by catch status" className="flex justify-center gap-2">
        {STATUSES.map(({ value, label }) => (
          <Button
            key={value}
            type="button"
            variant={filters.status === value ? 'primary' : 'ghost'}
            size="sm"
            aria-pressed={filters.status === value}
            onClick={() => set('status', value)}
          >
            {label}
          </Button>
        ))}
      </div>

      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <Label htmlFor="collection-type">Type</Label>
          <select
            id="collection-type"
            className={selectClass}
            value={filters.type}
            onChange={(e) => set('type', e.target.value as CollectionFilterState['type'])}
          >
            <option value="all">All types</option>
            {pokemonTypeSchema.options.map((t) => (
              <option key={t} value={t}>{capitalizeName(t)}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <Label htmlFor="collection-rarity">Rarity</Label>
          <select
            id="collection-rarity"
            className={selectClass}
            value={filters.rarity}
            onChange={(e) => set('rarity', e.target.value as CollectionFilterState['rarity'])}
          >
            <option value="all">All rarities</option>
            {pokemonRaritySchema.options.map((r) => (
              <option key={r} value={r}>{capitalizeName(r)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm font-semibold text-muted">
        <span role="status">{resultCount} Pokémon found</span>
        {hasActiveFilters(filters) && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(initialCollectionFilters)}>
            Clear filters
          </Button>
        )}
      </div>
    </div>
  )
}

export default CollectionFilters
