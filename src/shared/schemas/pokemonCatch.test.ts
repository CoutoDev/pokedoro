import { describe, expect, it } from 'bun:test'

import {
  caughtPokemonSchema,
  pokemonCatchesSummarySchema,
  pokemonRaritySchema,
  pokemonSpeciesArraySchema,
  pokemonSpeciesSchema,
} from './pokemonCatch'

describe('pokemonRaritySchema', () => {
  it('accepts valid rarity tiers', () => {
    expect(pokemonRaritySchema.parse('rare')).toBe('rare')
    expect(pokemonRaritySchema.parse('uncommon')).toBe('uncommon')
    expect(pokemonRaritySchema.parse('common')).toBe('common')
  })

  it('rejects invalid rarity tiers', () => {
    expect(() => pokemonRaritySchema.parse('legendary')).toThrow()
    expect(() => pokemonRaritySchema.parse('epic')).toThrow()
    expect(() => pokemonRaritySchema.parse('')).toThrow()
  })
})

describe('caughtPokemonSchema', () => {
  it('accepts valid caught pokemon', () => {
    const valid = caughtPokemonSchema.parse({
      speciesId: 25,
      caughtAt: '2026-07-27T12:00:00Z',
    })
    expect(valid.speciesId).toBe(25)
    expect(valid.caughtAt).toBe('2026-07-27T12:00:00Z')
  })

  it('validates speciesId boundaries (BVA)', () => {
    // Minimum boundary: 1 (accept)
    expect(() => caughtPokemonSchema.parse({ speciesId: 1, caughtAt: '2026-07-27T12:00:00Z' })).not.toThrow()

    // Below minimum: 0 (reject)
    expect(() => caughtPokemonSchema.parse({ speciesId: 0, caughtAt: '2026-07-27T12:00:00Z' })).toThrow()

    // Maximum boundary: 151 (accept)
    expect(() =>
      caughtPokemonSchema.parse({ speciesId: 151, caughtAt: '2026-07-27T12:00:00Z' })
    ).not.toThrow()

    // Above maximum: 152 (reject)
    expect(() => caughtPokemonSchema.parse({ speciesId: 152, caughtAt: '2026-07-27T12:00:00Z' })).toThrow()
  })

  it('validates caughtAt is ISO8601 datetime', () => {
    // Valid ISO8601
    expect(() => caughtPokemonSchema.parse({ speciesId: 25, caughtAt: '2026-07-27T12:00:00Z' })).not.toThrow()
    expect(() =>
      caughtPokemonSchema.parse({ speciesId: 25, caughtAt: '2026-07-27T12:00:00.123Z' })
    ).not.toThrow()

    // Invalid datetime format
    expect(() => caughtPokemonSchema.parse({ speciesId: 25, caughtAt: 'not-a-date' })).toThrow()
    expect(() => caughtPokemonSchema.parse({ speciesId: 25, caughtAt: '2026-07-27' })).toThrow()
  })

  it('uses safeParse to return error object instead of throwing', () => {
    const result = caughtPokemonSchema.safeParse({ speciesId: 999, caughtAt: 'invalid' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBeDefined()
      expect(result.error.issues.length).toBeGreaterThan(0)
    }
  })
})

describe('pokemonCatchesSummarySchema', () => {
  it('accepts array of catch summaries', () => {
    const valid = pokemonCatchesSummarySchema.parse([
      { speciesId: 1, count: 1, lastCaughtAt: '2026-07-27T12:00:00Z' },
      { speciesId: 25, count: 3, lastCaughtAt: '2026-07-27T13:00:00Z' },
    ])
    expect(valid).toHaveLength(2)
    expect(valid[0]?.count).toBe(1)
    expect(valid[1]?.count).toBe(3)
  })

  it('accepts empty array', () => {
    const valid = pokemonCatchesSummarySchema.parse([])
    expect(valid).toHaveLength(0)
  })

  it('rejects non-array input', () => {
    expect(() => pokemonCatchesSummarySchema.parse({ speciesId: 1, count: 1 })).toThrow()
    expect(() => pokemonCatchesSummarySchema.parse('not an array')).toThrow()
  })

  it('validates array element structure', () => {
    // Missing required field
    expect(() =>
      pokemonCatchesSummarySchema.parse([
        { speciesId: 1, count: 1 }, // missing lastCaughtAt
      ])
    ).toThrow()

    // Invalid speciesId
    expect(() =>
      pokemonCatchesSummarySchema.parse([
        { speciesId: 0, count: 1, lastCaughtAt: '2026-07-27T12:00:00Z' },
      ])
    ).toThrow()

    // Invalid count
    expect(() =>
      pokemonCatchesSummarySchema.parse([
        { speciesId: 1, count: 0, lastCaughtAt: '2026-07-27T12:00:00Z' },
      ])
    ).toThrow()
  })

  it('validates count is positive integer (BVA)', () => {
    // Minimum: 1 (accept)
    expect(() =>
      pokemonCatchesSummarySchema.parse([
        { speciesId: 1, count: 1, lastCaughtAt: '2026-07-27T12:00:00Z' },
      ])
    ).not.toThrow()

    // Below minimum: 0 (reject)
    expect(() =>
      pokemonCatchesSummarySchema.parse([
        { speciesId: 1, count: 0, lastCaughtAt: '2026-07-27T12:00:00Z' },
      ])
    ).toThrow()

    // Negative (reject)
    expect(() =>
      pokemonCatchesSummarySchema.parse([
        { speciesId: 1, count: -1, lastCaughtAt: '2026-07-27T12:00:00Z' },
      ])
    ).toThrow()
  })

  it('validates lastCaughtAt is ISO8601 datetime', () => {
    // Valid
    expect(() =>
      pokemonCatchesSummarySchema.parse([
        { speciesId: 1, count: 1, lastCaughtAt: '2026-07-27T12:00:00Z' },
      ])
    ).not.toThrow()

    // Invalid
    expect(() =>
      pokemonCatchesSummarySchema.parse([
        { speciesId: 1, count: 1, lastCaughtAt: 'not-a-date' },
      ])
    ).toThrow()
  })
})

describe('pokemonSpeciesSchema', () => {
  it('accepts valid pokemon species', () => {
    const valid = pokemonSpeciesSchema.parse({
      id: 25,
      name: 'Pikachu',
      spriteUrl: 'https://example.com/pikachu.png',
      rarity: 'common',
    })
    expect(valid.id).toBe(25)
    expect(valid.name).toBe('Pikachu')
  })

  it('validates id boundaries (BVA)', () => {
    // Minimum: 1 (accept)
    expect(() =>
      pokemonSpeciesSchema.parse({
        id: 1,
        name: 'Bulbasaur',
        spriteUrl: 'https://example.com/bulbasaur.png',
        rarity: 'common',
      })
    ).not.toThrow()

    // Below minimum: 0 (reject)
    expect(() =>
      pokemonSpeciesSchema.parse({
        id: 0,
        name: 'Unknown',
        spriteUrl: 'https://example.com/unknown.png',
        rarity: 'common',
      })
    ).toThrow()

    // Maximum: 151 (accept)
    expect(() =>
      pokemonSpeciesSchema.parse({
        id: 151,
        name: 'Mew',
        spriteUrl: 'https://example.com/mew.png',
        rarity: 'rare',
      })
    ).not.toThrow()

    // Above maximum: 152 (reject)
    expect(() =>
      pokemonSpeciesSchema.parse({
        id: 152,
        name: 'Chikorita',
        spriteUrl: 'https://example.com/chikorita.png',
        rarity: 'common',
      })
    ).toThrow()
  })

  it('requires name to be non-empty string', () => {
    expect(() =>
      pokemonSpeciesSchema.parse({
        id: 25,
        name: '',
        spriteUrl: 'https://example.com/pikachu.png',
        rarity: 'common',
      })
    ).toThrow()
  })

  it('requires rarity to be valid tier', () => {
    expect(() =>
      pokemonSpeciesSchema.parse({
        id: 25,
        name: 'Pikachu',
        spriteUrl: 'https://example.com/pikachu.png',
        rarity: 'invalid',
      })
    ).toThrow()
  })
})

describe('pokemonSpeciesArraySchema', () => {
  it('accepts array of valid pokemon species', () => {
    const valid = pokemonSpeciesArraySchema.parse([
      { id: 1, name: 'Bulbasaur', spriteUrl: 'https://example.com/bulbasaur.png', rarity: 'common' },
      { id: 25, name: 'Pikachu', spriteUrl: 'https://example.com/pikachu.png', rarity: 'common' },
      { id: 151, name: 'Mew', spriteUrl: 'https://example.com/mew.png', rarity: 'rare' },
    ])
    expect(valid).toHaveLength(3)
  })

  it('rejects non-array input', () => {
    expect(() => pokemonSpeciesArraySchema.parse({ id: 1, name: 'Bulbasaur' })).toThrow()
    expect(() => pokemonSpeciesArraySchema.parse('not an array')).toThrow()
  })

  it('rejects array with invalid species', () => {
    expect(() =>
      pokemonSpeciesArraySchema.parse([
        { id: 1, name: 'Bulbasaur', spriteUrl: 'https://example.com/bulbasaur.png', rarity: 'common' },
        { id: 999, name: 'Invalid', spriteUrl: 'https://example.com/invalid.png', rarity: 'common' }, // Invalid ID
      ])
    ).toThrow()
  })
})
