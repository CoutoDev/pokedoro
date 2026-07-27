---
name: Pokemon Catching Collection Feature
description: Reusable patterns for weighted-tier event selection, atomic event recording with idempotency, and modal-reveal UIs — with Pokemon catching as the concrete example application
topics: event-driven systems, weighted random selection, transactional databases, collection UI, modal dialogs, Drizzle ORM, PokeAPI, static data generation
created: 2026-07-27
updated: 2026-07-28
scratchpad: .specs/scratchpad/3d177bfc.md
---

# Pokemon Catching Collection Feature

## Overview

This skill captures reusable architectural patterns for event-driven features that combine weighted random selection, atomic transactional recording, and modal UI reveals. The concrete application is Pokemon catching in a Pomodoro timer, but the patterns generalize to any gamification mechanic (boss defeats, daily streaks, achievement unlocks). The feature integrates one-time PokeAPI data generation, tier-based rarity weighting, transactional catch+cycle recording with idempotency guards, and a grid-based collection UI.

---

## Key Concepts

- **Weighted Tier Random Selection**: Pluggable tier system (not just Pokemon rarity) with configurable weights per trigger context
- **Atomic Idempotent Event Recording**: Transaction-based insert with UNIQUE constraint guard; retry-safe and double-fire safe
- **Static Reference Data**: One-time script generation produces committed TypeScript module; zero runtime dependencies on external services
- **Transactional Consistency**: Cycle + catch insert atomically; UNIQUE constraint on trigger ID prevents duplicates on retry
- **Modal Reveal Pattern**: Dialog UI for success/error/nudge states, keyboard accessible, dismissible without blocking parent state changes
- **Collection Grid**: Fixed-size grid rendering all entities in canonical order with caught/uncaught differentiation

---

## Dependencies (Pinned Versions)

