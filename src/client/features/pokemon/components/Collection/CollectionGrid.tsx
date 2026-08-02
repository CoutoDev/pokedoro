import { capitalizeName } from "@/client/features/pokemon/capitalizeName"
import { pokemonSpecies } from "@/shared/data/pokemonSpecies"
import type { PokemonCatchesSummary } from "@/shared/schemas/pokemonCatch"
import type { PokemonSpecies } from "@/shared/types/pokemon"

export interface CollectionGridProps {
  catches: PokemonCatchesSummary
  handleSpeciesClick: (species: PokemonSpecies, count: number) => void
}

const CollectionGrid = ({ catches, handleSpeciesClick }: CollectionGridProps) => {
  const caughtMap = new Map(catches.map((c) => [c.speciesId, c]))
  
  return (
    <div className="grid grid-cols-4 gap-2.5 p-1 sm:grid-cols-6 lg:grid-cols-9">
      {pokemonSpecies.map((species) => {
        const caught = caughtMap.get(species.id)
        const displayName = capitalizeName(species.name)

        return caught ? (
          <div key={species.id} className="relative flex flex-col items-center rounded-lg border-[3px] border-ink-soft bg-card p-2 shadow-[3px_3px_0_0_var(--color-ink-soft)]" onClick={() => handleSpeciesClick(species, caught.count)}>
            <div className="flex h-12 w-12 items-center justify-center rounded-md border-2 border-ink-soft bg-paper">
              <img src={species.spriteUrl} alt={displayName} className="h-10 w-10 object-contain" />
            </div>
            {caught.count > 1 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-ink bg-focus text-xs font-bold text-card">
                {caught.count}
              </span>
            )}
            <p className="mt-1.5 w-full truncate text-center text-[10px] font-heading font-normal text-ink-soft">{displayName}</p>
          </div>
        ) : (
          <div key={species.id} className="flex flex-col items-center rounded-lg border-[3px] border-dashed border-muted p-2 opacity-60">
            <div className="h-12 w-12 rounded-md border-2 border-dashed border-muted bg-paper-soft" aria-hidden="true" />
            <p className="mt-1.5 text-center text-[10px] font-semibold text-muted">
              #{species.id.toString().padStart(3, '0')}
            </p>
          </div>
        )
      })}
    </div>
  )
}

export default CollectionGrid
