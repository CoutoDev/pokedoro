import type { z } from 'zod'

import type { caughtPokemonSchema, pokemonRaritySchema, pokemonSpeciesSchema } from '@/shared/schemas/pokemonCatch'

/**
 * Rarity tier: indicates probability of species appearing in catch selection
 */
export type PokemonRarity = z.infer<typeof pokemonRaritySchema>

/**
 * Individual Pokemon species data: id, name, sprite URL, and rarity tier
 */
export type PokemonSpecies = z.infer<typeof pokemonSpeciesSchema>

/**
 * Individual caught Pokemon record: species ID and ISO8601 timestamp
 */
export type CaughtPokemon = z.infer<typeof caughtPokemonSchema>

// Compile-time validation: ensure type structures match expectations
const _speciesSatisfies: PokemonSpecies = {
  id: 25,
  name: 'Pikachu',
  spriteUrl: 'https://example.com/pikachu.png',
  rarity: 'common',
} as const satisfies PokemonSpecies

const _caughtSatisfies: CaughtPokemon = {
  speciesId: 25,
  caughtAt: '2026-07-27T12:00:00Z',
} as const satisfies CaughtPokemon
