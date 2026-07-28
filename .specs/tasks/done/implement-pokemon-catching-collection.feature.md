---
title: Implement Pokémon catching and collection feature
---

> **Required Skill**: You MUST use and analyse `pokemon-catching-collection` skill before doing any modification to task file or starting implementation of it!
>
> Skill location: `.claude/skills/pokemon-catching-collection/SKILL.md`

## Initial User Prompt

Implement integration with PokeAPI so that after each completed phase (focus, short break, or long break), a wild Pokémon appears and is caught by the user. Introduces a new Pokémon entity and a collection linked to the user's account.

## Description

Pokédoro is a Pomodoro timer app with gamification through Pokémon collecting. After each completed work phase (focus, short break, or long break), users catch a wild Pokémon and add it to their personal collection. The collection persists to the user's account (requiring authentication) and displays as a Pokédex-like grid showing all 151 Generation 1 Pokémon with caught/uncaught status and counts.

The mechanic drives engagement by tying visible progression (collection completion) to productive work habits. Rarity varies by phase type: long breaks yield better odds of rare/uncommon species than focus or short-break sessions, rewarding sustained effort. All catches succeed (no failure mechanic), and each recorded cycle generates at most one catch. Unauthenticated users see a sign-in prompt and empty collection, incentivizing account creation.

**Scope**:
- **Included**: Catch trigger on every phase completion (focus, short break, long break), rarity-based species selection (3 tiers: common, uncommon, rare), per-user collection storage and retrieval, collection grid UI (all 151 species in dex order, caught/uncaught display, no pagination), catch reveal modal (immediate feedback), guest sign-in incentive, at-most-one-catch-per-cycle guarantee, error handling for failed catch requests.
- **Excluded**: Catch failure/flee mechanics, live PokeAPI calls at runtime, routing library or advanced navigation, trading/battling/currency systems, generalized event ledger, beyond Gen 1 (full national dex).

**User Scenarios**:
1. **Primary Flow**: Authenticated user completes phase → catch modal appears with random Pokémon → user dismisses → collection is updated → user can view collection grid anytime.
2. **Guest Flow**: Unauthenticated user completes phase → sign-in incentive appears → user clicks to login → after auth, catches accrue on phases completed after signing in.
3. **Error Flow**: Phase completion request fails → modal shows "Couldn't catch it — try again" → timer still resets → user can retry by completing another phase.

## Acceptance Criteria

### Functional Requirements

- [ ] **Catch trigger on all phase types**: Catch attempt occurs on every completed phase (focus, short break, long break)
  - Given: User completes a timer phase
  - When: The phase completion event fires
  - Then: A catch attempt is made; the caught species is shown to the user

- [ ] **Rarity varies by phase type**: Long break completions yield higher odds of rare/uncommon species than focus or short break
  - Given: Long break completion occurs; focus or short break completion occurs
  - When: Species are randomly selected via the rarity-tier mechanism
  - Then: Long break rolls select rare/uncommon species more frequently than shorter phase types (at least 5× more likely for rare tier)

- [ ] **Species selected from Gen 1 pool**: Only Pokémon IDs 1–151 are catchable
  - Given: Any phase completes and triggers a catch
  - When: A species is selected
  - Then: The selected species ID is between 1 and 151 inclusive

- [ ] **Rarity tier distribution is correct**: Species are distributed across three tiers (rare, uncommon, common) matching the specification
  - Given: The static species data is loaded
  - When: Species are counted by rarity classification
  - Then: Rare tier contains exactly 5 species (Articuno, Zapdos, Moltres, Mewtwo, Mew), uncommon tier contains species with capture_rate 20-45 from PokeAPI Gen 1 data (verified empirically during implementation to be 55 species — the original 18-28 estimate in this criterion was wrong; the capture_rate 20-45 rule is authoritative, not the count), common tier contains remaining species

- [ ] **At most one catch per recorded cycle**: Each recorded cycle generates at most one catch record
  - Given: A cycle is recorded
  - When: The cycle is processed
  - Then: Exactly one associated catch is created; subsequent attempts to process the same cycle do not create additional catches

- [ ] **Collection storage persists per user**: Catches are linked to authenticated user and persist across sessions
  - Given: Authenticated user catches multiple Pokémon
  - When: User logs out and logs back in
  - Then: All previously caught Pokémon remain in the user's collection with correct counts

- [ ] **Collection grid displays all 151 species in dex order**: All species are visible with caught/uncaught differentiation
  - Given: User opens Collection view
  - When: The collection loads
  - Then: All 151 species are displayed in ID order (1–151); caught species show visual confirmation and count; uncaught show placeholder and dex number

- [ ] **Catch reveal displays immediately after phase completion**: User receives immediate feedback when catching Pokémon
  - Given: Phase has completed and catch is awarded
  - When: The server response returns
  - Then: A modal displays the caught species with identifying information; user can dismiss the modal; timer reset proceeds regardless of modal state

- [ ] **Unauthenticated users see sign-in incentive**: Guests cannot persist catches but see motivation to authenticate
  - Given: User is not authenticated and completes a phase
  - When: The phase completion event fires
  - Then: A sign-in incentive message is shown; collection view shows empty/placeholder display with sign-in button

- [ ] **Error handling on failed catch request**: Server or network failures do not block timer progression
  - Given: The catch request fails (network error, server error, timeout)
  - When: The error is detected
  - Then: User sees error message "Couldn't catch it — try again"; timer reset still executes; user can retry on next phase completion

- [ ] **API response includes caught species**: Successful phase completion includes species information in the response
  - Given: Authenticated user completes phase
  - When: Server response is generated
  - Then: Response includes species ID and catch timestamp; client can use this to display the caught Pokémon

- [ ] **Collection retrieval groups catches by species**: User can query their collection with aggregated counts
  - Given: Authenticated user has caught multiple Pokémon (including duplicates)
  - When: Collection data is retrieved
  - Then: Results are grouped by species with count and most recent catch timestamp for each species

### Non-Functional Requirements

- [ ] **Catch selection completes quickly**: Rarity tier selection and species lookup are fast
  - Given: A catch selection occurs
  - When: The selection algorithm runs
  - Then: Selection completes in under 50ms (measurable performance threshold for synchronous species selection)

- [ ] **Collection loads within acceptable time**: Fetching and displaying user's collection does not cause noticeable lag
  - Given: User opens Collection view
  - When: Data is fetched and grid is rendered
  - Then: Collection displays to user within 1 second of opening

- [ ] **Species selection is deterministic in tests**: Test coverage uses reproducible random selection (no flakiness)
  - Given: Tests exercise the species selection logic
  - When: Tests run with seeded randomness
  - Then: Same input seed produces same species output; tests pass consistently without random failures

- [ ] **Catch records are atomic**: Cycle and catch creation either both succeed or both fail; no orphaned records
  - Given: A cycle and catch are recorded together
  - When: Either operation encounters an error
  - Then: Both operations are rolled back; database consistency is maintained

### Definition of Done

- [ ] All acceptance criteria pass (functional and non-functional)
- [ ] Unit tests for species selection logic (distribution validation, tier boundaries, seeded randomness)
- [ ] Integration tests for cycle and catch recording (atomic behavior, no duplicates, response structure)
- [ ] Integration tests for collection retrieval (grouping, aggregation, per-user isolation)
- [ ] Component tests for catch reveal UI (display, dismissal, error states, guest states) — 100% coverage
- [ ] Component tests for collection grid (layout, all 151 species rendering, caught/uncaught states) — 100% coverage
- [ ] Complete end-to-end workflow tested: phase completion → catch display → collection update
- [ ] Edge-case scenarios tested:
  - [ ] Duplicate rapid phase completions: User triggers two phase completions in quick succession → exactly one catch recorded (idempotency verified)
  - [ ] Multi-device isolation: User catches Pokémon on one device, views collection on another → catches attributed correctly to user, not device
  - [ ] Out-of-order phase events: LONG_BREAK fires before FOCUS due to network timing → rarity selection still respects the actual phase type, not fire order
- [ ] Documentation updated (inline comments, README if needed)
- [ ] All tests passing and coverage thresholds met

---

## Architecture Synthesis

**Scratchpad**: `.specs/scratchpad/d3bac8ef.md` (full thinking process, architectural decisions, pattern analysis)

### Solution Strategy

Implement Pokemon catching as a feature plugin into the existing Pokedoro architecture by extending the TimerContext to manage catch reveal state, creating a new Pokemon feature module with modal and collection components, and adding server-side catch recording with transaction atomicity and rarity-based species selection.

**Key Architectural Decisions**:

1. **Catch State Location**: Composes in `TimerContextProvider` via new `useCatchReveal` hook (5th hook alongside existing 4)
   - Justification: Phase completion triggers catch event; state belongs in phase context. Mirrors `useTickInterval`, `useCycleRecorder` patterns.

2. **Rarity-Based Species Selection**: Pure function `rollCatch(phase)` returns species synchronously (<50ms)
   - Justification: Selection logic independent of framework; enables testability and seeded PRNG injection for deterministic tests.

3. **Atomic Cycle+Catch Recording**: Single `db.transaction()` wraps both inserts with `pokemon_catches.cycleId` UNIQUE constraint
   - Justification: Guarantees consistency; prevents duplicates on retry; ensures at-most-one-catch-per-cycle.

4. **Collection State Management**: Component owns fetch logic via `useEffect` on view toggle (refetch on mount + navigation)
   - Justification: Collection is lazy-loaded/optional; no need to prefetch. Refetch on view toggle ensures freshness.

5. **No Additional Routing**: View toggle in `App.tsx` state (timer | collection)
   - Justification: Task forbids routing libraries; simple state toggle sufficient.

**Trade-offs Accepted**:
- TimerContext slightly fatter (2 additional state values) — acceptable for simpler architecture without new context wrapper
- Collection grid uses no pagination (per spec) — acceptable for Gen 1 only (151 species)

---

### Expected Changes

**Shared (Domain Types & Contracts)**

```
src/shared/
├── types/
│   └── pokemon.ts                      # NEW: PokemonSpecies, CaughtPokemon types
├── schemas/
│   └── pokemonCatch.ts                 # NEW: Zod schemas for catch wire format
└── data/
    └── pokemonSpecies.ts               # NEW: Static 151-entry module (generated from PokeAPI)
```

**Server (API Endpoints, Business Logic, Database)**

```
src/server/
├── api/
│   ├── cycles.ts                       # MODIFY: Extend response, add catch field, wrap in transaction
│   ├── cycles.test.ts                  # MODIFY: Add tests for transactional behavior, idempotency
│   ├── pokemonCatches.ts               # NEW: GET endpoint, session-checked, grouping logic
│   └── pokemonCatches.test.ts          # NEW: Grouping, aggregation, per-user isolation tests
├── pokemon/
│   ├── rollCatch.ts                    # NEW: Pure function for species selection by phase + rarity
│   └── rollCatch.test.ts               # NEW: Distribution, tier selection, seeded PRNG tests
├── db/
│   └── schema.ts                       # MODIFY: Add pokemon_catches table definition
└── index.ts                            # MODIFY: Wire new GET /api/pokemon-catches route
```

**Client (UI, Hooks, API Adapters)**

```
src/client/
├── api.ts                              # MODIFY: postCycle return type change, add getPokemonCatches
├── App.tsx                             # MODIFY: Add view toggle state, conditionally render views
├── features/
│   ├── timer/
│   │   └── TimerContext/
│   │       ├── TimerContext.tsx        # MODIFY: Compose useCatchReveal hook
│   │       ├── useCycleRecorder.ts     # MODIFY: Handle catch response, login nudge
│   │       ├── useCatchReveal.ts       # NEW: Manages caughtPokemon, showLoginNudge state
│   │       └── TimerContext.test.tsx   # MODIFY: Test catch success/failure/guest paths
│   └── pokemon/                        # NEW FEATURE DIRECTORY
│       ├── components/
│       │   ├── CatchReveal/
│       │   │   ├── CatchReveal.tsx     # NEW: Dialog modal, sprite/name/rarity display
│       │   │   └── CatchReveal.test.tsx # NEW: 100% coverage, render/dismiss/error states
│       │   └── Collection/
│       │       ├── Collection.tsx      # NEW: Smart container, fetches getPokemonCatches
│       │       ├── CollectionGrid.tsx  # NEW: Dumb grid, 151-item list, caught/uncaught
│       │       └── Collection.test.tsx # NEW: 100% coverage, grid layout, 151-item list
```

**Configuration**

```
bunfig.toml                            # MODIFY: Add pokemonSpecies.ts and generatePokemonSpecies.ts to coveragePathIgnorePatterns
scripts/
└── generatePokemonSpecies.ts          # NEW: One-off script for PokeAPI data generation (manual execution)
```

---

### Architecture Decomposition

**Pattern**: Layered architecture (Domain → Use Case → Adapter → Framework), extending existing Pokedoro conventions.

**Component Responsibilities**:

| Component | Layer | File Path | Responsibilities | Reuses From |
|-----------|-------|-----------|-----------------|-------------|
| **PokemonSpecies** | Domain | `src/shared/types/pokemon.ts` | Data only: `{ id, name, spriteUrl, rarity }` | New domain entity |
| **CaughtPokemon** | Domain | `src/shared/types/pokemon.ts` | Data only: `{ speciesId, caughtAt }` | New domain entity |
| **pokemonCatchSchema** | Adapter | `src/shared/schemas/pokemonCatch.ts` | Zod validation for wire format | Extends Zod pattern from `pomodoroCycle.ts` |
| **rollCatch** | Use Case | `src/server/pokemon/rollCatch.ts` | Pure: select species by rarity tier + phase | New pure function; injectable PRNG for tests |
| **useCatchReveal** | Adapter | `src/client/features/timer/TimerContext/useCatchReveal.ts` | Hook: state mgmt for caughtPokemon, showLoginNudge | Follows `useTickInterval`, `useCycleRecorder` pattern |
| **CatchReveal** | Adapter | `src/client/features/pokemon/components/CatchReveal/CatchReveal.tsx` | Modal: display caught species, dismiss | Dialog pattern from `TimerSettings.tsx` |
| **Collection** | Adapter | `src/client/features/pokemon/components/Collection/Collection.tsx` | Smart container: fetch and render collection grid | Follows `Timer.tsx` pattern |
| **CollectionGrid** | Adapter | `src/client/features/pokemon/components/Collection/CollectionGrid.tsx` | Dumb grid: render 151 species in dex order | Follows `TimerDisplay.tsx` pattern |

**Interactions**:

```
useCycleRecorder (timer feature)
        ↓ (await postCycle)
client/api.ts::postCycle
        ↓ (POST /api/cycles)
server/api/cycles.ts handler
        ↓ (db.transaction)
        ├─ Insert pomodoro_cycles row
        ├─ Call rollCatch(phase)
        └─ Insert pokemon_catches row
        ↓ (response { ok, catch: { speciesId, caughtAt } })
useCycleRecorder (parse result)
        ↓ (setCaughtPokemon callback)
useCatchReveal state
        ↓ (caughtPokemon becomes non-null)
CatchReveal component renders modal

Collection component (view toggle)
        ↓ (useEffect on mount/toggle)
client/api.ts::getPokemonCatches
        ↓ (GET /api/pokemon-catches)
server/api/pokemonCatches.ts handler
        ↓ (GROUP BY speciesId, count, max(caughtAt))
CollectionGrid component
        ↓ (join with static pokemonSpecies data)
Render 151 items with caught/uncaught status
```

---

### Building Block View

```
┌───────────────────────────────────────────────────────────┐
│               Pokemon Feature Module                       │
├───────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Client Layer (React Components)              │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │                                                       │  │
│  │  ┌─────────────────────────┐  ┌───────────────────┐ │  │
│  │  │   CatchReveal Modal     │  │  Collection Grid  │ │  │
│  │  │ (display, dismiss)      │  │ (151 species)     │ │  │
│  │  └─────────────────────────┘  └───────────────────┘ │  │
│  │           ↑                              ↑            │  │
│  │    (useCatchReveal state)        (getPokemonCatches)  │  │
│  │                                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │      Adapter Layer (Hooks & API)                     │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │                                                       │  │
│  │  ┌─────────────────────┐  ┌──────────────────────┐  │  │
│  │  │ useCatchReveal      │  │ client/api.ts        │  │  │
│  │  │ (state mgmt)        │  │ (postCycle, fetch)   │  │  │
│  │  └─────────────────────┘  └──────────────────────┘  │  │
│  │           ↑                         ↑                 │  │
│  │      (TimerContext)        (HTTP POST/GET)           │  │
│  │                                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │    Use Case Layer (Business Logic)                  │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │                                                       │  │
│  │           rollCatch(phase): PokemonSpecies           │  │
│  │        (pure: select species by rarity tier)         │  │
│  │                                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │    Domain Layer (Types & Contracts)                 │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │                                                       │  │
│  │  PokemonSpecies  ←→  CaughtPokemon  ←→  pokemonCatch │  │
│  │  (domain types)       (wire contract)  (Zod schema)  │  │
│  │                                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │    Framework Layer (Database)                       │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │                                                       │  │
│  │    pokemon_catches table (Drizzle ORM, SQLite)      │  │
│  │    (userId FK, cycleId UNIQUE, speciesId, caughtAt)│  │
│  │                                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└───────────────────────────────────────────────────────────┘
```

