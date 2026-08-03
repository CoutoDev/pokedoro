import { useEffect, useMemo, useState } from "react"

import { getPokemonCatches } from "@/client/api"
import { useAuthContext } from "@/client/features/auth/AuthContext"
import { pokemonSpecies } from "@/shared/data/pokemonSpecies"
import type { PokemonCatchesSummary } from "@/shared/schemas/pokemonCatch"
import type { PokemonSpecies } from "@/shared/types/pokemon"

import CollectionFilters, { type CollectionFilter } from "./CollectionFilters"
import CollectionGrid from "./CollectionGrid"
import CollectionItem from "./CollectionItem"
import CollectionPagination from "./CollectionPagination"

const PAGE_SIZE = 10

const Collection = () => {
  const { auth } = useAuthContext()
  const [catches, setCatches] = useState<PokemonCatchesSummary>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPokemonModalOpen, setIsPokemonModalOpen] = useState(false)
  const [selectedSpecies, setSelectedSpecies] = useState<{ species: PokemonSpecies; count: Number }>()
  const [filter, setFilter] = useState<CollectionFilter>('all')
  const [page, setPage] = useState(1)

  const handleSpeciesClick = (species: PokemonSpecies, count: number) => {
    setIsPokemonModalOpen(true)
    setSelectedSpecies({ species, count })
  }

  const handleCloseModal = () => {
    setIsPokemonModalOpen(false)
  }

  const handleFilterChange = (nextFilter: CollectionFilter) => {
    setFilter(nextFilter)
    setPage(1)
  }

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

  const items = useMemo(() => {
    const caughtMap = new Map(catches.map((c) => [c.speciesId, c]))

    return pokemonSpecies
      .map((species) => ({ species, caught: caughtMap.get(species.id) ?? null }))
      .filter((item) => {
        if (filter === 'caught') return item.caught !== null
        if (filter === 'uncaught') return item.caught === null
        return true
      })
  }, [catches, filter])

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = items.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  if (auth.status !== 'authenticated') {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border-[3px] border-dashed border-muted bg-card p-8 text-center">
        <p className="font-body text-lg font-extrabold text-ink-soft">Sign in to see your collection</p>
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
    return <p className="p-6 text-center text-sm font-semibold text-focus">{error}</p>
  }

  return (
    <div className="flex flex-col gap-4">
      {isPokemonModalOpen && (
        <CollectionItem pokemon={selectedSpecies!.species} count={selectedSpecies!.count} handleCloseModal={handleCloseModal} />
      )}
      <CollectionFilters filter={filter} onChange={handleFilterChange} />
      <CollectionGrid handleSpeciesClick={handleSpeciesClick} items={pageItems} />
      <CollectionPagination
        page={currentPage}
        totalPages={totalPages}
        onPrevious={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
      />
    </div>
  )
}

export default Collection
