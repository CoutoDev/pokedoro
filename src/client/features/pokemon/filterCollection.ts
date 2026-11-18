import type { PokemonRarity, PokemonSpecies, PokemonType } from '@/shared/types/pokemon'

export type CatchStatusFilter = 'all' | 'caught' | 'uncaught'

export interface CollectionFilterState {
  search: string
  status: CatchStatusFilter
  type: PokemonType | 'all'
  rarity: PokemonRarity | 'all'
}

export const initialCollectionFilters: CollectionFilterState = {
  search: '',
  status: 'all',
  type: 'all',
  rarity: 'all',
}

export const hasActiveFilters = (f: CollectionFilterState) =>
  f.search.trim() !== '' || f.status !== 'all' || f.type !== 'all' || f.rarity !== 'all'

/** Matches name (substring), dex number ("25" or "#25"), or type name. */
export const matchesSearch = (species: PokemonSpecies, search: string) => {
  const q = search.trim().toLowerCase().replace(/^#/, '')
  if (q === '') return true
  return (
    species.name.toLowerCase().includes(q) ||
    String(species.id) === q ||
    species.types.some((t) => t.includes(q))
  )
}

export const matchesFilters = (species: PokemonSpecies, caught: boolean, f: CollectionFilterState) =>
  matchesSearch(species, f.search) &&
  (f.status === 'all' || (f.status === 'caught') === caught) &&
  (f.type === 'all' || species.types.includes(f.type)) &&
  (f.rarity === 'all' || species.rarity === f.rarity)
