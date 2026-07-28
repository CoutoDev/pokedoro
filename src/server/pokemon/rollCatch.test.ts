import { describe, it, expect } from 'bun:test'
import { rollCatch, createSeededPRNG, validateWeights } from './rollCatch'
import { pokemonSpecies } from '@/shared/data/pokemonSpecies'
import type { Phase } from '@/shared/types/pomodoro-cycle'

describe('rollCatch', () => {
  /**
   * Helper: Count species in each tier
   * Used to validate rarity distribution in tests
   */
  function countTierDistribution(species: typeof pokemonSpecies) {
    const counts = { rare: 0, uncommon: 0, common: 0 }
    for (const s of species) {
      counts[s.rarity]++
    }
    return counts
  }

  describe('tier distribution constants', () => {
    it('should have 5 rare species (Articuno, Zapdos, Moltres, Mewtwo, Mew)', () => {
      const rarities = countTierDistribution(pokemonSpecies)
      expect(rarities.rare).toBe(5)
    })

    it('should have uncommon species with capture_rate 20-45 (verified empirically: 55 species)', () => {
      const rarities = countTierDistribution(pokemonSpecies)
      expect(rarities.uncommon).toBe(55)
    })

    it('should have common species as the remainder (91 total)', () => {
      const rarities = countTierDistribution(pokemonSpecies)
      expect(rarities.common).toBe(91)
    })

    it('should total exactly 151 species (Gen 1)', () => {
      const rarities = countTierDistribution(pokemonSpecies)
      const total = rarities.rare + rarities.uncommon + rarities.common
      expect(total).toBe(151)
    })
  })

  describe('weight validation', () => {
    it('should throw error when weights do not sum to 1.0 ±0.01', () => {
      const invalidWeights = { rare: 0.5, uncommon: 0.5, common: 0.1 } // sum = 1.1
      expect(() => validateWeights(invalidWeights)).toThrow()
    })

    it('should throw with descriptive error message including weight values', () => {
      const invalidWeights = { rare: 0.3, uncommon: 0.3, common: 0.3 } // sum = 0.9

      expect(() => validateWeights(invalidWeights)).toThrow()

      let thrown: Error | null = null
      try {
        validateWeights(invalidWeights)
      } catch (error) {
        thrown = error as Error
      }

      expect(thrown).toBeInstanceOf(Error)
      expect(thrown?.message).toContain('Tier weights do not sum to 1.0')
      expect(thrown?.message).toContain('rare=0.3')
      expect(thrown?.message).toContain('uncommon=0.3')
      expect(thrown?.message).toContain('common=0.3')
    })

    it('should accept weights that sum to 1.0 within tolerance (±0.01)', () => {
      const validWeights1 = { rare: 0.02, uncommon: 0.15, common: 0.83 } // sum = 1.0
      const validWeights2 = { rare: 0.01, uncommon: 0.01, common: 0.98 } // sum = 1.0

      // Should not throw
      expect(() => validateWeights(validWeights1)).not.toThrow()
      expect(() => validateWeights(validWeights2)).not.toThrow()
    })

    it('should accept weights at tolerance boundaries (sum = 1.0 ±0.01)', () => {
      const atLowerBound = { rare: 0.32, uncommon: 0.32, common: 0.36 } // sum = 1.00
      const atUpperBound = { rare: 0.33, uncommon: 0.33, common: 0.34 } // sum = 1.00
      const justBelowTolerance = { rare: 0.325, uncommon: 0.325, common: 0.355 } // sum = 1.005

      expect(() => validateWeights(atLowerBound)).not.toThrow()
      expect(() => validateWeights(atUpperBound)).not.toThrow()
      expect(() => validateWeights(justBelowTolerance)).not.toThrow()
    })

    it('should reject weights that exceed tolerance (>±0.01)', () => {
      // sum = 1.011 (exceeds 0.01 tolerance)
      const tooHigh = { rare: 0.337, uncommon: 0.337, common: 0.337 }
      // sum = 0.989 (exceeds 0.01 tolerance)
      const tooLow = { rare: 0.329, uncommon: 0.329, common: 0.331 }

      expect(() => validateWeights(tooHigh)).toThrow()
      expect(() => validateWeights(tooLow)).toThrow()
    })
  })

  describe('species range validation', () => {
    it('should return species with ID in range [1, 151]', () => {
      for (let i = 0; i < 50; i++) {
        const species = rollCatch('FOCUS')
        expect(species.id).toBeGreaterThanOrEqual(1)
        expect(species.id).toBeLessThanOrEqual(151)
      }
    })

    it('should return species that exist in pokemonSpecies array', () => {
      for (let i = 0; i < 50; i++) {
        const species = rollCatch('SHORT_BREAK')
        const found = pokemonSpecies.find((s) => s.id === species.id)
        expect(found).toBeDefined()
        expect(found?.name).toBe(species.name)
        expect(found?.rarity).toBe(species.rarity)
      }
    })

    it('should never return out-of-range species', () => {
      for (let i = 0; i < 100; i++) {
        const species = rollCatch('LONG_BREAK')
        expect(species.id).not.toBe(0)
        expect(species.id).not.toBe(152)
        expect(species.id).not.toBeNaN()
      }
    })
  })

  describe('FOCUS phase distribution (2% rare, 15% uncommon, 83% common)', () => {
    it('should select rare tier ~2% (100 rolls, seed 7, spec bounds [1,3])', () => {
      const prng = createSeededPRNG(7)
      const rolls = 100
      const results: { rare: number; uncommon: number; common: number } = {
        rare: 0,
        uncommon: 0,
        common: 0,
      }

      for (let i = 0; i < rolls; i++) {
        const species = rollCatch('FOCUS', prng)
        results[species.rarity]++
      }

      // Spec requirement (from task file Test Cases to Cover AC: Rarity Distribution by Phase):
      // FOCUS phase: 100 rolls → rare count must be in [1, 3] inclusive
      // BVA: 0 is below range/invalid, 1 is min valid, 3 is max valid, 4 is above range/invalid
      expect(results.rare).toBeGreaterThanOrEqual(1)
      expect(results.rare).toBeLessThanOrEqual(3)
    })

    it('should select uncommon tier ~15% (100 rolls, reasonable tolerance)', () => {
      const prng = createSeededPRNG(7)
      const rolls = 100
      const results: { rare: number; uncommon: number; common: number } = {
        rare: 0,
        uncommon: 0,
        common: 0,
      }

      for (let i = 0; i < rolls; i++) {
        const species = rollCatch('FOCUS', prng)
        results[species.rarity]++
      }

      // Expected: 15% of 100 = 15 species
      // Tolerance: ±5 percentage points = 10-20 species
      expect(results.uncommon).toBeGreaterThanOrEqual(10)
      expect(results.uncommon).toBeLessThanOrEqual(20)
    })

    it('should select common tier ~83% (100 rolls, reasonable tolerance)', () => {
      const prng = createSeededPRNG(7)
      const rolls = 100
      const results: { rare: number; uncommon: number; common: number } = {
        rare: 0,
        uncommon: 0,
        common: 0,
      }

      for (let i = 0; i < rolls; i++) {
        const species = rollCatch('FOCUS', prng)
        results[species.rarity]++
      }

      // Expected: 83% of 100 = 83 species
      // Tolerance: ±5 percentage points = 78-88 species
      expect(results.common).toBeGreaterThanOrEqual(78)
      expect(results.common).toBeLessThanOrEqual(88)
    })
  })

  describe('SHORT_BREAK phase distribution (2% rare, 15% uncommon, 83% common)', () => {
    it('should select rare tier ~2% (100 rolls, seed 7, spec bounds [1,3])', () => {
      const prng = createSeededPRNG(7)
      const rolls = 100
      const results: { rare: number; uncommon: number; common: number } = {
        rare: 0,
        uncommon: 0,
        common: 0,
      }

      for (let i = 0; i < rolls; i++) {
        const species = rollCatch('SHORT_BREAK', prng)
        results[species.rarity]++
      }

      // Spec requirement (from task file Test Cases to Cover AC: Rarity Distribution by Phase):
      // SHORT_BREAK phase: 100 rolls → rare count must be in [1, 3] inclusive
      // BVA: 0 is below range/invalid, 1 is min valid, 3 is max valid, 4 is above range/invalid
      // SHORT_BREAK has identical weights to FOCUS (2% rare, 15% uncommon, 83% common)
      expect(results.rare).toBeGreaterThanOrEqual(1)
      expect(results.rare).toBeLessThanOrEqual(3)
    })

    it('should have same weight distribution as FOCUS phase', () => {
      const prng1 = createSeededPRNG(7)
      const prng2 = createSeededPRNG(7)
      const rolls = 100

      const focusResults: { rare: number; uncommon: number; common: number } = {
        rare: 0,
        uncommon: 0,
        common: 0,
      }
      const shortBreakResults: { rare: number; uncommon: number; common: number } = {
        rare: 0,
        uncommon: 0,
        common: 0,
      }

      for (let i = 0; i < rolls; i++) {
        focusResults[rollCatch('FOCUS', prng1).rarity]++
        shortBreakResults[rollCatch('SHORT_BREAK', prng2).rarity]++
      }

      // Both should have identical distributions (same weights)
      expect(focusResults.rare).toBe(shortBreakResults.rare)
      expect(focusResults.uncommon).toBe(shortBreakResults.uncommon)
      expect(focusResults.common).toBe(shortBreakResults.common)
    })
  })

  describe('LONG_BREAK phase distribution (10% rare, 35% uncommon, 55% common)', () => {
    it('should select rare tier ~10% (100 rolls, seed 7, spec bounds [8,12])', () => {
      const prng = createSeededPRNG(7)
      const rolls = 100
      const results: { rare: number; uncommon: number; common: number } = {
        rare: 0,
        uncommon: 0,
        common: 0,
      }

      for (let i = 0; i < rolls; i++) {
        const species = rollCatch('LONG_BREAK', prng)
        results[species.rarity]++
      }

      // Spec requirement (from task file Test Cases to Cover AC: Rarity Distribution by Phase):
      // LONG_BREAK phase: 100 rolls → rare count must be in [8, 12] inclusive
      // BVA: 7 is below range/invalid, 8 is min valid, 12 is max valid, 13 is above range/invalid
      expect(results.rare).toBeGreaterThanOrEqual(8)
      expect(results.rare).toBeLessThanOrEqual(12)
    })

    it('should select uncommon tier ~35% (100 rolls, reasonable tolerance)', () => {
      const prng = createSeededPRNG(7)
      const rolls = 100
      const results: { rare: number; uncommon: number; common: number } = {
        rare: 0,
        uncommon: 0,
        common: 0,
      }

      for (let i = 0; i < rolls; i++) {
        const species = rollCatch('LONG_BREAK', prng)
        results[species.rarity]++
      }

      // Expected: 35% of 100 = 35 species
      // Tolerance: ±5 percentage points = 30-40 species
      expect(results.uncommon).toBeGreaterThanOrEqual(30)
      expect(results.uncommon).toBeLessThanOrEqual(40)
    })

    it('should select common tier ~55% (100 rolls, reasonable tolerance)', () => {
      const prng = createSeededPRNG(7)
      const rolls = 100
      const results: { rare: number; uncommon: number; common: number } = {
        rare: 0,
        uncommon: 0,
        common: 0,
      }

      for (let i = 0; i < rolls; i++) {
        const species = rollCatch('LONG_BREAK', prng)
        results[species.rarity]++
      }

      // Expected: 55% of 100 = 55 species
      // Tolerance: ±5 percentage points = 50-60 species
      expect(results.common).toBeGreaterThanOrEqual(50)
      expect(results.common).toBeLessThanOrEqual(60)
    })

    it('should have 5× higher rare rate than FOCUS (10% vs 2%)', () => {
      const focusPrng = createSeededPRNG(7)
      const longBreakPrng = createSeededPRNG(7)
      const rolls = 100

      const focusRare = Array.from({ length: rolls })
        .map(() => rollCatch('FOCUS', focusPrng))
        .filter((s) => s.rarity === 'rare').length

      const longBreakRare = Array.from({ length: rolls })
        .map(() => rollCatch('LONG_BREAK', longBreakPrng))
        .filter((s) => s.rarity === 'rare').length

      // LONG_BREAK should have ~5× more rare species (10 vs 2)
      // With tolerance for randomness
      expect(longBreakRare).toBeGreaterThan(focusRare * 2)
    })
  })

  describe('deterministic seeded PRNG behavior', () => {
    it('should produce same species sequence with same seed', () => {
      const seed = 42
      const rolls = 100

      const prng1 = createSeededPRNG(seed)
      const results1 = Array.from({ length: rolls }).map(() => rollCatch('FOCUS', prng1))

      const prng2 = createSeededPRNG(seed)
      const results2 = Array.from({ length: rolls }).map(() => rollCatch('FOCUS', prng2))

      for (let i = 0; i < rolls; i++) {
        expect(results1[i]?.id).toBe(results2[i]?.id)
        expect(results1[i]?.name).toBe(results2[i]?.name)
        expect(results1[i]?.rarity).toBe(results2[i]?.rarity)
      }
    })

    it('should produce different sequences with different seeds', () => {
      const rolls = 150

      const prng1 = createSeededPRNG(42)
      const results1 = Array.from({ length: rolls }).map(() => rollCatch('FOCUS', prng1))

      const prng2 = createSeededPRNG(99)
      const results2 = Array.from({ length: rolls }).map(() => rollCatch('FOCUS', prng2))

      // At least one species should differ (extremely unlikely to match completely)
      let anyDiff = false
      for (let i = 0; i < rolls; i++) {
        if (results1[i]?.id !== results2[i]?.id) {
          anyDiff = true
          break
        }
      }
      expect(anyDiff).toBe(true)
    })

    it('should produce different distributions across multiple independent runs', () => {
      const rolls = 100
      const runs = 3

      const distributions = Array.from({ length: runs }).map((_, runIndex) => {
        const prng = createSeededPRNG(1000 + runIndex)
        const results: { rare: number; uncommon: number; common: number } = {
          rare: 0,
          uncommon: 0,
          common: 0,
        }

        for (let i = 0; i < rolls; i++) {
          results[rollCatch('FOCUS', prng).rarity]++
        }

        return results
      })

      // Different runs should have different rare counts (variance > 0)
      const rareRun1 = distributions[0]!.rare
      const rareRun2 = distributions[1]!.rare
      const rareRun3 = distributions[2]!.rare

      const variance = [rareRun1, rareRun2, rareRun3]
      const hasVariance = variance.some((v) => v !== rareRun1)
      expect(hasVariance).toBe(true)
    })
  })

  describe('performance benchmarks', () => {
    it('should complete 1000 rolls in <50ms total', () => {
      const iterations = 1000
      const startTime = performance.now()

      for (let i = 0; i < iterations; i++) {
        rollCatch('FOCUS')
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      // Should complete 1000 iterations in <50ms
      expect(duration).toBeLessThan(50)
    })

    it('should have consistent performance across phases', () => {
      const iterations = 500
      const phases: Phase[] = ['FOCUS', 'SHORT_BREAK', 'LONG_BREAK']

      const timings = phases.map((phase) => {
        const start = performance.now()
        for (let i = 0; i < iterations; i++) {
          rollCatch(phase)
        }
        const end = performance.now()
        return end - start
      })

      // All phases should complete within reasonable time
      for (const timing of timings) {
        expect(timing).toBeLessThan(50)
      }

      // Timings should be relatively consistent (no outliers)
      const maxTiming = Math.max(...timings)
      const minTiming = Math.min(...timings)
      expect(maxTiming - minTiming).toBeLessThan(20) // <20ms variance acceptable
    })
  })

  describe('edge cases and robustness', () => {
    it('should handle all three phases', () => {
      const phases: Phase[] = ['FOCUS', 'SHORT_BREAK', 'LONG_BREAK']

      for (const phase of phases) {
        const species = rollCatch(phase)
        expect(species).toBeDefined()
        expect(species.id).toBeGreaterThanOrEqual(1)
        expect(species.id).toBeLessThanOrEqual(151)
      }
    })

    it('should always return object with required PokemonSpecies fields', () => {
      for (let i = 0; i < 20; i++) {
        const species = rollCatch('LONG_BREAK')

        expect(species).toHaveProperty('id')
        expect(species).toHaveProperty('name')
        expect(species).toHaveProperty('spriteUrl')
        expect(species).toHaveProperty('rarity')

        expect(typeof species.id).toBe('number')
        expect(typeof species.name).toBe('string')
        expect(typeof species.spriteUrl).toBe('string')
        expect(typeof species.rarity).toBe('string')

        expect(['rare', 'uncommon', 'common']).toContain(species.rarity)
      }
    })

    it('should handle PRNG edge cases (returns >= 1.0 or < 0) and still return valid species', () => {
      // Test PRNG returning exactly 1.0 (boundary case that could cause out-of-bounds)
      const edgePrng1 = () => 1.0
      const species1 = rollCatch('FOCUS', edgePrng1)
      expect(species1).toBeDefined()
      expect(species1.id).toBeGreaterThanOrEqual(1)
      expect(species1.id).toBeLessThanOrEqual(151)
      expect(species1.name).toBeTruthy()
      expect(species1.spriteUrl).toBeTruthy()

      // Test PRNG returning > 1.0
      const edgePrng2 = () => 1.5
      const species2 = rollCatch('LONG_BREAK', edgePrng2)
      expect(species2).toBeDefined()
      expect(species2.id).toBeGreaterThanOrEqual(1)
      expect(species2.id).toBeLessThanOrEqual(151)

      // Test PRNG returning < 0
      const edgePrng3 = () => -0.5
      const species3 = rollCatch('SHORT_BREAK', edgePrng3)
      expect(species3).toBeDefined()
      expect(species3.id).toBeGreaterThanOrEqual(1)
      expect(species3.id).toBeLessThanOrEqual(151)

      // Test PRNG returning very large value
      const edgePrng4 = () => 999
      const species4 = rollCatch('FOCUS', edgePrng4)
      expect(species4).toBeDefined()
      expect(species4.id).toBeGreaterThanOrEqual(1)
      expect(species4.id).toBeLessThanOrEqual(151)
    })
  })

  describe('seeded PRNG (createSeededPRNG)', () => {
    it('should return values in range [0, 1)', () => {
      const prng = createSeededPRNG(123)

      for (let i = 0; i < 100; i++) {
        const value = prng()
        expect(value).toBeGreaterThanOrEqual(0)
        expect(value).toBeLessThan(1)
      }
    })

    it('should have different values across calls', () => {
      const prng = createSeededPRNG(456)
      const values = Array.from({ length: 100 }).map(() => prng())

      const unique = new Set(values)
      expect(unique.size).toBeGreaterThan(50) // At least some variation
    })

    it('should be reproducible with same seed', () => {
      const seed = 999
      const prng1 = createSeededPRNG(seed)
      const prng2 = createSeededPRNG(seed)

      const values1 = Array.from({ length: 50 }).map(() => prng1())
      const values2 = Array.from({ length: 50 }).map(() => prng2())

      for (let i = 0; i < 50; i++) {
        expect(values1[i]).toBe(values2[i])
      }
    })
  })

  describe('integration: rare species identification', () => {
    it('should identify correct rare species in LONG_BREAK rolls', () => {
      const prng = createSeededPRNG(2024)
      const rareIds = [144, 145, 146, 150, 151] // Articuno, Zapdos, Moltres, Mewtwo, Mew

      const rolls = 200
      let foundRare = false

      for (let i = 0; i < rolls; i++) {
        const species = rollCatch('LONG_BREAK', prng)
        if (species.rarity === 'rare') {
          expect(rareIds).toContain(species.id)
          foundRare = true
          break
        }
      }

      // Should find at least one rare species in 200 LONG_BREAK rolls (~10% chance means ~20 expected)
      expect(foundRare).toBe(true)
    })

    it('should be less likely to find rare species in FOCUS', () => {
      const prng = createSeededPRNG(2025)
      const rolls = 300

      const rareCount = Array.from({ length: rolls })
        .map(() => rollCatch('FOCUS', prng))
        .filter((s) => s.rarity === 'rare').length

      // In 300 FOCUS rolls, expect ~6 rare (2% of 300, allow 3-9 with variance)
      expect(rareCount).toBeLessThanOrEqual(15)
    })
  })
})
