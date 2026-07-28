/**
 * Generate static Pokemon species data from PokeAPI
 *
 * This script fetches Gen 1 Pokemon (IDs 1-151) from PokeAPI, classifies them
 * by rarity tier, validates the results, and emits a TypeScript module.
 *
 * Usage: bun scripts/generatePokemonSpecies.ts
 *
 * Output: src/shared/data/pokemonSpecies.ts (auto-generated, do not edit)
 */

import { writeFileSync } from 'fs'
import { join } from 'path'

import type { PokemonSpecies } from '@/shared/types/pokemon'
import { pokemonSpeciesArraySchema } from '@/shared/schemas/pokemonCatch'

const BASE_URL = 'https://pokeapi.co/api/v2'
const MIN_ID = 1
const MAX_ID = 151
const POLITE_DELAY_MS = 50
const FETCH_TIMEOUT_MS = 30000
const MAX_RETRIES = 3

// ============================================================================
// Types
// ============================================================================

interface PokeAPISpecies {
  id: number
  name: string
  is_legendary: boolean
  is_mythical: boolean
  capture_rate: number
}

interface PokemonRaw {
  id: number
  name: string
  sprites: {
    front_default: string | null
  }
}

// ============================================================================
// Utility functions
// ============================================================================

/**
 * Sleep for the specified duration in milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Fetch with retry logic and timeout
 */
async function fetchWithRetry(
  url: string,
  retryCount = 0
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(url, { signal: controller.signal })

    // Success
    if (response.ok) {
      return response
    }

    // Non-retryable errors
    if (response.status === 400 || response.status === 404) {
      throw new Error(
        `HTTP ${response.status} for ${url} (non-retryable)`
      )
    }

    // Retryable errors (429, 503, 5xx)
    if (retryCount < MAX_RETRIES) {
      const backoffMs = Math.pow(2, retryCount) * 1000 // 1s, 2s, 4s
      console.log(
        `  Retry ${retryCount + 1}/${MAX_RETRIES} after ${backoffMs}ms (HTTP ${response.status})`
      )
      await sleep(backoffMs)
      return fetchWithRetry(url, retryCount + 1)
    }

    throw new Error(
      `HTTP ${response.status} for ${url} after ${MAX_RETRIES} retries`
    )
  } catch (err) {
    // Timeout (AbortError) or other network error
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        if (retryCount < MAX_RETRIES) {
          const backoffMs = Math.pow(2, retryCount) * 1000
          console.log(
            `  Retry ${retryCount + 1}/${MAX_RETRIES} after ${backoffMs}ms (timeout)`
          )
          await sleep(backoffMs)
          return fetchWithRetry(url, retryCount + 1)
        }
        throw new Error(`Timeout after ${MAX_RETRIES} retries: ${url}`)
      }
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Classify rarity based on PokeAPI flags and capture rate
 *
 * Classification rule (from task spec Acceptance Criteria):
 *   - is_legendary OR is_mythical → 'rare'
 *   - 20 ≤ capture_rate ≤ 45 → 'uncommon'
 *   - else → 'common'
 */
function classifyRarity(
  isLegendary: boolean,
  isMythical: boolean,
  captureRate: number
): PokemonSpecies['rarity'] {
  if (isLegendary || isMythical) {
    return 'rare'
  }
  if (captureRate >= 20 && captureRate <= 45) {
    return 'uncommon'
  }
  return 'common'
}

/**
 * Fetch a single Pokemon species and its sprite data
 */
async function fetchSpecies(id: number): Promise<PokemonSpecies> {
  // Fetch species data
  const speciesUrl = `${BASE_URL}/pokemon-species/${id}/`
  const speciesResponse = await fetchWithRetry(speciesUrl)
  const speciesData = (await speciesResponse.json()) as PokeAPISpecies

  // Fetch pokemon (sprite) data
  const pokemonUrl = `${BASE_URL}/pokemon/${id}/`
  const pokemonResponse = await fetchWithRetry(pokemonUrl)
  const pokemonData = (await pokemonResponse.json()) as PokemonRaw

  // Validate sprite URL
  const spriteUrl = pokemonData.sprites.front_default
  if (!spriteUrl || spriteUrl.trim() === '') {
    throw new Error(`Pokemon ID ${id} has no sprite URL`)
  }

  // Validate sprite URL is HTTPS
  if (!spriteUrl.startsWith('https://')) {
    throw new Error(`Pokemon ID ${id} sprite URL is not HTTPS: ${spriteUrl}`)
  }

  // Classify rarity
  const rarity = classifyRarity(
    speciesData.is_legendary,
    speciesData.is_mythical,
    speciesData.capture_rate
  )

  // Name normalization: PokeAPI uses lowercase with hyphens (e.g., "bulbasaur", "mr-mime")
  // Keep as-is from PokeAPI for data consistency
  return {
    id: speciesData.id,
    name: speciesData.name,
    spriteUrl,
    rarity,
  }
}

