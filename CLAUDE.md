# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
bun install                                   # install dependencies
bun dev                                       # start dev server (src/server/index.ts, HMR enabled)
bun start                                     # production server (NODE_ENV=production)
bun run build                                 # production build to dist/

bun test                                      # run all tests (coverage runs automatically, see bunfig.toml)
bun test src/client/features/timer/useTimer.test.tsx  # run a single test file
bun test -t "dispatches START_FOCUS"          # filter by test name

bunx tsc --noEmit                             # typecheck (no separate lint/format tooling is configured)

bun run db:generate                           # generate a Drizzle migration from schema.ts changes
bun run db:migrate                            # apply migrations to DATABASE_PATH
```

Coverage thresholds/reporters and preload (`happydom.ts`, for DOM APIs in tests) are configured in `bunfig.toml`.

### Environment variables (see `.env.example`)

| Var | Purpose |
|---|---|
| `DATABASE_PATH` | SQLite file path for Bun's built-in driver. Defaults to `./pokedoro.db`; tests force `:memory:` (see `happydom.ts`). |
| `RESEND_API_KEY` | Sends OTP emails via Resend. If unset, OTP codes are logged to the server console instead (dev fallback) — throws on boot if unset with `NODE_ENV=production`. |
| `OTP_FROM_EMAIL` | From-address for OTP emails; must be a verified Resend sender/domain in production. |
| `OTP_SECRET` | HMAC pepper for stored OTP code hashes. Falls back to a fixed insecure dev key if unset; throws on boot if unset with `NODE_ENV=production`. |

## Architecture

Pokédoro is a **full-stack Bun monolith**: a single `Bun.serve()` process (`src/server/index.ts`) serves both the React SPA (via Bun's HTML-import bundling of `src/client/index.html`) and a JSON API, backed by SQLite through Drizzle ORM.

`src/` is split into three directories with an enforced trust/runtime boundary — **`client` must never import from `server`**; both may import from `shared`:

```
src/
  client/      React SPA: components, contexts, hooks, reducers — grouped by feature
  server/      Bun.serve() process: route table, API handlers, DB, server-only lib
  shared/      Importable from both sides: domain types, Zod contract schemas, reviveUser
