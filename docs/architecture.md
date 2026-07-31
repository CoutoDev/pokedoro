# Architecture

> Extracted from `CLAUDE.md` (kept in sync there — this is a readable excerpt, not a separate source of truth). See also [Timer feature](./timer-feature.md), [Pokémon feature](./pokemon-feature.md), and [Server](./server.md) for the feature/runtime deep dives, and [Conventions](./conventions.md) for component and testing patterns.

Pokédoro is a **full-stack Bun monolith**: a single `Bun.serve()` process (`src/server/index.ts`) serves both the React SPA (via Bun's HTML-import bundling of `src/client/index.html`) and a JSON API, backed by SQLite through Drizzle ORM.

`src/` is split into three directories with an enforced trust/runtime boundary — **`client` must never import from `server`**; both may import from `shared`:

```
src/
  client/      React SPA: components, contexts, hooks, reducers — grouped by feature
  server/      Bun.serve() process: route table, API handlers, DB, server-only lib
  shared/      Importable from both sides: domain types, Zod contract schemas, reviveUser
```

## `client/` — grouped by bounded context, not technical kind

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

Feature-specific detail lives in its own doc: [Timer feature](./timer-feature.md), [Pokémon feature](./pokemon-feature.md).

## `shared/schemas/pomodoroCycle.ts` — single source of truth for wire contracts

`timerStateWireSchema` and `cyclePayloadSchema` are the one definition of the `/api/timer-state` and `/api/cycles` body shapes, imported directly by both the server handlers (`server/api/timerState.ts`, `server/api/cycles.ts`) and the client's `reviveTimerState` (`features/timer/timerStorage.ts`), so the three no longer drift independently. `reviveTimerState` `safeParse`s incoming state against this schema before reviving date strings to `Date`s — a shape that doesn't validate (e.g. a stale field name from old localStorage) falls back to the caller-supplied default instead of silently merging unknown keys forward.

Server routes, the auth flow, and the DB schema are documented in [Server](./server.md).
