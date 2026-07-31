# Pokémon feature

> Extracted from `CLAUDE.md` (kept in sync there — this is a readable excerpt, not a separate source of truth). See also [Architecture](./architecture.md) and [Timer feature](./timer-feature.md) for how catch-reveal state is wired into `TimerContext`.

## `client/features/pokemon` — Pokémon catching and collection

Every completed phase (`FOCUS` | `SHORT_BREAK` | `LONG_BREAK`) awards a wild-caught Pokémon from the Gen 1 pool (species IDs 1–151). There is no separate `PokemonContext`: catch-reveal state (`caughtPokemon`, `showLoginNudge`, `catchError`, `dismissCatchReveal`) is a 5th hook (`useCatchReveal`) composed into `TimerContextProvider` alongside the four above, because the trigger (phase completion) already lives there — see ADR 1 in `.specs/tasks/*/implement-pokemon-catching-collection.feature.md` for alternatives considered.

- `server/pokemon/rollCatch.ts` — pure function, `rollCatch(phase, prng = Math.random)`: weights rarity tiers (`rare` | `uncommon` | `common`) per phase (`LONG_BREAK` rolls rare/uncommon far more often than `FOCUS`/`SHORT_BREAK`), then picks uniformly within the selected tier. The optional `prng` parameter exists solely so tests can inject a seeded generator instead of mocking `Math.random` globally.
- `src/shared/data/pokemonSpecies.ts` — static, committed 151-entry module generated once by `scripts/generatePokemonSpecies.ts` from PokeAPI (never fetched at runtime). Both client and server import this file as the single source of truth for species metadata (name, sprite, rarity) — regenerate only if PokeAPI data changes, and both sides deploy from the same commit.
- `server/api/cycles.ts`'s `createCycle` wraps the cycle insert and the catch insert in one `db.transaction()`; `pokemon_catches.cycleId` is `UNIQUE`, so a retried POST with the same client-generated `cycleId` doesn't create a second catch — the handler catches the constraint violation and returns the existing catch row idempotently (200, not 409) as long as it belongs to the same user.
- `useCycleRecorder` caches its `cycleId` in a `useRef` and only clears it once the timer state moves *past* the completion event (status leaves `IDLE` or `remaining` leaves `0`) — not within the same completion pass. Clearing it eagerly would let a React StrictMode double-effect-invocation mint a second `cycleId` and double-POST for what the user experiences as one phase completion; there's a regression test for this in `TimerContext.test.tsx`.
- `CatchReveal` (native `<dialog>`, `role="dialog"`, ESC-to-dismiss) and `Collection`/`CollectionGrid` (smart/dumb split, fetch-on-mount) follow the same patterns as `TimerSettings` and `Timer`/`TimerDisplay` respectively — see [Conventions § Component patterns](./conventions.md#component-patterns).

The `pokemon-catching-collection` skill has reusable patterns for weighted-tier event selection, atomic event recording with idempotency, and modal-reveal UIs, using this feature as the worked example.
