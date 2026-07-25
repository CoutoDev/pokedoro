# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
bun install                                   # install dependencies
bun dev                                       # start dev server (src/index.ts, HMR enabled)
bun start                                     # production server (NODE_ENV=production)
bun run build                                 # production build to dist/

bun test                                      # run all tests (coverage runs automatically, see bunfig.toml)
bun test src/hooks/useTimer.test.tsx          # run a single test file
bun test -t "dispatches START_FOCUS"          # filter by test name

bunx tsc --noEmit                             # typecheck (no separate lint/format tooling is configured)
```

Coverage thresholds/reporters and preload (`happydom.ts`, for DOM APIs in tests) are configured in `bunfig.toml`. `src/utils/**` is excluded from the coverage report there.

## Architecture

State is managed via **Context + Reducer** (no Redux/Zustand). More feature contexts are expected to be added — follow the same pattern as `TimerContext` when adding one:

- `src/contexts/<Name>/<Name>.tsx` — exports `Context`, `<Name>ContextProvider`, `initial<Name>State`, and a `use<Name>Context()` hook. The context's default value must be safely usable outside a provider (e.g. `timerDispatch` defaults to a no-op) — `use<Name>Context()` falls back to that default via `useContext(Context) ?? default`.
- `src/contexts/<Name>/index.tsx` — barrel re-exporting the above.
- `src/reducers/<name>Reducer/<name>Reducer.ts` — pure reducer + the `Action` discriminated-union type. Side effects (`setInterval`/`clearInterval`, auto-reset) live in the context provider's `useEffect`s, **not** in the reducer.
- `src/types/` — shared domain types (e.g. `PomodoroCycle`). Note: `src/types/pomodoro-cycle.ts` also defines its own `TimerAction` type that is stale/unused — the reducer's own `TimerAction` (exported from `src/reducers/timerReducer/index.ts`) is the source of truth used throughout the app.
- `src/utils/<name>.ts` — small pure functions (`formatTime`, `calculateRemaining`).
- Path alias `@/*` resolves to `src/*` (see `tsconfig.json`).

### TimerContext domain model (`src/contexts/TimerContext/TimerContext.tsx`)

`PomodoroCycle` state: `phase` (`FOCUS | SHORT_BREAK | LONG_BREAK`), `status` (`IDLE | RUNNING | PAUSED`), durations in **seconds** (`focusDuration` 25min, `shortBreakDuration` 5min, `longBreakDuration` 15min default), `sessionTimeout`, `pausedAt`/`resumedAt`/`resetedAt`, `remaining`.

Reducer actions (`src/reducers/timerReducer/timerReducer.ts`): `START_FOCUS`, `START_BREAK`, `START_LONG_BREAK`, `TICK`, `PAUSE`, `RESUME`, `COMPLETE_SESSION`, `RESET`, `SET_DURATION`, `SET_SHORT_BREAK_DURATION`, `SET_LONG_BREAK_DURATION`. `SET_*` duration actions receive **minutes** from the UI; the reducer converts to seconds.

The provider (`TimerContextProvider`) runs a `setInterval` dispatching `TICK` once per second while `status === 'RUNNING'`, clearing it on unmount/status change, and dispatches `RESET` when `status === 'IDLE' && remaining === 0`.

### Component patterns

- `Timer` (`src/components/Timer/Timer.tsx`) is the smart container: calls `useTimer()` (in `src/hooks/useTimer.tsx`) to get state + handlers, renders `TimerDisplay` + `TimerControls`.
- `TimerControls` and `TimerDisplay` are dumb/presentational — they take props (a flat `handlers` object + `status`, or `remaining`) with no context coupling.
- `TimerSettings` uses a `<dialog open>` element (`role="dialog"`) and **uncontrolled** inputs via `useRef`, synced from context state through a `useEffect` keyed on `isSettingsOpen` + the duration values (see `TimerSettings.tsx`). Numeric input parsing uses a local `safeParse(input, fallbackSeconds)` closure that falls back to the current duration on empty/invalid/zero input.
- Components are queried in tests by CSS class name (`.display`, `.controls`, `.pomodoro-timer`) as well as role/label queries.
- Components use `export default`; import them accordingly (not named imports) both in app code and tests.

### Testing conventions

- `bun:test` provides `describe/it/expect/beforeEach/afterEach/mock/spyOn` — it does **not** export `act`; import `act` from `@testing-library/react` instead.
- Wrap dispatch-triggering interactions in `act()`; use `await act(async () => { ...; await Bun.sleep(0) })` for effects that need a microtask/tick to settle.
- `mock.restore()` in `afterEach` to reset spies/mocks between tests.
- Prefer `spyOn(globalThis, 'setInterval' | 'clearInterval')` over faking timers wholesale when testing interval-driven effects.
- `noUncheckedIndexedAccess` is enabled in `tsconfig.json`, so array-index access (e.g. `document.querySelectorAll('input')` results) is typed as possibly `undefined` — use a non-null assertion or a typed-tuple cast at the point of use in tests.
- Components under `src/contexts/`, `src/hooks/`, and `src/components/**` are expected to have colocated `*.test.ts(x)` files and are held to 100% function/line coverage; `src/utils/**` is excluded from the coverage report.