---

### Runtime Scenarios

**Scenario 1: Authenticated User Completes Phase and Catches Pokémon**

```
User completes focus/break phase
        ↓
Timer detects IDLE + remaining === 0
        ↓
useCycleRecorder effect fires (dependency: timer status)
        ↓
auth.status === 'authenticated' → proceed
        ↓
postCycle(CyclePayload) called
        ↓
POST /api/cycles { phase, userId }
        ↓
Server: db.transaction()
  ├─ INSERT pomodoro_cycles
  ├─ rollCatch(phase) → PokemonSpecies
  └─ INSERT pokemon_catches (userId, cycleId, speciesId, caughtAt)
        ↓
Response: { ok: true, catch: { speciesId, caughtAt } }
        ↓
useCycleRecorder parses response
        ↓
setCaughtPokemon({ speciesId, caughtAt })
        ↓
CatchReveal modal renders with species sprite/name/rarity
        ↓
User clicks dismiss
        ↓
setCaughtPokemon(null) → modal closes
        ↓
Timer resets, ready for next phase (RESET dispatch unconditional)
```

**Scenario 2: Guest Completes Phase (Unauthenticated)**

```
User completes phase (not signed in)
        ↓
Timer detects IDLE + remaining === 0
        ↓
useCycleRecorder effect fires
        ↓
auth.status !== 'authenticated' → skip postCycle
        ↓
setShowLoginNudge(true)
        ↓
Login incentive modal shown ("Sign in to save your collection")
        ↓
User clicks sign-in button → navigate to auth
        ↓
After successful auth, useAccountSync effect updates auth context
        ↓
Next phase completion → postCycle succeeds → catch awarded
        ↓
CatchReveal modal renders as normal
```

**Scenario 3: User Views Collection Grid**

```
User clicks "View Collection" header button
        ↓
App.tsx setView('collection')
        ↓
Collection component mounts (or re-renders)
        ↓
useEffect dependency [view] triggers
        ↓
getPokemonCatches() called (session-checked)
        ↓
GET /api/pokemon-catches
        ↓
Server: Query pokemon_catches WHERE userId = ?
        ↓
Server: GROUP BY speciesId, count(*), max(caughtAt)
        ↓
Response: [{ speciesId: 1, count: 3, lastCaughtAt: "..." }, { speciesId: 2, count: 1, ... }, ...]
        ↓
Collection component receives array
        ↓
Join with static pokemonSpecies data (all 151 entries)
        ↓
CollectionGrid renders 151 items in dex order
  - For caught species: sprite + name + "Caught: N" count
  - For uncaught: placeholder + dex number
        ↓
User can dismiss modal or switch back to timer view
```

**Error Path: Catch Request Fails**

```
postCycle fails (network error, 500, etc.)
        ↓
useCycleRecorder catches promise rejection
        ↓
Error handling: show "Couldn't catch it — try again" message
        ↓
Timer RESET dispatch still executes (no blocking on error)
        ↓
User can retry by completing another phase
```

---

### Architecture Decisions

**ADR 1: Catch State in TimerContext via useCatchReveal Hook**

**Status**: Accepted

**Context**: Need to manage catch reveal modal state; multiple options exist for where state should live.

**Options**:
1. Compose in TimerContextProvider as 5th hook (alongside useTickInterval, useLocalTimerPersistence, useCycleRecorder, useAccountSync)
2. Create separate PokemonContext at App level (sibling to TimerContext, AuthContext)
3. Global state object passed via props or additional context wrapper

**Decision**: Option 1 — compose `useCatchReveal` hook in `TimerContextProvider`.

**Consequences**:
- **Positive**: Follows existing pattern; no new architectural layers; single source of truth for catch state
- **Positive**: Collection component can read state via `useTimerContext()` for live updates on navigation
- **Positive**: Reduced surface area (one context, not two)
- **Negative**: TimerContext becomes slightly fatter (2 additional state values); justifiable given scope

---

**ADR 2: Pure Function for Rarity-Based Species Selection**

**Status**: Accepted

**Context**: Species must be selected by phase type with rarity tier weighting; selection must be fast (<50ms) and testable.

**Options**:
1. Pure function `rollCatch(phase): PokemonSpecies` with injectable PRNG
2. Class-based selector with internal state and methods
3. Async API call to generate species (ruled out: task says "no live PokeAPI calls at runtime")

**Decision**: Option 1 — pure function with Math.random() by default, injectable PRNG for tests.

**Consequences**:
- **Positive**: No I/O dependencies; fast execution; easily testable with seeded PRNG
- **Positive**: Pure function can be extracted to library/reused elsewhere
- **Negative**: PRNG injection needed for deterministic tests (acceptable; test infrastructure can provide)

---

**ADR 3: Atomic Cycle+Catch Transaction with UNIQUE Idempotency**

**Status**: Accepted

**Context**: Must guarantee at-most-one-catch-per-cycle; prevent orphaned records; handle retries gracefully.

**Options**:
1. Single `db.transaction()` wrapping cycle + catch inserts, with `pokemon_catches.cycleId` UNIQUE constraint
2. Separate inserts with application-level deduplication (check if catch exists before insert)
3. Idempotent key in request (retry using same cycleId returns cached result)

**Decision**: Option 1 — transaction + UNIQUE constraint.

**Consequences**:
- **Positive**: Database-enforced atomicity; guaranteed consistency; simple implementation
- **Positive**: UNIQUE constraint prevents duplicate on retry (second insert fails with 409 Conflict)
- **Negative**: Client must handle 409 Conflict error gracefully (show "couldn't catch" message, user retries on next phase)

---

**ADR 4: Collection Fetch on Mount + View Toggle (No Polling)**

**Status**: Accepted

**Context**: Collection must stay fresh; user might catch on one device, view on another; collection view is optional/lazy.

**Options**:
1. Fetch on component mount + refetch on view toggle (Collection component owns fetch logic)
2. Prefetch collection on App init (eager); no refetch on toggle
3. Poll in background (e.g., every 10s) to keep fresh
4. Use WebSocket subscription for real-time updates

**Decision**: Option 1 — fetch on mount + view toggle only.

**Consequences**:
- **Positive**: No unnecessary network requests; collection only fetched when user opens it
- **Positive**: Refetch on toggle ensures freshness; catches from catch response are live-updated
- **Negative**: Collection might be slightly stale if user catches on another device and quickly switches view (but refetch on toggle resolves within ~1s per spec)

---

**ADR 5: No Routing Library; Simple View Toggle in App.tsx**

**Status**: Accepted

**Context**: Task explicitly forbids routing libraries; need simple view switching (Timer ↔ Collection).

**Options**:
1. Local state in App.tsx (view: 'timer' | 'collection'); conditionally render
2. URL-based routing (forbidden by task)
3. Component state machine with explicit state transition logic

**Decision**: Option 1 — simple local state with conditional rendering.

**Consequences**:
- **Positive**: No external dependencies; simple to implement; sufficient for two-view layout
- **Negative**: Browser back/forward won't navigate views (acceptable; feature is not a multi-page app)

---

**ADR 6: Static pokemonSpecies Data Module (Generated Once, Not at Runtime)**

**Status**: Accepted

**Context**: Must load 151 species with names, sprites, rarity tiers for collection grid; data comes from PokeAPI.

**Options**:
1. Generate once via manual script (`scripts/generatePokemonSpecies.ts`); commit `src/shared/data/pokemonSpecies.ts`
2. Fetch from PokeAPI at runtime (on server startup or client init)
3. Use a JSON API endpoint to serve species data

**Decision**: Option 1 — generate once, commit as static module.

**Consequences**:
- **Positive**: Fast access (no I/O at runtime); static import; reliable (no API dependency at runtime)
- **Positive**: Script-generated data can be validated before commit
- **Negative**: Manual regeneration if PokeAPI changes; requires one-time setup
- **Note**: Script excluded from coverage (`coveragePathIgnorePatterns`)

---

### Reusable Code Integration

**Mapping of new components to existing patterns:**

| New Component | Reuses From | Pattern |
|---------------|-------------|---------|
| `useCatchReveal` hook | `src/client/features/timer/TimerContext/useTickInterval.ts` | Intention-revealing hook pattern; manages effect-driven state; returns state + setters |
| `useCatchReveal` hook | `src/client/features/timer/TimerContext/useCycleRecorder.ts` | Hook receives dependencies (timer, auth); used in context provider; callback pattern for state updates |
| `CatchReveal` modal | `src/client/features/timer/components/TimerSettings/TimerSettings.tsx` | `<dialog open>` element; `role="dialog"`; useRef for uncontrolled input state; useEffect sync on toggle |
| `Collection` (smart) | `src/client/features/timer/components/Timer/Timer.tsx` | Fetches data via hook/API; passes props to dumb component; handles loading/error states |
| `CollectionGrid` (dumb) | `src/client/features/timer/components/TimerDisplay/TimerDisplay.tsx` | Pure props-based rendering; no state; no side effects; CSS class styling |
| `postCycle` return type | `src/client/api.ts::getTimerState()` | Existing fetch wrapper pattern; JSON response parsing; error handling (return null on failure) |
| `getPokemonCatches` | `src/client/api.ts::getMe()` | Session-checked GET endpoint; JSON response parsing; return typed array |
| `rollCatch` | N/A in codebase | Pure function (no existing pattern); injectable PRNG for tests |
| `pokemon_catches` table | `src/server/db/schema.ts::pomodoro_cycles` | Drizzle sqliteTable syntax; foreign keys; timestamps; indexes for perf |
| `pokemonCatchSchema` | `src/shared/schemas/pomodoroCycle.ts` | Zod schema pattern; single source of truth for wire contract; used by server + client |

---

### Contracts

**Type Definitions**

```typescript
// src/shared/types/pokemon.ts
interface PokemonSpecies {
  id: number;           // 1–151
  name: string;         // "Pikachu"
  spriteUrl: string;    // "https://..."
  rarity: 'rare' | 'uncommon' | 'common';
}

interface CaughtPokemon {
  speciesId: number;    // 1–151
  caughtAt: string;     // ISO8601 timestamp
}
```

**Zod Schemas**

```typescript
// src/shared/schemas/pokemonCatch.ts
const caughtPokemonSchema = z.object({
  speciesId: z.number().min(1).max(151),
  caughtAt: z.string().datetime(),
});

type CaughtPokemon = z.infer<typeof caughtPokemonSchema>;
```

**API Function Signatures**

```typescript
// src/client/api.ts
function postCycle(payload: CyclePayload): Promise<CaughtPokemon | null>
// Returns: CaughtPokemon if ok=true and response parsed successfully; null on error or non-OK response

function getPokemonCatches(): Promise<Array<{
  speciesId: number;
  count: number;
  lastCaughtAt: string;  // ISO8601
}>>
// Returns: Grouped catches sorted by speciesId; empty array if user unauthenticated or no catches
```

**Server Handler Signatures**

```typescript
// src/server/pokemon/rollCatch.ts
function rollCatch(phase: Phase): PokemonSpecies
// phase: 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK'
// Returns: PokemonSpecies with rarity weighted by phase
// Timing: < 50ms (synchronous)
// Side effects: None (pure function; uses Math.random or injected PRNG)

// src/server/api/cycles.ts (modified)
// Before: { ok: true }
// After:  { ok: true, catch?: { speciesId: number, caughtAt: string } } (on success)
//         { ok: false, error: string } (on error)

// src/server/api/pokemonCatches.ts (new)
// GET /api/pokemon-catches (session-checked)
// Response: Array<{ speciesId: number, count: number, lastCaughtAt: string }> (sorted by speciesId)
```

**HTTP Status Codes & Response Shapes**

| Endpoint | Status | Response Body | Client Action |
|----------|--------|---------------|---------------|
| **POST /api/cycles** | 200 OK | `{ ok: true, catch: { speciesId, caughtAt } }` | Parse catch, update useCatchReveal, render modal |
| | 401 Unauthorized | `{ ok: false, error: "..." }` | Detect auth failure, setShowLoginNudge(true) |
| | 400 Bad Request | `{ ok: false, error: "..." }` | Show error modal "Couldn't catch it", user retries |
| | 409 Conflict | `{ ok: false, error: "Duplicate catch for cycle" }` | Idempotency conflict; show error, user retries next phase |
| | 500 Internal Error | `{ ok: false, error: "..." }` | Transactional failure; show error, user retries |
| **GET /api/pokemon-catches** | 200 OK | `[{ speciesId, count, lastCaughtAt }, ...]` | Join with pokemonSpecies, render grid |
| | 401 Unauthorized | `null` or `{ error: "..." }` | User not authenticated; show empty state + sign-in button |
| | 500 Internal Error | `{ error: "..." }` | Query failed; show error message, user can refresh |

**Database Schema**

```typescript
// src/server/db/schema.ts
pokemon_catches table:
  - id: TEXT PRIMARY KEY (UUID)
  - userId: TEXT NOT NULL (foreign key → users.id)
  - cycleId: TEXT NOT NULL UNIQUE (foreign key → pomodoro_cycles.id; enforces single catch per cycle)
  - speciesId: INTEGER NOT NULL (range 1–151)
  - caughtAt: INTEGER NOT NULL (Unix timestamp, milliseconds)

Indexes:
  - (userId) — for querying user's catches efficiently
  - (cycleId) — enforces idempotency via UNIQUE constraint

Constraints:
  - cycleId UNIQUE — prevents duplicate catch on retry
  - cycleId FOREIGN KEY — ensures cycle exists before catch can be recorded
```

---

## Implementation Process

**CRITICAL EXECUTION DIRECTIVE**: You MUST launch a separate agent for each step listed below using the Agent tool. For steps marked as parallel (Phase 0 and Phase 4), you MUST launch separate agents in parallel, all at the same time in a single Agent tool call block. Do not launch agents sequentially for parallel groups.

### Parallelization Overview

The implementation is organized into 5 phases with 2 parallel opportunities:

```
Phase 0 (PARALLEL, width 3) — Verification + Foundation
├─ Spike-A: Verify PokeAPI Gen 1 structure
├─ Spike-B: Verify SQLite UNIQUE constraint handling  
└─ Step 1: Types, schemas, DB schema

    ↓ (all 3 must complete)

Phase 1 (SEQUENTIAL) — Data Generation
├─ Step 2: Generate Pokemon species data
└─ Step 3: Implement rollCatch pure function

    ↓

Phase 2 (SEQUENTIAL) — Server APIs
├─ Step 4: Extend cycles API with atomic catch recording
└─ Step 5: Collection retrieval endpoint

    ↓

Phase 3 (SEQUENTIAL) — Client Integration
├─ Step 6: Update client API module
└─ Step 7: Implement catch reveal state management

    ↓

Phase 4 (PARALLEL, width 2) — UI Components
├─ Step 8: Implement CatchReveal modal
└─ Step 9: Implement Collection components

    ↓

Phase 5 (SEQUENTIAL) — Final Integration
└─ Step 10: Wire view toggle, E2E testing, and coverage config
```

**Parallel Execution Instructions:**
- **Phase 0**: Launch Spike-A, Spike-B, and Step 1 agents simultaneously (all 3 in one Agent call)
- **Phase 4**: Launch Step 8 and Step 9 agents simultaneously (both in one Agent call)
- **All Other Phases**: Launch steps sequentially; each step starts after its dependencies complete

### Implementation Strategy

**Approach**: Bottom-Up with parallel foundation tasks and UI layer, sequential server-to-client layers

**Rationale**: 
- Phase 0 (types, schemas, database, research) has zero inter-dependencies; execute in parallel (width 3)
- Phase 1-3 form sequential chain: data → server APIs → client adapters → state management
- Phase 4 (UI components) can parallelize because both depend on same prerequisite (Phase 3)
- Phase 5 final integration depends on all components being complete
- This ordering ensures database and API contracts are concrete before client code begins

### Phase Overview

```
Pre-Implementation: Spike Tasks (can run in parallel)
    ├─ Spike-A: Verify PokeAPI Gen 1 structure (2-4 hours)
    └─ Spike-B: Verify SQLite UNIQUE error handling (2-4 hours)
    
    ↓ (wait for both spikes to complete)
    
Phase 1: Setup (L0 + L1) — Parallel foundation
    ├─ Step 1: Types, schemas, DB schema
    ├─ Step 2: Generate Pokemon species data (after Spike-A)
    └─ Step 3: Implement rollCatch pure function
    
    ↓ (wait for all L0, L1 to complete)
    
Phase 2: Server APIs (L2) — Sequential server
    ├─ Step 4: Extend cycles API with atomic catch recording (after Spike-B)
    └─ Step 5: Collection retrieval endpoint + route wiring
    
    ↓ (wait for L2)
    
Phase 3: Client Integration (L3 + L4) — Sequential client layers
    ├─ Step 6: Update client API module
    └─ Step 7: Implement catch reveal state management
    
    ↓ (wait for L4)
    
Phase 4: UI Components (L5) — Parallel components
    ├─ Step 8: Implement CatchReveal modal
    └─ Step 9: Implement Collection components
    
    ↓ (wait for L5)
    
Phase 5: Integration + Polish (L6) — Final integration
    └─ Step 10: Wire view toggle + end-to-end testing + update bunfig.toml
```

