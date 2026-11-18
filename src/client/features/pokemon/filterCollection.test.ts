import { describe, expect, it } from 'bun:test'

import { pokemonSpecies } from '@/shared/data/pokemonSpecies'

import { initialCollectionFilters, matchesFilters, matchesSearch } from './filterCollection'

const bySpecies = (name: string) => pokemonSpecies.find((s) => s.name === name)!

describe('filterCollection', () => {
  it('matches search by name, dex number (with or without #) and type', () => {
    const pikachu = bySpecies('pikachu')
    expect(matchesSearch(pikachu, '')).toBe(true)
    expect(matchesSearch(pikachu, ' PIKA ')).toBe(true)
    expect(matchesSearch(pikachu, '25')).toBe(true)
    expect(matchesSearch(pikachu, '#25')).toBe(true)
    expect(matchesSearch(pikachu, 'electric')).toBe(true)
    expect(matchesSearch(pikachu, 'fire')).toBe(false)
  })

  it('applies status, type and rarity together', () => {
    const f = { ...initialCollectionFilters, status: 'caught' as const, type: 'fire' as const }
    const charizard = bySpecies('charizard')
    expect(matchesFilters(charizard, true, f)).toBe(true)
    expect(matchesFilters(charizard, false, f)).toBe(false)
    expect(matchesFilters(bySpecies('squirtle'), true, f)).toBe(false)
    expect(matchesFilters(charizard, true, { ...f, rarity: 'rare' })).toBe(charizard.rarity === 'rare')
  })

  it('every species has 1-2 types', () => {
    for (const s of pokemonSpecies) expect(s.types.length).toBeGreaterThanOrEqual(1)
  })
})
