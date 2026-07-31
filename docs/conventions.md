# Conventions

> Extracted from `CLAUDE.md` (kept in sync there — this is a readable excerpt, not a separate source of truth). See also [Timer feature](./timer-feature.md) and [Pokémon feature](./pokemon-feature.md) for the features these components belong to.

## Component patterns

- `Timer` (`client/features/timer/components/Timer/Timer.tsx`) is the smart container: calls `useTimer()` to get state + handlers, renders `TimerDisplay` + `TimerControls`.
- `TimerControls` and `TimerDisplay` are dumb/presentational — they take props (a flat `handlers` object + `status`, or `remaining`) with no context coupling.
- `TimerSettings` uses a `<dialog open>` element (`role="dialog"`) and **uncontrolled** inputs via `useRef`, synced from context state through a `useEffect` keyed on `isSettingsOpen` + the duration values. Numeric input parsing uses a local `safeParse(input, fallbackSeconds)` closure that falls back to the current duration on empty/invalid/zero input, then dispatches `{ minutes }` payloads.
- Components are queried in tests by CSS class name (`.display`, `.controls`, `.pomodoro-timer`) as well as role/label queries.
- Components use `export default`; import them accordingly (not named imports) both in app code and tests.
- `CatchReveal` (`client/features/pokemon/components/CatchReveal/CatchReveal.tsx`) follows the same `<dialog open>` + ref pattern as `TimerSettings`, plus `showModal()`/`close()` lifecycle management and an `onKeyDown`/`onCancel` pair for ESC-to-dismiss (happy-dom doesn't wire native `<dialog>` keyboard handling, so the ESC handler is explicit, not incidental). It renders exactly one of three states — caught / login-nudge / error — from props; App.tsx is the only place it's mounted, reading its props from `useTimerContext()` so it overlays both the timer and collection views.
- `Collection` (`client/features/pokemon/components/Collection/Collection.tsx`) is the smart container (fetches `getPokemonCatches()` on mount and whenever `auth.status` changes); `CollectionGrid` is the dumb 151-item grid, following the same split as `Timer`/`TimerDisplay`. `App.tsx` uses conditional rendering, not CSS hiding, so toggling to the collection view remounts `Collection` and triggers the refetch.

## Testing conventions

- `bun:test` provides `describe/it/expect/beforeEach/afterEach/mock/spyOn` — it does **not** export `act`; import `act` from `@testing-library/react` instead.
- Wrap dispatch-triggering interactions in `act()`; use `await act(async () => { ...; await Bun.sleep(0) })` for effects that need a microtask/tick to settle.
- `mock.restore()` in `afterEach` to reset spies/mocks between tests.
- Prefer `spyOn(globalThis, 'setInterval' | 'clearInterval')` over faking timers wholesale when testing interval-driven effects.
- `noUncheckedIndexedAccess` is enabled in `tsconfig.json`, so array-index access (e.g. `document.querySelectorAll('input')` results) is typed as possibly `undefined` — use a non-null assertion or a typed-tuple cast at the point of use in tests.
- Components under `client/features/**`, `client/ui/`, and `client/api.ts` are expected to have colocated `*.test.ts(x)` files and are held to 100% function/line coverage; small pure per-feature utility files (`calculateRemaining.ts`, `formatTime.ts`, `progressRing.ts`, `timerStorage.ts`, `authFlag.ts`, `cn.ts`) are excluded from the coverage report (see `bunfig.toml`'s `coveragePathIgnorePatterns`) but should still have tests where behavior is non-trivial.
- A class with a property initializer but no explicit `constructor()` (e.g. `private windows = new Map()`) can under-report function coverage in Bun's instrumentation even when fully exercised — give classes an explicit constructor if this happens.