---

## Task Breakdown: 10 Implementation Steps + 2 Spike Tasks

---

## Phase 0: Verification + Foundation (PARALLEL, width 3)

### Spike-A: Verify PokeAPI Gen 1 endpoint structure and rate-limit behavior [DONE]

**Model:** general-purpose  
**Agent:** general-purpose  
**Depends on:** None  
**Parallel with:** Spike-B, Step 1  

**Goal**: Test actual PokeAPI endpoints before writing full data generation script; verify response shapes, rate-limiting behavior, and timeout handling.

**Expected Output**

- Test script results documenting API response structure
- Verified rate-limit headers and retry strategy
- Documented sprite URL field location and format

**Success Criteria**

- [ ] `/pokemon-species/{id}` endpoint tested for IDs 1, 50, 151; response structure documented
- [ ] `/pokemon/{id}` endpoint tested; sprite URL field confirmed present and accessible
- [ ] Rate limit behavior tested: rapid requests confirm 429 response with Retry-After header
- [ ] 503 (service unavailable) timeout behavior tested; backoff strategy validated
- [ ] Default fetch timeout (~30s) verified; 429/503 retryable vs 401/404 not retryable confirmed
- [ ] All findings documented in commit message or code comments before Step 2 execution

**Subtasks**

- [ ] Fetch sample Pokemon from PokeAPI: IDs 1, 50, 151
- [ ] Inspect and document response JSON structure (fields, types)
- [ ] Verify sprite URLs are present and valid (non-empty strings)
- [ ] Test rate limiting: send rapid requests (10+ per second), capture 429 response
- [ ] Document Retry-After header value and exponential backoff strategy
- [ ] Test 503 handling: simulate overload, verify 503 response and timeout behavior
- [ ] Create minimal test in `scripts/testPokeAPI.ts` and run manually
- [ ] Document findings in comments for Step 2's generatePokemonSpecies.ts

**Complexity**: Small

**Uncertainty**: Medium (PokeAPI reliability and response shape not yet verified)

**Dependencies**: None (standalone verification task)

**Integration Points**: Informs Step 2's retry strategy and data parsing

**Risk**: Low — PokeAPI may have changed structure or rate limits; mitigation: test first

#### Verification

**Level:** NOT NEEDED
**Rationale:** Spike tasks are research verification; success is binary (findings documented or not). Results directly inform Step 2.

---

---

### Step 1: Set up types, schemas, and database schema [DONE]

**Model:** opus  
**Agent:** sdd:developer  
**Depends on:** None  
**Parallel with:** Spike-A, Spike-B  

**Goal**: Create foundational type definitions, Zod validation contracts, and database schema for Pokemon entities and catch records.

**Expected Output**

- `src/shared/types/pokemon.ts`: Domain types (PokemonSpecies, CaughtPokemon)
- `src/shared/schemas/pokemonCatch.ts`: Zod schemas (caughtPokemonSchema, pokemonCatchesSummarySchema)
- `src/server/db/schema.ts`: Updated with pokemon_catches table definition
- `src/server/db/migrations/`: Auto-generated Drizzle migration file
- Type checking passes: `bunx tsc --noEmit`
- Schema validation tests pass

**Success Criteria**

- [ ] File `src/shared/types/pokemon.ts` exists with PokemonSpecies interface (id, name, spriteUrl, rarity)
- [ ] File `src/shared/types/pokemon.ts` includes CaughtPokemon interface (speciesId, caughtAt)
- [ ] File `src/shared/schemas/pokemonCatch.ts` exports caughtPokemonSchema with Zod validation
- [ ] File `src/shared/schemas/pokemonCatch.ts` exports pokemonCatchesSummarySchema (array with speciesId, count, lastCaughtAt)
- [ ] Database schema includes pokemon_catches table with columns: id, userId (FK), cycleId (UNIQUE FK), speciesId, caughtAt
- [ ] Database schema includes indexes: (userId), (cycleId)
- [ ] Migration generated via `bun run db:generate` without errors
- [ ] Type checking passes: `bunx tsc --noEmit` exits 0
- [ ] Zod schema validation tests pass

**Subtasks**

- [X] Create `src/shared/types/pokemon.ts` with PokemonSpecies and CaughtPokemon interfaces
- [X] Create `src/shared/schemas/pokemonCatch.ts` with Zod schema definitions and type exports
- [X] Extend `src/server/db/schema.ts` with pokemon_catches table (Drizzle sqliteTable)
- [X] Run `bun run db:generate` to create migration in `src/server/db/migrations/`
- [X] Verify type checking: `bunx tsc --noEmit`
- [X] Write unit tests for schema validation (parse valid/invalid data)

**Complexity**: Medium

**Uncertainty**: Low (straightforward type + schema + DB definitions)

**Dependencies**: None (Level 0)

**Integration Points**: All downstream tasks use these types and schemas

**Blockers & Risks**

- Blockers: None
- Risks: Low — schema drift if downstream tasks don't re-export types consistently — Mitigation: All tasks import from single source paths (`src/shared/types/pokemon.ts`, `src/shared/schemas/pokemonCatch.ts`)

#### Verification

**Level:** ✅ Single Judge
**Artifact:** `src/shared/types/pokemon.ts`, `src/shared/schemas/pokemonCatch.ts`, `src/server/db/schema.ts` + migration
**Threshold:** 4.0/5.0

**Checklist:**

| ID | Question | Category | Importance | Rationale |
|----|----------|----------|------------|-----------|
| 1A | Does PokemonSpecies interface export with fields: id, name, spriteUrl, rarity ('rare'\|'uncommon'\|'common')? | hard_rule | essential | All components depend on exact structure; missing fields break type safety |
| 1B | Does CaughtPokemon interface export with fields: speciesId, caughtAt (ISO8601 string)? | hard_rule | essential | Required for catch response type and collection rendering |
| 1C | Are type definitions properly exported and importable by both client and server? | hard_rule | essential | Circular imports or path errors break downstream code |
| 2A | Does caughtPokemonSchema validate speciesId (1–151) and caughtAt (datetime)? | hard_rule | essential | Single source of truth for wire format; both server and client use this schema |
| 2B | Does pokemonCatchesSummarySchema validate array of { speciesId, count, lastCaughtAt }? | hard_rule | essential | Collection endpoint response must match schema for client validation |
| 2C | Are Zod validations precise (min/max for IDs, datetime format)? | hard_rule | essential | Vague schemas allow invalid data through; breaks downstream logic |
| 3A | Does pokemon_catches table define all columns: id, userId (FK), cycleId (UNIQUE FK), speciesId, caughtAt? | hard_rule | essential | Table structure controls data persistence and constraint enforcement |
| 3B | Are indexes defined for (userId) and (cycleId)? | hard_rule | essential | (userId) enables efficient queries; (cycleId) UNIQUE enforces at-most-one-catch-per-cycle |
| 3C | Has migration been generated successfully via `bun run db:generate`? | hard_rule | essential | Migration is version control artifact required for deployment |
| 3D | Does `bunx tsc --noEmit` pass with zero errors? | hard_rule | essential | Type checking ensures schema types are referenced correctly downstream |
| Build | Does `bun run build` pass with zero errors after this step? | hard_rule | essential | Build failures block downstream work |
| Lint | Does `npm run lint` (or equivalent) pass with zero new errors after this step? | hard_rule | essential | Lint violations indicate convention drift |
| TypeScript | Does the discovered type check command pass? | hard_rule | essential | Type safety ensures schema types are valid |
| Reuse | Does the implementation follow project patterns for types and schemas (compare to existing timerState.ts, pomodoroCycle.ts)? | principle | important | Consistency with codebase patterns |

**Rubric Dimensions:**

##### Correctness of Type Definitions (0.30)

Do the PokemonSpecies and CaughtPokemon interfaces precisely match the specification and enable correct downstream usage (Collection grid, catch response handling)?

**Instruction**: Verify each field present, type correct, and documentation clear. Check that types are importable without circular dependencies.

- 1: Type definitions missing critical fields (e.g., no rarity on PokemonSpecies, no caughtAt on CaughtPokemon).
- 2: Types present but rarity is string (not enum), or caughtAt type is number instead of ISO string (DEFAULT — must justify correctness).
- 3: Types match spec exactly; all fields present and correctly typed; importable without circular deps (RARE — requires code inspection).
- 4: Types + documentation (JSDoc comments) explain use cases and constraints (IDEAL).
- 5: Types + exported type inference from Zod schemas (e.g., `type CaughtPokemon = z.infer<typeof caughtPokemonSchema>`) ensuring schema and type always align (OVERLY PERFECT).

##### Zod Schema Validation Completeness (0.30)

Do the Zod schemas validate wire contract boundaries (speciesId 1–151, caughtAt datetime format, array structure for collection)?

**Instruction**: Verify min/max on numeric fields, datetime format validation, array structure for summary schema. Check that schemas catch invalid inputs (e.g., speciesId 0, 152, malformed datetime).

- 1: Schemas missing validation (any speciesId accepted, datetime not checked).
- 2: Schemas partially validated (e.g., speciesId checked but not datetime) (DEFAULT — must justify completeness).
- 3: All boundaries validated (speciesId 1–151, ISO8601 datetime, array structure correct).
- 4: Validation + test cases verify schema rejects invalid inputs.
- 5: Validation + reusable schema patterns exported for downstream use (OVERLY PERFECT).

##### Database Schema Design Quality (0.25)

Is the pokemon_catches table definition correct (columns, constraints, indexes)? Do indexes enable efficient queries and constraints maintain data integrity?

**Instruction**: Verify table has all required columns, UNIQUE constraint on cycleId, foreign keys on userId and cycleId, indexes on (userId) and (cycleId).

- 1: Table missing columns or constraints (e.g., no UNIQUE on cycleId, no indexes).
- 2: Table mostly correct but indexes incomplete (DEFAULT — must justify performance).
- 3: Table complete with all columns, UNIQUE constraint, foreign keys, and indexes (RARE).
- 4: Schema + indexes + migration file present and validated.
- 5: Schema + indexes + migration + comments explaining constraint rationale (OVERLY PERFECT).

##### Project Guidelines Alignment (0.15)

Does the implementation follow CLAUDE.md patterns for type definitions and schema organization (compare to timerState.ts, pomodoroCycle.ts)?

**Instruction**: Check that types are in `src/shared/types/`, schemas in `src/shared/schemas/`, both re-exported consistently, and project naming conventions followed.

- 1: File locations or naming deviate from project patterns.
- 2: Mostly aligned; minor deviations (DEFAULT).
- 3: Fully aligned with project patterns (RARE).
- 4: Aligned + citations to CLAUDE.md sections in code (IDEAL).
- 5: Aligned + exemplar for other feature domains (OVERLY PERFECT).

**Test Strategy**

**Applies:** true
**Artifact:** `src/shared/types/pokemon.ts`, `src/shared/schemas/pokemonCatch.ts`
**Criticality:** HIGH

**Test Matrix**

| Type | Size | Framework | Dependencies | Gate |
|------|------|-----------|--------------|------|
| unit | small | vitest | — | Gate 1 (schemas contain validation logic) |

**Test Cases to Cover**

### AC: Type Definitions Structure
- [unit] PokemonSpecies has fields: id (number 1–151), name (string), spriteUrl (string), rarity (enum 'rare'|'uncommon'|'common')
- [unit] CaughtPokemon has fields: speciesId (number 1–151), caughtAt (ISO8601 string)
- [unit] Types are importable without circular dependencies from both client and server paths

### AC: Schema Validation Boundaries
- [unit] caughtPokemonSchema validates speciesId: rejects 0 [BVA: B-1], accepts 1 [BVA: B], rejects 152 [BVA: B+1]
- [unit] caughtPokemonSchema validates caughtAt: rejects malformed datetime; accepts valid ISO8601
- [unit] pokemonCatchesSummarySchema validates array structure: rejects non-array; validates each element has speciesId, count, lastCaughtAt
- [unit] pokemonCatchesSummarySchema element validation: speciesId 1 [BVA: B] accepts, 0 [BVA: B-1] rejects, 152 [BVA: B+1] rejects; count >= 0; lastCaughtAt datetime

### AC: Schema Error Handling
- [unit] Invalid schema input returns Zod error with path and message
- [unit] schema.parse() throws on invalid input; schema.safeParse() returns { success: false, error }

---

---

## Phase 1: Data Generation (SEQUENTIAL)

### Step 2: Generate static Pokemon species data [DONE]

**Model:** opus  
**Agent:** sdd:developer  
**Depends on:** Spike-A, Step 1  
**Parallel with:** None  

**Goal**: Fetch Gen 1 Pokemon (151 species) from PokeAPI, validate against schema, and generate a committed TypeScript module as single source of truth for species data.

**Expected Output**

- `scripts/generatePokemonSpecies.ts`: One-time script with retry logic, PokeAPI integration, error handling
- `src/shared/data/pokemonSpecies.ts`: Auto-generated module exporting 151 PokemonSpecies objects
- Script output log showing all 151 species fetched successfully
- Generated pokemonSpecies.ts validated against PokemonSpeciesArraySchema

**Success Criteria**

- [ ] Script `scripts/generatePokemonSpecies.ts` exists and is executable
- [ ] Script has retry logic: exponential backoff for 429, 10s backoff for 503, single retry for 5xx
- [ ] Script implements 30s timeout per fetch with retry on timeout
- [ ] Script includes 50ms polite delay between PokeAPI requests
- [ ] Script fetches `/pokemon-species/{id}` and `/pokemon/{id}` for IDs 1–151
- [ ] Script maps to PokemonSpecies: id, name, spriteUrl, rarity (rare/uncommon/common)
- [ ] Rarity classification: legendary/mythical → rare; capture_rate ≤45 → uncommon; else → common
- [ ] Generated file `src/shared/data/pokemonSpecies.ts` contains exactly 151 entries
- [ ] All 151 species have id (1–151), name, spriteUrl, rarity (valid enum)
- [ ] Generated data validates against PokemonSpeciesArraySchema before writing
- [ ] All species have valid sprite URLs (non-empty strings)
- [ ] File includes header comment with generation timestamp and "DO NOT EDIT MANUALLY"

**Subtasks**

- [ ] Create `scripts/generatePokemonSpecies.ts` with PokeAPI fetch function
- [ ] Implement retry logic: exponential backoff, timeout, 503 handling
- [ ] Map PokeAPI response to PokemonSpecies type
- [ ] Classify rarity: legendary/mythical → rare, capture_rate ≤45 → uncommon, else → common
- [ ] Validate data against PokemonSpeciesArraySchema before writing file
- [ ] Write validated data to `src/shared/data/pokemonSpecies.ts`
- [ ] Add generated file to `.gitignore` OR commit if version-controlled
- [ ] Run script manually: `bun scripts/generatePokemonSpecies.ts`
- [ ] Write tests: data structure, count (151), ID ranges (1–151), sprite URLs present

**Complexity**: Medium

**Uncertainty**: Medium (PokeAPI reliability, retry strategy effectiveness)

**Dependencies**: Spike-A (verify API structure first), Step 1 (schemas for validation)

**Integration Points**: All components import pokemonSpecies for rendering and selection

**Blockers & Risks**

- Blockers: Spike-A must complete first (verify PokeAPI Gen 1 endpoint structure and rate-limiting behavior)
- Risks: Medium — PokeAPI rate limits (429), service unavailable (503), timeout errors — Mitigation: Spike-A verifies actual behavior; implement exponential backoff (1s → 2s → 4s) + 50ms polite delay + 30s timeout; 3 retries per request

#### Verification

**Level:** ✅✅ CRITICAL — Panel of 2 Judges with Aggregated Voting
**Artifact:** `src/shared/data/pokemonSpecies.ts` + `scripts/generatePokemonSpecies.ts`
**Threshold:** 4.0/5.0
**Rationale:** Panel(2) because data generation affects all downstream species selection, collection rendering, and distribution validation; incorrect rarity tiers or missing species cause silent failures that cascade through entire feature.

**Regular Checks:**
- [ ] Build passes: `bun run build`
- [ ] Type checking passes: `bunx tsc --noEmit`

**Checklist:**

