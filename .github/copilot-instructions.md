# Copilot Instructions — Pokedoro

## Stack
- **Runtime & package manager**: Bun
- **UI**: React + TypeScript (`.tsx`)
- **Testing**: `bun:test` + `@testing-library/react`
- **Path alias**: `@/` resolves to `src/`

## Key Commands
```sh
bun test            # run all tests
bun run dev         # start dev server
bun run build       # production build
```

## Architecture
State is managed via **Context + Reducer** (no Redux/Zustand). More contexts will be added — follow the same pattern as `TimerContext`.

- `src/contexts/<Name>/<Name>.tsx` — exports `Context`, `ContextProvider`, `initialState`, `useContext` hook
- `src/reducers/<name>Reducer/<name>Reducer.ts` — pure reducer + `Action` union type
- `src/types/` — shared domain types (e.g. `PomodoroCycle`)
- `src/utils/<name>/index.ts` — pure utility functions

### TimerContext domain model
| Field | Values |
|---|---|
| `phase` | `FOCUS` \| `SHORT_BREAK` \| `LONG_BREAK` |
| `status` | `IDLE` \| `RUNNING` \| `PAUSED` |
| Durations | focus: 25 min, short break: 5 min, long break: 15 min |

**`TimerAction` types:**
```ts
{ type: 'START_FOCUS'; payload: { focusDuration: number; remaining: number } }
{ type: 'START_BREAK' }
{ type: 'START_LONG_BREAK' }
{ type: 'PAUSE';  payload: { pausedAt: Date } }
{ type: 'RESUME'; payload: { resumedAt: Date } }
{ type: 'RESET' }
{ type: 'TICK' }
{ type: 'SET_DURATION';            payload: { focusDuration: number } }      // minutes
{ type: 'SET_SHORT_BREAK_DURATION'; payload: { shortBreakDuration: number } } // minutes
{ type: 'SET_LONG_BREAK_DURATION';  payload: { longBreakDuration: number } }  // minutes
```

**Duration convention**: `SET_*` actions receive **minutes**; the reducer multiplies by 60. All internal state is in **seconds**.

The provider manages `setInterval` for TICK and calls `clearInterval` on PAUSE/RESET — keep side effects in the provider, not the reducer. Phase auto-advances (FOCUS → SHORT_BREAK) when `remaining` reaches 0.

`RESUME` extends `sessionTimeout` by the paused duration: `newTimeout = sessionTimeout + (resumedAt - pausedAt)`.

## Component Patterns
- Components use **CSS class names** for querying in tests (`.display`, `.controls`, `.pomodoro-timer`)
- `TimerControls` receives a flat `handlers` object and a `status` string — no context coupling
- `Timer` is the smart container: reads context, builds handlers, renders `TimerDisplay` + `TimerControls`
- `TimerSettings` uses a `<dialog open>` element (role="dialog") and `useRef` for inputs (not controlled state)

### Form Input Pattern
Settings dialogs use `useRef` with uncontrolled inputs. Sync ref values to context state via `useEffect` when opening:
```tsx
useEffect(() => {
  if (!isSettingsOpen) return
  if (focusRef.current) focusRef.current.value = formatTime(focusDuration, false)
}, [isSettingsOpen, focusDuration])
```

### Utility Functions
- `formatTime(seconds, includeSeconds?)` — converts seconds to MM:SS or MM format
- Use `safeParse(input, fallbackSeconds)` pattern in settings to validate user input with fallback to current state

## Testing Conventions
- Use `bun:test` imports: `{ describe, it, expect, act, beforeEach, afterEach, mock, spyOn }`
- Wrap all `timerDispatch` calls in `act()`
- Use `Bun.sleep(ms)` inside `await act(async () => { ... })` for time-based tests
- `mock.restore()` in `beforeEach`/`afterEach` to reset spies
- Prefer `spyOn(globalThis, 'clearInterval')` over mocking timers directly
- Spy on `calculateRemaining` module export when testing the reducer in isolation

## Patterns to Follow
- Context default value must be usable outside a provider without throwing (`timerDispatch` is a no-op)
- `useTimerContext()` returns `{ timer, timerDispatch }` — always destructure this shape
- Each context module exports the raw `Context` object for direct consumers
- `initialTimerState` is exported from the context module and imported by the reducer (single source of truth for RESET)