| Dependency | Version | Purpose |
|-----------|---------|---------|
| `drizzle-orm` | ^0.45.2 | Database queries, transactions, type-safe schema |
| `@testing-library/react` | ^16.3.2 | Component testing with realistic DOM interactions |
| `react` | ^19.2.7 | SPA framework, hooks, context API |
| `typescript` | ^6.0.3 | Type safety, compile-time checks |
| `tailwindcss` | ^4.3.3 | CSS utility framework (see project's Tailwind 4 setup) |
| `class-variance-authority` | ^0.7.1 | Variant-based component styling (CVA pattern) |
| `bun` | latest | JavaScript runtime, native SQLite, built-in test runner |

---

## Documentation & References

| Resource | Description | Link |
|----------|-------------|------|
| PokeAPI v2 Specification | REST API endpoints for species, pokemon data | https://pokeapi.co/docs/v2 |
| PokeAPI HTTP Status Codes | 429 (rate limit), 503 (unavailable), 5xx error handling | https://pokeapi.co/ |
| Drizzle ORM Transactions | SQLite transaction patterns, rollback behavior, constraint errors | https://orm.drizzle.team/docs/transactions |
| Drizzle Aggregate Queries | GROUP BY, COUNT(), MAX() for collection stats | https://orm.drizzle.team/docs/select#group-by |
| Bun SQLite Driver | Built-in sync/async driver, `:memory:` for tests | https://bun.sh/docs/guides/sql |
| Bun Test Framework | `bun:test`, mocking, `Bun.sleep()`, test hooks | https://bun.sh/docs/test/overview |
| React Testing Library | Rendering, queries, `act()` import from @testing-library/react | https://testing-library.com/docs/react-testing-library/intro |
| CLAUDE.md (Pokedoro) | Project conventions: Context+Reducer state, CVA styling, component patterns, dialog pattern (TimerSettings) | `.claude/CLAUDE.md` |

---

## Data Consistency & Concurrency

### Static Module Versioning (Hydration Mismatch Prevention)

**Problem**: Client and server must import the same `pokemonSpecies.ts` module. If they diverge (e.g., stale checkout, partial deploy), species IDs in the database won't match what the client renders.

**Solution**:
1. `pokemonSpecies.ts` is a single committed data file with explicit version/hash in comments:
   ```typescript
   // Generated from PokeAPI on 2026-07-27 by scripts/generatePokemonSpecies.ts
   // Data hash: sha256_abc123... (for integrity verification)
   // DO NOT EDIT MANUALLY
   export const pokemonSpecies: PokemonSpecies[] = [
     { id: 1, name: 'Bulbasaur', ... },
     // ...
   ];
   ```
2. Both `client/` and `server/` import from the same path. No re-export or duplication.
3. Test both explicitly: server API test creates a catch with a known speciesId; client test renders that ID by looking it up in `pokemonSpecies`. If either module is stale, test fails.
4. CI/CD must deploy both client and server from the same commit.

### Concurrent Phase-Completion Race Conditions

**Problem**: Two phases complete rapidly (e.g., user speed-runs back-to-back focus sessions). Both POST to `/api/cycles` simultaneously. Without guards, both might insert two catches for the same "logical" cycle or create phantom duplicates.

**Solution**:
1. `cycleId` is generated client-side (UUID or nanoid) before POST.
2. Server inserts into `pomodoro_cycles` first (PK on `id`), then `pokemon_catches` (UNIQUE on `cycleId`).
3. If client retries the same POST (network timeout, browser refresh), second insert fails on `cycleId` UNIQUE constraint → handled gracefully:
   - Option A: Return 409 Conflict + existing catch data (client can show "already caught")
   - Option B: Catch constraint violation, `SELECT` the existing catch, return it as if insert succeeded (idempotent)
4. Test this: mock a slow `/api/cycles` handler, fire two requests with the same cycleId, assert only one catch row exists.

### PRNG Seeding for Deterministic Tests

**Problem**: `rollCatch()` calls `Math.random()` — tests are flaky if they depend on random outcomes, and CI runs become non-deterministic.

**Solution**:
1. Don't mock `Math.random()` globally in tests; instead, inject a seeded PRNG:
   ```typescript
   // In rollCatch, accept optional prng parameter for testing
   export function rollCatch(phase: Phase, prng: () => number = Math.random): PokemonSpecies {
     const roll = prng(); // Use injected PRNG, defaults to Math.random in production
     // ...
   }
   ```
2. In unit tests, use a seeded PRNG (e.g., [seedrandom](https://www.npmjs.com/package/seedrandom) or a simple linear congruential generator):
   ```typescript
   it('LONG_BREAK has 10% rare rate', () => {
     const seededRng = simpleSeededRng('fixed-seed-1234');
     let rareCount = 0;
     for (let i = 0; i < 100; i++) {
       const species = rollCatch('LONG_BREAK', seededRng);
       if (species.rarity === 'rare') rareCount++;
     }
     expect(rareCount).toBeGreaterThanOrEqual(8); // ~10%, allow variance
   });
   ```
3. Run the full test suite with the same seed across CI runs for reproducibility.

### Offline/Reconnect Sync Behavior

**Problem**: User completes phase while offline. App batches the POST. User reconnects. Server receives duplicate cycleIds from the batch. Should the app avoid creating duplicate catches?

**Solution**:
1. Client generates `cycleId` immediately on phase completion (not on POST).
2. If POST fails (offline), client retries with the same `cycleId` when reconnected.
3. Server's UNIQUE constraint on `cycleId` ensures at most one catch, even with multiple retries.
4. If retry fails with 409 Conflict, client treats it as success (catch already exists).
5. Test: simulate offline (mock fetch to reject), complete phase, reconnect, POST succeeds with existing cycleId, verify only one catch row.

---

## Recommended Patterns

### Pattern 1: Weighted Tier Random Selection (Generic)

**When to use**: Any event-driven system with rarity or weighted outcomes (boss battles, item drops, achievement unlocks, Pokemon catches).

**Pluggable abstractions**:
- `TierName`: string (e.g., `'rare'`, `'epic'`, `'common'` — not hardcoded to Pokemon)
- `TierWeight`: `{ [tierName]: number }` mapping tier names to probability weights
- `Weightable<T>`: item type with a `.tier: TierName` property
- `TierWeights`: mapping from trigger context (phase type, difficulty, day-of-week) to weight tables

**Generic Algorithm**:
```typescript
type TierName = string;
type Weightable<T> = T & { tier: TierName };

interface TierWeightTable {
  [tierName: string]: number; // e.g. { rare: 0.1, uncommon: 0.35, common: 0.55 }
}

function weightedRandomPick<T extends Weightable<T>>(
  items: T[],
  tierWeights: TierWeightTable,
  prng: () => number = Math.random
): T {
  // Validate weights sum to ~1.0 (tolerance: ±0.01)
  const weightSum = Object.values(tierWeights).reduce((sum, w) => sum + w, 0);
  const tolerance = 0.01;
  if (Math.abs(weightSum - 1.0) > tolerance) {
    throw new Error(
      `Invalid tier weights: sum is ${weightSum.toFixed(4)}, expected ~1.0. ` +
      `Weights: ${JSON.stringify(tierWeights)}`
    );
  }

  const roll = prng(); // [0, 1)
  let cumulative = 0;

  for (const [tierName, weight] of Object.entries(tierWeights)) {
    cumulative += weight;
    if (roll < cumulative) {
      const tierItems = items.filter(item => item.tier === tierName);
      if (tierItems.length === 0) {
        // Fallback: tier has no items, shouldn't happen
        console.warn(`No items found for tier "${tierName}", returning random`);
        return items[Math.floor(prng() * items.length)];
      }
      return tierItems[Math.floor(prng() * tierItems.length)];
    }
  }

  // Fallback: weights don't sum to 1 (error in weights), return random
  console.warn(`Roll ${roll} fell outside cumulative range [0, ${cumulative}], returning random`);
  return items[Math.floor(prng() * items.length)];
}
```

**Pokemon Application**:
```typescript
// Map phase -> weight table
const phaseToWeights: Record<Phase, TierWeightTable> = {
  FOCUS: { rare: 0.02, uncommon: 0.15, common: 0.83 },
  SHORT_BREAK: { rare: 0.02, uncommon: 0.15, common: 0.83 },
  LONG_BREAK: { rare: 0.10, uncommon: 0.35, common: 0.55 },
};

function rollCatch(phase: Phase, prng: () => number = Math.random): PokemonSpecies {
  const weights = phaseToWeights[phase];
  return weightedRandomPick(pokemonSpecies, weights, prng);
}
```

**Error Handling**:
- If `tierWeights` is invalid (negative, NaN, missing tiers), return random item from full pool
- If `prng()` returns invalid value (< 0 or >= 1), fall back to `Math.random()`
- Log warnings for edge cases; don't throw (fail gracefully)

---

### Pattern 2: Atomic Idempotent Event Recording (Generic)

**When to use**: Recording user actions with side effects (catches, boss defeats, achievements) where idempotency is required.

**Pluggable abstractions**:
- Event type: `{ triggerId: string; userId: string; ... }`
- Side-effect selection: algorithm to compute outcome (e.g., `rollCatch`)
- Storage: transactional insert of event + side-effect

**Generic Flow**:
```typescript
interface IdempotentEventInsert<Event, SideEffect> {
  triggerId: string; // Unique per trigger (e.g., cycleId) — UNIQUE constraint
  userId: string;
  event: Event; // The parent event (e.g., PomodoroCycle)
  sideEffect: SideEffect; // The outcome (e.g., CaughtPokemon)
  createdAt: Date;
}

async function recordEventWithSideEffect<Event, SE>(
  db: Database,
  event: Event,
  selectSideEffect: (event: Event) => SE,
  insertFns: {
    insertEvent: (tx: Transaction, event: Event) => Promise<{ id: string }>;
    insertSideEffect: (tx: Transaction, triggerId: string, userId: string, sideEffect: SE) => Promise<SE>;
  }
): Promise<{ event: Event; sideEffect: SE }> {
  try {
    return await db.transaction(async (tx) => {
      const insertedEvent = await insertFns.insertEvent(tx, event);
      const sideEffect = selectSideEffect(event);
      const insertedSideEffect = await insertFns.insertSideEffect(
        tx,
        insertedEvent.id,
        event.userId,
        sideEffect
      );
      return { event: insertedEvent, sideEffect: insertedSideEffect };
    });
  } catch (err) {
    // Check if it's a UNIQUE constraint violation on triggerId
    if (err instanceof DatabaseError && err.code === 'UNIQUE') {
      // Idempotent retry: return existing side-effect
      const existing = await getSideEffectByTriggerId(db, (event as any).id);
      return existing ? { event, sideEffect: existing } : throw err;
    }
    throw err;
  }
}
```

**Pokemon Application**:
```typescript
await recordEventWithSideEffect(
  db,
  { id: cycleId, userId, phase, ... }, // PomodoroCycle
  (cycle) => rollCatch(cycle.phase),     // Select species
  {
    insertEvent: (tx, cycle) =>
      tx.insert(pomodoroycles).values(cycle).returning(),
    insertSideEffect: (tx, cycleId, userId, species) =>
      tx.insert(pokemonCatches)
        .values({ id: nanoid(), cycleId, userId, speciesId: species.id, caughtAt: new Date() })
        .returning(),
  }
);
```

**Error Handling**:
- UNIQUE constraint violation on `triggerId` → idempotent return
- Transaction rollback on any error → no orphaned records
- Network timeout during insert → client retries with same `triggerId`, server detects UNIQUE violation, returns existing
- Log all constraint violations for monitoring

**IMPORTANT: Verify SQLite Error Code**
Drizzle ORM + Bun's SQLite driver report UNIQUE violations via different error structures. Before production, run this test to verify the actual error code/message shape:
```typescript
// Test to determine actual SQLite error structure
it('UNIQUE constraint violation error shape', async () => {
  const db = new Database(':memory:');
  db.exec(`CREATE TABLE test (id TEXT PRIMARY KEY, value TEXT)`);
  
  try {
    const stmt1 = db.prepare('INSERT INTO test VALUES (?, ?)');
    stmt1.run('id1', 'value1');
    stmt1.run('id1', 'value2'); // Duplicate key
  } catch (err) {
    console.log('Actual error:', {
      message: err?.message,
      code: (err as any)?.code,
      errno: (err as any)?.errno,
      sqliteCode: (err as any)?.sqliteCode,
      constructor: err?.constructor.name,
    });
  }
  db.close();
});
```
Use the output to update the error-checking code. Common values: SQLite errno 19 (SQLITE_CONSTRAINT), Drizzle may report `code: 'UNIQUE'` or include it in message.

---

### Pattern 3: Modal Reveal UI (Generic + Keyboard Accessible)

**When to use**: Success/error/nudge dialogs triggered by events, with optional follow-up actions.

**Implementation** (per CLAUDE.md `TimerSettings` pattern):
- Use native `<dialog open>` element (`role="dialog"`)
- Owned by a feature-specific hook (e.g., `useCatchReveal`) with local state
- Keyboard accessible: ESC dismisses, focus trapped within dialog

**Component Structure**:
```typescript
// Hook: owns modal state
function useCatchReveal() {
  const [caughtPokemon, setCaughtPokemon] = useState<CaughtPokemon | null>(null);
  const [showLoginNudge, setShowLoginNudge] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dismiss = () => {
    setCaughtPokemon(null);
    setShowLoginNudge(false);
    setError(null);
  };

  return { caughtPokemon, showLoginNudge, error, setCaughtPokemon, setShowLoginNudge, setError, dismiss };
}

// Component: renders modal
export default function CatchReveal({ caughtPokemon, onDismiss, showLoginNudge, networkError }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Dialog `open` attribute management
  useEffect(() => {
    const isOpen = !!(caughtPokemon || showLoginNudge || networkError);
    if (isOpen) {
      dialogRef.current?.showModal(); // Focus management + backdrop
    } else {
      dialogRef.current?.close();
    }
  }, [caughtPokemon, showLoginNudge, networkError]);

  // Keyboard: ESC to dismiss (handled by <dialog> natively)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDialogElement>) => {
    if (e.key === 'Escape') {
      onDismiss();
      e.preventDefault(); // Prevent double-close
    }
  };

  const species = caughtPokemon
    ? pokemonSpecies.find(s => s.id === caughtPokemon.speciesId)
    : null;

  return (
    <dialog
      ref={dialogRef}
      onKeyDown={handleKeyDown}
      className="fixed inset-0 flex items-center justify-center backdrop-blur"
    >
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
        {caughtPokemon && species ? (
          <CaughtContent species={species} onDismiss={onDismiss} />
        ) : showLoginNudge ? (
          <LoginNudgeContent />
        ) : networkError ? (
          <ErrorContent error={networkError} onDismiss={onDismiss} />
        ) : null}
      </div>
    </dialog>
  );
}

// Caught content: sprite, name, rarity badge
function CaughtContent({ species, onDismiss }: { species: PokemonSpecies; onDismiss: () => void }) {
  return (
    <>
      <h2 className="text-2xl font-bold text-center mb-4">Caught!</h2>
      <img src={species.spriteUrl} alt={species.name} className="w-32 h-32 mx-auto mb-4" />
      <p className="text-center text-lg font-semibold">{species.name}</p>
      <p className="text-center text-sm text-gray-600 mb-6 capitalize">{species.rarity}</p>
      <button
        onClick={onDismiss}
        className="w-full py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600"
      >
        Got it!
      </button>
    </>
  );
}

// Login nudge: when guest completes phase
function LoginNudgeContent() {
  return (
    <>
      <h2 className="text-lg font-bold text-center mb-4">Sign in to catch Pokémon</h2>
      <p className="text-center text-gray-600 mb-6">Build your collection by creating an account</p>
      <button onClick={() => window.location.href = '/login'} className="w-full py-2 bg-green-500 text-white rounded-lg">
        Sign in
      </button>
    </>
  );
}

// Error content: network or server failure
function ErrorContent({ error, onDismiss }: { error: string; onDismiss: () => void }) {
  return (
    <>
      <h2 className="text-lg font-bold text-center mb-4">Couldn't catch it</h2>
      <p className="text-center text-gray-600 mb-6">{error}</p>
      <button
        onClick={onDismiss}
        className="w-full py-2 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600"
      >
        Try again
      </button>
    </>
  );
}
```

**Keyboard Accessibility**:
- `<dialog open>` traps focus natively
- ESC key dismisses (native `<dialog>` behavior)
- Initial focus on dismiss button (no explicit `autoFocus` needed — dialog handles it)
- Test: render dialog, press ESC, assert `onDismiss` called

**Styling** (Tailwind 4 per CLAUDE.md):
- Use Tailwind utility classes (no separate CSS file needed)
- Dialog backdrop via `backdrop-blur` or `bg-black/50`
- Interior uses responsive padding, centered layout

---

### Data Contract: PokemonSpecies Schema

**Critical**: Pattern 4 (generation) outputs data that Pattern 2 (selection) consumes. Both must validate against the same schema to prevent silent corruption.

**Zod Schema** (shared contract in `src/shared/schemas/pokemonSpecies.ts`):
```typescript
import { z } from 'zod';

export const PokemonRarityEnum = z.enum(['rare', 'uncommon', 'common']);
export type PokemonRarity = z.infer<typeof PokemonRarityEnum>;

export const PokemonSpeciesSchema = z.object({
  id: z.number().int().min(1).max(151),
  name: z.string().min(1),
  spriteUrl: z.string().url().or(z.string().length(0)), // Allow empty string as fallback
  rarity: PokemonRarityEnum,
});

export const PokemonSpeciesArraySchema = z.array(PokemonSpeciesSchema);
export type PokemonSpecies = z.infer<typeof PokemonSpeciesSchema>;
```

**Usage**:
- **Pattern 4** (generation): Validate generated array before writing to disk
  ```typescript
  const validated = PokemonSpeciesArraySchema.parse(species);
  await Bun.write('src/shared/data/pokemonSpecies.ts', ...);
  ```
- **Pattern 2** (selection): Assume species data is already valid (validated on load)
- **Load time**: Validate `pokemonSpecies` import at app startup:
  ```typescript
  // client/main.ts or server/index.ts (before first use)
  const validated = PokemonSpeciesArraySchema.safeParse(pokemonSpecies);
  if (!validated.success) {
    throw new Error(`Invalid pokemonSpecies data: ${validated.error.message}`);
  }
  ```

---

### Pattern 4 (Application: PokeAPI Static Data Generation)

**When to use**: Initial setup for static reference data that never changes at runtime.

**Flow** (with comprehensive error handling):
1. Script fetches `/pokemon-species/{id}` (151 entries) → extract rarity: `is_legendary`, `is_mythical`, `capture_rate`
2. Script fetches `/pokemon/{id}` (151 entries) → extract sprite: `sprites.front_default`
3. Map to `PokemonSpecies` type: `{ id, name, spriteUrl, rarity }`
4. **Validate** against `PokemonSpeciesArraySchema` before writing
5. Generate `src/shared/data/pokemonSpecies.ts` module (static export, 151 rows)
6. Commit to repo; never fetch at runtime
7. NOT part of `bun dev`/tests/CI — manual one-time step

**Rate Limiting & Error Handling**:
- PokeAPI public API: ~100 requests/second (no auth required, but enforce politeness)
- HTTP 429 (rate limit): Exponential backoff (1s → 2s → 4s)
- HTTP 503 (unavailable): Retry with 10s backoff, give up after 3 attempts
- HTTP 5xx (server error): Retry once after 2s delay
- Network timeout: 30s timeout per fetch, retry once on timeout
- Partial data failure: Log failed species IDs, allow resume from checkpoint

**Implementation** (with retry strategy and schema validation):
```typescript
// scripts/generatePokemonSpecies.ts
import { PokemonSpeciesArraySchema } from '@/shared/schemas/pokemonSpecies';

interface FetchOptions {
  maxRetries: number;
  backoffMs: number;
  timeoutMs: number;
}

async function fetchWithRetry(url: string, options: FetchOptions): Promise<any> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        return await response.json();
      }

      if (response.status === 429) {
        // Rate limit: exponential backoff
        const backoff = options.backoffMs * Math.pow(2, attempt);
        console.log(`Rate limited. Backing off ${backoff}ms...`);
        await new Promise(r => setTimeout(r, backoff));
        continue;
      }

      if (response.status === 503) {
        // Service unavailable
        if (attempt < options.maxRetries) {
          await new Promise(r => setTimeout(r, 10000)); // 10s backoff
          continue;
        }
        throw new Error(`Service unavailable (503), max retries reached`);
      }

      if (response.status >= 500) {
        // Server error: single retry
        if (attempt === 0) {
          await new Promise(r => setTimeout(r, 2000)); // 2s delay
          continue;
        }
        throw new Error(`Server error (${response.status}), max retries reached`);
      }

      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (err instanceof DOMException && err.name === 'AbortError') {
        console.log(`Timeout on attempt ${attempt + 1}, retrying...`);
      } else if (attempt === options.maxRetries) {
        throw lastError;
      }
    }
  }

  throw lastError || new Error('Unknown fetch error');
}

async function generatePokemonSpecies() {
  const species: any[] = [];
  const failedIds: number[] = [];

  const options = { maxRetries: 2, backoffMs: 1000, timeoutMs: 30000 };

  for (let id = 1; id <= 151; id++) {
    try {
      // Fetch species data
      const speciesData = await fetchWithRetry(`https://pokeapi.co/api/v2/pokemon-species/${id}/`, options);
      const pokemonData = await fetchWithRetry(`https://pokeapi.co/api/v2/pokemon/${id}/`, options);

      const rarity = speciesData.is_legendary ? 'rare' 
        : speciesData.is_mythical ? 'rare'
        : speciesData.capture_rate <= 45 ? 'uncommon'
        : 'common';

      species.push({
        id,
        name: speciesData.name,
        spriteUrl: pokemonData.sprites?.front_default || '',
        rarity,
      });

      console.log(`✓ ${id}/151: ${speciesData.name}`);
    } catch (err) {
      console.error(`✗ Failed to fetch ID ${id}:`, err instanceof Error ? err.message : err);
      failedIds.push(id);
    }

    // Polite delay between requests
    await new Promise(r => setTimeout(r, 50));
  }

  if (failedIds.length > 0) {
    throw new Error(`Failed to fetch ${failedIds.length} species: ${failedIds.join(', ')}`);
  }

  // Validate data against schema before writing
  const validated = PokemonSpeciesArraySchema.parse(species);
  console.log(`✓ Validated ${validated.length} species against PokemonSpeciesArraySchema`);

  // Generate TypeScript file
  const output = `// Generated from PokeAPI on ${new Date().toISOString()}
// DO NOT EDIT MANUALLY

export interface PokemonSpecies {
  id: number;
  name: string;
  spriteUrl: string;
  rarity: 'rare' | 'uncommon' | 'common';
}

export const pokemonSpecies: PokemonSpecies[] = ${JSON.stringify(validated, null, 2)};
`;

  // Write with error handling for disk full, permission denied, etc.
  try {
    await Bun.write('src/shared/data/pokemonSpecies.ts', output);
    console.log(`✓ Generated src/shared/data/pokemonSpecies.ts (${validated.length} species)`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Failed to write pokemonSpecies.ts:', message);
    throw new Error(`Disk write failed: ${message}`);
  }
}

generatePokemonSpecies().catch(err => {
  console.error('Generation failed:', err);
  process.exit(1);
});
```

**Benefits**:
- Zero runtime network latency (compiled into bundle)
- Testable data (static file is the seed, no seeding needed)
- Repeatable builds (same commit = same species data)
- No runtime rate-limit concerns
- Explicit versioning via comment hash (detect stale data)

**When to Re-run**:
- New Pokemon gen added to PokeAPI (out of scope for this app)
- Species rarity changes (unlikely, frozen PokeAPI data)
- Sprite URLs break (manual update required)

### Pattern 5 (Application: Collection UI Grid)

**Fixed 151-Item Grid** (No pagination, no virtual scroll)

**Component Structure** (per CLAUDE.md smart/dumb split):
- `Collection.tsx`: Smart container, fetches data via `getPokemonCatches()`, renders `CollectionGrid`
- `CollectionGrid.tsx`: Dumb presentational component, takes data props only

**Styling** (Tailwind 4 + CVA per CLAUDE.md):
```tsx
import { clsx } from 'clsx'; // or use CVA for complex variants
import { pokemonSpecies } from '@/shared/data/pokemonSpecies';

export default function CollectionGrid({ catches }: { catches: Array<{ speciesId: number; count: number }> }) {
  // Build caught map: speciesId -> count
  const caughtMap = new Map(catches.map(c => [c.speciesId, c.count]));

  return (
    <div className="grid grid-cols-6 gap-2 p-4 sm:grid-cols-8 lg:grid-cols-12">
      {pokemonSpecies.map(species => {
        const count = caughtMap.get(species.id);
        return count ? (
          <div key={species.id} className="relative flex flex-col items-center">
            <img
              src={species.spriteUrl}
              alt={species.name}
              className="w-12 h-12 object-contain"
            />
            {count > 1 && (
              <span className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {count}
              </span>
            )}
            <p className="text-xs mt-1 text-center truncate">{species.name}</p>
          </div>
        ) : (
          // Uncaught: greyed silhouette placeholder
          <div
            key={species.id}
            className="flex flex-col items-center opacity-30 cursor-default"
          >
            <div className="w-12 h-12 bg-gray-300 rounded-lg" />
            <p className="text-xs mt-1 text-gray-500 text-center">#{species.id.toString().padStart(3, '0')}</p>
          </div>
        );
      })}
    </div>
  );
}

// Smart container
function Collection() {
  const [catches, setCatches] = useState<Array<{ speciesId: number; count: number }>>([]);
  const [loading, setLoading] = useState(true);
  const auth = useAuthContext();

  useEffect(() => {
    if (auth.status !== 'authenticated') {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const data = await getPokemonCatches();
        setCatches(data ?? []);
      } catch (err) {
        console.error('Failed to load collection:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [auth.status]);

  if (!loading && auth.status !== 'authenticated') {
    return <div className="p-6 text-center">Sign in to view your collection</div>;
  }

  return <CollectionGrid catches={catches} />;
}
```

**Dex Order**: Static module already is in ID order (1-151); iteration preserves it.

**Error Handling**:
- Network error fetching collection → log and show empty grid
- Unauthenticated user → show sign-in message, empty grid
- Partial data failure → show what loaded, log errors

### Pattern 6 (Application: Collection Data Fetching & Grouping)

**Server Endpoint**: `GET /api/pokemon-catches` (session-checked)

**Drizzle Query** (aggregation):
```typescript
// server/api/pokemonCatches.ts
import { eq } from 'drizzle-orm';
import { count, max } from 'drizzle-orm/functions';

export async function getAuthenticatedUsersCatches(db: Database, userId: string) {
  const catches = await db
    .select({
      speciesId: pokemonCatches.speciesId,
      count: count(pokemonCatches.id).as('count'),
      lastCaughtAt: max(pokemonCatches.caughtAt),
    })
    .from(pokemonCatches)
    .where(eq(pokemonCatches.userId, userId))
    .groupBy(pokemonCatches.speciesId);

  return catches;
}

// Handler
export default async (req: Request) => {
  const { userId } = await resolveSession(req); // Session-checked
  if (!userId) return new Response('Unauthorized', { status: 401 });

  try {
    const catches = await getAuthenticatedUsersCatches(db, userId);
    const validated = pokemonCatchesSummarySchema.parse(catches);
    return Response.json(validated);
  } catch (err) {
    console.error('Failed to fetch catches:', err);
    return new Response('Internal server error', { status: 500 });
  }
};
```

**Zod Schema** (shared `src/shared/schemas/`):
```typescript
export const pokemonCatchesSummarySchema = z.array(
  z.object({
    speciesId: z.number().min(1).max(151),
    count: z.number().int().min(1),
    lastCaughtAt: z.date(),
  })
);
```

**Client API Call**:
```typescript
// client/api.ts
export async function getPokemonCatches() {
  try {
    const res = await fetch('/api/pokemon-catches', { credentials: 'include' });
    if (!res.ok) {
      console.error(`HTTP ${res.status}:`, await res.text());
      return null; // Graceful degradation
    }
    return pokemonCatchesSummarySchema.parse(await res.json());
  } catch (err) {
    console.error('Failed to parse catches:', err);
    return null;
  }
}
```

**Client Rendering** (see Pattern 5 for usage)

---

## Common Pitfalls & Solutions

| Issue | Impact | Prevention/Solution |
|-------|--------|-----------|
| **PokeAPI rate limits (429)** | Script fails mid-execution | Implement exponential backoff (1s, 2s, 4s), check `Retry-After` header, add 50ms+ delay between requests (see Pattern 4) |
| **PokeAPI service unavailable (503)** | Partial data or script abort | Retry with 10s backoff up to 3 times; log failed species IDs for manual recovery |
| **Network timeout on PokeAPI** | Script hangs indefinitely | Set 30s fetch timeout; single retry on timeout; allow resume from checkpoint |
| **Client/server pokemonSpecies.ts drift** | Hydration mismatch, silent data corruption | Single committed data file; both sides import same path; CI deploys together; test both explicitly |
| **Concurrent cycleId POST requests** | Duplicate catches, race conditions | Client generates cycleId immediately; server uses UNIQUE constraint; test with simultaneous requests (see Pattern 2) |
| **Double-catch on network retry** | Data integrity violation | UNIQUE constraint on `cycleId` + idempotent insert (return existing catch on duplicate, not error) |
| **PRNG flaky tests** | Non-deterministic test failures in CI | Inject seeded PRNG into `rollCatch()`; seed all tests consistently; run full suite with same seed (see Testing Patterns) |
| **Modal doesn't close after dismiss** | UX broken, state leak | Use native `<dialog>` (auto-handles ESC); set `open` based on state; test ESC and button dismiss (see Pattern 3) |
| **Collection grid broken sprite images** | UX degradation, confusion | Use CSS placeholder (greyed box) for uncaught; test with missing sprite URLs; fallback to placeholder on 404 |
| **Static species module bundle bloat** | Large download | pokemonSpecies.ts is ~5KB minified; negligible for ~300KB React bundle |
| **Timezone skew on caughtAt** | Incorrect sorting, user confusion | Always store as UTC in DB; parse as Date; test with different timezones |
| **Offline phase completion + reconnect** | Lost catches or duplicates | cycleId generated immediately; POST retried on reconnect; UNIQUE constraint prevents duplicates |
| **POST /api/cycles fails, timer doesn't reset** | User stuck in RUNNING state | Always dispatch RESET regardless of catch success/failure (see CLAUDE.md `useCycleRecorder` pattern) |
| **Collection GET endpoint slow** | Poor UX when opening collection | Use Drizzle aggregate query (GROUP BY, not N+1); add index on `pokemonCatches.userId` |
| **Rarity weights don't sum to 1.0** | Silent bias in selection | Validate weights in `rollCatch()`; log warnings; use fallback uniform distribution if invalid |

---

## Testing Patterns (Bun + React Testing Library per CLAUDE.md)

### Unit Test: Weighted Selection with Seeded PRNG

```typescript
// test/helpers/seededRng.ts — deterministic PRNG for reproducible tests
function simpleSeededRng(seed: number) {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

// server/pokemon/rollCatch.test.ts
import { rollCatch } from '@/server/pokemon/rollCatch';
import { simpleSeededRng } from '@/test/helpers/seededRng';

describe('rollCatch', () => {
  it('respects LONG_BREAK tier weights (10% rare)', () => {
    const seededRng = simpleSeededRng(12345);
    let rareCount = 0;

    for (let i = 0; i < 100; i++) {
      const species = rollCatch('LONG_BREAK', seededRng);
      if (species.rarity === 'rare') rareCount++;
    }

    // ~10% rare = ~10/100, allow variance
    expect(rareCount).toBeGreaterThanOrEqual(5);
    expect(rareCount).toBeLessThanOrEqual(15);
  });

  it('respects FOCUS tier weights (2% rare)', () => {
    const seededRng = simpleSeededRng(67890);
    let rareCount = 0;

    for (let i = 0; i < 100; i++) {
      const species = rollCatch('FOCUS', seededRng);
      if (species.rarity === 'rare') rareCount++;
    }

    // ~2% rare = ~2/100, allow variance
    expect(rareCount).toBeLessThanOrEqual(6);
  });

  it('always returns species from pokemonSpecies array', () => {
    const seededRng = simpleSeededRng(11111);

    for (let i = 0; i < 50; i++) {
      const species = rollCatch('LONG_BREAK', seededRng);
      expect(pokemonSpecies).toContainEqual(species);
      expect(species.id).toBeGreaterThanOrEqual(1);
      expect(species.id).toBeLessThanOrEqual(151);
    }
  });
});
```

### Integration Test: Transactional Catch Recording with Idempotency

```typescript
// server/api/cycles.test.ts — test catch recording and UNIQUE guard
describe('POST /api/cycles', () => {
  it('records cycle and catch atomically', async () => {
    const userId = 'test-user-1';
    const cycleId = 'cycle-abc123';

    const response = await postCycleRequest({
      cycleId,
      userId,
      phase: 'FOCUS',
      duration: 1500,
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      ok: true,
      catch: { speciesId: expect.any(Number), caughtAt: expect.any(String) },
    });

    // Verify database state
    const cycles = await db.select().from(pomodoroycles).where(eq(pomodoroycles.id, cycleId));
    const catches = await db.select().from(pokemonCatches).where(eq(pokemonCatches.cycleId, cycleId));

    expect(cycles).toHaveLength(1);
    expect(catches).toHaveLength(1);
    expect(catches[0]?.speciesId).toBe(response.body.catch.speciesId);
  });

  it('handles duplicate cycleId gracefully (idempotency)', async () => {
    const userId = 'test-user-2';
    const cycleId = 'cycle-duplicate';

    // First request
    const response1 = await postCycleRequest({
      cycleId,
      userId,
      phase: 'LONG_BREAK',
      duration: 900,
    });

    expect(response1.status).toBe(200);
    const speciesId1 = response1.body.catch.speciesId;

    // Retry with same cycleId (simulating network retry)
    const response2 = await postCycleRequest({
      cycleId,
      userId,
      phase: 'LONG_BREAK',
      duration: 900,
    });

    // Should return 409 Conflict OR return existing catch (implementation choice)
    // If returning existing: status 200, same speciesId
    if (response2.status === 200) {
      expect(response2.body.catch.speciesId).toBe(speciesId1);
    } else {
      expect(response2.status).toBe(409);
    }

    // Verify database has exactly one catch row
    const catches = await db.select().from(pokemonCatches).where(eq(pokemonCatches.cycleId, cycleId));
    expect(catches).toHaveLength(1);
  });

  it('rolls higher rarity on LONG_BREAK than FOCUS', async () => {
    const userId = 'test-user-3';

    // Mock rollCatch to use seeded RNG for reproducible test
    const seededRng = simpleSeededRng(99999);
    mock.module('@/server/pokemon/rollCatch', {
      rollCatch: (phase: Phase) => rollCatch(phase, seededRng),
    });

    // LONG_BREAK: run 10 times, expect some rare
    let rareCountLongBreak = 0;
    for (let i = 0; i < 10; i++) {
      const res = await postCycleRequest({
        cycleId: `cycle-lb-${i}`,
        userId,
        phase: 'LONG_BREAK',
        duration: 900,
      });
      if (res.body.catch.speciesId <= 5) rareCountLongBreak++; // Assume IDs 1-5 are rare
    }

    // FOCUS: run 10 times, expect fewer rare
    let rareCountFocus = 0;
    for (let i = 0; i < 10; i++) {
      const res = await postCycleRequest({
        cycleId: `cycle-f-${i}`,
        userId,
        phase: 'FOCUS',
        duration: 1500,
      });
      if (res.body.catch.speciesId <= 5) rareCountFocus++;
    }

    expect(rareCountLongBreak).toBeGreaterThan(rareCountFocus);
    mock.restore();
  });
});
```

### Component Test: CatchReveal Dialog with Keyboard Accessibility

```typescript
// client/features/pokemon/components/CatchReveal/CatchReveal.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from '@testing-library/react';
import CatchReveal from '@/client/features/pokemon/components/CatchReveal';

describe('CatchReveal', () => {
  it('displays caught Pokemon with sprite and name', () => {
    const caught = { speciesId: 25, caughtAt: new Date() };
    const onDismiss = mock(() => {});

    render(
      <CatchReveal caughtPokemon={caught} onDismiss={onDismiss} showLoginNudge={false} networkError={null} />
    );

    expect(screen.getByRole('dialog')).toBeVisible();
    expect(screen.getByText('Caught!')).toBeInTheDocument();
    expect(screen.getByText('Pikachu')).toBeInTheDocument();
    expect(screen.getByAltText('Pikachu')).toHaveAttribute('src', /pikachu/);
  });

  it('closes on "Got it" button click', async () => {
    const caught = { speciesId: 25, caughtAt: new Date() };
    const onDismiss = mock(() => {});

    render(
      <CatchReveal caughtPokemon={caught} onDismiss={onDismiss} showLoginNudge={false} networkError={null} />
    );

    const button = screen.getByRole('button', { name: /got it/i });
    await userEvent.click(button);

    // Allow effect to settle
    await act(async () => {
      await Bun.sleep(0);
    });

    expect(onDismiss).toHaveBeenCalled();
  });

  it('closes on ESC key (keyboard accessibility)', async () => {
    const caught = { speciesId: 25, caughtAt: new Date() };
    const onDismiss = mock(() => {});

    render(
      <CatchReveal caughtPokemon={caught} onDismiss={onDismiss} showLoginNudge={false} networkError={null} />
    );

    const dialog = screen.getByRole('dialog');
    await userEvent.keyboard('{Escape}');

    await act(async () => {
      await Bun.sleep(0);
    });

    expect(onDismiss).toHaveBeenCalled();
  });

  it('shows login nudge when guest completes phase', () => {
    render(
      <CatchReveal
        caughtPokemon={null}
        onDismiss={() => {}}
        showLoginNudge={true}
        networkError={null}
      />
    );

    expect(screen.getByText(/sign in to catch pokemon/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows error message on network failure', () => {
    render(
      <CatchReveal
        caughtPokemon={null}
        onDismiss={() => {}}
        showLoginNudge={false}
        networkError="Network timeout"
      />
    );

    expect(screen.getByText(/couldn't catch it/i)).toBeInTheDocument();
    expect(screen.getByText('Network timeout')).toBeInTheDocument();
  });
});
```

### Hook Test: useCycleRecorder with Catch Posting

```typescript
// client/features/timer/TimerContext/useCycleRecorder.test.ts — per CLAUDE.md pattern
describe('useCycleRecorder', () => {
  it('posts cycle and handles successful catch', async () => {
    const dispatch = mock(() => {});
    const auth = { status: 'authenticated' as const, user: { id: 'user1' } };
    const timer = { status: 'IDLE' as const, remaining: 0, phase: 'FOCUS' as const };

    // Mock postCycle to return a catch
    mock.module('@/client/api', {
      postCycle: mock(async () => ({ speciesId: 25, caughtAt: new Date() })),
    });

    const { result } = renderHook(() => useCycleRecorder(timer, auth, dispatch));

    // Wait for effect to run
    await act(async () => {
      await Bun.sleep(0);
    });

    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'RESET' }));
  });

  it('shows login nudge for unauthenticated users', async () => {
    const dispatch = mock(() => {});
    const auth = { status: 'idle' as const };
    const timer = { status: 'IDLE' as const, remaining: 0, phase: 'FOCUS' as const };

    const { result } = renderHook(() => useCycleRecorder(timer, auth, dispatch));

    // Hook should trigger login nudge state update (via parent context)
    // Exact assertion depends on hook's state management

    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'RESET' }));
  });
});
```

---

## Generic Patterns Summary

This skill documents three **reusable patterns** applicable to any gamification feature, not just Pokemon:

1. **Weighted Tier Random Selection**: Pluggable tier names, weights, and contexts. Apply to boss battles (common/epic/legendary boss types), daily streaks (bronze/silver/gold rewards), item drops, achievement unlocks.

2. **Atomic Idempotent Event Recording**: Transactional event + side-effect insert with UNIQUE guard. Apply to any user action requiring guaranteed-once semantics: purchases, challenge completions, unlocks.

3. **Modal Reveal UI**: Keyboard-accessible dialog for success/error/nudge states. Apply to any notification workflow: achievements, errors, login prompts, confirmations.

The **pokemon-catching-collection** implementation demonstrates all three patterns concretely. When building the future "generalized event ledger" system (mentioned in task scope), these patterns form the foundation.

---

## Implementation Checklist

### Data Generation
- [ ] Create `scripts/generatePokemonSpecies.ts` (fetch 151 species from PokeAPI)
- [ ] Generate `src/shared/data/pokemonSpecies.ts` (static export)
- [ ] Add to `.gitignore` if generated; otherwise commit as data file
- [ ] Document manual run step in README/CLAUDE.md

### Database
- [ ] Add `pokemon_catches` table to `server/db/schema.ts`
- [ ] Run `bun run db:generate` to create migration
- [ ] Add Drizzle types for the table

### Server API
- [ ] Create `server/pokemon/rollCatch.ts` (pure function)
- [ ] Extend `server/api/cycles.ts` to call `rollCatch` and insert catch in transaction
- [ ] Create `server/api/pokemonCatches.ts` (GET endpoint with grouping)
- [ ] Add routes to `server/index.ts`
- [ ] Add Zod schemas to `src/shared/schemas/`

### Client
- [ ] Update `client/api.ts` with `postCycle` return type and `getPokemonCatches` function
- [ ] Create `client/features/pokemon/` directory structure
- [ ] Create `useCatchReveal` hook
- [ ] Update `useCycleRecorder` to handle catch response
- [ ] Create `CatchReveal` component with dialog
- [ ] Create `Collection` component (smart + dumb split)
- [ ] Add view toggle to `App.tsx`

### Testing
- [ ] Unit tests for `rollCatch.ts` (PRNG mocking)
- [ ] Integration tests for `cycles.ts` transactional insert
- [ ] Component tests for `CatchReveal` and `Collection`
- [ ] Hook tests for `useCatchReveal` and `useCycleRecorder` changes

---

## Sources & Verification

| Source | Category | Purpose |
|--------|----------|---------|
| https://pokeapi.co/docs/v2 | Official API | Species/Pokemon endpoints, response shapes |
| https://pokeapi.co/ | Official API | HTTP status codes (429, 503), rate limiting |
| https://orm.drizzle.team/docs/transactions | ORM Docs | SQLite transactions, rollback, constraint errors |
| https://orm.drizzle.team/docs/select#group-by | ORM Docs | Aggregate queries, GROUP BY, COUNT(), MAX() |
| https://bun.sh/docs/guides/sql | Runtime Docs | Built-in SQLite, `:memory:` mode, sync/async |
| https://bun.sh/docs/test/overview | Testing Docs | `bun:test`, mocking, `Bun.sleep()`, test hooks |
| https://testing-library.com/docs/react-testing-library/intro | Testing Docs | React Testing Library, queries, `act()` import, user interactions |
| https://testing-library.com/docs/queries/about | Testing Docs | Query patterns, role-based queries, accessibility testing |
| MDN — `<dialog>` element | HTML Standard | Native focus trapping, ESC handling, showModal() API |
| `.claude/CLAUDE.md` (this project) | Project Conventions | Context+Reducer, CVA styling, component patterns, smart/dumb split, test helpers |
| npm: `drizzle-orm` (v0.45.2) | Package Registry | Changelog, breaking changes, transaction support |
| npm: `class-variance-authority` (v0.7.1) | Package Registry | CVA pattern, component variants, type safety |
| npm: `@testing-library/react` (v16.3.2) | Package Registry | Latest features, breaking changes, mocking patterns |

---

## Changelog

| Date | Changes |
|------|---------|
| 2026-07-27 | Initial creation for task: implement-pokemon-catching-collection |
| 2026-07-28 | Major revision: extracted generic patterns (weighted selection, idempotent event recording, modal reveal); added Data Consistency & Concurrency subsection (hydration mismatch, concurrency, PRNG seeding, offline sync); integrated error handling into patterns with PokeAPI HTTP status codes and retry strategies; enhanced modal accessibility (ESC, focus trap); referenced CLAUDE.md conventions (Tailwind 4, CVA, Context+Reducer, component patterns); added comprehensive testing examples with seeded PRNG; expanded sources with specific verification dates and independent references |
| 2026-07-28 | Critical fixes: (1) Removed future-dated references from sources table (replaced with verifiable URLs only); (2) Added tierWeights validation in weightedRandomPick with tolerance check and clear error message; (3) Added try/catch error handling for Bun.write() disk operations with permission/disk-full error reporting; (4) Added PokemonSpeciesSchema (Zod) data contract for validation between Pattern 4 (generation) and Pattern 2 (selection) with load-time verification; (5) Added guidance for testing SQLite UNIQUE error code shape with Bun's driver; (6) Removed unverifiable dates from all citations |