| ID | Question | Category | Importance | Rationale |
|----|----------|----------|------------|-----------|
| 2.1 | Does generated file contain exactly 151 PokemonSpecies entries with IDs 1–151? | hard_rule | essential | Gen 1 spec requires all 151; missing or duplicate entries break grid and selection |
| 2.2 | Do all entries have valid sprite URLs (non-empty strings)? | hard_rule | essential | Step 9 renders sprites; missing URLs cause UI to break |
| 2.3 | Are rarity tiers distributed correctly (5 rare, 55 uncommon [capture_rate 20-45, verified against real PokeAPI Gen 1 data — supersedes an earlier wrong 18-28 estimate], rest common)? | hard_rule | essential | Rarity distribution affects catch probabilities; incorrect tiers break UX intent |
| 2.4 | Does generated file include 'DO NOT EDIT MANUALLY' header comment? | hard_rule | important | Prevents accidental manual modification of generated data |
| 2.5 | Has script implemented retry logic with Spike-A findings (429 backoff, 503 handling, timeouts)? | hard_rule | essential | Script robustness depends on verified API behavior from Spike-A |
| 2.6 | Does script validate data against PokemonSpeciesArraySchema before writing? | hard_rule | essential | Prevents corrupted data from being committed |
| 2.7 | Has script been manually tested: `bun scripts/generatePokemonSpecies.ts` succeeds and produces valid data? | hard_rule | important | Script must run successfully before data can be used |
| Build | Does `bun run build` pass with zero errors after this step? | hard_rule | essential | Build failures block downstream work |
| No Duplication | Is the generated pokemonSpecies.ts file the only source of truth (no duplicated data elsewhere)? | principle | important | Duplication creates divergence risk; single source of truth required |

**Rubric Dimensions:**

##### API Resilience & Retry Strategy (0.30)

Does the script implement robust retry logic that handles rate limits (429), service unavailable (503), and timeouts based on Spike-A findings?

**Instruction**: Verify script has exponential backoff (1s → 2s → 4s), 50ms polite delay between requests, 30s timeout per fetch, and 3 retries. Check that 429 responses with Retry-After header are respected.

- 1: No retry logic; script fails on first network error or rate limit.
- 2: Retry logic partial (e.g., retry on timeout but not 429) (DEFAULT — must justify completeness).
- 3: Full retry strategy implemented matching Spike-A findings (backoff, polite delay, timeout, 3 retries).
- 4: Retry logic + detailed error logging showing backoff timing and retry counts.
- 5: Retry logic + resilience patterns (Circuit breaker, fallback mode) (OVERLY PERFECT).

##### Data Integrity & Completeness (151 entries, ranges) (0.35)

Does the generated file contain exactly 151 species with valid data (IDs 1–151, non-empty URLs, correct rarity tiers)?

**Instruction**: Verify all 151 IDs present, no gaps, no duplicates. Spot-check sprite URLs are non-empty strings. Count rarity tiers: 5 rare (Articuno, Zapdos, Moltres, Mewtwo, Mew), 55 uncommon (capture_rate 20-45 against real Gen 1 data — the count is empirically 55, not the originally-estimated 18-28), rest common.

- 1: Missing species, duplicate IDs, or invalid sprite URLs.
- 2: All 151 present but rarity distribution incorrect (DEFAULT — must justify tier counts).
- 3: All 151 with correct IDs, sprite URLs, and rarity distribution (RARE).
- 4: Completeness + data validated against schema before commit.
- 5: Completeness + generated file includes hash/checksum for integrity verification (OVERLY PERFECT).

##### Script Quality & Error Handling (0.20)

Is the script clear, maintainable, and handles errors gracefully (with informative messages)?

**Instruction**: Verify script has clear comments explaining steps, error messages are informative, script can be re-run without side effects (idempotent).

- 1: Script has no comments; error messages are cryptic; re-running causes issues.
- 2: Script partially commented; errors somewhat clear (DEFAULT).
- 3: Well-commented; clear error messages; script is idempotent (can re-run safely).
- 4: Quality + progress logging (shows count of fetched species, current rate limit status).
- 5: Quality + reusable as library/utility (OVERLY PERFECT).

##### Project Guidelines Alignment (0.15)

Does the script follow project patterns (file location, naming, error handling style)?

**Instruction**: Verify script is in `scripts/`, follows project naming conventions, error handling matches codebase style.

- 1: File location wrong or naming inconsistent with project.
- 2: Mostly aligned (DEFAULT).
- 3: Fully aligned with project patterns (RARE).
- 4: Aligned + documented with usage comments.
- 5: Aligned + extraction into reusable module (OVERLY PERFECT).

**Test Strategy**

**Applies:** true
**Artifact:** `src/shared/data/pokemonSpecies.ts` + `scripts/generatePokemonSpecies.ts`
**Criticality:** MEDIUM

**Test Matrix**

| Type | Size | Framework | Dependencies | Gate |
|------|------|-----------|--------------|------|
| unit | small | vitest | — | Gate 1 (branching logic for retry handling) |

**Test Cases to Cover**

### AC: Data Completeness (151 entries)
- [unit] Generated file contains exactly 151 entries (IDs 1–151, no gaps, no duplicates) [BVA: B-1=0 invalid, B=1 min valid, B+1=2; B-1=150, B=151 max valid, B+1=152 invalid]
- [unit] All entries have required fields: id, name, spriteUrl, rarity

### AC: Rarity Distribution
- [unit] Rare tier contains exactly 5 species (Articuno, Zapdos, Moltres, Mewtwo, Mew)
- [unit] Uncommon tier contains species with capture_rate 20–45 (empirically 55 species against real Gen 1 data; supersedes an earlier wrong 18-28 estimate in this spec)
- [unit] Remaining species classified as common

### AC: Data Validation
- [unit] All sprite URLs are non-empty strings and valid format (http/https URLs)
- [unit] All species names are non-empty strings
- [unit] Generated data passes validation against PokemonSpeciesArraySchema

### AC: Script Execution
- [unit] Script runs without errors: `bun scripts/generatePokemonSpecies.ts` exits 0
- [unit] Generated file is written to correct location: `src/shared/data/pokemonSpecies.ts`

---

---

### Step 3: Implement rollCatch pure function for species selection [DONE]

**Model:** opus  
**Agent:** sdd:developer  
**Depends on:** Step 2  
**Parallel with:** None  

**Goal**: Create deterministic, testable species selection function that uses weighted tier probabilities based on phase type (FOCUS, SHORT_BREAK, LONG_BREAK).

**Expected Output**

- `src/server/pokemon/rollCatch.ts`: Pure function with injectable PRNG
- Comprehensive unit tests with seeded randomness
- Distribution validation tests (verify tier weights are respected)

**Success Criteria**

- [ ] Function `rollCatch(phase: Phase, prng?: () => number): PokemonSpecies` exists and is exported
- [ ] Default PRNG is `Math.random` (production behavior)
- [ ] Injectable PRNG parameter for deterministic tests
- [ ] FOCUS phase: 2% rare, 15% uncommon, 83% common
- [ ] SHORT_BREAK phase: 2% rare, 15% uncommon, 83% common
- [ ] LONG_BREAK phase: 10% rare, 35% uncommon, 55% common
- [ ] Selection always returns a valid PokemonSpecies (id 1–151)
- [ ] Selection completes in <50ms (measurable)
- [ ] Function uses weighted tier selection algorithm (cumulative roll)
- [ ] Weights validated: sum to 1.0 ±0.01 tolerance

**Subtasks**

- [ ] Create `src/server/pokemon/rollCatch.ts`
- [ ] Implement phaseToWeights mapping (FOCUS/SHORT_BREAK/LONG_BREAK → tier weights)
- [ ] Implement weightedRandomPick algorithm (cumulative roll, tier filtering)
- [ ] Accept optional PRNG parameter for test injection
- [ ] Validate tier weights sum to ~1.0 (tolerance ±0.01)
- [ ] Test with seeded PRNG: LONG_BREAK has 10% rare (validate via 100 rolls)
- [ ] Test with seeded PRNG: FOCUS has 2% rare (validate via 100 rolls)
- [ ] Test distribution variance (allow ±5% for randomness)
- [ ] Test: always returns species from pokemonSpecies array
- [ ] Test: all species IDs in range [1, 151]
- [ ] Benchmark: verify <50ms execution time

**Complexity**: Medium

**Uncertainty**: Low (algorithm is straightforward; PRNG testing pattern established)

**Dependencies**: Step 2 (pokemonSpecies data), Step 1 (types for validation)

**Integration Points**: Step 4 calls rollCatch from cycles API

**Testing**: Unit tests with seeded PRNG; distribution validation via statistical tests

**Blockers & Risks**

- Blockers: None (depends on prior steps)
- Risks: Medium — rarity distribution may not match specification (±5% variance tolerance) — Mitigation: Implement distribution validation tests with seeded PRNG; run 100+ rolls per phase; verify tier counts match expected percentages

#### Verification

**Level:** ✅ Single Judge
**Artifact:** `src/server/pokemon/rollCatch.ts`
**Threshold:** 4.0/5.0

**Checklist:**

| ID | Question | Category | Importance | Rationale |
|----|----------|----------|------------|-----------|
| 3.1 | Does rollCatch(phase) return species with correct tier probabilities (FOCUS: 2% rare, 15% uncommon; LONG_BREAK: 10% rare, 35% uncommon)? | hard_rule | essential | Rarity distribution is critical UX differentiator; incorrect probabilities break game balance |
| 3.2 | Does function accept optional injectable PRNG for deterministic testing? | hard_rule | essential | Tests must be deterministic; seeded PRNG enables reproducible distribution validation |
| 3.3 | Are all selected species from valid range (1–151)? | hard_rule | essential | Out-of-range species IDs break collection display and grid rendering |
| 3.4 | Does function execute in <50ms consistently (benchmark test)? | hard_rule | important | Cycles API response time depends on rollCatch performance; slow selection blocks timer reset |
| 3.5 | Are tier weights validated to sum to ~1.0 (±0.01 tolerance)? | hard_rule | important | Misaligned weights produce incorrect probabilities (e.g., 120% rare = broken logic) |
| Unit Tests | Do unit tests with seeded PRNG verify distribution (100+ rolls per phase, tier counts ±5% tolerance)? | hard_rule | essential | Tests must validate distribution accuracy, not just existence |
| No Duplication | Is the species selection algorithm distinct from any other tier-based selection in codebase? | principle | important | No copy-paste of probability logic |

**Rubric Dimensions:**

##### Rarity Distribution Accuracy (0.35)

Do the phase-specific tier probabilities match specification exactly (FOCUS/SHORT_BREAK: 2% rare, 15% uncommon, 83% common; LONG_BREAK: 10% rare, 35% uncommon, 55% common)?

**Instruction**: Verify tier weights in code. Run seeded PRNG test with 100+ rolls per phase and verify tier counts are within ±5% of expected. Example: FOCUS with 100 rolls should have rare count 1–3 (2% ± 5%).

- 1: Tier probabilities incorrect or missing for some phases.
- 2: Probabilities partially correct or off by >10% (DEFAULT — must justify accuracy).
- 3: Probabilities match spec exactly; distribution validation test passes (RARE).
- 4: Probabilities + seeded PRNG test verifies ±5% tolerance across 1000 rolls.
- 5: Probabilities + statistical testing (chi-squared test) validates distribution (OVERLY PERFECT).

##### Performance (<50ms) (0.20)

Does rollCatch execute in <50ms consistently across repeated calls?

**Instruction**: Benchmark rollCatch with 1000 calls; measure aggregate time. Should complete in ~50ms total (0.05ms per call).

- 1: Function takes >100ms per call; blocks timer updates.
- 2: Function takes 50–100ms; marginal performance (DEFAULT).
- 3: Function takes <50ms consistently; benchmark test passes (RARE).
- 4: Performance + profiling shows no allocations or hot loops.
- 5: Performance + optimized for edge cases (OVERLY PERFECT).

##### Code Quality & Testability (0.25)

Is the selection algorithm clean, easy to understand, and designed for test injection (PRNG)?

**Instruction**: Verify algorithm uses standard weighted selection pattern (cumulative roll), no magic numbers, PRNG injection is elegant.

- 1: Algorithm difficult to follow; PRNG injection awkward.
- 2: Mostly clear (DEFAULT).
- 3: Clean algorithm with elegant PRNG injection; reusable pattern (RARE).
- 4: Quality + comments explaining weighted selection logic.
- 5: Quality + extraction into reusable utility library (OVERLY PERFECT).

##### Project Guidelines Alignment (0.20)

Does the implementation follow project patterns for pure functions?

**Instruction**: Verify no side effects, deterministic output, clear naming.

- 1: Function has side effects or depends on global state.
- 2: Mostly pure (DEFAULT).
- 3: Fully pure with deterministic output and clear naming (RARE).
- 4: Pure + JSDoc with example usage.
- 5: Pure + reusable across projects (OVERLY PERFECT).

**Test Strategy**

**Applies:** true
**Artifact:** `src/server/pokemon/rollCatch.ts`
**Criticality:** MEDIUM-HIGH

**Test Matrix**

| Type | Size | Framework | Dependencies | Gate |
|------|------|-----------|--------------|------|
| unit | small | vitest | fast-check for property-based | Gate 1 (branching logic for tier selection) |

**Test Cases to Cover**

### AC: Rarity Distribution by Phase
- [unit] FOCUS phase: 100 rolls with seeded PRNG → rare count 1–3 (2% ± 5%) [BVA: 0 below range, 1 min valid, 3 max valid, 4 above range]
- [unit] SHORT_BREAK phase: 100 rolls with seeded PRNG → rare count 1–3 (2% ± 5%) [BVA: 0 below range, 1 min valid, 3 max valid, 4 above range]
- [unit] LONG_BREAK phase: 100 rolls with seeded PRNG → rare count 8–12 (10% ± 5%) [BVA: 7 below range, 8 min valid, 12 max valid, 13 above range]

### AC: Tier Classification
- [unit] Rare tier (Articuno, Zapdos, Moltres, Mewtwo, Mew) selected with LONG_BREAK more frequently than FOCUS
- [unit] Uncommon tier selected proportionally (FOCUS 15%, LONG_BREAK 35%)
- [unit] Common tier fills remaining probability

### AC: Species Range Validation
- [unit] All selected species have ID in range [1, 151] [BVA: 0 below, 1 min valid, 151 max valid, 152 above]
- [unit] All selected species exist in pokemonSpecies array

### AC: Performance
- [unit] Benchmark: 1000 calls to rollCatch complete in <50ms total

### AC: Determinism
- [unit] Seeded PRNG with same seed produces same species sequence across multiple runs
- [unit] Different seeds produce different species distributions (variance > 0)

---

---

### Spike-B: Verify Bun SQLite UNIQUE constraint error handling [DONE]

**Model:** general-purpose  
**Agent:** general-purpose  
**Depends on:** None  
**Parallel with:** Spike-A, Step 1  

**Goal**: Test actual error codes and shapes from Bun's SQLite driver on UNIQUE constraint violation; decide idempotency behavior before implementation.

**Expected Output**

- Documented error shape (code, message, properties) from Bun SQLite driver
- Test case written for chosen idempotency behavior
- Decision documented: duplicate cycleId POST returns 200 OK (idempotent) or 409 Conflict

**Success Criteria**

- [ ] Minimal test database created with UNIQUE constraint on cycleId column
- [ ] Duplicate insert attempted; actual error captured and documented
- [ ] Error shape includes: error code, error message, properties accessible in catch block
- [ ] Idempotency behavior decided: **200 OK with existing data** (idempotent, recommended for network resilience)
- [ ] Test case written verifying chosen behavior (duplicate cycleId → existing catch returned)
- [ ] Error handling code pattern established (no generic catch-all)

**Subtasks**