```

### `client/` — grouped by bounded context, not technical kind

```
client/
  features/
    timer/     Timer*, TimerContext (+ its extracted hooks), timerReducer, useTimer, timerStorage
    auth/      Login*, AuthContext, authReducer, useAuth, authFlag
    pokemon/   CatchReveal*, Collection*, CollectionGrid*, capitalizeName — no context/reducer of its own, reads catch state from TimerContext
  ui/          Button, Input, Label — the shared design system (CVA + Tailwind 4)
  api.ts       the only place client code calls fetch() against /api/*
  App.tsx, frontend.tsx, index.css, index.html
```

State is managed via **Context + Reducer** (no Redux/Zustand). More feature contexts are expected to be added under `client/features/<name>/` — follow the same pattern as `features/timer`:

- `features/<name>/<Name>Context/<Name>Context.tsx` — exports `Context`, `<Name>ContextProvider`, `initial<Name>State` (or a dedicated leaf module — see below), and a `use<Name>Context()` hook. The context's default value must be safely usable outside a provider (e.g. `timerDispatch` defaults to a no-op) — `use<Name>Context()` falls back to that default via `useContext(Context) ?? default`.
- `features/<name>/<Name>Context/index.tsx` — barrel re-exporting the above.
- `features/<name>/<name>Reducer/<name>Reducer.ts` — pure reducer + the `Action` discriminated-union type (the source of truth for that type). Side effects (`setInterval`/`clearInterval`, persistence, syncing) live in hooks colocated with the context provider, **not** in the reducer.
- `features/timer/initialTimerState.ts` — `initialTimerState` lives in its own leaf module rather than in `TimerContext.tsx`, specifically so `timerReducer.ts` can import it without creating a reducer-imports-context-imports-reducer cycle. `TimerContext` re-exports it, so `@/client/features/timer/TimerContext` imports of `initialTimerState` still work.
- `shared/types/` — shared domain types (e.g. `PomodoroCycle`), deriving their string-union fields (`Phase`, `Status`) from the Zod schemas in `shared/schemas/` rather than duplicating the literals.
- `features/<name>/*.ts` — small pure functions colocated with the feature that owns them (`formatTime`, `calculateRemaining`, `progressRing`, `timerStorage`, `authFlag`), rather than a shared `utils/` grab-bag.
- Path alias `@/*` resolves to `src/*` (see `tsconfig.json`).

### `client/features/timer` — the `TimerContext` provider and its hooks

`PomodoroCycle` state (`shared/types/pomodoro-cycle.ts`): `phase` (`FOCUS | SHORT_BREAK | LONG_BREAK`), `status` (`IDLE | RUNNING | PAUSED`), durations in **seconds** (`focusDuration` 25min, `shortBreakDuration` 5min, `longBreakDuration` 15min default), `sessionTimeout` (the deadline), `pausedAt`/`resumedAt`/`resetAt`, `remaining`.

Reducer actions (`timerReducer/timerReducer.ts`): `START_FOCUS`, `START_BREAK`, `START_LONG_BREAK`, `TICK`, `PAUSE`, `RESUME`, `RESET`, `HYDRATE`, `SET_DURATION`, `SET_SHORT_BREAK_DURATION`, `SET_LONG_BREAK_DURATION`. `COMPLETE_SESSION` is also part of the action union but intentionally unhandled (falls through to `default: return state`) — there's an explicit test asserting this, don't "fix" it without checking why. `SET_*` duration actions receive **`{ minutes }`** from the UI; the reducer converts to seconds via the tiny `Duration.fromMinutes(n).seconds` value object (`features/timer/duration.ts`) rather than a bare `* 60`. `calculateRemaining(sessionTimeout: Date)` takes a non-null deadline — callers that don't yet have one (e.g. starting fresh) use the duration directly as `remaining` instead of calling it. `PAUSE`/`RESUME`'s status guards read from a small `REQUIRES_STATUS` table in the reducer rather than inline comparisons.

`TimerContextProvider` composes four intention-revealing hooks (colocated in `features/timer/TimerContext/`), each independently testable:

- `useTickInterval(status, dispatch)` — runs `setInterval` dispatching `TICK` once per second while `status === 'RUNNING'`, clearing it on unmount/status change.
- `useLocalTimerPersistence(timer)` — persists `timer` to localStorage on every change.
- `useCycleRecorder(timer, auth, dispatch)` — POSTs a completed cycle to `/api/cycles` (if signed in) and dispatches `RESET` once `status === 'IDLE' && remaining === 0`.
- `useAccountSync(timer, auth, dispatch)` — the auth-driven sync policy (login-claims-local-session vs login-restores-account-state vs logout-resets); see its doc comment for the full policy. `remaining` is deliberately excluded from its effect deps so a plain per-second `TICK` doesn't trigger a PUT.

`client/api.ts` is the only place client code calls `fetch()` against `/api/*` — `AuthContext`, `useAuth`, `useCycleRecorder`, and `useAccountSync` all go through it instead of raw `fetch()` calls scattered across files.

### `client/features/pokemon` — Pokémon catching and collection

Every completed phase (`FOCUS` | `SHORT_BREAK` | `LONG_BREAK`) awards a wild-caught Pokémon from the Gen 1 pool (species IDs 1–151). There is no separate `PokemonContext`: catch-reveal state (`caughtPokemon`, `showLoginNudge`, `catchError`, `dismissCatchReveal`) is a 5th hook (`useCatchReveal`) composed into `TimerContextProvider` alongside the four above, because the trigger (phase completion) already lives there — see ADR 1 in `.specs/tasks/*/implement-pokemon-catching-collection.feature.md` for the alternatives considered.

- `server/pokemon/rollCatch.ts` — pure function, `rollCatch(phase, prng = Math.random)`: weights rarity tiers (`rare` | `uncommon` | `common`) per phase (`LONG_BREAK` rolls rare/uncommon far more often than `FOCUS`/`SHORT_BREAK`), then picks uniformly within the selected tier. The optional `prng` parameter exists solely so tests can inject a seeded generator instead of mocking `Math.random` globally.
- `src/shared/data/pokemonSpecies.ts` — static, committed 151-entry module generated once by `scripts/generatePokemonSpecies.ts` from PokeAPI (never fetched at runtime). Both client and server import this same file as the single source of truth for species metadata (name, sprite, rarity) — regenerate only if PokeAPI data changes, and both sides deploy from the same commit.
- `server/api/cycles.ts`'s `createCycle` wraps the cycle insert and the catch insert in one `db.transaction()`; `pokemon_catches.cycleId` is `UNIQUE`, so a retried POST with the same client-generated `cycleId` doesn't create a second catch — the handler catches the constraint violation and returns the existing catch row idempotently (200, not 409) as long as it belongs to the same user.
- `useCycleRecorder` caches its `cycleId` in a `useRef` and only clears it once the timer state moves *past* the completion event (status leaves `IDLE` or `remaining` leaves `0`) — not within the same completion pass. Clearing it eagerly would let a React StrictMode double-effect-invocation mint a second `cycleId` and double-POST for what the user experiences as one phase completion; there's a regression test for this in `TimerContext.test.tsx`.
- `CatchReveal` (native `<dialog>`, `role="dialog"`, ESC-to-dismiss) and `Collection`/`CollectionGrid` (smart/dumb split, fetch-on-mount) follow the same patterns as `TimerSettings` and `Timer`/`TimerDisplay` respectively — see Component patterns below.

### `shared/schemas/pomodoroCycle.ts` — single source of truth for wire contracts

`timerStateWireSchema` and `cyclePayloadSchema` are the one definition of the `/api/timer-state` and `/api/cycles` body shapes, imported directly by both the server handlers (`server/api/timerState.ts`, `server/api/cycles.ts`) and the client's `reviveTimerState` (`features/timer/timerStorage.ts`), so the three no longer drift independently. `reviveTimerState` `safeParse`s incoming state against this schema before reviving date strings to `Date`s — a shape that doesn't validate (e.g. a stale field name from old localStorage) falls back to the caller-supplied default instead of silently merging unknown keys forward.

### `server/` — routes, auth, persistence

`server/index.ts` is the composition root: the route table below, the request body-size cap, HMR config, and the periodic auth-record purge scheduler (`server/lib/cleanup.ts`, every 15 minutes).

| Route | Handler | Notes |
|---|---|---|
| `POST /api/auth/request-otp` | `server/api/auth/requestOtp.ts` | Parses email, rate-limits (per-email + per-IP), calls `requestOtpForEmail` |
| `POST /api/auth/verify-otp` | `server/api/auth/verifyOtp.ts` | Parses email+code, rate-limits (per-IP), calls `verifyOtpAndSignIn` |
| `GET /api/auth/me` | `server/api/auth/me.ts` | Resolves the session cookie to a user |
| `POST /api/auth/logout` | `server/api/auth/logout.ts` | CSRF-checked; destroys the session, clears the cookie |
| `POST /api/cycles` | `server/api/cycles.ts` | CSRF + session checked; records a completed Pomodoro cycle and its Pokémon catch atomically |
| `GET /api/pokemon-catches` | `server/api/pokemonCatches.ts` | Session checked; catches grouped by species (count + most recent `caughtAt`), sorted by species ID |
| `GET`/`PUT` `/api/timer-state` | `server/api/timerState.ts` | Session checked (PUT also CSRF-checked); syncs `PomodoroCycle` JSON per user |
| `/*` | `src/client/index.html` | SPA fallback |

**Auth flow (passwordless email OTP)**: the two genuinely complex flows live in `server/auth/service.ts` as plain-data use cases — `requestOtpForEmail(email)` and `verifyOtpAndSignIn(email, code)` — extracted from their HTTP handlers, which shrink to parse → rate-limit/CSRF → call service → serialize. `verifyOtpAndSignIn` atomically claims an OTP attempt (a single `UPDATE ... WHERE attempts < OTP_MAX_ATTEMPTS` statement — see its comment for why this must not be a separate read+write), registers a new user on first sign-in, and returns a discriminated outcome (`expired_or_not_found` / `too_many_attempts` / `invalid_code` / `user_creation_failed` / `success`) that the handler maps to a status code and body. Only the session token's SHA-256 hash and an HMAC-peppered OTP hash are ever stored — nothing recoverable from a DB dump.

**`server/lib/rateLimit.ts`** wraps its state behind a `RateLimiter` interface (`InMemoryRateLimiter` implements it); `consumeRateLimit`/`resetRateLimits`/`getClientIp` are the stable call-site API. The in-memory implementation is per-instance and loses state on restart — it's the component to replace with a shared-store (e.g. Redis) implementation the day this app runs more than one server instance.

**`server/db/schema.ts`** (Drizzle, SQLite): `users`, `otp_codes`, `sessions`, `pomodoro_cycles`, `timer_states` (one JSON blob per user, keyed by `userId`, validated on write against `timerStateWireSchema`), `pokemon_catches` (`userId` FK + index, `cycleId` FK with a `UNIQUE` index enforcing at-most-one-catch-per-cycle, `speciesId`, `caughtAt`).

## Component patterns

- `Timer` (`client/features/timer/components/Timer/Timer.tsx`) is the smart container: calls `useTimer()` to get state + handlers, renders `TimerDisplay` + `TimerControls`.
- `TimerControls` and `TimerDisplay` are dumb/presentational — they take props (a flat `handlers` object + `status`, or `remaining`) with no context coupling.
- `TimerSettings` uses a `<dialog open>` element (`role="dialog"`) and **uncontrolled** inputs via `useRef`, synced from context state through a `useEffect` keyed on `isSettingsOpen` + the duration values. Numeric input parsing uses a local `safeParse(input, fallbackSeconds)` closure that falls back to the current duration on empty/invalid/zero input, then dispatches `{ minutes }` payloads.
- Components are queried in tests by CSS class name (`.display`, `.controls`, `.pomodoro-timer`) as well as role/label queries.
- Components use `export default`; import them accordingly (not named imports) both in app code and tests.
- `CatchReveal` (`client/features/pokemon/components/CatchReveal/CatchReveal.tsx`) follows the same `<dialog open>` + ref pattern as `TimerSettings`, plus `showModal()`/`close()` lifecycle management and an `onKeyDown`/`onCancel` pair for ESC-to-dismiss (happy-dom doesn't wire native `<dialog>` keyboard handling, so the ESC handler is explicit, not incidental). It renders exactly one of three states — caught / login-nudge / error — from props; App.tsx is the only place it's mounted, reading its props from `useTimerContext()` so it overlays both the timer and collection views.
- `Collection` (`client/features/pokemon/components/Collection/Collection.tsx`) is the smart container (fetches `getPokemonCatches()` on mount and whenever `auth.status` changes); `CollectionGrid` is the dumb 151-item grid, following the same split as `Timer`/`TimerDisplay`. Conditional rendering (not CSS hiding) in `App.tsx` is what makes "refetch on toggling to the collection view" work — mounting is the refetch trigger.

## Testing conventions

- `bun:test` provides `describe/it/expect/beforeEach/afterEach/mock/spyOn` — it does **not** export `act`; import `act` from `@testing-library/react` instead.
- Wrap dispatch-triggering interactions in `act()`; use `await act(async () => { ...; await Bun.sleep(0) })` for effects that need a microtask/tick to settle.
- `mock.restore()` in `afterEach` to reset spies/mocks between tests.
- Prefer `spyOn(globalThis, 'setInterval' | 'clearInterval')` over faking timers wholesale when testing interval-driven effects.
- `noUncheckedIndexedAccess` is enabled in `tsconfig.json`, so array-index access (e.g. `document.querySelectorAll('input')` results) is typed as possibly `undefined` — use a non-null assertion or a typed-tuple cast at the point of use in tests.
- Components under `client/features/**`, `client/ui/`, and `client/api.ts` are expected to have colocated `*.test.ts(x)` files and are held to 100% function/line coverage; small pure per-feature utility files (`calculateRemaining.ts`, `formatTime.ts`, `progressRing.ts`, `timerStorage.ts`, `authFlag.ts`, `cn.ts`) are excluded from the coverage report (see `bunfig.toml`'s `coveragePathIgnorePatterns`) but should still have tests where behavior is non-trivial.
- A class with a property initializer but no explicit `constructor()` (e.g. `private windows = new Map()`) can under-report function coverage in Bun's instrumentation even when fully exercised — give classes an explicit constructor if this happens.
