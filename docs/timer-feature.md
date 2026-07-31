# Timer feature

> Extracted from `CLAUDE.md` (kept in sync there — this is a readable excerpt, not a separate source of truth). See also [Architecture](./architecture.md) for the overall `client/`/`server/`/`shared/` split.

## `client/features/timer` — the `TimerContext` provider and its hooks

`PomodoroCycle` state (`shared/types/pomodoro-cycle.ts`): `phase` (`FOCUS | SHORT_BREAK | LONG_BREAK`), `status` (`IDLE | RUNNING | PAUSED`), durations in **seconds** (`focusDuration` 25min, `shortBreakDuration` 5min, `longBreakDuration` 15min default), `sessionTimeout` (the deadline), `pausedAt`/`resumedAt`/`resetAt`, `remaining`.

Reducer actions (`timerReducer/timerReducer.ts`): `START_FOCUS`, `START_BREAK`, `START_LONG_BREAK`, `TICK`, `PAUSE`, `RESUME`, `RESET`, `HYDRATE`, `SET_DURATION`, `SET_SHORT_BREAK_DURATION`, `SET_LONG_BREAK_DURATION`. `COMPLETE_SESSION` is also part of the action union but intentionally unhandled (falls through to `default: return state`) — there's an explicit test asserting this, don't "fix" it without checking why. `SET_*` duration actions receive **`{ minutes }`** from the UI; the reducer converts to seconds via the tiny `Duration.fromMinutes(n).seconds` value object (`features/timer/duration.ts`) rather than a bare `* 60`. `calculateRemaining(sessionTimeout: Date)` takes a non-null deadline — callers that don't yet have one (e.g. starting fresh) use the duration directly as `remaining` instead of calling it. `PAUSE`/`RESUME`'s status guards read from a small `REQUIRES_STATUS` table in the reducer rather than inline comparisons.

`TimerContextProvider` composes four intention-revealing hooks (colocated in `features/timer/TimerContext/`), each independently testable:

- `useTickInterval(status, dispatch)` — runs `setInterval` dispatching `TICK` once per second while `status === 'RUNNING'`, clearing it on unmount/status change.
- `useLocalTimerPersistence(timer)` — persists `timer` to localStorage on every change.
- `useCycleRecorder(timer, auth, dispatch)` — POSTs a completed cycle to `/api/cycles` (if signed in) and dispatches `RESET` once `status === 'IDLE' && remaining === 0`.
- `useAccountSync(timer, auth, dispatch)` — the auth-driven sync policy (login-claims-local-session vs login-restores-account-state vs logout-resets); see its doc comment for the full policy. `remaining` is deliberately excluded from its effect deps so a plain per-second `TICK` doesn't trigger a PUT.

A fifth hook, `useCatchReveal`, composes into `TimerContextProvider` alongside these four — see [Pokémon feature](./pokemon-feature.md) for why it lives here rather than in a separate context.

`client/api.ts` is the only place client code calls `fetch()` against `/api/*` — `AuthContext`, `useAuth`, `useCycleRecorder`, and `useAccountSync` all go through it instead of raw `fetch()` calls scattered across files.