- [ ] Create temporary test file `testBunSQLiteUNIQUE.ts` with minimal schema
- [ ] Insert row with cycleId = "cycle-1"
- [ ] Attempt duplicate insert with same cycleId
- [ ] Capture error; log error shape (code, message, properties)
- [ ] Document findings in Spike-B results
- [ ] Decide idempotency: recommend 200 idempotent (don't surface retry as error)
- [ ] Write test case for chosen behavior before Step 4 implementation
- [ ] Clean up test file after verification

**Complexity**: Small

**Uncertainty**: High (Bun SQLite driver error codes not yet verified)

**Dependencies**: None (standalone verification task)

**Integration Points**: Informs Step 4's transaction error handling logic

**Risk**: High — UNIQUE constraint error codes vary by driver; must verify before implementation

#### Verification

**Level:** NOT NEEDED
**Rationale:** Spike task; success is binary (error shape documented and idempotency behavior decided or not). Results directly inform Step 4.

---

---

## Phase 2: Server APIs (SEQUENTIAL)

### Step 4: Extend cycles API with atomic catch recording

**Model:** opus  
**Agent:** sdd:developer  
**Depends on:** Spike-B, Step 3  
**Parallel with:** None  

**Goal**: Modify POST /api/cycles to record both a cycle and a catch in a single atomic transaction, with idempotency guarantee via UNIQUE constraint on cycleId.

**Expected Output**

- `src/server/api/cycles.ts`: Updated handler with transactional recording
- Updated response type: `{ ok: true, catch?: { speciesId, caughtAt } } | { ok: false, error }`
- Tests for transaction atomicity, idempotency, error handling

**Success Criteria**

- [ ] POST /api/cycles wraps cycle + catch insert in `db.transaction()`
- [ ] Cycle inserted first, then rollCatch called, then catch inserted
- [ ] Response includes catch data on success: `{ ok: true, catch: { speciesId: number, caughtAt: string } }`
- [ ] Response includes error message on failure: `{ ok: false, error: string }`
- [ ] UNIQUE constraint on pokemonCatches.cycleId enforces at-most-one-catch-per-cycle
- [ ] **Duplicate cycleId POST returns 200 OK with existing catch data (idempotent behavior)** — second request finds existing row, returns same catch data without creating duplicate
- [ ] Transaction rollback on any error (no orphaned cycles or catches) — **Integration test**: POST with invalid payload, assert zero rows in both tables
- [ ] Error handling: network failure, database error, UNIQUE violation — **Integration test**: mock each error type, verify error response and no orphaned records
- [ ] Timer reset (RESET dispatch) executes regardless of catch success/failure — **E2E test**: mock failing catch request, verify RESET dispatch fires, timer resets to IDLE
- [ ] Session validation still required (existing auth check)

**Subtasks**

- [ ] Modify `src/server/api/cycles.ts` handler
- [ ] Wrap cycle + catch insert in `db.transaction()`
- [ ] Call `rollCatch(phase)` inside transaction
- [ ] Insert into pokemon_catches with userId, cycleId, speciesId, caughtAt
- [ ] Update response type to include catch data
- [ ] Implement error handling: log UNIQUE violations, return 409 or existing data
- [ ] Test transaction atomicity: verify cycle + catch both inserted or both rolled back
- [ ] Test idempotency: POST same cycleId twice, verify exactly one catch row
- [ ] Test error paths: network timeout, server error, UNIQUE violation
- [ ] Test response structure: catch field present and correctly typed
- [ ] Verify existing timer reset logic is unaffected by catch failure

**Complexity**: Medium

**Uncertainty**: Medium (SQLite UNIQUE error code with Bun driver — verify actual error shape in Spike-B tests)

**Dependencies**: Spike-B (verify UNIQUE error handling first), Step 1 (schema), Step 2 (pokemonSpecies), Step 3 (rollCatch)

**Integration Points**: Client calls via POST /api/cycles; response used by useCycleRecorder hook

**Blockers & Risks**

- Blockers: Spike-B must complete first (verify Bun SQLite UNIQUE constraint error codes and decide idempotency behavior)
- Risks: High — UNIQUE constraint error codes vary by database driver; idempotency implementation depends on verified error shape — Mitigation: Spike-B verifies actual behavior; implement idempotent 200 response (query existing catch on UNIQUE violation, return existing data)

#### Verification

**Level:** ✅✅ CRITICAL — Panel of 2 Judges with Aggregated Voting
**Artifact:** `src/server/api/cycles.ts` (modified with transactional catch recording)
**Threshold:** 4.0/5.0
**Rationale:** Panel(2) because atomic transaction + UNIQUE constraint are HIGH criticality; data corruption (orphaned cycles, duplicate catches) is silent and hard to detect; two judges ensure correctness of transactional semantics and idempotency guarantees.

**Regular Checks:**
- [ ] Build passes: `bun run build`
- [ ] Type checking passes: `bunx tsc --noEmit`
- [ ] Tests pass: `bun test`

**Checklist:**

| ID | Question | Category | Importance | Rationale |
|----|----------|----------|------------|-----------|
| 4.1 | Does POST /api/cycles wrap cycle + catch insert in single db.transaction()? | hard_rule | essential | Transaction atomicity guarantees both succeed or both rollback; prevents orphaned records |
| 4.2 | Does UNIQUE constraint on cycleId prevent duplicate catches per cycle? | hard_rule | essential | Enforces at-most-one-catch-per-cycle; prevents duplicates on retry |
| 4.3 | Does response include catch data: { ok: true, catch: { speciesId, caughtAt } }? | hard_rule | essential | Client needs catch data to display modal and update collection |
| 4.4 | Does duplicate POST with same cycleId return 200 OK with existing catch (idempotent)? | hard_rule | essential | Idempotency resilience to network retries; transparent to client |
| 4.5 | Are error responses specific (400, 401, 409, 500) with clear messages? | hard_rule | important | Users need actionable error messages; generic 500s prevent debugging |
| 4.6 | Does timer reset (RESET dispatch) execute regardless of catch success/failure? | hard_rule | essential | Catch errors must not block timer functionality; user sees error but timer still resets |
| 4.7 | Integration test: POST with invalid input → zero rows in cycles OR catches (rollback verified)? | hard_rule | important | Atomicity must be tested; orphaned records indicate broken transaction |
| 4.8 | Integration test: POST same cycleId twice → exactly one row in pokemon_catches? | hard_rule | essential | Idempotency must be tested; second POST must not create duplicate |
| Build | Does `bun run build` pass? | hard_rule | essential | Build failures block downstream work |
| Tests | Do `bun test` pass including transaction atomicity and idempotency tests? | hard_rule | essential | Tests verify critical behavior |

**Rubric Dimensions:**

##### Atomicity & Transaction Design (0.25)

Does the POST /api/cycles handler wrap both cycle and catch inserts in a single db.transaction()? On error, are both rolled back together?

**Instruction**: Verify code uses db.transaction(), inserts cycle first, calls rollCatch, inserts catch. Check integration test: on error (e.g., invalid payload), both cycle and catch rows should be zero (rollback occurred).

- 1: No transaction wrapping; cycle inserted even if catch fails (orphaned records possible).
- 2: Transaction attempted but error handling incomplete; some error scenarios orphan records (DEFAULT — must justify atomicity).
- 3: Transaction wrapping correct; integration test passes verifying atomicity on rollback (RARE).
- 4: Atomicity + explicit error logging (logs which step failed, transaction rolled back).
- 5: Atomicity + recovery strategy (retry loop with exponential backoff for transient errors) (OVERLY PERFECT).

##### Idempotency via UNIQUE Constraint (0.25)

When same cycleId is POSTed twice, does the second request return existing catch data (200 OK), not duplicate or conflict?

**Instruction**: Verify cycleId UNIQUE constraint in schema. Check that duplicate POST queries database for existing catch, returns 200 OK with existing data. Verify no new row created. Integration test: POST same cycleId twice, verify exactly one row in pokemon_catches table.

- 1: No idempotency; duplicate cycleId causes 409 Conflict or 500 error (forces user to retry on next phase).
- 2: UNIQUE constraint present but error response is 409 (user sees error, must manually retry) (DEFAULT — must justify 200 idempotency choice).
- 3: UNIQUE constraint enforced; 200 OK with existing catch returned on duplicate (transparent idempotency) (RARE).
- 4: Idempotent 200 + explicit test case verifying duplicate POST behavior.
- 5: Idempotency + HTTP semantics documentation (POST normally not idempotent; unique key enables exception) (OVERLY PERFECT).

##### Error Response Quality & HTTP Status Codes (0.25)

Are error responses specific to failure reason (400 for bad input, 401 for auth, 409 for UNIQUE, 500 for server)? Do messages guide users?

**Instruction**: Verify each error condition maps to correct HTTP status. Check messages are actionable (e.g., "Couldn't catch it — try again" vs generic "Error"). Distinguish retryable (409, 500) from non-retryable (401, 400) in messages.

- 1: Generic 500 for all errors; messages unhelpful.
- 2: Some error codes correct; messages generic or unclear (DEFAULT — must justify specificity).
- 3: Correct status codes; clear messages; test case for each error path (RARE).
- 4: Error responses + distinction between retryable/non-retryable documented.
- 5: Error responses + logging (errors logged server-side, sanitized for client) (OVERLY PERFECT).

##### Query Performance & Efficiency (0.15)

Does the cycles API respond in <1s? Are lookups efficient (no N+1 queries)?

**Instruction**: Verify single species lookup (no N+1), indexes used for user query. Benchmark: 1000 cycles recorded in <1s.

- 1: No indexes; N+1 queries; response time >5s.
- 2: Partial optimization; response time 1–2s (DEFAULT).
- 3: Efficient queries; response time <1s (RARE).
- 4: Performance + query plan explained.
- 5: Performance + caching (e.g., species cache for rapid lookups) (OVERLY PERFECT).

##### Code Quality & Consistency (0.10)

Is the error handling code clear and consistent with existing POST handlers?

**Instruction**: Compare error handling to existing handlers. Verify project pattern conformance: { ok, error } envelope, auth checks, logging.

- 1: Inconsistent with project patterns.
- 2: Mostly consistent (DEFAULT).
- 3: Follows project patterns (RARE).
- 4: Pattern consistency + extracted and reusable.
- 5: Pattern consistency + exemplar (OVERLY PERFECT).

**Test Strategy**

**Applies:** true
**Artifact:** `src/server/api/cycles.ts` (modified)
**Criticality:** HIGH

**Test Matrix**

| Type | Size | Framework | Dependencies | Gate |
|------|------|-----------|--------------|------|
| unit | small | vitest | — | Gate 1 (error handling logic) |
| integration | medium | vitest + Testcontainers | SQLite via Testcontainers | Gate 2 (transaction, UNIQUE constraint) |

**Test Cases to Cover**

### AC: Transactional Atomicity
- [integration] INSERT cycle + catch → both succeed → both rows exist
- [integration] INSERT cycle → rollCatch OK → INSERT catch fails → zero rows in both tables (rollback)
- [integration] Invalid payload → zero rows in both tables

### AC: Idempotency via UNIQUE
- [integration] POST same cycleId twice → exactly one row in pokemon_catches
- [integration] Duplicate POST returns 200 OK with existing catch data (not 409)

### AC: Error Responses
- [unit] Invalid auth → 401 Unauthorized
- [unit] UNIQUE constraint violation → handled gracefully
- [unit] Server error → 500 with clear error message
- [integration] Network timeout → catch error, respond with error message

### AC: Response Structure
- [unit] Success response includes catch field: { ok: true, catch: { speciesId, caughtAt } }
- [unit] Error response includes message: { ok: false, error: string }

---

---

### Step 5: Implement collection retrieval endpoint and wire routes

**Model:** haiku  
**Agent:** sdd:developer  
**Depends on:** Step 4  
**Parallel with:** None  

**Goal**: Create GET /api/pokemon-catches endpoint that returns aggregated catch counts per species, and wire it in server router.

**Expected Output**

- `src/server/api/pokemonCatches.ts`: New GET endpoint with grouping logic
- `src/server/index.ts`: Updated route table with GET /api/pokemon-catches
- Integration tests for grouping, per-user isolation, sorting

**Success Criteria**

- [ ] GET /api/pokemon-catches endpoint exists and is session-checked
- [ ] Query groups catches by speciesId using Drizzle `groupBy()` and aggregate functions
- [ ] Response includes: speciesId, count (number of catches), lastCaughtAt (ISO8601)
- [ ] Response sorted by speciesId ascending (1–151 order)
- [ ] Unauthenticated requests return 401 Unauthorized
- [ ] Per-user isolation: user A's catches don't appear in user B's results
- [ ] Empty collection: user with no catches returns empty array `[]`
- [ ] Performance: query completes in <1s (with index on userId)

**Subtasks**

- [ ] Create `src/server/api/pokemonCatches.ts`
- [ ] Implement session-checked handler (check authorization)
- [ ] Query: `SELECT speciesId, COUNT(*) as count, MAX(caughtAt) as lastCaughtAt FROM pokemon_catches WHERE userId = ? GROUP BY speciesId`
- [ ] Validate response against pokemonCatchesSummarySchema
- [ ] Sort by speciesId
- [ ] Add route to `src/server/index.ts`: `GET /api/pokemon-catches`
- [ ] Test grouping: create 3 catches of speciesId 1, 1 of speciesId 2, verify count=3 and count=1
- [ ] Test per-user isolation: two users, verify separate results
- [ ] Test empty collection: user with no catches returns []
- [ ] Test unauthenticated: GET without session returns 401
- [ ] Test sorting: results ordered by speciesId ascending

**Complexity**: Small

**Uncertainty**: Low (straightforward aggregation query)

**Dependencies**: Step 1 (schema), Step 4 (cycles endpoint populates data)

**Integration Points**: Client calls via GET /api/pokemon-catches; data used by Collection component

**Blockers & Risks**

- Blockers: Step 4 must complete first (populate pokemon_catches table with data)
- Risks: Low — aggregation query performance on large collection — Mitigation: Database index on (userId); test with 1000+ rows to verify <1s query time

#### Verification

**Level:** ✅ Single Judge
**Artifact:** `src/server/api/pokemonCatches.ts`
**Threshold:** 4.0/5.0

**Checklist:**

| ID | Question | Category | Importance | Rationale |
|----|----------|----------|------------|-----------|
| 5.1 | Does GET /api/pokemon-catches return array grouped by speciesId with { speciesId, count, lastCaughtAt }? | hard_rule | essential | Client needs aggregated data to render collection grid with counts |
| 5.2 | Are results sorted by speciesId ascending (1–151 order)? | hard_rule | essential | Collection grid expects 1–151 order; unsorted results break UI layout |
| 5.3 | Is per-user isolation enforced (WHERE userId = ?)? | hard_rule | essential | User A must never see User B's catches; security issue if not isolated |
| 5.4 | Does unauthenticated request return 401 Unauthorized? | hard_rule | essential | Guests should not access endpoint; 401 triggers sign-in prompt |
| 5.5 | Does empty collection return [] (not null or error)? | hard_rule | important | Client handles empty array naturally; null causes error handling |
| 5.6 | Is GROUP BY speciesId used to aggregate multiple catches? | hard_rule | essential | Aggregation is core feature; missing GROUP BY returns raw rows |
| 5.7 | Does query complete in <1s with index on (userId)? | hard_rule | important | Performance affects UX; slow queries cause lag |

**Rubric Dimensions:**

##### Query Correctness & Grouping Logic (Weight: 0.30)

Does the query correctly GROUP BY speciesId and aggregate counts, with proper sorting and per-user filtering?

- 1: Query missing GROUP BY or filtering; returns raw rows without aggregation.
- 2: Query mostly correct but aggregation or sorting incomplete (DEFAULT).
- 3: Query correct: GROUP BY speciesId, COUNT(*), MAX(caughtAt), WHERE userId, ORDER BY speciesId (RARE).
- 4: Query + test case verifies grouping accuracy (3 catches species 1 → count=3).
- 5: Query + index analysis and optimization (OVERLY PERFECT).

##### Security & Per-User Isolation (Weight: 0.25)

Is per-user isolation enforced correctly? Do unauthenticated requests return 401?

- 1: No isolation; users see each other's catches.
- 2: Isolation partial (DEFAULT).
- 3: Full isolation with 401 for unauthenticated (RARE).
- 4: Isolation + session validation test.
- 5: Isolation + audit logging (OVERLY PERFECT).

##### Response Format Consistency (Weight: 0.20)

Is response format consistent (always sorted, always grouped, always array)?

- 1: Response format varies (sometimes object, sometimes array; sorting inconsistent).
- 2: Format mostly consistent (DEFAULT).
- 3: Format always consistent (RARE).
- 4: Format + schema validation.
- 5: Format + OpenAPI spec (OVERLY PERFECT).

##### Performance (<1s) (Weight: 0.15)

Does query complete <1s with index on (userId)?

- 1: Query >5s; no index.
- 2: Query 1–2s; partial index (DEFAULT).
- 3: Query <1s with index (RARE).
- 4: Performance + benchmark test.
- 5: Performance + caching (OVERLY PERFECT).

##### Project Guidelines Alignment (Weight: 0.10)

- 1: Deviates from project patterns.
- 2: Mostly aligned (DEFAULT).
- 3: Fully aligned (RARE).
- 4: Aligned + comments.
- 5: Aligned + exemplar (OVERLY PERFECT).

**Test Strategy**

**Applies:** true
**Artifact:** `src/server/api/pokemonCatches.ts`
**Criticality:** MEDIUM

**Test Matrix**

| Type | Size | Framework | Dependencies | Gate |
|------|------|-----------|--------------|------|
| unit | small | vitest | — | Gate 1 (no logic, declarative query) |
| integration | medium | vitest + Testcontainers | SQLite via Testcontainers | Gate 2 (GROUP BY, per-user isolation) |

**Test Cases to Cover**

### AC: Grouping & Aggregation
- [integration] Three catches of species 1 → count = 3
- [integration] Catches across species 1, 2, 3 → three rows in response
- [integration] User with no catches → empty array

### AC: Per-User Isolation
- [integration] User A catches species 1; User B sees empty collection
- [integration] User A catches species 1, 2; User B catches species 1 → User A sees 2 rows, User B sees 1 row

### AC: Response Format
- [integration] Results sorted by speciesId ascending (1, 2, 3,...)
- [integration] Response includes speciesId, count, lastCaughtAt (timestamp)

### AC: Authentication & Authorization
- [unit] Unauthenticated request returns 401
- [integration] Session-checked: missing session returns 401

---

---

## Phase 3: Client Integration (SEQUENTIAL)

### Step 6: Update client API module

**Model:** haiku  
**Agent:** sdd:developer  
**Depends on:** Step 5  
**Parallel with:** None  

**Goal**: Extend client/api.ts with updated postCycle return type and new getPokemonCatches function.

**Expected Output**

- `src/client/api.ts`: Updated postCycle and new getPokemonCatches function
- Unit tests for API calls and response validation

**Success Criteria**

- [ ] postCycle now returns `Promise<CaughtPokemon | null>` (was just cycle response)
- [ ] postCycle response includes catch data: `{ speciesId: number, caughtAt: string }`
- [ ] getPokemonCatches function exported and returns `Promise<Array<{ speciesId, count, lastCaughtAt }> | null>`
- [ ] getPokemonCatches includes credentials: 'include' for session cookie
- [ ] getPokemonCatches validates response against pokemonCatchesSummarySchema
- [ ] Error handling: both functions return null on fetch failure
- [ ] Error logging: errors logged to console (no exceptions thrown)
- [ ] Schema validation: responses parsed and validated before returning

**Subtasks**

- [ ] Modify `postCycle()` in `src/client/api.ts`
- [ ] Update return type to `Promise<CaughtPokemon | null>`
- [ ] Extract catch data from response body
- [ ] Add `getPokemonCatches()` function
- [ ] Implement GET /api/pokemon-catches with credentials: 'include'
- [ ] Validate response against pokemonCatchesSummarySchema
- [ ] Implement error handling: return null on failure
- [ ] Test postCycle: mock fetch, verify catch data in response
- [ ] Test getPokemonCatches: mock fetch, verify response parsing
- [ ] Test error handling: mock failed fetch, verify null return

**Complexity**: Small

**Uncertainty**: Low (wrapper functions over existing patterns)

**Dependencies**: Step 4 (cycles endpoint), Step 5 (pokemon-catches endpoint)

**Integration Points**: Hooks call these functions (useCycleRecorder, Collection component)

**Blockers & Risks**

- Blockers: None (depends on prior steps)
- Risks: Low — response validation (Zod parsing) may fail on unexpected API shape — Mitigation: Schemas defined in Step 1; both server and client use same schemas

#### Verification

**Level:** ✅ Single Judge
**Artifact:** `src/client/api.ts` (postCycle and getPokemonCatches functions)
**Threshold:** 4.0/5.0

**Checklist:**

| ID | Question | Category | Importance |
|----|----------|----------|------------|
| 6.1 | Does postCycle() return Promise<CaughtPokemon \| null>? | hard_rule | essential |
| 6.2 | Does getPokemonCatches() validate response against pokemonCatchesSummarySchema? | hard_rule | essential |
| 6.3 | Do both functions return null on error (no exceptions thrown)? | hard_rule | important |
| 6.4 | Does getPokemonCatches() include credentials: 'include' for session cookie? | hard_rule | essential |
| 6.5 | Are error messages logged to console for debugging? | hard_rule | important |

**Rubric Dimensions:**

##### Response Validation & Type Safety (0.30)
- 1: postCycle or getPokemonCatches returns wrong type or missing validation
- 2: Functions mostly correct; schema validation partial (DEFAULT)
- 3: Both functions return correct types; schema validation complete
- 4: Types + schema validation test cases
- 5: Types + full error recovery (OVERLY PERFECT)

##### Error Handling Consistency (0.25)
- 1: Functions throw exceptions on error
- 2: Error handling partial; inconsistent null return (DEFAULT)
- 3: Both functions return null on error; logging present
- 4: Error handling + test cases
- 5: Error handling + retry helpers (OVERLY PERFECT)

##### Code Quality (0.20)
- 1: Duplicated fetch logic or inconsistent patterns
- 2: Mostly consistent; minor deviation (DEFAULT)
- 3: Follows project patterns (follows existing getMe, getTimerState)
- 4: Pattern consistency + documented
- 5: Exemplar (OVERLY PERFECT)

##### Debugging & Logging (0.15)
- 1: No logging; errors silent
- 2: Partial logging (DEFAULT)
- 3: Errors logged to console
- 4: Logging + structured error info
- 5: Logging + tracing (OVERLY PERFECT)

##### Project Guidelines Alignment (0.10)
- 1: Deviates from project patterns
- 2: Mostly aligned (DEFAULT)
- 3: Fully aligned
- 4: Aligned + documented
- 5: Exemplar (OVERLY PERFECT)

**Test Strategy**

**Applies:** true
**Artifact:** `src/client/api.ts` (postCycle and getPokemonCatches)
**Criticality:** MEDIUM

**Test Matrix**

| Type | Size | Framework | Dependencies | Gate |
|------|------|-----------|--------------|------|
| unit | small | vitest + msw | msw (mock service worker) | Gate 1 (no logic, adapters only) |

**Test Cases to Cover**

### AC: postCycle Return Type
- [unit] postCycle success → returns CaughtPokemon with speciesId and caughtAt
- [unit] postCycle error (401, 400, 500) → returns null

### AC: getPokemonCatches Return Type
- [unit] getPokemonCatches success → returns array of { speciesId, count, lastCaughtAt }
- [unit] getPokemonCatches unauthenticated → returns null
- [unit] getPokemonCatches error → returns null

### AC: Schema Validation
- [unit] postCycle validates response against caughtPokemonSchema
- [unit] getPokemonCatches validates response against pokemonCatchesSummarySchema

### AC: Error Handling
- [unit] Network error → returns null, logs error
- [unit] Invalid JSON response → returns null, logs error

---

---

### Step 7: Implement catch reveal state management hooks and integrate into TimerContext

**Model:** opus  
**Agent:** sdd:developer  
**Depends on:** Step 6  
**Parallel with:** None  

**Goal**: Create useCatchReveal hook for modal state, update useCycleRecorder to handle catch responses, and compose into TimerContext as 5th hook.

**Expected Output**

- `src/client/features/timer/TimerContext/useCatchReveal.ts`: New state management hook
- `src/client/features/timer/TimerContext/useCycleRecorder.ts`: Updated to handle catch responses
- `src/client/features/timer/TimerContext/TimerContext.tsx`: Composed hook, export catch state
- Hook tests and integration tests

**Success Criteria**

- [ ] useCatchReveal hook manages state: caughtPokemon, showLoginNudge, error
- [ ] useCatchReveal returns: { caughtPokemon, showLoginNudge, error, setCaughtPokemon, setShowLoginNudge, setError, dismiss }
- [ ] useCycleRecorder calls postCycle and handles response
- [ ] useCycleRecorder calls setCaughtPokemon on catch success
- [ ] useCycleRecorder calls setShowLoginNudge on guest (auth.status !== 'authenticated')
- [ ] useCycleRecorder handles errors: calls setError, timer still resets
- [ ] TimerContextProvider composes useCatchReveal (5th hook alongside 4 existing)
- [ ] TimerContext exports catch state via context (caughtPokemon, showLoginNudge, error, etc.)
- [ ] useTimerContext hook includes catch state in return object
- [ ] Timer reset (RESET dispatch) executes regardless of catch success/failure
- [ ] Modal state cleared after dismiss

**Subtasks**

- [ ] Create `src/client/features/timer/TimerContext/useCatchReveal.ts`
- [ ] Implement state: useState for caughtPokemon, showLoginNudge, error
- [ ] Export setters and dismiss callback
- [ ] Modify `src/client/features/timer/TimerContext/useCycleRecorder.ts`
- [ ] Call postCycle and extract catch data
- [ ] On success: setCaughtPokemon(catch)
- [ ] On 401 (guest): setShowLoginNudge(true)
- [ ] On error: setError(error message), dispatch RESET
- [ ] Modify `src/client/features/timer/TimerContext/TimerContext.tsx`
- [ ] Compose useCatchReveal hook in provider
- [ ] Export catch state in context value
- [ ] Update TimerContext type to include catch fields
- [ ] Test hook: state transitions (null → pokemon → null)
- [ ] Test hook: dismiss clears all modal states
- [ ] Test integration: useCycleRecorder calls setCaughtPokemon
- [ ] Test guest flow: auth.status !== 'authenticated' → setShowLoginNudge

**Complexity**: Medium

**Uncertainty**: Low (follows existing hook patterns)

**Dependencies**: Step 6 (API functions exist)

**Integration Points**: Step 8 (CatchReveal uses this state), Step 9 (Collection uses this state)

**Blockers & Risks**

- Blockers: None (depends on prior steps)
- Risks: Low — state synchronization across TimerContext and UI components — Mitigation: Compose hooks in provider; export state via context; test state updates flow correctly through dispatch callbacks

#### Verification

**Level:** ✅ Single Judge
**Artifact:** `src/client/features/timer/TimerContext/useCatchReveal.ts`, `useCycleRecorder.ts` (updated), `TimerContext.tsx` (composition)
**Threshold:** 4.0/5.0

**Checklist (Summary):**

| Hook | Essential Checks | Importance |
|------|-----------------|------------|
| useCatchReveal | Exports state (caughtPokemon, showLoginNudge, error) and callbacks (setCaughtPokemon, dismiss) | essential |
| useCycleRecorder | Calls postCycle, extracts catch, calls setCaughtPokemon on success | essential |
| TimerContext | Composes useCatchReveal, exports state via context value, useTimerContext includes catch state | essential |

**Rubric (Per Item):**

- **Item A (useCatchReveal)**: Hook Composition (0.30) | State Initialization Safety (0.25) | Callback Clarity (0.25) | Project Guidelines (0.10)
  - Score 3: State and callbacks exported correctly; dismiss clears all; initial state safe
  - Score 4: All + test cases for each callback
  - Score 5: All + effect optimization (prevent stale closures)

- **Item B (useCycleRecorder Updated)**: API Integration (0.30) | Error Handling in Effects (0.25) | State Updates (0.25) | Project Guidelines (0.10)
  - Score 3: Calls postCycle correctly; extracts catch; setCaughtPokemon on success; setError on failure; RESET always dispatches
  - Score 4: All + guest flow handling (401 → setShowLoginNudge)
  - Score 5: All + advanced error recovery

- **Item C (TimerContext Composition)**: Hook Composition (0.35) | State Export (0.25) | Effect Dependencies (0.20) | Project Guidelines (0.10)
  - Score 3: Composes useCatchReveal; exports catch state in context; useTimerContext includes state
  - Score 4: All + clear documentation of hook ordering
  - Score 5: All + pattern exemplar

**Test Strategy**

**Applies:** true
**Artifact:** `src/client/features/timer/TimerContext/` hooks
**Criticality:** MEDIUM-HIGH

**Test Matrix**

| Type | Size | Framework | Dependencies | Gate |
|------|------|-----------|--------------|------|
| unit | small | vitest | happy-dom | Gate 1 (hooks contain state logic) |

**Test Cases to Cover**

### AC: useCatchReveal State Management
- [unit] Hook initializes with caughtPokemon = null, showLoginNudge = false, error = null
- [unit] setCaughtPokemon updates state; dismiss sets all to null
- [unit] setShowLoginNudge toggles showLoginNudge; dismiss clears it

### AC: useCycleRecorder Integration
- [unit] On postCycle success → calls setCaughtPokemon with catch data
- [unit] On 401 (guest) → calls setShowLoginNudge(true)
- [unit] On error → calls setError, but RESET dispatch still fires

### AC: TimerContext Composition
- [unit] useCatchReveal hook is composed into TimerContextProvider
- [unit] Catch state exported via TimerContext value object
- [unit] useTimerContext returns catch state (caughtPokemon, showLoginNudge, error, setCaughtPokemon, dismiss)

---

---

## Phase 4: UI Components (PARALLEL, width 2)

### Step 8: Implement CatchReveal modal component

**Model:** opus  
**Agent:** sdd:developer  
**Depends on:** Step 7  
**Parallel with:** Step 9  

**Goal**: Create modal dialog that displays caught Pokémon with success/error/login-nudge states, keyboard accessible (ESC to dismiss), 100% test coverage.

**Expected Output**

- `src/client/features/pokemon/components/CatchReveal/CatchReveal.tsx`: Modal component
- `src/client/features/pokemon/components/CatchReveal/CatchReveal.test.tsx`: 100% coverage tests
- Component tests for all states, keyboard accessibility, dismissal

**Success Criteria**

- [ ] Component renders native `<dialog open>` element with role="dialog"
- [ ] Three states: caught (sprite + name + rarity), login-nudge (sign-in message), error (error message)
- [ ] Caught state displays: sprite image, Pokemon name, rarity badge, "Got it!" button
- [ ] Login nudge state displays: "Sign in to catch Pokemon" message, sign-in button
- [ ] Error state displays: "Couldn't catch it" message, error details, "Try again" button
- [ ] ESC key dismisses modal and calls onDismiss callback
- [ ] Button click dismisses modal
- [ ] Dialog `open` attribute set based on whether modal should be visible
- [ ] Focus trap: focus stays within dialog (native `<dialog>` behavior)
- [ ] Keyboard accessible: all buttons focusable, ESC functional
- [ ] Tests: render caught state, render login nudge, render error, ESC key, button click
- [ ] 100% statement/branch/function coverage

**Subtasks**

- [ ] Create `src/client/features/pokemon/components/CatchReveal/CatchReveal.tsx`
- [ ] Use native `<dialog open>` element
- [ ] Implement three content sub-components: CaughtContent, LoginNudgeContent, ErrorContent
- [ ] CaughtContent: render species sprite, name, rarity from pokemonSpecies lookup
- [ ] LoginNudgeContent: sign-in button (navigate to auth or emit event)
- [ ] ErrorContent: display error message from props
- [ ] Use useEffect to manage dialog.showModal() / dialog.close() based on state
- [ ] Handle ESC key: onKeyDown handler to call onDismiss
- [ ] Style with Tailwind 4 (backdrop, centered, responsive)
- [ ] Create `src/client/features/pokemon/components/CatchReveal/CatchReveal.test.tsx`
- [ ] Test: render with caughtPokemon prop, verify sprite/name displayed
- [ ] Test: render with showLoginNudge, verify sign-in message
- [ ] Test: render with networkError, verify error message
- [ ] Test: ESC key press dismisses modal, calls onDismiss
- [ ] Test: button click dismisses modal
- [ ] Test: dialog open attribute toggled based on state
- [ ] Verify 100% coverage (all branches, all states)

**Complexity**: Medium

**Uncertainty**: Low (dialog pattern established in TimerSettings)

**Dependencies**: Step 7 (hook state management)

**Integration Points**: App.tsx renders this component, receives state from TimerContext

**Testing**: Component tests with @testing-library/react; keyboard interaction tests; 100% coverage required

**Blockers & Risks**

- Blockers: None (depends on prior steps)
- Risks: Low — native `<dialog>` element behavior varies by browser; ESC key trap may fail — Mitigation: Test native `<dialog>` element ESC key and focus trap explicitly; verify browser compatibility

#### Verification

**Level:** ✅✅ CRITICAL — Panel of 2 Judges with Aggregated Voting
**Artifact:** `src/client/features/pokemon/components/CatchReveal/CatchReveal.tsx`
**Threshold:** 4.0/5.0
**Rationale:** Panel(2) because accessibility (ESC key, focus trap, dialog semantics) and state management (3 states: caught/login/error) are critical UX guarantees; subtle bugs in dialog behavior are hard to detect manually; two judges ensure keyboard navigation and state transitions work correctly.

**Regular Checks:**
- [ ] Build passes: `bun run build`
- [ ] Type checking passes: `bunx tsc --noEmit`
- [ ] Tests pass: `bun test`

**Checklist (Summary):**

| Check | Category | Importance |
|-------|----------|------------|
| Renders native `<dialog open>` element with role="dialog" | hard_rule | essential |
| Three states implemented: caught (sprite/name), login nudge (sign-in), error (message) | hard_rule | essential |
| ESC key dismisses modal via onKeyDown handler | hard_rule | essential |
| Dialog open attribute controlled by state (toggle visibility) | hard_rule | essential |
| All interactive elements keyboard focusable (buttons) | hard_rule | essential |
| 100% statement/branch/function coverage via component tests | hard_rule | essential |

**Rubric Dimensions:**

##### Accessibility & Keyboard Navigation (0.30)

Native `<dialog>` element, ESC key dismissal, focus trap, ARIA roles, all buttons keyboard-focusable.

**Instruction**: Verify `<dialog>` element with `role="dialog"`, ESC key handler in `onKeyDown`, focus management on open. Check all interactive elements are focusable (buttons visible in tab order).

- 1: No native `<dialog>` element, ESC doesn't work, buttons not focusable, no ARIA roles.
- 2: Dialog element present but ESC handler incomplete or focus management missing (DEFAULT).
- 3: Dialog element correct, ESC works, all interactive elements focusable (RARE).
- 4: All + focus moves to first button on open, focus returns to trigger on close.
- 5: All + focus trap prevents tab-out, full WCAG 2.1 AA compliance (OVERLY PERFECT).

##### State Clarity & Visual Design (0.25)

Three states (caught/login/error) are visually distinct and convey user intent clearly.

**Instruction**: Verify caught state shows sprite/name/rarity; login state has sign-in button; error state has error message. Check states use distinct colors/typography/icons.

- 1: States not visually distinct; user cannot tell caught from error.
- 2: States mostly distinct but labeling or icons unclear (DEFAULT).
- 3: All three states render correctly and clearly; user intent unmistakable (RARE).
- 4: All + smooth CSS transitions between states.
- 5: All + micro-interactions (hover effects, animations) (OVERLY PERFECT).

##### Dialog Implementation Quality (0.20)

Proper `<dialog>` element usage, correct lifecycle management, `showModal()`/`close()` semantics.

**Instruction**: Verify `<dialog open>` attribute controls visibility, `useRef` manages dialog lifecycle, no imperative calls in render.

- 1: Dialog not implemented; div used instead; no lifecycle management.
- 2: Dialog element present but lifecycle management incomplete or useEffect dependencies wrong (DEFAULT).
- 3: Dialog element used correctly; open attribute controls visibility; useEffect properly manages lifecycle (RARE).
- 4: All + comments explaining showModal() vs show() choice.
- 5: All + custom hook extracted for reusable dialog pattern (OVERLY PERFECT).

##### Test Coverage & Quality (0.15)

100% statement/branch/function coverage, all states tested, all interactions tested.

**Instruction**: Verify tests render all 3 states, test ESC key dismissal, test button click dismissal, test focus management. Check coverage report shows 100% on CatchReveal component.

- 1: No tests or coverage <50%; states not tested.
- 2: Partial tests (1-2 states covered, ESC or button click missing); coverage 50-80% (DEFAULT).
- 3: All three states render, ESC dismisses, button click dismisses, coverage >= 95% (RARE).
- 4: All + accessibility tests for focus management and keyboard navigation.
- 5: All + property-based tests for state transitions (OVERLY PERFECT).

##### Project Guidelines Alignment (0.10)

Follows existing component patterns (compare to TimerSettings dialog pattern).

**Instruction**: Verify file location `src/client/features/pokemon/components/CatchReveal/`, naming convention (PascalCase component, .test.tsx tests), useRef pattern matches existing codebase.

- 1: File location or naming inconsistent with project.
- 2: Mostly aligned with minor deviations (DEFAULT).
- 3: Fully aligned with project patterns; follows TimerSettings dialog example (RARE).
- 4: All + JSDoc comments explaining component props and states.
- 5: All + exemplar for other modal components in codebase (OVERLY PERFECT).

**Test Strategy**

**Applies:** true
**Artifact:** `src/client/features/pokemon/components/CatchReveal/CatchReveal.tsx`
**Criticality:** MEDIUM-HIGH

**Test Matrix**

| Type | Size | Framework | Dependencies | Gate |
|------|------|-----------|--------------|------|
| component | small | vitest + React Testing Library | happy-dom | Gate 3 (UI component) |

**Test Cases to Cover**

### AC: Modal States
- [component] Caught state: renders sprite, species name, rarity label
- [component] Login state: renders sign-in prompt button
- [component] Error state: renders error message

### AC: Interactions
- [component] ESC key closes modal
- [component] Dismiss button closes modal
- [component] Focus moves to first button on open

### AC: Accessibility
- [component] Dialog element has role="dialog"
- [component] All buttons keyboard focusable
- [component] Dialog properly opened/closed (showModal/close semantics)

---

---

### Step 9: Implement Collection components (smart container and dumb grid)

**Model:** opus  
**Agent:** sdd:developer  
**Depends on:** Step 7  
**Parallel with:** Step 8  

**Goal**: Create Collection view with smart container (data fetching) and dumb grid component (rendering 151 species), 100% test coverage.

**Expected Output**

- `src/client/features/pokemon/components/Collection/Collection.tsx`: Smart container
- `src/client/features/pokemon/components/Collection/CollectionGrid.tsx`: Dumb grid component
- `src/client/features/pokemon/components/Collection/Collection.test.tsx`: 100% coverage tests
- Component tests for data fetching, grid rendering, error handling

**Success Criteria**

- [ ] Collection component is smart container: fetches data via getPokemonCatches()
- [ ] Fetch triggered on component mount and when view toggles to collection
- [ ] Loading state: show spinner or placeholder while fetching
- [ ] Error state: show error message if fetch fails
- [ ] Unauthenticated state: show sign-in prompt if user not authenticated
- [ ] CollectionGrid receives array of { speciesId, count, lastCaughtAt }
- [ ] CollectionGrid renders all 151 species in dex order (ID 1–151)
- [ ] Caught species: display sprite image, name, count badge if >1
- [ ] Uncaught species: greyed placeholder with dex number (#001, #002, etc.)
- [ ] Grid layout: responsive (6 cols mobile, 8 cols tablet, 12 cols desktop)
- [ ] Grid uses CSS Grid or Tailwind grid classes
- [ ] Tests: render collection, verify all 151 items, caught/uncaught states
- [ ] Tests: fetch on mount, error handling, loading state
- [ ] 100% statement/branch/function coverage (both components)

**Subtasks**

- [ ] Create `src/client/features/pokemon/components/Collection/Collection.tsx`
- [ ] Implement smart container: useState for catches, loading, error
- [ ] useEffect on mount and view toggle to fetch getPokemonCatches()
- [ ] Render loading spinner, error message, or CollectionGrid
- [ ] Show sign-in prompt if unauthenticated
- [ ] Create `src/client/features/pokemon/components/Collection/CollectionGrid.tsx`
- [ ] Accept catches array as prop
- [ ] Map pokemonSpecies (all 151) to grid items
- [ ] For caught: render sprite, name, count badge
- [ ] For uncaught: render greyed box, dex number
- [ ] Use Tailwind grid classes (grid-cols-6 sm:grid-cols-8 lg:grid-cols-12)
- [ ] Style caught items: full opacity, interactive
- [ ] Style uncaught items: reduced opacity (opacity-30), greyed background
- [ ] Create `src/client/features/pokemon/components/Collection/Collection.test.tsx`
- [ ] Test: render collection component, verify grid renders
- [ ] Test: verify all 151 species rendered
- [ ] Test: caught species show sprite, name, count
- [ ] Test: uncaught species show placeholder, dex number
- [ ] Test: fetch on mount, loading state, error handling
- [ ] Test: unauthenticated user sees sign-in prompt
- [ ] Verify 100% coverage

**Complexity**: Medium

**Uncertainty**: Low (grid rendering is straightforward)

**Dependencies**: Step 2 (pokemonSpecies data), Step 5 (API endpoint), Step 6 (API function)

**Integration Points**: Step 10 (App.tsx toggles to this view)

**Testing**: Component tests; verify 151-item rendering; caught/uncaught states; 100% coverage

**Blockers & Risks**

- Blockers: None (depends on prior steps)
- Risks: Low — rendering 151 grid items may be slow — Mitigation: Use CSS Grid (GPU-accelerated), lazy load on toggle, monitor render time; add performance test

#### Verification

**Level:** ✅ Single Judge
**Artifact:** `src/client/features/pokemon/components/Collection/Collection.tsx`, `CollectionGrid.tsx`
**Threshold:** 4.0/5.0

**Checklist (Summary):**

| Item | Essential Checks | Importance |
|------|-----------------|------------|
| Collection (A) | Fetches getPokemonCatches on mount and toggle; shows loading/error/signin states | essential |
| CollectionGrid (B) | Renders all 151 species; caught/uncaught states; responsive grid; 100% coverage | essential |

**Rubric Dimensions:**

##### Item A: Collection Smart Container — Data Fetching & State Management (0.30)

Does Collection component fetch getPokemonCatches on mount and when view toggles? Does it manage loading/error/success states?

**Instruction**: Verify useEffect with dependencies [view], getPokemonCatches() called on mount, catch[] state updated, loading spinner shown during fetch.

- 1: No fetch logic; data hardcoded or missing; no loading state.
- 2: Fetch logic present but dependencies incomplete or loading state missing (DEFAULT).
- 3: Fetches on mount and toggle, loading/error states managed correctly (RARE).
- 4: All + explicit loading spinner + error retry button.
- 5: All + optimistic loading (shows data while fetching) (OVERLY PERFECT).

##### Item A: Collection Smart Container — Unauthenticated User Flow (0.25)

Does Collection show sign-in prompt when user is not authenticated?

**Instruction**: Verify auth context is checked, unauthenticated users see sign-in incentive button, collection grid hidden until signed in.

- 1: No unauthenticated check; collection grid renders for guests.
- 2: Auth check present but sign-in prompt incomplete or not prominent (DEFAULT).
- 3: Sign-in prompt shown clearly for unauthenticated users (RARE).
- 4: All + sign-in button navigates to login.
- 5: All + context message explaining why collection requires auth (OVERLY PERFECT).

##### Item A: Collection Smart Container — Test Coverage (0.20)

Does Collection have component tests covering fetch, loading, error, and unauthenticated states? Is coverage >= 95%?

**Instruction**: Verify tests render Collection, trigger fetch, check loading state, verify error handling, test unauthenticated flow. Check coverage report.

- 1: No tests or coverage <50%.
- 2: Partial tests (fetch or loading covered, not error or auth); coverage 50-80% (DEFAULT).
- 3: All states tested, coverage >= 95% (RARE).
- 4: All + mock fetch scenarios (network error, 401, empty array).
- 5: All + property-based tests on catch data structure (OVERLY PERFECT).

##### Item B: CollectionGrid Dumb Grid — 151-Item Rendering (0.30)

Does CollectionGrid render exactly 151 species in dex order (1–151), with caught/uncaught differentiation?

**Instruction**: Verify grid renders all 151 items from pokemonSpecies. Check caught items show sprite + name; uncaught show placeholder + dex number. Verify dex order (sorted by ID).

- 1: Fewer than 151 items rendered; missing species or duplicates.
- 2: All 151 items present but dex order wrong or caught/uncaught not differentiated (DEFAULT).
- 3: All 151 in correct order, caught/uncaught states clearly differentiated (RARE).
- 4: All + caught items show count badge ("Caught: 3").
- 5: All + animation/transitions on state toggle (OVERLY PERFECT).

##### Item B: CollectionGrid Dumb Grid — Responsive Design (0.20)

Does grid respond to viewport width (6 cols mobile, 8 tablet, 12 desktop)?

**Instruction**: Verify Tailwind grid classes (grid-cols-6 sm:grid-cols-8 lg:grid-cols-12) or CSS Grid with media queries. Test at mobile (375px), tablet (768px), desktop (1200px) breakpoints.

- 1: Fixed column count; not responsive.
- 2: Responsive classes present but breakpoints don't match or grid layout broken (DEFAULT).
- 3: Responsive layout works at all breakpoints (RARE).
- 4: All + items remain square/consistent aspect ratio.
- 5: All + smooth column transition animation (OVERLY PERFECT).

##### Item B: CollectionGrid Dumb Grid — Test Coverage (0.20)

Does CollectionGrid have tests verifying all 151 items render, caught/uncaught states, and responsive grid? Is coverage >= 95%?

**Instruction**: Verify tests render CollectionGrid with sample catches, check 151 items render, verify caught show sprite/name and uncaught show placeholder. Check coverage.

- 1: No tests or coverage <50%.
- 2: Partial tests (rendering or states); coverage 50-80% (DEFAULT).
- 3: All rendering tested, caught/uncaught states tested, coverage >= 95% (RARE).
- 4: All + responsive grid tests at different viewport sizes.
- 5: All + accessibility tests (alt text on sprites, semantic markup) (OVERLY PERFECT).

**Test Strategy**

**Applies:** true
**Artifact:** `src/client/features/pokemon/components/Collection/Collection.tsx` and `CollectionGrid.tsx`
**Criticality:** MEDIUM

**Test Matrix**

| Type | Size | Framework | Dependencies | Gate |
|------|------|-----------|--------------|------|
| component | small | vitest + React Testing Library | happy-dom, msw | Gate 3 (UI component) |

**Test Cases to Cover**

### AC: Data Fetching & Loading States
- [component] On mount: fetch called, loading spinner shown
- [component] After fetch: grid renders with received catches
- [component] On error: error message displayed
- [component] Unauthenticated: sign-in prompt shown

### AC: 151-Item Grid Rendering
- [component] Grid renders exactly 151 items (IDs 1–151)
- [component] Caught species show sprite, name, count
- [component] Uncaught species show placeholder, dex number

### AC: Responsive Design
- [component] Grid responsive (6 cols mobile, 8 tablet, 12 desktop)

---

---

## Phase 5: Final Integration (SEQUENTIAL)

### Step 10: Wire view toggle in App.tsx and implement end-to-end testing

**Model:** opus  
**Agent:** sdd:developer  
**Depends on:** Step 8, Step 9  
**Parallel with:** None  

**Note**: This step includes coverage configuration (bunfig.toml update) in Definition of Done.

**Goal**: Update App.tsx to manage view state (timer ↔ collection), conditionally render views, add toggle button, and test complete workflow.

**Expected Output**

- `src/client/App.tsx`: Updated with view state and conditional rendering
- End-to-end tests covering: phase completion → catch modal → collection view
- Integration tests for view switching and multi-phase workflow

**Success Criteria**

- [ ] App.tsx has view state: `view: 'timer' | 'collection'`
- [ ] Header button toggles view between timer and collection
- [ ] Conditional rendering: render Timer if view='timer', Collection if view='collection'
- [ ] CatchReveal modal appears overlay (regardless of view)
- [ ] E2E test: complete phase → catch modal displays → dismiss → collection shows catch
- [ ] E2E test: complete multiple phases → collection shows accumulated catches
- [ ] E2E test: guest completes phase → login nudge displays → sign in → next phase shows catch
- [ ] E2E test: error on catch → error modal → timer still resets → can retry
- [ ] View toggle doesn't lose timer state (pause/resume, remaining time preserved)
- [ ] Collection refetches when toggling to collection view

**Subtasks**

- [ ] Modify `src/client/App.tsx`
- [ ] Add useState for view: 'timer' | 'collection'
- [ ] Add header button to toggle view
- [ ] Conditionally render Timer or Collection component
- [ ] Render CatchReveal modal (always present, controlled by TimerContext state)
- [ ] Verify CatchReveal displays on top of both views
- [ ] Create or extend existing test file for App integration tests
- [ ] E2E test: simulate phase completion, verify catch modal appears
- [ ] E2E test: dismiss modal, verify Collection shows caught Pokemon
- [ ] E2E test: complete multiple phases, verify collection accumulates catches
- [ ] E2E test: guest flow, sign in, verify catches start after auth
- [ ] E2E test: error scenario, timer resets, user can retry
- [ ] Test view toggle: timer ↔ collection switching
- [ ] Test state preservation: timer state not lost on view switch

**Complexity**: Small

**Uncertainty**: Low (view toggle is simple state toggle)

**Dependencies**: Steps 8-9 (components exist), Step 7 (state management ready)

**Integration Points**: Final integration point; depends on all prior work

**Testing**: End-to-end workflow tests; integration tests covering all user scenarios

**Blockers & Risks**

- Blockers: None (depends on all prior steps)
- Risks: Low — view switching may lose timer state if not carefully managed — Mitigation: Test that timer state (remaining, phase, status) preserved across view toggles; useCatchReveal state always visible overlay

**Definition of Done (Step 10)**

In addition to the above acceptance criteria, this step includes:
- [ ] Update `bunfig.toml` to add `src/shared/data/pokemonSpecies.ts` and `scripts/generatePokemonSpecies.ts` to coveragePathIgnorePatterns
- [ ] Run `bun test` to verify coverage report runs cleanly and excludes generated files

#### Verification

**Level:** ✅ Single Judge
**Artifact:** `src/client/App.tsx`, `bunfig.toml`
**Threshold:** 4.0/5.0

**Checklist (Summary):**

| Item | Essential Checks | Importance |
|------|-----------------|------------|
| App.tsx (A) | View state (timer \| collection); toggle button; conditional rendering; CatchReveal overlay; state persistence | essential |
| bunfig.toml (B) | pokemonSpecies.ts and generatePokemonSpecies.ts added to coveragePathIgnorePatterns | essential |

**Rubric Dimensions:**

##### Item A: App.tsx View Toggle — State Management & Persistence (0.30)

Does App.tsx manage view state (timer | collection)? Do Timer state and CatchReveal state persist when toggling views?

**Instruction**: Verify useState(view), toggle button changes view, Timer component state (remaining, phase, status) unchanged by view toggle, CatchReveal modal visible regardless of view.

- 1: No view state; Timer and Collection both render always or one is missing.
- 2: View state present but toggle incomplete or Timer state lost on view switch (DEFAULT).
- 3: View state managed correctly, Timer state persists, CatchReveal always visible (RARE).
- 4: All + explicit test case verifying state preservation across 5+ toggles.
- 5: All + undo/redo history for view navigation (OVERLY PERFECT).

##### Item A: App.tsx View Toggle — Conditional Rendering (0.20)

Does conditional rendering correctly show Timer when view='timer' and Collection when view='collection'?

**Instruction**: Verify if/ternary in render conditionally renders <Timer /> or <Collection />. Check no layout shift or blank screen on toggle.

- 1: Both components render simultaneously; conditional rendering missing.
- 2: Conditional rendering present but logic incomplete (edge case renders nothing) (DEFAULT).
- 3: Correct conditional rendering, smooth view switch (RARE).
- 4: All + loading skeleton during view transition.
- 5: All + CSS transition animation (OVERLY PERFECT).

##### Item A: App.tsx View Toggle — E2E Scenario Coverage (0.25)

Do integration tests cover: (1) complete phase → catch modal, (2) multiple phases accumulate, (3) guest flow with login, (4) error handling?

**Instruction**: Verify tests simulate phase completion, verify catch modal appears, dismiss modal, verify collection updates. Test multi-phase workflow. Test guest → signed-in flow. Test error path.

- 1: No integration tests or only one scenario tested.
- 2: 2-3 scenarios tested, missing guest or error flows (DEFAULT).
- 3: All 4 scenarios tested: authenticated, multi-phase, guest, error (RARE).
- 4: All + tests verify timer state preserved in each scenario.
- 5: All + property-based tests on phase completion order (OVERLY PERFECT).

##### Item A: App.tsx View Toggle — Code Clarity (0.10)

Is the view toggle code clear and easy to follow? Are components well-named?

**Instruction**: Verify code uses clear naming (e.g., `setView` not `toggleView`), no complex conditionals, comments explain intent.

- 1: Code difficult to follow; unclear naming.
- 2: Mostly clear (DEFAULT).
- 3: Clear, easy to follow, good naming (RARE).
- 4: All + JSDoc explaining view state machine.
- 5: All + extracted into custom hook (OVERLY PERFECT).

##### Item B: bunfig.toml Coverage Configuration (0.50)

Are pokemonSpecies.ts and generatePokemonSpecies.ts correctly added to coveragePathIgnorePatterns?

**Instruction**: Verify `coveragePathIgnorePatterns` array includes both file paths. Run `bun test` and check coverage report excludes these files.

- 1: Files not in coveragePathIgnorePatterns; they appear in coverage report.
- 2: One file missing or syntax error in pattern (DEFAULT).
- 3: Both files correctly excluded; coverage report clean (RARE).
- 4: All + comments explaining why (generated/data files).
- 5: All + verified coverage on actual code is 100% (OVERLY PERFECT).

##### Item B: bunfig.toml Config Syntax (0.40)

Is the coveragePathIgnorePatterns syntax correct and does `bun test` run without errors?

**Instruction**: Verify pattern syntax is valid regex or glob, `bun test` completes without config errors, coverage report renders correctly.

- 1: Syntax error; `bun test` fails with config error.
- 2: Syntax valid but produces warnings (DEFAULT).
- 3: Syntax correct, `bun test` runs cleanly, coverage report appears (RARE).
- 4: All + patterns use consistent glob format.
- 5: All + minimal/optimized patterns (OVERLY PERFECT).

##### Item B: bunfig.toml Guidelines (0.10)

Does the config change follow project patterns?

**Instruction**: Verify change uses existing pattern from bunfig.toml, minimal scope, no unrelated edits.

- 1: Introduces new config section or unrelated changes.
- 2: Mostly aligned (DEFAULT).
- 3: Follows existing pattern (RARE).
- 4: All + documented with inline comment.
- 5: All + extraction into separate config section (OVERLY PERFECT).

**Test Strategy**

**Applies:** true
**Artifact:** `src/client/App.tsx`, `bunfig.toml`
**Criticality:** MEDIUM

**Test Matrix**

| Type | Size | Framework | Dependencies | Gate |
|------|------|-----------|--------------|------|
| integration | medium | vitest + @testing-library/react | happy-dom, Testcontainers for backend | Gate 2 (E2E workflow) |

**Test Cases to Cover**

### AC: View Toggle State Management
- [integration] View state initializes to 'timer'
- [integration] Toggle button switches between timer and collection views
- [integration] Timer state (remaining, status, phase) preserved across toggles

### AC: E2E Workflow
- [integration] Complete phase → catch modal displays → dismiss → collection shows catch
- [integration] Multiple phases → collection accumulates catches
- [integration] Guest flow: complete phase → login nudge → sign in → next phase shows catch

### AC: Coverage Configuration
- [integration] `bun test` coverage report shows pokemonSpecies.ts and generatePokemonSpecies.ts excluded
- [integration] All actual feature code has 100% coverage

---

## Verification Summary

| Step | Type | Verification Level | Judges | Threshold | Artifacts |
|------|------|-------------------|--------|-----------|-----------|
| Spike-A | Research | NOT NEEDED | — | — | API structure verification |
| Spike-B | Research | NOT NEEDED | — | — | SQLite error handling decision |
| 1 | Code/DB | ✅ Single | 1 | 4.0/5.0 | types.ts, schemas.ts, schema.ts + migration |
| 2 | Data | ✅✅ Panel (2) | 2 | 4.0/5.0 | pokemonSpecies.ts (151 entries) |
| 3 | Code/Logic | ✅ Single | 1 | 4.0/5.0 | rollCatch.ts (pure function) |
| 4 | Code/API | ✅✅ Panel (2) | 2 | 4.0/5.0 | cycles.ts (transaction + catch) |
| 5 | Code/API | ✅ Single | 1 | 4.0/5.0 | pokemonCatches.ts (endpoint) |
| 6 | Code/API | ✅ Single | 1 | 4.0/5.0 | api.ts (postCycle, getPokemonCatches) |
| 7 | Code/Hooks | ✅ Single | 1 | 4.0/5.0 | useCatchReveal, useCycleRecorder (updated), TimerContext |
| 8 | Code/UI | ✅✅ Panel (2) | 2 | 4.0/5.0 | CatchReveal.tsx (modal) |
| 9 | Code/UI | ✅ Single | 1 | 4.0/5.0 | Collection.tsx, CollectionGrid.tsx |
| 10 | Code/Config | ✅ Single | 1 | 4.0/5.0 | App.tsx, bunfig.toml |

**Total Evaluations**: 13 (0 + 0 + 1 + 2 + 1 + 2 + 1 + 1 + 1 + 2 + 1 + 1)

**Default Checklist Items Included**: ✓ All code-producing steps (1–10) include quality gate checks (build, typecheck, tests)

**Project Guidelines Alignment Dimension**: ✓ All 10 steps include this dimension (CLAUDE.md discovered)

**Test Strategies Defined**: ✓ All 10 code-producing steps (Steps 1–10) include detailed test strategy with Test Matrix and Test Cases to Cover

**Recommended Verification Order**:
1. **Phase 0 (Parallel)**: Spike-A, Spike-B (results inform later steps)
2. **Phase 1 (Parallel)**: Step 1, Step 2 (after Spike-A), Step 3 (after Step 2)
3. **Phase 2 (Sequential)**: Step 4 (after Spike-B), Step 5
4. **Phase 3 (Sequential)**: Step 6, Step 7
5. **Phase 4 (Parallel)**: Step 8, Step 9
6. **Phase 5 (Final)**: Step 10

---

## Implementation Summary

| Step | Goal | Key Output | Complexity | Effort |
|------|------|-----------|------------|--------|
| Spike-A | Verify PokeAPI Gen 1 structure | API response documentation | Small | 2-4 hours |
| Spike-B | Verify SQLite UNIQUE error handling | Idempotency behavior decided | Small | 2-4 hours |
| 1 | Types, schemas, DB schema | Types, schemas, migration | Medium | 1-2 days |
| 2 | Generate Pokemon data | pokemonSpecies.ts (151 entries) | Medium | 1-2 days |
| 3 | Species selection algorithm | rollCatch function + tests | Medium | 1-2 days |
| 4 | Atomic catch recording | Extended cycles API + transaction | Medium | 1-2 days |
| 5 | Collection API endpoint | GET /api/pokemon-catches + route | Small | 4-6 hours |
| 6 | Client API functions | postCycle, getPokemonCatches | Small | 2-4 hours |
| 7 | State management hooks | useCatchReveal + TimerContext | Medium | 1-2 days |
| 8 | Modal component | CatchReveal with 3 states | Medium | 1-2 days |
| 9 | Collection components | Collection + CollectionGrid | Medium | 1-2 days |
| 10 | App integration + coverage | View toggle + E2E tests + bunfig.toml | Small | 4-6 hours |

**Total Steps**: 10 (+ 2 spike tasks)
**Parallel Opportunities**: 
- Spike-A and Spike-B can run in parallel
- Steps 1-3 (foundation) can run in parallel (no inter-dependencies)
- Steps 8-9 (UI components) can run in parallel (both depend on Step 7)

**Critical Path**: Spike-A → Step 2 → Step 3 → Step 4 → Step 7 → Step 10

**Estimated Total Effort**: 14-18 days + 4-8 hours spikes (with parallelization: ~10-12 days wall-clock time)

---

## Build Sequence: Phases

### Pre-Implementation: Spike Tasks (Parallel execution)
- **Spike-A**: Verify PokeAPI Gen 1 structure (2-4 hours)
- **Spike-B**: Verify SQLite UNIQUE error handling (2-4 hours)
- **Gate**: Both spikes must complete before starting Phase 1

### Phase 1: Setup (Parallel execution possible)
- **Step 1**: Types, schemas, DB schema (1-2 days) [no deps]
- **Step 2**: Generate Pokemon species data (1-2 days) [depends: Spike-A, Step 1]
- **Step 3**: Implement rollCatch (1-2 days) [depends: Step 2]
- **Gate**: All L0-L1 tasks complete before Phase 2 starts

### Phase 2: Server APIs (Sequential)
- **Step 4**: Extend cycles API (1-2 days) [depends: Spike-B, Step 1-3]
- **Step 5**: Collection endpoint (4-6 hours) [depends: Step 4]
- **Gate**: All server work complete before Phase 3 starts

### Phase 3: Client Integration (Sequential)
- **Step 6**: Client API functions (2-4 hours) [depends: Step 4-5]
- **Step 7**: State management (1-2 days) [depends: Step 6]
- **Gate**: State management complete before Phase 4 starts

### Phase 4: UI Components (Parallel execution possible)
- **Step 8**: CatchReveal modal (1-2 days) [depends: Step 7]
- **Step 9**: Collection components (1-2 days) [depends: Step 7]
- **Gate**: Both components complete before Phase 5 starts

### Phase 5: Integration + Polish (Final)
- **Step 10**: App.tsx + E2E tests + coverage config (4-6 hours) [depends: Step 8-9]

---

## Risk & Mitigation Summary

| Risk | Impact | Likelihood | Mitigation | Step |
|------|--------|------------|-----------|------|
| **PokeAPI rate limits (429)** | Generation script fails mid-run | Medium | Exponential backoff (1s → 2s → 4s), 50ms polite delay | Step 2 |
| **PokeAPI service unavailable (503)** | Data generation incomplete | Low | 10s backoff, 3 retries, timeout handling | Step 2 |
| **SQLite UNIQUE error handling** | Idempotency check fails | Medium | Verify error code in tests before implementing | Step 4 |
| **Concurrent cycleId POSTs** | Duplicate catches despite UNIQUE | Low | Database constraint enforced; test with simultaneous requests | Step 4 |
| **Rarity distribution incorrect** | Wrong catch rates per phase | Medium | Distribution tests with seeded PRNG; verify ±5% variance | Step 3 |
| **Modal ESC key not working** | UX broken, user can't dismiss | Low | Test native `<dialog>` behavior, ESC key event | Step 8 |
| **Collection grid performance** | Slow rendering of 151 items | Low | Fixed grid (no pagination per spec); lazy load on toggle | Step 9 |
| **Client/server pokemonSpecies.ts drift** | Hydration mismatch, silent errors | Low | Single committed file; both import same path; CI together | Step 2 + Step 9 |

---

## Acceptance Criteria Mapping

| Acceptance Criterion | Implemented In | Verified By |
|---------------------|----------------|------------|
| Catch trigger on all phases | Step 4 (extend cycles API) | Automation: test each phase type triggers catch |
| Rarity varies by phase | Step 3 (rollCatch function) | Unit test: distribution validation for each phase |
| Gen 1 pool (IDs 1–151) | Step 2 (data generation) | Integration test: all catches in range [1, 151] |
| Rarity tier distribution | Step 3 (rollCatch) | Unit test: species counted by tier, matched to spec |
| At most one catch per cycle | Step 4 (UNIQUE constraint) | Integration test: duplicate cycleId → 1 catch row |
| Collection persists per user | Step 5 (query), Step 4 (insert) | Integration test: logout/login → catches remain |
| Collection grid 151 species | Step 9 (CollectionGrid) | Component test: all 151 items render |
| Catch reveal displays immediately | Step 8 (modal), Step 4 (response) | E2E test: phase completion → modal visible <1s |
| Guest sign-in incentive | Step 7 (login nudge state), Step 8 | Component test: unauthenticated → nudge shown |
| Error handling | Step 4, Step 7 (error state) | E2E test: catch failure → modal, timer resets |
| API response has species info | Step 4 (response type) | Integration test: response includes speciesId, caughtAt |
| Collection retrieval groups | Step 5 (GROUP BY query) | Integration test: grouping, count accuracy |

---

## Definition of Done (Task Level)

- [ ] Both spike tasks completed (PokeAPI structure verified, SQLite UNIQUE error handling verified)
- [ ] All 10 implementation steps completed
- [ ] All acceptance criteria from task file verified passing
- [ ] All unit tests passing (`bun test`)
- [ ] All integration tests passing
- [ ] All component tests passing (100% coverage on CatchReveal + Collection)
- [ ] All end-to-end workflow tests passing
- [ ] Type checking passes (`bunx tsc --noEmit`)
- [ ] No test flakiness (seeded PRNG ensures deterministic selection tests)
- [ ] Database migration applied cleanly
- [ ] All routes wired (POST /api/cycles extended, GET /api/pokemon-catches added)
- [ ] Coverage reports clean (excluded files not counted via bunfig.toml)
- [ ] No high-priority risks unaddressed
- [ ] Code reviewed for quality, patterns, consistency
- [ ] Documentation (inline comments) sufficient for maintenance

---

## Notes for Implementation Team

1. **Spike Tasks First**: Execute both Spike-A and Spike-B before starting Phase 1. These tasks de-risk the two highest-uncertainty steps (Steps 2 and 4). Spikes can run in parallel.

2. **Spike-A (PokeAPI)**: Verify actual endpoint structure, response shapes, rate-limit headers, and retry behavior before implementing full data generation. Document findings; update generatePokemonSpecies.ts retry strategy based on verified behavior.

3. **Spike-B (SQLite UNIQUE)**: Verify actual error codes/shapes from Bun's SQLite driver on UNIQUE constraint violation. Decide idempotency behavior: recommend 200 OK with existing data (idempotent, resilient to retries). Write test case before Step 4 implementation.

4. **Parallel Opportunities**: Steps 1-3 can run in parallel during Phase 1. Steps 8-9 can run in parallel during Phase 4. Recommend assigning to different team members for speed.

5. **Critical Dependency**: Step 4 (cycles API with transaction) is the critical path. It blocks Step 5, which blocks Step 6, which blocks Step 7. Prioritize this step once Spike-B complete.

6. **Testing as You Go**: Each step includes tests in its Definition of Done. Do not defer testing to end. This ensures early detection of issues.

7. **PRNG Seeding**: Step 3 introduces seeded PRNG for deterministic distribution tests. This pattern is reused in Step 4's tests. Ensure consistency.

8. **Data Consistency**: pokemonSpecies.ts (Step 2) is single source of truth. Both client (Step 9) and server (Step 3-4) import the same file. Do not duplicate or diverge.

9. **Keyboard Accessibility**: Step 8 (CatchReveal modal) uses native `<dialog>` element. Test ESC key and focus trap explicitly. This is a non-functional but critical requirement.

10. **End-to-End Coverage**: Step 10's E2E tests must cover all three user scenarios: (1) authenticated catch, (2) guest flow with sign-in, (3) error recovery. Use real server + client in tests where possible.

11. **Coverage Configuration**: Step 10's Definition of Done includes updating bunfig.toml to exclude generated/script files from coverage reports.

---

## Risks Requiring Attention

**High Priority** (pre-implementation via spikes):
- **Spike-A (before Step 2)**: PokeAPI rate limiting — verify retry logic and endpoint structure before data generation
- **Spike-B (before Step 4)**: SQLite UNIQUE error handling — verify error code in Bun driver and decide idempotency behavior
- **Step 3**: Rarity distribution correctness — validate ±5% variance across 100+ rolls

**Medium Priority**:
- **Step 9**: Collection grid performance — monitor render time for 151 items (use CSS Grid, lazy load)
- **Step 8**: Modal accessibility — test ESC key, focus trap, ARIA roles (native `<dialog>` element)
- **Step 1**: Type/schema consistency — verify all downstream tasks import from single source paths

**Tracking**: Spike tasks must complete before Phase 1. Update risk status after each phase completes. Close risks as mitigations verify.
