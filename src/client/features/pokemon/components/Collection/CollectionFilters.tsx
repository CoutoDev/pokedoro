import { Button } from "@/client/ui/Button"

export type CollectionFilter = 'all' | 'caught' | 'uncaught'

export interface CollectionFiltersProps {
  filter: CollectionFilter
  onChange: (filter: CollectionFilter) => void
}

const FILTERS: { value: CollectionFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'caught', label: 'Caught' },
  { value: 'uncaught', label: 'Uncaught' },
]

const CollectionFilters = ({ filter, onChange }: CollectionFiltersProps) => (
  <div role="group" aria-label="Filter by catch status" className="flex justify-center gap-2">
    {FILTERS.map(({ value, label }) => (
      <Button
        key={value}
        type="button"
        variant={filter === value ? 'primary' : 'ghost'}
        size="sm"
        aria-pressed={filter === value}
        onClick={() => onChange(value)}
      >
        {label}
      </Button>
    ))}
  </div>
)

export default CollectionFilters
