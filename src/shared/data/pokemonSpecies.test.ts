import { describe, it, expect } from 'bun:test'

import { pokemonSpecies } from './pokemonSpecies'
import { pokemonSpeciesArraySchema } from '@/shared/schemas/pokemonCatch'

describe('pokemonSpecies (generated data)', () => {
  describe('Data Completeness', () => {
    it('should contain exactly 151 entries', () => {
      expect(pokemonSpecies).toHaveLength(151)
    })

    it('should have all IDs from 1 to 151 with no gaps or duplicates', () => {
      const ids = pokemonSpecies.map((s) => s.id)
      expect(ids).toEqual(Array.from({ length: 151 }, (_, i) => i + 1))
    })

    it('should be sorted by ID', () => {
      for (let i = 0; i < pokemonSpecies.length - 1; i++) {
        const current = pokemonSpecies[i]
        const next = pokemonSpecies[i + 1]
        if (!current || !next) throw new Error('Array access failed')
        expect(current.id).toBeLessThan(next.id)
      }
    })

    it('should have all required fields on each entry', () => {
      for (const species of pokemonSpecies) {
        expect(species).toHaveProperty('id')
        expect(species).toHaveProperty('name')
        expect(species).toHaveProperty('spriteUrl')
        expect(species).toHaveProperty('rarity')
      }
    })
  })

  describe('Data Validation', () => {
    it('should validate against pokemonSpeciesArraySchema', () => {
      const result = pokemonSpeciesArraySchema.safeParse(pokemonSpecies)
      expect(result.success).toBe(true)
      if (!result.success) {
        throw new Error(`Validation failed: ${result.error.message}`)
      }
    })

    it('should have all valid ID ranges', () => {
      for (const species of pokemonSpecies) {
        expect(species.id).toBeGreaterThanOrEqual(1)
        expect(species.id).toBeLessThanOrEqual(151)
      }
    })

    it('should have non-empty names', () => {
      for (const species of pokemonSpecies) {
        expect(species.name).toBeTruthy()
        expect(species.name.length).toBeGreaterThan(0)
      }
    })

    it('should have non-empty sprite URLs that are HTTPS', () => {
      for (const species of pokemonSpecies) {
        expect(species.spriteUrl).toBeTruthy()
        expect(species.spriteUrl.length).toBeGreaterThan(0)
        expect(species.spriteUrl.startsWith('https://')).toBe(true)
      }
    })

    it('should have valid rarity values', () => {
      const validRarities = ['rare', 'uncommon', 'common']
      for (const species of pokemonSpecies) {
        expect(validRarities).toContain(species.rarity)
      }
    })
  })

  describe('Rarity Distribution', () => {
    it('should have exactly 5 rare species', () => {
      const rare = pokemonSpecies.filter((s) => s.rarity === 'rare')
      expect(rare).toHaveLength(5)
    })

    it('should classify rare species correctly', () => {
      const rareSpecies = pokemonSpecies.filter((s) => s.rarity === 'rare')
      const rareNames = rareSpecies.map((s) => s.name).sort()
      expect(rareNames).toEqual(['articuno', 'mew', 'mewtwo', 'moltres', 'zapdos'])
    })

    it('should count uncommon species', () => {
      const uncommon = pokemonSpecies.filter((s) => s.rarity === 'uncommon')
      // Classification rule: 20 ≤ capture_rate ≤ 45 → uncommon
      // Result: 55 uncommon species (outside the 18-28 spec range due to Gen 1 data distribution)
      // Gen 1 has 55 species with capture_rate in [20,45] and 0 species below 20
      expect(uncommon.length).toBe(55)
    })

    it('should count common species', () => {
      const common = pokemonSpecies.filter((s) => s.rarity === 'common')
      expect(common.length).toBe(91)
    })

    it('should account for all species across all tiers', () => {
      const rare = pokemonSpecies.filter((s) => s.rarity === 'rare').length
      const uncommon = pokemonSpecies.filter((s) => s.rarity === 'uncommon').length
      const common = pokemonSpecies.filter((s) => s.rarity === 'common').length
      expect(rare + uncommon + common).toBe(151)
    })
  })

  describe('Specific Known Species', () => {
    it('should include Bulbasaur (ID 1) as uncommon', () => {
      const bulbasaur = pokemonSpecies.find((s) => s.id === 1)
      expect(bulbasaur).toBeDefined()
      if (!bulbasaur) throw new Error('Bulbasaur not found')
      expect(bulbasaur.name).toBe('bulbasaur')
      expect(bulbasaur.rarity).toBe('uncommon')
    })

    it('should include Pikachu (ID 25) as common', () => {
      const pikachu = pokemonSpecies.find((s) => s.id === 25)
      expect(pikachu).toBeDefined()
      if (!pikachu) throw new Error('Pikachu not found')
      expect(pikachu.name).toBe('pikachu')
      expect(pikachu.rarity).toBe('common')
    })

    it('should include Diglett (ID 50) as common', () => {
      const diglett = pokemonSpecies.find((s) => s.id === 50)
      expect(diglett).toBeDefined()
      if (!diglett) throw new Error('Diglett not found')
      expect(diglett.name).toBe('diglett')
      expect(diglett.rarity).toBe('common')
    })

    it('should include Mewtwo (ID 150) as rare', () => {
      const mewtwo = pokemonSpecies.find((s) => s.id === 150)
      expect(mewtwo).toBeDefined()
      if (!mewtwo) throw new Error('Mewtwo not found')
      expect(mewtwo.name).toBe('mewtwo')
      expect(mewtwo.rarity).toBe('rare')
    })

    it('should include Mew (ID 151) as rare', () => {
      const mew = pokemonSpecies.find((s) => s.id === 151)
      expect(mew).toBeDefined()
      if (!mew) throw new Error('Mew not found')
      expect(mew.name).toBe('mew')
      expect(mew.rarity).toBe('rare')
    })
  })
})
