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
- `src/reducers/<name>Reducer.ts` — pure reducer + `Action` union type

### TimerContext domain model
| Field | Values |
|---|---|
| `phase` | `FOCUS` \| `SHORT_BREAK` \| `LONG_BREAK` |
| `status` | `IDLE` \| `RUNNING` \| `PAUSED` |
| Durations | focus: 25 min, short break: 5 min, long break: 15 min |

**`TimerAction` payloads:**
```ts
{ type: 'START_FOCUS'; payload: { focusDuration: number; remaining: number } }
{ type: 'PAUSE';       payload: { pausedAt: Date } }
{ type: 'RESET' }
{ type: 'TICK' }
```

`initialTimerState` includes: `phase`, `status`, `focusDuration`, `shortBreakDuration`, `longBreakDuration`, `remaining`, `sessionTimeout`, `pausedAt`, `resumedAt`, `resetedAt`, `interval`, `id` (string UUID).

The provider manages `setInterval` for TICK and calls `clearInterval` on PAUSE/RESET — keep side effects in the provider, not the reducer. Phase auto-advances (FOCUS → SHORT_BREAK) when `remaining` reaches 0.

## Testing Conventions
- Use `bun:test` imports: `{ describe, it, expect, act, beforeEach, afterEach, mock, spyOn }`
- Wrap all `timerDispatch` calls in `act()`
- Use `Bun.sleep(ms)` inside `await act(async () => { ... })` for time-based tests
- `mock.restore()` in `beforeEach`/`afterEach` to reset spies
- Prefer `spyOn(globalThis, 'clearInterval')` over mocking timers directly

## Patterns to Follow
- Context default value must be usable outside a provider without throwing (`timerDispatch` is a no-op)
- `useTimerContext()` returns `{ timer, timerDispatch }` — always destructure this shape
- Each context module exports the raw `Context` object for direct consumers
