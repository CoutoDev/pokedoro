import { useEffect, useState } from "react"

import { getPokemonCatches } from "@/client/api"
import { useAuthContext } from "@/client/features/auth/AuthContext"
import type { PokemonCatchesSummary } from "@/shared/schemas/pokemonCatch"

import CollectionGrid from "./CollectionGrid"

const Collection = () => {
  const { auth } = useAuthContext()
  const [catches, setCatches] = useState<PokemonCatchesSummary>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (auth.status !== 'authenticated') {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    getPokemonCatches().then((result) => {
      if (cancelled) return

      if (result === null) {
        setError("Couldn't load your collection — try again")
      } else {
        setCatches(result)
      }
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [auth.status])

  if (auth.status !== 'authenticated') {
    return (
      <div className="flex flex-col items-center gap-2 p-6 text-center">
        <p className="font-heading text-lg font-bold text-ink-soft">Sign in to see your collection</p>
        <p className="text-sm font-semibold text-muted">
          Catch Pokémon by completing focus sessions and breaks — sign in above to start saving them.
        </p>
      </div>
    )
  }

  if (loading) {
    return <p className="p-6 text-center text-sm font-semibold text-muted">Loading your collection…</p>
  }

  if (error) {
    return <p className="p-6 text-center text-sm font-semibold text-red-500">{error}</p>
  }

  return <CollectionGrid catches={catches} />
}

export default Collection
