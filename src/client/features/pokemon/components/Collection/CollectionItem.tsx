import { X } from "lucide-react"
import { capitalizeName } from "@/client/features/pokemon/capitalizeName"
import { Button } from "@/client/ui/Button"
import type { PokemonSpecies } from "@/shared/schemas/pokemonCatch"
import { RARITY_BADGE } from "../CatchReveal/CatchReveal"
import { cn } from "@/client/lib/cn"

export interface CollectionItemProps {
  pokemon: PokemonSpecies
  count: Number
  handleCloseModal: () => void
}

const CollectionItem = ({ pokemon, count, handleCloseModal }: CollectionItemProps) => {
  const displayName = capitalizeName(pokemon.name)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 sm:items-center">
      <dialog
        id="pokemon-modal"
        className="relative m-0 top-auto max-h-[86vh] w-full max-w-md overflow-y-auto rounded-t-2xl border-4 border-b-0 border-ink bg-card p-6 text-center shadow-none sm:rounded-2xl sm:border-b-4 sm:m-auto sm:top-0"
        open
      >
        <Button variant="ghost" size="sm" onClick={handleCloseModal} aria-label="Close">
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
        <div className="mx-auto my-4 flex h-32 w-32 items-center justify-center rounded-xl border-2 border-ink-soft bg-paper">
          <img
            src={pokemon.spriteUrl}
            alt={capitalizeName(pokemon.name)}
            className="h-24 w-24 animate-[pop-in_0.5s_cubic-bezier(.34,1.56,.64,1)] object-contain"
          />
        </div>
        <p className="font-heading text-base font-normal text-ink-soft">{capitalizeName(pokemon.name)}</p>
        <span className={cn("mb-6 mt-2 inline-block rounded px-3 py-1 text-xs font-extrabold uppercase", RARITY_BADGE[pokemon.rarity])}>
          {pokemon.rarity}
        </span>
        <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-ink bg-focus text-xs font-bold text-card">x{`${count}`}</span>
      </dialog>
    </div>
  )
}

export default CollectionItem