/**
 * Generate the output TypeScript module as a string
 */
function generateModuleCode(species: PokemonSpecies[]): string {
  const timestamp = new Date().toISOString()

  const speciesCode = species
    .map(
      (s) =>
        `  {\n    id: ${s.id},\n    name: '${s.name}',\n    spriteUrl: '${s.spriteUrl}',\n    rarity: '${s.rarity}',\n  },`
    )
    .join('\n')

  return `/**
 * Auto-generated Pokemon species data
 * Generated: ${timestamp}
 * DO NOT EDIT MANUALLY
 *
 * To regenerate, run: bun scripts/generatePokemonSpecies.ts
 */

import type { PokemonSpecies } from '@/shared/types/pokemon'

export const pokemonSpecies: PokemonSpecies[] = [
${speciesCode}
]

export default pokemonSpecies
`
}

/**
 * Validate data against schema
 */
function validateData(data: unknown): PokemonSpecies[] {
  const result = pokemonSpeciesArraySchema.safeParse(data)
  if (!result.success) {
    throw new Error(
      `Schema validation failed: ${result.error.message}`
    )
  }
  return result.data
}

/**
 * Count species by rarity tier
 */
function analyzeCounts(species: PokemonSpecies[]): {
  rare: string[]
  uncommon: string[]
  common: string[]
} {
  const counts = {
    rare: [] as string[],
    uncommon: [] as string[],
    common: [] as string[],
  }

  for (const s of species) {
    if (s.rarity === 'rare') {
      counts.rare.push(`${s.name} (${s.id})`)
    } else if (s.rarity === 'uncommon') {
      counts.uncommon.push(`${s.name} (${s.id})`)
    } else {
      counts.common.push(`${s.name} (${s.id})`)
    }
  }

  return counts
}

/**
 * Main execution
 */
async function main() {
  console.log('Pokédoro: Generating Pokemon Species Data')
  console.log('=========================================\n')

  try {
    console.log(`Fetching ${MAX_ID - MIN_ID + 1} Pokemon from PokeAPI...`)
    console.log(`(with ${POLITE_DELAY_MS}ms polite delay between requests)\n`)

    const species: PokemonSpecies[] = []
    const startTime = Date.now()

    for (let id = MIN_ID; id <= MAX_ID; id++) {
      process.stdout.write(`\r  Fetching ID ${id.toString().padStart(3)}/${MAX_ID}...`)

      try {
        const s = await fetchSpecies(id)
        species.push(s)

        // Polite delay between requests (except after last)
        if (id < MAX_ID) {
          await sleep(POLITE_DELAY_MS)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        throw new Error(`Failed to fetch Pokemon ID ${id}: ${message}`)
      }
    }

    process.stdout.write('\r')

    const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`✓ Fetched ${species.length} species in ${elapsedSeconds}s\n`)

    // Sort by ID for stable output
    species.sort((a, b) => a.id - b.id)

    // Validate data structure
    console.log('Validating data against schema...')
    const validated = validateData(species)
    console.log(`✓ All ${validated.length} species validated\n`)

    // Analyze distribution
    console.log('Rarity Distribution:')
    const counts = analyzeCounts(validated)
    console.log(`  Rare (${counts.rare.length}): ${counts.rare.join(', ')}`)
    console.log(`  Uncommon (${counts.uncommon.length}): [${counts.uncommon.length} species]`)
    console.log(`  Common (${counts.common.length}): [${counts.common.length} species]`)
    console.log()

    // Generate output file
    const moduleCode = generateModuleCode(validated)
    const outputPath = join(import.meta.dir, '..', 'src', 'shared', 'data', 'pokemonSpecies.ts')

    console.log(`Writing to: ${outputPath}`)
    writeFileSync(outputPath, moduleCode, 'utf-8')
    console.log('✓ Generated pokemonSpecies.ts\n')

    console.log('=========================================')
    console.log('✓ Success: Pokemon species data generated')
  } catch (err) {
    console.error('\n✗ Error:', err instanceof Error ? err.message : String(err))
    process.exit(1)
  }
}

main()
