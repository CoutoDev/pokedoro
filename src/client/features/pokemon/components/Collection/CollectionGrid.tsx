import { capitalizeName } from "@/client/features/pokemon/capitalizeName"
import { pokemonSpecies } from "@/shared/data/pokemonSpecies"
import type { PokemonCatchesSummary } from "@/shared/schemas/pokemonCatch"

export interface CollectionGridProps {
  catches: PokemonCatchesSummary
}

const CollectionGrid = ({ catches }: CollectionGridProps) => {
  const caughtMap = new Map(catches.map((c) => [c.speciesId, c]))

  return (
    <div className="grid grid-cols-6 gap-2 p-4 sm:grid-cols-8 lg:grid-cols-12">
      {pokemonSpecies.map((species) => {
        const caught = caughtMap.get(species.id)
        const displayName = capitalizeName(species.name)

        return caught ? (
          <div key={species.id} className="relative flex flex-col items-center">
            <img src={species.spriteUrl} alt={displayName} className="h-12 w-12 object-contain" />
            {caught.count > 1 && (
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-focus text-xs font-bold text-white">
                {caught.count}
              </span>
            )}
            <p className="mt-1 w-full truncate text-center text-xs font-semibold text-ink-soft">{displayName}</p>
          </div>
        ) : (
          <div key={species.id} className="flex flex-col items-center opacity-30">
            <div className="h-12 w-12 rounded-lg bg-ink-soft/20" aria-hidden="true" />
            <p className="mt-1 text-center text-xs font-semibold text-muted">
              #{species.id.toString().padStart(3, '0')}
            </p>
          </div>
        )
      })}
    </div>
  )
}

export default CollectionGrid
