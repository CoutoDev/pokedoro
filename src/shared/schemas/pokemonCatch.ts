import { z } from 'zod'

/**
 * Rarity tier for Pokemon species: determines probability of appearing in catch selection
 */
export const pokemonRaritySchema = z.enum(['rare', 'uncommon', 'common'])

/**
 * Elemental type of a Pokemon (Gen 1 pool)
 */
export const pokemonTypeSchema = z.enum([
  'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground',
  'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'steel', 'fairy', 'dark',
])

/**
 * Individual caught Pokemon record: species ID + timestamp
 */
export const caughtPokemonSchema = z.object({
  speciesId: z.number().int().min(1).max(151),
  caughtAt: z.iso.datetime(),
})

export type CaughtPokemon = z.infer<typeof caughtPokemonSchema>

/**
 * Collection summary: aggregated catches grouped by species with count and most recent timestamp
 */
export const pokemonCatchesSummarySchema = z.array(
  z.object({
    speciesId: z.number().int().min(1).max(151),
    count: z.number().int().min(1),
    lastCaughtAt: z.iso.datetime(),
  })
)

export type PokemonCatchesSummary = z.infer<typeof pokemonCatchesSummarySchema>

/**
 * Individual Pokemon species: static reference data
 */
export const pokemonSpeciesSchema = z.object({
  id: z.number().int().min(1).max(151),
  name: z.string().min(1),
  spriteUrl: z.string(),
  rarity: pokemonRaritySchema,
  types: z.array(pokemonTypeSchema).min(1).max(2),
})

export type PokemonSpecies = z.infer<typeof pokemonSpeciesSchema>

/**
 * Array of all Pokemon species: used for validation during data generation
 */
export const pokemonSpeciesArraySchema = z.array(pokemonSpeciesSchema)

export type PokemonSpeciesArray = z.infer<typeof pokemonSpeciesArraySchema>
