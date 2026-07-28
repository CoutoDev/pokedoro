import type { Phase } from '@/shared/types/pomodoro-cycle'
import type { PokemonSpecies } from '@/shared/types/pokemon'
import { pokemonSpecies } from '@/shared/data/pokemonSpecies'

/**
 * Rarity tier probabilities by phase type
 *
 * FOCUS and SHORT_BREAK have identical weights: players are rewarded for
 * completing any phase, but long breaks offer significantly better odds.
 * LONG_BREAK has 5× higher rare rate (10% vs 2%) and 2.3× higher uncommon rate
 * (35% vs 15%), encouraging longer focus sessions.
 */
interface TierWeights {
  rare: number
  uncommon: number
  common: number
}

const PHASE_WEIGHTS: Record<Phase, TierWeights> = {
  FOCUS: { rare: 0.02, uncommon: 0.15, common: 0.83 },
  SHORT_BREAK: { rare: 0.02, uncommon: 0.15, common: 0.83 },
  LONG_BREAK: { rare: 0.1, uncommon: 0.35, common: 0.55 },
}

/**
 * Pre-filtered species arrays by rarity tier for fast lookup
 * Populated on module load; enables O(1) tier filtering
 */
const speciesByRarity = {
  rare: pokemonSpecies.filter((s) => s.rarity === 'rare'),
  uncommon: pokemonSpecies.filter((s) => s.rarity === 'uncommon'),
  common: pokemonSpecies.filter((s) => s.rarity === 'common'),
}

/**
 * Validate that tier weights sum to approximately 1.0
 * Throws if weights are misaligned (prevent silent bugs in probability logic)
 *
 * @throws Error if sum deviates more than ±0.01 from 1.0
 */
export function validateWeights(weights: TierWeights): void {
  const sum = weights.rare + weights.uncommon + weights.common
  const tolerance = 0.01

  if (Math.abs(sum - 1.0) > tolerance) {
    throw new Error(
      `Tier weights do not sum to 1.0 ±0.01 tolerance: ${sum} (rare=${weights.rare}, uncommon=${weights.uncommon}, common=${weights.common})`
    )
  }
}

/**
 * Select a rarity tier using weighted random selection (cumulative roll)
 *
 * Cumulative roll algorithm:
 * 1. Generate random value [0, 1)
 * 2. Accumulate tier weights until sum >= random value
 * 3. Return the tier where accumulation succeeded
 *
 * @param weights - Tier probabilities (must sum to 1.0)
 * @param prng - Random number generator (default: Math.random)
 * @returns Rarity tier: 'rare' | 'uncommon' | 'common'
 */
function selectTierByCumulativeRoll(
  weights: TierWeights,
  prng: () => number
): 'rare' | 'uncommon' | 'common' {
  const roll = prng()
  let accumulator = 0

  // Rare tier
  accumulator += weights.rare
  if (roll < accumulator) return 'rare'

  // Uncommon tier
  accumulator += weights.uncommon
  if (roll < accumulator) return 'uncommon'

  // Common tier (no need to check, must be selected if rare/uncommon missed)
  return 'common'
}

/**
 * Select a random species from a tier using uniform distribution
 *
 * @param tier - Species array (pre-filtered by rarity)
 * @param prng - Random number generator (should return value in [0, 1))
 * @returns Random species from the tier (never undefined)
 *
 * Note: Index is clamped to valid range [0, tier.length - 1] to handle edge cases where
 * PRNG returns values outside [0, 1) (e.g. from buggy or malicious callers). This ensures the
 * function always returns a valid PokemonSpecies, satisfying the contract that selection
 * always returns a valid species (id 1–151).
 */
function selectSpeciesFromTier(
  tier: PokemonSpecies[],
  prng: () => number
): PokemonSpecies {
  // Clamp index to valid range [0, tier.length - 1] to handle PRNG edge cases:
  // - If prng() >= 1.0, Math.floor(prng() * tier.length) >= tier.length (out of bounds)
  // - If prng() < 0, Math.floor(prng() * tier.length) < 0 (out of bounds)
  // Clamping ensures we always return a valid species.
  const rawIndex = Math.floor(prng() * tier.length)
  const index = Math.max(0, Math.min(rawIndex, tier.length - 1))
  return tier[index]!
}

/**
 * Roll for a caught Pokemon species based on phase type and rarity weights
 *
 * Implements weighted tier selection followed by uniform species selection:
 * 1. Select a rarity tier using phase-specific probabilities
 * 2. Randomly select a species from the chosen tier
 *
 * @param phase - Timer phase: 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK'
 * @param prng - Optional PRNG for deterministic testing (default: Math.random)
 *               PRNG must return values in range [0, 1). Behavior with invalid inputs is undefined.
 * @returns A random PokemonSpecies from the selected rarity tier
 *
 * @example
 * // Production: uses Math.random
 * const species = rollCatch('FOCUS')
 *
 * // Testing: use seeded PRNG for reproducible results
 * const seeded = createSeededPRNG(42)
 * const species = rollCatch('LONG_BREAK', seeded)
 */
export function rollCatch(phase: Phase, prng?: () => number): PokemonSpecies {
  const randomGenerator = prng ?? Math.random
  const weights = PHASE_WEIGHTS[phase]

  // Validate weights at runtime to catch configuration errors early
  validateWeights(weights)

  // Select tier using weighted random selection
  const tier = selectTierByCumulativeRoll(weights, randomGenerator)

  // Select species uniformly at random from the chosen tier
  const tierSpecies = speciesByRarity[tier]
  return selectSpeciesFromTier(tierSpecies, randomGenerator)
}

/**
 * Seeded pseudo-random number generator for deterministic testing
 *
 * Uses linear congruential generator (LCG) algorithm:
 * next = (a * seed + c) % m
 *
 * This is NOT cryptographically secure but provides fast, deterministic,
 * reproducible randomness suitable for distribution validation tests.
 *
 * @param seed - Initial seed value (any integer)
 * @returns Function that returns next random value in [0, 1)
 *
 * @example
 * const prng = createSeededPRNG(42)
 * const roll1 = prng() // 0.123... (deterministic based on seed)
 * const roll2 = prng() // 0.456... (different value)
 * const prng2 = createSeededPRNG(42)
 * const roll3 = prng2() // 0.123... (same as roll1, seed matches)
 */
export function createSeededPRNG(seed: number): () => number {
  let current = seed

  // LCG parameters (widely used for deterministic testing)
  const a = 1664525
  const c = 1013904223
  const m = 2 ** 32

  return () => {
    current = (a * current + c) % m
    return current / m
  }
}
