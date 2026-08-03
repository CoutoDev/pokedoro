import { capitalizeName } from "@/client/features/pokemon/capitalizeName"
import type { PokemonCatchesSummary } from "@/shared/schemas/pokemonCatch"
import type { PokemonSpecies } from "@/shared/types/pokemon"

export interface CollectionGridItem {
  species: PokemonSpecies
  caught: PokemonCatchesSummary[number] | null
}

export interface CollectionGridProps {
  items: CollectionGridItem[]
  handleSpeciesClick: (species: PokemonSpecies, count: number) => void
}

const CollectionGrid = ({ items, handleSpeciesClick }: CollectionGridProps) => {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
      {items.map(({ species, caught }) => {
        const displayName = capitalizeName(species.name)

        return caught ? (
          <div key={species.id} className="relative flex flex-col items-center gap-1 rounded-lg border-[3px] border-ink-soft bg-card p-2 shadow-[3px_3px_0_0_var(--color-ink-soft)]" onClick={() => handleSpeciesClick(species, caught.count)}>
            <div className="flex h-12 w-12 items-center justify-center rounded-md border-2 border-ink-soft bg-paper">
              <img src={species.spriteUrl} alt={displayName} className="h-10 w-10 object-contain" />
            </div>
            {caught.count > 1 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-ink bg-focus text-xs font-bold text-card">
                {caught.count}
              </span>
            )}
            <p className="w-full text-center text-[11px] font-heading font-normal leading-tight text-ink-soft">{displayName}</p>
          </div>
        ) : (
          <div key={species.id} className="flex flex-col items-center gap-1 rounded-lg border-[3px] border-dashed border-muted p-2 opacity-60">
            <div className="h-12 w-12 rounded-md border-2 border-dashed border-muted bg-paper-soft" aria-hidden="true" />
            <p className="text-center text-[10px] font-semibold text-muted">
              #{species.id.toString().padStart(3, '0')}
            </p>
          </div>
        )
      })}
    </div>
  )
}

export default CollectionGrid
