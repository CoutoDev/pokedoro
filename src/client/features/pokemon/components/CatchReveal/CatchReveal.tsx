import { LogIn, PartyPopper, RotateCcw } from "lucide-react"

import { capitalizeName } from "@/client/features/pokemon/capitalizeName"
import { pokemonSpecies } from "@/shared/data/pokemonSpecies"
import type { CaughtPokemon, PokemonRarity } from "@/shared/types/pokemon"
import { Button } from "@/client/ui/Button"
import { Dialog } from "@/client/ui/Dialog"
import { cn } from "@/client/lib/cn"

export const RARITY_BADGE: Record<PokemonRarity, string> = {
  rare: "bg-focus text-card",
  uncommon: "bg-short text-card",
  common: "bg-ink-soft text-card",
}

export interface CatchRevealProps {
  caughtPokemon: CaughtPokemon | null
  showLoginNudge: boolean
  error: string | null
  onDismiss: () => void
}

const CatchReveal = ({ caughtPokemon, showLoginNudge, error, onDismiss }: CatchRevealProps) => {
  const isOpen = !!(caughtPokemon || showLoginNudge || error)
  const species = caughtPokemon ? pokemonSpecies.find((s) => s.id === caughtPokemon.speciesId) : null

  return (
    <Dialog open={isOpen} onClose={onDismiss} className="catch-reveal text-center">
      {caughtPokemon && species ? (
        <CaughtContent species={species} onDismiss={onDismiss} />
      ) : showLoginNudge ? (
        <LoginNudgeContent onDismiss={onDismiss} />
      ) : error ? (
        <ErrorContent error={error} onDismiss={onDismiss} />
      ) : null}
    </Dialog>
  )
}

function CaughtContent({
  species,
  onDismiss,
}: {
  species: { name: string; spriteUrl: string; rarity: PokemonRarity }
  onDismiss: () => void
}) {
  return (
    <>
      <div aria-hidden="true" className="animate-[sparkle_1.4s_ease-in-out_infinite] text-lg text-[#ffb703]">
        <PartyPopper className="mx-auto h-6 w-6" />
      </div>
      <h2 className="mt-2 font-heading text-base font-normal text-ink-soft">Caught!</h2>
      <div className="mx-auto my-4 flex h-32 w-32 items-center justify-center rounded-xl border-2 border-ink-soft bg-paper">
        <img
          src={species.spriteUrl}
          alt={capitalizeName(species.name)}
          className="h-24 w-24 animate-[pop-in_0.5s_cubic-bezier(.34,1.56,.64,1)] object-contain"
        />
      </div>
      <p className="font-heading text-base font-normal text-ink-soft">{capitalizeName(species.name)}</p>
      <span className={cn("mb-6 mt-2 inline-block rounded px-3 py-1 text-xs font-extrabold uppercase", RARITY_BADGE[species.rarity])}>
        {species.rarity}
      </span>
      <Button variant="primary" className="w-full" onClick={onDismiss}>
        Got it!
      </Button>
    </>
  )
}

function LoginNudgeContent({ onDismiss }: { onDismiss: () => void }) {
  return (
    <>
      <h2 className="font-body text-lg font-extrabold text-ink-soft">Sign in to catch Pokémon</h2>
      <p className="mb-6 mt-2 text-sm font-semibold text-muted">
        Build your collection by creating an account — this catch didn't count.
      </p>
      {/*
        No routing/lifted Login state exists to open the header's sign-in
        dialog programmatically (out of scope per the task's "no routing
        library" constraint); dismissing here just closes the nudge, and the
        always-visible header button handles the actual sign-in flow.
      */}
      <Button variant="primary" className="w-full" onClick={onDismiss}>
        <LogIn className="h-4 w-4" aria-hidden="true" />
        Sign in
      </Button>
    </>
  )
}

function ErrorContent({ error, onDismiss }: { error: string; onDismiss: () => void }) {
  return (
    <>
      <h2 className="font-body text-lg font-extrabold text-ink-soft">Couldn't catch it</h2>
      <p className="mb-6 mt-2 text-sm font-semibold text-muted">{error}</p>
      <Button variant="secondary" className="w-full" onClick={onDismiss}>
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        Try again
      </Button>
    </>
  )
}

export default CatchReveal
